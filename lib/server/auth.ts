import {betterAuth} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {expo} from '@better-auth/expo';
import {drizzle} from 'drizzle-orm/d1';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import type {GoogleProfile} from 'better-auth/social-providers';
import * as schema from '../../db/schema';

// The provider's code-exchange getUserInfo path decodes by default. Verify the
// returned ID token before deriving account identity, using a fixed trusted JWKS.
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:3600000});

export function cloudReady(env:Cloudflare.Env){
 if(env.MOVEFIELD_CLOUD_ENABLED!=='true'||env.FREE_ALLOWANCE_VERIFIED!=='true'||!env.DB||!env.BUCKET||!env.AUTH_SECRET||env.AUTH_SECRET.length<32||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return false;
 try{const u=new URL(env.APP_ORIGIN||'');if(u.origin!==env.APP_ORIGIN)return false;return env.MOVEFIELD_LOCAL_TEST==='true'?u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname):u.protocol==='https:'}catch{return false}
}
export function createAuth(env:Cloudflare.Env){
 if(!cloudReady(env))throw Error('Account connections are unavailable.');
 return betterAuth({
  appName:'Movefield',baseURL:env.APP_ORIGIN!,basePath:'/api/auth',secret:env.AUTH_SECRET!,
  database:drizzleAdapter(drizzle(env.DB!),{provider:'sqlite',schema,transaction:false}),
  trustedOrigins:[env.APP_ORIGIN!,...(env.NATIVE_AUTH_VERIFIED==='true'?['movefield://']:[])],plugins:[expo()],
  emailAndPassword:{enabled:false},
  socialProviders:{google:{clientId:env.GOOGLE_CLIENT_ID!,clientSecret:env.GOOGLE_CLIENT_SECRET!,prompt:'select_account',getUserInfo:async tokens=>{
   try{
    if(!tokens.idToken||tokens.idToken.length>16384)return null;
    const {payload}=await jwtVerify(tokens.idToken,googleKeys,{algorithms:['RS256'],issuer:['https://accounts.google.com','accounts.google.com'],audience:env.GOOGLE_CLIENT_ID!,maxTokenAge:'1h',clockTolerance:30});
    const expectedNonce=(tokens as typeof tokens&{expectedIdTokenNonce?:string}).expectedIdTokenNonce;
    if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255||typeof payload.email!=='string'||!payload.email||payload.email.length>320||payload.email_verified!==true||typeof payload.exp!=='number'||typeof payload.iat!=='number'||payload.exp<=payload.iat||payload.azp!==undefined&&payload.azp!==env.GOOGLE_CLIENT_ID!||expectedNonce&&payload.nonce!==expectedNonce)return null;
    return {user:{name:'',email:payload.email,emailVerified:true},data:payload as unknown as GoogleProfile};
   }catch{return null}
  }}},
  account:{accountLinking:{enabled:false,disableImplicitLinking:true},storeStateStrategy:'database'},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24,freshAge:600,cookieCache:{enabled:false}},
  // The SDK's automatic prefix is __Secure-. Supply the stricter host prefix
  // explicitly instead; production Secure remains mandatory in the attributes.
  advanced:{useSecureCookies:false,cookiePrefix:env.MOVEFIELD_LOCAL_TEST==='true'?'better-auth':'__Host-better-auth',defaultCookieAttributes:{secure:env.MOVEFIELD_LOCAL_TEST!=='true',httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
  rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/sign-in/social':{window:60,max:5}}},
  logger:{disabled:true},
  user:{deleteUser:{enabled:true,beforeDelete:async u=>{
   const now=Date.now();
   await env.DB!.batch([
    env.DB!.prepare('INSERT INTO cloud_profile(owner_id, updated_at, deleted_at) VALUES(?,?,?) ON CONFLICT(owner_id) DO UPDATE SET deleted_at=excluded.deleted_at, ai_consent=0, consent_version=consent_version+1').bind(u.id,now,now),
    env.DB!.prepare("UPDATE coaching_job SET status='cancelled',input='',output=NULL,updated_at=? WHERE owner_id=?").bind(now,u.id),
    env.DB!.prepare('DELETE FROM cloud_operation WHERE owner_id=?').bind(u.id),
    env.DB!.prepare('DELETE FROM cloud_quota WHERE owner_id=?').bind(u.id),
   ]);
  }}},
  databaseHooks:{
   session:{create:{before:async s=>({data:{...s,ipAddress:null,userAgent:null}})}},
   account:{create:{before:async a=>({data:{...a,accessToken:null,refreshToken:null,idToken:null}})},update:{before:async a=>({data:{...a,accessToken:null,refreshToken:null,idToken:null}})}},
  },
 });
}
