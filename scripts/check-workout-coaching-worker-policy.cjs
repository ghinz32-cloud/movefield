const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createLoader}=require('./lib/load-typescript.cjs');
const timers=new Map();let nextTimer=0,checks=0;
const navigatorFixture={serviceWorker:{controller:null}};
const load=createLoader({navigator:navigatorFixture,setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
const S=load('lib/workout-coaching-worker-security.ts'),N=load('lib/qwen-network-policy.ts'),A=load('lib/app-preferences.ts');
const same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(v,m)=>{assert.ok(v,m);checks++;};
const sha=bytes=>crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const origin='https://ghinz32-cloud.github.io',base='/movefield/',workerPath=base+S.WORKOUT_COACHING_WORKER_PATH,main=base+'assets/index-current.js';
const bytes=new TextEncoder().encode('/* synthetic pinned worker bytes */'),hash=sha(bytes),version='a'.repeat(64),controller={};
const manifest={schema:1,base,version,coachingWorker:{path:S.WORKOUT_COACHING_WORKER_PATH,csp:S.WORKOUT_COACHING_WORKER_POLICY},assets:{[workerPath]:hash,[main]:'b'.repeat(64)}};
function fixture(patch={}){
 const calls=[];let current=controller;
 const options={pages:true,workerUrl:workerPath,origin,controller,currentController:()=>current,mainScript:origin+main,digest:async data=>sha(data),
  fetchFile:async(url,init)=>{calls.push({url,init});if(url===origin+base+'pages-manifest.json')return new Response(JSON.stringify(manifest),{headers:{'X-Movefield-Pages-Version':version}});
   return new Response(bytes,{headers:{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Pages-Version':version,'X-Movefield-Asset-SHA256':hash}});},...patch};
 return {options,calls,setCurrent:v=>current=v};
}
const siteWorkerPath='/'+S.WORKOUT_COACHING_WORKER_PATH,siteMain='/_next/static/app-current.js';
const siteManifest={schema:1,version,coachingWorker:{path:S.WORKOUT_COACHING_WORKER_PATH,csp:S.WORKOUT_COACHING_WORKER_POLICY},assets:[
 {path:siteWorkerPath,bytes:bytes.byteLength,sha256:hash},{path:siteMain,bytes:1,sha256:'b'.repeat(64)}]};
function siteFixture(patch={}){
 const calls=[];let current=controller;
 const options={pages:false,workerUrl:siteWorkerPath,origin,controller,currentController:()=>current,mainScript:origin+siteMain,digest:async data=>sha(data),
  fetchFile:async(url,init)=>{calls.push({url,init});if(url===origin+'/offline-build.json')return new Response(JSON.stringify(siteManifest),{headers:{'X-Movefield-Offline-Version':version}});
   return new Response(bytes,{headers:{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':hash}});},...patch};
 return {options,calls,setCurrent:value=>{current=value;}};
}
(async()=>{
 let f=fixture();same(await S.verifyWorkoutCoachingWorker(f.options),'','checked controlled Pages worker accepted');same(f.calls.map(c=>c.url),[origin+base+'pages-manifest.json',origin+workerPath],'same-origin manifest and exact worker only');
 for(const call of f.calls){same(call.init.method,'GET','read-only probe');same(call.init.credentials,'omit','no account credentials sent');same(call.init.redirect,'error','no worker redirect');same(call.init.referrerPolicy,'no-referrer','no record URL referrer');}
 for(const path of ['https://evil.test'+workerPath,workerPath+'?override=1',workerPath+'#old',base+'runtime/other.js']){f=fixture({workerUrl:path});ok(await S.verifyWorkoutCoachingWorker(f.options),'unsafe worker URL rejected');same(f.calls.length,0,'unsafe URL rejected before fetch');}
 f=fixture({controller:null});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'first visit asks for controlled reload');same(f.calls.length,0,'first visit never probes ungoverned worker');
 for(const [name,change] of [
  ['unversioned',v=>v],['wrong-version',v=>({...v,version:'c'.repeat(64)})],['wrong-base',v=>({...v,base:'/other/'})],
  ['missing-current-bundle',v=>({...v,assets:{[workerPath]:hash}})],['missing-worker',v=>({...v,assets:{[main]:'b'.repeat(64)}})],
  ['wrong-policy',v=>({...v,coachingWorker:{...v.coachingWorker,csp:"default-src *"}})],['wrong-path',v=>({...v,coachingWorker:{...v.coachingWorker,path:'runtime/other.js'}})],
 ]){
  f=fixture({fetchFile:async url=>url.endsWith('pages-manifest.json')?new Response(JSON.stringify(change(manifest)),{headers:name==='unversioned'?{}:{'X-Movefield-Pages-Version':version}}):new Response(bytes)});
  ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),name+' manifest rejected before worker use');
 }
 for(const [name,headers,body] of [
  ['absent-CSP',{'X-Movefield-Pages-Version':version,'X-Movefield-Asset-SHA256':hash},bytes],
  ['weak-CSP',{'Content-Security-Policy':"default-src *",'X-Movefield-Pages-Version':version,'X-Movefield-Asset-SHA256':hash},bytes],
  ['wrong-build',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Pages-Version':'c'.repeat(64),'X-Movefield-Asset-SHA256':hash},bytes],
  ['wrong-hash-header',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Pages-Version':version,'X-Movefield-Asset-SHA256':'c'.repeat(64)},bytes],
  ['changed-bytes',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Pages-Version':version,'X-Movefield-Asset-SHA256':hash},'damaged-worker'],
 ]){
  const original=fixture().options.fetchFile;
  f=fixture({fetchFile:async(url,init)=>url.endsWith('pages-manifest.json')?original(url,init):new Response(body,{headers})});ok(await S.verifyWorkoutCoachingWorker(f.options),name+' worker fails closed');
 }
 f=fixture();const original=f.options.fetchFile;f.options.fetchFile=async(url,init)=>{const response=await original(url,init);if(url.endsWith('.js'))f.setCurrent({});return response;};ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'controller swap requires fresh review');
 let cancelled=0;f=fixture({fetchFile:async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(1024*1024+1));},cancel(){cancelled++;}}),{headers:{'X-Movefield-Pages-Version':version}})});ok(await S.verifyWorkoutCoachingWorker(f.options),'manifest byte ceiling refuses oversized stream');same(cancelled,1,'oversized manifest reader cancelled');
 f=fixture({fetchFile:async()=>{throw Error('Private network detail')}});const network=await S.verifyWorkoutCoachingWorker(f.options);ok(network.includes('Reconnect or reload'),'network failure has recovery path');ok(!network.includes('Private network'),'private failure not echoed');
 f=siteFixture();same(await S.verifyWorkoutCoachingWorker(f.options),'','checked controlled Sites worker accepted');same(f.calls.map(c=>c.url),[origin+'/offline-build.json',origin+siteWorkerPath],'Sites probes its controller manifest and exact worker only');
 for(const call of f.calls){same(call.init.method,'GET','Sites probe read-only');same(call.init.credentials,'same-origin','private Site keeps same-origin session credentials');same(call.init.redirect,'error','private Site sign-in redirects never become worker code');same(call.init.referrerPolicy,'no-referrer','Site sends no record URL referrer');}
 f=siteFixture({controller:null});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'Sites first visit requires a controlled reload');same(f.calls.length,0,'uncontrolled Site never probes raw policy-free worker');
 ok(S.workoutCoachingWorkerSupport().includes('Reload'),'support guidance covers Site first visit');navigatorFixture.serviceWorker.controller=controller;same(S.workoutCoachingWorkerSupport(),'','fresh support call sees installed controller');navigatorFixture.serviceWorker.controller=null;
 for(const [name,change]of [
  ['wrong-schema',m=>({...m,schema:2})],['wrong-version',m=>({...m,version:'c'.repeat(64)})],['wrong-policy',m=>({...m,coachingWorker:{...m.coachingWorker,csp:"default-src *"}})],
  ['wrong-path',m=>({...m,coachingWorker:{...m.coachingWorker,path:'runtime/other.js'}})],['missing-main',m=>({...m,assets:m.assets.slice(0,1)})],['missing-worker',m=>({...m,assets:m.assets.slice(1)})],
  ['duplicate-path',m=>({...m,assets:[...m.assets,m.assets[0]]})],['query-path',m=>({...m,assets:[{...m.assets[0],path:siteWorkerPath+'?old=1'},m.assets[1]]})],
  ['invalid-bytes',m=>({...m,assets:[{...m.assets[0],bytes:0},m.assets[1]]})],['oversize-file',m=>({...m,assets:[{...m.assets[0],bytes:64*1024*1024+1},m.assets[1]]})],
  ['invalid-hash',m=>({...m,assets:[{...m.assets[0],sha256:'unverified'},m.assets[1]]})],['too-many-assets',m=>({...m,assets:Array(2001).fill(m.assets[0])})],
 ]){f=siteFixture({fetchFile:async()=>new Response(JSON.stringify(change(siteManifest)),{headers:{'X-Movefield-Offline-Version':version}})});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),name+' Sites manifest fails closed');}
 f=siteFixture({fetchFile:async()=>new Response(JSON.stringify(siteManifest))});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'raw Sites manifest without controller version is refused');
 for(const mainScript of [null,'https://foreign.test'+siteMain,origin+'/assets/uninstalled.js']){f=siteFixture({mainScript});ok(await S.verifyWorkoutCoachingWorker(f.options),'Site current entry must belong to controller asset set');}
 for(const [name,headers,body]of [
  ['raw-host-no-CSP',{'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':hash},bytes],
  ['weakened-CSP',{'Content-Security-Policy':"default-src *",'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':hash},bytes],
  ['prior-worker',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Offline-Version':'c'.repeat(64),'X-Movefield-Asset-SHA256':hash},bytes],
  ['wrong-hash-header',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':'c'.repeat(64)},bytes],
  ['changed-runtime-bytes',{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':hash},'damaged-worker'],
 ]){const original=siteFixture().options.fetchFile;f=siteFixture({fetchFile:async(url,init)=>url.endsWith('offline-build.json')?original(url,init):new Response(body,{headers})});ok(await S.verifyWorkoutCoachingWorker(f.options),name+' Sites worker fails closed');}
 f=siteFixture();const siteOriginal=f.options.fetchFile;f.options.fetchFile=async(url,init)=>{const response=await siteOriginal(url,init);if(url.endsWith('.js'))f.setCurrent({});return response;};ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'Sites controller swap requires fresh check');
 f=siteFixture({digest:async data=>{f.setCurrent({});return sha(data);}});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'Sites controller swap during hash refuses worker');
 f=siteFixture({fetchFile:async url=>url.endsWith('offline-build.json')?new Response(JSON.stringify({...siteManifest,assets:[{...siteManifest.assets[0],bytes:bytes.byteLength+1},siteManifest.assets[1]]}),{headers:{'X-Movefield-Offline-Version':version}}):new Response(bytes,{headers:{'Content-Security-Policy':S.WORKOUT_COACHING_WORKER_POLICY,'X-Movefield-Offline-Version':version,'X-Movefield-Asset-SHA256':hash}})});ok((await S.verifyWorkoutCoachingWorker(f.options)).includes('Reload'),'Sites matching hash with changed manifest byte count is refused');
 same(timers.size,0,'probe timers always cleared');
 const policy=JSON.parse(fs.readFileSync('lib/qwen-network-policy.json')),assets=[policy,...policy.models].flatMap(m=>m.assets);
 same(assets.length,235,'legacy and both larger manifests fully represented');
 for(const model of policy.models){for(const asset of model.assets){ok(N.qwenAssetRequestAllowed(asset.url),'exact larger source allowed');ok(N.qwenAssetResponseAllowed(asset.url,asset.finalUrl+'?signed=ephemeral'),'only observed larger redirect path allowed');ok(!N.qwenAssetResponseAllowed(asset.url,asset.finalUrl+'/other'),'cross-file redirect refused');}}
 const csp="connect-src 'self' "+N.QWEN_CONNECT_SOURCES.join(' ');ok(Buffer.byteLength(csp)<100*1024,'complete exact policy retains headroom below Cloudflare128KB header budget');ok(!csp.includes('*'),'no wildcard model download host');same(N.QWEN_BROWSER_MODEL_IDS.length,3,'three fixed download identities only');
 for(const choice of ['qwen3.5-4b','qwen3.5-9b']){same(A.readPreferences(JSON.stringify({model:choice})).model,choice,'explicit larger choice persists');ok(A.browserModelId(choice).includes('qwen3.5'),'exact larger identity mapping');same(A.qualifiedModel(choice,['0.6b','4b']),'off','browser experimental choice never enables native inference');}
 same(A.browserModelId('auto'),null,'automatic choice has no unqualified model');same(A.browserModelId('off'),null,'Off selects no model');
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/workout-coaching-worker-policy-checks.json',JSON.stringify({checks,syntheticOnly:true,policyBytes:Buffer.byteLength(csp),realBrowserExecuted:false,inferenceExecuted:false},null,2)+'\n');
 console.log(`PASS coaching worker policy and larger download pins: ${checks} assertions; mocked headers/controller/network only.`);
})().catch(error=>{console.error(error);process.exitCode=1});
