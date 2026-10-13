import {type State,type Exercise,type Item,exFor,estimateSessionMinutes,requiresSetup,changed,day} from './training';
export const USER_TARGET_LIMITS={app:{sets:8,target:300,rest:600},tracking:{sets:20,target:999,rest:3600}} as const;
export function userTargetError(item:Pick<Item,'sets'|'reps'|'repMin'|'repMax'|'rest'>,metric:Exercise['metric'],scope:keyof typeof USER_TARGET_LIMITS):string|null{
 const limits=USER_TARGET_LIMITS[scope],lo=item.repMin??item.reps,hi=item.repMax??item.reps;
 if(!Number.isInteger(item.sets)||item.sets<1||item.sets>limits.sets||!Number.isFinite(item.reps)||item.reps<=0||item.reps>limits.target||!Number.isFinite(lo)||!Number.isFinite(hi)||lo<=0||hi<lo||hi>limits.target||item.reps<lo||item.reps>hi||!Number.isFinite(item.rest)||item.rest<0||item.rest>limits.rest)return `Use 1–${limits.sets} sets, a positive target range up to ${limits.target}, and 0–${limits.rest} seconds rest.`;
 if(metric==='reps'&&(!Number.isInteger(item.reps)||!Number.isInteger(lo)||!Number.isInteger(hi)))return 'Repetition targets must be whole numbers.';
 if((item.repMin===undefined)!==(item.repMax===undefined)||metric!=='reps'&&(item.repMin!==undefined||item.repMax!==undefined))return 'Use both ends of a repetition range, or a single time target.';
 return null;
}
export type Addition={sessionId:string;exercise:Exercise;sets:number;lo:number;hi:number;rest:number;all:boolean;setup:string;allowLonger:boolean;planId:string;version:number};
export function previewAddition(s:State,a:Addition){
 const errors:string[]=[];const base=s.plan?.sessions.find(x=>x.id===a.sessionId);
 if(!s.plan||s.plan.id!==a.planId||s.plan.version!==a.version)errors.push('The plan changed. Close and reopen customization to review the current version.');
 if(!base||base.status!=='scheduled'||base.date<day()||s.active?.sessionId===base.id)errors.push('Choose an upcoming, unstarted workout.');
 if(s.simulatedOffline)errors.push('Reconnect before changing the plan.');
 const targetError=userTargetError({sets:a.sets,reps:a.lo,...(a.exercise.metric==='reps'?{repMin:a.lo,repMax:a.hi}:{}),rest:a.rest},a.exercise.metric,'app');if(targetError)errors.push(targetError);
 if(a.exercise.metric!=='reps'&&a.hi!==a.lo)errors.push('Use a single target for timed work.');
 if(requiresSetup(a.exercise)&&a.exercise.loadTracked&&!a.setup.trim())errors.push('Add a machine and setup label so loads remain comparable.');
 if(a.setup.length>200)errors.push('Keep the machine and setup label within 200 characters.');
 const title=base?.roleId||base?.title.replace(' · review week','');
 const sessions=(s.plan?.sessions||[]).filter(x=>x.status==='scheduled'&&x.date>=(base?.date||day())&&x.id!==s.active?.sessionId&&(a.all?(x.roleId||x.title.replace(' · review week',''))===title:x.id===a.sessionId));
 if(sessions.some(x=>x.items.some(i=>i.exerciseId===a.exercise.id)))errors.push('This exact exercise is already in one of these workouts. Choose a different variation; duplicate entries would merge its set log.');
 const changes=sessions.map(x=>{
  const sets=x.title.endsWith(' · review week')?Math.max(1,Math.ceil(a.sets/2)):a.sets;
  const item:Item={exerciseId:a.exercise.id,sets,reps:a.exercise.metric==='reps'?a.lo:a.hi,...(a.exercise.metric==='reps'?{repMin:a.lo,repMax:a.hi}:{}),rest:a.rest,kg:null,note:'You added this exercise. Weight suggestions use its own workout history and weight-entry rules.'};
  return{sessionId:x.id,before:x.minutes,after:x.minutes+estimateSessionMinutes([...x.items,item],x.timeProfile==='brief',[...s.custom,a.exercise])-estimateSessionMinutes(x.items,x.timeProfile==='brief',s.custom),item};
 });
 if(changes.some(c=>!Number.isFinite(c.after)||c.after>1440))errors.push('A session cannot exceed 1,440 minutes. Reduce the sets or task duration.');
 if(sessions.some(x=>x.items.length>=100))errors.push('This demo supports up to 100 exercises in one workout.');
 const max=Math.max(0,...changes.map(c=>c.after));
 if(max>(s.plan?.profile.minutes||0)&&!a.allowLonger)errors.push(`These workouts need up to ${max} minutes, beyond your ${s.plan?.profile.minutes}-minute window. Accept the extra time or reduce the work.`);
 return{errors,changes,max};
}
export function applyAddition(s:State,a:Addition):{state:State;error?:string}{
 const preview=previewAddition(s,a);if(preview.errors.length)return{state:s,error:preview.errors.join(' ')};
 const exists=exFor(a.exercise.id,s.custom).name!=='Archived exercise';
 return{state:changed({...s,custom:exists?s.custom:[...s.custom,a.exercise],loadContext:requiresSetup(a.exercise)?{...s.loadContext,[a.exercise.id]:a.setup.trim()}:s.loadContext,plan:{...s.plan!,version:s.plan!.version+1,sessions:s.plan!.sessions.map(x=>{const c=preview.changes.find(c=>c.sessionId===x.id);return c?{...x,minutes:c.after,items:[...x.items,c.item]}:x})},proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale'}:p)},`Added ${a.exercise.name} to ${preview.changes.length} upcoming workout(s). Extra time explicitly reviewed.`)};
}
