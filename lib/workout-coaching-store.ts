import {z} from 'zod';
import {getVault, isSealed, type createTransactionalVault} from './browser-vault';
import {COACHING_POLICY, workoutCoachingReplySchema} from './workout-coaching';

export const COACHING_RESULT_SLOT = 'training-studio-workout-coaching-v1';
export const COACHING_STORE_FORMAT = 'movefield-workout-coaching-results';
export const COACHING_STORE_VERSION = 1;
export const MAX_COACHING_RESULTS = 12;
export const MAX_COACHING_STORE_BYTES = 128 * 1024;

const identity = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const modelIdentity = z.string().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$/);
export const storedCoachingResultSchema = z.object({
  policy: z.literal(COACHING_POLICY),
  workoutId: identity,
  contextDigest: z.string().regex(/^[0-9a-f]{64}$/),
  event: z.object({kind: z.enum(['workout', 'lift']), exerciseId: identity.nullable()}).strict(),
  modelId: modelIdentity,
  modelRevision: modelIdentity.optional(),
  runtimeVersion: modelIdentity.optional(),
  source: z.enum(['local', 'backend']),
  reply: workoutCoachingReplySchema,
  createdAt: z.string().datetime(),
}).strict().superRefine((record, context) => {
  if (record.reply.policy !== record.policy || record.reply.workoutId !== record.workoutId || record.reply.contextDigest !== record.contextDigest)
    context.addIssue({code: z.ZodIssueCode.custom, message: 'Coaching reply does not match its saved context identity.'});
  if ((record.event.kind === 'workout') !== (record.event.exerciseId === null))
    context.addIssue({code: z.ZodIssueCode.custom, message: 'A lift result needs its exercise identity; a workout result does not.'});
});
export type StoredCoachingResult = z.infer<typeof storedCoachingResultSchema>;
export type WorkoutCoachingStoreSnapshot = {raw: string; results: StoredCoachingResult[]};
export type WorkoutCoachingVault = Pick<ReturnType<typeof createTransactionalVault>, 'readSnapshot' | 'write'>;
export type WorkoutCoachingStoreDeps = {vault?: WorkoutCoachingVault | null};
export type WorkoutCoachingStoreErrorCode = 'unavailable' | 'invalid-data' | 'conflict' | 'stale-result';
export class WorkoutCoachingStoreError extends Error {
  constructor(public code: WorkoutCoachingStoreErrorCode, message: string, public raw?: string) {
    super(message);
    this.name = 'WorkoutCoachingStoreError';
  }
}

const manifestSchema = z.object({
  format: z.literal(COACHING_STORE_FORMAT),
  version: z.literal(COACHING_STORE_VERSION),
  results: z.array(storedCoachingResultSchema).max(MAX_COACHING_RESULTS),
}).strict().superRefine((manifest, context) => {
  if (new Set(manifest.results.map(result => result.contextDigest)).size !== manifest.results.length)
    context.addIssue({code: z.ZodIssueCode.custom, message: 'Saved coaching contexts must be unique.'});
});
const invalidData = (raw?: string) => new WorkoutCoachingStoreError('invalid-data', 'Saved coaching results have an unexpected format. Nothing was replaced.', raw);
const assertCapacity = (text: string) => {
  if (text.length > MAX_COACHING_STORE_BYTES || new TextEncoder().encode(text).byteLength > MAX_COACHING_STORE_BYTES) throw invalidData();
};
function readResults(text: string | null, raw: string): StoredCoachingResult[] {
  if (text === null) return [];
  if (!isSealed(raw)) throw invalidData(raw);
  try {
    assertCapacity(text);
    return manifestSchema.parse(JSON.parse(text)).results;
  } catch { throw invalidData(raw); }
}
function serializeResults(results: StoredCoachingResult[]): string {
  const text = JSON.stringify(manifestSchema.parse({format: COACHING_STORE_FORMAT, version: COACHING_STORE_VERSION, results}));
  assertCapacity(text);
  return text;
}
const compareExpected = (raw: string, expected: string) => {
  if (typeof expected !== 'string' || raw !== expected)
    throw new WorkoutCoachingStoreError('conflict', 'Coaching results changed in another tab. Reload the saved results before trying again.');
};

// Contexts and prompts remain in memory. Only bounded, validated selections and
// their context/model identity reach the encrypted, reset-owned vault slot.
export function createWorkoutCoachingStore(deps: WorkoutCoachingStoreDeps = {}) {
  const vault = () => {
    const value = Object.prototype.hasOwnProperty.call(deps, 'vault') ? deps.vault : getVault();
    if (!value) throw new WorkoutCoachingStoreError('unavailable', 'Encrypted local storage is unavailable. Coaching results could not be saved.');
    return value;
  };
  const read = async (): Promise<WorkoutCoachingStoreSnapshot> => {
    const snapshot = await vault().readSnapshot(COACHING_RESULT_SLOT), raw = snapshot.raw ?? '';
    return {raw, results: readResults(snapshot.text, raw)};
  };
  const save = async (input: StoredCoachingResult, expectedRaw: string): Promise<WorkoutCoachingStoreSnapshot> => {
    // Parsing before the first await detaches nested reply/event objects from
    // the caller while enforcing the static reply contract and metadata binding.
    const parsed = storedCoachingResultSchema.safeParse(input);
    if (!parsed.success) throw new WorkoutCoachingStoreError('invalid-data', 'This coaching result is invalid and was not saved.');
    const record = parsed.data, adapter = vault(), snapshot = await adapter.readSnapshot(COACHING_RESULT_SLOT), before = snapshot.raw ?? '';
    compareExpected(before, expectedRaw);
    const existing = readResults(snapshot.text, before), previous = existing.find(result => result.contextDigest === record.contextDigest);
    if (previous) {
      const difference = Date.parse(record.createdAt) - Date.parse(previous.createdAt);
      if (difference < 0 || (difference === 0 && JSON.stringify(previous) !== JSON.stringify(record)))
        throw new WorkoutCoachingStoreError('stale-result', 'A newer result is already saved for this coaching context. Nothing was replaced.');
      if (difference === 0) return {raw: before, results: existing};
    }
    const results = [record, ...existing.filter(result => result.contextDigest !== record.contextDigest)]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.contextDigest.localeCompare(b.contextDigest))
      .slice(0, MAX_COACHING_RESULTS);
    if (!results.some(result => result.contextDigest === record.contextDigest))
      throw new WorkoutCoachingStoreError('stale-result', 'This result is older than the retained coaching results and was not saved.');
    const raw = await adapter.write(COACHING_RESULT_SLOT, serializeResults(results), expectedRaw);
    return {raw, results};
  };
  const clear = async (expectedRaw: string): Promise<WorkoutCoachingStoreSnapshot> => {
    // Authenticate existing ciphertext even for an explicit clear. A missing
    // key or damaged envelope must remain recoverable rather than be overwritten.
    const adapter = vault(), snapshot = await adapter.readSnapshot(COACHING_RESULT_SLOT);
    compareExpected(snapshot.raw ?? '', expectedRaw);
    const raw = await adapter.write(COACHING_RESULT_SLOT, serializeResults([]), expectedRaw);
    return {raw, results: []};
  };
  return {read, list: async () => (await read()).results, save, clear};
}
