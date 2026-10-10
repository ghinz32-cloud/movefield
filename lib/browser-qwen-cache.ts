import {bytesToHex} from '@noble/hashes/utils.js';
import {QWEN_CHUNK_BYTES, QwenDownloadError, type QwenCacheReceipt, type QwenCachedAsset,
  type QwenDownloadOffer, type QwenModelStore} from './qwen-download';

export const QWEN_CACHE_DATABASE = 'movefield-qwen-assets-v1';
export const QWEN_CACHE_LOCK_PREFIX = 'movefield:qwen-assets:v1:';
export const QWEN_CLEANUP_BATCH = 128;
const DB_TIMEOUT_MS = 30_000;
type Attempt = {attempt: string; modelId: string; offer: QwenDownloadOffer;
  verified: (QwenCachedAsset | null)[]; complete: boolean};
type Environment = {
  indexedDB: IDBFactory; keyRange: typeof IDBKeyRange; locks: LockManager;
  random: (length: number) => Uint8Array;
  estimate: () => Promise<StorageEstimate>;
};
export function browserQwenDownloadSupport(): string | null {
  if (typeof window === 'undefined' || !window.isSecureContext) return 'Model downloads need this app to be opened over HTTPS in a current browser.';
  if (!window.indexedDB || !navigator.locks) return 'This browser cannot safely coordinate model downloads. Use a current browser with local storage and Web Locks.';
  return null;
}
function browserEnvironment(): Environment {
  const reason = browserQwenDownloadSupport();
  if (reason) throw new QwenDownloadError('unsupported', reason);
  return {indexedDB: window.indexedDB, keyRange: window.IDBKeyRange, locks: navigator.locks,
    random: length => crypto.getRandomValues(new Uint8Array(length)),
    estimate: () => navigator.storage?.estimate() ?? Promise.resolve({})};
}
function storageError(error?: DOMException | null): Error {
  if (error?.name === 'QuotaExceededError') return new QwenDownloadError('storage', 'There is not enough browser storage for this model. Remove another downloaded model or free device space, then retry.');
  return new QwenDownloadError('storage', 'The model cache could not be saved or opened. Retry when browser storage is available.');
}
function validReceipt(value: unknown): value is QwenCacheReceipt {
  if (!value || typeof value !== 'object') return false;
  const r = value as QwenCacheReceipt;
  return r.version === 1 && /^[a-z0-9._-]{1,100}$/.test(r.modelId) && /^[0-9a-f]{32}$/.test(r.attempt) &&
    /^[0-9a-f]{64}$/.test(r.fingerprint) && Number.isSafeInteger(r.downloadBytes) && r.downloadBytes > 0 &&
    Array.isArray(r.assets) && r.assets.length > 0 && r.assets.length <= 256 && r.assets.every(a => a &&
      typeof a.path === 'string' && Number.isSafeInteger(a.bytes) && a.bytes > 0 && /^[0-9a-f]{64}$/.test(a.sha256) &&
      a.parts === Math.ceil(a.bytes / QWEN_CHUNK_BYTES)) && r.assets.reduce((n, a) => n + a.bytes, 0) === r.downloadBytes;
}

