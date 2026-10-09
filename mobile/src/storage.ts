import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/ciphers/utils.js';
import { readSavedState, readSetupDraft } from './shared/saved-data';
import { type State } from './shared/training';
import { LocalDataError, isSealed, keyFromHex, newKeyHex, openText, sealText } from './local-crypto';
import { assertNativeRecordCapacity } from './storage-capacity';

// Saved training is encrypted before it reaches AsyncStorage: XChaCha20-Poly1305 with a fresh random nonce per write.
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
let writes: Promise<void> = Promise.resolve();
let cachedKey: Uint8Array | null = null;

function enqueue<T>(task: () => Promise<T>, mode: 'read' | 'write' | 'reset' = 'write'): Promise<T> {
  const next = writes.then(async () => {
    if (mode !== 'reset') await recoverRestore(mode === 'read');
    return task();
  });
  writes = next.then(() => undefined, () => undefined);
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
  if (cachedKey) return cachedKey;
  let stored: string | null;
  try {
    stored = await SecureStore.getItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
  } catch {
    throw new LocalDataError('key-unavailable', 'This device’s secure storage could not open your data key, so saved training stays unchanged. Reopen the app to try again.');
  }
  if (stored === null) return null;
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
    assertNativeRecordCapacity(legacy);
    const key = await keyForWrite();
    await AsyncStorage.setItem(slot, sealText(legacy, key, slot, getRandomBytes));
  });
}

export async function readLocalState(): Promise<State | null> {
  const result = await enqueue(async () => {
    const raw = await AsyncStorage.getItem(KEY);
    return raw === null ? null : {raw, state: readSavedState(await openRecord(raw, KEY))};
  }, 'read');
  if (result && !isSealed(result.raw)) await migrateLegacy(KEY, result.raw).catch(() => undefined);
  return result?.state ?? null;
}

export async function saveLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readSavedState(json); // Reject invalid state before writing, as well as on read.
  assertNativeRecordCapacity(json); // Before creating a key or writing unreadable ciphertext.
  return enqueue(async () => {
    const key = await keyForWrite();
    await AsyncStorage.setItem(KEY, sealText(json, key, KEY, getRandomBytes));
  });
}

export async function resetLocalState(): Promise<void> {
  await enqueue(async () => {
    await AsyncStorage.multiRemove([KEY, SETUP_KEY, RESTORE_JOURNAL]);
    cachedKey = null;
    await SecureStore.deleteItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
    await SecureStore.deleteItemAsync(RESTORE_KEY_NAME, SECURE_OPTIONS);
  }, 'reset');
}

// Replaces everything saved on this phone with the given state, under a new data key.
// Both keys are retained in a small secure-store item before ciphertext changes.
// A durable encrypted journal lets a newly opened process finish or roll back the restore.
export async function replaceLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readSavedState(json); // Reject invalid state before anything changes.
  assertNativeRecordCapacity(json); // Before changing keys, journals or the previous record.
  return enqueue(async () => {
    // A read error is not the same as "no key": if the previous key cannot be read, nothing is changed.
    let previousHex: string | null;
    try {
      previousHex = await SecureStore.getItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
    } catch {
      throw new LocalDataError('key-unavailable', 'This phone could not read its data key. Nothing was replaced.');
    }
    const hex = newKeyHex(getRandomBytes);
    const sealed = sealText(json, keyFromHex(hex), KEY, getRandomBytes);
    const before = await AsyncStorage.getItem(KEY);
    const id = newKeyHex(getRandomBytes); // Independent randomness; never expose any key bytes as an ID.
    const recovery: RestoreKeys = {id, previous: previousHex, next: hex};
    const journal: RestoreJournal = {id, beforeHash: fingerprint(before), after: sealed, setupHash: fingerprint(await AsyncStorage.getItem(SETUP_KEY))};
    try {
      await SecureStore.setItemAsync(RESTORE_KEY_NAME, JSON.stringify(recovery), SECURE_OPTIONS);
      await AsyncStorage.setItem(RESTORE_JOURNAL, JSON.stringify(journal));
      if ((await AsyncStorage.getItem(KEY)) !== before) throw new LocalDataError('unknown-format', 'Saved records changed while preparing the restore. Nothing was overwritten. Reopen the app.');
      await AsyncStorage.setItem(KEY, sealed);
      await recoverRestore(true);
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
    return {raw, draft: readSetupDraft(await openRecord(raw, SETUP_KEY))};
  }, 'read');
  if (result && !isSealed(result.raw)) await migrateLegacy(SETUP_KEY, result.raw).catch(() => undefined);
  return result?.draft ?? null;
}

export async function saveLocalSetup(draft: ReturnType<typeof readSetupDraft>): Promise<void> {
  const json = JSON.stringify(draft);
  readSetupDraft(json);
  assertNativeRecordCapacity(json);
  return enqueue(async () => {
    const key = await keyForWrite();
    await AsyncStorage.setItem(SETUP_KEY, sealText(json, key, SETUP_KEY, getRandomBytes));
  });
}

export function clearLocalSetup(): Promise<void> {
  return enqueue(() => AsyncStorage.removeItem(SETUP_KEY));
}

export async function readLocalRaw():Promise<string|null>{await writes.catch(()=>undefined);return AsyncStorage.getItem(KEY);}
