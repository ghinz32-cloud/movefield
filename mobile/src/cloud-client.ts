import {createAuthClient} from 'better-auth/react';
import {expoClient} from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
const rawOrigin=process.env.EXPO_PUBLIC_MOVEFIELD_API_URL;
export const apiOrigin=(()=>{try{const url=new URL(rawOrigin||'');return url.protocol==='https:'&&url.origin===rawOrigin?url.origin:null}catch{return null}})();
export const nativeAuthEnabled=!!apiOrigin&&process.env.EXPO_PUBLIC_NATIVE_AUTH_VERIFIED==='true';
const options={keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
const secure={getItem:(key:string)=>SecureStore.getItem(key,options),getItemAsync:(key:string)=>SecureStore.getItemAsync(key,options),setItem:(key:string,value:string)=>SecureStore.setItem(key,value,options),setItemAsync:(key:string,value:string)=>SecureStore.setItemAsync(key,value,options)};
function makeAuth(){if(!nativeAuthEnabled||!apiOrigin)throw Error('Native account callbacks are not qualified for this app build.');return createAuthClient({baseURL:apiOrigin,fetchOptions:{headers:{'x-movefield-client':'native'}},plugins:[expoClient({scheme:'movefield',storage:secure,storagePrefix:'movefield_auth',cookiePrefix:['better-auth','__Host-better-auth'],disableCache:true})]})}
let client:ReturnType<typeof makeAuth>|null=null;
export function nativeAuth(){return client??=makeAuth()}
export async function nativeCloudRequest(path:string,method='GET',body?:unknown,expectedOwner?:string):Promise<unknown>{
 if(!apiOrigin)throw Error('Cloud accounts are not configured for this app.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30_000);
 try{const cookie=await nativeAuth().getCookie();const response=await fetch(apiOrigin+path,{method,headers:{Cookie:cookie,'expo-origin':'movefield://','x-movefield-client':'native',...(expectedOwner?{'X-Movefield-Account':expectedOwner}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});const result=await response.json() as {error?:string;message?:string};if(!response.ok)throw Error(result.error||result.message||'The account action failed. Local records are kept.');return result}finally{clearTimeout(timer)}
}
