import {z} from 'zod';
import {COACHING_POLICY, WORKOUT_COACHING_PROMPT, workoutCoachingContextSchema, workoutCoachingReplySchema, parseWorkoutCoachingReply, serializeWorkoutCoaching, type WorkoutCoachingContext, type WorkoutCoachingReply} from '../lib/workout-coaching';
import {workoutCoachingDigest, workoutCoachingRequestId} from '../lib/workout-coaching-identity';
import {ApiError, digestJson, jsonResponse, readJson} from './contracts';
import {AI_CAPACITY_SQL, AI_OUTSTANDING_CAPACITY_SQL, aiCapacityBindings, expireAbandonedAiJobs} from './ai-quota';
import {providerConfiguration, PROVIDER_TIMEOUT_MS} from './feedback';
import type {BackendEnvironment} from './auth';

export const MAX_COACHING_REQUEST_BYTES = 16_384;
const LEASE_MS = 25_000, MAX_ATTEMPTS = 3;
const digestSchema = z.string().regex(/^[0-9a-f]{64}$/);
const startSchema = z.object({requestId: z.string().uuid(), contextDigest: digestSchema, context: workoutCoachingContextSchema, consent: z.literal(true)}).strict();
const cancelSchema = z.object({action: z.literal('cancel'), requestId: z.string().uuid(), contextDigest: digestSchema}).strict();
type CoachingRow = {request_id: string; workout_id: string; policy: string; context_digest: string; context_json: string | null;
  reply_json: string | null; provider_model: string; provider_digest: string; status: 'pending' | 'processing' | 'complete' | 'failed' | 'cancelled';
  attempts: number; lease_until: number; next_attempt_at: number; error_code: string | null; created_at: number};
type Scheduler = (promise: Promise<unknown>) => void;

async function getCoaching(db: D1DatabaseSession, owner: string, id: string): Promise<CoachingRow | null> {
  return db.prepare(`SELECT request_id, workout_id, policy, context_digest, context_json, reply_json, provider_model, provider_digest,
    status, attempts, lease_until, next_attempt_at, error_code, created_at FROM workout_ai_coaching WHERE owner_id = ? AND request_id = ?`).bind(owner, id).first<CoachingRow>();
}

function statusResponse(row: CoachingRow, status = 200): Response {
  const identity = {policy: row.policy, requestId: row.request_id, workoutId: row.workout_id, contextDigest: row.context_digest};
  if (row.status === 'complete') {
    let raw: unknown;
    try {raw = JSON.parse(row.reply_json ?? 'null');} catch {throw new ApiError(503, 'coaching_saved_result_unavailable');}
    const parsed = workoutCoachingReplySchema.safeParse(raw);
    if (!parsed.success || parsed.data.policy !== row.policy || parsed.data.workoutId !== row.workout_id || parsed.data.contextDigest !== row.context_digest)
      throw new ApiError(503, 'coaching_saved_result_unavailable');
    return jsonResponse({...identity, status: 'complete', reply: parsed.data, model: row.provider_model}, status);
  }
  if (row.status === 'cancelled') return jsonResponse({...identity, status: 'cancelled'}, status);
  if (row.status === 'failed') return jsonResponse({...identity, status: 'failed', error: row.error_code ?? 'coaching_failed'}, status);
  return jsonResponse({...identity, status: row.status, retryAfterMs: Math.min(15_000, Math.max(1_000, row.next_attempt_at - Date.now()))}, status);
}

