const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const mobileDir=path.resolve(__dirname,'..','mobile');
const values=new Map();let release,started,gate=null;
const disk={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{if(gate){started();await gate;}values.set(key,value)},removeItem:async key=>values.delete(key),multiRemove:async keys=>{keys.forEach(k=>values.delete(k))}};
// In-memory stand-ins for the device secure store and secure random source; the real modules need native code.
const secure=new Map();
const secureStore={AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:'after-first-unlock-this-device',getItemAsync:async key=>secure.get(key)??null,setItemAsync:async(key,value)=>{secure.set(key,value)},deleteItemAsync:async key=>{secure.delete(key)}};
const expoCrypto={getRandomBytes:n=>new Uint8Array(require('node:crypto').randomBytes(n))};
const DATA_KEY='movefield.dataKey.v1',STATE_KEY='training-studio:mobile-local-demo:v1',SETUP_KEY='training-studio:mobile-setup:v1',RECOVERY_KEY='movefield.restoreKeys.v1',JOURNAL='training-studio:mobile-restore:v1';
const cache=new Map();
function moduleFor(s,file){
 if(s==='@react-native-async-storage/async-storage')return disk;
 if(s==='expo-secure-store')return secureStore;
 if(s==='expo-crypto')return expoCrypto;
 if(s.startsWith('@noble/'))return require(require.resolve(s,{paths:[mobileDir]}));
 if(s.startsWith('.'))return s.endsWith('.json')?JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),s),'utf8')):load(path.resolve(path.dirname(file),s+'.ts'));
 return require(s);
}
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(s=>moduleFor(s,file),m,m.exports);return m.exports;}
const storage=load('mobile/src/storage.ts'),T=load('mobile/src/shared/training.ts'),engine=load('mobile/src/mobile-engine.ts');
(async()=>{const s=engine.emptyDemo(),draft={schema:1,basePlanId:null,baseEvents:'[]',profile:{...s.profile,name:'Draft one'},events:[],step:2};
 await storage.saveLocalSetup(draft);assert.equal((await storage.readLocalSetup()).profile.name,'Draft one');
 gate=new Promise(r=>release=r);const begin=new Promise(r=>started=r),save=storage.saveLocalSetup({...draft,profile:{...draft.profile,name:'Latest answers'}});await begin;let resolved=false;const read=storage.readLocalSetup().then(v=>{resolved=true;return v});await Promise.resolve();assert.equal(resolved,false,'read waits for latest write');release();await save;assert.equal((await read).profile.name,'Latest answers');gate=null;
 await storage.saveLocalState(s);await storage.resetLocalState();assert.equal(await storage.readLocalSetup(),null);assert.equal(await storage.readLocalState(),null);
 assert.equal(secure.has(DATA_KEY),false,'reset deletes the data key');

 // Encrypted at rest: no plaintext or key material in AsyncStorage, key only in secure storage.
 const secret={...s,profile:{...s.profile,name:'Private name marker'}};
 await storage.saveLocalState(secret);
 const sealed=values.get(STATE_KEY);
 assert.equal(JSON.parse(sealed).alg,'xchacha20poly1305');
 assert.ok(!sealed.includes('Private name marker'),'stored value holds no plaintext');
 assert.match(secure.get(DATA_KEY)||'',/^[0-9a-f]{64}$/,'data key lives in secure storage');
 assert.ok(![...values.values()].some(v=>v.includes(secure.get(DATA_KEY))),'AsyncStorage never holds the key');
 assert.equal((await storage.readLocalState()).profile.name,'Private name marker');

 // Plaintext from earlier builds is read, then sealed in place.
 values.set(STATE_KEY,JSON.stringify(secret));
 assert.equal((await storage.readLocalState()).profile.name,'Private name marker');
 assert.equal(JSON.parse(values.get(STATE_KEY)).alg,'xchacha20poly1305','legacy plaintext is sealed on first read');

 // Tampering fails loudly and leaves the stored record untouched.
 const good=values.get(STATE_KEY),bad=JSON.parse(good);bad.data=(bad.data[0]==='0'?'1':'0')+bad.data.slice(1);
 const tampered=JSON.stringify(bad);values.set(STATE_KEY,tampered);
 await assert.rejects(storage.readLocalState(),e=>e.code==='decrypt-failed');
 assert.equal(values.get(STATE_KEY),tampered,'a damaged record is not overwritten');
 values.set(STATE_KEY,good);

 // Key loss (for example, a restored copy on another phone): the record stays put and no new key is minted over it.
 const keyHex=secure.get(DATA_KEY);
 await storage.resetLocalState();
 values.set(STATE_KEY,good);
 await assert.rejects(storage.readLocalState(),e=>e.code==='key-missing');
 await assert.rejects(storage.saveLocalSetup(draft),e=>e.code==='key-missing','a new key is never minted over encrypted records');
 assert.equal(secure.has(DATA_KEY),false,'no replacement key was created');
 assert.equal(values.get(STATE_KEY),good,'unreadable record is left unchanged');
 secure.set(DATA_KEY,keyHex);
 assert.equal((await storage.readLocalState()).profile.name,'Private name marker','the original key still opens the record');
 await storage.resetLocalState();assert.equal(secure.has(DATA_KEY),false);

 // Restore under a new key. A failed record write puts the previous key back and keeps the previous record readable.
 // A failed cleanup of the setup draft happens after the restore is stored, so it must not undo the restore.
 const before={...s,profile:{...s.profile,name:'Before restore'}},restored={...s,profile:{...s.profile,name:'Restored name'}};
 await storage.saveLocalState(before);
 const beforeKey=secure.get(DATA_KEY),beforeRecord=values.get(STATE_KEY);
 const realSet=disk.setItem,realRemove=disk.removeItem;
 disk.setItem=async()=>{throw new Error('disk full')};
 try{await assert.rejects(storage.replaceLocalState(restored),e=>e.code==='key-unavailable','a failed record write is reported')}finally{disk.setItem=realSet}
 assert.equal(secure.get(DATA_KEY),beforeKey,'a failed restore puts the previous key back');
 assert.equal(values.get(STATE_KEY),beforeRecord,'a failed restore leaves the previous record in place');
 assert.equal((await storage.readLocalState()).profile.name,'Before restore','the previous data still opens after a failed restore');
 disk.removeItem=async key=>{if(key===SETUP_KEY)throw new Error('cleanup failed');return realRemove(key)};
 try{await storage.replaceLocalState(restored)}finally{disk.removeItem=realRemove}
 assert.equal((await storage.readLocalState()).profile.name,'Restored name','a restore stands when removing the setup draft fails');
 assert.notEqual(secure.get(DATA_KEY),beforeKey,'a successful restore uses a new key');

 // Fresh modules open snapshots of persistent stores at each restore boundary.
 // These retain no cached JS key or promise chain from the process that was interrupted.
 await storage.resetLocalState();
 const snapshotBefore={...s,profile:{...s.profile,name:'Before snapshot'}},snapshotAfter={...s,profile:{...s.profile,name:'After snapshot'}};
 await storage.saveLocalState(snapshotBefore);await storage.saveLocalSetup(draft);
 values.set('unrelated-preference','preserve me');
 const snapshots=[];
 function capture(boundary,expected){snapshots.push({boundary,expected,disk:new Map(values),secure:new Map(secure)})}
 capture('before prepare','Before snapshot');
 const snapshotSet=disk.setItem,snapshotRemove=disk.removeItem,keySet=secureStore.setItemAsync,keyDelete=secureStore.deleteItemAsync;
 disk.setItem=async(k,v)=>{await snapshotSet(k,v);if(k===JOURNAL)capture('after encrypted journal','Before snapshot');if(k===STATE_KEY)capture('after restored ciphertext','After snapshot')};
 disk.removeItem=async k=>{await snapshotRemove(k);if(k===SETUP_KEY)capture('after obsolete draft cleanup','After snapshot');if(k===JOURNAL)capture('after journal retirement','After snapshot')};
 secureStore.setItemAsync=async(k,v)=>{await keySet(k,v);if(k===RECOVERY_KEY)capture('after secure key ring','Before snapshot');if(k===DATA_KEY)capture('after key activation','After snapshot')};
 secureStore.deleteItemAsync=async k=>{await keyDelete(k);if(k===RECOVERY_KEY)capture('after secure ring retirement','After snapshot')};
 await storage.replaceLocalState(snapshotAfter);
 disk.setItem=snapshotSet;disk.removeItem=snapshotRemove;secureStore.setItemAsync=keySet;secureStore.deleteItemAsync=keyDelete;
 assert.equal(snapshots.length,8,'eight persistent boundaries are captured');
 function reopen(snapshot){
  values.clear();snapshot.disk.forEach((v,k)=>values.set(k,v));secure.clear();snapshot.secure.forEach((v,k)=>secure.set(k,v));cache.clear();
  return load('mobile/src/storage.ts');
 }
 for(const snapshot of snapshots){
  const fresh=reopen(snapshot);
  assert.equal((await fresh.readLocalState()).profile.name,snapshot.expected,`${snapshot.boundary}: previous or restored record opens`);
  const setup=await fresh.readLocalSetup();
  assert.equal(setup?.profile.name??null,snapshot.expected==='Before snapshot'?'Draft one':null,`${snapshot.boundary}: matching setup lifecycle`);
  assert.equal(values.has(JOURNAL),false,`${snapshot.boundary}: ciphertext journal recovered`);
  assert.equal(secure.has(RECOVERY_KEY),false,`${snapshot.boundary}: old keys retired after recovery`);
  assert.equal(values.get('unrelated-preference'),'preserve me',`${snapshot.boundary}: recovery stays scoped`);
  for(const key of snapshot.secure.values()){
   if(/^[0-9a-f]{64}$/.test(key))assert.ok(![...values.values()].some(v=>v.includes(key)),`${snapshot.boundary}: no key in AsyncStorage`);
  }
  const ringRaw=snapshot.secure.get(RECOVERY_KEY);
  if(ringRaw){
   assert.ok(ringRaw.length<2048,'secure key ring is a small secret, not history');
   const ring=JSON.parse(ringRaw);for(const key of [ring.previous,ring.next].filter(Boolean))assert.ok(![...snapshot.disk.values()].some(v=>v.includes(key)),'both recovery keys stay out of AsyncStorage');
  }
  await fresh.saveLocalState({...snapshotAfter,profile:{...snapshotAfter.profile,name:'Saved after restart'}});
  const afterRestart={disk:new Map(values),secure:new Map(secure)};
  assert.equal((await reopen(afterRestart).readLocalState()).profile.name,'Saved after restart',`${snapshot.boundary}: next save opens in another fresh module`);
 }

 // A failed final key activation must retain both keys so a fresh process can finish.
 let fresh=reopen(snapshots[0]);
 secureStore.setItemAsync=async(k,v)=>{if(k===DATA_KEY)throw Error('secure store temporarily unavailable');return keySet(k,v)};
 await assert.rejects(fresh.replaceLocalState(snapshotAfter),e=>e.code==='key-unavailable');
 assert.ok(secure.has(RECOVERY_KEY)&&values.has(JOURNAL),'failed finalization retains the recovery pair');
 const failedFinalization={disk:new Map(values),secure:new Map(secure)};
 secureStore.setItemAsync=keySet;
 fresh=reopen(failedFinalization);
 assert.equal((await fresh.readLocalState()).profile.name,'After snapshot','fresh module completes failed key activation');

 // Cleanup failure permits reading the restored record, hides old setup and pauses edits.
 await fresh.saveLocalSetup(draft);
 disk.removeItem=async k=>{if(k===SETUP_KEY)throw Error('remove denied');return snapshotRemove(k)};
 await fresh.replaceLocalState(snapshotAfter);
 const pendingCleanup={disk:new Map(values),secure:new Map(secure)};
 fresh=reopen(pendingCleanup);
 assert.equal((await fresh.readLocalState()).profile.name,'After snapshot');
 assert.equal(await fresh.readLocalSetup(),null,'obsolete setup is ignored while cleanup is blocked');
 await assert.rejects(fresh.saveLocalState(snapshotBefore),e=>e.code==='key-unavailable','edits pause until recovery cleanup completes');
 disk.removeItem=snapshotRemove;
 await fresh.saveLocalState(snapshotBefore);
 assert.equal((await fresh.readLocalState()).profile.name,'Before snapshot','cleanup retry allows editing');

 // Unexpected concurrent records are preserved, not treated as a matching restore.
 const installed=snapshots.find(x=>x.boundary==='after restored ciphertext');
 const collision={disk:new Map(installed.disk),secure:new Map(installed.secure)};collision.disk.set(STATE_KEY,JSON.stringify(snapshotBefore));
 fresh=reopen(collision);
 await assert.rejects(fresh.readLocalState(),e=>e.code==='unknown-format');
 assert.equal(values.get(STATE_KEY),JSON.stringify(snapshotBefore),'unexpected state remains untouched');
 await fresh.resetLocalState();assert.equal(secure.has(RECOVERY_KEY),false);assert.equal(values.has(JOURNAL),false);
 assert.equal(values.get('unrelated-preference'),'preserve me','reset does not erase unrelated preferences');

 // Legacy plaintext is represented by fingerprints, never copied into the journal.
 values.set(STATE_KEY,JSON.stringify(secret));values.set(SETUP_KEY,JSON.stringify(draft));
 disk.setItem=async(k,v)=>{if(k===JOURNAL){assert.ok(!v.includes('Private name marker')&&!v.includes('Draft one'),'journal stores no legacy plaintext')}return snapshotSet(k,v)};
 await fresh.replaceLocalState(snapshotAfter);disk.setItem=snapshotSet;
 assert.equal((await fresh.readLocalState()).profile.name,'After snapshot');

 // Realistic synthetic histories, UTF-8 envelope size, and failures at the native row boundary.
 // This is an injected AsyncStorage harness, not a physical Android quota benchmark.
 const crypto=load('mobile/src/local-crypto.ts'),capacity=load('mobile/src/storage-capacity.ts');
 for(const text of ['', 'Plain text', 'é', '漢字', '🏋️']){
  const encoded=crypto.sealText(text,crypto.keyFromHex('ab'.repeat(32)),STATE_KEY,expoCrypto.getRandomBytes);
  assert.equal(capacity.MAX_NATIVE_RECORD_BYTES>encoded.length,true);
  assert.equal(crypto.sealedTextBytes(text),Buffer.byteLength(encoded),'preflight matches actual encrypted UTF-8 bytes');
 }
 const boundaryText='x'.repeat(Math.floor((capacity.MAX_NATIVE_RECORD_BYTES-crypto.sealedTextBytes(''))/2));
 assert.doesNotThrow(()=>capacity.assertNativeRecordCapacity(boundaryText),'last complete ASCII payload within the envelope limit is accepted');
 assert.throws(()=>capacity.assertNativeRecordCapacity(boundaryText+'x'),e=>e.code==='storage-capacity','one extra encoded character crosses the boundary');
 const baseSession=engine.previewPlan('foundation','2026-01-05').plan.sessions[0];
 function historyState(count,note='Synthetic workout notes'){
  return {...s,profile:{...s.profile,name:'Capacity fixture'},history:Array.from({length:count},(_,index)=>({
   id:'capacity-workout-'+index,sessionId:'capacity-session-'+index,title:baseSession.title,
   date:new Date(Date.UTC(2020,0,1+index*2)).toISOString().slice(0,10),startedAt:index+1,finishedAt:index+2,
   targets:baseSession.items,effort:'right',symptom:'no',
   details:{[baseSession.items[0].exerciseId]:{notes:note}},
   sets:baseSession.items.flatMap(item=>Array.from({length:item.sets},(_,set)=>({
    exerciseId:item.exerciseId,set:set+1,reps:item.reps,kg:T.isLoadTracked(T.exFor(item.exerciseId))?40:null,done:true,rir:2,
   }))),
  }))};
 }
 await fresh.resetLocalState();
 const realistic=historyState(312),realisticJson=JSON.stringify(realistic);
 assert.doesNotThrow(()=>capacity.assertNativeRecordCapacity(realisticJson),'312 sessions (two years at three sessions/week) fit this synthetic fixture');
 await fresh.saveLocalState(realistic);
 const readableRecord=values.get(STATE_KEY),readableKey=secure.get(DATA_KEY);
 assert.ok(readableRecord.length<=capacity.MAX_NATIVE_RECORD_BYTES,'saved row remains within the interim read budget');
 fresh=reopen({disk:new Map(values),secure:new Map(secure)});
 assert.equal((await fresh.readLocalState()).history.length,312,'multi-year history survives fresh-module reopen');
 const oversized=historyState(312,'🏋️'.repeat(600));
 assert.doesNotThrow(()=>load('mobile/src/shared/saved-data.ts').readSavedState(JSON.stringify(oversized)),'large Unicode history is valid app data, not a corrupt file');
 assert.ok(JSON.stringify(oversized).length<5_000_000,'fits the shared import schema while exceeding the encrypted native budget');
 assert.ok(crypto.sealedTextBytes(JSON.stringify(oversized))>capacity.MAX_NATIVE_RECORD_BYTES,'UTF-8 ciphertext, not JS string length, controls capacity');
 await assert.rejects(fresh.saveLocalState(oversized),e=>e.code==='storage-capacity'&&e.message.includes('Settings'));
 await assert.rejects(fresh.replaceLocalState(oversized),e=>e.code==='storage-capacity','oversized restore is rejected before any key/journal changes');
 assert.equal(values.get(STATE_KEY),readableRecord,'capacity rejection preserves previous ciphertext byte for byte');
 assert.equal(secure.get(DATA_KEY),readableKey,'capacity rejection preserves the previous key');
 assert.equal(values.has(JOURNAL)||secure.has(RECOVERY_KEY),false,'capacity preflight never starts a restore journal');
 assert.equal((await fresh.readLocalState()).history.length,312,'previous saved history still opens after oversized save/restore');
 const backup=load('mobile/src/shared/local-backup.ts').serializeBackup(oversized);
 assert.equal(load('mobile/src/shared/saved-data.ts').readSavedState(backup).history.length,312,'unsaved valid large history can still be exported without native persistence');
 const largeDraft={...draft,baseEvents:'x'.repeat(900_000)};
 await assert.rejects(fresh.saveLocalSetup(largeDraft),e=>e.code==='storage-capacity','setup preflight also prevents an unreadable encrypted row');

 // A real storage failure may happen even below the guard. It is never a successful save.
 const failingState={...realistic,profile:{...realistic.profile,name:'Unsaved latest change'}};
 disk.setItem=async(k,v)=>{if(k===STATE_KEY)throw Error('SQLITE_FULL');return snapshotSet(k,v)};
 await assert.rejects(fresh.saveLocalState(failingState));
 assert.equal(values.get(STATE_KEY),readableRecord,'injected low-storage save keeps the last record');
 const fullDiskSnapshot={disk:new Map(values),secure:new Map(secure)};
 disk.setItem=snapshotSet;
 fresh=reopen(fullDiskSnapshot);
 assert.equal((await fresh.readLocalState()).profile.name,'Capacity fixture','fresh reopen after low storage still reads previous state');
 await fresh.saveLocalState(failingState);
 assert.equal((await fresh.readLocalState()).profile.name,'Unsaved latest change','retry after space becomes available saves the retained edits');
 assert.equal(capacity.nativeSaveFailure(Error('SQLITE_FULL')).kind,'save');
 assert.ok(capacity.nativeSaveFailure(Error('private driver details')).message.includes('Settings'),'generic failure has an export action without exposing driver details');
 assert.equal(capacity.nativeSaveFailure(new crypto.LocalDataError('storage-capacity','capacity details')).kind,'capacity');

 // Do not turn a readable large legacy record into oversized encrypted ciphertext on startup.
 values.set(STATE_KEY,JSON.stringify(oversized));
 fresh=reopen({disk:new Map(values),secure:new Map(secure)});
 assert.equal((await fresh.readLocalState()).history.length,312,'oversized legacy data remains readable for export');
 assert.equal(values.get(STATE_KEY),JSON.stringify(oversized),'failed legacy migration leaves the original byte for byte');
 await fresh.resetLocalState();
 await assert.rejects(fresh.saveLocalState(oversized),e=>e.code==='storage-capacity');
 assert.equal(secure.has(DATA_KEY),false,'rejected first save does not mint a needless data key');
 assert.equal(await fresh.readLocalRaw(),null,'rejected first save does not install ciphertext');

 const custom={id:'custom-load',name:'Custom timed loaded work',equipment:'Custom',pattern:'Custom',metric:'seconds',cues:[],custom:true,loadTracked:true};const w={id:'w',sessionId:'s',title:'Timed',date:T.day(),startedAt:1,sets:[{exerciseId:custom.id,set:1,reps:1200.5,kg:null,done:true}]};assert.equal(engine.unknownLoads(w,[custom]),1);assert.doesNotThrow(()=>engine.editSet({...s,custom:[custom],active:w},0,{}));
 console.log(`PASS native storage: eight fresh-module restore boundaries, key-loss/legacy privacy, 312-session capacity (${crypto.sealedTextBytes(realisticJson)} encrypted bytes), Unicode/oversized/low-storage recovery and custom timed/load conventions. Physical-device capacity: NOT MEASURED.`);
})().catch(e=>{console.error(e);process.exit(1)});
