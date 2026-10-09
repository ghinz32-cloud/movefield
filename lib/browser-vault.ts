import {createBrowserRecordStore, BrowserRecordStoreError, type BrowserRecordSnapshot} from './browser-record-store';
import {assembleBrowserHistory, browserStateCandidate, parseBrowserHistoryHead, splitBrowserHistory, type BrowserHistoryHead} from './browser-history';
import {assertStoredTextCapacity, MAX_SAVED_STATE_BYTES, MAX_SAVED_STATE_CHARS, SavedStateCapacityError, utf8TextBytes} from './storage-capacity';
import type {SyncEnqueue, SyncClaimInput, SyncAckInput, SyncFailInput, SyncOutboxState} from './sync-outbox';

// Encrypts this browser's saved training data before it reaches persistent storage.
// Each record is sealed with AES-256-GCM. The data key is non-extractable and kept in IndexedDB,
// so page code can use it to open records but cannot read its bytes or copy it out.
// The slot name is the associated data, so a sealed record copied into another slot will not open.
// Dependencies are injected so the checks can run in Node. The browser instance is built by browserVault().

export const VAULT_VERSION = 1;
export const VAULT_ALG = 'aes-256-gcm';
export const VAULT_SLOTS = [
  'training-studio-v2',
  'training-studio-setup-v1',
  'training-studio-sample-setup',
  'training-studio-security-preview-v1',
  'training-studio-sample-security',
  'training-studio-workout-coaching-v1',
] as const;

export const KEY_MISSING_MESSAGE = 'Your saved training is encrypted with a key that is not in this browser. Nothing was replaced. Restore a transfer file to continue, or start a fresh profile.';
const DECRYPT_MESSAGE = 'Your saved training could not be opened. It may be damaged. Nothing was replaced.';
const KEY_UNAVAILABLE_MESSAGE = 'This browser would not keep the encryption key, so changes are not saved here. Export a transfer file to keep your work.';
const LOCK_UNAVAILABLE_MESSAGE = 'This browser cannot protect saves across open tabs. Your saved records are unchanged. Export your current work and use an updated browser with Web Locks before editing or restoring.';

export type VaultErrorCode = 'key-missing' | 'key-unavailable' | 'decrypt-failed' | 'unknown-format' | 'conflict';
export class VaultError extends Error {
  code: VaultErrorCode;
  constructor(code: VaultErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'VaultError';
  }
}

export type KeyStore = {
  get(): Promise<CryptoKey | undefined>;
  put(key: CryptoKey): Promise<void>;
  remove(): Promise<void>;
  getTransition(): Promise<VaultTransition | undefined>;
  prepareTransition(transition: VaultTransition): Promise<void>;
  // Updates the active key and optionally deletes the journal in one IndexedDB transaction.
  finishTransition(key: CryptoKey | null, keepJournal?: boolean): Promise<void>;
};
export type VaultTransition = {
  slot: string;
  beforeHash: string | null;
  after: string;
  previous: CryptoKey | null;
  next: CryptoKey;
  obsolete: Record<string, string | null>;
};
export type VaultStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
export type VaultDeps = {
  storage: VaultStorage;
  keys: KeyStore;
  subtle: SubtleCrypto;
  random: (n: number) => Uint8Array<ArrayBuffer>;
  slots?: readonly string[];
  lock?: <T>(job: () => Promise<T>) => Promise<T>;
  restoreSafe?: boolean;
};

