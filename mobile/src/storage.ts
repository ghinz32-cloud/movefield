import { nativeRecords as AsyncStorage } from './native-database';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/ciphers/utils.js';
import { readSetupDraft } from './shared/saved-data';
import {readStoredSavedState, utf8TextBytes, MAX_SAVED_STATE_BYTES, MAX_SAVED_STATE_CHARS, SavedStateCapacityError} from './shared/storage-capacity';
import { type State } from './shared/training';
import { LocalDataError, isSealed, keyFromHex, newKeyHex, openText, sealText } from './local-crypto';
import { assertNativeRecordCapacity } from './storage-capacity';
import { assembleNativeHistory, parseNativeHistoryHead, splitNativeHistory, type NativeHistoryHead } from './native-history';
import type { NativeRecordSnapshot, NativePrivacyStatus } from './native-record-store';
export type { NativePrivacyStatus } from './native-record-store';

// Saved training is encrypted before it reaches transactional SQLite snapshots:
// XChaCha20-Poly1305 with a fresh random nonce per write. Legacy AsyncStorage is
// retained until the validated encrypted migration commits and passes readback.
// The 256-bit data key lives only in the device's secure store (iOS Keychain / Android Keystore-backed storage).
// AsyncStorage never holds the key. The key is set to stay on this device, so a copy of the app data restored
// to another phone cannot be opened, and the app says so instead of replacing it.
// Store no credentials or tokens here. Settings offers password-protected transfers;
// plain JSON is an explicit export option, separate from encrypted local persistence.

// Deliberately separate from the website and any future real account store.
const KEY = 'training-studio:mobile-local-demo:v1';
const SETUP_KEY = 'training-studio:mobile-setup:v1';
const DATA_KEY_NAME = 'movefield.dataKey.v1';
const RESTORE_KEY_NAME = 'movefield.restoreKeys.v1';
const RESTORE_JOURNAL = 'training-studio:mobile-restore:v1';
const SECURE_OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
type RestoreKeys = {id: string; previous: string | null; next: string};
type RestoreJournal = {id: string; beforeHash: string | null; after: string; setupHash: string | null};
const fingerprint = (raw: string | null): string | null => raw === null ? null : bytesToHex(sha256(utf8ToBytes(raw)));

export const KEY_MISSING_MESSAGE = 'Your saved training is encrypted with a key that is not on this device. This usually happens after moving to a different phone. Nothing was replaced. To keep your training, restore your transfer file or backup below. Reset erases the saved training on this phone, so use it only if you have no file.';

// Every read and write goes through one chain, so a read never sees a half-written record.
// The chain itself never rejects; each caller still receives its own result.
// Share the whole SecureStore + SQLite lifecycle across module reloads in this
// JS runtime. SQLite CAS alone cannot serialize first-key creation or the ring
// preparation window. Separate OS processes/JS runtimes are not supported.
const lifecycleSymbol = Symbol.for('movefield.native-storage.lifecycle.v2');
const lifecycle = (globalThis as unknown as {[key: symbol]: {writes: Promise<void>}})[lifecycleSymbol] ??= {writes: Promise.resolve()};
let cachedKey: Uint8Array | null = null;
let stateToken: {raw: string | null; present: boolean; revision: number} | undefined;
let authenticatedState: {raw: string; revision: number; key: string; state: State; head: NativeHistoryHead} | undefined;

const changed = () => new LocalDataError('unknown-format', 'Saved training changed in another session. Nothing was overwritten. Reopen your saved training before editing.');
function rememberState(snapshot: NativeRecordSnapshot): void {
  stateToken = {raw: snapshot.records[KEY], present: snapshot.present[KEY], revision: snapshot.revision};
}
function assertStateToken(snapshot: NativeRecordSnapshot): void {
  if (stateToken && (stateToken.raw !== snapshot.records[KEY] || stateToken.present !== snapshot.present[KEY]
    || stateToken.raw === null && stateToken.revision !== snapshot.revision)) throw changed();
}
async function refreshOwnRevision(): Promise<void> {
  if (!stateToken) return;
  const snapshot = await AsyncStorage.snapshotRecords([KEY]);
  if (stateToken.raw === snapshot.records[KEY] && stateToken.present === snapshot.present[KEY]) rememberState(snapshot);
}

