const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {createTsxLoader} = require('./lib/component-hook-harness.cjs');
const {coachingFixture} = require('./lib/coaching-fixture.cjs');
const repo = path.resolve(__dirname, '..');
const loader = createTsxLoader(repo);
const {handleBackendRequest} = loader.load(path.join(repo, 'server/api.ts'));
const {processCoaching} = loader.load(path.join(repo, 'server/coaching.ts'));
const {digestJson} = loader.load(path.join(repo, 'server/contracts.ts'));
const {Miniflare} = createRequire(require.resolve('wrangler'))('miniflare');
let groups = 0;
async function test(name, run) {await run(); groups++; console.log('PASS ' + name);}
const pending = () => {let resolve; const promise = new Promise(yes => {resolve = yes;}); return {promise, resolve};};
const nativeTimeout = setTimeout;
const deadline=nativeTimeout(()=>{console.error('Coaching backend test deadline exceeded before complete verification');process.exit(1);},60_000);
async function until(check) {for (let i = 0; i < 200; i++) {if (await check()) return; await new Promise(resolve => nativeTimeout(resolve, 5));} assert.fail('Actual processor did not reach checkpoint');}
function request(owner, body, query = '', headers = {}) {
  return new Request('https://movefield.example.test/api/workout-coaching' + query, {method: body === undefined ? 'GET' : 'POST',
    headers: {'oai-authenticated-user-id': owner, 'oai-authenticated-user-email': owner + '@example.test', 'x-movefield-client': 'web',
      'x-movefield-expected-account': owner, 'sec-fetch-site': 'same-origin', ...(body === undefined ? {} : {origin: 'https://movefield.example.test', 'content-type': 'application/json'}), ...headers},
    ...(body === undefined ? {} : {body: typeof body === 'string' ? body : JSON.stringify(body)})});
}
function resultFor(body, patch = {}) {
  const data = JSON.parse(body.messages[1].content);
  return {policy: data.policy, workoutId: data.workoutId, contextDigest: data.contextDigest,
    observationIds: [data.context.observations[0].id], reviewIds: [data.context.reviews[0].id], priority: 'performance', ...patch};
}
function providerResponse(body, patch = {}) {return Response.json({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(resultFor(body, patch))}}]});}