// Chunked IndexedDB keeps application buffers bounded. Cache.put(Response)
// would require a complete file body before its commit; we do not use it for
// multi-GB model downloads. No network awaits occur inside an IDB transaction.
export function createBrowserQwenStore(provided?: Environment): QwenModelStore {
  const env = provided ?? browserEnvironment();
  let opened: Promise<IDBDatabase> | null = null;
  function database(): Promise<IDBDatabase> {
    if (opened) return opened;
    opened = new Promise((resolve, reject) => {
      let settled = false;
      const request = env.indexedDB.open(QWEN_CACHE_DATABASE, 1);
      const stop = (error: Error) => {if (!settled) {settled = true; clearTimeout(timer); opened = null; reject(error)}};
      const timer = setTimeout(() => stop(storageError()), DB_TIMEOUT_MS);
      request.onblocked = () => stop(new QwenDownloadError('busy', 'Another tab is updating the model cache. Close its download view and retry.'));
      request.onerror = () => stop(storageError(request.error));
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('models', {keyPath: 'modelId'});
        db.createObjectStore('attempts', {keyPath: 'attempt'}).createIndex('modelId', 'modelId');
        db.createObjectStore('chunks', {keyPath: ['attempt', 'asset', 'part']}).createIndex('attempt', 'attempt');
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) {db.close(); return}
        settled = true; clearTimeout(timer);
        db.onversionchange = () => {db.close(); opened = null};
        db.onclose = () => {opened = null};
        resolve(db);
      };
    });
    return opened;
  }
  async function transaction<T>(stores: string[], mode: IDBTransactionMode,
    run: (tx: IDBTransaction, done: (result: T) => void, fail: (error: Error) => void) => void): Promise<T> {
    const db = await database();
    return new Promise<T>((resolve, reject) => {
      let result: T, failure: Error | undefined;
      const tx = db.transaction(stores, mode);
      const fail = (error: Error) => {
        failure = error;
        // If the transaction already finished, its queued completion/abort
        // event owns the result. A timeout cannot turn a committed pointer
        // into a reported failure followed by deletion of its files.
        try {tx.abort()} catch {}
      };
      const timer = setTimeout(() => fail(storageError()), DB_TIMEOUT_MS);
      tx.oncomplete = () => {clearTimeout(timer); resolve(result)};
      tx.onabort = () => {clearTimeout(timer); reject(failure ?? storageError(tx.error))};
      tx.onerror = () => {failure ??= storageError(tx.error)};
      try {run(tx, value => {result = value}, fail)} catch (error) {fail(error instanceof Error ? error : storageError())}
    });
  }
  async function discardChunks(attempt: string) {
    let finished = false;
    while (!finished) {
      finished = await transaction<boolean>(['models', 'attempts', 'chunks'], 'readwrite', (tx, done) => {
        const attempts = tx.objectStore('attempts'), request = attempts.get(attempt);
        request.onsuccess = () => {
          if (!request.result) {done(true); return}
          const current = tx.objectStore('models').get(request.result.modelId);
          current.onsuccess = () => {
            // Cleanup never deletes an attempt currently referenced as complete.
            if (current.result?.attempt === attempt) {done(true); return}
            let removed = 0;
            const chunks = tx.objectStore('chunks'), cursor = chunks.index('attempt').openKeyCursor(env.keyRange.only(attempt));
            cursor.onsuccess = () => {
              const row = cursor.result;
              if (!row) {attempts.delete(attempt); done(true); return}
              if (removed === QWEN_CLEANUP_BATCH) {done(false); return}
              chunks.delete(row.primaryKey); removed++; row.continue();
            };
          };
        };
      });
    }
  }
  async function exclusive<T>(modelId: string, run: () => Promise<T>): Promise<T> {
    // ifAvailable and signal cannot be combined by the Web Locks specification.
    // Fail promptly instead of queuing a delete behind another tab's download.
    return env.locks.request(QWEN_CACHE_LOCK_PREFIX + modelId, {mode: 'exclusive', ifAvailable: true}, lock => {
      if (!lock) throw new QwenDownloadError('busy', 'This model is busy in another tab. Cancel or finish there, then refresh its status here.');
      return run();
    });
  }
  async function recover(modelId: string) {
    let next: string | null;
    do {
      next = await transaction<string | null>(['models', 'attempts'], 'readwrite', (tx, done) => {
        done(null);
        const models = tx.objectStore('models'), pointer = models.get(modelId);
        pointer.onsuccess = () => {
          const current = validReceipt(pointer.result) && pointer.result.modelId === modelId ? pointer.result.attempt : null;
          if (pointer.result && !current) models.delete(modelId);
          const attempts = tx.objectStore('attempts').index('modelId').openKeyCursor(env.keyRange.only(modelId));
          attempts.onsuccess = () => {
            const row = attempts.result;
            if (row) {if (row.primaryKey !== current) done(String(row.primaryKey)); else row.continue()}
          };
        };
      });
      if (next) await discardChunks(next);
    } while (next);
  }
  async function inspect(modelId: string) {
    return transaction<QwenCacheReceipt | null>(['models'], 'readonly', (tx, done) => {
      const pointer = tx.objectStore('models').get(modelId);
      pointer.onsuccess = () => done(validReceipt(pointer.result) && pointer.result.modelId === modelId ? pointer.result : null);
    });
  }
  async function contains(receipt: QwenCacheReceipt) {
    return transaction<boolean>(['attempts', 'chunks'], 'readonly', (tx, done) => {
      done(false);
      const request = tx.objectStore('attempts').get(receipt.attempt);
      request.onsuccess = () => {
        const row = request.result as Attempt | undefined;
        if (!row || !row.complete || row.offer.fingerprint !== receipt.fingerprint || row.modelId !== receipt.modelId) return;
        let remaining = receipt.assets.length, all = true;
        receipt.assets.forEach((asset, index) => {
          const count = tx.objectStore('chunks').count(env.keyRange.bound([receipt.attempt, index, 0], [receipt.attempt, index, Number.MAX_SAFE_INTEGER]));
          count.onsuccess = () => {all &&= count.result === asset.parts; if (--remaining === 0) done(all)};
        });
      };
    });
  }
  async function availableBytes() {
    try {
      const {quota, usage} = await env.estimate();
      return typeof quota === 'number' && Number.isFinite(quota) && quota >= 0 &&
        typeof usage === 'number' && Number.isFinite(usage) && usage >= 0 ? Math.max(0, quota - usage) : null;
    } catch {return null}
  }
  async function begin(offer: QwenDownloadOffer) {
    const attempt = bytesToHex(env.random(16));
    if (!/^[0-9a-f]{32}$/.test(attempt)) throw storageError();
    await transaction<void>(['attempts'], 'readwrite', tx => {
      tx.objectStore('attempts').add({attempt, modelId: offer.modelId, offer,
        verified: offer.assets.map(() => null), complete: false} satisfies Attempt);
    });
    return attempt;
  }
  async function append(attempt: string, asset: number, part: number, bytes: Uint8Array) {
    await transaction<void>(['attempts', 'chunks'], 'readwrite', (tx, _done, fail) => {
      const request = tx.objectStore('attempts').get(attempt);
      request.onsuccess = () => {
        const row = request.result as Attempt | undefined, expected = row?.offer.assets[asset];
        if (!row || row.complete || !expected || !Number.isSafeInteger(asset) || !Number.isSafeInteger(part) || part < 0 ||
            !(bytes instanceof Uint8Array) || bytes.length !== Math.min(QWEN_CHUNK_BYTES, expected.bytes - part * QWEN_CHUNK_BYTES) ||
            !bytes.length || bytes.length > QWEN_CHUNK_BYTES) {fail(storageError()); return}
        tx.objectStore('chunks').add({attempt, asset, part, bytes});
      };
    });
  }
  async function seal(attempt: string, asset: number, record: QwenCachedAsset) {
    await transaction<void>(['attempts', 'chunks'], 'readwrite', (tx, _done, fail) => {
      const attempts = tx.objectStore('attempts'), request = attempts.get(attempt);
      request.onsuccess = () => {
        const row = request.result as Attempt | undefined, expected = row?.offer.assets[asset];
        if (!row || row.complete || !expected || record.path !== expected.path || record.bytes !== expected.bytes ||
            record.sha256 !== expected.sha256 || record.parts !== Math.ceil(expected.bytes / QWEN_CHUNK_BYTES)) {fail(storageError()); return}
        const count = tx.objectStore('chunks').count(env.keyRange.bound([attempt, asset, 0], [attempt, asset, Number.MAX_SAFE_INTEGER]));
        count.onsuccess = () => {
          if (count.result !== record.parts) {fail(storageError()); return}
          row.verified[asset] = record; attempts.put(row);
        };
      };
    });
  }
  async function commit(attempt: string) {
    return transaction<QwenCacheReceipt>(['attempts', 'models'], 'readwrite', (tx, done, fail) => {
      const attempts = tx.objectStore('attempts'), request = attempts.get(attempt);
      request.onsuccess = () => {
        const row = request.result as Attempt | undefined;
        if (!row || row.complete || row.verified.length !== row.offer.assets.length || row.verified.some(asset => !asset)) {
          fail(storageError()); return;
        }
        const receipt: QwenCacheReceipt = {version: 1, modelId: row.modelId, fingerprint: row.offer.fingerprint,
          attempt, downloadBytes: row.offer.downloadBytes, assets: row.verified as QwenCachedAsset[]};
        if (!validReceipt(receipt)) {fail(storageError()); return}
        row.complete = true; attempts.put(row); tx.objectStore('models').put(receipt); done(receipt);
      };
    });
  }
  async function discard(attempt: string) {
    await discardChunks(attempt);
  }
  async function remove(modelId: string) {
    // Forget availability first. If deletion is interrupted, orphan markers
    // remain and recover() resumes bounded cleanup on the next opening.
    await transaction<void>(['models'], 'readwrite', tx => {
      tx.objectStore('models').delete(modelId);
    });
    await recover(modelId);
  }
  async function read(attempt: string, asset: number, part: number) {
    return transaction<Uint8Array | null>(['chunks'], 'readonly', (tx, done) => {
      const request = tx.objectStore('chunks').get([attempt, asset, part]);
      request.onsuccess = () => done(request.result?.bytes instanceof Uint8Array ? request.result.bytes : null);
    });
  }
  return {exclusive, recover, inspect, contains, availableBytes, begin, append, seal, commit, discard, remove, read};
}
