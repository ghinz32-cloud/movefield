const assert = require('node:assert/strict');
const path = require('node:path');
const {createHash, randomBytes} = require('node:crypto');
const {DatabaseSync} = require('node:sqlite');
const {createSqliteHarness} = require('./lib/native-sqlite.cjs');
const {createSourceLoader} = require('./lib/native-source-loader.cjs');
const repo = path.resolve(__dirname, '..');
const loader = createSourceLoader(repo);
const N = loader.load(path.join(repo, 'mobile/src/native-record-store.ts'));
const C = loader.load(path.join(repo, 'mobile/src/local-crypto.ts'));
const P = loader.load(path.join(repo, 'mobile/src/native-sqlite-policy.ts'));
const KEY = N.NATIVE_RECORD_SLOTS[0];
const cipher = text => C.sealText(text, C.keyFromHex('ab'.repeat(32)), KEY, n => new Uint8Array(randomBytes(n)));
const hash = value => createHash('sha256').update(value).digest('hex');
let scenarios = 0;
const evidence = [];
async function scenario(name, job) { await job(); scenarios++; evidence.push(name); console.log('PASS ' + name); }
function seed(h, raw) {
  // Representative pre-mitigation WAL database, including its original opaque
  // cipher envelope. Production migration performs no ciphertext rewrite.
  h.native.exec(`CREATE TABLE training_records (slot TEXT PRIMARY KEY NOT NULL, deleted INTEGER NOT NULL, chars INTEGER NOT NULL, chunks INTEGER NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE training_chunks (slot TEXT NOT NULL, ordinal INTEGER NOT NULL, value TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (slot, ordinal));`);
  h.native.prepare('INSERT INTO training_records VALUES (?, 0, ?, 1, ?)').run(KEY, raw.length, hash(raw));
  h.native.prepare('INSERT INTO training_chunks VALUES (?, 0, ?, ?)').run(KEY, raw, hash(raw));
}
const rows = h => ({records: h.native.prepare('SELECT * FROM training_records').all(), chunks: h.native.prepare('SELECT * FROM training_chunks').all()});
function recordStore(h, legacy = new Map()) {
  return N.createNativeRecordStore({open: async () => h.db, legacy: {
    getItem: async slot => legacy.get(slot) ?? null,
    removeItem: async slot => {legacy.delete(slot);},
  }});
}
const refused = promise => assert.rejects(promise, error => error instanceof C.LocalDataError && error.code === 'storage-unavailable');

