import {createGroundedReviewRequest, parseGroundedReviewReply, type FitnessReference, type GroundedReviewRequest} from './fitness-grounding';
import type {ReviewContext} from './workout-review';

export const QWEN_DEMO_POLICY = 'verified-local-evidence-demo-v1';
export const QWEN_DEMO_TIMEOUT_MS = 180_000;
export type QwenDemoMetrics = {inputTokens: number; outputTokens: number; loadMs: number; generationMs: number; contextTokens: number};
export type QwenDemoState = {phase: 'idle' | 'loading' | 'generating' | 'complete' | 'error';
  progress: number; message: string; notes: FitnessReference[]; signature: string; metrics: QwenDemoMetrics | null};
export type QwenWorkerRequest = {policy: typeof QWEN_DEMO_POLICY; request: Pick<GroundedReviewRequest, 'system' | 'user' | 'requestId'>};
type WorkerPort = Pick<Worker, 'postMessage' | 'terminate' | 'addEventListener' | 'removeEventListener'>;
const initial = (): QwenDemoState => ({phase: 'idle', progress: 0, message: '', notes: [], signature: '', metrics: null});
const errors: Record<string, string> = {
  unsupported: 'This browser cannot run this model. Use a current browser over HTTPS with WebGPU and shader-f16 support.',
  'not-downloaded': 'Download and check Qwen3 0.6B in Settings first, then return here.',
  integrity: 'A local model file failed its checks. Delete and download the model again in Settings.',
  busy: 'Another tab is using these model files. Finish or stop it, then retry.',
  context: 'This question and its sources exceed the model’s context. Try a shorter question.',
  runtime: 'The model could not finish on this device. Your workout summary remains available.',
};
function metrics(value: unknown): value is QwenDemoMetrics {
  if (!value || typeof value !== 'object') return false;
  const v = value as QwenDemoMetrics;
  return [v.inputTokens, v.outputTokens, v.contextTokens].every(n => Number.isSafeInteger(n) && n > 0) &&
    v.contextTokens <= 1024 && v.outputTokens <= 192 && v.inputTokens + v.outputTokens <= v.contextTokens &&
    [v.loadMs, v.generationMs].every(n => Number.isFinite(n) && n >= 0);
}

// Each explicit run gets a fresh worker. Termination is the cancellation
// boundary, including model loading; late replies cannot publish a result.
export function createQwenDemo(makeWorker: () => WorkerPort, timeoutMs = QWEN_DEMO_TIMEOUT_MS) {
  let state = initial(), enabled = false, serial = 0;
  let worker: WorkerPort | null = null, timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<QwenDemoState>) => {state = {...state, ...patch}; for (const listener of listeners) listener()};
  const stop = () => {serial++; if (timer) clearTimeout(timer); timer = null; worker?.terminate(); worker = null};
  function cancel() {stop(); publish({...initial(), message: 'Assistant stopped.'})}
  function setEnabled(value: boolean) {enabled = value; if (!value && worker) cancel()}
  function run(context: ReviewContext, query: string, current: () => ReviewContext, requestId: string) {
    if (!enabled || worker) return;
    const request = createGroundedReviewRequest(context, {query, requestId});
    if (!request) {publish({...initial(), phase: 'error', message: 'No applicable reviewed source is available for this question and workout.'}); return}
    const job = ++serial;
    publish({...initial(), phase: 'loading', signature: request.contextSignature, message: 'Checking and loading local model files…'});
    const fail = (message: string) => {if (job !== serial) return; stop(); publish({phase: 'error', progress: 0, message, notes: [], metrics: null})};
    try {
      const active = makeWorker(); worker = active;
      active.addEventListener('error', () => fail(errors.runtime));
      active.addEventListener('messageerror', () => fail(errors.runtime));
      active.addEventListener('message', (event: Event) => {
        if (job !== serial) return;
        const value = (event as MessageEvent).data;
        if (!value || value.policy !== QWEN_DEMO_POLICY || value.requestId !== request.requestId) return;
        if (JSON.stringify(current()) !== request.contextSignature) {fail('Your workout changed. Run the assistant again for the current summary.'); return}
        if (value.type === 'progress' && ['loading', 'generating'].includes(value.phase)) {
          publish({phase: value.phase, progress: typeof value.progress === 'number' && Number.isFinite(value.progress) ? Math.max(0, Math.min(1, value.progress)) : 0,
            message: value.phase === 'generating' ? 'Finding relevant evidence on this device…' : 'Checking and loading local model files…'});
        } else if (value.type === 'error') {fail(errors[value.code] ?? errors.runtime)}
        else if (value.type === 'result') {
          const notes = parseGroundedReviewReply(current(), request, value.reply);
          if (notes === null || !metrics(value.metrics)) {fail('The model’s result did not pass validation. Your workout summary remains available.'); return}
          stop(); publish({phase: 'complete', progress: 1, notes, metrics: value.metrics,
            message: notes.length ? 'Sources selected by Qwen. Explanations come from the reviewed source notes.' : 'Qwen found no relevant source among the supplied notes.'});
        }
      });
      timer = setTimeout(() => fail('The assistant took too long and was stopped. Try again when the device has more free memory.'), timeoutMs);
      active.postMessage({policy: QWEN_DEMO_POLICY, request: {system: request.system, user: request.user, requestId: request.requestId}} satisfies QwenWorkerRequest);
    } catch {fail(errors.runtime)}
  }
  return {getSnapshot: () => state, subscribe: (listener: () => void) => {listeners.add(listener); return () => {listeners.delete(listener)}}, run, cancel, setEnabled};
}
