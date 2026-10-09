const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const {webcrypto} = require('node:crypto');
const {IDBFactory, IDBObjectStore} = require('fake-indexeddb');

// Exercise the application facade, including legacy recovery, through actual
// IndexedDB transactions and AES-GCM. No application implementation is mocked.
const modules = new Map();
function load(name) {
  if (name.endsWith('.json')) return JSON.parse(fs.readFileSync(path.join('lib', name), 'utf8'));
  if (modules.has(name)) return modules.get(name).exports;
  const module = {exports: {}};
  modules.set(name, module);
  const source = ts.transpileModule(fs.readFileSync(path.join('lib', name + '.ts'), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText;
  new Function('require', 'module', 'exports', source)(
    dependency => dependency.startsWith('./') ? load(dependency.slice(2)) : require(dependency),
    module, module.exports,
  );
  return module.exports;
}
const V = load('browser-vault');
const {createBrowserRecordStore} = load('browser-record-store');
const S = 'training-studio-v2', D = 'training-studio-setup-v1', slots = [S, D];
const SECRET = 'synthetic training marker 9D2C';
const random = n => webcrypto.getRandomValues(new Uint8Array(n));
const results = [];
let checks = 0;
function same(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }
function ok(value, message) { assert.ok(value, message); checks++; }
async function rejects(promise, code, message) {
  await assert.rejects(promise, error => error instanceof V.VaultError && error.code === code, message);
  checks++;
}
async function scenario(name, run) { await run(); results.push(name); console.log('PASS ' + name); }
function storage(values = {}) {
  const map = new Map(Object.entries(values));
  return {
    map,
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  };
}
function originLock() {
  let queue = Promise.resolve();
  return job => {
    const next = queue.then(job);
    queue = next.catch(() => undefined);
    return next;
  };
}
function fixture(values = {}) {
  const idb = new IDBFactory(), legacy = storage(values), lock = originLock();
  const notifications = [];
  const make = (overrides = {}) => V.createTransactionalVault({
    idb, legacy, slots, lock, restoreSafe: true, subtle: webcrypto.subtle, random,
    notify: () => notifications.push('changed'), ...overrides,
  });
  const store = createBrowserRecordStore({idb, legacy, slots});
  return {idb, legacy, lock, notifications, make, store, vault: make()};
}
async function open(idb, version = 2) {
  return new Promise((resolve, reject) => {
    const request = idb.open('movefield-vault', version);
    request.onupgradeneeded = () => {
      for (const name of version === 1 ? ['keys'] : ['keys', 'records', 'metadata']) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function mutate(idb, stores, job, version = 2) {
  const db = await open(idb, version);
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error ?? new Error('Injected transaction aborted'));
      job(tx);
    });
  } finally { db.close(); }
}
async function inspect(idb, store, key) {
  const db = await open(idb);
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly'), request = tx.objectStore(store).get(key);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function withPut(hook, job) {
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, ...args) { return hook.call(this, original, value, args); };
  try { return await job(); } finally { IDBObjectStore.prototype.put = original; }
}
async function ready(f) { same(await f.vault.read(S), null, 'empty vault reads empty'); }
function memoryKeys() {
  let key, transition;
  return {
    get: async () => key, put: async value => { key = value; }, remove: async () => { key = undefined; },
    getTransition: async () => transition, prepareTransition: async value => { transition = value; },
    finishTransition: async (value, keep = false) => { key = value ?? undefined; if (!keep) transition = undefined; },
    capture: () => ({key, transition: transition ? {...transition, obsolete: {...transition.obsolete}} : undefined}),
  };
}
async function legacyFixture() {
  const f = fixture(), keys = V.indexedDbKeyStore(f.idb);
  const vault = V.createVault({storage: f.legacy, keys, slots, subtle: webcrypto.subtle, random, restoreSafe: true, lock: f.lock});
  return {...f, keys, oldVault: vault};
}
function delayedEncryption() {
  let signal, release, first = true;
  const started = new Promise(resolve => { signal = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const subtle = new Proxy(webcrypto.subtle, {
    get(target, property) {
      if (property === 'encrypt') return async (...args) => {
        if (first) { first = false; signal(); await gate; }
        return target.encrypt(...args);
      };
      const value = target[property];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return {subtle, started, release};
}

(async () => {
  await scenario('First save commits non-extractable key and ciphertext together, then notifies', async () => {
    const f = fixture(), transactions = new Map(), events = [];
    const vault = f.make({notify: () => events.push('notify')});
    await withPut(function (original, value, args) {
      const tx = this.transaction;
      if (!transactions.has(tx)) {
        transactions.set(tx, new Set());
        tx.addEventListener('complete', () => events.push('commit'));
      }
      transactions.get(tx).add(this.name + ':' + args[0]);
      return original.call(this, value, ...args);
    }, async () => {
      const raw = await vault.write(S, SECRET, '');
      same(await vault.raw(S), raw, 'write returns the committed ciphertext');
      same(await f.make().read(S), SECRET, 'fresh facade reopens first saved record');
      ok(V.isSealed(raw) && !raw.includes(SECRET), 'record is sealed without plaintext');
    });
    ok([...transactions.values()].some(writes => writes.has('records:' + S) && writes.has('keys:data-key-v1')), 'first key and record use the same transaction');
    same(events, ['commit', 'notify', 'commit', 'notify'], 'notifications follow completed import and save transactions');
    const snapshot = await f.store.snapshot();
    same(snapshot.key.extractable, false, 'stored key is non-extractable');
    await assert.rejects(webcrypto.subtle.exportKey('raw', snapshot.key)); checks++;
    ok(!JSON.stringify(await inspect(f.idb, 'records', S)).includes(SECRET), 'actual record store contains no plaintext');
    ok(!JSON.stringify(await inspect(f.idb, 'metadata', 'record-state-v2')).includes(SECRET), 'actual metadata contains no plaintext');
  });

  await scenario('Legacy plaintext imports, verifies, cleans up and reopens without reimport', async () => {
    const f = fixture({[S]: SECRET, [D]: 'setup answers', preference: 'keep'});
    const read = await f.vault.readSnapshot(S);
    same(read.text, SECRET, 'migration returns original plaintext');
    ok(V.isSealed(read.raw), 'migration captures committed encrypted bytes');
    same(await f.make().read(D), 'setup answers', 'fresh instance reopens migrated setup');
    same(f.legacy.getItem(S), null, 'verified source is removed');
    same(f.legacy.getItem('preference'), 'keep', 'unrelated preferences are retained');
    same(f.notifications.length, 1, 'readback and reopen do not repeat import notifications');
    const snapshot = await f.store.snapshot();
    same(snapshot.migrated, true, 'verified migration remains durable');
    const before = snapshot.revision;
    await f.make().read(S);
    same((await f.store.snapshot()).revision, before, 'read-only reopen does not rewrite records');
  });

  await scenario('Legacy encrypted records retain their key and exact ciphertext during import', async () => {
    const f = await legacyFixture();
    const raw = await f.oldVault.write(S, SECRET);
    await f.oldVault.write(D, 'old encrypted setup');
    same(await f.vault.read(S), SECRET, 'legacy ciphertext opens after v2 import');
    same(await f.vault.raw(S), raw, 'encrypted import preserves exact original bytes');
    same(await f.make().read(D), 'old encrypted setup', 'fresh facade opens setup under preserved key');
    same(f.legacy.getItem(S), null, 'verified ciphertext source can be cleaned up');
  });

  const crashStorage = storage({preference: 'keep'}), crashKeys = memoryKeys();
  const oldVault = V.createVault({storage: crashStorage, keys: crashKeys, slots, subtle: webcrypto.subtle, random, restoreSafe: true});
  await oldVault.write(S, 'before interruption'); await oldVault.write(D, 'before draft');
  const boundaries = [];
  const capture = (name, text) => boundaries.push({name, text, values: Object.fromEntries(crashStorage.map), ...crashKeys.capture()});
  capture('before journal', 'before interruption');
  const prepare = crashKeys.prepareTransition, finish = crashKeys.finishTransition;
  const set = crashStorage.setItem, remove = crashStorage.removeItem;
  crashKeys.prepareTransition = async journal => { await prepare(journal); capture('after journal', 'before interruption'); };
  crashStorage.setItem = (slot, raw) => { set(slot, raw); if (slot === S) capture('after ciphertext', 'restored after interruption'); };
  crashStorage.removeItem = slot => { remove(slot); if (slot === D) capture('after obsolete cleanup', 'restored after interruption'); };
  crashKeys.finishTransition = async (key, keep) => {
    capture('before key commit', 'restored after interruption');
    await finish(key, keep); capture('after key and journal commit', 'restored after interruption');
  };
  await oldVault.replace(S, 'restored after interruption');
  same(boundaries.length, 6, 'all old persistence boundaries were captured from the actual legacy vault');
  for (const boundary of boundaries) {
    await scenario('Legacy restore interruption: ' + boundary.name, async () => {
      const f = fixture(boundary.values);
      await mutate(f.idb, ['keys'], tx => {
        if (boundary.key) tx.objectStore('keys').put(boundary.key, 'data-key-v1');
        if (boundary.transition) tx.objectStore('keys').put(boundary.transition, 'restore-transition-v1');
      }, 1);
      same(await f.make().read(S), boundary.text, 'fresh transactional facade recovers selected profile');
      same(await f.make().read(D), boundary.text === 'before interruption' ? 'before draft' : null, 'setup belongs to selected profile');
      same((await f.store.snapshot()).transition, undefined, 'recovery retires old journal before import');
      same((await f.store.snapshot()).key.extractable, false, 'recovered key remains non-extractable');
      same(f.legacy.getItem('preference'), 'keep', 'recovery retains unrelated preferences');
      const expected = await f.vault.raw(S);
      await f.vault.write(S, 'edit after recovery', expected);
      same(await f.make().read(S), 'edit after recovery', 'subsequent save survives a fresh reopen');
    });
  }

  await scenario('Pending legacy cleanup permits reads, refuses writes and imports after retry', async () => {
    const boundary = boundaries.find(item => item.name === 'after ciphertext');
    const f = fixture(boundary.values);
    await mutate(f.idb, ['keys'], tx => {
      tx.objectStore('keys').put(boundary.key, 'data-key-v1');
      tx.objectStore('keys').put(boundary.transition, 'restore-transition-v1');
    }, 1);
    const removeItem = f.legacy.removeItem;
    f.legacy.removeItem = slot => { if (slot === D) throw new DOMException('Removal denied', 'SecurityError'); return removeItem(slot); };
    same(await f.vault.read(S), 'restored after interruption', 'restored profile remains readable during denied cleanup');
    same(await f.make().read(D), null, 'obsolete setup remains hidden while cleanup is pending');
    same((await f.store.snapshot()).migrated, false, 'pending journal is not falsely imported');
    await rejects(f.vault.write(S, 'must not save'), 'key-unavailable', 'ordinary save waits for pending cleanup');
    same(f.notifications.length, 0, 'pending cleanup and rejected write do not announce a record commit');
    f.legacy.removeItem = removeItem;
    same(await f.make().read(S), 'restored after interruption', 'fresh retry finishes cleanup and import');
    same((await f.store.snapshot()).migrated, true, 'retry verifies complete migration');
    same((await f.store.snapshot()).transition, undefined, 'retry retires journal');
  });

  await scenario('Lost legacy/current keys preserve raw exports and require explicit replacement', async () => {
    const f = await legacyFixture(), raw = await f.oldVault.write(S, SECRET);
    await f.keys.remove();
    same(await f.vault.raw(S), raw, 'raw legacy ciphertext remains exportable before migration');
    await rejects(f.vault.read(S), 'key-missing', 'key-lost read is a real VaultError');
    same(await f.vault.raw(S), raw, 'failed read preserves imported ciphertext exactly');
    same(await f.vault.hasKey(), false, 'migration does not invent a replacement key');
    await rejects(f.vault.write(D, 'new draft'), 'key-missing', 'another slot cannot mint a key over encrypted records');
    const restored = await f.vault.replace(S, 'approved transfer', raw);
    same(await f.make().read(S), 'approved transfer', 'explicit replacement restores a readable profile');
    same(await f.vault.raw(S), restored, 'replacement returns committed ciphertext');
    await f.keys.remove();
    await rejects(f.make().read(S), 'key-missing', 'current database key loss is reported');
    same(await f.vault.raw(S), restored, 'current key loss still permits raw export');
    await rejects(f.vault.write(S, 'unsafe edit', restored), 'key-missing', 'current key loss cannot silently replace the key');
    same((await f.store.snapshot()).key, undefined, 'failed edits leave key missing');
    await f.vault.replace(S, 'second transfer', restored);
    same(await f.make().read(S), 'second transfer', 'explicit replacement also recovers current key loss');
  });

  await scenario('Unreadable encrypted setup is retained without preventing valid main reads and saves', async () => {
    const f = await legacyFixture(), raw = await f.oldVault.write(S, SECRET);
    await f.oldVault.write(D, 'setup');
    const broken = JSON.stringify({...JSON.parse(f.legacy.getItem(D)), iv: 'AAAA'});
    f.legacy.setItem(D, broken);
    same(await f.vault.read(S), SECRET, 'invalid setup does not block main migration/read');
    await rejects(f.vault.read(D), 'unknown-format', 'invalid setup returns actionable format error');
    same(await f.vault.raw(D), broken, 'setup bytes remain preserved');
    await f.vault.write(S, 'main edit', raw);
    same(await f.make().read(S), 'main edit', 'main saves continue without repairing setup');
    same(await f.make().raw(D), broken, 'main save cannot replace invalid setup');
    const copied = (await f.store.snapshot()).records[S];
    await mutate(f.idb, ['records'], tx => tx.objectStore('records').put({version: 1, ciphertext: copied}, D));
    await rejects(f.make().read(D), 'decrypt-failed', 'slot binding detects unreadable substituted setup');
    same(await f.make().read(S), 'main edit', 'setup decryption failure does not block main');
  });

  await scenario('Malformed sealed legacy setup never blocks valid main profile recovery', async () => {
    const f = await legacyFixture();
    await f.oldVault.write(S, SECRET);
    const broken = '{"v":1,"alg":"aes-256-gcm","iv":';
    f.legacy.setItem(D, broken);
    same(await f.vault.read(S), SECRET, 'malformed optional setup does not block valid main profile');
    same(await f.vault.raw(D), broken, 'damaged optional draft remains exportable byte for byte');
    await rejects(f.vault.read(D), 'unknown-format', 'malformed optional setup reports an actionable error');
    same(await f.make().read(S), SECRET, 'fresh reopen still recovers valid main profile');
  });

  await scenario('Stale tab edits and restores refuse conflicts while refreshed tabs use the current key', async () => {
    const f = fixture(); await f.vault.write(S, 'initial');
    const sibling = f.make(), stale = (await sibling.readSnapshot(S)).raw;
    await f.vault.write(S, 'newer edit', stale);
    const notices = f.notifications.length;
    await rejects(sibling.write(S, 'stale edit', stale), 'conflict', 'stale expected ciphertext cannot overwrite another tab');
    await rejects(sibling.replace(S, 'stale transfer', stale), 'conflict', 'stale restore cannot rotate current key');
    same(f.notifications.length, notices, 'rejected stale operations do not notify');
    same(await f.make().read(S), 'newer edit', 'latest profile remains intact');
    const current = await sibling.raw(S);
    await f.vault.replace(S, 'new key transfer', current);
    same(await sibling.read(S), 'new key transfer', 'already open tab refreshes the current key');
    await sibling.write(S, 'edit under new key', await sibling.raw(S));
    same(await f.make().read(S), 'edit under new key', 'refreshed sibling write reopens under replaced key');
  });

  for (const operation of ['write', 'replace']) {
    await scenario('In-flight ' + operation + ' conflicts with a replacement committed during encryption', async () => {
      const f = fixture(); await f.vault.write(S, 'initial');
      const expected = await f.vault.raw(S), delayed = delayedEncryption();
      const pending = f.make({subtle: delayed.subtle})[operation](S, 'captured stale result', expected);
      await delayed.started;
      // Simulate an unmanaged writer outside the normal origin lock. Database
      // compare-and-commit still has to protect the captured encrypted result.
      await f.make({lock: job => job()}).replace(S, 'external replacement', expected);
      const notices = f.notifications.length;
      delayed.release();
      await rejects(pending, 'conflict', 'captured snapshot is compared again at commit');
      same(f.notifications.length, notices, 'in-flight conflict never announces a save');
      same(await f.make().read(S), 'external replacement', 'external committed replacement remains readable');
    });
  }

  await scenario('First-key quota abort leaves no partial record or orphaned key and sends no save notice', async () => {
    const f = fixture(); await ready(f);
    const before = await f.store.snapshot(), notices = f.notifications.length;
    let recordQueued = false;
    await withPut(function (original, value, args) {
      if (this.name === 'records' && args[0] === S && value.ciphertext !== null) recordQueued = true;
      if (this.name === 'keys' && args[0] === 'data-key-v1') throw new DOMException('Injected key quota', 'QuotaExceededError');
      return original.call(this, value, ...args);
    }, async () => rejects(f.vault.write(S, SECRET, ''), 'key-unavailable', 'key persistence quota rejects first save'));
    ok(recordQueued, 'quota occurred after encrypted record was queued');
    const reopened = await f.store.snapshot();
    same(reopened.records[S], null, 'queued ciphertext rolls back');
    same(reopened.key, undefined, 'new key rolls back with ciphertext');
    same(reopened.revision, before.revision, 'aborted save does not advance revision');
    same(f.notifications.length, notices, 'aborted first save never notifies');
    same(await f.make().read(S), null, 'fresh facade sees empty state after abort');
    await f.vault.write(S, 'retry', '');
    same(await f.make().read(S), 'retry', 'quota retry can create a consistent key and record');
  });

  await scenario('Abort after request success and restore quota preserve the current profile', async () => {
    const f = fixture(); await f.vault.write(S, SECRET); await f.vault.write(D, 'draft');
    const before = await f.store.snapshot(), notices = f.notifications.length;
    let requestSucceeded = false;
    await withPut(function (original, value, args) {
      const request = original.call(this, value, ...args);
      if (this.name === 'records' && args[0] === S) request.addEventListener('success', () => { requestSucceeded = true; this.transaction.abort(); });
      return request;
    }, async () => rejects(f.vault.write(S, 'never committed', before.records[S]), 'key-unavailable', 'request success cannot acknowledge an aborted transaction'));
    ok(requestSucceeded, 'abort happened after actual ciphertext request success');
    same((await f.store.snapshot()).records, before.records, 'aborted write preserves every record');
    same(f.notifications.length, notices, 'aborted write sends no notice');
    await withPut(function (original, value, args) {
      if (this.name === 'keys') throw new DOMException('Injected restore quota', 'QuotaExceededError');
      return original.call(this, value, ...args);
    }, async () => rejects(f.vault.replace(S, 'uncommitted transfer', before.records[S]), 'key-unavailable', 'restore key quota is reported'));
    const after = await f.store.snapshot();
    same(after.records, before.records, 'restore quota rolls back replacement and retired setup');
    same(after.keyRevision, before.keyRevision, 'restore quota does not advance key generation');
    same(await f.make().read(S), SECRET, 'old key still opens original profile');
    same(await f.make().read(D), 'draft', 'original setup remains readable');
    same(f.notifications.length, notices, 'failed restore sends no notice');
  });

  await scenario('Failed migration preserves every legacy source and remains retryable', async () => {
    const f = fixture({[S]: SECRET, [D]: 'legacy draft'});
    await withPut(function (original, value, args) {
      if (this.name === 'metadata') throw new DOMException('Injected import quota', 'QuotaExceededError');
      return original.call(this, value, ...args);
    }, async () => rejects(f.vault.read(S), 'key-unavailable', 'aborted migration read reports vault persistence error'));
    same(f.legacy.getItem(S), SECRET, 'failed migration retains original main');
    same(f.legacy.getItem(D), 'legacy draft', 'failed migration retains original setup');
    const after = await f.store.snapshot();
    same(after.key, undefined, 'failed migration leaves no orphaned key');
    same(after.migrated, false, 'failed migration cannot mark itself complete');
    same(f.notifications.length, 0, 'failed migration sends no notice');
    same(await f.make().read(S), SECRET, 'fresh retry migrates retained legacy source');
  });

  await scenario('Discard/reset tombstones prevent resurrection when legacy cleanup is denied', async () => {
    const f = fixture({[S]: SECRET, [D]: 'retained draft', preference: 'keep'});
    f.legacy.removeItem = () => { throw new DOMException('Denied cleanup', 'SecurityError'); };
    same(await f.vault.read(S), SECRET, 'verified migration succeeds despite cleanup denial');
    same(f.legacy.getItem(D), 'retained draft', 'denied legacy cleanup leaves original bytes');
    await f.vault.discard(D);
    same(await f.make().read(D), null, 'fresh facade honors discarded setup tombstone');
    ok((await f.store.snapshot()).tombstones.includes(D), 'discard has a durable deletion marker');
    await f.vault.reset();
    const reset = await f.store.snapshot();
    same(reset.records, {[S]: null, [D]: null}, 'reset retires all ciphertext');
    same(reset.tombstones, slots, 'reset stores all deletion markers');
    same(reset.key, undefined, 'reset retires key atomically');
    same(reset.migrated, true, 'reset remains authoritative over legacy leftovers');
    same(await f.make().read(S), null, 'legacy main cannot reappear after fresh reset reopen');
    same(await f.make().read(D), null, 'legacy setup cannot reappear after reset');
    same(f.legacy.getItem('preference'), 'keep', 'reset remains scoped to vault slots');
    await f.vault.write(S, 'fresh after reset', '');
    same(await f.make().read(S), 'fresh after reset', 'new profile remains readable with retained old plaintext');
    same(await f.make().read(D), null, 'new profile does not revive retired setup');
  });

  await scenario('Migrated IndexedDB reads, replacement and reset work with all legacy access denied', async () => {
    const f = fixture(); await f.vault.write(S, SECRET);
    const expected = await f.vault.raw(S);
    f.legacy.getItem = f.legacy.removeItem = f.legacy.setItem = () => { throw new DOMException('Legacy access denied', 'SecurityError'); };
    same(await f.make().read(S), SECRET, 'migrated reads do not depend on localStorage');
    await f.vault.replace(S, 'replacement with denied legacy', expected);
    same(await f.make().read(S), 'replacement with denied legacy', 'approved replacement is independent of denied legacy');
    await f.vault.reset();
    same(await f.make().read(S), null, 'reset does not depend on denied legacy access');
  });

  await scenario('Large ciphertext exceeding five million characters saves and reopens exactly', async () => {
    const f = fixture(), text = 'long workout history '.repeat(260_000) + '\u{1F4AA}' + SECRET;
    const raw = await f.vault.write(S, text, '');
    ok(raw.length > 5_000_000, 'fixture exceeds the localStorage-sized ciphertext boundary');
    same((await f.store.snapshot()).records[S].length, raw.length, 'actual stored ciphertext is not truncated');
    ok((await f.make().read(S)) === text, 'fresh facade reopens exact large Unicode text');
    same(f.legacy.getItem(S), null, 'large ciphertext never enters legacy localStorage');
  });

  await scenario('Without Web Locks existing reads/exports work and all mutations refuse before saving', async () => {
    const f = fixture(); await f.vault.write(S, SECRET);
    const raw = await f.vault.raw(S), before = await f.store.snapshot(), notices = f.notifications.length;
    const unlocked = f.make({lock: undefined, restoreSafe: false});
    same(await unlocked.read(S), SECRET, 'current encrypted read remains available without locks');
    same(await unlocked.raw(S), raw, 'current raw export remains available without locks');
    for (const attempt of [() => unlocked.write(S, 'unsafe'), () => unlocked.replace(S, 'unsafe'), () => unlocked.discard(S), () => unlocked.reset()]) {
      await rejects(attempt(), 'key-unavailable', 'unsupported mutation is a real vault error');
    }
    same((await f.store.snapshot()).records, before.records, 'all denied mutations preserve current ciphertext');
    same((await f.store.snapshot()).revision, before.revision, 'all denied mutations preserve revision');
    same(f.notifications.length, notices, 'unsupported mutations do not notify');
    const plaintext = fixture({[S]: SECRET}), noLockPlain = plaintext.make({lock: undefined, restoreSafe: false});
    same(await noLockPlain.read(S), SECRET, 'legacy plaintext read remains available');
    same((await plaintext.store.snapshot()).migrated, false, 'unlocked read does not perform migration');
    same(await noLockPlain.hasKey(), false, 'unlocked read does not create a key');
    same(plaintext.notifications.length, 0, 'unlocked legacy read does not announce a commit');
    const boundary = boundaries.find(item => item.name === 'after ciphertext'), pending = fixture(boundary.values);
    await mutate(pending.idb, ['keys'], tx => {
      tx.objectStore('keys').put(boundary.key, 'data-key-v1');
      tx.objectStore('keys').put(boundary.transition, 'restore-transition-v1');
    }, 1);
    await rejects(pending.make({lock: undefined, restoreSafe: false}).read(S), 'key-unavailable', 'unlocked read cannot activate a pending restore key');
    same((await pending.store.snapshot()).transition.after, boundary.transition.after, 'unlocked recovery retains both recoverable keys');
  });

  await scenario('Notification failure does not undo a committed readable save', async () => {
    const f = fixture(), vault = f.make({notify: () => { throw new Error('Broadcast unavailable'); }});
    await vault.write(S, SECRET, '');
    same(await f.make().read(S), SECRET, 'saved data remains readable when broadcasting is unavailable');
  });

  console.log(`PASS transactional browser vault: ${results.length} scenarios, ${checks} checks (actual transpiled app, fake-indexeddb, real WebCrypto)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
