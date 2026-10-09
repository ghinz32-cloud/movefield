import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/ciphers/utils.js';
import { LocalDataError, isSealed } from './local-crypto';

// The encryption boundary lives in storage.ts. Only authenticated envelopes and
// their encrypted restore journal enter this database; keys stay in SecureStore.
// Splitting ciphertext avoids Android's legacy single-row read window. Every
// snapshot/entity batch and its integrity manifests commit in one transaction.
export const NATIVE_RECORD_CHUNK_CHARS = 128 * 1024;
export const NATIVE_RECORD_MAX_CHARS = 48_000_000;
export const NATIVE_HISTORY_PREFIX = 'training-studio:mobile-history:v2:';
export const NATIVE_HISTORY_MAX_RECORDS = 5000;
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
export type NativeRecordSnapshot = { records: Record<string, string | null>; present: Record<string, boolean>; revision: number };
export type NativePrivacyStatus = {
  state: 'clear' | 'pending' | 'attention' | 'unavailable';
  pending: number;
  preserved: number;
  unreadable: number;
};
type CleanupRow = {slot: string; expected_hash: string | null; chars: number | null};
type LegacyCapture = {missing: boolean; hash: string | null; chars: number | null};
export type NativeRecordCommit = {
  expected: Record<string, string | null>;
  records: Record<string, string | null>;
  expectedRevision?: number;
  // Reserved for approved restore/reset. Unchanged retired history is tombstoned
  // atomically with the new main head; no dynamic legacy fallback is possible.
  clearHistory?: boolean;
};
const digest = (text: string) => bytesToHex(sha256(utf8ToBytes(text)));
const damaged = () => new LocalDataError('decrypt-failed', 'Saved training is incomplete or damaged. Nothing was replaced. Restore your transfer file or keep a copy before resetting.');

