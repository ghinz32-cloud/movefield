import {readSavedState,parseSafeJson} from './saved-data';
import {isVault,readEnvelope} from './vault-format';
import type {State,Workout} from './training';
export type CipherRow={key:string;vaultId:string;raw:string};
export type HistoryRef={id:string;key:string;digest:string};
export type StateIndex={format:'movefield-state-index';version:1;state:State;history:HistoryRef[]};
export interface RecordBackend{
 root():Promise<string|null>;
 rows(keys:string[]):Promise<(CipherRow|null)[]>;
 list(vaultId:string):Promise<CipherRow[]>;
 snapshot():Promise<{root:string|null;rows:CipherRow[]}>;
 // Return only keys first introduced by this successful transaction. Optional
 // cleanup runs in the same expected-root transaction as a rollback.
 commit(expected:string|null,root:string|null,rows:CipherRow[],discardKeys?:string[]):Promise<{introduced:string[]}|void>;
 prune(vaultId:string,keys:string[],expectedRoot:string):Promise<void>;
 clear():Promise<void>;
}
type CryptoIO={seal:(plain:string)=>Promise<string>;open:(cipher:string)=>Promise<string>;digest:(raw:string)=>Promise<string>};
const stable=(value:unknown):string=>JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function indexOf(value:unknown):StateIndex|null{
 const v=value as StateIndex;if(v?.format!=='movefield-state-index')return null;
 if(v.version!==1||!v.state||!Array.isArray(v.state.history)||v.state.history.length||!Array.isArray(v.history)||v.history.length>5000||new Set(v.history.map(r=>r?.id)).size!==v.history.length||v.history.some(r=>!r||typeof r.id!=='string'||!r.id||r.id.length>200||! /^[a-f0-9]{64}$/.test(r.key)||! /^[a-f0-9]{64}$/.test(r.digest)))throw Error('The encrypted record index is invalid. Original files are kept.');
 return v;
}
/** Record identity/type are inside the authenticated ciphertext; index hashes
 * bind the chosen root to exact row versions. Encryption remains standard GCM. */
