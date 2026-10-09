import {type RestTimer} from './rest-timer';
import expandedLibrary from './exercise-library.json';
import recipes from './recipes.json';
import {applyTrainingFocus,focusScheduleConflict} from './training-focus';
import {programCatalog,programReferences,referenceMatchesGoal,equipmentRequirements,type ProgramDefinition} from './program-catalog';
import {planEvidence} from './program-evidence';
export type Mode = 'app'|'coach'|'manual';
export type Profile={noFloor?:boolean;age:number;goal:string;experience:string;mode:Mode;minutes:number;days:number[];weeks:number;start:string;equipment:string;sport:string;position:string;season:string;supervision:boolean;units:'kg'|'lb';name:string;sex?:'female'|'male'|'intersex'|'unspecified';dumbbellMaxKg?:number;programId?:string;runBase?:boolean;runDays?:number;runMinutes?:number;establishedTraining?:boolean;focuses?:('core'|'jumping'|'supersets'|'activity')[];jumpReady?:boolean};
export type Exercise={id:string;name:string;pattern:string;equipment:string;metric:'reps'|'seconds'|'minutes';cues:string[];source?:string;video?:string;videoNote?:string;custom?:boolean;loadConvention?:string;loadMultiplier?:number;loadTracked?:boolean;requiresSetup?:boolean;primaryMuscles?:string[];instructionStatus?:string;progressionEnabled?:boolean;category?:string};
export type Item={exerciseId:string;sets:number;reps:number;repMin?:number;repMax?:number;rest:number;kg:number|null;loadContext?:string;loadRole?:string;note?:string};
export type Session={id:string;date:string;week:number;title:string;kind:string;minutes:number;items:Item[];dependsOn?:string[];progressionStep?:string;needsReview?:boolean;status:'scheduled'|'completed'|'partial'|'missed';recoveryGroup?:string;roleId?:string;timeProfile?:'brief';runSteps?:{label:string;seconds:number}[]};
export type Plan={id:string;name:string;version:number;progressionModel?:'ranges';scheduleEnd?:string;profile:Profile;acceptedAt:string|null;sessions:Session[];phases:{name:string;weeks:string;description:string}[];evidence:string[];notes:string[];progression:string;template:string;paused:boolean};
export type SetMetrics={distanceM?:number;durationSeconds?:number;heightCm?:number;heartRate?:number;cadence?:number;powerWatts?:number;speedKph?:number;inclinePercent?:number;level?:number;assistanceKg?:number;tempo?:string;side?:string;notes?:string};
export type SetLog={exerciseId:string;set:number;reps:number;kg:number|null;done:boolean;metrics?:SetMetrics;rir?:number|null};
export type ExerciseNotes={notes?:string};
export type Workout={id:string;sessionId:string;title:string;date:string;startedAt:number;finishedAt?:number;sets:SetLog[];targets?:Item[];loadContext?:Record<string,string>;rir?:Record<string,number|null>;details?:Record<string,ExerciseNotes>;effort?:string;symptom?:string;rating?:number;partial?:boolean;supervisorConfirmed?:boolean;demo?:boolean};
export type Proposal={id:string;title:string;reason:string;type:'sets'|'move'|'return'|'load'|'substitute'|'ranges'|'capacity';changes?:{sessionId:string;beforeDate?:string;patch:Partial<Session>}[];warnings?:string[];eventSignature?:string;historyCount?:number;planId:string;baseVersion:number;sessionId:string;before:string;after:string;status:'pending'|'accepted'|'declined'|'stale'|'queued';patch:Partial<Session>;source:string;createdAt:string};
export type Event={id:string;name:string;date:string;kind:string;priority:string;minutes:number;provisional:boolean};
export type State={restTimer?:RestTimer|null;restAlerts?:boolean;restSound?:boolean;videoPromptsAnswered?:string[];schema:2;profile:Profile;plan:Plan|null;history:Workout[];active:Workout|null;proposals:Proposal[];events:Event[];custom:Exercise[];ratings:Record<string,number>;audit:{at:string;message:string}[];saved:Plan[];checkins:boolean;soreness:boolean;hold:boolean;simulatedOffline:boolean;equipmentCaps?:{exerciseId:string;setup:string;maxKg:number}[];incrementKg?:Record<string,number>;loadContext?:Record<string,string>};
export const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function addDays(date:string,n:number){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return day(d)}
export function niceDate(date:string){return new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
export function uid(prefix='id'){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
const foundationExercises:Exercise[]=[
{id:'squat',name:'Goblet squat',pattern:'Squat',equipment:'Dumbbells',metric:'reps',cues:['Hold one weight close to your chest.','Sit between your hips through a comfortable range.','Keep the whole foot grounded and stand smoothly.']},
{id:'bench',name:'Barbell bench press',pattern:'Push',equipment:'Full gym',metric:'reps',cues:['Set a stable position with feet supported.','Lower the bar under control to a comfortable chest position.','Press smoothly; use appropriate safeties or a qualified spotter.']},
{id:'row',name:'Standing one-arm dumbbell row',pattern:'Pull',equipment:'Dumbbells',metric:'reps',cues:['Take a stable split stance and hinge forward with a controlled trunk.','Draw your elbow toward your hip without twisting.','Lower under control; log repetitions per side and load per hand.']},
{id:'rdl',name:'Dumbbell Romanian deadlift',pattern:'Hinge',equipment:'Dumbbells',metric:'reps',cues:['Keep a soft knee bend and send your hips back.','Keep the weights close and stop within a controlled range.','Stand by extending the hips, without leaning back.']},
{id:'pushup',name:'Incline push-up',pattern:'Push',equipment:'Bodyweight',metric:'reps',cues:['Use a secure, elevated support.','Keep your body aligned as you lower.','Choose a support height that allows controlled repetitions.']},
{id:'plank',name:'Forearm plank',pattern:'Trunk',equipment:'Bodyweight',metric:'seconds',cues:['Support yourself on forearms and toes or knees.','Maintain a comfortable trunk position.','Breathe normally; end the hold when control changes.']},
{id:'deadbug',name:'Dead bug',pattern:'Trunk',equipment:'Bodyweight',metric:'reps',cues:['Lie on your back with arms and legs lifted.','Move an opposite arm and leg slowly within a controlled range.','Return and alternate; record repetitions per side.']},
{id:'bw-squat',name:'Bodyweight squat',pattern:'Squat',equipment:'Bodyweight',metric:'reps',cues:['Stand with a comfortable stance.','Lower through a comfortable range with feet supported.','Stand smoothly; use a stable chair as a depth reference if useful.']},
{id:'calf',name:'Standing calf raise',pattern:'Calf',equipment:'Bodyweight',metric:'reps',cues:['Use a stable support for balance.','Rise through your forefoot without rolling the ankle.','Lower slowly through a comfortable range.']},
{id:'pulldown',name:'Lat pulldown',pattern:'Pull',equipment:'Full gym',metric:'reps',cues:['Set the thigh support securely.','Pull the bar toward your upper chest.','Return under control without swinging your torso.']},
{id:'bar-squat',name:'Barbell back squat',pattern:'Squat',equipment:'Full gym',metric:'reps',cues:['Set the rack and safeties for your position.','Brace and descend within your controlled range.','Stand with a stable bar path; unfamiliar lifters need instruction.']},
{id:'ohp',name:'Standing dumbbell shoulder press',pattern:'Push',equipment:'Dumbbells',metric:'reps',cues:['Stand with a stable stance and controlled trunk.','Press through a comfortable range without excessive back arch.','Lower the weights under control.']},
{id:'split',name:'Static split squat',pattern:'Single leg',equipment:'Bodyweight',metric:'reps',cues:['Use a stable split stance and support for balance if needed.','Lower through a comfortable range.','Press up with control; log repetitions per side.']},
{id:'bridge',name:'Glute bridge',pattern:'Hinge',equipment:'Bodyweight',metric:'reps',cues:['Lie on your back with bent knees and feet supported.','Raise your hips within a comfortable controlled range.','Lower smoothly; breathe normally.']},
{id:'band-row',name:'Seated resistance-band row',pattern:'Pull',equipment:'Resistance band',metric:'reps',cues:['Use a resistance band and an anchor intended for this exercise.','Keep a stable trunk and draw elbows back under control.','Do not improvise an unsecured household anchor.']},
{id:'deadlift',name:'Barbell deadlift',pattern:'Hinge',equipment:'Full gym',metric:'reps',cues:['Use the familiar setup taught for your chosen deadlift variation.','Brace and lift with controlled coordinated hip and knee extension.','Return the bar under control; qualified instruction is needed for an unfamiliar lift.']},
{id:'leg-curl',name:'Machine leg curl',pattern:'Knee flexion',equipment:'Full gym',metric:'reps',cues:['Adjust the machine for your limb length.','Curl through a comfortable controlled range.','Return slowly; keep the machine setup consistent in your log.']},
{id:'leg-extension',name:'Machine leg extension',pattern:'Knee extension',equipment:'Full gym',metric:'reps',cues:['Adjust the seat and pad to fit your leg.','Extend through a comfortable controlled range.','Return smoothly without bouncing.']},
{id:'incline-press',name:'Incline dumbbell press',pattern:'Push',equipment:'Full gym',metric:'reps',cues:['Use a secure incline bench and a manageable pair of weights.','Press through a controlled comfortable range.','Record the bench angle and load per hand.']},
{id:'lateral',name:'Dumbbell lateral raise',pattern:'Shoulder',equipment:'Dumbbells',metric:'reps',cues:['Stand with a stable trunk and manageable weights.','Raise through a comfortable range without swinging.','Lower under control; load is per hand.']},
{id:'curl',name:'Dumbbell curl',pattern:'Arm',equipment:'Dumbbells',metric:'reps',cues:['Use a stable stance and manageable weights.','Bend the elbows without swinging your torso.','Lower under control; load is per hand.']},
{id:'triceps',name:'Cable triceps extension',pattern:'Arm',equipment:'Full gym',metric:'reps',cues:['Choose a suitable cable attachment and stable position.','Extend the elbows through a controlled range.','Return smoothly; record the machine and attachment.']},
{id:'walk',name:'Brisk walk',pattern:'Endurance',equipment:'Bodyweight',metric:'minutes',cues:['Choose a suitable route and conditions.','Walk at a comfortable purposeful pace.','You should still be able to speak comfortably.']},
{id:'run',name:'Easy run / walk',pattern:'Endurance',equipment:'Bodyweight',metric:'minutes',cues:['Begin with the planned walking warm-up.','Keep running conversational rather than chasing speed.','Finish with a comfortable walk; stop for concerning symptoms.']},
{id:'skill',name:'Coach-selected sport skill practice',pattern:'Skill',equipment:'Sport equipment',metric:'minutes',cues:['Use your coach’s instructions and a suitable environment.','Record only the minutes or drills you actually perform.','Completion does not establish assessed skill or technical readiness.']}
];
const foundationMetadata:Record<string,Partial<Exercise>>={
 'squat':{equipment:'Dumbbell',loadMultiplier:1,loadConvention:'One dumbbell total; repetitions total.'},
 'row':{equipment:'Dumbbell',loadMultiplier:2,loadConvention:'Per dumbbell; repetitions per side. Complete both sides before marking the set done.'},
 ...Object.fromEntries(['rdl','ohp','incline-press','lateral','curl'].map(id=>[id,{equipment:'Dumbbell',loadMultiplier:2,loadConvention:'Per dumbbell; count each simultaneous lift once. Both dumbbells must have the same weight.'}])),
 ...Object.fromEntries(['bench','bar-squat','deadlift'].map(id=>[id,{equipment:'Barbell',loadMultiplier:1,loadConvention:'Total weight including bar and plates; repetitions total.'}])),
 ...Object.fromEntries(['pulldown','triceps'].map(id=>[id,{equipment:'Cable',loadMultiplier:1,requiresSetup:true,loadConvention:'One selected stack weight; repetitions total. Keep machine, pulley and attachment identical.'}])),
 ...Object.fromEntries(['leg-curl','leg-extension'].map(id=>[id,{equipment:'Selectorized machine',loadMultiplier:1,requiresSetup:true,loadConvention:'Selected stack weight; repetitions total. Keep machine and seat/pad settings identical.'}]))
};
export const exercises:Exercise[]=[...foundationExercises.map(e=>({...e,pattern:e.pattern==='Trunk'?'Core':e.pattern,instructionStatus:'reviewed-source',loadTracked:!!foundationMetadata[e.id],progressionEnabled:!!foundationMetadata[e.id],loadMultiplier:0,loadConvention:['split','deadbug'].includes(e.id)?'Bodyweight; repetitions per side. Complete both sides.':'Bodyweight or task time; external load not included in volume.',...foundationMetadata[e.id]})),...(expandedLibrary as Exercise[])];
export function isLoadTracked(e:Exercise){return e.loadTracked===true;}
export function requiresSetup(e:Exercise){return e.requiresSetup===true;}
export function matchesExercise(e:Exercise,query:string){
 const aliases:Record<string,string>={db:'dumbbell',dumbell:'dumbbell',dumbells:'dumbbell',kb:'kettlebell',bb:'barbell',abs:'core',abdominal:'core',abdominals:'core',pec:'chest',pecs:'chest'};
 const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const text=normalize(`${e.name} ${e.pattern} ${e.equipment} ${(e.primaryMuscles||[]).join(' ')} ${/abdom|trunk/i.test(e.pattern+' '+e.primaryMuscles?.join(' '))?'core':''}`);
 return normalize(query).split(/\s+/).filter(Boolean).every(t=>text.includes(aliases[t]||t));
}
export const sports=['Football','Flag football','Basketball','Baseball','Softball','Soccer','Volleyball','Track and field','Cross country','Swimming','Diving','Wrestling','Lacrosse','Field hockey','Ice hockey','Tennis','Golf','Cheer','Dance','Gymnastics','Bowling','Other sport'];
export const goals=[['strength','Strength'],['hypertrophy','Build muscle'],['powerbuilding','Powerbuilding'],['hybrid','Hybrid · strength + running'],['running','Start running'],['sport','Sport performance'],['general','General fitness'],['calisthenics','Calisthenics'],['powerlifting','Powerlifting']] as const;
export const blankProfile:Profile={age:28,goal:'hybrid',experience:'Some experience',mode:'app',minutes:60,days:[1,3,5],weeks:8,start:day(),equipment:'Full gym',sport:'Basketball',position:'All-round',season:'Off-season',supervision:false,units:'lb',name:'Demo athlete'};
export function roundLoad(kg:number,increment:number){return Math.floor((kg+1e-8)/increment)*increment}
export function displayLoad(kg:number|null,units:'kg'|'lb'){return kg==null?'Choose a light load':`${Math.round(kg*(units==='lb'?2.2046226218:1)*10)/10} ${units}`}
export function toKg(n:number,units:'kg'|'lb'){return units==='lb'?n/2.2046226218:n}
const exerciseById=new Map(exercises.map(e=>[e.id,e]));
export function exFor(id:string,custom:Exercise[]=[]):Exercise{return exerciseById.get(id)||custom.find(e=>e.id===id)||{id,name:'Archived exercise',pattern:'Custom',equipment:'Custom',metric:'reps',cues:[]}}
export function validateProfile(p:Profile){
 if(!p||!Array.isArray(p.days))return ['Choose valid available weekdays.'];
 const errors:string[]=[];if(!Array.isArray(p.days)||!p.days.length||p.days.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(p.days).size!==p.days.length)errors.push('Choose distinct weekdays from Sunday through Saturday.');if(!['First time','Some experience','Experienced'].includes(p.experience)||!['app','coach','manual'].includes(p.mode)||!['Full gym','Dumbbells','Bodyweight + band','No equipment'].includes(p.equipment)||!['kg','lb'].includes(p.units))errors.push('Choose supported experience, coaching, equipment and units.');if(!Number.isInteger(p.age)||!Number.isInteger(p.minutes))errors.push('Age and session minutes must be whole numbers.');if(!goals.some(([id])=>id===p.goal))errors.push('Choose a supported training goal.');if(!Number.isFinite(p.age)||p.age<14||p.age>100)errors.push('This prototype supports ages 14–100. Under-14 planning is outside its scope.');
 if(!validDay(p.start))errors.push('Choose a valid start date.');
 if(!Number.isFinite(p.minutes)||p.minutes<15||p.minutes>120)errors.push('Choose a session window of 15–120 minutes.');
 if(p.sex!==undefined&&!['female','male','intersex','unspecified'].includes(p.sex))errors.push('Choose a supported sex option or leave it unspecified.');if(p.dumbbellMaxKg!==undefined&&(!Number.isFinite(p.dumbbellMaxKg)||p.dumbbellMaxKg<0||p.dumbbellMaxKg>500))errors.push('Enter a valid maximum weight for one dumbbell.');
 if(!Number.isInteger(p.weeks)||p.weeks<2||p.weeks>12)errors.push('Choose a block of 2–12 weeks.');
 if(p.runDays!==undefined&&(!Number.isInteger(p.runDays)||p.runDays<0||p.runDays>7))errors.push('Running days must be 0–7.');if(p.runMinutes!==undefined&&(!Number.isFinite(p.runMinutes)||p.runMinutes<0||p.runMinutes>1500))errors.push('Running minutes must be 0–1500.');
 if(!p.days.length)errors.push('Select at least one available day.');
 if(p.mode==='app'&&p.days.length<2)errors.push('These planning templates need at least two days. Add a day or choose manual tracking.');
 if(p.mode==='app'&&p.goal==='running'&&!p.programId&&p.days.length<3)errors.push('The beginner run/walk plan uses three nonconsecutive days. Add a third day or use tracking.');

 if(p.age<18&&p.mode==='app'&&!p.supervision)errors.push('Youth automated strength planning requires suitable qualified supervision. Select coach/manual tracking if it is unavailable.');
 if(p.age<18&&p.goal==='running'&&p.mode==='app')errors.push('This run/walk template is an adult pathway. Youth runners can use coach tracking and the supervised strength foundation.');
 return errors;
}
const nonConsecutive=(a:number[],count:number)=>{const combos:number[][]=[];function f(i:number,b:number[]){if(b.length===count){combos.push(b);return}for(let j=i;j<a.length;j++)f(j+1,[...b,a[j]])}f(0,[]);return combos.find(b=>b.every((v,i)=>b.every((w,j)=>i===j||![1,6].includes(Math.abs(v-w)))))||[]};
/** Only draft dates may shift without a second approval. Acceptance shows every date. */
export function buildPlan(p:Profile,events:Event[]=[]):{plan:Plan|null;errors:string[]}{
 const protectedEvents=[...events];
 if(p.mode==='app')for(const e of events.filter(e=>e.kind==='Competition')){
  const buffer=e.priority==='Normal'?1:2;
  for(let n=1;n<=buffer;n++)protectedEvents.push({...e,id:e.id+'-buffer-'+n,date:addDays(e.date,-n),name:'Recovery before '+e.name});
 }
 let result=buildBasePlan(p,protectedEvents);
 if(!result.plan&&protectedEvents.length){const open=buildBasePlan(p,[]);if(open.plan){
  const draft=open.plan,original=draft.sessions.map(s=>s.date),limit=addDays(original.at(-1)!,28);let moved=0;
  for(let i=0;i<draft.sessions.length;i++){
   const session=draft.sessions[i],gap=i?dayDistance(original[i-1],original[i]):0;
   let date=i&&addDays(draft.sessions[i-1].date,gap)>original[i]?addDays(draft.sessions[i-1].date,gap):original[i];
   while(date<=limit&&(!draft.profile.days.includes(new Date(date+'T12:00:00').getDay())||protectedEvents.some(e=>e.date===date)))date=addDays(date,1);
   if(date>limit)return {plan:null,errors:['Your commitments leave too few training dates. Try a later start or fewer weekly sessions. We can extend a draft by up to four weeks.']};
   if(date!==session.date)moved++;session.date=date;
  }
  if(moved){draft.scheduleEnd=draft.sessions.at(-1)!.date;draft.notes.unshift(`Days off pause this draft: ${moved} sessions have later dates. It now ends ${niceDate(draft.scheduleEnd)}. The session order, recovery gaps and planned work stay the same. Review every date before starting.`);}
  result=open;
 }}
 if(result.plan&&events.some(e=>e.kind==='Competition')&&p.mode==='app')result.plan.notes.unshift('Competition dates are protected. This draft leaves the day before each competition free, or two days for a high-priority event. These are app planning rules, not a promise to prevent soreness or a sport-specific taper.');
 return result.plan?applyTrainingFocus(result.plan,events):result;
}
function buildBasePlan(p:Profile,events:Event[]=[]):{plan:Plan|null;errors:string[]}{
 const errors=validateProfile(p);if(errors.length)return{plan:null,errors};
 if(p.programId?.startsWith('ref-')){
  const ref=programReferences.find(x=>x.id===p.programId&&referenceMatchesGoal(x,p.goal));
  if(!ref||p.mode!=='manual')return {plan:null,errors:['Choose a matching named program in manual tracking mode.']};
  if(p.age<18)return {plan:null,errors:['These adult program references are not youth prescriptions. Review training with your coach and choose coach-directed tracking.']};
  if(p.days.length<ref.days)return {plan:null,errors:[`${ref.name} uses ${ref.days} days per week. Add availability before creating its tracking schedule.`]};
  if(ref.weeks&&p.weeks>ref.weeks)return {plan:null,errors:[`${ref.name} lasts ${ref.weeks} weeks. Choose that length or a shorter tracking segment.`]};
  if(ref.workouts){
   const compatible=ref.equipment==='dumbbells'?['Dumbbells','Full gym']:ref.equipment==='bodyweight'?['Bodyweight + band','Full gym']:['Full gym'];
   if(!compatible.includes(p.equipment))return {plan:null,errors:[`${ref.name} needs ${compatible.join(' or ')} plus the listed supports. The app will not replace source exercises silently.`]};
   if(p.experience==='First time'&&ref.experience!=='Beginner')return {plan:null,errors:['This prefilled selection assumes experience with its listed movements. Choose a beginner routine or enter reviewed variations in your own tracking plan.']};
   if(p.noFloor&&!ref.noFloor)return {plan:null,errors:['This source template has no verified no-floor version. Use your own tracking schedule with suitable exercises.']};
   if(ref.equipment==='dumbbells'&&p.dumbbellMaxKg===0)return {plan:null,errors:['This source routine requires dumbbells; your available maximum is zero. Update equipment or choose another plan.']};
  }
  const patterns=ref.offsets||(ref.days===5?[[0,1,3,4,5]]:[[0,1,3,4]]),startDay=new Date(p.start+'T12:00:00').getDay();
  const arranged=Array.from({length:7},(_,delay)=>patterns.map(offsets=>({delay,offsets,days:offsets.map(o=>(startDay+delay+o)%7)}))).flat().find(x=>x.days.length===ref.days&&x.days.every(d=>p.days.includes(d)));
  if(!arranged)return {plan:null,errors:['This named routine needs its source recovery gaps. Add suitable availability, or use a separate custom tracking schedule.']};
  const days=arranged.days.slice().sort((a,b)=>a-b),effectiveStart=addDays(p.start,arranged.delay),id=uid('plan'),sessions:Session[]=[];
  for(let week=1;week<=p.weeks;week++)for(const offset of arranged.offsets){
   const index=sessions.length,slot=index%(ref.workouts?.length||ref.days),source=ref.workouts?.[slot],roleId=ref.id+'-'+slot;
   const date=addDays(effectiveStart,(week-1)*7+offset);
   if(events.some(e=>e.date===date))return {plan:null,errors:['A source workout falls on a commitment. Review a shifted draft.']};
   const items:Item[]=source?.items.map(([exerciseId,sets,repMin,repMax,rest,note])=>({exerciseId,sets,reps:repMin,repMin,repMax,rest,kg:null,loadRole:roleId,note}))||[];
   const minutes=items.length?Math.max(ref.minMinutes||0,estimateSessionMinutes(items)):p.minutes;
   if(minutes>p.minutes)return {plan:null,errors:[`${ref.name} · ${source?.title} needs about ${minutes} minutes including work, rest and setup, beyond your ${p.minutes}-minute window. Choose more time or another routine.`]};
   sessions.push({id:uid('session'),date,week,title:ref.name+' · '+(source?.title||'Day '+(slot+1)),kind:'Manual strength',minutes,items,roleId,dependsOn:index?[sessions[index-1].id]:[],progressionStep:ref.progression,status:'scheduled'});
  }
  const plan:Plan={id,name:ref.name+' by '+ref.author+' · manual tracking',version:1,profile:{...p,days},acceptedAt:null,sessions,
   phases:[{name:ref.workouts?'Source template':'Track the original',weeks:`1–${p.weeks}`,description:'Review the author’s targets, chosen variations and progression. Loads and future target edits stay user directed.'}],evidence:[],
   notes:[`Published program by ${ref.author}: ${ref.url}`,ref.workouts?'Prefilled workout facts with the variations below. Loads, later phases, AMRAP and failure-stage rules require your review.':'Empty tracking calendar. Enter source exercises, loads and progression from your own copy.',...(ref.requirements||[]).map(r=>'Required: '+r),...(ref.scope||[]),...(arranged.delay?[`The first source workout starts ${niceDate(effectiveStart)}, after your selected start date, to preserve its weekly recovery pattern.`]:[]),...(ref.weeks&&p.weeks<ref.weeks?[`The original lasts ${ref.weeks} weeks. This schedule covers only the first ${p.weeks} weeks.`]:[])],
   progression:ref.progression||'Enter and review targets from the original program. Source-specific loads and progression are not automated.',template:'TRACK',paused:false};
  return {plan,errors:[]};
 }

 if(p.mode==='app'&&(p.programId||((p.noFloor||p.equipment==='No equipment'||p.age>=18)&&p.goal!=='running'&&programCatalog.some(d=>d.goal===p.goal))))return buildCatalogPlan(p,events);
 const youth=p.age<18,run=p.goal==='running',tracking=p.mode!=='app',gym=p.equipment==='Full gym',db=!p.equipment.startsWith('Bodyweight');
 if(!tracking&&!run&&db&&p.dumbbellMaxKg===0)return {plan:null,errors:['This foundation uses dumbbells but your available maximum is zero. Choose bodyweight/band training or update your equipment.']};
 if(youth&&!tracking&&p.season==='In-season')return{plan:null,errors:['In-season youth sport defaults to coach-directed tracking. A complementary app plan needs an explicitly coordinated total schedule; use tracking in this prototype.']};
 if(!tracking&&run&&p.weeks>9)return{plan:null,errors:['The source run/walk sequence contains nine stages. Choose 2–9 weeks for this preview, then review the next block.']};
 let template=tracking?'TRACK':run?'RUN-WALK':youth?'YOUTH-FOUNDATION':p.goal==='hypertrophy'&&p.experience!=='First time'?'AT02':(['powerlifting','strength','hybrid'].includes(p.goal)&&p.experience!=='First time'&&gym)?'AT03':p.goal==='calisthenics'||!db?'AT04':'AT01';
 let days=p.days.slice().sort();
 if(!tracking){if(template==='AT02'){
 if(!gym||p.minutes<60)return{plan:null,errors:['This four-day hypertrophy template requires full-gym equipment and at least 60 minutes. Choose the general-fitness foundation for less work.']};
 const candidates:number[][]=[];for(let a=0;a<days.length;a++)for(let b=a+1;b<days.length;b++)for(let c=b+1;c<days.length;c++)for(let d=c+1;d<days.length;d++){const x=[days[a],days[b],days[c],days[d]];if(x[2]-x[0]>=2&&7-x[2]+x[0]>=2&&x[3]-x[1]>=2&&7-x[3]+x[1]>=2)candidates.push(x)}days=candidates[0]||[];
 }else{const wanted=run||template==='AT03'?3:2;days=nonConsecutive(p.days,wanted);if(!days.length&&template==='AT03'){days=nonConsecutive(p.days,2);template='AT01'}}}
 if(!days.length)return{plan:null,errors:['No supported schedule fits those days. Add separated availability or choose a simpler foundation; the app will not silently move a day.']};
 if(youth&&!tracking&&p.minutes<40)return{plan:null,errors:['The supervised youth foundation needs a 40-minute slot including instruction and rest. Increase available time or choose tracking.']};
 const id=uid('plan'),sessions:Session[]=[];const priorByTitle:Record<string,string[]>={};
 const foundationA=['squat','rdl','pushup','row','ohp','calf','deadbug'];
 const foundationB=['squat','rdl','pushup',gym?'pulldown':'row','ohp','calf','deadbug'];
 const home=['bw-squat','bridge','pushup','band-row','calf','deadbug'];
 const strengthMenus=[['bar-squat','bench','row','leg-curl'],['deadlift','ohp','pulldown','split'],['bar-squat','bench','rdl','row']];
 const hypertrophyMenus=[['bench','row','incline-press','pulldown','lateral','curl','triceps'],['bar-squat','rdl','leg-extension','leg-curl','calf','deadbug'],['incline-press','pulldown','bench','row','lateral','curl','triceps'],['bar-squat','rdl','leg-extension','leg-curl','calf','deadbug']];
 for(let offset=0;offset<p.weeks*7;offset++){
 const date=addDays(p.start,offset),weekday=new Date(date+'T12:00:00').getDay();if(!days.includes(weekday))continue;
 const index=sessions.length,week=Math.floor(index/days.length)+1,slot=index%days.length,cycle=Math.min(week-1,5);let title='',items:Item[]=[],runSteps:Session['runSteps'];
 if(tracking){title='Enter your '+(p.mode==='coach'?'coach’s':'custom')+' session';}
 else if(run){const cfg=recipes.running;const stage=cfg.weeks_pattern_ids[Math.min(week-1,8)][slot];const pattern=cfg.patterns[stage as keyof typeof cfg.patterns];const seq:number[]=Array.isArray(pattern)?pattern:Array.from({length:pattern.repeat},()=>pattern.pair_seconds).flat().concat(pattern.final_run_seconds);runSteps=[{label:'Warm-up walk',seconds:300},...seq.map(n=>({label:n>0?'Easy run':'Recovery walk',seconds:Math.abs(n)})),{label:'Cool-down walk',seconds:300}];title=`Run/walk · stage ${week}${week===5||week===6?' / '+(slot+1):''}`;items=[{exerciseId:'run',sets:1,reps:runSteps.reduce((n,r)=>n+r.seconds,0)/60,rest:0,kg:null,note:'Log the total time, including the walking intervals. Follow the steps at an easy pace.'}];}
 else if(youth){title='Youth foundation '+(slot%2?'B':'A');const ids=slot%2?[db?'squat':'bw-squat','bridge','pushup',gym?'pulldown':db?'row':'band-row','calf','deadbug']:['bw-squat','bridge','pushup',db?'row':'band-row','split','deadbug'];items=ids.map((exerciseId,index)=>({exerciseId,sets:week>=4&&index<week-3?2:1,reps:8,rest:90,kg:null,note:'Your supervisor chooses the exercise variation and a light starting weight. Take more rest when needed.'}));}
 else if(template==='AT03'){title='Strength '+['A','B','C'][slot];const ts=recipes.adult.find(x=>x.id==='AT03')!.sessions[slot];items=strengthMenus[slot].map((exerciseId,j)=>{const item=ts.slots![j];const primary=item.reps[0]===3,secondary=item.reps[0]===5;return{exerciseId,sets:item.sets,reps:primary?[3,4,5,3,4,5][cycle]:secondary?[5,6,7,8,8,8][cycle]:[8,9,10,11,12,12][cycle],rest:item.rest_seconds,kg:null}});}
 else if(template==='AT02'){title=['Upper A','Lower A','Upper B','Lower B'][slot];const ts=recipes.adult.find(x=>x.id==='AT02')!.sessions[slot%2];items=hypertrophyMenus[slot].map((exerciseId,j)=>{const item=ts.slots![j];return{exerciseId,sets:item.sets,reps:item.reps[0]===10?[10,11,12,13,14,15][cycle]:[8,9,10,11,12,12][cycle],rest:item.rest_seconds,kg:null}});}
 else {title=(template==='AT04'?'Home foundation ':'Full-body ')+(slot%2?'B':'A');const ids=template==='AT04'?home:slot%2?foundationB:foundationA;items=ids.map((exerciseId,j)=>{const trunk=exerciseId==='deadbug',calf=exerciseId==='calf',push=template==='AT04'&&exerciseId==='pushup';return{exerciseId,sets:week===1?1:((template==='AT04'?j<4:j<4)?2:1),reps:trunk?[6,6,7,8,9,10][cycle]:calf?[10,10,11,12,13,14][cycle]:push?[6,6,7,8,9,10][cycle]:[8,8,9,10,11,12][cycle],rest:trunk?60:calf||exerciseId==='ohp'?90:120,kg:null}});}
 if(!tracking&&!run&&!youth)items=items.map(i=>rangeItem(i,template,title));
 const estimated=estimateSessionMinutes(items);
 const minutes=tracking?p.minutes:run?Math.ceil(runSteps!.reduce((n,r)=>n+r.seconds,0)/60):youth?Math.max(40,estimated):Math.max(template==='AT03'?50:template==='AT02'?60:30,estimated);
 if(minutes>p.minutes)return{plan:null,errors:[`${title} in week ${week} needs about ${minutes} minutes including work, rest and setup. Increase your time or choose a smaller foundation template.`]};
 const prior=run?(sessions.length?[sessions[sessions.length-1].id]:[]):priorByTitle[title]?.slice(youth?-2:-1)||[];
 const ss:Session={id:id+'-s'+index,date,week,title,kind:tracking?'Tracking':run?'Run/walk':'Strength',minutes,items,status:'scheduled',runSteps,dependsOn:tracking?[]:prior,progressionStep:tracking?'User-entered targets':run?'Accepted source sequence':youth?'Start with one controlled set. From week 4, add a second set to at most one exercise each time the workout repeats, after two comfortable sessions with your supervisor.':'Accepted repetition schedule; loads stay individually selected'};
 sessions.push(ss);priorByTitle[title]=[...(priorByTitle[title]||[]),ss.id];
 }
 if(!sessions.length)return{plan:null,errors:['This schedule has no workouts. Choose valid available weekdays.']};
 const conflict=sessions.filter(x=>events.some(e=>e.date===x.date));if(conflict.length)return{plan:null,errors:[`${conflict.length} proposed session(s) share a date with a fixed commitment. Change availability/start date or use tracking. No commitment was moved.`]};
 const label=tracking?(p.mode==='coach'?'Coach-directed tracking':'Manual training'):run?'Beginner run/walk':youth?`${p.sport} · youth foundation`:template==='AT02'?'Hypertrophy · upper/lower':template==='AT03'?'Strength · full body':p.goal==='sport'?`${p.sport} · general strength foundation`:template==='AT04'?'Calisthenics / home foundation':'Full-body foundation';
 const notes=tracking?['Empty session slots are placeholders. Add your coach’s or your own actual exercise targets before logging.','The app does not supply extra sessions, change the coach’s sets and reps, or infer skill from minutes.']:[youth?'Qualified youth instruction and supervision are required each session. A reported supervisor is not app-verified technique.':'Choose a starting weight after practicing the exercise, or use your recent results from the same exercise and setup.','The exercise selection and progression rules are this app’s choices, informed by the sources listed below.','All estimated session times include warm-up, rest, setup and transitions; actual required rest can be longer.'];
 if(!tracking&&template==='AT04')notes.push('This home template requires a resistance band and a suitable secure anchor for rows. If unavailable, use manual tracking or select equipment; do not improvise an anchor.');
 if(!tracking&&p.goal==='hybrid')notes.push('This block develops the strength foundation. Sprint and jump training remain a separate supervised module; selecting athleticism does not add unreviewed maximal work.');
 if(!tracking&&p.goal==='sport')notes.push('Sport and position provide context. This is a general foundation, not an independently validated position-specific prescription.');
 if(!tracking&&run)notes.push('Three nonconsecutive sessions. The accepted source sequence progresses only after the prior stage/session is completed; missing prerequisites wait. Thirty minutes of running is not a guaranteed 5 km.');
 const progression=tracking?'You or your coach decide when to change the targets.':youth?'Start with one set of 8 reps for the first three weeks. From week 4, a second set can be added to one more exercise each time the workout repeats. First, complete two comparable sessions that felt comfortable, with your supervisor’s confirmation. Reps and weight do not increase together. Missing workouts or feedback pause progression. Review weight or exercise changes separately.':run?'Accepted baseline: the displayed NHS run/walk sequence, in order. Complete the preceding session before advancing; a missed/partial session leaves progression waiting. Repeats, reductions and day moves are separate proposals.':RANGE_PROGRESSION;
 const phases=p.weeks<=3?[{name:'Foundation',weeks:`1–${p.weeks}`,description:'Find a comfortable starting point, follow the plan and review how it went.'}]:[{name:'Familiarize',weeks:'1–2',description:tracking?'Enter your workouts and build a regular logging habit.':run?'Find an easy running pace and get used to the walk breaks.':'Practice each exercise and find a weight you can control.'},{name:'Build',weeks:`3–${p.weeks-1}`,description:'Complete the earlier workouts before moving to the next targets.'},{name:'Review',weeks:String(p.weeks),description:'Use your workout history to choose your next plan or maintain your current routine.'}];
 return{errors:[],plan:{id,name:label,version:1,progressionModel:!tracking&&!run&&!youth?'ranges':undefined,profile:{...p,days},acceptedAt:null,sessions,phases,evidence:planEvidence({goal:p.goal,run:!!run,youth:!!youth,jumping:!!p.focuses?.includes('jumping')}),notes,progression,template,paused:false}};
}
export function latestSessionRecord(s:State,id:string){return s.history.filter(w=>w.sessionId===id&&w.finishedAt).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0))[0]}
export function competitionConflict(profile:Profile,date:string,events:Event[]):string|null{
 if(profile.mode!=='app')return null;
 const e=events.find(e=>e.kind==='Competition'&&dayDistance(date,e.date)>=0&&dayDistance(date,e.date)<=(e.priority==='Normal'?1:2));
 return e?`This date is protected for ${e.name} on ${niceDate(e.date)}. Review another training date. Competition buffers are app planning rules, not a guarantee of recovery.`:null;
}
export function eligibility(s:State,target:Session):string|null{
 if(!s.plan)return 'No active plan.';
 if(target.status!=='scheduled')return 'This session is already recorded or missed. Open its history instead.';
 if(target.needsReview)return 'An earlier workout changed. Review this workout’s targets before continuing.';
 if(s.plan.paused)return 'Your plan is paused.';
 if(s.events.some(e=>e.date===target.date))return 'A fixed commitment conflicts with this date. Review the schedule first.';
 if(s.plan.profile.mode!=='app')return target.items.length?null:'Add the coach’s or your own exercises and targets before starting.';
 if(s.hold)return 'Automated recommendations are on hold after a reported concern.';
 const competitionIssue=competitionConflict(s.plan.profile,target.date,s.events);if(competitionIssue)return competitionIssue;
 const focusIssue=focusScheduleConflict(s.plan,s.events,target);if(focusIssue)return focusIssue;
 if(s.plan.profile.age<18&&!s.plan.profile.supervision)return 'Qualified supervision is required for this youth pathway.';
 for(const dep of target.dependsOn||[]){const expected=s.plan.sessions.find(x=>x.id===dep),work=latestSessionRecord(s,dep);
 if(!expected||!work||work.partial)return 'Progression is waiting for a missed or incomplete prerequisite. Review a repeat or return option; no fitness loss is assumed.';
 if(s.plan.profile.age<18&&target.items.some(i=>i.sets>1)&&expected?.items.some(i=>i.sets===1)&&(work.effort!=='right'&&work.effort!=='easier'||work.symptom!=='no'))return 'More sets wait for two comfortable supervised sessions with no reported symptoms. Review a repeat if that feedback is missing.';
 if(s.plan.profile.age<18&&!work.supervisorConfirmed)return 'Progression waits for the reported qualified supervisor’s confirmation for comparable work.';
 if(expected.items.some(i=>isLoadTracked(exFor(i.exerciseId,s.custom))&&work.sets.some(x=>x.exerciseId===i.exerciseId&&x.done&&x.kg===null)))return 'Record the actual load for loaded exercises before using this history to advance. Unknown load stays unknown.';
 if(expected.items.some(i=>{const logs=work.sets.filter(x=>x.exerciseId===i.exerciseId&&x.done);return logs.length<i.sets||logs.some(x=>x.reps<i.reps)}))return 'The earlier workout’s targets are unfinished. Review a repeat or an easier target before moving on.';
 }
 return null;
}
export function initialState():State{const p={...blankProfile,goal:'strength',programId:undefined};const today=new Date().getDay();p.days=[today,(today+2)%7,(today+4)%7].sort();const plan=buildPlan(p).plan!;plan.acceptedAt=new Date().toISOString();return{schema:2,profile:p,plan,history:[],active:null,proposals:[],events:[],custom:[],ratings:{},audit:[],saved:[],checkins:true,soreness:false,hold:false,simulatedOffline:false}}
export function nextSession(s:State){return s.plan?.sessions.filter(x=>x.status==='scheduled').sort((a,b)=>a.date.localeCompare(b.date))[0]}
// Keeps every open proposal and the 50 newest resolved ones. Proposals are stored newest first.
// Without this, resolved proposals accumulate until the saved-state schema rejects every save.
export function pruneProposals(list:State['proposals']):State['proposals']{let resolved=0;return list.filter(p=>p.status==='pending'||p.status==='queued'||resolved++<50)}
export function changed(s:State,message:string){return {...s,audit:[{at:new Date().toISOString(),message},...s.audit].slice(0,150),proposals:pruneProposals(s.proposals)}}
export function makeProposal(s:State,type:Proposal['type'],input?:string):Proposal|null{
 const plan=s.plan,session=nextSession(s);if(!plan||!session||plan.profile.mode!=='app'||s.hold||plan.paused)return null;
 if(type==='capacity')return makeCapacityProposal(s);
 if(type==='load')return makeLoadProposal(s).proposal||null;
 if(type==='ranges')return makeRangeProposal(s);
 if(type==='move')return input?makeMoveProposal(s,session.id,input,false).proposal||null:null;
 let title='Adjust next session',reason='',before='',after='',patch:Partial<Session>={};
 if(type==='return'&&Boolean(session.runSteps)){const first=plan.sessions.find(x=>x.runSteps)!;title='Restart with the opening run/walk stage';reason='After an interruption, review the opening source sequence before resuming. This conservative prototype choice does not estimate fitness loss.';before=session.title;after='Opening run/walk stage · review later progression';patch={items:first.items.map(i=>({...i})),runSteps:first.runSteps,title:first.title+' · restart',minutes:first.minutes,dependsOn:[],needsReview:false};}
 else if(type==='return'){title='Resume with a shorter familiar session';reason='Your recent training needs context. This conservative restart choice is a prototype default, not a calculated loss of fitness.';before=`${session.items.reduce((n,i)=>n+i.sets,0)} working sets`;patch={items:session.items.map(i=>({...i,sets:Math.min(i.sets,1),kg:null,loadContext:undefined})),dependsOn:[],needsReview:false};after=`${patch.items!.reduce((n,i)=>n+i.sets,0)} working sets · choose a manageable load again`}
 else if(type==='sets'&&Boolean(session.runSteps)){const previous=plan.sessions.filter(x=>x.runSteps&&x.date<session.date&&x.status==='completed').at(-1)||plan.sessions.find(x=>x.runSteps)!;title='Repeat the familiar run/walk stage';reason='Harder-than-expected feedback can justify repeating a familiar stage. This is a proposed repeat, not an automatic percentage cut.';before=session.title;after=previous.title+' · repeat';patch={items:previous.items.map(i=>({...i})),runSteps:previous.runSteps,title:previous.title+' · repeat',minutes:previous.minutes,dependsOn:[],needsReview:false};}
 else if(type==='sets'){const index=session.items.findIndex(i=>i.sets>1);if(index<0)return null;title='Reduce the next session’s work';reason='You reported that the session was harder than expected. One report does not measure recovery; this is a small, reversible option.';const old=session.items[index];before=`${exFor(old.exerciseId,s.custom).name}: ${old.sets} sets`;patch={items:session.items.map((i,j)=>j===index?{...i,sets:i.sets-1}:i)};after=`${exFor(old.exerciseId,s.custom).name}: ${old.sets-1} sets · same load and reps`}
 else if(type==='substitute')return null; // Replaced by curated, version-checked equipment substitution previews.
 else{const index=session.items.findIndex(i=>exFor(i.exerciseId,s.custom).metric==='reps'&&s.history.some(w=>!w.partial&&w.sets.filter(x=>x.exerciseId===i.exerciseId&&x.done).length>=i.sets&&w.sets.filter(x=>x.exerciseId===i.exerciseId&&x.done).every(x=>x.reps>=i.reps&&(!isLoadTracked(exFor(i.exerciseId,s.custom))||x.kg!==null)))); if(index<0)return null;const old=session.items[index];title='Add one repetition per set';reason='You marked the workout easier than expected. Check your recent sets and technique before adding a rep. One extra rep is this app’s suggested step.';before=`${exFor(old.exerciseId,s.custom).name}: ${old.sets} × ${old.reps}`;after=`${old.sets} × ${old.reps+1} · same load`;patch={items:session.items.map((i,j)=>j===index?{...i,reps:i.reps+1}:i)}}
 let continuation:Proposal['changes'];
 if(type==='return'){
  if(s.active)return null;
  const previous:Record<string,string>={};
  const openingRun=plan.sessions.find(x=>x.runSteps);
  continuation=plan.sessions.filter(x=>x.status==='scheduled'&&x.date>=session.date).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>{
   const running=!!x.runSteps,key=running?'run':x.roleId||x.title.replace(' · review week','');
   const items=running&&openingRun?openingRun.items.map(i=>({...i})):x.items.map(i=>({...i,sets:1,kg:null,loadContext:undefined}));
   const next:Partial<Session>={items,dependsOn:previous[key]?[previous[key]]:[],needsReview:false,progressionStep:'Reviewed return block: repeat the displayed manageable work. More work needs another accepted change.'};
   if(running&&openingRun){next.runSteps=openingRun.runSteps;next.minutes=openingRun.minutes;next.title='Return · repeat opening walk/run';}
   else next.minutes=Math.min(x.minutes,estimateSessionMinutes(items,x.timeProfile==='brief',s.custom));
   previous[key]=x.id;return {sessionId:x.id,patch:next};
  });
  patch=continuation[0]?.patch||patch;title='Review a shorter return block';
  reason='Resume with one work set per strength exercise and the opening walk/run sequence where applicable. The remaining block repeats this reduced work, without an automatic ramp back. Your dates and completed records stay unchanged. This is a conservative planning option, not medical clearance.';
  before=continuation.length+' remaining scheduled workouts';after=continuation.length+' shorter workouts · choose manageable loads again · no automatic return to prior volume';
 }
 return{id:uid('proposal'),title,reason,type,planId:plan.id,baseVersion:plan.version,historyCount:s.history.length,sessionId:session.id,before,after,status:'pending',patch,...(continuation?{changes:continuation}:{}),source:plan.evidence[0],createdAt:new Date().toISOString()};
}
export function applyProposal(s:State,id:string):{state:State;error?:string}{
 const p=s.proposals.find(x=>x.id===id);if(!p||p.status!=='pending')return{state:s,error:'This proposal is no longer pending.'};
 const stale=(message:string)=>({state:{...s,proposals:s.proposals.map(x=>x.id===id?{...x,status:'stale' as const}:x)},error:message});
 if(!s.plan||s.plan.id!==p.planId||s.plan.version!==p.baseVersion||(p.historyCount!==undefined&&p.historyCount!==s.history.length))return stale('The plan or history changed. Create a fresh preview.');
 if(p.type==='substitute')return stale('This older substitute preview is no longer supported. Choose a substitute beside the exercise to review its equipment, targets and separate history.');
 if(p.eventSignature!==undefined&&p.eventSignature!==eventSignature(s))return stale('Your commitments changed. Preview these dates again.');
 if(p.type!=='move'&&(s.hold||s.plan.paused))return{state:s,error:'Automated training changes are on hold or paused.'};
 if(p.type!=='move'&&s.plan.profile.mode!=='app')return{state:s,error:'Coach-directed and manual targets stay under your control.'};
 const changes=p.changes||[{sessionId:p.sessionId,patch:p.patch}];
 if(p.type==='move'){if(changes.some(c=>Object.keys(c.patch).some(k=>k!=='date')))return stale('A date change cannot alter workout targets or history. Preview it again.');}
 else {const expected=p.type==='ranges'?makeRangeProposal(s):p.type==='load'?makeLoadProposal(s).proposal:makeProposal(s,p.type);if(!expected||!sameData(changes,expected.changes||[{sessionId:expected.sessionId,patch:expected.patch}]))return stale('This change does not match a current, checked training proposal. Preview it again.');}
 if(!changes.length||new Set(changes.map(c=>c.sessionId)).size!==changes.length)return{state:s,error:'This preview is invalid. Create a fresh one.'};
 for(const c of changes){const x=s.plan.sessions.find(x=>x.id===c.sessionId);if(!x||x.status!=='scheduled'||s.active?.sessionId===x.id||s.history.some(w=>w.sessionId===x.id&&w.finishedAt))return stale('A selected session has started, finished or been skipped. Preview again.');if(c.beforeDate&&c.beforeDate!==x.date)return stale('A date changed. Preview again.');}
 if(p.type==='move'){const error=checkSchedule(s,changes);if(error)return{state:s,error};}
 if(p.type==='load'){const ss=s.plan.sessions.find(x=>x.id===p.sessionId);for(const next of p.patch.items||[]){const old=ss?.items.find(i=>i.exerciseId===next.exerciseId);if(old&&next.kg!==old.kg){const latest=loadSuggestion(s,old);if(latest.nextKg===undefined||next.kg===null||Math.abs(latest.nextKg-next.kg)>1e-6)return stale('The load evidence or equipment changed. Review a fresh load suggestion.');}}}
 if(s.simulatedOffline)return{state:changed({...s,proposals:s.proposals.map(x=>x.id===id?{...x,status:'queued'}:x)},'Offline acceptance queued; targets unchanged.'),error:'Queued only. Reconnect, review and confirm before anything changes.'};
 const affected=new Set<string>();if(!['move','ranges','load','capacity'].includes(p.type)){affected.add(p.sessionId);for(const ss of s.plan.sessions)if(ss.dependsOn?.some(id=>affected.has(id)))affected.add(ss.id)}
 const sessions=s.plan.sessions.map(x=>{const c=changes.find(c=>c.sessionId===x.id);return c?{...x,...c.patch}:affected.has(x.id)?{...x,needsReview:true}:x}).sort((a,b)=>a.date.localeCompare(b.date));
 const plan:Plan={...s.plan,version:s.plan.version+1,sessions,scheduleEnd:sessions.at(-1)?.date,...(p.type==='ranges'?{progressionModel:'ranges' as const,progression:RANGE_PROGRESSION}:{})};
 return{state:changed({...s,plan,proposals:s.proposals.map(x=>x.id===id?{...x,status:'accepted'}:x.status==='pending'||x.status==='queued'?{...x,status:'stale'}:x)},`Accepted: ${p.title}. ${changes.length} session(s) updated. Completed history unchanged.`)};
}
export function validateImport(raw:string):{exercises?:Exercise[];error?:string}{
 if(raw.length>100000)return{error:'This import is too large. Use up to 30 exercises and 100,000 characters.'};
 try{const data=JSON.parse(raw);if(!Array.isArray(data.exercises)||data.exercises.length<1||data.exercises.length>30)return{error:'Use an exercises array containing 1–30 items.'};
 const clean:Exercise[]=[];for(const e of data.exercises){if(typeof e.name!=='string'||e.name.trim().length<2||e.name.length>100||!['reps','seconds','minutes'].includes(e.metric))return{error:'Each exercise needs a name (2–100 characters) and metric: reps, seconds, or minutes.'};clean.push({id:uid('custom'),name:e.name.trim(),pattern:'Custom',equipment:'Custom',metric:e.metric,cues:['User-provided exercise. Automated progression and technique assessment are unavailable.'],custom:true})}return{exercises:clean};}catch{return{error:'This is not valid JSON. No changes were made.'}}
}

