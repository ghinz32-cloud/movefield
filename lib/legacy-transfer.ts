import {parseSafeJson} from './saved-data';
import {unhex} from './vault-format';
import {readPreservedState} from './preserved-state';
import type {State} from './training';

// Read-only compatibility with the exact October 9 web/phone transfer writer.
// The imported header cannot choose a more expensive KDF or a different cipher.
export const LEGACY_TRANSFER_MAX_BYTES=48_002_000;
const MAX_PLAIN_BYTES=24_000_000;
type Envelope={format:'movefield-transfer';version:1;source:'web'|'phone';createdAt:string;kdf:{name:'argon2id';m:19456;t:2;p:1;salt:string};cipher:'xchacha20poly1305';nonce:string;data:string};
const error=(message:string)=>Error(message+' Current records and the original file are kept.');

export function isLegacyTransfer(raw:string):boolean {
 if(raw.length>LEGACY_TRANSFER_MAX_BYTES)return false;
 try{return JSON.parse(raw)?.format==='movefield-transfer'}catch{return false}
}

function envelope(raw:string):Envelope {
 const value=parseSafeJson(raw,LEGACY_TRANSFER_MAX_BYTES) as Envelope;
 if(!value||typeof value!=='object'||Array.isArray(value)||value.format!=='movefield-transfer')throw error('This is not an older password-protected backup.');
 if(value.version!==1)throw error('This transfer file version is unsupported.');
 const keys=(object:object)=>Object.keys(object).sort().join(',');
 if(keys(value)!=='cipher,createdAt,data,format,kdf,nonce,source,version'||!value.kdf||typeof value.kdf!=='object'||Array.isArray(value.kdf)||keys(value.kdf)!=='m,name,p,salt,t'
  ||value.kdf.name!=='argon2id'||value.kdf.m!==19456||value.kdf.t!==2||value.kdf.p!==1
  ||typeof value.kdf.salt!=='string'||!/^[a-f0-9]{32}$/.test(value.kdf.salt)
  ||value.cipher!=='xchacha20poly1305'||typeof value.nonce!=='string'||!/^[a-f0-9]{48}$/.test(value.nonce)
  ||!['web','phone'].includes(value.source)||typeof value.createdAt!=='string'||value.createdAt.length>100
  ||typeof value.data!=='string'||value.data.length<34||value.data.length>(MAX_PLAIN_BYTES+16)*2||value.data.length%2!==0||! /^[a-f0-9]+$/.test(value.data))throw error('This older backup is damaged or uses unsupported settings.');
 return value;
}

export async function openLegacyTransfer(raw:string,password:string):Promise<State> {
 const value=envelope(raw);
 if(!password)throw error('Enter the password used to create this transfer file.');
 if(password.length>2048)throw error('This password exceeds the supported length.');
 const normalized=password.normalize('NFC');if([...normalized].length>1024)throw error('This password exceeds the supported length.');
 const encoded=new TextEncoder().encode(normalized);let key:Uint8Array|undefined,plain:Uint8Array|undefined;
 try {
  const [{argon2idAsync},{xchacha20poly1305}]=await Promise.all([import('@noble/hashes/argon2.js'),import('@noble/ciphers/chacha.js')]);
  key=await argon2idAsync(encoded,unhex(value.kdf.salt),{m:19456,t:2,p:1,dkLen:32});
  const aad=new TextEncoder().encode(JSON.stringify([value.format,value.version,value.source,value.createdAt,value.kdf.name,value.kdf.m,value.kdf.t,value.kdf.p,value.kdf.salt,value.cipher,value.nonce]));
  try{plain=xchacha20poly1305(key,unhex(value.nonce),aad).decrypt(unhex(value.data))}
  catch{throw error('The password is incorrect or this transfer file has changed.');}
  if(plain.length>MAX_PLAIN_BYTES)throw error('This backup exceeds the supported profile size.');
  return readPreservedState(new TextDecoder('utf-8',{fatal:true}).decode(plain));
 }finally{encoded.fill(0);key?.fill(0);plain?.fill(0)}
}