const PREFIX = `{"v":${VAULT_VERSION},"alg":"${VAULT_ALG}"`;
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => {
  if (!B64.test(text)) throw new VaultError('unknown-format', 'Saved data has an unexpected format.');
  const binary = atob(text);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

// True only for records this module wrote. Plaintext training data never starts with this prefix.
export function isSealed(raw: string | null | undefined): boolean {
  return typeof raw === 'string' && raw.startsWith(PREFIX);
}

export function createVault(deps: VaultDeps) {
  const slots = deps.slots ?? VAULT_SLOTS;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', {fatal: true});
  let cached: CryptoKey | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const associated = (slot: string) => encoder.encode(`movefield-vault:${VAULT_VERSION}:${slot}`);
  const anySealed = () => slots.some(slot => isSealed(deps.storage.getItem(slot)));
  const fingerprint = async (raw: string | null): Promise<string | null> => raw === null ? null : toBase64(new Uint8Array(await deps.subtle.digest('SHA-256', encoder.encode(raw))));

  // The journal keeps both non-extractable keys and ciphertexts, never plaintext. A new
  // page can decide which key to activate from the single atomic localStorage write.
  // Reads may proceed while obsolete-slot cleanup is blocked; mutations wait for cleanup.
  async function recoverTransition(allowCleanupPending = false): Promise<void> {
    let transition: VaultTransition | undefined;
    try { transition = await deps.keys.getTransition(); }
    catch { throw new VaultError('key-unavailable', KEY_UNAVAILABLE_MESSAGE); }
    if (!transition) return;
    // Recovery changes keys too. An unlocked read must never race a writer/reset
    // while activating a prepared restore, even when ordinary reads are allowed.
    if (deps.restoreSafe === false) throw new VaultError('key-unavailable', LOCK_UNAVAILABLE_MESSAGE);
    if (!slots.includes(transition.slot) || !isSealed(transition.after) || !transition.obsolete || typeof transition.obsolete !== 'object') {
      throw new VaultError('unknown-format', 'Restore recovery has an unexpected format. Export records before resetting this profile.');
    }
    const current = deps.storage.getItem(transition.slot);
    if (await fingerprint(current) === transition.beforeHash) {
      try { await deps.keys.finishTransition(transition.previous); }
      catch { throw new VaultError('key-unavailable', 'The previous records are retained. Reopen the app to finish restore recovery.'); }
      cached = transition.previous;
      return;
    }
    if (current !== transition.after) {
      throw new VaultError('conflict', 'Saved records changed during restore recovery. Nothing was overwritten. Export records and reopen this profile.');
    }
    let cleanupPending = false;
    for (const other of slots) {
      if (other === transition.slot || transition.obsolete[other] === null || transition.obsolete[other] === undefined) continue;
      // Never erase data another writer has changed since the restore was prepared.
      if (await fingerprint(deps.storage.getItem(other)) !== transition.obsolete[other]) continue;
      try { deps.storage.removeItem(other); } catch { cleanupPending = true; }
    }
    try { await deps.keys.finishTransition(transition.next, cleanupPending); }
    catch { throw new VaultError('key-unavailable', 'The restored records are retained. Reopen the app to finish restore recovery.'); }
    cached = transition.next;
    if (cleanupPending && !allowCleanupPending) {
      throw new VaultError('key-unavailable', 'Your restore is saved. Reopen the app to finish cleanup before editing.');
    }
  }

  async function loadKey(): Promise<CryptoKey | null> {
    // Another tab can replace the key during an approved restore.
    let key: CryptoKey | undefined;
    try {
      key = await deps.keys.get();
    } catch {
      throw new VaultError('key-unavailable', KEY_UNAVAILABLE_MESSAGE);
    }
    cached = key ?? null;
    return cached;
  }

  async function createKey(): Promise<CryptoKey> {
    const key = await deps.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']) as CryptoKey;
    try {
      await deps.keys.put(key);
      const stored = await deps.keys.get();
      if (!stored) throw new Error('missing');
      cached = stored;
      return stored;
    } catch {
      throw new VaultError('key-unavailable', KEY_UNAVAILABLE_MESSAGE);
    }
  }

  async function sealRecord(key: CryptoKey, slot: string, text: string): Promise<string> {
    const iv = deps.random(12);
    const sealed = new Uint8Array(await deps.subtle.encrypt({name: 'AES-GCM', iv, additionalData: associated(slot), tagLength: 128}, key, encoder.encode(text)));
    return `${PREFIX},"iv":"${toBase64(iv)}","data":"${toBase64(sealed)}"}`;
  }

  // Keys are created only when no sealed record exists. A missing key with sealed records is reported, never replaced.
  function checkExpected(slot:string,expected?:string){
    if(expected!==undefined&&(deps.storage.getItem(slot)||'')!==expected)throw new VaultError('conflict','Your saved profile changed in another tab. Export this window and reload before editing.');
  }
  async function sealAndStore(slot: string, text: string, expected?:string): Promise<string> {
    checkExpected(slot,expected);
    let key = await loadKey();
    if (!key) {
      if (anySealed()) throw new VaultError('key-missing', KEY_MISSING_MESSAGE);
      key = await createKey();
    }
    const raw = await sealRecord(key, slot, text);
    checkExpected(slot,expected);
    deps.storage.setItem(slot, raw);
    return raw;
  }

  function enqueue<T>(job: () => Promise<T>, mode: 'read' | 'write' | 'reset' = 'write'): Promise<T> {
    const recovered = async () => {
      // A per-page queue cannot protect first-key creation or key deletion from
      // another tab. Without an origin-wide lock, keep read/export available but
      // reject every mutation before touching ciphertext, keys or journals.
      if (mode !== 'read' && deps.restoreSafe === false) throw new VaultError('key-unavailable', LOCK_UNAVAILABLE_MESSAGE);
      if (mode !== 'reset') await recoverTransition(mode === 'read');
      return job();
    };
    const run = queue.then(() => deps.lock ? deps.lock(recovered) : recovered());
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    // Used by the transactional store to finish the old cross-store journal before import.
    recover(): Promise<void> { return enqueue(async () => undefined, 'read'); },
    // Seals text into a slot. Returns the stored record so the caller can detect changes made in another tab.
    write(slot: string, text: string, expected?:string): Promise<string> {
      return enqueue(() => sealAndStore(slot, text, expected));
    },
    // Returns plaintext, or null when the slot is empty. Plaintext from before encryption is returned as-is;
    // the next write seals it.
    read(slot: string): Promise<string | null> {
      return enqueue(async () => {
        const raw = deps.storage.getItem(slot);
        if (raw === null) return null;
        const pending = await deps.keys.getTransition();
        // An approved restore invalidates the captured setup/profile previews even if
        // the browser currently denies their removal. They must not be opened with the new key.
        if (pending && pending.slot !== slot && pending.obsolete[slot] === await fingerprint(raw)) return null;
        if (!isSealed(raw)) return raw;
        const parsed = parseRecord(raw);
        const key = await loadKey();
        if (!key) throw new VaultError('key-missing', KEY_MISSING_MESSAGE);
        try {
          const plain = await deps.subtle.decrypt({name: 'AES-GCM', iv: parsed.iv, additionalData: associated(slot), tagLength: 128}, key, parsed.data);
          return decoder.decode(plain);
        } catch {
          throw new VaultError('decrypt-failed', DECRYPT_MESSAGE);
        }
      }, 'read');
    },
    // Prepare both keys durably before changing the ciphertext. Startup recovery rolls back
    // an uninstalled restore or finishes an installed restore after a crash/page shutdown.
    replace(slot: string, text: string, expected?:string): Promise<string> {
      return enqueue(async () => {
        if (deps.restoreSafe === false) {
          throw new VaultError('key-unavailable', 'This browser cannot lock a restore across open tabs. Use an updated browser with Web Locks to restore safely. Your records are unchanged.');
        }
        checkExpected(slot,expected);
        let previous: CryptoKey | null;
        try {
          previous = (await deps.keys.get()) ?? null;
        } catch {
          throw new VaultError('key-unavailable', KEY_UNAVAILABLE_MESSAGE);
        }
        const next = await deps.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']) as CryptoKey;
        const raw = await sealRecord(next, slot, text);
        checkExpected(slot,expected);
        const before = deps.storage.getItem(slot);
        const obsolete = Object.fromEntries(await Promise.all(slots.filter(other => other !== slot).map(async other => [other, await fingerprint(deps.storage.getItem(other))])));
        try {
          await deps.keys.prepareTransition({slot, beforeHash: await fingerprint(before), after: raw, previous, next, obsolete});
          checkExpected(slot, before ?? '');
          deps.storage.setItem(slot, raw);
          await recoverTransition(true);
        } catch (error) {
          // Keep the journal on recovery failure, so a fresh page still has both keys.
          if (deps.storage.getItem(slot) === before) {
            await recoverTransition().catch(() => undefined);
            if (error instanceof VaultError && error.code === 'conflict') throw error;
            throw new VaultError('key-unavailable', 'Your saved training could not be replaced. The previous records are retained. Reopen the app to retry.');
          }
          if (error instanceof VaultError) throw error;
          throw new VaultError('key-unavailable', 'The restored records are retained. Reopen the app to finish restore recovery.');
        }
        return raw;
      });
    },
    // Removes every training record and the key. Only call after the person has confirmed a reset.
    reset(): Promise<void> {
      return enqueue(async () => {
        for (const slot of slots) deps.storage.removeItem(slot);
        cached = null;
        await deps.keys.finishTransition(null);
      }, 'reset');
    },
    // Removes one record and keeps the key, so the other records still open.
    discard(slot: string): Promise<void> {
      return enqueue(async () => {
        deps.storage.removeItem(slot);
      });
    },
    hasSealedRecords: anySealed,
    // Whether a key is present in this browser. Used by the app to explain a missing key without reading data.
    async hasKey(): Promise<boolean> {
      return enqueue(async () => {
        try {
          return Boolean(await deps.keys.get());
        } catch {
          return false;
        }
      }, 'read');
    },
  };
}

function parseRecord(raw: string): {iv: Uint8Array<ArrayBuffer>; data: Uint8Array<ArrayBuffer>} {
  let value: Record<string,unknown>;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new VaultError('unknown-format', 'Saved data has an unexpected format.');
  }
  if (!value || value.v !== VAULT_VERSION || value.alg !== VAULT_ALG || typeof value.iv !== 'string' || typeof value.data !== 'string') {
    throw new VaultError('unknown-format', 'Saved data has an unexpected format.');
  }
  const iv = fromBase64(value.iv);
  if (iv.length !== 12) throw new VaultError('unknown-format', 'Saved data has an unexpected format.');
  return {iv, data: fromBase64(value.data)};
}

