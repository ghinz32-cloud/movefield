const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createLoader,root}=require('./lib/load-typescript.cjs');
const load=createLoader(),T=load('lib/training.ts'),C=load('lib/program-catalog.ts'),O=load('lib/onboarding.ts'),E=load('lib/program-evidence.ts'),F=load('lib/training-focus.ts');
const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
const registry=vm.runInNewContext('('+page.match(/const SOURCE_LINKS:[^=]+=(\{[\s\S]*?\n\});/)[1]+')');
const base={...T.blankProfile,name:'Science regression',age:28,goal:'general',experience:'Experienced',establishedTraining:true,start:'2026-11-02',days:[0,1,2,3,4,5,6],minutes:120,weeks:8,equipment:'Full gym',supervision:true,runBase:true,runDays:4,runMinutes:100};
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name)}
function build(p={},events=[]){const result=T.buildPlan({...base,...p},events);assert.ok(result.plan,result.errors.join(' '));return result.plan}
function resolved(plan){assert.equal(plan.evidence.length,new Set(plan.evidence).size);for(const id of plan.evidence)assert.ok(registry[id],'Unresolved evidence '+id)}
function invariants(plan,count){assert.equal(plan.sessions.length,count);const seen=new Set();for(const s of plan.sessions){assert.ok(!seen.has(s.id));assert.ok(plan.profile.days.includes(new Date(s.date+'T12:00:00').getDay()));assert.ok(s.minutes<=plan.profile.minutes);for(const id of s.dependsOn||[])assert.ok(seen.has(id),'Prerequisite must be earlier');for(const i of s.items)assert.notEqual(T.exFor(i.exerciseId).name,'Archived exercise');seen.add(s.id)}resolved(plan)}

