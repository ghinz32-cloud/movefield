import {exFor,type State,type Session,type Exercise,type Item} from './training';
export type DurationEstimate={low:number;high:number;workMinutes:number;restMinutes:number;version:'duration-v1';assumptions:string[]};
/** A transparent scheduling heuristic. These ranges are not measured sessions. */
export function estimateDuration(session:Session,custom:Exercise[]=[]):DurationEstimate|null{
 if(!session.items.length)return null;
 if(session.kind==='Easy activity'){const work=session.items.reduce((n,i)=>n+i.sets*i.reps,0);return {low:Math.ceil(work),high:Math.ceil(work+5),workMinutes:work,restMinutes:0,version:'duration-v1',assumptions:['Comfortable walking minutes; allow up to five extra minutes for preparation and recording. No running or strength sets are inferred.']};}
 if(session.runSteps?.length){
  const work=session.runSteps.reduce((n,x)=>n+x.seconds,0)/60;
  return {low:Math.ceil(work),high:Math.ceil(work+5),workMinutes:work,restMinutes:0,version:'duration-v1',assumptions:['The listed timed sequence includes its prescribed walking recoveries.','Allow 0–5 extra minutes for setup and recording. Route, pace and distance are not inferred.']};
 }
 let lowWork=0,highWork=0,rest=0,transitions=0,ramp=0;
 for(const i of session.items){
  if([i.sets,i.reps,i.rest,i.repMin??i.reps,i.repMax??i.reps].some(n=>!Number.isFinite(n)||n<0))throw Error('The session has invalid duration inputs.');
  const e=exFor(i.exerciseId,custom),sides=/per side|per leg|each side|both sides|both legs/i.test(e.loadConvention||'')?2:1;
  lowWork+=i.sets*workSeconds(i,e,sides,3,i.repMin??i.reps);highWork+=i.sets*workSeconds(i,e,sides,5,i.repMax??i.reps);
  rest+=Math.max(0,i.sets-1)*i.rest;transitions+=session.timeProfile==='brief'?Math.max(60,i.rest):120;if(e.equipment==='Barbell')ramp+=120;
 }
 const preparation=session.timeProfile==='brief'?360:780;
 const low=Math.ceil((preparation+lowWork+rest+transitions+ramp)/60),high=Math.ceil((preparation*1.25+highWork+rest+transitions*1.25+ramp*1.5)/60);
 return {low,high:Math.max(low,high),workMinutes:highWork/60,restMinutes:rest/60,version:'duration-v1',assumptions:['Repetition work assumes 3–5 seconds per repetition; per-side and per-leg work includes both sides.','Listed between-set rest is retained. Preparation, transitions and barbell ramp-up time are scheduling assumptions.','Unfamiliar setups, extra warm-up sets, task-specific sprint/jump recovery or longer rests can exceed this range. It is not an observed timing measurement.']};
}
function workSeconds(i:Item,e:Exercise,sides:number,secondsPerRep:number,reps:number){return e.metric==='minutes'?i.reps*60:e.metric==='seconds'?i.reps:reps*secondsPerRep*sides}
export function durationText(session:Session,custom:Exercise[]=[]){const estimate=estimateDuration(session,custom);return estimate?`${estimate.low}–${estimate.high} min estimated`:'Add targets for a time estimate'}
export function observedDuration(s:State,sessionId:string){return s.history.filter(w=>w.sessionId===sessionId&&w.finishedAt&&w.finishedAt>=w.startedAt).map(w=>({workoutId:w.id,minutes:(w.finishedAt!-w.startedAt)/60000,partial:!!w.partial,label:'App elapsed time; pauses, background time and clock changes may be included.'}))}
