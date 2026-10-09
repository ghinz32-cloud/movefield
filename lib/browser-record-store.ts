// Transactional ciphertext storage. Encryption and legacy restore recovery are
// performed by browser-vault before entering these short IndexedDB transactions.
import type {VaultStorage, VaultTransition} from './browser-vault';
import {SyncOutboxError, validateSyncOutbox, validateSyncEnqueue, enqueueSync, invalidateSyncPending, claimSync, acknowledgeSync, failSync, setSyncRevision, resumeSyncAuth, type SyncOutboxState, type SyncEnqueue, type SyncClaimInput, type SyncAckInput, type SyncFailInput} from './sync-outbox';

const DB = 'movefield-vault', VERSION = 2;
const KEYS = 'keys', RECORDS = 'records', META = 'metadata';
const KEY = 'data-key-v1', JOURNAL = 'restore-transition-v1', STATE = 'record-state-v2';
const SYNC = 'sync-outbox-v1';
export const BROWSER_HISTORY_PREFIX = 'training-studio:browser-history:v1:';
export const isBrowserHistorySlot = (slot: unknown): slot is string => typeof slot === 'string' && /^training-studio:browser-history:v1:[0-9a-f]{64}$/.test(slot);
const LEGACY_CIPHERTEXT_PREFIX = '{"v":1,"alg":"aes-256-gcm"';
const DEFAULT_SLOTS = ['training-studio-v2', 'training-studio-setup-v1', 'training-studio-sample-setup', 'training-studio-security-preview-v1', 'training-studio-sample-security', 'training-studio-workout-coaching-v1'] as const;

type RecordRow = {version: 1; ciphertext: string | null};
type StoreState = {version: 2; revision: number; keyRevision: number; migrated: boolean; legacyHashes: Record<string, string | null>};
export type BrowserRecordSnapshot = {
  records: Record<string, string | null>;
  tombstones: string[];
  key: CryptoKey | undefined;
  transition: VaultTransition | undefined;
  revision: number;
  keyRevision: number;
  migrated: boolean;
  legacyHashes: Record<string, string | null>;
  sync: SyncOutboxState;
  // Discovered only for explicit retirement/key changes, never all entity rows.
  historySlots: string[];
};

export class BrowserRecordStoreError extends Error {
  constructor(public code: 'conflict' | 'unavailable' | 'unknown-format' | 'legacy-pending', message: string) {
    super(message); this.name = 'BrowserRecordStoreError';
  }
}
export type BrowserRecordCommit = {
  expected: BrowserRecordSnapshot;
  records?: Record<string, string | null>;
  // undefined preserves the key; null deliberately removes it.
  key?: CryptoKey | null;
  clearTransition?: boolean;
  migrated?: boolean;
  // Sealed outside IndexedDB; the network never substitutes for a local commit.
  sync?: SyncEnqueue;
  clearHistory?: boolean;
};
export type BrowserLegacyImport = {
  expected: BrowserRecordSnapshot;
  // Exact legacy values captured under the caller's origin-wide vault lock.
  // They are checked again during the transaction but never copied to metadata.
  legacy: Record<string, string | null>;
  // Every nonempty legacy slot has already been sealed outside the transaction.
  records: Record<string, string | null>;
  key?: CryptoKey | null;
};
type Deps = {idb: IDBFactory; legacy: VaultStorage; slots?: readonly string[]; digest?: (text: string) => Promise<string>};

const emptyState = (): StoreState => ({version: 2, revision: 0, keyRevision: 0, migrated: false, legacyHashes: {}});
const keyShape = (key: CryptoKey | undefined) => key ? JSON.stringify({type: key.type, extractable: key.extractable, algorithm: key.algorithm, usages: [...key.usages].sort()}) : null;
const transitionShape = (journal: VaultTransition | undefined) => journal ? JSON.stringify({slot: journal.slot, beforeHash: journal.beforeHash, after: journal.after, obsolete: journal.obsolete, previous: keyShape(journal.previous ?? undefined), next: keyShape(journal.next)}) : null;
const conflict = () => new BrowserRecordStoreError('conflict', 'Your saved profile changed in another tab. Nothing was replaced.');