function assertSlot(slot: string) {
  if (!(NATIVE_RECORD_SLOTS as readonly string[]).includes(slot) && !isHistorySlot(slot)) throw new LocalDataError('unknown-format', 'Unexpected training storage slot.');
}
const isHistorySlot = (slot: string) => slot.startsWith(NATIVE_HISTORY_PREFIX) && /^[0-9a-f]{64}$/.test(slot.slice(NATIVE_HISTORY_PREFIX.length));
export function nativeHistorySlot(workoutId: string): string {
  if (typeof workoutId !== 'string' || workoutId.length < 1 || workoutId.length > 150) throw new LocalDataError('unknown-format', 'Unexpected workout record identifier.');
  return NATIVE_HISTORY_PREFIX + digest(workoutId);
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
      CREATE TABLE IF NOT EXISTS training_chunks (slot TEXT NOT NULL, ordinal INTEGER NOT NULL, value TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (slot, ordinal));
      CREATE TABLE IF NOT EXISTS training_record_metadata (id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS training_legacy_cleanup (slot TEXT PRIMARY KEY NOT NULL, expected_hash TEXT, chars INTEGER);`);
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
  async function revision(db: NativeRecordSql): Promise<number> {
    const row = await db.getFirstAsync<{ revision: number }>('SELECT revision FROM training_record_metadata WHERE id = ?', 'generation-v1');
    if (row && (!Number.isSafeInteger(row.revision) || row.revision < 0)) throw damaged();
    return row?.revision ?? 0;
  }
  async function advance(db: NativeRecordSql) {
    const next = (await revision(db)) + 1;
    if (!Number.isSafeInteger(next)) throw damaged();
    await db.runAsync('INSERT OR REPLACE INTO training_record_metadata (id, revision) VALUES (?, ?)', 'generation-v1', next);
    return next;
  }
  function checkedSlots(requested: readonly string[]) {
    if (requested.length > NATIVE_HISTORY_MAX_RECORDS * 2 + NATIVE_RECORD_SLOTS.length || new Set(requested).size !== requested.length) throw new LocalDataError('storage-capacity', 'The requested record batch is too large or contains duplicate records.');
    requested.forEach(assertSlot);
    return [...requested];
  }
  async function historySlots(db: NativeRecordSql): Promise<string[]> {
    // Existing tombstones need no second retirement. Orphan chunks are included
    // so an explicit clear cannot leave a damaged prior generation behind.
    const rows = await db.getAllAsync<{ slot: string }>(`SELECT slot FROM training_records WHERE slot LIKE ? AND deleted != 1
      UNION SELECT slot FROM training_chunks WHERE slot LIKE ? ORDER BY slot LIMIT ?`, NATIVE_HISTORY_PREFIX + '%', NATIVE_HISTORY_PREFIX + '%', NATIVE_HISTORY_MAX_RECORDS + 1);
    if (rows.length > NATIVE_HISTORY_MAX_RECORDS) throw new LocalDataError('storage-capacity', 'This device has more history records than this app version can open. Keep a copy before resetting.');
    rows.forEach(row => {if (!isHistorySlot(row.slot)) throw damaged();});
    return rows.map(row => row.slot);
  }
  async function readBatch(db: NativeRecordSql, requested: readonly string[], allowLegacy: boolean): Promise<NativeRecordSnapshot> {
    const records: Record<string, string | null> = {}, present: Record<string, boolean> = {};
    for (const slot of requested) {
      const record = await read(db, slot);
      present[slot] = record.present;
      records[slot] = record.present || isHistorySlot(slot) || !allowLegacy ? record.value : await deps.legacy.getItem(slot);
    }
    return {records, present, revision: await revision(db)};
  }
  async function batchSnapshot(requested: readonly string[], allowLegacy = true) {
    const db = await open(); let result!: NativeRecordSnapshot;
    await db.withExclusiveTransactionAsync(async tx => {result = await readBatch(tx, requested, allowLegacy);});
    return result;
  }
  async function writeRecord(tx: NativeRecordSql, slot: string, value: string | null) {
    await tx.runAsync('DELETE FROM training_chunks WHERE slot = ?', slot);
    if (value === null) {
      await tx.runAsync('INSERT OR REPLACE INTO training_records (slot, deleted, chars, chunks, hash) VALUES (?, 1, 0, 0, ?)', slot, '');
      return;
    }
    const count = Math.ceil(value.length / NATIVE_RECORD_CHUNK_CHARS);
    for (let i = 0; i < count; i++) {
      const chunk = value.slice(i * NATIVE_RECORD_CHUNK_CHARS, (i + 1) * NATIVE_RECORD_CHUNK_CHARS);
      await tx.runAsync('INSERT INTO training_chunks (slot, ordinal, value, hash) VALUES (?, ?, ?, ?)', slot, i, chunk, digest(chunk));
    }
    await tx.runAsync('INSERT OR REPLACE INTO training_records (slot, deleted, chars, chunks, hash) VALUES (?, 0, ?, ?, ?)', slot, value.length, count, digest(value));
  }
  const ownedLegacy = (slot: string) => (NATIVE_RECORD_SLOTS as readonly string[]).includes(slot);
  function legacyFingerprint(raw: string): string | null {
    if (raw.length > NATIVE_RECORD_MAX_CHARS) return null;
    // Domain-separated, lossless UTF-16 code units: UTF-8 would replace distinct
    // lone surrogates with the same byte sequence and could match changed text.
    // Additional hashing memory stays at 256 KiB, including malformed Unicode.
    const hash = sha256.create();
    try {
      hash.update(utf8ToBytes('movefield-legacy-utf16le-v1\0'));
      for (let start = 0; start < raw.length; start += NATIVE_RECORD_CHUNK_CHARS) {
        const end = Math.min(start + NATIVE_RECORD_CHUNK_CHARS, raw.length), bytes = new Uint8Array((end - start) * 2);
        for (let index = start; index < end; index++) {
          const unit = raw.charCodeAt(index), offset = (index - start) * 2;
          bytes[offset] = unit & 0xff; bytes[offset + 1] = unit >>> 8;
        }
        try {hash.update(bytes);} finally {bytes.fill(0);}
      }
      return bytesToHex(hash.digest());
    } finally { hash.destroy(); }
  }
  async function capturedLegacy(slot: string): Promise<LegacyCapture | undefined> {
    if (!ownedLegacy(slot)) return undefined;
    try {
      const raw = await deps.legacy.getItem(slot);
      if (raw === null) return {missing: true, hash: null, chars: null};
      if (typeof raw !== 'string') return {missing: false, hash: null, chars: null};
      const hash = legacyFingerprint(raw);
      return {missing: false, hash, chars: hash === null ? null : raw.length};
    } catch { return {missing: false, hash: null, chars: null}; }
  }
  async function queueLegacyCleanup(tx: NativeRecordSql, slot: string, capture: LegacyCapture | undefined) {
    if (!capture || capture.missing) return;
    // Never adopt a changed value by overwriting the oldest outstanding receipt.
    const previous = await tx.getFirstAsync<CleanupRow>('SELECT slot, expected_hash, chars FROM training_legacy_cleanup WHERE slot = ?', slot);
    if (previous) return;
    const installed = await tx.getFirstAsync<Manifest>('SELECT deleted, chars, chunks, hash FROM training_records WHERE slot = ?', slot);
    // A historical SQL generation without a receipt gives no proof that the
    // legacy value is its validated source. Keep it as untracked (null fields).
    await tx.runAsync('INSERT INTO training_legacy_cleanup (slot, expected_hash, chars) VALUES (?, ?, ?)',
      slot, installed ? null : capture.hash, installed ? null : capture.chars);
  }
  async function cleanupRows(db: NativeRecordSql): Promise<CleanupRow[]> {
    const rows = await db.getAllAsync<CleanupRow>('SELECT slot, expected_hash, chars FROM training_legacy_cleanup ORDER BY slot LIMIT 4');
    if (rows.length > NATIVE_RECORD_SLOTS.length || rows.some(row => !row || !ownedLegacy(row.slot)
      || !(row.expected_hash === null && row.chars === null || typeof row.expected_hash === 'string'
        && /^[0-9a-f]{64}$/.test(row.expected_hash) && Number.isSafeInteger(row.chars)
        && row.chars! >= 0 && row.chars! <= NATIVE_RECORD_MAX_CHARS))) throw Error('Legacy cleanup metadata unavailable');
    return rows;
  }
  async function privacyStatus(): Promise<NativePrivacyStatus> {
    try {
      const db = await open(), rows = new Map((await cleanupRows(db)).map(row => [row.slot, row]));
      let pending = 0, preserved = 0, unreadable = 0;
      for (const slot of NATIVE_RECORD_SLOTS) {
        const capture = await capturedLegacy(slot);
        if (capture?.missing) continue;
        if (!capture?.hash) {unreadable++; continue;}
        const row = rows.get(slot);
        if (row?.expected_hash === capture.hash && row.chars === capture.chars) pending++;
        else preserved++;
      }
      return {state: preserved || unreadable ? 'attention' : pending ? 'pending' : 'clear', pending, preserved, unreadable};
    } catch { return {state: 'unavailable', pending: 0, preserved: 0, unreadable: 0}; }
  }
  async function retireLegacy(verified: Record<string, string | null>): Promise<void> {
    // The caller supplies the exact SQL values that storage has authenticated or
    // explicitly retired. Status/DB open/raw recovery never authorize deletion.
    // The application lifecycle serializes this compare-before-delete; separate
    // OS processes or unsupported legacy writers are not an atomic CAS protocol.
    try {
      const db = await open(), rows = await cleanupRows(db);
      for (const row of rows) {
        if (!Object.prototype.hasOwnProperty.call(verified, row.slot)) continue;
        const installed = await snapshot(row.slot);
        if (!installed.present || installed.value !== verified[row.slot]) continue;
        const capture = await capturedLegacy(row.slot);
        if (!capture) continue;
        if (!capture.missing) {
          if (!row.expected_hash || capture.hash !== row.expected_hash || capture.chars !== row.chars) continue;
          try { await deps.legacy.removeItem(row.slot); } catch { continue; }
          if (!(await capturedLegacy(row.slot))?.missing) continue;
        }
        // Cleanup-only transactions do not invalidate training's revision/CAS.
        await db.runAsync('DELETE FROM training_legacy_cleanup WHERE slot = ? AND expected_hash IS ? AND chars IS ?',
          row.slot, row.expected_hash, row.chars);
      }
    } catch { /* Durable SQL acknowledgement is separate from privacy cleanup. */ }
  }
  return {
    getItem(slot: string): Promise<string | null> {
      assertSlot(slot);
      return enqueue(async () => {
        const record = await snapshot(slot);
        // Never fall back on corruption/decryption failure. Legacy plaintext is
        // returned untouched so storage.ts can validate and encrypt it first.
        return record.present || isHistorySlot(slot) ? record.value : deps.legacy.getItem(slot);
      });
    },
    hasRecord(slot: string): Promise<boolean> {
      assertSlot(slot); return enqueue(async () => (await snapshot(slot)).present);
    },
    setItem(slot: string, value: string): Promise<void> {
      assertSlot(slot); assertEncrypted(slot, value);
      return enqueue(async () => {
        const db = await open(), before = await capturedLegacy(slot);
        await db.withExclusiveTransactionAsync(async tx => {
          await queueLegacyCleanup(tx, slot, before);
          await writeRecord(tx, slot, value);
          if ((await read(tx, slot)).value !== value) throw damaged();
          await advance(tx);
        });
        // Acknowledge persistence only after a separate committed readback. An
        // ambiguous failure retains the legacy copy and is surfaced to the UI.
        if ((await snapshot(slot)).value !== value) throw damaged();
        await retireLegacy({[slot]: value});
      });
    },
    removeItem(slot: string): Promise<void> { return this.multiRemove([slot]); },
    multiRemove(slots: string[]): Promise<void> {
      slots.forEach(assertSlot);
      return enqueue(async () => {
        const db = await open(), before = Object.fromEntries(await Promise.all(slots.map(async slot => [slot, await capturedLegacy(slot)])));
        await db.withExclusiveTransactionAsync(async tx => {
          for (const slot of slots) {
            await queueLegacyCleanup(tx, slot, before[slot]);
            await writeRecord(tx, slot, null);
          }
          await advance(tx);
        });
        for (const slot of slots) if ((await snapshot(slot)).value !== null) throw damaged();
        await retireLegacy(Object.fromEntries(slots.map(slot => [slot, null])));
      });
    },
    snapshotRecords(requested: readonly string[]): Promise<NativeRecordSnapshot> {
      const slots = checkedSlots(requested); return enqueue(() => batchSnapshot(slots));
    },
    listHistorySlots(): Promise<string[]> {
      return enqueue(async () => {const db = await open(); let result!: string[]; await db.withExclusiveTransactionAsync(async tx => {result = await historySlots(tx);}); return result;});
    },
    legacyCleanupStatus(): Promise<NativePrivacyStatus> { return enqueue(privacyStatus); },
    retryLegacyCleanup(verified: Record<string, string | null>): Promise<NativePrivacyStatus> {
      const detached = {...verified};
      Object.keys(detached).forEach(slot => {if (!ownedLegacy(slot)) throw new LocalDataError('unknown-format', 'Unexpected legacy cleanup slot.');});
      return enqueue(async () => {await retireLegacy(detached); return privacyStatus();});
    },
    commitRecords(input: NativeRecordCommit): Promise<NativeRecordSnapshot> {
      // Detach validated arguments before enqueueing. A caller changing its
      // mutable map later cannot bypass encryption checks or change a CAS guard.
      const records = {...input.records}, expected = {...input.expected}, expectedRevision = input.expectedRevision, clearHistory = input.clearHistory;
      const patchSlots = checkedSlots(Object.keys(records)), expectedSlots = checkedSlots(Object.keys(expected));
      if (expectedRevision !== undefined && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)) throw new LocalDataError('unknown-format', 'Unexpected saved-record revision.');
      if (clearHistory && (!Object.prototype.hasOwnProperty.call(records, NATIVE_RECORD_SLOTS[0]) || expectedRevision === undefined && !Object.prototype.hasOwnProperty.call(expected, NATIVE_RECORD_SLOTS[0]))) throw new LocalDataError('unknown-format', 'Clearing history requires an expected main profile or saved-record revision.');
      for (const slot of patchSlots) if (records[slot] !== null) assertEncrypted(slot, records[slot]!);
      for (const slot of expectedSlots) if (expected[slot] !== null && typeof expected[slot] !== 'string') throw new LocalDataError('unknown-format', 'Unexpected saved-record comparison.');
      const conflict = () => new LocalDataError('unknown-format', 'Saved records changed in another app session. Nothing was replaced. Reopen the saved profile before editing.');
      return enqueue(async () => {
        const db = await open(); let written!: NativeRecordSnapshot;
        const before = Object.fromEntries(await Promise.all(patchSlots.map(async slot => [slot, await capturedLegacy(slot)])));
        await db.withExclusiveTransactionAsync(async tx => {
          const current = await readBatch(tx, expectedSlots, true);
          if (expectedRevision !== undefined && current.revision !== expectedRevision || expectedSlots.some(slot => current.records[slot] !== expected[slot])) throw conflict();
          const patch = {...records};
          if (clearHistory) for (const slot of await historySlots(tx)) if (!Object.prototype.hasOwnProperty.call(patch, slot)) patch[slot] = null;
          // Every new dynamic entity must have an expected state, except a fresh
          // replacement generation whose global anchor/revision is already held.
          if (!clearHistory && patchSlots.some(slot => !Object.prototype.hasOwnProperty.call(expected, slot))) throw new LocalDataError('unknown-format', 'A record batch is missing an expected saved value.');
          for (const [slot, value] of Object.entries(patch)) {
            await queueLegacyCleanup(tx, slot, before[slot]);
            await writeRecord(tx, slot, value);
          }
          for (const slot of expectedSlots) if (!current.present[slot] && !isHistorySlot(slot) && await deps.legacy.getItem(slot) !== expected[slot]) throw conflict();
          await advance(tx);
          written = await readBatch(tx, Object.keys(patch), false);
          if (Object.entries(patch).some(([slot, value]) => !written.present[slot] || written.records[slot] !== value)) throw damaged();
        });
        const verified = await batchSnapshot(Object.keys(written.records), false);
        if (verified.revision !== written.revision || Object.keys(written.records).some(slot => !verified.present[slot] || verified.records[slot] !== written.records[slot])) throw damaged();
        await retireLegacy(verified.records);
        return verified;
      });
    },
  };
}