export async function postCoaching(request: Request, db: D1DatabaseSession, owner: string, environment: BackendEnvironment, schedule: Scheduler): Promise<Response> {
  const raw = await readJson(request, MAX_COACHING_REQUEST_BYTES);
  const cancellation = cancelSchema.safeParse(raw);
  if (cancellation.success) {
    const value = cancellation.data, existing = await getCoaching(db, owner, value.requestId);
    if (!existing) throw new ApiError(404, 'coaching_not_found');
    if (existing.context_digest !== value.contextDigest) throw new ApiError(409, 'stale_context');
    await db.prepare(`UPDATE workout_ai_coaching SET status = 'cancelled', context_json = NULL, reply_json = NULL, lease_token = NULL,
      lease_until = 0, next_attempt_at = 0, error_code = NULL, updated_at = ?
      WHERE owner_id = ? AND request_id = ? AND context_digest = ? AND status IN ('pending', 'processing')`)
      .bind(Date.now(), owner, value.requestId, value.contextDigest).run();
    const saved = await getCoaching(db, owner, value.requestId);
    if (!saved) throw new ApiError(503, 'coaching_saved_result_unavailable');
    return statusResponse(saved);
  }
  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, 'invalid_payload');
  const {requestId, contextDigest, context} = parsed.data;
  if (workoutCoachingDigest(context) !== contextDigest) throw new ApiError(400, 'invalid_context_digest');
  if (Date.parse(context.startedAt) > Date.now() + 300_000 || (context.completedAt !== null && Date.parse(context.completedAt) > Date.now() + 300_000))
    throw new ApiError(400, 'invalid_completion_time');
  const prior = await getCoaching(db, owner, requestId);
  if (prior) {
    if (prior.context_digest !== contextDigest) throw new ApiError(409, 'idempotency_conflict');
    if (prior.status === 'cancelled') {
      const configuration = providerConfiguration(environment), now = Date.now();
      if (prior.attempts >= MAX_ATTEMPTS) throw new ApiError(409, 'coaching_attempts_exhausted');
      if (prior.created_at < now - 86_400_000) throw new ApiError(409, 'coaching_request_expired');
      if (!configuration) throw new ApiError(503, 'coaching_provider_unavailable');
      const providerDigest = await digestJson({endpoint: configuration.endpoint, model: configuration.model});
      if (prior.provider_digest !== providerDigest) throw new ApiError(503, 'coaching_provider_changed');
      await expireAbandonedAiJobs(db, owner, now);
      // Explicit consent may resume this same receipt. Attempts, creation time
      // and provider identity remain fixed, and the outstanding quota is atomic.
      await db.prepare(`UPDATE workout_ai_coaching SET status = 'pending', context_json = ?, error_code = NULL,
        lease_token = NULL, lease_until = 0, next_attempt_at = 0, updated_at = ?
        WHERE owner_id = ? AND request_id = ? AND context_digest = ? AND status = 'cancelled'
        AND attempts < ? AND provider_digest = ? AND created_at >= ? AND ${AI_OUTSTANDING_CAPACITY_SQL}`)
        .bind(serializeWorkoutCoaching(context), now, owner, requestId, contextDigest, MAX_ATTEMPTS, providerDigest,
          now - 86_400_000, owner, owner).run();
      const resumed = await getCoaching(db, owner, requestId);
      if (!resumed) throw new ApiError(503, 'coaching_saved_result_unavailable');
      if (resumed.status === 'cancelled') throw new ApiError(429, 'coaching_rate_limit');
      scheduleProcessing(db, owner, resumed, environment, schedule);
      return statusResponse(resumed, ['complete', 'failed'].includes(resumed.status) ? 200 : 202);
    }
    scheduleProcessing(db, owner, prior, environment, schedule);
    return statusResponse(prior, ['complete', 'failed', 'cancelled'].includes(prior.status) ? 200 : 202);
  }
  if (requestId !== workoutCoachingRequestId(owner, contextDigest)) throw new ApiError(400, 'invalid_request_identity');
  const configuration = providerConfiguration(environment);
  if (!configuration) throw new ApiError(503, 'coaching_provider_unavailable');
  const now = Date.now(), providerDigest = await digestJson({endpoint: configuration.endpoint, model: configuration.model});
  await expireAbandonedAiJobs(db, owner, now);
  await db.prepare(`INSERT INTO workout_ai_coaching(owner_id, request_id, workout_id, policy, context_digest, context_json,
    provider_model, provider_digest, status, created_at, updated_at)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ? WHERE ${AI_CAPACITY_SQL}
    ON CONFLICT(owner_id, request_id) DO NOTHING`)
    .bind(owner, requestId, context.workoutId, COACHING_POLICY, contextDigest, serializeWorkoutCoaching(context),
      configuration.model, providerDigest, now, now, ...aiCapacityBindings(owner, now)).run();
  const saved = await getCoaching(db, owner, requestId);
  if (!saved) throw new ApiError(429, 'coaching_rate_limit');
  if (saved.context_digest !== contextDigest) throw new ApiError(409, 'idempotency_conflict');
  scheduleProcessing(db, owner, saved, environment, schedule);
  return statusResponse(saved, 202);
}

