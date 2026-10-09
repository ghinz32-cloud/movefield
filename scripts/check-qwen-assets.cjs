const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');process.chdir(root);
const manifest=JSON.parse(fs.readFileSync('lib/qwen-assets.json','utf8'));
let checks=0;const ok=(value,message)=>{assert.ok(value,message);checks++};const same=(a,b,message)=>{assert.deepEqual(a,b,message);checks++};
same(manifest.schema,1,'known asset schema');same(manifest.status,'artifact-metadata-only','no inference certification');
same(new Set(manifest.models.map(m=>m.id)).size,manifest.models.length,'unique model IDs');
for(const m of manifest.models){
 ok(/^[0-9a-f]{40}$/.test(m.modelRevision),`${m.id} pins model commit`);
 same(m.qualification,'not-tested',`${m.id} is not silently qualified`);
 same(m.downloadBytes,m.assets.reduce((n,a)=>n+a.bytes,0),`${m.id} displays all required artifact bytes`);
 for(const a of m.assets){
  ok(/^[0-9a-f]{64}$/.test(a.sha256),`${m.id}/${a.path}: SHA-256 exists`);
  ok(Number.isSafeInteger(a.bytes)&&a.bytes>0,`${m.id}/${a.path}: exact byte length`);
  const url=new URL(a.url);ok(url.protocol==='https:'&&['huggingface.co','raw.githubusercontent.com'].includes(url.hostname),'only known HTTPS publisher hosts');
  ok(url.pathname.includes(m.modelRevision)||m.wasmRevision&&url.pathname.includes(m.wasmRevision),'immutable asset revision');
  ok(!/(\/main\/|\/v0\.10\.0\/|\?)/.test(a.url),'download paths are pinned, not mutable tags');
 }
}
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('lib/qwen-catalog.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(name=>name==='./qwen-assets.json'?manifest:name==='./qwen-evaluation-lock.json'?JSON.parse(fs.readFileSync('lib/qwen-evaluation-lock.json','utf8')):require(name),mod,mod.exports);
const Q=mod.exports,device={platform:'android',deviceFingerprint:'test-only-phone',appBuild:'test-only-build',contextTokens:2048};
same(Q.chooseQualifiedQwen('auto',device,[]),null,'no measured records means no automatic model');
function measured(m,overrides={}){return {modelId:m.id,modelRevision:m.modelRevision,runtimeVersion:m.runtimeVersion,backend:m.backend,deviceFingerprint:device.deviceFingerprint,appBuild:device.appBuild,contextTokens:device.contextTokens,evaluationVersion:Q.QWEN_EVALUATION_VERSION,...Q.QWEN_EVALUATION_FINGERPRINTS,accuracyPassed:true,safetyPassed:true,interruptionPassed:true,completedCycles:3,peakAppBytes:100,measuredBudgetBytes:200,p95GenerationMs:100,coldLoadMs:100,...overrides}}
const native=manifest.models.filter(m=>m.platform==='android'),largest=[...native].sort((a,b)=>b.parametersB-a.parametersB)[0],records=native.map(m=>measured(m));
same(largest.parametersB,4,'4B native export is represented');
same(Q.chooseQualifiedQwen('auto',device,records)?.id,largest.id,'automatic selects largest independently passing tier');
same(Q.chooseQualifiedQwen('off',device,records),null,'Off always stays off');
same(Q.chooseQualifiedQwen('unknown-model',device,records),null,'unknown choice never triggers a download');
for(const bad of [{modelRevision:'stale'},{runtimeVersion:'stale'},{backend:'other'},{deviceFingerprint:'other'},{appBuild:'other'},{contextTokens:4096},{evaluationVersion:'old'},{corpusSha256:'stale'},{contractSha256:'stale'},{suiteSha256:'stale'},{accuracyPassed:false},{safetyPassed:false},{interruptionPassed:false},{completedCycles:2},{completedCycles:Infinity},{peakAppBytes:NaN},{measuredBudgetBytes:0},{peakAppBytes:201},{p95GenerationMs:30_001},{coldLoadMs:120_001}]){
 same(Q.qwenQualificationPasses(largest,device,measured(largest,bad)),false,`fails qualification ${Object.keys(bad)[0]}`);
}
same(Q.chooseQualifiedQwen('auto',{...device,platform:'web'},records),null,'native measurements cannot qualify a browser');
console.log(`PASS Qwen pinned artifact metadata and exact-build qualification: ${checks} checks; zero actual devices qualified.`);
