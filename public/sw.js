// Generated builds pin the complete public app code/content set before activation.
// The generic root shell is the only no-store exception. No training record,
// account route, protected request, source photo, source ZIP or model weight is cached.
// Revisit the generic-shell exception before adding server-rendered accounts.
const OFFLINE = {schema:1,version:'unbuilt',assets:[]}; // __OFFLINE_BUILD__
const CACHE_PREFIX='movefield-shell-';
const CACHE=CACHE_PREFIX+OFFLINE.version;
const READY='/__movefield_offline_ready';
const assets=new Map(OFFLINE.assets.map(asset=>[asset.path,asset]));
const deploymentQuery=url=>!url.search||url.pathname.startsWith('/_next/static/')&&/^\?dpl=[A-Za-z0-9_-]{1,128}$/.test(url.search);
function storable(response,shell=false){return response.ok&&response.type==='basic'&&!response.redirected&&!response.headers.get('set-cookie')&&(shell?response.headers.get('content-type')?.includes('text/html'):!/\b(?:private|no-store)\b/i.test(response.headers.get('cache-control')||''))}
function compatibleShell(html){
 let javascript=false,stylesheet=false;
 // RSC serializes additional lazy asset references into inline script data.
 // Inspect those too, rather than checking only element src/href attributes.
 for(const match of html.matchAll(/\/_next\/static\/[A-Za-z0-9_./~-]+/g)){
  if(!assets.has(match[0]))return false;
  javascript ||= match[0].endsWith('.js');stylesheet ||= match[0].endsWith('.css');
 }
 for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const url=new URL(match[1],self.location.origin);
  if(url.origin===self.location.origin&&url.pathname.startsWith('/_next/static/')&&(!assets.has(url.pathname)||!deploymentQuery(url)))return false;
 }
 return javascript&&stylesheet;
}
async function verifyAsset(path,response){
 const expected=assets.get(path);
 if(!expected||!response)throw Error('Offline asset unavailable: '+path);
 const bytes=await response.clone().arrayBuffer();
 if(bytes.byteLength!==expected.bytes)throw Error('Offline asset size changed: '+path);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==expected.sha256)throw Error('Offline asset changed: '+path);
 return response;
}
async function checkedAsset(path){
 const response=await fetch(path,{cache:'no-store'});
 if(!storable(response))throw Error('Offline asset unavailable: '+path);
 return verifyAsset(path,response);
}
async function verifyCache(cache){
 for(const path of assets.keys())await verifyAsset(path,await cache.match(path));
 const shell=await cache.match('/'),ready=await cache.match(READY);
 if(!shell||!compatibleShell(await shell.text())||!ready||(await ready.text())!==OFFLINE.version)throw Error('Offline cache is incomplete.');
}
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 if(OFFLINE.version==='unbuilt'||!assets.size)throw Error('Offline build is incomplete.');
 const cache=await caches.open(CACHE),paths=[...assets.keys()];let cursor=0;
 try{
  const results=await Promise.allSettled(Array.from({length:Math.min(4,paths.length)},async()=>{
   while(cursor<paths.length){const path=paths[cursor++];await cache.put(path,await checkedAsset(path));}
  }));
  const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  const shell=await fetch('/',{cache:'no-store'});
  if(!storable(shell,true)||!compatibleShell(await shell.clone().text()))throw Error('Offline shell does not match this build.');
  await cache.put('/',shell);await cache.put(READY,new Response(OFFLINE.version));
  await verifyCache(cache);
  await self.skipWaiting();
 }catch(error){await caches.delete(CACHE);throw error;}
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);await verifyCache(cache);
 const old=(await caches.keys()).filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE);
 // One prior completed cache supports existing tabs importing their older chunks.
 const previous=old.at(-1);
 await Promise.all(old.filter(key=>key!==previous).map(key=>caches.delete(key)));
 await self.clients.claim();
})());});
async function cachedAsset(path){
 const current=await (await caches.open(CACHE)).match(path);if(current)return current;
 for(const key of (await caches.keys()).filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).reverse()){
  const found=await (await caches.open(key)).match(path);if(found)return found;
 }
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('authorization')||url.origin!==self.location.origin||!deploymentQuery(url))return;
 if(request.mode==='navigate'&&url.pathname==='/'&&!url.search){
  event.respondWith(fetch(request).then(async response=>{
   if(storable(response,true)&&compatibleShell(await response.clone().text())){
    const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/',copy)).catch(()=>undefined));
   }
   return response;
  }).catch(async()=>await (await caches.open(CACHE)).match('/')||Response.error()));return;
 }
 if(assets.has(url.pathname)){
  event.respondWith(cachedAsset(url.pathname).then(async cached=>{
   if(cached)return cached;
   const response=await checkedAsset(url.pathname),copy=response.clone();
   event.waitUntil(caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)).catch(()=>undefined));return response;
  }));return;
 }
 // Old tabs can request an older hashed chunk from the retained previous build.
 if(url.pathname.startsWith('/_next/static/')&&/\.(?:js|css)$/.test(url.pathname))event.respondWith(cachedAsset(url.pathname).then(cached=>cached||fetch(request)));
});
