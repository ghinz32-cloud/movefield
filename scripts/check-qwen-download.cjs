const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {createHash}=require('node:crypto');
process.chdir(path.resolve(__dirname,'..'));
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name).exports;
 const mod={exports:{}};modules.set(name,mod);
 const code=ts.transpileModule(fs.readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(s=>s.startsWith('./')?load(s.slice(2)):require(s),mod,mod.exports);
 return mod.exports;
}
const Q=load('qwen-download'),B=load('browser-qwen-cache');
let checks=0;
const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const ok=(value,msg)=>{assert.ok(value,msg);checks++};
async function rejects(promise,code,msg){await assert.rejects(promise,e=>{same(e.code,code,msg);ok(e instanceof Q.QwenDownloadError,`${msg}: typed actionable error`);return true});checks++}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const assetData=[Uint8Array.from({length:Q.QWEN_CHUNK_BYTES*2+217},(_,i)=>(i*31)%251),new TextEncoder().encode('{"synthetic":"漢字"}')];
const base=JSON.parse(fs.readFileSync('lib/qwen-assets.json')).models.find(m=>m.platform==='web');
function model(id='test-web-qwen',variant=0){
 const data=assetData.map(a=>a.slice());if(variant)data[0][0]=variant;
 const m={...base,id,label:'Synthetic test only',modelRevision:'a'.repeat(40),wasmRevision:'b'.repeat(40)};
 m.assets=data.map((bytes,i)=>({path:i?'mlc-chat-config.json':'params_shard_0.bin',url:`https://huggingface.co/${m.repository}/resolve/${m.modelRevision}/${i?'mlc-chat-config.json':'params_shard_0.bin'}`,bytes:bytes.length,sha256:hash(bytes),verification:'synthetic-test'}));
 m.downloadBytes=m.assets.reduce((n,a)=>n+a.bytes,0);
 return {m,data};
}
function memoryStore(initial){
 const state=initial?structuredClone(initial):{models:new Map(),attempts:new Map(),sequence:0};
 const locks=new Set(),stats={writes:0,commits:0,maxChunk:0,removed:0};
 const fault={append:null,commit:null,discard:null,recover:null,available:null};
 const snapshot=()=>structuredClone(state);
 const store={state,stats,fault,snapshot,
  async exclusive(id,run){if(locks.has(id))throw new Q.QwenDownloadError('busy','Another tab owns this model.');locks.add(id);try{return await run()}finally{locks.delete(id)}},
  async recover(id){if(fault.recover)throw fault.recover;const current=state.models.get(id)?.attempt;for(const [a,row]of state.attempts)if(row.offer.modelId===id&&a!==current)state.attempts.delete(a)},
  async inspect(id){return structuredClone(state.models.get(id)??null)},
  async contains(r){const row=state.attempts.get(r.attempt);return !!row?.complete&&r.assets.every((a,i)=>row.chunks.filter(c=>c.asset===i).length===a.parts)},
  async availableBytes(){return fault.available},
  async begin(offer){const attempt=(++state.sequence).toString(16).padStart(32,'0');state.attempts.set(attempt,{offer:structuredClone(offer),verified:offer.assets.map(()=>null),chunks:[],complete:false});return attempt},
  async append(attempt,asset,part,bytes){if(fault.append)throw fault.append;const row=state.attempts.get(attempt);assert.ok(row&&!row.complete);assert.equal(bytes.length,Math.min(Q.QWEN_CHUNK_BYTES,row.offer.assets[asset].bytes-part*Q.QWEN_CHUNK_BYTES));row.chunks.push({asset,part,bytes:bytes.slice()});stats.writes++;stats.maxChunk=Math.max(stats.maxChunk,bytes.byteLength)},
  async seal(attempt,asset,record){state.attempts.get(attempt).verified[asset]=structuredClone(record)},
  async commit(attempt){if(fault.commit)throw fault.commit;const row=state.attempts.get(attempt);assert.ok(row.verified.every(Boolean));const r={version:1,modelId:row.offer.modelId,fingerprint:row.offer.fingerprint,attempt,downloadBytes:row.offer.downloadBytes,assets:structuredClone(row.verified)};row.complete=true;state.models.set(r.modelId,r);stats.commits++;return structuredClone(r)},
  async discard(attempt){if(fault.discard)throw fault.discard;state.attempts.delete(attempt)},
  async remove(id){state.models.delete(id);for(const [a,row]of state.attempts)if(row.offer.modelId===id)state.attempts.delete(a);stats.removed++},
  async read(attempt,asset,part){return state.attempts.get(attempt)?.chunks.find(c=>c.asset===asset&&c.part===part)?.bytes.slice()??null},
 };
 return store;
}
function transport(fixture,options={}){
 const calls=[];
 const fetchAsset=async(url,init)=>{
  calls.push({url,init});const ix=fixture.m.assets.findIndex(a=>a.url===url);assert.ok(ix>=0,'only known pinned URL');
  if(options.throw)throw options.throw;
  let bytes=fixture.data[ix].slice();if(options.mutate)bytes[0]^=0xff;if(options.truncate)bytes=bytes.slice(0,-1);if(options.extra){const larger=new Uint8Array(bytes.length+1);larger.set(bytes);bytes=larger}
  const headers=options.length?{'content-length':String(options.length)}:{};
  if(options.oversized)bytes=new Uint8Array(Q.QWEN_MAX_INPUT_CHUNK_BYTES+1);
  let offset=0;
  return new Response(new ReadableStream({
   pull(controller){if(offset===bytes.length){controller.close();return}const n=options.chunk??65536;controller.enqueue(bytes.slice(offset,offset+n));offset=Math.min(offset+n,bytes.length)},
   cancel(){options.onCancel?.()},
  }),{status:options.status??200,headers});
 };
 return {fetchAsset,calls};
}
function kit(fixture=model(),options={},store=memoryStore()){
 const net=transport(fixture,options),manager=Q.createQwenDownloader({models:[fixture.m],store,fetchAsset:net.fetchAsset,networkIdleMs:50});
 return {fixture,store,net,manager,consent:manager.offer(fixture.m.id),signal:new AbortController().signal};
}
async function readAll(manager,id,signal){return manager.withCachedModel(id,signal,async open=>{
 const result=[];for(const asset of manager.offer(id).assets){const parts=[];for await(const p of open(asset.path))parts.push(p);result.push(Buffer.concat(parts))}return result;
})}

