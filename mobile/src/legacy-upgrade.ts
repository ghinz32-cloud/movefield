import {xchacha20poly1305} from '@noble/ciphers/chacha.js';
import {sha256} from '@noble/hashes/sha2.js';
import {hex,unhex} from './shared/vault-format';
import {parseSafeJson,readSavedState,readSetupDraft} from './shared/saved-data';
import type {State} from './shared/training';

export const LEGACY_STATE='training-studio:mobile-local-demo:v1';
export const LEGACY_SETUP='training-studio:mobile-setup:v1';
export const LEGACY_JOURNAL='training-studio:mobile-restore:v1';
export const LEGACY_HISTORY='training-studio:mobile-history:v2:';
export const legacyDigest=(raw:string)=>hex(sha256(new TextEncoder().encode(raw)));
export type LegacySnapshot={revision:number;records:Record<string,string|null>};
export type LegacyKeys={active:string|null;restore:string|null};
export type UpgradeStage={format:'movefield-legacy-upgrade-v1';source:LegacySnapshot;state:State|null;setup:ReturnType<typeof readSetupDraft>|null};
const fail=(detail:string)=>Error(detail+' Original training and device keys are kept.');
const key=(raw:string|null)=>{if(raw!==null&&!/^[a-f0-9]{64}$/.test(raw))throw fail('The old device key is invalid.');return raw};
export function legacyOpen(raw:string,secret:string|null,slot:string):string{
 const value=parseSafeJson(raw,48_000_000) as Record<string,unknown>;
 if(!value||typeof value!=='object'||Array.isArray(value))throw fail('An old record has an unexpected format.');
 if(!['v','alg','nonce','data'].some(k=>k in value))return raw;
 if(Object.keys(value).sort().join(',')!=='alg,data,nonce,v'||value.v!==1||value.alg!=='xchacha20poly1305'||typeof value.nonce!=='string'||!/^[a-f0-9]{48}$/.test(value.nonce)||typeof value.data!=='string'||! /^(?:[a-f0-9]{2}){16,}$/.test(value.data))throw fail('An old encrypted record is damaged.');
 if(!key(secret))throw fail('The old device key is missing.');
 try{return new TextDecoder('utf-8',{fatal:true}).decode(xchacha20poly1305(unhex(secret!),unhex(value.nonce),new TextEncoder().encode(slot)).decrypt(unhex(value.data)))}catch{throw fail('The old encrypted record cannot be opened with its device key.')}
}
// Reject any field the current validator would discard. Schema 2 becomes 3;
// amounts, unknown loads, targets, IDs, dates and effort remain untouched.
function preserved(before:unknown,after:unknown,path='profile'):void{
 if(Array.isArray(before)){if(!Array.isArray(after)||before.length!==after.length)throw fail('An old '+path+' cannot be preserved.');before.forEach((v,n)=>preserved(v,after[n],path+'.'+n));return}
 if(before&&typeof before==='object'){if(!after||typeof after!=='object')throw fail('An old '+path+' cannot be preserved.');for(const [k,v]of Object.entries(before)){if(path==='profile'&&k==='schema'&&v===2&&(after as {schema?:number}).schema===3)continue;if(!Object.prototype.hasOwnProperty.call(after,k))throw fail('This build cannot preserve the old field '+path+'.'+k+'.');preserved(v,(after as Record<string,unknown>)[k],path+'.'+k)}return}
 if(before!==after)throw fail('This build cannot preserve the old field '+path+'.');
}
function restoreChoice(snapshot:LegacySnapshot,keys:LegacyKeys):{secret:string|null;skipSetup:boolean}{
 key(keys.active);const journalRaw=snapshot.records[LEGACY_JOURNAL]??null;
 if(keys.restore===null){if(journalRaw!==null)throw fail('The old restore recovery keys are missing.');return {secret:keys.active,skipSetup:false}}
 const ring=parseSafeJson(keys.restore) as {id:string;previous:string|null;next:string};
 if(!ring||Object.keys(ring).sort().join(',')!=='id,next,previous'||!/^[a-f0-9]{64}$/.test(ring.id)||!key(ring.next))throw fail('The old restore key ring is invalid.');key(ring.previous);
 if(journalRaw===null){if(keys.active!==ring.previous&&keys.active!==ring.next)throw fail('The old restore key ring conflicts with the active key.');return {secret:keys.active,skipSetup:false}}
 const journal=parseSafeJson(journalRaw,48_000_000) as {id:string;beforeHash:string|null;after:string;setupHash:string|null};
 const hash=(v:unknown)=>v===null||typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
 if(!journal||Object.keys(journal).sort().join(',')!=='after,beforeHash,id,setupHash'||journal.id!==ring.id||typeof journal.after!=='string'||!hash(journal.beforeHash)||!hash(journal.setupHash))throw fail('The old restore journal is invalid.');
 const raw=snapshot.records[LEGACY_STATE]??null;
 if((raw===null?null:legacyDigest(raw))===journal.beforeHash)return {secret:ring.previous,skipSetup:false};
 if(raw!==journal.after)throw fail('The old restore was interrupted at an unknown record.');
 // Authenticate the replacement even if it has no history.
 legacyOpen(raw,ring.next,LEGACY_STATE);
 const setup=snapshot.records[LEGACY_SETUP]??null;
 return {secret:ring.next,skipSetup:journal.setupHash!==null&&setup!==null&&legacyDigest(setup)===journal.setupHash};
}
export function decodeLegacyUpgrade(source:LegacySnapshot,keys:LegacyKeys):UpgradeStage{
 if(!Number.isSafeInteger(source.revision)||source.revision<0)throw fail('The old record generation is invalid.');
 const {secret,skipSetup}=restoreChoice(source,keys),raw=source.records[LEGACY_STATE]??null;let state:State|null=null;
 if(raw!==null){
  const plain=legacyOpen(raw,secret,LEGACY_STATE),value=parseSafeJson(plain,26_000_000) as Record<string,unknown>;let full:unknown=value;
  if(value.format!==undefined){
   const head=value as unknown as {format:string;state:Record<string,unknown>;entries:{slot:string;digest:string}[]};
   if(head.format!=='movefield-native-history-v2'||Object.keys(head).sort().join(',')!=='entries,format,state'||!head.state||'history' in head.state||!Array.isArray(head.entries)||head.entries.length>5000||new Set(head.entries.map(e=>e?.slot)).size!==head.entries.length)throw fail('The old history index is invalid.');
   let bytes=new TextEncoder().encode(JSON.stringify(head.state)).length;
   const history=head.entries.map(entry=>{
    if(!entry||Object.keys(entry).sort().join(',')!=='digest,slot'||typeof entry.slot!=='string'||!entry.slot.startsWith(LEGACY_HISTORY)||!/^[a-f0-9]{64}$/.test(entry.slot.slice(LEGACY_HISTORY.length))||!/^[a-f0-9]{64}$/.test(entry.digest))throw fail('The old history reference is invalid.');
    const cipher=source.records[entry.slot];if(!cipher)throw fail('An old saved workout is missing.');const text=legacyOpen(cipher,secret,entry.slot);
    bytes+=new TextEncoder().encode(text).length+1;if(bytes>24_000_000)throw fail('The old profile exceeds the supported 24 MB save limit.');
    if(legacyDigest(text)!==entry.digest)throw fail('An old saved workout has changed.');
    const workout=parseSafeJson(text) as {id:string};if(typeof workout.id!=='string'||LEGACY_HISTORY+legacyDigest(workout.id)!==entry.slot)throw fail('An old saved workout has a conflicting identity.');return workout;
   });full={...head.state,history};
  }
  state=readSavedState(JSON.stringify(full));preserved(full,state);
 }
 let setup:ReturnType<typeof readSetupDraft>|null=null;const setupRaw=source.records[LEGACY_SETUP]??null;
 if(setupRaw!==null&&!skipSetup){const plain=legacyOpen(setupRaw,secret,LEGACY_SETUP);setup=readSetupDraft(plain);preserved(parseSafeJson(plain),setup,'setup')}
 return {format:'movefield-legacy-upgrade-v1',source,state,setup};
}

