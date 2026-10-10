const assert = require('node:assert/strict');
const path = require('node:path');
const { createHookHarness, createTsxLoader } = require('./lib/component-hook-harness.cjs');
const repo = path.resolve(__dirname, '..');
const nativeTimeout = global.setTimeout;
let assertions = 0;
const failures = [];
const scenarios = [];
const activeHarnesses = new Set();
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions++; };
const okay = (value, message) => { assert.ok(value, message); assertions++; };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const nodeText = node => Array.isArray(node) ? node.map(nodeText).join(' ') : node && typeof node === 'object' && 'props' in node ? nodeText(node.props.children) : typeof node === 'string' ? node : '';
const button = (harness, label) => { const node = harness.find(value => value.type === 'Button' && nodeText(value) === label); assert.ok(node, 'Actual rendered button: ' + label); return node; };
async function until(harness, predicate) { for (let attempt = 0; attempt < 60; attempt++) { await harness.settle(); if (predicate()) return; await new Promise(resolve => nativeTimeout(resolve, 5)); } assert.fail('Compiled callback did not reach expected async checkpoint'); }
async function test(name, run) { scenarios.push(name); const timeout = global.setTimeout; try { await run(); console.log('PASS ' + name); } catch (error) { failures.push({ name, message: error.message }); console.error('FAIL ' + name + ': ' + error.stack); } finally { for (const h of activeHarnesses) h.unmount(); activeHarnesses.clear(); global.setTimeout = timeout; } }
const workout = id => ({ id, sessionId: 'session', title: 'Training', date: '2026-10-09', startedAt: 1000, finishedAt: 2000, symptom: 'no', sets: [{ exerciseId: 'bench', set: 1, done: true, reps: 8, kg: 70, rir: 2, metrics: { durationSeconds: 30, distanceM: 10, notes: 'private note' } }] });
const state = (id = 'workout-one') => ({ schema: 2, profile: { age: 30, name: 'private name' }, history: [workout(id)], hold: false, active: null });

function mountFeedback(options = {}) {
  const h = createHookHarness();
  activeHarnesses.add(h);
  const calls = [];
  const transport = {
    cloudAccount: async signal => { calls.push({ kind: 'account', signal }); return options.account ? options.account(signal) : { userId: 'owner-one', feedbackAvailable: true }; },
    cloudRequest: async (url, body, signal, expectedAccountId) => { calls.push({ kind: body ? 'post' : 'poll', url, body, signal, expectedAccountId }); return options.request ? options.request(url, body, signal, expectedAccountId) : body ? { requestId: body.requestId, workoutId: body.workoutId, status: 'complete', feedback: 'Saved retrospective.' } : { requestId: '', workoutId: '', status: 'pending' }; },
  };
  const component = createTsxLoader(repo, { react: h.react, 'react/jsx-runtime': h.runtime, './ui/button': { Button: 'Button' }, '@/lib/cloud-client': transport }).load(path.join(repo, 'components/daily-feedback.tsx')).DailyFeedback;
  let props = { state: options.state || state(), saved: options.saved !== false };
  return { h, calls, component, mount: () => h.mount(component, props), set: async next => { props = { ...props, ...next }; await h.mount(component, props); } };
}

function mountAccount(options = {}) {
  const h = createHookHarness(), calls = [];
  activeHarnesses.add(h);
  let snapshot = { active: false, busy: false, message: 'Sync off.' };
  const listeners = new Set();
  const publish = patch => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
  const service = {
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, getSnapshot: () => snapshot,
    unlock: async password => { calls.push({ kind: 'unlock', password }); return options.unlock ? options.unlock(password) : state('remote'); },
    activate: async selected => { calls.push({ kind: 'activate', selected }); if (options.activate) await options.activate(selected); publish({ active: true }); },
    flush: async () => { calls.push({ kind: 'flush' }); },
    disconnect: () => { calls.push({ kind: 'disconnect' }); publish({ active: false, busy: false }); },
  };
  const react = { ...h.react, useSyncExternalStore: (subscribe, getSnapshot) => {
    const [value, setValue] = h.react.useState(getSnapshot);
    h.react.useEffect(() => subscribe(() => setValue(getSnapshot())), [subscribe, getSnapshot]); return value;
  } };
  const component = createTsxLoader(repo, { react, 'react/jsx-runtime': h.runtime, './ui/button': { Button: 'Button' }, './ui/input': { Input: 'Input' } }).load(path.join(repo, 'components/account-sync.tsx')).AccountSync;
  const props = { service, state: state(), saved: true, onUseRemote: async remote => { calls.push({ kind: 'replace', remote }); if (options.replace) await options.replace(remote); }, onQueueCurrent: () => calls.push({ kind: 'queue' }) };
  return { h, calls, service, component, mount: () => h.mount(component, props), set: async next => { Object.assign(props, next); await h.mount(component, props); } };
}