function enqueue<T>(task: () => Promise<T>, mode: 'read' | 'write' | 'reset' = 'write'): Promise<T> {
  const next = lifecycle.writes.then(async () => {
    if (mode !== 'reset') await recoverRestore(mode === 'read');
    return task();
  });
  lifecycle.writes = next.then(() => undefined, () => undefined);
  return next;
}

// Small key ring in SecureStore; ciphertext and fingerprints only in AsyncStorage.
// A fresh process rolls back an uninstalled restore or completes an installed one.
async function recoverRestore(allowCleanupPending = false): Promise<void> {
  try {
    const [keyRaw, journalRaw] = await Promise.all([
      SecureStore.getItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS), AsyncStorage.getItem(RESTORE_JOURNAL),
    ]);
    if (keyRaw === null && journalRaw === null) return;
    if (keyRaw === null) throw new LocalDataError('key-missing', 'Restore recovery keys are missing. Saved records are retained. Restore a transfer file or export records before resetting.');
    const keys: RestoreKeys = JSON.parse(keyRaw);
    if (!keys || !/^[0-9a-f]{64}$/.test(keys.id) || typeof keys.next !== 'string' || (keys.previous !== null && typeof keys.previous !== 'string')) throw Error('bad recovery keys');
    keyFromHex(keys.next); if (keys.previous) keyFromHex(keys.previous);
    if (journalRaw === null) {
      const active = await SecureStore.getItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
      if (active !== keys.previous && active !== keys.next) throw Error('unexpected active key');
      cachedKey = active ? keyFromHex(active) : null;
      await SecureStore.deleteItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS);
      return;
    }
    const journal: RestoreJournal = JSON.parse(journalRaw);
    const hashValid = (hash: string | null) => hash === null || typeof hash === 'string' && /^[0-9a-f]{64}$/.test(hash);
    if (!journal || journal.id !== keys.id || typeof journal.after !== 'string' || !isSealed(journal.after) || !hashValid(journal.beforeHash) || !hashValid(journal.setupHash)) throw Error('bad recovery journal');
    const current = await AsyncStorage.getItem(KEY);
    if (fingerprint(current) === journal.beforeHash) {
      if (keys.previous) await SecureStore.setItemAsync(DATA_KEY_NAME, keys.previous, SECURE_OPTIONS);
      else await SecureStore.deleteItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
      cachedKey = keys.previous ? keyFromHex(keys.previous) : null;
      await AsyncStorage.removeItem(RESTORE_JOURNAL);
      await SecureStore.deleteItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS);
      return;
    }
    if (current !== journal.after) throw new LocalDataError('unknown-format', 'Saved records changed during restore recovery. Nothing was overwritten. Export records before resetting.');
    let cleanupPending = false;
    if (journal.setupHash !== null && fingerprint(await AsyncStorage.getItem(SETUP_KEY)) === journal.setupHash) {
      try { await AsyncStorage.removeItem(SETUP_KEY); } catch { cleanupPending = true; }
    }
    await SecureStore.setItemAsync(DATA_KEY_NAME, keys.next, SECURE_OPTIONS);
    cachedKey = keyFromHex(keys.next);
    if (!cleanupPending) {
      await AsyncStorage.removeItem(RESTORE_JOURNAL);
      await SecureStore.deleteItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS);
    } else if (!allowCleanupPending) {
      throw new LocalDataError('key-unavailable', 'Your restore is saved. Reopen the app to finish cleanup before editing.');
    }
  } catch (error) {
    if (error instanceof LocalDataError) throw error;
    throw new LocalDataError('key-unavailable', 'Saved records and recovery keys are retained. Reopen the app to finish restore recovery.');
  }
}

