"use client";
import {useEffect,useState} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {type State,type Exercise,toKg,displayLoad,requiresSetup,setEquipmentLimit,changed} from '@/lib/training';
export function EquipmentLimits({state,onChange,exercise}:{state:State;onChange:(s:State)=>void;exercise?:Exercise}){
 const setup=exercise&&requiresSetup(exercise)?state.loadContext?.[exercise.id]||'':'';
 const cap=exercise?state.equipmentCaps?.find(c=>c.exerciseId===exercise.id&&c.setup===setup)?.maxKg:state.profile.dumbbellMaxKg;
 const [draft,setDraft]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{setDraft(cap===undefined?'':String(Math.round(cap*(state.profile.units==='lb'?2.2046226218:1)*100)/100));setMessage('')},[cap,exercise?.id,setup,state.profile.units]);
 const blocked=Boolean(state.active)||Boolean(exercise&&requiresSetup(exercise)&&!setup.trim());
 function save(){const n=draft.trim()===''?undefined:Number(draft),kg=n===undefined?undefined:toKg(n!,state.profile.units);if(kg!==undefined&&(!Number.isFinite(kg)||kg<0||kg>(exercise?1500:500))){setMessage('Enter a valid nonnegative weight, or leave it blank if unknown.');return}
  if(exercise){const r=setEquipmentLimit(state,exercise.id,kg);if(r.error){setMessage(r.error);return}onChange(r.state)}
  else onChange(changed({...state,profile:{...state.profile,dumbbellMaxKg:kg},proposals:state.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)},'Updated available dumbbell maximum'));
  setMessage('Equipment limit saved. Future suggestions use this limit; past records stay unchanged.');
 }
 return <section className="equipment-limit"><h3>{exercise?'This exercise’s equipment limit':'Your dumbbell limit'}</h3><p className="small-copy">{exercise?exercise.loadConvention:'Enter the weight of ONE dumbbell. If your pair is 25 lb each, enter 25, not 50.'} {exercise&&requiresSetup(exercise)?'This limit belongs only to the machine and setup label above.':''}</p><label className="field"><span>{exercise?'Maximum available load':'Heaviest single dumbbell'} ({state.profile.units})</span><Input type="number" min={0} step="any" disabled={blocked} value={draft} placeholder="Unknown — leave blank" onChange={e=>{setDraft(e.target.value);setMessage('')}}/><small>Blank means unknown. Zero means unavailable. A maximum does not tell us which smaller weights exist.</small></label>{exercise?.equipment==='Dumbbell'&&state.profile.dumbbellMaxKg!==undefined&&<p className="small-copy">Your overall dumbbell limit also applies: {displayLoad(state.profile.dumbbellMaxKg,state.profile.units)} per dumbbell. The lower limit wins.</p>}<Button variant="outline" disabled={blocked} onClick={save}>Save equipment limit</Button>{blocked&&<p className="small-copy">{state.active?'Finish or save the active workout before changing equipment.':'Add a machine and setup label first.'}</p>}{message&&<p role="status" className="small-copy">{message}</p>}</section>
}