export const RANGE_PROGRESSION='Stay within the listed rep range and finish most sets with about 2–3 good reps left. Keep the weight steady while you build reps. After two comparable workouts at the top of the range with at least 2 reps left, review a small weight increase and return to the lower end of the range. These thresholds are this app’s rules. Weight changes based on feedback, and all date changes, need your approval.';
export function validDay(v:string){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const [y,m,d]=v.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));return y>=1900&&y<=2200&&x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d;}
export function dayDistance(a:string,b:string){if(!validDay(a)||!validDay(b))return NaN;const parse=(x:string)=>{const [y,m,d]=x.split('-').map(Number);return Date.UTC(y,m-1,d)};return (parse(b)-parse(a))/86400000;}
export function rangeItem(i:Item,template:string,title=''):Item{if(exFor(i.exerciseId).metric!=='reps')return{...i};let lo=i.repMin,hi=i.repMax;if(lo===undefined||hi===undefined){if(template==='AT03'&&['bar-squat','bench','deadlift','ohp'].includes(i.exerciseId)&&i.reps<=8){const main=(title==='Strength A'&&['bar-squat','bench'].includes(i.exerciseId))||(title==='Strength B'&&i.exerciseId==='deadlift');[lo,hi]=main?[3,5]:[5,8];}else if(template==='AT03')[lo,hi]=[8,12];else if((template==='AT02'&&['calf','lateral','curl','triceps','leg-curl','leg-extension'].includes(i.exerciseId))||i.exerciseId==='calf')[lo,hi]=[10,15];else if(i.exerciseId==='deadbug')[lo,hi]=template==='AT02'?[8,12]:[6,10];else if(template==='AT04'&&i.exerciseId==='pushup')[lo,hi]=[6,12];else[lo,hi]=[8,12];}return{...i,repMin:lo,repMax:hi,reps:lo!};}
export function targetText(i:Item){const base=i.repMin!==undefined&&i.repMax!==undefined?(i.repMin===i.repMax?String(i.repMin):`${i.repMin}–${i.repMax}`):String(i.reps);return base+(i.note?.includes('[AMRAP]')?` · last set ${i.reps}+`:'')}
export function loadConvention(id:string,custom:Exercise[]=[]){return exFor(id,custom).loadConvention||'Not configured. Choose a logging convention before enabling progression.'}
export function exerciseRecords(s:State,id:string){return s.history.filter(w=>w.finishedAt&&Array.isArray(w.sets)&&w.sets.some(x=>x.exerciseId===id&&x.done)).sort((a,b)=>b.date.localeCompare(a.date)||(b.finishedAt||0)-(a.finishedAt||0));}
export function comparableSet(x:SetLog){return !['Left','Right','Alternating'].includes(x.metrics?.side||'')&&!(x.metrics?.assistanceKg&&x.metrics.assistanceKg>0)}
// Exercise reps-in-reserve for progression and estimates. Per-set RIR counts only when every completed set has a whole number;
// the lowest value (closest to failure) is used. Older workouts keep their exercise-level value.
export function exerciseRir(w:Workout,id:string):number|null|undefined{const done=w.sets.filter(x=>x.exerciseId===id&&x.done);if(done.length&&done.every(x=>typeof x.rir==='number'))return Math.min(...done.map(x=>x.rir as number));return w.rir?.[id]}
export function equipmentLimit(s:State,exerciseId:string):number|undefined{
 const e=exFor(exerciseId,s.custom),setup=requiresSetup(e)?s.loadContext?.[exerciseId]||'':'';
 const exact=s.equipmentCaps?.find(c=>c.exerciseId===exerciseId&&c.setup===setup)?.maxKg;
 const dumbbell=e.equipment==='Dumbbell'?s.profile.dumbbellMaxKg:undefined;
 const limits=[exact,dumbbell].filter((n):n is number=>n!==undefined&&Number.isFinite(n)&&n>=0);
 return limits.length?Math.min(...limits):undefined;
}
export function setEquipmentLimit(s:State,exerciseId:string,maxKg:number|undefined):{state:State;error?:string}{
 const e=exFor(exerciseId,s.custom),setup=requiresSetup(e)?s.loadContext?.[exerciseId]||'':'';
 if(s.active)return{state:s,error:'Finish or save the active workout before changing equipment.'};
 if(!isLoadTracked(e)||(requiresSetup(e)&&!setup.trim()))return{state:s,error:'Choose a load-tracked exercise and label the exact machine setup first.'};
 if(maxKg!==undefined&&(!Number.isFinite(maxKg)||maxKg<0||maxKg>1500))return{state:s,error:'Enter a valid maximum load, or leave it blank if unknown.'};
 const rest=(s.equipmentCaps||[]).filter(c=>!(c.exerciseId===exerciseId&&c.setup===setup));
 if(maxKg!==undefined&&rest.length>=500)return{state:s,error:'This demo holds 500 equipment limits. Remove an unused limit first.'};
 return{state:changed({...s,equipmentCaps:maxKg===undefined?rest:[...rest,{exerciseId,setup,maxKg}],proposals:s.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)},'Updated equipment limit for '+e.name)};
}
export function loadSuggestion(s:State,i:Item):{kg:number|null;nextKg?:number;date?:string;reason:string;ready?:boolean;atCapacity?:boolean;coarseIncrement?:boolean}{
 const ex=exFor(i.exerciseId,s.custom);if(!ex.progressionEnabled||ex.metric!=='reps'||!isLoadTracked(ex))return{kg:null,reason:'Choose the resistance or assistance for this exact variation.'};
 if(s.hold)return{kg:null,reason:'Load suggestions are on hold after a concern.'};
 const limit=equipmentLimit(s,i.exerciseId);
 if(limit===0)return{kg:null,reason:'This equipment is marked unavailable. Choose an available substitute or update its limit.'};
 if(limit!==undefined&&i.kg!==null&&i.kg>limit+1e-6)return{kg:null,reason:'The accepted weight exceeds your equipment limit. Choose a manageable weight from the equipment available.'};
 if(i.kg!==null&&requiresSetup(ex)&&(!i.loadContext||i.loadContext!==s.loadContext?.[i.exerciseId]))return{kg:null,reason:'This weight was chosen for a different or unrecorded machine setup. Start light and check a suitable weight for this setup.'};
 if(i.kg!==null&&Number.isFinite(i.kg))return{kg:i.kg,reason:'Accepted load for this session. Reassess during your warm-up.'};
 if(s.plan?.profile.programId?.startsWith('ref-'))return{kg:null,reason:'Choose this load using the linked program’s rules. Source-specific progression is manual; history does not assign a weight.'};
 const records=exerciseRecords(s,i.exerciseId).filter(r=>{const t=r.targets?.find(t=>t.exerciseId===i.exerciseId);return t&&(t.loadRole||'')===(i.loadRole||'')&&(t.repMin??t.reps)===(i.repMin??i.reps)&&t.repMax===i.repMax&&(!requiresSetup(ex)||r.loadContext?.[i.exerciseId]===s.loadContext?.[i.exerciseId]);}),w=records[0];const machine=requiresSetup(ex);if(machine&&!s.loadContext?.[i.exerciseId])return{kg:null,reason:'Add the machine and setup label above the set log, then record work with that setup before reusing its load.'};if(!w)return{kg:null,reason:'No comparable history for this range and setup yet. Start with a controllable light resistance, then record the actual load.'};
 const log=w.sets.filter(x=>x.exerciseId===i.exerciseId&&x.done),kg=log[0]?.kg,lo=i.repMin??i.reps;
 if(w.partial||['yes','unsure'].includes(w.symptom||'')||w.effort==='harder'||log.length<i.sets||kg===null||kg===undefined||kg<=0||log.some(x=>x.kg!==kg||x.reps<lo||!comparableSet(x)))return{kg:null,date:w.date,reason:'Your recent sets do not give us a reliable starting weight for this target. Check your history, then start light and adjust during the warm-up.'};
 if(dayDistance(w.date,day())<0||dayDistance(w.date,day())>35)return{kg:null,date:w.date,reason:'Your last matching workout was over five weeks ago. Review your return plan and check a manageable starting weight.'};
 if((s.plan?.profile.age??s.profile.age)<18)return{kg:null,date:w.date,reason:'Youth loads need the qualified supervisor’s selection; the history remains available.'};
 if(limit!==undefined&&kg>limit+1e-6)return{kg:null,date:w.date,reason:'The previous weight exceeds your equipment limit. Choose an available weight you can control. Your past records stay the same.'};
 const hi=i.repMax;if(hi===undefined)return{kg,date:w.date,reason:'Weight from your last matching workout. Preview rep ranges to build reps before increasing the weight.'};
 const successful=(r:Workout)=>{const a=r.sets.filter(x=>x.exerciseId===i.exerciseId&&x.done),target=r.targets?.find(t=>t.exerciseId===i.exerciseId);return (!machine||r.loadContext?.[i.exerciseId]===s.loadContext?.[i.exerciseId])&&!r.partial&&r.symptom==='no'&&r.effort!=='harder'&&dayDistance(r.date,day())<=35&&target?.repMax===hi&&target?.repMin===lo&&a.length>=i.sets&&a.every(x=>x.kg===kg&&x.reps>=hi&&comparableSet(x))&&(exerciseRir(r,i.exerciseId)??-1)>=2;};
 const ready=records.length>=2&&records.slice(0,2).every(successful),step=s.incrementKg?.[i.exerciseId];
 if(!ready)return{kg,date:w.date,reason:'Repeat this recent load and build reps within the range. A load increase waits for two comparable top-of-range sessions and effort feedback.'};
 if(limit!==undefined&&(kg>=limit-1e-6||(step&&kg+step>limit+1e-6)))return{kg,date:w.date,ready:true,atCapacity:true,reason:'You reached this equipment’s limit or its next available step would exceed it. Keep this load. For muscle-focused work, review a wider rep range; for heavy strength, choose suitable heavier equipment or maintain. This is an equipment limit, not a strength plateau.'};
 if(!step||!Number.isFinite(step)||step<=0)return{kg,date:w.date,ready:true,reason:'Top-of-range work is consistent. Enter the smallest available equipment increase to preview the next load.'};
 if(step/kg>.05+1e-8)return{kg,date:w.date,ready:true,coarseIncrement:true,reason:'The next equipment step exceeds this app’s 5% automatic-increase limit. Keep the load; muscle-focused work can use a reviewed wider rep range. For heavier strength work, review a substitute or check an available weight during your warm-up. No heavier weight is assigned automatically.'};
 return{kg,nextKg:Math.round((kg+step)*100000)/100000,date:w.date,ready:true,reason:'Two comparable top-of-range sessions with at least 2 reps left. Review the next available load; restart near the lower rep target.'};
}
function proposalBase(s:State,type:Proposal['type'],sessionId:string):Proposal{return{id:uid('proposal'),title:'Review change',reason:'',type,planId:s.plan!.id,baseVersion:s.plan!.version,historyCount:s.history.length,sessionId,before:'',after:'',status:'pending',patch:{},source:s.plan!.evidence[0],createdAt:new Date().toISOString()}}
export function makeLoadProposal(s:State):{proposal?:Proposal;error?:string}{
 if(!s.plan||s.plan.profile.mode!=='app'||s.plan.profile.age<18||s.hold||s.plan.paused)return{error:'Automatic load increases require an adult app-directed plan without a hold. Youth loads stay with the supervisor.'};
 for(const ss of s.plan.sessions.filter(x=>x.status==='scheduled'&&!x.needsReview&&x.id!==s.active?.sessionId).sort((a,b)=>a.date.localeCompare(b.date)))for(const item of ss.items){const a=loadSuggestion(s,item);if(a.nextKg!==undefined){const p=proposalBase(s,'load',ss.id);return{proposal:{...p,title:'Increase '+exFor(item.exerciseId,s.custom).name,reason:a.reason+' The app waits for two matching workouts and limits a suggested weight increase to 5%.',before:displayLoad(a.kg,s.profile.units)+' · '+targetText(item)+' reps',after:displayLoad(a.nextKg,s.profile.units)+' · restart at '+(item.repMin??item.reps)+' reps',patch:{items:ss.items.map(i=>i===item?{...i,kg:a.nextKg!,loadContext:s.loadContext?.[i.exerciseId],reps:i.repMin??i.reps}:i)}}};}}
 const capacity=makeCapacityProposal(s);if(capacity)return{proposal:capacity};
 return{error:'No load increase is ready. Use a rep-range plan, log two comparable complete top-of-range sessions with exercise effort and no symptoms, then enter an available load step. Suggested repeat loads are shown in session details.'};
}
export function makeCapacityProposal(s:State):Proposal|null{
 const plan=s.plan;if(!plan||plan.profile.mode!=='app'||plan.profile.age<18||s.active||s.hold||plan.paused||['powerlifting','strength'].includes(plan.profile.goal))return null;
 const considered=new Set<string>();
 for(const ss of plan.sessions.filter(x=>x.status==='scheduled'&&!x.needsReview).sort((a,b)=>a.date.localeCompare(b.date)))for(const item of ss.items){
  const a=loadSuggestion(s,item),hi=item.repMax;
  if((!a.atCapacity&&!a.coarseIncrement)||!a.ready||a.kg===null||hi===undefined||hi<10||hi>=20)continue;
  const roleKey=JSON.stringify([ss.roleId||ss.title,item.exerciseId,item.repMin,hi,item.loadRole]);if(considered.has(roleKey))continue;considered.add(roleKey);
  const nextHi=hi<15?15:20,nextLo=hi;
  const matches=plan.sessions.filter(x=>x.status==='scheduled'&&!x.needsReview&&x.date>=ss.date&&(x.roleId||x.title)===(ss.roleId||ss.title));
  const changes:NonNullable<Proposal['changes']>=[];let fits=true;
  for(const x of matches){const old=x.items.find(i=>i.exerciseId===item.exerciseId&&i.repMin===item.repMin&&i.repMax===hi&&(i.loadRole||'')===(item.loadRole||''));if(!old)continue;
   const items=x.items.map(i=>i===old?{...i,reps:nextLo,repMin:nextLo,repMax:nextHi,kg:null,loadContext:undefined,note:'Build reps with the equipment you have. Choose a weight that leaves 2–3 good reps left, and keep the same number of sets and the same rest.'}:i);
   const minutes=x.minutes+Math.max(0,estimateSessionMinutes(items,x.timeProfile==='brief')-estimateSessionMinutes(x.items,x.timeProfile==='brief'));
   if(minutes>plan.profile.minutes){fits=false;break;}changes.push({sessionId:x.id,patch:{items,minutes}});
  }
  if(!fits||!changes.length)continue;
  return{...proposalBase(s,'capacity',ss.id),title:a.coarseIncrement?'Build reps before a large equipment step':'Build reps within your equipment limit',reason:'Two comfortable top-of-range sessions support reviewing more reps. The new range is an app choice informed by rep-progression research. It does not replace heavy-load practice for maximal strength. Recalibrate; keep the same set count and rest.',source:'REP-PROGRESSION',before:exFor(item.exerciseId,s.custom).name+' · '+targetText(item)+' reps',after:nextLo+'–'+nextHi+' reps · '+changes.length+' future matching sessions · available load only',changes};
 }
 return null;
}
export function makeRangeProposal(s:State):Proposal|null{if(!s.plan||s.active||s.plan.profile.mode!=='app'||s.plan.profile.age<18||s.plan.template==='RUN-WALK'||s.plan.progressionModel==='ranges')return null;const sessions=s.plan.sessions.filter(x=>x.status==='scheduled');if(!sessions.length)return null;return{...proposalBase(s,'ranges',sessions[0].id),title:'Use rep ranges for future strength sessions',reason:RANGE_PROGRESSION,before:'Fixed repetition targets',after:'Goal-specific rep ranges · existing sets and dates retained',changes:sessions.map(x=>({sessionId:x.id,patch:{items:x.items.map(i=>rangeItem(i,s.plan!.template,x.title)),progressionStep:'Accepted rep range; load changes need approval.'}}))};}
export function eventSignature(s:State){return JSON.stringify(s.events.map(e=>({id:e.id,date:e.date,kind:e.kind,priority:e.priority})).sort((a,b)=>a.id.localeCompare(b.id)))}
export function checkSchedule(s:State,changes:NonNullable<Proposal['changes']>):string|null{
 if(!s.plan)return 'No plan to move.';const ids=new Set(changes.map(c=>c.sessionId));const all=s.plan.sessions.map(x=>({...x,...changes.find(c=>c.sessionId===x.id)?.patch}));
 for(const c of changes){const old=s.plan.sessions.find(x=>x.id===c.sessionId),x=all.find(x=>x.id===c.sessionId)!;if(!old||old.status!=='scheduled'||s.active?.sessionId===old.id)return 'Only unstarted scheduled sessions can move.';if(!validDay(x.date)||x.date<day()||x.date<s.plan.profile.start)return 'Choose a real date on or after today and the block start.';if(s.events.some(e=>e.date===x.date))return `${niceDate(x.date)} has a fixed commitment. Pick another date; commitments are never moved.`;
  const competitionIssue=competitionConflict(s.plan.profile,x.date,s.events);if(competitionIssue)return competitionIssue;
  if(all.some(y=>y.id!==x.id&&y.status!=='missed'&&y.date===x.date))return `${niceDate(x.date)} already has a workout. Select “Shift this and later workouts” or another date.`;
 }
 for(const x of all){if(x.dependsOn?.some(id=>{const y=all.find(z=>z.id===id);return y&&(ids.has(x.id)||ids.has(y.id))&&y.date>=x.date}))return 'This move would reverse progression order. Shift later workouts together or choose another date.';}
 const reference=programReferences.find(r=>r.id===s.plan!.profile.programId);
 if(reference?.nonconsecutive)for(const x of all.filter(x=>ids.has(x.id)))for(const y of all.filter(y=>y.id!==x.id&&y.status!=='missed')){const actual=(s.active?.sessionId===y.id?s.active.date:undefined)||latestSessionRecord(s,y.id)?.date||y.date;if(Math.abs(dayDistance(x.date,actual))<2)return 'This source routine requires a recovery day between workouts. Choose a more separated date.';}
 const requiresRest=s.plan.profile.mode==='app';if(requiresRest)for(const x of all.filter(x=>ids.has(x.id)))for(const y of all.filter(y=>y.id!==x.id&&y.status!=='missed')){const full=!x.recoveryGroup&&!y.recoveryGroup&&s.plan.template!=='AT02',sameRegion=x.recoveryGroup&&y.recoveryGroup?x.recoveryGroup===y.recoveryGroup:x.title.split(' ')[0]===y.title.split(' ')[0];const actual=(s.active?.sessionId===y.id?s.active.date:undefined)||latestSessionRecord(s,y.id)?.date||y.date;if(!(s.plan.template==='RNBASE4'&&x.recoveryGroup==='run'&&y.recoveryGroup==='run')&&(full||sameRegion)&&Math.abs(dayDistance(x.date,actual))<2)return 'The move would remove the recovery day between comparable sessions. Shift later workouts together or choose a more separated date.';}
 for(const x of all.filter(x=>x.status==='scheduled')){const issue=focusScheduleConflict({...s.plan,sessions:all},s.events,x);if(issue)return issue;}
 return null;
}
export function makeMoveProposal(s:State,sessionId:string,date:string,cascade:boolean):{proposal?:Proposal;error?:string}{
 if(!s.plan)return{error:'Create a plan first.'};const ss=s.plan.sessions.find(x=>x.id===sessionId);if(!ss||ss.status!=='scheduled'||s.active?.sessionId===ss.id)return{error:'Choose an unstarted scheduled workout.'};if(!validDay(date))return{error:'Choose a valid calendar date.'};const delta=dayDistance(ss.date,date);if(!delta)return{error:'Choose a different date.'};if(Math.abs(delta)>90)return{error:'For a change over 90 days, review a new block instead.'};
 const moving=cascade?s.plan.sessions.filter(x=>x.status==='scheduled'&&x.date>=ss.date):[ss];const changes=moving.map(x=>({sessionId:x.id,beforeDate:x.date,patch:{date:addDays(x.date,delta)}}));const error=checkSchedule(s,changes);if(error)return{error};
 const oldEnd=s.plan.sessions.map(x=>x.date).sort().at(-1)!;const end=s.plan.sessions.map(x=>changes.find(c=>c.sessionId===x.id)?.patch.date||x.date).sort().at(-1)!;const warnings:string[]=[];if(end!==oldEnd)warnings.push(`Last workout: ${niceDate(oldEnd)} → ${niceDate(end)}. This changes calendar duration, not the training amount.`);const off=moving.filter(x=>!s.plan!.profile.days.includes(new Date(addDays(x.date,delta)+'T12:00:00').getDay())).length;if(off)warnings.push(`${off} shifted workout(s) fall outside your original weekly availability. Confirm you can train on these dates.`);
 return{proposal:{...proposalBase(s,'move',ss.id),title:cascade?'Shift this and later workouts':'Move this workout',reason:'Review every affected date. Session order and recovery spacing are checked; fixed commitments and completed history stay in place.',before:`${moving.length} workout(s) · starts ${niceDate(ss.date)}`,after:`Starts ${niceDate(date)} · ${Math.abs(delta)} day(s) ${delta>0?'later':'earlier'}`,changes,warnings,eventSignature:eventSignature(s),patch:{date}}};
}
export function changeSessionStatus(s:State,id:string,status:'scheduled'|'missed'):{state:State;error?:string}{const x=s.plan?.sessions.find(x=>x.id===id);if(!x||s.active?.sessionId===id||s.history.some(w=>w.sessionId===id&&w.finishedAt))return{state:s,error:'An active or recorded workout cannot be changed this way.'};if(s.simulatedOffline)return{state:s,error:'Reconnect before changing the schedule.'};if(status==='scheduled'){const restored={...s,plan:{...s.plan!,sessions:s.plan!.sessions.map(y=>y.id===id?{...y,status}:y)}};const issue=checkSchedule(restored,[{sessionId:id,patch:{date:x.date}}]);if(issue)return{state:s,error:issue};}return{state:changed({...s,plan:{...s.plan!,version:s.plan!.version+1,sessions:s.plan!.sessions.map(x=>x.id===id?{...x,status}:x)},proposals:s.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)},status==='missed'?'Skipped a session. You can restore it.':'Restored a skipped session.')}};

