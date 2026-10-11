import {pbkdf2Async} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
import {AESEncryptionKey,AESSealedData,aesEncryptAsync,aesDecryptAsync,getRandomBytesAsync} from 'expo-crypto';
import {hex,unhex,readEnvelope,vaultAAD,VAULT_ITERATIONS,type VaultEnvelope} from './shared/vault-format';
export const cloudDigest=async(raw:string)=>hex(sha256(new TextEncoder().encode(raw)));
export class NativeCloudVault{
 private constructor(private key:AESEncryptionKey,readonly header:Omit<VaultEnvelope,'iv'|'ciphertext'>){}
 static async open(passphrase:string,raw?:string){
  if(passphrase.length>1024||(!raw&&passphrase.length<12))throw Error('Use a cloud recovery passphrase of 12 to 1,024 characters. Keep it separately; the app cannot recover it.');
  const e=raw?readEnvelope(raw):null;if(e&&(e.kdf!=='PBKDF2-SHA256'||e.purpose!=='state'))throw Error('This cloud backup uses an unsupported vault type.');
  const header={format:'movefield-vault' as const,version:1 as const,algorithm:'AES-256-GCM' as const,vaultId:e?.vaultId||hex(await getRandomBytesAsync(16)),purpose:'state' as const,schema:2 as const,keyVersion:1 as const,kdf:'PBKDF2-SHA256' as const,iterations:VAULT_ITERATIONS,salt:e?.salt||hex(await getRandomBytesAsync(16))};
  const password=new TextEncoder().encode(passphrase),derived=await pbkdf2Async(sha256,password,unhex(header.salt),{c:VAULT_ITERATIONS,dkLen:32});password.fill(0);
  let key;try{key=await AESEncryptionKey.import(derived)}finally{derived.fill(0)}const vault=new NativeCloudVault(key,header);if(raw)await vault.decrypt(raw);return vault;
 }
 async encrypt(plain:string){
  const bytes=new TextEncoder().encode(plain);if(bytes.length>5_000_000)throw Error('This profile exceeds the supported cloud vault size.');
  const iv=await getRandomBytesAsync(12),e={...this.header,iv:hex(iv)};const sealed=await aesEncryptAsync(bytes,this.key,{nonce:{bytes:iv},tagLength:16,additionalData:new TextEncoder().encode(vaultAAD(e))});return JSON.stringify({...e,ciphertext:hex(await sealed.ciphertext({includeTag:true}))});
 }
 async decrypt(raw:string){const e=readEnvelope(raw);if(e.vaultId!==this.header.vaultId||e.salt!==this.header.salt||e.kdf!=='PBKDF2-SHA256'||e.purpose!=='state')throw Error('This backup belongs to another cloud vault.');try{const bytes=await aesDecryptAsync(AESSealedData.fromParts(unhex(e.iv),unhex(e.ciphertext),16),this.key,{additionalData:new TextEncoder().encode(vaultAAD(e))});return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw Error('The cloud passphrase is incorrect or the backup is damaged. Local records are kept.')}}
}
