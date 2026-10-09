export type ResearchPaper = {
 id:string; pmid:string; title:string; authors:string; year:number; firstPublished:string;
 doi:string; journal:string; url:string; pmcid:string; openAccess:boolean; studyTypes:string[];
 topics:string[]; hasAbstract:boolean; abstractSHA256:string; reviewLevel:string;
 screeningFlags:string[]; approvedForModel:false;
};
export type ResearchArchive = {schema:1;version:string;cutoff:string;retrievedAt:string;provider:string;method:string;queries:{topic:string;query:string;hitCount:number;returned:number;responseSHA256:string}[];papers:ResearchPaper[]};
// Search stays on the device. Bibliography never becomes assistant context automatically.
export function searchResearch(papers:readonly ResearchPaper[],query:string,topic='All',recentOnly=false):ResearchPaper[]{
 const words=query.trim().toLocaleLowerCase().slice(0,200).split(/\s+/).filter(Boolean);
 return papers.filter(p=>(topic==='All'||p.topics.includes(topic))&&(!recentOnly||p.firstPublished>='2025-01-01')&&words.every(word=>`${p.title} ${p.authors} ${p.doi} ${p.pmid} ${p.studyTypes.join(' ')}`.toLocaleLowerCase().includes(word)));
}