async function readDataKey(): Promise<Uint8Array | null> {
  let stored: string | null;
  try {
    stored = await SecureStore.getItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
  } catch {
    throw new LocalDataError('key-unavailable', 'This device’s secure storage could not open your data key, so saved training stays unchanged. Reopen the app to try again.');
  }
  if (stored === null) {cachedKey = null; return null;}
  cachedKey = keyFromHex(stored);
  return cachedKey;
}

async function hasSealedRecord(): Promise<boolean> {
  const [state, setup] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(SETUP_KEY)]);
  return [state, setup].some(raw => raw !== null && isSealed(raw));
}

// Creates the data key on the first save. It never creates a new key while encrypted records exist,
// because a new key could not open them and the data would be lost silently.
async function keyForWrite(): Promise<Uint8Array> {
  const existing = await readDataKey();
  if (existing) return existing;
  if (await hasSealedRecord()) throw new LocalDataError('key-missing', KEY_MISSING_MESSAGE);
  const hex = newKeyHex(getRandomBytes);
  try {
    await SecureStore.setItemAsync(DATA_KEY_NAME, hex, SECURE_OPTIONS);
  } catch {
    throw new LocalDataError('key-unavailable', 'This device’s secure storage could not create a data key, so nothing was saved. Try again.');
  }
  cachedKey = keyFromHex(hex);
  return cachedKey;
}

async function openRecord(raw: string, slot: string): Promise<string> {
  if (!isSealed(raw)) return raw; // Plaintext from before encryption; the caller migrates it.
  const key = await readDataKey();
  if (!key) throw new LocalDataError('key-missing', KEY_MISSING_MESSAGE);
  return openText(raw, key, slot);
}

// Seals plaintext written before encryption existed. The compare-and-set means a newer save that landed
// first is never overwritten by the older copy read here.
function migrateLegacy(slot: string, legacy: string): Promise<void> {
  return enqueue(async () => {
    if ((await AsyncStorage.getItem(slot)) !== legacy) return;
    const plaintext = await openRecord(legacy, slot);
    assertNativeRecordCapacity(plaintext);
    const key = await keyForWrite();
    await AsyncStorage.setItem(slot, sealText(plaintext, key, slot, getRandomBytes));
    await refreshOwnRevision();
  });
}

// Read the encrypted head and all its referenced workouts from one committed
// SQLite generation. The first read discovers slots; the second checks that the
// head and global revision did not change while those slots were discovered.
async function readStateSnapshot(): Promise<{snapshot: NativeRecordSnapshot; state: State | null; head: NativeHistoryHead | null}> {
  const first = await AsyncStorage.snapshotRecords([KEY]);
  const raw = first.records[KEY];
  if (raw === null) return {snapshot: first, state: null, head: null};
  const key = isSealed(raw) ? await readDataKey() : null;
  if (isSealed(raw) && !key) throw new LocalDataError('key-missing', KEY_MISSING_MESSAGE);
  const keyDigest = key ? bytesToHex(sha256(key)) : '';
  if (authenticatedState?.raw === raw && authenticatedState.revision === first.revision && authenticatedState.key === keyDigest) {
    return {snapshot: first, state: authenticatedState.state, head: authenticatedState.head};
  }
  const text = key ? openText(raw, key, KEY) : raw, head = parseNativeHistoryHead(text);
  if (!head) return {snapshot: first, state: readStoredSavedState(text), head: null};
  const snapshot = await AsyncStorage.snapshotRecords([KEY, ...head.entries.map(entry => entry.slot)]);
  if (snapshot.revision !== first.revision || snapshot.records[KEY] !== raw) throw changed();
  const workouts = new Map<string, string>();
  // Refuse an oversized generation while opening its entities, before building
  // another full-history string or loading thousands of excessive records.
  const baseText = JSON.stringify({...head.state, history: []});
  let bytes = utf8TextBytes(baseText) - 2, chars = baseText.length - 2;
  for (const entry of head.entries) {
    const record = snapshot.records[entry.slot];
    if (record === null || !isSealed(record)) throw new LocalDataError('decrypt-failed', 'A saved workout is missing or damaged. Nothing was replaced. Export a recovery copy if available, or restore a transfer file.');
    const text = openText(record, key!, entry.slot);
    bytes += utf8TextBytes(text, MAX_SAVED_STATE_BYTES) + (workouts.size ? 1 : 0);
    chars += text.length + (workouts.size ? 1 : 0);
    if (bytes > MAX_SAVED_STATE_BYTES || chars > MAX_SAVED_STATE_CHARS) throw new SavedStateCapacityError();
    workouts.set(entry.slot, text);
  }
  const state = assembleNativeHistory(head, workouts);
  authenticatedState = {raw, revision: snapshot.revision, key: keyDigest, state, head};
  return {snapshot, state, head};
}