export async function coachingStatus(request: Request, db: D1DatabaseSession, owner: string, environment: BackendEnvironment, schedule: Scheduler): Promise<Response> {
  const query = new URL(request.url).searchParams, id = query.get('id'), digest = query.get('context');
  if (!id || !z.string().uuid().safeParse(id).success || !digestSchema.safeParse(digest).success) throw new ApiError(400, 'invalid_request_identity');
  const row = await getCoaching(db, owner, id);
  if (!row) throw new ApiError(404, 'coaching_not_found');
  if (row.context_digest !== digest) throw new ApiError(409, 'stale_context');
  scheduleProcessing(db, owner, row, environment, schedule);
  return statusResponse(row);
}

function scheduleProcessing(db: D1DatabaseSession, owner: string, row: CoachingRow, environment: BackendEnvironment, schedule: Scheduler): void {
  if (!['pending', 'processing'].includes(row.status) || row.next_attempt_at > Date.now() || (row.status === 'processing' && row.lease_until > Date.now())) return;
  schedule(processCoaching(db, owner, row.request_id, environment).catch(() => undefined));
}

export async function processCoaching(db: D1DatabaseSession, owner: string, id: string, environment: BackendEnvironment): Promise<void> {
  const configuration = providerConfiguration(environment);
  if (!configuration) return;
  const now = Date.now(), lease = crypto.randomUUID();
  const claim = await db.prepare(`UPDATE workout_ai_coaching SET status = 'processing', attempts = attempts + 1,
    lease_token = ?, lease_until = ?, updated_at = ? WHERE owner_id = ? AND request_id = ? AND attempts < ? AND next_attempt_at <= ?
    AND (status = 'pending' OR (status = 'processing' AND lease_until <= ?))`)
    .bind(lease, now + LEASE_MS, now, owner, id, MAX_ATTEMPTS, now, now).run();
  if (claim.meta.changes !== 1) {
    await db.prepare(`UPDATE workout_ai_coaching SET status = 'failed', context_json = NULL, error_code = 'coaching_attempts_exhausted',
      lease_token = NULL, lease_until = 0, updated_at = ? WHERE owner_id = ? AND request_id = ?
      AND attempts >= ? AND status = 'processing' AND lease_until <= ?`).bind(now, owner, id, MAX_ATTEMPTS, now).run();
    return;
  }
  const row = await getCoaching(db, owner, id);
  if (!row) return;
  try {
    if (row.provider_digest !== await digestJson({endpoint: configuration.endpoint, model: configuration.model})) throw new ApiError(503, 'coaching_provider_changed');
    let context: WorkoutCoachingContext;
    try {context = workoutCoachingContextSchema.parse(JSON.parse(row.context_json ?? 'null'));}
    catch {throw new ApiError(400, 'coaching_invalid_context');}
    if (workoutCoachingDigest(context) !== row.context_digest || context.workoutId !== row.workout_id) throw new ApiError(400, 'coaching_invalid_context');
    const reply = await fetchCoaching(configuration, context, row.context_digest);
    // A cancellation or a newer lease makes this save a no-op. Generated
    // content is exposed only by reading a successfully persisted complete row.
    await db.prepare(`UPDATE workout_ai_coaching SET status = 'complete', reply_json = ?, context_json = NULL,
      error_code = NULL, lease_token = NULL, lease_until = 0, updated_at = ?
      WHERE owner_id = ? AND request_id = ? AND context_digest = ? AND status = 'processing' AND lease_token = ?`)
      .bind(JSON.stringify(reply), Date.now(), owner, id, row.context_digest, lease).run();
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'coaching_processing_failed';
    const retryable = ['coaching_provider_timeout', 'coaching_provider_busy', 'coaching_processing_failed'].includes(code) && row.attempts < MAX_ATTEMPTS;
    await db.prepare(`UPDATE workout_ai_coaching SET status = ?, context_json = CASE WHEN ? THEN context_json ELSE NULL END,
      error_code = ?, lease_token = NULL, lease_until = 0, next_attempt_at = ?, updated_at = ?
      WHERE owner_id = ? AND request_id = ? AND status = 'processing' AND lease_token = ?`)
      .bind(retryable ? 'pending' : 'failed', retryable ? 1 : 0, code, retryable ? Date.now() + row.attempts * 5_000 : 0, Date.now(), owner, id, lease).run();
  }
}

