import {readEnvelope} from './vault-format';
import {readSavedState} from './saved-data';
import type {State} from './training';
export type PortableVault={encrypt:(raw:string)=>Promise<string>;decrypt:(raw:string)=>Promise<string>};
export type PendingBackup={version:1;ownerId:string;expectedRevision:number;operationId:string;ciphertext:string};
export type CloudSnapshot={ownerId:string;revision:number;ciphertext:string|null;digest:string|null};
export type CloudTransport=(path:string,method?:string,body?:unknown)=>Promise<unknown>;
export type Outbox={read:()=>Promise<string|null>;write:(raw:string)=>Promise<void>;clear:(expected?:string)=>Promise<void>};
function personalCloudState(state:State){if(state.profile.age<18)throw Error('Personal youth cloud use awaits verified privacy safeguards. Your local profile is kept.');if(state.active?.demo||state.history.some(w=>w.demo))throw Error('Sample workout records cannot be placed in a private cloud profile. Your local records are kept.');}
export function readPending(raw:string):PendingBackup{
 const p=JSON.parse(raw);if(!p||Object.keys(p).sort().join(',')!=='ciphertext,expectedRevision,operationId,ownerId,version'||p.version!==1||typeof p.ownerId!=='string'||p.ownerId.length>150||!Number.isSafeInteger(p.expectedRevision)||p.expectedRevision<0||! /^[a-f0-9-]{36}$/.test(p.operationId))throw Error('The queued backup is invalid. It has been kept for recovery.');
 const e=readEnvelope(p.ciphertext);if(e.kdf!=='PBKDF2-SHA256'||e.purpose!=='state')throw Error('This queued backup has an unsupported vault type.');return p;
}
export async function fetchSnapshot(api:CloudTransport,ownerId:string,digest:(raw:string)=>Promise<string>):Promise<CloudSnapshot>{
 const p=await api('/api/cloud/profile') as CloudSnapshot;
 if(!p||p.ownerId!==ownerId||!Number.isSafeInteger(p.revision)||p.revision<0||(p.ciphertext===null?(p.revision!==0||p.digest!==null):typeof p.ciphertext!=='string'||typeof p.digest!=='string'))throw Error('The cloud backup response could not be verified.');
 if(p.ciphertext!==null){const envelope=readEnvelope(p.ciphertext);if(envelope.kdf!=='PBKDF2-SHA256'||envelope.purpose!=='state'||await digest(p.ciphertext)!==p.digest)throw Error('The cloud backup failed verification. Your local profile is kept.');}return p;
}
export async function previewSnapshot(snapshot:CloudSnapshot,vault:PortableVault){if(!snapshot.ciphertext)throw Error('There is no saved cloud backup.');const state=readSavedState(await vault.decrypt(snapshot.ciphertext));personalCloudState(state);return state}
export async function queueBackup(outbox:Outbox,ownerId:string,revision:number,state:State,vault:PortableVault,operationId:string){
 personalCloudState(state);
 if(await outbox.read())throw Error('Retry or discard the queued backup before saving another.');
 const plain=JSON.stringify(state);readSavedState(plain);const ciphertext=await vault.encrypt(plain);if(await vault.decrypt(ciphertext)!==plain)throw Error('Cloud encryption could not be verified.');
 const pending:PendingBackup={version:1,ownerId,expectedRevision:revision,operationId,ciphertext},raw=JSON.stringify(pending);readPending(raw);await outbox.write(raw);if(await outbox.read()!==raw)throw Error('The encrypted retry queue could not be verified. Your local profile is kept.');return pending;
}
export async function retryBackup(api:CloudTransport,outbox:Outbox,ownerId:string,digest:(raw:string)=>Promise<string>){
 const raw=await outbox.read();if(!raw)throw Error('There is no queued backup.');const pending=readPending(raw);if(pending.ownerId!==ownerId)throw Error('This backup belongs to another signed-in account. Sign in to that account to retry it.');
 const result=await api('/api/cloud/profile','POST',{expectedRevision:pending.expectedRevision,operationId:pending.operationId,ciphertext:pending.ciphertext}) as {revision:number;digest:string};
 if(result?.revision!==pending.expectedRevision+1||result.digest!==await digest(pending.ciphertext))throw Error('Cloud acknowledgement could not be verified. Retry the queued backup.');
 // Clear only the exact operation that was acknowledged; never a newer queue.
 if(await outbox.read()!==raw)throw Error('The retry queue changed while saving. Review it before continuing.');await outbox.clear(raw);return result.revision;
}
