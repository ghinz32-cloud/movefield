import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {programReferences,referenceMatchesGoal,referenceEquipment} from '@/lib/program-catalog';
import {referenceOption,type PlanOption} from '@/lib/onboarding';
import type {Profile,Event} from '@/lib/training';

export function NamedProgramPicker({profile,events,selectedId,onSelect}:{profile:Profile;events:Event[];selectedId?:string;onSelect:(option:PlanOption)=>void}){
 const [query,setQuery]=useState(''),[more,setMore]=useState(false);
 const references=programReferences.filter(r=>referenceMatchesGoal(r,profile.goal));
 const matches=references.filter(r=>`${r.name} ${r.author} ${referenceEquipment(r)} ${r.days}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>Number(!!b.workouts)-Number(!!a.workouts));
 if(!references.length)return null;
 return <details className="official-programs"><summary>Named programs · {references.length} choices</summary>
  <p>Choose a prefilled manual template or a calendar for targets from your own source copy. Review equipment, variations and the author’s progression before starting.</p>
  <p className="small-copy">Source review checks the published routine. It does not establish clinical validation or individual suitability.</p>
  <label className="field"><span>Find a named program</span><Input value={query} maxLength={100} placeholder="Name, author, equipment or days" onChange={e=>{setQuery(e.target.value);setMore(false)}}/></label>
  {!matches.length&&<p role="status">No named programs match this search for your goal.</p>}
  <div className="plan-options">{matches.filter((r,i)=>more||i<3||r.id===selectedId).map(r=><article className={'plan-option '+(selectedId===r.id?'selected':'')} key={r.id}>
   <span className="pill">{r.workouts?'PREFILLED · MANUAL PROGRESSION':'SOURCE COPY · ENTER TARGETS'}</span>
   <h3>{r.name}</h3><p>{r.author} · {r.days} days/week · {r.weeks?r.weeks+' weeks':'ongoing'}</p><p>{r.description}</p>
   <details className="plan-fit-details"><summary>Equipment, scope &amp; progression</summary>
    <p>{r.experience} · {referenceEquipment(r)} · source checked {r.checked}</p>
    {r.requirements&&<p><b>Required:</b> {r.requirements.join(' · ')}</p>}
    {r.scope&&<ul className="fit-notes">{r.scope.map(n=><li key={n}>{n}</li>)}</ul>}
    <p>{r.progression||'Enter targets from your copy. The author’s loading and progression stay user directed.'}</p>
   </details>
   <div className="button-row"><Button variant="outline" asChild><a href={r.url} target="_blank" rel="noopener noreferrer">View original program</a></Button>
    <Button variant={selectedId===r.id?'default':'outline'} onClick={()=>onSelect(referenceOption(profile,events,r.id))}>{selectedId===r.id?'Selected':r.workouts?'Review this template':'Track my source copy'}</Button>
   </div>
  </article>)}</div>
  {matches.length>3&&<Button variant="outline" onClick={()=>setMore(v=>!v)}>{more?'Show fewer named programs':`See all ${matches.length} matches`}</Button>}
 </details>;
}
