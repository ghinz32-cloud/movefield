const assert=require('node:assert/strict'),fs=require('node:fs'),{spawnSync}=require('node:child_process'),{load,workoutFixture}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),D=load('lib/session-duration.ts'),A=load('lib/customize.ts');
const state=workoutFixture(),session=state.plan.sessions[0],estimate=D.estimateDuration(session);
assert.ok(estimate.low>0&&estimate.high>=estimate.low);assert.equal(estimate.restMinutes,session.items.reduce((n,i)=>n+(i.sets-1)*i.rest,0)/60);assert.ok(estimate.assumptions.some(x=>x.includes('not an observed')));
const unilateral={id:'synthetic-leg',name:'Synthetic per-leg movement',pattern:'Single leg',equipment:'Dumbbell',metric:'reps',cues:[],custom:true,loadConvention:'Two dumbbells; reps per leg, both legs',loadMultiplier:4};
const item={exerciseId:unilateral.id,sets:2,reps:10,repMin:8,repMax:12,rest:90,kg:null},one={...session,items:[item]},both=D.estimateDuration(one,[unilateral]),single=D.estimateDuration(one,[{...unilateral,loadConvention:'Total reps'}]);
assert.equal(both.workMinutes,single.workMinutes*2);assert.ok(T.estimateSessionMinutes([{...item,sets:8,reps:20,repMin:20,repMax:20}],false,[unilateral])>T.estimateSessionMinutes([{...item,sets:8,reps:20,repMin:20,repMax:20}],false,[{...unilateral,loadConvention:'Total reps'}]));
const input={sessionId:state.plan.sessions[1].id,exercise:unilateral,sets:2,lo:8,hi:12,rest:90,all:false,setup:'',allowLonger:true,planId:state.plan.id,version:state.plan.version};assert.ok(A.previewAddition(state,input).changes[0].after>A.previewAddition(state,{...input,exercise:{...unilateral,loadConvention:'Total reps'}}).changes[0].after);
const run=D.estimateDuration({...one,runSteps:[{label:'Walk',seconds:300},{label:'Run/walk',seconds:1200},{label:'Closing walk',seconds:300}]});assert.equal(run.low,30);assert.equal(run.high,35);assert.equal(D.estimateDuration({...session,items:[]}),null);
assert.throws(()=>D.estimateDuration({...one,items:[{...item,rest:Infinity}]}),/invalid duration/);
let fitted=0;
for(const def of load('lib/program-catalog.ts').programCatalog){for(const budget of [15,20,30,45,60,90,120]){
 const profile={...T.blankProfile,age:28,goal:def.goal,programId:def.id,minutes:budget,weeks:4,days:[0,1,2,3,4,5,6],equipment:def.equipment==='none'?'No equipment':def.equipment==='bodyweight-band'?'Bodyweight + band':def.equipment==='gym'?'Full gym':'Dumbbells',experience:'Experienced',establishedTraining:true,runBase:true,runDays:7,runMinutes:300};
 const result=T.buildPlan(profile);if(!result.plan)continue;fitted++;
 for(const workout of result.plan.sessions){const range=D.estimateDuration(workout);if(range)assert.ok(range.high<=budget,def.id+' exceeded '+budget+' minutes: '+JSON.stringify(range));}
}}
assert.ok(fitted>100,'Exercise a substantial supported-plan/time matrix');
const ledger=JSON.parse(fs.readFileSync('docs/evidence-ledger.json')),map=JSON.parse(fs.readFileSync('docs/claim-to-code.json')),links=load('lib/evidence-sources.ts').evidenceLinks;
assert.equal(ledger.archive_inventory.full_text_reviewed_current,0);assert.deepEqual(ledger.sources.map(x=>x.id).sort(),Object.keys(links).sort());
for(const rule of map.rules){const [file,symbol]=rule.implementation.split('#');assert.ok(fs.readFileSync(file,'utf8').includes(symbol));for(const test of rule.tests)assert.ok(fs.existsSync(test));for(const id of rule.sources)assert.ok(ledger.sources.find(s=>s.id===id).rule_ids.includes(rule.id));assert.ok(rule.classification&&rule.claim)}
for(const tz of ['America/Chicago','America/New_York','Europe/London','Pacific/Auckland','Asia/Kolkata']){const result=spawnSync(process.execPath,['-e',"const assert=require('node:assert/strict'),{load}=require('./scripts/domain-test-loader.cjs'),T=load('lib/training.ts'),C=load('lib/calendar.ts');for(const date of ['2024-02-29','2026-03-08','2026-11-01','2026-12-31']){assert.equal(T.dayDistance(date,T.addDays(date,1)),1);assert.equal(C.monthDates(date).length,42)}"],{env:{...process.env,TZ:tz},encoding:'utf8'});assert.equal(result.status,0,tz+result.stderr)}
console.log('PASS: transparent duration ranges and supported-plan budget matrix, unchanged prescribed rest, per-leg accounting, timed sequences, evidence inventory/map integrity and local calendar arithmetic in five time zones');
