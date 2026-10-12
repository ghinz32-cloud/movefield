'use client';
import {useState} from 'react';
import {evidenceLinks,evidenceReview} from '@/lib/evidence-sources';
import {Input} from './ui/input';
export function ScienceLibrary(){
 const [query,setQuery]=useState(''),[kind,setKind]=useState('all');
 const items=Object.entries(evidenceLinks).filter(([id,s])=>(kind==='all'||(kind==='program'?/EXPERT|EXERCISE-DATA/.test(id):!/EXPERT|EXERCISE-DATA/.test(id)))&&(s.name+' '+s.summary).toLowerCase().includes(query.toLowerCase()));
 return <section aria-label="Searchable science library"><label className="field">Find research or guidance<Input aria-label="Search science references" value={query} onChange={e=>setQuery(e.target.value)} maxLength={200}/></label><label className="field">Reference type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">All references</option><option value="research">Research and guidance</option><option value="program">Program and dataset sources</option></select></label><p>{items.length} linked references. Review depth is shown per source. These references do not certify the app’s exact prescriptions.</p><div className="source-grid">{items.map(([id,s])=><a className="source-card" key={id} href={s.url} target="_blank" rel="noopener noreferrer"><div><b>{s.name}</b><p>{s.summary}</p><small>{/EXPERT|EXERCISE-DATA/.test(id)?'Program/dataset source':'Research/guidance reference'} · {evidenceReview(id)}{id==='ACSM-2009'?' · historical':''}</small></div></a>)}</div>{!items.length&&<p>No matching references. Try a shorter title or topic.</p>}</section>;
}
