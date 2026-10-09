import {focusSetupErrors} from './training-focus';
import {programCatalog,programReferences} from './program-catalog';
import {type Profile,type Plan,type Event,type State,blankProfile,initialState,buildPlan,day,validDay,changed} from './training';

export const setupSteps=['You','Goal','Coaching','Schedule','Equipment','Commitments','Choose a plan','Review'];
export function freshState():State{return {...initialState(),profile:{...blankProfile,name:'',goal:'general',experience:'First time',start:day()},plan:null};}
// Names that come from sample data. A new setup must not inherit them, because the person did not enter them.
export const SAMPLE_NAMES=['Demo athlete','Local demo'];
// A new setup starts from the person's own details. If the name is only sample data, the age saved with it is
// cleared too, so no invented age is left in the form. Age 0 means "not entered yet".
export function setupStartProfile(p:Profile,today:string):Profile{
 const sample=!p.name.trim()||SAMPLE_NAMES.includes(p.name.trim());
 return {...p,start:today,programId:undefined,name:sample?'':p.name,age:sample?0:p.age};
}
export function setupErrors(p:Profile,step:number):string[]{
 if(step===0)return [...(!p.name.trim()?['Enter a name or nickname for this profile.']:[]),...(!p.age?['Enter your age (14–100).']:!Number.isInteger(p.age)||p.age<14||p.age>100?['Ages 14–100 are supported in this prototype.']:[])];
 if(step===2){if(p.age<18&&p.mode==='app'&&p.season==='In-season'&&p.goal==='sport')return ['Choose coach-directed tracking during the school sport season.'];if(p.age<18&&p.mode==='app'&&!p.supervision)return ['Qualified supervision is needed for the youth foundation. Confirm availability or choose tracking.'];if(p.age<18&&p.mode==='app'&&p.goal==='running')return ['The current run/walk program is for adults. Choose coach tracking for youth running.'];}
 if(step===4)return [...focusSetupErrors(p),...(p.dumbbellMaxKg!==undefined&&(!Number.isFinite(p.dumbbellMaxKg)||p.dumbbellMaxKg<0||p.dumbbellMaxKg>500)?['Enter a valid weight for one dumbbell, or leave it blank.']:[])];
 if(step===3)return [...(!validDay(p.start)||p.start<day()?['Choose today or a future start date.']:[]),...(!Number.isInteger(p.weeks)||p.weeks<2||p.weeks>12?['Choose 2–12 weeks.']:[]),...(!Number.isInteger(p.minutes)||p.minutes<15||p.minutes>120?['Choose 15–120 minutes per session.']:[]),...(!p.days.length?['Choose at least one available day.']:[])];
 return [];
}
export type PlanOption={id:string;title:string;description:string;profile:Profile;plan:Plan|null;errors:string[];recommended:boolean;notes?:string[];startHere?:boolean};
// Plain fit notes for one catalogue program against the person's chosen days and session length.
export function fitNotes(id:string,p:Profile):string[]{
 const d=programCatalog.find(x=>x.id===id);
 if(!d)return id==='RUN-WALK'?['Three separated run days, with walk breaks that get shorter over the weeks','Built for a first run; no lifting experience needed']:[];
 const notes=[d.days===p.days.length?`Uses all ${d.days} of your chosen days`:d.days<p.days.length?`Uses ${d.days} of your ${p.days.length} chosen days, which leaves rest days between sessions`:`Needs ${d.days} training days; you chose ${p.days.length}`];
 notes.push(d.minutes<=p.minutes?`Fits your ${p.minutes}-minute session window`:`About ${d.minutes} minutes per session, longer than your ${p.minutes}-minute window`);
 notes.push(d.experience==='all'?'Suitable from your first session':'Assumes some lifting experience');
 return notes;
}
// Higher is a better fit. Days matter most, then session length, then experience. Used to pick the recommended and starting plans.
export function fitScore(id:string,p:Profile):number{
 const d=programCatalog.find(x=>x.id===id);
 if(!d)return id==='RUN-WALK'&&p.experience==='First time'?6:0;
 return (d.days===p.days.length?3:d.days<p.days.length?1:-5)+(d.minutes<=p.minutes?2:-2)+(d.experience==='all'?2:0);
}
export function planOptions(p:Profile,events:Event[]):PlanOption[]{
 const specialized=p.mode==='app'&&programCatalog.some(d=>d.goal===p.goal);
 const variants:Omit<PlanOption,'plan'|'errors'>[]=specialized?programCatalog.filter(d=>d.goal===p.goal).map((d,i)=>({id:d.id,title:d.name,description:d.description,profile:{...p,programId:d.id},recommended:false})):[{id:'matched',title:p.mode==='coach'?'Coach-directed tracking':p.mode==='manual'?'Your own training schedule':'Your goal-based plan',description:p.mode==='app'?'Uses your goal, experience, available days, equipment and session window.':'Scheduled spaces for the exercises and targets you enter. No automatic additions.',profile:{...p,programId:undefined},recommended:true}];
 if(p.mode==='app'&&p.goal==='running')variants.unshift({id:'RUN-WALK',title:'NHS Couch to 5K · run/walk plan',description:'The staged NHS Couch to 5K run/walk sequence on three separated days. Start here if you are new to running.',profile:{...p,programId:undefined},recommended:false});
 if(p.mode==='app'&&p.age<18&&specialized)variants.push({id:'youth-foundation',title:'Supervised youth foundation',description:'General strength practice with qualified supervision, adapted for younger users.',profile:{...p,programId:undefined,goal:'sport'},recommended:false});
 if(p.mode==='app')variants.push({id:'tracking',title:'Write and track my own plan',description:'Keep your available days and enter your own targets. No app-prescribed exercises or progression.',profile:{...p,programId:undefined,mode:'manual'},recommended:false});
 const built=variants.map(v=>({...v,...buildPlan(v.profile,events),recommended:false}));
 // The best-fitting plan for this goal is recommended. For a first-time lifter it is also the starting suggestion.
 const eligible=built.filter(v=>v.plan&&v.profile.mode===p.mode&&v.profile.goal===p.goal);
 const best=eligible.reduce<(typeof eligible)[number]|null>((a,b)=>!a||fitScore(b.id,p)>fitScore(a.id,p)?b:a,null);
 if(best)best.recommended=true;
 if(best&&p.experience==='First time'&&p.mode==='app')best.startHere=true;
 return built.map(v=>({...v,notes:v.plan?fitNotes(v.id,p):undefined})).sort((a,b)=>Number(!!b.plan)-Number(!!a.plan)||Number(b.recommended)-Number(a.recommended));
}
export function acceptSetup(s:State,p:Profile,plan:Plan,events:Event[],expectedEvents=JSON.stringify(s.events)):{state:State;error?:string}{
 if(s.plan&&s.saved.length>=100)return {state:s,error:'This local demo holds 100 archived or saved plans. Export your records before starting another block.'};
 if(expectedEvents!==JSON.stringify(s.events))return {state:s,error:'Your calendar changed while this plan was being prepared. Save and reopen setup to review the current commitments.'};
 if(s.active)return {state:s,error:'Finish or save your current workout before accepting a different plan.'};
 if(s.simulatedOffline)return {state:s,error:'Reconnect before accepting a plan.'};
 const validation=[...setupErrors(p,0),...setupErrors(p,2),...setupErrors(p,3),...setupErrors(p,4),...buildPlan(p,events).errors];
 if(validation.length)return {state:s,error:validation.join(' ')};
 if(JSON.stringify(p)!==JSON.stringify(plan.profile)&&JSON.stringify({...p,programId:plan.profile.programId,days:plan.profile.days})!==JSON.stringify(plan.profile))return {state:s,error:'Your choices changed. Select the plan again before accepting.'};
 if(plan.sessions.some(x=>events.some(e=>e.date===x.date)))return {state:s,error:'A workout conflicts with your current commitments. Select the plan again to see a new draft schedule.'};
 const accepted={...plan,acceptedAt:new Date().toISOString()};
 return {state:changed({...s,profile:{...p},plan:accepted,events,saved:s.plan?[s.plan,...s.saved]:s.saved,proposals:s.proposals.map(q=>q.status==='pending'||q.status==='queued'?{...q,status:'stale'}:q)},'Accepted plan '+accepted.name)};
}

export function referenceOption(p:Profile,events:Event[],id:string):PlanOption{const ref=programReferences.find(x=>x.id===id&&x.goal===p.goal);const profile={...p,programId:id,mode:'manual' as const};return {id,title:ref?.name||'Unknown program',description:'User-entered tracking for the official program. Original workouts are not preloaded.',profile,recommended:false,...buildPlan(profile,events)};}
