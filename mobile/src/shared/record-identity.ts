export type RecordRandom = (length: number) => Uint8Array;

let platformRandom: RecordRandom | undefined;

/** Native entry points install their secure random source before creating records. */
export function configureRecordRandom(random: RecordRandom): void {
  if (typeof random !== 'function') throw Error('A secure record random source is required.');
  platformRandom = random;
}

/** UUID v4 for newly created records. Existing record IDs never pass through here. */
export function recordUuid(): string {
  const source = platformRandom ?? ((length: number) => {
    const secure = (globalThis as typeof globalThis & {
      crypto?: { getRandomValues?: (bytes: Uint8Array) => Uint8Array };
    }).crypto;
    if (!secure?.getRandomValues) throw Error('Secure record IDs are unavailable in this runtime.');
    return secure.getRandomValues(new Uint8Array(length));
  });
  const generated = source(16);
  if (!(generated instanceof Uint8Array) || generated.length !== 16) {
    throw Error('The secure record random source returned invalid bytes.');
  }
  const bytes = new Uint8Array(generated);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validRecordTimeZone(value: string): boolean {
  if (!value || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

/** Capture the device zone when an activity starts; never guess zones for legacy history. */
export function workoutTimeMetadata(now: number): { timeZone: string; startedAtUtc: string } {
  const startedAtUtc = new Date(now).toISOString();
  let timeZone = 'UTC';
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (validRecordTimeZone(resolved)) timeZone = resolved;
  } catch {
    // UTC explicitly represents the fallback when the runtime lacks zone support.
  }
  return { timeZone, startedAtUtc };
}

export function workoutFinishedAtUtc(now: number): { finishedAtUtc: string } {
  return { finishedAtUtc: new Date(now).toISOString() };
}
