const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto');
const {load}=require('./domain-test-loader.cjs');
const facts=load('lib/coaching-facts.ts'),source=fs.readFileSync('lib/server/coaching.ts','utf8');
const input={policy:'highlights-v1',adult:true,mode:'app',hold:false,workout:{id:'synthetic-consent-boundary',revision:1,partial:false,effort:'right',symptom:'no',sets:[{exerciseId:'squat',set:1,reps:8,kg:20,done:true}],targets:[{exerciseId:'squat',sets:1}]}};
facts.coachingFacts(facts.coachingInputSchema.parse(input));
const output=[];
(async()=>{
 for(const change of ['consent-revoked','profile-deleted','revision-replaced','normal','inflight-revoked']){
  const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE cloud_profile(owner_id TEXT PRIMARY KEY,revision INTEGER,deleted_at INTEGER,ai_consent INTEGER,consent_version INTEGER);CREATE TABLE coaching_job(id TEXT PRIMARY KEY,owner_id TEXT,context_digest TEXT,revision INTEGER,consent_version INTEGER,status TEXT,input TEXT,output TEXT,created_at INTEGER,updated_at INTEGER)');
  db.prepare('INSERT INTO cloud_profile VALUES(?,?,?,?,?)').run('synthetic-owner',1,null,1,1);
  db.prepare('INSERT INTO coaching_job VALUES(?,?,?,?,?,?,?,?,?,?)').run('synthetic-job','synthetic-owner','a'.repeat(64),1,1,'queued',JSON.stringify(input),null,1,1);
  const D1={prepare:sql=>({bind:(...args)=>({first:async()=>db.prepare(sql).get(...args)||null,run:async()=>({meta:{changes:db.prepare(sql).run(...args).changes}})})})};
  let quotaCalls=0,providerCalls=0,profileAtDispatch;
  const module={exports:{}};
  new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>{
   if(name==='../coaching-facts')return facts;
   if(name==='./cloud-api')return {quota:async()=>{if(++quotaCalls===2){
    if(change==='consent-revoked'){db.prepare('UPDATE cloud_profile SET ai_consent=0,consent_version=2').run();db.prepare("UPDATE coaching_job SET status='cancelled',input='',output=NULL").run()}
    if(change==='profile-deleted'){db.prepare('UPDATE cloud_profile SET deleted_at=1,ai_consent=0,consent_version=2').run();db.prepare("UPDATE coaching_job SET status='cancelled',input='',output=NULL").run()}
    if(change==='revision-replaced')db.prepare('UPDATE cloud_profile SET revision=2').run();
   }}};
   throw Error('Unexpected module '+name);
  },module,module.exports);
  const previous=global.fetch;global.fetch=async()=>{providerCalls++;if(change==='inflight-revoked'){db.prepare('UPDATE cloud_profile SET ai_consent=0,consent_version=2').run();db.prepare("UPDATE coaching_job SET status='cancelled',input='',output=NULL").run()}profileAtDispatch={...db.prepare('SELECT * FROM cloud_profile').get()};return Response.json({choices:[{message:{content:JSON.stringify({schema:1,contextDigest:'a'.repeat(64),factIds:['logged']})}}]})};
  try{await module.exports.runCoachingJob({DB:D1,AI_PROVIDER_VERIFIED:'true',AI_API_KEY:'synthetic-no-network',AI_MODEL:'synthetic-model'},'synthetic-job')}finally{global.fetch=previous}
  const job={...db.prepare('SELECT status,input,output FROM coaching_job').get()};
  output.push({change,providerCalls,profileAtDispatch,finalJob:job});
  assert.equal(providerCalls,['normal','inflight-revoked'].includes(change)?1:0,'Invalidated context must not reach provider');assert.equal(quotaCalls,2);assert.equal(job.input,'','Prompt is cleared after every case');if(change==='normal'){assert.equal(job.status,'succeeded');assert.deepEqual(JSON.parse(job.output).factIds,['logged'])}else{assert.equal(job.output,null,'Publication guard blocks invalidated output');assert.ok(['cancelled','stale'].includes(job.status))}db.close();
 }
 const result={checkedAt:new Date().toISOString(),sourceSHA256:createHash('sha256').update(source).digest('hex'),cases:output,scope:'Actual runCoachingJob, fact validation and SQL statements with real Node SQLite; quota completion is a controlled concurrent-state boundary, global fetch is a synthetic capture and no external request/credential/account is used.'};
 fs.mkdirSync('.sites-runtime/comprehensive-audit-2026-10-18/security',{recursive:true});fs.writeFileSync('.sites-runtime/comprehensive-audit-2026-10-18/security/consent-dispatch-fixed.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
