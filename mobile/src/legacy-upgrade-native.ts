import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {File} from 'expo-file-system';
import {defaultDatabaseDirectory,openDatabaseAsync,type SQLiteDatabase} from 'expo-sqlite';
import {nativeStorageKey} from './shared/brand';
import {parseSafeJson} from './shared/saved-data';
import {LEGACY_STATE,LEGACY_SETUP,LEGACY_JOURNAL,LEGACY_HISTORY,legacyDigest,reconcileLegacyUpgrade,type LegacySnapshot,type UpgradeStage} from './legacy-upgrade';
const LEGACY_DB='movefield-encrypted-records-v1.db';
const OPTIONS={keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY};
const KEYS=['movefield.dataKey.v1','movefield.restoreKeys.v1'];
const sourceFile=(suffix='')=>new File(defaultDatabaseDirectory.startsWith('file:')?defaultDatabaseDirectory:'file://'+defaultDatabaseDirectory,LEGACY_DB+suffix);
const fail=()=>Error('The old record database is incomplete or damaged. Original training and device keys are kept.');
type Manifest={slot:string;deleted:number;chars:number;chunks:number;hash:string};
export async function readLegacySource(){
 const [active,restore]=await Promise.all(KEYS.map(k=>SecureStore.getItemAsync(k,OPTIONS)));
 const fallback=await AsyncStorage.multiGet([LEGACY_STATE,LEGACY_SETUP,LEGACY_JOURNAL]);
 const records:Record<string,string|null>={};let revision=0;let exists=false;
 if(sourceFile().exists){
  const db=await openDatabaseAsync(LEGACY_DB,{useNewConnection:true});
  try{await db.withTransactionAsync(async()=>{
   const tables=await db.getAllAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table'");
   const names=new Set(tables.map(t=>t.name));
   if(!names.has('training_records')){if(names.has('training_chunks'))throw fail();return}
   if(!names.has('training_chunks')||!names.has('training_record_metadata'))throw fail();
   const generation=await db.getFirstAsync<{revision:number}>('SELECT revision FROM training_record_metadata WHERE id=?','generation-v1');revision=generation?.revision??0;
   if(!Number.isSafeInteger(revision)||revision<0)throw fail();
   const manifests=await db.getAllAsync<Manifest>('SELECT slot,deleted,chars,chunks,hash FROM training_records ORDER BY slot');
   if(manifests.length>10003)throw fail();let chars=0;
   for(const m of manifests){
    if(![LEGACY_STATE,LEGACY_SETUP,LEGACY_JOURNAL].includes(m.slot)&&!(m.slot.startsWith(LEGACY_HISTORY)&&/^[a-f0-9]{64}$/.test(m.slot.slice(LEGACY_HISTORY.length))))throw fail();
    const chunks=await db.getAllAsync<{ordinal:number;value:string;hash:string}>('SELECT ordinal,value,hash FROM training_chunks WHERE slot=? ORDER BY ordinal',m.slot);
    if(m.deleted===1){if(m.chars!==0||m.chunks!==0||m.hash!==''||chunks.length)throw fail();records[m.slot]=null;continue}
    if(m.deleted!==0||!Number.isSafeInteger(m.chars)||m.chars<1||m.chars>48_000_000||m.chunks!==Math.ceil(m.chars/131072)||chunks.length!==m.chunks||!/^[a-f0-9]{64}$/.test(m.hash))throw fail();
    if(chunks.some((c,n)=>c.ordinal!==n||typeof c.value!=='string'||c.value.length<1||c.value.length>131072||legacyDigest(c.value)!==c.hash))throw fail();
    const raw=chunks.map(c=>c.value).join('');chars+=raw.length;
    if(chars>96_000_000||raw.length!==m.chars||legacyDigest(raw)!==m.hash)throw fail();
    if(m.slot!==LEGACY_JOURNAL){const envelope=parseSafeJson(raw,48_000_000) as {v?:number;alg?:string};if(envelope.v!==1||envelope.alg!=='xchacha20poly1305')throw fail()}
    records[m.slot]=raw;exists=true;
   }
   const orphan=await db.getFirstAsync<{slot:string}>('SELECT c.slot FROM training_chunks c LEFT JOIN training_records r ON r.slot=c.slot WHERE r.slot IS NULL LIMIT 1');if(orphan)throw fail();
  })}finally{await db.closeAsync()}
 }
 for(const [slot,raw]of fallback){
  if(Object.prototype.hasOwnProperty.call(records,slot))continue;
  // A current-format cache is never mistaken for the legacy fallback.
  if(raw&&slot!==LEGACY_JOURNAL&&(parseSafeJson(raw,48_000_000) as {format?:string}).format==='movefield-vault')continue;
  records[slot]=raw;if(raw!==null)exists=true;
 }
 const after=await Promise.all(KEYS.map(k=>SecureStore.getItemAsync(k,OPTIONS)));
 if(active!==after[0]||restore!==after[1])throw Error('The old recovery keys changed while opening training. Reopen the app.');
 if(!exists&&restore===null)return null;
 return {snapshot:{revision,records} satisfies LegacySnapshot,keys:{active,restore}};
}

