import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { QwenAsset, QwenCandidate } from './qwen-catalog';

// Public, reproducible model files only. No workout/profile/key storage or native
// inference is reachable through this API. A receipt never qualifies a device.
export const NATIVE_QWEN_CHUNK_BYTES = 256 * 1024;
export const NATIVE_QWEN_IDLE_MS = 60_000;
export type NativeQwenCode = 'unknown-model' | 'manifest' | 'consent' | 'unsupported' | 'busy' |
  'cancelled' | 'network' | 'integrity' | 'storage' | 'cleanup' | 'not-downloaded';
export class NativeQwenFilesError extends Error {
  constructor(public readonly code: NativeQwenCode, message: string) {
    super(message); this.name = 'NativeQwenFilesError';
  }
}
export type NativeQwenOffer = {
  modelId: string; label: string; fingerprint: string; downloadBytes: number; assets: readonly QwenAsset[];
};
export type NativeQwenConsent = Pick<NativeQwenOffer, 'modelId' | 'fingerprint' | 'downloadBytes'>;
export type NativeQwenCachedAsset = { path: string; bytes: number; sha256: string };
export type NativeQwenReceipt = {
  version: 1; modelId: string; fingerprint: string; attempt: string;
  downloadBytes: number; assets: NativeQwenCachedAsset[];
};
export type NativeQwenProgress = {
  phase: 'preparing' | 'downloading' | 'verifying' | 'committing' | 'complete';
  modelId: string; path: string | null; receivedBytes: number; totalBytes: number;
  verifiedFiles: number; totalFiles: number;
};
export type NativeQwenPaths = Readonly<{ modelPath: string; tokenizerPath: string; tokenizerConfigPath: string }>;
export type NativeQwenResult = { receipt: NativeQwenReceipt; reused: boolean; cleanupPending: boolean };
export type NativeQwenReader = {
  size: number; read(length: number): Promise<Uint8Array>; close(): void;
};
// Adapter paths are generated from model/attempt/index, never supplied by a
// serialized receipt. Metadata commits must preserve the previous pointer and
// compare the attempt's starting epoch in one SQLite transaction.
export interface NativeQwenStore {
  namespace: string;
  recover(modelId: string, protectedAttempts: readonly string[]): Promise<void>;
  inspect(modelId: string): Promise<NativeQwenReceipt | null>;
  contains(receipt: NativeQwenReceipt): Promise<boolean>;
  availableBytes(): Promise<number | null>;
  begin(offer: NativeQwenOffer, attempt: string): Promise<void>;
  destination(modelId: string, attempt: string, asset: number): string;
  open(modelId: string, attempt: string, asset: number): Promise<NativeQwenReader>;
  fileSize(modelId: string, attempt: string, asset: number): Promise<number | null>;
  seal(attempt: string, asset: number, record: NativeQwenCachedAsset): Promise<void>;
  commit(attempt: string): Promise<NativeQwenReceipt>;
  discard(modelId: string, attempt: string): Promise<void>;
  remove(modelId: string, protectedAttempts: readonly string[]): Promise<{ cleanupPending: boolean }>;
}
export type NativeQwenTransfer = { run(): Promise<void>; cancel(): void; release(): void };
export type NativeQwenTransport = (url: string, destination: string, options: {
  signal: AbortSignal; onProgress: (written: number) => void;
}) => NativeQwenTransfer;

function fail(code: NativeQwenCode, message: string): never { throw new NativeQwenFilesError(code, message); }
const cancelled = () => new NativeQwenFilesError('cancelled', 'Download cancelled. Incomplete files stay isolated until the transfer stops; Check files retries cleanup. Close and reopen the app if the transfer does not stop.');
const checkSignal = (signal: AbortSignal) => { if (signal.aborted) throw cancelled(); };
const storageError = (error: unknown) => error instanceof NativeQwenFilesError ? error :
  new NativeQwenFilesError('storage', 'The model files could not be opened or saved. Free device space, then retry.');

