const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {root,loadModules,buildCaseRequest,gradeReply,fingerprints}=require('./lib/fitness-evaluation.cjs');
const {G,Q,suite,...rest}=loadModules(),modules={G,Q,suite,...rest};
const args=process.argv.slice(2),input=args[0],output=args[1];
if(!input||!output||args.length!==2){
 console.error('Usage: node scripts/evaluate-qwen-fitness.cjs <local-raw-results.json> <local-report.json>\nNo model results supplied. Model accuracy: NOT MEASURED. See docs/fitness-grounding-2026-10-08.md for the input schema.');
 process.exit(2);
}
const raw=JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
assert.equal(raw.schema,1,'result schema');assert.equal(raw.evaluationVersion,suite.version,'evaluation version');
assert.equal(raw.temperature,suite.protocol.temperature,'tested sampling setting');
assert.equal(raw.outputTokens,suite.protocol.outputTokens,'reserved output tokens');
assert.deepEqual(raw.fingerprints,fingerprints(),'results must use the exact corpus/contract/suite');
const model=Q.qwenCandidates.find(m=>m.id===raw.modelId);
assert.ok(model,'known immutable model candidate');
for(const field of ['modelRevision','runtimeVersion','backend'])assert.equal(raw[field],model[field],field+' must match the candidate');
assert.ok(typeof raw.deviceFingerprint==='string'&&raw.deviceFingerprint.length>0,'measured device identification');
assert.ok(typeof raw.appBuild==='string'&&raw.appBuild.length>0,'tested app build');
assert.ok(Number.isSafeInteger(raw.contextTokens)&&raw.contextTokens>0&&raw.contextTokens<=model.contextTokens,'deployed context limit');
assert.ok(Array.isArray(raw.results),'case/cycle results required');
assert.equal(raw.results.length,suite.cases.length*suite.protocol.minimumCycles,'all cases in three cycles required');
const rows=[];
for(const c of suite.cases)for(let cycle=1;cycle<=suite.protocol.minimumCycles;cycle++){
 const records=raw.results.filter(r=>r.caseId===c.id&&r.cycle===cycle);
 assert.equal(records.length,1,`${c.id}/${cycle}: exactly one result`);
 const r=records[0],{context,request}=buildCaseRequest(modules,c,cycle);
 assert.equal(typeof r.invoked,'boolean','invocation result required');
 if(r.invoked){
  assert.ok(typeof r.reply==='string','raw reply required');
  assert.ok(Number.isSafeInteger(r.inputTokens)&&r.inputTokens>0,'actual tokenizer count required');
  assert.ok(r.inputTokens+suite.protocol.outputTokens<=raw.contextTokens,'prompt and reserved output fit the tested export');
  assert.ok(Number.isFinite(r.generationMs)&&r.generationMs>0,'measured generation time required');
 }else assert.equal(r.reply,null,'non-invoked cases have no fabricated model result');
 const grade=r.invoked===!!request?gradeReply(modules,c,context,request,r.reply):
  {passed:false,noteIds:[],reason:request?'eligible case did not run':'model invoked despite workflow gate'};
 rows.push({caseId:c.id,cycle,category:c.category,...grade});
}
const accuracy=rows.filter(r=>r.category==='accuracy'),critical=rows.filter(r=>r.category!=='accuracy');
const accuracyRate=accuracy.filter(r=>r.passed).length/accuracy.length,criticalRate=critical.filter(r=>r.passed).length/critical.length;
// The report grades saved raw results; it cannot attest that they came from a device or replace human review.
const report={schema:1,evaluationVersion:suite.version,fingerprints:fingerprints(),modelId:raw.modelId,modelRevision:raw.modelRevision,
 runtimeVersion:raw.runtimeVersion,backend:raw.backend,deviceFingerprint:raw.deviceFingerprint,appBuild:raw.appBuild,contextTokens:raw.contextTokens,
 accuracyRate,criticalRate,automatedSelectionPassed:accuracyRate>=suite.protocol.accuracyMinimum&&criticalRate===suite.protocol.criticalPassRate,
 resultAuthenticity:raw.synthetic===true?'synthetic-data-only':'not-attested-by-this-script',
 humanReview:'required',hardwareQualification:'not-evaluated-by-this-script',rows};
fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+'\n');
console.log(`Saved source-selection report: accuracy ${accuracyRate}, critical ${criticalRate}. Human review and hardware/interruption qualification still required.`);
if(!report.automatedSelectionPassed)process.exitCode=1;
