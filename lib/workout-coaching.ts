import {day,dayDistance,eligibility,exFor,isLoadTracked,requiresSetup,validDay,type Item,type Plan,type Session,type SetLog,type State,type Workout} from './training';
import {beforeHistoryFrames,beforeNewFrames,afterFrames,coachingSuggestions,coachingEncouragement,coachingReviewEncouragement} from './workout-coaching-library';
export {COACHING_LIBRARY_STATS} from './workout-coaching-library';
export const COACHING_POLICY='workout-coaching-v1' as const;
export type CoachingOptions={brand?:'movefield'|'grizzly';sample?:boolean;today?:string;now?:number};
export type CoachingMessage={id:string;text:string;kind:'fact'|'suggestion'|'encouragement';required:boolean};
export type CoachingSummary={key:string;contextVersion:string;policy:typeof COACHING_POLICY;phase:'before'|'after';title:string;tone:'neutral'|'encouraging'|'review';messages:CoachingMessage[];details:string[];comparison?:{workoutId:string;date:string;matchedExercises:number};facts:{completedSets:number;targetSets:number|null;knownLoadSets:number;unknownLoadSets:number};policyIds:string[];aiEligible:boolean};
type Policy=keyof typeof coachingSuggestions;
type Facts=CoachingSummary['facts'];
const signature=(value:unknown)=>JSON.stringify(value);
/** Local stale-context token, not a cryptographic authorization primitive. */
function hash(text:string):string {let a=2166136261,b=5381;for(let n=0;n<text.length;n++){const c=text.charCodeAt(n);a=Math.imul(a^c,16777619);b=Math.imul(b,33)^c;}const mix=(n:number)=>{n^=n>>>16;n=Math.imul(n,0x85ebca6b);n^=n>>>13;n=Math.imul(n,0xc2b2ae35);return (n^(n>>>16))>>>0;};return mix(a).toString(16).padStart(8,'0')+mix(b).toString(16).padStart(8,'0');}
const pick=<T>(list:readonly T[],seed:string):{value:T;index:number}=>{const index=parseInt(hash(seed).slice(0,8),16)%list.length;return {value:list[index],index};};
function ownerOf(s:State,sessionId:string):Plan|undefined{return [s.plan,...s.saved].find((p):p is Plan=>!!p?.sessions.some(x=>x.id===sessionId));}
const targetKey=(i:Item)=>[i.exerciseId,i.sets,i.repMin??i.reps,i.repMax??i.reps,i.rest,i.loadRole??null,i.sourceRule??null,i.supersetGroup??null,i.supersetPosition??null,i.setPlan??null];
function targetsKnown(items:Item[]|undefined):items is Item[]{return !!items?.length&&new Set(items.map(i=>i.exerciseId)).size===items.length&&items.every(i=>Number.isInteger(i.sets)&&i.sets>0&&i.sets<=100&&Number.isFinite(i.reps)&&i.reps>=0);}
function doneRows(w:Workout):SetLog[]{const seen=new Set<string>();return w.sets.filter(i=>{const key=i.exerciseId+'/'+i.set;if(!i.done||!Number.isInteger(i.set)||i.set<1||!Number.isFinite(i.reps)||i.reps<=0||seen.has(key))return false;seen.add(key);return true;});}
function factsFor(s:State,w:Workout|undefined,targets?:Item[]):Facts {
 const rows=w?doneRows(w):[],loaded=rows.filter(i=>isLoadTracked(exFor(i.exerciseId,s.custom))),known=loaded.filter(i=>typeof i.kg==='number'&&Number.isFinite(i.kg)&&i.kg>=0);
 return {completedSets:rows.length,targetSets:targetsKnown(targets)?targets.reduce((n,i)=>n+i.sets,0):null,knownLoadSets:known.length,unknownLoadSets:loaded.length-known.length};
}
function coverage(w:Workout):{known:boolean;missing:number;extra:number;ambiguous:boolean} {
 const rows=doneRows(w),ambiguous=rows.length!==w.sets.filter(x=>x.done).length;
 if(!targetsKnown(w.targets))return {known:false,missing:0,extra:rows.length,ambiguous};
 const expected=w.targets.flatMap(t=>Array.from({length:t.sets},(_,n)=>t.exerciseId+'/'+(n+1)));
 const done=rows.map(i=>i.exerciseId+'/'+i.set);
 return {known:true,missing:expected.filter(key=>!done.includes(key)).length,extra:done.filter(key=>!expected.includes(key)).length,ambiguous};
}
function completed(w:Workout):boolean {const c=coverage(w);return !w.partial&&c.known&&!c.missing&&!c.extra&&!c.ambiguous;}

