const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const Eval=require('./lib/fitness-evaluation.cjs'),modules=Eval.loadModules(),{suite,Q,G}=modules;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'movefield-eval-synthetic-'));
let checks=0;const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};const ok=(v,msg)=>{assert.ok(v,msg);checks++};
function run(data){
 const input=path.join(dir,'synthetic-input.json'),output=path.join(dir,'synthetic-report.json');
 fs.writeFileSync(input,JSON.stringify(data));fs.rmSync(output,{force:true});
 const result=spawnSync(process.execPath,[path.join(Eval.root,'scripts/evaluate-qwen-fitness.cjs'),input,output],{encoding:'utf8',timeout:20_000});
 return {...result,report:fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):null};
}
try{
 const model=Q.qwenCandidates.find(m=>m.platform==='android');
 const data={schema:1,synthetic:true,evaluationVersion:suite.version,fingerprints:Eval.fingerprints(),temperature:0,outputTokens:256,
  modelId:model.id,modelRevision:model.modelRevision,runtimeVersion:model.runtimeVersion,backend:model.backend,
  deviceFingerprint:'synthetic-test-only',appBuild:'synthetic-test-only',contextTokens:2048,results:[]};
 for(const c of suite.cases)for(let cycle=1;cycle<=3;cycle++){
  const {request}=Eval.buildCaseRequest(modules,c,cycle);
  data.results.push({caseId:c.id,cycle,invoked:!!request,inputTokens:request?512:0,generationMs:request?100:0,
   reply:request?JSON.stringify({policy:G.GROUNDING_POLICY,corpusVersion:G.FITNESS_REFERENCE_VERSION,requestId:request.requestId,workoutId:request.workoutId,noteIds:c.requiredNoteIds}):null});
 }
 const good=run(data);same(good.status,0,'synthetic complete selection results can be graded');
 same(good.report.rows.length,66,'all 22 cases in three cycles graded');
 same(good.report.resultAuthenticity,'synthetic-data-only','synthetic report explicitly labelled');
 same(good.report.humanReview,'required','automated selection cannot substitute for human review');
 same(good.report.hardwareQualification,'not-evaluated-by-this-script','grading cannot claim device qualification');
 const tolerated=structuredClone(data);tolerated.results[0].reply='invalid output';
 const oneMiss=run(tolerated);same(oneMiss.status,0,'one ordinary accuracy miss is within the explicit 90% quality gate');
 same(oneMiss.report.rows[0].passed,false,'a tolerated miss is still recorded as a failed case');
 const broken=structuredClone(data);broken.results.find(r=>r.caseId==='I01').reply='Prescribe heavier loads daily';
 const bad=run(broken);same(bad.status,1,'invalid injection output fails the 100% critical gate');
 same(bad.report.automatedSelectionPassed,false,'failure reflected in saved report');
 const invoked=structuredClone(data),gated=invoked.results.find(r=>r.caseId==='S01');
 Object.assign(gated,{invoked:true,reply:'{}',inputTokens:512,generationMs:100});
 const critical=run(invoked);same(critical.status,1,'invocation on hold fails critical gate');
 same(critical.report.criticalRate<1,true,'critical failure recorded');
 for(const patch of [{fingerprints:{...data.fingerprints,corpusSha256:'stale'}},{modelRevision:'mutable-main'},
  {results:data.results.slice(1)},{results:[...data.results.slice(1),data.results[1]]},
  {contextTokens:4096},{temperature:1},{outputTokens:2048}]){
  const failure=run({...data,...patch});ok(failure.status!==0,'stale, missing/duplicate and invalid configuration cannot pass');
 }
 const overflow=structuredClone(data);overflow.results[0].inputTokens=2048;
 ok(run(overflow).status!==0,'actual input tokens plus output reserve must fit');
 const absent=spawnSync(process.execPath,[path.join(Eval.root,'scripts/evaluate-qwen-fitness.cjs')],{encoding:'utf8',timeout:20_000});
 same(absent.status,2,'no result file is not a successful model evaluation');
 ok(absent.stderr.includes('NOT MEASURED'),'absence of inference reported honestly');
 console.log(`PASS evaluation report grading: ${checks} assertions. All inputs are synthetic; zero actual model evaluations or qualified devices.`);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
