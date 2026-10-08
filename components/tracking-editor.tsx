"use client";
import {sessionName} from '@/lib/presentation';

import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {type State,type Item,exercises,exFor,matchesExercise,niceDate} from '@/lib/training';
import {type TrackingEdit,previewTrackingEdit,applyTrackingEdit} from '@/lib/tracking';

export function TrackingEditor({state,sessionId,onClose,onApply}:{state:State;sessionId:string;onClose:()=>void;onApply:(state:State)=>boolean}){
 const session=state.plan!.sessions.find(s=>s.id===sessionId)!;
 const [base]=useState({planId:state.plan!.id,version:state.plan!.version,sessionId});
 const [items,setItems]=useState<Item[]>(session.items.map(i=>({...i}))),[search,setSearch]=useState(''),[selected,setSelected]=useState(''),[editing,setEditing]=useState<number|null>(null),[sets,setSets]=useState('2'),[amount,setAmount]=useState('8'),[rest,setRest]=useState('90'),[repeatWeekday,setRepeat]=useState(false),[allowLonger,setLonger]=useState(false),[error,setError]=useState('');
 const edit:TrackingEdit={...base,items,repeatWeekday,allowLonger},preview=previewTrackingEdit(state,edit),library=[...exercises,...state.custom];
 const keep=()=>{const i:Item={exerciseId:selected,sets:Number(sets),reps:Number(amount),rest:Number(rest),kg:null};
  if(!selected||!Number.isInteger(i.sets)||i.sets<1||i.sets>20||!Number.isFinite(i.reps)||i.reps<=0||i.reps>999||exFor(selected,state.custom).metric==='reps'&&!Number.isInteger(i.reps)||!Number.isFinite(i.rest)||i.rest<0||i.rest>3600){setError('Enter 1–20 sets, a positive target up to 999, and 0–3,600 seconds rest. Reps must be whole numbers.');return}
  if(items.some((x,n)=>x.exerciseId===selected&&n!==editing)){setError('That exercise is already listed. Edit its targets instead.');return}
  setItems(v=>editing===null?[...v,i]:v.map((x,n)=>n===editing?i:x));setSelected('');setEditing(null);setError('');
 };
 const move=(n:number,d:number)=>setItems(v=>{const next=v.slice();[next[n],next[n+d]]=[next[n+d],next[n]];return next});
 return <Dialog open onOpenChange={open=>!open&&onClose()}><DialogContent className="customize-dialog"><DialogHeader><DialogTitle>Your workout targets</DialogTitle><DialogDescription>{sessionName(session,state.plan)} · {niceDate(session.date)}. Enter your coach’s or your own exercises, targets and rest.</DialogDescription></DialogHeader>
 <div className="tracking-items">{items.map((i,n)=><section key={i.exerciseId} className="tracking-item"><b>{n+1}. {exFor(i.exerciseId,state.custom).name}</b><p>{i.sets} × {i.reps} {exFor(i.exerciseId,state.custom).metric} · {i.rest}s rest</p><div className="button-row"><Button size="sm" variant="outline" onClick={()=>{setEditing(n);setSelected(i.exerciseId);setSets(String(i.sets));setAmount(String(i.reps));setRest(String(i.rest));setError('')}}>Edit</Button><Button size="sm" variant="ghost" onClick={()=>{setItems(v=>v.filter((_,x)=>x!==n));setSelected('');setEditing(null)}}>Remove</Button><Button size="sm" variant="ghost" disabled={n===0} onClick={()=>move(n,-1)} aria-label={`Move ${exFor(i.exerciseId,state.custom).name} up`}>Up</Button><Button size="sm" variant="ghost" disabled={n===items.length-1} onClick={()=>move(n,1)} aria-label={`Move ${exFor(i.exerciseId,state.custom).name} down`}>Down</Button></div></section>)}</div>
 {!selected?<><label className="field">Find an exercise<Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your exercise library"/></label><div className="customize-results">{library.filter(e=>matchesExercise(e,search)).slice(0,12).map(e=><button key={e.id} onClick={()=>{setSelected(e.id);setAmount(e.metric==='reps'?'8':e.metric==='seconds'?'30':'10');setEditing(null)}}><b>{e.name}</b><span>{e.equipment}</span></button>)}</div></>:<section className="tracking-item"><h3>{exFor(selected,state.custom).name}</h3><div className="field-grid">{[{label:'Sets',value:sets,set:setSets},{label:'Target '+exFor(selected,state.custom).metric,value:amount,set:setAmount},{label:'Rest seconds',value:rest,set:setRest}].map(f=><label className="field" key={f.label}>{f.label}<Input type="number" step="any" value={f.value} onChange={e=>f.set(e.target.value)}/></label>)}</div><div className="button-row"><Button onClick={keep}>{editing===null?'Add exercise':'Keep edited targets'}</Button><Button variant="ghost" onClick={()=>{setSelected('');setEditing(null)}}>Cancel exercise edit</Button></div></section>}
 <label className="check-line"><Checkbox checked={repeatWeekday} onCheckedChange={v=>setRepeat(!!v)}/>Also use these targets for later unstarted workouts on the same weekday</label>
 <p>{preview.minutes} minutes per workout · {preview.sessions.length} workouts will change.</p>
 {preview.minutes>state.plan!.profile.minutes&&<label className="check-line"><Checkbox checked={allowLonger} onCheckedChange={v=>setLonger(!!v)}/>I have time for the longer workouts shown.</label>}
 <details className="review-dates"><summary>Review affected dates</summary>{preview.sessions.map(s=><p key={s.id}>{niceDate(s.date)} · {sessionName(s,state.plan)}</p>)}</details>
 {error&&<p role="alert" className="notice warning">{error}</p>}
 <div className="dialog-actions"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={()=>{if(selected){setError('Keep or cancel your exercise edit before saving.');return}const r=applyTrackingEdit(state,edit);if(r.error){setError(r.error);return}if(onApply(r.state))onClose();else setError('The changes could not be saved. Your targets remain open.')}}>Save reviewed targets</Button></div></DialogContent></Dialog>;
}
