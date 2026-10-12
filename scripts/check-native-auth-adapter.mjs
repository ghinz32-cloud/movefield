import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),wrangler=createRequire(import.meta.resolve('wrangler')),{build}=wrangler('esbuild');
const directory=resolve('.sites-runtime/native-auth-adapter');await mkdir(directory,{recursive:true});
const stubs={
 'react-native':"export const Platform={OS:'ios'},AppState={currentState:'active',addEventListener:()=>({remove(){}})};",
 'expo-constants':"export default {expoConfig:{scheme:'movefield'},executionEnvironment:'standalone'};",
 'expo-linking':"export const createURL=()=> 'movefield://',addEventListener=()=>({remove(){}});",
 'expo-secure-store':"const values=new Map();export const WHEN_UNLOCKED_THIS_DEVICE_ONLY=1;export const getItem=k=>values.get(k)||null,getItemAsync=async k=>getItem(k),setItem=(k,v)=>{values.set(k,v)},setItemAsync=async(k,v)=>setItem(k,v);",
 'expo-network':"export const getNetworkStateAsync=async()=>({isConnected:true,isInternetReachable:true}),addNetworkStateListener=()=>({remove(){}});",
 'expo-web-browser':"export const dismissAuthSession=()=>{},openAuthSessionAsync=async()=>{throw Error('Installed OAuth callbacks are outside this adapter test')};"
};
const plugin={name:'native-platform-boundary',setup(b){b.onResolve({filter:/^(?:react-native|expo-constants|expo-linking|expo-secure-store|expo-network|expo-web-browser)$/},args=>({path:args.path,namespace:'native-boundary'}));b.onLoad({filter:/.*/,namespace:'native-boundary'},args=>({contents:stubs[args.path],loader:'js'}))}};
for(const enabled of ['true','false'])await build({entryPoints:['mobile/src/cloud-client.ts'],bundle:true,platform:'node',format:'cjs',outfile:directory+'/'+enabled+'.cjs',define:{'process.env.EXPO_PUBLIC_MOVEFIELD_API_URL':'"https://synthetic-native.example"','process.env.EXPO_PUBLIC_NATIVE_AUTH_VERIFIED':JSON.stringify(enabled)},plugins:[plugin],logLevel:'warning'});
const disabled=require(directory+'/false.cjs');assert.equal(disabled.nativeAuthEnabled,false);assert.throws(()=>disabled.nativeAuth(),/not qualified/);
const originalFetch=globalThis.fetch,calls=[];
globalThis.fetch=async(input,options={})=>{
 const request=new Request(input,options),path=new URL(request.url).pathname;calls.push({path,headers:request.headers});
 if(path==='/api/auth/get-session')return new Response(JSON.stringify({user:{id:'synthetic-native-owner',email:'native@example.test',emailVerified:true},session:{id:'synthetic-session',userId:'synthetic-native-owner',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()}}),{headers:{'Content-Type':'application/json','Set-Cookie':'__Host-better-auth.session_token=synthetic-native-cookie; Path=/; Secure; HttpOnly; SameSite=Lax'}});
 if(path==='/api/cloud/profile')return new Response(JSON.stringify({ownerId:'synthetic-native-owner',revision:0,ciphertext:null,digest:null}),{headers:{'Content-Type':'application/json'}});
 if(path==='/api/auth/sign-out')return new Response('{"success":true}',{headers:{'Content-Type':'application/json','Set-Cookie':'__Host-better-auth.session_token=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0'}});
 throw Error('Unexpected synthetic native request');
};
try{
 const native=require(directory+'/true.cjs'),auth=native.nativeAuth();assert.equal(native.nativeAuthEnabled,true);
 const signed=await auth.getSession();assert.equal(signed.data.user.id,'synthetic-native-owner');assert.equal(signed.data.session.token,undefined);assert.match(await auth.getCookie(),/__Host-better-auth\.session_token=synthetic-native-cookie/);
 await native.nativeCloudRequest('/api/cloud/profile','GET',undefined,'synthetic-native-owner');const api=calls.find(c=>c.path==='/api/cloud/profile');assert.equal(api.headers.get('X-Movefield-Account'),'synthetic-native-owner');assert.equal(api.headers.get('expo-origin'),'movefield://');assert.match(api.headers.get('Cookie'),/__Host-better-auth\.session_token=synthetic-native-cookie/);
 await auth.signOut({fetchOptions:{headers:{'X-Movefield-Account':'synthetic-native-owner'}}});assert.equal(await auth.getCookie(),'');
 const checks=['Default qualification flag blocks native auth before requests','Actual SDK accepts public session DTO without an opaque token','Host-prefixed cookie is recognized and retained by actual Expo SDK','Native transport sends the saved cookie and owner precondition','SDK sign-out removes its stored session cookie'];await writeFile(directory+'/results.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual Better Auth/Expo client SDK and native cloud transport; synthetic fetch and mocked platform/SecureStore boundaries. No installed OAuth/keychain/phone qualification.',checks},null,2)+'\n');console.log('PASS '+checks.length+' actual native SDK adapter checks');
}finally{globalThis.fetch=originalFetch}
