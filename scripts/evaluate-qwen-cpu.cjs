// Separate from the immutable browser/native candidate grader. A float32 CPU
// LoRA experiment cannot qualify the precompiled WebGPU model.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const Eval=require('./lib/fitness-evaluation.cjs'),{createLoader}=require('./lib/load-typescript.cjs');
const modules=Eval.loadModules(),C=createLoader()('lib/qwen-runtime-contract.ts');
const [mode,input,output]=process.argv.slice(2);
if(mode==='--prepare'&&input){
 const rows=[];
 for(const c of modules.suite.cases)for(let cycle=1;cycle<=modules.suite.protocol.minimumCycles;cycle++){
  const {request}=Eval.buildCaseRequest(modules,c,cycle);
  rows.push({caseId:c.id,cycle,prompt:request?C.qwenCompletionPrompt(request):null});
 }
 fs.writeFileSync(input,JSON.stringify({schema:1,evaluationVersion:modules.suite.version,fingerprints:Eval.fingerprints(),temperature:modules.suite.protocol.temperature,outputTokens:modules.suite.protocol.outputTokens,contextTokens:2048,cases:rows},null,2)+'\n');
 console.log(`Prepared ${rows.length} separate evaluation runs; no expected selections supplied to the model.`);
}else if(mode==='--grade'&&input&&output){
 const raw=JSON.parse(fs.readFileSync(input,'utf8')),manifest=JSON.parse(fs.readFileSync('training/qwen-evidence-v1/manifest.json','utf8'));
 assert.equal(raw.schema,1);assert.equal(raw.evaluationVersion,modules.suite.version);assert.deepEqual(raw.fingerprints,Eval.fingerprints());
 assert.equal(raw.temperature,modules.suite.protocol.temperature);assert.equal(raw.outputTokens,256);assert.equal(raw.contextTokens,2048);
 assert.deepEqual(raw.baseModel,manifest.baseModel);assert.match(raw.adapterSha256,/^[0-9a-f]{64}$/);
 assert.equal(raw.results.length,modules.suite.cases.length*3);const rows=[];
 for(const c of modules.suite.cases)for(let cycle=1;cycle<=3;cycle++){
  const found=raw.results.filter(r=>r.caseId===c.id&&r.cycle===cycle);assert.equal(found.length,1);
  const r=found[0],{context,request}=Eval.buildCaseRequest(modules,c,cycle);
  assert.equal(r.invoked,!!request);
  if(request){assert.equal(typeof r.reply,'string');assert.ok(C.qwenPromptFits(r.inputTokens));assert.ok(Number.isSafeInteger(r.outputTokens)&&r.outputTokens>0&&r.outputTokens<=256);assert.ok(r.generationMs>0)}
  else assert.equal(r.reply,null);
  rows.push({caseId:c.id,cycle,category:c.category,...Eval.gradeReply(modules,c,context,request,r.reply)});
 }
 const accuracy=rows.filter(r=>r.category==='accuracy'),critical=rows.filter(r=>r.category!=='accuracy');
 const report={schema:1,kind:'actual-cpu-lora-experiment',baseModel:raw.baseModel,adapterSha256:raw.adapterSha256,
  rawResultsSha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex'),fingerprints:Eval.fingerprints(),
  evaluationVersion:raw.evaluationVersion,temperature:raw.temperature,contextTokens:2048,outputTokens:256,
  accuracyRate:accuracy.filter(r=>r.passed).length/accuracy.length,criticalRate:critical.filter(r=>r.passed).length/critical.length,
  invokedRuns:raw.results.filter(r=>r.invoked).length,gatedRuns:raw.results.filter(r=>!r.invoked).length,
  environment:raw.environment,elapsedSeconds:raw.elapsedSeconds,rows,qualified:false,demoUsesThisAdapter:false,
  limits:'Actual float32 CPU inference. Results do not qualify the different quantized browser artifact, device latency/memory, interruption behavior or the demo’s temperature. Human relevance review remains required.'};
 report.automatedSelectionPassed=report.accuracyRate>=0.9&&report.criticalRate===1;
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({accuracyRate:report.accuracyRate,criticalRate:report.criticalRate,invokedRuns:report.invokedRuns,gatedRuns:report.gatedRuns,qualified:false}));
 if(!report.automatedSelectionPassed)process.exitCode=1;
}else{console.error('Usage: --prepare prompts.json | --grade raw.json report.json');process.exitCode=2;}
