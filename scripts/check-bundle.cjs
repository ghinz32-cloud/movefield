const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('dist/client/.vite/manifest.json','utf8'));
const page=manifest['app/page.tsx'];assert.ok(page,'Client page entry missing');
const imports=new Set();
function visit(key){if(imports.has(key))return;assert.ok(manifest[key],'Missing import: '+key);imports.add(key);for(const dependency of manifest[key].imports||[])visit(dependency)}
visit('app/page.tsx');assert.ok(!imports.has('components/progress-dashboard.tsx'),'Charts must load when Progress is opened');
assert.ok(page.dynamicImports?.includes('components/progress-dashboard.tsx'),'Chart loading boundary missing');
assert.ok(!imports.has('components/qwen-demo.tsx'),'Qwen demo must not enter the initial workout graph');
assert.ok(page.dynamicImports?.includes('components/qwen-demo.tsx'),'Demo loading boundary missing');
for(const key of imports)assert.ok(!/web-llm|web-tokenizers|qwen-runtime\.worker/.test(key),'Model runtime entered initial graph');
assert.ok(!imports.has('components/qwen-model-files.tsx'),'Optional model controls must load on request');
assert.ok([...imports].some(key=>manifest[key].dynamicImports?.includes('components/qwen-model-files.tsx')),'Model controls loading boundary missing');
for(const key of imports){const text=fs.readFileSync('dist/client/'+manifest[key].file,'utf8');assert.ok(!text.includes('movefield-qwen-assets-v1'),'Model cache entered the initial workout graph');assert.ok(!text.includes('8c14ce481d4c692769976ad52afea453a102df19'),'Model artifact catalog entered the initial workout graph')}
assert.ok(!manifest['app/qa-preview/page.tsx'],'Temporary QA route shipped');
const chunks=[...imports].map(key=>{const bytes=fs.readFileSync('dist/client/'+manifest[key].file);return {key,bytes:bytes.length,gzipBytes:zlib.gzipSync(bytes).length}});
const current=chunks.find(x=>x.key==='app/page.tsx'),initialGzipBytes=chunks.reduce((n,x)=>n+x.gzipBytes,0);
assert.ok(current.gzipBytes<240000,'Page exceeds 240 KB gzip');
assert.ok(initialGzipBytes<400000,'Initial dependency graph exceeds 400 KB gzip: '+initialGzipBytes);
fs.mkdirSync('.sites-runtime',{recursive:true});
const report={page:page.file,...current,initialGzipBytes,initialLimitGzipBytes:400000,chunks};
fs.writeFileSync('.sites-runtime/bundle-check.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS bundle budgets and lazy chart boundary',JSON.stringify(report));
