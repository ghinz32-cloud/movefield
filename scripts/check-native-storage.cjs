const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const mobileDir=path.resolve(__dirname,'..','mobile');
const values=new Map();let release,started,gate=null;
const disk={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{if(gate){started();await gate;}values.set(key,value)},removeItem:async key=>values.delete(key),multiRemove:async keys=>{keys.forEach(k=>values.delete(k))}};
// In-memory stand-ins for the device secure store and secure random source; the real modules need native code.
const secure=new Map();
const secureStore={AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:'after-first-unlock-this-device',getItemAsync:async key=>secure.get(key)??null,setItemAsync:async(key,value)=>{secure.set(key,value)},deleteItemAsync:async key=>{secure.delete(key)}};
const expoCrypto={getRandomBytes:n=>new Uint8Array(require('node:crypto').randomBytes(n))};
const DATA_KEY='movefield.dataKey.v1',STATE_KEY='training-studio:mobile-local-demo:v1',SETUP_KEY='training-studio:mobile-setup:v1';
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

 const custom={id:'custom-load',name:'Custom timed loaded work',equipment:'Custom',pattern:'Custom',metric:'seconds',cues:[],custom:true,loadTracked:true};const w={id:'w',sessionId:'s',title:'Timed',date:T.day(),startedAt:1,sets:[{exerciseId:custom.id,set:1,reps:1200.5,kg:null,done:true}]};assert.equal(engine.unknownLoads(w,[custom]),1);assert.doesNotThrow(()=>engine.editSet({...s,custom:[custom],active:w},0,{}));
 console.log('PASS native setup/state write ordering, latest-draft recovery, reset cleanup, encrypted-at-rest storage with key-loss protection, and custom timed/load conventions');
})().catch(e=>{console.error(e);process.exit(1)});