async function installState(state: State, current: Awaited<ReturnType<typeof readStateSnapshot>>, key: Uint8Array): Promise<void> {
  const {head, workouts} = splitNativeHistory(state);
  const records: Record<string, string | null> = {};
  const oldEntries = new Map(current.head?.entries.map(entry => [entry.slot, entry.digest]) ?? []);
  const nextEntries = new Map(head.entries.map(entry => [entry.slot, entry.digest]));
  const slots = new Set([...workouts.keys()].filter(slot => oldEntries.get(slot) !== nextEntries.get(slot)));
  for (const slot of oldEntries.keys()) if (!workouts.has(slot)) slots.add(slot);
  const snapshot = await AsyncStorage.snapshotRecords([KEY, ...slots]);
  if (snapshot.revision !== current.snapshot.revision || snapshot.records[KEY] !== current.snapshot.records[KEY]) throw changed();
  const expected: Record<string, string | null> = {[KEY]: snapshot.records[KEY]};
  for (const [slot, text] of workouts) {
    // readStateSnapshot authenticated each existing entity before any save.
    // Reuse its exact ciphertext when content is unchanged under the same key.
    if (oldEntries.get(slot) !== nextEntries.get(slot)) {expected[slot] = snapshot.records[slot]; records[slot] = sealText(text, key, slot, getRandomBytes);}
  }
  for (const slot of oldEntries.keys()) if (!workouts.has(slot)) {expected[slot] = snapshot.records[slot]; records[slot] = null;}
  const text = state.history.length || current.head ? JSON.stringify(head) : JSON.stringify(state);
  assertNativeRecordCapacity(text);
  records[KEY] = sealText(text, key, KEY, getRandomBytes);
  const committed = await AsyncStorage.commitRecords({expected, records, expectedRevision: snapshot.revision});
  rememberState(committed);
  authenticatedState = state.history.length || current.head ? {raw: committed.records[KEY]!, revision: committed.revision,
    key: bytesToHex(sha256(key)), state: readStoredSavedState(JSON.stringify(state)), head} : undefined;
}

export async function readLocalState(): Promise<State | null> {
  return enqueue(async () => {
    const current = await readStateSnapshot();
    rememberState(current.snapshot);
    if (current.state && (!current.snapshot.present[KEY] || !isSealed(current.snapshot.records[KEY] ?? '') || !current.head && current.state.history.length > 0)) {
      await installState(current.state, current, await keyForWrite());
    }
    // Resume only receipted cleanup after authenticating the complete generation.
    // The record store rechecks this exact head before touching a legacy copy.
    if (current.snapshot.present[KEY]) await AsyncStorage.retryLegacyCleanup({[KEY]: current.snapshot.records[KEY]});
    return current.state ? readStoredSavedState(JSON.stringify(current.state)) : null;
  }, 'read');
}

