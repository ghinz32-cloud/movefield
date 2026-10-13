// Reproducible CPU smoke inspection of the actual browser-target build. These
// standard worker/storage APIs are fixtures; this is NOT WebGPU/browser QA.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{indexedDB,IDBKeyRange}=require('fake-indexeddb');
const input=process.argv[2];if(!input)throw Error('Pass the local pinned tokenizer.json; this test never downloads files.');
const bytes=fs.readFileSync(input),manifest=JSON.parse(fs.readFileSync('lib/qwen-assets.json','utf8'));
const asset=manifest.models.find(m=>m.id==='web-qwen3-0.6b-q4f16_1-mlc').assets.find(a=>a.path==='tokenizer.json');
if(bytes.length!==asset.bytes||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Tokenizer fingerprint mismatch.');
const file=fs.readdirSync('public/runtime').find(n=>n.startsWith('lib-')&&fs.readFileSync('public/runtime/'+n,'utf8').includes('.tokenizers'));
if(!file)throw Error('Build the browser worker first.');
const names=['process','self','importScripts','location','navigator','indexedDB','IDBKeyRange','postMessage','fetch'];
const originals=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
const define=(key,value)=>Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
define('self',globalThis);define('importScripts',()=>{throw Error('Unexpected script transport')});
define('location',{href:pathToFileURL(process.cwd()+'/public/runtime/'+file).href,origin:'https://movefield.test'});
define('navigator',{locks:{request:async(_name,_options,fn)=>fn()},storage:{estimate:async()=>({})}});
define('indexedDB',indexedDB);define('IDBKeyRange',IDBKeyRange);
define('postMessage',()=>{throw Error('No model request should run in this inspection')});
define('fetch',async()=>{throw Error('Unexpected network request')});define('process',undefined);
try{
 const imported=await import(globalThis.location.href);
 const Constructor=imported.Tokenizer||imported.default?.Tokenizer||globalThis.tokenizers?.Tokenizer;
 if(!Constructor)throw Error('Bundled tokenizer export missing.');
 const tokenizer=await Constructor.fromJSON(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 if(tokenizer.encode('A completed workout').length!==3)throw Error('Unexpected real-tokenizer result.');
 tokenizer.dispose();
 console.log('PASS browser-target worker initialization and real tokenizer, with all network fetches refused. Standard worker APIs are fixtures; no WebGPU/model inference measured.');
}finally{for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