export interface UpgradeIO{
 complete():Promise<boolean>;
 ready():Promise<boolean>;
 qualify():Promise<void>;
 stage():Promise<UpgradeStage|null>;
 source():Promise<{snapshot:LegacySnapshot;keys:LegacyKeys}|null>;
 hasTarget():Promise<boolean>;
 retain(stage:UpgradeStage):Promise<void>;
 install(stage:UpgradeStage):Promise<void>;
 verify(stage:UpgradeStage):Promise<void>;
 finish():Promise<void>;
}
/** A completed receipt prevents old training resurfacing after edits/erasure.
 * Until it exists, a durable encrypted stage resumes after any failed write. */
export async function reconcileLegacyUpgrade(io:UpgradeIO):Promise<void>{
 if(await io.complete())return;
 let stage=await io.stage();
 if(!stage){
  const source=await io.source();if(!source)return;
  if(await io.hasTarget())throw fail('Current and old saved profiles coexist without an upgrade receipt.');
  stage=decodeLegacyUpgrade(source.snapshot,source.keys);
  await io.retain(stage);
 }
 if(!await io.ready()){
  const latest=await io.source();
  if(!latest||JSON.stringify(latest.snapshot)!==JSON.stringify(stage.source))throw fail('The old records changed during upgrade preparation.');
  await io.qualify();
 }
 await io.install(stage);await io.verify(stage);await io.finish();
}
