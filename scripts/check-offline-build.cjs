// Execute the real build plugin against an isolated public-asset fixture.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{pathToFileURL}=require('node:url'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'movefield-offline-build-'));
try {
 const assets=['exercise-guides.json','exercise-content.json','fonts/inter-variable.ttf','fonts/barlow-condensed-semibold.ttf','brand/logo.jpg'];
 const put=(name,value)=>{const file=path.join(dir,'public',name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value)};
 for(const name of assets)put(name,'Original '+name);
 const template=fs.readFileSync('public/movefield-sw.js','utf8');put('movefield-sw.js',template);
 const source=fs.readFileSync('build/offline-plugin.ts','utf8').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(path.join(dir,'build/offline-plugin.ts')).href));
 const moduleUnderTest={exports:{}};
 new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(require,moduleUnderTest,moduleUnderTest.exports);
 const bundle={ 'assets/app.js':{type:'chunk',code:'console.log("app");'},'assets/app.css':{type:'asset',source:'body{color:black}'} };
 function generated(brandAssets=[],reverse=false){let worker;const plugin=moduleUnderTest.exports.offlineShell('/movefield/review/',true,'movefield-review-shell-',brandAssets);plugin.generateBundle.call({emitFile:file=>worker=file.source},{},reverse?Object.fromEntries(Object.entries(bundle).reverse()):bundle);const context={self:{addEventListener(){}},Set};vm.createContext(context);vm.runInContext(worker+'\nthis.receipt={revision:REVISION,static:[...STATIC],prefix:CACHE_PREFIX};',context);return context.receipt}
 const initial=generated();assert.equal(initial.revision,generated([],true).revision,'Deterministic bundle ordering');
 for(const name of assets.slice(0,4)){
  assert.ok(initial.static.includes('/movefield/review/'+name),name+' is actually precached');
  put(name,'Corrected '+name);assert.notEqual(generated().revision,initial.revision,name+' changes invalidate the cache with unchanged JS/CSS');put(name,'Original '+name);
 }
 put('not-cached.txt','An unrelated download');assert.equal(generated().revision,initial.revision,'Uncached files do not churn offline installs');
 put('movefield-sw.js',template+'\n// Updated fetch behavior\n');assert.notEqual(generated().revision,initial.revision,'Worker behavior changes identify a new cache');put('movefield-sw.js',template);
 const branded=generated(['brand/logo.jpg']);assert.ok(branded.static.includes('/movefield/review/brand/logo.jpg'));put('brand/logo.jpg','Updated logo');assert.notEqual(generated(['brand/logo.jpg']).revision,branded.revision,'Branded cached assets invalidate the cache');
 assert.equal(generated().prefix,'movefield-review-shell-');
 console.log('PASS offline release identity: guide-only/media-only/base-font/brand/worker changes invalidate; unrelated downloads and bundle order do not');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
