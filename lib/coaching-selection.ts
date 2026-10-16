import {z} from 'zod/v3';
import {COACHING_POLICY} from './workout-coaching';
import type {afterWorkoutCoaching} from './workout-coaching';

type CoachingContext=NonNullable<ReturnType<typeof afterWorkoutCoaching>>;
const messageSchema=z.object({id:z.string().min(1).max(100),text:z.string().min(1).max(1000),kind:z.enum(['fact','suggestion','encouragement']),required:z.boolean()}).strict();
const contextSchema=z.object({policy:z.literal(COACHING_POLICY),key:z.string().min(1).max(256),phase:z.enum(['before','after']),aiEligible:z.literal(true),messages:z.array(messageSchema).min(1).max(3)});
const digestSchema=z.string().regex(/^[a-f0-9]{64}$/);
const selectionSchema=z.object({schema:z.literal(1),policy:z.literal(COACHING_POLICY),contextKey:z.string().min(1).max(256),contextDigest:digestSchema,factIds:z.array(z.string().min(1).max(100)).min(1).max(3)}).strict();
export type CoachingSelection=z.infer<typeof selectionSchema>;
export type CoachingSelectionRequest={schema:1;policy:typeof COACHING_POLICY;contextKey:string;contextDigest:string;facts:{id:string;text:string}[]};

function eligibleContext(context:CoachingContext|null){
 const parsed=contextSchema.safeParse(context);if(!parsed.success)return null;
 const value=parsed.data;
 if(new Set(value.messages.map(message=>message.id)).size!==value.messages.length||!value.messages.some(message=>!message.required))return null;
 return value;
}

// Future, unconnected selection contract. Only pass a freshly generated local
// engine summary, never model-supplied facts or imported text. The platform must
// SHA-256 this serialization locally and retain that expected digest; do not use
// a response's digest as the expected value. This helper makes no network calls.
export function coachingSelectionDigestInput(context:CoachingContext|null):string|null{
 const value=eligibleContext(context);if(!value)return null;
 return JSON.stringify({policy:COACHING_POLICY,key:value.key,phase:value.phase,messages:value.messages});
}

export function coachingSelectionRequest(context:CoachingContext|null,contextDigest:string):CoachingSelectionRequest|null{
 const value=eligibleContext(context);if(!value||!digestSchema.safeParse(contextDigest).success)return null;
 return {schema:1,policy:COACHING_POLICY,contextKey:value.key,contextDigest,facts:value.messages.filter(message=>!message.required).map(({id,text})=>({id,text}))};
}

export function validateCoachingSelection(context:CoachingContext|null,contextDigest:string,raw:unknown):CoachingSelection|null{
 const request=coachingSelectionRequest(context,contextDigest),parsed=selectionSchema.safeParse(raw);
 if(!request||!parsed.success)return null;
 const selected=parsed.data;
 if(selected.contextKey!==request.contextKey||selected.contextDigest!==request.contextDigest||new Set(selected.factIds).size!==selected.factIds.length||selected.factIds.some(id=>!request.facts.some(fact=>fact.id===id)))return null;
 return selected;
}

// Required notices always remain in engine order. The model can select existing
// optional messages only; it cannot supply text, suppress a required notice,
// authorize a proposal, clear a hold, or change recorded/accepted training.
// Null means keep the complete deterministic summary, never hide it on failure.
export function resolveCoachingSelection(context:CoachingContext|null,contextDigest:string,raw:unknown){
 const selected=validateCoachingSelection(context,contextDigest,raw),value=eligibleContext(context);
 if(!selected||!value)return null;
 return value.messages.filter(message=>message.required||selected.factIds.includes(message.id)).map(message=>({...message}));
}
