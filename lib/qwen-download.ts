import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
import type {QwenAsset, QwenCandidate} from './qwen-catalog';

// Browser model files are public, reproducible assets. This store has no access
// to profile, workout, photo, transfer, key or preference storage.
export const QWEN_CHUNK_BYTES = 256 * 1024;
export const QWEN_MAX_INPUT_CHUNK_BYTES = 4 * 1024 * 1024;
export const QWEN_NETWORK_IDLE_MS = 60_000;
export type QwenDownloadCode = 'unknown-model' | 'manifest' | 'consent' | 'unsupported' | 'busy' |
  'cancelled' | 'network' | 'integrity' | 'storage' | 'cleanup' | 'not-downloaded';
export class QwenDownloadError extends Error {
  constructor(public readonly code: QwenDownloadCode, message: string) {
    super(message); this.name = 'QwenDownloadError';
  }
}
export type QwenDownloadOffer = {
  modelId: string; label: string; fingerprint: string; downloadBytes: number;
  assets: readonly QwenAsset[];
};
export type QwenDownloadConsent = Pick<QwenDownloadOffer, 'modelId' | 'fingerprint' | 'downloadBytes'>;
export type QwenCachedAsset = {path: string; bytes: number; sha256: string; parts: number};
export type QwenCacheReceipt = {
  version: 1; modelId: string; fingerprint: string; attempt: string;
  downloadBytes: number; assets: QwenCachedAsset[];
};
export type QwenDownloadProgress = {
  phase: 'preparing' | 'downloading' | 'verifying' | 'committing' | 'complete';
  modelId: string; path: string | null; receivedBytes: number; totalBytes: number;
  verifiedFiles: number; totalFiles: number;
};
export type QwenDownloadResult = {receipt: QwenCacheReceipt; reused: boolean; cleanupPending: boolean};

// Implementations must atomically publish a pointer only after every file is
// sealed, and preserve the previous pointer until that transaction commits.
export interface QwenModelStore {
  exclusive<T>(modelId: string, run: () => Promise<T>): Promise<T>;
  recover(modelId: string): Promise<void>;
  inspect(modelId: string): Promise<QwenCacheReceipt | null>;
  contains(receipt: QwenCacheReceipt): Promise<boolean>;
  availableBytes(): Promise<number | null>;
  begin(offer: QwenDownloadOffer): Promise<string>;
  append(attempt: string, asset: number, part: number, bytes: Uint8Array): Promise<void>;
  seal(attempt: string, asset: number, record: QwenCachedAsset): Promise<void>;
  commit(attempt: string): Promise<QwenCacheReceipt>;
  discard(attempt: string): Promise<void>;
  remove(modelId: string): Promise<void>;
  read(attempt: string, asset: number, part: number): Promise<Uint8Array | null>;
}
export type QwenAssetFetch = (url: string, init: RequestInit) => Promise<Response>;

function fail(code: QwenDownloadCode, message: string): never {throw new QwenDownloadError(code, message)}
function checkSignal(signal: AbortSignal): void {
  if (signal.aborted) fail('cancelled', 'Download cancelled. Incomplete files will be removed before another download starts.');
}
function normalizeError(error: unknown, signal?: AbortSignal): QwenDownloadError {
  if (error instanceof QwenDownloadError) return error;
  if (signal?.aborted) return new QwenDownloadError('cancelled', 'Download cancelled. Incomplete files will be removed before another download starts.');
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    return new QwenDownloadError('storage', 'There is not enough browser storage for this model. Remove another downloaded model or free device space, then retry.');
  }
  return new QwenDownloadError('storage', 'The model cache could not be saved or opened. Retry when browser storage is available.');
}
export function qwenDownloadMessage(error: unknown): string {return normalizeError(error).message}