export function createNativeQwenOffer(model: QwenCandidate): NativeQwenOffer {
  if (model.platform !== 'android' || model.runtime !== 'react-native-executorch' ||
    model.backend !== 'xnnpack-8da4w' || !/^\d+\.\d+\.\d+$/.test(model.runtimeVersion) ||
    !/^[a-z0-9._-]{1,100}$/.test(model.id) || model.id === '.' || model.id === '..' ||
    typeof model.label !== 'string' || model.label.length < 1 || model.label.length > 200 || !/^[0-9a-f]{40}$/.test(model.modelRevision) ||
    !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(model.repository) ||
    !Number.isSafeInteger(model.contextTokens) || !model.contextTokens || model.contextTokens <= 0 ||
    !Array.isArray(model.assets) || model.assets.length !== 3) {
    fail('manifest', 'This model does not have a supported pinned Android file manifest.');
  }
  const paths = new Set<string>(), urls = new Set<string>();
  const assets = model.assets.map((asset, index) => {
    if (!asset || !/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(asset.path) ||
      asset.path.split('/').some(segment => segment === '.' || segment === '..') ||
      paths.has(asset.path) || urls.has(asset.url) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 ||
      asset.bytes > 16 * 1024 ** 3 || !/^[0-9a-f]{64}$/.test(asset.sha256) ||
      (index === 0 ? !asset.path.endsWith('.pte') : asset.path !== (index === 1 ? 'tokenizer.json' : 'tokenizer_config.json')) ||
      asset.url !== `https://huggingface.co/${model.repository}/resolve/${model.modelRevision}/${asset.path}`) {
      fail('manifest', 'A model file is missing its pinned URL, exact size, hash or unique path.');
    }
    paths.add(asset.path); urls.add(asset.url); return Object.freeze({ ...asset });
  });
  const downloadBytes = assets.reduce((total, asset) => total + asset.bytes, 0);
  if (!Number.isSafeInteger(downloadBytes) || downloadBytes !== model.downloadBytes) {
    fail('manifest', 'The model download size does not match its files.');
  }
  const descriptor = JSON.stringify({ modelId: model.id, platform: model.platform,
    modelRevision: model.modelRevision, runtime: model.runtime, runtimeVersion: model.runtimeVersion,
    backend: model.backend, contextTokens: model.contextTokens,
    assets: assets.map(({ path, url, bytes, sha256: hash }) => ({ path, url, bytes, sha256: hash })) });
  return Object.freeze({ modelId: model.id, label: model.label, downloadBytes,
    fingerprint: bytesToHex(sha256(new TextEncoder().encode(descriptor))), assets: Object.freeze(assets) });
}

export function nativeQwenReceiptMatches(receipt: NativeQwenReceipt | null, offer: NativeQwenOffer): receipt is NativeQwenReceipt {
  return !!receipt && receipt.version === 1 && receipt.modelId === offer.modelId &&
    receipt.fingerprint === offer.fingerprint && receipt.downloadBytes === offer.downloadBytes &&
    /^[0-9a-f]{32}$/.test(receipt.attempt) && Array.isArray(receipt.assets) && receipt.assets.length === offer.assets.length &&
    receipt.assets.every((asset, i) => !!asset && asset.path === offer.assets[i].path && asset.bytes === offer.assets[i].bytes &&
      asset.sha256 === offer.assets[i].sha256);
}

// Shared across module reloads within this JS runtime. Separate OS processes or
// JS engines are not supported. Pending native writers remain quarantined even
// when their cancellation Promise never settles.
type Lifecycle = { locks: Set<string>; writers: Map<string, Set<string>> };
const lifecycleSymbol = Symbol.for('movefield.native-qwen-files.lifecycle.v1');
const lifecycle = (globalThis as unknown as { [key: symbol]: Lifecycle })[lifecycleSymbol] ??=
  { locks: new Set<string>(), writers: new Map<string, Set<string>>() };

