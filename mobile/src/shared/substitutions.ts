import {changed,day,exFor,loadSuggestion,requiresSetup,type Exercise,type Item,type State} from './training';

// Curated movement roles. Broad labels such as Push or Arm are not sufficient.
const families:string[][]=[
 ['bench','lib-db-flat-bench-press','lib-plate-chest-press','lib-stack-chest-press','lib-db-floor-press'],
 ['incline-press','lib-bar-incline-bench','lib-plate-incline-chest-press','lib-stack-incline-chest-press'],
 ['bar-squat','squat','lib-plate-hack-squat','lib-stack-hack-squat','lib-plate-leg-press-45','lib-stack-leg-press'],
 ['deadlift','rdl','lib-bar-rdl','lib-kb-double-rdl'],
 ['row','lib-cable-seated-row','band-row'],
 ['leg-curl','lib-stack-seated-leg-curl'],
 ['curl','lib-cable-curl','lib-db-hammer-curl'],
 ['triceps','lib-cable-overhead-triceps','lib-db-overhead-triceps','lib-cable-single-arm-pushdown']
];
export function substitutionOptions(id:string):Exercise[]{
 return [...new Set(families.filter(f=>f.includes(id)).flat())].filter(x=>x!==id).map(x=>exFor(x)).filter(x=>x.name!=='Archived exercise'&&x.metric==='reps');
}
export type Substitution={sessionId:string;from:string;to:string;all:boolean;setup:string;allowLonger:boolean;acknowledgeSpecificity:boolean;planId:string;version:number;historyCount:number};
function replacementItem(item:Item,to:string):Item{
 const isolation=['curl','lib-cable-curl','lib-db-hammer-curl','triceps','lib-cable-overhead-triceps','lib-db-overhead-triceps','lib-cable-single-arm-pushdown','leg-curl','lib-stack-seated-leg-curl'].includes(to);
 const lo=isolation?10:8,hi=isolation?15:12;
 const pair=item.note?.match(/A[12]\. \[Focus\] Assistance superset A:.*$/)?.[0];
 return {exerciseId:to,sets:pair?item.sets:Math.min(item.sets,3),reps:lo,repMin:lo,repMax:hi,rest:pair?item.rest:isolation?90:150,kg:null,note:'Choose a starting weight for this exercise and rep range. Do not carry over the weight from the exercise it replaces.'+(pair?' '+pair:'')};
}
function workSeconds(item:Item){const e=exFor(item.exerciseId);return item.sets*(item.repMax??item.reps)*4*(/per side|each side|both sides/i.test(e.loadConvention||'')?2:1)+Math.max(0,item.sets-1)*item.rest+120;}
export function previewSubstitution(s:State,q:Substitution){
 const errors:string[]=[];const base=s.plan?.sessions.find(x=>x.id===q.sessionId),old=base?.items.find(x=>x.exerciseId===q.from),replacement=exFor(q.to);
 if(!s.plan||s.plan.id!==q.planId||s.plan.version!==q.version||s.history.length!==q.historyCount)errors.push('The plan or history changed. Close and reopen substitutions.');
 if(!base||base.status!=='scheduled'||(base.date<day()&&s.active?.sessionId!==base.id)||!old||s.history.some(w=>w.sessionId===base.id&&w.finishedAt))errors.push('Choose an upcoming exercise that has not been saved as completed.');
 if(!substitutionOptions(q.from).some(x=>x.id===q.to))errors.push('Choose one of the listed substitutes for this movement.');
 if(s.simulatedOffline)errors.push('Reconnect before changing the workout.');
 if(s.hold||s.plan?.paused)errors.push('Resume the plan or review the reported concern before changing exercises. Equipment substitutions are not injury advice.');
 if(s.active&&s.active.sessionId!==q.sessionId)errors.push('Finish the active workout before changing another session.');
 // A weight equal to the suggestion it was started from is not entered work; any other weight is.
 const suggestedKg=(exerciseId:string)=>{const t=s.active?.targets?.find(i=>i.exerciseId===exerciseId);return t?loadSuggestion(s,t).kg:null};
 if(s.active?.sessionId===q.sessionId&&(s.active.sets.some(x=>x.exerciseId===q.from&&(x.done||x.reps>0||x.rir!=null||(x.kg!==null&&x.kg!==suggestedKg(x.exerciseId))||Object.values(x.metrics||{}).some(v=>v!==undefined&&v!==null&&v!=='')))||s.active.rir?.[q.from]!=null||!!s.active.details?.[q.from]?.notes||(!!s.active.loadContext?.[q.from]&&s.active.loadContext[q.from]!==s.loadContext?.[q.from])))errors.push('This exercise already has entered reps, weight, measurements, notes or setup. Keep that record and finish or save a partial workout before changing later sessions.');
 if(q.setup.length>200)errors.push('Keep the setup label within 200 characters.');
 if(requiresSetup(replacement)&&!q.setup.trim())errors.push('Add the machine, attachment and setup so this load has its own baseline.');
 const specificity=s.plan?.profile.goal==='powerlifting'&&['bar-squat','bench','deadlift'].includes(q.from);
 if(specificity&&!q.acknowledgeSpecificity)errors.push('Confirm that this substitute replaces competition-lift practice. It is not an equivalent squat, bench or deadlift result.');
 const title=base?.roleId||base?.title.replace(' · review week','');
 const sessions=(s.plan?.sessions||[]).filter(x=>x.status==='scheduled'&&x.date>=(base?.date||day())&&(q.all?(x.roleId||x.title.replace(' · review week',''))===title:x.id===q.sessionId)&&x.items.some(i=>i.exerciseId===q.from));
 if(sessions.some(x=>x.items.some(i=>i.exerciseId===q.to)))errors.push('This substitute is already in one of these workouts. Choose another to keep each exercise log separate.');
 const changes=sessions.map(x=>{const old=x.items.find(i=>i.exerciseId===q.from)!,item=replacementItem(old,q.to);return {sessionId:x.id,date:x.date,item,before:x.minutes,after:Math.max(1,x.minutes+Math.ceil((workSeconds(item)-workSeconds(old))/60))};});
 const max=Math.max(0,...changes.map(x=>x.after));
 if(max>1440)errors.push('This change exceeds the supported session length.');
 if(changes.some(x=>x.after>Math.max(x.before,s.plan?.profile.minutes||0))&&!q.allowLonger)errors.push(`Review and allow the extra time. The longest affected session is ${max} minutes.`);
 const warnings=[...(old?.note?.includes('Assistance superset A:')?['This stays in its A1/A2 superset. The number of sets and rest after the pair are kept.']:[]),...(specificity?['Competition-lift practice is being replaced. This variation keeps a separate history and does not count as a competition lift.']:[]),...(['deadlift','lib-db-floor-press','band-row'].includes(q.from)||['rdl','lib-bar-rdl','lib-kb-double-rdl','lib-db-floor-press','band-row'].includes(q.to)?['Range of motion, resistance or emphasis may differ. This is a practical alternative, not an identical exercise.']:[]),...(s.plan?.profile.mode==='coach'?['This changes your tracking copy. Check the substitute with your coach.']:[]),'Your dates and completed workouts stay the same. Find a suitable starting weight for the replacement exercise; weights from the previous exercise are kept separate.'];
 return {errors,changes,max,old,replacement,specificity,warnings};
}
export function applySubstitution(s:State,q:Substitution):{state:State;error?:string}{
 const preview=previewSubstitution(s,q);if(preview.errors.length)return {state:s,error:preview.errors.join(' ')};
 const sessions=s.plan!.sessions.map(x=>{const c=preview.changes.find(c=>c.sessionId===x.id);return c?{...x,minutes:c.after,items:x.items.map(i=>i.exerciseId===q.from?c.item:i)}:x;});
 let active=s.active;
 if(active?.sessionId===q.sessionId){
  const c=preview.changes.find(c=>c.sessionId===q.sessionId)!;
  const targets=(active.targets||s.plan!.sessions.find(x=>x.id===q.sessionId)!.items).map(i=>i.exerciseId===q.from?c.item:i);
  const loadContext={...active.loadContext};delete loadContext[q.from];delete loadContext[q.to];if(requiresSetup(preview.replacement))loadContext[q.to]=q.setup.trim();
  const rir={...active.rir};delete rir[q.from];delete rir[q.to];
  const details={...active.details};delete details[q.from];delete details[q.to];
  active={...active,targets,sets:targets.flatMap(i=>i.exerciseId===q.to?Array.from({length:i.sets},(_,n)=>({exerciseId:q.to,set:n+1,reps:0,kg:null,done:false})):active!.sets.filter(x=>x.exerciseId===i.exerciseId)),loadContext,rir,details};
 }
 return {state:changed({...s,active,plan:{...s.plan!,sessions,version:s.plan!.version+1},loadContext:requiresSetup(preview.replacement)?{...s.loadContext,[q.to]:q.setup.trim()}:s.loadContext,proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale'}:p)},`Replaced ${exFor(q.from).name} with ${preview.replacement.name} in ${preview.changes.length} workout(s); load reset and separate history retained.`)};
}
