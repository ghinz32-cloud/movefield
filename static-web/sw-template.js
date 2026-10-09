'use strict';
// This worker only caches pinned public artifacts within this project scope.
const MANIFEST=__MANIFEST__;
const PREFIX='movefield-pages-v1-',CACHE=PREFIX+MANIFEST.version;
const entries=MANIFEST.assets;
const coachingKey=MANIFEST.base+MANIFEST.coachingWorker.path;
async function checked(response,key){
 if(!Object.hasOwn(entries,key)||response.status!==200||response.type==='opaque'||response.type==='opaqueredirect')throw Error('Asset unavailable');
 const bytes=await response.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==entries[key])throw Error('Asset integrity mismatch');
 const headers=new Headers(response.headers);
 if(key===coachingKey){
  headers.set('Content-Security-Policy',MANIFEST.coachingWorker.csp);
  headers.set('X-Movefield-Pages-Version',MANIFEST.version);
  headers.set('X-Movefield-Asset-SHA256',digest);
 }
 return new Response(bytes,{status:response.status,headers});
}
async function verified(key){
 return checked(await fetch(key,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'}),key);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{for(const url of Object.keys(entries).filter(x=>!x.includes('/downloads/')))await cache.put(url,await verified(url));}
 catch(error){await caches.delete(CACHE);throw error;}
 // Never activate over an open workout. The browser activates after old clients close.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(MANIFEST.base)||url.search)return;
 if(url.pathname===MANIFEST.base+'pages-manifest.json'){
  event.respondWith(Promise.resolve(new Response(JSON.stringify(MANIFEST),{status:200,headers:{'Content-Type':'application/json',
   'Cache-Control':'no-store','X-Movefield-Pages-Version':MANIFEST.version}})));
  return;
 }
 let key=url.pathname;
 if(request.mode==='navigate'&&(key===MANIFEST.base||key===MANIFEST.base+'index.html'))key=MANIFEST.base+'index.html';
 if(!Object.hasOwn(entries,key))return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE),cached=await cache.match(key);
 if(cached){
  // Origin cache entries can change after installation; verify every hit.
  try{return await checked(cached,key);}
  catch{await cache.delete(key);}
 }
 const response=await verified(key);await cache.put(key,response.clone());return response;
})());
});
