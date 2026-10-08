const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const handlers = {}, stores = new Map(), origin = 'https://movefield.test';
let network, requests = [], skipped = false, claimed = false, failPut = false, checks = 0;
const key = request => typeof request === 'string' ? new URL(request, origin).href : request.url;
const response = (body, overrides = {}) => ({
  body, ok: true, type: 'basic', redirected: false, headers: new Headers({'content-type': 'text/html'}),
  clone() { return response(this.body, this); }, ...overrides,
});
const cacheAPI = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    return { async match(request) { return data.get(key(request)); }, async put(request, res) {
      if (failPut) throw Error('quota'); data.set(key(request), res);
    } };
  },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); },
};
vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
  self: { location: {origin}, addEventListener(name, handle) { handlers[name] = handle; },
    async skipWaiting() { skipped = true; }, clients: {async claim() { claimed = true; }} },
  caches: cacheAPI, URL, Response, fetch: async request => {requests.push(key(request)); return network(request);},
});
const ok = (value, message) => { assert.ok(value, message); checks++; };
const equal = (a, b, message) => { assert.equal(a, b, message); checks++; };
async function lifecycle(name) {
  const pending = []; handlers[name]({waitUntil(p) { pending.push(p); }}); await Promise.all(pending);
}
async function get(path, options = {}) {
  const pending = [];
  const event = { request: {url: new URL(path, origin).href, method: 'GET', mode: 'cors', headers: new Headers(), ...options},
    waitUntil(p) {pending.push(p);}, respondWith(p) {this.result = p;} };
  handlers.fetch(event);
  const result = await event.result;
  await Promise.all(pending);
  return {result, intercepted: !!event.result, writes: pending.length};
}
(async () => {
  network = async () => response('shell', {headers: new Headers({'content-type':'text/html', 'cache-control':'private, no-store'})});
  await lifecycle('install'); ok(skipped, 'valid generic shell installs');
  const current = 'movefield-shell-v2';
  equal(stores.get(current).get(key('/')).body, 'shell', 'only the known shell has an offline no-store exception');
  stores.set('movefield-shell-v1', new Map()); stores.set('another-feature', new Map());
  await lifecycle('activate'); ok(claimed, 'worker claims clients');
  ok(!stores.has('movefield-shell-v1'), 'old shell cache removed');
  ok(stores.has('another-feature'), 'unrelated cache preserved');
  network = async () => {throw Error('offline');};
  equal((await get('/', {mode:'navigate'})).result.body, 'shell', 'root opens from its own cache offline');
  for (const path of ['/account', '/api/history.json', '/downloads/history.json', '/?account=private', 'https://other.test/font.woff2']) {
    equal((await get(path, {mode:'navigate'})).intercepted, false, `${path} is never intercepted`);
  }
  equal((await get('/', {method:'POST',mode:'navigate'})).intercepted, false, 'writes stay out of the cache');
  equal((await get('/exercise-guides.json', {headers:new Headers({authorization:'Bearer sample'})})).intercepted, false, 'authorized requests stay out of the cache');
  network = async () => response('guide', {headers:new Headers({'content-type':'application/json'})});
  const guide = await get('/exercise-guides.json'); equal(guide.writes, 1, 'cache write kept alive');
  network = async () => {throw Error('offline');};
  equal((await get('/exercise-guides.json')).result.body, 'guide', 'visited guide is available offline');
  network = async () => response('bundle');
  await get('/_next/static/chunks/test.js'); const calls = requests.length;
  equal((await get('/_next/static/chunks/test.js')).result.body, 'bundle', 'hashed bundles are cache-first');
  equal(requests.length, calls, 'cached bundle does not fetch');
  for (const override of [{redirected:true}, {ok:false}, {headers:new Headers({'cache-control':'private'})},
    {headers:new Headers({'cache-control':'no-store'})}, {headers:new Headers({'set-cookie':'session=sample'})}]) {
    network = async () => response('must not cache', override);
    const result = await get('/fonts/test.woff2'); equal(result.writes, 0, 'unsafe response is not cached');
    ok(!stores.get(current).has(key('/fonts/test.woff2')), 'unsafe response leaves no cache entry');
  }
  network = async () => response('online'); failPut = true;
  equal((await get('/brand/mark.svg')).result.body, 'online', 'cache quota failure does not break the network response'); failPut = false;
  for (const override of [{redirected:true}, {ok:false}, {headers:new Headers({'content-type':'application/json'})}]) {
    network = async () => response('invalid shell', override);
    await assert.rejects(lifecycle('install')); checks++;
  }
  console.log(`PASS offline shell isolation and lifecycle: ${checks} checks`);
})().catch(error => {console.error(error); process.exitCode = 1;});
