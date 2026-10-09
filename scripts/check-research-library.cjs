const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const archive=JSON.parse(fs.readFileSync('public/fitness-research.json','utf8'));
const reviewed=JSON.parse(fs.readFileSync('docs/research-reviewed-2026-10-09.json','utf8'));
assert.equal(archive.schema,1);assert.ok(archive.papers.length>=500);assert.equal(archive.queries.length,18);
assert.equal(new Set(archive.papers.map(p=>p.pmid)).size,archive.papers.length);
const topics=new Set(archive.queries.map(q=>q.topic));
for(const q of archive.queries){assert.ok(q.returned>0&&q.returned<=60);assert.match(q.responseSHA256,/^[a-f0-9]{64}$/);assert.equal(new URL(q.url).hostname,'www.ebi.ac.uk');assert.ok(q.query.includes(archive.cutoff));}
for(const p of archive.papers){
 assert.match(p.pmid,/^\d+$/);assert.equal(p.id,'PMID-'+p.pmid);assert.equal(p.url,`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`);
 assert.ok(p.firstPublished>='2020-01-01'&&p.firstPublished<=archive.cutoff);assert.ok(p.title);assert.equal(typeof p.authors,'string');
 assert.equal(p.approvedForModel,false);assert.equal('abstractText' in p,false);assert.equal('fullText' in p,false);
 assert.ok(p.topics.length&&p.topics.every(t=>topics.has(t)));assert.equal(new Set(p.topics).size,p.topics.length);
 if(p.hasAbstract)assert.match(p.abstractSHA256,/^[a-f0-9]{64}$/);
 if(p.reviewLevel==='selected-abstract-reviewed')assert.ok(reviewed.papers.some(r=>r.pmid===p.pmid&&r.abstractSHA256===p.abstractSHA256));
}
const mod={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/research-library.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const search=mod.exports.searchResearch;
assert.equal(search(archive.papers,'').length,archive.papers.length);
const rest=archive.papers.find(p=>p.pmid==='39205815');assert.deepEqual(search(archive.papers,rest.doi),[rest]);
assert.deepEqual(search(archive.papers,'  39205815   '),[rest]);assert.ok(search(archive.papers,'training').length>100);
assert.equal(search(archive.papers,'unlikely no matching publication title 123xxx').length,0);
assert.ok(search(archive.papers,'','Women').every(p=>p.topics.includes('Women')));
assert.ok(search(archive.papers,'','All',true).every(p=>p.firstPublished>='2025-01-01'));
assert.equal(search(archive.papers,'','missing topic').length,0);
assert.ok(search(archive.papers,'resistance training').every(p=>/resistance/i.test(p.title+' '+p.studyTypes.join(' '))&&/training/i.test(p.title+' '+p.studyTypes.join(' '))));
console.log(`PASS ${archive.papers.length} unique bounded metadata records, ${archive.queries.length} source queries, review fingerprints and on-device search. No corpus/training approval inferred.`);
