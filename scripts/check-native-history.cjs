const assert = require('node:assert/strict');
const path = require('node:path');
const {randomBytes} = require('node:crypto');
const {createSqliteHarness} = require('./lib/native-sqlite.cjs');
const {createSourceLoader} = require('./lib/native-source-loader.cjs');

// Actual storage/history/crypto modules and real separate-connection SQLite
// transactions. Only OS SecureStore and secure randomness are injected.
const repo = process.argv[2] || path.resolve(__dirname, '..');
const KEY = 'training-studio:mobile-local-demo:v1';
const SETUP = 'training-studio:mobile-setup:v1';
const JOURNAL = 'training-studio:mobile-restore:v1';
const DATA_KEY = 'movefield.dataKey.v1', RESTORE_KEY = 'movefield.restoreKeys.v1';
const random = n => new Uint8Array(randomBytes(n));
const rootLoader = createSourceLoader(repo);
const C = rootLoader.load(path.join(repo, 'mobile/src/local-crypto.ts'));
const R = rootLoader.load(path.join(repo, 'mobile/src/native-record-store.ts'));
const H = rootLoader.load(path.join(repo, 'mobile/src/native-history.ts'));
const T = rootLoader.load(path.join(repo, 'mobile/src/shared/training.ts'));
const base = JSON.parse(JSON.stringify(T.initialState()));
const marker = 'Synthetic private history marker 6B7E';
let checks = 0;
const scenarios = [];
const same = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const ok = (value, message) => { assert.ok(value, message); checks++; };
async function rejects(promise, codes, message) {
  await assert.rejects(promise, error => error?.name === 'LocalDataError' && codes.includes(error.code), message);
  checks++;
}
function state(count = 3) {
  return {...base, profile: {...base.profile, name: marker}, history: Array.from({length: count}, (_, index) => ({
    id: 'completed-workout-' + index, sessionId: 'previous-session-' + index,
    title: 'Completed strength work', date: new Date(Date.UTC(2015, 0, 1 + index)).toISOString().slice(0, 10),
    startedAt: index + 1, finishedAt: index + 2,
    targets: [{exerciseId: 'bench', sets: 2, reps: 6, rest: 120, kg: 80}],
    sets: [1, 2].map(set => ({exerciseId: 'bench', set, reps: 6, kg: 80, done: true, rir: 2})),
    details: {bench: {notes: 'Controlled reps 漢字 🏋️'}}, effort: 'right', symptom: 'no',
  }))};
}
function environment(initial = {}) {
  const h = createSqliteHarness(), legacyValues = new Map(Object.entries(initial)), secureValues = new Map(), secureReads = [];
  let cleanupDenied = false;
  const legacy = {
    getItem: async slot => legacyValues.get(slot) ?? null,
    removeItem: async slot => { if (cleanupDenied) throw Error('Injected legacy cleanup denied'); legacyValues.delete(slot); },
  };
  const secure = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
    getItemAsync: async key => { secureReads.push(key); return secureValues.get(key) ?? null; },
    setItemAsync: async (key, value) => { secureValues.set(key, value); },
    deleteItemAsync: async key => { secureValues.delete(key); },
  };
  const records = () => R.createNativeRecordStore({open: async () => h.db, legacy});
  const storage = () => {
    const recordStore = records();
    const loader = createSourceLoader(repo, {
      './native-database': {nativeRecords: recordStore},
      'expo-secure-store': secure, 'expo-crypto': {getRandomBytes: random},
    });
    return {api: loader.load(path.join(repo, 'mobile/src/storage.ts')), records: recordStore, loader};
  };
  return {h, legacyValues, secureValues, secureReads, secure, records, storage, denyCleanup: value => { cleanupDenied = value; }, close: h.close};
}
async function scenario(name, run) {
  const e = environment();
  try { await run(e); scenarios.push(name); console.log('PASS ' + name); }
  finally { e.close(); }
}
function rows(e) {
  return {
    records: e.h.native.prepare('SELECT * FROM training_records ORDER BY slot').all(),
    chunks: e.h.native.prepare('SELECT * FROM training_chunks ORDER BY slot, ordinal').all(),
    metadata: e.h.native.prepare('SELECT * FROM training_record_metadata ORDER BY id').all(),
  };
}
async function historyCiphertexts(e) {
  const store = e.records(), slots = await store.listHistorySlots();
  return (await store.snapshotRecords(slots)).records;
}
function historyWrites(e) {
  return [...new Set(e.h.controller.calls.filter(call => call.method === 'runAsync'
    && call.args[0]?.startsWith?.(R.NATIVE_HISTORY_PREFIX)).map(call => call.args[0]))];
}
function noPlaintext(e, sourceState) {
  const sql = JSON.stringify(rows(e));
  ok(!sql.includes(marker), 'SQL contains no profile plaintext');
  for (const workout of sourceState.history) ok(!sql.includes(workout.id), 'SQL contains no completed workout IDs');
  for (const value of e.secureValues.values()) if (/^[0-9a-f]{64}$/.test(value)) ok(!sql.includes(value), 'SQL contains no data key material');
}
function sealFull(sourceState, keyHex = 'ab'.repeat(32)) {
  return C.sealText(JSON.stringify(sourceState), C.keyFromHex(keyHex), KEY, random);
}
async function head(e) {
  const raw = await e.records().getItem(KEY), key = C.keyFromHex(e.secureValues.get(DATA_KEY));
  const parsed = H.parseNativeHistoryHead(C.openText(raw, key, KEY));
  ok(parsed !== null, 'main record uses the encrypted history head format');
  return parsed;
}