(async () => {
  const mf = new Miniflare({modules: true, script: 'export default {fetch(){return new Response("test")}}', compatibilityDate: '2026-05-15', d1Databases: {DB: 'coaching-regression'}, cf: false});
  const originalFetch = global.fetch;
  try {
    const DB = await mf.getD1Database('DB');
    const migration = file => DB.exec(fs.readFileSync(path.join(repo, 'drizzle', file), 'utf8').replace(/--> statement-breakpoint/g, '').replace(/\n/g, ' '));
    await migration('0000_account_sync.sql');
    await DB.prepare(`INSERT INTO daily_ai_feedback(owner_id,request_id,workout_id,digest,metrics_json,completed_at,status,feedback,created_at,updated_at)
      VALUES ('legacy-owner','legacy-request','legacy-workout','legacy-digest','[]','2026-10-09T00:00:00.000Z','complete','Previously saved review',0,0)`).run();
    await migration('0001_workout_coaching.sql');
    const environment = {DB, MOVEFIELD_TRUST_SITES_AUTH: '1'};
    const configured = {...environment, MOVEFIELD_AI_BASE_URL: 'https://api.groq.com/openai/v1', MOVEFIELD_AI_API_KEY: 'synthetic-test-secret', MOVEFIELD_AI_MODEL: 'mock-open-weight'};
    const tasks = [], invoke = (req, env = configured) => handleBackendRequest(req, env, promise => tasks.push(promise));
    const finish = async () => {while (tasks.length) await tasks.shift();};
    const poll = (owner, f) => invoke(request(owner, undefined, `?id=${f.requestId}&context=${f.contextDigest}`));
    const row = (owner, f) => DB.prepare('SELECT * FROM workout_ai_coaching WHERE owner_id=? AND request_id=?').bind(owner, f.requestId).first();
    const validProvider = async (url, options) => providerResponse(JSON.parse(options.body));
    global.fetch = validProvider;
    await test('Additive migration preserves persisted v1 feedback and adds constrained coaching jobs', async () => {
      assert.equal((await DB.prepare('SELECT feedback FROM daily_ai_feedback WHERE owner_id=?').bind('legacy-owner').first()).feedback, 'Previously saved review');
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM workout_ai_coaching').first()).n, 0);
    });
    await test('Coaching reads/writes require trusted same-origin owner and expected-account binding before D1', async () => {
      const f = coachingFixture(repo, 'auth-owner'), inaccessible = {...configured, DB: {withSession() {throw Error('Guard touched database');}}};
      for (const body of [undefined, f.payload]) {
        assert.equal((await invoke(request('auth-owner', body, '', {'x-movefield-expected-account': 'other-owner'}), inaccessible)).status, 401);
        assert.equal((await invoke(request('auth-owner', body, '', {'x-movefield-expected-account': ''}), inaccessible)).status, 403);
        assert.equal((await invoke(request('auth-owner', body, '', {authorization: 'Bearer synthetic'}), inaccessible)).status, 401);
        assert.equal((await invoke(request('auth-owner', body, '', {'sec-fetch-site': 'cross-site'}), inaccessible)).status, 403);
      }
      assert.equal((await invoke(request('auth-owner', f.payload, '', {origin: 'https://attacker.test'}))).status, 403);
    });
    await test('Absent or unapproved provider fails explicitly without fabricating saved coaching', async () => {
      const f = coachingFixture(repo, 'unconfigured-owner');
      for (const env of [environment, {...configured, MOVEFIELD_AI_BASE_URL: 'https://attacker.test/v1'}, {...configured, MOVEFIELD_AI_BASE_URL: 'http://api.groq.com/v1'}]) assert.equal((await invoke(request('unconfigured-owner', f.payload), env)).status, 503);
      assert.equal(await row('unconfigured-owner', f), null);
      const account = new Request('https://movefield.example.test/api/account', {headers: request('unconfigured-owner').headers});
      assert.equal((await (await invoke(account, environment)).json()).coachingAvailable, false);
    });
    await test('Explicit consent, strict minimized context, canonical digest and stable owner identity are enforced', async () => {
      const f = coachingFixture(repo, 'payload-owner');
      const cases = ['{', {...f.payload, consent: false}, {...f.payload, name: 'private'}, {...f.payload, contextDigest: 'a'.repeat(64)}, {...f.payload, requestId: crypto.randomUUID()}, {...f.payload, context: {...f.context, notes: 'private'}}, {...f.payload, context: {...f.context, profile: {...f.context.profile, adult: false}}}];
      for (const body of cases) assert.equal((await invoke(request('payload-owner', body))).status, 400);
      assert.equal((await invoke(request('payload-owner', 'x'.repeat(16_385)))).status, 413);
      assert.equal(await row('payload-owner', f), null);
      assert.ok(!JSON.stringify(f.payload).includes('private'));
      assert.equal(f.identity.workoutCoachingRequestId('payload-owner', f.contextDigest), f.requestId);
      assert.notEqual(f.identity.workoutCoachingRequestId('another-owner', f.contextDigest), f.requestId);
    });
    await test('Completed-workout and fully logged lift contracts produce only persisted identity-bound selection', async () => {
      for (const lift of [false, true]) {
        const owner = lift ? 'lift-owner' : 'saved-owner', f = coachingFixture(repo, owner, {lift});
        const accepted = await invoke(request(owner, f.payload)); assert.equal(accepted.status, 202);
        const initial = await accepted.json(); assert.ok(['pending', 'processing'].includes(initial.status)); assert.equal('reply' in initial, false);
        await finish(); const complete = await (await poll(owner, f)).json();
        assert.equal(complete.status, 'complete'); assert.equal(complete.contextDigest, f.contextDigest); assert.equal(complete.model, 'mock-open-weight');
        assert.ok(f.coaching.parseWorkoutCoachingReply(f.context, f.contextDigest, complete.reply));
        assert.equal((await row(owner, f)).context_json, null);
      }
    });
    await test('Provider request uses bounded model-specific reasoning controls only on documented Groq models',async()=>{
      for(const [index,model] of ['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.8-27b','unrecognized-model'].entries()){
        const owner='parameters-owner-'+index,f=coachingFixture(repo,owner);let sent;
        global.fetch=async(url,options)=>{sent=JSON.parse(options.body);return providerResponse(sent);};
        await invoke(request(owner,f.payload),{...configured,MOVEFIELD_AI_MODEL:model});await finish();
        assert.equal(sent.max_completion_tokens,2048);assert.equal(sent.max_tokens,undefined);assert.equal(sent.stream,false);
        if(model.startsWith('openai/gpt-oss-')){assert.equal(sent.reasoning_effort,'low');assert.equal(sent.include_reasoning,false);assert.equal(sent.reasoning_format,undefined);}
        else if(model==='qwen/qwen3.8-27b'){assert.equal(sent.reasoning_effort,'none');assert.equal(sent.reasoning_format,'hidden');assert.equal(sent.include_reasoning,undefined);}
        else{assert.equal(sent.reasoning_effort,undefined);assert.equal(sent.reasoning_format,undefined);assert.equal(sent.include_reasoning,undefined);}
        assert.equal((await row(owner,f)).status,'complete');
      }
      const owner='parameters-other-provider',f=coachingFixture(repo,owner);let sent;
      global.fetch=async(url,options)=>{sent=JSON.parse(options.body);return providerResponse(sent);};
      await invoke(request(owner,f.payload),{...configured,MOVEFIELD_AI_BASE_URL:'https://api.together.xyz/v1',MOVEFIELD_AI_MODEL:'openai/gpt-oss-120b'});await finish();
      assert.equal(sent.max_tokens,2048);assert.equal(sent.max_completion_tokens,undefined);assert.equal(sent.reasoning_effort,undefined);assert.equal(sent.include_reasoning,undefined);
      global.fetch=validProvider;
    });
    await test('Simultaneous identical requests and reopening share one receipt and processor lease', async () => {
      const owner = 'duplicate-owner', f = coachingFixture(repo, owner), wait = pending(); let calls = 0;
      global.fetch = async (url, options) => {calls++; await wait.promise; return providerResponse(JSON.parse(options.body));};
      const replies = await Promise.all([invoke(request(owner, f.payload)), invoke(request(owner, f.payload))]);
      assert.deepEqual(replies.map(response => response.status), [202, 202]); await until(() => calls === 1);
      wait.resolve(); await finish(); assert.equal(calls, 1);
      assert.equal((await invoke(request(owner, f.payload))).status, 200); await finish(); assert.equal(calls, 1);
      global.fetch = validProvider;
    });
    await test('Unknown selections, prose, stale identities and truncated/tool output fail closed', async () => {
      const outputs = [body => providerResponse(body, {observationIds: ['invented']}), body => providerResponse(body, {reviewIds: ['new-patch']}), body => providerResponse(body, {contextDigest: 'a'.repeat(64)}), body => providerResponse(body, {summary: 'Invented 100 kg'}), body => Response.json({choices: [{finish_reason: 'length', message: {content: JSON.stringify(resultFor(body))}}]}), body => Response.json({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(resultFor(body)), tool_calls: [{function: {name: 'editPlan'}}]}}]})];
      for (const [index, output] of outputs.entries()) {
        const owner = 'invalid-output-' + index, f = coachingFixture(repo, owner);
        global.fetch = async (url, options) => output(JSON.parse(options.body)); await invoke(request(owner, f.payload)); await finish();
        const result = await (await poll(owner, f)).json(); assert.equal(result.status, 'failed'); assert.equal('reply' in result, false);
        assert.equal((await row(owner, f)).context_json, null);
      }
      global.fetch = validProvider;
    });
    await test('Provider streamed response is bounded and cancelled before unbounded buffering', async () => {
      const owner = 'large-output-owner', f = coachingFixture(repo, owner); let read = 0, cancelled = false;
      global.fetch = async () => new Response(new ReadableStream({pull(controller) {read++; if (read > 100) controller.close(); else controller.enqueue(new Uint8Array(4096).fill(32));}, cancel() {cancelled = true;}}));
      await invoke(request(owner, f.payload)); await finish(); const result = await (await poll(owner, f)).json();
      assert.equal(result.status, 'failed'); assert.ok(read < 100); assert.equal(cancelled, true); global.fetch = validProvider;
    });
    await test('Generated selection cannot escape a failed database save', async () => {
      const owner = 'save-failure-owner', f = coachingFixture(repo, owner);
      await DB.exec("CREATE TRIGGER reject_coaching_save BEFORE UPDATE ON workout_ai_coaching WHEN NEW.owner_id='save-failure-owner' AND NEW.status='complete' BEGIN SELECT RAISE(ABORT,'injected'); END;");
      await invoke(request(owner, f.payload)); await finish(); const result = await (await poll(owner, f)).json();
      assert.equal(result.status, 'pending'); assert.equal('reply' in result, false); assert.equal((await row(owner, f)).reply_json, null);
      await DB.exec('DROP TRIGGER reject_coaching_save'); await DB.prepare('UPDATE workout_ai_coaching SET next_attempt_at=0 WHERE owner_id=?').bind(owner).run();
      await poll(owner, f); await finish(); assert.equal((await (await poll(owner, f)).json()).status, 'complete');
    });
    await test('Account isolation and changed context protect result polling and cancellation', async () => {
      const owner = 'isolation-owner', f = coachingFixture(repo, owner); await invoke(request(owner, f.payload)); await finish();
      assert.equal((await invoke(request('other-owner', undefined, `?id=${f.requestId}&context=${f.contextDigest}`))).status, 404);
      assert.equal((await invoke(request(owner, undefined, `?id=${f.requestId}&context=${'a'.repeat(64)}`))).status, 409);
      assert.equal((await invoke(request('other-owner', {action: 'cancel', requestId: f.requestId, contextDigest: f.contextDigest}))).status, 404);
      assert.equal((await invoke(request(owner, {action: 'cancel', requestId: f.requestId, contextDigest: 'a'.repeat(64)}))).status, 409);
    });
    await test('Cancellation clears context and prevents a late provider result from being saved', async () => {
      const owner = 'cancel-owner', f = coachingFixture(repo, owner), wait = pending(); let entered = false;
      global.fetch = async (url, options) => {entered = true; await wait.promise; return providerResponse(JSON.parse(options.body));};
      await invoke(request(owner, f.payload)); await until(() => entered);
      const cancelled = await invoke(request(owner, {action: 'cancel', requestId: f.requestId, contextDigest: f.contextDigest}), environment);
      assert.equal((await cancelled.json()).status, 'cancelled'); wait.resolve(); await finish();
      const saved = await row(owner, f); assert.equal(saved.status, 'cancelled'); assert.equal(saved.context_json, null); assert.equal(saved.reply_json, null);
      assert.equal((await (await poll(owner, f)).json()).status, 'cancelled'); global.fetch = validProvider;
    });
    await test('Explicit resumption preserves receipt and attempts while an old provider lease cannot overwrite it', async () => {
      const owner='resume-owner',f=coachingFixture(repo,owner),wait=pending(),newer=pending();let calls=0;
      global.fetch=async(url,options)=>{const attempt=++calls;await(attempt===1?wait.promise:newer.promise);return providerResponse(JSON.parse(options.body),{priority:attempt===1?'attendance':'performance'});};
      await invoke(request(owner,f.payload));await until(()=>calls===1);
      await invoke(request(owner,{action:'cancel',requestId:f.requestId,contextDigest:f.contextDigest}));
      const before=await row(owner,f);assert.equal(before.attempts,1);
      const replies=await Promise.all([invoke(request(owner,f.payload)),invoke(request(owner,f.payload))]);
      assert.deepEqual(replies.map(response=>response.status),[202,202]);await until(()=>calls===2);
      newer.resolve();
      await until(async()=> (await row(owner,f)).status==='complete');
      const saved=await row(owner,f);assert.equal(saved.attempts,2);assert.equal(saved.created_at,before.created_at);
      assert.equal(saved.provider_digest,before.provider_digest);assert.equal(saved.request_id,before.request_id);
      wait.resolve();await finish();assert.equal((await row(owner,f)).reply_json,saved.reply_json);assert.equal(calls,2);
      global.fetch=validProvider;
    });
    await test('Cancelled receipt resumption is bounded by attempts, original provider, age and shared outstanding quota', async () => {
      const owner='resume-limits-owner',f=coachingFixture(repo,owner);await invoke(request(owner,f.payload));await finish();
      await DB.prepare("UPDATE workout_ai_coaching SET status='cancelled',reply_json=NULL,attempts=3 WHERE owner_id=?").bind(owner).run();
      assert.equal((await invoke(request(owner,f.payload))).status,409);
      await DB.prepare('UPDATE workout_ai_coaching SET attempts=1 WHERE owner_id=?').bind(owner).run();
      assert.equal((await invoke(request(owner,f.payload),{...configured,MOVEFIELD_AI_MODEL:'changed-model'})).status,503);
      assert.equal((await invoke(request(owner,f.payload),environment)).status,503);
      await DB.prepare('UPDATE workout_ai_coaching SET created_at=? WHERE owner_id=?').bind(Date.now()-86_400_100,owner).run();
      assert.equal((await invoke(request(owner,f.payload))).status,409);
      await DB.prepare('UPDATE workout_ai_coaching SET created_at=? WHERE owner_id=?').bind(Date.now(),owner).run();
      for(let index=0;index<4;index++)await DB.prepare(`INSERT INTO daily_ai_feedback(owner_id,request_id,workout_id,digest,metrics_json,completed_at,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending',?,?)`).bind(owner,crypto.randomUUID(),crypto.randomUUID(),'quota','[]',new Date().toISOString(),Date.now(),Date.now()).run();
      assert.equal((await invoke(request(owner,f.payload))).status,429);assert.equal((await row(owner,f)).status,'cancelled');
      await DB.prepare("UPDATE daily_ai_feedback SET status='failed' WHERE owner_id=?").bind(owner).run();
      for(let index=0;index<7;index++)await DB.prepare(`INSERT INTO daily_ai_feedback(owner_id,request_id,workout_id,digest,metrics_json,completed_at,status,feedback,created_at,updated_at) VALUES(?,?,?,?,?,?,'complete','Saved review',?,?)`).bind(owner,crypto.randomUUID(),crypto.randomUUID(),'daily','[]',new Date().toISOString(),Date.now(),Date.now()).run();
      assert.equal((await invoke(request(owner,f.payload))).status,202);await finish();assert.equal((await row(owner,f)).attempts,2);
      assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM workout_ai_coaching WHERE owner_id=?').bind(owner).first()).n,1);
    });
    await test('Corrupted saved pending context fails terminally before a provider request', async()=>{
      const owner='corrupt-context-owner',f=coachingFixture(repo,owner);await invoke(request(owner,f.payload));await finish();
      await DB.prepare("UPDATE workout_ai_coaching SET status='pending',reply_json=NULL,context_json='{}',attempts=0 WHERE owner_id=?").bind(owner).run();
      let calls=0;global.fetch=async()=>{calls++;throw Error('Unexpected provider request');};
      await poll(owner,f);await finish();const saved=await row(owner,f);
      assert.equal(saved.status,'failed');assert.equal(saved.error_code,'coaching_invalid_context');assert.equal(saved.context_json,null);assert.equal(calls,0);
      global.fetch=validProvider;
    });
    await test('Real provider timeout aborts at eight seconds and persists bounded retry timing', async () => {
      const owner = 'timeout-owner', f = coachingFixture(repo, owner); let aborted = false;
      global.fetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => {aborted = true; reject(new DOMException('timeout', 'AbortError'));}, {once: true}));
      const start = Date.now(); await invoke(request(owner, f.payload)); await finish(); const saved = await row(owner, f);
      assert.equal(aborted, true); assert.ok(Date.now() - start >= 7_900); assert.equal(saved.status, 'pending'); assert.equal(saved.attempts, 1); assert.ok(saved.next_attempt_at > Date.now());
      global.fetch = validProvider;
    });
    await test('Retry attempts and expired final leases fail terminally and clear pending context', async () => {
      const owner = 'attempt-owner', f = coachingFixture(repo, owner); global.fetch = async () => new Response('', {status: 429});
      await invoke(request(owner, f.payload)); await finish();
      for (let attempt = 1; attempt < 3; attempt++) {await DB.prepare('UPDATE workout_ai_coaching SET next_attempt_at=0 WHERE owner_id=?').bind(owner).run(); await poll(owner, f); await finish();}
      const terminal = await row(owner, f); assert.equal(terminal.status, 'failed'); assert.equal(terminal.attempts, 3); assert.equal(terminal.context_json, null);
      const expiredOwner = 'expired-owner', expired = coachingFixture(repo, expiredOwner); global.fetch = validProvider; await invoke(request(expiredOwner, expired.payload)); await finish();
      await DB.prepare("UPDATE workout_ai_coaching SET status='processing',reply_json=NULL,context_json=?,attempts=3,lease_until=0 WHERE owner_id=?").bind(expired.coaching.serializeWorkoutCoaching(expired.context), expiredOwner).run();
      await poll(expiredOwner, expired); await finish(); assert.equal((await row(expiredOwner, expired)).error_code, 'coaching_attempts_exhausted');
    });
    await test('Provider configuration is fixed per accepted job without storing secrets', async () => {
      const owner = 'configuration-owner', f = coachingFixture(repo, owner), endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      await DB.prepare(`INSERT INTO workout_ai_coaching(owner_id,request_id,workout_id,policy,context_digest,context_json,provider_model,provider_digest,status,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,'pending',?,?)`).bind(owner,f.requestId,f.context.workoutId,f.context.policy,f.contextDigest,f.coaching.serializeWorkoutCoaching(f.context),configured.MOVEFIELD_AI_MODEL,await digestJson({endpoint,model:configured.MOVEFIELD_AI_MODEL}),Date.now(),Date.now()).run();
      let calls = 0; global.fetch = async () => {calls++; throw Error('Unexpected provider call');};
      await processCoaching(DB.withSession('first-primary'), owner, f.requestId, {...configured, MOVEFIELD_AI_MODEL: 'changed-model'});
      const saved = await row(owner, f); assert.equal(saved.status, 'failed'); assert.equal(saved.error_code, 'coaching_provider_changed'); assert.equal(calls, 0); assert.ok(!JSON.stringify(saved).includes('synthetic-test-secret')); global.fetch = validProvider;
    });
    await test('V1 and coaching share atomic concurrent outstanding and rolling daily quotas', async () => {
      const owner = 'quota-owner', wait = pending();
      const mixedReply = body => body.messages[0].content.startsWith('You write') ? Response.json({choices:[{message:{content:JSON.stringify({feedback:'You recorded your completed work.'})}}]}) : providerResponse(body);
      global.fetch = async (url, options) => {await wait.promise; return mixedReply(JSON.parse(options.body));};
      const v1 = () => ({requestId:crypto.randomUUID(),workoutId:crypto.randomUUID(),completedAt:new Date().toISOString(),consent:true,adult:true,symptom:'no',metrics:[{exerciseId:'bench',set:1,reps:8,kg:50}]});
      const callV1 = value => {const req = request(owner, value); return invoke(new Request('https://movefield.example.test/api/daily-feedback',req));};
      const jobs = Array.from({length:10},(_,index)=>index%2?callV1(v1()):invoke(request(owner,coachingFixture(repo,owner).payload)));
      const results = await Promise.all(jobs); assert.equal(results.filter(x=>x.status===202).length,4); assert.equal(results.filter(x=>x.status===429).length,6);
      wait.resolve(); await finish(); global.fetch = async (url, options) => mixedReply(JSON.parse(options.body));
      for(let index=4;index<12;index++){const result=index%2?await callV1(v1()):await invoke(request(owner,coachingFixture(repo,owner).payload));assert.equal(result.status,202);await finish();}
      assert.equal((await invoke(request(owner,coachingFixture(repo,owner).payload))).status,429); assert.equal((await callV1(v1())).status,429); global.fetch = validProvider;
    });
    await test('Abandoned jobs across both versions release capacity without deleting completed receipts', async () => {
      const owner='abandoned-owner',f=coachingFixture(repo,owner),old=Date.now()-86_400_100;
      for(let index=0;index<3;index++)await DB.prepare(`INSERT INTO daily_ai_feedback(owner_id,request_id,workout_id,digest,metrics_json,completed_at,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending',?,?)`).bind(owner,crypto.randomUUID(),crypto.randomUUID(),'old','[]',new Date(old).toISOString(),old,old).run();
      await DB.prepare(`INSERT INTO workout_ai_coaching(owner_id,request_id,workout_id,policy,context_digest,context_json,provider_model,provider_digest,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'pending',?,?)`).bind(owner,f.requestId,f.context.workoutId,f.context.policy,f.contextDigest,f.coaching.serializeWorkoutCoaching(f.context),'mock','old',old,old).run();
      const fresh=coachingFixture(repo,owner);assert.equal((await invoke(request(owner,fresh.payload))).status,202);await finish();
      assert.equal((await row(owner,f)).context_json,null);assert.equal((await row(owner,f)).error_code,'coaching_request_expired');
      assert.equal((await DB.prepare("SELECT COUNT(*) AS n FROM daily_ai_feedback WHERE owner_id=? AND status='failed' AND metrics_json='[]'").bind(owner).first()).n,3);
    });
    await test('Result framing is private, secret-free and refuses corrupted saved JSON', async () => {
      const owner='private-owner',f=coachingFixture(repo,owner);await invoke(request(owner,f.payload));await finish();const result=await poll(owner,f);
      assert.match(result.headers.get('cache-control'),/no-store/);assert.equal(result.headers.get('cross-origin-resource-policy'),'same-origin');assert.ok(!(await result.text()).includes('synthetic-test-secret'));
      await DB.prepare('UPDATE workout_ai_coaching SET reply_json=? WHERE owner_id=?').bind('{"summary":"fake"}',owner).run();assert.equal((await poll(owner,f)).status,503);
    });
    await finish();assert.equal(groups,21); console.log(`${groups} coaching backend integration groups passed (actual ephemeral D1; mocked provider, real timeout; no deployment/model-quality claim)`);
  } finally {global.fetch = originalFetch; await mf.dispose();}
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(()=>clearTimeout(deadline));
