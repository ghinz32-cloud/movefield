const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){
 file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(spec=>{
  if(spec.startsWith('@/'))return load(spec.slice(2)+(path.extname(spec)?'':'.ts'));
  if(spec.startsWith('./')){const full=path.resolve(path.dirname(file),spec);return spec.endsWith('.json')?JSON.parse(fs.readFileSync(full,'utf8')):load(full+'.ts')}
  return require(spec);
 },module,module.exports);return module.exports;
}
const T=load('lib/training.ts'),D=load('lib/training-day.ts'),C=load('components/training-day.tsx');
let checks=0;function test(name,run){run();checks++;console.log('PASS '+name)}
const date='2026-10-09',today='2026-10-12',clone=value=>JSON.parse(JSON.stringify(value));
function state(){return {...T.initialState(),plan:null,saved:[],history:[],active:null,events:[],profile:{...T.blankProfile,units:'kg'}}}
function session(id='session',at=date,status='scheduled'){return {id,date:at,week:1,title:'Recorded strength',kind:'Strength',minutes:45,items:[{exerciseId:'bench',sets:2,reps:8,repMin:8,repMax:12,rest:120,kg:60}],status}}
function plan(id='plan',sessions=[session()],accepted='2026-10-01T12:00:00.000Z'){return {id,name:'Saved plan',version:1,profile:{...T.blankProfile,start:'2026-10-01'},acceptedAt:accepted,sessions,phases:[],evidence:[],notes:[],progression:'',template:'custom',paused:false}}
function workout(id='workout',started=1000,extra={}){return {id,sessionId:'session',title:'Recorded strength',date,startedAt:started,finishedAt:started+60000,
 sets:[{exerciseId:'bench',set:1,reps:8,kg:60,done:true,rir:2},{exerciseId:'bench',set:2,reps:0,kg:null,done:false}],partial:true,...extra}}
function frozen(value){if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value)}return value}

