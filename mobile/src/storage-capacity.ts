import { LocalDataError, sealedTextBytes } from './local-crypto';

// Interim guard for the installed AsyncStorage backend. This is a product limit,
// below the common Android per-row read window, not a guaranteed device quota.
// S02 replaces this whole-history snapshot with transactional encrypted entities.
export const MAX_NATIVE_RECORD_BYTES = 1_750_000;

export function assertNativeRecordCapacity(json: string): void {
  if (sealedTextBytes(json) > MAX_NATIVE_RECORD_BYTES) {
    throw new LocalDataError('storage-capacity',
      'These records exceed this app version’s local save limit. The previous saved records have not been replaced. Keep the app open and export your current changes from Settings before closing it. Retrying the same records will not increase the limit.');
  }
}

export type NativeSaveFailure = {kind: 'capacity' | 'save'; message: string};
export function nativeSaveFailure(error: unknown): NativeSaveFailure {
  if (error instanceof LocalDataError) return {
    kind: error.code === 'storage-capacity' ? 'capacity' : 'save', message: error.message,
  };
  return {kind: 'save', message:
    'The latest changes could not be confirmed as saved. Keep the app open. Retry saving or export the current records from Settings before closing it.'};
}