export async function decodeRecordState(raw:string,io:Pick<CryptoIO,'open'|'digest'>,lookup:(keys:string[])=>Promise<(CipherRow|null)[]>):Promise<State>{
 const plain=isVault(raw)?await io.open(raw):raw,value=parseSafeJson(plain),index=indexOf(value);
 if(!index)return readSavedState(plain);
 const vaultId=readEnvelope(raw).vaultId,rows=await lookup(index.history.map(r=>r.key)),history:Workout[]=[];
 if(rows.length!==index.history.length)throw Error('The encrypted record store returned an incomplete archive.');
 // Bound cryptographic/bridge concurrency rather than launching thousands at once.
 for(let start=0;start<rows.length;start+=4){
  const decoded=await Promise.all(rows.slice(start,start+4).map(async(row,n)=>{
   const ref=index.history[start+n];
   if(!row||row.key!==ref.key||row.vaultId!==vaultId||readEnvelope(row.raw).vaultId!==vaultId||await io.digest(row.raw)!==ref.digest)throw Error('A saved workout is missing or changed. Preserve the original archive and restore a verified backup.');
   const payload=parseSafeJson(await io.open(row.raw)) as {format:string;version:number;id:string;record:Workout};
   if(payload.format!=='movefield-history-record'||payload.version!==1||payload.id!==ref.id||payload.record?.id!==ref.id)throw Error('An encrypted record does not match its identity or type.');
   return payload.record;
  }));history.push(...decoded);
 }
 return readSavedState(JSON.stringify({...index.state,history}));
}
export function createRecordStateStorage(options:CryptoIO&{backend:RecordBackend;legacyRead:()=>Promise<string|null>;legacyWrite:(raw:string)=>Promise<void>}){
 let expected:string|null|undefined,tail:Promise<void>=Promise.resolve(),cache=new Map<string,{plain:string;ref:HistoryRef}>(),cacheVault='';
 const read=async()=>{
  await tail.catch(()=>undefined);
  // A second writer can prune an old row after we capture its root. Retry only
  // when the stored root actually changed; a stable damaged archive stays closed.
  for(let attempt=0;attempt<3;attempt++){
   const root=await options.backend.root(),raw=root??await options.legacyRead();
   try{
    if(raw===null){expected=root;cache=new Map();cacheVault='';return null}
    const state=await decodeRecordState(raw,options,keys=>options.backend.rows(keys));
    let nextVault='';const nextCache=new Map<string,{plain:string;ref:HistoryRef}>();
    if(isVault(raw)){
     const idx=indexOf(parseSafeJson(await options.open(raw)));nextVault=readEnvelope(raw).vaultId;
     if(idx)state.history.forEach((w,n)=>nextCache.set(w.id,{plain:stable(w),ref:idx.history[n]}));
    }
    expected=root;cacheVault=nextVault;cache=nextCache;return state;
   }catch(error){if(await options.backend.root()===root)throw error}
  }
  throw Error('The encrypted record store kept changing while opening. Reopen the current profile; saved records are kept.');
 };
 async function persist(state:State){
  readSavedState(JSON.stringify(state));
  const source=expected===undefined?await options.backend.root():expected;
  const refs:HistoryRef[]=[],changed:CipherRow[]=[];let vaultId='';
  // The index is sealed before the transaction as well; asynchronous crypto must
  // not let an IndexedDB transaction go idle and auto-commit halfway through.
  for(const w of state.history){
   // Schema validation may clone objects. Compare canonical content in memory;
   // plaintext fingerprints are never written to the database or backup.
   const known=cache.get(w.id),content=stable(w);
   if(known&&known.plain===content&&cacheVault){refs.push(known.ref);continue}
   const payload=stable({format:'movefield-history-record',version:1,id:w.id,record:w}),raw=await options.seal(payload),header=readEnvelope(raw);
   if(!vaultId)vaultId=header.vaultId;if(header.vaultId!==vaultId)throw Error('The device vault changed during encryption.');
   if(await options.open(raw)!==payload)throw Error('Encrypted record verification failed.');
   const key=await options.digest(raw),ref={id:w.id,key,digest:key};
   refs.push(ref);changed.push({key,vaultId:header.vaultId,raw});
  }
  const plain=JSON.stringify({format:'movefield-state-index',version:1,state:{...state,history:[]},history:refs}),root=await options.seal(plain),header=readEnvelope(root);
  if(vaultId&&vaultId!==header.vaultId||cacheVault&&cacheVault!==header.vaultId&&refs.some(r=>!changed.some(row=>row.key===r.key)))throw Error('Reopen the writer after changing the device key.');
  if(await options.open(root)!==plain)throw Error('Encrypted index verification failed.');
  const committed=await options.backend.commit(source,root,changed);
  try{await options.legacyWrite(root)}catch(e){
   // Remove only this failed transaction's newly introduced ciphertext while
   // restoring its previous root. A newer writer makes the whole rollback fail,
   // preserving its rows; preexisting records are never rollback cleanup targets.
   await options.backend.commit(root,source,[],committed?.introduced);throw e;
  }
  const needsPrune=changed.length>0||refs.length!==cache.size;
  expected=root;cacheVault=header.vaultId;cache=new Map(state.history.map((w,n)=>[w.id,{plain:stable(w),ref:refs[n]}]));
  // Cleanup is after durability. Failure leaves extra ciphertext, not a partial save.
  if(needsPrune)await options.backend.prune(header.vaultId,refs.map(r=>r.key),root).catch(()=>undefined);
  return root;
 }
 return {read,write(state:State){const task=tail.catch(()=>undefined).then(()=>persist(state));tail=task.then(()=>undefined);void tail.catch(()=>undefined);return task},flush:()=>tail,reset(){expected=undefined;cache=new Map();cacheVault=''}};
}
export async function encryptedRecordBundle(backend:RecordBackend,legacyRead:()=>Promise<string|null>){
 const legacy=await legacyRead(),snapshot=await backend.snapshot(),root=snapshot.root??legacy;if(root===null)return null;
 const rows=snapshot.rows;
 if(!rows.length&&(!legacy||legacy===root))return root;
 return JSON.stringify({format:'movefield-record-bundle',version:1,root,rows:rows.sort((a,b)=>a.key.localeCompare(b.key)),...(legacy&&legacy!==root?{originalIndexCache:legacy}:{})});
}
export function recordBundleRoot(raw:string):string{
 const value=parseSafeJson(raw,32*1024*1024) as {format?:string;version?:number;root?:string}|null;
 if(value?.format==='movefield-vault'){readEnvelope(raw);return raw}
 if(value?.format!=='movefield-record-bundle'||value.version!==1||typeof value.root!=='string')throw Error('This encrypted record bundle is invalid.');
 readEnvelope(value.root);return value.root;
}
export async function decodeRecordBundle(raw:string,io:Pick<CryptoIO,'open'|'digest'>):Promise<State>{
 const bundle=parseSafeJson(raw,32*1024*1024) as {format?:string;version?:number;root?:string;rows?:CipherRow[]}|null;
 if(bundle?.format==='movefield-vault'){readEnvelope(raw);return decodeRecordState(raw,io,async keys=>{if(!keys.length)return [];throw Error('This index needs its encrypted records. Choose the complete backup bundle.')})}
 if(bundle?.format!=='movefield-record-bundle'||bundle.version!==1||typeof bundle.root!=='string'||!Array.isArray(bundle.rows)||bundle.rows.length>10000||bundle.rows.some(r=>!r||typeof r.key!=='string'||typeof r.raw!=='string'||typeof r.vaultId!=='string'))throw Error('This encrypted record bundle is invalid.');
 const map=new Map(bundle.rows.map(r=>[r.key,r]));if(map.size!==bundle.rows.length)throw Error('The bundle contains duplicate records.');
 return decodeRecordState(bundle.root,io,async keys=>keys.map(k=>map.get(k)||null));
}