export type TransactionalVaultDeps = {
  idb: IDBFactory;
  legacy: VaultStorage;
  subtle: SubtleCrypto;
  random: (n: number) => Uint8Array<ArrayBuffer>;
  slots?: readonly string[];
  lock?: <T>(job: () => Promise<T>) => Promise<T>;
  restoreSafe: boolean;
  writerId?: string;
  notify?: () => void;
};

// The current browser backend commits ciphertext, key and deletion markers in
// one transaction. The legacy vault is retained only for journal recovery/import.
export function createTransactionalVault(deps: TransactionalVaultDeps) {
  const slots = deps.slots ?? VAULT_SLOTS;
  const keys = indexedDbKeyStore(deps.idb);
  const store = createBrowserRecordStore({idb: deps.idb, legacy: deps.legacy, slots});
  const legacy = createVault({storage: deps.legacy, keys, subtle: deps.subtle, random: deps.random, slots, restoreSafe: deps.restoreSafe});
  const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal: true});
  let queue: Promise<unknown> = Promise.resolve();
  const associated = (slot: string) => encoder.encode(`movefield-vault:${VAULT_VERSION}:${slot}`);
  const announce = () => { try { deps.notify?.(); } catch {} };
  const profileSlot = 'training-studio-v2';
  let historyCache: {raw: string; revision: number; keyRevision: number; text: string; head: BrowserHistoryHead} | undefined;
  const legacyRecords = () => Object.fromEntries(slots.map(slot => [slot, deps.legacy.getItem(slot)]));
  const currentRaw = (snapshot: BrowserRecordSnapshot, slot: string) => snapshot.migrated ? snapshot.records[slot] ?? null : deps.legacy.getItem(slot);
  const expectedRaw = (raw: string | null, expected?: string) => {
    if (expected !== undefined && (raw ?? '') !== expected) throw new VaultError('conflict', 'Your saved profile changed in another tab. Export this window and reload before editing.');
  };
  async function seal(key: CryptoKey, slot: string, text: string) {
    const iv = deps.random(12);
    const data = new Uint8Array(await deps.subtle.encrypt({name: 'AES-GCM', iv, additionalData: associated(slot), tagLength: 128}, key, encoder.encode(text)));
    return `${PREFIX},"iv":"${toBase64(iv)}","data":"${toBase64(data)}"}`;
  }
  async function decrypt(snapshot: BrowserRecordSnapshot, slot: string, raw: string | null) {
    if (raw === null) return null;
    if (!isSealed(raw)) throw new VaultError('unknown-format', 'Saved encrypted records have an unexpected format. Nothing was replaced.');
    const parsed = parseRecord(raw);
    if (!snapshot.key) throw new VaultError('key-missing', KEY_MISSING_MESSAGE);
    try {return decoder.decode(await deps.subtle.decrypt({name: 'AES-GCM', iv: parsed.iv, additionalData: associated(slot), tagLength: 128}, snapshot.key, parsed.data));}
    catch {throw new VaultError('decrypt-failed', DECRYPT_MESSAGE);}
  }
  async function prepare() {
    let snapshot = await store.snapshot();
    if (!snapshot.migrated && snapshot.transition) {
      await legacy.recover();
      snapshot = await store.snapshot();
    }
    return snapshot;
  }
  async function importRecords(snapshot: BrowserRecordSnapshot) {
    // A prior restore with denied legacy cleanup remains readable through its
    // journal. Do not hide those restored records behind a migration failure.
    if (snapshot.migrated || snapshot.transition || !deps.restoreSafe) return snapshot;
    const before = legacyRecords();
    const sealedExists = Object.values(before).some(isSealed);
    const plaintextExists = Object.values(before).some(raw => raw !== null && !isSealed(raw));
    if (!snapshot.key && sealedExists && plaintextExists) throw new VaultError('key-missing', KEY_MISSING_MESSAGE);
    const nextKey = !snapshot.key && plaintextExists ? await deps.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']) as CryptoKey : undefined;
    const key = snapshot.key ?? nextKey;
    const records: Record<string, string | null> = {};
    for (const slot of slots) {
      const raw = before[slot];
      records[slot] = raw === null || isSealed(raw) ? raw : await seal(key!, slot, raw);
    }
    const imported = await store.importLegacy({expected: snapshot, legacy: before, records, key: nextKey});
    await store.cleanupLegacy(imported);
    announce();
    return imported;
  }
  async function cleanupRetiredLegacy(before: Record<string, string | null>) {
    // This is best-effort cleanup after a committed replacement/reset. Durable
    // migrated/tombstone state makes any retained legacy bytes non-authoritative.
    for (const slot of slots) try {if (before[slot] !== null && deps.legacy.getItem(slot) === before[slot]) deps.legacy.removeItem(slot);} catch {}
  }
  function retiredLegacy(snapshot: BrowserRecordSnapshot) {
    if (!snapshot.migrated) return legacyRecords();
    try {return legacyRecords();} catch {return Object.fromEntries(slots.map(slot => [slot, null]));}
  }
  function enqueue<T>(job: () => Promise<T>, mutation = false): Promise<T> {
    const run = async () => {
      if (mutation && !deps.restoreSafe) throw new VaultError('key-unavailable', LOCK_UNAVAILABLE_MESSAGE);
      try {return await job();}
      catch (error) {
        if (error instanceof BrowserRecordStoreError) throw new VaultError(error.code === 'conflict' ? 'conflict' : error.code === 'unknown-format' ? 'unknown-format' : 'key-unavailable', error.message);
        throw error;
      }
    };
    const result = queue.then(() => deps.lock ? deps.lock(run) : run());
    queue = result.catch(() => undefined);
    return result;
  }
  async function sameGeneration(before: BrowserRecordSnapshot, after: BrowserRecordSnapshot, slot: string) {
    if (before.revision !== after.revision || before.keyRevision !== after.keyRevision || before.records[slot] !== after.records[slot])
      throw new VaultError('conflict', 'Your saved profile changed in another tab. Nothing was replaced.');
    // A fresh key read must still open the authenticated head, including after
    // an unsupported same-shaped key change outside the transaction facade.
    await decrypt(after, slot, after.records[slot] ?? null);
  }
  async function openProfile(snapshot: BrowserRecordSnapshot, slot: string): Promise<{snapshot: BrowserRecordSnapshot; text: string | null; head: BrowserHistoryHead | null}> {
    const raw = snapshot.records[slot] ?? null, text = await decrypt(snapshot, slot, raw);
    if (slot !== profileSlot || text === null) return {snapshot, text, head: null};
    let head: BrowserHistoryHead | null;
    try {head = parseBrowserHistoryHead(text);} catch (error) {
      if (error instanceof SavedStateCapacityError) throw error;
      throw new VaultError('decrypt-failed', DECRYPT_MESSAGE);
    }
    if (!head) {
      browserStateCandidate(text);
      return {snapshot, text, head};
    }
    if (historyCache && historyCache.raw === raw && historyCache.revision === snapshot.revision && historyCache.keyRevision === snapshot.keyRevision)
      return {snapshot, text: historyCache.text, head: historyCache.head};
    const entities = await store.snapshot(head.entries.map(entry => entry.slot));
    await sameGeneration(snapshot, entities, slot);
    const records = new Map<string, string>(), base = JSON.stringify({...head.state, history: []});
    let bytes = utf8TextBytes(base), chars = base.length;
    for (const entry of head.entries) {
      const value = await decrypt(entities, entry.slot, entities.records[entry.slot] ?? null);
      if (value === null) throw new VaultError('decrypt-failed', DECRYPT_MESSAGE);
      bytes += utf8TextBytes(value, MAX_SAVED_STATE_BYTES) + 1; chars += value.length + 1;
      if (bytes > MAX_SAVED_STATE_BYTES + 1 || chars > MAX_SAVED_STATE_CHARS + 1) throw new SavedStateCapacityError();
      records.set(entry.slot, value);
    }
    let assembled: string;
    try {assembled = JSON.stringify(assembleBrowserHistory(head, records));} catch (error) {
      if (error instanceof SavedStateCapacityError) throw error;
      throw new VaultError('decrypt-failed', DECRYPT_MESSAGE);
    }
    historyCache = {raw: raw!, revision: snapshot.revision, keyRevision: snapshot.keyRevision, text: assembled, head};
    return {snapshot, text: assembled, head};
  }
  async function commitProfile(snapshot: BrowserRecordSnapshot, slot: string, text: string, nextKey?: CryptoKey, sync?: SyncEnqueue, existingHead?: BrowserHistoryHead | null) {
    assertStoredTextCapacity(text);
    const state = slot === profileSlot ? browserStateCandidate(text) : null;
    const split = state ? splitBrowserHistory(state) : null;
    const oldHead = existingHead === undefined && slot === profileSlot ? (await openProfile(snapshot, slot)).head : existingHead;
    const old = new Map((oldHead?.entries ?? []).map(entry => [entry.slot, entry.digest]));
    const changed = split?.head.entries.filter(entry => old.get(entry.slot) !== entry.digest) ?? [];
    const retired = [...old.keys()].filter(oldSlot => !split?.workouts.has(oldSlot));
    const requested = [...changed.map(entry => entry.slot), ...retired];
    let expected = snapshot;
    if (requested.length) {
      expected = await store.snapshot(requested);
      await sameGeneration(snapshot, expected, slot);
    }
    const key = snapshot.key ?? nextKey!;
    const raw = await seal(key, slot, split ? JSON.stringify(split.head) : text);
    const records: Record<string, string | null> = {[slot]: raw};
    for (const entry of changed) records[entry.slot] = await seal(key, entry.slot, split!.workouts.get(entry.slot)!);
    for (const oldSlot of retired) records[oldSlot] = null;
    const committed = await store.compareAndCommit({expected, records, key: nextKey, sync});
    historyCache = split ? {raw, revision: committed.revision, keyRevision: committed.keyRevision, text: JSON.stringify(state), head: split.head} : undefined;
    return raw;
  }
  const readSnapshot = (slot: string) => enqueue(async () => {
    const snapshot = await importRecords(await prepare());
    if (!snapshot.migrated) return {raw: deps.legacy.getItem(slot), text: await legacy.read(slot)};
    const opened = await openProfile(snapshot, slot);
    let raw = snapshot.records[slot] ?? null;
    // Existing whole records remain authoritative until the complete encrypted
    // entity generation commits. A refusal/abort cannot remove the old source.
    if (slot === profileSlot && opened.text !== null && !opened.head && deps.restoreSafe && browserStateCandidate(opened.text)) {
      raw = await commitProfile(snapshot, slot, opened.text, undefined, undefined, null);
      announce();
    }
    return {raw, text: opened.text};
  });
  return {
    writerId: deps.writerId,
    readSnapshot,
    raw: (slot: string) => enqueue(async () => currentRaw(await store.snapshot(), slot)),
    read: async (slot: string) => (await readSnapshot(slot)).text,
    write: (slot: string, text: string, expected?: string, sync?: SyncEnqueue) => enqueue(async () => {
      // Compare the caller's legacy bytes before importing, then compare the
      // committed database snapshot again within the final write transaction.
      let snapshot = await prepare();
      expectedRaw(currentRaw(snapshot, slot), expected);
      snapshot = await importRecords(snapshot);
      let nextKey: CryptoKey | undefined;
      if (!snapshot.key) {
        if (Object.values(snapshot.records).some(isSealed)) throw new VaultError('key-missing', KEY_MISSING_MESSAGE);
        nextKey = await deps.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']) as CryptoKey;
      }
      const raw = await commitProfile(snapshot, slot, text, nextKey, sync);
      announce();
      return raw;
    }, true),
    replace: (slot: string, text: string, expected?: string) => enqueue(async () => {
      const snapshot = await prepare();
      expectedRaw(currentRaw(snapshot, slot), expected);
      const before = retiredLegacy(snapshot);
      const next = await deps.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']) as CryptoKey;
      assertStoredTextCapacity(text);
      const state = slot === profileSlot ? browserStateCandidate(text) : null, split = state ? splitBrowserHistory(state) : null;
      const raw = await seal(next, slot, split ? JSON.stringify(split.head) : text);
      const records: Record<string, string | null> = Object.fromEntries(slots.map(other => [other, other === slot ? raw : null]));
      if (split) for (const [historySlot, workout] of split.workouts) records[historySlot] = await seal(next, historySlot, workout);
      if (!snapshot.migrated) expectedRaw(deps.legacy.getItem(slot), expected);
      const committed = await store.compareAndCommit({expected: snapshot, records, key: next, clearHistory: true, clearTransition: true, migrated: true});
      historyCache = split ? {raw, revision: committed.revision, keyRevision: committed.keyRevision, text: JSON.stringify(state), head: split.head} : undefined;
      await cleanupRetiredLegacy(before);
      announce();
      return raw;
    }, true),
    reset: () => enqueue(async () => {
      const snapshot = await store.snapshot(), before = retiredLegacy(snapshot);
      await store.reset(snapshot);
      historyCache = undefined;
      await cleanupRetiredLegacy(before);
      announce();
    }, true),
    discard: (slot: string) => enqueue(async () => {
      const snapshot = await importRecords(await prepare());
      if (slot === profileSlot) {
        await store.compareAndCommit({expected: snapshot, records: {[slot]: null}, clearHistory: true});
        historyCache = undefined;
      } else await store.discard(snapshot, slot);
      announce();
    }, true),
    hasKey: () => enqueue(async () => Boolean((await store.snapshot()).key)),
    hasSealedRecords: () => enqueue(async () => {
      const snapshot = await store.snapshot();
      return Object.values(snapshot.migrated ? snapshot.records : legacyRecords()).some(isSealed) || (await store.listHistorySlots()).length > 0;
    }),
    // A damaged/missing-key head alone cannot recover individually sealed rows.
    // Include all owned history ciphertext without opening records or key bytes.
    recoveryCopy: () => enqueue(async () => {
      const snapshot = await store.snapshot(), historySlots = await store.listHistorySlots();
      const records = {...(snapshot.migrated ? snapshot.records : legacyRecords())};
      for (let start = 0; start < historySlots.length; start += 5000) {
        const part = await store.snapshot(historySlots.slice(start, start + 5000));
        if (part.revision !== snapshot.revision || part.keyRevision !== snapshot.keyRevision || part.records[profileSlot] !== snapshot.records[profileSlot])
          throw new VaultError('conflict', 'Saved records changed while preparing the recovery copy. Retry before resetting.');
        for (const slot of historySlots.slice(start, start + 5000)) if (part.records[slot] !== null) records[slot] = part.records[slot];
      }
      return JSON.stringify({format: 'movefield-browser-recovery-v1', revision: snapshot.revision, keyRevision: snapshot.keyRevision, records});
    }),
    syncSnapshot: () => enqueue(() => store.syncSnapshot()),
    claimSync: (input: SyncClaimInput) => enqueue(() => store.claimSync(input), true),
    acknowledgeSync: (input: SyncAckInput) => enqueue(() => store.acknowledgeSync(input), true),
    failSync: (input: SyncFailInput) => enqueue(() => store.failSync(input), true),
    setSyncRevision: (input: {accountId: string; revision: number; expectedRevision: number}) => enqueue(() => store.setSyncRevision(input), true),
    reconcileSync: (input: {accountId: string; revision: number; expected: SyncOutboxState}) => enqueue(() => store.reconcileSync(input), true),
    clearSync: (accountId?: string) => enqueue(() => store.clearSync(accountId), true),
    resumeSyncAuth: (accountId: string) => enqueue(() => store.resumeSyncAuth(accountId), true),
  };
}

