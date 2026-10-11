/** Versioned authenticated envelopes. No keys or decrypted records belong here. */
export type VaultEnvelope = {format:'movefield-vault';version:1;algorithm:'AES-256-GCM';vaultId:string;purpose:'state'|'setup';schema:2;keyVersion:1;kdf:'PBKDF2-SHA256'|'platform';iterations:number;salt:string;iv:string;ciphertext:string};
export const VAULT_ITERATIONS = 600_000;
export function hex(bytes:Uint8Array):string{return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')}
export function unhex(value:string):Uint8Array{if(!/^(?:[a-f0-9]{2})*$/.test(value))throw Error('Invalid encrypted file.');return Uint8Array.from(value.match(/../g)||[],x=>parseInt(x,16))}
export function vaultAAD(e:Omit<VaultEnvelope,'ciphertext'>|VaultEnvelope):string{return JSON.stringify(['movefield-vault',e.version,e.algorithm,e.vaultId,e.purpose,e.schema,e.keyVersion,e.kdf,e.iterations,e.salt])}
export function readEnvelope(raw:string):VaultEnvelope{
 if(raw.length>10_002_000||new TextEncoder().encode(raw).length>10_002_000)throw Error('Encrypted file exceeds the supported size.');
 const e=JSON.parse(raw);
 const fields=['format','version','algorithm','vaultId','purpose','schema','keyVersion','kdf','iterations','salt','iv','ciphertext'];
 if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).length!==fields.length||Object.keys(e).some(k=>!fields.includes(k))||e.format!=='movefield-vault'||e.version!==1||e.algorithm!=='AES-256-GCM'||!/^[a-f0-9]{32}$/.test(e.vaultId)||!['state','setup'].includes(e.purpose)||e.schema!==2||e.keyVersion!==1||!['PBKDF2-SHA256','platform'].includes(e.kdf)||e.iterations!==(e.kdf==='platform'?0:VAULT_ITERATIONS)||typeof e.salt!=='string'||!/^[a-f0-9]{32}$/.test(e.salt)||typeof e.iv!=='string'||!/^[a-f0-9]{24}$/.test(e.iv)||typeof e.ciphertext!=='string'||e.ciphertext.length<32||! /^(?:[a-f0-9]{2})+$/.test(e.ciphertext))throw Error('This encrypted file is damaged or uses an unsupported format. It has not been replaced.');
 return e as VaultEnvelope;
}

export function isVault(raw:string){if(raw.length>10_002_000)throw Error("Encrypted file exceeds the supported size.");try{return JSON.parse(raw)?.format==='movefield-vault'}catch{return false}}