function immutableOffer(model: QwenCandidate): QwenDownloadOffer {
  if (model.platform !== 'web' || !/^[a-z0-9._-]{1,100}$/.test(model.id) ||
      !/^[0-9a-f]{40}$/.test(model.modelRevision) || !/^[0-9a-f]{40}$/.test(model.wasmRevision ?? '') ||
      !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(model.repository) ||
      model.assets.length < 1 || model.assets.length > 256) {
    fail('manifest', 'This model does not have a supported pinned browser manifest.');
  }
  const paths = new Set<string>(), urls = new Set<string>();
  const assets = model.assets.map(asset => {
    if (!/^[a-zA-Z0-9._-]+$/.test(asset.path) || asset.path === '.' || asset.path === '..' ||
        paths.has(asset.path) || urls.has(asset.url) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 ||
        !/^[0-9a-f]{64}$/.test(asset.sha256)) fail('manifest', 'A model file is missing its exact size, hash or unique path.');
    const modelUrl = `https://huggingface.co/${model.repository}/resolve/${model.modelRevision}/${asset.path}`;
    const wasmUrl = `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/${model.wasmRevision}/web-llm-models/v0_2_84/base/${asset.path}`;
    if (asset.url !== (asset.path.endsWith('.wasm') ? wasmUrl : modelUrl)) {
      fail('manifest', 'A model file is not at its pinned publisher URL.');
    }
    paths.add(asset.path); urls.add(asset.url);
    return Object.freeze({...asset});
  });
  const downloadBytes = assets.reduce((n, asset) => n + asset.bytes, 0);
  if (!Number.isSafeInteger(downloadBytes) || downloadBytes !== model.downloadBytes) {
    fail('manifest', 'The model download size does not match its files.');
  }
  const fingerprint = bytesToHex(sha256(new TextEncoder().encode(JSON.stringify({
    modelId: model.id, modelRevision: model.modelRevision, wasmRevision: model.wasmRevision,
    runtime: model.runtime, runtimeVersion: model.runtimeVersion, backend: model.backend,
    assets: assets.map(({path, url, bytes, sha256: digest}) => ({path, url, bytes, sha256: digest})),
  }))));
  return Object.freeze({modelId: model.id, label: model.label, fingerprint, downloadBytes, assets: Object.freeze(assets)});
}
function matches(receipt: QwenCacheReceipt | null, offer: QwenDownloadOffer): receipt is QwenCacheReceipt {
  return !!receipt && receipt.version === 1 && receipt.modelId === offer.modelId &&
    receipt.fingerprint === offer.fingerprint && receipt.downloadBytes === offer.downloadBytes &&
    /^[0-9a-f]{32}$/.test(receipt.attempt) && receipt.assets.length === offer.assets.length &&
    receipt.assets.every((asset, i) => asset.path === offer.assets[i].path && asset.bytes === offer.assets[i].bytes &&
      asset.sha256 === offer.assets[i].sha256 && Number.isSafeInteger(asset.parts) &&
      asset.parts === Math.ceil(asset.bytes / QWEN_CHUNK_BYTES));
}

