import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{createLoader}=require('./lib/load-typescript.cjs'),load=createLoader();
const C=load('lib/qwen-runtime-contract.ts'),Demo=load('lib/qwen-demo-context.ts'),Eval=require('./lib/fitness-evaluation.cjs'),modules=Eval.loadModules();
const file=process.argv[2];if(!file)throw Error('Pass the pinned tokenizer.json path. This script never downloads files.');
const bytes=fs.readFileSync(file),assets=JSON.parse(fs.readFileSync('lib/qwen-assets.json','utf8'));
const model=assets.models.find(m=>m.id==='web-qwen3-0.6b-q4f16_1-mlc'),asset=model.assets.find(a=>a.path==='tokenizer.json');
const sha256=createHash('sha256').update(bytes).digest('hex');
if(bytes.length!==asset.bytes||sha256!==asset.sha256)throw Error('Tokenizer fingerprint mismatch.');
// UMD 0.1.6's Node branch also expects CommonJS globals. This is confined to
// this CPU inspection harness; browser workers use the package's browser branch.
globalThis.require=require;globalThis.__filename=fileURLToPath(import.meta.resolve('@mlc-ai/web-tokenizers'));
const {loadQwenTokenizer}=load('lib/qwen-tokenizer.ts');
const tokenizer=await loadQwenTokenizer(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
try{
 const results=[];
 for(const [index,query] of Demo.QWEN_DEMO_TOPICS.entries()){
  const request=C.qwenRequest(Demo.qwenDemoContext(),query,'tokenizer-demo-'+index);
  const tokens=tokenizer.encode(C.qwenCompletionPrompt(request)).length;
  if(!C.qwenPromptFits(tokens))throw Error('Demo prompt too long.');results.push({id:'demo-'+index,promptTokens:tokens});
 }
 for(const c of modules.suite.cases){
  const {request}=Eval.buildCaseRequest(modules,c,1);if(!request)continue;
  const tokens=tokenizer.encode(C.qwenCompletionPrompt(request)).length;
  if(!C.qwenPromptFits(tokens))throw Error('Held-out prompt too long: '+c.id);results.push({id:c.id,promptTokens:tokens});
 }
 for(const name of ['train','validation']){
  const rows=fs.readFileSync(`training/qwen-evidence-v1/${name}.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
  for(const row of rows){
   const [system,user,assistant]=row.messages;
   const prompt=`<|im_start|>system\n${system.content}<|im_end|>\n<|im_start|>user\n${user.content}<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n`;
   const tokens=tokenizer.encode(prompt).length,output=tokenizer.encode(assistant.content+'<|im_end|>\n').length;
   if(!C.qwenPromptFits(tokens)||output>C.QWEN_OUTPUT_TOKENS)throw Error('Training case too long: '+row.id);
   results.push({id:row.id,split:name,promptTokens:tokens,outputTokens:output});
  }
 }
 const report={tokenizerSha256:sha256,tokenizerBytes:bytes.length,runtime:'@mlc-ai/web-tokenizers@0.1.6 CPU WASM',contextTokens:C.QWEN_CONTEXT_TOKENS,outputReserve:C.QWEN_OUTPUT_TOKENS,cases:results.length,maxPromptTokens:Math.max(...results.map(r=>r.promptTokens)),results,modelInferenceRan:false};
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/u08b-tokenizer-check.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.cases,maxPromptTokens:report.maxPromptTokens,tokenizerSha256:sha256,modelInferenceRan:false}));
}finally{tokenizer.dispose();}
