/** Rest is a deadline, not a count of interval callbacks. Alerts never log a set. */
export type RestTimer={id:string;workoutId:string;setKey:string;endAt:number|null;pausedSeconds:number|null;alerted:boolean};
export const restSeconds=(timer:RestTimer|null|undefined,now=Date.now())=>timer?.pausedSeconds??(timer?.endAt?Math.max(0,Math.ceil((timer.endAt-now)/1000)):0);
export function startRest(workoutId:string,setKey:string,seconds:number,now=Date.now()):RestTimer|null{
 if(!workoutId||!setKey||!Number.isFinite(seconds)||seconds<=0||seconds>3600)return null;
 return {id:`${now}-${Math.random().toString(36).slice(2,10)}`,workoutId,setKey,endAt:now+seconds*1000,pausedSeconds:null,alerted:false};
}
export function pauseRest(t:RestTimer,now=Date.now()):RestTimer{return {...t,endAt:null,pausedSeconds:restSeconds(t,now)}}
export function resumeRest(t:RestTimer,now=Date.now()):RestTimer{return {...t,endAt:now+restSeconds(t,now)*1000,pausedSeconds:null,alerted:false}}
export function extendRest(t:RestTimer,seconds=30,now=Date.now()):RestTimer{const n=Math.min(3600,restSeconds(t,now)+Math.max(0,seconds));return {...t,endAt:t.pausedSeconds===null?now+n*1000:null,pausedSeconds:t.pausedSeconds===null?null:n,alerted:false}}
export function validRest(t:RestTimer|null|undefined,workoutId:string|undefined,now=Date.now()):RestTimer|null{
 if(!t||t.workoutId!==workoutId||!t.id||!t.setKey||typeof t.alerted!=='boolean')return null;
 if(t.pausedSeconds!==null)return Number.isFinite(t.pausedSeconds)&&t.pausedSeconds>=0&&t.pausedSeconds<=3600&&t.endAt===null?t:null;
 return t.endAt!==null&&Number.isFinite(t.endAt)&&t.endAt<=now+3600000&&t.endAt>=now-86400000?t:null;
}
export function completedSetError(reps:number,kg:number|null,metric:string):string|null{
 if(!Number.isFinite(reps)||reps<=0||reps>9999)return `Enter the ${metric} you did, then tap Log set.`;
 if(metric==='reps'&&!Number.isInteger(reps))return 'Reps must be a whole number.';
 if(kg!==null&&(!Number.isFinite(kg)||kg<0||kg>1500))return 'Enter a valid weight, or leave it blank if unknown.';
 return null;
}
/** Serializes OS requests. A delayed schedule cannot revive a canceled rest. */
export function createRestAlertQueue(adapter:{list:()=>Promise<string[]>;cancel:(id:string)=>Promise<void>;schedule:(t:RestTimer)=>Promise<string>}){
 let revision=0,queue=Promise.resolve();
 return {replace(target:RestTimer|null){const current=++revision;const task=queue.catch(()=>{}).then(async()=>{
  if(current!==revision)return;
  const canceled=await Promise.allSettled((await adapter.list()).map(id=>adapter.cancel(id)));
  const failure=canceled.find(x=>x.status==='rejected');
  if(failure?.status==='rejected')throw failure.reason;
  if(current!==revision||!target?.endAt||target.endAt<=Date.now()||target.alerted)return;
  const id=await adapter.schedule(target);
  if(current!==revision)await adapter.cancel(id);
 });queue=task;return task;}};
}
