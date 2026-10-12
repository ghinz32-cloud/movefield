import {changed,day,validDay,addDays,dayDistance,uid,validateProfile,estimateSessionMinutes,type State,type Plan} from './training';
import {readSavedState} from './saved-data';
import {focusScheduleConflict} from './training-focus';
export type ReusablePlanPreview={base:string;sourceId:string;source:string;plan:Plan;prescription:string};
const signature=(s:State)=>JSON.stringify([s.plan?.id,s.plan?.version,s.active?.id,s.events,s.profile]);
export function savePlanCopy(s:State,planId:string,version:number):State{
 if(!s.plan||s.plan.id!==planId||s.plan.version!==version)throw Error('Your plan changed. Review its current version before saving a copy.');
 if(s.saved.length>=100)throw Error('The plan archive is full. Export an old plan before saving another.');
 const copy:Plan={...s.plan,id:uid('saved-block'),sessions:s.plan.sessions.map(x=>({...x,items:x.items.map(i=>({...i}))}))};
 return changed({...s,saved:[copy,...s.saved]},'Saved a reusable copy of the current block. History and the active workout were kept.');
}
export function previewReusablePlan(s:State,sourceId:string,start:string):ReusablePlanPreview{
 if(s.active)throw Error('Finish or discard the active workout before starting another block.');
 if(!validDay(start)||start<day())throw Error('Choose today or a future starting date.');
 const source=s.saved.find(p=>p.id===sourceId);
 if(!source)throw Error('This saved block is unavailable. Reopen your saved plans.');
 if(source.profile.equipment!==s.profile.equipment)throw Error('Your equipment differs from this block. Build a new plan with your current equipment instead.');
 if(source.profile.mode==='app'&&source.profile.experience!==s.profile.experience)throw Error('Your experience setup differs. Review a new plan for your current setup.');
 const first=source.sessions.map(x=>x.date).sort()[0];
 const ids=new Map(source.sessions.map(x=>[x.id,uid('session')]));
 const sessions=source.sessions.map(x=>({...x,id:ids.get(x.id)!,date:addDays(start,dayDistance(first,x.date)),status:'scheduled' as const,needsReview:false,dependsOn:x.dependsOn?.map(id=>{const next=ids.get(id);if(!next)throw Error('This block has an unavailable prerequisite.');return next}),items:x.items.map(i=>({...i,kg:null}))}));
 if(sessions.some(x=>!s.profile.days.includes(new Date(x.date+'T12:00:00').getDay())))throw Error('A workout falls outside your available weekdays. Choose another start date or build a new plan.');
 if(sessions.some(x=>Math.max(x.minutes,x.runSteps?.length?Math.ceil(x.runSteps.reduce((n,r)=>n+r.seconds,0)/60)+5:estimateSessionMinutes(x.items,x.timeProfile==='brief',s.custom))>s.profile.minutes))throw Error('This block exceeds your available session time. Review your availability or choose a shorter block.');
 const profile={...s.profile,goal:source.profile.goal,mode:source.profile.mode,programId:source.profile.programId,weeks:source.profile.weeks,start,days:[...new Set(sessions.map(x=>new Date(x.date+'T12:00:00').getDay()))].sort()};
 const errors=validateProfile(profile);if(errors.length)throw Error(errors.join(' '));
 if(profile.mode==='app'&&(profile.age<18)!==(source.profile.age<18))throw Error('This block belongs to a different age pathway. Build a plan for the current profile.');
 const plan:Plan={...source,id:uid('plan'),version:1,profile,acceptedAt:null,paused:false,sessions,scheduleEnd:sessions.map(x=>x.date).sort().at(-1),notes:[...source.notes.slice(0,98),'Reused as a new block after full schedule review. Original recorded workouts stay in history.','Starting loads are unknown in this new block. Calibrate from relevant recent performance; previous completion is not copied.']};
 if(sessions.some(x=>s.events.some(e=>e.date===x.date)||focusScheduleConflict(plan,s.events,x)))throw Error('This block conflicts with fixed commitments. Review its start date and calendar.');
 readSavedState(JSON.stringify({...s,plan,profile}));
 return {base:signature(s),sourceId,source:JSON.stringify(source),plan,prescription:JSON.stringify(plan)};
}
export function acceptReusablePlan(s:State,preview:ReusablePlanPreview):State{
 if(signature(s)!==preview.base||s.active||JSON.stringify(preview.plan)!==preview.prescription||JSON.stringify(s.saved.find(p=>p.id===preview.sourceId))!==preview.source)throw Error('Your profile, calendar or saved block changed. Review the block again.');
 if(s.plan&&!s.saved.some(p=>p.id===s.plan!.id)&&s.saved.length>=100)throw Error('The plan archive is full. Export an old plan before starting another block.');
 const plan={...preview.plan,acceptedAt:new Date().toISOString()};
 const next=changed({...s,plan,profile:plan.profile,saved:s.plan&&!s.saved.some(p=>p.id===s.plan!.id)?[s.plan,...s.saved]:s.saved,proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},'Started a reviewed reusable block. Previous history and original training dates were kept.');
 readSavedState(JSON.stringify(next));return next;
}
export function setPlanPaused(s:State,id:string,version:number,paused:boolean):State{
 if(!s.plan||s.plan.id!==id||s.plan.version!==version)throw Error('The plan changed. Review it again.');
 if(s.active)throw Error('Finish or discard the active workout before changing plan status.');
 return changed({...s,plan:{...s.plan,paused,version:s.plan.version+1},proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},paused?'Paused future training. Your history was kept.':'Resumed the accepted plan. Your history was kept.');
}
