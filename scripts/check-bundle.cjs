const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('dist/client/.vite/manifest.json','utf8'));
const page=manifest['app/page.tsx'];assert.ok(page,'Client page entry missing');
const imports=new Set();
function visit(key){if(imports.has(key))return;assert.ok(manifest[key],'Missing import: '+key);imports.add(key);for(const dependency of manifest[key].imports||[])visit(dependency)}
visit('app/page.tsx');assert.ok(!imports.has('components/progress-dashboard.tsx'),'Charts must load when Progress is opened');
assert.ok(page.dynamicImports?.includes('components/progress-dashboard.tsx'),'Chart loading boundary missing');
assert.ok(!manifest['app/qa-preview/page.tsx'],'Temporary QA route shipped');
const chunks=[...imports].map(key=>{const bytes=fs.readFileSync('dist/client/'+manifest[key].file);return {key,bytes:bytes.length,gzipBytes:zlib.gzipSync(bytes).length}});
const current=chunks.find(x=>x.key==='app/page.tsx'),initialGzipBytes=chunks.reduce((n,x)=>n+x.gzipBytes,0);
assert.ok(current.gzipBytes<240000,'Page exceeds 240 KB gzip');
assert.ok(initialGzipBytes<400000,'Initial dependency graph exceeds 400 KB gzip: '+initialGzipBytes);
fs.mkdirSync('.sites-runtime',{recursive:true});
const report={page:page.file,...current,initialGzipBytes,initialLimitGzipBytes:400000,chunks};
fs.writeFileSync('.sites-runtime/bundle-check.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS bundle budgets and lazy chart boundary',JSON.stringify(report));
