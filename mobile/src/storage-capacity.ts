import { LocalDataError, sealedTextBytes } from './local-crypto';
import {MAX_HISTORY_HEAD_BYTES, SavedStateCapacityError} from './shared/record-capacity';

// SQLite partitions encrypted snapshots into bounded rows. This limit protects
// client memory while opening a snapshot; OS free-space failures remain possible.
// The shared 24MB/5,000-workout schema limit also applies. Hex encoding needs
// twice the head-container byte budget plus fixed envelope metadata.
export const MAX_NATIVE_RECORD_BYTES = MAX_HISTORY_HEAD_BYTES * 2 + 2048;

export function assertNativeRecordCapacity(json: string): void {
  if (sealedTextBytes(json) > MAX_NATIVE_RECORD_BYTES) {
    throw new LocalDataError('storage-capacity',
      'These records exceed this app version’s local save limit. The previous saved records have not been replaced. Keep the app open and export your current changes from Settings before closing it. Retrying the same records will not increase the limit.');
  }
}

export type NativeSaveFailure = {kind: 'capacity' | 'save'; message: string};
export function nativeSaveFailure(error: unknown): NativeSaveFailure {
  if (error instanceof SavedStateCapacityError) return {kind: 'capacity', message: error.message};
  if (error instanceof LocalDataError) return {
    kind: error.code === 'storage-capacity' ? 'capacity' : 'save', message: error.message,
  };
  return {kind: 'save', message:
    'The latest changes could not be confirmed as saved. Keep the app open. Retry saving or export the current records from Settings before closing it.'};
}
