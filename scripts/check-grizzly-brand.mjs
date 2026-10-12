import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const require=createRequire(import.meta.url),{workoutFixture}=require('./domain-test-loader.cjs');
const base=process.env.MOVEFIELD_BASE_URL||'http://127.0.0.1:8817/movefield/grizzly/';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Synthetic local checks only');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}});
await mkdir('.sites-runtime/grizzly-evidence',{recursive:true});
try {
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 const state=workoutFixture();state.active=null;state.restTimer=null;
 await page.evaluate(async state=>{
  for(const prefix of ['','movefield-review-']) {
   for(const key of ['training-studio-v2','training-studio-setup-v1','training-studio:preferences:v1'])localStorage.setItem(prefix+key,'Synthetic preserved '+prefix+key);
   localStorage.setItem(prefix+'movefield-cloud-outbox-v1','Synthetic preserved outbox');
   const request=indexedDB.open(prefix+'movefield-private-records-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('meta');
   const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
   await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite');tx.objectStore('meta').put('Synthetic preserved '+prefix,'root');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  }
  for(const prefix of ['movefield-pages-v1-','movefield-review-shell-']){const cache=await caches.open(prefix+'synthetic-preserved');await cache.put('/movefield/preserved-'+prefix,new Response('Synthetic preserved '+prefix));}
  localStorage.setItem('grizzly-training-studio-v2',JSON.stringify(state));localStorage.setItem('grizzly-training-studio-access-v1','open');
 },state);
 await page.reload();await page.getByLabel('Vault passphrase',{exact:true}).fill('Synthetic Grizzly isolated passphrase');await page.getByLabel('Confirm passphrase',{exact:true}).fill('Synthetic Grizzly isolated passphrase');await page.getByRole('button',{name:'Create encrypted profile',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.evaluate(()=>document.fonts.ready);
 assert.match(await page.getByRole('heading',{name:'Today',exact:true}).evaluate(el=>getComputedStyle(el).fontFamily),/Bungee/);
 assert.equal(await page.evaluate(()=>document.fonts.check('16px Bungee')),true);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand-from').trim()),'#f5cb79');
 const hero=page.getByRole('region',{name:'Today’s training'}),primary=await hero.getByRole('button',{name:'Start workout',exact:true}).boundingBox(),secondary=await hero.getByRole('button',{name:'Session details',exact:true}).boundingBox();assert.ok(primary.width>250&&secondary.y>primary.y);
 await page.screenshot({path:'.sites-runtime/grizzly-evidence/today-phone.png',fullPage:true});
 await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await page.getByRole('button',{name:'Profile & settings',exact:true}).click();await page.getByRole('button',{name:'Dark',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('grizzly-fitness:preferences:v1')).mode),'dark');
 await page.getByRole('switch',{name:'Reduce motion',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.reduceMotion),'true');
 await page.getByRole('button',{name:'Erase private profile',exact:true}).click();await page.getByRole('button',{name:'Erase private profile',exact:true}).last().click();await page.getByRole('heading',{name:'Protect your private profile',exact:true}).waitFor();
 await page.evaluate(async()=>{
  for(const prefix of ['','movefield-review-']){
   for(const key of ['training-studio-v2','training-studio-setup-v1','training-studio:preferences:v1'])if(localStorage.getItem(prefix+key)!=='Synthetic preserved '+prefix+key)throw Error('Other profile altered: '+prefix+key);
   if(localStorage.getItem(prefix+'movefield-cloud-outbox-v1')!=='Synthetic preserved outbox')throw Error('Other outbox altered');
   const request=indexedDB.open(prefix+'movefield-private-records-v1',1),db=await new Promise(resolve=>{request.onsuccess=()=>resolve(request.result)});const value=await new Promise(resolve=>{const r=db.transaction('meta').objectStore('meta').get('root');r.onsuccess=()=>resolve(r.result)});db.close();if(value!=='Synthetic preserved '+prefix)throw Error('Other database altered');
  }
  for(const prefix of ['movefield-pages-v1-','movefield-review-shell-']){const response=await (await caches.open(prefix+'synthetic-preserved')).match('/movefield/preserved-'+prefix);if(!response||await response.text()!=='Synthetic preserved '+prefix)throw Error('Other offline cache altered');}
  if(localStorage.getItem('grizzly-training-studio-v2')!==null)throw Error('Gym profile was not erased');
 });
 await page.getByRole('button',{name:'Explore sample training',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.grizzly-hero-paw')).animationName),'none');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.sites-runtime/grizzly-evidence/today-desktop.png',fullPage:true});
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Create encrypted profile',exact:true}).waitFor();await page.getByRole('button',{name:'Explore sample training',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.fonts.load('16px Bungee').then(()=>document.fonts.check('16px Bungee'))),true);await context.setOffline(false);
 const sw=await readFile('.sites-runtime/github-pages-grizzly/movefield-sw.js','utf8');assert.match(sw,/CACHE_PREFIX = "grizzly-fitness-shell-"/);assert.match(sw,/fonts\/bungee-regular.ttf/);
 const motion=await browser.newContext({reducedMotion:'reduce'}),motionPage=await motion.newPage();await motionPage.goto(base);await motionPage.getByRole('button',{name:'Explore sample training',exact:true}).click();await motionPage.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal(await motionPage.evaluate(()=>getComputedStyle(document.querySelector('.grizzly-hero-paw')).animationName),'none');await motion.close();
 assert.deepEqual(errors,[]);
 await writeFile('.sites-runtime/grizzly-brand-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Sandboxed Chromium; synthetic disposable profiles. Physical phones and official gym assets not qualified.',passed:['Bungee heading font loaded; amber default','phone primary action spans a full row','both Movefield localStorage, drafts, preferences, queues, IndexedDB roots and caches preserved through Grizzly migration/erasure','Grizzly preferences have their own key','system and in-app reduced motion stop paw animation','separate offline shell and heading font reopen offline']},null,2)+'\n');
 console.log('PASS Grizzly identity, dual-profile isolation, motion preferences and offline font');
} finally {await browser.close();}
