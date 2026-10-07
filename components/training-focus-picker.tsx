"use client";
import {Checkbox} from '@/components/ui/checkbox';
import {focusChoices,focusSources,selectedFocuses,type TrainingFocus} from '@/lib/training-focus';
import type {Profile} from '@/lib/training';

export function TrainingFocusPicker({profile,onChange}:{profile:Profile;onChange:(patch:Partial<Profile>)=>void}){
 const selected=selectedFocuses(profile);
 const toggle=(id:TrainingFocus,checked:boolean)=>onChange({focuses:checked?[...selected,id]:selected.filter(x=>x!==id)});
 return <section aria-labelledby="training-focus-heading" style={{marginTop:'2rem'}}>
  <h2 id="training-focus-heading">Anything to add?</h2>
  <p className="small-copy">Choose any extra work you want alongside your main goal. The preview checks whether it fits your time and recovery needs.</p>
  <div className="mode-choices">{focusChoices.map(choice=><label className={'mode-choice '+(selected.includes(choice.id)?'selected':'')} key={choice.id} style={{cursor:'pointer'}}>
   <Checkbox checked={selected.includes(choice.id)} onCheckedChange={v=>toggle(choice.id,Boolean(v))} aria-label={choice.title}/>
   <div><b>{choice.title}</b><p>{choice.description}</p></div>
  </label>)}</div>
  {selected.includes('jumping')&&<div className="notice blue"><div><p>Jumps need a clear, non-slip landing area. Start with a few small jumps and a full reset. There are no automatic height or load increases.</p>
   <label className="check-line"><Checkbox checked={!!profile.jumpReady} onCheckedChange={v=>onChange({jumpReady:Boolean(v)})}/>I have room to land safely and can land comfortably with control.</label>
   {(profile.age<18||profile.experience==='First time')&&<label className="check-line"><Checkbox checked={profile.supervision} onCheckedChange={v=>onChange({supervision:Boolean(v)})}/>Qualified instruction and supervision are available for jump practice.</label>}
  </div></div>}
  {profile.mode!=='app'&&selected.length>0&&<p className="small-copy">These interests are saved for your {profile.mode==='coach'?'coach':'own planning'}. Tracking mode adds no exercises or grouping.</p>}
  {profile.age<18&&<p className="small-copy">Youth plans can use supervised core and small jump practice. Supersets and weight-management add-ons are adult-only in this prototype.</p>}
  <details className="scope-details" style={{marginTop:'1rem'}}><summary>How these add-ons are chosen</summary><p className="small-copy">The sets, reps and schedule limits are prototype choices informed by these sources. They are not a validated personal prescription.</p><ul className="plain-list">{focusSources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>
 </section>
}
