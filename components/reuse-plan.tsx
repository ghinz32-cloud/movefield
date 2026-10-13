'use client';
import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {previewReusablePlan,reviewReusableLoads,acceptReusablePlan,type ReusablePlanPreview} from '@/lib/reusable-plan';
import {startingLoadDraftRows,startingLoadDraftChoices,editStartingLoadDraft,startingWeightInput,type StartingLoadDraft} from '@/lib/block-starting-loads';
import {day,niceDate,exFor,targetText,displayLoad,requiresSetup,type State} from '@/lib/training';
import {planName,sessionName,trainingCopy} from '@/lib/presentation';
export function ReusePlan({state,sourceId,onChange,onClose}:{state:State;sourceId:string;onChange:(fn:(s:State)=>State)=>Promise<boolean>;onClose:()=>void}){
 const [start,setStart]=useState(day()),[preview,setPreview]=useState<ReusablePlanPreview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[all,setAll]=useState(false);
 const [draft,setDraft]=useState<StartingLoadDraft>({}),[dirty,setDirty]=useState(false);
 const rows=preview?startingLoadDraftRows(state,preview.plan,draft):[],chosen=preview?.startingLoads.filter(c=>c.kg!==null).length??0;
 const edit=(key:string,patch:{value?:string;setup?:string})=>{if(!preview)return;setDraft(d=>editStartingLoadDraft(state,preview.plan,d,key,patch));setDirty(true);setError('')};
 const accept=()=>{if(!preview||busy)return;if(dirty){try{setPreview(reviewReusableLoads(state,preview,startingLoadDraftChoices(state,preview.plan,draft)));setDirty(false);setError('')}catch(e){setError((e as Error).message)}return}setBusy(true);setError('');void onChange(s=>acceptReusablePlan(s,preview)).then(saved=>{if(saved)onClose();else setError('The new block could not be saved. Your draft is kept; retry after checking the save error.')}).catch(e=>setError(e.message)).finally(()=>setBusy(false))};
 return <Dialog open onOpenChange={v=>!v&&!busy&&onClose()}><DialogContent className="reuse-block-dialog">
  <DialogHeader><DialogTitle>Reuse a saved block</DialogTitle><DialogDescription>Review the dates and targets for your new workouts. History is kept. Starting weights stay blank until you choose them.</DialogDescription></DialogHeader>
  <label className="field">New block starting date<Input aria-label="Reused block starting date" type="date" min={day()} value={start} disabled={busy} onChange={e=>{setStart(e.target.value);setPreview(null);setDraft({});setDirty(false);setError('')}}/></label>
  <Button disabled={busy} onClick={()=>{try{setPreview(previewReusablePlan(state,sourceId,start));setDraft({});setDirty(false);setAll(false);setError('')}catch(e){setPreview(null);setError((e as Error).message)}}}>Preview reused block</Button>
  {preview&&<>
   <h3>{planName(preview.plan)}</h3><p>{preview.plan.sessions.length} sessions · ends {niceDate(preview.plan.scheduleEnd!)} · {preview.plan.profile.mode==='app'?'App-created plan':preview.plan.profile.mode==='coach'?'Coach-directed targets':'Your own targets'}</p><p>{trainingCopy(preview.plan.progression)}</p>
   {rows.length>0&&<details className="block-starting-loads"><summary>Starting weights · {chosen} chosen</summary><p>Optional. Each weight applies to its first exercise exposure. Later workouts keep the plan’s progression rules. Blank means unknown.</p>
    {rows.map(row=><section key={row.key} className="block-starting-load-row"><div><b>{row.exercise.name}</b><p>{row.item.sets} × {targetText(row.item)} · {niceDate(row.date)}</p><p className="small-copy">{row.exercise.loadConvention}</p></div>
     {requiresSetup(row.exercise)&&<label className="field">Machine and setup<Input aria-label={`Starting setup for ${row.exercise.name} on ${niceDate(row.date)}`} value={draft[row.key]?.setup??row.setup} disabled={busy} maxLength={200} onChange={e=>edit(row.key,{setup:e.target.value})}/></label>}
     <div className="block-starting-load-controls"><label className="field">Weight ({state.profile.units})<Input aria-label={`Starting weight for ${row.exercise.name} on ${niceDate(row.date)}`} value={draft[row.key]?.value??''} type="text" inputMode="decimal" placeholder="Unknown" disabled={busy} maxLength={20} onChange={e=>edit(row.key,{value:e.target.value})}/></label>
      {row.recent&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>edit(row.key,{value:startingWeightInput(row.recent!.kg,state.profile.units)})}>Use recorded {displayLoad(row.recent.kg,state.profile.units)}<span className="sr-only"> for {row.exercise.name} on {niceDate(row.date)}</span></Button>}
     </div><p className="small-copy">{row.recent?niceDate(row.recent.date)+'. ':''}{row.reason}{row.limitKg!==undefined&&<> Available maximum: {displayLoad(row.limitKg,state.profile.units)}.</>}</p>
    </section>)}
   </details>}
   {dirty&&<p role="status">Review the edited weights before starting the block.</p>}
   <div className="customize-results reuse-block-schedule">{preview.plan.sessions.filter(x=>all||x.week===1).map(x=><div key={x.id}><b>{niceDate(x.date)} · {sessionName(x,preview.plan)} · {x.minutes} min</b>{x.items.map(i=><p key={i.exerciseId}>{exFor(i.exerciseId,state.custom).name} · {i.sets} × {targetText(i)} {exFor(i.exerciseId,state.custom).metric} · {i.rest}s rest{i.kg!==null&&<> · starting {displayLoad(i.kg,state.profile.units)}</>}</p>)}</div>)}</div>
   <Button variant="outline" disabled={busy} onClick={()=>setAll(!all)}>{all?'Show first week':'Show every workout'}</Button>
   <Button disabled={busy||!!state.active} onClick={accept}>{busy?'Saving…':dirty?'Review starting weights':'Start this reviewed block · keep history'}</Button>
  </>}
  {state.active&&<p>Finish or discard the active workout before starting another block.</p>}{error&&<p role="alert">{error}</p>}<Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
 </DialogContent></Dialog>;
}
