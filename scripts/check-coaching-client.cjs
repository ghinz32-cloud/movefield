const assert = require('node:assert/strict');
const path = require('node:path');
const {createTsxLoader} = require('./lib/component-hook-harness.cjs');
const {coachingFixture} = require('./lib/coaching-fixture.cjs');
const repo = path.resolve(__dirname, '..');
const fixture = coachingFixture(repo, 'owner-a');
const original = {setTimeout, clearTimeout, fetch: global.fetch};
const timers = new Set();
let timing = milliseconds => milliseconds, timingCalls = [], passed = 0;
global.setTimeout = (callback, milliseconds, ...args) => {
  timingCalls.push(milliseconds);
  let timer;
  timer = original.setTimeout(() => {timers.delete(timer); callback(...args);}, timing(milliseconds));
  timers.add(timer); return timer;
};
global.clearTimeout = timer => {timers.delete(timer); original.clearTimeout(timer);};
class CloudError extends Error {constructor(status, code, message) {super(message); this.status = status; this.code = code;}}
const account = userId => ({userId, syncAvailable: true, feedbackAvailable: true, coachingAvailable: true, nativeAuthAvailable: false, revision: 0});
const complete = (overrides = {}) => ({policy: fixture.context.policy, requestId: fixture.requestId, workoutId: fixture.context.workoutId,
  contextDigest: fixture.contextDigest, status: 'complete', reply: fixture.reply, model: 'configured-open-weight-model', ...overrides});
const pending = (overrides = {}) => ({policy: fixture.context.policy, requestId: fixture.requestId, workoutId: fixture.context.workoutId,
  contextDigest: fixture.contextDigest, status: 'pending', retryAfterMs: 1_000, ...overrides});
