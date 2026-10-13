const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{webcrypto,randomUUID}=require('node:crypto');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const loader=require('./lib/native-source-loader.cjs').createSourceLoader(process.cwd());
const V=loader.load(path.resolve('lib/browser-vault.ts')),R=loader.load(path.resolve('lib/browser-record-store.ts'));
const H=loader.load(path.resolve('lib/browser-history.ts')),T=loader.load(path.resolve('lib/training.ts'));
const initial=()=>JSON.parse(JSON.stringify(T.initialState()));
const S='training-studio-v2',D='training-studio-setup-v1',slots=[S,D],random=n=>webcrypto.getRandomValues(new Uint8Array(n));
const history=Array.from({length:5000},(_,i)=>({id:'capacity-completed-'+i,sessionId:'past-session-'+i,title:'Recorded workout',date:new Date(Date.UTC(2000,0,1+i)).toISOString().slice(0,10),startedAt:i+1,finishedAt:i+2,sets:[1,2,3].map(set=>({exerciseId:'bench',set,reps:8,kg:80,done:true,rir:2})),details:{bench:{notes:'Controlled repetitions '.repeat(58)}}}));
const large={...initial(),profile:{...initial().profile,name:'Synthetic capacity marker'},history},raw=JSON.stringify(large);
let checks=0;const scenarios=[],same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++},ok=(v,m)=>{assert.ok(v,m);checks++};
async function rejects(p,code,m){await assert.rejects(p,e=>e.code===code,m);checks++}
async function scenario(name,run){await run();scenarios.push(name);console.log('PASS '+name)}
function fixture(values={}){const idb=new IDBFactory(),map=new Map(Object.entries(values)),legacy={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};let queue=Promise.resolve();const lock=job=>{const next=queue.then(job);queue=next.catch(()=>undefined);return next};const make=()=>V.createTransactionalVault({idb,legacy,slots,lock,restoreSafe:true,subtle:webcrypto.subtle,random});return{idb,map,legacy,make,vault:make(),store:R.createBrowserRecordStore({idb,legacy,slots})}}
async function open(idb){return await new Promise((resolve,reject)=>{const r=idb.open('movefield-vault',2);r.onupgradeneeded=()=>{for(const name of ['keys','records','metadata'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function mutate(idb,names,job){const db=await open(idb);try{await new Promise((resolve,reject)=>{const tx=db.transaction(names,'readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);job(tx)})}finally{db.close()}}
async function seal(key,slot,text){const iv=random(12),data=await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('movefield-vault:1:'+slot)},key,new TextEncoder().encode(text));return JSON.stringify({v:1,alg:'aes-256-gcm',iv:Buffer.from(iv).toString('base64'),data:Buffer.from(data).toString('base64')})}
async function plain(snapshot,slot){const value=JSON.parse(snapshot.records[slot]);return new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(value.iv,'base64'),additionalData:new TextEncoder().encode('movefield-vault:1:'+slot)},snapshot.key,Buffer.from(value.data,'base64')))}
const envelope=JSON.stringify({format:'movefield-sync',version:1,kdf:{name:'argon2id',m:19456,t:2,p:1,salt:'ab'.repeat(16)},cipher:'aes-256-gcm',nonce:'cd'.repeat(12),data:Buffer.alloc(32).toString('base64')});
const sync=accountId=>({accountId,mutationId:randomUUID(),records:[{id:'state',ciphertext:envelope}],now:1});
async function full(f){const historySlots=await f.store.listHistorySlots();return {...await f.store.snapshot(historySlots),historySlots}}
(async()=>{
 const f=fixture();
 await scenario('5000 histories save in individually encrypted rows and fresh vault reopens exact profile above the old ceiling',async()=>{
  ok(raw.length>5_000_000,'fixture crosses old parser capacity');const stored=await f.vault.write(S,raw,'');
  same((await f.store.listHistorySlots()).length,5000,'every completed workout has an owned row');
  const s=await full(f),head=H.parseBrowserHistoryHead(await plain(s,S));same(head.entries.length,5000,'authenticated encrypted head owns exactly5000 entries');
  ok(stored.length<2_000_000,'head ciphertext replaces former full-profile ciphertext');
  same(JSON.parse(await f.make().read(S)),large,'fresh vault opens all bounded entities');
  ok(Object.values(s.records).filter(Boolean).every(value=>!value.includes('Synthetic capacity marker')&&!value.includes('Controlled repetitions')),'all5000 entities contain ciphertext only');
 });
 await scenario('Warm profile edit reads and writes no history rows; one completion changes exactly one entity',async()=>{
  let current=await f.vault.readSnapshot(S),before=await full(f),gets=0,puts=0;
  const get=IDBObjectStore.prototype.get,put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.get=function(key){if(this.name==='records'&&R.isBrowserHistorySlot(key))gets++;return get.call(this,key)};
  IDBObjectStore.prototype.put=function(value,key){if(this.name==='records'&&R.isBrowserHistorySlot(key))puts++;return put.call(this,value,key)};
  let edited;
  try{edited={...large,profile:{...large.profile,name:'Edited profile'}};await f.vault.write(S,JSON.stringify(edited),current.raw)}finally{IDBObjectStore.prototype.get=get;IDBObjectStore.prototype.put=put}
  same({gets,puts},{gets:0,puts:0},'cached profile-only commit touches no history rows');
  const after=await full(f);same(Object.fromEntries(before.historySlots.map(slot=>[slot,after.records[slot]])),Object.fromEntries(before.historySlots.map(slot=>[slot,before.records[slot]])),'all5000 unchanged entity ciphertexts stay exact');
  current=await f.vault.readSnapshot(S);const shorter={...edited,history:edited.history.slice(1)};await f.vault.write(S,JSON.stringify(shorter),current.raw);
  current=await f.vault.readSnapshot(S);const complete={...shorter,history:[...shorter.history,{...history[0],id:'new-completion'}]};puts=0;
  IDBObjectStore.prototype.put=function(value,key){if(this.name==='records'&&R.isBrowserHistorySlot(key)&&value.ciphertext!==null)puts++;return put.call(this,value,key)};
  try{await f.vault.write(S,JSON.stringify(complete),current.raw)}finally{IDBObjectStore.prototype.put=put}
  same(puts,1,'exactly one newly completed history row is sealed');same(JSON.parse(await f.make().read(S)),complete,'new completion and retired old entry reconstruct exactly');
  const saved=await f.store.snapshot();await rejects(f.vault.write(S,JSON.stringify({...complete,history:[...complete.history,history[0]]}),saved.records[S]),undefined,'5001 records refuse before mutation');same((await f.store.snapshot()).revision,saved.revision,'over-capacity state cannot replace committed head');
 });
 await scenario('Plain and whole-ciphertext legacy profiles migrate with unchanged key and source survives aborted entity transaction',async()=>{
  const state={...initial(),history:history.slice(0,4)},plainFixture=fixture({[S]:JSON.stringify(state)});
  same(JSON.parse(await plainFixture.vault.read(S)),state,'legacy plaintext migration restores complete state');same((await plainFixture.store.listHistorySlots()).length,4,'legacy migration owns four entities');same(plainFixture.map.has(S),false,'verified whole-record import removes unchanged plaintext source');
  const old=fixture(),key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),oldRaw=await seal(key,S,JSON.stringify(state));old.map.set(S,oldRaw);await mutate(old.idb,['keys'],tx=>tx.objectStore('keys').put(key,'data-key-v1'));
  const put=IDBObjectStore.prototype.put;let failed=false;
  IDBObjectStore.prototype.put=function(value,slot){const request=put.call(this,value,slot);if(!failed&&this.name==='records'&&R.isBrowserHistorySlot(slot)){failed=true;this.transaction.abort()}return request};
  try{await rejects(old.vault.read(S),'key-unavailable','entity transaction abort reports recovery error')}finally{IDBObjectStore.prototype.put=put}
  const retained=await old.store.snapshot();same(retained.records[S],oldRaw,'aborted entity generation preserves exact whole encrypted source');same((await old.store.listHistorySlots()).length,0,'aborted entity transaction leaves no partial entities');
  same(JSON.parse(await old.make().read(S)),state,'fresh vault retries complete migration');const migrated=await full(old);same(await plain(migrated, H.browserHistorySlot(state.history[0].id)),JSON.stringify(state.history[0]),'entity remains decryptable with original key');
  const future=fixture({[S]:JSON.stringify({...state,schema:3,futureMetadata:'retain this'})});await assert.rejects(future.vault.read(S));checks++;
  const opaque=await future.store.snapshot();same(JSON.parse(await plain(opaque,S)).futureMetadata,'retain this','unsupported future schema retains complete encrypted source');
  await assert.rejects(future.vault.write(S,JSON.stringify(state)));checks++;
  same((await future.store.snapshot()).records[S],opaque.records[S],'ordinary current-schema save cannot erase an incompatible future record');

 });
 await scenario('Head/entity/outbox rollback is atomic and stale cross-tab saves preserve the installed generation',async()=>{
  const before=await full(f),current=await f.vault.readSnapshot(S),next={...JSON.parse(current.text),history:JSON.parse(current.text).history.map((w,i)=>i? w:{...w,title:'Atomic changed workout'})};
  const put=IDBObjectStore.prototype.put;let failed=false;
  IDBObjectStore.prototype.put=function(value,key){const request=put.call(this,value,key);if(!failed&&this.name==='metadata'&&key==='sync-outbox-v1'){failed=true;this.transaction.abort()}return request};
  try{await rejects(f.vault.write(S,JSON.stringify(next),current.raw,sync('accountA')),'key-unavailable','outbox write abort rolls back full local generation')}finally{IDBObjectStore.prototype.put=put}
  const after=await full(f);same(after.records,before.records,'all prior head/entity ciphertext retained exactly');same(after.revision,before.revision,'rollback does not acknowledge a saved revision');same(after.sync,before.sync,'rollback cannot enqueue mutation without local ciphertext');
  const tab=f.make(),stale=await tab.readSnapshot(S);await f.vault.write(S,JSON.stringify(next),current.raw,sync('accountA'));
  await rejects(tab.write(S,current.text,stale.raw),'conflict','stale tab cannot overwrite newly committed entities');same(JSON.parse(await f.make().read(S)),next,'newer generation survives conflict');same((await f.vault.syncSnapshot()).accounts.accountA.pending.length,1,'new encrypted head and its queue are durably visible together');
 });
 await scenario('Missing/corrupt entity and missing/replaced key are detected; recovery copy includes every retained encrypted row',async()=>{
  const small={...initial(),history:history.slice(0,3)},broken=fixture();await broken.vault.write(S,JSON.stringify(small));const rows=await full(broken),slot=H.browserHistorySlot(small.history[0].id);
  await mutate(broken.idb,['records'],tx=>tx.objectStore('records').delete(slot));await rejects(broken.make().read(S),'decrypt-failed','missing referenced row fails closed');
  await mutate(broken.idb,['records'],tx=>tx.objectStore('records').put({version:1,ciphertext:awaitableCipher(rows.records[slot])},slot));
  await rejects(broken.make().read(S),'decrypt-failed','corrupted entity ciphertext is refused');
  const incorrect=await seal(rows.key,slot,JSON.stringify({...small.history[0],title:'Authenticated different workout'}));await mutate(broken.idb,['records'],tx=>tx.objectStore('records').put({version:1,ciphertext:incorrect},slot));await rejects(broken.make().read(S),'decrypt-failed','authenticated entity with wrong head digest is refused');
  await mutate(broken.idb,['records'],tx=>tx.objectStore('records').put({version:1,ciphertext:rows.records[slot]},slot));
  const swapped=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await mutate(broken.idb,['keys'],tx=>tx.objectStore('keys').put(swapped,'data-key-v1'));await rejects(broken.vault.read(S),'decrypt-failed','same-shaped swapped key cannot be hidden by warmed cache');
  await mutate(broken.idb,['keys'],tx=>tx.objectStore('keys').delete('data-key-v1'));await rejects(broken.make().read(S),'key-missing','missing key never creates replacement');
  const recovery=JSON.parse(await broken.vault.recoveryCopy());same(recovery.format,'movefield-browser-recovery-v1','raw recovery has explicit non-transfer format');same(Object.keys(recovery.records).filter(R.isBrowserHistorySlot).length,3,'keyless recovery contains every history ciphertext');ok(!JSON.stringify(recovery).includes('Controlled repetitions'),'recovery never opens protected notes');
  const snapshot=await full(broken);await rejects(broken.vault.write(S,JSON.stringify(small)),'key-missing','ordinary save refuses to mint key over sealed head');same((await full(broken)).records,snapshot.records,'key-loss refusal retains all ciphertext');
  function awaitableCipher(raw){const value=JSON.parse(raw);value.data=(value.data[0]==='A'?'B':'A')+value.data.slice(1);return JSON.stringify(value)}
 });
 await scenario('Explicit restore/reset retires all owned orphan rows, including missing-key orphans; unrelated records survive',async()=>{
  const small={...initial(),history:history.slice(0,2)},orphan=fixture();await orphan.vault.write(S,JSON.stringify(small));const orphanSlot=H.browserHistorySlot('orphan-workout'),snapshot=await orphan.store.snapshot(),orphanRaw=await seal(snapshot.key,orphanSlot,'{"id":"orphan-workout"}');
  await mutate(orphan.idb,['records','keys'],tx=>{tx.objectStore('records').put({version:1,ciphertext:orphanRaw},orphanSlot);tx.objectStore('records').put({version:1,ciphertext:'unrelated opaque'},'other-app-slot');tx.objectStore('records').put({version:1,ciphertext:null},S);tx.objectStore('keys').delete('data-key-v1')});
  await rejects(orphan.vault.write(S,JSON.stringify(small)),'unknown-format','orphan entity without key prevents silent first-key mint');ok(await orphan.vault.hasSealedRecords(),'orphan ciphertext still counts as retained encrypted data');
  await orphan.vault.replace(S,JSON.stringify(small));same((await orphan.store.listHistorySlots()).length,2,'explicit replacement deletes every orphan and installs only new entities');same(JSON.parse(await orphan.make().read(S)),small,'replacement restores independently decryptable profile');
  await orphan.vault.reset();same((await orphan.store.listHistorySlots()).length,0,'reset removes all owned history entities');same((await orphan.store.snapshot()).key,undefined,'reset removes key in same transaction');
  const db=await open(orphan.idb);try{same(await new Promise(resolve=>{const tx=db.transaction('records','readonly'),q=tx.objectStore('records').get('other-app-slot');tx.oncomplete=()=>resolve(q.result.ciphertext)}),'unrelated opaque','reset preserves unrelated application row')}finally{db.close()}
 });
 await scenario('Reviewed account rebase atomically compares full outbox and preserves unrelated accounts and stale receipts',async()=>{
  const q=fixture();await q.vault.write(S,'plain opaque',undefined,sync('accountA'));await q.vault.write(D,'setup opaque',undefined,sync('accountB'));
  const before=await q.vault.syncSnapshot(),claim=await q.vault.claimSync({accountId:'accountA',leaseId:randomUUID(),now:2});
  await rejects(q.vault.reconcileSync({accountId:'accountA',revision:4,expected:before}),'conflict','a concurrent durable claim invalidates reviewed snapshot');same((await q.vault.syncSnapshot()).accounts.accountA.pending.length,1,'failed rebase preserves selected pending mutation');
  const expected=await q.vault.syncSnapshot();await q.vault.reconcileSync({accountId:'accountA',revision:4,expected});const after=await q.vault.syncSnapshot();same(after.accounts.accountA,{revision:4,pending:[]},'reviewed queue replaces only selected pending and server revision');same(after.accounts.accountB,expected.accounts.accountB,'other account queue remains exact');
  same(await q.vault.acknowledgeSync({...claim,revision:1}),false,'old receipt cannot clear newer reviewed base');
 });
 const report={passed:true,checks,scenarios,historyCount:5000,plainChars:raw.length,scope:'Actual IndexedDB transaction adapter with fake-indexeddb, real WebCrypto, strict schema and fresh-vault reopen. No physical-browser/device memory, latency or OS restart acceptance.'};fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/browser-history-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