function completionParameters(configuration: {endpoint: string; model: string}): Record<string, string | number | boolean> {
  if (new URL(configuration.endpoint).hostname !== 'api.groq.com') return {max_tokens: 2_048};
  const budget = {max_completion_tokens: 2_048};
  // Groq's documented GPT-OSS controls differ from its Qwen controls. Never
  // send these provider/model-specific parameters to an unrecognized model.
  if (['openai/gpt-oss-120b', 'openai/gpt-oss-20b'].includes(configuration.model))
    return {...budget, reasoning_effort: 'low', include_reasoning: false};
  if (configuration.model === 'qwen/qwen3.8-27b') return {...budget, reasoning_effort: 'none', reasoning_format: 'hidden'};
  return budget;
}

async function fetchCoaching(configuration: {endpoint: string; secret: string; model: string}, context: WorkoutCoachingContext, digest: string): Promise<WorkoutCoachingReply> {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(configuration.endpoint, {method: 'POST', redirect: 'error', signal: controller.signal,
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${configuration.secret}`}, body: JSON.stringify({
        model: configuration.model, stream: false, temperature: 0.2, ...completionParameters(configuration), response_format: {type: 'json_object'},
        messages: [
          {role: 'system', content: WORKOUT_COACHING_PROMPT},
          {role: 'user', content: JSON.stringify({policy: COACHING_POLICY, workoutId: context.workoutId, contextDigest: digest, context})},
        ],
      })});
    if (!response.ok) throw new ApiError(502, response.status === 429 || response.status >= 500 ? 'coaching_provider_busy' : 'coaching_provider_rejected');
    if (!response.body) throw new ApiError(502, 'coaching_invalid_output');
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const {done, value} = await reader.read(); if (done) break; size += value.byteLength;
        if (size > 16_384) {await reader.cancel(); throw new ApiError(502, 'coaching_invalid_output');} chunks.push(value);
      }
    } finally {reader.releaseLock();}
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
    let content: unknown;
    try {
      const result = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
      const choice = result?.choices?.[0];
      if (choice?.finish_reason !== 'stop' || choice.message?.tool_calls || choice.message?.refusal) throw new Error('Incomplete result');
      content = choice.message?.content;
    } catch {throw new ApiError(502, 'coaching_invalid_output');}
    const reply = parseWorkoutCoachingReply(context, digest, content);
    if (!reply) throw new ApiError(502, 'coaching_invalid_output');
    return reply;
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError(504, 'coaching_provider_timeout');
    throw error;
  } finally {clearTimeout(timeout);}
}