// Days that follow each other in the week (Saturday to Sunday counts). Used to space the run-only base.
const adjacentPairs=(days:number[])=>{let n=0;for(let i=0;i<days.length;i++)for(let j=i+1;j<days.length;j++){const k=Math.abs(days[i]-days[j]);if(k===1||k===6)n++}return n};
function catalogDays(p:Profile,d:ProgramDefinition,events:Event[]=[]):number[]{
 const eventDates=new Set(events.map(e=>e.date));
 const available=[...new Set(p.days)].sort((a,b)=>a-b),combos:number[][]=[];
 function collect(i:number,a:number[]){if(a.length===d.days){combos.push(a);return}for(let j=i;j<available.length;j++)collect(j+1,[...a,available[j]])}collect(0,[]);
 const startDay=new Date(p.start+'T12:00:00').getDay();
 combos.sort((a,b)=>Math.min(...a.map(d=>(d-startDay+7)%7))-Math.min(...b.map(d=>(d-startDay+7)%7)));
 // Run-only base: prefer the fewest back-to-back days. Four runs in seven days must include at least one such pair.
 if(d.id==='RNBASE4')combos.sort((a,b)=>adjacentPairs(a)-adjacentPairs(b));
 for(const combo of combos){
  const assigned=combo.slice().sort((a,b)=>(a-startDay+7)%7-(b-startDay+7)%7);
  const groups=d.slots.map(x=>x.group);
  const fits=groups.every((g,i)=>groups.every((h,j)=>i===j||(d.id==='RNBASE4'&&g==='run'&&h==='run')||g!==h||!['full','upper','lower','run','push','pull','legs','chestback','shouldersarms'].includes(g)||![1,6].includes(Math.abs(assigned[i]-assigned[j]))))&&(d.id!=='RNBASE4'||adjacentPairs(combo)<=Math.max(0,d.days-3));
  if(fits&&!Array.from({length:p.weeks*7},(_,n)=>addDays(p.start,n)).some(date=>assigned.includes(new Date(date+'T12:00:00').getDay())&&eventDates.has(date)))return assigned;
 }return [];
}
export function buildCatalogPlan(p:Profile,events:Event[]):{plan:Plan|null;errors:string[]}{
 if(!p.programId){let first:{plan:Plan|null;errors:string[]}|undefined;for(const d of programCatalog.filter(d=>d.goal===p.goal)){const r=buildCatalogPlan({...p,programId:d.id},events);first??=r;if(r.plan)return r;}return first||{plan:null,errors:['No program is available for this goal.']};}
 const def=programCatalog.find(d=>d.id===p.programId&&d.goal===p.goal)||(!p.programId?programCatalog.find(d=>d.goal===p.goal):undefined);
 if(!def)return{plan:null,errors:['Choose a program that matches this training focus.']};
 const errors:string[]=[];
 if(p.noFloor&&!def.noFloor&&!(p.equipment==='Full gym'&&['QHY3','QHY4'].includes(def.id))&&p.goal!=='running')errors.push('This plan includes floor work. Choose a standing or seated foundation, or change your floor-work setting.');
 if(p.equipment==='No equipment'&&def.equipment!=='none'&&p.goal!=='running')errors.push('This plan needs equipment. Choose the no-equipment movement start under General fitness, or update your equipment.');
 if(p.age<18&&!def.youth)errors.push('These specialized templates are adult pathways. Choose supervised youth foundations or follow your coach’s program in tracking mode.');
 if(def.experience==='advanced'&&(p.experience!=='Experienced'||!p.establishedTraining))errors.push('This development block needs established technique and consistent recent training. Confirm that readiness in setup, or choose a foundation or build plan.');
 if(def.goal!=='running'&&def.experience==='some'&&p.experience==='First time')errors.push('This template needs established lifting experience. Choose a foundation in this discipline or coach-directed learning.');
 if(def.equipment==='gym'&&p.equipment!=='Full gym')errors.push('This program requires a full gym with the listed equipment: '+equipmentRequirements(def,p.equipment).join('; ')+'. The defining lifts will not be silently replaced.');
 if(p.goal!=='running'&&def.equipment==='dumbbells'&&p.equipment.startsWith('Bodyweight'))errors.push('This plan needs dumbbells and a stable support. Choose the home option or update your equipment.');
 if(def.equipment==='bodyweight-band'&&p.equipment==='Dumbbells')errors.push('This plan needs a resistance band, a secure anchor and a stable push-up support. Select Bodyweight + band or a full gym.');
 if(def.runBase&&!p.runBase)errors.push('Confirm an existing comfortable 30-minute running base, or choose Lift + run base. Lifting experience does not establish running readiness.');
 if(def.runBase){const requiredDays=def.id==='RNBASE4'?4:def.id==='HYDB4'?2:3,requiredMinutes=def.id==='RNBASE4'?100:def.id==='HYDB4'?50:70;if((p.runDays??0)<requiredDays||(p.runMinutes??0)<requiredMinutes)errors.push(`This running base needs at least ${requiredDays} recent running days and ${requiredMinutes} easy running minutes per week. Enter your current base or choose walk–run.`);}
 if(p.days.length<def.days)errors.push(`This template uses ${def.days} training days. Add availability or choose another template.`);
 if(p.age<18&&p.season==='In-season')errors.push('Use coach-directed tracking for in-season youth training.');
 const assigned=catalogDays(p,def,events);if(!assigned.length&&!errors.length)errors.push('These days cannot fit this split with separated repeated muscle-group or running sessions. Add other available days or review commitments.');
 if(errors.length)return{plan:null,errors};
 const id=uid('plan'),sessions:Session[]=[],previous:Record<string,string>={};
 for(let offset=0;offset<p.weeks*7;offset++){
  const date=addDays(p.start,offset),weekday=new Date(date+'T12:00:00').getDay(),slot=assigned.indexOf(weekday);if(slot<0)continue;
  const spec=def.slots[slot],week=Math.floor(offset/7)+1,deload=(def.wave&&week%4===0)||(week===p.weeks&&p.weeks>=6);
  let items:Item[]=spec.items.map(([exerciseId,sets,lo,hi,rest],index)=>{
   const strengthWave=!!def.wave&&index===0&&!spec.title.toLowerCase().includes('volume');
   const band=strengthWave?[[5,7],[4,6],[3,5],[6,8]][(week-1)%4]:[lo,hi];
   return {exerciseId,sets:deload?Math.max(1,Math.ceil(sets/2)):p.experience==='First time'&&week<=2?Math.min(sets,2):sets,reps:band[0],repMin:band[0],repMax:band[1],rest,kg:null,loadRole:spec.title+' / '+(strengthWave?'wave '+(week-1)%4:'work'),note:strengthWave?'The rep range changes this week. Choose a weight that leaves about 2–3 good reps left at the end of each set.':exerciseId==='bench'&&spec.title.includes('practice')?'Use a lighter weight for this practice set. We track these weights separately from your heavier bench work.':'Finish each set with about 2–3 good reps left (RIR). Start light while learning and stop if you lose control of the movement.'};
  });
  if(def.equipment==='flexible'||(def.brief&&def.equipment==='bodyweight-band'))items=items.map(i=>{const home=def.equipment==='bodyweight-band'||p.equipment==='Bodyweight + band',gym=p.equipment==='Full gym';const map:Record<string,string>=home?{'squat':'bw-squat','rdl':'bridge','lib-db-floor-press':'pushup','ohp':'pushup','row':'band-row'}:gym?{'squat':'lib-stack-leg-press','lib-db-floor-press':'lib-stack-chest-press','row':'lib-cable-seated-row'}:{};return {...i,exerciseId:map[i.exerciseId]||i.exerciseId};});
  if(def.brief&&p.minutes>=20&&!spec.kind){const expanded=items.map(i=>({...i,sets:p.age<18||deload?1:2}));if(estimateSessionMinutes(expanded,true)<=p.minutes)items=expanded;}
  let runSteps:Session['runSteps'];
  if(spec.kind==='brief-run'){runSteps=[{label:'Warm-up walk',seconds:300},...Array.from({length:5},()=>[{label:'Easy jog (or walk)',seconds:20},{label:'Recovery walk',seconds:40}]).flat(),{label:'Cool-down walk',seconds:300}];}
  else if(spec.kind==='walkrun'){
   const stage=Math.min(3,Math.floor((week-1)/2)),pairs=[[60,120,6],[90,90,6],[120,60,6],[180,90,4]][stage];
   runSteps=[{label:'Warm-up walk',seconds:300},...Array.from({length:pairs[2]},()=>[{label:'Conversational jog (or walk)',seconds:pairs[0]},{label:'Recovery walk',seconds:pairs[1]}]).flat(),{label:'Cool-down walk',seconds:300}];
  }else if(spec.kind==='easy'){
   const base=spec.title==='Longer easy run'?30:20;
   runSteps=[{label:'Warm-up walk',seconds:300},{label:'Conversational easy run',seconds:base*60},{label:'Cool-down walk',seconds:300}];
  }
  if(p.dumbbellMaxKg===0&&items.some(i=>exFor(i.exerciseId).equipment==='Dumbbell'))return{plan:null,errors:['This plan uses dumbbells but your available maximum is zero. Choose the bodyweight/band option or update your equipment.']};
  if(p.age<18)items=items.map(i=>({...i,sets:1,reps:8,repMin:8,repMax:12,note:'Your qualified supervisor chooses the manageable variation, load and reps within this range. No adult automatic load increases.'}));
  if(def.noFloor)items=items.map(i=>({...i,note:(i.note||'')+(i.exerciseId==='pushup'?' Use a wall push-up for this standing plan. Keep the wall and foot distance the same for comparisons.':['bw-squat','calf'].includes(i.exerciseId)?' Use steady support as needed. Record the same range and support each time.':'')}));
  if(spec.conditioning==='walkrun')items.push({exerciseId:'run',sets:1,reps:10,rest:0,kg:null,note:'After strength, walk easily for 2 minutes. Then repeat 20 seconds of easy jogging (or walking) and 40 seconds of walking six times. Finish with 2 easy walking minutes. Stay conversational; walking throughout is allowed. Log the whole 10-minute block. Duration stays fixed until a reviewed change.'});
  if(runSteps)items=[{exerciseId:'run',sets:1,reps:runSteps.reduce((n,x)=>n+x.seconds,0)/60,rest:0,kg:null,note:'Log your total time. Repeat this workout if it still feels too hard or you have not recovered. Keep an easy pace.'}];
  const minutes=runSteps?Math.ceil(runSteps.reduce((n,x)=>n+x.seconds,0)/60):estimateSessionMinutes(items,!!def.brief);
  if(minutes>p.minutes)return{plan:null,errors:[`${spec.title} needs about ${minutes} minutes including warm-up, rest and setup. Increase the time window; no defining work was dropped.`]};
  const key=runSteps?'run':spec.title,sessionId=id+'-s'+sessions.length;
  sessions.push({id:sessionId,date,week,recoveryGroup:spec.group,roleId:def.id+'-'+slot,timeProfile:def.brief?'brief':undefined,title:spec.title+(deload&&!runSteps?' · review week':''),kind:runSteps?'Run/walk':p.goal==='powerlifting'?'Powerlifting':p.goal==='hypertrophy'?'Hypertrophy':'Strength',minutes,items,runSteps,dependsOn:previous[key]?[previous[key]]:[],progressionStep:p.age<18?'One supervised work set per exercise; progression stays with the supervisor':runSteps?'Accepted easy-duration sequence; repeat when needed':'Rep ranges with approved load changes; review-week volume is preplanned',status:'scheduled'});previous[key]=sessionId;
 }
 const conflicts=sessions.filter(x=>events.some(e=>e.date===x.date));if(conflicts.length)return{plan:null,errors:[`${conflicts.length} sessions overlap a commitment or day off. Adjust availability, start date or commitments before accepting.`]};
 const notes=[def.description,'An original app plan informed by the sources below. It is not a copy of a creator’s program or endorsed by them. The app chooses the exercises, sets and progression rules; workout times are estimates.','Choose starting weights during practice or from recent results with the same exercise and setup. Use lighter weights for technique practice when needed.',def.wave?'You’ll do fewer work sets every fourth week and in the final week of plans lasting six weeks or longer. Check your weight whenever the rep range changes.':'Plans lasting six weeks or longer finish with fewer strength sets, keeping at least one per exercise. This lighter week is part of the schedule; it is not based on an assessment of your fatigue.', 'Equipment: '+equipmentRequirements(def,p.equipment).join('; '),'First-time lifters start with up to two work sets for the first two weeks. Finish the earlier workouts before adding the later sets. Choose weights from your recent performance, even if you have trained before.'];
 if(def.brief)notes.push('Short plans include fewer work sets. The time estimate includes preparation and rest, but learning an exercise may take longer. Keep the listed rest and skip catch-up sets. You do not need to fill every available minute.');
 if(p.age<18){notes.splice(notes.findIndex(n=>n.startsWith('First-time lifters')),1,'Youth brief sessions use one controlled work set per movement. The supervisor guides rep and resistance changes. This block does not automatically add load or adult set progressions.');}
 if(p.sex)notes.push('Sex does not set a starting weight or a fixed amount of work. Your actual work, preferences and recovery guide changes.');
 if(p.age>=65)notes.push('Age alone does not rule out strength work. Use the exercise support and range you can control; choose an accessible substitute when floor transfers or balance are difficult.');
 if(p.goal==='powerlifting')notes.push('Squat, bench press and deadlift remain primary. Use qualified instruction for unfamiliar lifts. This is a development block, not meet peaking, attempt selection or an automatic 1RM test.');
 if(p.goal==='hybrid')notes.push((def.slots.some(x=>x.conditioning)?'Strength comes first, then the listed ten-minute walk/jog finish on the same day. This low-volume introduction does not replace a higher-frequency running plan.':'Lifting and running are on separate days.')+' Running and strength targets have separate prerequisites. This is not a sprint program or a guarantee of race performance. Easy continuous-run durations remain stable in this base block. The walk–run sequence is app-authored, not the NHS program.');
 return{errors:[],plan:{id,name:def.name,version:1,progressionModel:'ranges',profile:{...p,programId:def.id,days:assigned.slice().sort((a,b)=>a-b)},acceptedAt:null,sessions,phases:catalogPhases(p,!!def.wave,!!def.brief),evidence:p.age<18?['NSCA-YOUTH',def.source]:['ACSM-2026',def.source],notes,progression:p.age<18?'Complete the displayed supervised practice. Your qualified supervisor chooses any change in reps or resistance. No maximum tests, adult automatic load increases or catch-up work.':(p.goal==='running'?'Keep the displayed easy durations. Repeat or reduce after feedback; increases need review.':RANGE_PROGRESSION)+(p.goal==='hybrid'?' Running follows its own displayed sequence; no universal weekly percentage increase.':''),template:def.id,paused:false}};
}