(async () => {
  await scenario('Existing real WAL ciphertext migrates to DELETE without row, envelope or key changes; fresh store reads it', async () => {
    const h = createSqliteHarness(), raw = cipher('Preserved encrypted training 漢字');
    try {
      seed(h, raw); const before = rows(h);
      assert.equal(h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
      assert.equal(await recordStore(h).getItem(KEY), raw);
      assert.deepEqual(rows(h), before);
      assert.equal(h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'delete');
      assert.equal(h.native.prepare('PRAGMA synchronous').get().synchronous, 3);
      assert.equal(await recordStore(h).getItem(KEY), raw);
      assert.equal(C.openText(raw, C.keyFromHex('ab'.repeat(32)), KEY), 'Preserved encrypted training 漢字');
      assert.ok(h.controller.calls.filter(call => call.scope === 'transaction').every(call => !/PRAGMA.*=/.test(call.sql)), 'No transaction attempts to set journal/synchronous mode');
    } finally {h.close();}
  });
  await scenario('Real locked WAL conversion rejects before schema/application writes; original ciphertext and legacy stay readable after retry', async () => {
    const h = createSqliteHarness(), raw = cipher('Locked original'), legacy = new Map([[KEY, raw]]);
    let blocker;
    try {
      seed(h, raw); const before = rows(h), schemaBefore = h.native.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      blocker = new DatabaseSync(h.filename); blocker.exec('BEGIN IMMEDIATE');
      const store = recordStore(h, legacy);
      await refused(store.setItem(KEY, cipher('Rejected new generation')));
      assert.deepEqual(rows(h), before); assert.equal(legacy.get(KEY), raw);
      assert.deepEqual(h.native.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all(), schemaBefore);
      assert.equal(h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
      blocker.exec('ROLLBACK'); blocker.close(); blocker = null;
      assert.equal(await store.getItem(KEY), raw, 'Failed initialization is retriable');
      assert.deepEqual(rows(h), before);
    } finally {if (blocker) {blocker.exec('ROLLBACK'); blocker.close();} h.close();}
  });
  await scenario('Returned non-DELETE, absent and malformed conversion results fail closed before schema SQL', async () => {
    for (const result of [{journal_mode: 'wal'}, {journal_mode: 'memory'}, {journal_mode: 'DELETE'}, null, {}, {journal_mode: 3}]) {
      const h = createSqliteHarness(), raw = cipher('Unchanged refusal');
      try {
        seed(h, raw); const before = rows(h);
        const db = {...h.db, getFirstAsync: async (sql, ...args) => sql === 'PRAGMA journal_mode = DELETE' ? result : h.db.getFirstAsync(sql, ...args)};
        const store = N.createNativeRecordStore({open: async () => db, legacy: {getItem: async () => raw, removeItem: async () => {throw Error('Cleanup must not run');}}});
        await refused(store.setItem(KEY, cipher('Refused')));
        assert.deepEqual(rows(h), before); assert.equal(h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
        assert.equal(h.controller.calls.filter(call => call.method === 'runAsync' || call.method === 'execAsync').length, 0);
      } finally {h.close();}
    }
  });
  await scenario('Base mode readback failure preserves data and rejects before schema/application writes', async () => {
    for (const result of [null, {}, {synchronous: 2}, {synchronous: '3'}]) {
      const h = createSqliteHarness(), raw = cipher('Original mode failure');
      try {
        seed(h, raw); const before = rows(h);
        h.controller.mutateRead = call => call.sql === 'PRAGMA synchronous' ? result : call.value;
        await refused(recordStore(h).setItem(KEY, cipher('Not acknowledged')));
        assert.deepEqual(rows(h), before);
        assert.ok(!h.controller.calls.some(call => call.method === 'runAsync' || /CREATE TABLE/.test(call.sql)));
      } finally {h.close();}
    }
  });
  await scenario('Fresh real SQLite default2 connection is refused despite base3; ciphertext, legacy and revision are unchanged', async () => {
    const h = createSqliteHarness(), raw = cipher('Previous committed record'), legacy = new Map([[KEY, raw]]);
    try {
      seed(h, raw); const store = recordStore(h, legacy); assert.equal(await store.getItem(KEY), raw);
      const before = rows(h), revisionBefore = h.native.prepare('SELECT * FROM training_record_metadata').all();
      const unmodified = new DatabaseSync(h.filename);
      try {assert.equal(unmodified.prepare('PRAGMA synchronous').get().synchronous, 2, 'Real host connection starts at compile default2');}
      finally {unmodified.close();}
      h.controller.calls = []; h.controller.transactionSynchronous = null; // Real host compile default, with no harness PRAGMA override.
      await refused(store.setItem(KEY, cipher('Must not commit')));
      assert.equal(h.native.prepare('PRAGMA synchronous').get().synchronous, 3);
      assert.deepEqual(rows(h), before); assert.equal(legacy.get(KEY), raw);
      assert.deepEqual(h.native.prepare('SELECT * FROM training_record_metadata').all(), revisionBefore);
      assert.deepEqual(h.controller.calls.filter(call => call.scope === 'transaction').map(call => call.sql), ['BEGIN EXCLUSIVE', 'PRAGMA journal_mode', 'PRAGMA synchronous']);
      h.controller.transactionSynchronous = 3;
      const next = cipher('Qualified connection commit'); await store.setItem(KEY, next);
      assert.equal(await recordStore(h).getItem(KEY), next); assert.equal(legacy.get(KEY), raw, 'Untracked old legacy shadow remains preserved by existing cleanup policy');
    } finally {h.close();}
  });
  await scenario('Fresh transaction non-DELETE/malformed mode refuses application SQL and leaves original generation', async () => {
    for (const result of [{journal_mode: 'wal'}, null, {}]) {
      const h = createSqliteHarness(), raw = cipher('Original transaction journal');
      try {
        seed(h, raw); const store = recordStore(h); await store.getItem(KEY); const before = rows(h);
        h.controller.calls = [];
        h.controller.mutateRead = call => call.scope === 'transaction' && call.sql === 'PRAGMA journal_mode' ? result : call.value;
        await refused(store.setItem(KEY, cipher('Refused transaction')));
        assert.deepEqual(rows(h), before);
        assert.ok(h.controller.calls.filter(call => call.scope === 'transaction').every(call => call.method === 'begin' || call.sql.startsWith('PRAGMA')));
      } finally {h.close();}
    }
  });
  await scenario('Mode assertions are read-only within a real begun transaction and rollback callback failure', async () => {
    const h = createSqliteHarness();
    try {
      await P.prepareNativeSqlite(h.db, () => Error('Refused')); h.native.exec('CREATE TABLE proof(value TEXT); INSERT INTO proof VALUES (\'old\')');
      await assert.rejects(h.db.withExclusiveTransactionAsync(async tx => {
        await P.assertNativeSqliteModes(tx, () => Error('Refused'));
        await tx.runAsync('UPDATE proof SET value=?', 'uncommitted'); throw Error('Interrupted callback');
      }));
      assert.equal(h.native.prepare('SELECT value FROM proof').get().value, 'old');
      await h.db.withExclusiveTransactionAsync(async tx => {await P.assertNativeSqliteModes(tx, () => Error('Refused')); await tx.runAsync('UPDATE proof SET value=?', 'committed');});
      const reopened = new DatabaseSync(h.filename);
      try {assert.equal(reopened.prepare('SELECT value FROM proof').get().value, 'committed');} finally {reopened.close();}
      assert.ok(h.controller.calls.filter(call => call.scope === 'transaction').every(call => !/PRAGMA.*=/.test(call.sql)));
    } finally {h.close();}
  });
  console.log(JSON.stringify({status: 'passed', scenarios, evidence,
    limits: 'Real host node:sqlite file/locking/rollback checks; native compile default3 is modeled in the transaction harness. No actual corruption reproduction, power-cut, Expo Go, Android/iOS device or store qualification.'}, null, 2));
})().catch(error => {console.error(error); process.exitCode = 1;});
