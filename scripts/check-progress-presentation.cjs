// Executes the real web/native presentation functions and callbacks with mocked
// React/OS/chart boundaries. This is not device, DOM or chart-layout validation.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks');
const domain=require('./domain-test-loader.cjs'),{harness}=require('./check-native-interactions.cjs');
const T=domain.load('lib/training.ts'),P=domain.load('lib/progress.ts'),A=domain.load('lib/activity-progress.ts');
const inline=x=>Array.isArray(x)?x.map(inline).join(''):x&&typeof x==='object'?inline(x.props?.children):x===null||x===undefined||typeof x==='boolean'?'':String(x);
const text=h=>inline(h.nodes()[0]);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fixture(count=110){
 const s=domain.workoutFixture();s.active=null;s.profile.goal='hybrid';
 const machine=T.exercises.find(e=>T.requiresSetup(e)&&T.isLoadTracked(e)&&e.metric==='reps');assert.ok(machine);
 s.history=Array.from({length:count},(_,i)=>({id:'progress-'+i,sessionId:'old-'+i,title:'Synthetic saved workout',date:T.addDays(T.day(),-count+i+1),startedAt:i+1,finishedAt:i+2,symptom:'no',partial:i%9===0,loadContext:{[machine.id]:i%3===0?'':i%3===1?'Machine A':'Machine B'},sets:['bench','squat','rdl',machine.id].map(exerciseId=>({exerciseId,set:1,reps:8+i%3,kg:i%4===0?null:i%4===1?0:50,done:true,rir:1,metrics:{distanceM:i%2?undefined:1000,durationSeconds:300}}))}));
 return {s,machine};
}
async function nativeJourney(){
 const {s,machine}=fixture(),saved=JSON.stringify(s);let period=28,calls=0,observed=[];
 // Future and unfinished records retain the existing activity-window rules.
 s.history.push({...s.history[0],id:'future',date:T.addDays(T.day(),1)});
 s.history.push({...s.history[0],id:'unfinished',finishedAt:undefined});
 const input=JSON.stringify(s),mocks={'./shared/training':T,'./shared/activity-progress':A,'./shared/progress':{...P,exerciseSeries(selected,id,setup){
  calls++;const ids=new Set(A.activityProgress(s,period).map(x=>x.id));
  assert.deepEqual(selected.history,s.history.filter(w=>ids.has(w.id)),'period is selected before per-record date formatting');
  const result=P.exerciseSeries(selected,id,setup),reference=P.exerciseSeries(s,id,setup).filter(x=>ids.has(x.id));
  assert.deepEqual(result,reference,'formatted visible series exactly preserves the prior full-history/filter result');
  observed.push({period,id,setup,records:selected.history.length,series:result.length});return result;
 }}};
 const h=harness('mobile/src/progress.tsx',{state:s},mocks);await h.flush();
 assert.match(text(h),/28 recorded workouts/);assert.match(text(h),/partial/);assert.match(text(h),/Not available/);
 await h.press('Measurement: recorded load');assert.match(text(h),/Best performed set\/task:/);
 await h.press(machine.name);await h.press('Machine B');assert.match(text(h),/Selected setup: Machine B/);
 await h.press('Distance units: km');assert.match(text(h),/Distance units: mi/);
 const query=h.find(x=>x.props.accessibilityLabel==='Find a recorded progress exercise');query.props.onChangeText('missing synthetic name');await h.flush();assert.equal(h.all(x=>x.props.accessibilityRole==='button'&&inline(x).includes(machine.name)).length,0);
 query.props.onChangeText('');await h.flush();await h.press('Show more progress records');
 period=84;await h.press('84 days');assert.match(text(h),/84 recorded workouts/);
 period='all';await h.press('All records');assert.match(text(h),/111 recorded workouts/);assert.ok(observed.at(-1).records>100);
 period=28;await h.press('28 days');assert.equal(observed.at(-1).records,28);
 assert.equal(JSON.stringify(s),input,'all controls retain complete state/history');assert.notEqual(input,saved,'fixture contains explicit future/unfinished edge records');
 return {calls,observed};
}
async function webJourney(){
 const {s,machine}=fixture(),props={state:s,onExercise:()=>{},onSample:()=>{}};let calls=0,currentDay=T.day();
 const charts=Object.fromEntries(['LineChart','Line','BarChart','Bar','XAxis','YAxis','CartesianGrid','Tooltip','ReferenceLine'].map(x=>[x,x]));
 const mocks={'@/lib/presentation':domain.load('lib/presentation.ts'),'@/lib/training':{...T,day:()=>currentDay},'@/lib/progress':{...P,strengthIndex(state){calls++;return P.strengthIndex(state)}},recharts:charts,'@/components/ui/chart':{ChartContainer:'ChartContainer'},'@/components/ui/button':{Button:'Button'}};
 const h=harness('components/progress-dashboard.tsx',props,mocks);await h.flush();assert.equal(calls,1);
 const indexData=()=>h.find(x=>x.props.title==='View strength index data').props.rows;
 const checkIndex=()=>assert.deepEqual(indexData(),P.strengthIndex(props.state).points.map(x=>[x.date,x.index??'Not available']));checkIndex();
 const choose=async(label,value)=>{h.find(x=>x.props['aria-label']===label).props.onChange({target:{value}});await h.flush();checkIndex()};
 await choose('Chart measurement','amount');await choose('Chart exercise',machine.id);await choose('Chart machine setup','Machine B');h.render();assert.equal(calls,1,'local controls and repeat renders reuse the unchanged index');
 props.state={...s,profile:{...s.profile,age:17}};h.render();assert.equal(calls,2);checkIndex();assert.match(text(h),/Available for ages 18 and over/);
 props.state={...s,history:s.history.slice(0,10)};h.render();assert.equal(calls,3);checkIndex();
 props.state={...props.state,custom:[...s.custom]};h.render();assert.equal(calls,4,'new custom metadata state invalidates memo');checkIndex();
 currentDay=T.addDays(currentDay,1);h.render();assert.equal(calls,5,'new local day invalidates memo even when state is unchanged');checkIndex();
 return {indexCalls:calls,controlChanges:3,stateChanges:3,localDayChanges:1};
}
async function nativeBench(){
 const {s}=fixture(5000);domain.load('lib/saved-data.ts').readSavedState(JSON.stringify(s));
 const samples=[],inputs=[];const h=harness('mobile/src/progress.tsx',{state:s},{'./shared/training':T,'./shared/activity-progress':A,'./shared/progress':{...P,exerciseSeries(state,...args){inputs.push(state.history.length);return P.exerciseSeries(state,...args)}}});
 for(let i=0;i<3;i++){global.gc?.();const start=performance.now();h.render();samples.push(performance.now()-start)}
 assert.deepEqual(inputs,[28,28,28],'5,000-record default view formats only 28 selected records');
 await h.press('All records');assert.equal(inputs.at(-1),5000,'all-time still includes the full recorded history');
 return {supportedRecords:5000,explicitGcBeforeSamples:typeof global.gc==='function',default28RenderMs:samples,defaultSeriesInputRecords:28,allTimeSeriesInputRecords:5000};
}
(async()=>{const receipt={checkedAt:new Date().toISOString(),scope:'Actual component functions/callbacks with hook, OS and chart boundaries mocked; no renderer/device latency claim.',native:await nativeJourney(),web:await webJourney(),benchmark:await nativeBench(),hashes:Object.fromEntries(['mobile/src/progress.tsx','components/progress-dashboard.tsx','lib/progress-runtime.js',__filename].map(file=>[file,hash(file)]))};if(process.env.PROGRESS_PRESENTATION_RECEIPT)fs.writeFileSync(process.env.PROGRESS_PRESENTATION_RECEIPT,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));console.log('PASS progress presentation: exact period-first series equivalence, native controls/context/unknown/partial/units/state preservation, web memo invalidation by state and day, supported 5,000-record bounded work.');})().catch(e=>{console.error(e);process.exitCode=1});
