import {createBrowserQwenStore} from './browser-qwen-cache';
import {qwenCandidates} from './qwen-catalog';
import {createQwenDownloader} from './qwen-download';
import {QWEN_BROWSER_MODEL_ID} from './qwen-network-policy';
import {QWEN_CONTEXT_TOKENS,QWEN_OUTPUT_TOKENS,QWEN_MAX_FILE_BYTES,cachedQwenFetch,verifiedQwenCache,qwenPromptFits,type QwenWorkerReply} from './qwen-runtime-contract';
import type {MLCEngine} from '@mlc-ai/web-llm';
import type {Tokenizer} from '@mlc-ai/web-tokenizers';
import {loadQwenTokenizer} from './qwen-tokenizer';

const scope=self as unknown as {postMessage:(v:QwenWorkerReply)=>void;onmessage:((v:MessageEvent)=>void)|null;fetch:typeof fetch};
let engine:MLCEngine|null=null,tokenizer:Tokenizer|null=null,busy=false;
const model=qwenCandidates.find(m=>m.id===QWEN_BROWSER_MODEL_ID)!;
// A dedicated worker has no window. Supply its own standard storage APIs
// rather than the download screen's window-based environment discovery.
const store=createBrowserQwenStore({indexedDB,keyRange:IDBKeyRange,locks:navigator.locks,
 random:length=>crypto.getRandomValues(new Uint8Array(length)),estimate:()=>navigator.storage?.estimate()??Promise.resolve({})});
const client=createQwenDownloader({models:[model],store,fetchAsset:async()=>{throw Error('Runtime cannot download files.');}});
const signal=new AbortController().signal;
const send=(id:string,kind:QwenWorkerReply['kind'],extra:Partial<QwenWorkerReply>={})=>scope.postMessage({id,kind,...extra});

async function load(id:string){
 if(engine&&tokenizer){send(id,'ready',{loadMs:0});return;}
 const started=performance.now(),base=`https://movefield.invalid/${crypto.randomUUID()}/`;
 // Prevent upstream cache reads/writes and transport fallbacks. Public weights
 // live only in the app's verified cache; requests never reach a network API.
 Object.defineProperty(self,'XMLHttpRequest',{value:class{constructor(){throw Error('Runtime transport refused.');}},configurable:true});
 await client.withCachedModel(model.id,signal,async open=>{
  const read=async(path:string)=>{
   const asset=model.assets.find(a=>a.path===path);if(!asset||asset.bytes>QWEN_MAX_FILE_BYTES)throw Error('Runtime file limit.');
   const bytes=new Uint8Array(asset.bytes);let offset=0;
   for await(const piece of open(path)){bytes.set(piece,offset);offset+=piece.length;}
   if(offset!==asset.bytes)throw Error('Incomplete runtime file.');
   return bytes.buffer;
  };
  scope.fetch=cachedQwenFetch(base,model.assets.map(a=>a.path),read);
  Object.defineProperty(self,'caches',{value:verifiedQwenCache(base,model.assets.map(a=>a.path),scope.fetch),configurable:true});
  const [{MLCEngine},loadedTokenizer]=await Promise.all([import('@mlc-ai/web-llm'),read('tokenizer.json').then(loadQwenTokenizer)]);
  tokenizer=loadedTokenizer;
  engine=new MLCEngine({logLevel:'SILENT',appConfig:{model_list:[{model_id:model.modelId!,model:base,model_lib:new URL(model.assets.find(a=>a.path.endsWith('.wasm'))!.path,base).href,required_features:model.requiredFeatures}]},initProgressCallback:report=>send(id,'progress',{progress:Math.max(0,Math.min(1,report.progress))})});
  await engine.reload(model.modelId!,{context_window_size:QWEN_CONTEXT_TOKENS,sliding_window_size:-1});
 });
 // Any unexpected later fetch remains blocked after releasing the model lock.
 scope.fetch=async()=>{throw Error('Runtime transport refused.');};
 send(id,'ready',{loadMs:Math.round(performance.now()-started)});
}

scope.onmessage=async(event)=>{
 const v=event.data;if(!v||typeof v.id!=='string'||!/^[A-Za-z0-9_-]{8,100}$/.test(v.id)||!['load','generate'].includes(v.kind))return;
 if(busy){send(v.id,'error',{message:'A sample is already running.'});return;}
 busy=true;
 try{
  if(v.kind==='load'){await load(v.id);return;}
  if(!engine||!tokenizer||typeof v.prompt!=='string'||v.prompt.length>6400)throw Error('Model unavailable.');
  const promptTokens=tokenizer.encode(v.prompt).length;
  if(!qwenPromptFits(promptTokens)){send(v.id,'error',{message:'This sample exceeds the model context. Choose a shorter question.'});return;}
  await engine.resetChat();const started=performance.now();
  const result=await engine.completions.create({model:model.modelId!,prompt:v.prompt,max_tokens:QWEN_OUTPUT_TOKENS,temperature:0.7,top_p:0.8,seed:42,stream:false});
  const output=result.choices[0],usage=result.usage;
  if(output?.finish_reason!=='stop'||usage?.prompt_tokens!==promptTokens||!qwenPromptFits(usage.prompt_tokens)||usage.completion_tokens>QWEN_OUTPUT_TOKENS)throw Error('Incomplete or mismatched output.');
  send(v.id,'result',{reply:output.text,promptTokens,outputTokens:usage.completion_tokens,generationMs:Math.round(performance.now()-started)});
 }catch{engine=null;tokenizer?.dispose();tokenizer=null;send(v.id,'error',{message:'Qwen could not complete this sample. Check model files and browser GPU support, then retry.'});}
 finally{busy=false;}
};