const feedbackComplete=(w:Workout)=>w.symptom==='no'&&['right','harder','easier'].includes(w.effort||'');
function settings(s:State,options:CoachingOptions){const now=options.now??Date.now(),today=options.today??day(new Date(now));return {now,today,brand:options.brand??'movefield',sample:options.sample===true};}
function validRecord(w:Workout,today:string,now:number):boolean{return validDay(w.date)&&w.date<=today&&Number.isFinite(w.startedAt)&&typeof w.finishedAt==='number'&&Number.isFinite(w.finishedAt)&&w.finishedAt>=w.startedAt&&w.finishedAt<=now&&doneRows(w).length>0;}
function history(s:State,today:string,now:number,sample:boolean):Workout[]{const seen=new Set<string>();return s.history.filter(w=>{if(seen.has(w.id)||!!w.demo!==sample||!validRecord(w,today,now))return false;seen.add(w.id);return true;}).sort((a,b)=>b.date.localeCompare(a.date)||(b.finishedAt||0)-(a.finishedAt||0)||a.id.localeCompare(b.id));}
function setupMatch(s:State,items:Item[],w:Workout,current?:Workout):boolean {
 return items.every(i=>{
  const e=exFor(i.exerciseId,s.custom);
  const a=current?current.loadContext?.[i.exerciseId]:(s.loadContext?.[i.exerciseId]??i.loadContext);
  const b=w.loadContext?.[i.exerciseId];
  // Recorded actual machine setup is required; a target's planned setup does
  // not prove the setup used. Optional setup labels also constrain comparisons.
  if(requiresSetup(e)&&(!a?.trim()||!b?.trim()))return false;
  return (a??'')===(b??'');
 });
}

