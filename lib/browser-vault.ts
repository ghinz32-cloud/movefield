import {hex,unhex,readEnvelope,vaultAAD,VAULT_ITERATIONS,type VaultEnvelope} from './vault-format';
function random(size:number){return hex(crypto.getRandomValues(new Uint8Array(size)))}
const encode=(value:string)=>new TextEncoder().encode(value);
export class BrowserVault {
 private constructor(private key:CryptoKey,readonly header:Omit<VaultEnvelope,'iv'|'ciphertext'>){}
 static async open(passphrase:string,raw?:string){
  if(!crypto.subtle)throw Error('Encrypted storage requires a secure browser connection.');
  if(!raw&&passphrase.length<12)throw Error('Use a passphrase of at least 12 characters. Keep it somewhere safe; we cannot recover it.');
  const e=raw?readEnvelope(raw):null;
  if(e&&(e.kdf!=='PBKDF2-SHA256'||e.purpose!=='state'))throw Error('This file belongs to another vault type.');
  const header={format:'movefield-vault' as const,version:1 as const,algorithm:'AES-256-GCM' as const,vaultId:e?.vaultId||random(16),purpose:'state' as const,schema:2 as const,keyVersion:1 as const,kdf:'PBKDF2-SHA256' as const,iterations:VAULT_ITERATIONS,salt:e?.salt||random(16)};
  const material=await crypto.subtle.importKey('raw',encode(passphrase),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:unhex(header.salt) as Uint8Array<ArrayBuffer>,iterations:header.iterations},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const vault=new BrowserVault(key,header);
  if(raw)await vault.decrypt(raw);
  return vault;
 }
 async encrypt(plain:string,purpose:'state'|'setup'='state'){
  if(encode(plain).length>5_000_000)throw Error('Your backup is too large for this vault. Export before adding more records.');
  const e={...this.header,purpose,iv:random(12)};
  const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv:unhex(e.iv) as Uint8Array<ArrayBuffer>,additionalData:encode(vaultAAD(e)),tagLength:128},this.key,encode(plain));
  return JSON.stringify({...e,ciphertext:hex(new Uint8Array(bytes))});
 }
 async decrypt(raw:string,purpose:'state'|'setup'='state'){
  const e=readEnvelope(raw);
  if(e.vaultId!==this.header.vaultId||e.salt!==this.header.salt||e.kdf!==this.header.kdf||e.purpose!==purpose)throw Error('This encrypted file belongs to another profile or record type.');
  try{const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(e.iv) as Uint8Array<ArrayBuffer>,additionalData:encode(vaultAAD(e)),tagLength:128},this.key,unhex(e.ciphertext) as Uint8Array<ArrayBuffer>);return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw Error('The passphrase is incorrect or this file is damaged. Your saved bytes are unchanged.')}
 }
}
