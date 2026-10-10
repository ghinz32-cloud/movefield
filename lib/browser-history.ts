import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex, utf8ToBytes} from '@noble/ciphers/utils.js';
import type {State, Workout} from './training';
import {readStoredSavedState, assertStoredTextCapacity, assertHistoryHeadCapacity} from './storage-capacity';
import {BROWSER_HISTORY_PREFIX, isBrowserHistorySlot} from './browser-record-store';

export const BROWSER_HISTORY_FORMAT = 'movefield-browser-history-v1';
export type BrowserHistoryHead = {format: typeof BROWSER_HISTORY_FORMAT; state: Omit<State, 'history'>; entries: {slot: string; digest: string}[]};
export const browserHistoryDigest = (text: string) => bytesToHex(sha256(utf8ToBytes(text)));
export const browserHistorySlot = (id: string) => BROWSER_HISTORY_PREFIX + browserHistoryDigest(id);
const damaged = () => Error('Saved workout history is incomplete or damaged. Nothing was replaced. Export a recovery copy or restore a transfer file before resetting.');

export function browserStateCandidate(text: string): State | null {
  // The vault also stores setup/preferences and remains a generic ciphertext
  // facade for those slots. A profile-shaped future schema must fail closed.
  if (!text.startsWith('{')) return null;
  assertStoredTextCapacity(text);
  let value: unknown;
  try {value = JSON.parse(text);} catch {return null;}
  if (!value || typeof value !== 'object' || !('schema' in value)
    || !('history' in value) || !Array.isArray(value.history)) return null;
  return readStoredSavedState(text);
}

export function splitBrowserHistory(state: State): {head: BrowserHistoryHead; workouts: Map<string, string>} {
  const checked = readStoredSavedState(JSON.stringify(state));
  const {history, ...base} = checked, workouts = new Map<string, string>();
  const entries = history.map(workout => {
    const slot = browserHistorySlot(workout.id), text = JSON.stringify(workout);
    if (workouts.has(slot)) throw damaged();
    workouts.set(slot, text);
    return {slot, digest: browserHistoryDigest(text)};
  });
  const head = {format: BROWSER_HISTORY_FORMAT, state: base, entries} as const;
  assertHistoryHeadCapacity(JSON.stringify(head));
  return {head, workouts};
}

export function parseBrowserHistoryHead(text: string): BrowserHistoryHead | null {
  if (!text.startsWith('{')) return null;
  assertHistoryHeadCapacity(text);
  let value: unknown;
  try {value = JSON.parse(text);} catch {throw damaged();}
  if (!value || typeof value !== 'object' || !('format' in value)) return null;
  const head = value as BrowserHistoryHead;
  if (head.format !== BROWSER_HISTORY_FORMAT || Object.keys(head).sort().join(',') !== 'entries,format,state'
    || !head.state || typeof head.state !== 'object' || 'history' in head.state || !Array.isArray(head.entries) || head.entries.length > 5000
    || head.entries.some(entry => !entry || Object.keys(entry).sort().join(',') !== 'digest,slot'
      || !isBrowserHistorySlot(entry.slot) || typeof entry.digest !== 'string' || !/^[0-9a-f]{64}$/.test(entry.digest))
    || new Set(head.entries.map(entry => entry.slot)).size !== head.entries.length) throw damaged();
  readStoredSavedState(JSON.stringify({...head.state, history: []}));
  return head;
}

export function assembleBrowserHistory(head: BrowserHistoryHead, records: Map<string, string>): State {
  const history: Workout[] = head.entries.map(entry => {
    const text = records.get(entry.slot);
    if (text === undefined || browserHistoryDigest(text) !== entry.digest) throw damaged();
    let workout: Workout;
    try {workout = JSON.parse(text) as Workout;} catch {throw damaged();}
    if (!workout || typeof workout.id !== 'string' || browserHistorySlot(workout.id) !== entry.slot) throw damaged();
    return workout;
  });
  return readStoredSavedState(JSON.stringify({...head.state, history}));
}
