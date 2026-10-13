const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash, randomBytes } = require('node:crypto'), ts = require('typescript');
const { createSqliteHarness } = require('./lib/native-sqlite.cjs');
process.chdir(path.resolve(__dirname, '..'));
let checks = 0, scenarios = 0, kitNumber = 0;
// A pending async fixture without a live native/timer handle must never let
// Node exit0 before the final scenario/result. Bound the suite explicitly.
const suiteDeadline = setTimeout(() => {console.error('Native Qwen file suite did not finish'); process.exit(1);}, 120_000);
const same = (a, b, message) => { assert.deepEqual(a, b, message); checks++; };
const ok = (value, message) => { assert.ok(value, message); checks++; };
const hash = value => createHash('sha256').update(value).digest('hex');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
async function rejects(promise, code, message) {
  await assert.rejects(promise, error => { same(error.code, code, message); ok(error instanceof Q.NativeQwenFilesError, message + ': typed error'); return true; }); checks++;
}
function load(relative, mocks = {}, modules = new Map()) {
  if (modules.has(relative)) return modules.get(relative).exports;
  const filename = path.resolve(relative), module = { exports: {} }; modules.set(relative, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (mocks[name]) return mocks[name];
    if (name.startsWith('./shared/')) return load(`lib/${name.slice('./shared/'.length)}.ts`, mocks, modules);
    if (name.startsWith('.')) {
      const next = path.resolve(path.dirname(filename), name);
      return name.endsWith('.json') ? JSON.parse(fs.readFileSync(next, 'utf8')) : load(path.relative(process.cwd(), next + '.ts'), mocks, modules);
    }
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const Q = load('lib/qwen-native-files.ts');
const candidates = JSON.parse(fs.readFileSync('lib/qwen-assets.json')).models;
function fixture(id = 'native-test-model', variant = 0) {
  const bytes = [Uint8Array.from({ length: Q.NATIVE_QWEN_CHUNK_BYTES * 2 + 217 }, (_, i) => (i * 31 + variant) % 251),
    new TextEncoder().encode('{"synthetic":"漢字"}'), new TextEncoder().encode('{"template":"test only"}')];
  const model = { ...candidates.find(m => m.platform === 'android'), id, label: 'Synthetic test only',
    modelRevision: (variant ? 'b' : 'a').repeat(40) };
  model.assets = bytes.map((value, i) => {
    const assetPath = i === 0 ? '0_6b/xnnpack/test.pte' : i === 1 ? 'tokenizer.json' : 'tokenizer_config.json';
    return { path: assetPath, url: `https://huggingface.co/${model.repository}/resolve/${model.modelRevision}/${assetPath}`,
      bytes: value.length, sha256: hash(value), verification: 'synthetic test only' };
  });
  model.downloadBytes = bytes.reduce((sum, value) => sum + value.length, 0);
  return { model, bytes };
}
function mockFilesystem() {
  const nodes = new Map([['file:///cache', { type: 'directory' }], ['file:///unrelated-training', { type: 'file', bytes: new TextEncoder().encode('training sentinel') }]]);
  const stats = { fsLoads: 0, dbLoads: 0, network: [], tasks: [], maxRead: 0, handles: 0, closed: 0, yields: 0 };
  const fault = { deletePath: null, readOversize: false, readThrows: false, mode: null, free: 2 ** 40, cancelThrows: false };
  const sources = new Map();
  const join = (...parts) => parts.map((part, i) => (typeof part === 'string' ? part : part.uri).replace(i ? /^\/+|\/+$/g : /\/+$/g, '')).join('/');
  const parent = uri => uri.slice(0, uri.lastIndexOf('/'));
  function makeDirectory(uri, intermediate) {
    if (nodes.has(uri)) { if (nodes.get(uri).type !== 'directory') throw Error('not directory'); return; }
    const above = parent(uri);
    if (!nodes.has(above)) { if (!intermediate) throw Error('missing parent'); makeDirectory(above, true); }
    nodes.set(uri, { type: 'directory' });
  }
  class Directory {
    constructor(...parts) { this.uri = join(...parts); }
    get exists() { return nodes.get(this.uri)?.type === 'directory'; }
    get name() { return this.uri.slice(this.uri.lastIndexOf('/') + 1); }
    create(options = {}) { if (this.exists && !options.idempotent) throw Error('exists'); makeDirectory(this.uri, options.intermediates); }
    list() { if (!this.exists) throw Error('missing dir'); return [...nodes].filter(([uri]) => parent(uri) === this.uri).map(([uri, node]) => node.type === 'directory' ? new Directory(uri) : new File(uri)); }
    delete() { if (fault.deletePath && this.uri.includes(fault.deletePath)) throw Error('disk deletion failed'); for (const uri of [...nodes.keys()]) if (uri === this.uri || uri.startsWith(this.uri + '/')) nodes.delete(uri); }
  }
  class File {
    constructor(...parts) { this.uri = join(...parts); }
    get exists() { return nodes.get(this.uri)?.type === 'file'; }
    get size() { return this.exists ? nodes.get(this.uri).bytes.length : null; }
    get name() { return this.uri.slice(this.uri.lastIndexOf('/') + 1); }
    open(mode) {
      same(mode, 'r', 'actual adapter always opens read-only'); if (!this.exists) throw Error('missing file');
      const target = this.uri; let offset = 0, closed = false; stats.handles++;
      return { size: this.size, readBytes(length) {
        ok(!closed, 'read handle remains open'); ok(length <= Q.NATIVE_QWEN_CHUNK_BYTES, 'bounded native read request'); stats.maxRead = Math.max(stats.maxRead, length);
        if (fault.readThrows) throw Error('native read failed');
        const data = nodes.get(target)?.bytes; if (!data) return new Uint8Array();
        if (fault.readOversize) return new Uint8Array(length + 1);
        const value = data.slice(offset, offset + length); offset += value.length; return value;
      }, close() { ok(!closed, 'native handle closed once'); closed = true; stats.closed++; } };
    }
    static createDownloadTask(url, destination, options) {
      same(options.sessionType, 'foreground', 'native adapter does not claim background restart recovery');
      const entry = { url, destination: destination.uri, options, cancelled: 0, released: 0, pending: null };
      stats.tasks.push(entry);
      function write(data) { if (!nodes.has(parent(destination.uri))) makeDirectory(parent(destination.uri), true); nodes.set(destination.uri, { type: 'file', bytes: data.slice() }); }
      return { downloadAsync() {
        stats.network.push(url); const source = sources.get(url); assert.ok(source, 'only exact pinned synthetic URL is requested');
        let data = source.slice(); const mode = fault.mode;
        if (mode === 'mutate') data[0] ^= 255;
        if (mode === 'truncate') data = data.slice(0, -1);
        if (mode === 'extra') { const extra = new Uint8Array(data.length + 1); extra.set(data); data = extra; }
        if (mode === 'hang') {
          write(data.slice(0, 97)); options.onProgress({ bytesWritten: 97, totalBytes: -1 });
          entry.pending = deferred(); entry.finish = () => { write(data); options.onProgress({ bytesWritten: data.length, totalBytes: data.length }); entry.pending.resolve(new File(destination.uri)); };
          return entry.pending.promise;
        }
        write(data);
        options.onProgress({ bytesWritten: mode === 'bad-progress' ? source.length + 1 : data.length, totalBytes: -1 });
        if (mode === 'fail') return Promise.reject(Error('transport failed'));
        if (options.signal.aborted) { const error = Error('aborted'); error.name = 'AbortError'; return Promise.reject(error); }
        return Promise.resolve(new File(destination.uri));
      }, cancel() { entry.cancelled++; if (fault.cancelThrows) throw Error('cancel failed'); }, release() { entry.released++; } };
    }
  }
  const filesystem = { Directory, File, FileMode: { ReadOnly: 'r' }, Paths: { cache: new Directory('file:///cache'), get availableDiskSpace() { return fault.free; } } };
  return { filesystem, nodes, stats, fault, sources };
}
const harnesses = [];
function kit(f = fixture(), shared = null) {
  const h = shared?.h ?? createSqliteHarness(), env = shared?.env ?? mockFilesystem();
  if (!shared) harnesses.push(h);
  f.model.assets.forEach((asset, i) => env.sources.set(asset.url, f.bytes[i]));
  const mocks = { 'expo-crypto': { getRandomBytes: n => new Uint8Array(randomBytes(n)) },
    'react-native': { Platform: { OS: 'android' } }, './shared/qwen-native-files': Q };
  const A = load('mobile/src/qwen-file-cache.ts', mocks), namespace = shared?.namespace ?? `native-qwen-tests-${++kitNumber}`;
  const adapter = A.createExpoQwenFileAdapter({ models: [f.model], namespace,
    filesystem: async () => { env.stats.fsLoads++; return env.filesystem; }, open: async () => { env.stats.dbLoads++; return h.db; } });
  const manager = Q.createNativeQwenFiles({ models: [f.model], ...adapter,
    random: length => new Uint8Array(randomBytes(length)),
    yieldTask: async () => { env.stats.yields++; await Promise.resolve(); }, networkIdleMs: 25 });
  return { f, h, env, namespace, adapter, manager, consent: manager.offer(f.model.id), signal: () => new AbortController().signal };
}
const pointer = k => k.h.native.prepare('SELECT * FROM qwen_file_models WHERE model_id=?').get(k.f.model.id);
const attempts = k => k.h.native.prepare('SELECT * FROM qwen_file_attempts WHERE model_id=?').all(k.f.model.id);
const pathsFor = (k, receipt) => receipt.assets.map((_, i) => k.adapter.store.destination(receipt.modelId, receipt.attempt, i));
const readHashes = k => k.manager.withVerifiedPaths(k.f.model.id, k.signal(), async paths => {
  const values = [paths.modelPath, paths.tokenizerPath, paths.tokenizerConfigPath];
  ok(Object.isFrozen(paths), 'runtime paths are frozen'); return values.map(uri => hash(k.env.nodes.get(uri).bytes));
});
async function scenario(name, run) { await run(); scenarios++; console.log('PASS ' + name); }

(async () => {
  await scenario('catalog, frozen exact consent and no automatic network', async () => {
    const k = kit(), actual = Q.createNativeQwenFiles({ models: candidates, ...k.adapter, random: n => new Uint8Array(randomBytes(n)) });
    same(actual.offers.length, 3, 'three native candidate tiers'); same(actual.offers.map(o => o.downloadBytes), [517117480, 1315169576, 2693078056], 'exact public byte totals');
    same(k.env.stats.fsLoads, 0, 'factory does not load filesystem'); same(k.env.stats.dbLoads, 0, 'factory does not open database');
    same(await k.manager.status(k.f.model.id), null, 'empty native cache'); same(k.env.stats.network.length, 0, 'status performs no network');
    ok(Object.isFrozen(k.consent) && Object.isFrozen(k.consent.assets) && k.consent.assets.every(Object.isFrozen), 'immutable review');
    const fingerprint = k.consent.fingerprint; k.f.model.assets[0].sha256 = '0'.repeat(64);
    same(k.manager.offer(k.f.model.id).fingerprint, fingerprint, 'input mutation cannot alter pending consent');
    for (const changed of [{ downloadBytes: 0 }, { fingerprint: '0'.repeat(64) }]) await rejects(k.manager.download({ ...k.consent, ...changed }, { signal: k.signal() }), 'consent', 'exact tuple required');
    await rejects(k.manager.download({ ...k.consent, modelId: 'off' }, { signal: k.signal() }), 'unknown-model', 'Off cannot be a destination');
    same(k.env.stats.network.length, 0, 'invalid consent starts no native task'); same(attempts(k).length, 0, 'invalid consent writes no attempt');
    for (const change of [m => m.assets[0].path = '../escape.pte', m => m.assets[0].url += '?mutable=1', m => m.modelRevision = 'main',
      m => m.assets[0].sha256 = 'bad', m => m.downloadBytes++, m => m.assets.push(m.assets[0]), m => m.assets[1].path = 'bad.json', m => m.id = '..']) {
      const f = fixture(); change(f.model); assert.throws(() => Q.createNativeQwenOffer(f.model), error => error.code === 'manifest'); checks++;
    }
    same(Q.nativeQwenReceiptMatches({ version: 1, modelId: k.consent.modelId, fingerprint, attempt: 'a'.repeat(32), downloadBytes: k.consent.downloadBytes, assets: [null, null, null] }, k.consent), false, 'malformed receipt does not dereference null assets');
  });
  await scenario('actual Expo adapter, bounded hashes, real SQLite commit and reopen', async () => {
    const k = kit(); const result = await k.manager.download(k.consent, { signal: k.signal(), onProgress() { throw Error('detached observer'); } });
    same(result.reused, false, 'first save downloads'); same(result.cleanupPending, false, 'complete cleanup'); same(k.env.stats.network.length, 3, 'three files');
    same(await readHashes(k), k.f.bytes.map(hash), 'all files pass independent SHA-256'); same(k.env.stats.maxRead, Q.NATIVE_QWEN_CHUNK_BYTES, 'largest native read stays bounded');
    same(k.env.stats.handles, k.env.stats.closed, 'all native handles close'); ok(k.env.stats.tasks.every(task => task.released === 1), 'all download handles release');
    ok(pathsFor(k, result.receipt).every(uri => /\/[0-9a-f]{32}\/[012]\.(pte|json)$/.test(uri)), 'native paths are opaque and independent of archive paths');
    same(attempts(k).length, 1, 'one complete attempt'); same(pointer(k).epoch, 1, 'atomic first pointer epoch');
    const fresh = kit(k.f, k); same(await fresh.manager.status(k.f.model.id), result.receipt, 'fresh adapter reads committed receipt');
    same((await fresh.manager.download(fresh.consent, { signal: fresh.signal() })).reused, true, 'verified reuse'); same(k.env.stats.network.length, 3, 'reuse never requests network');
    same(hash(k.env.nodes.get('file:///unrelated-training').bytes), hash(new TextEncoder().encode('training sentinel')), 'training storage untouched');
    ok(k.h.controller.calls.every(call => !/training_|encrypted-records/.test(call.sql)), 'only model metadata database statements');
  });
  for (const mode of ['mutate', 'truncate', 'extra', 'bad-progress']) await scenario('integrity rejects ' + mode, async () => {
    const k = kit(); k.env.fault.mode = mode;
    await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'integrity', mode + ' cannot publish');
    await tick(); await k.manager.status(k.f.model.id);
    same(pointer(k), undefined, 'no complete pointer'); same(attempts(k).length, 0, 'failed staged attempt removed');
    ok(k.env.stats.tasks.every(task => task.released === 1), 'failed native tasks release');
  });
  await scenario('same-size damage is detected before runtime callback or reuse', async () => {
    const k = kit(), result = await k.manager.download(k.consent, { signal: k.signal() });
    k.env.nodes.get(pathsFor(k, result.receipt)[0]).bytes[0] ^= 255;
    ok(await k.manager.status(k.f.model.id), 'status checks receipt/existence/size without claiming a fresh full hash'); let called = false;
    await rejects(k.manager.withVerifiedPaths(k.f.model.id, k.signal(), async () => { called = true; }), 'integrity', 'damaged file rejected before path callback');
    same(called, false, 'no unverified runtime paths'); await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'integrity', 'reuse rehashes every byte');
    same(k.env.stats.network.length, 3, 'corrupt reuse does not silently download'); same(k.env.stats.handles, k.env.stats.closed, 'tamper failures close handles');
    await k.manager.remove(k.f.model.id); await k.manager.download(k.consent, { signal: k.signal() }); same(await readHashes(k), k.f.bytes.map(hash), 'explicit deletion+retry repairs bytes');
  });
  await scenario('cache eviction reports unavailable and explicit retry repairs it', async () => {
    const k = kit(), saved = await k.manager.download(k.consent, { signal: k.signal() });
    k.env.nodes.delete(pathsFor(k, saved.receipt)[1]); same(await k.manager.status(k.f.model.id), null, 'evicted cache not ready');
    await rejects(k.manager.withVerifiedPaths(k.f.model.id, k.signal(), async () => {}), 'not-downloaded', 'eviction blocks runtime');
    await k.manager.download(k.consent, { signal: k.signal() }); same(await readHashes(k), k.f.bytes.map(hash), 'retry replaces incomplete cache'); same(attempts(k).length, 1, 'evicted old generation removed');
  });
  await scenario('free space includes complete new files and platform temporary space', async () => {
    const k = kit(); k.env.fault.free = k.consent.downloadBytes * 1.1 + 16 * 1024 * 1024;
    await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'storage', 'whole model plus temporary largest-file allowance required');
    same(k.env.stats.network.length, 0, 'low-space preflight sends no requests');
    k.env.fault.free = NaN; await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'storage', 'invalid free-space estimate cannot authorize bytes');
  });
  await scenario('cancel before start and while hashing never publishes', async () => {
    const k = kit(), before = new AbortController(); before.abort();
    await rejects(k.manager.download(k.consent, { signal: before.signal }), 'cancelled', 'already cancelled'); same(k.env.stats.network.length, 0, 'pre-cancel no network');
    const during = new AbortController(); await rejects(k.manager.download(k.consent, { signal: during.signal, onProgress(p) { if (p.phase === 'verifying') during.abort(); } }), 'cancelled', 'cancel before verification');
    same(attempts(k).length, 0, 'cancelled files removed'); same(pointer(k), undefined, 'no pointer on cancel');
    const hashCancel = new AbortController();
    const hashing = Q.createNativeQwenFiles({ models: [k.f.model], ...k.adapter, random: n => new Uint8Array(randomBytes(n)),
      yieldTask: async () => hashCancel.abort() });
    await rejects(hashing.download(hashing.offer(k.f.model.id), { signal: hashCancel.signal }), 'cancelled', 'cancel between bounded hash reads');
    same(k.env.stats.handles, k.env.stats.closed, 'hash cancellation closes every native handle'); same(attempts(k).length, 0, 'hash cancellation removes settled staging');
  });
  await scenario('hung native cancel, late completion quarantine, bounded retries and delete', async () => {
    const k = kit(), controller = new AbortController(), progress = []; k.env.fault.mode = 'hang'; k.env.fault.cancelThrows = true;
    const running = k.manager.download(k.consent, { signal: controller.signal, onProgress: p => progress.push({ ...p }) });
    while (!k.env.stats.tasks[0]?.pending) await tick();
    controller.abort(); await rejects(running, 'cancelled', 'own abort race does not await broken native cancel');
    same(attempts(k).length, 1, 'unsettled native writer kept quarantined'); const count = progress.length;
    await rejects(k.manager.status(k.f.model.id), 'cleanup', 'status admits transfer has not stopped');
    await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'cleanup', 'another retry cannot accumulate hung writer directories');
    same(k.env.stats.network.length, 1, 'no second hung native task');
    same(await k.manager.remove(k.f.model.id), { cleanupPending: true }, 'delete retires pointer but reports protected partial files'); same(pointer(k).deleted, 1, 'durable deletion tombstone');
    k.env.stats.tasks[0].finish(); await tick(); same(progress.length, count, 'late callbacks suppressed');
    same(await k.manager.status(k.f.model.id), null, 'late completion cannot restore deleted pointer'); same(attempts(k).length, 0, 'settled orphan reclaimed');
    k.env.fault.mode = null; k.env.fault.cancelThrows = false;
    await k.manager.download(k.consent, { signal: k.signal() }); same(await readHashes(k), k.f.bytes.map(hash), 'retry after acknowledgement is safe');
    ok(k.env.stats.tasks.every(task => task.released === 1), 'release attempted even when cancel throws');
  });
  await scenario('idle timeout isolates a hung native writer and no background resume claim', async () => {
    const k = kit(); k.env.fault.mode = 'hang'; await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'network', 'native idle timeout bounded');
    same(attempts(k).length, 1, 'timed-out writer stays isolated'); k.env.stats.tasks[0].finish(); await tick();
    same(await k.manager.status(k.f.model.id), null, 'timeout completion not published'); same(attempts(k).length, 0, 'timeout orphan cleaned');
  });
  await scenario('atomic replacement rollback preserves old model files', async () => {
    const k = kit(), old = await k.manager.download(k.consent, { signal: k.signal() }), next = kit(fixture(k.f.model.id, 1), k);
    let armed = true; k.h.controller.fail = call => armed && call.method === 'runAsync' && /INSERT OR REPLACE INTO qwen_file_models/.test(call.sql) && (armed = false, true);
    await rejects(next.manager.download(next.consent, { signal: next.signal() }), 'storage', 'pointer mutation abort'); k.h.controller.fail = null;
    same(pointer(k).attempt, old.receipt.attempt, 'old pointer restored by real SQLite rollback'); same(await readHashes(k), k.f.bytes.map(hash), 'old exact bytes retained'); same(attempts(k).length, 1, 'aborted replacement reclaimed');
    await next.manager.download(next.consent, { signal: next.signal() }); same(await readHashes(next), next.f.bytes.map(hash), 'replacement retry commits'); same(attempts(k).length, 1, 'old generation removed after commit');
  });
  await scenario('committed pointer survives failed readback acknowledgement', async () => {
    const k = kit(); let arm = false;
    k.h.controller.fail = call => { if (/INSERT OR REPLACE INTO qwen_file_models/.test(call.sql)) arm = true; return false; };
    k.h.controller.mutateRead = call => {
      if (arm && call.scope === 'main' && /SELECT epoch, deleted, attempt, receipt FROM qwen_file_models/.test(call.sql) && call.value) {
        arm = false; return { ...call.value, receipt: '{damaged readback only' };
      }
      return call.value;
    };
    await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'storage', 'postcommit acknowledgement failure');
    k.h.controller.fail = null; k.h.controller.mutateRead = null;
    ok(await k.manager.status(k.f.model.id), 'actual committed pointer retained despite failed acknowledgement');
    same(await readHashes(k), k.f.bytes.map(hash), 'discard cannot delete committed bytes'); same(attempts(k).length, 1, 'completed current attempt preserved');
  });
  await scenario('Cancel after atomic commit reports actual completed files', async () => {
    const k = kit(), controller = new AbortController(), commit = k.adapter.store.commit;
    k.adapter.store.commit = async attempt => { const receipt = await commit(attempt); controller.abort(); return receipt; };
    const result = await k.manager.download(k.consent, { signal: controller.signal });
    ok(controller.signal.aborted, 'cancel arrives after database commit'); same(result.reused, false, 'actual committed result returned');
    same((await k.manager.status(k.f.model.id)).attempt, result.receipt.attempt, 'real completed pointer preserved');
  });
  await scenario('startup cleanup before and after pointer publication', async () => {
    const k = kit(), old = await k.manager.download(k.consent, { signal: k.signal() }), next = kit(fixture(k.f.model.id, 1), k);
    const abandoned = 'e'.repeat(32); await next.adapter.store.begin(next.consent, abandoned);
    k.env.nodes.set(next.adapter.store.destination(k.f.model.id, abandoned, 0), { type: 'file', bytes: next.f.bytes[0].slice() });
    const fresh = kit(k.f, k); same((await fresh.manager.status(k.f.model.id)).attempt, old.receipt.attempt, 'old complete pointer survives precommit crash'); same(attempts(k).length, 1, 'abandoned stage journal cleaned');
    k.env.fault.deletePath = old.receipt.attempt;
    const saved = await next.manager.download(next.consent, { signal: next.signal() }); same(saved.cleanupPending, true, 'postcommit cleanup failure reported separately'); same(pointer(k).attempt, saved.receipt.attempt, 'new pointer already committed');
    k.env.fault.deletePath = null; const reopened = kit(next.f, k); same((await reopened.manager.status(k.f.model.id)).attempt, saved.receipt.attempt, 'fresh adapter recovers postcommit cleanup'); same(attempts(k).length, 1, 'old orphan removed on reopen');
  });
  await scenario('load lease blocks same-runtime reload, download and deletion', async () => {
    const k = kit(); await k.manager.download(k.consent, { signal: k.signal() }); const entered = deferred(), finish = deferred();
    const loadPromise = k.manager.withVerifiedPaths(k.f.model.id, k.signal(), async () => { entered.resolve(); await finish.promise; throw Error('consumer failed'); });
    await entered.promise; const other = kit(k.f, k);
    await rejects(other.manager.remove(k.f.model.id), 'busy', 'delete cannot remove loaded files'); await rejects(other.manager.status(k.f.model.id), 'busy', 'reload shares model lock');
    await rejects(other.manager.download(other.consent, { signal: other.signal() }), 'busy', 'download cannot replace loaded files');
    finish.resolve(); await rejects(loadPromise, 'storage', 'consumer failure remains actionable');
    same(await other.manager.remove(k.f.model.id), { cleanupPending: false }, 'consumer failure releases lease'); same(await other.manager.status(k.f.model.id), null, 'deleted pointer not restored');
  });
  await scenario('metadata damage is preserved automatically and explicit Delete repairs it', async () => {
    for (const column of ['offer', 'seals']) {
      const k = kit(); await k.manager.download(k.consent, { signal: k.signal() });
      k.h.native.prepare(`UPDATE qwen_file_attempts SET ${column}=? WHERE model_id=?`).run('{damaged', k.f.model.id);
      const nodesBefore = k.env.nodes.size; await rejects(k.manager.status(k.f.model.id), 'storage', 'damaged metadata preserved'); same(k.env.nodes.size, nodesBefore, 'automatic cleanup does not delete damaged current model');
      same(await k.manager.remove(k.f.model.id), { cleanupPending: false }, 'explicit Delete clears own corrupt journal'); same(attempts(k).length, 0, 'damaged journal cleared');
      await k.manager.download(k.consent, { signal: k.signal() }); same(await readHashes(k), k.f.bytes.map(hash), 'fresh download works after explicit reset');
    }
  });
  await scenario('bounded native read errors and cleanup failure remain recoverable', async () => {
    const k = kit(); await k.manager.download(k.consent, { signal: k.signal() });
    k.env.fault.readOversize = true; await rejects(readHashes(k), 'integrity', 'oversized native read refused'); k.env.fault.readOversize = false;
    k.env.fault.readThrows = true; await rejects(readHashes(k), 'storage', 'native read failure actionable'); k.env.fault.readThrows = false;
    same(k.env.stats.handles, k.env.stats.closed, 'failed native reads always close'); await k.manager.remove(k.f.model.id);
    k.env.fault.mode = 'fail'; k.env.fault.deletePath = 'movefield-qwen-files-v1';
    await rejects(k.manager.download(k.consent, { signal: k.signal() }), 'cleanup', 'cleanup failure reported rather than claiming removal');
    k.env.fault.mode = null; k.env.fault.deletePath = null;
    same(await k.manager.status(k.f.model.id), null, 'check files retries failed staging cleanup'); same(attempts(k).length, 0, 'failed staged files reclaimed');
  });
  await scenario('attempt identifier collision never replaces a previous model', async () => {
    const k = kit(), old = await k.manager.download(k.consent, { signal: k.signal() }), f = fixture(k.f.model.id, 1);
    f.model.assets.forEach((asset, i) => k.env.sources.set(asset.url, f.bytes[i]));
    const collide = Q.createNativeQwenFiles({ models: [f.model], ...k.adapter,
      random: () => new Uint8Array(Buffer.from(old.receipt.attempt, 'hex')), yieldTask: async () => {} });
    await rejects(collide.download(collide.offer(f.model.id), { signal: k.signal() }), 'storage', 'collision rejected before writes');
    same(pointer(k).attempt, old.receipt.attempt, 'collision preserves pointer'); same(await readHashes(k), k.f.bytes.map(hash), 'collision preserves bytes');
  });
  await scenario('explicit delete tombstone survives disk cleanup failure', async () => {
    const k = kit(), saved = await k.manager.download(k.consent, { signal: k.signal() }); k.env.fault.deletePath = saved.receipt.attempt;
    await rejects(k.manager.remove(k.f.model.id), 'cleanup', 'delete admits filesystem failure'); same(pointer(k).deleted, 1, 'failed physical cleanup still retires readiness');
    k.env.fault.deletePath = null; const fresh = kit(k.f, k); same(await fresh.manager.status(k.f.model.id), null, 'restart cannot revive deleted model'); same(attempts(k).length, 0, 'restart reclaims tombstoned files');
  });
  await scenario('unknown filesystem entries preserved, no model weights fetched by tests', async () => {
    const k = kit(); await k.manager.status(k.f.model.id);
    const extra = new k.env.filesystem.Directory('file:///cache/movefield-qwen-files-v1', k.f.model.id, 'unknown-folder'); extra.create({ intermediates: true });
    const unknown = new k.env.filesystem.File(extra, 'keep.txt'); k.env.nodes.set(unknown.uri, { type: 'file', bytes: new TextEncoder().encode('keep') });
    await k.manager.remove(k.f.model.id); ok(k.env.nodes.has(unknown.uri), 'unknown paths preserved by model cleanup');
    ok(k.env.nodes.has('file:///unrelated-training'), 'unrelated training sentinel preserved');
    same(k.env.stats.network.length, 0, 'status/delete never fetch model weights');
  });
  await scenario('existing WAL model metadata migrates without receipt or file rewrite', async () => {
    const k = kit(), saved = await k.manager.download(k.consent, {signal: k.signal()});
    const before = {pointer: pointer(k), attempts: attempts(k), files: await readHashes(k)};
    k.h.native.exec('PRAGMA journal_mode=WAL');
    same(k.h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'wal', 'representative previous journal');
    const fresh = kit(k.f, k);
    same((await fresh.manager.status(k.f.model.id)).attempt, saved.receipt.attempt, 'receipt survives checked migration');
    same(k.h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'delete', 'actual outcome is DELETE');
    same(k.h.native.prepare('PRAGMA synchronous').get().synchronous, 3, 'base connection is EXTRA');
    same({pointer: pointer(k), attempts: attempts(k), files: await readHashes(fresh)}, before, 'metadata and file hashes unchanged');
  });
  await scenario('unqualified fresh model transaction refuses before pointer or existing file deletion', async () => {
    const k = kit(), saved = await k.manager.download(k.consent, {signal: k.signal()});
    const before = {pointer: pointer(k), attempts: attempts(k), paths: [...k.env.nodes.keys()].sort()};
    k.h.controller.calls = []; k.h.controller.transactionSynchronous = null;
    await rejects(k.manager.remove(k.f.model.id), 'storage', 'real host default2 refuses delete');
    same({pointer: pointer(k), attempts: attempts(k), paths: [...k.env.nodes.keys()].sort()}, before, 'refusal preserves current receipt and files');
    same(k.h.controller.calls.filter(call => call.scope === 'transaction').map(call => call.sql),
      ['BEGIN EXCLUSIVE', 'PRAGMA journal_mode', 'PRAGMA synchronous'], 'no application callback SQL occurs');
    k.h.controller.transactionSynchronous = 3;
    same((await kit(k.f, k).manager.status(k.f.model.id)).attempt, saved.receipt.attempt, 'restart still reads previous model');
    same(await k.manager.remove(k.f.model.id), {cleanupPending: false}, 'qualified retry succeeds');
  });
  await scenario('different model jobs preserve generations through rollback-journal contention and qualified retry', async () => {
    const a = kit(fixture('native-concurrent-a')), b = kit(fixture('native-concurrent-b'), a);
    const results = await Promise.allSettled([a.manager.download(a.consent, {signal: a.signal()}), b.manager.download(b.consent, {signal: b.signal()})]);
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        ok(result.reason instanceof Q.NativeQwenFilesError && ['storage', 'cleanup'].includes(result.reason.code), 'contention is surfaced without accepting a save');
        const k = index === 0 ? a : b, installed = pointer(k);
        // Existing postcommit acknowledgement semantics allow a complete
        // pointer despite a reported readback failure. It must stay valid;
        // a failed operation cannot publish an incomplete generation.
        if (installed) {
          ok(Q.nativeQwenReceiptMatches(JSON.parse(installed.receipt), k.consent), 'ambiguous committed pointer remains complete');
          same(await readHashes(k), k.f.bytes.map(hash), 'any installed generation still has verified files');
        }
      }
    }
    const one = results[0].status === 'fulfilled' ? results[0].value : await a.manager.download(a.consent, {signal: a.signal()});
    const two = results[1].status === 'fulfilled' ? results[1].value : await b.manager.download(b.consent, {signal: b.signal()});
    same(pointer(a).attempt, one.receipt.attempt, 'first model commit survives');
    same(pointer(b).attempt, two.receipt.attempt, 'second model commit survives');
    same(await readHashes(a), a.f.bytes.map(hash), 'first files verified after interleaved jobs');
    same(await readHashes(b), b.f.bytes.map(hash), 'second files verified after interleaved jobs');
    same(a.h.native.prepare('PRAGMA journal_mode').get().journal_mode, 'delete', 'shared metadata uses rollback journal');
    ok(a.h.controller.calls.filter(call => call.scope === 'transaction').every(call => !/PRAGMA.*=/.test(call.sql)), 'transaction mode guards never set PRAGMAs');
  });
  console.log(JSON.stringify({ status: 'passed', scenarios, assertions: checks, actualModelDownloads: 0,
    inferenceRuns: 0, physicalDevicesQualified: 0, adapter: 'actual compiled Expo adapter + mock filesystem/transport + real node:sqlite + real SHA-256' }));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearTimeout(suiteDeadline); for (const h of harnesses) h.close(); });
