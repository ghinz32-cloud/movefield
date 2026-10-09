import {z} from 'zod';
import {cloudAccount, cloudRequest, CloudError} from './cloud-client';
import {COACHING_POLICY, workoutCoachingReplySchema, parseWorkoutCoachingReply, type WorkoutCoachingContext, type WorkoutCoachingReply} from './workout-coaching';
import {workoutCoachingDigest, workoutCoachingRequestId} from './workout-coaching-identity';

const identity = {policy: z.literal(COACHING_POLICY), requestId: z.string().uuid(), workoutId: z.string().min(1).max(150), contextDigest: z.string().regex(/^[0-9a-f]{64}$/)};
const statusSchema = z.discriminatedUnion('status', [
  z.object({...identity, status: z.literal('pending'), retryAfterMs: z.number().int().min(1_000).max(15_000)}).strict(),
  z.object({...identity, status: z.literal('processing'), retryAfterMs: z.number().int().min(1_000).max(15_000)}).strict(),
  z.object({...identity, status: z.literal('complete'), reply: workoutCoachingReplySchema, model: z.string().min(1).max(150)}).strict(),
  z.object({...identity, status: z.literal('failed'), error: z.string().min(1).max(80).regex(/^[a-z_]+$/)}).strict(),
  z.object({...identity, status: z.literal('cancelled')}).strict(),
]);
export type WorkoutCoachingStatus = z.infer<typeof statusSchema>;
export type WorkoutCoachingClientResult = {reply: WorkoutCoachingReply; accountId: string; requestId: string; model: string};
export type WorkoutCoachingClientOptions = {signal?: AbortSignal};

function status(raw: unknown, requestId: string, digest: string, workoutId?: string): WorkoutCoachingStatus {
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success || parsed.data.requestId !== requestId || parsed.data.contextDigest !== digest || (workoutId && parsed.data.workoutId !== workoutId))
    throw new CloudError(502, 'coaching_bad_response', 'The saved coaching response did not match this workout. Nothing was displayed.');
  return parsed.data;
}

function pause(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const stop = () => {clearTimeout(timer); signal.removeEventListener('abort', stop); reject(new DOMException('Coaching request cancelled.', 'AbortError'));};
    const timer = setTimeout(() => {signal.removeEventListener('abort', stop); resolve();}, milliseconds);
    signal.addEventListener('abort', stop, {once: true}); if (signal.aborted) stop();
  });
}

export async function cancelWorkoutCoaching(requestId: string, contextDigest: string, options: {accountId: string; signal?: AbortSignal}): Promise<WorkoutCoachingStatus> {
  const raw = await cloudRequest<unknown>('/api/workout-coaching', {action: 'cancel', requestId, contextDigest}, options.signal, options.accountId);
  return status(raw, requestId, contextDigest);
}

// This function is called only after explicit remote-coaching consent. The
// caller aborts when the current local context changes or the view is closed.
export async function requestWorkoutCoaching(context: WorkoutCoachingContext, contextDigest: string, options: WorkoutCoachingClientOptions = {}): Promise<WorkoutCoachingClientResult> {
  if (workoutCoachingDigest(context) !== contextDigest) throw new Error('The workout changed before coaching was requested. Review it again.');
  const controller = new AbortController(), stop = () => controller.abort();
  options.signal?.addEventListener('abort', stop, {once: true}); if (options.signal?.aborted) controller.abort();
  const deadline = setTimeout(stop, 120_000);
  let accountId = '', requestId = '', attempted = false;
  try {
    const account = await cloudAccount(controller.signal); accountId = account.userId;
    if (account.coachingAvailable !== true) throw new CloudError(503, 'coaching_provider_unavailable', 'Remote coaching is unavailable until the backend model credentials are configured. Your workout remains saved.');
    if (controller.signal.aborted) throw new DOMException('Coaching request cancelled.', 'AbortError');
    requestId = workoutCoachingRequestId(accountId, contextDigest);
    attempted = true;
    let result = status(await cloudRequest<unknown>('/api/workout-coaching', {requestId, contextDigest, context, consent: true}, controller.signal, accountId), requestId, contextDigest, context.workoutId);
    while (result.status === 'pending' || result.status === 'processing') {
      await pause(result.retryAfterMs, controller.signal);
      const current = await cloudAccount(controller.signal);
      if (current.userId !== accountId) throw new CloudError(401, 'account_changed', 'Your signed-in account changed. Request coaching again for the current account.');
      result = status(await cloudRequest<unknown>(`/api/workout-coaching?id=${encodeURIComponent(requestId)}&context=${encodeURIComponent(contextDigest)}`, undefined, controller.signal, accountId), requestId, contextDigest, context.workoutId);
    }
    if (result.status === 'cancelled') throw new DOMException('Coaching request cancelled.', 'AbortError');
    if (result.status !== 'complete') throw new CloudError(502, 'coaching_failed', 'The backend could not complete this coaching request. Your workout remains saved.');
    const reply = parseWorkoutCoachingReply(context, contextDigest, result.reply);
    if (!reply) throw new CloudError(502, 'coaching_bad_response', 'The coaching result did not match the current workout facts. Nothing was displayed.');
    if (controller.signal.aborted) throw new DOMException('Coaching request cancelled.', 'AbortError');
    return {reply, accountId, requestId, model: result.model};
  } catch (error) {
    if (controller.signal.aborted && attempted && accountId && requestId) {
      // The accepted write may have raced the aborted response. Use a fresh
      // short-lived controller; the original signal cannot cancel this cleanup.
      const cancellation = new AbortController(), timeout = setTimeout(() => cancellation.abort(), 3_000);
      try {await cancelWorkoutCoaching(requestId, contextDigest, {accountId, signal: cancellation.signal});} catch { /* Best effort; accepted jobs retain their server deadline. */ }
      finally {clearTimeout(timeout);}
    }
    if (error instanceof CloudError && error.code === 'coaching_attempts_exhausted')
      throw new CloudError(error.status, error.code, 'This remote coaching request used all three backend attempts. Local coaching remains available.');
    if (error instanceof CloudError && error.code === 'coaching_request_expired')
      throw new CloudError(error.status, error.code, 'This remote coaching request expired. Local coaching remains available for your saved workout.');
    throw error;
  } finally {clearTimeout(deadline); options.signal?.removeEventListener('abort', stop);}
}