export async function saveLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readStoredSavedState(json); // Reject invalid state before writing, as well as on read.
  return enqueue(async () => {
    const current = await readStateSnapshot();
    assertStateToken(current.snapshot);
    const key = await keyForWrite();
    await installState(state, current, key);
  });
}

export async function resetLocalState(): Promise<NativePrivacyStatus> {
  return enqueue(async () => {
    const snapshot = await AsyncStorage.snapshotRecords([]);
    const committed = await AsyncStorage.commitRecords({expected: {}, records: {[KEY]: null, [SETUP_KEY]: null, [RESTORE_JOURNAL]: null}, expectedRevision: snapshot.revision, clearHistory: true});
    cachedKey = null;
    await SecureStore.deleteItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS);
    await SecureStore.deleteItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
    rememberState(committed);
    authenticatedState = undefined;
    return AsyncStorage.legacyCleanupStatus();
  }, 'reset');
}

// Replaces everything saved on this phone with the given state, under a new data key.
// Both keys are retained in a small secure-store item before ciphertext changes.
// A durable encrypted journal lets a newly opened process finish or roll back the restore.
export async function replaceLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readStoredSavedState(json); // Reject invalid state before anything changes.
  return enqueue(async () => {
    const initial = await AsyncStorage.snapshotRecords([KEY]);
    assertStateToken(initial);
    // A read error is not the same as "no key": if the previous key cannot be read, nothing is changed.
    let previousHex: string | null;
    try {
      previousHex = await SecureStore.getItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
    } catch {
      throw new LocalDataError('key-unavailable', 'This phone could not read its data key. Nothing was replaced.');
    }
    const hex = newKeyHex(getRandomBytes);
    const nextKey = keyFromHex(hex), {head, workouts} = splitNativeHistory(state);
    const sealed = sealText(state.history.length ? JSON.stringify(head) : json, nextKey, KEY, getRandomBytes);
    const records: Record<string, string | null> = {};
    for (const [slot, text] of workouts) records[slot] = sealText(text, nextKey, slot, getRandomBytes);
    records[KEY] = sealed;
    const before = initial.records[KEY];
    const id = newKeyHex(getRandomBytes); // Independent randomness; never expose any key bytes as an ID.
    const recovery: RestoreKeys = {id, previous: previousHex, next: hex};
    const journal: RestoreJournal = {id, beforeHash: fingerprint(before), after: sealed, setupHash: fingerprint(await AsyncStorage.getItem(SETUP_KEY))};
    try {
      await SecureStore.setItemAsync(RESTORE_KEY_NAME, JSON.stringify(recovery), SECURE_OPTIONS);
      await AsyncStorage.setItem(RESTORE_JOURNAL, JSON.stringify(journal));
      const snapshot = await AsyncStorage.snapshotRecords([KEY]);
      if (snapshot.records[KEY] !== before || snapshot.present[KEY] !== initial.present[KEY] || snapshot.revision !== initial.revision + 1) throw changed();
      const committed = await AsyncStorage.commitRecords({expected: {[KEY]: before}, records, expectedRevision: snapshot.revision, clearHistory: true});
      await recoverRestore(true);
      rememberState(committed);
      await refreshOwnRevision();
    } catch (error) {
      if ((await AsyncStorage.getItem(KEY)) === before) {
        await recoverRestore().catch(() => undefined);
        throw new LocalDataError('key-unavailable', 'This phone could not save the restore. Previous records are retained. Reopen the app to retry.');
      }
      if (error instanceof LocalDataError) throw error;
      throw new LocalDataError('key-unavailable', 'Restored records and recovery keys are retained. Reopen the app to finish recovery.');
    }
  });
}