function isCiphertext(raw: string): boolean {
  try {
    const value = JSON.parse(raw);
    return value && Object.keys(value).length === 4 && value.v === 1 && value.alg === 'aes-256-gcm' && typeof value.iv === 'string' && typeof value.data === 'string';
  } catch { return false; }
}
const isLegacyCiphertext = (raw: string) => raw.startsWith(LEGACY_CIPHERTEXT_PREFIX);
function validateState(raw: unknown): StoreState {
  if (raw === undefined) return emptyState();
  const state = raw as StoreState;
  if (!state || state.version !== 2 || !Number.isSafeInteger(state.revision) || state.revision < 0 || !Number.isSafeInteger(state.keyRevision) || state.keyRevision < 0 || typeof state.migrated !== 'boolean' || !state.legacyHashes || typeof state.legacyHashes !== 'object' || Array.isArray(state.legacyHashes) || Object.values(state.legacyHashes).some(value => value !== null && typeof value !== 'string')) {
    throw new BrowserRecordStoreError('unknown-format', 'Saved storage metadata has an unexpected format. Nothing was replaced.');
  }
  return state;
}

export function createBrowserRecordStore(deps: Deps) {
  const slots = [...(deps.slots ?? DEFAULT_SLOTS)];
  if (!slots.length || new Set(slots).size !== slots.length) throw new Error('Record slots must be nonempty and unique.');
  const digest = deps.digest ?? (async (text: string) => {
    const bytes = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  });

  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const request = deps.idb.open(DB, VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of [KEYS, RECORDS, META]) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      };
      request.onblocked = () => {
        settled = true;
        reject(new BrowserRecordStoreError('unavailable', 'An older tab is keeping saved storage open. Close it and reopen this app. Your records are unchanged.'));
      };
      request.onerror = () => reject(new BrowserRecordStoreError('unavailable', 'This browser could not open saved storage. Your records are unchanged.'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        if (settled) { db.close(); return; }
        settled = true; resolve(db);
      };
    });
  }

  // All reads for the comparison and all puts/deletes occur in this one
  // transaction. No Web Crypto or other promise is awaited while it is active.
  async function run(mutate?: (snapshot: BrowserRecordSnapshot, tx: IDBTransaction) => BrowserRecordSnapshot, requested: readonly string[] = [], discoverHistory = false): Promise<BrowserRecordSnapshot> {
    if (requested.length > 10005 || requested.some(slot => !slots.includes(slot) && !isBrowserHistorySlot(slot))) throw new BrowserRecordStoreError('unknown-format', 'Saved history has invalid record identities. Nothing was replaced.');
    const readSlots = [...new Set([...slots, ...requested])];
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        let result: BrowserRecordSnapshot | undefined, failure: unknown;
        const tx = db.transaction([KEYS, RECORDS, META], mutate ? 'readwrite' : 'readonly');
        const requests: IDBRequest[] = [tx.objectStore(KEYS).get(KEY), tx.objectStore(KEYS).get(JOURNAL), tx.objectStore(META).get(STATE), ...readSlots.map(slot => tx.objectStore(RECORDS).get(slot)), tx.objectStore(META).get(SYNC)];
        if (discoverHistory) requests.push(tx.objectStore(RECORDS).getAllKeys());
        let pending = requests.length;
        tx.oncomplete = () => result ? resolve(result) : reject(new BrowserRecordStoreError('unavailable', 'Saved storage did not return a complete record.'));
        tx.onabort = () => reject(failure ?? new BrowserRecordStoreError('unavailable', 'Your changes could not be saved. Your previous records are unchanged.'));
        tx.onerror = () => { /* onabort reports the completed rollback, not an early request acknowledgment */ };
        for (const request of requests) {
          request.onsuccess = () => {
            if (--pending) return;
            try {
              const state = validateState(requests[2].result);
              const records: Record<string, string | null> = {}, tombstones: string[] = [];
              readSlots.forEach((slot, index) => {
                const row = requests[index + 3].result as RecordRow | undefined;
                if (row !== undefined && (!row || row.version !== 1 || (row.ciphertext !== null && typeof row.ciphertext !== 'string'))) throw new BrowserRecordStoreError('unknown-format', 'Saved encrypted records have an unexpected format. Nothing was replaced.');
                records[slot] = row?.ciphertext ?? null;
                if (row?.ciphertext === null) tombstones.push(slot);
              });
              const snapshot: BrowserRecordSnapshot = {records, tombstones, key: requests[0].result, transition: requests[1].result, ...state, sync: validateSyncOutbox(requests[readSlots.length + 3].result), historySlots: discoverHistory ? (requests[readSlots.length + 4].result as IDBValidKey[]).filter(isBrowserHistorySlot) : []};
              result = mutate ? mutate(snapshot, tx) : snapshot;
            } catch (error) { failure = error; tx.abort(); }
          };
        }
      });
    } catch (error) {
      if (error instanceof BrowserRecordStoreError || error instanceof SyncOutboxError) throw error;
      throw new BrowserRecordStoreError('unavailable', 'Your saved storage is unavailable. Nothing was replaced.');
    } finally { db.close(); }
  }

  function guard(current: BrowserRecordSnapshot, expected: BrowserRecordSnapshot) {
    // Every supported key mutation uses this transaction API and the origin-wide
    // vault lock, so keyRevision guards that identity. Shape/presence catches key
    // deletion, but does not prove cryptographic equality after an unmanaged,
    // same-shaped key swap. Ciphertext and cleanup-hash checks also protect old
    // snapshots if metadata is removed or altered independently.
    if (current.revision !== expected.revision || current.keyRevision !== expected.keyRevision || current.migrated !== expected.migrated || keyShape(current.key) !== keyShape(expected.key) || transitionShape(current.transition) !== transitionShape(expected.transition) || Object.keys(expected.records).some(slot => current.records[slot] !== expected.records[slot] || current.tombstones.includes(slot) !== expected.tombstones.includes(slot) || current.legacyHashes[slot] !== expected.legacyHashes[slot])) throw conflict();
  }
  function checkPatch(records: Record<string, string | null>, preservedLegacy?: Record<string, string | null>) {
    for (const [slot, raw] of Object.entries(records)) {
      // A damaged old encrypted slot must not prevent other readable slots from
      // migrating. Only import may preserve those exact opaque bytes; every new
      // write still requires the complete ciphertext envelope.
      const retained = raw !== null && preservedLegacy?.[slot] === raw && isLegacyCiphertext(raw);
      if ((!slots.includes(slot) && !isBrowserHistorySlot(slot)) || (raw !== null && !isCiphertext(raw) && !retained)) throw new BrowserRecordStoreError('unknown-format', 'Only encrypted training records can be stored. Nothing was replaced.');
    }
  }
  function apply(current: BrowserRecordSnapshot, tx: IDBTransaction, input: BrowserRecordCommit, legacyHashes = current.legacyHashes, allowKeylessImport = false, preservedLegacy?: Record<string, string | null>): BrowserRecordSnapshot {
    guard(current, input.expected);
    const patch = input.records ?? {};
    checkPatch(patch, preservedLegacy);
    if (!input.clearHistory && Object.keys(patch).some(slot => isBrowserHistorySlot(slot) && !Object.prototype.hasOwnProperty.call(input.expected.records, slot))) throw conflict();
    if (input.key && (input.key.extractable || input.key.type !== 'secret' || input.key.algorithm.name !== 'AES-GCM' || (input.key.algorithm as AesKeyAlgorithm).length !== 256 || !input.key.usages.includes('encrypt') || !input.key.usages.includes('decrypt'))) throw new BrowserRecordStoreError('unknown-format', 'The encryption key has an unexpected format. Nothing was replaced.');
    const key = input.key === undefined ? current.key : input.key ?? undefined;
    const records = {...current.records, ...patch};
    if (input.clearHistory) for (const slot of Object.keys(records)) if (isBrowserHistorySlot(slot) && !Object.prototype.hasOwnProperty.call(patch, slot)) delete records[slot];
    if (input.key !== undefined && current.historySlots.length && !input.clearHistory) throw new BrowserRecordStoreError('unknown-format', 'Replacing the encryption key must retire all previous workout history. Nothing was replaced.');
    if (!key && Object.values(records).some(raw => raw !== null) && !allowKeylessImport) throw new BrowserRecordStoreError('unknown-format', 'Encrypted records cannot be saved without their encryption key. Nothing was replaced.');
    if (input.key !== undefined && current.key && slots.some(slot => current.records[slot] !== null && !Object.prototype.hasOwnProperty.call(patch, slot))) throw new BrowserRecordStoreError('unknown-format', 'Replacing the encryption key must replace or retire every encrypted record. Nothing was replaced.');
    const tombstones = Object.keys(records).filter(slot => Object.prototype.hasOwnProperty.call(patch, slot) ? patch[slot] === null : current.tombstones.includes(slot));
    const state: StoreState = {version: 2, revision: current.revision + 1, keyRevision: current.keyRevision + (input.key === undefined ? 0 : 1), migrated: input.migrated ?? current.migrated, legacyHashes};
    let sync = input.key === undefined && !input.clearHistory ? current.sync : invalidateSyncPending(current.sync);
    if (input.sync) sync = enqueueSync(sync, input.sync);
    if (!Number.isSafeInteger(state.revision) || !Number.isSafeInteger(state.keyRevision)) throw new BrowserRecordStoreError('unavailable', 'Saved storage needs recovery before another change. Nothing was replaced.');
    if (input.clearHistory) for (const slot of current.historySlots) tx.objectStore(RECORDS).delete(slot);
    for (const [slot, ciphertext] of Object.entries(patch)) tx.objectStore(RECORDS).put({version: 1, ciphertext} satisfies RecordRow, slot);
    if (input.key !== undefined) {
      if (input.key) tx.objectStore(KEYS).put(input.key, KEY);
      else tx.objectStore(KEYS).delete(KEY);
    }
    if (input.clearTransition) tx.objectStore(KEYS).delete(JOURNAL);
    tx.objectStore(META).put(state, STATE);
    if (input.sync || input.key !== undefined || input.clearHistory) tx.objectStore(META).put(sync, SYNC);
    return {records, tombstones, key, transition: input.clearTransition ? undefined : current.transition, ...state, sync, historySlots: input.clearHistory ? Object.keys(patch).filter(slot => isBrowserHistorySlot(slot) && patch[slot] !== null) : current.historySlots};
  }

  const snapshot = (requested: readonly string[] = []) => run(undefined, requested);
  const compareAndCommit = (input: BrowserRecordCommit) => {
    const detached = {...input, records: input.records ? {...input.records} : undefined, sync: input.sync ? validateSyncEnqueue(input.sync) : undefined};
    return run((current, tx) => {
      if (current.transition && !detached.clearTransition) throw new BrowserRecordStoreError('legacy-pending', 'Finish the previous restore recovery before saving. Your records are unchanged.');
      return apply(current, tx, detached);
    }, [...new Set([...Object.keys(detached.expected.records), ...Object.keys(detached.records ?? {})])], Boolean(detached.clearHistory || detached.key !== undefined));
  };
  async function updateSync<T>(change: (state: SyncOutboxState) => {state: SyncOutboxState; value: T}): Promise<T> {
    let value!: T;
    await run((current, tx) => {
      const next = change(current.sync); value = next.value;
      tx.objectStore(META).put(next.state, SYNC);
      return {...current, sync: next.state};
    });
    return value;
  }

  async function importLegacy(input: BrowserLegacyImport): Promise<BrowserRecordSnapshot> {
    checkPatch(input.records, input.legacy);
    // Calculate hashes before opening the transaction. Metadata holds no legacy
    // plaintext; the encrypted output and original cleanup hashes commit together.
    const legacyHashes = Object.fromEntries(await Promise.all(slots.map(async slot => {
      const raw = input.legacy[slot];
      if (raw !== null && typeof raw !== 'string') throw new BrowserRecordStoreError('unknown-format', 'Legacy import must include every training slot.');
      if (!Object.prototype.hasOwnProperty.call(input.records, slot) || (raw === null) !== (input.records[slot] === null)) throw new BrowserRecordStoreError('unknown-format', 'Legacy import must retain every nonempty training slot.');
      return [slot, raw === null ? null : await digest(raw)];
    })));
    const imported = await run((current, tx) => {
      if (current.migrated) { guard(current, input.expected); return current; }
      if (current.transition) throw new BrowserRecordStoreError('legacy-pending', 'Finish the previous restore recovery before importing records. Your records are unchanged.');
      if (slots.some(slot => deps.legacy.getItem(slot) !== input.legacy[slot])) throw conflict();
      if (slots.some(slot => current.records[slot] !== null || current.tombstones.includes(slot))) throw conflict();
      if (!current.key && input.key && slots.some(slot => typeof input.legacy[slot] === 'string' && (isCiphertext(input.legacy[slot]!) || isLegacyCiphertext(input.legacy[slot]!)))) throw new BrowserRecordStoreError('unknown-format', 'A missing legacy encryption key cannot be replaced during import. Restore a transfer file instead.');
      // A lost legacy key is recoverable only through an explicit transfer. Keep
      // those existing ciphertext bytes importable/exportable without inventing
      // a replacement key. New or transformed keyless ciphertext is forbidden.
      const keyless = !current.key && !input.key;
      if (keyless && slots.some(slot => input.legacy[slot] !== input.records[slot])) throw new BrowserRecordStoreError('unknown-format', 'Key-lost legacy records must be retained unchanged. Nothing was replaced.');
      return apply(current, tx, {...input, migrated: true}, legacyHashes, keyless, input.legacy);
    }, [], true);
    // A fresh transaction verifies the installed ciphertext and metadata before
    // the caller is allowed to remove any migration input.
    const verified = await snapshot(); guard(verified, imported);
    return verified;
  }

  async function cleanupLegacy(expected: BrowserRecordSnapshot): Promise<{removed: string[]; retained: string[]}> {
    const verified = await snapshot(); guard(verified, expected);
    if (!verified.migrated) throw new BrowserRecordStoreError('legacy-pending', 'Legacy records have not been verified in encrypted storage.');
    const removed: string[] = [], retained: string[] = [];
    for (const slot of slots) {
      const hash = verified.legacyHashes[slot];
      if (hash === null || hash === undefined) continue;
      try {
        const raw = deps.legacy.getItem(slot);
        if (raw === null) continue;
        if (await digest(raw) !== hash || deps.legacy.getItem(slot) !== raw) { retained.push(slot); continue; }
        deps.legacy.removeItem(slot);
        if (deps.legacy.getItem(slot) === null) removed.push(slot); else retained.push(slot);
      } catch { retained.push(slot); }
    }
    return {removed, retained};
  }

  return {
    snapshot, compareAndCommit, importLegacy, cleanupLegacy,
    listHistorySlots: async () => (await run(undefined, [], true)).historySlots,
    syncSnapshot: async () => (await snapshot()).sync,
    claimSync: (input: SyncClaimInput) => {const detached = {...input}; return updateSync(state => {const next = claimSync(state, detached); return {state: next.state, value: next.claim};});},
    acknowledgeSync: (input: SyncAckInput) => {const detached = {...input}; return updateSync(state => {const next = acknowledgeSync(state, detached); return {state: next.state, value: next.accepted};});},
    failSync: (input: SyncFailInput) => {const detached = {...input}; return updateSync(state => ({state: failSync(state, detached), value: undefined}));},
    setSyncRevision: (input: {accountId: string; revision: number; expectedRevision: number}) => {const detached = {...input}; return updateSync(state => ({state: setSyncRevision(state, detached), value: undefined}));},
    reconcileSync: (input: {accountId: string; revision: number; expected: SyncOutboxState}) => {
      const expected = JSON.stringify(validateSyncOutbox(input.expected)), accountId = input.accountId, revision = input.revision;
      return updateSync(state => {
        if (JSON.stringify(state) !== expected) throw conflict();
        const cleared = invalidateSyncPending(state, accountId);
        return {state: setSyncRevision(cleared, {accountId, revision, expectedRevision: cleared.accounts[accountId]?.revision ?? 0}), value: undefined};
      });
    },
    clearSync: (accountId?: string) => updateSync(state => ({state: invalidateSyncPending(state, accountId), value: undefined})),
    resumeSyncAuth: (accountId: string) => updateSync(state => ({state: resumeSyncAuth(state, accountId), value: undefined})),
    write: (expected: BrowserRecordSnapshot, slot: string, ciphertext: string, key?: CryptoKey, sync?: SyncEnqueue) => compareAndCommit({expected, records: {[slot]: ciphertext}, key, sync}),
    replace: async (expected: BrowserRecordSnapshot, slot: string, ciphertext: string, key: CryptoKey) => {
      checkPatch({[slot]: ciphertext});
      return compareAndCommit({expected, records: Object.fromEntries(slots.map(other => [other, other === slot ? ciphertext : null])), key, clearHistory: true, clearTransition: true, migrated: true});
    },
    discard: (expected: BrowserRecordSnapshot, slot: string) => compareAndCommit({expected, records: {[slot]: null}}),
    reset: (expected: BrowserRecordSnapshot) => compareAndCommit({expected, records: Object.fromEntries(slots.map(slot => [slot, null])), key: null, clearHistory: true, clearTransition: true, migrated: true}),
  };
}
