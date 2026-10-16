import {type State,type Item,exFor,day,changed,estimateSessionMinutes,targetText} from './training';

export type TrackingEdit={planId:string;version:number;sessionId:string;items:Item[];allowLonger:boolean;repeatWeekday?:boolean};
/** The basic editor changes only these fields. Source, load and setup remain owner prescriptions. */
export function reviseTrackingTarget(item:Item,fields:Pick<Item,'sets'|'reps'|'rest'>):Item{
 if(item.setPlan&&(item.sets!==fields.sets||item.rest!==fields.rest))throw Error('This exercise has per-set pairing or rest instructions. Keep its set count and rest, or update the complete prescription in your original plan and import it again.');
 const next={...item,sets:fields.sets,reps:fields.reps,rest:fields.rest};
 if(item.reps!==fields.reps&&(item.repMin!==undefined||item.repMax!==undefined)){
  next.repMin=fields.reps;next.repMax=fields.reps;
 }
 return next;
}
export function trackingTargetError(item:Item,original:Item|undefined,metric:string):string|undefined{
 if(!Number.isInteger(item.sets)||item.sets<1||item.sets>(item.sets===original?.sets?100:20)||!Number.isFinite(item.reps)||item.reps<=0||item.reps>(item.reps===original?.reps?9999:999)||metric==='reps'&&!Number.isInteger(item.reps)||!Number.isFinite(item.rest)||item.rest<0||item.rest>3600)return 'Use 1–20 sets and targets up to 999 reps, seconds or minutes for new or edited targets. Rest can be 0–3,600 seconds. Enter whole numbers for reps.';
}
/** Whole-session edits are user prescriptions. They never provide app progression or alter dates/history. */
export function previewTrackingEdit(s:State,edit:TrackingEdit){
 const errors:string[]=[],warnings:string[]=[],plan=s.plan,session=plan?.sessions.find(x=>x.id===edit.sessionId);
 if(!plan||plan.id!==edit.planId||plan.version!==edit.version)errors.push('The plan changed. Reopen this workout to review its current targets.');
 if(plan?.profile.mode==='app')errors.push('Open Customize to change an app-created workout.');
 if(!session||session.status!=='scheduled'||session.date<day()||s.active?.sessionId===session.id||s.history.some(w=>w.sessionId===session.id&&w.finishedAt))errors.push('Only upcoming, unstarted tracking workouts can be edited.');
 if(s.simulatedOffline)errors.push('Reconnect before changing future targets.');
 if(!edit.items.length||edit.items.length>100)errors.push('Add 1–100 exercises. Empty slots cannot start a workout.');
 if(new Set(edit.items.map(i=>i.exerciseId)).size!==edit.items.length)errors.push('Each exercise can appear once. Edit its set count instead of adding a duplicate.');
 const items=edit.items.map(i=>{
  const original=session?.items.find(x=>x.exerciseId===i.exerciseId);
  if(!original)return {...i};
  try{return reviseTrackingTarget(original,i)}catch(e){errors.push(e instanceof Error?e.message:'Review the complete exercise prescription.');return {...original}}
 });
 for(const i of items){
  const ex=exFor(i.exerciseId,s.custom);
  if(ex.name==='Archived exercise')errors.push('Choose an exercise from your library.');
  const original=session?.items.find(x=>x.exerciseId===i.exerciseId),unchanged=original&&i.sets===original.sets&&i.reps===original.reps&&i.rest===original.rest;
  const targetError=trackingTargetError(i,original,ex.metric);if(targetError)errors.push(targetError);
  if(original&&!unchanged)warnings.push(`${ex.name}: ${original.sets} × ${targetText(original)} → ${i.sets} × ${targetText(i)} ${ex.metric}; rest ${original.rest}s → ${i.rest}s. Existing load, setup and source instructions are kept. Review them with your changed targets.${original.reps!==i.reps&&(original.repMin!==undefined||original.repMax!==undefined)?' The previous range is replaced by this single target.':''}`);
 }
 const removedPairs=new Set(session?.items.filter(i=>!items.some(x=>x.exerciseId===i.exerciseId)).flatMap(i=>i.setPlan?.map(x=>x.pair)||[]));
 if(items.some(i=>i.setPlan?.some(x=>removedPairs.has(x.pair))))errors.push('This removal leaves part of a paired-set prescription. Keep both exercises, remove the whole pair, or update the complete prescription in your original plan and import it again.');
 const unchangedPrescriptions=!!session&&items.length===session.items.length&&items.every(i=>JSON.stringify(i)===JSON.stringify(session.items.find(x=>x.exerciseId===i.exerciseId)));
 const minutes=unchangedPrescriptions?session!.minutes:items.length?estimateSessionMinutes(items,false,s.custom):0;
 if(minutes>1440)errors.push('This session is too long. Reduce the target work.');
 if(plan&&minutes>plan.profile.minutes&&!edit.allowLonger)errors.push(`This work needs about ${minutes} minutes, beyond your ${plan.profile.minutes}-minute window. Review extra time or reduce the work.`);
 const sessions=(plan?.sessions||[]).filter(x=>x.id===edit.sessionId||edit.repeatWeekday&&session&&x.date>=session.date&&x.date>=day()&&x.status==='scheduled'&&x.id!==s.active?.sessionId&&!s.history.some(w=>w.sessionId===x.id&&w.finishedAt)&&new Date(x.date+'T12:00:00').getDay()===new Date(session.date+'T12:00:00').getDay());
 for(const target of sessions)if(target.runSteps?.length){
  const timed=(list:Item[])=>list.filter(i=>exFor(i.exerciseId,s.custom).metric!=='reps').map(i=>[i.exerciseId,i.sets,i.reps,i.rest]);
  if(JSON.stringify(timed(target.items))!==JSON.stringify(timed(items)))errors.push('This workout has timed interval instructions. Keep its timed targets unchanged, or update the complete sequence in your original plan and import it again.');
 }
 if(edit.repeatWeekday&&sessions.length>1)warnings.push(`Copy the complete listed prescriptions to ${sessions.length} workouts, including loads, setups, notes and source instructions. Different existing targets on those dates will be replaced.`);
 return {errors,warnings,items,minutes,sessions};
}
export function applyTrackingEdit(s:State,edit:TrackingEdit):{state:State;error?:string}{
 const p=previewTrackingEdit(s,edit);if(p.errors.length)return {state:s,error:p.errors.join(' ')};
 if(p.sessions.every(x=>JSON.stringify(x.items)===JSON.stringify(p.items)&&x.minutes===p.minutes))return {state:s};
 return {state:changed({...s,plan:{...s.plan!,version:s.plan!.version+1,sessions:s.plan!.sessions.map(x=>p.sessions.some(target=>target.id===x.id)?{...x,items:p.items.map(i=>({...i})),minutes:p.minutes}:x)},proposals:s.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)},`Saved user-entered targets in ${p.sessions.length} reviewed workouts. Dates and recorded work preserved.`)};
}
