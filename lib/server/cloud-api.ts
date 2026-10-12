import {cloudReady,createAuth} from './auth';
import {hex,readEnvelope} from '../vault-format';
import {coachingApi} from './coaching';

export class ApiError extends Error{constructor(readonly status:number,message:string){super(message)}}
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export async function sha256(raw:string){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))))}
export async function ownerPrefix(owner:string){return `profiles/${await sha256(owner)}/`}
export function assertOrigin(request:Request,env:Cloudflare.Env){
 const origin=request.headers.get('origin');
 if(origin===env.APP_ORIGIN)return;
 if(!origin&&request.headers.get('expo-origin')==='movefield://'&&request.headers.get('x-movefield-client')==='native')return;
 throw new ApiError(403,'Open this action from your signed-in app.');
}
export async function readJson(request:Request,max=10_050_000):Promise<Record<string,unknown>>{
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw new ApiError(415,'A JSON request is required.');
 const length=Number(request.headers.get('content-length'));if(length>max)throw new ApiError(413,'This request exceeds the supported size.');
 const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'A request body is required.');
 const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new ApiError(413,'This request exceeds the supported size.')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length}
 try{const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error();return parsed}catch{throw new ApiError(400,'This JSON request is invalid.')}
}
export function exact(value:Record<string,unknown>,fields:string[]){if(Object.keys(value).length!==fields.length||Object.keys(value).some(k=>!fields.includes(k)))throw new ApiError(400,'The request contains unsupported fields.')}
function accountContext(request:Request,owner:string){if(request.headers.get('X-Movefield-Account')!==owner)throw new ApiError(409,'The account context is missing or changed. Update or refresh the account screen before continuing.')}
type Profile={owner_id:string;revision:number;object_key:string|null;digest:string|null;vault_id:string|null;deleted_at:number|null;consent_version:number;ai_consent:number;updated_at:number};
export async function profile(env:Cloudflare.Env,owner:string){return env.DB!.prepare('SELECT * FROM cloud_profile WHERE owner_id=?').bind(owner).first<Profile>()}
export async function liveProfile(env:Cloudflare.Env,owner:string){const p=await profile(env,owner);if(p?.deleted_at)throw new ApiError(410,'This cloud profile was deleted.');return p}
export async function quota(env:Cloudflare.Env,owner:string,kind:string,maximum:number){
 const day=new Date().toISOString().slice(0,10);
 const result=await env.DB!.prepare('INSERT INTO cloud_quota(owner_id,day,kind,count) VALUES(?,?,?,1) ON CONFLICT(owner_id,day,kind) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(owner,day,kind,maximum).first();
 if(!result)throw new ApiError(429,'Today’s limit has been reached. Your local records are kept.');
}
async function cleanupOwner(env:Cloudflare.Env,owner:string){
 const prefix=await ownerPrefix(owner);let cursor:string|undefined;
 // Bounded cleanup; the scheduled reconciler finishes interrupted/large deletions.
 for(let page=0;page<3;page++){const listed=await env.BUCKET!.list({prefix,limit:100,cursor});if(listed.objects.length)await env.BUCKET!.delete(listed.objects.map(x=>x.key));if(!listed.truncated)return;cursor=listed.cursor}
}
async function saveProfile(request:Request,env:Cloudflare.Env,owner:string){
 const body=await readJson(request);exact(body,['expectedRevision','operationId','ciphertext']);
 if(!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<0||typeof body.operationId!=='string'||! /^[a-f0-9-]{36}$/.test(body.operationId)||typeof body.ciphertext!=='string')throw new ApiError(400,'This backup request is invalid.');
 let envelope;try{envelope=readEnvelope(body.ciphertext)}catch{throw new ApiError(400,'This encrypted backup is invalid.')}
 if(envelope.kdf!=='PBKDF2-SHA256'||envelope.purpose!=='state')throw new ApiError(400,'Use a portable cloud vault for this backup.');
 const p=await liveProfile(env,owner);if(!p)throw new ApiError(403,'Confirm adult cloud-backup consent first.');
 const digest=await sha256(body.ciphertext);
 const previous=await env.DB!.prepare('SELECT expected_revision,digest,revision FROM cloud_operation WHERE owner_id=? AND operation_id=?').bind(owner,body.operationId).first<{expected_revision:number;digest:string;revision:number}>();
 if(previous){if(previous.digest!==digest||previous.expected_revision!==body.expectedRevision)throw new ApiError(409,'This operation ID was already used for a different backup.');return json({revision:previous.revision,digest,replayed:true})}
 if(p.revision!==body.expectedRevision)throw new ApiError(409,'Another device saved a newer backup. Preview it before choosing which profile to keep.');
 if(p.vault_id&&p.vault_id!==envelope.vaultId)throw new ApiError(409,'Unlock the existing cloud vault before saving.');
 await quota(env,owner,'backup-write',20);await quota(env,'_service','backup-write',200);
 const key=await ownerPrefix(owner)+crypto.randomUUID(),now=Date.now();
 await env.BUCKET!.put(key,body.ciphertext,{httpMetadata:{contentType:'application/json'},customMetadata:{sha256:digest}});
 let committed=false;
 try{
  // D1 batch is one transaction. changes() binds the operation receipt to the CAS.
  const results=await env.DB!.batch([
   env.DB!.prepare('UPDATE cloud_profile SET revision=revision+1,object_key=?,digest=?,vault_id=?,updated_at=? WHERE owner_id=? AND revision=? AND deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM cloud_operation WHERE owner_id=? AND operation_id=?)').bind(key,digest,envelope.vaultId,now,owner,body.expectedRevision,owner,body.operationId),
   env.DB!.prepare('INSERT INTO cloud_operation(owner_id,operation_id,expected_revision,digest,revision,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(owner,body.operationId,body.expectedRevision,digest,Number(body.expectedRevision)+1,now),
  ]);
  committed=results[0].meta.changes===1;
  if(!committed){const replay=await env.DB!.prepare('SELECT digest,expected_revision,revision FROM cloud_operation WHERE owner_id=? AND operation_id=?').bind(owner,body.operationId).first<{digest:string;expected_revision:number;revision:number}>();if(replay?.digest===digest&&replay.expected_revision===body.expectedRevision)return json({revision:replay.revision,digest,replayed:true});throw new ApiError(409,'The cloud backup changed while saving. Preview the newer backup.');}
 }finally{if(!committed)await env.BUCKET!.delete(key).catch(()=>undefined)}
 if(p.object_key)await env.BUCKET!.delete(p.object_key).catch(()=>undefined);
 return json({revision:Number(body.expectedRevision)+1,digest,replayed:false});
}

const authPaths:Record<string,string[]>={'/api/auth/sign-in/social':['POST'],'/api/auth/callback/google':['GET'],'/api/auth/get-session':['GET'],'/api/auth/sign-out':['POST'],'/api/auth/expo-authorization-proxy':['GET']};
const cloudPaths:Record<string,string[]>={'/api/cloud/capabilities':['GET'],'/api/cloud/consent':['POST'],'/api/cloud/profile':['GET','POST'],'/api/cloud/account':['DELETE'],'/api/cloud/coaching-consent':['POST'],'/api/cloud/coaching':['GET','POST'],'/api/cloud/sessions':['GET'],'/api/cloud/sessions/revoke':['POST'],'/api/cloud/sessions/revoke-others':['POST']};
export async function cloudApi(request:Request,env:Cloudflare.Env,ctx?:Pick<ExecutionContext,'waitUntil'>):Promise<Response|null>{
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/auth/')&&!path.startsWith('/api/cloud/'))return null;
 if(request.url.length>8192)return json({error:'This request address is too long.'},414);
 const allowed=authPaths[path]||cloudPaths[path];if(!allowed)return json({error:'Not found'},404);
 if(!allowed.includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:allowed.join(', '),'Cache-Control':'no-store'}});
 if(path==='/api/cloud/capabilities')return json({accounts:cloudReady(env),backups:cloudReady(env),coaching:cloudReady(env)&&env.AI_PROVIDER_VERIFIED==='true'&&!!env.AI_API_KEY&&!!env.AI_MODEL});
 if(!cloudReady(env))return json({error:'Account connections are not configured. Local tracking remains available.'},503);
 if(url.origin!==env.APP_ORIGIN)return json({error:'Use the configured app address.'},403);
 try{
  if(request.method!=='GET')assertOrigin(request,env);
  const auth=createAuth(env);
  if(authPaths[path]){
   if(path==='/api/auth/sign-in/social'){
    const body=await readJson(request,4096);if(body.provider!=='google'||Object.keys(body).some(k=>!['provider','callbackURL','errorCallbackURL','newUserCallbackURL','disableRedirect','requestSignUp'].includes(k)))throw new ApiError(400,'Use the supported Google sign-in flow.');
    for(const field of ['callbackURL','errorCallbackURL','newUserCallbackURL'])if(body[field]!==undefined){
     if(typeof body[field]!=='string')throw new ApiError(400,'Invalid sign-in return address.');
     const value=body[field] as string;if(value==='movefield://'){if(env.NATIVE_AUTH_VERIFIED!=='true')throw new ApiError(503,'Native sign-in callbacks have not been qualified for this installation.');continue;}
     const target:URL=new URL(value,env.APP_ORIGIN);if(target.origin!==env.APP_ORIGIN||target.username||target.password||target.pathname!=='/'||target.search||target.hash)throw new ApiError(400,'Use the app’s own sign-in return address.');
    }
    request=new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify(body)});
   }
   if(path==='/api/auth/expo-authorization-proxy'){if(env.NATIVE_AUTH_VERIFIED!=='true')throw new ApiError(503,'Native sign-in callbacks have not been qualified for this installation.');const target=new URL(url.searchParams.get('authorizationURL')||'');if(target.origin!=='https://accounts.google.com')throw new ApiError(400,'Unsupported sign-in provider.');}
   if(path==='/api/auth/sign-out'){
    const signed=await auth.api.getSession({headers:request.headers});if(signed)accountContext(request,signed.user.id);
    const body=request.body?await readJson(request,1024):{};exact(body,[]);
    const headers=new Headers(request.headers);headers.set('Content-Type','application/json');
    request=new Request(request.url,{method:'POST',headers,body:'{}'});
   }
   const response=await auth.handler(request);
   if(path==='/api/auth/get-session'&&response.ok){
    // Keep SDK session validation/renewal, but never expose its opaque token to
    // application JavaScript. Internal SDK calls still retain their full data.
    const value=await response.json() as {session?:{id:string;userId:string;expiresAt:string;createdAt:string;updatedAt:string};user?:{id:string;email:string;emailVerified:boolean;name:string;createdAt:string;updatedAt:string}}|null;
    const publicSession=value?.session&&value.user?{session:{id:value.session.id,userId:value.session.userId,expiresAt:value.session.expiresAt,createdAt:value.session.createdAt,updatedAt:value.session.updatedAt},user:{id:value.user.id,email:value.user.email,emailVerified:value.user.emailVerified,name:value.user.name,createdAt:value.user.createdAt,updatedAt:value.user.updatedAt}}:null;
    const headers=new Headers(response.headers);headers.delete('Content-Length');headers.delete('Content-Encoding');
    return new Response(JSON.stringify(publicSession),{status:response.status,headers});
   }
   return response;
  }
  const signed=await auth.api.getSession({headers:request.headers});if(!signed?.user.emailVerified)throw new ApiError(401,'Sign in with your verified Google account.');
  const owner=signed.user.id;
  accountContext(request,owner);
  if(path==='/api/cloud/account'){
   // SDK enforces fresh authentication, invokes the tombstone hook, and revokes sessions.
   const response=await auth.api.deleteUser({headers:request.headers,body:{},asResponse:true});
   if(response.ok)await cleanupOwner(env,owner).catch(()=>undefined);
   return response;
  }
  await liveProfile(env,owner);
  if(path==='/api/cloud/sessions'){
   await quota(env,owner,'sessions-read',50);
   const rows=await env.DB!.prepare('SELECT id,created_at,updated_at,expires_at FROM auth_session WHERE user_id=? AND expires_at>? ORDER BY created_at DESC LIMIT 101').bind(owner,Date.now()).all<{id:string;created_at:number;updated_at:number;expires_at:number}>();
   return json({ownerId:owner,hasMore:rows.results.length>100,sessions:rows.results.slice(0,100).map(s=>({id:s.id,createdAt:s.created_at,updatedAt:s.updated_at,expiresAt:s.expires_at,current:s.id===signed.session.id}))});
  }
  if(path==='/api/cloud/sessions/revoke'||path==='/api/cloud/sessions/revoke-others'){
   const created=new Date(signed.session.createdAt).getTime();
   if(!Number.isFinite(created)||Date.now()-created>600000||created>Date.now()+30000)throw new ApiError(403,'Sign in again before revoking other sessions.');
   const body=await readJson(request,1024);
   exact(body,path.endsWith('revoke-others')?[]:['sessionId']);
   if(path.endsWith('revoke-others')){
    await quota(env,owner,'sessions-revoke',10);
    // One bounded D1 operation revokes every other owner session, including older
    // entries outside the displayed page. Cookie caching is disabled in the SDK.
    await env.DB!.prepare('DELETE FROM auth_session WHERE user_id=? AND id<>?').bind(owner,signed.session.id).run();
    return json({revoked:true});
   }
   if(typeof body.sessionId!=='string'||!body.sessionId||body.sessionId.length>128)throw new ApiError(400,'Choose a session from your account.');
   if(body.sessionId===signed.session.id)throw new ApiError(400,'Use Sign out to end your current sign-in.');
   const target=await env.DB!.prepare('SELECT token FROM auth_session WHERE id=? AND user_id=? AND expires_at>?').bind(body.sessionId,owner,Date.now()).first<{token:string}>();
   if(!target)throw new ApiError(404,'This session is unavailable. Refresh your session list.');
   await quota(env,owner,'sessions-revoke',10);
   return await auth.api.revokeSession({headers:request.headers,body:{token:target.token},asResponse:true});
  }
  if(path==='/api/cloud/coaching'||path==='/api/cloud/coaching-consent')return await coachingApi(request,env,owner,ctx);
  if(path==='/api/cloud/consent'){
   const body=await readJson(request,1024);exact(body,['adult','backup']);if(body.adult!==true||body.backup!==true)throw new ApiError(403,'Cloud backup is available only with adult consent.');
   await env.DB!.prepare('INSERT INTO cloud_profile(owner_id,updated_at) VALUES(?,?) ON CONFLICT(owner_id) DO NOTHING').bind(owner,Date.now()).run();
   return json({ownerId:owner,consent:'encrypted-backup-v1'});
  }
  if(request.method==='POST')return await saveProfile(request,env,owner);
  await quota(env,owner,'backup-read',100);const p=await liveProfile(env,owner);
  if(!p?.object_key)return json({ownerId:owner,revision:0,ciphertext:null,digest:null});
  const object=await env.BUCKET!.get(p.object_key);if(!object)throw new ApiError(503,'The cloud copy is temporarily unavailable. Your local records are kept.');
  const ciphertext=await object.text();if(await sha256(ciphertext)!==p.digest)throw new ApiError(503,'The cloud copy could not be verified. Your local records are kept.');
  return json({ownerId:owner,revision:p.revision,ciphertext,digest:p.digest});
 }catch(e){return json({error:e instanceof ApiError?e.message:'This account action could not complete. Your local records are kept.'},e instanceof ApiError?e.status:503)}
}

