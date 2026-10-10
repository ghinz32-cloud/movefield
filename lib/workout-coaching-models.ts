import {qwenCandidates,type QwenCandidate} from './qwen-catalog';
import {qwenAssetRequestAllowed} from './qwen-network-policy';
import {browserModelId,type ModelChoice} from './app-preferences';

export const WORKOUT_COACHING_MODELS=[
  'web-qwen3.5-4b-q4f16_1-mlc',
  'web-qwen3.5-9b-q4f16_1-mlc',
] as const;
export type WorkoutCoachingModelId=typeof WORKOUT_COACHING_MODELS[number];
export const WORKOUT_COACHING_CONTEXT_TOKENS=4096;
export const WORKOUT_COACHING_OUTPUT_TOKENS=512;
export const WORKOUT_COACHING_MAX_FILE_BYTES=512*1024*1024;
export const WORKOUT_COACHING_RUNTIME_VERSION='0.2.85';

// Explicit experimental selection is independent of automatic qualification.
// The complete checked manifest and exact download policy must both exist.
export function workoutCoachingModel(id:unknown):QwenCandidate|null {
  if(typeof id!=='string'||!WORKOUT_COACHING_MODELS.includes(id as WorkoutCoachingModelId))return null;
  const model=qwenCandidates.find(candidate=>candidate.id===id);
  if(!model||model.platform!=='web'||model.runtime!=='@mlc-ai/web-llm'||
    model.runtimeVersion!==WORKOUT_COACHING_RUNTIME_VERSION||model.backend!=='webgpu-q4f16_1'||
    model.contextTokens!==WORKOUT_COACHING_CONTEXT_TOKENS||!model.modelId||
    !model.assets.length||model.assets.some(asset=>asset.bytes>WORKOUT_COACHING_MAX_FILE_BYTES||!qwenAssetRequestAllowed(asset.url)))return null;
  return model;
}
export function getBrowserCoachingModel(choice:ModelChoice):QwenCandidate|null {
  return workoutCoachingModel(browserModelId(choice));
}

export function workoutCoachingPromptFits(tokens:number):boolean {
  return Number.isSafeInteger(tokens)&&tokens>0&&tokens+WORKOUT_COACHING_OUTPUT_TOKENS<=WORKOUT_COACHING_CONTEXT_TOKENS;
}
