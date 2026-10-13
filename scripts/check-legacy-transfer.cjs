// Original-writer golden files, real KDF/cipher and real SQLite/AES storage.
// OS key/file APIs are mocked; this is not physical-phone acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const {load}=require('./domain-test-loader.cjs');
const fixture=JSON.parse(fs.readFileSync('scripts/fixtures/legacy-transfer-v1.json','utf8'));
const original=JSON.parse(fixture.plaintext),expected={...original,schema:3};
const reader=load('lib/legacy-transfer.ts'),nativeReader=load('mobile/src/shared/legacy-transfer.ts');
const {readPreservedState}=load('lib/preserved-state.ts');
// Reuse the existing actual native storage/SQLite harness without running its
// separate migration suite again. It has no production-side test injection.
const harness=fs.readFileSync('scripts/check-legacy-native-upgrade.cjs','utf8').split('(async()=>{')[0];
const context={exports:{}};
new Function('require','module','exports',harness+'\nmodule.exports={environment};')(createRequire(path.resolve('scripts/check-legacy-native-upgrade.cjs')),context,context.exports);
let checks=0;
async function rejected(raw,password,pattern){await assert.rejects(reader.openLegacyTransfer(raw,password),pattern);checks++}
(async()=>{
 for(const source of ['phone','web']){
  assert.equal(reader.isLegacyTransfer(fixture.transfers[source]),true);
  assert.deepEqual(await reader.openLegacyTransfer(fixture.transfers[source],fixture.password),expected);checks++;
 }
 assert.deepEqual(await nativeReader.openLegacyTransfer(fixture.transfers.phone,fixture.password.normalize('NFC')),expected);checks++;
 await rejected(fixture.transfers.phone,'Incorrect synthetic password',/incorrect or.*changed/);
 for(const field of ['source','createdAt','nonce','data']){
  const envelope=JSON.parse(fixture.transfers.phone);
  if(field==='source')envelope.source='web';
  else if(field==='createdAt')envelope.createdAt='2026-10-10T18:00:00.000Z';
  else envelope[field]=(envelope[field][0]==='0'?'1':'0')+envelope[field].slice(1);
  await rejected(JSON.stringify(envelope),fixture.password,/incorrect or.*changed/);
 }
 for(const mutate of [e=>e.version=2,e=>e.kdf.m=19457,e=>e.kdf.t=3,e=>e.kdf.p=2,e=>e.kdf.name='pbkdf2',e=>e.kdf.extra=true,e=>e.extra=true,e=>e.data='xx',e=>e.nonce='00',e=>e.source='unknown']){
  const envelope=JSON.parse(fixture.transfers.phone);mutate(envelope);await rejected(JSON.stringify(envelope),fixture.password,/unsupported|damaged/);
 }
 await rejected(fixture.transfers.phone,'x'.repeat(2049),/length/);
 await rejected(fixture.transfers.phone,'',/Enter the password/);
 assert.deepEqual(readPreservedState(fixture.plaintext),expected);checks++;
 for(const mutate of [s=>s.futureField=true,s=>s.active.sets[0].futureField=true,s=>s.history[0].futureField=true,s=>s.profile.futureField=true,s=>s.restTimer.futureField=true]){
  const state=structuredClone(original);mutate(state);assert.throws(()=>readPreservedState(JSON.stringify(state)),/cannot preserve/);checks++;
 }
 const environment=context.exports.environment,current={...original,active:null,restTimer:null};
 for(const scenario of ['success','stale','active','setup','outbox','failed-write']){
  const e=environment({state:scenario==='active'?original:current,setup:null});const storage=e.fresh();const before=await storage.readLocalState();const snapshot=await storage.encryptedLocalBackup();
  if(scenario==='setup')await storage.saveLocalSetup({schema:1,basePlanId:before.plan.id,baseEvents:JSON.stringify(before.events),profile:before.profile,events:before.events,step:2});
  if(scenario==='outbox')e.values.set('movefield:cloud-outbox:v1','synthetic-existing-upload');
  if(scenario==='failed-write')e.fail('root');
  if(scenario==='success'){
   assert.deepEqual(await storage.restorePasswordTransfer(expected,before),expected);assert.deepEqual(await e.fresh().readLocalState(),expected);e.preserve();
  }else{
   const captured=scenario==='stale'?{...before,profile:{...before.profile,name:'stale synthetic preview'}}:before;
   await assert.rejects(storage.restorePasswordTransfer(expected,captured),/changed|workout|setup|upload|Synthetic/);
   assert.equal(await storage.encryptedLocalBackup(),snapshot);e.preserve();
  }checks++;
 }
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/legacy-transfer-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),passed:true,checks,fixtureWriterCommit:fixture.sourceCommit,fixtureWriterBlob:fixture.writerBlob,scope:'Original writer golden phone/web backups, real Argon2id/XChaCha and native adapter/SQLite/AES-GCM with mocked OS stores. No installed-device or browser UI claim.'},null,2)+'\n');
 console.log('PASS '+checks+' older-transfer checks: original phone/web files, NFC password compatibility, authenticated header/ciphertext, fixed-cost parsing, future-field refusal, encrypted native import and unchanged originals on stale/active/setup/outbox/failed-write rejection.');
})().catch(error=>{console.error(error);process.exitCode=1});
