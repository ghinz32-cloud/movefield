import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import { readSavedState, readSetupDraft } from './shared/saved-data';
import { type State } from './shared/training';
import { LocalDataError, isSealed, keyFromHex, newKeyHex, openText, sealText } from './local-crypto';

// Saved training is encrypted before it reaches AsyncStorage: XChaCha20-Poly1305 with a fresh random nonce per write.
// The 256-bit data key lives only in the device's secure store (iOS Keychain / Android Keystore-backed storage).
// AsyncStorage never holds the key. The key is set to stay on this device, so a copy of the app data restored
// to another phone cannot be opened, and the app says so instead of replacing it.
// Store no credentials or tokens here. Backups exported from Settings are plain JSON that you choose to share.

// Deliberately separate from the website and any future real account store.
const KEY = 'training-studio:mobile-local-demo:v1';
const SETUP_KEY = 'training-studio:mobile-setup:v1';
const DATA_KEY_NAME = 'movefield.dataKey.v1';
const SECURE_OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export const KEY_MISSING_MESSAGE = 'Your saved training is encrypted with a key that is not on this device. This usually happens after moving to a different phone. Nothing was replaced. To keep your training, restore your transfer file or backup below. Reset erases the saved training on this phone, so use it only if you have no file.';

// Every read and write goes through one chain, so a read never sees a half-written record.
// The chain itself never rejects; each caller still receives its own result.
let writes: Promise<void> = Promise.resolve();
let cachedKey: Uint8Array | null = null;

function enqueue(task: () => Promise<void>): Promise<void> {
  const next = writes.then(task);
  writes = next.catch(() => undefined);
  return next;
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
    const key = await keyForWrite();
    await AsyncStorage.setItem(slot, sealText(legacy, key, slot, getRandomBytes));
  });
}

export async function readLocalState(): Promise<State | null> {
  await writes;
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) return null;
  const state = readSavedState(await openRecord(raw, KEY));
  if (!isSealed(raw)) await migrateLegacy(KEY, raw).catch(() => undefined);
  return state;
}

export async function saveLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readSavedState(json); // Reject invalid state before writing, as well as on read.
  return enqueue(async () => {
    const key = await keyForWrite();
    await AsyncStorage.setItem(KEY, sealText(json, key, KEY, getRandomBytes));
  });
}

export async function resetLocalState(): Promise<void> {
  await enqueue(async () => {
    await AsyncStorage.multiRemove([KEY, SETUP_KEY]);
    cachedKey = null;
    await SecureStore.deleteItemAsync(DATA_KEY_NAME, SECURE_OPTIONS);
  });
}

// Replaces everything saved on this phone with the given state, under a new data key.
// Nothing is deleted before the new record exists. If any step fails, the previous key is put back, so the
// previous record still opens, or the caller is told that nothing was replaced.
export async function replaceLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readSavedState(json); // Reject invalid state before anything changes.
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
    try {
      await SecureStore.setItemAsync(DATA_KEY_NAME, hex, SECURE_OPTIONS);
    } catch {
      throw new LocalDataError('key-unavailable', 'This phone could not create a new data key. Nothing was replaced.');
    }
    try {
      await AsyncStorage.setItem(KEY, sealed);
    } catch {
      // The stored record was not written, so it is still sealed with the previous key, which goes back.
      if (previousHex) await SecureStore.setItemAsync(DATA_KEY_NAME, previousHex, SECURE_OPTIONS).catch(() => undefined);
      else await SecureStore.deleteItemAsync(DATA_KEY_NAME, SECURE_OPTIONS).catch(() => undefined);
      cachedKey = previousHex ? keyFromHex(previousHex) : null;
      throw new LocalDataError('key-unavailable', 'This phone could not save the restored data. Nothing was replaced.');
    }
    // The new record is stored, so the restore has happened. Removing the setup draft (tied to the old data) is
    // cleanup: if it fails, the restore still stands and the draft is ignored on the next read.
    await AsyncStorage.removeItem(SETUP_KEY).catch(() => undefined);
    cachedKey = keyFromHex(hex);
  });
}

export async function readLocalSetup(): Promise<ReturnType<typeof readSetupDraft> | null> {
  await writes;
  const raw = await AsyncStorage.getItem(SETUP_KEY);
  if (raw === null) return null;
  const draft = readSetupDraft(await openRecord(raw, SETUP_KEY));
  if (!isSealed(raw)) await migrateLegacy(SETUP_KEY, raw).catch(() => undefined);
  return draft;
}

export async function saveLocalSetup(draft: ReturnType<typeof readSetupDraft>): Promise<void> {
  const json = JSON.stringify(draft);
  readSetupDraft(json);
  return enqueue(async () => {
    const key = await keyForWrite();
    await AsyncStorage.setItem(SETUP_KEY, sealText(json, key, SETUP_KEY, getRandomBytes));
  });
}

export function clearLocalSetup(): Promise<void> {
  return enqueue(() => AsyncStorage.removeItem(SETUP_KEY));
}

export async function readLocalRaw():Promise<string|null>{await writes.catch(()=>undefined);return AsyncStorage.getItem(KEY);}
