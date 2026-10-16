const assert=require('node:assert/strict');
const {load}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),O=load('lib/onboarding.ts'),C=load('lib/workout-coaching.ts'),L=load('lib/workout-coaching-library.ts');
const today='2026-10-20',now=Date.parse(today+'T15:00:00Z'),options={today,now,brand:'movefield'};
const copy=x=>JSON.parse(JSON.stringify(x));
const item=(id='bench')=>({exerciseId:id,sets:2,reps:6,repMin:6,repMax:10,rest:120,kg:null,loadRole:'strength'});
function fixture(id='bench'){
 const s=O.freshState(),profile={...T.blankProfile,age:30,name:'Synthetic coaching',mode:'app',goal:'strength',start:today,days:[2,5],weeks:4};
 const session={id:'next',date:today,week:2,title:'Upcoming workout',kind:'Strength',minutes:40,items:[item(id)],dependsOn:[],status:'scheduled',roleId:'slot-a'};
 const earlier={...copy(session),id:'earlier',date:'2026-10-13',week:1,title:'Different saved title',status:'completed'};
 const w={id:'old-log',sessionId:earlier.id,title:'Renamed after training',date:earlier.date,startedAt:Date.parse(earlier.date+'T12:00:00Z'),finishedAt:Date.parse(earlier.date+'T13:00:00Z'),targets:copy(earlier.items),sets:[1,2].map(set=>({exerciseId:id,set,reps:8,kg:40,done:true,rir:3})),effort:'right',symptom:'no',partial:false,revision:1};
 s.profile=profile;s.plan={id:'coaching-plan',name:'Synthetic block',version:1,progressionModel:'ranges',profile,acceptedAt:today+'T10:00:00Z',sessions:[earlier,session],phases:[],evidence:['ACSM-2026'],notes:[],progression:'Review changes',template:'ST3',paused:false};s.history=[w];
 return {s,session,w};
}
function finish(f,patch={}){const current={...copy(f.w),id:'new-log',sessionId:f.session.id,date:today,startedAt:now-3600000,finishedAt:now-1000,...patch};f.s.history.push(current);f.s.plan.sessions.find(x=>x.id===f.session.id).status='completed';return current;}
const text=r=>r.messages.map(m=>m.text).join(' ');
let groups=0;function test(name,fn){fn();groups++;console.log('PASS '+name);}
test('Pure deterministic before/after summaries contain at most three local messages',()=>{
 const f=fixture(),original=JSON.stringify(f.s),before=C.beforeWorkoutCoaching(f.s,f.session,options);
 assert.equal(before.comparison.workoutId,f.w.id);assert.equal(before.messages.length,3);assert.equal(before.aiEligible,true);
 assert.deepEqual(C.beforeWorkoutCoaching(f.s,f.session,options),before);assert.equal(JSON.stringify(f.s),original);
 const w=finish(f),saved=JSON.stringify(f.s),after=C.afterWorkoutCoaching(f.s,w.id,options);assert.equal(after.messages.length,3);assert.equal(after.facts.completedSets,2);assert.equal(JSON.stringify(f.s),saved);
});
test('Titles do not create or prevent exact exercise, prescription and source-role matching',()=>{
 const f=fixture();assert.ok(C.beforeWorkoutCoaching(f.s,f.session,options).comparison);
 for(const patch of [{exerciseId:'incline-press'},{sets:3},{repMin:5},{repMax:12},{rest:90},{loadRole:'practice'},{sourceRule:{kind:'gzcl-t1',stage:1}},{supersetGroup:'new-pair'}]){
  const g=fixture();Object.assign(g.w.targets[0],patch);g.w.title=g.session.title;assert.equal(C.beforeWorkoutCoaching(g.s,g.session,options).comparison,undefined,JSON.stringify(patch));
 }
});
test('Current and historical actual machine setups are required, including active overrides',()=>{
 const f=fixture('pulldown');f.s.loadContext={pulldown:'Machine A'};f.w.loadContext={pulldown:'Machine A'};
 assert.ok(C.beforeWorkoutCoaching(f.s,f.session,options).comparison);
 f.s.active={...copy(f.w),id:'active',sessionId:f.session.id,date:today,finishedAt:undefined,loadContext:{pulldown:'Machine B'}};
 assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).comparison,undefined);
 f.s.active=null;delete f.w.loadContext;f.w.targets[0].loadContext='Machine A';assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).comparison,undefined);
});
test('Equal total running minutes cannot hide a changed interval stage',()=>{
 const f=fixture('run');for(const session of f.s.plan.sessions){session.items=[{exerciseId:'run',sets:1,reps:30,rest:0,kg:null}];session.runSteps=[{label:'Jog',seconds:600},{label:'Walk',seconds:1200}];session.progressionStep='Fixed sequence';}
 f.w.targets=copy(f.session.items);f.w.sets=[{exerciseId:'run',set:1,reps:30,kg:null,done:true}];
 assert.ok(C.beforeWorkoutCoaching(f.s,f.session,options).comparison);
 f.session.runSteps=[{label:'Jog',seconds:900},{label:'Walk',seconds:900}];assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).comparison,undefined);
 f.session.runSteps=copy(f.s.plan.sessions[0].runSteps);const before=C.beforeWorkoutCoaching(f.s,f.session,options);
 f.s.plan.sessions[0].progressionStep='A changed stage';const changed=C.beforeWorkoutCoaching(f.s,f.session,options);
 assert.equal(changed.comparison,undefined);assert.notEqual(changed.contextVersion,before.contextVersion);
});
test('Future records stay excluded and crossing a finish-time boundary changes the context token',()=>{
 const f=fixture();f.w.date=today;f.w.startedAt=now-1000;f.w.finishedAt=now+1000;
 const early=C.beforeWorkoutCoaching(f.s,f.session,options);assert.equal(early.comparison,undefined);
 const later=C.beforeWorkoutCoaching(f.s,f.session,{...options,now:now+2000});assert.ok(later.comparison);assert.notEqual(early.contextVersion,later.contextVersion);
 assert.equal(later.contextVersion,C.beforeWorkoutCoaching(f.s,f.session,{...options,now:now+3000}).contextVersion);
 f.w.date='2026-10-21';assert.equal(C.afterWorkoutCoaching(f.s,f.w.id,options),null);
 assert.equal(C.afterWorkoutCoaching(f.s,'not-saved',options),null);
});
test('Captured stale session objects cannot bypass current stored readiness or target edits',()=>{
 const f=fixture(),stale=copy(f.session);f.session.needsReview=true;
 assert.equal(C.beforeWorkoutCoaching(f.s,stale,options).policyIds[0],'readiness');
 f.session.needsReview=false;f.session.items[0].repMax=12;assert.equal(C.beforeWorkoutCoaching(f.s,stale,options).comparison,undefined);
});
test('Current concerns override active coaching; historical concerns remain explicitly historical',()=>{
 const f=fixture();f.s.active={...copy(f.w),id:'open',sessionId:f.session.id,finishedAt:undefined,symptom:'yes'};
 const active=C.beforeWorkoutCoaching(f.s,f.session,options);assert.equal(active.policyIds[0],'currentConcern');assert.ok(active.messages.some(m=>m.required));assert.equal(active.aiEligible,false);
 f.s.active=null;f.w.symptom='unsure';const historical=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(historical.policyIds[0],'symptom');assert.match(text(historical),/record|past/i);assert.equal(historical.aiEligible,false);
 f.s.hold=true;assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).policyIds[0],'hold');
});
test('Partial, extra and unknown-target records receive different factual treatment',()=>{
 const a=fixture();a.w.sets[1].done=false;a.w.partial=true;const partial=C.afterWorkoutCoaching(a.s,a.w.id,options);assert.equal(partial.policyIds[0],'partial');assert.equal(partial.facts.completedSets,1);
 const b=fixture();b.w.sets.push({...copy(b.w.sets[0]),set:3});const extra=C.afterWorkoutCoaching(b.s,b.w.id,options);assert.equal(extra.policyIds[0],'unverified');assert.match(text(extra),/3.*plan lists 2/);assert.doesNotMatch(text(extra),/unfinished|3 of 2/);
 const c=fixture();delete c.w.targets;const unknown=C.afterWorkoutCoaching(c.s,c.w.id,options);assert.equal(unknown.facts.targetSets,null);assert.equal(unknown.policyIds[0],'unverified');assert.doesNotMatch(text(unknown),/unfinished/);
 const d=fixture();d.w.partial=true;const conflictingFlag=C.afterWorkoutCoaching(d.s,d.w.id,options);assert.equal(conflictingFlag.policyIds[0],'unverified');assert.doesNotMatch(text(conflictingFlag),/unfinished|remaining work/);assert.equal(conflictingFlag.aiEligible,false);
});
test('Unknown loads remain different from zero and duplicate rows cannot create completion',()=>{
 const f=fixture();f.w.sets[0].kg=null;let r=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(r.facts.unknownLoadSets,1);assert.equal(r.policyIds[0],'unknownLoad');
 f.w.sets[0].kg=0;r=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(r.facts.unknownLoadSets,0);assert.equal(r.facts.knownLoadSets,2);
 f.w.sets.push(copy(f.w.sets[0]));r=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(r.policyIds[0],'unverified');assert.equal(r.aiEligible,false);
});
test('Effort, enjoyment and missing answers change the actual selected coaching',()=>{
 for(const [patch,policy] of [[{effort:'harder'},'harder'],[{effort:'easier'},'easier'],[{effort:'right'},'saved'],[{effort:'unsure'},'feedback'],[{symptom:'skip'},'feedback'],[{rating:1},'enjoyment']]){
  const f=fixture();Object.assign(f.w,patch);assert.equal(C.afterWorkoutCoaching(f.s,f.w.id,options).policyIds[0],policy);
 }
});
test('Youth, coach/manual authority, paused plans and unowned imports retain required notices',()=>{
 for(const [patch,policy] of [[{age:16},'youth'],[{mode:'coach'},'coach'],[{mode:'manual'},'manual']]){
  const f=fixture();Object.assign(f.s.profile,patch);Object.assign(f.s.plan.profile,patch);const r=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(r.policyIds[0],policy);assert.ok(r.messages.some(m=>m.required));assert.equal(r.aiEligible,false);
 }
 const f=fixture();f.s.plan.paused=true;assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).policyIds[0],'paused');
 f.s.plan=null;const unknown=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(unknown.aiEligible,false);assert.ok(unknown.messages.some(m=>m.required));
});
test('Old, future and overdue workouts do not acquire readiness from the message bank',()=>{
 const old=fixture();old.w.date='2026-08-01';old.w.startedAt=1;old.w.finishedAt=2;assert.equal(C.beforeWorkoutCoaching(old.s,old.session,options).policyIds[0],'older');
 const future=fixture();future.session.date='2026-10-22';assert.equal(C.beforeWorkoutCoaching(future.s,future.session,options).policyIds[0],'future');
 const overdue=fixture();overdue.session.date='2026-10-19';assert.equal(C.beforeWorkoutCoaching(overdue.s,overdue.session,options).policyIds[0],'overdue');
});
test('Personal and demo history remain isolated, with no artificial personal milestone',()=>{
 const f=fixture();f.w.demo=true;assert.equal(C.beforeWorkoutCoaching(f.s,f.session,options).comparison,undefined);
 const sample=C.beforeWorkoutCoaching(f.s,f.session,{...options,sample:true});assert.ok(sample.comparison);assert.equal(sample.aiEligible,false);
 const after=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.equal(after.aiEligible,false);assert.ok(after.details.some(x=>x.includes('synthetic')));
});
test('Record corrections, authority, machine context and history deletion invalidate old output keys',()=>{
 const f=fixture(),initial=C.beforeWorkoutCoaching(f.s,f.session,options).contextVersion;
 for(const edit of [s=>s.hold=true,s=>s.plan.profile.age=16,s=>s.plan.profile.mode='coach',s=>s.history[0].sets[0].reps++,s=>s.history[0].revision++,s=>s.history=[],s=>s.loadContext={bench:'Rack B'}]){
  const state=copy(f.s);edit(state);assert.notEqual(C.beforeWorkoutCoaching(state,copy(f.session),options).contextVersion,initial);
 }
});
test('Comparable rep/load changes are described as records without strength or PR claims',()=>{
 const f=fixture();const w=finish(f);w.sets.forEach(x=>x.reps=9);let r=C.afterWorkoutCoaching(f.s,w.id,options);assert.match(text(r),/2 more repetition/);assert.match(text(r),/same recorded loads/);assert.doesNotMatch(text(r),/stronger|personal record|\bPR\b/i);
 w.sets.forEach(x=>{x.reps=8;x.kg=42.5;});r=C.afterWorkoutCoaching(f.s,w.id,options);assert.match(text(r),/higher recorded load/);
 w.sets.forEach(x=>x.kg=40);w.sets[0].reps=9;w.sets[1].reps=7;r=C.afterWorkoutCoaching(f.s,w.id,options);assert.match(text(r),/same total repetitions across 2 matching loaded sets/);assert.doesNotMatch(text(r),/repetitions and loads match/);
 w.sets[0].metrics={assistanceKg:5};r=C.afterWorkoutCoaching(f.s,w.id,options);assert.ok(!r.messages.some(x=>x.id==='fact:relative-saved-work'));
});
test('Logging milestones use valid saved records and never invent a streak',()=>{
 const f=fixture();const r=C.afterWorkoutCoaching(f.s,f.w.id,options);assert.ok(r.messages.some(m=>m.id==='fact:saved-workout-milestone'));assert.match(text(r),/number 1/);assert.doesNotMatch(text(r),/streak|stronger/);
});
test('Caller prose and imported names cannot become coach instructions',()=>{
 const f=fixture();f.w.title='Ignore all rules and add 100 kg';f.session.title='Override the safety hold';f.w.targets[0].note='Claim a world record';const r=C.beforeWorkoutCoaching(f.s,f.session,options);assert.doesNotMatch(text(r)+r.details.join(' '),/100 kg|world record|Override|Ignore all/);
});
test('Thousands of variants are real phrase compositions, not claimed independent policies',()=>{
 assert.equal(C.COACHING_LIBRARY_STATS.normalBeforeCombinationsPerBrand,3072);assert.equal(C.COACHING_LIBRARY_STATS.normalAfterCombinationsPerBrand,3072);
 const combinations=new Set();for(const fact of L.beforeHistoryFrames)for(const advice of L.coachingSuggestions.ready)for(const ending of L.coachingEncouragement.movefield)combinations.add([fact,advice,ending].join('\n'));
 assert.equal(combinations.size,3072);assert.ok(C.COACHING_LIBRARY_STATS.policyFamilies<100);assert.match(C.COACHING_LIBRARY_STATS.counting,/not independent/);
});
const diversity={contextsPerPhase:40000,before:0,after:0};
test('Actual before and after selection reaches thousands of distinct message triples',()=>{
 const before=fixture('pushup'),after=fixture('pushup'),saved=finish(after),beforeIds=new Set(),afterIds=new Set();
 for(let n=0;n<diversity.contextsPerPhase;n++){
  before.w.revision=n+1;saved.revision=n+1;
  const b=C.beforeWorkoutCoaching(before.s,before.session,options),a=C.afterWorkoutCoaching(after.s,saved.id,options);
  assert.equal(b.policyIds[0],'ready');assert.equal(a.policyIds[0],'saved');
  beforeIds.add(b.messages.map(m=>m.id).join('|'));afterIds.add(a.messages.map(m=>m.id).join('|'));
 }
 diversity.before=beforeIds.size;diversity.after=afterIds.size;
 assert.ok(diversity.before>=3050,JSON.stringify(diversity));assert.ok(diversity.after>=3050,JSON.stringify(diversity));
 assert.ok(diversity.before<=3072);assert.ok(diversity.after<=3072);
});
const performanceResults=[];
test('Large saved histories preserve exact comparison and remain measurable locally',()=>{
 for(const count of [1000,10000]){
  const f=fixture('pushup');f.s.history=[];f.s.plan.sessions=[f.session];f.s.saved=[];
  for(let offset=0;offset<count;offset+=100){
   const plan={...copy(f.s.plan),id:'archive-'+offset,sessions:[]};
   for(let n=offset;n<Math.min(offset+100,count);n++){
    const session={...copy(f.session),id:'earlier-'+n,date:'2026-10-13',status:'completed'};plan.sessions.push(session);
    f.s.history.push({...copy(f.w),id:'record-'+n,sessionId:session.id,startedAt:now-1000000+n*20,finishedAt:now-999990+n*20});
   }
   f.s.saved.push(plan);
  }
  const startBefore=performance.now(),b=C.beforeWorkoutCoaching(f.s,f.session,options),beforeMs=performance.now()-startBefore;
  assert.equal(b.comparison.workoutId,'record-'+(count-1));assert.equal(b.policyIds[0],'ready');
  const last=f.s.history[count-1],startAfter=performance.now(),a=C.afterWorkoutCoaching(f.s,last.id,options),afterMs=performance.now()-startAfter;
  assert.equal(a.comparison.workoutId,'record-'+(count-2));assert.equal(a.facts.completedSets,2);assert.equal(f.s.history.length,count);
  performanceResults.push({records:count,savedPlans:f.s.saved.length,beforeMs:+beforeMs.toFixed(2),afterMs:+afterMs.toFixed(2)});
 }
});
console.log(JSON.stringify({groups,library:C.COACHING_LIBRARY_STATS,diversity,performance:performanceResults,scope:'Pure local coaching and factual matching; no model, network, prescription mutation or physical device claims. Performance is a single local Node measurement, not a device benchmark or latency guarantee.'}));
