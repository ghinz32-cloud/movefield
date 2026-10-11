const assert=require('node:assert/strict');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const {BrowserVault}=load('lib/browser-vault.ts'),{readEnvelope}=load('lib/vault-format.ts'),{encryptedStorage}=load('lib/encrypted-storage.ts');
const {beginHistoryEdit,applyHistoryEdit}=load('lib/history-edit.ts');
(async()=>{
 const plain=JSON.stringify(workoutFixture()),passphrase='Synthetic vault passphrase only',vault=await BrowserVault.open(passphrase);
 const first=await vault.encrypt(plain),second=await vault.encrypt(plain);
 assert.notEqual(readEnvelope(first).iv,readEnvelope(second).iv);assert.equal(await vault.decrypt(first),plain);assert.ok(!first.includes('Synthetic test athlete'));
 await assert.rejects(BrowserVault.open('Incorrect synthetic passphrase',first));
 const flipped=JSON.parse(first);flipped.ciphertext=(flipped.ciphertext[0]==='0'?'1':'0')+flipped.ciphertext.slice(1);await assert.rejects(vault.decrypt(JSON.stringify(flipped)));
 const bound=await vault.encrypt(plain,'setup');await assert.rejects(vault.decrypt(bound));const other=await BrowserVault.open(passphrase);await assert.rejects(other.decrypt(first));
 for(const field of ['version','keyVersion','schema','algorithm','kdf','iterations','vaultId','iv','salt']){const bad=JSON.parse(first);bad[field]='unsupported';assert.throws(()=>readEnvelope(JSON.stringify(bad)))}
 const restored=await BrowserVault.open(passphrase,first);assert.equal(await restored.decrypt(first),plain);
 let disk=plain,fail=true;
 const store=encryptedStorage({read:async()=>disk,write:async raw=>{if(fail)throw Error('Synthetic quota');disk=raw},encrypt:raw=>vault.encrypt(raw),decrypt:raw=>vault.decrypt(raw),validate:raw=>load('lib/saved-data.ts').readSavedState(raw)});
 await assert.rejects(store.migrate());assert.equal(disk,plain);fail=false;await store.migrate();assert.equal(await store.read(),plain);assert.equal(JSON.parse(disk).format,'movefield-vault');
 const s=workoutFixture(),record={...s.active,id:'synthetic-history',sessionId:'historical-session',finishedAt:2,sets:s.active.sets.map(x=>({...x,done:true})),partial:false};s.history=[record];s.restTimer={id:'synthetic-timer',workoutId:s.active.id,setKey:s.active.sets[0].exerciseId+':1',endAt:Date.now()+60000,pausedSeconds:null,alerted:false};
 const edit=beginHistoryEdit(s,record.id);edit.draft.sets[0].reps=9;const next=applyHistoryEdit(s,edit);
 assert.strictEqual(next.active,s.active);assert.strictEqual(next.restTimer,s.restTimer);assert.equal(next.history[0].id,record.id);assert.equal(next.history[0].date,record.date);assert.equal(next.history[0].revision,2);assert.equal(next.history[0].sets[0].reps,9);assert.equal(s.history[0].sets[0].reps,8);
 assert.throws(()=>applyHistoryEdit(next,edit),/changed/);const forged=beginHistoryEdit(s,record.id);forged.draft.date='2020-01-01';assert.throws(()=>applyHistoryEdit(s,forged),/identity/);const invalid=beginHistoryEdit(s,record.id);invalid.draft.sets[0].reps=NaN;assert.throws(()=>applyHistoryEdit(s,invalid));
 const partial=beginHistoryEdit(s,record.id);partial.draft.sets[0].done=false;assert.equal(applyHistoryEdit(s,partial).history[0].partial,true);
 const repeat=workoutFixture();repeat.history=[{...record,sessionId:repeat.active.sessionId}];const repeatEdit=beginHistoryEdit(repeat,record.id);repeatEdit.draft.sets[0].done=false;const repeated=applyHistoryEdit(repeat,repeatEdit);assert.strictEqual(repeated.active,repeat.active);assert.equal(repeated.plan.sessions[0].status,repeat.plan.sessions[0].status,'an edit to an earlier repeat must not change the active prescription status');
 console.log('PASS encrypted round trips, unique nonces, authentication, record/owner binding, wrong passphrase, versions, restore, failed migration preservation, history isolation, revisions, stale/invalid edits and partial recalculation');
})().catch(e=>{console.error(e);process.exitCode=1});
