'use client';
import {createAuthClient} from 'better-auth/react';
export const authClient=createAuthClient();
export async function cloudRequest(path:string,method='GET',body?:unknown,expectedOwner?:string):Promise<unknown>{
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(expectedOwner?{'X-Movefield-Account':expectedOwner}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30_000)});
 let result:{error?:string;message?:string};try{result=await response.json()}catch{throw Error('The account service returned an unreadable response. Your local profile is kept.')}
 if(!response.ok)throw Error(result.error||result.message||'The account action failed. Your local profile is kept.');return result;
}