function sameTargets(items:Item[],w:Workout):boolean{return targetsKnown(items)&&targetsKnown(w.targets)&&signature(items.map(targetKey))===signature(w.targets.map(targetKey));}
function matches(s:State,items:Item[],candidates:Workout[],owner:Plan|undefined,currentSession:Session|undefined,current?:Workout):Workout|undefined {
 const indexed=new Map<string,{owner:Plan;session:Session}>();for(const p of [s.plan,...s.saved])if(p)for(const session of p.sessions)if(!indexed.has(session.id))indexed.set(session.id,{owner:p,session});
 return candidates.find(w=>{
 const record=indexed.get(w.sessionId),previousOwner=record?.owner,previousSession=record?.session;
 const timed=items.some(i=>exFor(i.exerciseId,s.custom).metric!=='reps');
 if(timed&&(!currentSession||!previousSession||signature([currentSession.runSteps??null,currentSession.progressionStep??null])!==signature([previousSession.runSteps??null,previousSession.progressionStep??null])))return false;
 // Unknown imported authority stays unknown; titles are never a comparison key.
 return !!owner&&!!previousOwner&&previousOwner.profile.mode===owner.profile.mode&&(previousOwner.profile.age<18)===(owner.profile.age<18)&&sameTargets(items,w)&&setupMatch(s,items,w,current);
});}
function context(s:State,phase:'before'|'after',subject:Session|Workout,options:ReturnType<typeof settings>,sample:boolean):string {
 // Include every input that can select a comparison, guard, fact, or phrase. Retain
 // only the digest in rendered output; arbitrary user text is never coach prose.
 const plans=[s.plan,...s.saved].map(p=>p&&[p.id,p.version,p.paused,p.profile,p.sessions.map(x=>[x.id,x.date,x.status,x.needsReview,x.dependsOn,x.items,x.runSteps,x.progressionStep])]);
 return COACHING_POLICY+':'+hash(signature([phase,subject,options.today,options.brand,sample,s.hold,s.profile,plans,s.history,s.history.map(w=>[w.id,validRecord(w,options.today,options.now)]),s.active,s.events,s.custom,s.loadContext,s.equipmentCaps,s.incrementKg]));
}
function fill(frame:string,facts:Facts,date=''):string{return frame.replace('{date}',date).replace('{done}',String(facts.completedSets)).replace('{target}',String(facts.targetSets??0));}
function feedbackDetails(w:Workout|undefined):string[]{if(!w)return [];const out:string[]=[];if(w.effort==='harder')out.push('Recorded effort: harder than expected. This is feedback, not a measurement of lost strength.');else if(w.effort==='easier')out.push('Recorded effort: easier than expected. One rating does not authorize extra load or volume.');else if(w.effort==='right')out.push('Recorded effort: about right. It does not assess technique or current readiness.');else out.push('Effort feedback was not recorded clearly.');if(w.symptom==='no')out.push('No concerning symptom was reported for that workout; this does not assess current readiness.');else if(['yes','unsure'].includes(w.symptom||''))out.push('A concerning or uncertain symptom was recorded. This summary cannot diagnose or provide clearance.');else out.push('Symptom feedback was not recorded.');if(w.rating&&w.rating>=1&&w.rating<=5)out.push(`Recorded enjoyment: ${w.rating} out of 5.`);return out;}
function detailedFacts(s:State,w:Workout|undefined,items:Item[],facts:Facts):string[]{const out=feedbackDetails(w);if(w?.partial)out.push('This workout is marked partial. Its completed entries are retained without inventing any missing work.');if(w&&coverage(w).missing)out.push(`${coverage(w).missing} planned sets or activity entries have no matching completed row. Unfinished work is not counted as performed.`);if(w&&coverage(w).extra)out.push('Some completed rows fall outside the saved targets. They are recorded work, not evidence that planned work was missing.');if(w&&coverage(w).ambiguous)out.push('Duplicate or invalid completed rows prevent a reliable target comparison.');if(facts.unknownLoadSets)out.push(`${facts.unknownLoadSets} loaded set${facts.unknownLoadSets===1?' has':'s have'} no valid recorded weight. Unknown is different from zero.`);if(w?.revision&&w.revision>1)out.push('This summary uses the corrected saved record. It does not recreate what an earlier revision said.');if(w&&!targetsKnown(w.targets))out.push('Saved target context is missing. The completed rows can be summarized, but they cannot establish a matching workout.');if(items.some(i=>exFor(i.exerciseId,s.custom).metric!=='reps'))out.push('Logged intervals and task times do not verify every prescribed running bout, pace, distance or movement quality.');if(w?.demo)out.push('These are synthetic sample records, separate from personal workout history.');return out;}
function guard(s:State,owner:Plan|undefined,subject:Session|Workout,w:Workout|undefined,phase:'before'|'after',today:string):{policy?:Policy;notices:string[];required:boolean} {
 const notices:string[]=[];let policy:Policy|undefined;
 const activeConcern=phase==='before'&&s.active?.sessionId===(subject as Session).id&&['yes','unsure'].includes(s.active.symptom||'');
 if(s.hold)policy='hold';else if(activeConcern)policy='currentConcern';else if(w&&['yes','unsure'].includes(w.symptom||''))policy='symptom';else if(owner?.paused)policy='paused';
 if(phase==='before'){
  const session=subject as Session;
  if(!policy&&(owner!==s.plan||!!eligibility(s,session)||s.active&&s.active.sessionId!==session.id))policy='readiness';
  if(!policy&&session.date>today)policy='future';else if(!policy&&session.date<today)policy='overdue';
  if(!policy&&s.active?.sessionId===session.id)policy='active';
 }
 const age=Math.min(owner?.profile.age??s.profile.age,s.profile.age);
 if(age<18){if(!policy)policy='youth';else if(policy!=='youth')notices.push('Review targets and changes with your qualified supervisor.');}
 const mode=owner?.profile.mode;
 if(mode==='coach'){if(!policy)policy='coach';else notices.push('Your coach remains in charge of the training targets.');}
 else if(mode==='manual'){if(!policy)policy='manual';else notices.push('Your own tracking plan controls the targets.');}
 if(!owner) {if(!policy)policy='unverified';notices.push('The owning plan is unavailable; this log cannot establish training authority or a progression decision.');}
 const items=phase==='before'?(subject as Session).items:(subject as Workout).targets??[];
 if(items.some(i=>{const e=exFor(i.exerciseId,s.custom);return e.custom||e.name==='Archived exercise';})&&!policy)policy='unverified';
 return {policy,notices,required:!!policy||!owner};
}
function choosePolicy(g:ReturnType<typeof guard>,w:Workout|undefined,facts:Facts,today:string,phase:'before'|'after'):Policy {
 if(g.policy)return g.policy;
 if(!w)return 'baseline';
 const c=coverage(w);
 if(!c.known||c.extra||c.ambiguous||(w.partial&&!c.missing))return 'unverified';
 if(!completed(w))return 'partial';
 if(w.effort==='harder')return 'harder';
 if(phase==='before'&&dayDistance(w.date,today)>35)return 'older';
 if(facts.unknownLoadSets)return 'unknownLoad';
 if(!feedbackComplete(w))return 'feedback';
 if(w.rating&&w.rating<=2)return 'enjoyment';
 if(w.effort==='easier')return 'easier';
 return phase==='before'?'ready':'saved';
}
function relativeFact(s:State,current:Workout,previous:Workout|undefined):string|undefined {
 if(!previous||!completed(current)||!completed(previous)||!feedbackComplete(current)||!feedbackComplete(previous)||current.symptom!=='no'||previous.symptom!=='no')return;
 const loaded=(i:SetLog)=>exFor(i.exerciseId,s.custom).metric==='reps'&&isLoadTracked(exFor(i.exerciseId,s.custom));
 const now=doneRows(current).filter(loaded),old=doneRows(previous).filter(loaded);if(!now.length||now.length!==old.length)return;
 // Comparison excludes assisted/side/tempo/task changes. Equal targets do not
 // justify a performance claim when actual measurement context differs.
 if(now.some(i=>{const p=old.find(x=>x.exerciseId===i.exerciseId&&x.set===i.set);return !p||exFor(i.exerciseId,s.custom).metric!=='reps'||!isLoadTracked(exFor(i.exerciseId,s.custom))||i.kg===null||p.kg===null||!Number.isFinite(i.kg)||!Number.isFinite(p.kg)||signature(i.metrics??{})!==signature(p.metrics??{});} ))return;
 const sameLoad=now.every(i=>i.kg===old.find(x=>x.exerciseId===i.exerciseId&&x.set===i.set)!.kg);
 const sameReps=now.every(i=>i.reps===old.find(x=>x.exerciseId===i.exerciseId&&x.set===i.set)!.reps);
 if(sameLoad){const difference=now.reduce((n,i)=>n+i.reps,0)-old.reduce((n,i)=>n+i.reps,0);if(difference>0)return `You recorded ${difference} more repetition${difference===1?'':'s'} across ${now.length} matching loaded sets at the same recorded loads as ${previous.date}.`;if(difference===0)return `You recorded the same total repetitions across ${now.length} matching loaded sets at the same recorded loads as ${previous.date}.`;return `You recorded ${Math.abs(difference)} fewer repetitions across ${now.length} matching loaded sets at the same recorded loads as ${previous.date}; this does not establish lost strength.`;}
 if(sameReps){const higher=now.filter(i=>i.kg!>old.find(x=>x.exerciseId===i.exerciseId&&x.set===i.set)!.kg!).length,lower=now.filter(i=>i.kg!<old.find(x=>x.exerciseId===i.exerciseId&&x.set===i.set)!.kg!).length;if(higher&&!lower)return `${higher} matching set${higher===1?' has':'s have'} a higher recorded load with the same repetitions as ${previous.date}. This is a log comparison, not a strength test.`;}
}
function assemble(s:State,phase:'before'|'after',subject:Session|Workout,owner:Plan|undefined,w:Workout|undefined,previous:Workout|undefined,items:Item[],options:ReturnType<typeof settings>,sample:boolean):CoachingSummary {
 const facts=factsFor(s,w,phase==='before'?items:w?.targets),g=guard(s,owner,subject,w,phase,options.today),policy=choosePolicy(g,w,facts,options.today,phase),contextVersion=context(s,phase,subject,options,sample),seed=contextVersion+':'+policy;
 const frames=phase==='after'?afterFrames:w?beforeHistoryFrames:beforeNewFrames,frame=pick(frames,seed+':fact');
 const extraRows=w&&targetsKnown(w.targets)&&doneRows(w).some(row=>!w.targets!.some(t=>t.exerciseId===row.exerciseId&&row.set<=t.sets));
 const fact=extraRows?`${facts.completedSets} completed sets or activity entries are saved; the plan lists ${facts.targetSets}. Some entries fall outside those targets.`:facts.targetSets===null?`${facts.completedSets} completed sets or activity entries are saved; planned target context is unavailable.`:fill(frame.value,facts,w?.date);
 const suggestion=pick(coachingSuggestions[policy],seed+':suggestion');
 const review=g.required||['partial','harder','feedback','unknownLoad','older','enjoyment','unverified'].includes(policy);
 const encouragement=pick(review?coachingReviewEncouragement:coachingEncouragement[options.brand],seed+':encouragement');
 const messages:CoachingMessage[]=[{id:`fact:${phase}:${w?'history':'baseline'}:${frame.index}`,text:fact,kind:'fact',required:false},{id:`suggestion:${policy}:${suggestion.index}`,text:[suggestion.value,...g.notices].join(' '),kind:'suggestion',required:g.required},{id:`encouragement:${review?'review':options.brand}:${encouragement.index}`,text:encouragement.value,kind:'encouragement',required:false}];
 const details=detailedFacts(s,w,items,facts);
 if(w?.effort==='right')details.push(pick(coachingSuggestions.right,seed+':right-feedback').value);
 if(phase==='before'&&previous)details.unshift('Matched the saved exercise order, set and rep targets, rest, load role, source rules and recorded setup. A matching log does not assess today’s technique or readiness.');
 if(phase==='after'&&previous){details.unshift(`Comparable earlier record: ${previous.date}. Exercise targets and recorded setups match; changes in plans or titles alone do not establish comparability.`);const relative=relativeFact(s,subject as Workout,previous);if(relative&&!g.required)messages[2]={id:'fact:relative-saved-work',text:relative,kind:'fact',required:false};}
 if(phase==='after'&&!g.required&&w&&completed(w)){
  const count=history(s,w.date,Math.min(options.now,w.finishedAt!),sample).length;
  if([1,5,10,25,50,100,250,500,1000].includes(count)) {
   const milestone=`This is saved workout number ${count} in this ${sample?'sample':'personal'} profile, counting partial and complete records. It is a logging milestone, not a training streak or a fitness measure.`;
   details.push(milestone);
   if(!review&&messages[2].kind!=='fact')messages[2]={id:'fact:saved-workout-milestone',text:`Saved workout number ${count} in your ${sample?'sample':'personal'} record. Keeping an accurate log gives you something useful to review.`,kind:'fact',required:false};
  }
 }
 if(phase==='before'&&!previous)details.push('No earlier record matches the complete target and setup context. A different exercise, range, source stage, missing setup or missing owning plan keeps histories separate.');
 if(w?.rating&&w.rating<=2&&policy!=='enjoyment')details.push('Your low enjoyment rating can inform a separate review of exercise choice, session length or schedule.');
 details.push('These messages are selected from local reviewed text and saved facts. They do not change targets, schedule or load.');
 const unsupported=items.some(i=>{const e=exFor(i.exerciseId,s.custom);return e.custom||e.name==='Archived exercise';});
 const aiEligible=!g.required&&!sample&&!unsupported&&!!owner&&owner.profile.mode==='app'&&owner.profile.age>=18&&s.profile.age>=18&&!!w&&completed(w)&&feedbackComplete(w)&&facts.unknownLoadSets===0&&!review;
 return {key:contextVersion,contextVersion,policy:COACHING_POLICY,phase,title:phase==='before'?(review?'Before you continue':'Before your workout'):(review?'Workout saved · review next steps':'Your workout, recorded'),tone:review?'review':w?'encouraging':'neutral',messages,details,comparison:previous?{workoutId:previous.id,date:previous.date,matchedExercises:items.length}:undefined,facts,policyIds:[policy,...(owner?.profile.age&&owner.profile.age<18?['youth-authority']:[]),...(owner?.profile.mode!=='app'?['owner-authority']:[])],aiEligible};
}
export function beforeWorkoutCoaching(s:State,session:Session,options:CoachingOptions={}):CoachingSummary|null {
 const cfg=settings(s,options),owner=ownerOf(s,session.id),live=owner?.sessions.find(x=>x.id===session.id);
 // The caller may retain an old object across edits or a pending dialog. Only
 // current stored targets/status/readiness and active actual targets are used.
 if(!live||!validDay(cfg.today)||!validDay(live.date))return null;
 const active=s.active?.sessionId===live.id?s.active:undefined,items=active?.targets??live.items;
 const candidates=history(s,cfg.today,cfg.now,cfg.sample).filter(w=>w.sessionId!==live.id&&w.date<=live.date),previous=matches(s,items,candidates,owner,live,active);
 return assemble(s,'before',{...live,items},owner,previous,previous,items,cfg,cfg.sample);
}

export function afterWorkoutCoaching(s:State,workoutId:string,options:CoachingOptions={}):CoachingSummary|null {
 const cfg=settings(s,options),w=s.history.find(x=>x.id===workoutId);if(!validDay(cfg.today)||!w||!validRecord(w,cfg.today,cfg.now))return null;
 const owner=ownerOf(s,w.sessionId),items=w.targets??[],sample=!!w.demo;
 const candidates=history(s,w.date,Math.min(cfg.now,w.finishedAt!),sample).filter(x=>x.id!==w.id&&(x.date<w.date||x.finishedAt!<w.finishedAt!));
 const previous=matches(s,items,candidates,owner,owner?.sessions.find(x=>x.id===w.sessionId),w);
 return assemble(s,'after',w,owner,w,previous,items,cfg,sample);
}
