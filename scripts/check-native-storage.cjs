const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const mobileDir=path.resolve(__dirname,'..','mobile');
const values=new Map();let release,started,gate=null,revision=0,inBatch=false;
const HISTORY_PREFIX='training-studio:mobile-history:v2:';
const disk={
 hasRecord:async()=>true,
 getItem:async key=>values.get(key)??null,
 setItem:async(key,value)=>{if(gate){started();await gate;}values.set(key,value);if(!inBatch)revision++},
 removeItem:async key=>{values.delete(key);if(!inBatch)revision++},
 multiRemove:async keys=>{keys.forEach(k=>values.delete(k));if(!inBatch)revision++},
 snapshotRecords:async keys=>({records:Object.fromEntries(keys.map(k=>[k,values.get(k)??null])),present:Object.fromEntries(keys.map(k=>[k,values.has(k)])),revision}),
 listHistorySlots:async()=>[...values.keys()].filter(key=>key.startsWith(HISTORY_PREFIX)).sort(),
 // This older fixture has no separate legacy store. The real SQLite privacy
 // journal, retained copies and restart faults have their own focused suite.
 legacyCleanupStatus:async()=>({state:'clear',pending:0,preserved:0,unreadable:0}),
 retryLegacyCleanup:async()=>({state:'clear',pending:0,preserved:0,unreadable:0}),
 commitRecords:async input=>{
  const failure=()=>new (load('mobile/src/local-crypto.ts').LocalDataError)('unknown-format','Saved records changed in another app session. Nothing was replaced.');
  if(input.expectedRevision!==undefined&&input.expectedRevision!==revision||Object.entries(input.expected).some(([key,value])=>(values.get(key)??null)!==value))throw failure();
  const prior=new Map(values),previousRevision=revision,patch={...input.records};
  if(input.clearHistory)for(const key of values.keys())if(key.startsWith(HISTORY_PREFIX)&&!Object.prototype.hasOwnProperty.call(patch,key))patch[key]=null;
  // This memory fixture preserves historical failure/capture hooks. Actual
  // atomic persistence is tested separately through the real SQLite harness.
  // Install entities first and main last; a failure restores the complete map.
  inBatch=true;revision=previousRevision+1;
  try{
   for(const key of Object.keys(patch).sort((a,b)=>Number(a===STATE_KEY)-Number(b===STATE_KEY))){
    if(patch[key]===null)await disk.removeItem(key);else await disk.setItem(key,patch[key]);
   }
   return await disk.snapshotRecords(Object.keys(patch));
  }catch(error){values.clear();prior.forEach((value,key)=>values.set(key,value));revision=previousRevision;throw error}
  finally{inBatch=false}
 },
};
// In-memory stand-ins for the device secure store and secure random source; the real modules need native code.
const secure=new Map();
const secureStore={AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:'after-first-unlock-this-device',getItemAsync:async key=>secure.get(key)??null,setItemAsync:async(key,value)=>{secure.set(key,value)},deleteItemAsync:async key=>{secure.delete(key)}};
const expoCrypto={getRandomBytes:n=>new Uint8Array(require('node:crypto').randomBytes(n))};
const DATA_KEY='movefield.dataKey.v1',STATE_KEY='training-studio:mobile-local-demo:v1',SETUP_KEY='training-studio:mobile-setup:v1',RECOVERY_KEY='movefield.restoreKeys.v1',JOURNAL='training-studio:mobile-restore:v1';
const cache=new Map();
function moduleFor(s,file){
 if(s==='./native-database')return {nativeRecords:disk};
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

 // Newer saved fields must refuse opening and saving without rewriting ciphertext or secure keys.
 const compatibleCiphertext=values.get(STATE_KEY),recordCrypto=load('mobile/src/local-crypto.ts');
 for(const future of [{...secret,futureFeature:{retain:'unknown data'}},{...secret,schema:3}]){
  const incompatible=recordCrypto.sealText(JSON.stringify(future),recordCrypto.keyFromHex(secure.get(DATA_KEY)),STATE_KEY,expoCrypto.getRandomBytes);
  values.set(STATE_KEY,incompatible);
  const beforeRecords=[...values],beforeKeys=[...secure];
  await assert.rejects(storage.readLocalState(),/cannot preserve|version is not supported/);
  assert.deepEqual([...values],beforeRecords,'incompatible read retains every ciphertext');
  assert.deepEqual([...secure],beforeKeys,'incompatible read retains every secure key');
  await assert.rejects(storage.saveLocalState(secret),/cannot preserve|version is not supported/);
  assert.deepEqual([...values],beforeRecords,'older writer cannot overwrite incompatible saved state');
  assert.deepEqual([...secure],beforeKeys,'refused older save retains every secure key');
 }
 values.set(STATE_KEY,compatibleCiphertext);

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
 function capture(boundary,expected){snapshots.push({boundary,expected,disk:new Map(values),secure:new Map(secure),revision})}
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
  values.clear();snapshot.disk.forEach((v,k)=>values.set(k,v));secure.clear();snapshot.secure.forEach((v,k)=>secure.set(k,v));revision=snapshot.revision??0;inBatch=false;cache.clear();
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
 await fresh.readLocalState();
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
 assert.ok(readableRecord.length<=capacity.MAX_NATIVE_RECORD_BYTES,'saved envelope remains within the memory budget');
 fresh=reopen({disk:new Map(values),secure:new Map(secure)});
 assert.equal((await fresh.readLocalState()).history.length,312,'multi-year history survives fresh-module reopen');
 const unicodeHistory=historyState(312,'🏋️'.repeat(600));
 assert.doesNotThrow(()=>load('mobile/src/shared/saved-data.ts').readSavedState(JSON.stringify(unicodeHistory)));
 assert.ok(crypto.sealedTextBytes(JSON.stringify(unicodeHistory))>1_750_000,'fixture exceeds the former single-row capacity');
 await fresh.saveLocalState(unicodeHistory);
 fresh=reopen({disk:new Map(values),secure:new Map(secure)});
 assert.equal((await fresh.readLocalState()).history.length,312,'Unicode history above the old capacity reopens');
 await fresh.replaceLocalState(unicodeHistory);
 assert.equal((await fresh.readLocalState()).history[0].details[baseSession.items[0].exerciseId].notes,'🏋️'.repeat(600),'restore retains Unicode notes');
 const backup=load('mobile/src/shared/local-backup.ts').serializeBackup(unicodeHistory);
 assert.equal(load('mobile/src/shared/saved-data.ts').readSavedState(backup).history.length,312,'large persisted history also exports');
 const largeDraft={...draft,baseEvents:'x'.repeat(900_000)};
 await fresh.saveLocalSetup(largeDraft);
 assert.equal((await fresh.readLocalSetup()).baseEvents.length,900_000,'setup above the old row limit saves too');

 // A real storage failure may still happen below the memory/schema limits.
 const priorRecord=values.get(STATE_KEY),priorKey=secure.get(DATA_KEY);
 const failingState={...realistic,profile:{...realistic.profile,name:'Unsaved latest change'}};
 disk.setItem=async(k,v)=>{if(k===STATE_KEY)throw Error('SQLITE_FULL');return snapshotSet(k,v)};
 await assert.rejects(fresh.saveLocalState(failingState));
 assert.equal(values.get(STATE_KEY),priorRecord,'injected low-storage save keeps the last record');
 assert.equal(secure.get(DATA_KEY),priorKey,'failed save keeps its existing key');
 const fullDiskSnapshot={disk:new Map(values),secure:new Map(secure)};
 disk.setItem=snapshotSet;
 fresh=reopen(fullDiskSnapshot);
 assert.equal((await fresh.readLocalState()).profile.name,'Capacity fixture','fresh reopen after low storage still reads previous state');
 await fresh.saveLocalState(failingState);
 assert.equal((await fresh.readLocalState()).profile.name,'Unsaved latest change','retry saves the retained edits');
 assert.equal(capacity.nativeSaveFailure(Error('SQLITE_FULL')).kind,'save');
 assert.ok(capacity.nativeSaveFailure(Error('private driver details')).message.includes('Settings'));
 assert.equal(capacity.nativeSaveFailure(new crypto.LocalDataError('storage-capacity','capacity details')).kind,'capacity');

 values.set(STATE_KEY,JSON.stringify(unicodeHistory));
 fresh=reopen({disk:new Map(values),secure:new Map(secure)});
 assert.equal((await fresh.readLocalState()).history.length,312,'large plaintext legacy remains readable during encryption migration');
 assert.ok(crypto.isSealed(values.get(STATE_KEY)),'validated large legacy is encrypted without the former row cap');
 await fresh.resetLocalState();
 const invalid={...unicodeHistory,history:Array.from({length:5001},(_,i)=>({...unicodeHistory.history[0],id:'overflow-'+i}))};
 await assert.rejects(fresh.saveLocalState(invalid),'shared bounded schema still rejects unsupported histories');
 assert.equal(secure.has(DATA_KEY),false,'invalid first save never creates a needless data key');
 assert.equal(await fresh.readLocalRaw(),null,'invalid first save never installs ciphertext');

 const custom={id:'custom-load',name:'Custom timed loaded work',equipment:'Custom',pattern:'Custom',metric:'seconds',cues:[],custom:true,loadTracked:true};const w={id:'w',sessionId:'s',title:'Timed',date:T.day(),startedAt:1,sets:[{exerciseId:custom.id,set:1,reps:1200.5,kg:null,done:true}]};assert.equal(engine.unknownLoads(w,[custom]),1);assert.doesNotThrow(()=>engine.editSet({...s,custom:[custom],active:w},0,{}));
 console.log(`PASS native storage: eight fresh-module restore boundaries, key-loss/legacy privacy, 312-session capacity (${crypto.sealedTextBytes(realisticJson)} encrypted bytes), Unicode above legacy capacity/low-storage recovery and custom timed/load conventions. Physical-device capacity: NOT MEASURED.`);
})().catch(e=>{console.error(e);process.exit(1)});