function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void operation.catch(() => {}); return Promise.reject(cancelled()); }
  return new Promise((resolve, reject) => {
    const abort = () => reject(cancelled());
    signal.addEventListener('abort', abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export function createNativeQwenFiles(options: {
  models: readonly QwenCandidate[]; store: NativeQwenStore; transport: NativeQwenTransport;
  random: (length: number) => Uint8Array; yieldTask?: () => Promise<void>; networkIdleMs?: number;
}) {
  const { store, transport } = options;
  const models = options.models.filter(model => model.platform === 'android');
  const offers = new Map(models.map(model => [model.id, createNativeQwenOffer(model)]));
  if (offers.size !== models.length || !store.namespace) fail('manifest', 'Native model identifiers or cache namespace are invalid.');
  const idleMs = options.networkIdleMs ?? NATIVE_QWEN_IDLE_MS;
  if (!Number.isFinite(idleMs) || idleMs <= 0) fail('manifest', 'The download timeout must be positive.');
  const yieldTask = options.yieldTask ?? (() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  const offer = (id: string) => {
    const expected = offers.get(id); if (!expected) fail('unknown-model', 'Choose a supported Android model.'); return expected;
  };
  const key = (id: string) => `${store.namespace}:${id}`;
  const writers = (id: string) => {
    const name = key(id); let set = lifecycle.writers.get(name);
    if (!set) { set = new Set(); lifecycle.writers.set(name, set); } return set;
  };
  async function exclusive<T>(id: string, job: () => Promise<T>): Promise<T> {
    const name = key(id);
    if (lifecycle.locks.has(name)) fail('busy', 'Another operation is using these model files. Wait for it to finish.');
    lifecycle.locks.add(name);
    try { return await job(); } catch (error) { throw storageError(error); } finally { lifecycle.locks.delete(name); }
  }
  const recover = (id: string) => store.recover(id, [...writers(id)]);
  const assertWritersStopped = (id: string) => {
    if (writers(id).size) fail('cleanup', 'The stopped transfer has not finished closing. Its files stay isolated. Close and reopen the app if Check files cannot finish cleanup.');
  };
  async function cached(expected: NativeQwenOffer) {
    const receipt = await store.inspect(expected.modelId);
    return nativeQwenReceiptMatches(receipt, expected) && await store.contains(receipt) ? receipt : null;
  }
  async function status(id: string): Promise<NativeQwenReceipt | null> {
    const expected = offer(id);
    return exclusive(id, async () => { await recover(id); assertWritersStopped(id); return cached(expected); });
  }
  async function verify(expected: NativeQwenOffer, attempt: string, index: number, signal: AbortSignal) {
    checkSignal(signal);
    const asset = expected.assets[index], digest = sha256.create();
    let reader: NativeQwenReader | undefined, bytes = 0;
    try {
      reader = await store.open(expected.modelId, attempt, index);
      if (reader.size !== asset.bytes) fail('integrity', 'A model file is missing or has the wrong size. Delete its files and download again.');
      while (bytes < asset.bytes) {
        checkSignal(signal);
        const requested = Math.min(NATIVE_QWEN_CHUNK_BYTES, asset.bytes - bytes);
        const piece = await reader.read(requested);
        if (!(piece instanceof Uint8Array) || !piece.byteLength || piece.byteLength > requested) {
          fail('integrity', 'A model file ended early or exceeded its safe read size. No file was accepted.');
        }
        digest.update(piece); bytes += piece.byteLength;
        await yieldTask();
      }
      checkSignal(signal);
      const extra = await reader.read(1);
      if (!(extra instanceof Uint8Array) || extra.byteLength ||
        await store.fileSize(expected.modelId, attempt, index) !== asset.bytes ||
        bytesToHex(digest.digest()) !== asset.sha256) {
        fail('integrity', 'A model file failed its exact size or SHA-256 check. Delete its files and download again.');
      }
      checkSignal(signal);
    } finally { try { reader?.close(); } finally { digest.destroy(); } }
  }
  async function verifyAll(expected: NativeQwenOffer, receipt: NativeQwenReceipt, signal: AbortSignal) {
    for (let i = 0; i < expected.assets.length; i++) await verify(expected, receipt.attempt, i, signal);
  }
  async function download(consent: NativeQwenConsent, settings: {
    signal: AbortSignal; onProgress?: (progress: NativeQwenProgress) => void;
  }): Promise<NativeQwenResult> {
    const expected = offer(consent.modelId);
    if (consent.fingerprint !== expected.fingerprint || consent.downloadBytes !== expected.downloadBytes) {
      fail('consent', 'Review and confirm this exact model and download size before downloading.');
    }
    checkSignal(settings.signal);
    return exclusive(expected.modelId, async () => {
      checkSignal(settings.signal); await recover(expected.modelId); assertWritersStopped(expected.modelId); checkSignal(settings.signal);
      const existing = await cached(expected);
      if (existing) { await verifyAll(expected, existing, settings.signal); return { receipt: existing, reused: true, cleanupPending: writers(expected.modelId).size > 0 }; }
      const available = await store.availableBytes();
      // Do not count retained old files as free space. Allow a second largest
      // file for platform temporary downloads plus app/storage headroom.
      const required = Math.ceil(expected.downloadBytes * 1.1) + Math.max(...expected.assets.map(asset => asset.bytes)) + 16 * 1024 * 1024;
      if (available !== null && (!Number.isFinite(available) || available < required)) {
        fail('storage', 'This model needs more free device space, including temporary download space. Free space before retrying.');
      }
      const random = options.random(16);
      if (!(random instanceof Uint8Array) || random.byteLength !== 16) fail('storage', 'Secure model-file identifiers are unavailable. No download started.');
      const attempt = bytesToHex(random);
      let begun = false, committed = false, receivedBytes = 0, verifiedFiles = 0;
      const notify = (phase: NativeQwenProgress['phase'], path: string | null) => {
        try { settings.onProgress?.({ phase, path, modelId: expected.modelId, receivedBytes,
          totalBytes: expected.downloadBytes, verifiedFiles, totalFiles: expected.assets.length }); } catch { /* Detached observer. */ }
      };
      notify('preparing', null);
      try {
        checkSignal(settings.signal); await store.begin(expected, attempt); begun = true;
        for (let index = 0; index < expected.assets.length; index++) {
          checkSignal(settings.signal);
          const asset = expected.assets[index], controller = new AbortController();
          let task: NativeQwenTransfer | undefined, timer: ReturnType<typeof setTimeout> | undefined;
          let timedOut = false, progressBytes = 0, observing = true, invalidProgress = false;
          const before = receivedBytes;
          const abort = () => { controller.abort(); try { task?.cancel(); } catch { /* Native failure is isolated. */ } };
          settings.signal.addEventListener('abort', abort, { once: true });
          const arm = () => { clearTimeout(timer); timer = setTimeout(() => { timedOut = true; abort(); }, idleMs); };
          try {
            notify('downloading', asset.path); arm();
            task = transport(asset.url, store.destination(expected.modelId, attempt, index), { signal: controller.signal,
              onProgress: written => {
                if (!observing || controller.signal.aborted) return;
                if (!Number.isSafeInteger(written) || written < progressBytes || written > asset.bytes) {
                  invalidProgress = true; abort(); return;
                }
                if (written > progressBytes) { progressBytes = written; receivedBytes = before + written; arm(); notify('downloading', asset.path); }
              } });
            checkSignal(settings.signal);
            writers(expected.modelId).add(attempt);
            let operation: Promise<void>;
            try { operation = Promise.resolve(task.run()); } catch (error) { writers(expected.modelId).delete(attempt); throw error; }
            const tracked = operation.then(() => { writers(expected.modelId).delete(attempt); }, error => { writers(expected.modelId).delete(attempt); throw error; });
            await abortable(tracked, controller.signal);
            clearTimeout(timer); checkSignal(settings.signal);
            receivedBytes = before + asset.bytes; notify('verifying', asset.path);
            await verify(expected, attempt, index, settings.signal);
            await store.seal(attempt, index, { path: asset.path, bytes: asset.bytes, sha256: asset.sha256 });
            verifiedFiles++;
          } catch (error) {
            if (settings.signal.aborted) throw cancelled();
            if (invalidProgress) fail('integrity', 'A model download exceeded its pinned size or returned invalid progress. No file was accepted.');
            if (timedOut) fail('network', 'The model download stopped receiving data. Its incomplete files stay isolated; Check files retries cleanup.');
            if (error instanceof NativeQwenFilesError) throw error;
            fail('network', 'The model download was interrupted. Retry when the connection is stable.');
          } finally {
            observing = false; clearTimeout(timer); settings.signal.removeEventListener('abort', abort);
            controller.abort(); try { task?.cancel(); } catch { /* Release still runs. */ }
            try { task?.release(); } catch { /* Writer remains quarantined until its Promise settles. */ }
          }
        }
        checkSignal(settings.signal); notify('committing', null); checkSignal(settings.signal);
        // Once the atomic pointer transaction starts it may commit before Cancel.
        // Return that real result; explicit Delete removes completed files.
        const receipt = await store.commit(attempt); committed = true;
        if (!nativeQwenReceiptMatches(receipt, expected) || receipt.attempt !== attempt) fail('storage', 'The saved model pointer could not be verified. Check files before retrying.');
        let cleanupPending = writers(expected.modelId).size > 0;
        try { await recover(expected.modelId); } catch { cleanupPending = true; }
        notify('complete', null);
        return { receipt, reused: false, cleanupPending };
      } catch (error) {
        if (begun && !committed && !writers(expected.modelId).has(attempt)) {
          try { await store.discard(expected.modelId, attempt); } catch {
            fail('cleanup', 'Incomplete model files could not be removed. Check files to retry cleanup before downloading again.');
          }
        }
        throw storageError(error);
      }
    });
  }
  async function remove(id: string) {
    offer(id);
    return exclusive(id, () => store.remove(id, [...writers(id)]));
  }
  async function withVerifiedPaths<T>(id: string, signal: AbortSignal, consume: (paths: NativeQwenPaths) => Promise<T>): Promise<T> {
    const expected = offer(id);
    return exclusive(id, async () => {
      checkSignal(signal); await recover(id);
      const receipt = await cached(expected);
      if (!receipt) fail('not-downloaded', 'These exact model files are not fully saved. Download them before loading.');
      await verifyAll(expected, receipt, signal); checkSignal(signal);
      const paths = Object.freeze({ modelPath: store.destination(id, receipt.attempt, 0),
        tokenizerPath: store.destination(id, receipt.attempt, 1), tokenizerConfigPath: store.destination(id, receipt.attempt, 2) });
      const result = await consume(paths); checkSignal(signal); return result;
    });
  }
  return { offers: [...offers.values()], offer, status, download, remove, withVerifiedPaths };
}
export type NativeQwenFilesClient = ReturnType<typeof createNativeQwenFiles>;
