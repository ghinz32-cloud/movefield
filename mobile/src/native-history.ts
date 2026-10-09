import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex, utf8ToBytes} from '@noble/ciphers/utils.js';
import type {State, Workout} from './shared/training';
import {readSavedState} from './shared/saved-data';
import {LocalDataError} from './local-crypto';
import {nativeHistorySlot} from './native-record-store';

export const NATIVE_HISTORY_FORMAT = 'movefield-native-history-v2';
type HistoryEntry = {slot: string; digest: string};
export type NativeHistoryHead = {format: typeof NATIVE_HISTORY_FORMAT; state: Omit<State, 'history'>; entries: HistoryEntry[]};
export const historyDigest = (text: string) => bytesToHex(sha256(utf8ToBytes(text)));
const damaged = () => new LocalDataError('decrypt-failed', 'Saved workout history is incomplete or damaged. Nothing was replaced. Export a recovery copy if available, or restore a transfer file before resetting.');

// IDs, ordering, workout fingerprints and the current profile/active session
// stay inside the encrypted head. SQLite sees only hashed slot names/ciphertext.
export function splitNativeHistory(state: State): {head: NativeHistoryHead; workouts: Map<string, string>} {
  readSavedState(JSON.stringify(state));
  const {history, ...base} = state;
  const workouts = new Map<string, string>();
  const entries = history.map(workout => {
    const slot = nativeHistorySlot(workout.id), text = JSON.stringify(workout);
    if (workouts.has(slot)) throw damaged();
    workouts.set(slot, text);
    return {slot, digest: historyDigest(text)};
  });
  return {head: {format: NATIVE_HISTORY_FORMAT, state: base, entries}, workouts};
}

export function parseNativeHistoryHead(text: string): NativeHistoryHead | null {
  let value: unknown;
  try {value = JSON.parse(text);} catch {throw new LocalDataError('unknown-format', 'Saved training has an unexpected format. Nothing was replaced.');}
  if (!value || typeof value !== 'object' || !('format' in value)) return null;
  const head = value as NativeHistoryHead;
  if (head.format !== NATIVE_HISTORY_FORMAT || Object.keys(head).sort().join(',') !== 'entries,format,state'
    || !head.state || typeof head.state !== 'object' || 'history' in head.state || !Array.isArray(head.entries) || head.entries.length > 5000
    || head.entries.some(entry => !entry || Object.keys(entry).sort().join(',') !== 'digest,slot'
      || typeof entry.slot !== 'string' || !/^training-studio:mobile-history:v2:[0-9a-f]{64}$/.test(entry.slot)
      || typeof entry.digest !== 'string' || !/^[0-9a-f]{64}$/.test(entry.digest))
    || new Set(head.entries.map(entry => entry.slot)).size !== head.entries.length) throw damaged();
  readSavedState(JSON.stringify({...head.state, history: []}));
  return head;
}

export function assembleNativeHistory(head: NativeHistoryHead, records: Map<string, string>): State {
  const history: Workout[] = head.entries.map(entry => {
    const text = records.get(entry.slot);
    if (text === undefined || historyDigest(text) !== entry.digest) throw damaged();
    let workout: Workout;
    try {workout = JSON.parse(text) as Workout;} catch {throw damaged();}
    if (!workout || typeof workout.id !== 'string' || nativeHistorySlot(workout.id) !== entry.slot) throw damaged();
    return workout;
  });
  return readSavedState(JSON.stringify({...head.state, history}));
}
