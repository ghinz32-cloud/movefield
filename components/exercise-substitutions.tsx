"use client";
import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {exFor,niceDate,requiresSetup,targetText,type State} from '@/lib/training';
import {substitutionOptions,previewSubstitution,applySubstitution,type Substitution} from '@/lib/substitutions';
export function ExerciseSubstitutions({state:s,sessionId,from,onClose,onApply}:{state:State;sessionId:string;from:string;onClose:()=>void;onApply:(s:State)=>void}){
 const [version]=useState(s.plan!.version),[historyCount]=useState(s.history.length),[planId]=useState(s.plan!.id);
 const [to,setTo]=useState(''),[equipment,setEquipment]=useState('All'),[all,setAll]=useState(false),[setup,setSetup]=useState(''),[allowLonger,setAllowLonger]=useState(false),[ack,setAck]=useState(false),[error,setError]=useState(''),[review,setReview]=useState(false);
 const options=substitutionOptions(from),q:Substitution={sessionId,from,to,all,setup,allowLonger,acknowledgeSpecificity:ack,version,historyCount,planId},result=to?previewSubstitution(s,q):null;
 const edit=()=>{setReview(false);setError('')};
 return <Dialog open onOpenChange={v=>!v&&onClose()}><DialogContent className="customize-dialog substitution-dialog"><DialogHeader><DialogTitle>Choose a substitute</DialogTitle><DialogDescription>Equipment unavailable for {exFor(from).name}? Review another movement and its own targets.</DialogDescription></DialogHeader>
 {!to?<><label className="field">Equipment available<select value={equipment} onChange={e=>setEquipment(e.target.value)} aria-label="Substitute equipment"><option>All</option>{[...new Set(options.map(e=>e.equipment))].sort().map(eq=><option key={eq}>{eq}</option>)}</select></label><div className="customize-results">{options.filter(e=>equipment==='All'||e.equipment===equipment).map(e=><button key={e.id} onClick={()=>{setTo(e.id);setSetup('');setAck(false);setAllowLonger(false);edit()}}><b>{e.name}</b><span>{e.equipment} · {e.metric}</span></button>)}</div>{!options.length&&<p>No reviewed equipment substitute is listed for this movement yet. Use Customize plan to enter your own work.</p>}</>:<><div className="split"><h3>{exFor(from).name} → {exFor(to).name}</h3><Button variant="ghost" onClick={()=>{setTo('');edit()}}>Choose another</Button></div><p className="metric-note"><b>Record weight as:</b> {exFor(to).loadConvention}</p>{result?.changes[0]&&<p>New target: {result.changes[0].item.sets} × {targetText(result.changes[0].item)} reps · {result.changes[0].item.rest}s rest. Start with a manageable load.</p>}
 {requiresSetup(exFor(to))&&<label className="field">Machine and setup<Input maxLength={200} aria-label="Substitute machine setup" value={setup} onChange={e=>{setSetup(e.target.value);edit()}} placeholder="e.g. Gym A · seat 3 · handles 2"/></label>}
 <label className="check-line"><Checkbox checked={all} onCheckedChange={v=>{setAll(!!v);edit()}}/>Also replace in future repetitions of this workout</label><p className="small-copy">Leave unchecked for this workout only. Other workout types keep their original exercises.</p>
 {result?.warnings.map(w=><p className="notice" key={w}>{w}</p>)}{result?.specificity&&<label className="check-line"><Checkbox checked={ack} onCheckedChange={v=>{setAck(!!v);edit()}}/>I understand this replaces competition-lift practice.</label>}
 {result&&result.changes.some(x=>x.after>Math.max(x.before,s.plan!.profile.minutes))&&<label className="check-line"><Checkbox checked={allowLonger} onCheckedChange={v=>{setAllowLonger(!!v);edit()}}/>I have time for the longer sessions shown.</label>}
 {result&&<div className="review-dates">{result.changes.map(c=><p key={c.sessionId}>{niceDate(c.date)} · {c.item.sets} × {targetText(c.item)} · {c.before} → {c.after} min</p>)}</div>}{error&&<p role="alert" className="notice warning">{error}</p>}
 <div className="dialog-actions"><Button variant="outline" onClick={onClose}>Keep original exercise</Button><Button onClick={()=>{if(result?.errors.length){setError(result.errors.join(' '));return}if(!review){setReview(true);return}const r=applySubstitution(s,q);if(r.error)setError(r.error);else onApply(r.state)}}>{review?'Accept substitute':'Review substitute'}</Button></div></>}
 </DialogContent></Dialog>;
}
