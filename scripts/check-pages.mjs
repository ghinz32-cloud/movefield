import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const out='dist-pages',manifest=JSON.parse(await readFile(out+'/pages-manifest.json','utf8'));
const html=await readFile(out+'/index.html','utf8'),sw=await readFile(out+'/sw.js','utf8');
let assertions=0;function ok(value,message){assert.ok(value,message);assertions++;}
function equal(actual,expected,message){assert.deepEqual(actual,expected,message);assertions++;}
async function rejects(fn,pattern,message){await assert.rejects(fn,pattern,message);assertions++;}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const templateBytes=await readFile('static-web/sw-template.js'),template=templateBytes.toString('utf8');
equal(manifest.workerTemplateSha256,hash(templateBytes),'manifest pins original worker-template bytes');
equal(manifest.version,hash(JSON.stringify({workerTemplateSha256:manifest.workerTemplateSha256,assets:manifest.assets})),'cache version includes worker template and pinned assets');
equal(sw,template.replace('__MANIFEST__',JSON.stringify(manifest)),'tests exercise exact generated worker');
ok(manifest.base==='/movefield/','project base');
ok(html.indexOf('Content-Security-Policy')<html.indexOf('<script'),'CSP precedes script');
ok(!html.includes('nonce-')&&!html.includes('unsafe-eval')&&!html.includes('unsafe-inline\'; worker'),'no fixed nonce or unsafe script policy');
for(const path of Object.keys(manifest.assets)){
 ok(/^\/movefield\/(?:assets\/[\w.-]+\.(?:js|css)|fonts\/[\w.-]+\.(?:ttf|woff2|txt)|(?:index|privacy)\.html|favicon\.svg|(?:exercise-content|exercise-guides|fitness-research)\.json|downloads\/movefield-mobile-r14\.zip|\.nojekyll)$/.test(path),'allowlist '+path);
 const bytes=await readFile(out+'/'+path.slice(manifest.base.length));ok(createHash('sha256').update(bytes).digest('hex')===manifest.assets[path],'hash '+path);
}
async function files(dir){let list=[];for(const n of await readdir(dir)){const p=dir+'/'+n,stat=await lstat(p);ok(!stat.isSymbolicLink(),'no symlinks');list.push(...(stat.isDirectory()?await files(p):[p]));}return list;}
for(const file of await files(out))ok(Object.hasOwn(manifest.assets,manifest.base+file.slice(out.length+1))||['sw.js','pages-manifest.json'].includes(file.slice(out.length+1)),'no extra asset '+file);
const scripts=(await Promise.all((await files(out+'/assets')).filter(x=>x.endsWith('.js')).map(x=>readFile(x,'utf8')))).join('\n');
ok(!scripts.includes('/runtime/qwen-worker.js')&&!scripts.includes('cdn-lfs')&&!scripts.includes('huggingface.co'),'Qwen network/runtime absent');
ok(scripts.includes('Qwen is unavailable')&&scripts.includes('worker security'),'Qwen limitation visible');
const css=(await Promise.all((await files(out+'/assets')).filter(x=>x.endsWith('.css')).map(x=>readFile(x,'utf8')))).join('\n');
ok(!css.includes("url('/fonts/")&&!css.includes('url(/fonts/'),'font paths scoped');
// Shared origin stores allow multiple generated worker versions to run independently.
const origin='https://ghinz32-cloud.github.io',prefix='movefield-pages-v1-';
const stores=new Map(),calls=[],entryDeletes=[],cacheDeletes=[],puts=[],lifecycleCalls=[],faults=new Map();
let offline=false;
const caches={
 async open(name){
  if(!stores.has(name))stores.set(name,new Map());
  const rows=stores.get(name);
  return {
   async put(key,response){puts.push({cache:name,key});rows.set(key,response.clone());},
   async match(key){return rows.get(key)?.clone();},
   async delete(key){entryDeletes.push({cache:name,key});return rows.delete(key);},
  };
 },
 async keys(){return [...stores.keys()];},
 async delete(name){cacheDeletes.push(name);return stores.delete(name);},
};
async function bytesFor(key){return readFile(out+'/'+key.slice(manifest.base.length));}
function makeWorker(source,label){
 const handlers={};
 const context={
  self:{location:{origin},clients:{async claim(){lifecycleCalls.push({worker:label,action:'claim'});}},
   skipWaiting(){lifecycleCalls.push({worker:label,action:'skipWaiting'});},
   addEventListener(name,fn){handlers[name]=fn;}},
  caches,crypto:webcrypto,URL,Response,
  fetch:async (key,options)=>{
   calls.push({key,options});
   if(offline)throw Error('Offline');
   const fault=faults.get(key),bytes=fault?.bytes??await bytesFor(key);
   return new Response(bytes,{status:fault?.status??200,headers:{'X-Pages-Test':'verified-origin'}});
  },
 };
 vm.runInNewContext(source,context);
 return {
  async lifecycle(kind){let promise;handlers[kind]({waitUntil(value){promise=value;}});await promise;},
  async request(path,options={}){
   let promise;handlers.fetch({request:{url:origin+path,method:'GET',mode:'cors',...options},respondWith(value){promise=value;}});
   return promise;
  },
 };
}
async function snapshot(){
 const result=[];
 for(const [name,rows] of stores){
  const entries=[];
  for(const [key,response] of rows)entries.push({key,status:response.status,headers:[...response.headers],bytes:Buffer.from(await response.clone().arrayBuffer()).toString('base64')});
  result.push({name,entries});
 }
 return result;
}
async function matches(response,key,message){
 equal(response.status,200,message+' status');
 equal(Buffer.from(await response.arrayBuffer()),await bytesFor(key),message+' pinned bytes');
}
const worker=makeWorker(sw,'current'),current=prefix+manifest.version;
const eager=Object.keys(manifest.assets).filter(key=>!key.includes('/downloads/'));
const shell=manifest.base+'index.html',mainJs=html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/)?.[1];
const zip=manifest.base+'downloads/movefield-mobile-r14.zip';
ok(Boolean(mainJs)&&Object.hasOwn(manifest.assets,mainJs),'generated HTML main JavaScript is pinned');
await worker.lifecycle('install');
equal([...stores.keys()],[current],'one complete cache');
equal([...stores.get(current).keys()],eager,'all pinned eager entries installed');
ok(!calls.some(call=>call.key.includes('/downloads/')),'ZIP not eagerly cached');
equal(lifecycleCalls,[],'install neither forces activation nor claims clients');
const rows=stores.get(current);
for(const key of [shell,mainJs]){
 const before=calls.length;
 await matches(await worker.request(key===shell?manifest.base:key,key===shell?{mode:'navigate'}:{}),key,'valid cached '+key);
 equal(calls.length,before,'valid cached bytes need no fetch '+key);
}
// Lazy ZIPs pass the same integrity rules when first fetched and on later cache hits.
let before=calls.length;
await matches(await worker.request(zip),zip,'verified lazy ZIP');
equal(calls.slice(before).map(call=>call.key),[zip],'only pinned ZIP fetched lazily');
before=calls.length;
await matches(await worker.request(zip),zip,'valid cached ZIP');
equal(calls.length,before,'valid cached ZIP needs no fetch');
const unrelated='other-project-cache',prior=prefix+'prior-version',legacy='movefield-shell-v1';
stores.set(unrelated,new Map([['/another-project/data',new Response('unrelated bytes')]]));
stores.set(prior,new Map([[shell,new Response(await bytesFor(shell))]]));
stores.set(legacy,new Map([[shell,new Response('legacy shell')]]));
const protectedCaches=await snapshot();
for(const path of ['/other/','/movefield/private-records.json','/movefield/index.html?private=1','/movefield/../private'])equal(await worker.request(path),undefined,'ignored '+path);
equal(await worker.request(shell,{method:'POST'}),undefined,'writes ignored');
equal(await worker.request(shell,{url:'https://example.com'+shell}),undefined,'cross origin ignored');
equal(await snapshot(),protectedCaches,'ignored requests change no cache');
before=calls.length;
const requestOptions=key=>key===shell?{mode:'navigate'}:{};
const corruption=Buffer.from('globalThis.__movefieldTampered=true;');
for(const key of [shell,mainJs,zip]){
 rows.set(key,new Response(corruption));
 const fetchBefore=calls.length,deleteBefore=entryDeletes.length;
 await matches(await worker.request(key,requestOptions(key)),key,'repairs corrupt cache '+key);
 equal(calls.slice(fetchBefore).map(call=>call.key),[key],'repair fetch stays pinned '+key);
 equal(entryDeletes.slice(deleteBefore),[{cache:current,key}],'repair deletes only corrupt pinned entry '+key);
 await matches(rows.get(key).clone(),key,'repair caches verified bytes '+key);

 rows.set(key,new Response(corruption));offline=true;
 await rejects(()=>worker.request(key,requestOptions(key)),/Offline/,'corrupt cached entry rejects offline '+key);
 ok(!rows.has(key),'offline rejection leaves corrupt entry absent '+key);offline=false;

 rows.set(key,new Response(corruption));faults.set(key,{bytes:corruption});
 await rejects(()=>worker.request(key,requestOptions(key)),/integrity/,'bad repair bytes reject '+key);
 ok(!rows.has(key),'bad repair bytes remain uncached '+key);faults.delete(key);
 await matches(await worker.request(key,requestOptions(key)),key,'recovers after failed repair '+key);
}
ok(calls.length>before,'corruption scenarios exercised network repair');
for(const status of [201,206,404,503]){
 rows.set(shell,new Response(await bytesFor(shell),{status}));
 const fetchBefore=calls.length,deleteBefore=entryDeletes.length;
 await matches(await worker.request(shell,{mode:'navigate'}),shell,'repairs wrong cached status '+status);
 equal(calls.slice(fetchBefore).map(call=>call.key),[shell],'wrong cached status requires verified refetch '+status);
 equal(entryDeletes.slice(deleteBefore),[{cache:current,key:shell}],'wrong cached status deleted '+status);

 rows.set(shell,new Response(await bytesFor(shell),{status}));offline=true;
 await rejects(()=>worker.request(shell,{mode:'navigate'}),/Offline/,'wrong cached status rejects offline '+status);
 ok(!rows.has(shell),'wrong-status offline entry absent '+status);offline=false;

 faults.set(shell,{status});
 await rejects(()=>worker.request(shell,{mode:'navigate'}),/unavailable/,'wrong network status rejects despite correct bytes '+status);
 ok(!rows.has(shell),'wrong network status remains uncached '+status);faults.delete(shell);
}
for(const priorBytes of [await bytesFor(shell),corruption]){
 stores.get(prior).set(shell,new Response(priorBytes));rows.delete(shell);
 const priorBefore=await snapshot(),fetchBefore=calls.length;
 await matches(await worker.request(shell,{mode:'navigate'}),shell,'current miss fetches current pinned shell');
 equal(calls.slice(fetchBefore).map(call=>call.key),[shell],'prior cache not used as fallback');
 equal((await snapshot()).filter(cache=>cache.name!==current),priorBefore.filter(cache=>cache.name!==current),'prior and unrelated caches untouched by miss');
 rows.delete(shell);offline=true;
 await rejects(()=>worker.request(shell,{mode:'navigate'}),/Offline/,'offline current miss rejects despite prior cache');
 ok(!rows.has(shell),'offline miss does not copy prior entry');offline=false;
}
await matches(await worker.request(shell,{mode:'navigate'}),shell,'restores current shell');
// Changing only template bytes creates a separate candidate install/cache namespace.
const candidateTemplate=template+'\n// Worker-only update regression.\n';
const candidateTemplateHash=hash(Buffer.from(candidateTemplate));
const candidateVersion=hash(JSON.stringify({workerTemplateSha256:candidateTemplateHash,assets:manifest.assets}));
const candidateManifest={...manifest,version:candidateVersion,workerTemplateSha256:candidateTemplateHash};
equal(candidateManifest.assets,manifest.assets,'worker-only update leaves every asset hash unchanged');
ok(candidateVersion!==manifest.version,'worker-only update gets distinct manifest/cache version');
const candidateCache=prefix+candidateVersion,candidate=makeWorker(candidateTemplate.replace('__MANIFEST__',JSON.stringify(candidateManifest)),'candidate');
const installBefore=await snapshot(),putBefore=puts.length,deleteBefore=cacheDeletes.length;
faults.set(eager[1],{bytes:corruption});
await rejects(()=>candidate.lifecycle('install'),/integrity/,'worker-only candidate install rejects corrupt bytes');
ok(puts.slice(putBefore).some(put=>put.cache===candidateCache),'candidate populated before failure');
equal(cacheDeletes.slice(deleteBefore),[candidateCache],'rollback deletes candidate namespace only');
ok(!stores.has(candidateCache),'failed candidate cache absent');
equal(await snapshot(),installBefore,'failed worker-only install preserves current/prior/unrelated caches byte-for-byte');
faults.clear();
equal(lifecycleCalls,[],'repairs and failed install never force activation or claim clients');
// Activate only the actual installed current worker, retaining unrelated/legacy caches.
await worker.lifecycle('activate');
ok(stores.has(current)&&stores.has(unrelated)&&stores.has(legacy)&&!stores.has(prior),'activation cleanup remains isolated to obsolete Pages versions');
equal(lifecycleCalls,[{worker:'current',action:'claim'}],'claim only occurs on activation; no skipWaiting');
for(const call of calls){
 ok(Object.hasOwn(manifest.assets,call.key),'every fetch pinned '+call.key);
 equal(JSON.parse(JSON.stringify(call.options)),{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'},'every fetch keeps restrictive policy');
}
console.log(JSON.stringify({passed:true,assertions,assets:Object.keys(manifest.assets).length,version:manifest.version,limits:['VM worker verification; no real browser/OS offline acceptance']},null,2));