let instance: ReturnType<typeof createTransactionalVault> | null | undefined;
// The shared browser instance, created on first use. Call it from effects and handlers, not during render.
export function getVault(): ReturnType<typeof createTransactionalVault> | null {
  if (instance === undefined) instance = browserVault();
  return instance;
}

// The browser instance. Returns null when this browser has no IndexedDB or Web Crypto, so the app can say so.
export function browserVault(): ReturnType<typeof createTransactionalVault> | null {
  try {
    if (typeof window === 'undefined' || !window.indexedDB || !globalThis.crypto?.subtle) return null;
    const writerId = toBase64(globalThis.crypto.getRandomValues(new Uint8Array(16)));
    return createTransactionalVault({
      idb: window.indexedDB,
      legacy: window.localStorage,
      subtle: globalThis.crypto.subtle,
      random: n => globalThis.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(n))),
      lock: window.navigator.locks ? async job => await window.navigator.locks.request('movefield-vault', job) : undefined,
      restoreSafe: Boolean(window.navigator.locks),
      writerId,
      notify: () => { try { const channel = new BroadcastChannel('movefield-records'); channel.postMessage({type: 'changed', writerId}); channel.close(); } catch {} },
    });
  } catch {
    return null;
  }
}

export function indexedDbKeyStore(idb: IDBFactory): KeyStore {
  const DB = 'movefield-vault', STORE = 'keys', ID = 'data-key-v1', JOURNAL = 'restore-transition-v1';
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open(DB, 2);
    let blocked = false;
    request.onupgradeneeded = () => {for (const name of [STORE, 'records', 'metadata']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);};
    request.onblocked = () => {blocked = true; reject(new Error('Close older tabs before opening saved storage.'));};
    request.onsuccess = () => {request.result.onversionchange = () => request.result.close(); if (blocked) request.result.close(); else resolve(request.result);};
    request.onerror = () => reject(request.error);
  });
  async function run<T>(mode: IDBTransactionMode, make: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = make(transaction.objectStore(STORE));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => reject(transaction.error ?? new Error('Key transaction was aborted.'));
        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }
  return {
    get: async () => (await run('readonly', store => store.get(ID))) as CryptoKey | undefined,
    put: async key => { await run('readwrite', store => store.put(key, ID)); },
    remove: async () => { await run('readwrite', store => store.delete(ID)); },
    getTransition: async () => (await run('readonly', store => store.get(JOURNAL))) as VaultTransition | undefined,
    prepareTransition: async transition => { await run('readwrite', store => store.put(transition, JOURNAL)); },
    finishTransition: async (key, keepJournal = false) => {
      await run('readwrite', store => {
        if (key) store.put(key, ID);
        else store.delete(ID);
        if (!keepJournal) store.delete(JOURNAL);
        return store.get(ID);
      });
    },
  };
}
