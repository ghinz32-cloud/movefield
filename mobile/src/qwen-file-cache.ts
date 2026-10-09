import { getRandomBytes } from 'expo-crypto';
import { Platform } from 'react-native';
import { qwenCandidates, type QwenCandidate } from './shared/qwen-catalog';
import { createNativeQwenFiles, nativeQwenReceiptMatches, NativeQwenFilesError,
  type NativeQwenCachedAsset, type NativeQwenFilesClient, type NativeQwenOffer, type NativeQwenReceipt,
  type NativeQwenStore, type NativeQwenTransport } from './shared/qwen-native-files';

type SqlValue = string | number | null;
export type QwenFileSql = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...values: SqlValue[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...values: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...values: SqlValue[]): Promise<T[]>;
};
export type QwenFileDb = QwenFileSql & {
  withExclusiveTransactionAsync(job: (transaction: QwenFileSql) => Promise<void>): Promise<void>;
};
type Fs = typeof import('expo-file-system');
type PointerRow = { epoch: number; deleted: number; attempt: string | null; receipt: string | null };
type AttemptRow = { id: string; model_id: string; epoch: number; offer: string; seals: string; complete: number };
type CheckedAttempt = AttemptRow & { descriptor: NativeQwenOffer; verified: (NativeQwenCachedAsset | null)[] };
const damaged = () => new NativeQwenFilesError('storage', 'Saved model-file metadata is damaged. It was preserved; delete this model explicitly or keep using ordinary training.');
const cleanupError = () => new NativeQwenFilesError('cleanup', 'Some incomplete model files are still isolated or could not be removed. Check files retries cleanup after the transfer stops.');
const attemptId = (id: string) => /^[0-9a-f]{32}$/.test(id);
const parse = (raw: string): unknown => {
  if (typeof raw !== 'string' || raw.length < 1 || raw.length > 64 * 1024) throw damaged();
  try { return JSON.parse(raw); } catch { throw damaged(); }
};
function checkOffer(value: unknown, modelId: string): NativeQwenOffer {
  const offer = value as NativeQwenOffer;
  if (!offer || offer.modelId !== modelId || typeof offer.label !== 'string' || offer.label.length > 200 ||
    !/^[0-9a-f]{64}$/.test(offer.fingerprint) || !Number.isSafeInteger(offer.downloadBytes) || offer.downloadBytes <= 0 ||
    !Array.isArray(offer.assets) || offer.assets.length !== 3) throw damaged();
  const paths = new Set<string>();
  let repositoryRevision: string | undefined;
  for (const [i, asset] of offer.assets.entries()) {
    if (!asset || !/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(asset.path) ||
      asset.path.split('/').some((segment: string) => segment === '.' || segment === '..') || paths.has(asset.path) ||
      !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > 16 * 1024 ** 3 ||
      !/^[0-9a-f]{64}$/.test(asset.sha256) || typeof asset.url !== 'string' ||
      (i === 0 ? !asset.path.endsWith('.pte') : asset.path !== (i === 1 ? 'tokenizer.json' : 'tokenizer_config.json'))) throw damaged();
    const match = /^https:\/\/huggingface\.co\/([a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/resolve\/[0-9a-f]{40})\/(.+)$/.exec(asset.url);
    if (!match || match[2] !== asset.path || repositoryRevision && repositoryRevision !== match[1]) throw damaged();
    repositoryRevision = match[1]; paths.add(asset.path);
  }
  if (offer.assets.reduce((total, asset) => total + asset.bytes, 0) !== offer.downloadBytes) throw damaged();
  return offer;
}
function checkReceipt(value: unknown, modelId: string): NativeQwenReceipt {
  const receipt = value as NativeQwenReceipt;
  if (!receipt || receipt.version !== 1 || receipt.modelId !== modelId || !attemptId(receipt.attempt) ||
    !/^[0-9a-f]{64}$/.test(receipt.fingerprint) || !Number.isSafeInteger(receipt.downloadBytes) || receipt.downloadBytes <= 0 ||
    !Array.isArray(receipt.assets) || receipt.assets.length !== 3 || receipt.assets.some(asset => !asset ||
      typeof asset.path !== 'string' || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || !/^[0-9a-f]{64}$/.test(asset.sha256))) throw damaged();
  return receipt;
}

// Exported for actual-adapter tests with injected native API stand-ins. Model
// bytes live in the private, evictable cache; only public metadata uses this
// separate database. Training/SecureStore/transfer stores are never opened.
export function createExpoQwenFileAdapter(deps: {
  models: readonly QwenCandidate[]; filesystem: () => Promise<Fs>; open: () => Promise<QwenFileDb>; namespace?: string;
}) {
  const supported = new Set(deps.models.filter(model => model.platform === 'android').map(model => model.id));
  let fsPromise: Promise<Fs> | undefined, database: Promise<QwenFileDb> | undefined;
  let fs: Fs | undefined;
  let root: InstanceType<Fs['Directory']> | undefined;
  const assertModel = (id: string) => { if (!supported.has(id) || !/^[a-z0-9._-]{1,100}$/.test(id) || id === '.' || id === '..') throw damaged(); };
  async function filesystem() {
    fsPromise ??= deps.filesystem().then(value => {
      fs = value; root = new value.Directory(value.Paths.cache, 'movefield-qwen-files-v1');
      root.create({ intermediates: true, idempotent: true }); return value;
    }).catch(error => { fsPromise = undefined; throw error; });
    return fsPromise;
  }
  async function open() {
    database ??= deps.open().then(async db => {
      await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;
        CREATE TABLE IF NOT EXISTS qwen_file_models (model_id TEXT PRIMARY KEY NOT NULL, epoch INTEGER NOT NULL, deleted INTEGER NOT NULL, attempt TEXT, receipt TEXT);
        CREATE TABLE IF NOT EXISTS qwen_file_attempts (id TEXT PRIMARY KEY NOT NULL, model_id TEXT NOT NULL, epoch INTEGER NOT NULL, offer TEXT NOT NULL, seals TEXT NOT NULL, complete INTEGER NOT NULL);`);
      return db;
    }).catch(error => { database = undefined; throw error; });
    return database;
  }
  const directory = (id: string) => {
    assertModel(id); if (!fs || !root) throw damaged(); return new fs.Directory(root, id);
  };
  const attemptDirectory = (id: string, attempt: string) => {
    if (!attemptId(attempt) || !fs) throw damaged(); return new fs.Directory(directory(id), attempt);
  };
  const file = (id: string, attempt: string, index: number) => {
    if (!Number.isInteger(index) || index < 0 || index > 2 || !fs) throw damaged();
    return new fs.File(attemptDirectory(id, attempt), index === 0 ? '0.pte' : `${index}.json`);
  };
  function checkedAttempt(row: AttemptRow): CheckedAttempt {
    assertModel(row.model_id);
    if (!attemptId(row.id) || !Number.isSafeInteger(row.epoch) || row.epoch < 0 || ![0, 1].includes(row.complete)) throw damaged();
    const descriptor = checkOffer(parse(row.offer), row.model_id), verified = parse(row.seals) as (NativeQwenCachedAsset | null)[];
    if (!Array.isArray(verified) || verified.length !== 3 || verified.some((asset, i) => asset !== null && (!asset ||
      asset.path !== descriptor.assets[i].path || asset.bytes !== descriptor.assets[i].bytes || asset.sha256 !== descriptor.assets[i].sha256)) ||
      row.complete === 1 && verified.some(asset => asset === null)) throw damaged();
    return { ...row, descriptor, verified };
  }
  async function readPointer(db: QwenFileSql, id: string): Promise<{ epoch: number; receipt: NativeQwenReceipt | null }> {
    assertModel(id);
    const row = await db.getFirstAsync<PointerRow>('SELECT epoch, deleted, attempt, receipt FROM qwen_file_models WHERE model_id = ?', id);
    if (!row) return { epoch: 0, receipt: null };
    if (!Number.isSafeInteger(row.epoch) || row.epoch < 1 || ![0, 1].includes(row.deleted)) throw damaged();
    if (row.deleted === 1) {
      if (row.attempt !== null || row.receipt !== null) throw damaged();
      return { epoch: row.epoch, receipt: null };
    }
    if (row.receipt === null || row.attempt === null || !attemptId(row.attempt)) throw damaged();
    const receipt = checkReceipt(parse(row.receipt), id);
    if (receipt.attempt !== row.attempt) throw damaged();
    const raw = await db.getFirstAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE id = ?', row.attempt);
    if (!raw) throw damaged();
    const attempt = checkedAttempt(raw);
    if (attempt.model_id !== id || attempt.complete !== 1 || attempt.epoch + 1 !== row.epoch ||
      !nativeQwenReceiptMatches(receipt, attempt.descriptor)) throw damaged();
    return { epoch: row.epoch, receipt };
  }
  async function deleteAttempt(db: QwenFileDb, id: string, attempt: string) {
    await db.withExclusiveTransactionAsync(async tx => {
      const pointer = await readPointer(tx, id);
      if (pointer.receipt?.attempt === attempt) return;
      const raw = await tx.getFirstAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE id = ?', attempt);
      if (raw && checkedAttempt(raw).model_id !== id) throw damaged();
      const folder = attemptDirectory(id, attempt);
      if (folder.exists) folder.delete();
      await tx.runAsync('DELETE FROM qwen_file_attempts WHERE id = ? AND model_id = ?', attempt, id);
    });
  }
  async function recover(id: string, protectedAttempts: readonly string[]) {
    assertModel(id); await filesystem(); const db = await open();
    if (protectedAttempts.some(attempt => !attemptId(attempt))) throw damaged();
    // Parse everything before deleting anything. Corrupted/unknown metadata is
    // preserved; startup cleanup never traverses another app/cache directory.
    const pointer = await readPointer(db, id);
    const rawRows = await db.getAllAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE model_id = ? LIMIT 33', id);
    if (rawRows.length > 32) throw damaged();
    const rows = rawRows.map(checkedAttempt);
    const folder = directory(id), known = new Set(rows.map(row => row.id));
    if (folder.exists) for (const entry of folder.list()) {
      if (entry instanceof fs!.Directory && attemptId(entry.name)) known.add(entry.name);
    }
    for (const attempt of known) {
      if (attempt !== pointer.receipt?.attempt && !protectedAttempts.includes(attempt)) {
        try { await deleteAttempt(db, id, attempt); } catch (error) {
          if (error instanceof NativeQwenFilesError) throw error;
          throw cleanupError();
        }
      }
    }
  }
  const store: NativeQwenStore = {
    namespace: deps.namespace ?? 'movefield.native-qwen-files.v1', recover,
    async inspect(id) { const db = await open(); return (await readPointer(db, id)).receipt; },
    async contains(receipt) {
      await filesystem(); checkReceipt(receipt, receipt.modelId);
      return receipt.assets.every((asset, index) => { const f = file(receipt.modelId, receipt.attempt, index); return f.exists && f.size === asset.bytes; });
    },
    async availableBytes() { const native = await filesystem(); return native.Paths.availableDiskSpace; },
    async begin(offer, attempt) {
      assertModel(offer.modelId); checkOffer(offer, offer.modelId); await filesystem();
      const folder = attemptDirectory(offer.modelId, attempt);
      if (folder.exists) throw new NativeQwenFilesError('storage', 'A model-file attempt already exists. Check files before retrying.');
      folder.create({ intermediates: true }); const db = await open();
      await db.withExclusiveTransactionAsync(async tx => {
        const pointer = await readPointer(tx, offer.modelId);
        const pending = await tx.getAllAsync<{ id: string }>('SELECT id FROM qwen_file_attempts WHERE model_id = ? LIMIT 33', offer.modelId);
        if (pending.length >= 32) throw cleanupError();
        if (await tx.getFirstAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE id = ?', attempt)) throw damaged();
        await tx.runAsync('INSERT INTO qwen_file_attempts (id, model_id, epoch, offer, seals, complete) VALUES (?, ?, ?, ?, ?, ?)',
          attempt, offer.modelId, pointer.epoch, JSON.stringify(offer), '[null,null,null]', 0);
      });
    },
    destination(id, attempt, index) { return file(id, attempt, index).uri; },
    async open(id, attempt, index) {
      await filesystem(); const f = file(id, attempt, index);
      if (!f.exists) throw new NativeQwenFilesError('integrity', 'A saved model file is missing. Download its files again.');
      const handle = f.open(fs!.FileMode.ReadOnly);
      if (!Number.isSafeInteger(handle.size) || handle.size === null || handle.size < 0) { handle.close(); throw damaged(); }
      return { size: handle.size, async read(length) { return handle.readBytes(length); }, close() { handle.close(); } };
    },
    async fileSize(id, attempt, index) { await filesystem(); const f = file(id, attempt, index); return f.exists ? f.size : null; },
    async seal(attempt, index, record) {
      if (!attemptId(attempt) || !Number.isInteger(index) || index < 0 || index > 2) throw damaged();
      const db = await open();
      await db.withExclusiveTransactionAsync(async tx => {
        const raw = await tx.getFirstAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE id = ?', attempt);
        if (!raw) throw damaged(); const row = checkedAttempt(raw), asset = row.descriptor.assets[index];
        if (row.complete !== 0 || row.verified[index] !== null || record.path !== asset.path || record.bytes !== asset.bytes ||
          record.sha256 !== asset.sha256 || await store.fileSize(row.model_id, attempt, index) !== asset.bytes) throw damaged();
        row.verified[index] = record;
        await tx.runAsync('UPDATE qwen_file_attempts SET seals = ? WHERE id = ?', JSON.stringify(row.verified), attempt);
      });
    },
    async commit(attempt) {
      const db = await open(); let result!: NativeQwenReceipt;
      await db.withExclusiveTransactionAsync(async tx => {
        const raw = await tx.getFirstAsync<AttemptRow>('SELECT id, model_id, epoch, offer, seals, complete FROM qwen_file_attempts WHERE id = ?', attempt);
        if (!raw) throw damaged(); const row = checkedAttempt(raw), pointer = await readPointer(tx, row.model_id);
        if (row.complete !== 0 || row.verified.some(asset => asset === null) || pointer.epoch !== row.epoch || !Number.isSafeInteger(pointer.epoch + 1)) throw damaged();
        result = { version: 1, modelId: row.model_id, attempt, fingerprint: row.descriptor.fingerprint,
          downloadBytes: row.descriptor.downloadBytes, assets: row.verified as NativeQwenCachedAsset[] };
        await tx.runAsync('UPDATE qwen_file_attempts SET complete = ? WHERE id = ?', 1, attempt);
        await tx.runAsync('INSERT OR REPLACE INTO qwen_file_models (model_id, epoch, deleted, attempt, receipt) VALUES (?, ?, ?, ?, ?)',
          row.model_id, pointer.epoch + 1, 0, attempt, JSON.stringify(result));
      });
      const after = await readPointer(db, result.modelId);
      if (JSON.stringify(after.receipt) !== JSON.stringify(result)) throw damaged();
      return result;
    },
    async discard(id, attempt) { assertModel(id); await filesystem(); await deleteAttempt(await open(), id, attempt); },
    async remove(id, protectedAttempts) {
      assertModel(id); await filesystem(); const db = await open();
      if (protectedAttempts.some(attempt => !attemptId(attempt))) throw damaged();
      // Explicit delete can retire damaged metadata without parsing its receipt.
      // It advances the epoch before reclaiming files, so late commits fail CAS.
      await db.withExclusiveTransactionAsync(async tx => {
        const row = await tx.getFirstAsync<PointerRow>('SELECT epoch, deleted, attempt, receipt FROM qwen_file_models WHERE model_id = ?', id);
        if (row && (!Number.isSafeInteger(row.epoch) || row.epoch < 1)) throw damaged();
        const epoch = (row?.epoch ?? 0) + 1; if (!Number.isSafeInteger(epoch)) throw damaged();
        await tx.runAsync('INSERT OR REPLACE INTO qwen_file_models (model_id, epoch, deleted, attempt, receipt) VALUES (?, ?, ?, ?, ?)', id, epoch, 1, null, null);
      });
      // Delete is an explicit request to retire this model's public assets.
      // It may clear damaged descriptors/seals that automatic recovery must
      // preserve. Paths still come only from validated opaque directory names.
      const folder = directory(id);
      if (folder.exists) for (const entry of folder.list()) {
        if (entry instanceof fs!.Directory && attemptId(entry.name) && !protectedAttempts.includes(entry.name)) {
          try { entry.delete(); } catch { throw cleanupError(); }
        }
      }
      const rows = await db.getAllAsync<{ id: string; model_id: string }>('SELECT id, model_id FROM qwen_file_attempts WHERE model_id = ? LIMIT 4097', id);
      if (rows.length > 4096 || rows.some(row => row.model_id !== id || typeof row.id !== 'string' || row.id.length > 200)) throw damaged();
      await db.withExclusiveTransactionAsync(async tx => {
        for (const row of rows) if (!protectedAttempts.includes(row.id)) {
          await tx.runAsync('DELETE FROM qwen_file_attempts WHERE id = ? AND model_id = ?', row.id, id);
        }
      });
      return { cleanupPending: protectedAttempts.length > 0 };
    },
  };
  const transport: NativeQwenTransport = (url, destination, options) => {
    if (!fs || !root || !destination.startsWith(root.uri.replace(/\/+$/, '') + '/')) throw damaged();
    const task = fs.File.createDownloadTask(url, new fs.File(destination), { signal: options.signal,
      sessionType: 'foreground', onProgress: progress => options.onProgress(progress.bytesWritten) });
    return { async run() {
      const result = await task.downloadAsync();
      if (!result || result.uri !== destination) throw new NativeQwenFilesError('network', 'The model-file download did not finish. Retry when the connection is stable.');
    }, cancel() { task.cancel(); }, release() { task.release(); } };
  };
  return { store, transport };
}

let client: NativeQwenFilesClient | undefined;
// Synchronous accessor; filesystem/database modules load only on operations.
// Merely importing this module, choosing Off or storing a preference does not
// authorize model downloads. No native inference runtime is imported.
export function nativeQwenFiles(): NativeQwenFilesClient {
  if (client) return client;
  const ensurePhone = () => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new NativeQwenFilesError('unsupported', 'Model-file controls need the phone app. Use the Movefield website for browser models.');
  };
  const adapter = createExpoQwenFileAdapter({ models: qwenCandidates,
    filesystem: async () => { ensurePhone(); return import('expo-file-system'); },
    open: async () => { ensurePhone(); const SQLite = await import('expo-sqlite'); return SQLite.openDatabaseAsync('movefield-qwen-files-v1.db'); } });
  // Current exports are Android candidates. iOS file management is permitted,
  // but no iOS or Android model inference/device qualification is implied.
  client = createNativeQwenFiles({ models: qwenCandidates, ...adapter, random: getRandomBytes });
  return client;
}
