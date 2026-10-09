import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const out='dist-pages',manifest=JSON.parse(await readFile(out+'/pages-manifest.json','utf8'));
const html=await readFile(out+'/index.html','utf8'),sw=await readFile(out+'/sw.js','utf8');
let assertions=0;function ok(value,message){assert.ok(value,message);assertions++;}
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
const handlers={},stores=new Map(),calls=[];let damaged=false;
const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const rows=stores.get(name);return {async put(key,r){rows.set(key,r.clone());},async match(key){return rows.get(key)?.clone();}};},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
const context={self:{location:{origin:'https://ghinz32-cloud.github.io'},clients:{async claim(){calls.push('claim');}},addEventListener(name,fn){handlers[name]=fn;}},caches,crypto:webcrypto,URL,Response,fetch:async url=>{calls.push(url);const bytes=await readFile(out+'/'+url.slice(manifest.base.length));return new Response(damaged?Buffer.from('tampered'):bytes);}};
vm.runInNewContext(sw,context);
async function lifecycle(kind){let p;handlers[kind]({waitUntil(value){p=value;}});await p;}
await lifecycle('install');ok(stores.size===1,'one complete cache');ok(!calls.some(x=>x.includes('/downloads/')),'ZIP not eagerly cached');ok(!calls.includes('claim'),'no premature takeover');
stores.set('other-project-cache',new Map());stores.set('movefield-pages-v1-old',new Map());await lifecycle('activate');ok(stores.has('other-project-cache')&&!stores.has('movefield-pages-v1-old'),'cleanup isolated');
async function request(path,options={}){let p;handlers.fetch({request:{url:'https://ghinz32-cloud.github.io'+path,method:'GET',mode:'cors',...options},respondWith(value){p=value;}});return p;}
const before=calls.length;ok((await request('/movefield/',{mode:'navigate'})).status===200,'offline shell');ok(calls.length===before,'cached shell without fetch');
for(const path of ['/other/','/movefield/private-records.json','/movefield/index.html?private=1','/movefield/../private'])ok(await request(path)===undefined,'ignored '+path);
ok(await request('/movefield/index.html',{method:'POST'})===undefined,'writes ignored');
ok(await request('/movefield/index.html',{url:'https://example.com/movefield/index.html'})===undefined,'cross origin ignored');
damaged=true;await assert.rejects(()=>request('/movefield/downloads/movefield-mobile-r14.zip'),/integrity/);assertions++;ok(![...stores.values()][0].has('/movefield/downloads/movefield-mobile-r14.zip'),'tampered lazy asset not cached');
const current=[...stores.keys()].find(x=>x.startsWith('movefield-pages-v1-'));stores.delete(current);await assert.rejects(()=>lifecycle('install'),/integrity/);assertions++;ok(!stores.has(current),'failed install rolls back');
console.log(JSON.stringify({passed:true,assertions,assets:Object.keys(manifest.assets).length,version:manifest.version,limits:['VM worker verification; no real browser/OS offline acceptance']},null,2));
