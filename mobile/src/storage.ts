import AsyncStorage from '@react-native-async-storage/async-storage';
import { readSavedState, readSetupDraft } from './shared/saved-data';
import { type State } from './shared/training';

// Deliberately separate from the website and any future real account store.
// AsyncStorage is unencrypted. Store no credentials, tokens, or medical records here.
const KEY = 'training-studio:mobile-local-demo:v1';
const SETUP_KEY = 'training-studio:mobile-setup:v1';
let writes: Promise<void> = Promise.resolve();
export async function readLocalState(): Promise<State | null> {
  await writes.catch(()=>undefined);
  const raw = await AsyncStorage.getItem(KEY);
  return raw === null ? null : readSavedState(raw);
}
export async function saveLocalState(state: State): Promise<void> {
  const json = JSON.stringify(state);
  readSavedState(json); // Reject invalid state before writing, as well as on read.
  const next = writes.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, json));
  writes = next;
  return next;
}
export async function resetLocalState(): Promise<void> {
  const next = writes.catch(() => undefined).then(() => AsyncStorage.multiRemove([KEY, SETUP_KEY]));
  writes = next;
  await next;
}
export async function readLocalSetup():Promise<ReturnType<typeof readSetupDraft>|null>{
 await writes.catch(()=>undefined);
 const raw=await AsyncStorage.getItem(SETUP_KEY);return raw===null?null:readSetupDraft(raw);
}
export function saveLocalSetup(draft:ReturnType<typeof readSetupDraft>):Promise<void>{
 const json=JSON.stringify(draft);readSetupDraft(json);
 const next=writes.catch(()=>undefined).then(()=>AsyncStorage.setItem(SETUP_KEY,json));writes=next;return next;
}
export function clearLocalSetup():Promise<void>{
 const next=writes.catch(()=>undefined).then(()=>AsyncStorage.removeItem(SETUP_KEY));writes=next;return next;
}

export async function readLocalRaw():Promise<string|null>{await writes.catch(()=>undefined);return AsyncStorage.getItem(KEY);}
