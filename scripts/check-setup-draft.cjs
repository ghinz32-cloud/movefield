const assert = require('node:assert/strict');
const {load} = require('./domain-test-loader.cjs');
const {createBrowserSetupDraft, SetupDraftConflict} = load('lib/browser-setup-draft.ts');
const {BrowserVault} = load('lib/browser-vault.ts');
let passed = 0;
async function check(name, work) { await work(); passed++; console.log('PASS '+name); }
function fixture(vault) {
  const disk = new Map(); let tail = Promise.resolve(), fail = false;
  const storage = {getItem:k=>disk.get(k)??null, setItem:(k,v)=>{if(fail)throw Error('Quota exceeded');disk.set(k,v)},removeItem:k=>disk.delete(k)};
  const exclusive = fn => {const task=tail.catch(()=>{}).then(fn);tail=task;return task};
  const open = (key='personal-setup', overrides={})=>createBrowserSetupDraft({storage,key,exclusive,encode:raw=>vault.encrypt(raw,'setup'),decode:raw=>vault.decrypt(raw,'setup'),...overrides});
  return {disk,open,setFail:value=>fail=value};
}
(async()=>{
 const vault=await BrowserVault.open('Synthetic setup CAS regression passphrase');
 await check('Two encrypted setup windows cannot overwrite each other',async()=>{
  const f=fixture(vault),a=f.open();await a.write('first answers');const b=f.open();assert.equal(await b.read(),'first answers');
  await b.write('newer answers');const ciphertext=f.disk.get('personal-setup');
  await assert.rejects(a.write('stale answers'),SetupDraftConflict);assert.equal(f.disk.get('personal-setup'),ciphertext);
  assert.equal(await f.open().read(),'newer answers');
 });
 await check('Stale clear and stale plan-accept guard preserve the newer draft',async()=>{
  const f=fixture(vault),a=f.open();await a.write('first');const b=f.open();await b.write('newer');
  await assert.rejects(a.clear(),SetupDraftConflict);assert.throws(a.assertCurrent,SetupDraftConflict);assert.equal(await b.read(),'newer');
 });
 await check('A new setup captures its baseline even when resume is disabled',async()=>{
  const f=fixture(vault),a=f.open(),b=f.open();await b.write('other window');await assert.rejects(a.write('fresh answers'),SetupDraftConflict);
 });
 await check('Serial owner saves and clear advance the exact encrypted baseline',async()=>{
  const f=fixture(vault),a=f.open();await a.write('one');await a.write('two');assert.equal(await a.read(),'two');await a.clear();assert.equal(await a.read(),null);await a.write('three');assert.equal(await a.read(),'three');
 });
 await check('Encryption finishing late cannot replace a newly saved draft',async()=>{
  const f=fixture(vault);let release;const delayed=new Promise(r=>release=r);
  const a=f.open('personal-setup',{encode:async raw=>{await delayed;return vault.encrypt(raw,'setup')}}),b=f.open();
  const pending=a.write('late');await b.write('winner');release();await assert.rejects(pending,SetupDraftConflict);assert.equal(await b.read(),'winner');
 });
 await check('Storage failures keep the old baseline and allow a genuine retry',async()=>{
  const f=fixture(vault),a=f.open();await a.write('old');f.setFail(true);await assert.rejects(a.write('new'),/Quota/);assert.equal(await a.read(),'old');f.setFail(false);await a.write('new');assert.equal(await a.read(),'new');
 });
 await check('Clearing a draft in another window is also a conflicting change',async()=>{
  const f=fixture(vault),a=f.open();await a.write('old');const b=f.open();await b.clear();await assert.rejects(a.write('resurrected'),SetupDraftConflict);assert.equal(f.disk.has('personal-setup'),false);
 });
 await check('Sample and separate-brand keys do not change the personal draft',async()=>{
  const f=fixture(vault),personal=f.open(),sample=f.open('sample-setup'),grizzly=f.open('grizzly-setup');await personal.write('personal');const original=f.disk.get('personal-setup');await sample.write('sample');await grizzly.write('grizzly');await sample.clear();assert.equal(f.disk.get('personal-setup'),original);assert.equal(await personal.read(),'personal');
 });
 console.log(`${passed} setup draft concurrency groups passed`);
})().catch(error=>{console.error(error);process.exitCode=1});
