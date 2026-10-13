const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const {webcrypto} = require('node:crypto');
const {IDBFactory, IDBObjectStore} = require('fake-indexeddb');

const modules = new Map();
function load(name) {
  if (name.endsWith('.json')) return JSON.parse(fs.readFileSync(path.join('lib', name), 'utf8'));
  if (modules.has(name)) return modules.get(name).exports;
  const module = {exports: {}};
  modules.set(name, module);
  const source = ts.transpileModule(fs.readFileSync(path.join('lib', name + '.ts'), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText;
  new Function('require', 'module', 'exports', source)(dependency => dependency.startsWith('./') ? load(dependency.slice(2)) : require(dependency), module, module.exports);
  return module.exports;
}
const V = load('browser-vault'), C = load('workout-coaching-store'), W = load('workout-coaching');
const {createBrowserRecordStore} = load('browser-record-store');
const SLOT = C.COACHING_RESULT_SLOT, PROFILE = 'training-studio-v2';
let checks = 0;
const scenarios = [];
const same = (actual, expected, message) => {assert.deepEqual(actual, expected, message); checks++;};
const ok = (value, message) => {assert.ok(value, message); checks++;};
const rejected = async (promise, code) => {await assert.rejects(promise, error => error.code === code); checks++;};
const scenario = async (name, run) => {await run(); scenarios.push(name); console.log('PASS ' + name);};
const result = (ordinal = 1, extra = {}) => {
  const workoutId = '00000000-0000-4000-8000-' + String(ordinal).padStart(12, '0'), contextDigest = ordinal.toString(16).padStart(64, '0');
  return {policy: W.COACHING_POLICY, workoutId, contextDigest, event: {kind: 'workout', exerciseId: null}, modelId: 'synthetic-model-v1', source: 'backend',
    reply: {policy: W.COACHING_POLICY, workoutId, contextDigest, observationIds: ['completed-sets'], reviewIds: [], priority: 'performance'},
    createdAt: new Date(Date.UTC(2026, 9, 10, 0, ordinal)).toISOString(), ...extra};
};
function fixture() {
  const idb = new IDBFactory(), map = new Map(), notifications = [];
  const legacy = {getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key)};
  let queued = Promise.resolve();
  const lock = job => {const next = queued.then(job); queued = next.catch(() => undefined); return next;};
  const makeVault = (extra = {}) => V.createTransactionalVault({idb, legacy, subtle: webcrypto.subtle, random: n => webcrypto.getRandomValues(new Uint8Array(n)), lock, restoreSafe: true, notify: () => notifications.push('notify'), ...extra});
  const vault = makeVault(), recordStore = createBrowserRecordStore({idb, legacy});
  return {idb, legacy, map, notifications, vault, recordStore, makeVault, make: extra => C.createWorkoutCoachingStore({vault: makeVault(extra)}), store: C.createWorkoutCoachingStore({vault})};
}
async function mutate(idb, stores, job) {
  const db = await new Promise((resolve, reject) => {const request = idb.open('movefield-vault', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);});
  try {await new Promise((resolve, reject) => {const tx = db.transaction(stores, 'readwrite'); tx.oncomplete = resolve; tx.onabort = () => reject(tx.error ?? Error('Injected abort')); job(tx);});}
  finally {db.close();}
}
async function withPut(hook, run) {
  const previous = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, ...args) {return hook.call(this, previous, value, args);};
  try {return await run();} finally {IDBObjectStore.prototype.put = previous;}
}
function delayedEncryption() {
  let started, release, first = true;
  const signal = new Promise(resolve => {started = resolve;}), gate = new Promise(resolve => {release = resolve;});
  const subtle = new Proxy(webcrypto.subtle, {get(target, property) {
    if (property === 'encrypt') return async (...args) => {if (first) {first = false; started(); await gate;} return target.encrypt(...args);};
    const value = target[property]; return typeof value === 'function' ? value.bind(target) : value;
  }});
  return {subtle, started: signal, release};
}

