import {COACHING_POLICY,MAX_COACHING_BYTES,WORKOUT_COACHING_PROMPT,serializeWorkoutCoaching,
  workoutCoachingContextSchema,type WorkoutCoachingContext} from './workout-coaching';
import {WORKOUT_COACHING_CONTEXT_TOKENS,WORKOUT_COACHING_OUTPUT_TOKENS,type WorkoutCoachingModelId} from './workout-coaching-models';

export const WORKOUT_COACHING_EMPTY_THINK='<think>\n\n</think>\n\n';
export const WORKOUT_COACHING_LOAD_MS=120_000,WORKOUT_COACHING_GENERATE_MS=30_000;
export type WorkoutCoachingRuntimeMetrics={modelId:string;modelRevision:string;runtimeVersion:string;
  contextTokens:number;inputTokens:number;outputTokens:number;loadMs:number;generationMs:number};
export type WorkoutCoachingWorkerRequest={policy:typeof COACHING_POLICY;kind:'run';id:string;
  modelId:WorkoutCoachingModelId;contextDigest:string;context:WorkoutCoachingContext};
export type WorkoutCoachingWorkerReply={policy:typeof COACHING_POLICY;id:string;modelId:string;
  contextDigest:string;kind:'progress'|'result'|'error';phase?:'loading'|'running';progress?:number;
  reply?:string;metrics?:WorkoutCoachingRuntimeMetrics;code?:string};
export type WorkoutCoachingWorkerPort={postMessage:(value:WorkoutCoachingWorkerRequest)=>void;terminate:()=>void;
  onmessage:((event:MessageEvent<WorkoutCoachingWorkerReply>)=>void)|null;onerror:((event:ErrorEvent)=>void)|null};

export function workoutCoachingData(context:WorkoutCoachingContext,digest:string):string {
  if(!/^[0-9a-f]{64}$/.test(digest))throw Error('Invalid coaching identity.');
  // Imported strings cannot close the model's role delimiters.
  const parsed=workoutCoachingContextSchema.parse(context);
  return JSON.stringify({contextDigest:digest,context:JSON.parse(serializeWorkoutCoaching(parsed))})
    .replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
}
export function workoutCoachingPromptSegments(context:WorkoutCoachingContext,digest:string):string[] {
  const data=workoutCoachingData(context,digest);
  return [`<|im_start|>system\n${WORKOUT_COACHING_PROMPT}<|im_end|>\n`,
    `<|im_start|>user\n${data}<|im_end|>\n`,
    `<|im_start|>assistant\n${WORKOUT_COACHING_EMPTY_THINK}`];
}
export function workoutCoachingJsonSchema(context:WorkoutCoachingContext,digest:string) {
  return {type:'object',additionalProperties:false,required:['policy','workoutId','contextDigest','observationIds','reviewIds','priority'],
    properties:{policy:{const:COACHING_POLICY},workoutId:{const:context.workoutId},contextDigest:{const:digest},
      observationIds:{type:'array',minItems:1,maxItems:6,items:{enum:context.observations.map(x=>x.id)}},
      reviewIds:{type:'array',maxItems:3,items:{enum:context.reviews.map(x=>x.id)}},
      priority:{enum:['performance','attendance','next-step','profile']}}};
}
export function workoutCoachingJsonReply(raw:unknown):string|null {
  if(typeof raw!=='string'||raw.length>4096)return null;
  const body=raw.startsWith(WORKOUT_COACHING_EMPTY_THINK)?raw.slice(WORKOUT_COACHING_EMPTY_THINK.length):raw;
  const value=body.replace(/^[\t\n\r ]+|[\t\n\r ]+$/g,'');
  return value.startsWith('{')&&value.endsWith('}')?value:null;
}
export function workoutCoachingWorkerRequest(value:unknown):WorkoutCoachingWorkerRequest|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as Record<string,unknown>;
  if(Object.keys(v).sort().join(',')!=='context,contextDigest,id,kind,modelId,policy'||v.policy!==COACHING_POLICY||v.kind!=='run'||
    typeof v.id!=='string'||!/^[A-Za-z0-9_-]{8,100}$/.test(v.id)||typeof v.modelId!=='string'||
    !['web-qwen3.5-4b-q4f16_1-mlc','web-qwen3.5-9b-q4f16_1-mlc'].includes(v.modelId)||
    typeof v.contextDigest!=='string'||!/^[0-9a-f]{64}$/.test(v.contextDigest))return null;
  const context=workoutCoachingContextSchema.safeParse(v.context);
  if(!context.success||new TextEncoder().encode(serializeWorkoutCoaching(context.data)).length>MAX_COACHING_BYTES)return null;
  return {policy:COACHING_POLICY,kind:'run',id:v.id,modelId:v.modelId as WorkoutCoachingModelId,contextDigest:v.contextDigest,context:context.data};
}
export function workoutCoachingMetricsValid(metrics:WorkoutCoachingRuntimeMetrics|undefined,model:{id:string;modelRevision:string;runtimeVersion:string}):boolean {
  return !!metrics&&metrics.modelId===model.id&&metrics.modelRevision===model.modelRevision&&metrics.runtimeVersion===model.runtimeVersion&&
    metrics.contextTokens===WORKOUT_COACHING_CONTEXT_TOKENS&&Number.isSafeInteger(metrics.inputTokens)&&metrics.inputTokens>0&&
    metrics.inputTokens+WORKOUT_COACHING_OUTPUT_TOKENS<=WORKOUT_COACHING_CONTEXT_TOKENS&&
    Number.isSafeInteger(metrics.outputTokens)&&metrics.outputTokens>0&&metrics.outputTokens<=WORKOUT_COACHING_OUTPUT_TOKENS&&
    Number.isFinite(metrics.loadMs)&&metrics.loadMs>=0&&Number.isFinite(metrics.generationMs)&&metrics.generationMs>=0;
}
