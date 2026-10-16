const assert = require('node:assert/strict');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {load} = require('./domain-test-loader.cjs');
const T=load('lib/training.ts'), C=load('lib/program-catalog.ts'), E=load('lib/equipment.ts'), D=load('lib/session-duration.ts'), O=load('lib/onboarding.ts');
const {profileFor}=require('./generate-routine-library.cjs');
const routines=JSON.parse(fs.readFileSync('lib/routine-library.json'));
const report=JSON.parse(fs.readFileSync('docs/routine-library-qualification-2026-10-16.json'));
const families=load('lib/routine-library-families.ts').routineFamilies;
let builds=0, rejects=0, groups=0;
function test(label,fn) {fn();groups++;console.log('PASS '+label);}
function assertPlan(def,extra={}) {
  const p=profileFor(def,extra),r=T.buildPlan(p); builds++;
  assert.ok(r.plan,def.id+': '+r.errors.join(' '));
  for(const s of r.plan.sessions) {
    assert.ok(s.minutes<=p.minutes,def.id+' schedule exceeded availability');
    assert.ok(D.estimateDuration(s).high<=p.minutes,def.id+' duration range exceeded availability');
    for(const i of s.items) {assert.notEqual(T.exFor(i.exerciseId).name,'Archived exercise');assert.equal(i.kg,null);}
  }
  for(let i=1;i<r.plan.sessions.length;i++) {
    const a=r.plan.sessions[i-1],b=r.plan.sessions[i];
    if(T.dayDistance(a.date,b.date)===1) assert.ok(!E.recoveryGroupsOverlap(a.recoveryGroup,b.recoveryGroup),def.id+' consecutive repeated group');
  }
  return r.plan;
}
test('Generated prescriptions match reviewed input hashes and the actual engine',()=>{
  const run=spawnSync(process.execPath,['scripts/generate-routine-library.cjs','--check'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.equal(report.submittedCount,125);assert.equal(report.offeredCount,routines.length);
  assert.equal(new Set(C.programCatalog.map(p=>p.id)).size,C.programCatalog.length);
  for(const d of routines) assert.deepEqual(C.programCatalog.find(p=>p.id===d.id),d);
  for(const row of report.variants.filter(r=>!r.offered)) {assert.ok(row.reasons.length);assert.ok(!C.programCatalog.some(p=>p.id===row.id));}
});
test('Every new option builds all eight weeks within its advertised duration and recovery gaps',()=>{
  for(const d of routines) {
    const plan=assertPlan(d);assert.equal(plan.sessions.length,d.days*8);
    assert.equal(plan.sessions[0].title,d.slots[0].title);
    for(const weeks of [2,4]) assert.equal(assertPlan(d,{weeks}).sessions.length,d.days*weeks);
    for(let start=1;start<7;start++) assertPlan(d,{start:T.addDays('2026-10-19',start),weeks:2});
  }
});
test('Longer availability retains the reference dose; old automatic set inflation is absent',()=>{
  for(const d of routines) {
    const family=families.find(f=>d.id.startsWith('LIB-'+f.code+'-'));
    for(let n=0;n<d.slots.length;n++) for(const item of d.slots[n].items) {
      const reference=family.slots[n].items.find(i=>i[0]===item[0]);
      assert.ok(reference);assert.ok(item[1]<=reference[1]);assert.deepEqual(item.slice(2),reference.slice(2));
    }
    const normal=assertPlan(d),roomy=assertPlan(d,{minutes:120});
    assert.deepEqual(roomy.sessions.map(s=>s.items),normal.sessions.map(s=>s.items));
  }
});
test('Actual equipment, smaller schedules, youth and experience restrictions stay authoritative',()=>{
  for(const d of routines) {
    const equipment=profileFor(d).equipment;
    const inventory={...E.defaultInventory(equipment),confirmed:true};
    const p=profileFor(d,{inventory}),r=T.buildPlan(p);builds++;
    // An equipment-matched alternative may need more time; rejection must be clear.
    if(r.plan) for(const s of r.plan.sessions) for(const i of s.items) assert.ok(E.equipmentFit(T.exFor(i.exerciseId),p).available,d.id+' unavailable '+i.exerciseId);
    else assert.ok(r.errors.length);
    for(const extra of [{age:17},{days:[1]},{minutes:5},...(d.experience==='advanced'?[{establishedTraining:false}]:[])]) {
      const result=T.buildPlan(profileFor(d,extra));rejects++;assert.equal(result.plan,null,d.id+' accepted '+JSON.stringify(extra));assert.ok(result.errors.length);
    }
    if(d.experience==='all') assertPlan(d,{experience:'First time'});
  }
});
test('Selection exposes real added routines, existing defaults and accepted history stay stable',()=>{
  for(const id of ['LIB-PL3-60','LIB-GF1-60','LIB-HB1-60']) {
    const d=routines.find(p=>p.id===id);assert.ok(d,id);
    const p=profileFor(d),options=O.planOptions(p,[]),option=options.find(o=>o.id===id);
    assert.ok(option?.plan,id+' absent from selection');
    const state=O.freshState();state.history=[{id:'preserved-old-workout'}];
    const accepted=O.acceptSetup(state,option.profile,option.plan,[]);
    assert.equal(accepted.error,undefined);assert.deepEqual(accepted.state.history,state.history);assert.equal(accepted.state.plan.template,id);
  }
  const first=C.programCatalog.find(p=>p.goal==='powerlifting');assert.equal(first.id,'PL3');
});
test('Six days remain a split; seven-day hybrid preferences add easy activity without a seventh hard day',()=>{
  const six=routines.find(p=>p.id==='LIB-HY3-60');assert.ok(six);
  const sixPlan=assertPlan(six);assert.equal(sixPlan.sessions.filter(s=>s.week===3).length,6);
  const hybrid=routines.find(p=>p.id==='LIB-HB1-60');
  const seven=assertPlan(hybrid,{trainingDays:7});
  const week=seven.sessions.filter(s=>s.week===3);assert.equal(week.length,7);
  assert.equal(week.filter(s=>s.kind==='Easy activity').length,3);
  assert.equal(week.filter(s=>s.kind==='Strength').length,2);
  assert.equal(week.filter(s=>s.runSteps?.length).length,2);
});
test('Known proposal failures stay unselectable and do not silently become other programs',()=>{
  for(const id of ['LIB-HB1-30','LIB-HY4-90','LIB-SP3-15','LIB-GF1-15']) {
    assert.ok(report.variants.some(r=>r.id===id&&!r.offered),id);
    assert.equal(T.buildPlan({...T.blankProfile,programId:id,goal:id.includes('HY4')?'hypertrophy':id.includes('SP3')?'sport':id.includes('HB1')?'hybrid':'general',minutes:120,days:[0,1,2,3,4,5,6]}).plan,null);rejects++;
  }
  const general=assertPlan(routines.find(p=>p.id==='LIB-GF4-60'));
  assert.ok(general.notes.some(n=>n.includes('not the NHS')));
  assert.ok(!general.evidence.includes('NHS-C25K'));
  assert.ok(general.sessions.filter(s=>s.runSteps).every(s=>s.minutes>=33));
});
console.log(JSON.stringify({groups,actualPlanBuilds:builds,expectedRejections:rejects,newRoutines:routines.length,submitted:report.submittedCount,withheld:report.withheldCount}));
