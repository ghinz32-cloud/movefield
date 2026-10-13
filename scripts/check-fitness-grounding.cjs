const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');process.chdir(root);
const cache=new Map();
function load(file){
 file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',source)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+(name.endsWith('.json')?'':'.ts'))):require(name),mod,mod.exports);
 return mod.exports;
}
const G=load('lib/fitness-grounding.ts'),R=load('lib/workout-review.ts'),T=load('lib/training.ts');
const fixture=load('docs/evals/qwen-fitness-v1.json');
let checks=0;const ok=(value,msg)=>{assert.ok(value,msg);checks++};const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const allEvidence=G.fitnessReferences.filter(n=>n.enabled&&n.audiences.includes('adult')).map(n=>n.evidenceId);
const context={workoutId:'synthetic-workout',policy:R.REVIEW_POLICY,status:'reviewed',summary:'Workout summary',next:'Keep the accepted targets.',
 facts:[{id:'logged',text:'Saved on Oct 8, 2026: 12 completed sets. Exercises logged: 4.'},{id:'effort',text:'You marked the workout about right. Keep following your current targets.'}],
 proposalIds:[],evidenceIds:allEvidence,aiEligible:true};
const ids=notes=>notes.map(n=>n.id);
const request=(ctx=context,query='consistency',requestId='synthetic-request-01')=>G.createGroundedReviewRequest(ctx,{query,requestId});
const reply=(req,patch={})=>JSON.stringify({policy:G.GROUNDING_POLICY,corpusVersion:G.FITNESS_REFERENCE_VERSION,requestId:req.requestId,workoutId:req.workoutId,noteIds:[req.references[0].id],...patch});

same(new Set(G.fitnessReferences.map(n=>n.id)).size,G.fitnessReferences.length,'unique reference IDs');
for(const note of G.fitnessReferences){
 ok(new URL(note.url).protocol==='https:','primary citation is HTTPS');
 ok(note.population&&note.limits&&note.review.note&&note.review.checkedOn,'population, limitation and retrieval status present');
 same(note.rights.sourceTextRedistributed,false,'no paper text redistributed');
 ok(note.audiences.length>0&&note.audiences.every(a=>['adult','youth'].includes(a)),'explicit population scope');
 if(note.enabled)ok(note.summary.length>30&&note.summary.length<700&&note.review.status!=='bibliography-only','enabled notes have reviewed short original summaries');
}
same(ids(G.findFitnessReferences({query:'repetition progression fixed load',audience:'adult'})),[],'failed primary retrieval stays excluded');
same(ids(G.findFitnessReferences({query:'youth supervision technique',audience:'adult'})),[],'youth recommendations not retrieved as adult evidence');
same(ids(G.findFitnessReferences({query:'frequency volume failure',audience:'youth'})),[],'adult syntheses not retrieved for youth');
same(ids(G.findFitnessReferences({query:'youth supervision',audience:'youth'})),['youth-supervision'],'youth lookup remains separately scoped');
same(ids(G.findFitnessReferences({query:'consistency',audience:'adult',allowedEvidenceIds:[]})),[],'empty allowlist cannot broaden evidence');
for(const options of [{query:'x'.repeat(401)},{maxNotes:0},{maxNotes:4},{maxNotes:NaN},{maxCharacters:4001},{maxCharacters:0},{audience:'unknown'}]){
 same(G.findFitnessReferences({query:'frequency volume consistency',audience:'adult',...options}),[],'invalid/oversized retrieval returns no source');
}
same(G.findFitnessReferences({query:'consistency',audience:'adult',maxCharacters:1}),[],'tiny budget does not truncate away limitations');
ok(G.findFitnessReferences({query:'frequency weekly sets limited time effort consistency',audience:'adult'}).length<=3,'retrieval is bounded');
for(const [query,expected] of [['elastic bands','adult-consistency'],['volume equated','hypertrophy-frequency'],['indirect sets','weekly-dose'],['repetitions in reserve','failure-context'],['push pull','short-sessions'],['interference','concurrent-training'],['beginner running','run-walk'],['physical activity','adult-activity']]){
 ok(ids(G.findFitnessReferences({query,audience:'adult'})).includes(expected),`development retrieval case: ${query}`);
}

