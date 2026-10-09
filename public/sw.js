// Movefield offline shell. It keeps the app's own files so the page opens without a connection.
// Training data is not cached here: it stays in this browser's encrypted storage, and no request is sent for it.
const CACHE_PREFIX = 'movefield-shell-';
const CACHE = `${CACHE_PREFIX}v3`;
const CONTENT = new Set(['/exercise-guides.json', '/exercise-content.json', '/favicon.svg']);
const STATIC = /\.(?:css|woff2?|ttf|otf|png|jpe?g|webp|svg)$/;

self.addEventListener('install', event => {
  event.waitUntil(fetch('/').then(async response => {
    if (!storable(response, true)) throw new Error('The offline shell could not be loaded.');
    await (await caches.open(CACHE)).put('/', response);
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Only ordinary same-origin successes are stored. Redirects, errors and responses with cookies are not.
function storable(response, shell) {
  // The current root is a generic client shell with no server-rendered training records.
  // Its no-store header protects CSP nonce reuse on the network; only that shell is an explicit offline exception.
  // Revisit this exception before introducing server-rendered accounts or personalized pages.
  return response.ok && response.type === 'basic' && !response.redirected && !response.headers.get('set-cookie')
    && (shell ? response.headers.get('content-type')?.includes('text/html')
      : !/\b(?:private|no-store)\b/i.test(response.headers.get('cache-control') || ''));
}

// The copy is made before the response goes to the page. Cloning later fails once the page has read the body.
function remember(event, key, response, shell = false) {
  if (storable(response, shell)) {
    const copy = response.clone();
    // Keep cache writes alive after the response is returned; quota failure must not break online use.
    event.waitUntil(caches.open(CACHE).then(cache => cache.put(key, copy)).catch(() => undefined));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) return;

  // Pages: try the network first so a new version is used, and fall back to the saved shell when offline.
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => remember(event, '/', response, true))
        .catch(() => caches.open(CACHE).then(cache => cache.match('/')).then(cached => cached || Response.error()))
    );
    return;
  }

  // Built bundles are named by content, so a cached copy is always the right one.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || fetch(request).then(response => remember(event, request, response)))
    );
    return;
  }

  // Other static files (guide data, photos, fonts) can change at the same address. Use the network when it works.
  if (CONTENT.has(url.pathname) || /^\/runtime\/[A-Za-z0-9_.-]+\.js$/.test(url.pathname) || ((url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/brand/')) && STATIC.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then(response => remember(event, request, response))
        .catch(() => caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || Response.error()))
    );
  }
});
