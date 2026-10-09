import {addDays,exFor,isLoadTracked,requiresSetup,type State} from './training';
import {estimatedMax} from './progress';

// Pure training tools. They calculate only from numbers the person entered or has logged.
// They never create a load, a completed set or a test result. Missing input stays "unknown", never zero.

export type LoadUnit='kg'|'lb';
const round=(n:number)=>Math.round(n*1000)/1000;

// Common bar weights, in each unit. Check the bar in your gym before you load it.
export const barWeights:Record<LoadUnit,number[]>={kg:[20,15],lb:[45,35]};
// Standard plates. Gyms with other plates should check the result by hand.
export const plateSets:Record<LoadUnit,number[]>={kg:[25,20,15,10,5,2.5,1.25],lb:[45,35,25,10,5,2.5]};

export type PlateResult=
 | {status:'unknown'}
 | {status:'error';message:string}
 | {status:'ok';unit:LoadUnit;bar:number;target:number;perSide:{weight:number;count:number}[];achieved:number;shortBy:number;exact:boolean};

// Total load on a barbell, including the bar and both sides. Largest plates first, per side.
export function platesForLoad(target:number|null,unit:LoadUnit,bar:number,plates:number[]=plateSets[unit]):PlateResult{
  if(target===null)return {status:'unknown'};
  if(!Number.isFinite(target)||target>1500)return {status:'error',message:`Enter a total load up to 1,500 ${unit}.`};
  if(target<bar)return {status:'error',message:`The bar alone is ${bar} ${unit}. Enter a total at or above that.`};
  let perSide=round((target-bar)/2);
  const perSideList:{weight:number;count:number}[]=[];
  for(const weight of [...plates].sort((a,b)=>b-a)){
    let count=0;
    while(count<40&&perSide+1e-9>=weight){perSide=round(perSide-weight);count++;}
    if(count)perSideList.push({weight,count});
  }
  const shortBy=round(perSide*2);
  return {status:'ok',unit,bar,target,perSide:perSideList,achieved:round(target-shortBy),shortBy,exact:shortBy<=1e-6};
}

export const warmupSteps=[{percent:40,reps:5},{percent:60,reps:3},{percent:75,reps:2},{percent:85,reps:1}] as const;
export type WarmupInput={unit:LoadUnit;kind:'barbell'|'dumbbell';bar:number;adult:boolean;step?:number};
export type WarmupRow={percent:number;reps:number;load:number;barOnly:boolean};
export type WarmupResult=
 | {status:'unknown'}
 | {status:'not-available';message:string}
 | {status:'error';message:string}
 | {status:'ok';unit:LoadUnit;step:number;rows:WarmupRow[]};

// Warm-up loads as a share of the working load, rounded to what can be loaded.
// Barbell loads include the bar, and no set goes below it. Dumbbell loads are per hand.
// Under-18 warm-ups are set by a supervisor, so this tool does not calculate them.
export function warmupLadder(working:number|null,input:WarmupInput):WarmupResult{
  if(!input.adult)return {status:'not-available',message:'For people under 18, your supervisor chooses warm-up loads. Use the warm-up in your plan.'};
  if(working===null)return {status:'unknown'};
  const barbell=input.kind==='barbell';
  if(!Number.isFinite(working)||working<=0||working>1500)return {status:'error',message:`Enter a working load above 0 ${input.unit}.`};
  if(barbell&&working<input.bar)return {status:'error',message:`The working load must be at least the bar weight, ${input.bar} ${input.unit}.`};
  const step=input.step??(barbell?(input.unit==='kg'?2.5:5):(input.unit==='kg'?2:5));
  if(!Number.isFinite(step)||step<=0||step>100)return {status:'error',message:'Enter an available load step above zero and up to 100.'};
  if(barbell&&(!Number.isFinite(input.bar)||input.bar<=0))return {status:'error',message:'Enter the measured bar weight above zero.'};
  const origin=barbell?input.bar:0,min=barbell?input.bar:step;
  const maximum=round(origin+Math.floor((working-origin+1e-9)/step)*step);
  if(maximum<min)return {status:'not-available',message:'Your working load is below this equipment step. Enter a smaller available step, or use the movement warm-up in your plan.'};
  const rows=warmupSteps.map(s=>{
    let load=round(Math.max(min,Math.min(maximum,origin+Math.round((working*s.percent/100-origin)/step)*step)));
    const barOnly=barbell&&load<=input.bar;
    if(barOnly)load=input.bar;
    return {percent:s.percent,reps:s.reps,load,barOnly};
  });
  return {status:'ok',unit:input.unit,step,rows};
}

