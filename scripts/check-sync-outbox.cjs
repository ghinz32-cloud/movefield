const assert=require('node:assert/strict'),path=require('node:path'),{webcrypto,randomUUID}=require('node:crypto');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb'),{createSourceLoader}=require('./lib/native-source-loader.cjs');
const loader=createSourceLoader(path.resolve(__dirname,'..')),S=loader.load(path.resolve('lib/sync-outbox.ts')),B=loader.load(path.resolve('lib/browser-record-store.ts'));
const SLOT='training-studio-v2',ACCOUNT='a-private-account-id',OTHER='other-private-account-id',SECRET='Private workout marker never copied 7CAE';
let checks=0;const scenarios=[];
const same=(value,expected,message)=>{assert.deepEqual(value,expected,message);checks++;};
const ok=(value,message)=>{assert.ok(value,message);checks++;};
async function reject(job,code,message){await assert.rejects(async()=>typeof job==='function'?job():job,e=>e.code===code,message);checks++;}
async function scenario(name,job){await job();scenarios.push(name);console.log('PASS '+name);}
const rawEnvelope=JSON.stringify({format:'movefield-sync',version:1,kdf:{name:'argon2id',m:19456,t:2,p:1,salt:'a1'.repeat(16)},cipher:'aes-256-gcm',nonce:'b2'.repeat(12),data:Buffer.alloc(32,7).toString('base64')});
const entry=(id='state-head',ciphertext=rawEnvelope)=>({id,ciphertext});
const input=(records=[entry()],now=1000)=>({accountId:ACCOUNT,mutationId:randomUUID(),records,now});
function fixture(){const idb=new IDBFactory(),legacy={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};return{idb,store:B.createBrowserRecordStore({idb,legacy,slots:[SLOT]}),make:()=>B.createBrowserRecordStore({idb,legacy,slots:[SLOT]})};}
async function sealLocal(key,text){const iv=webcrypto.getRandomValues(new Uint8Array(12));const data=await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('movefield-vault:1:'+SLOT)},key,new TextEncoder().encode(text));return JSON.stringify({v:1,alg:'aes-256-gcm',iv:Buffer.from(iv).toString('base64'),data:Buffer.from(data).toString('base64')});}
async function setup(){const f=fixture();const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await f.store.compareAndCommit({expected:await f.store.snapshot(),records:{[SLOT]:await sealLocal(key,SECRET)},key,migrated:true});return{...f,key};}
async function enqueue(f,patch=input(),text='saved locally'){return f.store.compareAndCommit({expected:await f.store.snapshot(),records:{[SLOT]:await sealLocal(f.key,text)},sync:patch});}
const claimArgs=(now=1000)=>({accountId:ACCOUNT,leaseId:randomUUID(),now});
const ack=(claim,revision=claim.baseRevision+1)=>({accountId:claim.accountId,leaseId:claim.leaseId,mutationId:claim.mutationId,baseRevision:claim.baseRevision,revision});
(async()=>{
 await scenario('Strict metadata schema rejects plaintext, keys, duplicate identifiers and unknown fields before storage',async()=>{
  same(S.isSyncCiphertext(rawEnvelope),true,'canonical sync envelope accepted');
  for(const value of [SECRET,JSON.stringify({password:SECRET}),JSON.stringify({...JSON.parse(rawEnvelope),password:SECRET}),JSON.stringify({...JSON.parse(rawEnvelope),nonce:'c'.repeat(48)}),JSON.stringify({...JSON.parse(rawEnvelope),data:'a'.repeat(25)}),JSON.stringify({...JSON.parse(rawEnvelope),kdf:{...JSON.parse(rawEnvelope).kdf,m:4}})])same(S.isSyncCiphertext(value),false,'unsafe sync payload refused');
  await reject(()=>S.validateSyncEnqueue(input([entry('state-head',SECRET)])),'unknown-format','plaintext refused');
  await reject(()=>S.validateSyncEnqueue(input([entry(),entry()])),'unknown-format','duplicate entity ids refused');
  await reject(()=>S.validateSyncEnqueue({...input(),password:SECRET}),'unknown-format','plaintext field refused');
  await reject(()=>S.validateSyncEnqueue({...input(),accountId:'a@b.com'}),'unknown-format','email account scope refused');
  await reject(()=>S.validateSyncOutbox({version:1,accounts:{constructor:{revision:0,pending:[]}}}),'unknown-format','prototype-like account scope refused');
  await reject(()=>S.validateSyncEnqueue({...input(),accountId:'toString'}),'unknown-format','inherited account scope refused');
 });
 await scenario('All 5,000 history entities and final head split atomically into bounded immutable requests',async()=>{
  const entities=Array.from({length:5000},(_,i)=>entry('history-'+String(i).padStart(64,'0'))),patch=input([entry(),...entities]);
  const state=S.enqueueSync(S.emptySyncOutbox(),patch),pending=state.accounts[ACCOUNT].pending;
  same(pending.length,201,'5000 history entities require200 batches plus final head');
  same(pending.at(-1).records.map(r=>r.id),['state-head'],'head published alone last even if supplied first');
  same(new Set(pending.map(row=>row.mutationId)).size,201,'derived UUIDs unique');
  ok(pending.every(row=>row.records.length<=25&&JSON.stringify(row.records).length<S.SYNC_MUTATION_MAX_CHARS),'all request batches bounded');
  same(pending.slice(0,-1).flatMap(row=>row.records).length,5000,'no history entity dropped');
  same(JSON.stringify(S.validateSyncOutbox(state)),JSON.stringify(state),'large state reopens without mutation');
  const oversized={...JSON.parse(rawEnvelope),data:'a'.repeat(1_000_000)};
  await reject(()=>S.enqueueSync(state,input([entry('large',JSON.stringify(oversized))])),'unknown-format','perentity size refused');
  same(state.accounts[ACCOUNT].pending.length,201,'failed enqueue preserves original state');
 });
 await scenario('Opaque local ciphertext and queued sync commit together; post-request abort or quota rolls back both',async()=>{
  const f=await setup(),before=await f.store.snapshot(),patch=input();
  const put=IDBObjectStore.prototype.put;let requestSucceeded=false;
  IDBObjectStore.prototype.put=function(value,...args){const request=put.call(this,value,...args);if(this.name==='metadata'&&args[0]==='sync-outbox-v1')request.addEventListener('success',()=>{requestSucceeded=true;this.transaction.abort();});return request;};
  try{await reject(()=>enqueue(f,patch,'must rollback'),'unavailable','complete rollback reported after successful outbox request');}finally{IDBObjectStore.prototype.put=put;}
  ok(requestSucceeded,'actual outbox request succeeded before transaction abort');
  same((await f.make().snapshot()).records,before.records,'local record retained after abort');
  same((await f.make().syncSnapshot()).accounts,{},'outbox absent after abort');
  IDBObjectStore.prototype.put=function(value,...args){if(this.name==='metadata'&&args[0]==='sync-outbox-v1')throw new DOMException('Injected quota','QuotaExceededError');return put.call(this,value,...args);};
  try{await reject(()=>enqueue(f,input(),'also rollback'),'unavailable','outbox quota rejects local mutation');}finally{IDBObjectStore.prototype.put=put;}
  same((await f.make().snapshot()).records,before.records,'quota retains local record');
  const saved=await enqueue(f,patch,SECRET);
  same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending[0].mutationId,patch.mutationId,'fresh adapter reopens queue');
  ok(!JSON.stringify(saved.sync).includes(SECRET),'outbox contains no workout plaintext');
  ok(!JSON.stringify(saved.sync).includes('data-key'),'outbox contains no local key');
 });
 await scenario('Cross-tab leases serialize requests; stale ack and old failure cannot clear newer queued saves',async()=>{
  const f=await setup();await enqueue(f);const oldRevision=(await f.store.snapshot()).revision;
  const claims=await Promise.all([f.store.claimSync(claimArgs()),f.make().claimSync(claimArgs())]);
  same(claims.filter(Boolean).length,1,'exactly one tab claims queue head');
  const head=claims.find(Boolean);await enqueue(f,input(),'newer local edit');
  same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending.length,2,'newer mutation remains queued beside attempted head');
  same(await f.make().acknowledgeSync(ack(head)),true,'matching server receipt acknowledged');
  same((await f.store.syncSnapshot()).accounts[ACCOUNT].pending.length,1,'ack preserves newer mutation');
  same(await f.store.acknowledgeSync(ack(head)),false,'duplicate old ack cannot clear newer item');
  await f.store.failSync({...head,now:1000,reason:'network'});
  same((await f.store.syncSnapshot()).accounts[ACCOUNT].pending[0].attempts,0,'old failure cannot modify newer head');
  const newest=await f.store.claimSync(claimArgs());
  same(newest.baseRevision,1,'newer request uses acknowledged remote revision');
  same((await f.store.snapshot()).revision,oldRevision+1,'sync lease and ack never advance local save revision');
  same(await f.store.acknowledgeSync(ack(newest)),true,'newer request acknowledged independently');
 });
 await scenario('Timeouts, response loss and dead zones retain exact UUID/body with bounded exponential retry',async()=>{
  const f=await setup(),patch=input();await enqueue(f,patch);let clock=1000,observed;
  const runner=S.createSyncOutboxRunner({store:f.store,uuid:randomUUID,now:()=>clock,timeoutMs:10,isAccountActive:id=>id===ACCOUNT,send:async(req,signal)=>{observed={req,signal};return new Promise(()=>{});}});
  same(await runner.flush(ACCOUNT),{sent:0,state:'retry'},'uncooperative timeout returns promptly');
  ok(observed.signal.aborted,'timeout aborts transport');
  same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending[0].mutationId,patch.mutationId,'timeout retains request');
  same(await f.make().claimSync(claimArgs(clock)),null,'backoff prevents immediate retry');
  clock=2000;const retry=await f.make().claimSync(claimArgs(clock));
  same({mutationId:retry.mutationId,baseRevision:retry.baseRevision,records:retry.records},observed.req,'retry body identical after reopening');
  await f.store.failSync({...retry,now:clock,reason:'network'});
  same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending[0].nextAttemptAt,4000,'second retry delay doubles');
  clock=4000;const lost=await f.store.claimSync(claimArgs(clock));
  const reclaimed=await f.make().claimSync(claimArgs(clock+60_000));
  same(reclaimed.mutationId,lost.mutationId,'expired process lease retains original idempotency identifier');
  same(await f.store.acknowledgeSync(ack(lost)),false,'stale lease receipt leaves active replay intact');
  same(await f.make().acknowledgeSync(ack(reclaimed)),true,'replayed receipt safely completes original request');
 });
 await scenario('Never-dispatched edits coalesce without publishing heads before newly staged histories',async()=>{
  let state=S.enqueueSync(S.emptySyncOutbox(),input([entry('history-1'),entry('history-2')]));
  state=S.enqueueSync(state,input([entry('history-2',null),entry('history-3')]));
  same(state.accounts[ACCOUNT].pending.length,1,'unsent entity mutations coalesce');
  same(state.accounts[ACCOUNT].pending[0].records.find(r=>r.id==='history-2').ciphertext,null,'newest deletion preserved');
  state=S.enqueueSync(state,input([entry()]));state=S.enqueueSync(state,input([entry('history-4'),entry()]));
  same(state.accounts[ACCOUNT].pending.map(row=>row.records.map(r=>r.id)),[['history-1','history-2','history-3'],['state-head'],['history-4'],['state-head']],'new entity stage follows previous complete head and precedes new complete head');
 });
 await scenario('Account changes, reset and restored keys invalidate pending work without clearing newer unrelated accounts',async()=>{
  const f=await setup();await f.store.setSyncRevision({accountId:ACCOUNT,revision:7,expectedRevision:0});
  await enqueue(f);const old=await f.store.claimSync(claimArgs());
  await enqueue(f,{...input(),accountId:OTHER});
  same(await f.store.claimSync({...claimArgs(),accountId:'not-enrolled'}),null,'unknown account cannot claim another queue');
  await f.store.clearSync(ACCOUNT);
  same((await f.make().syncSnapshot()).accounts[OTHER].pending.length,1,'account disconnect preserves other account');
  same(await f.store.acknowledgeSync(ack(old)),false,'receipt after disconnect rejected');
  await enqueue(f);const before=await f.store.snapshot();await f.store.reset(before);
  same(Object.values((await f.make().syncSnapshot()).accounts).flatMap(v=>v.pending).length,0,'key deletion clears pending work atomically');
  same((await f.store.syncSnapshot()).accounts[ACCOUNT].revision,7,'reset retains known remote CAS revision');
  same((await f.store.snapshot()).records[SLOT],null,'reset commits local tombstone');
 });
 await scenario('Conflicts pause for explicit resolution; expired auth can resume after account reauthentication',async()=>{
  const f=await setup();await enqueue(f);const initial=await f.store.claimSync(claimArgs());
  await f.store.failSync({...initial,now:1000,reason:'auth'});
  same(await f.make().claimSync(claimArgs(100_000)),null,'auth failures pause');
  await f.store.resumeSyncAuth(ACCOUNT);const resumed=await f.store.claimSync(claimArgs(100_000));same(resumed.mutationId,initial.mutationId,'reauthentication preserves idempotency request');
  await f.store.failSync({...resumed,now:100_000,reason:'conflict'});
  await f.store.resumeSyncAuth(ACCOUNT);same(await f.make().claimSync(claimArgs(1_000_000)),null,'auth resume never blindly retries revision conflict');
  await reject(()=>f.store.setSyncRevision({accountId:ACCOUNT,revision:12,expectedRevision:0}),'conflict','remote pull cannot rebase attempted request');
 });
 await scenario('Runner sends only after durable claim and verifies server receipt; cancellation retains pending data',async()=>{
  const f=await setup();await enqueue(f);let sends=0;
  const runner=S.createSyncOutboxRunner({store:f.store,uuid:randomUUID,isAccountActive:id=>id===ACCOUNT,send:async(req,signal,account)=>{same(account,ACCOUNT,'transport pinned to claimed account');ok(!signal.aborted,'transport active');same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending[0].mutationId,req.mutationId,'durable request visible before fetch');sends++;return{mutationId:req.mutationId,revision:req.baseRevision+1,replayed:false};}});
  same(await runner.flush(ACCOUNT),{sent:1,state:'synced'},'matching saved server receipt clears queue');same(sends,1,'single request');
  await enqueue(f);
  let started;const ready=new Promise(r=>started=r);const cancelled=S.createSyncOutboxRunner({store:f.store,uuid:randomUUID,isAccountActive:()=>true,send:()=>{started();return new Promise(()=>{});}});const work=cancelled.flush(ACCOUNT);await ready;cancelled.cancel();same((await work).state,'cancelled','cancel interrupts ignored transport promptly');same((await f.make().syncSnapshot()).accounts[ACCOUNT].pending.length,1,'cancel retains durable local mutation');
 });
 console.log(JSON.stringify({checks,scenarios,limits:'Actual fake-indexeddb transactions, WebCrypto local ciphertext, deterministic server-response transport. Native/physical device and backend deployment acceptance separate.'},null,2));
})().catch(error=>{console.error(error);process.exit(1);});
