// Movefield offline shell. It keeps the app's own files so the page opens without a connection.
// Training data is not cached here: it stays in this browser's encrypted storage, and no request is sent for it.
const CACHE = 'movefield-shell-v1';
const SHELL = ['/'];
const STATIC = /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|svg|json)$/;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Only ordinary same-origin successes are stored. Redirects, errors and responses with cookies are not.
function storable(response) {
  return response.ok && response.type === 'basic' && !response.headers.get('set-cookie');
}

// The copy is made before the response goes to the page. Cloning later fails once the page has read the body.
function remember(key, response) {
  if (storable(response)) {
    const copy = response.clone();
    void caches.open(CACHE).then(cache => cache.put(key, copy));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: try the network first so a new version is used, and fall back to the saved shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => remember('/', response))
        .catch(() => caches.match('/').then(cached => cached || Response.error()))
    );
    return;
  }

  // Built bundles are named by content, so a cached copy is always the right one.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => remember(request, response)))
    );
    return;
  }

  // Other static files (guide data, photos, fonts) can change at the same address. Use the network when it works.
  if (STATIC.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(response => remember(request, response))
        .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
  }
});
