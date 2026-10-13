const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
process.chdir(path.resolve(__dirname,'..'));
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name).exports;
 const mod={exports:{}};modules.set(name,mod);
 const code=ts.transpileModule(fs.readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 new Function('require','module','exports',code)(s=>s.startsWith('./')?s.endsWith('.json')?JSON.parse(fs.readFileSync(path.join('lib',s),'utf8')):load(s.slice(2)):require(s),mod,mod.exports);
 return mod.exports;
}
const Q=load('qwen-download'),C=load('qwen-controls'),P=load('qwen-network-policy'),N=load('qwen-network'),H=load('http-security');
let checks=0;const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++},ok=(a,msg)=>{assert.ok(a,msg);checks++};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
function fixture(enabled=true){
 let current={modelId:'test',label:'Synthetic',fingerprint:'a'.repeat(64),downloadBytes:123,assets:[]};
 const jobs=[],calls={status:0,download:[],remove:0};let receipt=null,statusError=null,removeError=null,statusJob=null;
 const client={offer:()=>current,status:async()=>{calls.status++;if(statusError)throw statusError;if(statusJob)return statusJob.promise;return receipt},
  download:async(consent,opts)=>{const job=deferred();calls.download.push({consent,opts});jobs.push(job);return job.promise},
  remove:async()=>{calls.remove++;if(removeError)throw removeError;receipt=null}};
 const controls=C.createQwenControls(client,'test',enabled);
 return {controls,calls,jobs,offer:current,setOffer:v=>{current=v},setReceipt:v=>{receipt=v},setStatusError:v=>{statusError=v},setRemoveError:v=>{removeError=v},setStatusJob:v=>{statusJob=v}};
}
(async()=>{
 const f=fixture();await f.controls.refresh();same(f.calls.download.length,0,'opening/checking files makes no download');same(f.controls.getSnapshot().downloaded,false,'empty is not downloaded');
 f.controls.setEnabled(false);f.controls.requestDownload();await f.controls.confirmDownload();same(f.calls.download.length,0,'Off refuses download and consent');
 f.controls.setEnabled(true);same(f.calls.download.length,0,'Automatic/enabling never downloads');
 await f.controls.confirmDownload();same(f.calls.download.length,0,'direct confirm without review does not download');
 f.controls.requestDownload();same(f.controls.getSnapshot().consent,{modelId:'test',fingerprint:'a'.repeat(64),downloadBytes:123},'review captures exact immutable consent');
 f.controls.dismissConsent();await f.controls.confirmDownload();same(f.calls.download.length,0,'dismissed consent cannot be reused');
 f.controls.requestDownload();f.controls.setEnabled(false);f.controls.setEnabled(true);await f.controls.confirmDownload();same(f.calls.download.length,0,'Off consumes pending consent even if enabled again');
 f.controls.requestDownload();const pending=f.controls.confirmDownload();await f.controls.confirmDownload();same(f.calls.download.length,1,'duplicate confirm starts one job');same(f.calls.download[0].consent,{modelId:'test',fingerprint:'a'.repeat(64),downloadBytes:123},'exact offer is passed to verified service');
 same(f.controls.getSnapshot().consent,null,'consent consumed before network');same(f.controls.getSnapshot().phase,'downloading','progress job state');
 await f.controls.remove();await f.controls.refresh();same(f.calls.remove,0,'delete cannot collide with download');same(f.calls.status,1,'status cannot overwrite download');
 f.calls.download[0].opts.onProgress({phase:'downloading',modelId:'test',path:'file',receivedBytes:1,totalBytes:123,verifiedFiles:0,totalFiles:1});same(f.controls.getSnapshot().progress.receivedBytes,1,'first progress delivered');
 f.controls.setEnabled(false);ok(f.calls.download[0].opts.signal.aborted,'cross-tab or local Off aborts');same(f.controls.getSnapshot().phase,'cancelling','cleanup is visible');
 f.calls.download[0].opts.onProgress({phase:'complete',modelId:'test',path:null,receivedBytes:123,totalBytes:123,verifiedFiles:1,totalFiles:1});same(f.controls.getSnapshot().phase,'cancelling','late progress cannot undo cancellation');
 f.jobs[0].reject(new Q.QwenDownloadError('cancelled','Download cancelled.'));await pending;same(f.controls.getSnapshot().phase,'idle','cancel returns to usable state');same(f.controls.getSnapshot().downloaded,false,'cancel does not invent completion');
 f.controls.setEnabled(true);f.controls.requestDownload();const retry=f.controls.confirmDownload();same(f.calls.download.length,2,'retry requires a new reviewed confirmation');f.jobs[1].resolve({cleanupPending:false});await retry;same(f.controls.getSnapshot().downloaded,true,'actual successful commit sets downloaded');ok(f.controls.getSnapshot().message.includes('not running'),'download never claims inference');
 f.controls.setEnabled(false);await f.controls.remove();same(f.calls.remove,1,'delete works while Off');same(f.controls.getSnapshot().downloaded,false,'delete forgets model only');
 const stale=fixture();stale.controls.requestDownload();stale.setOffer({...stale.offer,fingerprint:'b'.repeat(64)});await stale.controls.confirmDownload();same(stale.calls.download.length,0,'manifest changed after review is refused');same(stale.controls.getSnapshot().consent,null,'stale consent removed');ok(stale.controls.getSnapshot().error,'stale offer actionable');
 const quota=fixture();quota.controls.requestDownload();const quotaPending=quota.controls.confirmDownload();quota.jobs[0].reject(new DOMException('private-driver-details','QuotaExceededError'));await quotaPending;ok(quota.controls.getSnapshot().message.includes('not enough browser storage'),'quota error is useful');ok(!quota.controls.getSnapshot().message.includes('private-driver-details'),'private error not displayed');same(quota.controls.getSnapshot().phase,'idle','quota failure permits retry/delete');
 const collision=fixture();collision.setStatusError(new Q.QwenDownloadError('busy','Another tab owns these files.'));await collision.controls.refresh();ok(collision.controls.getSnapshot().error,'cross-tab collision visible');same(collision.calls.download.length,0,'collision does not download');collision.setStatusError(null);collision.setReceipt({});await collision.controls.refresh();same(collision.controls.getSnapshot().downloaded,true,'fresh status recovers after collision');
 collision.setRemoveError(new Q.QwenDownloadError('cleanup','Cleanup needs another attempt.'));await collision.controls.remove();same(collision.controls.getSnapshot().downloaded,false,'partial deletion cannot retain stale availability');ok(collision.controls.getSnapshot().message.includes('Cleanup'),'cleanup recovery visible');
 const late=fixture();late.controls.requestDownload();const lateJob=late.controls.confirmDownload();late.controls.cancel();late.jobs[0].resolve({cleanupPending:false});await lateJob;same(late.controls.getSnapshot().downloaded,true,'commit that beats cancel reported honestly');
 const offCommit=fixture();offCommit.controls.requestDownload();const offPending=offCommit.controls.confirmDownload();offCommit.controls.setEnabled(false);offCommit.jobs[0].resolve({cleanupPending:false});await offPending;ok(offCommit.controls.getSnapshot().message.includes('assistant is off'),'late successful commit keeps Off');
 const disposed=fixture();let notifications=0;disposed.controls.subscribe(()=>notifications++);disposed.controls.requestDownload();const disposedJob=disposed.controls.confirmDownload();disposed.controls.dispose();const count=notifications;ok(disposed.calls.download[0].opts.signal.aborted,'closing view aborts');disposed.jobs[0].resolve({cleanupPending:false});await disposedJob;same(notifications,count,'unmounted view ignores late completion');disposed.controls.requestDownload();await disposed.controls.confirmDownload();same(disposed.calls.download.length,1,'disposed controls cannot restart');
 const slow=fixture();const status=deferred();slow.setStatusJob(status);const slowPending=slow.controls.refresh();slow.controls.requestDownload();same(slow.controls.getSnapshot().consent,null,'status check blocks overlapping consent');slow.controls.setEnabled(false);status.resolve(null);await slowPending;same(slow.controls.getSnapshot().enabled,false,'late status cannot re-enable Off');

 // Network adapter tests never contact a publisher. The browser CSP also
 // rejects unlisted destinations before a redirect can leave its allowlist.
 const policy=JSON.parse(fs.readFileSync('lib/qwen-network-policy.json')),manifest=JSON.parse(fs.readFileSync('lib/qwen-assets.json'));
 const model=manifest.models.find(m=>m.id===P.QWEN_BROWSER_MODEL_ID);same(policy.assets.map(a=>a.url),model.assets.map(a=>a.url),'network policy matches complete offered manifest');
 const opts={method:'GET',credentials:'omit',referrerPolicy:'no-referrer',signal:new AbortController().signal};
 let networkCalls=0,cancelled=0,lastInit;const original=global.fetch;
 try {
  global.fetch=async(url,init)=>{networkCalls++;lastInit=init;const response=new Response(new ReadableStream({cancel(){cancelled++}}));Object.defineProperty(response,'url',{value:policy.assets.find(a=>a.url===url).finalUrl+'?signed=transient'});return response};
  for(const asset of policy.assets){ok(P.qwenAssetRequestAllowed(asset.url),'pinned request allowed');ok(P.qwenAssetResponseAllowed(asset.url,asset.finalUrl+'?signed=transient'),'observed exact redirect path allowed');ok(!P.qwenAssetResponseAllowed(asset.url,asset.finalUrl+'/different'),'unobserved file rejected');ok(!P.qwenAssetResponseAllowed(asset.url,asset.finalUrl+'#fragment'),'fragment rejected');}
  const first=policy.assets[0];const response=await N.fetchQwenAsset(first.url,opts);await response.body.cancel();same(networkCalls,1,'one opted-in public request');same(lastInit,{...opts,mode:'cors',cache:'no-store',redirect:'follow'},'public GET only with no credentials/referrer/payload');
  for(const [url,init]of [[first.url+'?private=payload',opts],['https://unknown.example/model',opts],[first.url,{...opts,method:'POST'}],[first.url,{...opts,body:'workout'}],[first.url,{...opts,headers:{Authorization:'private'}}],[first.url,{...opts,credentials:'include'}],[first.url,{...opts,referrerPolicy:'unsafe-url'}]]){await assert.rejects(N.fetchQwenAsset(url,init),e=>e.code==='network');checks++;}
  same(networkCalls,1,'unsafe URL/options refused before any request');
  for(const endpoint of ['http://huggingface.co/file','https://huggingface.co.evil.test/file','https://us.aws.cdn.hf.co/other-repository/file','https://user:pass@us.aws.cdn.hf.co/file','https://raw.githubusercontent.com/other/runtime'])ok(!P.qwenAssetResponseAllowed(first.url,endpoint),'unsupported redirect refused');
  global.fetch=async()=>{networkCalls++;const response=new Response(new ReadableStream({cancel(){cancelled++}}));Object.defineProperty(response,'url',{value:'https://changed-publisher.example/file'});return response};
  await assert.rejects(N.fetchQwenAsset(first.url,opts),e=>e.code==='network');checks++;same(cancelled,2,'unsupported destination body closed');
 }finally{global.fetch=original}
 const context=H.securityContext(new Request('https://example.test/'));
 const connect=context.policy.split('; ').find(s=>s.startsWith('connect-src '));same(connect,`connect-src 'self' ${P.QWEN_CONNECT_SOURCES.join(' ')}`,'production CSP uses tested exact file policy');
 ok(!connect.includes('*'),'no wildcard destinations');ok(!context.policy.includes('unsafe-eval')&&!context.policy.includes('wasm-unsafe-eval'),'file preparation does not allow runtime execution');
 ok(!connect.includes('/api/chat')&&!connect.includes('localhost'),'no cloud inference or dev destination');
 const page=fs.readFileSync('components/app-preferences.tsx','utf8');ok(page.includes("lazy(()=>import('@/components/qwen-model-files'))"),'model controls lazy');
 const ui=fs.readFileSync('components/qwen-model-files.tsx','utf8');ok(!ui.includes('chooseQualifiedQwen(')&&!ui.includes('WebLLM'),'files cannot activate inference');ok(ui.includes('controls.confirmDownload()')&&ui.includes('controls.requestDownload'),'separate review and confirmation actions');
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/qwen-controls-checks.json',JSON.stringify({checks,syntheticOnly:true,realPublisherBodiesRead:0,inferenceExecuted:false,deviceQualified:false},null,2)+'\n');
 console.log(`PASS optional Qwen controls/policy: ${checks} assertions; synthetic jobs/network only.`);
})().catch(error=>{console.error(error);process.exitCode=1});
