import type {RecordBackend,CipherRow} from './record-state';
export interface AsyncDatabase{execAsync(sql:string):Promise<void>;getFirstAsync<T>(sql:string,...params:unknown[]):Promise<T|null>;getAllAsync<T>(sql:string,...params:unknown[]):Promise<T[]>;runAsync(sql:string,...params:unknown[]):Promise<unknown>;withExclusiveTransactionAsync(fn:(tx:AsyncDatabase)=>Promise<void>):Promise<void>}
export async function sqlRecordBackend(db:AsyncDatabase):Promise<RecordBackend>{
 await db.execAsync('CREATE TABLE IF NOT EXISTS encrypted_root(k TEXT PRIMARY KEY,v TEXT NOT NULL); CREATE TABLE IF NOT EXISTS encrypted_history(k TEXT PRIMARY KEY,vault TEXT NOT NULL,raw TEXT NOT NULL); CREATE INDEX IF NOT EXISTS encrypted_history_vault ON encrypted_history(vault);');
 return {
  root:async()=> (await db.getFirstAsync<{v:string}>('SELECT v FROM encrypted_root WHERE k=?','root'))?.v??null,
  rows:async keys=>{const found=new Map<string,CipherRow>();for(let start=0;start<keys.length;start+=400){const batch=keys.slice(start,start+400);for(const row of await db.getAllAsync<{k:string;vault:string;raw:string}>('SELECT k,vault,raw FROM encrypted_history WHERE k IN ('+batch.map(()=>'?').join(',')+')',...batch))found.set(row.k,{key:row.k,vaultId:row.vault,raw:row.raw})}return keys.map(k=>found.get(k)||null)},
  list:async vaultId=>(await db.getAllAsync<{k:string;vault:string;raw:string}>('SELECT k,vault,raw FROM encrypted_history WHERE vault=?',vaultId)).map(r=>({key:r.k,vaultId:r.vault,raw:r.raw})),
  snapshot:async()=>{let root:string|null=null,rows:CipherRow[]=[];await db.withExclusiveTransactionAsync(async tx=>{root=(await tx.getFirstAsync<{v:string}>('SELECT v FROM encrypted_root WHERE k=?','root'))?.v??null;const id=root?JSON.parse(root).vaultId:null;if(id)rows=(await tx.getAllAsync<{k:string;vault:string;raw:string}>('SELECT k,vault,raw FROM encrypted_history WHERE vault=?',id)).map(r=>({key:r.k,vaultId:r.vault,raw:r.raw}))});return {root,rows}},
  commit:async(expected,root,rows,discardKeys=[])=>{const introduced:string[]=[];await db.withExclusiveTransactionAsync(async tx=>{
   const current=(await tx.getFirstAsync<{v:string}>('SELECT v FROM encrypted_root WHERE k=?','root'))?.v??null;
   if(current!==expected)throw Error('The encrypted record store changed. Reopen the current profile before saving.');
   const keys=[...new Set(rows.map(row=>row.key))],existing=new Set<string>();
   for(let start=0;start<keys.length;start+=400){const batch=keys.slice(start,start+400);for(const row of await tx.getAllAsync<{k:string}>('SELECT k FROM encrypted_history WHERE k IN ('+batch.map(()=>'?').join(',')+')',...batch))existing.add(row.k)}
   introduced.push(...keys.filter(key=>!existing.has(key)));
   for(const row of rows)await tx.runAsync('INSERT OR REPLACE INTO encrypted_history(k,vault,raw) VALUES(?,?,?)',row.key,row.vaultId,row.raw);
   for(const key of discardKeys)await tx.runAsync('DELETE FROM encrypted_history WHERE k=?',key);
   if(root===null)await tx.runAsync('DELETE FROM encrypted_root WHERE k=?','root');else await tx.runAsync('INSERT OR REPLACE INTO encrypted_root(k,v) VALUES(?,?)','root',root);
  });return {introduced}},
  prune:async(vaultId,keys,expectedRoot)=>db.withExclusiveTransactionAsync(async tx=>{if((await tx.getFirstAsync<{v:string}>('SELECT v FROM encrypted_root WHERE k=?','root'))?.v!==expectedRoot)return;const keep=new Set(keys);for(const row of await tx.getAllAsync<{k:string}>('SELECT k FROM encrypted_history WHERE vault=?',vaultId))if(!keep.has(row.k))await tx.runAsync('DELETE FROM encrypted_history WHERE k=?',row.k)}),
  clear:async()=>db.withExclusiveTransactionAsync(async tx=>{await tx.runAsync('DELETE FROM encrypted_history');await tx.runAsync('DELETE FROM encrypted_root')}),
 };
}
