const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {createHash,randomBytes}=require('node:crypto');
const {IDBFactory,IDBKeyRange,forceCloseDatabase}=require('fake-indexeddb');
process.chdir(path.resolve(__dirname,'..'));
const modules=new Map();
function load(name){if(modules.has(name))return modules.get(name).exports;const mod={exports:{}};modules.set(name,mod);
 const code=ts.transpileModule(fs.readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(s=>s.startsWith('./')?load(s.slice(2)):require(s),mod,mod.exports);return mod.exports}
const Q=load('qwen-download'),B=load('browser-qwen-cache');
let checks=0;const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};const ok=(v,msg)=>{assert.ok(v,msg);checks++};
async function rejects(promise,code,msg){await assert.rejects(promise,e=>{same(e.code,code,msg);return true});checks++}
const hash=b=>createHash('sha256').update(b).digest('hex');
const data=[Uint8Array.from({length:Q.QWEN_CHUNK_BYTES*3+7},(_,i)=>i%197),new TextEncoder().encode('synthetic configuration')];
const original=JSON.parse(fs.readFileSync('lib/qwen-assets.json')).models.find(m=>m.platform==='web');
function fixture(id='test-web-indexeddb',variant=0){const bytes=data.map(b=>b.slice());bytes[0][0]=variant;
 const m={...original,id,label:'Synthetic IndexedDB test only',modelRevision:'c'.repeat(40),wasmRevision:'d'.repeat(40)};
 m.assets=bytes.map((b,i)=>({path:i?'mlc-chat-config.json':'params_shard_0.bin',url:`https://huggingface.co/${m.repository}/resolve/${m.modelRevision}/${i?'mlc-chat-config.json':'params_shard_0.bin'}`,bytes:b.length,sha256:hash(b),verification:'synthetic'}));m.downloadBytes=bytes.reduce((n,b)=>n+b.length,0);return {m,bytes}}
