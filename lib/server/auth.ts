import {betterAuth} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {expo} from '@better-auth/expo';
import {drizzle} from 'drizzle-orm/d1';
import * as schema from '../../db/schema';

export function cloudReady(env:Cloudflare.Env){
 if(env.MOVEFIELD_CLOUD_ENABLED!=='true'||env.FREE_ALLOWANCE_VERIFIED!=='true'||!env.DB||!env.BUCKET||!env.AUTH_SECRET||env.AUTH_SECRET.length<32||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return false;
 try{const u=new URL(env.APP_ORIGIN||'');if(u.origin!==env.APP_ORIGIN)return false;return env.MOVEFIELD_LOCAL_TEST==='true'?u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname):u.protocol==='https:'}catch{return false}
}
export function createAuth(env:Cloudflare.Env){
 if(!cloudReady(env))throw Error('Account connections are unavailable.');
 return betterAuth({
  appName:'Movefield',baseURL:env.APP_ORIGIN!,basePath:'/api/auth',secret:env.AUTH_SECRET!,
  database:drizzleAdapter(drizzle(env.DB!),{provider:'sqlite',schema,transaction:false}),
  trustedOrigins:[env.APP_ORIGIN!,'movefield://'],plugins:[expo()],
  emailAndPassword:{enabled:false},
  socialProviders:{google:{clientId:env.GOOGLE_CLIENT_ID!,clientSecret:env.GOOGLE_CLIENT_SECRET!,prompt:'select_account'}},
  account:{accountLinking:{enabled:false,disableImplicitLinking:true},storeStateStrategy:'database'},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24,freshAge:600,cookieCache:{enabled:false}},
  advanced:{useSecureCookies:env.MOVEFIELD_LOCAL_TEST!=='true',defaultCookieAttributes:{httpOnly:true,sameSite:'lax'},ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
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
