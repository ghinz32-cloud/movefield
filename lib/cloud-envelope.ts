import {argon2idAsync} from '@noble/hashes/argon2.js';
import {bytesToHex,hexToBytes,utf8ToBytes} from '@noble/ciphers/utils.js';
import {passwordProblem,TRANSFER_KDF} from './transfer-bundle';
import {sha256} from '@noble/hashes/sha2.js';
import {type State, type Workout} from './training';
import {readStoredSavedState} from './storage-capacity';

type Envelope={format:'movefield-sync';version:1;kdf:{name:'argon2id';m:19456;t:2;p:1;salt:string};cipher:'aes-256-gcm';nonce:string;data:string};
export type CloudKey={key:CryptoKey;salt:string};
export type CloudRecord={id:string;ciphertext:string|null};
type Head={format:'movefield-cloud-head-v1';state:Omit<State,'history'>;history:[string,string][]};
const digest=(text:string)=>bytesToHex(sha256(utf8ToBytes(text)));
export const cloudHistoryId=(workoutId:string)=>'history-'+digest(workoutId);
function base64(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=0x8000)text+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(text);}
function unbase64(text:string){if(!/^[A-Za-z0-9+/]*={0,2}$/.test(text)||text.length%4!==0)throw new Error('The encrypted account record is invalid.');return Uint8Array.from(atob(text),x=>x.charCodeAt(0));}
export function cloudSalt(raw:string):string{
  const e=JSON.parse(raw) as Envelope;
  if(!e||typeof e!=='object'||e.format!=='movefield-sync'||e.version!==1||e.cipher!=='aes-256-gcm'||e.kdf?.name!=='argon2id'||e.kdf.m!==19456||e.kdf.t!==2||e.kdf.p!==1||!/^[0-9a-f]{32}$/.test(e.kdf.salt)||!/^[0-9a-f]{24}$/.test(e.nonce)||typeof e.data!=='string'||raw.length>1_000_000)throw new Error('The encrypted account record is unsupported. Nothing was replaced.');
  return e.kdf.salt;
}
export async function cloudKey(password:string,salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16)))):Promise<CloudKey>{
  const problem=passwordProblem(password);if(problem)throw problem;
  if(!/^[0-9a-f]{32}$/.test(salt))throw new Error('Invalid account encryption salt.');
  const encoded=utf8ToBytes(password.normalize('NFC'));
  let bytes:Uint8Array|undefined;
  try{bytes=await argon2idAsync(encoded,hexToBytes(salt),{m:TRANSFER_KDF.m,t:TRANSFER_KDF.t,p:1,dkLen:32});return {salt,key:await crypto.subtle.importKey('raw',new Uint8Array(bytes),{name:'AES-GCM'},false,['encrypt','decrypt'])};}
  finally{encoded.fill(0);bytes?.fill(0);}
}
export async function sealCloudRecord(key:CloudKey,accountId:string,id:string,text:string):Promise<string>{
  const nonce=crypto.getRandomValues(new Uint8Array(12)),plain=utf8ToBytes(text);
  try{
    const data=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:utf8ToBytes(JSON.stringify(['movefield-sync',1,accountId,id,key.salt]))},key.key,new Uint8Array(plain));
    const envelope:Envelope={format:'movefield-sync',version:1,kdf:{...TRANSFER_KDF,salt:key.salt},cipher:'aes-256-gcm',nonce:bytesToHex(nonce),data:base64(new Uint8Array(data))};
    const raw=JSON.stringify(envelope);if(raw.length>1_000_000)throw new Error('This account record exceeds the sync limit. Export a transfer file.');return raw;
  }finally{plain.fill(0);}
}
export async function openCloudRecord(key:CloudKey,accountId:string,id:string,raw:string):Promise<string>{
  if(cloudSalt(raw)!==key.salt)throw new Error('Account encryption changed. Unlock it again before syncing.');
  const e=JSON.parse(raw) as Envelope;
  let plain:ArrayBuffer;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(hexToBytes(e.nonce)),additionalData:utf8ToBytes(JSON.stringify(['movefield-sync',1,accountId,id,key.salt]))},key.key,new Uint8Array(unbase64(e.data)));}catch{throw new Error('The account password is wrong or its encrypted record changed. Nothing was replaced.');}
  const bytes=new Uint8Array(plain);try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}finally{bytes.fill(0);}
}
export async function cloudRecords(state:State,key:CloudKey,accountId:string,previous=new Map<string,string>()):Promise<{records:CloudRecord[];digests:Map<string,string>}>{
  readStoredSavedState(JSON.stringify(state));
  const {history,...base}=state,records:CloudRecord[]=[],digests=new Map<string,string>();
  for(const workout of history){const id=cloudHistoryId(workout.id),text=JSON.stringify(workout),hash=digest(text);digests.set(id,hash);if(previous.get(id)!==hash)records.push({id,ciphertext:await sealCloudRecord(key,accountId,id,text)});}
  const head:Head={format:'movefield-cloud-head-v1',state:base,history:history.map(w=>[w.id,digests.get(cloudHistoryId(w.id))!] as [string,string])};
  const text=JSON.stringify(head),hash=digest(text);digests.set('state-head',hash);if(previous.get('state-head')!==hash)records.push({id:'state-head',ciphertext:await sealCloudRecord(key,accountId,'state-head',text)});
  return {records,digests};
}
export async function assembleCloudState(records:Map<string,string>,key:CloudKey,accountId:string):Promise<{state:State;digests:Map<string,string>}>{
  const raw=records.get('state-head');if(!raw)throw new Error('No completed account snapshot is available.');
  const text=await openCloudRecord(key,accountId,'state-head',raw),head=JSON.parse(text) as Head;
  if(head.format!=='movefield-cloud-head-v1'||!head.state||'history'in head.state||!Array.isArray(head.history)||head.history.length>5000||new Set(head.history.map(x=>Array.isArray(x)?x[0]:undefined)).size!==head.history.length)throw new Error('The account snapshot is incomplete. Nothing was replaced.');
  const history:Workout[]=[],digests=new Map<string,string>([['state-head',digest(text)]]);
  for(const entry of head.history){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!entry[0]||entry[0].length>200||typeof entry[1]!=='string'||!/^[0-9a-f]{64}$/.test(entry[1]))throw new Error('The account history is invalid.');const [workoutId,hash]=entry,id=cloudHistoryId(workoutId),encrypted=records.get(id);if(!encrypted)throw new Error('The account history is incomplete. Nothing was replaced.');const plain=await openCloudRecord(key,accountId,id,encrypted);if(digest(plain)!==hash)throw new Error('The account history changed before its snapshot completed. Nothing was replaced.');const workout=JSON.parse(plain) as Workout;if(workout.id!==workoutId||cloudHistoryId(workout.id)!==id)throw new Error('The account history identity is invalid.');history.push(workout);digests.set(id,hash);}
  return {state:readStoredSavedState(JSON.stringify({...head.state,history})),digests};
}
