"use client";
import {useRef,useState} from 'react';
import {sessionName} from '@/lib/presentation';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {type State,type Item,exercises,exFor,matchesExercise,niceDate,targetText} from '@/lib/training';
import {type TrackingEdit,previewTrackingEdit,applyTrackingEdit} from '@/lib/tracking';
import {userTargetError} from '@/lib/customize';

export function TrackingEditor({state,sessionId,onClose,onApply}:{state:State;sessionId:string;onClose:()=>void;onApply:(state:State)=>boolean}){
 const session=state.plan?.sessions.find(s=>s.id===sessionId);
 const [base]=useState({planId:state.plan?.id||'',version:state.plan?.version||0,sessionId});
 const [items,setItems]=useState<Item[]>(()=>session?.items.map(i=>({...i}))||[]),[search,setSearch]=useState(''),[selected,setSelected]=useState(''),[editingId,setEditingId]=useState<string|null>(null),[sets,setSets]=useState('2'),[amount,setAmount]=useState('8'),[maximum,setMaximum]=useState('12'),[rest,setRest]=useState('90'),[repeatWeekday,setRepeat]=useState(false),[allowLonger,setLonger]=useState(false),[error,setError]=useState('');
 const draftItems=useRef(items),keepStarted=useRef(false),saveStarted=useRef(false),lastMove=useRef(-Infinity);
 const setDraftItems=(value:Item[])=>{draftItems.current=value;setItems(value)};
 const edit:TrackingEdit={...base,items,repeatWeekday,allowLonger},preview=previewTrackingEdit(state,edit),library=[...exercises,...state.custom],exercise=library.find(x=>x.id===selected);
 const stale=!session||!state.plan||state.plan.id!==base.planId||state.plan.version!==base.version;
 const cancelExercise=()=>{setSelected('');setEditingId(null);keepStarted.current=false};
 const keep=()=>{
  if(stale||keepStarted.current)return;
  if(!exercise){setError('Choose an exercise first.');return}
  const prior=editingId?draftItems.current.find(i=>i.exerciseId===editingId):undefined;
  if(editingId&&!prior){setError('That exercise changed. Cancel this edit and select it again.');return}
  const item:Item={...prior,exerciseId:selected,sets:Number(sets),reps:Number(amount),...(exercise.metric==='reps'?{repMin:Number(amount),repMax:Number(maximum)}:{repMin:undefined,repMax:undefined}),rest:Number(rest),kg:null};
  const problem=userTargetError(item,exercise.metric,'tracking');if(problem){setError(problem);return}
  if(draftItems.current.some(x=>x.exerciseId===selected&&x.exerciseId!==editingId)){setError('That exercise is already listed. Edit its targets instead.');return}
  if(draftItems.current.length>=100&&editingId===null){setError('This workout already has 100 exercises.');return}
  keepStarted.current=true;
  setDraftItems(editingId===null?[...draftItems.current,item]:draftItems.current.map(x=>x.exerciseId===editingId?item:x));setSelected('');setEditingId(null);setError('');
 };
 const handleMove=(id:string,delta:number,now:number)=>{if(now-lastMove.current<300)return;lastMove.current=now;const next=draftItems.current.slice(),n=next.findIndex(x=>x.exerciseId===id);if(stale||n<0||n+delta<0||n+delta>=next.length)return;[next[n],next[n+delta]]=[next[n+delta],next[n]];setDraftItems(next)};
 const save=()=>{
  if(stale||saveStarted.current)return;
  if(selected){setError('Keep or cancel your exercise edit before saving.');return}
  const result=applyTrackingEdit(state,{...edit,items:draftItems.current});if(result.error){setError(result.error);return}
  saveStarted.current=true;
  try{if(onApply(result.state))onClose();else{saveStarted.current=false;setError('The changes could not be saved. Your targets remain open.')}}catch(error){saveStarted.current=false;setError(error instanceof Error?error.message:'The changes could not be saved. Your targets remain open.')}
 };
 if(stale||!session||!state.plan)return <Dialog open onOpenChange={open=>!open&&onClose()}><DialogContent><DialogHeader><DialogTitle>Workout changed</DialogTitle><DialogDescription>The plan changed while this editor was open. Close and reopen this workout to review its current targets.</DialogDescription></DialogHeader><Button onClick={onClose}>Close editor</Button></DialogContent></Dialog>;
 const currentPlan=state.plan;
 return <Dialog open onOpenChange={open=>!open&&onClose()}><DialogContent className="customize-dialog"><DialogHeader><DialogTitle>Your workout targets</DialogTitle><DialogDescription>{sessionName(session,currentPlan)} · {niceDate(session.date)}. Enter your coach’s or your own exercises, targets and rest.</DialogDescription></DialogHeader>
  <div className="tracking-items">{items.map((i,n)=><section key={i.exerciseId} className="tracking-item"><b>{n+1}. {exFor(i.exerciseId,state.custom).name}</b><p>{i.sets} × {targetText(i)} {exFor(i.exerciseId,state.custom).metric} · {i.rest}s rest</p><div className="button-row">
   <Button size="sm" variant="outline" onClick={()=>{setEditingId(i.exerciseId);setSelected(i.exerciseId);setSets(String(i.sets));setAmount(String(i.repMin??i.reps));setMaximum(String(i.repMax??i.reps));setRest(String(i.rest));keepStarted.current=false;setError('')}}>Edit</Button>
   <Button size="sm" variant="ghost" onClick={()=>{setDraftItems(draftItems.current.filter(x=>x.exerciseId!==i.exerciseId));if(editingId===i.exerciseId)cancelExercise()}}>Remove</Button>
   <Button size="sm" variant="ghost" disabled={n===0} onClick={()=>handleMove(i.exerciseId,-1,Date.now())} aria-label={`Move ${exFor(i.exerciseId,state.custom).name} up`}>Up</Button>
   <Button size="sm" variant="ghost" disabled={n===items.length-1} onClick={()=>handleMove(i.exerciseId,1,Date.now())} aria-label={`Move ${exFor(i.exerciseId,state.custom).name} down`}>Down</Button>
  </div></section>)}</div>
  {!selected?<><label className="field">Find an exercise<Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your exercise library" maxLength={200}/></label><div className="customize-results">{library.filter(e=>matchesExercise(e,search)).slice(0,12).map(e=><button key={e.id} onClick={()=>{setSelected(e.id);setAmount(e.metric==='reps'?'8':e.metric==='seconds'?'30':'10');setMaximum('12');setEditingId(null);keepStarted.current=false}}><b>{e.name}</b><span>{e.equipment}</span></button>)}</div></>:exercise&&<section className="tracking-item"><h3>{exercise.name}</h3><div className="field-grid">{[{label:'Sets',value:sets,set:setSets},{label:exercise.metric==='reps'?'Minimum reps':'Target '+exercise.metric,value:amount,set:setAmount},...(exercise.metric==='reps'?[{label:'Maximum reps',value:maximum,set:setMaximum}]:[]),{label:'Rest seconds',value:rest,set:setRest}].map(f=><label className="field" key={f.label}>{f.label}<Input aria-label={f.label} type="number" step={exercise.metric==='reps'?'1':'any'} value={f.value} onChange={e=>f.set(e.target.value)}/></label>)}</div><div className="button-row"><Button onClick={keep}>{editingId===null?'Add exercise':'Keep edited targets'}</Button><Button variant="ghost" onClick={cancelExercise}>Cancel exercise edit</Button></div></section>}
  <label className="check-line"><Checkbox checked={repeatWeekday} onCheckedChange={v=>setRepeat(!!v)}/>{currentPlan.profile.programId?.startsWith('ref-')?'Also use these targets for later unstarted repetitions of this source workout':'Also use these targets for later unstarted workouts on the same weekday'}</label>
  <p>{preview.minutes} minutes per workout · {preview.sessions.length} workouts will change.</p>
  {preview.minutes>currentPlan.profile.minutes&&<label className="check-line"><Checkbox checked={allowLonger} onCheckedChange={v=>setLonger(!!v)}/>I have time for the longer workouts shown.</label>}
  <details className="review-dates"><summary>Review affected dates</summary>{preview.sessions.map(s=><p key={s.id}>{niceDate(s.date)} · {sessionName(s,currentPlan)}</p>)}</details>
  {error&&<p role="alert" className="notice warning">{error}</p>}
  <div className="dialog-actions"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save reviewed targets</Button></div>
 </DialogContent></Dialog>;
}