export async function readLocalSetup(): Promise<ReturnType<typeof readSetupDraft> | null> {
  const result = await enqueue(async () => {
    const raw = await AsyncStorage.getItem(SETUP_KEY);
    if (raw === null) return null;
    const journalRaw = await AsyncStorage.getItem(RESTORE_JOURNAL);
    if (journalRaw && (JSON.parse(journalRaw) as RestoreJournal).setupHash === fingerprint(raw)) return null;
    const legacy = !await AsyncStorage.hasRecord(SETUP_KEY), draft = readSetupDraft(await openRecord(raw, SETUP_KEY));
    if (!legacy) await AsyncStorage.retryLegacyCleanup({[SETUP_KEY]: raw});
    return {raw, legacy, draft};
  }, 'read');
  if (result && (result.legacy || !isSealed(result.raw))) await migrateLegacy(SETUP_KEY, result.raw);
  return result?.draft ?? null;
}

export async function saveLocalSetup(draft: ReturnType<typeof readSetupDraft>): Promise<void> {
  const json = JSON.stringify(draft);
  readSetupDraft(json);
  assertNativeRecordCapacity(json);
  return enqueue(async () => {
    const key = await keyForWrite();
    await AsyncStorage.setItem(SETUP_KEY, sealText(json, key, SETUP_KEY, getRandomBytes));
    await refreshOwnRevision();
  });
}

export function clearLocalSetup(): Promise<void> {
  return enqueue(async () => {await AsyncStorage.removeItem(SETUP_KEY); await refreshOwnRevision();});
}

// Privacy checks never authenticate, replace, or delete records. They can run
// on the recovery screen even when the data key is missing. Failure to inspect
// old copies must not turn an acknowledged training save into a failed save.
export function readLocalPrivacyStatus(): Promise<NativePrivacyStatus> {
  return lifecycle.writes.then(() => AsyncStorage.legacyCleanupStatus());
}

export function retryLocalPrivacyCleanup(): Promise<NativePrivacyStatus> {
  return enqueue(async () => {
    const verified: Record<string, string | null> = {};
    let cannotVerify = false;
    try {
      const state = await readStateSnapshot();
      if (state.snapshot.present[KEY]) verified[KEY] = state.snapshot.records[KEY];
    } catch { cannotVerify = true; }
    try {
      const setup = await AsyncStorage.snapshotRecords([SETUP_KEY]), raw = setup.records[SETUP_KEY];
      if (setup.present[SETUP_KEY]) {
        if (raw !== null) readSetupDraft(await openRecord(raw, SETUP_KEY));
        verified[SETUP_KEY] = raw;
      }
    } catch { cannotVerify = true; }
    // An active journal must be resolved by key-ring recovery first. A validated
    // tombstone is safe; raw recovery copies never authorize legacy deletion.
    try {
      const journal = await AsyncStorage.snapshotRecords([RESTORE_JOURNAL]);
      if (journal.present[RESTORE_JOURNAL] && journal.records[RESTORE_JOURNAL] === null) verified[RESTORE_JOURNAL] = null;
    } catch { cannotVerify = true; }
    const status = await AsyncStorage.retryLegacyCleanup(verified);
    return cannotVerify && status.state === 'pending' ? {...status, state: 'attention' as const, unreadable: status.unreadable + 1} : status;
  }, 'read').catch(async () => {
    const status = await AsyncStorage.legacyCleanupStatus();
    return status.state === 'pending' ? {...status, state: 'attention' as const, unreadable: status.unreadable + 1} : status;
  });
}

// A head alone is no longer a complete recovery copy. Preserve all owned raw
// records without needing SecureStore/decryption; normal transfers still use
// the validated reconstructed State and retain their existing file format.
export async function readLocalRaw(): Promise<string | null> {
  await lifecycle.writes;
  const first = await AsyncStorage.snapshotRecords([]), slots = await AsyncStorage.listHistorySlots();
  const snapshot = await AsyncStorage.snapshotRecords([KEY, SETUP_KEY, RESTORE_JOURNAL, ...slots]);
  if (snapshot.revision !== first.revision) throw changed();
  if (!slots.length) return snapshot.records[KEY];
  return JSON.stringify({format: 'movefield-native-recovery-records-v2', revision: snapshot.revision, records: snapshot.records});
}
