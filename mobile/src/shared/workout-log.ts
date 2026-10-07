import {exFor,type State,type SetLog} from './training';
import {completedSetError,startRest,validRest} from './rest-timer';
export function normalizeWorkoutRest(s:State):State{
 const timer=validRest(s.restTimer,s.active?.id);
 return {...s,restTimer:timer&&s.active?.sets.some(x=>x.done&&x.exerciseId+':'+x.set===timer.setKey)?timer:null};
}
export function changeWorkoutSet(s:State,index:number,patch:Partial<SetLog>):State{
 if(!s.active||!s.active.sets[index])throw Error('That set is no longer open.');
 const old=s.active.sets[index],valueChanged='reps'in patch||'kg'in patch;
 const updated={...old,...patch,...(valueChanged?{done:false}:{})};
 if(!Number.isFinite(updated.reps)||updated.reps<0||updated.reps>9999||updated.kg!==null&&(!Number.isFinite(updated.kg)||updated.kg<0||updated.kg>1500))throw Error('Enter a valid amount.');
 if(updated.done){const e=completedSetError(updated.reps,updated.kg,exFor(updated.exerciseId,s.custom).metric);if(e)throw Error(e)}
 return normalizeWorkoutRest({...s,active:{...s.active,sets:s.active.sets.map((x,j)=>index===j?updated:x)}});
}
export function logWorkoutSet(s:State,index:number,seconds:number,now=Date.now()):State{
 if(!s.active||!s.active.sets[index])throw Error('That set is no longer open.');
 const old=s.active.sets[index];if(old.done)return s;
 const error=completedSetError(old.reps,old.kg,exFor(old.exerciseId,s.custom).metric);if(error)throw Error(error);
 const next=changeWorkoutSet(s,index,{done:true});
 return {...next,restTimer:next.active!.sets.every(x=>x.done)?null:startRest(s.active.id,old.exerciseId+':'+old.set,seconds,now)};
}
