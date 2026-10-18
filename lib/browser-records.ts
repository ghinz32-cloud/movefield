import {createRecordStateStorage,encryptedRecordBundle,type RecordBackend,type CipherRow} from './record-state';
import {BrowserVault} from './browser-vault';
import {PERSONAL_STATE_KEY,StorageConflict} from './browser-state';
import {hex,readEnvelope} from './vault-format';
const name='movefield-private-records-v1';
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
function connection(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{r.result.createObjectStore('meta');r.result.createObjectStore('rows',{keyPath:'key'}).createIndex('vaultId','vaultId')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other app windows before updating local storage.'))})}
async function read<T>(fn:(db:IDBDatabase)=>Promise<T>){const db=await connection();try{return await fn(db)}finally{db.close()}}
export const browserRecordBackend:RecordBackend={
 root:()=>read(db=>request(db.transaction('meta').objectStore('meta').get('root')).then(x=>x??null)),
 rows:keys=>read(db=>{const store=db.transaction('rows').objectStore('rows');return Promise.all(keys.map(k=>request<CipherRow|undefined>(store.get(k)).then(r=>r||null)))}),
 list:vaultId=>read(db=>request(db.transaction('rows').objectStore('rows').index('vaultId').getAll(vaultId))),
 snapshot:()=>read(db=>new Promise((resolve,reject)=>{const tx=db.transaction(['meta','rows']),get=tx.objectStore('meta').get('root');let root:string|null=null,rows:CipherRow[]=[];get.onsuccess=()=>{root=get.result??null;if(root){const id=JSON.parse(root).vaultId;if(id){const query=tx.objectStore('rows').index('vaultId').getAll(id);query.onsuccess=()=>{rows=query.result}}}};tx.oncomplete=()=>resolve({root,rows});tx.onabort=()=>reject(tx.error)})),
 commit:(expected,root,rows,discardKeys=[])=>read(db=>new Promise<{introduced:string[]}>((resolve,reject)=>{
  const tx=db.transaction(['meta','rows'],'readwrite'),meta=tx.objectStore('meta'),store=tx.objectStore('rows'),get=meta.get('root'),introduced=new Set<string>();let conflict=false;
  get.onsuccess=()=>{if((get.result??null)!==expected){conflict=true;tx.abort();return}for(const row of rows){const before=store.get(row.key);before.onsuccess=()=>{if(before.result===undefined)introduced.add(row.key)};store.put(row)}for(const key of discardKeys)store.delete(key);if(root===null)meta.delete('root');else meta.put(root,'root')};
  tx.oncomplete=()=>resolve({introduced:[...introduced]});tx.onabort=()=>reject(conflict?new StorageConflict():tx.error||Error('Local record transaction was aborted.'));tx.onerror=()=>{};
 })),
 prune:(vaultId,keys,expectedRoot)=>read(db=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(['meta','rows'],'readwrite'),store=tx.objectStore('rows'),get=tx.objectStore('meta').get('root'),keep=new Set(keys);get.onsuccess=()=>{if(get.result!==expectedRoot)return;const cursor=store.index('vaultId').openCursor(vaultId);cursor.onsuccess=()=>{const c=cursor.result;if(c){if(!keep.has(c.value.key))c.delete();c.continue()}}};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error)})),
 clear:()=>read(db=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(['meta','rows'],'readwrite');tx.objectStore('meta').clear();tx.objectStore('rows').clear();tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error)})),
};
export const recordDigest=async(raw:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))));
export function browserRecordStore(vault:()=>BrowserVault|null,expectedCache:()=>string,onCache:(raw:string)=>void){return createRecordStateStorage({backend:browserRecordBackend,digest:recordDigest,seal:async plain=>{const key=vault();if(!key)throw Error('Unlock the private profile before saving.');return key.encrypt(plain)},open:async raw=>{const key=vault();if(!key)throw Error('Unlock the private profile before reading.');return key.decrypt(raw)},legacyRead:async()=>localStorage.getItem(PERSONAL_STATE_KEY),legacyWrite:async raw=>{if((localStorage.getItem(PERSONAL_STATE_KEY)||'')!==expectedCache())throw new StorageConflict();localStorage.setItem(PERSONAL_STATE_KEY,raw);if(localStorage.getItem(PERSONAL_STATE_KEY)!==raw)throw Error('Local index cache could not be verified.');onCache(raw)}})}
export const originalRecordBundle=()=>encryptedRecordBundle(browserRecordBackend,async()=>localStorage.getItem(PERSONAL_STATE_KEY));

/** Call only after a replacement vault and its cache projection are acknowledged.
 * The root check and deletion share a transaction, so a newer writer or an abort
 * cannot strand the current archive. Downloaded backups are separate copies. */
export function retireBrowserVaultRecords(expectedRoot:string):Promise<number>{
 const vaultId=readEnvelope(expectedRoot).vaultId;
 return read(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['meta','rows'],'readwrite'),get=tx.objectStore('meta').get('root');let conflict=false,removed=0;
  get.onsuccess=()=>{
   if(get.result!==expectedRoot){conflict=true;tx.abort();return}
   const cursor=tx.objectStore('rows').openCursor();
   cursor.onsuccess=()=>{const row=cursor.result;if(row){if(row.value.vaultId!==vaultId){row.delete();removed++}row.continue()}};
  };
  tx.oncomplete=()=>resolve(removed);
  tx.onabort=()=>reject(Error(conflict?'The profile changed after the passphrase update. Older encrypted records are kept; reopen and retry cleanup.':'The passphrase changed, but older encrypted records could not be removed. Keep the current passphrase and retry cleanup.'));
  tx.onerror=()=>{};
 }));
}
