const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');
const cache = new Map();
function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full).exports;
  const module = { exports: {} }; cache.set(full, module);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('.') ? load(path.resolve(path.dirname(full), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
const { handleBackendRequest } = load('server/api.ts');
const { processFeedback, PROVIDER_TIMEOUT_MS } = load('server/feedback.ts');
const { syncMutationSchema } = load('server/contracts.ts');
let checks = 0;
async function test(name, run) { await run(); checks++; console.log('PASS ' + name); }
const ownerHeaders = { 'oai-authenticated-user-id': 'owner-one', 'oai-authenticated-user-email': 'one@example.test', 'x-movefield-client': 'web', 'sec-fetch-site': 'same-origin' };
const envelope = (text = 'ciphertext') => JSON.stringify({ format: 'movefield-sync', version: 1, kdf: { name: 'argon2id', m: 19456, t: 2, p: 1, salt: 'a'.repeat(32) }, cipher: 'aes-256-gcm', nonce: 'b'.repeat(24), data: Buffer.from(text + '-authenticated-tag').toString('base64') });
const mutation = (baseRevision = 0, records = [{ id: 'state-head', ciphertext: envelope() }]) => ({ mutationId: crypto.randomUUID(), baseRevision, records });
const feedback = () => ({ requestId: crypto.randomUUID(), workoutId: 'workout-one', completedAt: new Date().toISOString(), consent: true, adult: true, symptom: 'no', metrics: [{ exerciseId: 'bench', set: 1, reps: 8, kg: 70, rir: 2 }] });
function request(url, body, headers = {}) {
  const identity = { ...ownerHeaders, ...headers };
  return new Request('https://movefield.example.test' + url, { method: body === undefined ? 'GET' : 'POST', headers: { ...identity, 'x-movefield-expected-account': identity['oai-authenticated-user-id'], ...(body === undefined ? {} : { 'content-type': 'application/json', origin: 'https://movefield.example.test' }), ...headers }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
}
function providerReply(text = 'You recorded your completed sets. Keep referring to your existing workout targets.') {
  return Response.json({ choices: [{ message: { content: JSON.stringify({ feedback: text }) } }] });
}

(async () => {
  const mf = new Miniflare({ modules: true, script: 'export default { fetch(){ return new Response("test") } }', compatibilityDate: '2026-05-15', d1Databases: { DB: 'backend-regression' }, cf: false });
  const actualFetch = global.fetch;
  const actualNow = Date.now;
  try {
    const DB = await mf.getD1Database('DB');
    await DB.exec(fs.readFileSync('drizzle/0000_account_sync.sql', 'utf8').replace(/--> statement-breakpoint/g, '').replace(/\n/g, ' '));
    const environment = { DB, MOVEFIELD_TRUST_SITES_AUTH: '1' };
    const tasks = [];
    const invoke = (req, env = environment) => handleBackendRequest(req, env, promise => tasks.push(promise));
    const completeTasks = async () => { while (tasks.length) await tasks.shift(); };
    await test('Anonymous and synthetic native credentials cannot access account rows', async () => {
      assert.equal((await invoke(request('/api/account', undefined, { 'oai-authenticated-user-id': '' }))).status, 401);
      assert.equal((await invoke(request('/api/account', undefined, { authorization: 'Bearer synthetic' }))).status, 401);
      assert.equal((await invoke(request('/api/account'), { ...environment, MOVEFIELD_TRUST_SITES_AUTH: '0' })).status, 503);
      assert.equal((await invoke(request('/api/account', undefined, { 'x-movefield-client': 'native' }))).status, 403);
    });
    await test('CSRF, cross-site fetch, missing origin and invalid methods are denied', async () => {
      assert.equal((await invoke(request('/api/sync', mutation(), { origin: 'https://attacker.test' }))).status, 403);
      assert.equal((await invoke(request('/api/sync', mutation(), { 'sec-fetch-site': 'cross-site' }))).status, 403);
      const missing = request('/api/sync', mutation()); missing.headers.delete('origin'); assert.equal((await invoke(missing)).status, 403);
      const invalid = new Request('https://movefield.example.test/api/sync', { method: 'DELETE', headers: { ...ownerHeaders, origin: 'https://movefield.example.test' } }); assert.equal((await invoke(invalid)).status, 405);
    });
    await test('Account-bound reads and writes fail before database access when signed-in identity changes', async () => {
      const neverDatabase = {withSession() {throw Error('Account guard allowed database access');}};
      for (const url of ['/api/sync', '/api/daily-feedback']) {
        for (const body of [undefined, url === '/api/sync' ? mutation() : feedback()]) {
          const mismatch = request(url, body, {'oai-authenticated-user-id': 'owner-two', 'x-movefield-expected-account': 'owner-one'});
          const changed = await invoke(mismatch, {...environment, DB: neverDatabase});
          assert.equal(changed.status, 401); assert.equal((await changed.json()).error, 'account_changed');
          const missing = request(url, body); missing.headers.delete('x-movefield-expected-account');
          const unbound = await invoke(missing, {...environment, DB: neverDatabase});
          assert.equal(unbound.status, 403); assert.equal((await unbound.json()).error, 'account_binding_required');
        }
      }
      assert.equal((await invoke(request('/api/account'))).status, 200);
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM sync_records').first()).n, 0);
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM daily_ai_feedback').first()).n, 0);
    });
    await test('Malformed, plaintext, secret-bearing and duplicate identities are rejected before any save', async () => {
      for (const body of ['{', { ...mutation(), ownerId: 'another-user' }, mutation(0, [{ id: 'head', ciphertext: '{"profile":{"name":"private"}}' }]), mutation(0, [{ id: 'head', ciphertext: envelope() }, { id: 'head', ciphertext: envelope() }])]) assert.equal((await invoke(request('/api/sync', body))).status, 400);
      const secretEnvelope = JSON.parse(envelope()); secretEnvelope.password = 'private-password'; assert.equal(syncMutationSchema.safeParse(mutation(0, [{ id: 'head', ciphertext: JSON.stringify(secretEnvelope) }])).success, false);
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM sync_records').first()).n, 0);
    });
    await test('Declared and streaming payload limits reject oversized and invalid UTF-8 bodies', async () => {
      assert.equal((await invoke(request('/api/sync', mutation(), { 'content-length': '1100001' }))).status, 413);
      assert.equal((await invoke(request('/api/sync', 'x'.repeat(1_100_001)))).status, 413);
      const invalid = new Request('https://movefield.example.test/api/sync', { method: 'POST', headers: { ...ownerHeaders, 'x-movefield-expected-account': 'owner-one', origin: 'https://movefield.example.test', 'content-type': 'application/json' }, body: Uint8Array.from([255, 254]) }); assert.equal((await invoke(invalid)).status, 400);
    });
    let first;
    await test('Atomic encrypted record batch commits once and reads exact receipt', async () => {
      first = mutation(0, [{ id: 'state-head', ciphertext: envelope('head') }, { id: 'history-one', ciphertext: envelope('workout') }]);
      const response = await invoke(request('/api/sync', first)); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { mutationId: first.mutationId, revision: 1, replayed: false });
      const replay = await invoke(request('/api/sync', first)); assert.deepEqual(await replay.json(), { mutationId: first.mutationId, revision: 1, replayed: true });
      assert.equal((await DB.prepare('SELECT revision FROM sync_accounts WHERE owner_id = ?').bind('owner-one').first()).revision, 1);
      const altered = await invoke(request('/api/sync', { ...first, records: [{ id: 'state-head', ciphertext: envelope('different') }] })); assert.equal(altered.status, 409); assert.equal((await altered.json()).error, 'idempotency_conflict');
    });
    await test('Tenant identities scope all pulls, writes, receipts and account revisions', async () => {
      const other = { 'oai-authenticated-user-id': 'owner-two', 'oai-authenticated-user-email': 'two@example.test' };
      const initial = await (await invoke(request('/api/sync', undefined, other))).json(); assert.deepEqual(initial.records, []); assert.equal(initial.revision, 0);
      const sameId = { ...first, records: [{ id: 'state-head', ciphertext: envelope('other-owner') }] };
      assert.equal((await invoke(request('/api/sync', sameId, other))).status, 200);
      const rows = await (await invoke(request('/api/sync', undefined, other))).json(); assert.equal(rows.records.length, 1); assert.equal(rows.records[0].ciphertext, envelope('other-owner'));
      assert.equal((await (await invoke(request('/api/account'))).json()).feedbackAvailable, false);
    });
    await test('Concurrent same-base clients preserve one committed revision and reject the loser', async () => {
      const results = await Promise.all([mutation(1), mutation(1)].map(body => invoke(request('/api/sync', body))));
      assert.deepEqual(results.map(row => row.status).sort(), [200, 409]);
      const losing = await results.find(row => row.status === 409).json(); assert.equal(losing.error, 'revision_conflict'); assert.equal(losing.revision, 2);
    });
    await test('Concurrent identical mutation retries commit once and identify replay', async () => {
      const revision = (await (await invoke(request('/api/account'))).json()).revision;
      const body = mutation(revision);
      const replies = await Promise.all([invoke(request('/api/sync', body)), invoke(request('/api/sync', body))]);
      assert.deepEqual(replies.map(reply => reply.status), [200, 200]);
      const receipts = await Promise.all(replies.map(reply => reply.json())); assert.deepEqual(receipts.map(receipt => receipt.replayed).sort(), [false, true]);
      assert.equal(receipts[0].revision, receipts[1].revision);
    });
    await test('D1 failure midway through batch rolls back records, account revision and receipt', async () => {
      const before = await DB.prepare('SELECT revision FROM sync_accounts WHERE owner_id = ?').bind('owner-one').first();
      await DB.exec("CREATE TRIGGER reject_test_record BEFORE INSERT ON sync_records WHEN NEW.record_id = 'fault-injected' BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
      const failed = mutation(before.revision, [{ id: 'before-failure', ciphertext: envelope() }, { id: 'fault-injected', ciphertext: envelope() }]); assert.equal((await invoke(request('/api/sync', failed))).status, 503);
      assert.equal((await DB.prepare('SELECT revision FROM sync_accounts WHERE owner_id = ?').bind('owner-one').first()).revision, before.revision);
      assert.equal(await DB.prepare('SELECT record_id FROM sync_records WHERE record_id = ?').bind('before-failure').first(), null);
      assert.equal(await DB.prepare('SELECT mutation_id FROM sync_receipts WHERE mutation_id = ?').bind(failed.mutationId).first(), null);
      await DB.exec('DROP TRIGGER reject_test_record;'); assert.equal((await invoke(request('/api/sync', failed))).status, 200);
    });
    await test('Pagination preserves tied revisions and tombstones with bounded opaque cursors', async () => {
      let revision = (await (await invoke(request('/api/account'))).json()).revision;
      for (let batch = 0; batch < 3; batch++) { const records = Array.from({ length: 25 }, (_, index) => ({ id: `history-${batch}-${index}`, ciphertext: envelope() })); assert.equal((await invoke(request('/api/sync', mutation(revision++, records)))).status, 200); }
      assert.equal((await invoke(request('/api/sync', mutation(revision, [{ id: 'history-one', ciphertext: null }])))).status, 200);
      let cursor = '0'; const records = []; let more = true;
      while (more) { const response = await invoke(request('/api/sync?cursor=' + encodeURIComponent(cursor))); assert.equal(response.status, 200); const page = await response.json(); assert.ok(page.records.length <= 25); records.push(...page.records); cursor = page.nextCursor; more = page.hasMore; }
      assert.equal(new Set(records.map(row => row.id)).size, records.length); assert.equal(records.find(row => row.id === 'history-one').ciphertext, null); assert.equal(records.length, 79);
      assert.equal((await invoke(request('/api/sync?cursor=invalid'))).status, 400);
    });
    const configured = { ...environment, MOVEFIELD_AI_BASE_URL: 'https://api.together.xyz/v1', MOVEFIELD_AI_API_KEY: 'synthetic-test-secret', MOVEFIELD_AI_MODEL: 'synthetic-test-model' };
    await test('Feedback provider absence and unapproved host fail unavailable without saving jobs', async () => {
      assert.equal((await invoke(request('/api/daily-feedback', feedback()))).status, 503);
      assert.equal((await invoke(request('/api/daily-feedback', feedback()), { ...configured, MOVEFIELD_AI_BASE_URL: 'https://attacker.test/v1' })).status, 503);
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM daily_ai_feedback').first()).n, 0);
    });
    await test('Feedback accepts only consented adult completed metric arrays without notes or profile', async () => {
      for (const patch of [{ consent: false }, { adult: false }, { symptom: 'yes' }, { name: 'private' }, { state: { profile: {} } }, { metrics: [{ exerciseId: 'bench', set: 1, reps: 8, kg: 70, notes: 'private' }] }, { metrics: Array(2).fill({ exerciseId: 'bench', set: 1, reps: 8, kg: 70 }) }, { completedAt: '2037-01-01T00:00:00.000Z' }]) assert.equal((await invoke(request('/api/daily-feedback', { ...feedback(), ...patch }), configured)).status, 400);
    });
    let completed;
    await test('Generated text is absent from accepted response and visible only after actual database save', async () => {
      completed = feedback(); let payload; let secret;
      global.fetch = async (url, options) => { assert.equal(url, 'https://api.together.xyz/v1/chat/completions'); payload = JSON.parse(options.body); secret = options.headers.Authorization; return providerReply(); };
      const accepted = await invoke(request('/api/daily-feedback', completed), configured); assert.equal(accepted.status, 202); const initial = await accepted.json(); assert.equal(initial.status, 'pending'); assert.equal('feedback' in initial, false);
      await completeTasks(); assert.equal(secret, 'Bearer synthetic-test-secret'); const input = JSON.parse(payload.messages[1].content); assert.deepEqual(Object.keys(input), ['completedWorkoutMetrics']); assert.equal(JSON.stringify(payload).includes('private'), false);
      const polled = await (await invoke(request('/api/daily-feedback?id=' + completed.requestId), configured)).json(); assert.equal(polled.status, 'complete'); assert.equal(typeof polled.feedback, 'string');
      const saved = await DB.prepare('SELECT status, feedback, metrics_json FROM daily_ai_feedback WHERE owner_id = ? AND request_id = ?').bind('owner-one', completed.requestId).first(); assert.equal(saved.feedback, polled.feedback); assert.equal(saved.metrics_json, '[]');
    });
    await test('Feedback idempotency returns persisted completion and protects tenants and payload identity', async () => {
      assert.equal((await invoke(request('/api/daily-feedback', completed), configured)).status, 200);
      assert.equal((await invoke(request('/api/daily-feedback', { ...completed, workoutId: 'different-workout' }), configured)).status, 409);
      const other = { 'oai-authenticated-user-id': 'owner-two', 'oai-authenticated-user-email': 'two@example.test' }; assert.equal((await invoke(request('/api/daily-feedback?id=' + completed.requestId, undefined, other), configured)).status, 404);
      assert.equal((await invoke(request('/api/daily-feedback?id=bad'), configured)).status, 400);
    });
    await test('Provider malformed or unsafe output fails closed and never returns generated text', async () => {
      for (const text of ['Increase the weight next time.', 'You lifted 70 kilograms.', 'This is safe to train with pain.']) {
        global.fetch = async () => providerReply(text); const payload = feedback(); payload.workoutId = crypto.randomUUID(); await invoke(request('/api/daily-feedback', payload), configured); await completeTasks();
        const result = await (await invoke(request('/api/daily-feedback?id=' + payload.requestId), configured)).json(); assert.equal(result.status, 'failed'); assert.equal(result.error, 'feedback_invalid_output'); assert.equal('feedback' in result, false);
      }
    });
    await test('Timeout aborts provider fetch, persists backoff and prevents simultaneous lease claims', async () => {
      assert.equal(PROVIDER_TIMEOUT_MS, 8_000); const payload = feedback(); payload.workoutId = 'timeout-workout'; let calls = 0;
      global.fetch = (url, options) => { calls++; return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })); };
      await invoke(request('/api/daily-feedback', payload), configured); await completeTasks();
      const row = await DB.prepare('SELECT status, attempts, error_code, next_attempt_at FROM daily_ai_feedback WHERE request_id = ?').bind(payload.requestId).first(); assert.equal(row.status, 'pending'); assert.equal(row.attempts, 1); assert.equal(row.error_code, 'feedback_provider_timeout'); assert.ok(row.next_attempt_at > Date.now()); assert.equal(calls, 1);
      Date.now = () => row.next_attempt_at + 1; global.fetch = async () => { calls++; return providerReply(); };
      await Promise.all([processFeedback(DB.withSession('first-primary'), 'owner-one', payload.requestId, configured), processFeedback(DB.withSession('first-primary'), 'owner-one', payload.requestId, configured)]);
      assert.equal(calls, 2); assert.equal((await DB.prepare('SELECT status, attempts FROM daily_ai_feedback WHERE request_id = ?').bind(payload.requestId).first()).attempts, 2); Date.now = actualNow;
    });
    await test('Expired final attempt becomes terminal rather than a permanently processing job', async () => {
      const payload = feedback(); payload.workoutId = 'expired-workout'; global.fetch = async () => providerReply(); await invoke(request('/api/daily-feedback', payload), configured); await completeTasks();
      await DB.prepare("UPDATE daily_ai_feedback SET status = 'processing', feedback = NULL, attempts = 3, lease_until = 0 WHERE request_id = ?").bind(payload.requestId).run();
      await invoke(request('/api/daily-feedback?id=' + payload.requestId), configured); await completeTasks(); const result = await (await invoke(request('/api/daily-feedback?id=' + payload.requestId), configured)).json(); assert.equal(result.status, 'failed'); assert.equal(result.error, 'feedback_attempts_exhausted');
    });
    await test('Failed result persistence exposes no generated string and remains safely retryable', async () => {
      await DB.exec("CREATE TRIGGER reject_feedback_save BEFORE UPDATE ON daily_ai_feedback WHEN NEW.status = 'complete' AND NEW.workout_id = 'save-failure' BEGIN SELECT RAISE(ABORT, 'synthetic save failure'); END;");
      const payload = feedback(); payload.workoutId = 'save-failure'; global.fetch = async () => providerReply(); await invoke(request('/api/daily-feedback', payload), configured); await completeTasks();
      const result = await (await invoke(request('/api/daily-feedback?id=' + payload.requestId), configured)).json(); assert.equal(result.status, 'pending'); assert.equal('feedback' in result, false); await DB.exec('DROP TRIGGER reject_feedback_save;');
    });
    await test('Sensitive APIs always return private no-store and no provider secrets in errors', async () => {
      const response = await invoke(request('/api/account')); assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
      const result = await invoke(request('/api/daily-feedback', { ...feedback(), extra: 'private-value' }), configured); const raw = await result.text(); assert.equal(raw.includes('synthetic-test-secret'), false); assert.equal(raw.includes('private-value'), false);
    });
    await test('Outstanding job limits are tenant-scoped and abandoned jobs release capacity explicitly', async () => {
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      global.fetch = async () => { await gate; return providerReply(); };
      const other = { 'oai-authenticated-user-id': 'rate-owner', 'oai-authenticated-user-email': 'rate@example.test' };
      const retained = [];
      for (let index = 0; index < 4; index++) { const body = feedback(); body.workoutId = 'rate-' + index; retained.push(body); assert.equal((await invoke(request('/api/daily-feedback', body, other), configured)).status, 202); }
      const denied = feedback(); denied.workoutId = 'rate-denied'; assert.equal((await invoke(request('/api/daily-feedback', denied, other), configured)).status, 429);
      release(); await completeTasks(); global.fetch = async () => providerReply();
      await DB.prepare("UPDATE daily_ai_feedback SET status = 'pending', feedback = NULL, lease_until = 0, created_at = ? WHERE owner_id = ?").bind(Date.now() - 86_400_001, 'rate-owner').run();
      const fresh = feedback(); fresh.workoutId = 'rate-fresh'; assert.equal((await invoke(request('/api/daily-feedback', fresh, other), configured)).status, 202);
      const expired = await (await invoke(request('/api/daily-feedback?id=' + retained[0].requestId, undefined, other), configured)).json(); assert.equal(expired.status, 'failed'); assert.equal(expired.error, 'feedback_request_expired'); await completeTasks();
    });
    await test('Rolling daily feedback limits reject new jobs without deleting completed results', async () => {
      const other = { 'oai-authenticated-user-id': 'daily-owner', 'oai-authenticated-user-email': 'daily@example.test' };
      for (let index = 0; index < 12; index++) { const body = feedback(); body.workoutId = 'daily-' + index; assert.equal((await invoke(request('/api/daily-feedback', body, other), configured)).status, 202); await completeTasks(); }
      const body = feedback(); body.workoutId = 'daily-refused'; assert.equal((await invoke(request('/api/daily-feedback', body, other), configured)).status, 429);
      assert.equal((await DB.prepare("SELECT COUNT(*) AS n FROM daily_ai_feedback WHERE owner_id = ? AND status = 'complete'").bind('daily-owner').first()).n, 12);
    });
    console.log(checks + ' backend D1 integration groups passed');
  } finally { global.fetch = actualFetch; Date.now = actualNow; await mf.dispose(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
