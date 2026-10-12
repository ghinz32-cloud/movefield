/* Local-only app shell; stores code/guides, never decrypted records or API responses. */
const REVISION = "c9af865495c17cb9e3e4";
const BASE = "/movefield/grizzly/";
const STATIC_REVIEW = true;
const ASSETS = ["/movefield/grizzly/assets/cloud-account-BhJLltea.js","/movefield/grizzly/assets/index--U8s_B7f.js","/movefield/grizzly/assets/index-BsmtHePA.css","/movefield/grizzly/assets/progress-dashboard-C_5mxkAA.js"];
const CACHE_PREFIX = "grizzly-fitness-shell-";
const EXTRA_STATIC = ["fonts/bungee-regular.ttf","fonts/rubik-beastly-regular.ttf","fonts/metal-mania-regular.ttf","brand/grizzly-fitness-logo.jpg","grizzly-favicon.svg","grizzly-paw.svg"];
const CACHE = CACHE_PREFIX + REVISION;
const STATIC = new Set([...ASSETS, ...['exercise-guides.json', 'exercise-content.json', 'fonts/inter-variable.ttf', 'fonts/barlow-condensed-semibold.ttf',...EXTRA_STATIC].map(path=>BASE+path)]);
async function safeShell(response) { if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||response.headers.has('Set-Cookie'))return false;return STATIC_REVIEW?(await response.clone().text()).includes('<meta name="movefield-static-review" content="true">'):response.headers.get('X-Movefield-Offline-Shell') === 'local-v1'; }
self.addEventListener('install', event => event.waitUntil((async () => {
  if (REVISION === 'DEVELOPMENT_DISABLED') throw Error('Offline shell requires a qualified build.');
  const cache = await caches.open(CACHE);
  const shell = await fetch(BASE, { credentials: 'omit', cache: 'no-store' });
  if (!await safeShell(shell)) throw Error('This server does not permit local-only offline use.');
  // Explicit per-device shell cache. Original origin security headers are retained.
  // The stateless shell contains no training records, credentials or account session.
  await cache.put(BASE, shell);
  await Promise.all([...STATIC].map(async url => { const response = await fetch(url, {credentials:'omit'});if(response.ok)await cache.put(url,response);else if(ASSETS.includes(url))throw Error('Missing application asset: '+url); }));
  // Wait for all old windows to close. Do not reload an active workout for an update.
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if(key.startsWith(CACHE_PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.search||!(url.pathname===BASE&&event.request.mode==='navigate'||STATIC.has(url.pathname)))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(url.pathname!==BASE){const stored=await cache.match(url.pathname);if(stored)return stored;return fetch(event.request);}
    try{const response=await fetch(event.request);if(await safeShell(response))await cache.put(BASE,response.clone());return response}catch(error){const stored=await cache.match(BASE);if(stored)return stored;throw error}
  })());
});
