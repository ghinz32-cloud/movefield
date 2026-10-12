const assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{load,workoutFixture}=require('./domain-test-loader.cjs');
const C=load('lib/record-state.ts'),SQL=load('lib/sql-records.ts'),V=load('lib/browser-vault.ts').BrowserVault;
function sqlite(file){const db=new DatabaseSync(file);const api={execAsync:async s=>db.exec(s),getFirstAsync:async(s,...p)=>db.prepare(s).get(...p)||null,getAllAsync:async(s,...p)=>db.prepare(s).all(...p),runAsync:async(s,...p)=>db.prepare(s).run(...p),withExclusiveTransactionAsync:async fn=>{db.exec('BEGIN IMMEDIATE');try{await fn(api);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}};return {api,db}}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'movefield-records-')),file=path.join(dir,'records.sqlite'),first=sqlite(file),backend=await SQL.sqlRecordBackend(first.api),vault=await V.open('Synthetic segmented archive passphrase');
 let legacy=null,failCache=false,sealed=0;const digest=async s=>require('node:crypto').createHash('sha256').update(s).digest('hex'),io={digest,seal:async s=>{sealed++;return vault.encrypt(s)},open:s=>vault.decrypt(s)};
 const state=JSON.parse(JSON.stringify({...workoutFixture(),active:null})),row={id:'synthetic-history',sessionId:'old-session',title:'Synthetic old workout',date:state.profile.start,startedAt:1,finishedAt:2,sets:[{exerciseId:'squat',set:1,reps:8,kg:0,done:true}]};state.history=Array.from({length:100},(_,n)=>({...row,id:'synthetic-history-'+n}));legacy=await vault.encrypt(JSON.stringify(state));
 const make=b=>C.createRecordStateStorage({...io,backend:b,legacyRead:async()=>legacy,legacyWrite:async s=>{if(failCache)throw Error('Synthetic projection quota failure');legacy=s}});
 let store=make(backend);const loaded=await store.read();assert.deepEqual(loaded,state);await store.write(loaded);assert.equal((await backend.list(vault.header.vaultId)).length,100);assert.ok(!legacy.includes(row.title));assert.equal(sealed,101);
 sealed=0;await store.write(JSON.parse(JSON.stringify({...loaded,profile:{...loaded.profile,name:'Synthetic renamed owner'}})));assert.equal(sealed,1,'Profile change must not re-encrypt the history');
 const edited={...loaded,history:loaded.history.map((w,n)=>n===12?{...w,revision:2,sets:[{...w.sets[0],reps:9}]}:w)};sealed=0;await store.write(edited);assert.equal(sealed,2,'One history correction must encrypt one record and one index');
 first.db.close();const second=sqlite(file),b2=await SQL.sqlRecordBackend(second.api);store=make(b2);assert.deepEqual(await store.read(),edited,'Fresh SQLite connection must restore the intended complete state');
 const originalRoot=await b2.root();failCache=true;await assert.rejects(store.write({...edited,profile:{...edited.profile,name:'Must not commit'}}),/quota/);assert.equal(await b2.root(),originalRoot);failCache=false;assert.deepEqual(await make(b2).read(),edited);
 const idx=JSON.parse(await vault.decrypt(originalRoot)),rows=await b2.rows(idx.history.map(r=>r.key));await second.api.runAsync('UPDATE encrypted_history SET raw=? WHERE k=?',rows[1].raw,rows[0].key);await assert.rejects(make(b2).read(),/missing or changed/);await second.api.runAsync('UPDATE encrypted_history SET raw=? WHERE k=?',rows[0].raw,rows[0].key);
 const bundle=await C.encryptedRecordBundle(b2,async()=>legacy);assert.deepEqual(await C.decodeRecordBundle(bundle,io),edited);assert.ok(!bundle.includes(row.title));
 await assert.rejects(b2.commit('stale-root','invalid',[]),/changed/);assert.equal(await b2.root(),originalRoot);await b2.clear();assert.equal(await b2.root(),null);assert.equal((await b2.list(vault.header.vaultId)).length,0);second.db.close();fs.rmSync(dir,{recursive:true,force:true});
 const samples=[];
 for(const count of [100,1000,5000]){
  const temp=path.join(os.tmpdir(),'movefield-sqlite-scale-'+require('node:crypto').randomUUID()+'.db'),conn=sqlite(temp),b=await SQL.sqlRecordBackend(conn.api);let cache=null;
  const large={...state,history:Array.from({length:count},(_,n)=>({...row,id:'scale-workout-'+n}))};
  const writer=()=>C.createRecordStateStorage({...io,backend:b,legacyRead:async()=>cache,legacyWrite:async raw=>{cache=raw}});
  let local=writer(),start=performance.now();await local.write(large);const createMs=performance.now()-start;local=writer();start=performance.now();const reopened=await local.read();const reopenMs=performance.now()-start;assert.deepEqual(reopened,large);
  sealed=0;start=performance.now();await local.write(JSON.parse(JSON.stringify({...reopened,profile:{...reopened.profile,name:'Scale profile edit'}})));const profileMs=performance.now()-start;assert.equal(sealed,1);
  const archive=await C.encryptedRecordBundle(b,async()=>cache);assert.equal((await C.decodeRecordBundle(archive,io)).history.length,count);samples.push({records:count,create_ms:createMs,reopen_ms:reopenMs,profile_edit_ms:profileMs,bundle_bytes:Buffer.byteLength(archive)});conn.db.close();fs.rmSync(temp);
 }
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/sqlite-records-receipt.json',JSON.stringify({ran_at:new Date().toISOString(),scope:'Actual Node SQLite file database with the shared SQL adapter and WebCrypto. No native OS/bridge or phone-performance claim.',samples},null,2)+'\n');
 console.log('PASS: real SQLite transactions/reopening, legacy copy, per-record write amplification, quota rollback, cross-record substitution rejection, complete encrypted backup and erasure');
})().catch(e=>{console.error(e);process.exitCode=1});
