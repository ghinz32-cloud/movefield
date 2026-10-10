// A consistent bound for persisted profiles, history and compatible backups.
// Collection counts and field lengths are validated separately by saved-data.
export const MAX_SAVED_STATE_CHARS = 24_000_000;
export const MAX_SAVED_STATE_BYTES = 24_000_000;
// The encrypted container adds at most 5,000 hashed IDs/digests. Its validated
// inner state and reconstructed full profile still use the 24 MB profile bound.
export const MAX_HISTORY_HEAD_CHARS = 26_000_000;
export const MAX_HISTORY_HEAD_BYTES = 26_000_000;
export const MAX_TRANSFER_FILE_BYTES = 96_000_000;

export class SavedStateCapacityError extends Error {
  readonly code = 'storage-capacity';
  constructor() {
    super('These records exceed this app version’s 24 MB save limit. Previous saved records have not been replaced. Export your current changes before closing the app.');
    this.name = 'SavedStateCapacityError';
  }
}

// Count UTF-8 without allocating another buffer as large as the full history.
// Unpaired surrogates encode as U+FFFD, matching TextEncoder and native encoding.
export function utf8TextBytes(text: string, stopAfter = Number.POSITIVE_INFINITY): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code <= 0x7f) bytes++;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length
      && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4; index++;
    } else bytes += 3;
    if (bytes > stopAfter) return bytes;
  }
  return bytes;
}

export function assertStoredTextCapacity(raw: string): void {
  if (raw.length > MAX_SAVED_STATE_CHARS || utf8TextBytes(raw, MAX_SAVED_STATE_BYTES) > MAX_SAVED_STATE_BYTES)
    throw new SavedStateCapacityError();
}

export function assertHistoryHeadCapacity(raw: string): void {
  if (raw.length > MAX_HISTORY_HEAD_CHARS || utf8TextBytes(raw, MAX_HISTORY_HEAD_BYTES) > MAX_HISTORY_HEAD_BYTES)
    throw new SavedStateCapacityError();
}
