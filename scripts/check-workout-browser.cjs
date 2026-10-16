const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { workoutFixture, load } = require('./domain-test-loader.cjs');
const base = process.env.MOVEFIELD_BASE_URL || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('These synthetic mutation tests are limited to a local app.');
const {BrowserVault}=load('lib/browser-vault.ts');
const {decodeRecordBundle,recordBundleRoot}=load('lib/record-state.ts');
const {rawRecordBundle,clearRecords}=require('./browser-record-read.cjs');
const digest=async raw=>require('node:crypto').createHash('sha256').update(raw).digest('hex');
const syntheticPassphrase='Synthetic browser vault passphrase';
let cachedVault;
async function decoded(raw){const root=recordBundleRoot(raw);if(!cachedVault||cachedVault.header.vaultId!==JSON.parse(root).vaultId)cachedVault=await BrowserVault.open(syntheticPassphrase,root);return decodeRecordBundle(raw,{open:cipher=>cachedVault.decrypt(cipher),digest});}
async function readState(page){return decoded(await rawRecordBundle(page))}
const coaching=page=>page.getByRole('dialog').filter({has:page.locator('.workout-coaching-copy')});
async function dismissAfterCoaching(page,workoutId=fixture.active.id){
  const dialog=coaching(page);await dialog.waitFor();assert.equal(await dialog.count(),1);
  await dialog.getByText('Your saved workout',{exact:false}).waitFor();
  const saved=await readState(page);assert.equal(saved.active,null);assert.equal(saved.history.filter(workout=>workout.id===workoutId).length,1);
  await dialog.getByRole('button',{name:'Close coaching',exact:true}).click();
  await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
  assert.deepEqual(await readState(page),saved,'Dismissing after-workout coaching cannot change the saved record');
}
async function unlock(page,create=false){await page.getByLabel('Vault passphrase',{exact:true}).fill(syntheticPassphrase);if(create)await page.getByLabel('Confirm passphrase',{exact:true}).fill(syntheticPassphrase);await page.getByRole('button',{name:create?'Create encrypted profile':'Unlock profile',exact:true}).click();}
const { exFor } = load('lib/training.ts');
const fixture = workoutFixture();
fixture.restTimer = null;
fixture.active.targets = fixture.active.targets.slice(0, 3).map(x => ({ ...x, sets: 1 }));
fixture.active.sets = fixture.active.targets.map(x => ({ exerciseId: x.exerciseId, set: 1, reps: 8, kg: null, done: false }));
const ids = fixture.active.targets.map(x => x.exerciseId), names = ids.map(id => exFor(id).name);
let passed = 0;
const waitFor = async (page, predicate) => { await page.waitForFunction(predicate, undefined, { timeout: 15000 }); };
async function seeded(context, state=fixture, resume=true) {
  const page = await context.newPage();
  await page.goto(base);
  await page.evaluate(s => { localStorage.setItem('training-studio-v2', JSON.stringify(s)); localStorage.setItem('training-studio-access-v1', 'open'); }, state);
  await page.reload();
  await unlock(page,true);
  await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
  if(resume){await page.getByRole('button', { name: 'Resume workout', exact: true }).click();
  await page.getByRole('heading', { name: 'Exercises in this workout', exact: true }).waitFor();}
  return page;
}
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', chromiumSandbox: true, args: ['--disable-setuid-sandbox'], env: { ...process.env, XDG_CONFIG_HOME: require('node:path').resolve('.sites-runtime/config'), XDG_CACHE_HOME: require('node:path').resolve('.sites-runtime/cache') } });
  try {
    await test('First offline installation does not announce a replacement update',async()=>{
      const context=await browser.newContext();try{const page=await context.newPage();await page.goto(base);await page.getByRole('button',{name:'Explore sample training',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await page.evaluate(()=>navigator.serviceWorker.ready);await page.getByText('Offline app files ready on this device.',{exact:true}).waitFor({state:'attached'});const registration=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {active:!!r?.active,waiting:!!r?.waiting}});assert.deepEqual(registration,{active:true,waiting:false});assert.equal(await page.getByText('An app update is ready. Save your work, close all Movefield windows, then reopen to use it.',{exact:true}).count(),0);}finally{await context.close()}
    });
    await test('Actual quota failure keeps the set unfinished, focused, and recoverable', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'training-studio-v2') throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); return window.originalSetItem.call(this, key, value); }; });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByText('Synthetic quota failure', { exact: false }).first().waitFor();
        assert.equal(await page.getByRole('heading', { name: names[0], exact: true }).count(), 1);
        assert.equal((await readState(page)).active.sets[0].done, false);
        assert.equal(await page.getByRole('button', { name: `Saved ${names[0]} set 1`, exact: true }).count(), 0);
        await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        assert.equal((await readState(page)).active.sets[0].done, true);
        await page.reload(); await unlock(page); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal((await readState(page)).active.sets[0].done, true);
      } finally { await context.close(); }
    });
    await test('Partial finish cannot appear saved when the real storage write fails', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
        await page.getByText('2 sets or tasks are not logged.', { exact: false }).waitFor();
        await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'training-studio-v2') throw new DOMException('Synthetic finish failure', 'QuotaExceededError'); return window.originalSetItem.call(this, key, value); }; });
        await page.getByRole('button', { name: 'Save workout', exact: true }).click();
        await page.getByText('Synthetic finish failure', { exact: false }).first().waitFor();
        assert.equal(await page.getByRole('dialog').count(), 1);
        assert.equal(await coaching(page).count(),0,'Failed finish must not open after-workout coaching');
        assert.equal((await readState(page)).history.length, 0);
        await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
        await page.getByRole('button', { name: 'Save workout', exact: true }).dblclick();
        await dismissAfterCoaching(page);
        await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        const saved = await readState(page);
        assert.equal(saved.active, null); assert.equal(saved.history.length, 1); assert.equal(saved.history[0].partial, true); assert.equal(saved.history[0].sets.filter(x => x.done).length, 1);
        await page.reload(); await unlock(page); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal((await readState(page)).history.length, 1);
        assert.equal(await coaching(page).count(),0,'Reload must not replay dismissed after-workout coaching');
      } finally { await context.close(); }
    });
    await test('Delayed save respects deliberate navigation back to the remaining list', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.evaluate(() => { void navigator.locks.request('training-studio-save:training-studio-v2', () => new Promise(resolve => { window.releaseSyntheticSave = resolve; })); });
        await page.waitForFunction(() => typeof window.releaseSyntheticSave === 'function', undefined, { timeout: 15000 });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        assert.equal(await page.getByLabel(`${names[0]} set 1 ${exFor(ids[0]).metric}`,{exact:true}).isDisabled(),true);
        await page.getByRole('button', { name: 'All exercises / remaining work', exact: true }).click();
        assert.equal((await readState(page)).active.sets[0].done, false);
        await page.evaluate(() => { window.releaseSyntheticSave(); });
        await page.getByRole('button', {name:`1. ${names[0]}`,exact:false}).waitFor();assert.equal((await readState(page)).active.sets[0].done,true);
        await page.getByRole('heading', { name: 'Exercises in this workout', exact: true }).waitFor();
        assert.equal(await page.getByRole('heading', { name: names[1], exact: true }).count(), 0);
      } finally { await context.close(); }
    });
    await test('Full completion saves exactly one workout with the original workout identity and date', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        for (let index = 0; index < names.length; index++) {
          await page.getByRole('heading', { name: names[index], exact: true }).waitFor();
          await page.getByRole('button', { name: `Log ${names[index]} set 1`, exact: true }).click();
        }
        await page.getByRole('heading', { name: 'Workout complete', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
        await page.getByRole('button', { name: 'Save workout', exact: true }).click();
        await dismissAfterCoaching(page);
        await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        const saved = await readState(page);
        assert.equal(saved.history.length, 1); assert.equal(saved.history[0].id, fixture.active.id); assert.equal(saved.history[0].date, fixture.active.date); assert.equal(saved.history[0].partial, false); assert.equal(saved.history[0].sets.filter(x => x.done).length, 3); assert.equal(saved.active, null); assert.equal(saved.restTimer, null);
        await page.reload(); await unlock(page); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal((await readState(page)).history.length, 1);
      } finally { await context.close(); }
    });
    await test('A second tab changes the snapshot without being overwritten by a stale command', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        const other = await context.newPage(); await other.goto(base);
        const changed=await readState(other);changed.profile.name='Synthetic other tab';const encoded=await cachedVault.encrypt(JSON.stringify(changed));await other.evaluate(raw=>localStorage.setItem('training-studio-v2',raw),encoded);
        await page.getByText('Your saved profile changed in another tab.', { exact: false }).first().waitFor();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        const saved = await readState(page);
        assert.equal(saved.profile.name,fixture.profile.name,'The original database root stays intact'); assert.equal(saved.active.sets[0].done, false);
        assert.equal((await decoded(await other.evaluate(()=>localStorage.getItem('training-studio-v2')))).profile.name,'Synthetic other tab','The newer legacy-writer cache is also preserved');
      } finally { await context.close(); }
    });
    await test('Sample actions and reset leave the personal snapshot byte-for-byte unchanged', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        const personal = await page.evaluate(() => localStorage.getItem('training-studio-v2'));
        assert.ok((await decoded(personal)).restTimer);
        await page.getByRole('button', { name: 'Progress', exact: true }).click();
        await page.getByRole('button', { name: 'View 12-week example', exact: false }).click();
        await page.getByRole('button', { name: 'Return to my profile', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Profile & settings', exact: true }).click();
        await page.getByRole('button', { name: 'Reset prototype', exact: true }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
        await waitFor(page, () => sessionStorage.getItem('training-studio-sample-v1') !== null).catch(async error=>{console.log('Reset state:',await page.evaluate(()=>({samplePresent:sessionStorage.getItem('training-studio-sample-v1') !== null,status:document.body.innerText.slice(-1200)})));throw error});
        assert.equal(await page.evaluate(() => localStorage.getItem('training-studio-v2')), personal);
        assert.ok(await page.evaluate(() => JSON.parse(sessionStorage.getItem('training-studio-sample-v1')).history.length > 0));
        await page.getByRole('button', { name: 'Return to my profile', exact: true }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('training-studio-v2')), personal);
      } finally { await context.close(); }
    });
    await test('Encrypted reload rejects a wrong passphrase without overwriting the saved file',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{const original=await page.evaluate(()=>localStorage.getItem('training-studio-v2'));assert.equal(JSON.parse(original).format,'movefield-vault');assert.ok(!original.includes('Synthetic test athlete'));await page.reload();await page.getByLabel('Vault passphrase',{exact:true}).fill('Wrong synthetic vault passphrase');await page.getByRole('button',{name:'Unlock profile',exact:true}).click();await page.getByText('The passphrase is incorrect or this file is damaged.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-v2')),original);await unlock(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();}finally{await context.close()}
    });
    await test('History corrections preserve another active workout and timer through encrypted reload',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{
        await page.getByRole('button',{name:`1. ${names[0]}`,exact:false}).click();await page.getByRole('button',{name:`Log ${names[0]} set 1`,exact:true}).click();await page.getByRole('heading',{name:names[1],exact:true}).waitFor();
        const before=await readState(page);const old={...before.active,id:'synthetic-history-edit',sessionId:'synthetic-old-session',finishedAt:2,sets:before.active.sets.map(x=>({...x,done:true})),partial:false};before.history=[old];const encoded=await cachedVault.encrypt(JSON.stringify(before));await clearRecords(page);await page.evaluate(raw=>localStorage.setItem('training-studio-v2',raw),encoded);await page.reload();await unlock(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
        await page.getByRole('button',{name:'Progress',exact:true}).click();await page.getByRole('button',{name:'View workout',exact:true}).click();await page.getByRole('button',{name:'Edit saved workout',exact:true}).click();await page.getByLabel(`Edit ${names[0]} set 1 amount`,{exact:true}).fill('9');await page.getByRole('button',{name:'Review corrections',exact:true}).click();await page.getByRole('button',{name:'Save corrections',exact:true}).click();await page.getByRole('button',{name:'Edit saved workout',exact:true}).waitFor();const after=await readState(page);assert.equal(after.history[0].sets[0].reps,9);assert.equal(after.history[0].revision,2);assert.deepEqual(after.active,before.active);assert.deepEqual(after.restTimer,before.restTimer);assert.equal(after.history[0].date,old.date);await page.reload();await unlock(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal((await readState(page)).history[0].sets[0].reps,9);
      }finally{await context.close()}
    });
    await test('Migration quota failure leaves the original plaintext file intact until retry',async()=>{
      const context=await browser.newContext();const page=await context.newPage();
      try{await page.goto(base);const original=JSON.stringify(fixture);await page.evaluate(raw=>{localStorage.setItem('training-studio-v2',raw);localStorage.setItem('training-studio-access-v1','open')},original);await page.reload();await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='training-studio-v2')throw new DOMException('Synthetic migration failure','QuotaExceededError');return window.originalSetItem.call(this,key,value)}});await unlock(page,true);await page.getByText('Synthetic migration failure',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-v2')),original);await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem});await unlock(page,true);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal((await readState(page)).active.id,fixture.active.id);}finally{await context.close()}
    });
    await test('Encrypted backup is previewed and restored through the actual settings flow',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{await page.getByRole('button',{name:`1. ${names[0]}`,exact:false}).click();await page.getByRole('button',{name:`Log ${names[0]} set 1`,exact:true}).click();await page.getByRole('heading',{name:names[1],exact:true}).waitFor();await page.getByRole('button',{name:'Finish workout',exact:true}).click();await page.getByRole('button',{name:'Save workout',exact:true}).click();await dismissAfterCoaching(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();const savedCache=await page.evaluate(()=>localStorage.getItem('training-studio-v2')),raw=await rawRecordBundle(page),saved=await decoded(raw);await page.getByRole('button',{name:'Profile & settings',exact:true}).click();await page.getByText('Restore an encrypted backup',{exact:true}).click();await page.getByLabel('Encrypted backup file',{exact:true}).setInputFiles({name:'synthetic-encrypted-backup.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.getByLabel('Backup passphrase',{exact:true}).fill(syntheticPassphrase);await page.getByRole('button',{name:'Preview restore',exact:true}).click();await page.getByText('Backup contains 1 saved workouts',{exact:false}).waitFor();await page.getByLabel('Encrypted backup file',{exact:true}).setInputFiles({name:'oversized-synthetic.json',mimeType:'application/json',buffer:Buffer.alloc(load('lib/legacy-transfer.ts').LEGACY_TRANSFER_MAX_BYTES+1,32)});await page.getByText('This file exceeds the supported vault size.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Replace private profile with this backup',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Preview restore',exact:true}).isDisabled(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-v2')),savedCache);await page.getByLabel('Encrypted backup file',{exact:true}).setInputFiles({name:'synthetic-encrypted-backup.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.getByRole('button',{name:'Preview restore',exact:true}).click();await page.getByText('Backup contains 1 saved workouts',{exact:false}).waitFor();await page.getByRole('button',{name:'Replace private profile with this backup',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.deepEqual(await readState(page),saved);}finally{await context.close()}
    });
    if(process.env.MOVEFIELD_TEST_OFFLINE==='1')await test('Built app reopens offline, unlocks and saves without caching private records',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,undefined,{timeout:30000});await context.setOffline(true);await page.reload();await unlock(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await page.getByRole('button',{name:'Resume workout',exact:true}).click();await page.getByRole('button',{name:`1. ${names[0]}`,exact:false}).click();await page.getByRole('button',{name:`Log ${names[0]} set 1`,exact:true}).click();await page.getByRole('heading',{name:names[1],exact:true}).waitFor();assert.equal((await readState(page)).active.sets[0].done,true);const cached=await page.evaluate(async()=>{const contents=[];for(const name of await caches.keys()){const cache=await caches.open(name);for(const request of await cache.keys())contents.push(await (await cache.match(request)).text())}return contents.some(text=>text.includes('Synthetic test athlete')||text.includes('synthetic-active'))});assert.equal(cached,false);await context.setOffline(false);}finally{await context.close()}
    });
    await test('Passphrase change and explicit locking keep records and reject the old passphrase',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{const before=await readState(page),replacement='Replacement synthetic passphrase';await page.getByRole('button',{name:'Profile & settings',exact:true}).click();await page.getByText('Change vault passphrase',{exact:true}).click();await page.getByLabel('New vault passphrase',{exact:true}).fill(replacement);await page.getByLabel('Confirm new passphrase',{exact:true}).fill(replacement);await page.getByRole('button',{name:'Save new passphrase',exact:true}).click();await page.getByText('Passphrase changed. Older backups',{exact:false}).waitFor();const raw=await page.evaluate(()=>localStorage.getItem('training-studio-v2'));await assert.rejects(BrowserVault.open(syntheticPassphrase,raw));const rotated=await BrowserVault.open(replacement,raw);assert.deepEqual(await decodeRecordBundle(await rawRecordBundle(page),{open:cipher=>rotated.decrypt(cipher),digest}),before);await page.getByRole('button',{name:'Lock private profile',exact:true}).click();await page.getByRole('heading',{name:'Unlock your training',exact:true}).waitFor();await page.getByLabel('Vault passphrase',{exact:true}).fill(replacement);await page.getByRole('button',{name:'Unlock profile',exact:true}).click();await page.getByRole('button',{name:'Continue on this device',exact:false}).count().then(async count=>{if(count)await page.getByRole('button',{name:'Continue on this device',exact:false}).click()});assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-v2')),raw);}finally{await context.close()}
    });
    await test('Encrypted export includes a staged input after device storage fails',async()=>{
      const context=await browser.newContext({acceptDownloads:true});const page=await seeded(context);
      try{await page.getByRole('button',{name:`1. ${names[0]}`,exact:false}).click();await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='training-studio-v2')throw new DOMException('Synthetic draft export failure','QuotaExceededError');return window.originalSetItem.call(this,key,value)}});await page.getByLabel(`${names[0]} set 1 ${exFor(ids[0]).metric}`,{exact:true}).fill('9');await page.getByText('Synthetic draft export failure',{exact:false}).first().waitFor();assert.equal((await readState(page)).active.sets[0].reps,8);const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await downloading;const raw=fs.readFileSync(await download.path(),'utf8'),backup=await decoded(raw);assert.equal(JSON.parse(raw).format,'movefield-vault');assert.equal(backup.active.sets[0].reps,9);assert.equal(backup.active.sets[0].done,false);assert.equal((await readState(page)).active.sets[0].reps,8);}finally{await context.close()}
    });
    await test('Full tracking-plan import retains saved history and creates no completed workouts',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{await page.getByRole('button',{name:`1. ${names[0]}`,exact:false}).click();await page.getByRole('button',{name:`Log ${names[0]} set 1`,exact:true}).click();await page.getByRole('heading',{name:names[1],exact:true}).waitFor();await page.getByRole('button',{name:'Finish workout',exact:true}).click();await page.getByRole('button',{name:'Save workout',exact:true}).click();await dismissAfterCoaching(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();const before=await readState(page);await page.getByRole('button',{name:'Plans',exact:true}).click();await page.getByRole('button',{name:'Import a saved plan',exact:true}).click();await page.getByLabel('Plan JSON',{exact:true}).fill(JSON.stringify(before.plan));await page.getByLabel('Plan creator or source',{exact:true}).fill('Synthetic owner template');await page.getByRole('button',{name:'Preview full imported schedule',exact:true}).click();await page.getByText('unperformed workouts · credit: Synthetic owner template',{exact:false}).waitFor();await page.getByRole('button',{name:'Accept credited tracking plan',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();const after=await readState(page);assert.deepEqual(after.history,before.history);assert.equal(after.plan.profile.mode,'manual');assert.ok(after.plan.sessions.every(s=>s.status==='scheduled'));assert.notEqual(after.plan.id,before.plan.id);assert.ok(after.saved.some(p=>p.id===before.plan.id));await page.reload();await unlock(page);await page.getByRole('heading',{name:'Today',exact:true}).waitFor();assert.equal((await readState(page)).history.length,1);}finally{await context.close()}
    });
    await test('Private erasure removes state and draft while retaining sample records',async()=>{
      const context=await browser.newContext();const page=await seeded(context);
      try{await page.evaluate(()=>{sessionStorage.setItem('training-studio-sample-v1','synthetic-sample-retained');localStorage.setItem('training-studio-setup-v1','synthetic-encrypted-draft')});await page.getByRole('button',{name:'Profile & settings',exact:true}).click();await page.getByRole('button',{name:'Erase private profile',exact:true}).click();await page.getByRole('button',{name:'Erase private profile',exact:true}).last().click();await page.getByRole('heading',{name:'Protect your private profile',exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-v2')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('training-studio-setup-v1')),null);assert.equal(await page.evaluate(()=>sessionStorage.getItem('training-studio-sample-v1')),'synthetic-sample-retained');await page.reload();await page.getByRole('heading',{name:'Protect your private profile',exact:true}).waitFor();}finally{await context.close()}
    });
    await test('Recovered static assets and narrow exercise overview render in the actual app', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 740 } }); const page = await seeded(context);
      try {
        for (const asset of ['/exercise-guides.json', '/exercise-content.json', '/fonts/inter-variable.ttf', '/brand/movefield-mark.svg']) assert.equal((await page.request.get(base + asset)).status(), 200);
        const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(width.document <= width.viewport, JSON.stringify(width));
        fs.mkdirSync('.sites-runtime/evidence', { recursive: true });
        await page.screenshot({ path: '.sites-runtime/evidence/workout-overview-320.png', fullPage: true });
      } finally { await context.close(); }
    });
    await test('Today reviews future and overdue sessions without changing their dates or records',async()=>{
      const T=load('lib/training.ts');
      for(const offset of [2,-2]){
        const context=await browser.newContext(),state=structuredClone(fixture);state.active=null;state.plan.sessions[0].date=T.addDays(T.day(),offset);
        const page=await seeded(context,state,false);
        try{const before=await readState(page),hero=page.getByRole('region',{name:'Today’s training',exact:true});assert.equal(await hero.getByRole('button',{name:'Start workout',exact:true}).count(),0);await hero.getByRole('button',{name:offset>0?'Preview next workout':'Review overdue workout',exact:true}).click();await page.getByRole('dialog').waitFor();assert.deepEqual(await readState(page),before);await page.keyboard.press('Escape');await hero.getByRole('button',{name:'Calendar',exact:true}).click();await page.getByRole('heading',{name:'Calendar',exact:true}).waitFor();assert.deepEqual(await readState(page),before);}finally{await context.close()}
      }
    });
    await test('Today keeps a private concern on hold and offers plan review',async()=>{
      const context=await browser.newContext(),state=structuredClone(fixture);state.active=null;state.hold=true;
      const page=await seeded(context,state,false);
      try{const before=await readState(page),hero=page.getByRole('region',{name:'Today’s training',exact:true});await hero.getByText('CONCERN NEEDS REVIEW',{exact:true}).waitFor();assert.equal(await hero.getByRole('button',{name:'Start workout',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:/Reset.*hold/i}).count(),0);await hero.getByRole('button',{name:'Review your plan',exact:true}).click();await page.getByRole('heading',{name:'Plans',exact:true}).waitFor();assert.deepEqual(await readState(page),before);}finally{await context.close()}
    });
    assert.ok(passed > 0, 'No browser journeys ran');
    console.log(`${passed} real browser regression journeys passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