// Network operations are outside storage transactions. Race an abort even if a
// transport stalls; callers never wait for a hung reader to acknowledge cancel.
function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    void operation.catch(() => {});
    return Promise.reject(new QwenDownloadError('cancelled', 'Download cancelled.'));
  }
  return new Promise((resolve, reject) => {
    const abort = () => reject(new QwenDownloadError('cancelled', 'Download cancelled.'));
    signal.addEventListener('abort', abort, {once: true});
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export function createQwenDownloader(options: {
  models: readonly QwenCandidate[]; store: QwenModelStore; fetchAsset: QwenAssetFetch;
  networkIdleMs?: number;
}) {
  const {store, fetchAsset} = options;
  const offers = new Map(options.models.filter(model => model.platform === 'web').map(model => [model.id, immutableOffer(model)]));
  if (offers.size !== options.models.filter(model => model.platform === 'web').length) fail('manifest', 'Model identifiers must be unique.');
  const idleMs = options.networkIdleMs ?? QWEN_NETWORK_IDLE_MS;
  if (!Number.isFinite(idleMs) || idleMs <= 0) fail('manifest', 'The download timeout must be positive.');
  const offer = (modelId: string) => {
    const result = offers.get(modelId);
    if (!result) fail('unknown-model', 'Choose a supported browser model.');
    return result;
  };
  async function cached(expected: QwenDownloadOffer) {
    const receipt = await store.inspect(expected.modelId);
    return matches(receipt, expected) && await store.contains(receipt) ? receipt : null;
  }
  async function storageOperation<T>(operation: Promise<T>): Promise<T> {
    try {return await operation} catch (error) {throw normalizeError(error)}
  }
  async function status(modelId: string) {
    const expected = offer(modelId);
    try {
      return await store.exclusive(modelId, async () => {await store.recover(modelId); return cached(expected)});
    } catch (error) {throw normalizeError(error)}
  }
  async function download(consent: QwenDownloadConsent, settings: {
    signal: AbortSignal; onProgress?: (progress: QwenDownloadProgress) => void;
  }): Promise<QwenDownloadResult> {
    const expected = offer(consent.modelId);
    // Possessing a candidate ID or changing Auto/Off cannot authorize bytes.
    if (consent.fingerprint !== expected.fingerprint || consent.downloadBytes !== expected.downloadBytes) {
      fail('consent', 'Confirm this exact model and download size before downloading.');
    }
    checkSignal(settings.signal);
    try {return await store.exclusive(expected.modelId, async () => {
      checkSignal(settings.signal);
      await store.recover(expected.modelId);
      const existing = await cached(expected);
      if (existing) return {receipt: existing, reused: true, cleanupPending: false};
      const available = await store.availableBytes();
      // Estimates are only a preflight. Runtime quota errors remain recoverable.
      const required = Math.ceil(expected.downloadBytes * 1.1) + 16 * 1024 * 1024;
      if (available !== null && available < required) fail('storage', 'This model needs more free browser storage. Remove another downloaded model or free device space before retrying.');
      checkSignal(settings.signal);
      let receivedBytes = 0, verifiedFiles = 0, attempt: string | null = null;
      const notify = (phase: QwenDownloadProgress['phase'], path: string | null) => {
        // A detached UI observer cannot corrupt a download or its commit.
        try {settings.onProgress?.({phase, modelId: expected.modelId, path, receivedBytes,
          totalBytes: expected.downloadBytes, verifiedFiles, totalFiles: expected.assets.length})} catch {}
      };
      notify('preparing', null);
      try {
        attempt = await store.begin(expected);
        for (let assetIndex = 0; assetIndex < expected.assets.length; assetIndex++) {
          checkSignal(settings.signal);
          const asset = expected.assets[assetIndex];
          const controller = new AbortController();
          let timedOut = false, timer: ReturnType<typeof setTimeout> | undefined;
          const abort = () => controller.abort();
          settings.signal.addEventListener('abort', abort, {once: true});
          const arm = () => {clearTimeout(timer); timer = setTimeout(() => {timedOut = true; controller.abort()}, idleMs)};
          let reader: ReadableStreamDefaultReader<Uint8Array> | undefined, finished = false;
          const digest = sha256.create();
          try {
            notify('downloading', asset.path); arm();
            const responsePromise = fetchAsset(asset.url, {method: 'GET', credentials: 'omit',
              referrerPolicy: 'no-referrer', cache: 'no-store', mode: 'cors', redirect: 'follow', signal: controller.signal});
            // Also close a late response after the abort race has already won.
            void responsePromise.then(response => {if (controller.signal.aborted) void response.body?.cancel().catch(() => {})}, () => {});
            const response = await abortable(responsePromise, controller.signal);
            clearTimeout(timer);
            if (response.status !== 200 || !response.body || response.type === 'opaque') {
              fail('network', 'The model publisher did not return a readable complete file. Retry when the connection is available.');
            }
            if (response.url && new URL(response.url).protocol !== 'https:') {
              void response.body.cancel().catch(() => {});
              fail('network', 'The model publisher redirected to an unsupported connection. No file was accepted.');
            }
            // Fetch may decode compressed responses, and CORS may hide encoding
            // headers. Count/hash the actual file bytes, never Content-Length.
            reader = response.body.getReader();
            let bytes = 0, parts = 0, buffered = 0;
            let buffer = new Uint8Array(Math.min(asset.bytes, QWEN_CHUNK_BYTES));
            while (true) {
              checkSignal(settings.signal); arm();
              const chunk = await abortable(reader.read(), controller.signal);
              clearTimeout(timer);
              if (chunk.done) {finished = true; break}
              if (!(chunk.value instanceof Uint8Array) || !chunk.value.byteLength || chunk.value.byteLength > QWEN_MAX_INPUT_CHUNK_BYTES) {
                fail('network', 'The download stream exceeded its safe buffer limit. Retry with a supported browser.');
              }
              if (bytes + chunk.value.byteLength > asset.bytes) fail('integrity', 'A model file exceeded its pinned size. It was not accepted.');
              digest.update(chunk.value);
              bytes += chunk.value.byteLength; receivedBytes += chunk.value.byteLength;
              for (let offset = 0; offset < chunk.value.byteLength;) {
                checkSignal(settings.signal);
                const take = Math.min(buffer.length - buffered, chunk.value.length - offset);
                buffer.set(chunk.value.subarray(offset, offset + take), buffered);
                buffered += take; offset += take;
                if (buffered === buffer.length) {
                  await storageOperation(store.append(attempt, assetIndex, parts++, buffer));
                  buffered = 0;
                  buffer = new Uint8Array(QWEN_CHUNK_BYTES);
                }
              }
              checkSignal(settings.signal); notify('downloading', asset.path);
            }
            notify('verifying', asset.path);
            if (bytes !== asset.bytes || bytesToHex(digest.digest()) !== asset.sha256) {
              fail('integrity', 'A model file failed its pinned size or SHA-256 check. It was not accepted.');
            }
            checkSignal(settings.signal);
            if (buffered) await storageOperation(store.append(attempt, assetIndex, parts++, buffer.slice(0, buffered)));
            await storageOperation(store.seal(attempt, assetIndex, {path: asset.path, bytes, sha256: asset.sha256, parts}));
            verifiedFiles++;
          } catch (error) {
            if (settings.signal.aborted) checkSignal(settings.signal);
            if (timedOut) fail('network', 'The model download stopped receiving data. Incomplete files were not accepted. Retry when the connection is stable.');
            if (error instanceof QwenDownloadError || error instanceof Error && error.name === 'QuotaExceededError') throw error;
            fail('network', 'The model download was interrupted. Incomplete files were not accepted. Retry when the connection is available.');
          } finally {
            clearTimeout(timer); settings.signal.removeEventListener('abort', abort); controller.abort(); digest.destroy();
            if (reader) {if (!finished) void reader.cancel().catch(() => {}); reader.releaseLock()}
          }
        }
        checkSignal(settings.signal); notify('committing', null); checkSignal(settings.signal);
        // This transaction is the commit point. Once it starts, cancellation
        // cannot undo a completed download; Delete removes it afterwards.
        const receipt = await store.commit(attempt); attempt = null;
        let cleanupPending = false;
        try {await store.recover(expected.modelId)} catch {cleanupPending = true}
        notify('complete', null);
        return {receipt, reused: false, cleanupPending};
      } catch (error) {
        if (attempt) {
          try {await store.discard(attempt)} catch {
            fail('cleanup', 'The download stopped, but some incomplete files could not be removed. Retry cleanup before downloading again.');
          }
        }
        throw normalizeError(error, settings.signal);
      }
    })} catch (error) {throw normalizeError(error, settings.signal)}
  }
  async function remove(modelId: string) {
    offer(modelId);
    try {await store.exclusive(modelId, () => store.remove(modelId))} catch (error) {throw normalizeError(error)}
  }
  // U08b can load the runtime through this interface. It has no network fallback,
  // hashes cached bytes again, and holds the same model lock until consumption
  // finishes. Download completion never grants device/inference qualification.
  async function withCachedModel<T>(modelId: string, signal: AbortSignal,
    consume: (open: (path: string) => AsyncIterable<Uint8Array>) => Promise<T>): Promise<T> {
    const expected = offer(modelId);
    try {return await store.exclusive(modelId, async () => {
      checkSignal(signal);
      const receipt = await cached(expected);
      if (!receipt) fail('not-downloaded', 'This exact model is not fully downloaded. Download it again before loading.');
      const reads: {finished: boolean}[] = [];
      const open = (path: string) => {
        const assetIndex = expected.assets.findIndex(asset => asset.path === path);
        if (assetIndex < 0) fail('manifest', 'The runtime requested a file outside this pinned model.');
        const read = {finished: false}; reads.push(read);
        return (async function* () {
          const asset = expected.assets[assetIndex], record = receipt.assets[assetIndex], digest = sha256.create();
          let bytes = 0;
          try {
            for (let part = 0; part < record.parts; part++) {
              checkSignal(signal);
              const piece = await store.read(receipt.attempt, assetIndex, part);
              if (!piece || !piece.byteLength || piece.byteLength > QWEN_CHUNK_BYTES || bytes + piece.byteLength > asset.bytes) {
                fail('integrity', 'A cached model file is missing or damaged. Delete this model and download it again.');
              }
              digest.update(piece); bytes += piece.byteLength; yield piece;
            }
            checkSignal(signal);
            if (bytes !== asset.bytes || bytesToHex(digest.digest()) !== asset.sha256) {
              fail('integrity', 'A cached model file failed its size or hash check. Delete this model and download it again.');
            }
            read.finished = true;
          } finally {digest.destroy()}
        })();
      };
      const result = await consume(open);
      checkSignal(signal);
      if (reads.some(read => !read.finished)) fail('integrity', 'Model loading ended before a requested file finished its hash check.');
      return result;
    })} catch (error) {throw normalizeError(error, signal)}
  }
  // Prefer this boundary for WASM/config/tensor consumers: no bytes escape the
  // promise until the entire file passes its cached size/hash checks. Loading a
  // whole file uses memory, so the runtime must provide its own explicit limit.
  async function readVerifiedFile(modelId: string, path: string, signal: AbortSignal, maxBytes: number): Promise<ArrayBuffer> {
    const asset = offer(modelId).assets.find(file => file.path === path);
    if (!asset) fail('manifest', 'The runtime requested a file outside this pinned model.');
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || asset.bytes > maxBytes) {
      fail('unsupported', 'This model file exceeds the runtime’s configured loading limit.');
    }
    return withCachedModel(modelId, signal, async open => {
      const bytes = new Uint8Array(asset.bytes); let offset = 0;
      for await (const piece of open(path)) {bytes.set(piece, offset); offset += piece.length}
      return bytes.buffer;
    });
  }
  return {offers: [...offers.values()], offer, status, download, remove, withCachedModel, readVerifiedFile};
}
