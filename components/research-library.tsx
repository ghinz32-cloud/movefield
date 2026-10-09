'use client';
import {useEffect,useMemo,useState} from 'react';
import {type ResearchArchive,searchResearch} from '@/lib/research-library';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function ResearchLibrary(){
 const [archive,setArchive]=useState<ResearchArchive|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [query,setQuery]=useState(''),[topic,setTopic]=useState('All'),[recent,setRecent]=useState(false),[limit,setLimit]=useState(20);
 useEffect(()=>{const abort=new AbortController();fetch('/fitness-research.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(value=>{const data=value as ResearchArchive;if(data.schema!==1||!Array.isArray(data.papers)||!Array.isArray(data.queries))throw Error('invalid archive');setArchive(data);setError('')}).catch(()=>{if(!abort.signal.aborted)setError('The research archive could not open. Try again.');});return()=>abort.abort()},[retry]);
 const found=useMemo(()=>searchResearch(archive?.papers??[],query,topic,recent),[archive,query,topic,recent]);
 if(error)return <div role="alert" className="notice warning">{error}<Button onClick={()=>setRetry(v=>v+1)}>Retry</Button></div>;
 if(!archive)return <p role="status">Opening the research archive…</p>;
 return <section className="research-library" aria-label="Research papers"><h2>{archive.papers.length} research papers</h2><p className="small-copy">Indexed publications through {archive.cutoff}. Search records are separate from the reviewed findings used by plans.</p>
 <div className="research-filters"><Input aria-label="Search research papers" placeholder="Title, author, DOI or study type" value={query} maxLength={200} onChange={e=>{setQuery(e.target.value);setLimit(20)}}/><label className="field"><span>Topic</span><select value={topic} onChange={e=>{setTopic(e.target.value);setLimit(20)}}>{['All',...archive.queries.map(q=>q.topic)].map(t=><option key={t}>{t}</option>)}</select></label><label className="research-recent"><input type="checkbox" checked={recent} onChange={e=>{setRecent(e.target.checked);setLimit(20)}}/>2025–2026 first publications</label></div>
 <p role="status" className="small-copy">{found.length} matching records · showing {Math.min(limit,found.length)}</p>
 <div className="research-records">{found.slice(0,limit).map(p=><article key={p.id} className="research-record"><a href={p.url} target="_blank" rel="noopener noreferrer"><h3>{p.title}</h3></a><p className="small-copy">{p.authors||'Authors not indexed'} · {p.year} · {p.journal}</p><p className="small-copy">{p.studyTypes.join(' · ')||'Indexed publication'} · {p.reviewLevel==='search-indexed'?'Search record; applicability review pending':'Selected abstract reviewed'}{p.openAccess?' · Open access':''}</p>{p.screeningFlags.length>0&&<p className="small-copy">{p.screeningFlags.join(' · ')}</p>}<details><summary>Record details</summary><p className="small-copy">PMID {p.pmid} · first published {p.firstPublished}<br/>{p.doi?`DOI: ${p.doi}`:''}<br/>{p.topics.join(' · ')}</p><p className="small-copy">Bibliographic metadata only. This record is not supplied to Qwen and does not change your plan.</p></details></article>)}</div>
 {!found.length&&<p>No records match. Try a shorter search or another topic.</p>}{limit<found.length&&<Button variant="outline" onClick={()=>setLimit(v=>v+20)}>Show 20 more</Button>}
 <details className="today-more"><summary>Exercise archives</summary><p className="small-copy">Browse movement references: <a href="https://www.acefitness.org/resources/everyone/exercise-library/" target="_blank" rel="noopener noreferrer">ACE</a> · <a href="https://exrx.net/Lists/Directory" target="_blank" rel="noopener noreferrer">ExRx</a> · <a href="https://wger.de/en/exercise/overview/" target="_blank" rel="noopener noreferrer">wger</a>. Our exercise guides have their own source and review notes.</p></details>
 </section>;
}
