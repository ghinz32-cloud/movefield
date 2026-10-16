const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),{spawnSync}=require('node:child_process');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const M=load('lib/grizzly-messages.ts'),{todayView}=load('lib/today-view.ts'),cases=[];
function test(name,check){check();cases.push(name);console.log('PASS '+name)}

test('32 ready-day messages preserve the original bear text and all 72 entries stay concise',()=>{
 assert.equal(M.trainingMessages.length,32);
 const entries=Object.values(M.grizzlyMessages).flat();assert.equal(entries.length,72);assert.equal(new Set(entries.map(x=>x.id)).size,72);
 assert.deepEqual(M.trainingMessages[0],{id:'wake',title:'Wake the grizzly.',body:'Your den. Your discipline. Your next strong day.'});
 for(const entry of entries){assert.ok(entry.title.length<70);assert.ok(entry.body.length<180);assert.doesNotMatch(entry.title+' '+entry.body,/\b(dose|wautoma)\b/i)}
});
test('Each local date is deterministic across rendering, month/year changes and the full rotation',()=>{
 for(const [context,entries] of Object.entries(M.grizzlyMessages)){
  const ids=[];for(let n=0;n<entries.length;n++){
   const date=new Date(2026,11,20+n,12),key=M.grizzlyLocalDayKey(date),message=M.getGrizzlyDailyMessage(context,key);
   assert.deepEqual(message,M.getGrizzlyDailyMessage(context,date));assert.deepEqual(message,M.getGrizzlyDailyMessage(context,key));ids.push(message.id);
  }
  assert.equal(new Set(ids).size,entries.length);
  for(const invalid of ['','2026-02-31','2026-13-01','nonsense'])assert.deepEqual(M.getGrizzlyDailyMessage(context,invalid),entries[0]);
 }
 assert.equal(M.localDayKey(new Date(2028,1,29,12)),'2028-02-29');
 assert.deepEqual(M.grizzlyMessage('2026-10-13',false),M.getGrizzlyDailyMessage('ready','2026-10-13'));
 assert.deepEqual(M.grizzlyMessage('2026-10-13',true),M.getGrizzlyDailyMessage('recovery','2026-10-13'));
});
test('Actual Today actions choose active/ready/recovery/review without changing the saved workout',()=>{
 const base=workoutFixture(),original=JSON.stringify(base);
 const context=s=>{const view=todayView(s);return M.grizzlyMessageContext({active:!!s.active,hold:s.hold,paused:s.plan?.paused,action:view.action,issue:!!view.issue,overdue:view.overdue.length>0})};
 assert.equal(context(base),'active');assert.equal(context({...base,hold:true}),'review');assert.equal(context({...base,plan:{...base.plan,paused:true}}),'review');
 const ready={...base,active:null};assert.equal(context(ready),'ready');
 const future={...ready,plan:{...ready.plan,sessions:ready.plan.sessions.map(x=>({...x,date:'2999-10-13'}))}};assert.equal(context(future),'recovery');
 assert.equal(future.history.length,0,'Future-day fixture has no logged work');
 const restCopy=M.getGrizzlyDailyMessage(context(future),'2026-10-17');
 assert.equal(restCopy.id,'rest-pride');
 assert.doesNotMatch(restCopy.title+' '+restCopy.body,/\b(?:logged|recorded|completed|progress)\b/i,'An untrained recovery day must not assert recorded work or earned progress');
 const overdue={...ready,plan:{...ready.plan,sessions:ready.plan.sessions.map(x=>({...x,date:'2000-10-13'}))}};assert.equal(context(overdue),'review');
 assert.equal(context({...ready,plan:null}),'review');assert.equal(JSON.stringify(base),original);
});
test('Local midnight follows Chicago 23/25-hour days and opposite UTC date boundaries',()=>{
 const child=spawnSync(process.execPath,['-e',`const M=require('./scripts/domain-test-loader.cjs').load('lib/grizzly-messages.ts');process.stdout.write(JSON.stringify({spring:M.millisecondsUntilNextLocalDay(new Date(2026,2,8)),fall:M.millisecondsUntilNextLocalDay(new Date(2026,10,1)),almost:M.millisecondsUntilNextLocalDay(new Date(2026,9,12,23,59,59,900)),key:M.grizzlyLocalDayKey(new Date('2026-10-13T04:00:00Z'))}));`],{encoding:'utf8',env:{...process.env,TZ:'America/Chicago'}});
 assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),{spring:23*3600000,fall:25*3600000,almost:100,key:'2026-10-12'});
});

