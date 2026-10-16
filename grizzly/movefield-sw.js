/* Local-only app shell; stores code/guides, never decrypted records or API responses. */
const REVISION = "dc94376fb7d02e7d6f09";
const BASE = "/movefield/grizzly/";
const STATIC_REVIEW = true;
const ASSETS = ["/movefield/grizzly/assets/argon2-CYp2YzQ3.js","/movefield/grizzly/assets/chacha-TjjJ4993.js","/movefield/grizzly/assets/cloud-account-CMR_agi-.js","/movefield/grizzly/assets/index-DeGSeiNI.css","/movefield/grizzly/assets/index-Dn3iufqp.js","/movefield/grizzly/assets/progress-dashboard-dfRbidnw.js"];
const CACHE_PREFIX = "grizzly-fitness-shell-";
const EXTRA_STATIC = ["fonts/roadrage-heading.ttf","fonts/rubikdistressed-heading.ttf","fonts/rubikburned-heading.ttf","fonts/rubikmarkerhatch-heading.ttf","fonts/rubikwetpaint-heading.ttf","fonts/rubikspraypaint-heading.ttf","fonts/rubikstorm-heading.ttf","fonts/lacquer-heading.ttf","fonts/frijole-heading.ttf","fonts/shojumaru-heading.ttf","fonts/tradewinds-heading.ttf","fonts/rubikmicrobe-heading.ttf","fonts/rubikpuddles-heading.ttf","fonts/butcherman-heading.ttf","fonts/creepster-heading.ttf","fonts/jollylodger-heading.ttf","fonts/almendradisplay-heading.ttf","fonts/rye-heading.ttf","fonts/unifrakturcook-heading.ttf","fonts/sedgwickavedisplay-heading.ttf","fonts/inter-variable.ttf","fonts/barlow-condensed-semibold.ttf","fonts/oswald-heading.ttf","fonts/bitter-heading.ttf","fonts/rajdhani-heading.ttf","fonts/newrocker-heading.ttf","fonts/blackopsone-heading.ttf","fonts/rubikdirt-heading.ttf","fonts/metal-mania-regular.ttf","fonts/bungee-regular.ttf","fonts/sairastencilone-heading.ttf","fonts/stardosstencil-heading.ttf","fonts/pirataone-heading.ttf","fonts/eater-heading.ttf","fonts/nosifer-heading.ttf","brand/grizzly-fitness-logo.jpg","grizzly-favicon.svg","grizzly-paw.svg","brand/wilderness/grizzly-hero-v1.jpg","brand/wilderness/grizzly-forest-v1.jpg"];
const CACHE = CACHE_PREFIX + REVISION;
const STATIC = new Set([...ASSETS, ...['app-loading.js', 'exercise-guides.json', 'exercise-content.json', 'fonts/inter-variable.ttf', 'fonts/barlow-condensed-semibold.ttf',...EXTRA_STATIC].map(path=>BASE+path)]);
async function safeShell(response) { if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||response.headers.has('Set-Cookie'))return false;return STATIC_REVIEW?(await response.clone().text()).includes('<meta name="movefield-static-review" content="true">'):response.headers.get('X-Movefield-Offline-Shell') === 'local-v1'; }
self.addEventListener('install', event => event.waitUntil((async () => {
  if (REVISION === 'DEVELOPMENT_DISABLED') throw Error('Offline shell requires a qualified build.');
  const cache = await caches.open(CACHE);
  try {
    const shell = await fetch(BASE, { credentials: 'omit', cache: 'no-store' });
    if (!await safeShell(shell)) throw Error('This server does not permit local-only offline use.');
    // Every advertised resource must finish before reporting offline readiness.
    // Wait for all writes before removing a failed install's partial cache.
    await cache.put(BASE, shell);
    const results = await Promise.allSettled([...STATIC].map(async url => {
      const response = await fetch(url, {credentials:'omit',redirect:'error'});
      if(!response.ok)throw Error('Missing offline application file: '+url);
      await cache.put(url,response);
    }));
    const failed = results.find(result=>result.status==='rejected');
    if(failed)throw failed.reason;
  } catch(error) {
    await caches.delete(CACHE);
    throw error;
  }
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
    if(url.pathname!==BASE){
      const stored=await cache.match(url.pathname);if(stored)return stored;
      const response=await fetch(event.request,{credentials:'omit',redirect:'error'});
      // Repair an evicted/missing public entry after a successful online retry.
      // A full cache must not prevent the connected page from reading the file.
      if(response.ok)try{await cache.put(url.pathname,response.clone())}catch{}
      return response;
    }
    try{const response=await fetch(event.request);if(await safeShell(response))await cache.put(BASE,response.clone());return response}catch(error){const stored=await cache.match(BASE);if(stored)return stored;throw error}
  })());
});