test('Relative headings follow calendar dates across DST, leap days and years',()=>{
 const previous=process.env.TZ;
 try{for(const zone of ['America/Chicago','Pacific/Auckland','UTC']){
  process.env.TZ=zone;
  assert.equal(D.trainingDayHeading(today,today),'Today');assert.equal(D.trainingDayHeading('2026-10-11',today),'Yesterday');
  assert.equal(D.trainingDayHeading('2026-10-10',today),'2 days ago');assert.equal(D.trainingDayHeading(date,today),'3 days ago');
  assert.equal(D.trainingDayHeading('2026-03-08','2026-03-09'),'Yesterday');assert.equal(D.trainingDayHeading('2026-11-01','2026-11-02'),'Yesterday');
  assert.equal(D.trainingDayHeading('2024-02-29','2024-03-01'),'Yesterday');assert.equal(D.trainingDayHeading('2025-12-31','2026-01-01'),'Yesterday');
  assert.equal(D.trainingDayHeading('2026-10-13',today),T.niceDate('2026-10-13'));
 }}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}
 assert.throws(()=>D.trainingDayHeading('2026-02-30',today),/valid calendar date/);
});
test('Monday–Sunday week dates remain stable through DST and month/year boundaries',()=>{
 const previous=process.env.TZ;
 try{for(const zone of ['America/Chicago','Pacific/Auckland','UTC']){
  process.env.TZ=zone;
  assert.deepEqual(D.trainingWeekDates('2026-03-08'),['2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06','2026-03-07','2026-03-08']);
  assert.deepEqual(D.trainingWeekDates('2026-11-01'),['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']);
  assert.deepEqual(D.trainingWeekDates('2026-01-01'),['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03','2026-01-04']);
  assert.deepEqual(D.trainingWeekDates('2024-02-29'),['2024-02-26','2024-02-27','2024-02-28','2024-02-29','2024-03-01','2024-03-02','2024-03-03']);
 }}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}
 assert.throws(()=>D.trainingWeekDates('invalid'),/valid calendar date/);
});
test('True rest dates show Day off while skipped and unlogged schedules remain distinct',()=>{
 const s=state();assert.equal(D.trainingDay(s,date,today).status,'rest');
 s.plan=plan();assert.equal(D.trainingDay(s,date,today).status,'not-logged');
 s.plan.sessions[0].status='missed';assert.equal(D.trainingDay(s,date,today).status,'missed');
 s.plan.sessions[0].status='completed';assert.equal(D.trainingDay(s,date,today).status,'not-logged');
 const html=renderToStaticMarkup(React.createElement(C.TrainingDay,{state:state(),date,today}));assert.ok(html.includes('Day off'));
});
test('All same-date workouts retain chronology and original date after travel',()=>{
 const s=state();s.history=[workout('later',5000),workout('earlier',1000,{timeZone:'America/Chicago',startedAtUtc:new Date(1000).toISOString()}),workout('other-day',0,{date:'2026-10-08'})];
 const previous=process.env.TZ;
 try{process.env.TZ='Pacific/Auckland';const result=D.trainingDay(s,date,today);assert.deepEqual(result.workouts.map(w=>w.workout.id),['earlier','later']);assert.equal(result.status,'recorded');assert.equal(result.loggedSets,2);assert.equal(result.workouts[0].workout.date,date)}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}
});
test('Partial actual sets preserve zero and unknown loads, RIR, metrics, notes and duration',()=>{
 const s=state();s.history=[workout('mixed',1000,{finishedAt:121000,rir:{bench:4},details:{bench:{notes:'Recorded notes'}},loadContext:{bench:'Rack A'},sets:[
  {exerciseId:'bench',set:1,reps:8,kg:0,done:true,rir:0,metrics:{distanceM:0,durationSeconds:60,inclinePercent:-3,notes:'Measured task'}},
  {exerciseId:'bench',set:2,reps:6,kg:null,done:true,rir:null},
  {exerciseId:'bench',set:3,reps:5,kg:20,done:true},
  {exerciseId:'bench',set:4,reps:0,kg:null,done:false},
  {exerciseId:'plank',set:1,reps:45,kg:null,done:true},
 ]})];
 const entry=D.trainingDay(s,date,today).workouts[0],bench=entry.exercises[0];
 assert.equal(entry.elapsedMinutes,2);assert.equal(entry.loggedSets,4);assert.equal(entry.partial,true);
 assert.equal(bench.sets[0].load,'0 kg');assert.equal(bench.sets[0].rir,'0');assert.equal(bench.sets[1].load,'Not recorded');assert.equal(bench.sets[1].rir,'Unsure');assert.equal(bench.sets[2].rir,'4');
 assert.ok(bench.sets[0].details.includes('Distance (meters): 0'));assert.ok(bench.sets[0].details.includes('Time (seconds): 60'));assert.ok(bench.sets[0].details.includes('Incline (%): -3'));
 assert.equal(bench.setup,'Rack A');assert.equal(bench.notes,'Recorded notes');assert.equal(entry.exercises[1].sets[0].amountText,'45 seconds');
 s.profile.units='lb';assert.equal(D.trainingDay(s,date,today).workouts[0].exercises[0].sets[2].load,'44.1 lb');
});
test('Multiple runs and work logged on a rest day override Day off',()=>{
 const s=state();s.history=[workout('run1',1000,{sets:[{exerciseId:'run',set:1,reps:20,kg:null,done:true}],partial:false}),workout('run2',2000,{sets:[{exerciseId:'run',set:1,reps:15,kg:null,done:true,metrics:{distanceM:2500,durationSeconds:900}}],partial:false})];
 const result=D.trainingDay(s,date,today);assert.equal(result.workouts.length,2);assert.equal(result.status,'recorded');assert.equal(result.workouts[0].exercises[0].sets[0].amountText,'20 minutes');
 const html=renderToStaticMarkup(React.createElement(C.TrainingDay,{state:s,date,today}));assert.ok(html.includes('2 recorded workouts'));assert.ok(!html.includes('Day off'));assert.ok(html.includes('Distance (meters): 2500'));
});
test('Replaced plans match their historical workouts and do not duplicate set results',()=>{
 const s=state();s.plan=plan('new',[session('new-session','2026-10-15')],'2026-10-12T12:00:00.000Z');s.saved=[plan('old',[session()])];s.history=[workout()];
 const result=D.trainingDay(s,date,today);assert.equal(result.sessions.length,1);assert.equal(result.sessions[0].archived,true);assert.equal(result.sessions[0].recorded,true);assert.equal(result.workouts.length,1);
 const html=renderToStaticMarkup(React.createElement(C.TrainingDay,{state:s,date,today}));assert.equal((html.match(/Recorded sets for/g)||[]).length,1);
 s.history=[];assert.equal(D.trainingDay(s,date,today).status,'not-logged');
});
test('An archived future plan cannot turn a current rest date into planned training',()=>{
 const s=state();s.plan=plan('new',[],'2026-10-10T12:00:00.000Z');s.saved=[plan('old',[session('old-future','2026-10-15')])];
 assert.equal(D.trainingDay(s,'2026-10-15',today).status,'rest');
 s.plan.sessions=[session('current-future','2026-10-15')];const result=D.trainingDay(s,'2026-10-15',today);assert.equal(result.status,'planned');assert.equal(result.relation,'future');assert.equal(result.sessions.length,1);
});
test('Older replaced schedules cannot overwrite a later archived plan rest day',()=>{
 const s=state();s.plan=plan('current',[],'2026-10-12T12:00:00.000Z');
 s.saved=[plan('recent',[],'2026-10-01T12:00:00.000Z'),plan('old',[session('obsolete-schedule')],'2026-09-01T12:00:00.000Z')];
 assert.equal(D.trainingDay(s,date,today).status,'rest');
 s.saved[0].sessions=[session('recent-session')];assert.equal(D.trainingDay(s,date,today).sessions.length,1);
 s.saved[0].acceptedAt=null;assert.equal(D.trainingDay(s,date,today).sessions.length,0);
});
test('Completed timestamp zero is retained, unfinished history is omitted and elapsed time cannot be negative',()=>{
 const s=state();s.history=[workout('zero',0,{finishedAt:0}),workout('unfinished',1,{finishedAt:undefined}),workout('invalid-clock',1000,{finishedAt:0})];
 const result=D.trainingDay(s,date,today);assert.deepEqual(result.workouts.map(w=>w.workout.id),['zero','invalid-clock']);assert.equal(result.workouts[0].elapsedMinutes,0);assert.equal(result.workouts[1].elapsedMinutes,null);
});
test('Date selection and static rendering leave history, active workout and current plan unchanged',()=>{
 const s=state();s.plan=plan();s.history=[workout()];s.active=workout('still-active',999,{date:today,finishedAt:undefined});s.events=[{id:'event',name:'Travel',date,kind:'Travel / unavailable',priority:'Normal',minutes:1440,provisional:false}];
 const before=JSON.stringify(s);frozen(s);const detail=D.trainingDay(s,date,today);assert.equal(detail.events[0].name,'Travel');
 const html=renderToStaticMarkup(React.createElement(C.TrainingDay,{state:s,date,today}));assert.equal(JSON.stringify(s),before);assert.ok(html.includes('3 days ago'));assert.ok(html.includes('Read only'));
 assert.ok(!/<button|<input|<textarea|<select|<form/.test(html));assert.ok(!html.includes('Start workout'));assert.ok(!html.includes('Resume workout'));
});
console.log(`${checks} training-day calendar/history groups passed.`);
