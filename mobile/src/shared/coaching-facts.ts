import {z} from 'zod/v3';
import {exFor,exercises,isLoadTracked,type State} from './training';
export const HIGHLIGHTS_POLICY='highlights-v1';
const logged=z.object({exerciseId:z.string().max(120),set:z.number().int().min(1).max(100),reps:z.number().positive().max(9999),kg:z.number().min(0).max(1500).nullable(),done:z.literal(true)}).strict();
export const coachingInputSchema=z.object({policy:z.literal(HIGHLIGHTS_POLICY),adult:z.literal(true),mode:z.literal('app'),hold:z.literal(false),workout:z.object({id:z.string().min(1).max(150),revision:z.number().int().min(1),partial:z.boolean(),effort:z.enum(['easier','right','harder']),symptom:z.literal('no'),sets:z.array(logged).min(1).max(128),targets:z.array(z.object({exerciseId:z.string().max(120),sets:z.number().int().min(1).max(100)}).strict()).min(1).max(32)}).strict()}).strict();
export type CoachingInput=z.infer<typeof coachingInputSchema>;
export function coachingInput(state:State,id:string):CoachingInput|null{
 const w=state.history.find(x=>x.id===id),owner=[state.plan,...state.saved].find(p=>p?.sessions.some(x=>x.id===w?.sessionId));
 if(!w?.finishedAt||w.demo||(owner?.profile.age??state.profile.age)<18||owner?.profile.mode!=='app'||state.hold||w.symptom!=='no')return null;
 const parsed=coachingInputSchema.safeParse({policy:HIGHLIGHTS_POLICY,adult:true,mode:'app',hold:false,workout:{id:w.id,revision:w.revision||1,partial:!!w.partial,effort:w.effort,symptom:w.symptom,sets:w.sets.filter(s=>s.done).map(({exerciseId,set,reps,kg})=>({exerciseId,set,reps,kg,done:true})),targets:w.targets?.map(({exerciseId,sets})=>({exerciseId,sets}))}});
 if(!parsed.success)return null;try{coachingFacts(parsed.data);return parsed.data}catch{return null}
}
export function coachingFacts(input:CoachingInput){
 const w=input.workout,known=new Set(exercises.map(x=>x.id));
 if(w.partial||w.sets.some(s=>!known.has(s.exerciseId)||exFor(s.exerciseId).metric==='reps'&&!Number.isInteger(s.reps)||isLoadTracked(exFor(s.exerciseId))&&s.kg===null)||w.targets.some(t=>!known.has(t.exerciseId)||w.sets.filter(s=>s.exerciseId===t.exerciseId).length<t.sets)||w.sets.some(s=>!w.targets.some(t=>t.exerciseId===s.exerciseId&&s.set<=t.sets))||new Set(w.targets.map(t=>t.exerciseId)).size!==w.targets.length||new Set(w.sets.map(s=>s.exerciseId+':'+s.set)).size!==w.sets.length)throw Error('This workout needs the deterministic review before cloud highlights are available.');
 return [{id:'logged',text:`You logged ${w.sets.length} completed sets or intervals across ${new Set(w.sets.map(s=>s.exerciseId)).size} exercises.`},{id:'effort',text:w.effort==='harder'?'You marked this workout harder than expected. One report does not prove lost strength.':w.effort==='easier'?'You marked this workout easier than expected. One report does not justify adding weight, speed or duration.':'You marked this workout about right.'},{id:'targets',text:'Keep following your accepted targets. Any training change requires a separate review and your approval.'}];
}
export type HighlightSelection={schema:1;contextDigest:string;factIds:string[]};
export function validateHighlights(input:CoachingInput,digest:string,raw:unknown):HighlightSelection|null{
 const parsed=z.object({schema:z.literal(1),contextDigest:z.literal(digest),factIds:z.array(z.enum(['logged','effort','targets'])).min(1).max(3)}).strict().safeParse(raw);if(!parsed.success||new Set(parsed.data.factIds).size!==parsed.data.factIds.length)return null;
 try{coachingFacts(input)}catch{return null}return parsed.data;
}
