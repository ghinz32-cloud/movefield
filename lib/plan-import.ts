import {type State,type Plan,type Profile,addDays,day,dayDistance,exFor,uid,validDay,changed,goals} from './training';
import {readPlanFile,readSavedState} from './saved-data';
export type PlanImport={base:string;plan:Plan;credit:string;sourcePlanId:string;prescription:string};
const signature=(s:State)=>JSON.stringify([s.plan?.id,s.plan?.version,s.active?.id,s.events]);
export function previewPlanImport(state:State,raw:string,options:{credit:string;start:string;mode:'manual'|'coach'}):PlanImport{
 const credit=options.credit.trim();if(!credit||credit.length>200)throw Error('Enter the creator or source credit, up to 200 characters.');
 if(!validDay(options.start)||options.start<day())throw Error('Choose today or a future starting date.');
 if(!['manual','coach'].includes(options.mode))throw Error('Imported prescriptions use your own or coach-directed tracking.');
 if(state.active)throw Error('Finish or discard the active workout before replacing the plan.');
 const source=readPlanFile(raw);if(!source.sessions.length)throw Error('A plan needs a complete schedule.');
 if(!goals.some(([id])=>id===source.profile.goal))throw Error('This plan has an unsupported goal.');
 const first=source.sessions.map(s=>s.date).sort()[0],ids=new Map(source.sessions.map(s=>[s.id,uid('import-session')]));
 if(ids.size!==source.sessions.length)throw Error('Imported sessions have duplicate identities.');
 const sessions=source.sessions.map(session=>{
  if(!session.items.length||session.items.reduce((n,item)=>n+item.sets,0)>1000)throw Error('Every imported workout needs 1–1,000 planned sets.');
  for(const item of session.items)if(exFor(item.exerciseId,state.custom).name==='Archived exercise')throw Error('An imported exercise is unavailable. Import its custom definition first.');
  if(session.minutes>state.profile.minutes)throw Error('An imported workout exceeds your available session time. Review your availability or the source schedule first.');
  if(session.dependsOn?.some(id=>!ids.has(id)))throw Error('The plan contains an unavailable prerequisite.');
  return {...session,id:ids.get(session.id)!,date:addDays(options.start,dayDistance(first,session.date)),status:'scheduled' as const,dependsOn:session.dependsOn?.map(id=>ids.get(id)!),needsReview:false};
 });
 if(sessions.some(s=>!state.profile.days.includes(new Date(s.date+'T12:00:00').getDay())))throw Error('An imported workout falls outside your available weekdays. Review the starting date or availability first.');
 if(new Set(sessions.map(s=>s.date)).size!==sessions.length)throw Error('This importer supports one workout per calendar date. Review overlapping sessions before importing.');
 if(sessions.some(s=>state.events.some(e=>e.date===s.date&&(e.kind==='Day off'||e.kind==='Vacation'))))throw Error('This schedule conflicts with fixed time off. Choose another starting date or review your calendar first.');
 const profile:Profile={...state.profile,goal:source.profile.goal,mode:options.mode,start:options.start,weeks:source.profile.weeks,days:[...source.profile.days],programId:undefined};
 const plan:Plan={...source,id:uid('import-plan'),name:source.name,template:'user-imported-tracking',version:1,acceptedAt:null,profile,sessions,scheduleEnd:sessions.map(s=>s.date).sort().at(-1),paused:false,evidence:[],progression:'Follow the progression instructions from the credited source or your coach. The app records actual work; it does not supply competing progression.',notes:[`Creator/source credit supplied by you: ${credit}`,'Imported prescriptions are unperformed targets. Previous completion statuses, ratings and performance are not imported.','The app has not certified this imported program or its content rights. Review the complete schedule and source instructions before accepting.',...source.notes].slice(0,100)};
 const preview={base:signature(state),plan,credit,sourcePlanId:source.id,prescription:JSON.stringify(plan)};
 readSavedState(JSON.stringify({...state,plan,profile}));return preview;
}
export function acceptPlanImport(state:State,preview:PlanImport):State{
 if(JSON.stringify(preview.plan)!==preview.prescription||!['manual','coach'].includes(preview.plan.profile.mode))throw Error('The imported prescription changed after preview. Review it again.');
 if(signature(state)!==preview.base||state.active)throw Error('Your calendar or current plan changed. Preview the import again.');
 if(state.plan&&!state.saved.some(p=>p.id===state.plan!.id)&&state.saved.length>=100)throw Error('The plan archive is full. Export an old plan before accepting another.');
 const plan={...preview.plan,acceptedAt:new Date().toISOString()},saved=state.plan&&!state.saved.some(p=>p.id===state.plan!.id)?[state.plan,...state.saved]:state.saved;
 const next=changed({...state,plan,profile:plan.profile,saved,proposals:state.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},'Accepted a credited tracking-plan import. Existing history and original workout dates were kept.');
 readSavedState(JSON.stringify(next));return next;
}