test('HY5 weekday orientation keeps the full block and discloses the delayed first role',()=>{
 const plan=build({goal:'hybrid',programId:'HY5',days:[1,2,3,4,5]});invariants(plan,40);
 assert.deepEqual(plan.sessions.slice(0,5).map(s=>s.date),['2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-09']);
 assert.deepEqual(plan.sessions.slice(0,5).map(s=>s.roleId),['HY5-0','HY5-1','HY5-2','HY5-3','HY5-4']);
 assert.ok(plan.notes.some(n=>n.includes('first workout starts Tue, Nov 3')&&n.includes('full 8-week block')));
 for(const group of ['full','run']){const sessions=plan.sessions.filter(s=>s.recoveryGroup===group);for(let i=1;i<sessions.length;i++)assert.ok(T.dayDistance(sessions[i-1].date,sessions[i].date)>=2)}
});
test('Every start weekday preserves HY5 roles, counts and comparable recovery',()=>{
 for(let n=0;n<7;n++){const plan=build({goal:'hybrid',programId:'HY5',days:[1,2,3,4,5],start:T.addDays(base.start,n),weeks:3});invariants(plan,15);assert.equal(plan.sessions[0].roleId,'HY5-0');for(const group of ['full','run']){const ss=plan.sessions.filter(s=>s.recoveryGroup===group);for(let i=1;i<ss.length;i++)assert.ok(T.dayDistance(ss[i-1].date,ss[i].date)>=2)}}
});
test('Commitments preserve all HY5 work and prerequisites without occupying protected dates',()=>{
 const event={id:'game',name:'Game',date:'2026-11-11',kind:'Competition',priority:'High',minutes:60,provisional:false};
 const plan=build({goal:'hybrid',programId:'HY5',days:[1,2,3,4,5]},[event]);invariants(plan,40);for(const s of plan.sessions)assert.ok(!['2026-11-09','2026-11-10','2026-11-11'].includes(s.date));
});
test('Original PLSL3 A/B roles roll across weeks with their actual prior-role prerequisites',()=>{
 const plan=build({goal:'powerlifting',programId:'PLSL3',days:[1,3,5],weeks:4});invariants(plan,12);
 assert.deepEqual(plan.sessions.map(s=>s.roleId),Array.from({length:12},(_,n)=>'PLSL3-'+n%2));
 for(let n=0;n<12;n++){const s=plan.sessions[n];assert.equal(s.title.startsWith(n%2?'Workout B':'Workout A'),true);assert.deepEqual(s.dependsOn,n<2?[]:[plan.sessions[n-2].id]);assert.ok(s.items.some(i=>i.exerciseId==='bar-squat'));assert.ok(s.items.some(i=>i.exerciseId===(n%2?'deadlift':'bench')))}
 assert.match(C.programCatalog.find(d=>d.id==='PLSL3').description,/two comparable upper-target sessions/);assert.doesNotMatch(plan.notes[0],/Add weight once every set/);
});
test('Named StrongLifts stays manual with exact base work and continuous A/B',()=>{
 const plan=build({goal:'powerlifting',programId:'ref-stronglifts',mode:'manual',days:[1,3,5],weeks:2});invariants(plan,6);assert.deepEqual(plan.evidence,[]);
 assert.deepEqual(plan.sessions.map(s=>s.roleId),['ref-stronglifts-0','ref-stronglifts-1','ref-stronglifts-0','ref-stronglifts-1','ref-stronglifts-0','ref-stronglifts-1']);
 assert.deepEqual(plan.sessions[0].items.map(i=>[i.exerciseId,i.sets,i.reps]),[['bar-squat',5,5],['bench',5,5],['ref-Bent_Over_Barbell_Row',5,5]]);
 const s={...T.initialState(),profile:plan.profile,plan};assert.equal(T.loadSuggestion(s,plan.sessions[0].items[0]).kg,null);assert.match(T.loadSuggestion(s,plan.sessions[0].items[0]).reason,/Source-specific progression is manual/);
});
test('All 75 original paths preserve complete blocks and resolve scoped evidence',()=>{
 assert.equal(C.programCatalog.length,75);
 for(const d of C.programCatalog){const plan=build({goal:d.goal,programId:d.id,equipment:C.programEquipment(d)});invariants(plan,8*d.days);assert.equal(plan.sessions[0].title,d.slots[0].title)}
});
test('All 20 named references remain source/user owned, including 12 empty calendars',()=>{
 assert.equal(C.programReferences.length,20);let empty=0;
 for(const d of C.programReferences){const plan=build({goal:d.goal,programId:d.id,mode:'manual',weeks:Math.min(d.weeks||8,8),equipment:d.equipment==='bodyweight'?'Bodyweight + band':d.equipment==='dumbbells'?'Dumbbells':'Full gym'});invariants(plan,plan.profile.weeks*d.days);assert.deepEqual(plan.evidence,[]);if(!d.workouts){empty++;assert.ok(plan.sessions.every(s=>s.items.length===0))}}
 assert.equal(empty,12);
});
test('Youth current and catalog paths inherit youth guidance without adult goal efficacy cards',()=>{
 for(const age of [14,17]){const foundation=build({age,goal:'sport',experience:'First time',establishedTraining:false,programId:undefined});assert.equal(foundation.template,'YOUTH-FOUNDATION');assert.deepEqual(foundation.evidence,['AAP-2020','NSCA-YOUTH','LLOYD-2016-LTAD']);
 for(const d of C.programCatalog.filter(d=>d.youth)){const plan=build({age,goal:d.goal,programId:d.id,equipment:C.programEquipment(d),experience:'First time',establishedTraining:false});assert.deepEqual(plan.evidence,['AAP-2020','NSCA-YOUTH','LLOYD-2016-LTAD']);assert.ok(plan.sessions.every(s=>s.items.every(i=>i.sets===1)));resolved(plan)}}
});
test('Healthy older adult strength has older-function context; source scope excludes clinical validation',()=>{
 const plan=build({age:70,goal:'general',programId:'GF2',equipment:'Dumbbells'});assert.ok(plan.evidence.includes('ACSM-2026'));assert.ok(plan.evidence.includes('OLDER-ADULT'));assert.ok(plan.evidence.includes('WHO-2020'));assert.ok(plan.notes.some(n=>n.includes('balance and functional strength')));assert.match(registry['ACSM-2026'].summary,/healthy adults/i);assert.match(registry['ACSM-2026'].summary,/not|does not/i);
});
test('App running intervals and base runs do not inherit NHS or adult resistance efficacy citations',()=>{
 for(const d of C.programCatalog.filter(d=>d.goal==='running')){const plan=build({goal:'running',programId:d.id});assert.deepEqual(plan.evidence,['WHO-2020']);assert.equal(d.source,'WHO-2020')}
 const nhs=build({goal:'running',programId:undefined,weeks:9,days:[1,3,5],runBase:false,runDays:0,runMinutes:0});assert.equal(nhs.template,'RUN-WALK');assert.deepEqual(nhs.evidence,['NHS-C25K','WHO-2020']);assert.notDeepEqual(nhs.sessions.filter(s=>s.week===5).map(s=>s.runSteps),Array(3).fill(nhs.sessions.find(s=>s.week===5).runSteps));
});
test('Empty generic coach/manual tracking carries no app-prescription efficacy evidence',()=>{
 for(const mode of ['coach','manual']){const plan=build({goal:'sport',mode});assert.equal(plan.template,'TRACK');assert.deepEqual(plan.evidence,[]);assert.ok(plan.sessions.every(s=>s.items.length===0));const selected=F.applyTrainingFocus({...plan,profile:{...plan.profile,focuses:['core','activity']}});assert.deepEqual(selected.plan.evidence,[]);assert.deepEqual(selected.plan.sessions,plan.sessions)}
});
test('Activity overlay rejects the demonstrated final canonical over-window draft',()=>{
 const p={goal:'powerlifting',programId:'PL3',days:[1,3,5],experience:'First time',establishedTraining:false,minutes:65,weeks:4,focuses:['activity']};const rejected=T.buildPlan({...base,...p});assert.equal(rejected.plan,null);assert.match(rejected.errors.join(' '),/70 minutes after the selected add-ons/);
 const plan=build({...p,minutes:70});assert.ok(plan.sessions.every(s=>s.minutes>=T.estimateSessionMinutes(s.items,s.timeProfile==='brief')&&s.minutes<=70));assert.ok(plan.sessions.some(s=>s.items.some(i=>i.exerciseId==='walk')));
});
test('Selected focus citations and URL notes follow the actual adult/youth add-ons',()=>{
 const adult=build({goal:'general',programId:'GF2',equipment:'Dumbbells',days:[1,4],focuses:['activity']});assert.ok(adult.evidence.includes('CDC-ACTIVITY'));assert.ok(!adult.evidence.includes('NSCA-PLYOMETRICS'));const note=adult.notes.find(n=>n.includes('Selected principle sources:'));assert.ok(note.includes(registry['CDC-ACTIVITY'].url));assert.ok(!note.includes('plyometric-exercises'));
 const youth=build({age:16,goal:'sport',experience:'First time',establishedTraining:false,programId:undefined,days:[1,4],focuses:['core','jumping'],jumpReady:true});assert.ok(!youth.evidence.includes('ACSM-2026'));assert.ok(!youth.evidence.includes('CDC-ACTIVITY'));assert.ok(!youth.evidence.includes('ZHANG-2025-SUPERSET'));const youthNote=youth.notes.find(n=>n.includes('Selected principle sources:'));assert.ok(youthNote.includes(registry['NSCA-YOUTH'].url));assert.ok(!youthNote.includes('PMC12965823'));assert.ok(!youthNote.includes('cdc.gov'));
 const paired=build({goal:'powerbuilding',programId:'PB4',focuses:['supersets']});assert.ok(paired.evidence.includes('ZHANG-2025-SUPERSET'));assert.ok(F.selectedFocusSources(['supersets'],false).every(s=>s.id==='ZHANG-2025-SUPERSET'));resolved(paired);
});
test('First-time equal-fit ranking prefers a smaller feasible foundation without hiding longer choices',()=>{
 for(const minutes of [60,75,90]){const p={...base,goal:'powerbuilding',programId:undefined,experience:'First time',establishedTraining:false,days:[1,3,5],minutes},options=O.planOptions(p,[]),recommended=options.find(o=>o.recommended);assert.equal(recommended.id,'QPB3');assert.ok(recommended.startHere);assert.ok(recommended.notes.some(n=>n.includes('app preference')));if(minutes>=75){const longer=options.find(o=>o.id==='PBSTART3');assert.ok(longer.plan);assert.ok(longer.notes.some(n=>n.includes('36 whole-body work sets')&&n.includes('57 later')));assert.ok(longer.notes.some(n=>n.includes('not a comfortable-feedback')))}}
 const p={...base,goal:'powerbuilding',programId:undefined,experience:'Experienced',days:[1,3,5],minutes:90};assert.equal(O.planOptions(p,[]).find(o=>o.recommended).id,'PBSTART3');
});
test('Adult phase increase stays explicitly preaccepted, rather than silently changing the history gate',()=>{
 const plan=build({goal:'powerbuilding',programId:'PBSTART3',days:[1,3,5],experience:'First time',establishedTraining:false,weeks:4});const target=plan.sessions.find(s=>s.week===3&&s.roleId==='PBSTART3-0'),prior=plan.sessions.find(s=>s.id===target.dependsOn[0]);
 assert.equal(prior.items.reduce((n,i)=>n+i.sets,0),12);assert.equal(target.items.reduce((n,i)=>n+i.sets,0),19);
 const work={id:'prior',sessionId:prior.id,title:prior.title,date:prior.date,startedAt:1,finishedAt:2,partial:false,effort:'harder',symptom:'no',sets:prior.items.flatMap(i=>Array.from({length:i.sets},(_,n)=>({exerciseId:i.exerciseId,set:n+1,reps:i.reps,kg:T.isLoadTracked(T.exFor(i.exerciseId))?20:null,done:true,rir:0})))};
 const s={...T.initialState(),profile:plan.profile,plan,history:[work],hold:false};assert.equal(T.eligibility(s,target),null);assert.ok(plan.notes.some(n=>n.includes('not a comfortable-feedback or recovery assessment')));assert.match(T.eligibility({...s,history:[]},target),/missing|incomplete/);
});
test('Legacy AT01-AT04 remain executable and recipe aliases/policy drift are explicit',()=>{
 const saved=C.programCatalog.splice(0);try{for(const [id,p]of [['AT01',{goal:'general',experience:'First time'}],['AT02',{goal:'hypertrophy'}],['AT03',{goal:'strength'}],['AT04',{goal:'calisthenics',equipment:'Bodyweight + band'}]]){const plan=build({...p,programId:undefined});assert.equal(plan.template,id);resolved(plan)}}finally{C.programCatalog.push(...saved)}
 const recipes=load('lib/recipes.json');assert.match(recipes.metadata_scope.unresolved_aliases,/no resolving registry/);assert.match(recipes.metadata_scope.youth_policy_runtime_difference,/not executed/);assert.equal(C.programCatalog.length,75);
});
console.log(checks+' workout-science regression groups passed');
