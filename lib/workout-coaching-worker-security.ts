import policy from './workout-coaching-worker-policy.json';
import {publicPath} from './public-path';

declare const __MOVEFIELD_PAGES__:boolean;
export const WORKOUT_COACHING_WORKER_POLICY=policy.csp;
export const WORKOUT_COACHING_WORKER_PATH=policy.path;
const reload='Reload this page after its verified offline worker is installed, then retry local coaching.';
async function boundedBody(response:Response,limit:number):Promise<ArrayBuffer> {
  if(!response.body)throw Error('Missing worker response.');
  const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
  try{
    while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;
      if(size>limit){await reader.cancel();throw Error('Worker response exceeds its byte budget.');}parts.push(next.value);}
  }finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.byteLength;}
  return result.buffer;
}
export function workoutCoachingWorkerSupport():string {
  if(typeof __MOVEFIELD_PAGES__!=='undefined'&&__MOVEFIELD_PAGES__&&
    (typeof navigator==='undefined'||!navigator.serviceWorker?.controller))return reload;
  return '';
}
export async function verifyWorkoutCoachingWorker(options:{pages:boolean;workerUrl:string;origin:string;
  controller:object|null;currentController:()=>object|null;mainScript:string|null;
  fetchFile:typeof fetch;digest:(bytes:ArrayBuffer)=>Promise<string>}):Promise<string> {
  const {workerUrl,origin}=options,worker=new URL(workerUrl,origin);
  if(worker.origin!==origin||!worker.pathname.endsWith('/'+WORKOUT_COACHING_WORKER_PATH)||worker.search||worker.hash)return 'The local model worker URL failed validation.';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  const init:RequestInit={method:'GET',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store',signal:controller.signal};
  try{
    let expectedVersion:string|null=null,expectedHash:string|null=null;
    if(options.pages){
      if(!options.controller)return reload;
      const base=worker.pathname.slice(0,-WORKOUT_COACHING_WORKER_PATH.length);
      const manifestResponse=await options.fetchFile(new URL(base+'pages-manifest.json',origin).href,init);
      if(manifestResponse.status!==200)return reload;
      const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await boundedBody(manifestResponse,1024*1024))) as Record<string,unknown>,assets=manifest.assets as Record<string,unknown>|undefined;
      expectedVersion=typeof manifest.version==='string'?manifest.version:null;
      expectedHash=assets&&typeof assets[worker.pathname]==='string'?assets[worker.pathname] as string:null;
      const main=options.mainScript&&new URL(options.mainScript,origin);
      const configured=manifest.coachingWorker as {path?:unknown;csp?:unknown}|undefined;
      if(!expectedVersion||!/^[0-9a-f]{64}$/.test(expectedVersion)||!expectedHash||!/^[0-9a-f]{64}$/.test(expectedHash)||
        manifestResponse.headers.get('X-Movefield-Pages-Version')!==expectedVersion||manifest.base!==base||
        configured?.path!==WORKOUT_COACHING_WORKER_PATH||configured.csp!==WORKOUT_COACHING_WORKER_POLICY||
        !main||main.origin!==origin||!assets||typeof assets[main.pathname]!=='string')return reload;
    }
    const response=await options.fetchFile(worker.href,init);
    if(response.status!==200||response.headers.get('Content-Security-Policy')!==WORKOUT_COACHING_WORKER_POLICY)return 'The local model worker security policy is unavailable. Reload after the verified offline worker is installed.';
    if(options.pages){
      if(response.headers.get('X-Movefield-Pages-Version')!==expectedVersion||response.headers.get('X-Movefield-Asset-SHA256')!==expectedHash||
        options.currentController()!==options.controller)return reload;
      const bytes=await boundedBody(response,32*1024*1024);
      if(await options.digest(bytes)!==expectedHash||options.currentController()!==options.controller)return reload;
    }else await response.body?.cancel();
    return '';
  }catch{return 'The verified local model worker could not be checked. Reconnect or reload, then retry.';}
  finally{clearTimeout(timer);controller.abort();}
}
export function workoutCoachingWorkerSecurity():Promise<string> {
  const pages=typeof __MOVEFIELD_PAGES__!=='undefined'&&__MOVEFIELD_PAGES__,controller=navigator.serviceWorker?.controller??null;
  return verifyWorkoutCoachingWorker({pages,workerUrl:publicPath(WORKOUT_COACHING_WORKER_PATH),origin:location.origin,controller,
    currentController:()=>navigator.serviceWorker?.controller??null,
    mainScript:document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src??null,
    fetchFile:fetch,digest:async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('')});
}
