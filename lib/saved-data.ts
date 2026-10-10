import {z} from 'zod';
import {supersetFieldsError} from './training-focus';
import {validRecordTimeZone} from './record-identity';
import {type State,type Profile,type Event,validDay,exFor} from './training';
const strictObject=<T extends z.ZodRawShape>(shape:T)=>z.object(shape).strict();
const utc=z.string().max(35).refine(value=>{const time=Date.parse(value);return Number.isFinite(time)&&new Date(time).toISOString()===value},'Use an ISO UTC timestamp.');
const timeZone=z.string().max(100).refine(validRecordTimeZone,'Use a supported time zone.');
const text=z.string().max(6000),short=z.string().max(200),id=z.string().min(1).max(150),number=z.number().finite(),date=z.string().refine(validDay),bool=z.boolean();
const strings=z.array(short).max(500),map=<T extends z.ZodTypeAny>(v:T)=>z.record(v).refine(v=>Object.keys(v).length<=1500);
const profile=strictObject({noFloor:bool.optional(),age:number.min(14).max(100),goal:short,experience:short,mode:z.enum(['app','coach','manual']),minutes:number.min(5).max(1440),days:z.array(number.int().min(0).max(6)).max(7),weeks:number.int().min(1).max(52),start:date,equipment:short,sport:short,position:short,season:short,supervision:bool,units:z.enum(['kg','lb']),name:short,sex:z.enum(['female','male','intersex','unspecified']).optional(),dumbbellMaxKg:number.min(0).max(500).optional(),programId:short.optional(),runBase:bool.optional(),runDays:number.int().min(0).max(7).optional(),runMinutes:number.min(0).max(1500).optional(),establishedTraining:bool.optional(),focuses:z.array(z.enum(['core','jumping','supersets','activity'])).max(4).optional(),jumpReady:bool.optional()});
const item=strictObject({exerciseId:id,sets:number.int().min(1).max(100),reps:number.min(0).max(9999),repMin:number.min(0).max(9999).optional(),repMax:number.min(0).max(9999).optional(),rest:number.min(0).max(3600),kg:number.min(0).max(1500).nullable(),loadContext:short.optional(),loadRole:short.optional(),supersetGroup:id.optional(),supersetPosition:z.union([z.literal(1),z.literal(2)]).optional(),note:text.optional()});
const session=strictObject({id,date,week:number.int().min(1).max(1000),title:short,kind:short,minutes:number.min(0).max(1440),items:z.array(item).max(100),dependsOn:strings.optional(),progressionStep:text.optional(),needsReview:bool.optional(),status:z.enum(['scheduled','completed','partial','missed']),recoveryGroup:short.optional(),roleId:short.optional(),timeProfile:z.literal('brief').optional(),runSteps:z.array(strictObject({label:short,seconds:number.min(0).max(86400)})).max(500).optional()});
const plan=strictObject({id,name:short,version:number.int().min(1),progressionModel:z.literal('ranges').optional(),scheduleEnd:date.optional(),profile,acceptedAt:short.nullable(),sessions:z.array(session).max(500),phases:z.array(strictObject({name:short,weeks:short,description:text})).max(30),evidence:strings,notes:z.array(text).max(100),progression:text,template:short,paused:bool});
const exercise=strictObject({id,name:short,pattern:short,equipment:short,metric:z.enum(['reps','seconds','minutes']),cues:z.array(text).max(60),source:short.optional(),video:short.optional(),videoNote:text.optional(),custom:bool.optional(),loadConvention:text.optional(),loadMultiplier:number.min(0).max(4).optional(),loadTracked:bool.optional(),requiresSetup:bool.optional(),primaryMuscles:strings.optional(),instructionStatus:short.optional(),progressionEnabled:bool.optional(),category:short.optional()});
export const setMetricsSchema=strictObject({distanceM:number.min(0).max(1000000).optional(),durationSeconds:number.min(0).max(604800).optional(),heightCm:number.min(0).max(10000).optional(),heartRate:number.min(0).max(300).optional(),cadence:number.min(0).max(1000).optional(),powerWatts:number.min(0).max(10000).optional(),speedKph:number.min(0).max(300).optional(),inclinePercent:number.min(-100).max(100).optional(),level:number.min(0).max(1000).optional(),assistanceKg:number.min(0).max(1500).optional(),tempo:short.optional(),side:z.enum(['Both','Left','Right','Alternating']).optional(),notes:text.optional()});
const workout=strictObject({id,sessionId:id,title:short,date,startedAt:number.min(0),finishedAt:number.min(0).optional(),timeZone:timeZone.optional(),startedAtUtc:utc.optional(),finishedAtUtc:utc.optional(),sets:z.array(strictObject({exerciseId:id,set:number.int().min(1).max(100),reps:number.min(0).max(9999),kg:number.min(0).max(1500).nullable(),done:bool,metrics:setMetricsSchema.optional(),rir:number.int().min(0).max(10).nullable().optional()})).max(1000),targets:z.array(item).max(100).optional(),loadContext:map(short).optional(),rir:map(number.min(0).max(10).nullable()).optional(),details:map(strictObject({notes:text.optional()})).optional(),effort:short.optional(),symptom:short.optional(),rating:number.min(0).max(5).optional(),partial:bool.optional(),supervisorConfirmed:bool.optional(),demo:bool.optional()});
export const savedWorkoutSchema=workout;
export const eventSchema=strictObject({id,name:short,date,kind:short,priority:short,minutes:number.min(0).max(1440),provisional:bool});
const proposal=strictObject({id,title:short,reason:text,type:z.enum(['sets','move','return','load','substitute','ranges','capacity','review']),changes:z.array(strictObject({sessionId:id,beforeDate:date.optional(),patch:session.partial()})).max(500).optional(),warnings:z.array(text).max(100).optional(),eventSignature:z.string().max(1000000).optional(),historyCount:number.int().min(0).optional(),planId:id,baseVersion:number.int().min(1),sessionId:id,before:text,after:text,status:z.enum(['pending','accepted','declined','stale','queued']),patch:session.partial(),source:short,createdAt:short});
const restTimer=strictObject({id,workoutId:id,setKey:short,endAt:number.min(0).nullable(),pausedSeconds:number.min(0).max(3600).nullable(),alerted:bool}).refine(t=>(t.endAt===null)!==(t.pausedSeconds===null));
const stateSchema=strictObject({restTimer:restTimer.nullable().catch(null).optional(),restAlerts:bool.optional(),restSound:bool.optional(),videoPromptsAnswered:z.array(id).max(2000).optional(),schema:z.literal(2),profile,plan:plan.nullable(),history:z.array(workout).max(5000),active:workout.nullable(),proposals:z.array(proposal).max(1000),events:z.array(eventSchema).max(2000),custom:z.array(exercise).max(1500),ratings:map(number.min(1).max(5)),audit:z.array(strictObject({at:short,message:text})).max(10000),saved:z.array(plan).max(100),checkins:bool,soreness:bool,hold:bool,simulatedOffline:bool,equipmentCaps:z.array(strictObject({exerciseId:id,setup:short,maxKg:number.min(0).max(1500)})).max(500).optional(),incrementKg:map(number.min(0).max(100)).optional(),loadContext:map(short).optional(),restEnd:number.min(0).nullable().optional(),restPaused:number.min(0).max(3600).nullable().optional()});
export function parseSafeJson(raw:string,max=5_000_000):unknown{if(raw.length>max)throw Error('Saved data is too large to open here.');return JSON.parse(raw,(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('Unexpected data field.');return v})}
function unsupportedFields(error:z.ZodError):never{if(error.issues.some(issue=>issue.code==='unrecognized_keys'))throw Error('This saved data contains fields this build cannot preserve. Update the app before opening it. The original records have not been changed.');throw error}
export function readSavedState(raw:string,options:{maxChars?:number}={}):State&{restEnd?:number|null;restPaused?:number|null}{
 const maxChars=options.maxChars??5_000_000;
 if(!Number.isSafeInteger(maxChars)||maxChars<1||maxChars>24_000_000)throw Error('The saved data size limit is unsupported.');
 const input=parseSafeJson(raw,maxChars);
 if(input&&typeof input==='object'&&!Array.isArray(input)){
  const source=input as Record<string,unknown>;
  if(source.schema!==2)throw Error('This saved data version is not supported. Update the app before opening it. The original records have not been changed.');
  // Invalid old timer values can be discarded, but unknown future timer fields cannot.
  if(source.restTimer!==null&&source.restTimer!==undefined){const timer=restTimer.safeParse(source.restTimer);if(!timer.success&&timer.error.issues.some(issue=>issue.code==='unrecognized_keys'))unsupportedFields(timer.error)}
 }
 const parsed=stateSchema.safeParse(input);if(!parsed.success)unsupportedFields(parsed.error);
 const value=parsed.data;
 if(value.active&&!value.plan?.sessions.some(x=>x.id===value.active!.sessionId))throw Error('The saved workout has no matching plan.');
 assertSavedIntegrity(value as State);
 // This obsolete demo switch is not network status and must not block local work after import.
 return {...value,simulatedOffline:false,...(value.simulatedOffline?{proposals:value.proposals.map(p=>p.status==='queued'?{...p,status:'stale' as const}:p)}:{})} as State&{restEnd?:number|null;restPaused?:number|null};
}
export function readSetupDraft(raw:string){return strictObject({schema:z.literal(1),basePlanId:id.nullable(),baseEvents:z.string().max(1000000).default(''),profile:profile.extend({start:z.union([date,z.literal('')]),age:number.min(0).max(120),minutes:number.min(0).max(1440),weeks:number.min(0).max(52)}),events:z.array(eventSchema).max(2000),step:number.int().min(0).max(7)}).parse(parseSafeJson(raw,1_500_000)) as {schema:1;basePlanId:string|null;baseEvents:string;profile:Profile;events:Event[];step:number};}

