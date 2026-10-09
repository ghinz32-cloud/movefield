'use strict';
// This worker only caches pinned public artifacts within this project scope.
const MANIFEST=__MANIFEST__;
const PREFIX='movefield-pages-v1-',CACHE=PREFIX+MANIFEST.version;
const entries=MANIFEST.assets;
async function verified(url){
 const response=await fetch(url,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
 if(!response.ok||response.type==='opaque')throw Error('Asset unavailable');
 const bytes=await response.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==entries[url])throw Error('Asset integrity mismatch');
 return new Response(bytes,{status:response.status,headers:response.headers});
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
 let key=url.pathname;
 if(request.mode==='navigate'&&(key===MANIFEST.base||key===MANIFEST.base+'index.html'))key=MANIFEST.base+'index.html';
 if(!Object.hasOwn(entries,key))return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE),cached=await cache.match(key);
 if(cached)return cached;
 const response=await verified(key);await cache.put(key,response.clone());return response;
})());
});
