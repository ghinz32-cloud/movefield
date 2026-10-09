const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {webcrypto}=require('node:crypto');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const modules=new Map();
function load(name){if(modules.has(name))return modules.get(name).exports;const moduleValue={exports:{}};modules.set(name,moduleValue);const source=ts.transpileModule(fs.readFileSync(path.join('lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',source)(dependency=>dependency.startsWith('./')?load(dependency.slice(2)):require(dependency),moduleValue,moduleValue.exports);return moduleValue.exports;}
const moduleValue={exports:load('browser-record-store')};
const {createBrowserRecordStore,BrowserRecordStoreError}=moduleValue.exports;
const S='training-studio-v2',D='training-studio-setup-v1',slots=[S,D];
const SECRET='private workout marker 1AEF';
let checks=0;
const same=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++};
const ok=(value,message)=>{assert.ok(value,message);checks++};
async function rejects(promise,code,message){await assert.rejects(promise,error=>error instanceof BrowserRecordStoreError&&error.code===code,message);checks++}
const digest=async raw=>Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))).toString('hex');
const generate=()=>webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
async function seal(key,slot,text){const iv=webcrypto.getRandomValues(new Uint8Array(12));const data=await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('movefield-vault:1:'+slot)},key,new TextEncoder().encode(text));return JSON.stringify({v:1,alg:'aes-256-gcm',iv:Buffer.from(iv).toString('base64'),data:Buffer.from(data).toString('base64')})}
async function plain(key,slot,raw){const value=JSON.parse(raw);return new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(value.iv,'base64'),additionalData:new TextEncoder().encode('movefield-vault:1:'+slot)},key,Buffer.from(value.data,'base64')))}
function legacyStorage(values={}){const map=new Map(Object.entries(values));return{map,getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)}}
function fixture(values={}){const idb=new IDBFactory(),legacy=legacyStorage(values);const make=()=>createBrowserRecordStore({idb,legacy,slots,digest});return{idb,legacy,make,store:make()}}
function open(idb,version){return new Promise((resolve,reject)=>{const request=idb.open('movefield-vault',version);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('keys'))request.result.createObjectStore('keys')};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function mutate(idb,stores,callback){const db=await open(idb,2);try{await new Promise((resolve,reject)=>{const tx=db.transaction(stores,'readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);callback(tx)})}finally{db.close()}}
async function dump(idb,storeName,key){const db=await open(idb,2);try{return await new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),request=tx.objectStore(storeName).get(key);tx.oncomplete=()=>resolve(request.result);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
async function emptyReady(f){return f.store.importLegacy({expected:await f.store.snapshot(),legacy:{[S]:null,[D]:null},records:{[S]:null,[D]:null}})}

(async()=>{
 // Upgrade the actual old database without losing either recoverable key.
 const old=fixture({[S]:'old ciphertext input'}),oldKey=await generate(),nextKey=await generate();
 const db=await open(old.idb,1),journal={slot:S,beforeHash:'before',after:await seal(nextKey,S,'restored'),previous:oldKey,next:nextKey,obsolete:{[D]:null}};
 await new Promise((resolve,reject)=>{const tx=db.transaction('keys','readwrite');tx.objectStore('keys').put(oldKey,'data-key-v1');tx.objectStore('keys').put(journal,'restore-transition-v1');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close();
 const upgraded=await old.store.snapshot();
 same(upgraded.key.extractable,false,'v1 non-extractable key survives v2 upgrade');
 same(await plain(upgraded.key,S,await seal(oldKey,S,SECRET)),SECRET,'upgraded key retains the original key material');
 same(upgraded.transition.after,journal.after,'existing restore journal is preserved');
 same(await plain(upgraded.transition.next,S,journal.after),'restored','journal next key retains its material');
 await rejects(old.store.importLegacy({expected:upgraded,legacy:{[S]:'old ciphertext input',[D]:null},records:{[S]:await seal(oldKey,S,'old ciphertext input'),[D]:null}}),'legacy-pending','pending legacy restore must recover before import');
 same((await old.make().snapshot()).transition.after,journal.after,'refused import does not delete the journal');

 // Malformed legacy ciphertext is copied byte for byte during import so one
 // unreadable setup does not prevent a readable main profile from migrating.
 // The opaque exception never applies to new writes or transformed legacy data.
 const damaged='{"v":1,"alg":"aes-256-gcm","iv":';
 const damagedFixture=fixture({[D]:damaged}),damagedKey=await generate(),readableMain=await seal(damagedKey,S,SECRET);
 damagedFixture.legacy.setItem(S,readableMain);
 const damagedDb=await open(damagedFixture.idb,1);
 await new Promise((resolve,reject)=>{const tx=damagedDb.transaction('keys','readwrite');tx.objectStore('keys').put(damagedKey,'data-key-v1');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});damagedDb.close();
 const damagedImport=await damagedFixture.store.importLegacy({expected:await damagedFixture.store.snapshot(),legacy:{[S]:readableMain,[D]:damaged},records:{[S]:readableMain,[D]:damaged}});
 same(damagedImport.records[D],damaged,'damaged encrypted setup is retained exactly during migration');
 same(await plain(damagedImport.key,S,damagedImport.records[S]),SECRET,'damaged setup does not prevent main profile readback');
 same((await damagedFixture.make().snapshot()).records[D],damaged,'damaged setup ciphertext reopens as the same opaque bytes');
 await rejects(damagedFixture.store.write(damagedImport,D,damaged),'unknown-format','malformed new writes remain forbidden');
 await rejects(damagedFixture.store.replace(damagedImport,D,damaged,await generate()),'unknown-format','malformed replacement writes remain forbidden');
 const alteredDamaged=fixture({[D]:damaged});
 await rejects(alteredDamaged.store.importLegacy({expected:await alteredDamaged.store.snapshot(),legacy:{[S]:null,[D]:damaged},records:{[S]:null,[D]:damaged+'"changed"'}}),'unknown-format','opaque import refuses altered damaged ciphertext');
 const missingDamaged=fixture({[D]:damaged});
 const missingDamagedImport=await missingDamaged.store.importLegacy({expected:await missingDamaged.store.snapshot(),legacy:{[S]:null,[D]:damaged},records:{[S]:null,[D]:damaged}});
 same(missingDamagedImport.key,undefined,'damaged encrypted key-lost import never generates a key');
 same(missingDamagedImport.records[D],damaged,'key-lost damaged ciphertext remains exportable');
 const remintedDamaged=fixture({[D]:damaged});
 await rejects(remintedDamaged.store.importLegacy({expected:await remintedDamaged.store.snapshot(),legacy:{[S]:null,[D]:damaged},records:{[S]:null,[D]:damaged},key:await generate()}),'unknown-format','damaged sealed prefix prevents inventing a replacement legacy key');

 // Import prepares encryption first, commits key+every ciphertext atomically,
 // verifies with a second transaction, then removes only unchanged originals.
 const f=fixture({[S]:SECRET,[D]:'setup answers','unrelated-preference':'ocean'}),key=await generate();
 const originals={[S]:SECRET,[D]:'setup answers'},ciphertext={[S]:await seal(key,S,SECRET),[D]:await seal(key,D,'setup answers')};
 const initial=await f.store.snapshot();
 const imported=await f.store.importLegacy({expected:initial,legacy:originals,records:ciphertext,key});
 same(imported.migrated,true,'verified import installs the durable migration marker');
 same(f.legacy.getItem(S),SECRET,'legacy original is retained until explicit verified cleanup');
 same(await plain(imported.key,S,imported.records[S]),SECRET,'fresh transaction decrypts imported ciphertext');
 same(imported.key.extractable,false,'imported key remains non-extractable');
 await assert.rejects(webcrypto.subtle.exportKey('raw',imported.key));checks++;
 ok(!JSON.stringify(await dump(f.idb,'metadata','record-state-v2')).includes(SECRET),'migration metadata contains hashes, never legacy plaintext');
 ok(!JSON.stringify(await dump(f.idb,'records',S)).includes(SECRET),'actual IndexedDB record contains ciphertext only');
 const repeated=await f.make().importLegacy({expected:await f.make().snapshot(),legacy:originals,records:ciphertext,key});
 same(repeated.revision,imported.revision,'reopening/repeating a completed import does not rewrite it');
 f.legacy.setItem(D,'another tab changed setup');
 const cleanup=await f.store.cleanupLegacy(repeated);
 same(cleanup.removed,[S],'verified cleanup removes the unchanged imported original');
 same(cleanup.retained,[D],'verified cleanup retains a changed original');
 same(f.legacy.getItem('unrelated-preference'),'ocean','cleanup leaves unrelated preferences intact');
 same(await plain((await f.make().snapshot()).key,D,(await f.make().snapshot()).records[D]),'setup answers','changed legacy input never replaces committed ciphertext');

 // Actual transaction abort after request success cannot acknowledge a save.
 const before=await f.store.snapshot(),changed=await seal(before.key,S,'uncommitted');
 const realPut=IDBObjectStore.prototype.put;
 let requestSucceeded=false;
 IDBObjectStore.prototype.put=function(value,...args){const request=realPut.call(this,value,...args);if(this.name==='records'&&args[0]===S&&value.ciphertext===changed)request.addEventListener('success',()=>{requestSucceeded=true;this.transaction.abort()});return request};
 try{await rejects(f.store.write(before,S,changed),'unavailable','request-success followed by abort rejects the save')}finally{IDBObjectStore.prototype.put=realPut}
 ok(requestSucceeded,'failure occurred after the ciphertext put request succeeded');
 same((await f.make().snapshot()).records[S],before.records[S],'fresh store sees rollback after a successful put request');
 same((await f.make().snapshot()).revision,before.revision,'aborted transaction does not advance revision');

 // Inject quota at key persistence after a ciphertext put. The transaction rolls
 // back every earlier put, retaining both the old key and readable old record.
 const rotated=await generate(),restored=await seal(rotated,S,'quota restore');
 IDBObjectStore.prototype.put=function(value,...args){if(this.name==='keys'&&args[0]==='data-key-v1')throw new DOMException('Injected storage full','QuotaExceededError');return realPut.call(this,value,...args)};
 try{await rejects(f.store.replace(before,S,restored,rotated),'unavailable','quota while saving key rejects the complete restore')}finally{IDBObjectStore.prototype.put=realPut}
 const afterQuota=await f.make().snapshot();
 same(afterQuota.records,before.records,'failed atomic restore retains every old record');
 same(await plain(afterQuota.key,S,afterQuota.records[S]),SECRET,'failed atomic restore retains the old decryption key');
 same(afterQuota.keyRevision,before.keyRevision,'failed atomic restore does not change key revision');

 // Commit acknowledgment is emitted only after the actual complete event.
 let complete=false;
 IDBObjectStore.prototype.put=function(value,...args){if(this.name==='records')this.transaction.addEventListener('complete',()=>{complete=true});return realPut.call(this,value,...args)};
 let written;
 try{written=await f.store.write(afterQuota,S,await seal(afterQuota.key,S,'accepted'));ok(complete,'save promise resolves only after transaction complete')}finally{IDBObjectStore.prototype.put=realPut}
 same(await plain((await f.make().snapshot()).key,S,(await f.make().snapshot()).records[S]),'accepted','acknowledged ciphertext reopens independently');

 // Two tabs may read the same revision, but only one expected-state write wins.
 const tabOne=await f.store.snapshot(),tabTwo=await f.make().snapshot();
 await f.store.write(tabOne,S,await seal(tabOne.key,S,'tab one'));
 await rejects(f.make().write(tabTwo,S,await seal(tabTwo.key,S,'stale tab two')),'conflict','stale tab cannot overwrite another committed save');
 await rejects(f.make().replace(tabTwo,S,await seal(rotated,S,'stale restore'),rotated),'conflict','stale restore cannot rotate the current key');
 same(await plain((await f.store.snapshot()).key,S,(await f.store.snapshot()).records[S]),'tab one','stale attempts retain accepted ciphertext');
 const current=await f.store.snapshot();
 await rejects(f.store.compareAndCommit({expected:current,records:{[S]:await seal(rotated,S,'partial rotation')},key:rotated}),'unknown-format','partial key replacement cannot strand another live encrypted slot');
 await rejects(f.store.replace(current,'unknown-slot',restored,rotated),'unknown-format','unknown replace slot cannot delete all known training records');
 await rejects(f.store.write(current,S,'plaintext'),'unknown-format','backend rejects plaintext writes');
 const shortKey=await webcrypto.subtle.generateKey({name:'AES-GCM',length:128},false,['encrypt','decrypt']);
 await rejects(f.store.replace(current,S,await seal(shortKey,S,'wrong key length'),shortKey),'unknown-format','AES-256 format rejects an AES-128 replacement key');
 same((await f.store.snapshot()).records,current.records,'invalid key length leaves current ciphertext unchanged');

 // Cleanup hashes are part of the expected snapshot, even if the revision was
 // not updated. Altered metadata cannot authorize deleting new legacy input.
 const hashChanged=fixture({[S]:SECRET}),hashKey=await generate();
 const hashImport=await hashChanged.store.importLegacy({expected:await hashChanged.store.snapshot(),legacy:{[S]:SECRET,[D]:null},records:{[S]:await seal(hashKey,S,SECRET),[D]:null},key:hashKey});
 hashChanged.legacy.setItem(S,'new unimported legacy record');
 const hashMetadata=await dump(hashChanged.idb,'metadata','record-state-v2');
 hashMetadata.legacyHashes[S]=await digest('new unimported legacy record');
 await mutate(hashChanged.idb,['metadata'],tx=>tx.objectStore('metadata').put(hashMetadata,'record-state-v2'));
 await rejects(hashChanged.store.cleanupLegacy(hashImport),'conflict','changed cleanup hash metadata invalidates verified import snapshot');
 same(hashChanged.legacy.getItem(S),'new unimported legacy record','cleanup hash conflict retains the unimported source');

 // Independent corruption/missing-key changes are detected even without a
 // revision update, and a new key is never silently created over ciphertext.
 const keyLost=fixture();await emptyReady(keyLost);
 const lostKey=await generate(),lostRecord=await seal(lostKey,S,'retain when key lost');
 const savedLost=await keyLost.store.write(await keyLost.store.snapshot(),S,lostRecord,lostKey);
 await mutate(keyLost.idb,['keys'],tx=>tx.objectStore('keys').delete('data-key-v1'));
 await rejects(keyLost.store.write(savedLost,S,await seal(lostKey,S,'unsafe keyless edit')),'conflict','out-of-band key deletion invalidates old writer snapshot');
 same((await keyLost.make().snapshot()).records[S],lostRecord,'key loss leaves exportable ciphertext in place');
 const tampered=fixture();await emptyReady(tampered);const tamperKey=await generate();
 const savedTampered=await tampered.store.write(await tampered.store.snapshot(),S,await seal(tamperKey,S,'before tamper'),tamperKey);
 const outside=await seal(tamperKey,S,'external record');
 await mutate(tampered.idb,['records'],tx=>tx.objectStore('records').put({version:1,ciphertext:outside},S));
 await rejects(tampered.store.write(savedTampered,S,await seal(tamperKey,S,'stale after tamper')),'conflict','ciphertext change without revision still rejects stale writer');

 // A key-lost legacy ciphertext remains migratable/exportable unchanged; a
 // confirmed restore supplies the new key and retires obsolete slots atomically.
 const locked=fixture({[S]:lostRecord});
 const lockedImport=await locked.store.importLegacy({expected:await locked.store.snapshot(),legacy:{[S]:lostRecord,[D]:null},records:{[S]:lostRecord,[D]:null}});
 same(lockedImport.key,undefined,'key-lost import does not mint a key');
 same(lockedImport.records[S],lostRecord,'key-lost ciphertext is retained byte for byte');
 await rejects(locked.store.write(lockedImport,S,await seal(lostKey,S,'unapproved key replacement')),'unknown-format','ordinary save cannot replace a missing key');
 const recovered=await locked.store.replace(lockedImport,S,restored,rotated);
 same(await plain(recovered.key,S,recovered.records[S]),'quota restore','explicit atomic restore recovers key-lost profile');
 same(recovered.records[D],null,'restore tombstones obsolete setup');
 const unsafe=fixture({[S]:lostRecord});
 await rejects(unsafe.store.importLegacy({expected:await unsafe.store.snapshot(),legacy:{[S]:lostRecord,[D]:null},records:{[S]:lostRecord,[D]:null},key:rotated}),'unknown-format','legacy import cannot invent a new key over encrypted input');

 // Aborted import leaves every original, old metadata and key unchanged.
 const interrupted=fixture({[S]:SECRET}),newKey=await generate(),newRaw=await seal(newKey,S,SECRET);
 IDBObjectStore.prototype.put=function(value,...args){if(this.name==='metadata')throw new DOMException('Injected metadata failure','QuotaExceededError');return realPut.call(this,value,...args)};
 try{await rejects(interrupted.store.importLegacy({expected:await interrupted.store.snapshot(),legacy:{[S]:SECRET,[D]:null},records:{[S]:newRaw,[D]:null},key:newKey}),'unavailable','failed import transaction rejects before cleanup')}finally{IDBObjectStore.prototype.put=realPut}
 const reopenedInterrupted=await interrupted.make().snapshot();
 same(reopenedInterrupted.records[S],null,'aborted import leaves no partial record');
 same(reopenedInterrupted.key,undefined,'aborted import leaves no orphaned new key');
 same(reopenedInterrupted.migrated,false,'aborted import does not install completion marker');
 same(interrupted.legacy.getItem(S),SECRET,'aborted import preserves the legacy original');

 // Cleanup denial and interruption after import commit cannot resurrect input
 // once discard/reset has committed its durable tombstones.
 const retained=fixture({[S]:SECRET,[D]:'draft'}),retainKey=await generate();
 const retainedImport=await retained.store.importLegacy({expected:await retained.store.snapshot(),legacy:{[S]:SECRET,[D]:'draft'},records:{[S]:await seal(retainKey,S,SECRET),[D]:await seal(retainKey,D,'draft')},key:retainKey});
 const remove=retained.legacy.removeItem;retained.legacy.removeItem=()=>{throw Error('storage removal denied')};
 same((await retained.store.cleanupLegacy(retainedImport)).retained,[S,D],'cleanup failure is reported without undoing committed migration');
 const discarded=await retained.store.discard(await retained.store.snapshot(),D);
 same(discarded.tombstones.includes(D),true,'discard persists a tombstone');
 same((await retained.make().snapshot()).records[D],null,'fresh store retains deletion despite leftover legacy draft');
 const reset=await retained.store.reset(await retained.store.snapshot());
 same(reset.key,undefined,'reset deletes encryption key in the same transaction');
 same(reset.records,{[S]:null,[D]:null},'reset clears all records atomically');
 same(reset.migrated,true,'reset retains migration marker to ignore legacy leftovers');
 same(reset.tombstones,[S,D],'reset persists all deletion tombstones');
 const repeatedReset=await retained.make().importLegacy({expected:await retained.make().snapshot(),legacy:{[S]:SECRET,[D]:'draft'},records:{[S]:await seal(retainKey,S,SECRET),[D]:await seal(retainKey,D,'draft')},key:retainKey});
 same(repeatedReset.records,{[S]:null,[D]:null},'repeat import cannot resurrect records after reset');
 await rejects(retained.store.write(discarded,S,await seal(retainKey,S,'stale before reset')),'conflict','reset invalidates stale captured key and record revision');
 retained.legacy.removeItem=remove;

 // Changed legacy input is detected inside the transaction before any copy.
 const changedLegacy=fixture({[S]:SECRET}),captured=await changedLegacy.store.snapshot(),changedKey=await generate();changedLegacy.legacy.setItem(S,'new legacy input');
 await rejects(changedLegacy.store.importLegacy({expected:captured,legacy:{[S]:SECRET,[D]:null},records:{[S]:await seal(changedKey,S,SECRET),[D]:null},key:changedKey}),'conflict','changed migration source cannot be silently lost');
 same((await changedLegacy.make().snapshot()).migrated,false,'source conflict does not mark migration complete');

 // This exceeds common localStorage history limits; the actual IndexedDB path
 // persists and reopens it. Browser/disk capacity still requires device testing.
 const large=fixture();await emptyReady(large);const largeKey=await generate(),largeText='x'.repeat(6_000_000)+SECRET,largeRaw=await seal(largeKey,S,largeText);
 const largeSaved=await large.store.write(await large.store.snapshot(),S,largeRaw,largeKey);
 same(largeSaved.records[S].length,largeRaw.length,'large ciphertext is not truncated');
 same(await plain((await large.make().snapshot()).key,S,(await large.make().snapshot()).records[S]),largeText,'large committed history reopens exactly');

 // A blocked old connection produces an explicit retry path, and a later
 // success event closes the abandoned upgrade connection rather than leaking it.
 const blocked=fixture(),held=await open(blocked.idb,1);
 await rejects(blocked.store.snapshot(),'unavailable','an old open connection does not leave upgrade promise hanging');held.close();
 same((await blocked.make().snapshot()).migrated,false,'storage can reopen once the old connection closes');

 console.log(`PASS browser record store: ${checks} checks (actual fake-indexeddb transactions, real WebCrypto)`);
})().catch(error=>{console.error(error);process.exit(1)});
