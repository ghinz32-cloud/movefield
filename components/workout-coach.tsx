"use client";
import {useCallback,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {Button} from './ui/button';
import {Progress} from './ui/progress';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './ui/select';
import {useAppPreferences} from './app-preferences';
import QwenModelFiles from './qwen-model-files';
import {browserModelChoices,type ModelChoice} from '@/lib/app-preferences';
import {publicPath} from '@/lib/public-path';
import {buildWorkoutCoaching,parseWorkoutCoachingReply,renderWorkoutCoaching,serializeWorkoutCoaching,workoutCoachingContextSchema,type WorkoutCoachingContext,type WorkoutCoachingReply,type WorkoutCoachingReview} from '@/lib/workout-coaching';
import {workoutCoachingDigest} from '@/lib/workout-coaching-identity';
import {createWorkoutCoachingRuntime,workoutCoachingRuntimeSupport} from '@/lib/workout-coaching-runtime';
import {getBrowserCoachingModel} from '@/lib/workout-coaching-models';
import {requestWorkoutCoaching} from '@/lib/workout-coaching-client';
import {createWorkoutCoachingStore,type StoredCoachingResult} from '@/lib/workout-coaching-store';
import type {State} from '@/lib/training';

type Preferences={consent:boolean;automatic:boolean;lastAutomatic:string};
export type CoachingEvent={nonce:string;workoutId:string;exerciseId?:string};
const preferenceKey='movefield-workout-coaching-preferences-v1';
const defaults:Preferences={consent:false,automatic:false,lastAutomatic:''};
function readPreferences():Preferences{
 try{const value=JSON.parse(localStorage.getItem(preferenceKey)||'null');return value&&typeof value==='object'?{consent:value.consent===true,automatic:value.automatic===true,lastAutomatic:typeof value.lastAutomatic==='string'&&value.lastAutomatic.length<160?value.lastAutomatic:''}:{...defaults}}catch{return {...defaults}}
}
function savePreferences(preferences:Preferences){localStorage.setItem(preferenceKey,JSON.stringify(preferences));}

function createLocalSession(){
 let context:{context:WorkoutCoachingContext;digest:string}|null=null,enabled=false,modelId:string|null=null;
 const runtime=createWorkoutCoachingRuntime({makeWorker:()=>new Worker(publicPath('/runtime/workout-coaching-worker.js'),{type:'module'}),current:()=>enabled?context:null,model:()=>modelId});
 return {runtime,context:()=>context,enabled:()=>enabled,model:()=>modelId,set:(next:typeof context,allow:boolean,model:string|null)=>{context=next;enabled=allow;modelId=model},clear:()=>{context=null;enabled=false;modelId=null}};
}

export function WorkoutCoach({state,saved,workoutId,exerciseId,automaticEvent,onReview,setupOpen=false}:{state:State;saved:boolean;workoutId?:string;exerciseId?:string;automaticEvent?:CoachingEvent|null;setupOpen?:boolean;onReview:(review:WorkoutCoachingReview,context:WorkoutCoachingContext,digest:string)=>void}){
 const {p,update}=useAppPreferences();
 const latest=workoutId||state.history.filter(workout=>workout.finishedAt!==undefined&&workout.sets.some(set=>set.done)).sort((a,b)=>(b.finishedAt??0)-(a.finishedAt??0))[0]?.id;
 const built=useMemo(()=>latest?buildWorkoutCoaching(state,latest,{exerciseId}):null,[state,latest,exerciseId]);
 const serialized=built?.eligible?serializeWorkoutCoaching(built.context):'';
 const context=useMemo(()=>serialized?workoutCoachingContextSchema.parse(JSON.parse(serialized)):null,[serialized]),digest=context?workoutCoachingDigest(context):'',model=getBrowserCoachingModel(p.model);
 const [preferences,setPreferences]=useState<Preferences>(defaults),[preferencesReady,setPreferencesReady]=useState(false),[support,setSupport]=useState('Checking local model support…');
 const [configurationOpen,setConfigurationOpen]=useState(setupOpen);
 const [results,setResults]=useState<StoredCoachingResult[]>([]),[storeReady,setStoreReady]=useState(false),[status,setStatus]=useState({digest:'',text:''}),[remoteConsentDigest,setRemoteConsentDigest]=useState(''),[remoteBusy,setRemoteBusy]=useState(false);
 const remoteConsent=!!digest&&remoteConsentDigest===digest;
 const setMessage=useCallback((text:string)=>setStatus({digest,text}),[digest]),message=status.digest===digest||status.digest===''?status.text:'';
 const preferencesRef=useRef<Preferences>(defaults),automaticRef=useRef<CoachingEvent|null>(null),remoteConsentRef=useRef('');
 const generation=useRef({epoch:0}),localOperation=useRef<{id:number;digest:string;modelId:string}|null>(null);
 const remote=useRef<AbortController|null>(null),mounted=useRef(false);
 const [localSession]=useState(createLocalSession);
 const [store]=useState(()=>createWorkoutCoachingStore());
 const runtime=localSession.runtime;
 const local=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot,runtime.getSnapshot),busy=remoteBusy||local.phase==='loading'||local.phase==='running';
 useEffect(()=>{const fence=generation.current;mounted.current=true;queueMicrotask(()=>{if(mounted.current){const restored=readPreferences();preferencesRef.current=restored;setPreferences(restored);setPreferencesReady(true);setSupport(workoutCoachingRuntimeSupport())}});void store.read().then(snapshot=>{if(mounted.current){setResults(snapshot.results);setStoreReady(true)}}).catch(()=>{if(mounted.current)setStatus({digest:'',text:'Saved coaching could not be opened. Your records were preserved; reload this profile before requesting more coaching.'})});return()=>{mounted.current=false;fence.epoch++;localOperation.current=null;remote.current?.abort();runtime.stop()}},[runtime,store]);
 useEffect(()=>{const fence=generation.current;automaticRef.current=automaticEvent??null;localSession.set(context&&saved?{context,digest}:null,preferences.consent&&p.model!=='off',model?.id??null);return()=>{localSession.clear();fence.epoch++;localOperation.current=null;runtime.stop();remote.current?.abort()}},[context,digest,saved,preferences.consent,p.model,model,runtime,automaticEvent,localSession]);
 useEffect(()=>{const background=()=>{if(document.hidden){generation.current.epoch++;localOperation.current=null;runtime.stop('Coaching stopped while the page was in the background.');remote.current?.abort()}};document.addEventListener('visibilitychange',background);return()=>document.removeEventListener('visibilitychange',background)},[runtime]);
 const changePreferences=useCallback((patch:Partial<Preferences>)=>{const next={...preferencesRef.current,...patch};if(!next.consent)next.automatic=false;try{savePreferences(next);preferencesRef.current=next;setPreferences(next)}catch{setMessage('This browser could not save the coaching preference. Coaching remains manual.')}},[setMessage]);
 const persist=useCallback(async(reply:WorkoutCoachingReply,source:'local'|'backend',modelId:string,operation:{id:number;digest:string;modelId:string;signal?:AbortSignal})=>{
  const live=()=>mounted.current&&generation.current.epoch===operation.id&&localSession.context()?.digest===operation.digest&&!operation.signal?.aborted&&(source==='backend'||localSession.enabled()&&localSession.model()===operation.modelId);
  const current=localSession.context();if(!live()||!current||current.digest!==digest||!parseWorkoutCoachingReply(current.context,digest,reply))return;
  const snapshot=await store.read();if(!live())return;
  const next=await store.save({policy:current.context.policy,workoutId:current.context.workoutId,event:current.context.event,contextDigest:digest,source,modelId,reply,createdAt:new Date().toISOString()},snapshot.raw);
  if(live()){setResults(next.results);setMessage(source==='local'?'Qwen’s coaching selection is encrypted and saved on this device.':'The backend saved this coaching result, and an encrypted copy is saved on this device.')}
 },[digest,store,setMessage,localSession]);
 useEffect(()=>{
  const operation=localOperation.current;
  if(local.phase==='error'){localOperation.current=null;return;}
  if(local.phase!=='ready'||!local.result||local.contextDigest!==digest||!local.modelId||!operation||operation.digest!==digest||operation.modelId!==local.modelId)return;
  void persist(local.result,'local',local.modelId,operation).catch(()=>{if(mounted.current&&generation.current.epoch===operation.id&&localSession.context()?.digest===digest)setMessage('The model finished, but its result could not be saved. Your workout is retained; retry after checking local storage.')}).finally(()=>{if(localOperation.current===operation)localOperation.current=null});
 },[local,persist,digest,setMessage,localSession]);
 const startLocal=useCallback(()=>{
  const current=localSession.context();if(!mounted.current||document.hidden||localOperation.current||remote.current||!current||!preferences.consent||!model||support||!storeReady||p.model==='off'||busy)return;
  const operation={id:++generation.current.epoch,digest:current.digest,modelId:model.id};localOperation.current=operation;setMessage('');
  void runtime.run(current.context,current.digest).catch(()=>{if(localOperation.current===operation){localOperation.current=null;setMessage('The local model could not start. Your workout remains saved.')}});
 },[preferences.consent,model,support,storeReady,p.model,busy,runtime,setMessage,localSession]);
 useEffect(()=>{
  if(document.hidden||!preferencesReady||!storeReady||!preferences.automatic||!preferences.consent||!automaticEvent||!context||!saved||!model||support||busy||preferences.lastAutomatic===automaticEvent.nonce||preferencesRef.current.lastAutomatic===automaticEvent.nonce)return;
  if(automaticEvent.workoutId!==context.workoutId||(automaticEvent.exerciseId??null)!==context.event.exerciseId)return;
  if(results.some(result=>result.contextDigest===digest))return;
  try{const next={...preferencesRef.current,lastAutomatic:automaticEvent.nonce};savePreferences(next);preferencesRef.current=next;queueMicrotask(()=>{if(mounted.current&&!document.hidden&&preferencesRef.current===next&&localSession.context()?.digest===digest&&automaticRef.current?.nonce===automaticEvent.nonce){setPreferences(next);startLocal()}})}catch{/* Manual review stays available when preferences cannot be saved. */}
 },[preferencesReady,storeReady,preferences,automaticEvent,context,saved,model,support,busy,results,digest,startLocal,localSession]);
 async function startRemote(){
  const current=localSession.context();if(!mounted.current||document.hidden||remote.current||localOperation.current||!current||current.digest!==remoteConsentRef.current||!storeReady||busy||p.model==='off')return;
  remoteConsentRef.current='';setRemoteConsentDigest('');
  const abort=new AbortController(),operation={id:++generation.current.epoch,digest:current.digest,modelId:'backend',signal:abort.signal};remote.current=abort;setRemoteBusy(true);setMessage('Checking the signed-in backend and waiting for saved coaching…');
  try{const response=await requestWorkoutCoaching(current.context,current.digest,{signal:abort.signal});if(!abort.signal.aborted&&localSession.context()?.digest===current.digest)await persist(response.reply,'backend',response.model,operation)}
  catch(error){if(mounted.current&&!abort.signal.aborted&&localSession.context()?.digest===current.digest)setMessage(error instanceof Error?error.message:'Cloud coaching is unavailable. Your workout is saved locally.')}
  finally{if(remote.current===abort){remote.current=null;if(mounted.current)setRemoteBusy(false)}}
 }
 const stored=saved&&context?results.find(result=>result.contextDigest===digest):undefined;
 const reply=stored&&context?parseWorkoutCoachingReply(context,digest,stored.reply):null,display=reply&&context?renderWorkoutCoaching(context,reply):null;
 return <section className="card workout-coach" aria-label="Personalized workout coaching">
  <p className="eyebrow">{exerciseId?'AFTER YOUR LOGGED LIFT':'AFTER YOUR SAVED WORKOUT'}</p><h2>Your AI coach</h2>
  <p className="muted">Personalized feedback from your logged performance, comparable prior lifts, 28-day attendance and training profile. The local option has no API fee and keeps this data on your device.</p>
  {!latest&&<p>Finish a lift or save a workout to review its performance.</p>}
  {built&&!built.eligible&&<p role="status">{built.message}</p>}
  {!saved&&latest&&<p role="status">Waiting for your workout to finish saving on this device…</p>}
  {display&&stored&&<div aria-live="polite"><p className="small-copy">Saved {stored.source==='local'?'local':'backend'} model selection · {stored.modelId} · Focus: {display.priority}</p>{display.observations.map(observation=><p key={observation.id}>{observation.text}</p>)}{display.reviews.map(review=><div key={review.id}><h3>{review.title}</h3><p className="small-copy">{review.reason}</p>{!['keep-targets','ask-owner'].includes(review.kind)&&<Button variant="outline" disabled={!saved||busy} onClick={()=>{const current=localSession.context();if(mounted.current&&!document.hidden&&current?.digest===digest&&!remote.current&&!localOperation.current)onReview(review,current.context,digest)}}>Open review</Button>}</div>)}</div>}
  <details className="today-more" open={configurationOpen} onToggle={event=>setConfigurationOpen(event.currentTarget.open)}>
   <summary>{display?'Coaching settings and another review':'Set up free local coaching'}</summary>
   <label className="field"><span>Browser model</span><Select value={p.model} disabled={busy} onValueChange={value=>update({model:value as ModelChoice})}><SelectTrigger aria-label="Browser coaching model"><SelectValue/></SelectTrigger><SelectContent>{browserModelChoices.map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
   <p className="small-copy">Choose an explicit Qwen3.5 model for this experimental browser flow. Automatic model selection waits for device qualification. Larger models need WebGPU, substantial free storage and GPU memory; downloads start only after you review and confirm their exact size.</p>
   {model&&<QwenModelFiles modelId={model.id} onRemove={()=>{generation.current.epoch++;localOperation.current=null;runtime.stop('The model was unloaded before deleting its files.');remote.current?.abort()}}/>}
   <label className="field checkbox-field"><span><input type="checkbox" checked={preferences.consent} disabled={!preferencesReady||busy} onChange={event=>changePreferences({consent:event.target.checked})}/> Use my performance, attendance and training profile for coaching on this device.</span></label>
   <label className="field checkbox-field"><span><input type="checkbox" checked={preferences.automatic} disabled={!preferencesReady||!preferences.consent||busy} onChange={event=>changePreferences({automatic:event.target.checked})}/> Coach automatically after a lift or workout is saved.</span></label>
   <div className="button-row"><Button disabled={!context||!saved||!preferences.consent||!model||!!support||!storeReady||busy||p.model==='off'} onClick={startLocal}>Review with local Qwen</Button>{busy&&<Button variant="outline" onClick={()=>{generation.current.epoch++;localOperation.current=null;runtime.stop('Coaching cancelled.');remote.current?.abort()}}>Cancel coaching</Button>}</div>
   {support&&<p className="small-copy" role="status">{support}</p>}
   <details className="today-more"><summary>Use a larger model through the secure backend</summary><p className="small-copy">Available on the account-enabled prototype when a provider key is configured. This request sends completed set metrics, a minimized adult training profile, recent comparable performance and attendance to the backend and its configured provider. Names and exercise notes are excluded. It appears only after the backend saves the result. Free cloud providers have quotas and require an owner-supplied server key.</p><label className="field checkbox-field"><span><input type="checkbox" checked={remoteConsent} disabled={busy} onChange={event=>{if(localSession.context()?.digest!==digest)return;const allowed=event.target.checked?digest:'';remoteConsentRef.current=allowed;setRemoteConsentDigest(allowed)}}/> I agree to send this workout’s minimized coaching context for this request.</span></label><Button variant="outline" disabled={!context||!saved||!remoteConsent||!storeReady||busy||p.model==='off'} onClick={()=>void startRemote()}>Request secure cloud coaching</Button></details>
  </details>
  {(local.phase==='loading'||local.phase==='running')&&<Progress value={local.progress*100} aria-label="Local coaching progress"/>}
  {local.message&&<p role={local.phase==='error'?'alert':'status'}>{local.message}</p>}{message&&<p role="status">{message}</p>}
  {context&&<details className="today-more"><summary>Recorded training review · available without AI</summary><p className="small-copy">These facts are calculated from your records. The language model chooses which facts and review options to prioritize; it does not write new targets or change your plan.</p>{context.observations.map(observation=><p key={observation.id}>{observation.text}</p>)}</details>}
 </section>;
}
