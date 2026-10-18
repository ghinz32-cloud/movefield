// Real SQLite and browser IndexedDB; shared record writer and WebCrypto.
// Controlled projection/transaction faults do not mock record-store logic.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
const require=createRequire(import.meta.url),{load,workoutFixture}=require('./domain-test-loader.cjs'),{build}=createRequire(import.meta.resolve('wrangler'))('esbuild');
const dir=resolve('.sites-runtime/comprehensive-audit-2026-10-18/security');await mkdir(dir,{recursive:true});
const nodeOnly=process.argv.includes('--node-only');
if(process.argv.slice(2).some(arg=>arg!=='--node-only'))throw Error('Supported option: --node-only (SQLite only; full browser gate remains separate)');
const sourceHashes=Object.fromEntries(await Promise.all(['lib/record-state.ts','lib/sql-records.ts','lib/browser-records.ts'].map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const fixture=JSON.parse(JSON.stringify(workoutFixture()));fixture.active=null;fixture.history=[];
async function cases({a,b,fixture,io,vault,count,abortRollback}){
 const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v),eq=(x,y,m)=>{if(canonical(x)!==canonical(y))throw Error(m)},ok=(v,m)=>{if(!v)throw Error(m)},reject=async(fn,pattern)=>{try{await fn()}catch(e){if(!pattern.test(e.message))throw e;return}throw Error('Expected rejection')};
 let cache=null,projection='normal',competingRoot=null,beforeConflict=null;
 const writer=()=>a.createRecordStateStorage({...io,backend:b,legacyRead:async()=>cache,legacyWrite:async raw=>{
  if(projection==='normal'){cache=raw;return}
  if(projection==='competing'){competingRoot=await io.seal(await io.open(raw));await b.commit(raw,competingRoot,[]);beforeConflict=await b.snapshot()}
  throw Error('Synthetic projection quota failure');
 }});
 const row={id:'synthetic-rollback-history',sessionId:'past',title:'Saved task',date:fixture.profile.start,startedAt:1,finishedAt:2,sets:[{exerciseId:'squat',set:1,reps:8,kg:null,done:true,rir:2,metrics:{notes:'Preserve private notes'}}]},state={...fixture,history:Array.from({length:count},(_,n)=>({...row,id:row.id+'-'+n}))};
 const other={key:'e'.repeat(64),vaultId:'other-vault',raw:'unrelated ciphertext'};
 await b.commit(null,null,[other]);projection='quota';await reject(()=>writer().write({...state,history:[state.history[0]]}),/quota/);eq(await b.root(),null,'Failed initial save restores null root');eq(await b.rows([other.key]),[other],'Failed initial save retains preexisting other-vault record');eq(await b.list(vault.header.vaultId),[],'Failed initial save removes introduced rows');
 projection='normal';await writer().write(state);const original=await b.root(),originalSnapshot=await b.snapshot(),existing=originalSnapshot.rows[0];
 const reused=await b.commit(original,original,[existing]);eq(reused.introduced,[],'Preexisting identical key is not introduced');await b.commit(original,original,[],reused.introduced);eq(await b.rows([existing.key]),[existing],'Rollback retains preexisting identical ciphertext');
 const orphan={key:'d'.repeat(64),vaultId:vault.header.vaultId,raw:await io.seal('Unrelated original recovery material')};await b.commit(original,original,[orphan]);const exactPrior=await b.snapshot();
 projection='quota';for(let n=0;n<2;n++)await reject(()=>writer().write({...state,profile:{...state.profile,name:'Attempted replacement '+n}}),/quota/);
 eq(await b.root(),original,'Repeated projection failure restores root');eq(cache,original,'Repeated projection failure retains cache');eq(await b.snapshot(),exactPrior,'Only introduced rows removed, original orphan preserved');eq(await b.rows([other.key]),[other],'Other vault untouched');eq(await writer().read(),state,'Current exact state remains readable');
 const bundle=await a.encryptedRecordBundle(b,async()=>cache);eq(await a.decodeRecordBundle(bundle,io),state,'Recovery bundle restores exact complete state');ok(new TextEncoder().encode(bundle).length<=32*1024*1024,'Bundle remains within enforced limit');
 const replacement={...state,profile:{...state.profile,name:'Newer competing writer'},history:state.history.map((w,n)=>n? w:{...w,sets:[{...w.sets[0],reps:9}]})};
 projection='competing';await reject(()=>writer().write(replacement),/changed/);eq(await b.root(),competingRoot,'Newer root survives rollback conflict');eq(await b.snapshot(),beforeConflict,'Conflicting rollback deletes no rows including newly adopted rows');eq(await writer().read(),replacement,'Newer writer can read rows adopted before rollback');
 // Restore a coherent projection before the independent abort case.
 projection='normal';const current=writer();await current.read();await current.write(replacement);const rootBeforeAbort=await b.root(),rowsBeforeAbort=await b.snapshot();
 projection='quota';const disarm=abortRollback();try{await reject(()=>writer().write(state),/Synthetic rollback abort|aborted/)}finally{disarm()}
 const failedRoot=await b.root();ok(failedRoot!==rootBeforeAbort,'Aborted rollback cannot partially restore root');const remaining=await b.snapshot();ok(rowsBeforeAbort.rows.every(r=>remaining.rows.some(x=>x.key===r.key&&x.raw===r.raw)),'Aborted rollback cannot remove existing rows');eq(await writer().read(),state,'Failed transaction retains complete newly committed archive');eq(cache,rootBeforeAbort,'Aborted rollback leaves old cache visibly distinct');
 return {groups:8,recordCount:count,bundleBytes:new TextEncoder().encode(bundle).length,failedInitialSave:true,preexistingIdenticalKey:true,repeatedProjectionFailures:true,unrelatedOrphanAndVaultPreserved:true,completeRecoveryBundle:true,newerRootAdoptingRowsPreserved:true,atomicRollbackAbort:true,unknownLoadNotesAndRirPreserved:true};
}
const db=new DatabaseSync(':memory:');let failDelete=false;
const api={execAsync:async q=>db.exec(q),getFirstAsync:async(q,...p)=>db.prepare(q).get(...p)||null,getAllAsync:async(q,...p)=>db.prepare(q).all(...p),runAsync:async(q,...p)=>{const r=db.prepare(q).run(...p);if(failDelete&&q.startsWith('DELETE FROM encrypted_history')){failDelete=false;throw Error('Synthetic rollback abort')}return r},withExclusiveTransactionAsync:async fn=>{db.exec('BEGIN IMMEDIATE');try{await fn(api);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}};
const a=load('lib/record-state.ts'),b=await load('lib/sql-records.ts').sqlRecordBackend(api),vault=await load('lib/browser-vault.ts').BrowserVault.open('Synthetic rollback archive passphrase'),io={seal:raw=>vault.encrypt(raw),open:raw=>vault.decrypt(raw),digest:async raw=>createHash('sha256').update(raw).digest('hex')};
const sql=await cases({a,b,fixture,io,vault,count:5000,abortRollback:()=>{failDelete=true;return()=>{failDelete=false}}});db.close();
console.log('PASS SQLite: '+sql.groups+' rollback groups, 5000-record archive and repeated failed replacements');
if(nodeOnly){
 await writeFile(resolve(dir,'record-rollback-node-only.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'Explicit SQLite-only core mode; 8 real SQLite/WebCrypto groups including 5000-history capacity. Browser IndexedDB not executed in this mode; full default mode is a separate release gate.',sql,sourceHashes},null,2)+'\n');
}else{
await build({stdin:{contents:`import {BrowserVault} from './lib/browser-vault';import {browserRecordBackend,recordDigest} from './lib/browser-records';import * as records from './lib/record-state';window.audit={BrowserVault,browserRecordBackend,recordDigest,...records,fixture:${JSON.stringify(fixture)},cases:${cases.toString()}}`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(dir,'rollback-app.js'),logLevel:'warning'});
const server=createServer(async(req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html');res.end(req.url==='/app.js'?await readFile(resolve(dir,'rollback-app.js')):'<!doctype html><script type="module" src="/app.js"></script>')});await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}}),errors=[];let indexedDBResult;
try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.audit);
 indexedDBResult=await page.evaluate(async()=>{const a=window.audit,vault=await a.BrowserVault.open('Synthetic browser rollback passphrase'),io={seal:raw=>vault.encrypt(raw),open:raw=>vault.decrypt(raw),digest:a.recordDigest};return a.cases({a,b:a.browserRecordBackend,fixture:a.fixture,io,vault,count:8,abortRollback:()=>{const del=IDBObjectStore.prototype.delete;let hit=false;IDBObjectStore.prototype.delete=function(key){const r=del.call(this,key);if(this.name==='rows'&&!hit){hit=true;const tx=this.transaction;queueMicrotask(()=>tx.abort())}return r};return()=>{IDBObjectStore.prototype.delete=del;if(!hit)throw Error('Real IndexedDB rollback deletion was not reached')}}})});assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(done=>server.close(done))}
await writeFile(resolve(dir,'record-rollback-fixed.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual shared writer with WebCrypto, real SQLite including 5000-history capacity and real Chromium IndexedDB; cache and transaction faults injected. No native OS/secure-erase claim.',sql,indexedDB:indexedDBResult,errors,sourceHashes},null,2)+'\n');console.log('PASS IndexedDB: '+indexedDBResult.groups+' rollback groups; exact previous/current archives and other writers preserved');
}