function environment(){const factory=new IDBFactory(),busy=new Set(),connections=[],calls=[],deletionBatches=[],fault={pointerPut:false,quota:10**12,usage:0,random:null,abortDeleteAt:0,deleteCount:0};
 const env={indexedDB:{open(...args){const request=factory.open(...args);request.addEventListener('success',()=>{
   const db=request.result;connections.push(db);const transact=db.transaction.bind(db);
   db.transaction=(stores,mode,...rest)=>{const tx=transact(stores,mode,...rest),getStore=tx.objectStore.bind(tx);let deletes=0;
    tx.addEventListener('complete',()=>{if(deletes)deletionBatches.push(deletes)});
    tx.objectStore=name=>{const store=getStore(name);if(name==='models'&&mode==='readwrite'&&fault.pointerPut){const put=store.put.bind(store);store.put=(...values)=>{const request=put(...values);request.addEventListener('success',()=>{fault.pointerPut=false;tx.abort()},{once:true});return request}}
     if(name==='chunks'&&mode==='readwrite'){const del=store.delete.bind(store);store.delete=(...values)=>{deletes++;fault.deleteCount++;const request=del(...values);if(fault.abortDeleteAt===fault.deleteCount)request.addEventListener('success',()=>{fault.abortDeleteAt=0;tx.abort()},{once:true});return request}}return store};return tx};
  });return request}},keyRange:IDBKeyRange,random:n=>fault.random??new Uint8Array(randomBytes(n)),estimate:async()=>({quota:fault.quota,usage:fault.usage}),
  locks:{async request(name,options,run){calls.push({name,options});if(busy.has(name))return run(null);busy.add(name);try{return await run({name,mode:'exclusive'})}finally{busy.delete(name)}}}};
 return {env,factory,busy,connections,calls,deletionBatches,fault};
}
function manager(f,store){let calls=0;const m=Q.createQwenDownloader({models:[f.m],store,fetchAsset:async url=>{calls++;const i=f.m.assets.findIndex(a=>a.url===url);assert.ok(i>=0);return new Response(f.bytes[i])}});return {m,calls:()=>calls}}
const signal=()=>new AbortController().signal;
const open=async(factory,name,upgrade)=>new Promise((resolve,reject)=>{const req=factory.open(name,1);req.onupgradeneeded=()=>upgrade?.(req.result);req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)});
const transact=async(db,stores,mode,run)=>new Promise((resolve,reject)=>{const tx=db.transaction(stores,mode);let result;tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error);run(tx,v=>{result=v})});
async function rows(factory){const db=await open(factory,B.QWEN_CACHE_DATABASE);try{return await transact(db,['models','attempts','chunks'],'readonly',(tx,done)=>{const result={};for(const name of ['models','attempts','chunks']){const req=tx.objectStore(name).getAll();req.onsuccess=()=>{result[name]=req.result;done(result)}}})}finally{db.close()}}
async function readHashes(m,id){return m.withCachedModel(id,signal(),async read=>{const hashes=[];for(const a of m.offer(id).assets){const digest=createHash('sha256');for await(const b of read(a.path))digest.update(b);hashes.push(digest.digest('hex'))}return hashes})}
(async()=>{
 // The actual adapter executes against the pinned IndexedDB implementation.
 // This verifies transaction/cursor logic, not browser quota or OS durability.
 const e=environment(),store=B.createBrowserQwenStore(e.env),f=fixture(),k=manager(f,store),offer=k.m.offer(f.m.id);
 const unrelated=await open(e.factory,'synthetic-training-sentinel',db=>db.createObjectStore('records'));
 await transact(unrelated,['records'],'readwrite',tx=>tx.objectStore('records').put('synthetic saved record, keep intact','profile'));
 same(await k.m.status(f.m.id),null,'empty actual adapter reports no complete download');
 await k.m.download(offer,{signal:signal()});same(await readHashes(k.m,f.m.id),f.bytes.map(hash),'adapter writes/reopens every exact model byte');
 let saved=await rows(e.factory);same(saved.models.length,1,'one pointer');same(saved.attempts.length,1,'one completed attempt');same(saved.chunks.length,5,'bounded fixed chunk rows');
 ok(saved.chunks.every(c=>c.bytes.length<=Q.QWEN_CHUNK_BYTES),'IDB values stay bounded');ok(saved.attempts[0].complete,'all seals complete before publication');
 for(const c of e.calls){same(c.options,{mode:'exclusive',ifAvailable:true},'correct Web Locks options without incompatible signal');ok(c.name.startsWith(B.QWEN_CACHE_LOCK_PREFIX),'only model cache lock namespace')}
 const record=await k.m.status(f.m.id);await store.discard(record.attempt);same(await readHashes(k.m,f.m.id),f.bytes.map(hash),'cleanup cannot discard currently committed bytes');
 same((await k.m.download(offer,{signal:signal()})).reused,true,'exact metadata reuses completed model');same(k.calls(),2,'reuse does not fetch');

 // Incomplete attempts and invalid/duplicate rows cannot overwrite readiness.
 const replacement=fixture(f.m.id,93),next=manager(replacement,store),nextOffer=next.m.offer(f.m.id),pending=await store.begin(nextOffer);
 await rejects(store.commit(pending),'storage','unsealed attempt cannot publish');
 await store.append(pending,0,0,replacement.bytes[0].slice(0,Q.QWEN_CHUNK_BYTES));
 await rejects(store.append(pending,0,0,replacement.bytes[0].slice(0,Q.QWEN_CHUNK_BYTES)),'storage','duplicate part does not replace bytes');
 await rejects(store.append(pending,0,1,new Uint8Array(2)),'storage','invalid part length rejected');
 await rejects(store.seal(pending,0,{path:nextOffer.assets[0].path,bytes:nextOffer.assets[0].bytes,sha256:nextOffer.assets[0].sha256,parts:4}),'storage','missing parts cannot be sealed');
 same((await store.inspect(f.m.id)).attempt,record.attempt,'failed preparation retains prior complete pointer');
 const fresh=B.createBrowserQwenStore(e.env),reopened=manager(f,fresh);same(await reopened.m.status(f.m.id),record,'fresh adapter restores last committed pointer');
 saved=await rows(e.factory);same(saved.attempts.length,1,'fresh opening cleans abandoned attempt');same(saved.chunks.length,5,'cursor cleanup removes only orphan parts');

 // Abort the real pointer transaction after its put succeeds but before commit.
 e.fault.pointerPut=true;
 await rejects(next.m.download(nextOffer,{signal:signal()}),'storage','transaction abort while replacing pointer');
 saved=await rows(e.factory);same(saved.models[0],record,'aborted pointer write rolls back to prior receipt');same(saved.attempts.length,1,'aborted download staging cleaned');
 same(await readHashes(k.m,f.m.id),f.bytes.map(hash),'prior model remains readable after transaction abort');
 await next.m.download(nextOffer,{signal:signal()});same(await readHashes(next.m,f.m.id),replacement.bytes.map(hash),'retry commits replacement');
 saved=await rows(e.factory);same(saved.attempts.length,1,'prior attempt removed only after replacement commits');

 // A successful commit followed by interrupted cleanup is recovered on reopen.
 const oldCurrent=saved.models[0],third=fixture(f.m.id,17),thirdManager=manager(third,store),thirdOffer=thirdManager.m.offer(f.m.id),staged=await store.begin(thirdOffer);
 for(let i=0;i<third.bytes.length;i++){
  let part=0;for(let offset=0;offset<third.bytes[i].length;offset+=Q.QWEN_CHUNK_BYTES)await store.append(staged,i,part++,third.bytes[i].slice(offset,offset+Q.QWEN_CHUNK_BYTES));
  await store.seal(staged,i,{path:thirdOffer.assets[i].path,bytes:third.bytes[i].length,sha256:hash(third.bytes[i]),parts:part});
 }
 await store.commit(staged);same((await rows(e.factory)).attempts.length,2,'commit retains prior attempt until cleanup');
 const afterCrash=manager(third,B.createBrowserQwenStore(e.env));await afterCrash.m.status(f.m.id);
 saved=await rows(e.factory);same(saved.attempts.length,1,'fresh adapter cleans old completed orphan');same(saved.models[0].attempt,staged,'new committed pointer retained');ok(saved.models[0].attempt!==oldCurrent.attempt,'new revision was atomically published');

 // Chunk loss or tampering cannot be consumed as verified model input.
 const rawDb=await open(e.factory,B.QWEN_CACHE_DATABASE);
 await transact(rawDb,['chunks'],'readwrite',tx=>{const request=tx.objectStore('chunks').get([staged,0,0]);request.onsuccess=()=>{const row=request.result;row.bytes[0]^=0xff;tx.objectStore('chunks').put(row)}});
 await rejects(readHashes(afterCrash.m,f.m.id),'integrity','stored byte mutation caught by re-hash');
 await transact(rawDb,['chunks'],'readwrite',tx=>tx.objectStore('chunks').delete([staged,0,1]));
 same(await afterCrash.m.status(f.m.id),null,'chunk eviction invalidates complete status');
 await rejects(readHashes(afterCrash.m,f.m.id),'not-downloaded','evicted model cannot load');rawDb.close();
 await afterCrash.m.download(thirdOffer,{signal:signal()});same(await readHashes(afterCrash.m,f.m.id),third.bytes.map(hash),'explicit consent repairs evicted download');

 // Other model IDs and unrelated databases survive retry/cleanup/delete.
 const other=fixture('test-web-indexeddb-b'),otherManager=manager(other,store);await otherManager.m.download(otherManager.m.offer(other.m.id),{signal:signal()});
 await afterCrash.m.remove(f.m.id);saved=await rows(e.factory);same(saved.models.map(r=>r.modelId),[other.m.id],'delete leaves other model');same(saved.attempts.length,1,'delete removes all attempts only for chosen model');same(saved.chunks.length,5,'other model chunks retained');
 same(await readHashes(otherManager.m,other.m.id),other.bytes.map(hash),'other model still opens');
 const sentinel=await transact(unrelated,['records'],'readonly',(tx,done)=>{const request=tx.objectStore('records').get('profile');request.onsuccess=()=>done(request.result)});
 same(sentinel,'synthetic saved record, keep intact','unrelated training fixture untouched');
 same((await e.factory.databases()).map(d=>d.name).sort(),[B.QWEN_CACHE_DATABASE,'synthetic-training-sentinel'].sort(),'adapter only opened dedicated cache database');

 // Nonce collision is an add failure, never replacement of an existing attempt.
 e.fault.random=Buffer.from(saved.models[0].attempt,'hex');
 await rejects(store.begin(otherManager.m.offer(other.m.id)),'storage','attempt identifier collision refuses overwrite');same(await readHashes(otherManager.m,other.m.id),other.bytes.map(hash),'collision leaves complete model intact');e.fault.random=null;
 same(await store.availableBytes(),10**12,'finite available capacity estimate');e.fault.quota=NaN;same(await store.availableBytes(),null,'unknown capacity does not pretend guaranteed space');e.fault.quota=50;e.fault.usage=100;same(await store.availableBytes(),0,'overquota availability clamps to zero');e.fault.quota=10**12;e.fault.usage=0;
 const lockName=B.QWEN_CACHE_LOCK_PREFIX+other.m.id;e.busy.add(lockName);
 await rejects(otherManager.m.remove(other.m.id),'busy','live cross-tab lock prevents delete');e.busy.delete(lockName);same(await readHashes(otherManager.m,other.m.id),other.bytes.map(hash),'failed delete retains all bytes');

 // Garbage cleanup uses bounded key cursors, and resumes partially completed
 // deletion without reading large blob values into JavaScript.
 const orphan=await store.begin(otherManager.m.offer(other.m.id)),garbageCount=B.QWEN_CLEANUP_BATCH*2+9;
 const garbageDb=await open(e.factory,B.QWEN_CACHE_DATABASE);
 await transact(garbageDb,['chunks'],'readwrite',tx=>{for(let part=0;part<garbageCount;part++)tx.objectStore('chunks').add({attempt:orphan,asset:0,part,bytes:new Uint8Array([1])})});garbageDb.close();
 e.fault.deleteCount=0;e.fault.abortDeleteAt=B.QWEN_CLEANUP_BATCH+1;
 await rejects(otherManager.m.status(other.m.id),'storage','interrupted second cleanup batch');
 let garbage=await rows(e.factory);same(garbage.chunks.filter(c=>c.attempt===orphan).length,garbageCount-B.QWEN_CLEANUP_BATCH,'first cleanup batch stays committed when second aborts');same(garbage.attempts.length,2,'orphan marker remains until its final batch');
 same(await readHashes(otherManager.m,other.m.id),other.bytes.map(hash),'cleanup interruption preserves committed model');
 await otherManager.m.status(other.m.id);garbage=await rows(e.factory);same(garbage.attempts.length,1,'retry resumes and removes final orphan marker');
 ok(e.deletionBatches.every(n=>n<=B.QWEN_CLEANUP_BATCH),'no adapter cleanup transaction exceeds 128 keys');

 // A forced connection close causes a new connection, with records retained.
 for(const db of e.connections)forceCloseDatabase(db);await new Promise(setImmediate);
 same(await readHashes(otherManager.m,other.m.id),other.bytes.map(hash),'closed database reconnects without discarding model');
 e.fault.deleteCount=0;e.fault.abortDeleteAt=1;
 await rejects(otherManager.m.remove(other.m.id),'storage','interrupted explicit deletion');saved=await rows(e.factory);same(saved.models.length,0,'delete removes availability before file cleanup');same(saved.attempts.length,1,'interrupted delete leaves a cleanup marker');
 same(await otherManager.m.status(other.m.id),null,'opening resumes interrupted delete');
 await otherManager.m.remove(other.m.id);saved=await rows(e.factory);
 same([saved.models.length,saved.attempts.length,saved.chunks.length],[0,0,0],'delete is idempotent and removes model rows');
 unrelated.close();for(const db of e.connections)db.close();
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/browser-qwen-cache-checks.json',JSON.stringify({checks,indexedDBImplementation:'fake-indexeddb 6.2.5',actualBrowser:false,physicalQuotaMeasured:false,realWeightsDownloaded:false},null,2)+'\n');
 console.log(`PASS browser Qwen IndexedDB transactions: ${checks} assertions; fake-indexeddb, no browser/OS durability claim.`);
})().catch(error=>{console.error(error);process.exitCode=1});
