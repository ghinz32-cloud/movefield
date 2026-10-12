import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const require=createRequire(import.meta.url),{workoutFixture}=require('./domain-test-loader.cjs');
const base=process.env.MOVEFIELD_BASE_URL||'http://127.0.0.1:8816/movefield/review/';
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Local synthetic review only');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 const state=workoutFixture();state.active=null;state.restTimer=null;
 await page.evaluate(async state=>{
  for(const key of ['training-studio-v2','training-studio-setup-v1','training-studio:preferences:v1','movefield-cloud-outbox-v1'])localStorage.setItem(key,'Synthetic original: '+key);
  const r=indexedDB.open('movefield-private-records-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('meta');const db=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite');tx.objectStore('meta').put('Synthetic original encrypted root','root');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  const cache=await caches.open('movefield-pages-v1-synthetic-original');await cache.put('/movefield/synthetic-preserved',new Response('Synthetic original cache'));
  localStorage.setItem('movefield-review-training-studio-v2',JSON.stringify(state));localStorage.setItem('movefield-review-training-studio-access-v1','open');
 },state);
 await page.reload();await page.getByLabel('Vault passphrase',{exact:true}).fill('Synthetic isolated review passphrase');await page.getByLabel('Confirm passphrase',{exact:true}).fill('Synthetic isolated review passphrase');await page.getByRole('button',{name:'Create encrypted profile',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);
 const hero=page.getByRole('region',{name:'Today’s training'}),primary=hero.getByRole('button',{name:'Start workout',exact:true});const first=await primary.boundingBox(),secondary=await hero.getByRole('button',{name:'Session details',exact:true}).boundingBox();assert.ok(first.width>250&&secondary.y>first.y,'Phone primary must occupy a full row');
 await page.screenshot({path:'.sites-runtime/evidence/github-review-phone.png',fullPage:true});
 await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await page.getByRole('button',{name:'Profile & settings',exact:true}).click();await page.getByRole('button',{name:'Erase private profile',exact:true}).click();await page.getByRole('button',{name:'Erase private profile',exact:true}).last().click();await page.getByRole('heading',{name:'Protect your private profile',exact:true}).waitFor();
 const original=await page.evaluate(async()=>{const keys=['training-studio-v2','training-studio-setup-v1','training-studio:preferences:v1','movefield-cloud-outbox-v1'];const r=indexedDB.open('movefield-private-records-v1',1),db=await new Promise(resolve=>{r.onsuccess=()=>resolve(r.result)});const root=await new Promise(resolve=>{const r=db.transaction('meta').objectStore('meta').get('root');r.onsuccess=()=>resolve(r.result)});db.close();return {keys:keys.map(key=>[key,localStorage.getItem(key)]),root,cache:await (await (await caches.open('movefield-pages-v1-synthetic-original')).match('/movefield/synthetic-preserved')).text(),review:localStorage.getItem('movefield-review-training-studio-v2')}});
 for(const [key,value] of original.keys)assert.equal(value,'Synthetic original: '+key);assert.equal(original.root,'Synthetic original encrypted root');assert.equal(original.cache,'Synthetic original cache');assert.equal(original.review,null);assert.deepEqual(errors,[]);
 await writeFile('.sites-runtime/github-review-isolation.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Synthetic original same-origin storage/cache sentinels retained through actual review vault migration, settings and erasure; exact static subpath app in sandboxed Chromium.',passed:['original private index, setup, preferences and cloud queue unchanged','original IndexedDB root unchanged','original Pages service-worker cache unchanged','review profile migration and erasure use separate storage','phone primary occupies full row']},null,2)+'\n');console.log('PASS isolated review: original profile/database/cache preserved through review migration and erasure; phone actions fit');
}finally{await browser.close()}
