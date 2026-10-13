const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {load}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),C=load('lib/program-catalog.ts'),E=load('lib/equipment.ts'),O=load('lib/onboarding.ts'),
  SCI=load('lib/program-science.ts'),G=load('lib/session-guide.ts'),D=load('lib/session-duration.ts'),S=load('lib/saved-data.ts'),
  R=load('lib/researched-programs.ts'),REF=load('lib/evidence-sources.ts');
const base={...T.blankProfile,name:'Synthetic family review',age:30,experience:'Experienced',establishedTraining:true,jumpReady:true,
  runBase:true,runDays:7,runMinutes:300,days:[0,1,2,3,4,5,6],weeks:8,minutes:120,inventory:{...E.defaultInventory(),confirmed:true}};
const profile=(id,patch={})=>{const d=C.programCatalog.find(d=>d.id===id);return {...base,goal:d.goal,programId:id,equipment:C.programEquipment(d),trainingDays:d.days,...patch}};
function build(id,patch={}){const r=T.buildPlan(profile(id,patch));assert.ok(r.plan,id+': '+r.errors.join(' '));return r.plan;}
function runAction(label){return /moderate/i.test(label)?'moderate':/recovery/i.test(label)?'recovery':/jog|run/i.test(label)?'easy-run':/walk/i.test(label)?'walk':label;}
// Ignore titles/IDs, day labels, easy habit walks and identical repeated sessions.
// Count changed exercises, set/rep structures, rest and actual staged run durations/effort.
function signature(plan){
  const weeks=[];
  for(let week=1;week<=plan.profile.weeks;week++){
    const prescriptions=plan.sessions.filter(s=>s.week===week&&s.kind!=='Easy activity').map(s=>JSON.stringify({
      items:s.runSteps?undefined:s.items.map(i=>[i.exerciseId,i.sets,i.repMin??i.reps,i.repMax??i.reps,i.rest]),
      run:s.runSteps?.map(x=>[runAction(x.label),x.seconds]),
    }));
    weeks.push(JSON.stringify([...new Set(prescriptions)].sort()));
  }
  return JSON.stringify([...new Set(weeks)].sort());
}
const groups={};let built=0;
for(const def of C.programCatalog){
  const p=build(def.id,{noFloor:!!def.noFloor});built++;
  assert.ok(p.sessions.every(s=>s.minutes<=base.minutes&&D.estimateDuration(s).high<=s.minutes),def.id+' duration');
  assert.ok(p.sessions.every(s=>s.items.every(i=>i.kg===null&&E.equipmentFit(T.exFor(i.exerciseId),p.profile).available)),def.id+' inventory/load');
  const science=SCI.programScience(p);assert.ok(science.references.length&&science.principles.length,def.id+' evidence');
  for(const id of science.references)assert.ok(REF.evidenceLinks[id],def.id+' missing source '+id);
  const key=signature(p);(groups[def.goal]??=new Map());const list=groups[def.goal].get(key)||[];list.push(def.id);groups[def.goal].set(key,list);
}
const coverage=Object.fromEntries(Object.entries(groups).map(([goal,g])=>[goal,{entries:[...g.values()].flat().length,uniqueStructures:g.size,
  structures:[...g.entries()].map(([s,ids])=>({signatureSha256:crypto.createHash('sha256').update(s).digest('hex'),ids})),
  duplicateGroups:[...g.values()].filter(a=>a.length>1)}]));
for(const [goal] of T.goals)assert.ok(coverage[goal]?.uniqueStructures>=10,goal+' requires ten actual distinct structures: '+coverage[goal]?.uniqueStructures);
assert.equal(signature(build('D6-SBD')),signature(build('D7-SBD')),'An extra walk does not create a distinct lifting structure');
assert.equal(signature(build('QR2')),signature(build('QR3')),'Repeating the same run on another day is not a new run structure');
assert.notEqual(signature(build('RNFARTLEK3')),signature(build('RNCRUISE3')),'Actual interval duration differs');
assert.notEqual(signature(build('PL4')),signature(build('PLW4')),'Actual multi-week rep wave differs');