type Codec={seal:(plain:string)=>Promise<string>;open:(cipher:string)=>Promise<string>};
async function upgradeDb(){const db=await openDatabaseAsync(nativeStorageKey('movefield-private-records-v1.db').replace(/:/g,'-'));await db.execAsync('CREATE TABLE IF NOT EXISTS legacy_upgrade_archive(k TEXT PRIMARY KEY NOT NULL,raw TEXT NOT NULL);');return db}
async function readStage(db:SQLiteDatabase,codec:Codec):Promise<UpgradeStage|null>{
 const meta=await db.getFirstAsync<{raw:string}>('SELECT raw FROM legacy_upgrade_archive WHERE k=?','manifest');if(!meta)return null;
 const info=parseSafeJson(await codec.open(meta.raw)) as {format:string;count:number;chars:number;digest:string};
 if(info.format!=='movefield-legacy-upgrade-stage-v1'||!Number.isSafeInteger(info.count)||info.count<1||info.count>1000||!Number.isSafeInteger(info.chars)||info.chars<1||info.chars>96_000_000||!/^[a-f0-9]{64}$/.test(info.digest))throw fail();
 const parts:string[]=[];for(let n=0;n<info.count;n++){const row=await db.getFirstAsync<{raw:string}>('SELECT raw FROM legacy_upgrade_archive WHERE k=?','part-'+n);if(!row)throw fail();parts.push(await codec.open(row.raw))}
 const raw=parts.join('');if(raw.length!==info.chars||legacyDigest(raw)!==info.digest)throw fail();
 const stage=parseSafeJson(raw,96_000_000) as UpgradeStage;
 if(stage.format!=='movefield-legacy-upgrade-v1'||!stage.source||!(stage.state===null||typeof stage.state==='object')||!(stage.setup===null||typeof stage.setup==='object'))throw fail();return stage;
}
export async function runLegacyUpgrade(codec:Codec,callbacks:{hasTarget:()=>Promise<boolean>;install:(stage:UpgradeStage)=>Promise<void>;verify:(stage:UpgradeStage)=>Promise<void>}){
 const db=await upgradeDb();
 const marker=async(name:string)=>{const row=await db.getFirstAsync<{raw:string}>('SELECT raw FROM legacy_upgrade_archive WHERE k=?',name);if(!row)return false;if(await codec.open(row.raw)!==name)throw fail();return true};
 const mark=async(name:string)=>{const raw=await codec.seal(name);if(await codec.open(raw)!==name)throw fail();await db.runAsync('INSERT OR REPLACE INTO legacy_upgrade_archive(k,raw) VALUES(?,?)',name,raw);if(!await marker(name))throw fail()};
 await reconcileLegacyUpgrade({
  ...callbacks,complete:()=>marker('complete'),ready:()=>marker('ready'),qualify:()=>mark('ready'),stage:()=>readStage(db,codec),source:readLegacySource,
  retain:async stage=>{
   const raw=JSON.stringify(stage);if(raw.length>96_000_000)throw fail();const parts:string[]=[];
   for(let n=0;n<raw.length;n+=131072){const plain=raw.slice(n,n+131072),cipher=await codec.seal(plain);if(await codec.open(cipher)!==plain)throw fail();parts.push(cipher)}
   const manifest=await codec.seal(JSON.stringify({format:'movefield-legacy-upgrade-stage-v1',count:parts.length,chars:raw.length,digest:legacyDigest(raw)}));
   await db.withExclusiveTransactionAsync(async tx=>{if(await tx.getFirstAsync('SELECT k FROM legacy_upgrade_archive WHERE k=?','manifest'))throw Error('An upgrade is already staged. Reopen training.');for(let n=0;n<parts.length;n++)await tx.runAsync('INSERT INTO legacy_upgrade_archive(k,raw) VALUES(?,?)','part-'+n,parts[n]);await tx.runAsync('INSERT INTO legacy_upgrade_archive(k,raw) VALUES(?,?)','manifest',manifest)});
   if(JSON.stringify(await readStage(db,codec))!==raw)throw fail();
  },finish:()=>mark('complete'),
 });
}
/** Explicit owner erasure includes the retained old file and migration archive.
 * Delete ciphertext before keys, so an interrupted erasure stays recoverable. */
export async function eraseLegacyUpgrade(){
 for(const suffix of ['','-wal','-shm','-journal']){const file=sourceFile(suffix);if(file.exists)file.delete();if(file.exists)throw Error('The old private database could not be erased. Its device keys are retained.')}
 await AsyncStorage.removeItem(LEGACY_JOURNAL);
 if(await AsyncStorage.getItem(LEGACY_JOURNAL)!==null)throw Error('The old restore journal could not be erased. Its device keys are retained.');
 for(const name of KEYS)await SecureStore.deleteItemAsync(name,OPTIONS);
 const db=await upgradeDb();await db.runAsync('DELETE FROM legacy_upgrade_archive');
}