function syncService(options = {}) {
  const calls = [], remote = state('remote'), selected = options.accountId || 'owner-one';
  let revision = 4, accountId = selected;
  let queue = {version: 1, accounts: {[selected]: {revision: 2, pending: [{records: [{id: 'state-head', ciphertext: 'queued'}]}]}, 'other-owner': {revision: 1, pending: [{records: [{id: 'state-head', ciphertext: 'other-queued'}]}]}}};
  const store = {
    syncSnapshot: async () => structuredClone(queue),
    claimSync: async () => null, acknowledgeSync: async () => false, failSync: async () => undefined,
    setSyncRevision: async input => calls.push({kind: 'setRevision', input}), resumeSyncAuth: async input => calls.push({kind: 'resume', input}), clearSync: async input => calls.push({kind: 'clear', input}),
    reconcileSync: async input => { calls.push({kind: 'reconcile', input}); if (options.reconcile) await options.reconcile(input); assert.deepEqual(input.expected, queue); queue.accounts[selected] = {revision: input.revision, pending: []}; },
  };
  const transport = {
    cloudAccount: async () => ({userId: accountId, syncAvailable: true, feedbackAvailable: false, nativeAuthAvailable: false, revision}),
    cloudRequest: async (url, payload, signal, expectedAccountId) => { calls.push({kind: payload ? 'send' : 'pull', url, payload, expectedAccountId}); return {revision, records: [{id: 'state-head', ciphertext: 'remote-head', revision}], nextCursor: 'done', hasMore: false}; },
    CloudError: class CloudError extends Error {},
  };
  const envelope = {
    cloudKey: async () => ({salt: 'a'.repeat(32), key: 'private-key'}), cloudSalt: () => 'a'.repeat(32),
    assembleCloudState: async () => ({state: remote, digests: new Map([['state-head', 'remote']])}),
    cloudRecords: async (chosen, key, owner, previous = new Map()) => { calls.push({kind: 'encode', chosen, owner}); const digest = chosen.history[0]?.id || 'empty'; return {records: previous.get('state-head') === digest ? [] : [{id: 'state-head', ciphertext: 'encrypted-' + digest}], digests: new Map([['state-head', digest]])}; },
  };
  const make = createTsxLoader(repo, {'./cloud-client': transport, './cloud-envelope': envelope}).load(path.join(repo, 'lib/browser-cloud-sync.ts')).createBrowserCloudSync;
  const service = make(() => store);
  return {service, calls, remote, queue: () => queue, changeAccount: id => {accountId = id;}, changeRevision: value => {revision = value;}};
}