function compile(file,mocks){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports}
test('Actual web clock schedules midnight, catches foreground date changes and cleans up resources',()=>{
 const keys=['Date','document','window','setTimeout','clearTimeout'],original=new Map(keys.map(key=>[key,global[key]])),RealDate=Date;
 let now=new RealDate(2026,9,12,23,59,59,900).getTime(),currentDay='',nextTimer=0;const timers=new Map(),listeners=new Map(),cleanups=[];
 class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[now]))}}
 const target=prefix=>({addEventListener:(type,listener)=>listeners.set(prefix+type,listener),removeEventListener:(type,listener)=>{assert.equal(listeners.get(prefix+type),listener);listeners.delete(prefix+type)}});
 try{
  Object.assign(global,{Date:FakeDate,document:{hidden:false,...target('document:')},window:target('window:'),setTimeout:(callback,delay)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id},clearTimeout:id=>timers.delete(id)});
  const React={useState:init=>{currentDay=typeof init==='function'?init():init;return [currentDay,value=>currentDay=value]},useEffect:effect=>cleanups.push(effect())};
  const C=compile('grizzly/daily-message.tsx',{'react':React,'../lib/grizzly-messages':M});
  assert.equal(C.useGrizzlyLocalDay(),'2026-10-12');assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,125);
  now+=125;[...timers.values()][0].callback();assert.equal(currentDay,'2026-10-13');assert.equal(timers.size,1);
  global.document.hidden=true;now=new RealDate(2026,9,15,13).getTime();listeners.get('document:visibilitychange')();assert.equal(currentDay,'2026-10-13');
  global.document.hidden=false;listeners.get('document:visibilitychange')();assert.equal(currentDay,'2026-10-15');assert.equal(timers.size,1);
  now=new RealDate(2026,9,16,13).getTime();listeners.get('window:focus')();assert.equal(currentDay,'2026-10-16');
  now=new RealDate(2026,9,17,13).getTime();listeners.get('window:pageshow')();assert.equal(currentDay,'2026-10-17');
  for(const cleanup of cleanups)cleanup();assert.equal(timers.size,0);assert.equal(listeners.size,0);
 }finally{for(const [key,value] of original)value===undefined?delete global[key]:global[key]=value}
});
test('Actual native Today clock resumes with the foreground and selects review copy for a hold',()=>{
 const keys=['Date','setTimeout','clearTimeout'],original=new Map(keys.map(key=>[key,global[key]])),RealDate=Date;
 let now=new RealDate(2026,9,12,23,59,59,900).getTime(),currentDay,appActive=true,nextTimer=0,cleanup;
 const timers=new Map(),state=workoutFixture();
 class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[now]))}}
 try{
  Object.assign(global,{Date:FakeDate,setTimeout:(callback,delay)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id},clearTimeout:id=>timers.delete(id)});
  const React={useState:init=>{if(currentDay===undefined)currentDay=init();return [currentDay,value=>currentDay=value]},useEffect:effect=>{if(cleanup)cleanup();cleanup=effect()}};
  const C=compile('mobile/src/today-hero.tsx',{'react':React,'react-native':{View:'View',Text:'Text',StyleSheet:{create:x=>x}},'./appearance':{useThemedStyles:base=>base,useNativeAppearance:()=>({p:{grizzlyStyle:'clean'},colors:{},active:appActive})},'./shared/today-view':{todayView},'./shared/training':load('lib/training.ts'),'./shared/presentation':load('lib/presentation.ts'),'./shared/session-duration':load('lib/session-duration.ts'),'./shared/grizzly-messages':M,'./shared/brand':{isGrizzly:true},'./account-button':{NativeAccountButton:'Button'},'./bear-decoration':{NativeBearDecoration:'Bear',NativeGrizzlyPaw:'Paw'},'./wilderness':{NativeDenHero:'NativeDenHero'}});
  const render=s=>C.NativeTodayHero({state:s,sample:false,onStart:()=>{},onPreview:()=>{},onTargets:()=>{},onPlan:()=>{},onResume:()=>{},onCalendar:()=>{},onResetSampleHold:()=>{}});
  const texts=tree=>Array.isArray(tree)?tree.flatMap(texts):tree&&typeof tree==='object'?[...(tree.type==='Text'&&typeof tree.props.children==='string'?[tree.props.children]:[]),...texts(tree.props?.children)]:[];
  const assertMessage=(tree,context,date)=>{const message=M.getGrizzlyDailyMessage(context,date),content=texts(tree);assert.ok(content.includes(message.title));assert.ok(content.includes(message.body))};
  const nodes=tree=>Array.isArray(tree)?tree.flatMap(nodes):tree&&typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
  let tree=render(state);assert.equal(nodes(tree).filter(node=>node.type==='NativeDenHero').length,0,'Today keeps branding in one compact card without a second hero');assert.equal(nodes(tree).filter(node=>node.type==='Button').length,1,'Active Today offers one primary next action');assertMessage(tree,'active','2026-10-12');assert.equal([...timers.values()][0].delay,125);
  now+=125;[...timers.values()][0].callback();assert.equal(currentDay,'2026-10-13');
  tree=render({...state,hold:true});assertMessage(tree,'review','2026-10-13');
  appActive=false;render(state);assert.equal(timers.size,0);
  now=new RealDate(2026,9,16,13).getTime();appActive=true;render(state);assert.equal(currentDay,'2026-10-16');assert.equal(timers.size,1);
  tree=render(state);assertMessage(tree,'active','2026-10-16');
  cleanup();assert.equal(timers.size,0);
 }finally{for(const [key,value] of original)value===undefined?delete global[key]:global[key]=value}
});
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/grizzly-message-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Synthetic shared-message selection, real Today actions, Chicago DST arithmetic and actual web clock lifecycle. Browser styling and physical-device behavior are covered separately.',cases},null,2)+'\n');
console.log('PASS '+cases.length+' Grizzly daily-message groups');