(async()=>{
 // Immutable manifests and opt-in bind the ID, bytes and all artifact hashes.
 const realModels=JSON.parse(fs.readFileSync('lib/qwen-assets.json')).models;
 const real=Q.createQwenDownloader({models:realModels,store:memoryStore(),fetchAsset:async()=>{throw Error('No real downloads in tests')}});
 same(real.offers.length,4,'all four web candidates, no Android bytes');
 for(const f of real.offers){ok(Object.isFrozen(f)&&Object.isFrozen(f.assets),'offers cannot mutate after consent');same(f.downloadBytes,f.assets.reduce((n,a)=>n+a.bytes,0),'whole pinned download visible')}
 const first=kit();same(await first.manager.status(first.consent.modelId),null,'empty store does not claim downloaded');
 await rejects(first.manager.download({...first.consent,downloadBytes:0},{signal:first.signal}),'consent','exact byte consent required');
 await rejects(first.manager.download({...first.consent,fingerprint:'0'.repeat(64)},{signal:first.signal}),'consent','stale hash consent refused');
 await rejects(first.manager.download({...first.consent,modelId:'off'},{signal:first.signal}),'unknown-model','Off cannot become a URL');
 same(first.net.calls.length,0,'no network or writes before consent');same(first.store.stats.writes,0,'no staged data before consent');
 for(const change of [m=>m.assets[0].url+='?mutable=1',m=>m.assets[0].sha256='bad',m=>m.assets[0].path='../escape',m=>m.downloadBytes++,m=>m.wasmRevision='main',m=>m.assets.push({...m.assets[0]})]){
  const f=model();change(f.m);assert.throws(()=>Q.createQwenDownloader({models:[f.m],store:memoryStore(),fetchAsset:async()=>{}}),e=>e.code==='manifest');checks++;
 }
 const mutatedSource=model(),sourceNet=transport(mutatedSource);const sourceManager=Q.createQwenDownloader({models:[mutatedSource.m],store:memoryStore(),fetchAsset:sourceNet.fetchAsset});
 const originalOffer=sourceManager.offer(mutatedSource.m.id);mutatedSource.m.assets[0].sha256='0'.repeat(64);
 same(sourceManager.offer(mutatedSource.m.id).fingerprint,originalOffer.fingerprint,'manager snapshots mutable source metadata');
 const cancelledBefore=kit(),cancelBefore=new AbortController();cancelBefore.abort();
 await rejects(cancelledBefore.manager.download(cancelledBefore.consent,{signal:cancelBefore.signal}),'cancelled','already cancelled never starts');same(cancelledBefore.net.calls.length,0,'cancel before start has no requests');

 // Successful tiny-stream downloads coalesce fixed-size chunks and are re-hashed on read.
 const good=kit(model(),{chunk:113}),progress=[];
 const result=await good.manager.download(good.consent,{signal:good.signal,onProgress:p=>progress.push(p)});
 same(result.reused,false,'first download verified rather than reused');same(result.cleanupPending,false,'success cleans orphan attempts');
 same(good.store.stats.maxChunk,Q.QWEN_CHUNK_BYTES,'storage writes stay at 256 KiB');same(good.store.stats.writes,4,'tiny network chunks coalesce into bounded storage chunks');
 same((await readAll(good.manager,good.consent.modelId,good.signal)).map(hash),good.fixture.data.map(hash),'cached files reproduce exact bytes');
 same(progress.at(-1).phase,'complete','complete only after pointer commit');same(progress.at(-1).receivedBytes,good.consent.downloadBytes,'progress exact final bytes');
 ok(progress.every((p,i)=>p.receivedBytes<=p.totalBytes&&(!i||p.receivedBytes>=progress[i-1].receivedBytes)),'progress monotonically bounded');
 same(good.store.state.attempts.size,1,'only committed attempt remains');
 for(const call of good.net.calls){same(call.init.method,'GET','download request is read only');same(call.init.credentials,'omit','no account cookies');same(call.init.referrerPolicy,'no-referrer','no profile referrer');same(call.init.cache,'no-store','unverified bytes do not enter HTTP cache');same(call.init.body,undefined,'no workout payload');same(call.init.headers,undefined,'no account or workout headers')}
 const calls=good.net.calls.length;same((await good.manager.download(good.consent,{signal:good.signal})).reused,true,'completed exact revision reuses its cache');same(good.net.calls.length,calls,'reusing cache makes no network requests');

 // Byte/hash/status failures remove staging and never publish a partial model.
 for(const [opts,code,name]of [[{mutate:true},'integrity','same-length tamper'],[{truncate:true},'integrity','truncated response'],[{extra:true},'integrity','extra byte'],[{status:206},'network','partial HTTP range'],[{status:503},'network','server failure'],[{throw:new Error('private driver details')},'network','offline transport'],[{oversized:true,chunk:Q.QWEN_MAX_INPUT_CHUNK_BYTES+1},'network','oversized input buffer']]){
  const k=kit(model(),opts);await rejects(k.manager.download(k.consent,{signal:k.signal}),code,name);same(k.store.state.models.size,0,`${name}: no pointer`);same(k.store.state.attempts.size,0,`${name}: staging removed`);
 }
 const encodedHeaders=kit(model(),{length:1});await encodedHeaders.manager.download(encodedHeaders.consent,{signal:encodedHeaders.signal});
 same((await readAll(encodedHeaders.manager,encodedHeaders.consent.modelId,encodedHeaders.signal)).map(hash),encodedHeaders.fixture.data.map(hash),'encoded/hidden headers cannot substitute for exact decoded size/hash');
 const insecure=kit();insecure.manager=Q.createQwenDownloader({models:[insecure.fixture.m],store:insecure.store,fetchAsset:async()=>{const response=new Response(insecure.fixture.data[0]);Object.defineProperty(response,'url',{value:'http://unsafe.example/file'});return response}});
 await rejects(insecure.manager.download(insecure.consent,{signal:insecure.signal}),'network','insecure publisher redirect rejected');same(insecure.store.state.attempts.size,0,'rejected redirect cleanup');
 const quota=kit();quota.store.fault.append=new DOMException('driver-private-marker','QuotaExceededError');
 await rejects(quota.manager.download(quota.consent,{signal:quota.signal}),'storage','quota failure is actionable');same(quota.store.state.attempts.size,0,'quota failure cleans staging');
 quota.store.fault.append=null;await quota.manager.download(quota.consent,{signal:quota.signal});same(quota.store.stats.commits,1,'retry works after storage recovered');
 const noSpace=kit();noSpace.store.fault.available=0;
 await rejects(noSpace.manager.download(noSpace.consent,{signal:noSpace.signal}),'storage','insufficient storage preflight');same(noSpace.net.calls.length,0,'low-space estimate stops before bandwidth use');
 const brokenCommit=kit();brokenCommit.store.fault.commit=new Error('driver-private-marker');
 await rejects(brokenCommit.manager.download(brokenCommit.consent,{signal:brokenCommit.signal}),'storage','failed pointer commit');same(brokenCommit.store.state.models.size,0,'failed commit leaves no ready pointer');same(brokenCommit.store.state.attempts.size,0,'failed commit removes staging');
 ok(!Q.qwenDownloadMessage(new Error('driver-private-marker')).includes('driver-private-marker'),'generic errors do not expose driver details');

 // Prior complete revision and another model survive a failed replacement/delete.
 const previous=kit();await previous.manager.download(previous.consent,{signal:previous.signal});const old=previous.store.snapshot();
 const newerFixture=model(previous.consent.modelId,77),newer=kit(newerFixture,{mutate:true},previous.store);
 await rejects(newer.manager.download(newer.consent,{signal:newer.signal}),'integrity','failed replacement');
 same(previous.store.state.models,old.models,'failed replacement preserves previous pointer');same(previous.store.state.attempts,old.attempts,'failed replacement preserves previous bytes');
 const replacement=kit(newerFixture,{},previous.store);await replacement.manager.download(replacement.consent,{signal:replacement.signal});same(previous.store.state.attempts.size,1,'successful replacement removes old attempt after commit');
 const secondFixture=model('test-web-qwen-b'),secondNet=transport(secondFixture);
 const both=Q.createQwenDownloader({models:[newerFixture.m,secondFixture.m],store:previous.store,fetchAsset:secondNet.fetchAsset});
 await both.download(both.offer(secondFixture.m.id),{signal:previous.signal});await both.remove(newerFixture.m.id);
 same(previous.store.state.models.size,1,'deleting one model leaves another complete');ok(await both.status(secondFixture.m.id),'other model remains readable');
 await both.remove(newerFixture.m.id);same(previous.store.state.models.size,1,'delete is idempotent');

 // Cancel mid-stream and after the final file; no later completion may publish.
 for(const phase of ['downloading','verifying','committing']){
  const k=kit(),controller=new AbortController();
  await rejects(k.manager.download(k.consent,{signal:controller.signal,onProgress:p=>{if(p.phase===phase&&p.receivedBytes>0)controller.abort()}}),'cancelled',`cancel at ${phase}`);
  same(k.store.state.models.size,0,`${phase}: no late completion`);same(k.store.state.attempts.size,0,`${phase}: cleanup finished`);
 }
 const failedCleanup=kit(),cancelCleanup=new AbortController();failedCleanup.store.fault.discard=new Error('disk unavailable');
 await rejects(failedCleanup.manager.download(failedCleanup.consent,{signal:cancelCleanup.signal,onProgress:p=>{if(p.receivedBytes>0)cancelCleanup.abort()}}),'cleanup','cancel cleanup failure reported');
 same(failedCleanup.store.state.attempts.size,1,'failed cleanup stays discoverable');failedCleanup.store.fault.discard=null;
 same(await failedCleanup.manager.status(failedCleanup.consent.modelId),null,'status recovers orphan staging');same(failedCleanup.store.state.attempts.size,0,'orphan staging removed on next opening');
 const commitWon=kit(),lateCancel=new AbortController(),originalCommit=commitWon.store.commit;
 commitWon.store.commit=async a=>{const r=await originalCommit(a);lateCancel.abort();return r};
 same((await commitWon.manager.download(commitWon.consent,{signal:lateCancel.signal})).receipt.modelId,commitWon.consent.modelId,'completed commit wins a later cancel');
 const observer=kit();await observer.manager.download(observer.consent,{signal:observer.signal,onProgress:()=>{throw Error('unmounted UI')}});same(observer.store.stats.commits,1,'observer exception does not corrupt persistence');

 // Cross-tab mutation is refused promptly; cancellation frees the model lock.
 const shared=memoryStore(),f=model();let startedResolve;const started=new Promise(resolve=>{startedResolve=resolve});
 const hold=Q.createQwenDownloader({models:[f.m],store:shared,fetchAsset:async()=>{startedResolve();return new Promise(()=>{})},networkIdleMs:200});
 const controller=new AbortController(),pending=hold.download(hold.offer(f.m.id),{signal:controller.signal});await started;
 const another=kit(f,{},shared);
 await rejects(another.manager.download(another.consent,{signal:another.signal}),'busy','second tab cannot download concurrently');
 await rejects(another.manager.remove(f.m.id),'busy','second tab cannot delete active model');same(another.net.calls.length,0,'losing tab uses no bandwidth');
 controller.abort();await rejects(pending,'cancelled','hung connection cancellation is prompt');await another.manager.download(another.consent,{signal:another.signal});same(shared.stats.commits,1,'cancel releases lock for retry');
 let cancelledReader=false;
 const stalled=Q.createQwenDownloader({models:[f.m],store:memoryStore(),fetchAsset:async()=>new Response(new ReadableStream({cancel(){cancelledReader=true}})),networkIdleMs:10});
 await rejects(stalled.download(stalled.offer(f.m.id),{signal:new AbortController().signal}),'network','body idle timeout');ok(cancelledReader,'stalled body is cancelled');

 // Fresh-manager persistence snapshots simulate crashes, not physical OS proof.
 const boundaries=['begin','append','seal','commit'];
 for(const boundary of boundaries){
  const store=memoryStore(old),fixture=model(f.m.id,77),net=transport(fixture),original=store[boundary];let image;
  store[boundary]=async(...args)=>{const r=await original(...args);if(!image)image=store.snapshot();return r};
  const manager=Q.createQwenDownloader({models:[fixture.m],store,fetchAsset:net.fetchAsset});await manager.download(manager.offer(fixture.m.id),{signal:new AbortController().signal});
  const expected=boundary==='commit'?fixture:model(),reopened=memoryStore(image),reopenNet=transport(expected),reopen=Q.createQwenDownloader({models:[expected.m],store:reopened,fetchAsset:reopenNet.fetchAsset});
  await reopen.status(expected.m.id);
  same(reopened.state.attempts.size,1,`${boundary}: orphan cleanup retains only committed model`);
  same((await readAll(reopen,expected.m.id,new AbortController().signal)).map(hash),expected.data.map(hash),`${boundary}: fresh module reads last committed bytes`);
 }

 // Eviction/corruption is checked again when loading; no silent network fallback.
 const corrupt=kit();await corrupt.manager.download(corrupt.consent,{signal:corrupt.signal});const ready=await corrupt.manager.status(corrupt.consent.modelId);
 corrupt.store.state.attempts.get(ready.attempt).chunks[0].bytes[0]^=0xff;
 await rejects(readAll(corrupt.manager,corrupt.consent.modelId,corrupt.signal),'integrity','cache hash corruption detected');same(corrupt.net.calls.length,2,'corrupt cache does not fetch replacements without consent');
 await rejects(corrupt.manager.readVerifiedFile(corrupt.consent.modelId,corrupt.consent.assets[0].path,corrupt.signal,corrupt.consent.downloadBytes),'integrity','no unverified array buffer escapes corrupted cache');
 corrupt.store.state.attempts.get(ready.attempt).chunks.pop();same(await corrupt.manager.status(corrupt.consent.modelId),null,'missing cached chunk no longer reports complete');
 await rejects(readAll(corrupt.manager,corrupt.consent.modelId,corrupt.signal),'not-downloaded','evicted files cannot load');
 await rejects(good.manager.withCachedModel(good.consent.modelId,good.signal,async open=>{for await(const _piece of open('https://outside.example/secret')){}}),'manifest','runtime cannot request arbitrary URLs');
 await rejects(good.manager.withCachedModel(good.consent.modelId,good.signal,async open=>{for await(const _piece of open(good.consent.assets[0].path)){break}}),'integrity','partial consumption cannot be reported as verified input');
 same(hash(new Uint8Array(await good.manager.readVerifiedFile(good.consent.modelId,good.consent.assets[0].path,good.signal,good.consent.downloadBytes))),good.fixture.m.assets[0].sha256,'complete file crosses runtime boundary only after re-verification');
 await rejects(good.manager.readVerifiedFile(good.consent.modelId,good.consent.assets[0].path,good.signal,10),'unsupported','runtime loading limit is explicit');

 same(B.QWEN_CACHE_DATABASE,'movefield-qwen-assets-v1','dedicated cache database');
 ok(B.browserQwenDownloadSupport()?.includes('HTTPS'),'unsupported browser does not initialize storage/network');
 const cacheSource=fs.readFileSync('lib/browser-qwen-cache.ts','utf8');
 ok(!/localStorage|training-studio-v2|training-studio-setup|browser-vault|transfer-bundle/.test(cacheSource),'adapter does not touch training/keys/transfers');
 ok(cacheSource.includes('ifAvailable: true')&&!cacheSource.includes('steal: true'),'cross-tab lock fails promptly without stealing');
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/qwen-download-checks.json',JSON.stringify({checks,syntheticOnly:true,realWeightsDownloaded:false,actualDeviceQualification:false,boundaries,maxWriteBytes:Q.QWEN_CHUNK_BYTES},null,2)+'\n');
 console.log(`PASS Qwen download/cancel/cache lifecycle: ${checks} assertions; synthetic assets only, no devices qualified.`);
})().catch(error=>{console.error(error);process.exitCode=1});