export type PersonalBest={exerciseId:string;name:string;estimate:number;previous:number;workoutId:string};

// A personal best is a new highest estimate from the same exercise and setup, compared with earlier finished workouts.
// It uses the same rules as progress: adults only, rated sets only. The first estimate is a baseline, not a record.
export function personalBests(s:State,workoutId:string):PersonalBest[]{
  if(s.profile.age<18)return [];
  const w=s.history.find(x=>x.id===workoutId);
  if(!w?.finishedAt)return [];
  const earlier=s.history.filter(x=>x.finishedAt&&x.id!==w.id&&(x.date<w.date||(x.date===w.date&&(x.finishedAt??0)<(w.finishedAt??0))));
  const ids=[...new Set(w.sets.filter(x=>x.done).map(x=>x.exerciseId))];
  const out:PersonalBest[]=[];
  for(const id of ids){
    const ex=exFor(id,s.custom);
    if(ex.metric!=='reps'||!isLoadTracked(ex)||!ex.progressionEnabled)continue;
    const setup=w.loadContext?.[id]?.trim();
    if(requiresSetup(ex)&&!setup)continue;
    const estimate=estimatedMax(w,id);
    if(estimate===null)continue;
    const comparable=earlier.filter(x=>!requiresSetup(ex)||x.loadContext?.[id]?.trim()===setup);
    const previous=comparable.map(x=>estimatedMax(x,id)).filter((n):n is number=>n!==null);
    if(!previous.length)continue;
    const best=Math.max(...previous);
    if(estimate>best)out.push({exerciseId:id,name:ex.name,estimate:round(estimate),previous:round(best),workoutId:w.id});
  }
  return out;
}

export type WeeklyReview={start:string;end:string;paused:boolean;planned:number;completed:number;partial:number;missed:number;setsLogged:number;otherWorkouts:number;streak:number|null};

// The seven days ending today, from the active plan. Counts only; it grades nothing and changes no plan.
// Completed includes partial workouts; partial is shown separately. Today's session is not missed until the day ends.
export function weeklyReview(s:State,today:string):WeeklyReview|null{
  if(!s.plan)return null;
  const start=addDays(today,-6);
  const inWindow=(d:string)=>d>=start&&d<=today;
  const finished=s.history.filter(w=>w.finishedAt);
  const doneIds=new Set(finished.map(w=>w.sessionId));
  const planIds=new Set(s.plan.sessions.map(x=>x.id));
  const planned=s.plan.sessions.filter(x=>inWindow(x.date));
  const logged=finished.filter(w=>inWindow(w.date));
  let streak=0;
  for(const x of [...s.plan.sessions].filter(x=>x.date<=today).sort((a,b)=>b.date.localeCompare(a.date))){
    if(doneIds.has(x.id)){streak++;continue;}
    if(x.date===today)continue;
    break;
  }
  return {
    start,
    end:today,
    paused:s.plan.paused,
    planned:planned.length,
    completed:planned.filter(x=>doneIds.has(x.id)).length,
    partial:logged.filter(w=>w.partial&&planIds.has(w.sessionId)).length,
    missed:s.plan.paused?0:planned.filter(x=>x.date<today&&!doneIds.has(x.id)).length,
    setsLogged:logged.reduce((n,w)=>n+w.sets.filter(x=>x.done).length,0),
    otherWorkouts:logged.filter(w=>!planIds.has(w.sessionId)).length,
    streak:s.plan.paused?null:streak,
  };
}
