// Encrypts this browser's saved training data before it reaches localStorage.
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
] as const;

export const KEY_MISSING_MESSAGE = 'Your saved training is encrypted with a key that is not in this browser. Nothing was replaced. Restore a transfer file to continue, or start a fresh profile.';
const DECRYPT_MESSAGE = 'Your saved training could not be opened. It may be damaged. Nothing was replaced.';
const KEY_UNAVAILABLE_MESSAGE = 'This browser would not keep the encryption key, so changes are not saved here. Export a transfer file to keep your work.';

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
      if (mode !== 'reset') await recoverTransition(mode === 'read');
      return job();
    };
    const run = queue.then(() => deps.lock ? deps.lock(recovered) : recovered());
    queue = run.catch(() => undefined);
    return run;
  }

  return {
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

let instance: ReturnType<typeof createVault> | null | undefined;
// The shared browser instance, created on first use. Call it from effects and handlers, not during render.
export function getVault(): ReturnType<typeof createVault> | null {
  if (instance === undefined) instance = browserVault();
  return instance;
}

// The browser instance. Returns null when this browser has no IndexedDB or Web Crypto, so the app can say so.
export function browserVault(): ReturnType<typeof createVault> | null {
  try {
    if (typeof window === 'undefined' || !window.indexedDB || !globalThis.crypto?.subtle) return null;
    return createVault({
      storage: window.localStorage,
      keys: indexedDbKeyStore(window.indexedDB),
      subtle: globalThis.crypto.subtle,
      random: n => globalThis.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(n))),
      lock: window.navigator.locks ? async job => await window.navigator.locks.request('movefield-vault', job) : undefined,
      restoreSafe: Boolean(window.navigator.locks),
    });
  } catch {
    return null;
  }
}

export function indexedDbKeyStore(idb: IDBFactory): KeyStore {
  const DB = 'movefield-vault', STORE = 'keys', ID = 'data-key-v1', JOURNAL = 'restore-transition-v1';
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
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