/** Bound orphan cleanup after interrupted R2/D1 operations. Never remove a live pointer. */
export async function reconcileCloud(env:Cloudflare.Env){
 if(!cloudReady(env))return;
 const saved=await env.DB!.prepare("SELECT value FROM cloud_maintenance WHERE key='r2-cursor'").first<{value:string}>();
 const listed=await env.BUCKET!.list({prefix:'profiles/',limit:100,cursor:saved?.value||undefined});
 for(const object of listed.objects){if(object.uploaded.getTime()>Date.now()-86_400_000)continue;const referenced=await env.DB!.prepare('SELECT owner_id,deleted_at FROM cloud_profile WHERE object_key=?').bind(object.key).first<{owner_id:string;deleted_at:number|null}>();if(!referenced||referenced.deleted_at)await env.BUCKET!.delete(object.key)}
 await env.DB!.batch([
  env.DB!.prepare("INSERT INTO cloud_maintenance(key,value) VALUES('r2-cursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(listed.truncated?listed.cursor:''),
  env.DB!.prepare('DELETE FROM cloud_operation WHERE created_at<?').bind(Date.now()-7*86_400_000),env.DB!.prepare('DELETE FROM cloud_quota WHERE day<?').bind(new Date(Date.now()-2*86_400_000).toISOString().slice(0,10)),env.DB!.prepare('DELETE FROM auth_verification WHERE expires_at<?').bind(Date.now()),env.DB!.prepare('DELETE FROM auth_session WHERE expires_at<?').bind(Date.now()),
  env.DB!.prepare("UPDATE coaching_job SET status='failed',input='',output=NULL,updated_at=? WHERE status IN ('queued','running') AND updated_at<?").bind(Date.now(),Date.now()-300_000),
  env.DB!.prepare('DELETE FROM coaching_job WHERE created_at<?').bind(Date.now()-7*86_400_000),
 ]);
}
