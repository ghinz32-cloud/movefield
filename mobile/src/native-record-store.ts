import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/ciphers/utils.js';
import { LocalDataError, isSealed } from './local-crypto';

// The encryption boundary lives in storage.ts. Only authenticated envelopes and
// their encrypted restore journal enter this database; keys stay in SecureStore.
// Splitting ciphertext avoids Android's legacy single-row read window. A complete
// snapshot and its integrity manifest are committed in one exclusive transaction.
export const NATIVE_RECORD_CHUNK_CHARS = 128 * 1024;
export const NATIVE_RECORD_MAX_CHARS = 48_000_000;
export const NATIVE_RECORD_SLOTS = [
  'training-studio:mobile-local-demo:v1',
  'training-studio:mobile-setup:v1',
  'training-studio:mobile-restore:v1',
] as const;
type SqlValue = string | number | null;
export type NativeRecordSql = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...values: SqlValue[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...values: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...values: SqlValue[]): Promise<T[]>;
};
export type NativeRecordDb = NativeRecordSql & {
  withExclusiveTransactionAsync(job: (transaction: NativeRecordSql) => Promise<void>): Promise<void>;
};
export type LegacyRecordStore = {
  getItem(slot: string): Promise<string | null>;
  removeItem(slot: string): Promise<unknown>;
};
type Manifest = { deleted: number; chars: number; chunks: number; hash: string };
type Chunk = { ordinal: number; value: string; hash: string };
const digest = (text: string) => bytesToHex(sha256(utf8ToBytes(text)));
const damaged = () => new LocalDataError('decrypt-failed', 'Saved training is incomplete or damaged. Nothing was replaced. Restore your transfer file or keep a copy before resetting.');

function assertSlot(slot: string) {
  if (!(NATIVE_RECORD_SLOTS as readonly string[]).includes(slot)) throw new LocalDataError('unknown-format', 'Unexpected training storage slot.');
}
function assertEncrypted(slot: string, value: string) {
  if (value.length > NATIVE_RECORD_MAX_CHARS) throw new LocalDataError('storage-capacity', 'These records exceed the supported save size. Export your records from Settings before closing.');
  const sealed = (raw: string) => {
    try {
      const record = JSON.parse(raw);
      return isSealed(raw) && record.v === 1 && record.alg === 'xchacha20poly1305'
        && Object.keys(record).sort().join(',') === 'alg,data,nonce,v'
        && typeof record.nonce === 'string' && /^[0-9a-f]{48}$/.test(record.nonce)
        && typeof record.data === 'string' && /^(?:[0-9a-f]{2}){16,}$/.test(record.data);
    } catch { return false; }
  };
  if (sealed(value)) return;
  if (slot === NATIVE_RECORD_SLOTS[2]) {
    try {
      const journal = JSON.parse(value);
      const hash = (v: unknown) => v === null || typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
      if (journal && Object.keys(journal).sort().join(',') === 'after,beforeHash,id,setupHash'
        && /^[0-9a-f]{64}$/.test(journal.id) && typeof journal.after === 'string' && sealed(journal.after)
        && hash(journal.beforeHash) && hash(journal.setupHash)) return;
    } catch { /* Refuse plaintext or an unknown journal shape. */ }
  }
  throw new LocalDataError('unknown-format', 'Unencrypted training cannot be written to the record database.');
}

