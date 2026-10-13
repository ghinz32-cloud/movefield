import {COACHING_POLICY,parseWorkoutCoachingReply,serializeWorkoutCoaching,workoutCoachingContextSchema,
  type WorkoutCoachingContext,type WorkoutCoachingReply} from './workout-coaching';
import {workoutCoachingModel,type WorkoutCoachingModelId} from './workout-coaching-models';
import {WORKOUT_COACHING_LOAD_MS,WORKOUT_COACHING_GENERATE_MS,workoutCoachingMetricsValid,
  type WorkoutCoachingRuntimeMetrics,type WorkoutCoachingWorkerPort,type WorkoutCoachingWorkerReply} from './workout-coaching-runtime-contract';
import {workoutCoachingWorkerSecurity,workoutCoachingWorkerSupport} from './workout-coaching-worker-security';

export type WorkoutCoachingRuntimeState={phase:'idle'|'loading'|'running'|'ready'|'error';progress:number;message:string;
  result?:WorkoutCoachingReply;contextDigest?:string;modelId?:string;metrics?:WorkoutCoachingRuntimeMetrics};
export function workoutCoachingRuntimeSupport():string {
  if(typeof isSecureContext==='undefined'||!isSecureContext)return 'Local coaching requires a secure browser connection.';
  if(typeof navigator==='undefined'||!('gpu' in navigator))return 'Local coaching needs a WebGPU desktop browser. Your records and normal workout review remain available.';
  if(typeof Worker==='undefined'||!navigator.locks||!globalThis.indexedDB)return 'This browser cannot safely open the background model and verified local files.';
  return workoutCoachingWorkerSupport();
}
const errors:Record<string,string>={
  unsupported:'This device could not load the experimental model. Try a suitable WebGPU desktop; normal review remains available.',
  'not-downloaded':'Download and check this exact model in Settings before requesting local coaching.',
  integrity:'The downloaded model failed its file checks. Delete its files and download them again.',
  busy:'Another tab is using these model files. Finish that task and retry.',
  context:'This coaching selection exceeds the model’s token budget. Use the normal review or a smaller recorded selection.',
  contract:'The coaching context or model result failed validation. No model output was saved.',
  runtime:'The experimental model could not complete this review. Check available GPU memory and model files, then retry.',
};

