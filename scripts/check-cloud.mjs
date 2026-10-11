import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHmac,generateKeyPairSync,sign,randomBytes} from 'node:crypto';
const require=createRequire(import.meta.resolve('wrangler'));
const {build}=require('esbuild'),{Miniflare,createFetchMock}=require('miniflare');
await mkdir('.sites-runtime/cloud-check',{recursive:true});
await build({stdin:{contents:"import {cloudApi,reconcileCloud} from './lib/server/cloud-api'; export default {fetch:async(r,e)=>await cloudApi(r,e)||new Response('Not found',{status:404}),scheduled:async(_c,e)=>await reconcileCloud(e)};",resolveDir:process.cwd(),sourcefile:'cloud-test-entry.ts'},bundle:true,format:'esm',platform:'browser',external:['node:*'],define:{'process.env.NODE_ENV':'"production"'},outfile:'.sites-runtime/cloud-check/worker.mjs',logLevel:'warning',plugins:[{name:'synthetic-test-diagnostics',setup(b){b.onLoad({filter:/server\/cloud-api\.ts$/},async args=>({loader:'ts',contents:(await readFile(args.path,'utf8')).replace('catch(e){return json','catch(e){if(!(e instanceof ApiError))console.error(e.message);return json')}))}}]});
const secret=randomBytes(48).toString('hex'),origin='http://127.0.0.1',mock=createFetchMock();mock.disableNetConnect();
const keys=generateKeyPairSync('rsa',{modulusLength:2048}),publicJwk={...keys.publicKey.export({format:'jwk'}),kid:'synthetic-key',alg:'RS256',use:'sig'};
function token(email='alice@example.test',verified=true){const now=Math.floor(Date.now()/1000),head=Buffer.from(JSON.stringify({alg:'RS256',kid:'synthetic-key'})).toString('base64url'),payload=Buffer.from(JSON.stringify({iss:'https://accounts.google.com',aud:'synthetic-client',sub:email,email,email_verified:verified,name:'Synthetic account',iat:now,exp:now+3600})).toString('base64url');const data=head+'.'+payload;return data+'.'+sign('RSA-SHA256',Buffer.from(data),keys.privateKey).toString('base64url')}
mock.get('https://oauth2.googleapis.com').intercept({path:'/token',method:'POST'}).reply(200,()=>JSON.stringify({access_token:'synthetic-access',refresh_token:'synthetic-refresh',id_token:token(),token_type:'Bearer',expires_in:3600}),{headers:{'content-type':'application/json'}}).persist();
mock.get('https://www.googleapis.com').intercept({path:'/oauth2/v3/certs',method:'GET'}).reply(200,{keys:[publicJwk]}).persist();
let providerCalls=0,providerMode='valid',providerStarted;
mock.get('https://api.groq.com').intercept({path:'/openai/v1/chat/completions',method:'POST'}).reply(200,async opts=>{providerCalls++;providerStarted?.();const input=JSON.parse(await new Response(opts.body).text()),prompt=input.messages[0].content,digest=prompt.match(/contextDigest\":\"([a-f0-9]{64})/)[1];return JSON.stringify({choices:[{message:{content:JSON.stringify(providerMode==='valid'?{schema:1,contextDigest:digest,factIds:['effort','targets']}:{schema:1,contextDigest:digest,factIds:['unsafe'],advice:'Add training'})}}]})},{headers:{'content-type':'application/json'}}).delay(100).persist();
const mf=new Miniflare({modules:[{type:'ESModule',path:'.sites-runtime/cloud-check/worker.mjs'}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{APP_ORIGIN:origin,AUTH_SECRET:secret,GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-only',MOVEFIELD_CLOUD_ENABLED:'true',FREE_ALLOWANCE_VERIFIED:'true',MOVEFIELD_LOCAL_TEST:'true',AI_PROVIDER_VERIFIED:'true',AI_API_KEY:'synthetic-provider-only',AI_MODEL:'synthetic-model'},fetchMock:mock});
const passed=[];const check=(name,fn)=>async()=>{await fn();passed.push(name);console.log('PASS',name)};
const call=async(path,method='GET',body,cookie='',extra={})=>mf.dispatchFetch(origin+path,{method,redirect:'manual',headers:{...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
const cookies=r=>r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
try{
 const db=await mf.getD1Database('DB'),bucket=await mf.getR2Bucket('BUCKET');
 for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile('drizzle/'+file,'utf8');for(const statement of sql.split('--> statement-breakpoint'))if(statement.trim())await db.prepare(statement).run();}
 let aliceCookie='',aliceId='';
 await check('real SDK Google OAuth state, PKCE, signed ID token and persistent session (mocked Google transport)',async()=>{
  const begin=await call('/api/auth/sign-in/social','POST',{provider:'google',callbackURL:origin+'/'});assert.equal(begin.status,200);const data=await begin.json(),target=new URL(data.url);assert.equal(target.origin,'https://accounts.google.com');assert.equal(target.searchParams.get('code_challenge_method'),'S256');assert.ok(target.searchParams.get('state'));const callback='/api/auth/callback/google?code=synthetic-code&state='+encodeURIComponent(target.searchParams.get('state'));
  const finish=await call(callback,'GET',undefined,cookies(begin));assert.equal(finish.status,302);aliceCookie=cookies(finish);assert.ok(aliceCookie.includes('session_token'));
  const signed=await call('/api/auth/get-session','GET',undefined,aliceCookie);assert.equal(signed.status,200);const account=await signed.json();assert.equal(account.user.emailVerified,true);aliceId=account.user.id;
  const saved=await db.prepare('SELECT access_token,refresh_token,id_token FROM auth_account WHERE user_id=?').bind(aliceId).first();assert.deepEqual(saved,{access_token:null,refresh_token:null,id_token:null});
  const replay=await call(callback,'GET',undefined,cookies(begin));assert.equal(replay.status,302);assert.ok(!cookies(replay).includes('session_token'));
 })();
 const now=Date.now(),bobId='synthetic-owner-b',bobToken='synthetic-session-b',bobCookie='better-auth.session_token='+encodeURIComponent(bobToken+'.'+createHmac('sha256',secret).update(bobToken).digest('base64'));
 await db.prepare('INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(bobId,'Synthetic B','bob@example.test',1,now,now).run();
 await db.prepare('INSERT INTO auth_session(id,token,user_id,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind('session-b',bobToken,bobId,now+3600000,now,now).run();
 await check('unauthenticated, forged cookies, foreign origins and unsupported auth paths fail closed',async()=>{
  assert.equal((await call('/api/cloud/profile')).status,401);assert.equal((await call('/api/cloud/profile','GET',undefined,'better-auth.session_token=forged')).status,401);
  assert.equal((await call('/api/cloud/consent','POST',{adult:true,backup:true},aliceCookie,{Origin:'https://attacker.test'})).status,403);
  assert.equal((await call('/api/auth/delete-user','POST',{},aliceCookie)).status,404);assert.equal((await call('/api/auth/sign-up/email','POST',{},aliceCookie)).status,404);
  assert.equal((await call('/api/cloud/profile','PUT',{},aliceCookie)).status,405);
 })();
 const portable={format:'movefield-vault',version:1,algorithm:'AES-256-GCM',vaultId:'a'.repeat(32),purpose:'state',schema:2,keyVersion:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:'b'.repeat(32),iv:'c'.repeat(24),ciphertext:'d'.repeat(64)};
 let operation={expectedRevision:0,operationId:crypto.randomUUID(),ciphertext:JSON.stringify(portable)};
 await check('consent, owner isolation, upload acknowledgement and idempotent replay',async()=>{
  assert.equal((await call('/api/cloud/profile','POST',operation,aliceCookie)).status,403);
  assert.equal((await call('/api/cloud/consent','POST',{adult:false,backup:true},aliceCookie)).status,403);
  assert.equal((await call('/api/cloud/consent','POST',{adult:true,backup:true},aliceCookie)).status,200);
  const saved=await call('/api/cloud/profile','POST',operation,aliceCookie);assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
  const replay=await call('/api/cloud/profile','POST',operation,aliceCookie);assert.equal((await replay.json()).replayed,true);
  assert.equal((await call('/api/cloud/profile','POST',{...operation,ciphertext:JSON.stringify({...portable,iv:'e'.repeat(24)})},aliceCookie)).status,409);
  const own=await (await call('/api/cloud/profile','GET',undefined,aliceCookie)).json();assert.equal(own.ciphertext,operation.ciphertext);
  const other=await (await call('/api/cloud/profile','GET',undefined,bobCookie)).json();assert.equal(other.revision,0);assert.equal(other.ciphertext,null);assert.equal(other.ownerId,bobId);
 })();
 await check('simultaneous writes preserve exactly one head and remove the losing object',async()=>{
  const writes=[0,1].map(i=>({...operation,expectedRevision:1,operationId:crypto.randomUUID(),ciphertext:JSON.stringify({...portable,iv:(i?'e':'f').repeat(24)})}));const responses=await Promise.all(writes.map(x=>call('/api/cloud/profile','POST',x,aliceCookie)));assert.deepEqual(responses.map(x=>x.status).sort(),[200,409]);
  assert.equal((await bucket.list()).objects.length,1);assert.equal((await (await call('/api/cloud/profile','GET',undefined,aliceCookie)).json()).revision,2);
 })();
 await check('malformed/oversized envelopes and unsupported fields preserve current head',async()=>{
  assert.equal((await call('/api/cloud/profile','POST',{...operation,expectedRevision:2,ciphertext:'bad'},aliceCookie)).status,400);
  assert.equal((await call('/api/cloud/profile','POST',{...operation,ownerId:bobId},aliceCookie)).status,400);
  assert.equal((await call('/api/cloud/profile','POST',{...operation,ciphertext:'x'.repeat(10_050_001)},aliceCookie)).status,413);
 })();
 const context={policy:'highlights-v1',adult:true,mode:'app',hold:false,workout:{id:'synthetic-workout',revision:1,partial:false,effort:'right',symptom:'no',sets:[{exerciseId:'bench',set:1,reps:8,kg:20,done:true}],targets:[{exerciseId:'bench',sets:1}]}};
 let consentVersion=0;
 await check('optional coaching consent, durable deduplication and strictly selected facts',async()=>{
  assert.equal((await call('/api/cloud/coaching','POST',{revision:2,consentVersion:0,context},aliceCookie)).status,403);
  const consent=await (await call('/api/cloud/coaching-consent','POST',{adult:true,enabled:true},aliceCookie)).json();consentVersion=consent.version;
  const created=await call('/api/cloud/coaching','POST',{revision:2,consentVersion,context},aliceCookie);assert.equal(created.status,202);const job=await created.json();const result=await (await call('/api/cloud/coaching?id='+job.id,'GET',undefined,aliceCookie)).json();assert.equal(result.status,'succeeded');assert.deepEqual(result.selection.factIds,['effort','targets']);assert.equal(providerCalls,1);
  await call('/api/cloud/coaching','POST',{revision:2,consentVersion,context},aliceCookie);assert.equal(providerCalls,1);
  assert.equal((await call('/api/cloud/coaching?id='+job.id,'GET',undefined,bobCookie)).status,403);
  assert.equal((await call('/api/cloud/coaching','POST',{revision:1,consentVersion,context},aliceCookie)).status,409);
  const stored=await db.prepare('SELECT input FROM coaching_job WHERE id=?').bind(job.id).first();assert.equal(stored.input,'');
 })();
 await check('invented model advice is refused and never returned',async()=>{
  providerMode='unsafe';const created=await (await call('/api/cloud/coaching','POST',{revision:2,consentVersion,context:{...context,workout:{...context.workout,id:'synthetic-unsafe'}}},aliceCookie)).json();const result=await (await call('/api/cloud/coaching?id='+created.id,'GET',undefined,aliceCookie)).json();assert.equal(result.status,'refused');assert.equal(result.selection,null);providerMode='valid';
 })();
 await check('revoking consent cancels an in-flight provider request and prevents late publication',async()=>{
  const started=new Promise(resolve=>providerStarted=resolve);const work=call('/api/cloud/coaching','POST',{revision:2,consentVersion,context:{...context,workout:{...context.workout,id:'synthetic-in-flight'}}},aliceCookie);await started;providerStarted=null;
  assert.equal((await call('/api/cloud/coaching-consent','POST',{adult:true,enabled:false},aliceCookie)).status,200);const job=await (await work).json();const result=await (await call('/api/cloud/coaching?id='+job.id,'GET',undefined,aliceCookie)).json();assert.equal(result.status,'stale');assert.equal(result.selection,null);const stored=await db.prepare('SELECT status,input,output FROM coaching_job WHERE id=?').bind(job.id).first();assert.equal(stored.status,'cancelled');assert.equal(stored.input,'');assert.equal(stored.output,null);
 })();
 await check('daily budget reservation blocks a fourth provider dispatch without a fallback',async()=>{
  consentVersion=(await (await call('/api/cloud/coaching-consent','POST',{adult:true,enabled:true},aliceCookie)).json()).version;const created=await (await call('/api/cloud/coaching','POST',{revision:2,consentVersion,context:{...context,workout:{...context.workout,id:'synthetic-over-budget'}}},aliceCookie)).json();const result=await (await call('/api/cloud/coaching?id='+created.id,'GET',undefined,aliceCookie)).json();assert.equal(result.status,'failed');assert.equal(providerCalls,3);
 })();
 await check('account deletion requires fresh verification before tombstoning or removing data',async()=>{
  await db.prepare('UPDATE auth_session SET created_at=? WHERE user_id=?').bind(Date.now()-700000,bobId).run();const deleted=await call('/api/cloud/account','DELETE',undefined,bobCookie);assert.ok([400,401,403].includes(deleted.status));assert.ok(await db.prepare('SELECT id FROM auth_user WHERE id=?').bind(bobId).first());assert.equal(await db.prepare('SELECT deleted_at FROM cloud_profile WHERE owner_id=?').bind(bobId).first(),null);await db.prepare('UPDATE auth_session SET created_at=? WHERE user_id=?').bind(Date.now(),bobId).run();
 })();
 await check('fresh-session deletion revokes auth, removes cloud objects and blocks late writes',async()=>{
  const oldCookie=aliceCookie;const deleted=await call('/api/cloud/account','DELETE',undefined,aliceCookie);assert.equal(deleted.status,200);assert.equal(await db.prepare('SELECT id FROM auth_user WHERE id=?').bind(aliceId).first(),null);assert.ok((await db.prepare('SELECT deleted_at FROM cloud_profile WHERE owner_id=?').bind(aliceId).first()).deleted_at);assert.equal((await bucket.list()).objects.length,0);
  assert.equal((await call('/api/cloud/profile','POST',{...operation,expectedRevision:2},oldCookie)).status,401);assert.equal((await call('/api/cloud/profile','GET',undefined,bobCookie)).status,200);
 })();
 await check('sign-out invalidates the persistent session',async()=>{assert.equal((await call('/api/auth/sign-out','POST',{},bobCookie)).status,200);assert.equal((await call('/api/cloud/profile','GET',undefined,bobCookie)).status,401)})();
 await writeFile('.sites-runtime/cloud-check/results.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Local Miniflare D1/R2 and actual Better Auth SDK; synthetic users, mocked external OAuth transport; no live account/device qualification.',passed},null,2)+'\n');
}finally{await mf.dispose()}
