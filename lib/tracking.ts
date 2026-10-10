import {type State,type Item,exFor,day,changed,estimateSessionMinutes} from './training';
import {userTargetError} from './customize';

export type TrackingEdit={planId:string;version:number;sessionId:string;items:Item[];allowLonger:boolean;repeatWeekday?:boolean};
/** Whole-session edits are user prescriptions. They never provide app progression or alter dates/history. */
export function previewTrackingEdit(s:State,edit:TrackingEdit){
 const errors:string[]=[],plan=s.plan,session=plan?.sessions.find(x=>x.id===edit.sessionId);
 if(!plan||plan.id!==edit.planId||plan.version!==edit.version)errors.push('The plan changed. Reopen this workout to review its current targets.');
 if(plan?.profile.mode==='app')errors.push('Open Customize to change an app-created workout.');
 if(!session||session.status!=='scheduled'||session.date<day()||s.active?.sessionId===session.id||s.history.some(w=>w.sessionId===session.id&&w.finishedAt))errors.push('Only upcoming, unstarted tracking workouts can be edited.');
 if(s.simulatedOffline)errors.push('Reconnect before changing future targets.');
 if(!edit.items.length||edit.items.length>100)errors.push('Add 1–100 exercises. Empty slots cannot start a workout.');
 if(new Set(edit.items.map(i=>i.exerciseId)).size!==edit.items.length)errors.push('Each exercise can appear once. Edit its set count instead of adding a duplicate.');
 for(const i of edit.items){
  const ex=exFor(i.exerciseId,s.custom);
  if(ex.name==='Archived exercise')errors.push('Choose an exercise from your library.');
  const problem=userTargetError(i,ex.metric,'tracking');if(problem)errors.push(problem);
 }
 const source=plan?.profile.programId?.startsWith('ref-');
 const items:Item[]=edit.items.map(i=>{const prior=session?.items.find(x=>x.exerciseId===i.exerciseId);return {exerciseId:i.exerciseId,sets:i.sets,reps:i.reps,rest:i.rest,kg:null,...(exFor(i.exerciseId,s.custom).metric==='reps'&&i.repMin!==undefined&&i.repMax!==undefined?{repMin:i.repMin,repMax:i.repMax}:{}),...(source?{note:i.note===prior?.note?i.note:undefined,loadRole:prior?.loadRole}:{})};});
 const minutes=items.length?estimateSessionMinutes(items,false,s.custom):0;
 if(minutes>1440)errors.push('This session is too long. Reduce the target work.');
 if(plan&&minutes>plan.profile.minutes&&!edit.allowLonger)errors.push(`This work needs about ${minutes} minutes, beyond your ${plan.profile.minutes}-minute window. Review extra time or reduce the work.`);
 const sessions=(plan?.sessions||[]).filter(x=>x.id===edit.sessionId||edit.repeatWeekday&&session&&x.date>=session.date&&x.date>=day()&&x.status==='scheduled'&&x.id!==s.active?.sessionId&&!s.history.some(w=>w.sessionId===x.id&&w.finishedAt)&&(plan?.profile.programId?.startsWith('ref-')&&session.roleId?x.roleId===session.roleId:new Date(x.date+'T12:00:00').getDay()===new Date(session.date+'T12:00:00').getDay()));
 return {errors,items,minutes,sessions};
}
export function applyTrackingEdit(s:State,edit:TrackingEdit):{state:State;error?:string}{
 const p=previewTrackingEdit(s,edit);if(p.errors.length)return {state:s,error:p.errors.join(' ')};
 return {state:changed({...s,plan:{...s.plan!,version:s.plan!.version+1,notes:s.plan!.profile.programId?.startsWith('ref-')?[...s.plan!.notes.filter(n=>!n.startsWith('User-edited source template:')),'User-edited source template: future targets include your changes. Consult the linked original for the published routine.']:s.plan!.notes,sessions:s.plan!.sessions.map(x=>p.sessions.some(target=>target.id===x.id)?{...x,items:p.items.map(i=>({...i})),minutes:p.minutes}:x)},proposals:s.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)},`Saved user-entered targets in ${p.sessions.length} reviewed workouts. Dates and recorded work preserved.`)};
}