(async () => {
  for (const source of ['plaintext legacy', 'encrypted legacy', 'encrypted SQL snapshot']) {
    await scenario('Whole snapshot migration: ' + source, async e => {
      const original = state();
      if (source === 'plaintext legacy') e.legacyValues.set(KEY, JSON.stringify(original));
      else {
        const sealed = sealFull(original); e.secureValues.set(DATA_KEY, 'ab'.repeat(32));
        if (source === 'encrypted legacy') e.legacyValues.set(KEY, sealed);
        else await e.records().setItem(KEY, sealed);
      }
      same(await e.storage().api.readLocalState(), original, 'migration reconstructs the exact previous profile/history');
      const parsed = await head(e);
      same(parsed.entries.length, original.history.length, 'head retains every completed workout');
      same((await e.records().listHistorySlots()).length, original.history.length, 'completed workouts have separate encrypted entities');
      same(e.legacyValues.has(KEY), false, 'verified migration retires unchanged legacy source');
      const before = rows(e);
      same(await e.storage().api.readLocalState(), original, 'fresh module reopens migrated entities');
      same(rows(e), before, 'fresh reopen does not rewrite completed history');
      noPlaintext(e, original);
    });
  }

  await scenario('Head-only saves preserve exact completed ciphertext; append writes only one new entity', async e => {
    const api = e.storage().api, original = state(); await api.saveLocalState(original);
    const before = await historyCiphertexts(e), firstHead = await e.records().getItem(KEY);
    e.h.controller.calls = [];
    const edited = {...original, profile: {...original.profile, name: 'Changed current profile'}};
    await api.saveLocalState(edited);
    same(await historyCiphertexts(e), before, 'profile edit preserves every completed ciphertext byte');
    same(historyWrites(e), [], 'profile edit performs zero completed-entity SQL writes');
    ok(await e.records().getItem(KEY) !== firstHead, 'current profile edit replaces encrypted head');
    same(await e.storage().api.readLocalState(), edited, 'fresh module reconstructs current edit and original history');
    const appended = {...edited, history: [...edited.history, state(4).history[3]]};
    e.h.controller.calls = [];
    await api.saveLocalState(appended);
    const addedSlot = R.nativeHistorySlot(appended.history[3].id);
    same(historyWrites(e), [addedSlot], 'append writes only the newly completed workout');
    const after = await historyCiphertexts(e);
    for (const [slot, ciphertext] of Object.entries(before)) same(after[slot], ciphertext, 'append does not re-encrypt previous history');
    same(await e.storage().api.readLocalState(), appended, 'fresh module reconstructs appended history');
  });

  await scenario('Two modules serialize first key creation and preserve the final readable history', async e => {
    const first = e.storage().api, second = e.storage().api, initial = state();
    const next = {...initial, profile: {...initial.profile, name: 'Second concurrent first save'}};
    same(await first.readLocalState(), null, 'first module captures an empty profile generation');
    same(await second.readLocalState(), null, 'second module captures the same empty generation');
    const set = e.secure.setItemAsync;
    let signal, release, keyWrites = 0;
    const started = new Promise(resolve => { signal = resolve; }), gate = new Promise(resolve => { release = resolve; });
    e.secure.setItemAsync = async (name, value) => {
      if (name === DATA_KEY) { keyWrites++; if (keyWrites === 1) { signal(); await gate; } }
      return set(name, value);
    };
    const firstSave = first.saveLocalState(initial);
    await started;
    let secondFinished = false;
    const secondSave = second.saveLocalState(next).then(
      () => { secondFinished = true; return {status: 'fulfilled'}; },
      error => { secondFinished = true; return {status: 'rejected', error}; },
    );
    await Promise.resolve();
    same(secondFinished, false, 'second module waits while first secure key creation is pending');
    release(); await firstSave;
    const result = await secondSave;
    same(result.status, 'rejected', 'second loaded empty profile refuses stale first save');
    same(result.error?.name, 'LocalDataError', 'stale initial save returns the real storage error');
    same(result.error?.code, 'unknown-format', 'stale initial save requires reload rather than overwriting');
    same(keyWrites, 1, 'shared lifecycle creates exactly one data key across both modules');
    same(await e.storage().api.readLocalState(), initial, 'winning initial profile and every completed entity reopen under the single key');
  });

  await scenario('Concurrent second-module reads and locked exports wait for a prepared restore', async e => {
    const owner = e.storage().api, reader = e.storage().api; await owner.saveLocalState(state());
    const restored = {...state(2), profile: {...base.profile, name: 'Concurrent prepared restore'}};
    const set = e.secure.setItemAsync;
    let signal, release;
    const started = new Promise(resolve => { signal = resolve; }), gate = new Promise(resolve => { release = resolve; });
    e.secure.setItemAsync = async (name, value) => { if (name === RESTORE_KEY) { signal(); await gate; } return set(name, value); };
    const replacing = owner.replaceLocalState(restored); await started;
    let readFinished = false, rawFinished = false;
    const read = reader.readLocalState().then(value => { readFinished = true; return value; });
    const raw = reader.readLocalRaw().then(value => { rawFinished = true; return value; });
    await Promise.resolve();
    same(readFinished, false, 'another module cannot decrypt a partially prepared restore');
    same(rawFinished, false, 'another module cannot export a partially installed entity generation');
    release(); await replacing;
    same(await read, restored, 'queued read opens the complete restored generation');
    const bundle = JSON.parse(await raw);
    same(bundle.records[KEY], await e.records().getItem(KEY), 'queued locked export includes current encrypted head');
    for (const [slot, ciphertext] of Object.entries(await historyCiphertexts(e))) same(bundle.records[slot], ciphertext, 'queued locked export includes every restored entity');
  });

  await scenario('Completed history edit/delete/reorder update only affected entities', async e => {
    const api = e.storage().api, original = state(); await api.saveLocalState(original);
    const before = await historyCiphertexts(e), changedId = original.history[1].id;
    const edited = {...original, history: original.history.map(workout => workout.id === changedId
      ? {...workout, sets: workout.sets.map(set => ({...set, reps: 7})), details: {bench: {notes: 'Edited completed note'}}} : workout)};
    e.h.controller.calls = []; await api.saveLocalState(edited);
    same(historyWrites(e), [R.nativeHistorySlot(changedId)], 'completed edit writes only the changed workout');
    const changed = await historyCiphertexts(e);
    for (const workout of original.history.filter(workout => workout.id !== changedId)) same(changed[R.nativeHistorySlot(workout.id)], before[R.nativeHistorySlot(workout.id)], 'unaffected completed workouts retain ciphertext');
    ok(changed[R.nativeHistorySlot(changedId)] !== before[R.nativeHistorySlot(changedId)], 'edited completed record is resealed');
    const removedId = edited.history[0].id, removedSlot = R.nativeHistorySlot(removedId);
    const deleted = {...edited, history: edited.history.slice(1)};
    e.h.controller.calls = []; await api.saveLocalState(deleted);
    same(historyWrites(e), [removedSlot], 'completed deletion retires only the removed workout');
    same(e.h.native.prepare('SELECT deleted FROM training_records WHERE slot=?').get(removedSlot).deleted, 1, 'deleted entity has durable tombstone');
    same(await e.records().getItem(removedSlot), null, 'deleted completed ciphertext no longer opens');
    const reordered = {...deleted, history: [...deleted.history].reverse()};
    e.h.controller.calls = []; await api.saveLocalState(reordered);
    same(historyWrites(e), [], 'reordering completed history rewrites no entities');
    same(await e.storage().api.readLocalState(), reordered, 'fresh reconstruction retains requested order and edits/deletion');
  });

  await scenario('Full restore rotates secure key and all entities; reset retires complete history', async e => {
    const api = e.storage().api, original = state(); await api.saveLocalState(original);
    await api.saveLocalSetup({schema: 1, basePlanId: original.plan.id, baseEvents: '[]', profile: original.profile, events: [], step: 2});
    const oldKey = e.secureValues.get(DATA_KEY), before = await historyCiphertexts(e);
    const restored = {...state(2), profile: {...original.profile, name: 'Restored profile'}};
    await api.replaceLocalState(restored);
    ok(e.secureValues.get(DATA_KEY) !== oldKey, 'confirmed restore rotates the secure data key');
    const after = await historyCiphertexts(e);
    for (const workout of restored.history) ok(after[R.nativeHistorySlot(workout.id)] !== before[R.nativeHistorySlot(workout.id)], 'restored completed entities use new ciphertext/key');
    same(Object.keys(after).length, restored.history.length, 'restore retires obsolete history entities');
    same(await e.storage().api.readLocalState(), restored, 'fresh module opens every restored entity');
    same(await e.storage().api.readLocalSetup(), null, 'restore retires old setup draft');
    same(await e.records().getItem(JOURNAL), null, 'successful restore retires encrypted journal');
    same(e.secureValues.has(RESTORE_KEY), false, 'successful restore retires previous recoverable key ring');
    await e.storage().api.resetLocalState();
    same(await e.storage().api.readLocalState(), null, 'fresh reset reopen has no profile');
    same(await e.records().listHistorySlots(), [], 'reset leaves no live completed history');
    same(e.secureValues.has(DATA_KEY), false, 'reset removes secure data key');
    same(e.secureValues.has(RESTORE_KEY), false, 'reset removes secure recovery key ring');
  });

  await scenario('Locked raw recovery bundle retains the head and every encrypted entity after key loss', async e => {
    const original = state(), api = e.storage().api; await api.saveLocalState(original);
    const headRaw = await e.records().getItem(KEY), entities = await historyCiphertexts(e);
    e.secureValues.delete(DATA_KEY);
    const fresh = e.storage().api;
    await rejects(fresh.readLocalState(), ['key-missing'], 'lost secure key refuses decrypted profile read');
    const raw = await fresh.readLocalRaw();
    const bundle = JSON.parse(raw);
    same(bundle.format, 'movefield-native-recovery-records-v2', 'locked copy identifies the full encrypted record format');
    same(bundle.records[KEY], headRaw, 'locked bundle includes exact encrypted main head');
    for (const [slot, ciphertext] of Object.entries(entities)) same(bundle.records[slot], ciphertext, 'locked bundle includes every exact encrypted entity');
    ok(!raw.includes(marker), 'locked bundle contains no profile plaintext');
    for (const workout of original.history) ok(!raw.includes(workout.id), 'locked bundle contains no completed IDs');
    await rejects(fresh.saveLocalState(original), ['key-missing'], 'ordinary save cannot invent a replacement key');
    same(e.secureValues.has(DATA_KEY), false, 'ordinary save leaves lost key missing');
    await fresh.replaceLocalState(original);
    same(await e.storage().api.readLocalState(), original, 'explicit transfer replacement recovers key-lost entities');
  });

  for (const corruption of ['missing entity', 'damaged chunk', 'authenticated digest mismatch']) {
    await scenario('Corrupted history refuses reads/saves: ' + corruption, async e => {
      const original = state(), api = e.storage().api; await api.saveLocalState(original);
      const slot = R.nativeHistorySlot(original.history[1].id);
      if (corruption === 'missing entity') {
        e.h.native.prepare('DELETE FROM training_chunks WHERE slot=?').run(slot);
        e.h.native.prepare('DELETE FROM training_records WHERE slot=?').run(slot);
      } else if (corruption === 'damaged chunk') e.h.native.prepare('UPDATE training_chunks SET hash=? WHERE slot=?').run('0'.repeat(64), slot);
      else {
        const altered = {...original.history[1], title: 'Authenticated but unapproved history'};
        const encrypted = C.sealText(JSON.stringify(altered), C.keyFromHex(e.secureValues.get(DATA_KEY)), slot, random);
        await e.records().setItem(slot, encrypted);
      }
      const before = rows(e), fresh = e.storage().api;
      await rejects(fresh.readLocalState(), ['decrypt-failed'], 'damaged history cannot reconstruct a profile');
      await rejects(fresh.saveLocalState({...original, profile: {...original.profile, name: 'Must not overwrite damage'}}), ['decrypt-failed', 'unknown-format'], 'ordinary save cannot replace damaged completed history');
      same(rows(e), before, 'refused save preserves exact damaged recovery evidence');
    });
  }

  for (const replacement of ['restore', 'reset']) {
    await scenario('Stale module compare-and-commit refuses saves after ' + replacement, async e => {
      const original = state(), owner = e.storage().api; await owner.saveLocalState(original);
      const stale = e.storage().api; same(await stale.readLocalState(), original, 'second module captures original generation');
      const restored = {...state(1), profile: {...original.profile, name: 'Newest restored generation'}};
      if (replacement === 'restore') await owner.replaceLocalState(restored); else await owner.resetLocalState();
      const before = rows(e), key = e.secureValues.get(DATA_KEY);
      await rejects(stale.saveLocalState({...original, profile: {...original.profile, name: 'Stale edit'}}), ['unknown-format', 'key-missing'], 'stale module cannot overwrite the changed generation');
      same(rows(e), before, 'stale save preserves current SQL generation');
      same(e.secureValues.get(DATA_KEY), key, 'stale save does not rotate/mint a secure key');
      same(await e.storage().api.readLocalState(), replacement === 'restore' ? restored : null, 'fresh reopen sees only authorized replacement/reset');
    });
  }

  for (const replacement of ['save', 'restore', 'reset']) {
    await scenario('Stale replacement refuses before preparing a key ring after other module ' + replacement, async e => {
      const original = state(), owner = e.storage().api; await owner.saveLocalState(original);
      const stale = e.storage().api; await stale.readLocalState();
      const changed = {...state(2), profile: {...original.profile, name: 'Current authorized generation'}};
      if (replacement === 'save') await owner.saveLocalState(changed);
      else if (replacement === 'restore') await owner.replaceLocalState(changed);
      else await owner.resetLocalState();
      const before = rows(e), secure = new Map(e.secureValues);
      await rejects(stale.replaceLocalState(original), ['unknown-format'], 'stale restore refuses before recovery preparation');
      same(rows(e), before, 'stale restore does not install a journal or change entities');
      same(e.secureValues, secure, 'stale restore does not prepare or rotate secure keys');
    });
  }

  const performance = [];
  for (const count of [3, 2000]) {
    await scenario('Repeated current-session edits have bounded persistence work with ' + count + ' completed workouts', async e => {
      const original = state(count), api = e.storage().api; await api.saveLocalState(original);
      const before = await historyCiphertexts(e);
      const {finishedAt, ...active} = original.history[0];
      for (const reps of [7, 8]) {
        const edited = {...original, active: {...active, id: 'current-active-workout', sessionId: original.plan.sessions[0].id, sets: active.sets.map((set, index) => index ? set : {...set, reps})}};
        e.h.controller.calls = []; e.secureReads.length = 0;
        await api.saveLocalState(edited);
        const selects = e.h.controller.calls.filter(call => /^SELECT\b/i.test(call.sql)).length;
        performance.push({history: count, selects, secureReads: e.secureReads.length});
        ok(selects <= 24, 'cached current-session save uses a fixed small number of SQL SELECTs');
        ok(e.secureReads.length <= 4, 'cached save performs at most four secure key/ring reads');
        same(historyWrites(e), [], 'current-session save writes zero completed history entities');
        ok(!e.h.controller.calls.some(call => call.args[0]?.startsWith?.(R.NATIVE_HISTORY_PREFIX)), 'cached save does not read individual completed history rows');
      }
      same(await historyCiphertexts(e), before, 'repeated current-session edits preserve every completed ciphertext byte');
      same((await e.storage().api.readLocalState()).history.length, count, 'fresh module still authenticates/reconstructs full history');
    });
  }
  same(performance.filter(item => item.history === 2000).map(item => item.selects), performance.filter(item => item.history === 3).map(item => item.selects), 'SQL read count is independent of completed history length');
  console.log('EVIDENCE cached current-session persistence ' + JSON.stringify(performance));

  await scenario('Batch write rollback preserves head, unchanged entities and prior history after SQLITE_FULL', async e => {
    const original = state(), api = e.storage().api; await api.saveLocalState(original);
    const before = rows(e), key = e.secureValues.get(DATA_KEY), appended = state(4);
    let earlierEntityWrite = false;
    e.h.controller.fail = call => {
      if (call.method === 'runAsync' && call.args[0]?.startsWith?.(R.NATIVE_HISTORY_PREFIX)) earlierEntityWrite = true;
      return call.method === 'runAsync' && call.sql.includes('INSERT INTO training_chunks') && call.args[0] === KEY;
    };
    await assert.rejects(api.saveLocalState(appended)); checks++;
    e.h.controller.fail = null;
    ok(earlierEntityWrite, 'failure occurs after earlier new history writes in the same transaction');
    same(rows(e), before, 'failure rolls back head, new history chunks/manifests and revision');
    same(e.secureValues.get(DATA_KEY), key, 'failed incremental save preserves secure key');
    same(await e.storage().api.readLocalState(), original, 'fresh module reconstructs prior complete generation');
    await api.saveLocalState(appended);
    same(await e.storage().api.readLocalState(), appended, 'retry saves retained edits after rollback');
  });

  await scenario('Postcommit readback ambiguity reports failure but retains a complete reopenable generation', async e => {
    const original = state(), api = e.storage().api; await api.saveLocalState(original);
    const changed = {...state(4), profile: {...original.profile, name: 'Committed before readback failure'}};
    let changedHead = false, committed = false;
    e.h.controller.fail = call => {
      if (call.method === 'runAsync' && call.sql.includes('INSERT INTO training_chunks') && call.args[0] === KEY) changedHead = true;
      if (changedHead && call.method === 'commit') committed = true;
      return committed && call.method === 'getFirstAsync';
    };
    await assert.rejects(api.saveLocalState(changed)); checks++;
    e.h.controller.fail = null;
    ok(committed, 'failure was injected after the real write transaction committed');
    same(await e.storage().api.readLocalState(), changed, 'fresh module reconstructs the complete ambiguous committed generation');
    same((await e.records().listHistorySlots()).length, changed.history.length, 'ambiguous commit retains every new completed entity');
  });

  await scenario('Ambiguous migration retains the whole encrypted legacy source and reopens committed entities', async e => {
    const original = state(), oldRaw = sealFull(original);
    e.legacyValues.set(KEY, oldRaw); e.secureValues.set(DATA_KEY, 'ab'.repeat(32));
    let changedHead = false, committed = false, injected = false;
    e.h.controller.fail = call => {
      if (call.method === 'runAsync' && call.sql.includes('INSERT INTO training_chunks') && call.args[0] === KEY) changedHead = true;
      if (changedHead && call.method === 'commit') committed = true;
      if (committed && !injected && call.method === 'getFirstAsync') { injected = true; return true; }
      return false;
    };
    await assert.rejects(e.storage().api.readLocalState()); checks++;
    e.h.controller.fail = null;
    ok(injected, 'migration failure occurs on separate committed readback');
    same(e.legacyValues.get(KEY), oldRaw, 'ambiguous migration retains original encrypted whole snapshot exactly');
    same(e.secureValues.get(DATA_KEY), 'ab'.repeat(32), 'ambiguous migration retains existing secure key');
    same(await e.storage().api.readLocalState(), original, 'fresh module opens complete committed migrated history');
  });

  await scenario('Ambiguous restore retains new encrypted entities and both keys until fresh recovery', async e => {
    const original = state(), api = e.storage().api; await api.saveLocalState(original);
    const oldKey = e.secureValues.get(DATA_KEY), restored = {...state(2), profile: {...original.profile, name: 'Ambiguously installed restore'}};
    let changedHead = false, committed = false, injected = false;
    e.h.controller.fail = call => {
      if (call.method === 'runAsync' && call.sql.includes('INSERT INTO training_chunks') && call.args[0] === KEY) changedHead = true;
      if (changedHead && call.method === 'commit') committed = true;
      if (committed && !injected && call.method === 'getFirstAsync') { injected = true; return true; }
      return false;
    };
    await rejects(api.replaceLocalState(restored), ['key-unavailable'], 'ambiguous installed restore reports recoverable persistence failure');
    e.h.controller.fail = null;
    ok(injected, 'restore failure occurs after main and history transaction commits');
    same(e.secureValues.get(DATA_KEY), oldKey, 'ambiguous restore retains original active key until recovery');
    ok(e.secureValues.has(RESTORE_KEY), 'ambiguous restore retains both recoverable keys');
    ok(await e.records().getItem(JOURNAL), 'ambiguous restore retains ciphertext journal');
    same(await e.storage().api.readLocalState(), restored, 'fresh recovery opens all ambiguously installed history entities');
    same(e.secureValues.has(RESTORE_KEY), false, 'fresh recovery retires secure ring after activating correct key');
    same(await e.records().getItem(JOURNAL), null, 'fresh recovery retires journal after selecting installed generation');
  });

  await scenario('Interrupted restore secure-key activation retains all entities and both recoverable keys', async e => {
    const original = state(), api = e.storage().api; await api.saveLocalState(original);
    const key = e.secureValues.get(DATA_KEY), restored = {...state(2), profile: {...original.profile, name: 'Recovered entity restore'}};
    const set = e.secure.setItemAsync;
    e.secure.setItemAsync = async (name, value) => { if (name === DATA_KEY) throw Error('Injected secure activation failure'); return set(name, value); };
    await rejects(api.replaceLocalState(restored), ['key-unavailable'], 'interrupted key activation reports retained recovery');
    same(e.secureValues.get(DATA_KEY), key, 'old active key remains available');
    ok(e.secureValues.has(RESTORE_KEY), 'secure key ring retains the replacement key');
    ok(await e.records().getItem(JOURNAL), 'encrypted restore journal remains durable');
    e.secure.setItemAsync = set;
    same(await e.storage().api.readLocalState(), restored, 'fresh module activates recovery key and opens every restored entity');
    same(e.secureValues.has(RESTORE_KEY), false, 'successful fresh recovery retires key ring');
    same(await e.records().getItem(JOURNAL), null, 'successful fresh recovery retires journal');
    same((await e.records().listHistorySlots()).length, restored.history.length, 'fresh recovery retains only restored history');
  });

  await scenario('Same module cannot overwrite installed restore with old UI state after failed acknowledgment', async e => {
    const api = e.storage().api, original = state(); await api.saveLocalState(original);
    const restored = {...state(2), profile: {...original.profile, name: 'Installed restore awaiting UI reload'}};
    const set = e.secure.setItemAsync;
    e.secure.setItemAsync = async (name, value) => { if (name === DATA_KEY) throw Error('Injected activation acknowledgment failure'); return set(name, value); };
    await rejects(api.replaceLocalState(restored), ['key-unavailable'], 'installed restore was not acknowledged to old UI');
    e.secure.setItemAsync = set;
    await rejects(api.saveLocalState(original), ['unknown-format'], 'automatic recovery cannot authorize stale old UI state to replace restored history');
    same(await e.storage().api.readLocalState(), restored, 'fresh reopen retains the full recovered restored generation');
  });

  for (const failedDelete of [RESTORE_KEY, DATA_KEY]) {
    await scenario('Reset interruption while deleting ' + failedDelete + ' still reopens empty history', async e => {
      const api = e.storage().api, original = state(); await api.saveLocalState(original);
      const set = e.secure.setItemAsync;
      e.secure.setItemAsync = async (name, value) => { if (name === DATA_KEY) throw Error('Interrupted prior key activation'); return set(name, value); };
      await rejects(api.replaceLocalState(state(2)), ['key-unavailable'], 'fixture retains an interrupted restore ring');
      e.secure.setItemAsync = set;
      ok(e.secureValues.has(RESTORE_KEY), 'fixture has prior and replacement recovery keys');
      const remove = e.secure.deleteItemAsync;
      e.secure.deleteItemAsync = async name => { if (name === failedDelete) throw Error('Injected secure reset deletion failure'); return remove(name); };
      await assert.rejects(api.resetLocalState()); checks++;
      e.secure.deleteItemAsync = remove;
      same(await e.records().listHistorySlots(), [], 'reset database commit retires all entities before key cleanup');
      await rejects(api.saveLocalState(original), ['unknown-format'], 'unacknowledged reset cannot authorize old UI to resurrect erased history');
      same(await e.storage().api.readLocalState(), null, 'fresh module reopens empty rather than blocking on old recovery keys');
      same(e.secureValues.has(RESTORE_KEY), false, 'fresh recovery retires any retained obsolete key ring');
      same(await e.records().getItem(JOURNAL), null, 'reset tombstone cannot revive prior restore journal');
    });
  }

  console.log(`PASS native history: ${scenarios.length} scenarios, ${checks} assertions (actual SQLite/storage/history/crypto; injected OS APIs; no physical-device proof)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