function assertSavedIntegrity(s:State){
 const unique=(ids:string[])=>new Set(ids).size===ids.length;
 if(!unique((s.equipmentCaps||[]).map(c=>JSON.stringify([c.exerciseId,c.setup]))))throw Error('Duplicate equipment limits.');
 if(!unique(s.events.map(e=>e.id))||!unique(s.proposals.map(e=>e.id)))throw Error('Duplicate event or change IDs.');
 if(!unique(s.history.map(w=>w.id))||!unique(s.custom.map(e=>e.id)))throw Error('Duplicate saved record IDs.');
 for(const p of [s.plan,...s.saved].filter(Boolean) as NonNullable<State['plan']>[]){
  if(!p.sessions.length||!unique(p.sessions.map(x=>x.id)))throw Error('The saved plan has empty or duplicate sessions.');
  for(const x of p.sessions){if(!unique(x.items.map(i=>i.exerciseId)))throw Error('Duplicate exercise targets in a session.');const grouping=supersetFieldsError(x.items);if(grouping)throw Error(grouping);for(const i of x.items){if((i.repMin!==undefined&&i.repMax!==undefined&&i.repMin>i.repMax)||!Number.isInteger(i.sets))throw Error('Invalid saved rep range.');}}
 }
 for(const w of [...s.history,...(s.active?[s.active]:[])]){
  if(w.startedAtUtc!==undefined&&Date.parse(w.startedAtUtc)!==w.startedAt)throw Error('The workout UTC start timestamp does not match its recorded time.');
  if(w.finishedAtUtc!==undefined&&(w.finishedAt===undefined||Date.parse(w.finishedAtUtc)!==w.finishedAt))throw Error('The workout UTC finish timestamp does not match its recorded time.');
  if(!unique(w.sets.map(x=>x.exerciseId+':'+x.set)))throw Error('Duplicate set numbers in a workout.');
  if(w.targets&&(!unique(w.targets.map(x=>x.exerciseId))||w.targets.some(x=>x.repMin!==undefined&&x.repMax!==undefined&&x.repMin>x.repMax)))throw Error('Invalid workout target snapshot.');
  if(w.targets){const grouping=supersetFieldsError(w.targets);if(grouping)throw Error(grouping)}
  if(w.sets.some(x=>x.done&&(x.reps<=0||(exFor(x.exerciseId,s.custom).metric==='reps'&&!Number.isInteger(x.reps)))))throw Error('A logged set needs a valid completed amount.');
 }
 if(s.active){const w=s.active,session=s.plan?.sessions.find(x=>x.id===w.sessionId),targets=w.targets||session?.items||[];
  if(session?.status!=='scheduled'||s.history.some(x=>x.id===w.id)||w.finishedAt!==undefined)throw Error('This active workout is already closed.');
  if(w.sets.some(x=>!targets.some(t=>t.exerciseId===x.exerciseId&&x.set<=t.sets)))throw Error('An active set does not match its target.');
 }

}
