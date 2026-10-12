import {nativeRecordBackend} from './record-backend';
import {nativeStorageKey} from './shared/brand';
import {createRecordStateStorage,decodeRecordBundle,encryptedRecordBundle} from './shared/record-state';
import {cloudDigest} from './cloud-vault';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {AESEncryptionKey,AESSealedData,aesEncryptAsync,aesDecryptAsync,getRandomBytesAsync} from 'expo-crypto';
import {readSavedState,readSetupDraft} from './shared/saved-data';
import {type State} from './shared/training';
import {hex,unhex,isVault,readEnvelope,vaultAAD,type VaultEnvelope} from './shared/vault-format';
import {encryptedStorage} from './shared/encrypted-storage';
const KEY=nativeStorageKey('training-studio:mobile-local-demo:v1'),SETUP_KEY=nativeStorageKey('training-studio:mobile-setup:v1');
const SAMPLE_KEY=nativeStorageKey('movefield:mobile-sample:v1'),SAMPLE_SETUP=nativeStorageKey('movefield:mobile-sample-setup:v1');
const SECRET=nativeStorageKey('movefield.local-vault-key.v1');
const CLOUD_OUTBOX=nativeStorageKey('movefield:cloud-outbox:v1');
let storageGeneration=0,storageErased=false;
const secureOptions={keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
type KeyRecord={key:string;vaultId:string;salt:string};
let pendingKey:Promise<KeyRecord>|null=null;
let knownKeys=new Map<string,KeyRecord>();
function validateKey(raw:string):KeyRecord{const k=JSON.parse(raw);if(!k||!/^[a-f0-9]{64}$/.test(k.key)||!/^[a-f0-9]{32}$/.test(k.vaultId)||!/^[a-f0-9]{32}$/.test(k.salt)||Object.keys(k).length!==3)throw Error('The device vault key is invalid. Saved files are kept.');return k}
function keyRing(raw:string):KeyRecord[]{const value=JSON.parse(raw);if(value.version===1&&Array.isArray(value.keys)&&value.keys.length>=1&&value.keys.length<=8)return value.keys.map((k:unknown)=>validateKey(JSON.stringify(k)));return [validateKey(raw)]}
async function keyRecord(expectedVaultId?:string):Promise<KeyRecord>{
 if(expectedVaultId){const cached=knownKeys.get(expectedVaultId);if(cached)return cached;const stored=await SecureStore.getItemAsync(SECRET,secureOptions);if(!stored)throw Error('The device vault key is missing. Your encrypted files are kept.');const found=keyRing(stored).find(k=>k.vaultId===expectedVaultId);if(!found)throw Error('This recovery key is not available on this device.');knownKeys.set(found.vaultId,found);return found}
 if(pendingKey)return pendingKey;
 pendingKey=(async()=>{
  if(!await SecureStore.isAvailableAsync())throw Error('Platform secure storage is unavailable. Private saving is disabled.');
  const stored=await SecureStore.getItemAsync(SECRET,secureOptions),existing=await AsyncStorage.multiGet([KEY,SETUP_KEY]),databaseRoot=await (await nativeRecordBackend()).root();
  if(stored){const keys=keyRing(stored),current=databaseRoot??existing[0][1];const id=current&&isVault(current)?readEnvelope(current).vaultId:null;const found=id?keys.find(k=>k.vaultId===id):keys[keys.length-1];if(!found)throw Error('The device vault key is missing. Your encrypted files are kept.');keys.forEach(k=>knownKeys.set(k.vaultId,k));return found}
  if(databaseRoot&&isVault(databaseRoot)||existing.some(([,raw])=>raw&&isVault(raw)))throw Error('The device vault key is missing. Restore your recovery key; your encrypted files have not been replaced.');
  const k={key:hex(await getRandomBytesAsync(32)),vaultId:hex(await getRandomBytesAsync(16)),salt:hex(await getRandomBytesAsync(16))};
  await SecureStore.setItemAsync(SECRET,JSON.stringify(k),secureOptions);
  if(await SecureStore.getItemAsync(SECRET,secureOptions)!==JSON.stringify(k))throw Error('The device vault key could not be saved.');
  knownKeys.set(k.vaultId,k);return k;
 })();try{return await pendingKey}catch(e){pendingKey=null;throw e}
}
async function encrypt(raw:string,purpose:'state'|'setup'){
 if(new TextEncoder().encode(raw).length>5_000_000)throw Error('This profile exceeds the supported vault size. Export before adding records.');
 return encryptWith(await keyRecord(),raw,purpose);
}
async function encryptWith(k:KeyRecord,raw:string,purpose:'state'|'setup'){
 const iv=await getRandomBytesAsync(12);
 const e:Omit<VaultEnvelope,'ciphertext'>={format:'movefield-vault',version:1,algorithm:'AES-256-GCM',vaultId:k.vaultId,purpose,schema:2,keyVersion:1,kdf:'platform',iterations:0,salt:k.salt,iv:hex(iv)};
 const key=await AESEncryptionKey.import(unhex(k.key));
 const sealed=await aesEncryptAsync(new TextEncoder().encode(raw),key,{nonce:{bytes:iv},tagLength:16,additionalData:new TextEncoder().encode(vaultAAD(e))});
 return JSON.stringify({...e,ciphertext:hex(await sealed.ciphertext({includeTag:true}))});
}
async function decrypt(raw:string,purpose:'state'|'setup'){
 const e=readEnvelope(raw);return decryptWith(await keyRecord(e.vaultId),raw,purpose);
}
async function decryptWith(k:KeyRecord,raw:string,purpose:'state'|'setup'){
 const e=readEnvelope(raw);
 if(e.vaultId!==k.vaultId||e.salt!==k.salt||e.kdf!=='platform'||e.purpose!==purpose)throw Error('This encrypted record belongs to another vault or record type.');
 try{const key=await AESEncryptionKey.import(unhex(k.key)),sealed=AESSealedData.fromParts(unhex(e.iv),unhex(e.ciphertext),16);const bytes=await aesDecryptAsync(sealed,key,{additionalData:new TextEncoder().encode(vaultAAD(e))});return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw Error('This encrypted record cannot be opened with the device key. The original file is kept.')}
}
function store(key:string,purpose:'state'|'setup',validate:(raw:string)=>unknown){return encryptedStorage({read:()=>AsyncStorage.getItem(key),write:raw=>AsyncStorage.setItem(key,raw),encrypt:raw=>encrypt(raw,purpose),decrypt:raw=>decrypt(raw,purpose),validate:raw=>{validate(raw)}})}
const setup=store(SETUP_KEY,'setup',readSetupDraft);
let records:Promise<ReturnType<typeof createRecordStateStorage>>|null=null;
function recordPersonal(){return records??=nativeRecordBackend().then(backend=>createRecordStateStorage({backend,digest:cloudDigest,seal:raw=>encrypt(raw,'state'),open:raw=>decrypt(raw,'state'),legacyRead:()=>AsyncStorage.getItem(KEY),legacyWrite:raw=>AsyncStorage.setItem(KEY,raw)}))}
async function flushPersonal(){if(records)await (await records).flush()}
let sampleWrites:Promise<void>=Promise.resolve();
function sampleWrite(key:string,raw:string|null){const task=sampleWrites.catch(()=>undefined).then(()=>raw===null?AsyncStorage.removeItem(key):AsyncStorage.setItem(key,raw));sampleWrites=task;return task}
export async function readLocalState(sample=false):Promise<State|null>{
 if(sample){await sampleWrites.catch(()=>undefined);const raw=await AsyncStorage.getItem(SAMPLE_KEY);return raw===null?null:readSavedState(raw)}
 const backend=await nativeRecordBackend(),local=await recordPersonal(),migrating=await backend.root()===null,state=await local.read();if(state&&migrating)await local.write(state);return state;
}
export async function saveLocalState(state:State,sample=false):Promise<void>{const raw=JSON.stringify(state);readSavedState(raw);await (sample?sampleWrite(SAMPLE_KEY,raw):(await recordPersonal()).write(state));if(!sample)storageErased=false}
export async function resetLocalState(sample=false):Promise<void>{await (sample?sampleWrites:flushPersonal()).catch(()=>undefined);if(!sample)throw Error('Personal records are preserved. Use a confirmed replacement backup or erase action.');await sampleWrite(SAMPLE_KEY,null);await sampleWrite(SAMPLE_SETUP,null)}
export async function readLocalSetup(sample=false):Promise<ReturnType<typeof readSetupDraft>|null>{if(sample){await sampleWrites.catch(()=>undefined);const raw=await AsyncStorage.getItem(SAMPLE_SETUP);return raw===null?null:readSetupDraft(raw)}await setup.migrate();const raw=await setup.read();return raw===null?null:readSetupDraft(raw)}
export function saveLocalSetup(draft:ReturnType<typeof readSetupDraft>,sample=false):Promise<void>{const raw=JSON.stringify(draft);readSetupDraft(raw);return sample?sampleWrite(SAMPLE_SETUP,raw):setup.write(raw)}
export async function clearLocalSetup(sample=false):Promise<void>{if(sample)return sampleWrite(SAMPLE_SETUP,null);await setup.flush().catch(()=>undefined);await AsyncStorage.removeItem(SETUP_KEY)}
/** Explicit recovery material: show only on owner request, never log or put beside a backup. */
export async function localRecoveryKey(){return JSON.stringify(await keyRecord())}
export async function encryptedLocalBackup(){await flushPersonal().catch(()=>undefined);return encryptedRecordBundle(await nativeRecordBackend(),()=>AsyncStorage.getItem(KEY))}
export async function previewLocalBackup(raw:string,recovery:string):Promise<State>{
 const k=validateKey(recovery);return decodeRecordBundle(raw,{digest:cloudDigest,open:cipher=>decryptWith(k,cipher,'state')});
}

export async function restoreLocalBackup(raw:string,recovery:string,unchangedKeyRecovery=false):Promise<State>{
 const state=await previewLocalBackup(raw,recovery),k=validateKey(recovery);await flushPersonal().catch(()=>undefined);await setup.flush().catch(()=>undefined);await cloudWrites.catch(()=>undefined);
 if(await AsyncStorage.getItem(CLOUD_OUTBOX)&&(!unchangedKeyRecovery||await encryptedLocalBackup()!==raw))throw Error('Retry or discard the queued cloud upload before restoring a different vault.');
 const stored=await SecureStore.getItemAsync(SECRET,secureOptions),keys=stored?keyRing(stored):[];
 const matched=keys.find(x=>x.vaultId===k.vaultId);if(matched&&JSON.stringify(matched)!==JSON.stringify(k))throw Error('Recovery metadata conflicts with this device.');
 if(!matched)keys.push(k);if(keys.length>8)throw Error('This device retains eight recovery keys. Export and review recovery before adding another.');
 // Keep old keys before swapping ciphertext: either side of interruption stays recoverable.
 const encoded=JSON.stringify({version:1,keys});await SecureStore.setItemAsync(SECRET,encoded,secureOptions);if(await SecureStore.getItemAsync(SECRET,secureOptions)!==encoded)throw Error('Recovery key could not be verified.');
 if(!unchangedKeyRecovery){const writer=createRecordStateStorage({backend:await nativeRecordBackend(),digest:cloudDigest,seal:plain=>encryptWith(k,plain,'state'),open:cipher=>decryptWith(k,cipher,'state'),legacyRead:()=>AsyncStorage.getItem(KEY),legacyWrite:cipher=>AsyncStorage.setItem(KEY,cipher)});await writer.write(state)}pendingKey=null;knownKeys=new Map();if(records)(await records).reset();return state;
}
export async function restoreDeviceKey(recovery:string){const existing=await encryptedLocalBackup();if(!existing)throw Error('Restore an encrypted file first.');await restoreLocalBackup(existing,recovery,true);}

export async function flushLocalSetup(sample=false){await (sample?sampleWrites:setup.flush())}

/** Owner-confirmed local erasure. Keep ciphertext decryptable if deletion fails. */
export async function erasePrivateProfile(){storageGeneration++;storageErased=true;await flushPersonal().catch(()=>undefined);await setup.flush().catch(()=>undefined);await cloudWrites.catch(()=>undefined);await AsyncStorage.multiRemove([KEY,SETUP_KEY,CLOUD_OUTBOX]);if((await AsyncStorage.multiGet([KEY,SETUP_KEY,CLOUD_OUTBOX])).some(([,value])=>value!==null))throw Error('Some private files could not be erased. The recovery key is retained.');await (await nativeRecordBackend()).clear();if(records)(await records).reset();await SecureStore.deleteItemAsync(SECRET,secureOptions);pendingKey=null;knownKeys=new Map();}

export async function encryptedStateBackup(state:State){const raw=JSON.stringify(state);readSavedState(raw);return encrypt(raw,'state')}

let cloudWrites:Promise<void>=Promise.resolve();
export const nativeOutbox={
 read:async()=>{await cloudWrites.catch(()=>undefined);const raw=await AsyncStorage.getItem(CLOUD_OUTBOX);return raw?decrypt(raw,'setup'):null},
 write:(plain:string)=>{const token=storageGeneration;const operation=cloudWrites.catch(()=>undefined).then(async()=>{if(await AsyncStorage.getItem(CLOUD_OUTBOX))throw Error('A backup is already queued.');const raw=await encrypt(plain,'setup');if(token!==storageGeneration||storageErased)throw Error('The private profile changed. The upload was not queued.');await AsyncStorage.setItem(CLOUD_OUTBOX,raw);if(await AsyncStorage.getItem(CLOUD_OUTBOX)!==raw)throw Error('The encrypted backup queue could not be verified.');});cloudWrites=operation;return operation},
 clear:(expected?:string)=>{const operation=cloudWrites.catch(()=>undefined).then(async()=>{const raw=await AsyncStorage.getItem(CLOUD_OUTBOX);if(expected&&(!raw||await decrypt(raw,'setup')!==expected))throw Error('The backup queue changed. It has been kept.');await AsyncStorage.removeItem(CLOUD_OUTBOX)});cloudWrites=operation;return operation},
};
