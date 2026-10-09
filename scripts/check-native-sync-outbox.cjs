const assert=require('node:assert/strict'),path=require('node:path'),{randomBytes,randomUUID}=require('node:crypto');
const {createSqliteHarness}=require('./lib/native-sqlite.cjs'),{createSourceLoader}=require('./lib/native-source-loader.cjs');
const loader=createSourceLoader(path.resolve(__dirname,'..')),R=loader.load(path.resolve('mobile/src/native-record-store.ts')),C=loader.load(path.resolve('mobile/src/local-crypto.ts'));
const KEY=R.NATIVE_RECORD_SLOTS[0],ACCOUNT='native-private-account',SECRET='Native sync privacy marker 77DA';
let checks=0;const scenarios=[];
const same=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const ok=(value,message)=>{assert.ok(value,message);checks++;};
async function scenario(name,job){await job();scenarios.push(name);console.log('PASS '+name);}
const seal=text=>C.sealText(text,C.keyFromHex('ab'.repeat(32)),KEY,n=>new Uint8Array(randomBytes(n)));
const opaque=(size=32)=>JSON.stringify({format:'movefield-sync',version:1,kdf:{name:'argon2id',m:19456,t:2,p:1,salt:'ef'.repeat(16)},cipher:'aes-256-gcm',nonce:'cd'.repeat(12),data:Buffer.alloc(size,13).toString('base64')});
const enqueue=(records=[{id:'state-head',ciphertext:opaque()}])=>({accountId:ACCOUNT,mutationId:randomUUID(),records,now:1000});
const claim=()=>({accountId:ACCOUNT,leaseId:randomUUID(),now:1000});
const ack=value=>({accountId:ACCOUNT,leaseId:value.leaseId,mutationId:value.mutationId,baseRevision:value.baseRevision,revision:value.baseRevision+1});
function environment(){const h=createSqliteHarness(),legacy=new Map();return{h,legacy,make:()=>R.createNativeRecordStore({open:async()=>h.db,legacy:{getItem:async key=>legacy.get(key)??null,removeItem:async key=>legacy.delete(key)}}),close:h.close};}
async function commit(e,sync,next=seal(SECRET)){const store=e.make(),before=await store.snapshotRecords([KEY]);return store.commitRecords({expected:before.records,records:{[KEY]:next},expectedRevision:before.revision,sync});}
const rows=e=>({records:e.h.native.prepare('SELECT * FROM training_records ORDER BY slot').all(),chunks:e.h.native.prepare('SELECT * FROM training_chunks ORDER BY slot,ordinal').all(),revision:e.h.native.prepare('SELECT * FROM training_record_metadata').all(),outbox:e.h.native.prepare('SELECT * FROM training_sync_outbox').all(),outboxChunks:e.h.native.prepare('SELECT * FROM training_sync_outbox_chunks ORDER BY id,ordinal').all()});
(async()=>{
 await scenario('Encrypted head and split outbox commit together with bounded SQLite rows and exact fresh-store readback',async()=>{
  const e=environment();try{
   const records=Array.from({length:60},(_,i)=>({id:'history-'+i,ciphertext:opaque(8192)}));records.push({id:'state-head',ciphertext:opaque()});const patch=enqueue(records);
   const saved=await commit(e,patch);const reopened=await e.make().syncSnapshot();
   same(reopened.accounts[ACCOUNT].pending.length,4,'60history3 batches plus final head');
   same(reopened.accounts[ACCOUNT].pending.at(-1).records.map(r=>r.id),['state-head'],'head ordered last');
   same(reopened.accounts[ACCOUNT].pending.flatMap(v=>v.records),records,'all opaque records reassemble exactly');
   same(await e.make().getItem(KEY),saved.records[KEY],'local encrypted head reopened');
   const values=e.h.native.prepare('SELECT value FROM training_sync_outbox_chunks').all().map(r=>r.value);
   ok(values.length>4,'large outbox split across actual SQLite rows');ok(values.every(v=>v.length<=R.NATIVE_RECORD_CHUNK_CHARS),'no outbox row exceeds128KiB');
   ok(!values.join('').includes(SECRET),'no plaintext training in outbox');ok(!values.join('').includes('ab'.repeat(32)),'no key material in outbox');
   same(e.h.native.prepare('PRAGMA journal_mode').get().journal_mode,'delete','rollback journal preserved');same(e.h.native.prepare('PRAGMA synchronous').get().synchronous,3,'EXTRA durability preserved');
  }finally{e.close();}
 });
 await scenario('Every outbox write and precommit failure rolls back local head, outbox, revision and original queue',async()=>{
  const discover=environment();let boundaries;try{await commit(discover,enqueue(),seal('before'));const store=discover.make(),snapshot=await store.snapshotRecords([KEY]);discover.h.controller.calls=[];await store.commitRecords({expected:snapshot.records,expectedRevision:snapshot.revision,records:{[KEY]:seal('after')},sync:enqueue([{id:'history-new',ciphertext:opaque(100_000)},{id:'state-head',ciphertext:opaque()}])});const writes=discover.h.controller.calls.filter(c=>c.scope==='transaction'&&(c.method==='runAsync'||c.method==='commit'));boundaries=writes.slice(0,writes.findIndex(c=>c.method==='commit')+1).length;}finally{discover.close();}
  for(let index=0;index<boundaries;index++){
   const e=environment();try{await commit(e,enqueue(),seal('before'));const store=e.make(),snapshot=await store.snapshotRecords([KEY]),before=rows(e);let seen=-1;
    e.h.controller.fail=c=>c.scope==='transaction'&&(c.method==='runAsync'||c.method==='commit')&&++seen===index;
    await assert.rejects(store.commitRecords({expected:snapshot.records,expectedRevision:snapshot.revision,records:{[KEY]:seal('after')},sync:enqueue([{id:'history-new',ciphertext:opaque(100_000)},{id:'state-head',ciphertext:opaque()}])}));checks++;
    e.h.controller.fail=null;same(rows(e),before,'atomic rollback at write boundary'+index);
   }finally{e.close();}
  }
  ok(boundaries>=8,'all record/outbox/chunk/manifest/revision/commit boundaries covered');
 });
 await scenario('Concurrent store leases, stale receipts and retries preserve newer locally queued generations',async()=>{
  const e=environment();try{await commit(e,enqueue());const first=e.make(),second=e.make(),before=await first.snapshotRecords([KEY]);await second.syncSnapshot();
   const candidates=await Promise.all([first.claimSync(claim()),second.claimSync(claim())]);same(candidates.filter(Boolean).length,1,'one exclusive lease wins');const current=candidates.find(Boolean);
   await commit(e,enqueue(),seal('newer'));same((await second.syncSnapshot()).accounts[ACCOUNT].pending.length,2,'newer save retained');
   same(await first.acknowledgeSync(ack(current)),true,'current server receipt accepted');same(await second.acknowledgeSync(ack(current)),false,'old receipt cannot erase new head');
   await first.failSync({...current,now:1000,reason:'network'});same((await second.syncSnapshot()).accounts[ACCOUNT].pending[0].attempts,0,'old failure cannot alter newer pending');
   const newer=await second.claimSync(claim());same(newer.baseRevision,1,'next mutation uses accepted remote revision');
   await second.failSync({...newer,now:1000,reason:'network'});same(await first.claimSync(claim()),null,'offline backoff enforced after reopen');
   const retry=await first.claimSync({...claim(),now:2000});same(retry.mutationId,newer.mutationId,'retry retains original idempotency identifier');
   same((await first.snapshotRecords([KEY])).revision,before.revision+1,'sync metadata writes never advance training revision');
  }finally{e.close();}
 });
 await scenario('Unqualified transaction modes refuse outbox claims and synced writes before application SQL',async()=>{
  const e=environment();try{await commit(e,enqueue());const before=rows(e);e.h.controller.transactionSynchronous=2;e.h.controller.calls=[];
   await assert.rejects(e.make().claimSync(claim()),err=>err.code==='storage-unavailable');checks++;
   same(rows(e),before,'unqualified lease retains all ciphertext');
   ok(e.h.controller.calls.filter(c=>c.scope==='transaction').every(c=>c.method==='begin'||c.sql.startsWith('PRAGMA')),'no application query before mode refusal');
   await assert.rejects(commit(e,enqueue()),err=>err.code==='storage-unavailable');checks++;same(rows(e),before,'unqualified synced save retains generation');
  }finally{e.close();}
 });
 await scenario('Restore/reset replace pending sync atomically and retain CAS revision; main tombstones never upload old work',async()=>{
  const e=environment();try{const store=e.make();await store.setSyncRevision({accountId:ACCOUNT,revision:4,expectedRevision:0});await commit(e,enqueue());const old=await store.claimSync(claim()),before=await store.snapshotRecords([KEY]);const replacement=enqueue();
   await store.commitRecords({expected:before.records,records:{[KEY]:seal('replacement')},expectedRevision:before.revision,clearHistory:true,sync:replacement});
   same((await e.make().syncSnapshot()).accounts[ACCOUNT].pending.map(v=>v.mutationId),[replacement.mutationId],'approved restore queues only new envelope');
   same(await store.acknowledgeSync(ack(old)),false,'restore invalidates old in-flight receipt');
   await store.multiRemove([KEY]);same((await e.make().syncSnapshot()).accounts[ACCOUNT].pending.length,0,'main deletion invalidates queue in same transaction');same((await store.syncSnapshot()).accounts[ACCOUNT].revision,4,'known remote CAS revision retained');same(await store.getItem(KEY),null,'main tombstone reopened');
  }finally{e.close();}
 });
 await scenario('Missing, modified and false outbox manifests fail closed without replacing committed training',async()=>{
  for(const action of ['DELETE FROM training_sync_outbox_chunks WHERE ordinal=0','UPDATE training_sync_outbox_chunks SET hash=\'wrong\' WHERE ordinal=0','DELETE FROM training_sync_outbox']){
   const e=environment();try{await commit(e,enqueue());const old=await e.make().getItem(KEY);e.h.native.exec(action);await assert.rejects(e.make().syncSnapshot(),err=>err.code==='decrypt-failed');checks++;same(await e.make().getItem(KEY),old,'outbox damage retains independently exportable training');}finally{e.close();}
  }
 });
 console.log(JSON.stringify({checks,scenarios,limits:'Real host node:sqlite transactions, file reopen, chunk integrity and injected disk failures. Expo native compile default3 modeled; no Android/iOS physical process/power or account-service acceptance.'},null,2));
})().catch(error=>{console.error(error);process.exit(1);});
