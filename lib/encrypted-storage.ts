import {isVault} from './vault-format';
/** Platform-independent vault IO. Writes and migrations acknowledge durability only after readback. */
export function encryptedStorage(options:{read:()=>Promise<string|null>;write:(raw:string)=>Promise<void>;encrypt:(raw:string)=>Promise<string>;decrypt:(raw:string)=>Promise<string>;validate:(raw:string)=>void}){
 let tail:Promise<void>=Promise.resolve();
 async function persist(plain:string){const encrypted=await options.encrypt(plain);const verified=await options.decrypt(encrypted);options.validate(verified);if(verified!==plain)throw Error('Encrypted verification failed.');await options.write(encrypted);if(await options.read()!==encrypted)throw Error('Encrypted save could not be verified. Keep the app open and export.');}
 return {
  async read(){await tail.catch(()=>undefined);const raw=await options.read();if(raw===null)return null;const plain=isVault(raw)?await options.decrypt(raw):raw;options.validate(plain);return plain},
  write(plain:string){options.validate(plain);const operation=tail.catch(()=>undefined).then(()=>persist(plain));tail=operation;return operation},
  migrate(){const operation=tail.catch(()=>undefined).then(async()=>{const raw=await options.read();if(raw===null||isVault(raw))return;options.validate(raw);await persist(raw)});tail=operation;return operation},
  flush:()=>tail,
 };
}
