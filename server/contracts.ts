import { z } from "zod";

export const MAX_REQUEST_BYTES = 1_100_000;
export const MAX_FEEDBACK_BYTES = 65_536;
export const recordIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const requestId = z.string().uuid();
const syncEnvelope = z.object({
  format: z.literal("movefield-sync"), version: z.literal(1),
  kdf: z.object({ name: z.literal("argon2id"), m: z.literal(19456), t: z.literal(2), p: z.literal(1), salt: z.string().regex(/^[0-9a-f]{32}$/) }).strict(),
  cipher: z.literal("aes-256-gcm"), nonce: z.string().regex(/^[0-9a-f]{24}$/),
  data: z.string().min(24).max(999_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();
const ciphertextSchema = z.string().min(1).max(1_000_000).superRefine((value, context) => {
  let envelope: unknown;
  try { envelope = JSON.parse(value); } catch { envelope = null; }
  if (!syncEnvelope.safeParse(envelope).success) context.addIssue({ code: z.ZodIssueCode.custom, message: "Encrypted sync envelope required." });
});
export const syncMutationSchema = z.object({
  mutationId: requestId, baseRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  records: z.array(z.object({ id: recordIdSchema, ciphertext: ciphertextSchema.nullable() }).strict()).min(1).max(25),
}).strict().superRefine((value, context) => {
  if (new Set(value.records.map((record) => record.id)).size !== value.records.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate record identity." });
});
export type SyncMutation = z.infer<typeof syncMutationSchema>;
const metricSchema = z.object({
  exerciseId: recordIdSchema, set: z.number().int().min(1).max(100), reps: z.number().int().min(0).max(10_000), kg: z.number().min(0).max(2_000).nullable(),
  rir: z.number().int().min(0).max(10).nullable().optional(), durationSeconds: z.number().min(0).max(86_400).optional(), distanceM: z.number().min(0).max(1_000_000).optional(),
}).strict();
export const dailyFeedbackSchema = z.object({
  requestId, workoutId: recordIdSchema, completedAt: z.string().datetime({ offset: false }), metrics: z.array(metricSchema).min(1).max(300),
  consent: z.literal(true), adult: z.literal(true), symptom: z.literal("no"),
}).strict().superRefine((value, context) => {
  const identities = value.metrics.map((metric) => `${metric.exerciseId}:${metric.set}`);
  if (new Set(identities).size !== identities.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate set identity." });
});
export type DailyFeedbackRequest = z.infer<typeof dailyFeedbackSchema>;
export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie, Origin", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" } });
}
export async function readJson(request: Request, maximum: number): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) throw new ApiError(415, "json_required");
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum)) throw new ApiError(413, "payload_too_large");
  if (!request.body) throw new ApiError(400, "invalid_payload");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break; total += value.byteLength;
      if (total > maximum) { await reader.cancel(); throw new ApiError(413, "payload_too_large"); } chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)); }
  catch { throw new ApiError(400, "invalid_payload"); }
}
export async function digestJson(value: unknown): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(hash), (part) => part.toString(16).padStart(2, "0")).join("");
}
