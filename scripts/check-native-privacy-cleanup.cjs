const assert = require('node:assert/strict');
const path = require('node:path');
const {randomBytes, createHash} = require('node:crypto');
const {createSqliteHarness} = require('./lib/native-sqlite.cjs');
const {createSourceLoader} = require('./lib/native-source-loader.cjs');
const repo = process.argv[2] || path.resolve(__dirname, '..');
const KEY = 'training-studio:mobile-local-demo:v1', SETUP = 'training-studio:mobile-setup:v1', JOURNAL = 'training-studio:mobile-restore:v1';
const DATA_KEY = 'movefield.dataKey.v1';
const loader = createSourceLoader(repo), R = loader.load(path.join(repo, 'mobile/src/native-record-store.ts'));
const C = loader.load(path.join(repo, 'mobile/src/local-crypto.ts')), T = loader.load(path.join(repo, 'mobile/src/shared/training.ts'));
const base = JSON.parse(JSON.stringify(T.initialState()));
const clear = {state: 'clear', pending: 0, preserved: 0, unreadable: 0};
let checks = 0;
const evidence = [];
function seal(value, slot = KEY) {return C.sealText(value, C.keyFromHex('ab'.repeat(32)), slot, n => new Uint8Array(randomBytes(n)));}
function fingerprint(value) {return createHash('sha256').update('movefield-legacy-utf16le-v1\0', 'utf8').update(Buffer.from(value, 'utf16le')).digest('hex');}
function environment(initial = {}) {
  const h = createSqliteHarness(), values = new Map(Object.entries(initial)), keys = new Map();
  const faults = {denyRemove: false, denyRead: false, noOpRemove: false}, removals = [];
  const legacy = {
    getItem: async slot => {if (faults.denyRead === true || faults.denyRead instanceof Set && faults.denyRead.has(slot)) throw Error('Legacy read denied'); return values.get(slot) ?? null;},
    removeItem: async slot => {removals.push(slot); if (faults.denyRemove) throw Error('Legacy removal denied'); if (!faults.noOpRemove) values.delete(slot);},
  };
  const records = () => R.createNativeRecordStore({open: async () => h.db, legacy});
  const secure = {AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
    getItemAsync: async key => keys.get(key) ?? null,
    setItemAsync: async (key, value) => {keys.set(key, value);},
    deleteItemAsync: async key => {keys.delete(key);},
  };
  function storage() {
    const recordStore = records(), source = createSourceLoader(repo, {
      './native-database': {nativeRecords: recordStore}, 'expo-secure-store': secure,
      'expo-crypto': {getRandomBytes: n => new Uint8Array(randomBytes(n))},
    });
    return {api: source.load(path.join(repo, 'mobile/src/storage.ts')), records: recordStore};
  }
  const rows = () => h.native.prepare('SELECT slot, expected_hash, chars FROM training_legacy_cleanup ORDER BY slot').all().map(row => ({...row}));
  return {h, values, keys, faults, removals, records, storage, rows, close: h.close};
}
async function scenario(name, test) {await test(); checks++; evidence.push(name); console.log('PASS ' + name);}
function noPlaintext(e, marker) {
  const sql = e.h.native.prepare('SELECT value FROM training_chunks').all().map(row => row.value).join('');
  assert.ok(!sql.includes(marker));
  assert.ok(!JSON.stringify(e.rows()).includes(marker));
  for (const value of e.keys.values()) if (/^[0-9a-f]{64}$/.test(value)) assert.ok(!sql.includes(value));
}
(async () => {
  await scenario('Validated plaintext migration acknowledges encrypted persistence while denied cleanup is durably pending after reopen', async () => {
    const state = {...base, profile: {...base.profile, name: 'Private legacy marker'}}, raw = JSON.stringify(state), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true;
      assert.equal((await e.storage().api.readLocalState()).profile.name, state.profile.name);
      assert.deepEqual(e.rows(), [{slot: KEY, expected_hash: fingerprint(raw), chars: raw.length}]);
      assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), {state: 'pending', pending: 1, preserved: 0, unreadable: 0});
      assert.equal((await e.storage().api.readLocalState()).profile.name, state.profile.name);
      assert.equal(e.values.get(KEY), raw);
      noPlaintext(e, state.profile.name);
    } finally {e.close();}
  });
  await scenario('Read-only status and raw recovery retain matching copies; authenticated reopened read retires them without changing revision', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true;
      await e.storage().api.readLocalState();
      const before = (await e.records().snapshotRecords([KEY])).revision;
      e.faults.denyRemove = false; e.removals.length = 0;
      await e.storage().api.readLocalPrivacyStatus();
      assert.ok(await e.storage().api.readLocalRaw());
      assert.deepEqual(e.removals, []); assert.equal(e.values.get(KEY), raw);
      assert.deepEqual(await e.storage().api.readLocalState(), base);
      assert.equal(e.values.has(KEY), false); assert.deepEqual(e.rows(), []);
      assert.equal((await e.records().snapshotRecords([KEY])).revision, before);
      assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), clear);
    } finally {e.close();}
  });
  await scenario('Explicit retry authenticates stored records and retires the exact receipted value', async () => {
    const e = environment({[KEY]: JSON.stringify(base)});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      e.faults.denyRemove = false;
      assert.deepEqual(await e.storage().api.retryLocalPrivacyCleanup(), clear);
      assert.equal(e.values.has(KEY), false); assert.deepEqual(e.rows(), []);
    } finally {e.close();}
  });
  await scenario('Changed legacy copies are preserved and subsequent saves never replace the oldest cleanup fingerprint', async () => {
    const raw = JSON.stringify(base), changed = JSON.stringify({...base, profile: {...base.profile, name: 'Changed old copy'}}), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      const receipt = e.rows(); e.values.set(KEY, changed); e.faults.denyRemove = false;
      const api = e.storage().api;
      assert.deepEqual(await api.readLocalState(), base);
      await api.saveLocalState({...base, profile: {...base.profile, name: 'New authoritative state'}});
      assert.deepEqual(e.rows(), receipt); assert.equal(e.values.get(KEY), changed);
      assert.deepEqual(await e.storage().api.retryLocalPrivacyCleanup(), {state: 'attention', pending: 0, preserved: 1, unreadable: 0});
      assert.equal((await e.storage().api.readLocalState()).profile.name, 'New authoritative state');
      assert.equal(e.values.get(KEY), changed);
    } finally {e.close();}
  });
  await scenario('Different literal lone UTF-16 surrogates in valid legacy JSON never match the captured copy', async () => {
    const raw = JSON.stringify({...base, profile: {...base.profile, name: 'Lone surrogate \ud800'}}).replace('\\ud800', '\ud800');
    const changed = raw.replace('\ud800', '\ud801'), e = environment({[KEY]: raw});
    try {
      assert.notEqual(raw, changed); assert.equal(raw.length, changed.length);
      assert.equal(createHash('sha256').update(raw, 'utf8').digest('hex'), createHash('sha256').update(changed, 'utf8').digest('hex'));
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      assert.equal(e.rows()[0].expected_hash, fingerprint(raw)); assert.notEqual(fingerprint(raw), fingerprint(changed));
      e.values.set(KEY, changed); e.faults.denyRemove = false; e.removals.length = 0;
      assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).preserved, 1);
      assert.equal(e.values.get(KEY), changed); assert.deepEqual(e.removals, []);
      assert.equal((await e.storage().api.readLocalState()).profile.name, 'Lone surrogate \ud800');
      assert.equal(e.values.get(KEY), changed);
    } finally {e.close();}
  });
  await scenario('Untracked historical copies are reported but never adopted by a later successful save or retry', async () => {
    const raw = JSON.stringify(base), e = environment();
    try {
      await e.storage().api.saveLocalState(base);
      e.values.set(KEY, raw);
      assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), {state: 'attention', pending: 0, preserved: 1, unreadable: 0});
      const api = e.storage().api; await api.readLocalState();
      await api.saveLocalState({...base, profile: {...base.profile, name: 'Updated SQL'}});
      assert.deepEqual(e.rows(), [{slot: KEY, expected_hash: null, chars: null}]);
      assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).preserved, 1);
      assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
    } finally {e.close();}
  });
  await scenario('Unreadable legacy storage cannot fail a valid SQL read/save or supply a cleanup fingerprint', async () => {
    const e = environment();
    try {
      await e.storage().api.saveLocalState(base); e.values.set(KEY, 'Unreadable old copy'); e.faults.denyRead = new Set([KEY]);
      assert.deepEqual(await e.storage().api.readLocalState(), base);
      const api = e.storage().api; await api.readLocalState(); await api.saveLocalState(base);
      const status = await e.storage().api.readLocalPrivacyStatus();
      assert.equal(status.state, 'attention'); assert.equal(status.unreadable, 1);
      assert.deepEqual(e.rows(), [{slot: KEY, expected_hash: null, chars: null}]);
      assert.deepEqual(e.removals, []); assert.equal(e.values.get(KEY), 'Unreadable old copy');
    } finally {e.close();}
  });
  await scenario('Every first-migration SQL write and precommit fault rolls back the cleanup receipt with the generation', async () => {
    const raw = 'Private precommit source', sealed = seal('encrypted next'), discovery = environment({[KEY]: raw});
    let boundaries;
    try {
      discovery.faults.denyRemove = true; await discovery.records().setItem(KEY, sealed);
      boundaries = discovery.h.controller.calls.filter(c => c.scope === 'transaction' && (c.method === 'runAsync' || c.method === 'commit'));
      boundaries = boundaries.slice(0, boundaries.findIndex(c => c.method === 'commit') + 1);
    } finally {discovery.close();}
    assert.ok(boundaries.some(c => c.sql.includes('INSERT INTO training_legacy_cleanup')));
    for (let fault = 0; fault < boundaries.length; fault++) {
      const e = environment({[KEY]: raw});
      try {
        let position = -1;
        e.h.controller.fail = c => c.scope === 'transaction' && (c.method === 'runAsync' || c.method === 'commit') && ++position === fault;
        await assert.rejects(e.records().setItem(KEY, sealed)); e.h.controller.fail = null;
        assert.equal(await e.records().getItem(KEY), raw); assert.deepEqual(e.rows(), []);
        assert.equal(e.h.native.prepare('SELECT COUNT(*) n FROM training_records').get().n, 0);
        assert.deepEqual(e.removals, []);
      } finally {e.close();}
    }
  });
  await scenario('Postcommit readback ambiguity preserves original plaintext and journal until a fresh authenticated read', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      let writing = false, installed = false;
      e.h.controller.fail = c => {
        if (c.method === 'runAsync' && c.sql.startsWith('INSERT OR REPLACE INTO training_records')) writing = true;
        if (c.scope === 'transaction' && c.method === 'commit' && writing) {installed = true; writing = false;}
        return installed && c.method === 'getFirstAsync';
      };
      await assert.rejects(e.storage().api.readLocalState()); e.h.controller.fail = null;
      assert.equal(e.values.get(KEY), raw); assert.equal(e.rows()[0].expected_hash, fingerprint(raw));
      await e.storage().api.readLocalRaw(); await e.storage().api.readLocalPrivacyStatus(); assert.equal(e.values.get(KEY), raw);
      assert.deepEqual(await e.storage().api.readLocalState(), base); assert.equal(e.values.has(KEY), false);
    } finally {e.close();}
  });
  await scenario('Missing keys preserve matching pending copies; raw recovery and explicit retry cannot authorize deletion', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      e.faults.denyRemove = false; e.keys.delete(DATA_KEY); e.removals.length = 0;
      await assert.rejects(e.storage().api.readLocalState(), error => error.code === 'key-missing');
      assert.ok(await e.storage().api.readLocalRaw());
      const status = await e.storage().api.retryLocalPrivacyCleanup();
      assert.equal(status.state, 'attention'); assert.equal(status.pending, 1); assert.equal(status.unreadable, 1);
      assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
    } finally {e.close();}
  });
  await scenario('Ciphertext with valid SQL integrity but failed authentication preserves matching legacy plaintext', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      const old = await e.records().getItem(KEY), envelope = JSON.parse(old);
      envelope.data = (envelope.data.startsWith('00') ? '01' : '00') + envelope.data.slice(2);
      await e.records().setItem(KEY, JSON.stringify(envelope));
      e.faults.denyRemove = false; e.removals.length = 0;
      await assert.rejects(e.storage().api.readLocalState(), error => error.code === 'decrypt-failed');
      assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).state, 'attention');
      assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
    } finally {e.close();}
  });
  await scenario('Corrupted SQL tombstone is never treated as reset proof and cannot retire a retained copy', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState(); await e.storage().api.resetLocalState();
      e.h.native.prepare('UPDATE training_records SET chars=1 WHERE slot=?').run(KEY);
      e.faults.denyRemove = false; e.removals.length = 0;
      await assert.rejects(e.storage().api.readLocalState(), error => error.code === 'decrypt-failed');
      assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).state, 'attention');
      assert.equal(e.values.get(KEY), raw); assert.ok(!e.removals.includes(KEY));
    } finally {e.close();}
  });
  await scenario('Successful but ineffective legacy removal remains pending across restart', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.noOpRemove = true; assert.deepEqual(await e.storage().api.readLocalState(), base);
      assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).state, 'pending');
      assert.equal(e.values.get(KEY), raw); assert.equal(e.rows().length, 1);
    } finally {e.close();}
  });
  await scenario('Failed cleanup-metadata retirement never reverses durable acknowledgement; missing legacy can be pruned on restart', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.h.controller.fail = c => c.method === 'runAsync' && c.sql.startsWith('DELETE FROM training_legacy_cleanup');
      assert.deepEqual(await e.storage().api.readLocalState(), base);
      assert.equal(e.values.has(KEY), false); assert.equal(e.rows().length, 1);
      assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), clear);
      e.h.controller.fail = null; assert.deepEqual(await e.storage().api.retryLocalPrivacyCleanup(), clear);
      assert.deepEqual(e.rows(), []);
    } finally {e.close();}
  });
  await scenario('Malformed cleanup metadata yields unavailable status without blocking encrypted reads or deleting legacy', async () => {
    for (const damage of ['bad-hash', 'partial-null', 'unknown-slot', 'too-many']) {
      const raw = JSON.stringify(base), e = environment({[KEY]: raw});
      try {
        e.faults.denyRemove = true; await e.storage().api.readLocalState();
        if (damage === 'bad-hash') e.h.native.exec("UPDATE training_legacy_cleanup SET expected_hash='broken'");
        if (damage === 'partial-null') e.h.native.exec('UPDATE training_legacy_cleanup SET chars=NULL');
        if (damage === 'unknown-slot') e.h.native.exec("INSERT INTO training_legacy_cleanup VALUES ('unrelated-preference',NULL,NULL)");
        if (damage === 'too-many') for (let i = 0; i < 4; i++) e.h.native.prepare('INSERT INTO training_legacy_cleanup VALUES (?,NULL,NULL)').run('extra-' + i);
        e.faults.denyRemove = false; e.removals.length = 0;
        assert.deepEqual(await e.storage().api.readLocalState(), base);
        assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), {state: 'unavailable', pending: 0, preserved: 0, unreadable: 0});
        assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).state, 'unavailable');
        assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
      } finally {e.close();}
    }
  });
  await scenario('Status inspection SQL failure cannot turn an acknowledged training save into a save error', async () => {
    const e = environment();
    try {
      e.h.controller.fail = c => c.method === 'getAllAsync' && c.sql.includes('FROM training_legacy_cleanup');
      await e.storage().api.saveLocalState(base);
      assert.deepEqual(await e.storage().api.readLocalState(), base);
      assert.equal((await e.storage().api.readLocalPrivacyStatus()).state, 'unavailable');
      e.h.controller.fail = null; assert.deepEqual(await e.storage().api.readLocalPrivacyStatus(), clear);
    } finally {e.close();}
  });
  await scenario('Bounded lossless fingerprint preserves Unicode code units across chunk boundaries and stores no plaintext', async () => {
    const raw = 'Private Unicode marker ' + 'a'.repeat(R.NATIVE_RECORD_CHUNK_CHARS - 24) + '😀漢字'.repeat(20), e = environment({[KEY]: raw});
    try {
      assert.equal(raw.charCodeAt(R.NATIVE_RECORD_CHUNK_CHARS - 1), 0xd83d);
      e.faults.denyRemove = true; await e.records().setItem(KEY, seal('accepted encrypted value'));
      assert.deepEqual(e.rows(), [{slot: KEY, expected_hash: fingerprint(raw), chars: raw.length}]);
      noPlaintext(e, 'Private Unicode marker');
    } finally {e.close();}
  });
  await scenario('Oversized old copies are preserved without a hash receipt or deletion, while new encrypted records remain usable', async () => {
    const raw = 'x'.repeat(R.NATIVE_RECORD_MAX_CHARS + 1), e = environment({[KEY]: raw});
    try {
      const encrypted = seal('bounded authoritative value'); await e.records().setItem(KEY, encrypted);
      assert.deepEqual(e.rows(), [{slot: KEY, expected_hash: null, chars: null}]);
      assert.equal(await e.records().getItem(KEY), encrypted);
      assert.deepEqual(await e.records().legacyCleanupStatus(), {state: 'attention', pending: 0, preserved: 0, unreadable: 1});
      assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
    } finally {e.close();}
  });
  await scenario('Exact SQL proof is rechecked before legacy deletion and unowned slots are refused', async () => {
    const raw = 'owned old copy', first = seal('first accepted value'), second = seal('second accepted value'), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.records().setItem(KEY, first); await e.records().setItem(KEY, second);
      e.faults.denyRemove = false; e.removals.length = 0;
      assert.equal((await e.records().retryLegacyCleanup({[KEY]: first})).state, 'pending');
      assert.equal(e.values.get(KEY), raw); assert.deepEqual(e.removals, []);
      assert.throws(() => e.records().retryLegacyCleanup({'unrelated-preference': null}), error => error.code === 'unknown-format');
      assert.deepEqual(await e.records().retryLegacyCleanup({[KEY]: second}), clear);
    } finally {e.close();}
  });
  await scenario('Reset retires current encrypted records and keys but honestly reports retained matching copies; retry later removes them', async () => {
    const raw = JSON.stringify(base), e = environment({[KEY]: raw});
    try {
      e.faults.denyRemove = true; await e.storage().api.readLocalState();
      assert.deepEqual(await e.storage().api.resetLocalState(), {state: 'pending', pending: 1, preserved: 0, unreadable: 0});
      assert.equal(e.keys.has(DATA_KEY), false); assert.equal(await e.storage().api.readLocalState(), null);
      assert.equal(e.values.get(KEY), raw); assert.equal(await e.records().hasRecord(KEY), true);
      e.faults.denyRemove = false; assert.deepEqual(await e.storage().api.retryLocalPrivacyCleanup(), clear);
      assert.equal(e.values.has(KEY), false); assert.equal(await e.storage().api.readLocalState(), null);
    } finally {e.close();}
  });
  await scenario('Reset preserves changed or untracked historical copies and reports attention instead of complete erasure', async () => {
    for (const tracked of [true, false]) {
      const raw = JSON.stringify(base), changed = 'A separately changed private old copy', e = environment(tracked ? {[KEY]: raw} : {});
      try {
        e.faults.denyRemove = true; if (tracked) await e.storage().api.readLocalState(); else await e.storage().api.saveLocalState(base);
        e.values.set(KEY, changed); e.faults.denyRemove = false;
        assert.deepEqual(await e.storage().api.resetLocalState(), {state: 'attention', pending: 0, preserved: 1, unreadable: 0});
        assert.equal(await e.storage().api.readLocalState(), null); assert.equal(e.keys.has(DATA_KEY), false);
        assert.equal((await e.storage().api.retryLocalPrivacyCleanup()).preserved, 1); assert.equal(e.values.get(KEY), changed);
      } finally {e.close();}
    }
  });
  await scenario('Setup migration uses the same durable receipt and explicit retry validates its encrypted draft', async () => {
    const draft = {schema: 1, basePlanId: base.plan.id, baseEvents: '[]', profile: base.profile, events: [], step: 2};
    const raw = JSON.stringify(draft), e = environment({[SETUP]: raw});
    try {
      e.faults.denyRemove = true; assert.deepEqual(await e.storage().api.readLocalSetup(), draft);
      assert.deepEqual(e.rows(), [{slot: SETUP, expected_hash: fingerprint(raw), chars: raw.length}]);
      assert.equal((await e.storage().api.readLocalPrivacyStatus()).pending, 1);
      e.faults.denyRemove = false; assert.deepEqual(await e.storage().api.retryLocalPrivacyCleanup(), clear);
      assert.equal(e.values.has(SETUP), false); assert.deepEqual(await e.storage().api.readLocalSetup(), draft);
    } finally {e.close();}
  });
  console.log(JSON.stringify({checks, evidence,
    limits: 'Actual source modules, real node:sqlite transactions and crypto; injected legacy/SecureStore APIs. No OS/process/device or forensic-erasure qualification.'}, null, 2));
})().catch(error => {console.error(error); process.exit(1);});
