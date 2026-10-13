"use client";
import {useEffect,useState,useSyncExternalStore} from 'react';
import {Button} from './ui/button';
import {Progress} from './ui/progress';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './ui/select';
import {useAppPreferences} from './app-preferences';
import QwenModelFiles from './qwen-model-files';
import {QWEN_DEMO_TOPICS as topics,qwenDemoContext} from '@/lib/qwen-demo-context';
import {createQwenRuntime,qwenRuntimeSupport} from '@/lib/qwen-runtime';
import type {QwenWorkerPort} from '@/lib/qwen-runtime-contract';

export default function QwenDemo(){
 const {p}=useAppPreferences(),[topic,setTopic]=useState<string>(topics[0]),[support,setSupport]=useState('Checking this browser…');
 const [runtime]=useState(()=>createQwenRuntime(()=>new Worker('/runtime/qwen-worker.js',{type:'module'}) as unknown as QwenWorkerPort,qwenDemoContext));
 const state=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot,runtime.getSnapshot),busy=['loading','running'].includes(state.phase);
 useEffect(()=>{queueMicrotask(()=>setSupport(qwenRuntimeSupport()));return()=>runtime.stop('');},[runtime]);
 useEffect(()=>{if(p.model==='off')runtime.stop('The local assistant is off.');},[p.model,runtime]);
 return <section className="card"><h2>Try Qwen locally</h2><p className="muted">Qwen selects reviewed sources for a fictional workout. Your workout records are not sent to the model.</p>
  <p className="small-copy">Publisher Qwen3 0.6B · experimental. The trained version still needs browser testing. This demo keeps your training targets unchanged.</p>
  <label className="field"><span>Sample question</span><Select value={topic} disabled={busy} onValueChange={setTopic}><SelectTrigger aria-label="Sample question"><SelectValue/></SelectTrigger><SelectContent>{topics.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></label>
  {support&&<p role="status" className="notice warning">{support}</p>}
  {p.model==='off'&&<p className="small-copy">Enable the local assistant in Settings to run this sample.</p>}
  <details className="today-more"><summary>Download or check Qwen files</summary><QwenModelFiles onRemove={()=>runtime.stop('Qwen unloaded before deleting model files.')}/></details>
  <div className="button-row"><Button disabled={!!support||p.model==='off'||busy} onClick={()=>void runtime.run(topic)}>{state.phase==='ready'?'Run sample again':'Run Qwen sample'}</Button><Button variant="outline" disabled={!busy&&state.phase!=='ready'} onClick={()=>runtime.stop()}>{busy?'Cancel Qwen':'Unload Qwen'}</Button></div>
  {busy&&<Progress value={state.phase==='loading'?state.progress*100:100} aria-label="Qwen sample progress"/>}
  {state.message&&<p role={state.phase==='error'?'alert':'status'}>{state.message}</p>}
  {state.notes.map(n=><article key={n.id}><h3>{n.title}</h3><p>{n.summary}</p><p className="small-copy">{n.population} · {n.limits}</p><a href={n.url} target="_blank" rel="noopener noreferrer">Read the study</a></article>)}
  {state.metrics&&<p className="small-copy">This run: {state.metrics.promptTokens} input tokens · {state.metrics.outputTokens} output tokens · {(state.metrics.generationMs/1000).toFixed(1)}s generation. One run does not qualify this device.</p>}
 </section>;
}