(async () => {
  await scenario('First result commits ciphertext and a non-extractable key before readiness', async () => {
    const f = fixture();
    same(await f.store.read(), {raw: '', results: []});
    const transactions = new Map(), events = [];
    const vault = f.makeVault({notify: () => events.push('notify')}), store = C.createWorkoutCoachingStore({vault});
    let saved;
    await withPut(function (original, value, args) {
      const tx = this.transaction;
      if (!transactions.has(tx)) {transactions.set(tx, new Set()); tx.addEventListener('complete', () => events.push('commit'));}
      transactions.get(tx).add(this.name + ':' + args[0]);
      return original.call(this, value, ...args);
    }, async () => {saved = await store.save(result(), ''); events.push('ready');});
    same(events, ['commit', 'notify', 'ready']);
    ok([...transactions.values()].some(rows => rows.has('keys:data-key-v1') && rows.has('records:' + SLOT)));
    const snapshot = await f.recordStore.snapshot();
    same(snapshot.key.extractable, false);
    await assert.rejects(webcrypto.subtle.exportKey('raw', snapshot.key)); checks++;
    ok(V.isSealed(saved.raw));
    ok(!JSON.stringify(snapshot.records).includes('synthetic-model-v1'));
    same(f.legacy.getItem(SLOT), null);
    same((await f.make().read()).results, [result()]);
    same(await f.make().list(), [result()]);
  });
  await scenario('Only newest twelve distinct contexts survive and stale same-context results are refused', async () => {
    const f = fixture(); let snapshot = await f.store.read();
    for (let ordinal = 1; ordinal <= 15; ordinal++) snapshot = await f.store.save(result(ordinal), snapshot.raw);
    same(snapshot.results.length, 12);
    same(snapshot.results.map(entry => entry.workoutId), Array.from({length: 12}, (_, i) => result(15 - i).workoutId));
    const idempotent = await f.store.save(result(15), snapshot.raw);
    same(idempotent.raw, snapshot.raw);
    await rejected(f.store.save(result(15, {createdAt: result(14).createdAt}), snapshot.raw), 'stale-result');
    await rejected(f.store.save(result(1), snapshot.raw), 'stale-result');
    same((await f.store.read()).raw, snapshot.raw);
    const newer = result(15, {createdAt: '2026-10-11T00:00:00.000Z', modelId: 'newer-model'});
    const updated = await f.store.save(newer, snapshot.raw);
    same(updated.results[0], newer);
    same(updated.results.length, 12);
  });
  await scenario('Strict metadata and selector schemas reject prompts, duplicate identities and mismatched replies', async () => {
    const f = fixture(), before = await f.store.read();
    for (const record of [
      {...result(), context: {history: 'must never be stored'}},
      {...result(), qualified: true},
      result(1, {source: 'browser-local'}),
      result(1, {createdAt: '2026-10-10'}),
      result(1, {event: {kind: 'lift', exerciseId: null}}),
      result(1, {event: {kind: 'workout', exerciseId: 'bench'}}),
      result(1, {modelId: 'x'.repeat(161)}),
      result(1, {reply: {...result().reply, workoutId: result(2).workoutId}}),
      result(1, {reply: {...result().reply, contextDigest: result(2).contextDigest}}),
      result(1, {reply: {...result().reply, observationIds: ['completed-sets', 'completed-sets']}}),
      result(1, {reply: {...result().reply, prose: 'unbounded advice'}}),
    ]) await rejected(f.store.save(record, before.raw), 'invalid-data');
    same((await f.store.read()).raw, before.raw);
    same((await f.recordStore.snapshot()).key, undefined);
    const lift = result(1, {event: {kind: 'lift', exerciseId: 'bench'}, source: 'local', modelId: 'web-qwen3.5-4b-q4f16_1-mlc', modelRevision: 'synthetic-pin', runtimeVersion: '0.2.85'});
    same((await f.store.save(lift, before.raw)).results, [lift]);
  });
  await scenario('A stale tab cannot save or clear results written by another tab', async () => {
    const f = fixture(), original = await f.store.save(result(), ''), other = f.make();
    const current = await other.save(result(2), original.raw);
    await rejected(f.store.save(result(3), original.raw), 'conflict');
    await rejected(f.store.clear(original.raw), 'conflict');
    same(await f.store.read(), current);
    const cleared = await f.store.clear(current.raw);
    same(cleared.results, []);
    ok(V.isSealed(cleared.raw));
    same(await f.make().list(), []);
  });
  await scenario('Actual IndexedDB CAS catches a competing write while encryption is paused', async () => {
    const f = fixture(), before = await f.store.save(result(), ''), gate = delayedEncryption();
    const delayed = f.make({subtle: gate.subtle, lock: undefined}), competing = f.make({lock: undefined});
    const pending = delayed.save(result(3), before.raw), rejection = rejected(pending, 'conflict');
    await gate.started;
    const winner = await competing.save(result(2), before.raw);
    gate.release(); await rejection;
    same(await f.make().read(), winner);
  });
  await scenario('Aborted ciphertext transaction rolls back the first key and preserves existing data', async () => {
    const f = fixture(); await f.store.read();
    await withPut(function (original, value, args) {
      const request = original.call(this, value, ...args);
      if (this.name === 'metadata' && args[0] === 'record-state-v2') this.transaction.abort();
      return request;
    }, async () => {await rejected(f.store.save(result(), ''), 'key-unavailable');});
    const failed = await f.recordStore.snapshot();
    same(failed.key, undefined);
    same(failed.records[SLOT], null);
    const old = await f.store.save(result(), '');
    await withPut(function (original, value, args) {
      const request = original.call(this, value, ...args);
      if (this.name === 'metadata' && args[0] === 'record-state-v2') this.transaction.abort();
      return request;
    }, async () => {await rejected(f.store.save(result(2), old.raw), 'key-unavailable');});
    same(await f.make().read(), old);
  });
  await scenario('Missing, replaced and damaged keys or ciphertext fail closed without overwriting', async () => {
    for (const damage of ['missing-key', 'replaced-key', 'ciphertext']) {
      const f = fixture(), old = await f.store.save(result(), '');
      if (damage === 'missing-key') await mutate(f.idb, ['keys'], tx => tx.objectStore('keys').delete('data-key-v1'));
      if (damage === 'replaced-key') {
        const key = await webcrypto.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
        await mutate(f.idb, ['keys'], tx => tx.objectStore('keys').put(key, 'data-key-v1'));
      }
      if (damage === 'ciphertext') {
        const envelope = JSON.parse(old.raw); envelope.data = (envelope.data[0] === 'A' ? 'B' : 'A') + envelope.data.slice(1);
        await mutate(f.idb, ['records'], tx => tx.objectStore('records').put({version: 1, ciphertext: JSON.stringify(envelope)}, SLOT));
      }
      const damaged = (await f.recordStore.snapshot()).records[SLOT], code = damage === 'missing-key' ? 'key-missing' : 'decrypt-failed';
      await rejected(f.make().read(), code);
      await rejected(f.make().save(result(2), damaged), code);
      await rejected(f.make().clear(damaged), code);
      same((await f.recordStore.snapshot()).records[SLOT], damaged);
    }
  });
  await scenario('Authenticated corrupt manifests remain preserved until an explicit exact-CAS clear', async () => {
    const f = fixture(); await f.vault.write(PROFILE, 'synthetic profile marker', '');
    for (const text of [
      '{invalid json',
      JSON.stringify({format: C.COACHING_STORE_FORMAT, version: 2, results: []}),
      JSON.stringify({format: C.COACHING_STORE_FORMAT, version: 1, results: [result(), result()]}),
      JSON.stringify({format: C.COACHING_STORE_FORMAT, version: 1, results: Array.from({length: 13}, (_, i) => result(i + 1))}),
      'x'.repeat(C.MAX_COACHING_STORE_BYTES + 1),
    ]) {
      const expected = await f.vault.raw(SLOT) ?? '', corrupted = await f.vault.write(SLOT, text, expected);
      await assert.rejects(f.store.read(), error => error.code === 'invalid-data' && error.raw === corrupted); checks++;
      await rejected(f.store.save(result(20), corrupted), 'invalid-data');
      same(await f.vault.raw(SLOT), corrupted);
      same((await f.store.clear(corrupted)).results, []);
    }
    same(await f.vault.read(PROFILE), 'synthetic profile marker');
  });
  await scenario('Caller mutation during encryption cannot alter the validated saved record', async () => {
    const f = fixture(), before = await f.store.save(result(), ''), gate = delayedEncryption(), input = result(2);
    const delayed = f.make({subtle: gate.subtle}), pending = delayed.save(input, before.raw);
    await gate.started;
    input.reply.observationIds[0] = 'changed-after-validation'; input.event.kind = 'lift'; input.event.exerciseId = 'changed'; input.modelId = 'changed-model';
    gate.release(); const saved = await pending;
    same(saved.results[0], result(2));
    same((await f.make().read()).results[0], result(2));
  });
  await scenario('Default-owned coaching slot is retired by actual profile replacement and reset', async () => {
    const f = fixture();
    ok(V.VAULT_SLOTS.includes(SLOT));
    const profile = await f.vault.write(PROFILE, 'old profile', '');
    await f.store.save(result(), '');
    await f.vault.replace(PROFILE, 'restored profile', profile);
    same(await f.make().read(), {raw: '', results: []});
    same(await f.vault.read(PROFILE), 'restored profile');
    await f.store.save(result(2), '');
    await f.vault.reset();
    same(await f.make().read(), {raw: '', results: []});
    same((await f.recordStore.snapshot()).key, undefined);
    same((await f.recordStore.snapshot()).records[SLOT], null);
  });
  await scenario('Unavailable encrypted storage never reports a ready result', async () => {
    const store = C.createWorkoutCoachingStore({vault: null});
    await rejected(store.read(), 'unavailable');
    await rejected(store.list(), 'unavailable');
    await rejected(store.save(result(), ''), 'unavailable');
    await rejected(store.clear(''), 'unavailable');
  });
  await scenario('An unlocked plaintext legacy slot is not presented as an encrypted saved result', async () => {
    const f = fixture(), plaintext = JSON.stringify({format: C.COACHING_STORE_FORMAT, version: 1, results: [result()]});
    f.legacy.setItem(SLOT, plaintext);
    const store = f.make({restoreSafe: false, lock: undefined});
    await rejected(store.read(), 'invalid-data');
    await rejected(store.save(result(2), plaintext), 'invalid-data');
    await rejected(store.clear(plaintext), 'key-unavailable');
    same(f.legacy.getItem(SLOT), plaintext);
    same((await f.recordStore.snapshot()).key, undefined);
  });
  console.log(JSON.stringify({passed: true, scenarios: scenarios.length, checks, scope: 'Actual transpiled coaching store and transactional browser vault with fake-indexeddb and real WebCrypto. No mocked application storage, browser UI/GPU, physical-device or inference claim.'}));
})().catch(error => {console.error(error); process.exitCode = 1;});
