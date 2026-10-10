import {GROUNDING_PROMPT,createGroundedReviewRequest,type GroundedReviewRequest} from './fitness-grounding';
import type {ReviewContext} from './workout-review';

export const QWEN_CONTEXT_TOKENS=2048, QWEN_OUTPUT_TOKENS=256;
export const QWEN_MAX_FILE_BYTES=80*1024*1024;
// Raw completion uses Qwen's chat delimiters, with an empty thinking prefix.
// Escape delimiters inside serialized data so imported text cannot become a role.
export function qwenCompletionPrompt(request:GroundedReviewRequest){
 if(request.system!==GROUNDING_PROMPT||request.system.length+request.user.length>6000)throw Error('Invalid evidence request.');
 const data=request.user.replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
 return `<|im_start|>system\n${request.system}<|im_end|>\n<|im_start|>user\n${data}<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n`;
}
export function qwenPromptFits(tokens:number){return Number.isSafeInteger(tokens)&&tokens>0&&tokens+QWEN_OUTPUT_TOKENS<=QWEN_CONTEXT_TOKENS;}
export function qwenRequest(context:ReviewContext,query:string,id:string){return createGroundedReviewRequest(context,{query,requestId:id});}

// No network fallback. Every runtime request resolves to a fully reverified file.
export function cachedQwenFetch(base:string,paths:readonly string[],read:(path:string)=>Promise<ArrayBuffer>):typeof fetch{
 const files=new Map(paths.map(path=>[new URL(path,base).href,path]));
 return async(input,init)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  const method=init?.method||(input instanceof Request?input.method:'GET');
  if(method!=='GET'||init?.body!=null||(input instanceof Request&&input.body)||(init?.signal||(input instanceof Request?input.signal:undefined))?.aborted)throw Error('Runtime request refused.');
  const path=files.get(url);if(!path)throw Error('Runtime file outside verified cache.');
  const bytes=await read(path);
  return new Response(bytes,{status:200,headers:{'Content-Type':path.endsWith('.wasm')?'application/wasm':path.endsWith('.json')?'application/json':'application/octet-stream'}});
 };
}

// WebLLM performs match -> add on miss -> match. A match here reads the app's
// checked store afresh. No upstream cache bytes or persistent writes are used.
export function verifiedQwenCache(base:string,paths:readonly string[],fetchFile:typeof fetch):CacheStorage{
 const urls=paths.map(path=>new URL(path,base).href),allowed=new Set(urls);
 const match:Cache['match']=async request=>{
  const url=typeof request==='string'?request:request instanceof URL?request.href:request.url;
  return allowed.has(url)?fetchFile(request):undefined;
 };
 const refuse=async()=>{throw Error('Runtime cache writes refused.');};
 const cache:Cache={match,matchAll:async request=>{const response=request&&await match(request);return response?[response]:[];},
  add:refuse,addAll:refuse,put:refuse,delete:async()=>false,keys:async()=>urls.map(url=>new Request(url))};
 return {open:async()=>cache,match,has:async()=>true,delete:async()=>false,keys:async()=>[]};
}

export type QwenWorkerReply={id:string;kind:'ready'|'progress'|'result'|'error';progress?:number;reply?:string;promptTokens?:number;outputTokens?:number;generationMs?:number;loadMs?:number;message?:string};
export type QwenWorkerPort={postMessage:(value:unknown)=>void;terminate:()=>void;onmessage:((event:MessageEvent<QwenWorkerReply>)=>void)|null;onerror:((event:ErrorEvent)=>void)|null};