let fittingScenarios=0,successfulFits=0;
for(const def of R.researchedPrograms)for(const minutes of [15,20,30,45,60,90,120])for(const days of [[1,4],[1,3,5],[0,1,2,3,4,5,6]]){
  fittingScenarios++;const r=T.buildPlan(profile(def.id,{minutes,days}));if(!r.plan)continue;successfulFits++;
  assert.ok(r.plan.sessions.every(s=>D.estimateDuration(s).high<=minutes),def.id+' fitted time');
  assert.equal(r.plan.sessions.length,def.days*8);
  const state={...T.initialState(),profile:r.plan.profile,plan:r.plan};const restored=S.readSavedState(JSON.stringify(state));
  assert.deepEqual(restored.plan.sessions,JSON.parse(JSON.stringify(r.plan.sessions)),'Timed steps/targets survive save');
}
assert.ok(successfulFits>30);
for(const id of ['RNFARTLEK3','RNCRUISE3','RNSTEADY3']){
  for(const patch of [{runBase:false},{runDays:2},{runMinutes:60},{age:17,supervision:true}])assert.equal(T.buildPlan(profile(id,patch)).plan,null,id+' readiness');
  const plan=build(id,{experience:'First time'}); // Running experience is not lifting experience.
  const session=plan.sessions.find(s=>s.runSteps.some(x=>/moderate/i.test(x.label)));
  assert.match(G.sessionGuide(plan,session).effort,/short phrases/);
  assert.ok(session.runSteps.filter(x=>/moderate/i.test(x.label)).every(x=>/never all-out/.test(x.label)));
  for(let week=1;week<=8;week++)assert.equal(plan.sessions.filter(s=>s.week===week&&s.runSteps.some(x=>/moderate/i.test(x.label))).length,1);
  assert.deepEqual(session.runSteps,plan.sessions.find(s=>s.week===3&&s.roleId===session.roleId).runSteps,'No automatic intensity escalation');
  assert.ok(SCI.programScience(plan).references.includes('ENDURANCE-DISTRIBUTION'));
}
const staged=build('RNGRADUAL3'),next=staged.sessions.find(s=>s.week===3),prev=staged.sessions.find(s=>s.id===next.dependsOn[0]);
const record={id:'synthetic-run',sessionId:prev.id,title:prev.title,date:prev.date,startedAt:1,finishedAt:2,
  sets:prev.items.map(i=>({exerciseId:i.exerciseId,set:1,reps:i.reps,kg:null,done:true})),partial:false,effort:'right',symptom:'no'};
const runState={...T.initialState(),profile:staged.profile,plan:staged,history:[record]};
assert.equal(T.eligibility(runState,next),null);
for(const patch of [{effort:'harder'},{effort:undefined},{symptom:undefined},{symptom:'yes'}])assert.match(T.eligibility({...runState,history:[{...record,...patch}]},next),/comfortable completed work/);
assert.ok(T.eligibility({...runState,history:[{...record,partial:true}]},next));
assert.notDeepEqual(prev.runSteps,next.runSteps,'Stage actually changes');
const jump=build('SPJUMP2'),jumpFocus=build('SPJUMP2',{focuses:['jumping']});
for(const plan of [jump,jumpFocus])for(let week=1;week<=8;week++)assert.equal(plan.sessions.filter(s=>s.week===week).flatMap(s=>s.items).filter(i=>i.exerciseId==='lib-small-jump-reset').reduce((n,i)=>n+i.sets*i.reps,0),6,'No doubled jump dose');
assert.equal(T.buildPlan(profile('SPJUMP2',{jumpReady:false})).plan,null);
assert.equal(T.buildPlan(profile('SPJUMP2',{noFloor:true})).plan,null);
assert.equal(T.loadSuggestion({...T.initialState(),profile:jump.profile,plan:jump},jump.sessions[0].items[0]).kg,null);
const jumpDate=jump.sessions[0].date;
assert.equal(T.buildPlan(profile('SPJUMP2'),[{id:'synthetic-field',name:'Field practice',date:T.addDays(jumpDate,1),kind:'Training',priority:'Normal'}]).plan,null);
for(const goal of ['hypertrophy','powerbuilding','powerlifting','strength','general','calisthenics','hybrid','running','sport']){
  const options=O.planOptions({...base,goal,trainingDays:undefined},[]),fitting=options.filter(o=>o.plan&&o.profile.goal===goal&&o.profile.mode==='app');
  assert.ok(fitting.length>=10,goal+' has ten fitting choices with unrestricted setup');
  assert.equal(options.filter(o=>o.recommended).length,1);
  assert.ok(options.find(o=>o.recommended).plan);
  const manual=SCI.programScience({...fitting[0].plan,profile:{...fitting[0].plan.profile,mode:'manual'}});assert.deepEqual(manual.references,[]);
}
const report={checkedAt:new Date().toISOString(),scope:'Actual eight-week generated prescriptions. Deduplicated titles/IDs, repeated same-session frequencies and added easy walks. Software fit/evidence mapping, not independent physiological validation.',
  originals:built,minimumUniquePerGoal:10,coverage,newDefinitions:R.researchedPrograms.map(d=>d.id),fittingScenarios,successfulFits,passed:true};
fs.mkdirSync('docs/science',{recursive:true});fs.writeFileSync('docs/science/goal-family-validation-2026-10-13.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({originals:built,unique:Object.fromEntries(Object.entries(coverage).map(([g,c])=>[g,c.uniqueStructures])),fittingScenarios,successfulFits,passed:true}));
