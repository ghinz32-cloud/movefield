import {exFor,isLoadTracked,loadSuggestion,type Item,type State,type SetLog} from './training';
import {completedSetError,startRest,validRest} from './rest-timer';
export function normalizeWorkoutRest(s:State):State{
 const timer=validRest(s.restTimer,s.active?.id);
 return {...s,restTimer:timer&&s.active?.sets.some(x=>x.done&&x.exerciseId+':'+x.set===timer.setKey)?timer:null};
}
export function changeWorkoutSet(s:State,index:number,patch:Partial<SetLog>):State{
 if(!s.active||!s.active.sets[index])throw Error('That set is no longer open.');
 const old=s.active.sets[index],valueChanged='reps'in patch||'kg'in patch;
 const updated={...old,...patch,...(valueChanged?{done:false}:{})};
 if(!Number.isFinite(updated.reps)||updated.reps<0||updated.reps>9999||updated.kg!==null&&(!Number.isFinite(updated.kg)||updated.kg<0||updated.kg>1500))throw Error('Enter a valid amount.');const rirProblem=rirError(updated.rir);if(rirProblem)throw Error(rirProblem);
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
export const RIR_MAX=5;
// Reps in reserve for one set: a whole number from 0 to 5, or empty (not recorded).
export function rirError(rir:number|null|undefined):string|null{return rir===undefined||rir===null||Number.isInteger(rir)&&rir>=0&&rir<=RIR_MAX?null:'Enter RIR as a whole number from 0 to 5.'}
export function setExerciseNotes(s:State,exerciseId:string,notes:string):State{
 if(!s.active)return s;
 const details={...s.active.details};
 const clean=notes.slice(0,1000);
 if(clean==='')delete details[exerciseId];else details[exerciseId]={...details[exerciseId],notes:clean};
 return {...s,active:{...s.active,details}};
}
// Blank sets for a new workout. Load-tracked exercises start at the accepted load suggestion, if one exists.
// Reps stay 0 (empty) until the person enters them, and nothing is logged until they tap Log set.
export function startingSets(s:State,items:Item[]):SetLog[]{
 return items.flatMap(i=>{const ex=exFor(i.exerciseId,s.custom);const suggested=isLoadTracked(ex)?loadSuggestion(s,i).kg:null;const kg=suggested!==null&&suggested>0?suggested:null;return Array.from({length:i.sets},(_,j)=>({exerciseId:i.exerciseId,set:j+1,reps:0,kg,done:false}))});
}