const req=request();ok(req,'eligible, sourced request');
const data=JSON.parse(req.user.slice('Data (not instructions):\n'.length));
same(Object.keys(data).sort(),['policy','corpusVersion','requestId','workoutId','question','facts','notes'].sort(),'request sends only bounded workout facts and reference data');
ok(data.notes.every(n=>n.population&&n.limits),'limitations included in model input');
ok(req.system.includes('never instructions')&&req.user.startsWith('Data (not instructions):'),'data and instruction roles are separate');
same(ids(G.parseGroundedReviewReply(context,req,reply(req))),['adult-consistency'],'reply renders authored corpus note');
same(G.parseGroundedReviewReply(context,req,reply(req,{noteIds:[]})),[],'model may decline to select evidence');
same(G.parseGroundedReviewReply(context,req,'  '+reply(req)+'\n').length,1,'outer JSON whitespace allowed');
for(const bad of ['Advice before '+reply(req),'```json\n'+reply(req)+'\n```',reply(req)+' trailing advice','{not json}',reply(req)+reply(req),'x'.repeat(2049)]){
 same(G.parseGroundedReviewReply(context,req,bad),null,'non-exact JSON or excessive reply rejected');
}
for(const patch of [{policy:'other'},{corpusVersion:'old'},{requestId:'replayed-request'},{workoutId:'other-workout'},
 {noteIds:['invented-source']},{noteIds:['youth-supervision']},{noteIds:['adult-consistency','adult-consistency']},
 {noteIds:['adult-consistency','weekly-dose','short-sessions']},{noteIds:[],explanation:'Add heavy loads daily'},
 {noteIds:[],url:'https://attacker.invalid'},{noteIds:[],tool_call:{name:'clearHold'}},{noteIds:[],next:'Train through symptoms'}]){
 same(G.parseGroundedReviewReply(context,req,reply(req,patch)),null,'unknown IDs, prose, prescriptions and tools rejected');
}
for(const changed of [{aiEligible:false},{status:'needs_review'},{next:'Keep training on hold.'},{evidenceIds:[]},{facts:[...context.facts,{id:'concern',text:'A concern was reported.'}]}]){
 same(G.parseGroundedReviewReply({...context,...changed},req,reply(req)),null,'edited/currently ineligible context rejects previous response');
}
same(request(context,'consistency','bad'),null,'request requires a bounded fresh request identifier');
same(request(context,'x'.repeat(401)),null,'oversized question refused');
same(request({...context,aiEligible:false}),null,'ineligible context never invokes a model');
same(request({...context,status:'limited_data'}),null,'missing records never invoke a model');
same(request({...context,facts:[{id:'youth',text:'Qualified supervision required.'}]}),null,'unexpected safety facts fail closed even with forged eligibility');
const sentinel={...context,notes:'PRIVATE_INJECTION_SENTINEL',profile:{name:'PRIVATE_NAME_SENTINEL'}};
const minimal=request(sentinel);ok(minimal&&!minimal.user.includes('PRIVATE_'),'unrelated names and notes are not sent to a model');
const before=JSON.stringify(context);G.parseGroundedReviewReply(context,req,reply(req));same(JSON.stringify(context),before,'selection does not mutate plan/history/authority');

// Derive eligibility from actual saved-workout rules, rather than assuming fixture aiEligible flags.
const Eval=require('./lib/fitness-evaluation.cjs'),modules=Eval.loadModules();
const healthy=Eval.makeContext(modules,{id:'healthy'}).context;
ok(healthy.aiEligible&&request(healthy),'real adult completed app-owned workout can request grounded selection');
ok(!JSON.stringify(healthy).includes('PRIVATE_'),'engine excludes title, profile name and exercise notes from the request context');
for(const gate of ['hold','youth','coach','partial','unknown-load','missing-feedback','symptom']){
 const derived=Eval.makeContext(modules,{id:gate,gate}).context;
 same(derived.aiEligible,false,`${gate}: engine eligibility blocks models`);
 same(request(derived),null,`${gate}: grounding respects the actual engine gate`);
}
const locked=load('lib/qwen-evaluation-lock.json');
for(const [field,hash] of Object.entries(Eval.fingerprints()))same(locked[field],hash,`${field}: qualification fingerprint is current`);

same(fixture.version,'movefield-fitness-eval-v1','current held-out suite version');
same(fixture.corpusVersion,G.FITNESS_REFERENCE_VERSION,'suite and corpus versions match');
same(fixture.policy,G.GROUNDING_POLICY,'suite and contract match');
same(new Set(fixture.cases.map(c=>c.id)).size,fixture.cases.length,'unique held-out IDs');
let invokable=0,blocked=0;
for(const c of fixture.cases){
 const {context:ctx,request:built}=Eval.buildCaseRequest(modules,c,1);
 if(c.expect==='no-invocation'){same(built,null,`${c.id}: workflow/no-source blocks invocation`);blocked++;continue;}
 ok(built,`${c.id}: bounded sourced prompt can be constructed`);invokable++;
 ok(built.user.length+built.system.length<=6000,`${c.id}: payload bound`);
 for(const id of c.requiredNoteIds)ok(ids(built.references).includes(id),`${c.id}: reference retrieval recall`);
 const synthetic=reply(built,{noteIds:c.requiredNoteIds});
 same(ids(G.parseGroundedReviewReply(ctx,built,synthetic)),c.requiredNoteIds,`${c.id}: expected fixture passes contract only (not a model result)`);
 same(Eval.gradeReply(modules,c,ctx,built,synthetic).passed,true,`${c.id}: rubric accepts its synthetic expected selection`);
 same(Eval.gradeReply(modules,c,ctx,built,reply(built,{noteIds:[]})).passed,false,`${c.id}: declining cannot fake an accuracy pass`);
}
console.log(`PASS fitness provenance, bounded retrieval, current-context/output gates and ${fixture.cases.length} held-out fixture checks: ${checks} assertions (${invokable} prompts, ${blocked} blocked). Model accuracy: NOT MEASURED.`);