export function createNativeRecordStore(deps: { open: () => Promise<NativeRecordDb>; legacy: LegacyRecordStore }) {
  let database: Promise<NativeRecordDb> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  const open = () => database ??= deps.open().then(async db => {
    await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS training_records (slot TEXT PRIMARY KEY NOT NULL, deleted INTEGER NOT NULL, chars INTEGER NOT NULL, chunks INTEGER NOT NULL, hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS training_chunks (slot TEXT NOT NULL, ordinal INTEGER NOT NULL, value TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (slot, ordinal));`);
    return db;
  }).catch(error => { database = undefined; throw error; });
  const enqueue = <T>(job: () => Promise<T>): Promise<T> => {
    const next = queue.then(job); queue = next.catch(() => undefined); return next;
  };
  async function read(db: NativeRecordSql, slot: string): Promise<{ present: boolean; value: string | null }> {
    const manifest = await db.getFirstAsync<Manifest>('SELECT deleted, chars, chunks, hash FROM training_records WHERE slot = ?', slot);
    if (!manifest) {
      const orphan = await db.getFirstAsync<{ ordinal: number }>('SELECT ordinal FROM training_chunks WHERE slot = ? LIMIT 1', slot);
      if (orphan) throw damaged();
      return { present: false, value: null };
    }
    if (manifest.deleted === 1) {
      const leftover = await db.getFirstAsync<{ ordinal: number }>('SELECT ordinal FROM training_chunks WHERE slot = ? LIMIT 1', slot);
      if (manifest.chars !== 0 || manifest.chunks !== 0 || manifest.hash !== '' || leftover) throw damaged();
      return { present: true, value: null };
    }
    if (manifest.deleted !== 0 || !Number.isSafeInteger(manifest.chars) || manifest.chars < 1 || manifest.chars > NATIVE_RECORD_MAX_CHARS
      || !Number.isSafeInteger(manifest.chunks) || manifest.chunks !== Math.ceil(manifest.chars / NATIVE_RECORD_CHUNK_CHARS)
      || !/^[0-9a-f]{64}$/.test(manifest.hash)) throw damaged();
    const rows = await db.getAllAsync<Chunk>('SELECT ordinal, value, hash FROM training_chunks WHERE slot = ? ORDER BY ordinal', slot);
    if (rows.length !== manifest.chunks || rows.some((row, i) => row.ordinal !== i || typeof row.value !== 'string'
      || row.value.length < 1 || row.value.length > NATIVE_RECORD_CHUNK_CHARS || digest(row.value) !== row.hash)) throw damaged();
    const value = rows.map(row => row.value).join('');
    if (value.length !== manifest.chars || digest(value) !== manifest.hash) throw damaged();
    return { present: true, value };
  }
  async function snapshot(slot: string) {
    const db = await open(); let result!: Awaited<ReturnType<typeof read>>;
    await db.withExclusiveTransactionAsync(async tx => { result = await read(tx, slot); });
    return result;
  }
  async function retireLegacy(slot: string) {
    // SQLite is already authoritative. Failed cleanup retains the old encrypted
    // copy, and a tombstone prevents it from ever resurfacing after deletion.
    await deps.legacy.removeItem(slot).catch(() => undefined);
  }
  return {
    getItem(slot: string): Promise<string | null> {
      assertSlot(slot);
      return enqueue(async () => {
        const record = await snapshot(slot);
        // Never fall back on corruption/decryption failure. Legacy plaintext is
        // returned untouched so storage.ts can validate and encrypt it first.
        return record.present ? record.value : deps.legacy.getItem(slot);
      });
    },
    hasRecord(slot: string): Promise<boolean> {
      assertSlot(slot); return enqueue(async () => (await snapshot(slot)).present);
    },
    setItem(slot: string, value: string): Promise<void> {
      assertSlot(slot); assertEncrypted(slot, value);
      return enqueue(async () => {
        const db = await open(), hash = digest(value);
        const count = Math.ceil(value.length / NATIVE_RECORD_CHUNK_CHARS);
        await db.withExclusiveTransactionAsync(async tx => {
          await tx.runAsync('DELETE FROM training_chunks WHERE slot = ?', slot);
          for (let i = 0; i < count; i++) {
            const chunk = value.slice(i * NATIVE_RECORD_CHUNK_CHARS, (i + 1) * NATIVE_RECORD_CHUNK_CHARS);
            await tx.runAsync('INSERT INTO training_chunks (slot, ordinal, value, hash) VALUES (?, ?, ?, ?)', slot, i, chunk, digest(chunk));
          }
          await tx.runAsync('INSERT OR REPLACE INTO training_records (slot, deleted, chars, chunks, hash) VALUES (?, 0, ?, ?, ?)', slot, value.length, count, hash);
          if ((await read(tx, slot)).value !== value) throw damaged();
        });
        // Acknowledge persistence only after a separate committed readback. An
        // ambiguous failure retains the legacy copy and is surfaced to the UI.
        if ((await snapshot(slot)).value !== value) throw damaged();
        await retireLegacy(slot);
      });
    },
    removeItem(slot: string): Promise<void> { return this.multiRemove([slot]); },
    multiRemove(slots: string[]): Promise<void> {
      slots.forEach(assertSlot);
      return enqueue(async () => {
        const db = await open();
        await db.withExclusiveTransactionAsync(async tx => {
          for (const slot of slots) {
            await tx.runAsync('DELETE FROM training_chunks WHERE slot = ?', slot);
            await tx.runAsync('INSERT OR REPLACE INTO training_records (slot, deleted, chars, chunks, hash) VALUES (?, 1, 0, 0, ?)', slot, '');
          }
        });
        for (const slot of slots) if ((await snapshot(slot)).value !== null) throw damaged();
        await Promise.all(slots.map(retireLegacy));
      });
    },
  };
}