(async () => {
  const oldWindow = global.window, oldFetch = global.fetch, oldTimeout = global.setTimeout;
  global.window = { addEventListener() {}, removeEventListener() {} };
  try {
    await test('Compiled cloud transport keeps routes and credentials same-origin and never creates identity headers', async () => {
      const cloud = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts'));
      let captured;
      global.fetch = async (url, options) => { captured = { url, options }; return Response.json({ userId: 'owner-one', syncAvailable: true, feedbackAvailable: false, nativeAuthAvailable: false, revision: 0 }); };
      const result = await cloud.cloudAccount(); equal(result.userId, 'owner-one', 'Account decoded'); equal(captured.options.credentials, 'same-origin', 'Credentials scoped'); equal(captured.options.redirect, 'error', 'Redirects refused');
      okay(!Object.keys(captured.options.headers).some(name => /oai-authenticated|authorization/i.test(name)), 'No synthetic trusted credentials');
      await assert.rejects(() => cloud.cloudRequest('https://attacker.test/api/sync', {}), /Unsupported account route/); assertions++;
    });
    await test('Compiled transport aborts its documented timeout and respects external cancellation', async () => {
      const cloud = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts'));
      let timeoutSeen = false;
      global.setTimeout = (callback, milliseconds, ...args) => { if (milliseconds === 15000) { timeoutSeen = true; return oldTimeout(callback, 10, ...args); } return oldTimeout(callback, milliseconds, ...args); };
      global.fetch = (url, options) => new Promise((resolve, reject) => { const fail = () => reject(new DOMException('aborted', 'AbortError')); if (options.signal.aborted) fail(); else options.signal.addEventListener('abort', fail, { once: true }); });
      await assert.rejects(() => cloud.cloudAccount(), /aborted/); assertions++; okay(timeoutSeen, 'Fifteen-second deadline installed');
      const controller = new AbortController(); const pending = cloud.cloudAccount(controller.signal); controller.abort(); await assert.rejects(() => pending, /aborted/); assertions++;
      global.setTimeout = oldTimeout;
    });
    await test('Compiled transport binds account-bound GET and POST requests without selecting server identity', async () => {
      const cloud = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts')); const calls = [];
      global.fetch = async (url, options) => {calls.push({url, options}); return Response.json({error: 'account_changed'}, {status: 401});};
      for (const route of ['/api/sync', '/api/daily-feedback']) {
        for (const body of [undefined, {mutationId: crypto.randomUUID()}]) {
          await assert.rejects(() => cloud.cloudRequest(route, body), /authenticated account/); assertions++;
          await assert.rejects(() => cloud.cloudRequest(route, body, undefined, 'owner-one'), error => error instanceof cloud.CloudError && error.status === 401); assertions++;
        }
      }
      equal(calls.length, 4, 'Missing account binding cannot reach fetch');
      okay(calls.every(call => call.options.headers['X-Movefield-Expected-Account'] === 'owner-one'), 'Reviewed owner sent as rejection precondition');
      okay(calls.every(call => !Object.keys(call.options.headers).some(name => /oai-authenticated|authorization/i.test(name))), 'No trusted identity or bearer credentials fabricated');
    });
    await test('Malformed null account/API JSON returns a controlled CloudError', async () => {
      const cloud = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts'));
      global.fetch = async () => Response.json(null, { status: 503 });
      await assert.rejects(() => cloud.cloudRequest('/api/account'), error => error instanceof cloud.CloudError); assertions++;
    });
    await test('Oversized streamed responses are cancelled before unbounded buffering', async () => {
      const cloud = createTsxLoader(repo).load(path.join(repo, 'lib/cloud-client.ts')); let read = 0, cancelled = false;
      global.fetch = async () => new Response(new ReadableStream({ pull(controller) { read++; if (read > 100) controller.close(); else controller.enqueue(new Uint8Array(65536).fill(32)); }, cancel() { cancelled = true; } }));
      await assert.rejects(() => cloud.cloudRequest('/api/sync', undefined, undefined, 'owner-one'), error => error instanceof cloud.CloudError); assertions++; okay(read < 100, 'Oversized response stopped early'); okay(cancelled, 'Readable body cancelled');
    });
    await test('Feedback mount and ineligible callbacks never transmit metrics', async () => {
      for (const patch of [{ state: { ...state(), hold: true } }, { state: { ...state(), profile: { age: 17 } } }, { saved: false }]) {
        const f = mountFeedback(patch); await f.mount(); equal(f.calls, [], 'No mount-time send'); const action = button(f.h, 'Request feedback for latest workout'); equal(action.props.disabled, true, 'Action disabled'); action.props.onClick(); await f.h.settle(); equal(f.calls, [], 'Retained callback still respects eligibility'); f.h.unmount();
      }
    });
    await test('Rapid feedback presses create one UUID and send only the completed metric array', async () => {
      const pending = deferred(); const f = mountFeedback({ account: () => pending.promise }); await f.mount(); const action = button(f.h, 'Request feedback for latest workout'); action.props.onClick(); action.props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'account').length, 1, 'Synchronous ref prevents duplicate account request');
      pending.resolve({ userId: 'owner-one', feedbackAvailable: true }); await until(f.h, () => f.calls.some(call => call.kind === 'post')); const post = f.calls.find(call => call.kind === 'post'); okay(post, 'One post exists');
      equal(Object.keys(post.body).sort(), ['adult', 'completedAt', 'consent', 'metrics', 'requestId', 'symptom', 'workoutId'], 'Exact metrics contract'); equal(post.expectedAccountId, 'owner-one', 'Feedback POST binds reviewed owner'); okay(!JSON.stringify(post.body).includes('private'), 'Names and notes omitted'); okay(f.h.text().includes('Saved retrospective.'), 'Persisted complete feedback visible'); f.h.unmount();
    });
    await test('Accepted pending feedback is withheld until identity-matched saved completion', async () => {
      const pending = deferred(); let body;
      const f = mountFeedback({ request: async (url, payload) => { if (payload) { body = payload; return pending.promise; } return { requestId: body.requestId, workoutId: body.workoutId, status: 'complete', feedback: 'Saved after poll.' }; } });
      await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => !!body); okay(!f.h.text().includes('Saved after poll.'), 'No text before server receipt');
      global.setTimeout = (callback, milliseconds, ...args) => oldTimeout(callback, milliseconds <= 10000 ? 0 : milliseconds, ...args);
      pending.resolve({ requestId: body.requestId, workoutId: body.workoutId, status: 'pending', feedback: 'Do not show accepted text.' }); await f.h.settle(); okay(!f.h.text().includes('Do not show accepted text.'), 'Pending text ignored');
      for (let attempt = 0; attempt < 10 && !f.h.text().includes('Saved after poll.'); attempt++) { await new Promise(resolve => oldTimeout(resolve, 5)); await f.h.settle(); } okay(f.h.text().includes('Saved after poll.'), 'Matched saved result visible'); equal(f.calls.find(call => call.kind === 'poll').expectedAccountId, 'owner-one', 'Feedback polling binds reviewed owner'); f.h.unmount(); global.setTimeout = oldTimeout;
    });
    await test('Feedback complete response for another workout/request is never displayed', async () => {
      const f = mountFeedback({ request: async () => ({ requestId: crypto.randomUUID(), workoutId: 'different-workout', status: 'complete', feedback: 'Wrong workout feedback.' }) }); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.calls.some(call => call.kind === 'post')); okay(!f.h.text().includes('Wrong workout feedback.'), 'Mismatched completion refused'); okay(f.h.text().includes('did not match'), 'Mismatch error visible'); f.h.unmount();
    });
    await test('Replacing latest workout cancels old feedback and suppresses its late completion', async () => {
      const pending = deferred(); let oldSignal, payload;
      const f = mountFeedback({ request: async (url, body, signal) => { oldSignal = signal; payload = body; return pending.promise; } }); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => !!oldSignal); await f.set({ state: state('new-workout') });
      okay(oldSignal.aborted, 'Old workout request aborted'); pending.resolve({ requestId: payload.requestId, workoutId: payload.workoutId, status: 'complete', feedback: 'Stale prior workout text.' }); await f.h.settle(); okay(!f.h.text().includes('Stale prior workout text.'), 'Late prior completion suppressed'); f.h.unmount();
    });
    await test('A new safety hold cancels pending feedback and clears previously shown text', async () => {
      const f = mountFeedback(); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.h.text().includes('Saved retrospective.')); okay(f.h.text().includes('Saved retrospective.'), 'Initial result shown'); await f.set({ state: { ...state(), hold: true } }); okay(!f.h.text().includes('Saved retrospective.'), 'Safety hold clears text'); f.h.unmount();
    });
    await test('Failed feedback retry preserves its idempotency key for the same saved workout', async () => {
      let count = 0;
      const f = mountFeedback({ request: async (url, body) => { count++; if (count === 1) throw Error('Injected network timeout'); return { requestId: body.requestId, workoutId: body.workoutId, status: 'complete', feedback: 'Retried saved result.' }; } }); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.h.text().includes('Injected network timeout')); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.h.text().includes('Retried saved result.')); const posts = f.calls.filter(call => call.kind === 'post'); equal(posts.length, 2, 'Two explicit attempts'); equal(posts[0].body.requestId, posts[1].body.requestId, 'Identical UUID retry'); f.h.unmount();
    });
    await test('Stopping feedback polling retains the workout and ignores late server text', async () => {
      const pending = deferred(); let payload;
      const f = mountFeedback({ request: async (url, body) => { payload = body; return pending.promise; } }); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => !!payload); button(f.h, 'Stop checking').props.onClick(); pending.resolve({ requestId: payload.requestId, workoutId: payload.workoutId, status: 'complete', feedback: 'Late cancelled result.' }); await f.h.settle(); okay(!f.h.text().includes('Late cancelled result.'), 'Cancelled text suppressed'); equal(f.calls.filter(call => call.kind === 'post')[0].body.workoutId, 'workout-one', 'Completed workout identity retained'); f.h.unmount();
    });
    await test('Account password never goes into transport calls during compiled UI selection', async () => {
      const f = mountAccount(); await f.mount(); const input = f.h.find(value => value.type === 'Input'); input.props.onChange({ target: { value: 'a private account password' } }); await f.h.settle(); button(f.h, 'Unlock account sync').props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'unlock').length, 1, 'Only unlock receives password'); equal(f.h.find(value => value.type === 'Input'), undefined, 'Password input hidden after review'); button(f.h, 'Keep this device’s copy and sync').props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'activate').length, 1, 'One activation'); equal(f.calls.filter(call => call.kind === 'queue').length, 1, 'Chosen local copy queued'); f.h.unmount();
    });
    await test('Repeated account selection callbacks cannot replace local training twice', async () => {
      const replacement = deferred(); const f = mountAccount({ replace: () => replacement.promise }); await f.mount(); f.h.find(value => value.type === 'Input').props.onChange({ target: { value: 'a private account password' } }); await f.h.settle(); button(f.h, 'Unlock account sync').props.onClick(); await f.h.settle(); const action = button(f.h, 'Use reviewed account copy'); action.props.onClick(); action.props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'replace').length, 1, 'Synchronous selection guard'); replacement.resolve(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'activate').length, 1, 'One activation after durable replace'); f.h.unmount();
    });
    await test('Unsaved changes made during account review block a stale copy selection', async () => {
      const f = mountAccount(); await f.mount(); f.h.find(value => value.type === 'Input').props.onChange({ target: { value: 'a private account password' } }); await f.h.settle(); button(f.h, 'Unlock account sync').props.onClick(); await f.h.settle(); await f.set({ saved: false }); const action = button(f.h, 'Use reviewed account copy'); okay(action.props.disabled, 'Selection disabled while local save is pending'); action.props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'replace').length, 0, 'Retained selection callback guarded'); f.h.unmount();
    });
    await test('Feedback UUID survives remount and binds account plus completed workout', async () => {
      const identifiers = [];
      for (const accountId of ['owner-one', 'owner-one', 'owner-two']) {
        const f = mountFeedback({account: async () => ({userId: accountId, feedbackAvailable: true})}); await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.calls.some(call => call.kind === 'post')); identifiers.push(f.calls.find(call => call.kind === 'post').body.requestId); f.h.unmount();
      }
      equal(identifiers[0], identifiers[1], 'Remount retries identical UUID'); okay(identifiers[0] !== identifiers[2], 'Another account receives another UUID'); okay(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(identifiers[0]), 'Supported custom UUID version eight');
    });
    await test('Backend retry timing is respected and account changes stop polling', async () => {
      let count = 0, payload, delay;
      const f = mountFeedback({account: async () => ({userId: ++count === 1 ? 'owner-one' : 'owner-two', feedbackAvailable: true}), request: async (url, body) => {payload = body; return {requestId: body.requestId, workoutId: body.workoutId, status: 'pending', retryAfterMs: 5000};}});
      global.setTimeout = (callback, milliseconds, ...args) => {delay = milliseconds; return oldTimeout(callback, 0, ...args);};
      await f.mount(); button(f.h, 'Request feedback for latest workout').props.onClick(); await until(f.h, () => f.h.text().includes('account changed')); equal(delay, 5000, 'Backend retry timing used'); equal(f.calls.filter(call => call.kind === 'poll').length, 0, 'No cross-account job poll'); okay(payload, 'Initial consented request existed'); f.h.unmount(); global.setTimeout = oldTimeout;
    });
    await test('Unmount cancels pending feedback and suppresses all late state updates', async () => {
      const pending = deferred(); let payload;
      const f = mountFeedback({request: async (url, body) => {payload = body; return pending.promise;}}); await f.mount(); const action = button(f.h, 'Request feedback for latest workout'); action.props.onClick(); await until(f.h, () => !!payload); f.h.unmount(); const cells = f.h.cells.filter(cell => cell.kind === 'state').map(cell => structuredClone(cell.value));
      pending.resolve({requestId: payload.requestId, workoutId: payload.workoutId, status: 'complete', feedback: 'Late unmounted feedback.'}); await f.h.settle(); equal(f.h.cells.filter(cell => cell.kind === 'state').map(cell => structuredClone(cell.value)), cells, 'Unmount has no late state mutation'); const before = f.calls.length; action.props.onClick(); await f.h.settle(); equal(f.calls.length, before, 'Retained unmounted callback cannot send');
    });
    await test('Compiled sync activation atomically discards reviewed account queue and preserves other tenants', async () => {
      const f = syncService(); await f.service.unlock('private password'); await f.service.activate(f.remote); equal(f.calls.find(call => call.kind === 'pull').expectedAccountId, 'owner-one', 'Encrypted pull binds reviewed owner'); equal(f.calls.filter(call => call.kind === 'reconcile').length, 1, 'One atomic reconciliation'); equal(f.queue().accounts['owner-one'], {revision: 4, pending: []}, 'Old selected queue rebased after explicit choice'); equal(f.queue().accounts['other-owner'].pending.length, 1, 'Other account queue preserved'); equal(f.service.getSnapshot().active, true, 'Chosen account activated'); equal(await f.service.prepare(f.remote), undefined, 'Unchanged chosen remote state does not overwrite with stale queue'); f.service.disconnect();
    });
    await test('Compiled sync disconnect during activation prevents late reactivation and duplicate activation', async () => {
      const pending = deferred(), f = syncService({reconcile: () => pending.promise}); await f.service.unlock('private password'); const first = f.service.activate(state()); await until({settle: async () => {}}, () => f.calls.some(call => call.kind === 'reconcile')); await assert.rejects(() => f.service.activate(state()), /Wait/); assertions++; f.service.disconnect(); pending.resolve(); await assert.rejects(() => first, /cancelled/); assertions++; equal(f.service.getSnapshot().active, false, 'Disconnected service remains inactive');
    });
    await test('Failed reconciliation and changed account/revision never activate or silently clear queue', async () => {
      const failed = syncService({reconcile: async () => {throw Error('Injected outbox conflict');}}); await failed.service.unlock('private password'); await assert.rejects(() => failed.service.activate(state()), /outbox conflict/); assertions++; equal(failed.queue().accounts['owner-one'].pending.length, 1, 'Conflict retains queued ciphertext'); equal(failed.service.getSnapshot().active, false, 'Conflict stays inactive'); failed.service.disconnect();
      for (const change of ['account', 'revision']) { const f = syncService(); await f.service.unlock('private password'); if (change === 'account') f.changeAccount('owner-two'); else f.changeRevision(5); await assert.rejects(() => f.service.activate(state()), /changed after review/); assertions++; equal(f.calls.filter(call => call.kind === 'reconcile').length, 0, 'Stale review cannot clear queue'); equal(f.service.getSnapshot().active, false, 'Stale review remains inactive'); f.service.disconnect(); }
    });
    await test('Cancelling remote replacement suppresses activation after its late durable completion', async () => {
      const pending = deferred(), f = mountAccount({replace: () => pending.promise}); await f.mount(); f.h.find(value => value.type === 'Input').props.onChange({target: {value: 'a private account password'}}); await f.h.settle(); button(f.h, 'Unlock account sync').props.onClick(); await f.h.settle(); button(f.h, 'Use reviewed account copy').props.onClick(); await f.h.settle(); button(f.h, 'Cancel').props.onClick(); pending.resolve(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'activate').length, 0, 'Cancelled review cannot activate later'); equal(f.calls.filter(call => call.kind === 'queue').length, 1, 'Cancel requests one local save while service inactive'); equal(f.service.getSnapshot().active, false, 'Local retry cannot upload'); f.h.unmount();
    });
    await test('Locking active cloud sync retries retained local saving without another upload', async () => {
      const f = mountAccount(); await f.mount(); f.h.find(value => value.type === 'Input').props.onChange({target: {value: 'a private account password'}}); await f.h.settle(); button(f.h, 'Unlock account sync').props.onClick(); await f.h.settle(); button(f.h, 'Keep this device’s copy and sync').props.onClick(); await f.h.settle(); const before = f.calls.filter(call => call.kind === 'queue').length; button(f.h, 'Lock account sync').props.onClick(); await f.h.settle(); equal(f.calls.filter(call => call.kind === 'queue').length, before + 1, 'Local save requested after lock'); equal(f.service.getSnapshot().active, false, 'Retry occurs with cloud service inactive'); f.h.unmount();
    });
  } finally { global.window = oldWindow; global.fetch = oldFetch; global.setTimeout = oldTimeout; }
  console.log(`${failures.length ? 'FAIL' : 'PASS'} cloud client UI: ${scenarios.length - failures.length}/${scenarios.length} scenarios, ${assertions} assertions (actual compiled callbacks; mocked network and hook lifecycle, no device/deployment claim)`);
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
