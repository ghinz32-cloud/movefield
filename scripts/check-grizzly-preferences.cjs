const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const P=load('lib/app-preferences.ts'),B=load('lib/brand.ts');
const cases=[];function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
function compile(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports}
function nodes(root){const result=[];const visit=node=>{if(Array.isArray(node))return node.forEach(visit);if(node&&typeof node==='object'){result.push(node);visit(node.props?.children)}};visit(root);return result}
test('Retired preset and palette migrate while explicit fonts, modes and accessibility remain',()=>{
 assert.ok(!P.palettes.some(palette=>palette.id==='og'));
 for(const mode of ['light','dark','system'])for(const headingFont of ['bungee','metal','rocker']){
  const old={...P.defaultPreferences,grizzlyStyle:'og',palette:'og',headingFont,mode,textSize:130,contrast:true,reduceMotion:true,reminders:true,reminderTime:'07:30'};
  const before=JSON.stringify(old),next=P.readPreferences(before);
  assert.equal(next.grizzlyStyle,P.defaultPreferences.grizzlyStyle);assert.equal(next.palette,P.defaultPreferences.palette);
  assert.equal(next.headingFont,B.isGrizzly&&headingFont==='bungee'?P.defaultPreferences.headingFont:headingFont);
  for(const key of ['mode','textSize','contrast','reduceMotion','reminders','reminderTime'])assert.equal(next[key],old[key]);
  assert.equal(JSON.stringify(old),before);assert.deepEqual(P.readPreferences(JSON.stringify(next)),next);
 }
 for(const grizzlyStyle of ['wild','clean']){
  const saved={...P.defaultPreferences,grizzlyStyle,headingFont:'rocker',palette:'rose',mode:'light',textSize:115};assert.deepEqual(P.readPreferences(JSON.stringify(saved)),saved);
 }
 const clean=P.readPreferences(JSON.stringify({...P.defaultPreferences,grizzlyStyle:'clean',palette:'og',headingFont:'bungee'}));assert.equal(clean.grizzlyStyle,'clean');assert.equal(clean.headingFont,'bungee');
 assert.equal(P.readPreferences('{"headingFont":"rocker"}').headingFont,B.isGrizzly?'metal':'rocker');
 assert.equal(P.readPreferences('{"headingFont":"beast"}').headingFont,B.isGrizzly?'metal':'barlow');
});
test('Actual web controls offer only Wild and Clean and retain customization',()=>{
 const selects=Object.fromEntries(['Select','SelectTrigger','SelectValue','SelectContent','SelectItem','SelectGroup','SelectLabel'].map(name=>[name,name]));
 const C=compile('grizzly/style-controls.tsx',{'../lib/app-preferences':P,'../components/ui/button':{Button:'Button'},'../components/ui/select':selects});
 let p={...P.defaultPreferences};const update=patch=>p=P.readPreferences(JSON.stringify({...p,...patch}));
 const controls=nodes(C.GrizzlyStyleControls({p,update})),presets=controls.filter(node=>node.type==='Button');
 assert.deepEqual(presets.map(node=>node.props['aria-label']),['Wild Grizzly','Clean & readable']);
 presets[0].props.onClick();if(B.isGrizzly){assert.equal(p.grizzlyStyle,'wild');assert.equal(p.palette,'pine');assert.equal(p.headingFont,'frijole')}
 presets[1].props.onClick();assert.equal(p.grizzlyStyle,'clean');assert.equal(p.headingFont,'inter');
 const paletteNodes=nodes(C.GrizzlyPaletteControls({p,update}));assert.equal(paletteNodes.filter(node=>node.type==='SelectItem').length,P.palettes.length);
 assert.ok(!paletteNodes.some(node=>node.props?.value==='og'));
});
test('Actual browser migration and preference writes preserve active workouts, timers and other profiles',()=>{
 const original=new Map(['window','localStorage'].map(key=>[key,global[key]])),listeners=new Map();
 const fixture=workoutFixture(),records=JSON.stringify({...fixture,restTimer:{startedAt:1234,seconds:90}});
 const values=new Map([['training-studio-v2',records],['grizzly-training-studio-v2',records],['movefield-review-training-studio-v2',records],['another-profile-preferences','unchanged']]);
 const unchanged=new Map(values),raw=JSON.stringify({...P.defaultPreferences,grizzlyStyle:'og',palette:'og',headingFont:'bungee',mode:'light',textSize:130,reduceMotion:true});values.set(P.preferenceKey,raw);
 let fail=false;
 try{
  global.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('Synthetic quota failure');values.set(key,value)}};
  const helper=load('lib/browser-preferences.ts'),stop=helper.subscribePreferences(()=>{});
  assert.deepEqual(helper.browserPreferences().p,P.readPreferences(raw));helper.updateBrowserPreferences({palette:'rose'});
  assert.equal(JSON.parse(values.get(P.preferenceKey)).grizzlyStyle,P.defaultPreferences.grizzlyStyle);assert.equal(helper.browserPreferences().p.palette,'rose');
  const before=values.get(P.preferenceKey);fail=true;helper.updateBrowserPreferences({mode:'dark'});assert.equal(values.get(P.preferenceKey),before);assert.ok(helper.browserPreferences().saveError);
  fail=false;helper.updateBrowserPreferences({mode:'system'});assert.equal(helper.browserPreferences().saveError,'');
  for(const [key,value] of unchanged)assert.equal(values.get(key),value,key);stop();assert.equal(listeners.size,0);
 }finally{for(const [key,value] of original){if(value===undefined)delete global[key];else global[key]=value}}
});
test('Native uses the same migration and no retired preset assets or controls are shipped',()=>{
 const native=load('mobile/src/shared/app-preferences.ts');assert.deepEqual(native.readPreferences('{"grizzlyStyle":"og","palette":"og","headingFont":"bungee"}'),P.readPreferences('{"grizzlyStyle":"og","palette":"og","headingFont":"bungee"}'));
 for(const path of ['grizzly/og-bear.tsx','grizzly/og-grizzly.css','mobile/src/og-bear.tsx'])assert.ok(!fs.existsSync(path),path);
 for(const path of ['grizzly/style-controls.tsx','grizzly/entry.tsx','grizzly/forest-scene.tsx','mobile/src/settings.tsx','mobile/src/appearance.tsx','mobile/src/wilderness.tsx'])assert.doesNotMatch(fs.readFileSync(path,'utf8'),/OG Grizzly|og-bear|og-grizzly|grizzlyStyle\s*===\s*['"]og['"]/);
 assert.ok(fs.readFileSync('grizzly/daily-message.tsx','utf8').includes('getGrizzlyDailyMessage'));
});
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/grizzly-preferences-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),brand:B.isGrizzly?'grizzly':'movefield',scope:'Actual preference migration, appearance controls, browser storage helper and native shared source with synthetic storage. No browser or physical-device qualification.',cases},null,2)+'\n');
