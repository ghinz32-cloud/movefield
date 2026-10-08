const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
// Loads lib/browser-vault.ts as the app does and checks sealing, slot binding, key-missing behaviour and migration.
// Node has Web Crypto, so the real AES-GCM path runs. IndexedDB is replaced by an in-memory key store.
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const m={exports:{}};cache.set(name,m);
 const src=ts.transpileModule(fs.readFileSync(path.join('lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',src)(s=>s.startsWith('./')?load(s.slice(2)):require(s),m,m.exports);
 return m.exports;
}
const V=load('browser-vault');
const {webcrypto}=require('node:crypto');
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const SECRET='secret workout marker 7F3A';
const SLOT='training-studio-v2', SETUP='training-studio-setup-v1';

function memoryStorage(){
 const map=new Map();
 return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
function memoryKeys(){
 let key;
 const store={
  puts:0,
  get:async()=>key,
  put:async k=>{key=k;store.puts++},
  remove:async()=>{key=undefined},
  peek:()=>key,
 };
 return store;
}
const random=n=>webcrypto.getRandomValues(new Uint8Array(n));
function makeVault(storage,keys,slots){return V.createVault({storage,keys,subtle:webcrypto.subtle,random,slots})}
const rejects=async(promise,code,msg)=>{try{await promise}catch(e){same(e instanceof V.VaultError,true,msg+' is a VaultError');same(e.code,code,msg);return}throw new Error(msg+' did not reject')};

(async()=>{
 // 1. Sealed records are not readable, and the same text seals differently each time.
 const storage=memoryStorage(),keys=memoryKeys(),vault=makeVault(storage,keys);
 const raw=await vault.write(SLOT,SECRET);
 ok(!raw.includes(SECRET)&&!storage.map.get(SLOT).includes('secret'),'the stored record does not contain the plaintext');
 same(V.isSealed(storage.map.get(SLOT)),true,'the stored record is recognised as sealed');
 same(await vault.read(SLOT),SECRET,'a read returns the original text');
 const again=await vault.write(SLOT,SECRET);
 ok(again!==raw,'each write uses a fresh IV, so identical text seals differently');

 // 2. The key is non-extractable: page code can use it but cannot copy its bytes.
 const key=keys.peek();
 same(key.extractable,false,'the data key is not extractable');
 await assert.rejects(webcrypto.subtle.exportKey('raw',key));checks++;
 same(keys.puts,1,'one key is created for the first write');

 // 3. Slot binding: a record copied to another slot will not open.
 storage.map.set(SETUP,storage.map.get(SLOT));
 await rejects(vault.read(SETUP),'decrypt-failed','a record moved to another slot does not open');

 // 4. Tampering is detected, and the record is left as it was.
 const sealedNow=storage.map.get(SLOT);
 const parsed=JSON.parse(sealedNow);
 const bad=parsed.data.slice(0,-4)+(parsed.data.slice(-4)==='AAAA'?'BBBB':'AAAA');
 storage.map.set(SLOT,JSON.stringify({...parsed,data:bad}));
 await rejects(vault.read(SLOT),'decrypt-failed','a changed byte in a sealed record is detected');
 same(storage.map.get(SLOT),JSON.stringify({...parsed,data:bad}),'the damaged record is left in place, not overwritten by a read');
 storage.map.set(SLOT,sealedNow);
 same(await vault.read(SLOT),SECRET,'restoring the original record opens again');

 // 5. Key missing: the app reports it, and never mints a new key over sealed data.
 const lostKeys=memoryKeys(),lost=makeVault(storage,lostKeys);
 await rejects(lost.read(SLOT),'key-missing','a sealed record with no key is reported as key-missing');
 await rejects(lost.write(SETUP,'draft'),'key-missing','writing another slot does not mint a key over sealed data');
 same(lostKeys.puts,0,'no new key was created while sealed records exist');
 same(await lost.hasKey(),false,'the vault reports that no key is present');
 same(V.isSealed(storage.map.get(SLOT)),true,'the sealed record is still there after the failed writes');

 // 6. Legacy plaintext is returned as-is, and the next write seals it.
 const legacyStorage=memoryStorage(),legacyKeys=memoryKeys(),legacy=makeVault(legacyStorage,legacyKeys);
 legacyStorage.map.set(SLOT,'{"schema":2,"plan":null}');
 same(await legacy.read(SLOT),'{"schema":2,"plan":null}','legacy plaintext can still be read');
 same(V.isSealed(legacyStorage.map.get(SLOT)),false,'reading does not change the stored plaintext');
 await legacy.write(SLOT,'{"schema":2,"plan":null}');
 same(V.isSealed(legacyStorage.map.get(SLOT)),true,'the next write seals the legacy record');
 same(await legacy.read(SLOT),'{"schema":2,"plan":null}','the migrated record reads back unchanged');

 // 7. Writes are serialised: the last write wins, even when several are queued together.
 await Promise.all([1,2,3,4,5].map(i=>vault.write(SLOT,'write '+i)));
 same(await vault.read(SLOT),'write 5','queued writes finish in order');

 // 8. A corrupted header is an unknown format, not a crash.
 storage.map.set(SLOT,'{"v":1,"alg":"aes-256-gcm","iv":"!!","data":"AAAA"}');
 await rejects(vault.read(SLOT),'unknown-format','a record with broken base64 is reported as an unknown format');
 storage.map.set(SLOT,'{"v":1,"alg":"aes-256-gcm","iv":"AAAA","data":"AAAA"}');
 await rejects(vault.read(SLOT),'unknown-format','a record with a wrong IV length is reported as an unknown format');

 // 9. Reset clears every slot and the key, and the next write starts fresh.
 const resetStorage=memoryStorage(),resetKeys=memoryKeys(),resetVault=makeVault(resetStorage,resetKeys);
 await resetVault.write(SLOT,'one');await resetVault.write(SETUP,'two');
 await resetVault.reset();
 same(resetStorage.map.size,0,'reset removes every training record');
 same(resetKeys.peek(),undefined,'reset deletes the key');
 await resetVault.write(SLOT,'fresh');
 same(await resetVault.read(SLOT),'fresh','a fresh key is created after reset');
 await resetVault.write(SETUP,'draft');
 await resetVault.discard(SETUP);
 same(resetStorage.map.has(SETUP),false,'discard removes one record');
 same(await resetVault.read(SLOT),'fresh','discard keeps the other records and the key');

 // 10. Only the listed slots count as training data, so unrelated keys are left alone.
 const scopeStorage=memoryStorage(),scopeVault=makeVault(scopeStorage,memoryKeys(),[SLOT]);
 scopeStorage.map.set('training-studio:preferences:v1','{"palette":"ocean"}');
 await scopeVault.write(SLOT,'x');
 await scopeVault.reset();
 same(scopeStorage.map.get('training-studio:preferences:v1'),'{"palette":"ocean"}','preferences are not sealed and survive a reset');

 // 11. Replace seals under a new key, and clears the other training slots only after the new record is stored.
 const repStorage=memoryStorage(),repKeys=memoryKeys(),repVault=makeVault(repStorage,repKeys,[SLOT,SETUP]);
 await repVault.write(SLOT,'old plan');
 await repVault.write(SETUP,'old draft');
 const oldKey=repKeys.peek();
 await repVault.replace(SLOT,'restored plan');
 same(await repVault.read(SLOT),'restored plan','replace stores the new text');
 same(repStorage.map.has(SETUP),false,'replace clears the other training slots');
 ok(repKeys.peek()!==oldKey,'replace uses a new key');

 // 12. If the new record cannot be stored, the previous key comes back and the old record still opens.
 const failStorage=memoryStorage(),failKeys=memoryKeys(),failVault=makeVault(failStorage,failKeys,[SLOT,SETUP]);
 await failVault.write(SLOT,'keep me');
 const before=failKeys.peek();
 const realSet=failStorage.setItem;
 failStorage.setItem=(k,v)=>{if(k===SLOT)throw new Error('quota');realSet(k,v)};
 let rejected=false;try{await failVault.replace(SLOT,'new text')}catch(error){rejected=error instanceof V.VaultError}
 failStorage.setItem=realSet;
 ok(rejected,'a failed replace rejects with a vault error');
 ok(failKeys.peek()===before,'the previous key is restored after a failed replace');
 same(await failVault.read(SLOT),'keep me','the previous record still opens after a failed replace');

 // 13. A failure while clearing other slots happens after the restore is stored, so it must not undo the restore.
 const cleanStorage=memoryStorage(),cleanKeys=memoryKeys(),cleanVault=makeVault(cleanStorage,cleanKeys,[SLOT,SETUP]);
 await cleanVault.write(SLOT,'old plan');
 await cleanVault.write(SETUP,'old draft');
 const realRemove=cleanStorage.removeItem;
 cleanStorage.removeItem=k=>{if(k===SETUP)throw new Error('cleanup failed');return realRemove(k)};
 let replaced=true;try{await cleanVault.replace(SLOT,'restored plan')}catch{replaced=false}
 cleanStorage.removeItem=realRemove;
 ok(replaced,'a failed clean-up does not reject a stored restore');
 same(await cleanVault.read(SLOT),'restored plan','the restored record opens after a failed clean-up');

 console.log(`PASS browser vault: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1)});