// No download, automatic generation, training mutation or persistence occurs
// here. The caller durably saves a validated result before displaying it.
export function createWorkoutCoachingRuntime(options:{makeWorker:()=>WorkoutCoachingWorkerPort;
  current:()=>{context:WorkoutCoachingContext;digest:string}|null;model:()=>string|null;verifyWorker?:()=>Promise<string>}) {
  let state:WorkoutCoachingRuntimeState={phase:'idle',progress:0,message:''},serial=0,disposed=false;
  let worker:WorkoutCoachingWorkerPort|null=null,timer:ReturnType<typeof setTimeout>|null=null;
  let settle:((value:WorkoutCoachingWorkerReply|null)=>void)|null=null;
  const listeners=new Set<()=>void>();
  const publish=(patch:Partial<WorkoutCoachingRuntimeState>)=>{if(disposed)return;state={...state,...patch};for(const listener of listeners)listener();};
  function release(value:WorkoutCoachingWorkerReply|null){
    if(timer)clearTimeout(timer);timer=null;
    worker?.terminate();worker=null;
    const resolve=settle;settle=null;resolve?.(value);
  }
  function stop(reason='Local coaching stopped.'){
    serial++;release(null);publish({phase:'idle',progress:0,message:reason,result:undefined,metrics:undefined,contextDigest:undefined,modelId:undefined});
  }
  async function run(context:WorkoutCoachingContext,digest:string):Promise<void>{
    if(disposed||state.phase==='loading'||state.phase==='running')return;
    const parsed=workoutCoachingContextSchema.safeParse(context),model=workoutCoachingModel(options.model());
    if(!parsed.success||!/^[0-9a-f]{64}$/.test(digest)||!model){publish({phase:'error',progress:0,message:'Choose an available experimental Qwen3.5 model and a current eligible record first.',result:undefined,metrics:undefined});return;}
    const safe=parsed.data,signature=serializeWorkoutCoaching(safe),attempt=++serial,id=`coach_${Date.now()}_${attempt}`;
    const current=()=>{try{const fresh=options.current();return options.model()===model.id&&!!fresh&&fresh.digest===digest&&serializeWorkoutCoaching(fresh.context)===signature;}catch{return false;}};
    if(!current()){publish({phase:'error',progress:0,message:'This coaching context changed. Review the current record and try again.',result:undefined,metrics:undefined});return;}
    publish({phase:'loading',progress:0,message:'Opening the verified local model…',result:undefined,metrics:undefined,contextDigest:digest,modelId:model.id});
    try{
      const security=await (options.verifyWorker??workoutCoachingWorkerSecurity)();
      if(attempt!==serial)return;
      if(security){publish({phase:'error',progress:0,message:security,result:undefined,metrics:undefined});return;}
      if(!current()){publish({phase:'error',progress:0,message:'This coaching context changed. Request a fresh review.',result:undefined,metrics:undefined});return;}
      const response=await new Promise<WorkoutCoachingWorkerReply|null>((resolve,reject)=>{
        settle=resolve;
        const arm=(ms:number)=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>{if(attempt!==serial)return;release(null);publish({phase:'error',progress:0,message:'The local model took too long and was stopped. Retry when this device has more available memory.',result:undefined,metrics:undefined});},ms);};
        try{
          const port=worker=options.makeWorker();arm(WORKOUT_COACHING_LOAD_MS);
          port.onmessage=event=>{
            const v=event.data;
            if(worker!==port||attempt!==serial||!v||v.policy!==COACHING_POLICY||v.id!==id||v.modelId!==model.id||v.contextDigest!==digest)return;
            if(!current()){release(null);publish({phase:'error',progress:0,message:'The profile, record or selected model changed. Request a fresh review.',result:undefined,metrics:undefined});return;}
            if(v.kind==='progress'){
              if(v.phase==='running'&&state.phase==='loading'){arm(WORKOUT_COACHING_GENERATE_MS);publish({phase:'running',progress:1,message:'Selecting personalized observations and review choices…'});}
              else if(v.phase==='loading'&&state.phase==='loading'&&Number.isFinite(v.progress))publish({progress:Math.max(0,Math.min(1,v.progress!))});
              return;
            }
            if(v.kind==='result'||v.kind==='error')release(v);
          };
          port.onerror=()=>{if(worker===port&&attempt===serial)release({policy:COACHING_POLICY,id,modelId:model.id,contextDigest:digest,kind:'error',code:'runtime'});};
          port.postMessage({policy:COACHING_POLICY,kind:'run',id,modelId:model.id as WorkoutCoachingModelId,contextDigest:digest,context:safe});
        }catch(error){settle=null;release(null);reject(error);}
      });
      if(attempt!==serial||!response)return;
      if(response.kind!=='result')throw Error(errors[response.code??'']??errors.runtime);
      if(!current())throw Error('The record changed before local coaching completed. Request a fresh review.');
      const result=parseWorkoutCoachingReply(safe,digest,response.reply);
      if(!result||!workoutCoachingMetricsValid(response.metrics,model))throw Error(errors.contract);
      publish({phase:'ready',progress:1,message:'Local model selection validated. Save it before displaying this review.',result,metrics:response.metrics});
    }catch(error){
      if(attempt!==serial)return;release(null);
      publish({phase:'error',progress:0,message:error instanceof Error&&Object.values(errors).includes(error.message)?error.message:errors.runtime,result:undefined,metrics:undefined});
    }
  }
  return {getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);}},
    run,stop,dispose:()=>{stop('');disposed=true;listeners.clear();}};
}
