const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {createSourceLoader}=require('./lib/native-source-loader.cjs');
const {createSqliteHarness}=require('./lib/native-sqlite.cjs');
const repo=path.resolve(__dirname,'..'),loader=createSourceLoader(repo);
const shared=name=>loader.load(path.join(repo,'mobile/src/shared',name+'.ts'));
const T=shared('training'),S=shared('saved-data'),C=shared('storage-capacity'),B=shared('local-backup'),F=shared('transfer-bundle');
const H=loader.load(path.join(repo,'mobile/src/native-history.ts'));
const R=loader.load(path.join(repo,'mobile/src/native-record-store.ts'));
const N=loader.load(path.join(repo,'mobile/src/storage-capacity.ts'));
const base=JSON.parse(JSON.stringify(T.initialState()));
const state={...base,profile:{...base.profile,name:'Synthetic capacity marker'},history:Array.from({length:5000},(_,i)=>({
 id:'capacity-completed-'+i,sessionId:'past-session-'+i,title:'Recorded workout',
 date:new Date(Date.UTC(2000,0,1+i)).toISOString().slice(0,10),startedAt:i+1,finishedAt:i+2,
 sets:[1,2,3].map(set=>({exerciseId:'bench',set,reps:8,kg:80,done:true,rir:2})),
 details:{bench:{notes:'Controlled repetitions '.repeat(58)}}
}))};
let checks=0;const same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++},ok=(v,m)=>{assert.ok(v,m);checks++};
(async()=>{
 for(const text of ['', 'ASCII','é','漢字','🏋️','\ud800','\udfff','a\ud800b','🏋️é漢']){
  same(C.utf8TextBytes(text),Buffer.byteLength(text),'UTF-8 preflight matches actual encoding');
 }
 assert.throws(()=>C.assertStoredTextCapacity('x'.repeat(24_000_001)),e=>e.code==='storage-capacity');checks++;
 assert.throws(()=>C.assertStoredTextCapacity('漢'.repeat(8_000_001)),e=>e.code==='storage-capacity');checks++;
 C.assertHistoryHeadCapacity('x'.repeat(25_000_000));checks++;
 assert.throws(()=>C.assertHistoryHeadCapacity('x'.repeat(26_000_001)),e=>e.code==='storage-capacity');checks++;
 assert.throws(()=>C.assertHistoryHeadCapacity('漢'.repeat(8_666_667)),e=>e.code==='storage-capacity');checks++;
 const raw=JSON.stringify(state);
 ok(raw.length>5_000_000&&Buffer.byteLength(raw)<24_000_000,'5000 valid workouts cross previous parser ceiling within explicit budget');
 assert.throws(()=>S.readSavedState(raw),/too large/);checks++;
 same(C.readStoredSavedState(raw),state,'named saved-profile reader preserves all 5000 complete records');
 assert.throws(()=>C.readStoredSavedState(JSON.stringify({...state,history:[...state.history,{...state.history[0],id:'one-too-many'}]})));checks++;
 same(B.previewBackup(B.serializeBackup(state)).workouts,5000,'export and reviewed import retain large history');
 const split=H.splitNativeHistory(state);
 same(split.workouts.size,5000,'native split owns one entity for each valid workout');
 same(H.assembleNativeHistory(split.head,split.workouts),state,'native entity assembly no longer falls into 5M reader');
 const file=await F.createTransferFile(B.serializeBackup(state),'synthetic orchard river stone',{source:'phone',random:n=>new Uint8Array(crypto.randomBytes(n))});
 same(B.previewBackup(await F.openTransferFile(file,'synthetic orchard river stone')).workouts,5000,'real protected large transfer is compatible with new stored budget');
 ok(file.length<F.TRANSFER_MAX_FILE_BYTES,'generated protected file remains under import bound');
 const h=createSqliteHarness(),secureValues=new Map(),legacyValues=new Map();
 try{
  const records=R.createNativeRecordStore({open:async()=>h.db,legacy:{getItem:async k=>legacyValues.get(k)??null,removeItem:async k=>legacyValues.delete(k)}});
  const make=()=>createSourceLoader(repo,{
   './native-database':{nativeRecords:records},
   'expo-crypto':{getRandomBytes:n=>new Uint8Array(crypto.randomBytes(n))},
   'expo-secure-store':{AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:'device-only',getItemAsync:async k=>secureValues.get(k)??null,
    setItemAsync:async(k,v)=>secureValues.set(k,v),deleteItemAsync:async k=>secureValues.delete(k)}
  }).load(path.join(repo,'mobile/src/storage.ts'));
  let store=make();
  await store.saveLocalState(state);
  same((await records.listHistorySlots()).length,5000,'real SQLite commit installs every encrypted entity');
  store=make();
  same(await store.readLocalState(),state,'fresh storage-module read reopens full 5000-workout SQLite history');
  const before=await records.snapshotRecords(await records.listHistorySlots());
  const edited={...state,profile:{...state.profile,name:'New profile name'}};
  h.controller.calls.length=0;
  await store.saveLocalState(edited);
  const entityWrites=h.controller.calls.filter(x=>x.method==='runAsync'&&typeof x.args[0]==='string'&&x.args[0].startsWith(R.NATIVE_HISTORY_PREFIX));
  same(entityWrites.length,0,'cached non-history edit rewrites no completed workout entity');
  same((await records.snapshotRecords(await records.listHistorySlots())).records,before.records,'unchanged workout ciphertext remains exact');
  const fullBefore=await records.snapshotRecords(['training-studio:mobile-local-demo:v1',...await records.listHistorySlots()]);
  await assert.rejects(store.saveLocalState({...state,audit:[...state.audit,{at:'synthetic',message:'x'.repeat(24_000_001)}]}),e=>e.code==='storage-capacity');checks++;
  same((await records.snapshotRecords(['training-studio:mobile-local-demo:v1',...await records.listHistorySlots()])).revision,fullBefore.revision,'over-capacity rejection cannot change committed generation');
  same(N.nativeSaveFailure(new C.SavedStateCapacityError()).kind,'capacity','native feedback identifies bounded capacity failure');
 }finally{h.close()}
 const report={passed:true,checks,historyCount:5000,plainChars:raw.length,plainUTF8Bytes:Buffer.byteLength(raw),protectedFileChars:file.length,
  scope:'Actual validators, cryptography and SQLite host harness. Fresh module reads are not process/phone restarts; no physical throughput or capacity qualification.'};
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/history-capacity-check.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});