function client(overrides = {}) {
  const calls = [], accounts = [];
  const transport = {CloudError, cloudAccount: async signal => {accounts.push(signal); return account('owner-a');},
    cloudRequest: async (...args) => {calls.push(args); return complete();}, ...overrides};
  const loader = createTsxLoader(repo, {'./cloud-client': transport});
  return {api: loader.load(path.join(repo, 'lib/workout-coaching-client.ts')), calls, accounts};
}
async function check(name, run) {
  timing = milliseconds => milliseconds; timingCalls = [];
  const initialTimers = new Set(timers);
  let guard;
  try {
    await Promise.race([run(), new Promise((_, reject) => {guard = original.setTimeout(() => reject(new Error('Client test timed out: ' + name)), 5_000);})]);
    assert.equal(timers.size, initialTimers.size, 'request timers and cancellation timers must be cleaned up');
    passed++; console.log('PASS ' + name);
  } finally {
    original.clearTimeout(guard);
    for (const timer of timers) if (!initialTimers.has(timer)) {original.clearTimeout(timer); timers.delete(timer);}
  }
}
async function main() {
  await check('Canonical digest and UUIDv8 identity survive reopening and bind owner and context', async () => {
    const reopened = createTsxLoader(repo).load(path.join(repo, 'lib/workout-coaching-identity.ts'));
    assert.equal(reopened.workoutCoachingDigest(fixture.context), fixture.contextDigest);
    assert.equal(reopened.workoutCoachingRequestId('owner-a', fixture.contextDigest), fixture.requestId);
    assert.match(fixture.requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(reopened.workoutCoachingRequestId('owner-b', fixture.contextDigest), fixture.requestId);
    assert.notEqual(reopened.workoutCoachingRequestId('owner-a', 'a'.repeat(64)), fixture.requestId);
    assert.throws(() => reopened.workoutCoachingRequestId('bad owner', fixture.contextDigest));
  });
  await check('Import performs no remote action and stale caller digest is refused before account lookup', async () => {
    const c = client(); assert.equal(c.calls.length, 0); assert.equal(c.accounts.length, 0);
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, '0'.repeat(64)), /workout changed/);
    assert.equal(c.calls.length, 0); assert.equal(c.accounts.length, 0);
  });
  await check('Explicit consent sends minimized context and returns only a persisted validated result', async () => {
    const c = client(), result = await c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest);
    assert.deepEqual(result, {reply: fixture.reply, accountId: 'owner-a', requestId: fixture.requestId, model: 'configured-open-weight-model'});
    assert.equal(c.calls.length, 1);
    const [route, body, signal, owner] = c.calls[0];
    assert.equal(route, '/api/workout-coaching'); assert.equal(owner, 'owner-a'); assert.equal(signal.aborted, false);
    assert.deepEqual(body, fixture.payload);
    assert.doesNotMatch(JSON.stringify(body), /private profile name|private workout title|private workout note/);
  });
  await check('Pending and processing responses wait the bounded server retry intervals before polling', async () => {
    timing = milliseconds => milliseconds <= 15_000 ? 1 : milliseconds;
    let request = 0;
    const c = client({cloudRequest: async (...args) => {c.calls.push(args); return [pending(), pending({status: 'processing', retryAfterMs: 7_000}), complete()][request++];}});
    const promise = c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest);
    let resolved = false; promise.then(() => {resolved = true;});
    await Promise.resolve(); assert.equal(resolved, false);
    const result = await promise;
    assert.deepEqual(result.reply, fixture.reply); assert.equal(c.calls.length, 3); assert.equal(c.accounts.length, 3);
    assert.deepEqual(timingCalls.filter(ms => ms <= 15_000), [1_000, 7_000]);
    assert.equal(c.calls[1][0], `/api/workout-coaching?id=${fixture.requestId}&context=${fixture.contextDigest}`);
    assert.equal(c.calls[1][1], undefined); assert.equal(c.calls[2][3], 'owner-a');
  });
  await check('Signed-in owner change prevents polling another account', async () => {
    timing = milliseconds => milliseconds <= 15_000 ? 1 : milliseconds;
    let reads = 0;
    const c = client({cloudAccount: async () => account(++reads === 1 ? 'owner-a' : 'owner-b'), cloudRequest: async (...args) => {c.calls.push(args); return pending();}});
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.code === 'account_changed');
    assert.equal(c.calls.length, 1);
  });
  await check('Saved response identity, status bounds, object keys and selected facts are checked', async () => {
    for (const response of [complete({requestId: crypto.randomUUID()}), complete({workoutId: 'another-workout'}), complete({contextDigest: 'f'.repeat(64)}),
      complete({policy: 'unknown-policy'}), complete({extra: true}), pending({retryAfterMs: 0}), pending({retryAfterMs: 15_001}),
      complete({reply: {...fixture.reply, observationIds: ['invented-fact']}}), complete({reply: {...fixture.reply, reviewIds: ['invented-review']}}),
      complete({reply: {...fixture.reply, prose: 'Increase the load'}}), null, []]) {
      const c = client({cloudRequest: async () => response});
      await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.code === 'coaching_bad_response');
    }
  });
  await check('Unavailable provider and old account capability response produce no mutation', async () => {
    for (const available of [false, undefined]) {
      const c = client({cloudAccount: async () => ({...account('owner-a'), coachingAvailable: available})});
      await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.code === 'coaching_provider_unavailable');
      assert.equal(c.calls.length, 0);
    }
  });
  await check('Failed or cancelled persisted receipts cannot produce coaching', async () => {
    const failed = client({cloudRequest: async () => ({...pending(), retryAfterMs: undefined, status: 'failed', error: 'coaching_invalid_output'})});
    await assert.rejects(failed.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.code === 'coaching_bad_response');
    const c = client({cloudRequest: async () => {const response = pending(); delete response.retryAfterMs; return {...response, status: 'cancelled'};}});
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.name === 'AbortError');
    const f = client({cloudRequest: async () => {const response = pending(); delete response.retryAfterMs; return {...response, status: 'failed', error: 'coaching_invalid_output'};}});
    await assert.rejects(f.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.code === 'coaching_failed');
  });
  await check('Already aborted caller starts no job', async () => {
    const abort = new AbortController(); abort.abort(); const c = client();
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest, {signal: abort.signal}), error => error.name === 'AbortError');
    assert.equal(c.calls.length, 0);
  });
  await check('View cancellation uses fresh bounded cancellation signal and the same owner/context receipt', async () => {
    const abort = new AbortController(), c = client({cloudRequest: async (...args) => {
      c.calls.push(args);
      if (args[1]?.action === 'cancel') {assert.equal(args[2].aborted, false); const response = pending(); delete response.retryAfterMs; return {...response, status: 'cancelled'};}
      abort.abort(); return complete();
    }});
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest, {signal: abort.signal}), error => error.name === 'AbortError');
    assert.equal(c.calls.length, 2); assert.notEqual(c.calls[0][2], c.calls[1][2]);
    assert.deepEqual(c.calls[1][1], {action: 'cancel', requestId: fixture.requestId, contextDigest: fixture.contextDigest});
    assert.equal(c.calls[1][3], 'owner-a'); assert(timingCalls.includes(3_000));
  });
  await check('Total request deadline aborts and best-effort cancellation failure does not replace original error', async () => {
    timing = milliseconds => milliseconds === 120_000 ? 1 : milliseconds;
    const c = client({cloudRequest: (...args) => {
      c.calls.push(args);
      if (args[1]?.action === 'cancel') throw new CloudError(401, 'account_changed', 'changed');
      return new Promise((_, reject) => args[2].addEventListener('abort', () => reject(new DOMException('deadline', 'AbortError')), {once: true}));
    }});
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest), error => error.name === 'AbortError' && error.message === 'deadline');
    assert.equal(c.calls.length, 2);
  });
  await check('Best-effort cancellation has its own three-second deadline', async () => {
    timing = milliseconds => milliseconds === 3_000 ? 1 : milliseconds;
    const abort = new AbortController(), c = client({cloudRequest: (...args) => {
      c.calls.push(args);
      if (args[1]?.action === 'cancel') return new Promise((_, reject) => args[2].addEventListener('abort', () => reject(new DOMException('cancel deadline', 'AbortError')), {once: true}));
      abort.abort(); return Promise.resolve(complete());
    }});
    await assert.rejects(c.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest, {signal: abort.signal}), error => error.name === 'AbortError');
    assert.equal(c.calls[1][2].aborted, true);
  });
  await check('Reopening and retrying reuse one deterministic receipt', async () => {
    const a = client(), b = client();
    await a.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest);
    await b.api.requestWorkoutCoaching(fixture.context, fixture.contextDigest);
    assert.deepEqual(a.calls[0][1], b.calls[0][1]);
  });
  await check('Explicit retry after cancellation reuses the receipt and exhausted or expired receipts stay blocked', async () => {
    const abort = new AbortController(), stopped = client({cloudRequest: async (...args) => {
      stopped.calls.push(args);const response=pending();delete response.retryAfterMs;
      if(args[1]?.action==='cancel')return {...response,status:'cancelled'};
      abort.abort();return complete();
    }});
    await assert.rejects(stopped.api.requestWorkoutCoaching(fixture.context,fixture.contextDigest,{signal:abort.signal}),error=>error.name==='AbortError');
    const resumed=client();await resumed.api.requestWorkoutCoaching(fixture.context,fixture.contextDigest);
    assert.equal(resumed.calls[0][1].requestId,stopped.calls[0][1].requestId);
    for(const code of ['coaching_attempts_exhausted','coaching_request_expired']){
      const blocked=client({cloudRequest:async()=>{throw new CloudError(409,code,'The account changed on another device.');}});
      await assert.rejects(blocked.api.requestWorkoutCoaching(fixture.context,fixture.contextDigest),error=>error.code===code&&/Local coaching remains available/.test(error.message)&&!/account changed/.test(error.message));
      assert.equal(blocked.calls.length,0);
    }
  });
  await check('Actual same-origin transport binds coaching GET and POST without native or provider credentials', async () => {
    const calls = [], transport = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts'));
    global.fetch = async (...args) => {calls.push(args); return Response.json({ok: true});};
    await transport.cloudRequest('/api/workout-coaching', {consent: true}, undefined, 'owner-a');
    await transport.cloudRequest(`/api/workout-coaching?id=${fixture.requestId}&context=${fixture.contextDigest}`, undefined, undefined, 'owner-a');
    for (const [route, init] of calls) {
      assert(route.startsWith('/api/workout-coaching')); assert.equal(init.credentials, 'same-origin'); assert.equal(init.redirect, 'error');
      assert.equal(init.headers['X-Movefield-Expected-Account'], 'owner-a'); assert.equal(init.headers['X-Movefield-Client'], 'web');
      assert.equal(init.headers.Authorization, undefined); assert.equal(init.headers['oai-authenticated-user-id'], undefined);
    }
    await assert.rejects(transport.cloudRequest('/api/workout-coaching', {}, undefined), /authenticated account/);
    await assert.rejects(transport.cloudRequest('/api/workout-coaching/other', {}, undefined, 'owner-a'), /Unsupported/);
    await assert.rejects(transport.cloudRequest('https://example.com/api/workout-coaching', {}, undefined, 'owner-a'), /Unsupported/);
    assert.equal(calls.length, 2);
  });
  console.log(`${passed} compiled coaching client lifecycle groups passed (bounded timers; no actual provider/deployment claim)`);
}
main().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {
  for (const timer of timers) original.clearTimeout(timer);
  timers.clear(); global.setTimeout = original.setTimeout; global.clearTimeout = original.clearTimeout; global.fetch = original.fetch;
});