// One estimator for all strength plans: general warm-up / movement prep, work,
// between-set rest, setup transitions and a short finish. Practice sets are not logged as work.
export function estimateSessionMinutes(items:Item[],brief=false,custom:Exercise[]=[]):number{
 const seconds=(brief?6:13)*60+items.reduce((n,i)=>{const e=exFor(i.exerciseId,custom),perSide=/per side/i.test(e.loadConvention||'')?2:1;const work=e.metric==='minutes'?i.reps*60:e.metric==='seconds'?i.reps:(i.repMax??i.reps)*4*perSide;return n+i.sets*work+Math.max(0,i.sets-1)*i.rest+(brief?Math.max(60,i.rest):120)+(e.equipment==='Barbell'?120:0)},0);
 return Math.ceil(seconds/300)*5;
}
function catalogPhases(p:Profile,wave:boolean,brief=false):Plan['phases']{
 if(p.age<18)return[{name:'Supervised practice',weeks:`1–${p.weeks}`,description:'Do one controlled work set per exercise. Your supervisor chooses the weight and helps you practice. Repeat the workout when you need more practice.'}];
 if(p.weeks<=3)return [{name:'Learn and build',weeks:`1–${p.weeks}`,description:'Practice each movement, find manageable loads and review actual results before your next block.'}];
 if(wave)return [{name:'Strength waves',weeks:`1–${p.weeks}`,description:'The first lift uses a different rep range each week for three weeks, followed by a week with fewer sets. Choose a suitable weight for each range and finish the earlier workouts before advancing.'}];
 return [{name:'Find your starting weights',weeks:'1–2',description:brief?'Practice the listed movements and find a manageable load. Keep the small set count shown.':'Practice the movements. First-time lifters start with up to two work sets.'},{name:'Build',weeks:`3–${p.weeks>=6?p.weeks-1:p.weeks}`,description:brief?'Keep the displayed sets and rest. Build controlled reps within the range; any load change needs review.':'Keep the movements stable. Complete the preceding session before adding planned sets; build reps at a manageable load.'},...(p.weeks>=6?[{name:'Review',weeks:String(p.weeks),description:'Fewer work sets where possible, with at least one per movement. Review your recent training before choosing the next block.'}]:[])];
}

function sameData(a:unknown,b:unknown):boolean{const normalize=(v:unknown):unknown=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([,value])=>value!==undefined).sort(([a],[b])=>(a<b?-1:a>b?1:0)).map(([key,value])=>[key,normalize(value)])):v;return JSON.stringify(normalize(a))===JSON.stringify(normalize(b));}
