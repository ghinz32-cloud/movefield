import {parseGroundedReviewReply,type FitnessReference} from './fitness-grounding';
import {qwenRequest,qwenCompletionPrompt,qwenPromptFits,QWEN_OUTPUT_TOKENS,type QwenWorkerPort,type QwenWorkerReply} from './qwen-runtime-contract';
import type {ReviewContext} from './workout-review';

export type QwenRuntimeState={phase:'idle'|'loading'|'running'|'ready'|'error';progress:number;message:string;notes:FitnessReference[];metrics?:{promptTokens:number;outputTokens:number;generationMs:number;loadMs:number}};
export function qwenRuntimeSupport(){
 if(!isSecureContext)return 'Qwen needs a secure browser connection. The sample interface is available here, but this preview cannot run the model.';
 if(!('gpu' in navigator))return 'This browser does not offer WebGPU. Use a supported browser to run Qwen; training and tracking remain available.';
 if(typeof Worker==='undefined')return 'This browser cannot run the background model worker.';
 if(!navigator.locks||!globalThis.indexedDB)return 'This browser cannot safely open the local model files. Use a current browser with IndexedDB and Web Locks.';
 return '';
}
// Only explicit calls run inference; this controller never downloads assets or
// qualifies a device. Off, close, timeout and errors terminate the worker.
export function createQwenRuntime(makeWorker:()=>QwenWorkerPort,current:()=>ReviewContext|null){
 let state:QwenRuntimeState={phase:'idle',progress:0,message:'',notes:[]},worker:QwenWorkerPort|null=null,serial=0,disposed=false;
 let pending:((v:QwenWorkerReply)=>void)|null=null,timer:ReturnType<typeof setTimeout>|null=null;
 const listeners=new Set<()=>void>(),publish=(patch:Partial<QwenRuntimeState>)=>{if(disposed)return;state={...state,...patch};listeners.forEach(f=>f());};
 function stop(message='Qwen stopped. Your workout targets are unchanged.'){
  serial++;worker?.terminate();worker=null;if(timer)clearTimeout(timer);timer=null;
  const resolve=pending;pending=null;resolve?.({id:'cancelled',kind:'error',message});publish({phase:'idle',progress:0,message,notes:[],metrics:undefined});
 }
 function call(kind:'load'|'generate',id:string,prompt?:string){
  return new Promise<QwenWorkerReply>(resolve=>{
   const port=worker!,callSerial=serial;pending=resolve;timer=setTimeout(()=>stop('Qwen took too long and was stopped. Retry when the device has available memory.'),kind==='load'?120000:30000);
   worker!.onmessage=event=>{const v=event.data;if(worker!==port||serial!==callSerial||v?.id!==id)return;if(v.kind==='progress'){if(kind==='load'&&Number.isFinite(v.progress))publish({progress:Math.max(0,Math.min(1,v.progress!))});return;}if(v.kind!=='error'&&v.kind!==(kind==='load'?'ready':'result'))return;if(timer)clearTimeout(timer);timer=null;pending=null;resolve(v);};
   worker!.onerror=()=>{if(worker!==port||serial!==callSerial)return;if(timer)clearTimeout(timer);timer=null;pending=null;resolve({id,kind:'error',message:'The model worker could not open. Reload the app and retry.'});};
   worker!.postMessage({kind,id,...(prompt?{prompt}:{})});
  });
 }
 async function run(query:string){
  if(disposed||['loading','running'].includes(state.phase))return;
  const context=current(),id=`qwen_${Date.now()}_${++serial}`,request=context&&qwenRequest(context,query,id);
  if(!context||!request){publish({phase:'error',message:'No reviewed sources fit this completed sample.',notes:[],metrics:undefined});return;}
  const attempt=serial;publish({phase:'loading',message:'Opening the verified model…',notes:[],metrics:undefined,progress:0});
  try{
   if(!worker)worker=makeWorker();
   const loaded=await call('load',id);if(attempt!==serial)return;if(loaded.kind!=='ready')throw Error(loaded.message);
   const beforeRun=current();if(!beforeRun||JSON.stringify(beforeRun)!==request.contextSignature)throw Error('The sample changed before Qwen could run. Please retry.');
   publish({phase:'running',message:'Selecting reviewed sources…',progress:1});
   const reply=await call('generate',id,qwenCompletionPrompt(request));if(attempt!==serial)return;
   if(reply.kind!=='result'||typeof reply.reply!=='string')throw Error(reply.message);
   const fresh=current(),notes=fresh&&parseGroundedReviewReply(fresh,request,reply.reply);
   if(!notes||!qwenPromptFits(reply.promptTokens!)||!Number.isSafeInteger(reply.outputTokens)||reply.outputTokens!<0||reply.outputTokens!>QWEN_OUTPUT_TOKENS||!Number.isFinite(reply.generationMs)||reply.generationMs!<0||!Number.isFinite(loaded.loadMs)||loaded.loadMs!<0)throw Error('Qwen returned a result outside the source-selection rules. No model text was used.');
   publish({phase:'ready',notes,message:notes.length?'Reviewed sources selected.':'No relevant source was selected.',metrics:{promptTokens:reply.promptTokens!,outputTokens:reply.outputTokens!,generationMs:reply.generationMs!,loadMs:loaded.loadMs||0}});
  }catch(error){if(attempt!==serial)return;if(timer)clearTimeout(timer);timer=null;pending=null;worker?.terminate();worker=null;publish({phase:'error',notes:[],metrics:undefined,message:error instanceof Error&&error.message?error.message:'Qwen could not run. Check model files and retry.'});}
 }
 return {getSnapshot:()=>state,subscribe:(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f);};},run,stop,dispose:()=>{stop('');disposed=true;listeners.clear();}};
}
