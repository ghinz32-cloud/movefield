const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+(n.endsWith('.json')?'':'.ts'))):require(n),mod,mod.exports);return mod.exports;}
const C=load('lib/program-catalog.ts'),T=load('lib/training.ts'),O=load('lib/onboarding.ts'),R=load('lib/workout-review.ts'),S=load('lib/saved-data.ts'),E=load('lib/tracking.ts');
let checks=0;function ok(v,m){assert.ok(v,m);checks++}function same(a,b,m){assert.deepEqual(a,b,m);checks++}
const refs=C.programReferences.filter(r=>r.workouts);
same(refs.length,8,'eight source variants are actually prefilled');same(C.programReferences.length,20,'twenty named-source entries');
for(const ref of C.programReferences){same(new URL(ref.url).protocol,'https:','source is HTTPS');ok(ref.author&&ref.checked&&ref.description,'authorship and source check recorded');}
for(const ref of refs){
 for(const w of ref.workouts){same(new Set(w.items.map(i=>i[0])).size,w.items.length,'source workout has no duplicate movement IDs');for(const [id,sets,min,max,rest] of w.items){ok(T.exercises.some(e=>e.id===id),`known guide: ${id}`);ok(Number.isInteger(sets)&&sets>0&&sets<=20&&min>0&&min<=max&&rest>=0,'bounded source prescription');}}
 for(let weekday=0;weekday<7;weekday++){
  const p={...T.blankProfile,name:'Synthetic source test',age:30,goal:ref.goal,mode:'manual',experience:'Experienced',start:T.addDays('2026-11-01',weekday),days:[0,1,2,3,4,5,6],weeks:4,minutes:120,equipment:ref.equipment==='dumbbells'?'Dumbbells':'Full gym',programId:ref.id};
  const result=T.buildPlan(p);ok(result.plan,`${ref.id}, start ${weekday}: ${result.errors}`);const plan=result.plan;
  same(plan.sessions.length,ref.days*p.weeks,'weekly frequency is preserved');same(plan.profile.days.length,ref.days,'extra availability never adds source sessions');same(plan.profile.start,p.start,'chosen start retained');same(plan.profile.mode,'manual','manual authority');same(plan.template,'TRACK','no app progression');
  for(let i=0;i<plan.sessions.length;i++){const ss=plan.sessions[i],w=ref.workouts[i%ref.workouts.length];same(ss.items.map(x=>[x.exerciseId,x.sets,x.repMin,x.repMax,x.rest]),w.items.map(x=>x.slice(0,5)),'source order and cycle continue across weeks');ok(ss.items.every(x=>x.kg===null),'no starting loads invented');ok(ss.minutes<=p.minutes,'duration fits');if(i&&ref.nonconsecutive)ok(T.dayDistance(plan.sessions[i-1].date,ss.date)>=2,'source rest day preserved');}
  const ss=plan.sessions[0],w={id:'synthetic',title:ss.title,sessionId:ss.id,date:ss.date,startedAt:1,finishedAt:2,targets:ss.items,effort:'right',symptom:'no',sets:ss.items.flatMap(i=>Array.from({length:i.sets},(_,n)=>({exerciseId:i.exerciseId,set:n+1,reps:i.reps,kg:10,done:true})))};
  const state={...O.freshState(),profile:plan.profile,plan,history:[w]};same(R.reviewWorkout(state,w.id).aiEligible,false,'completed manual source never invokes coaching AI');
  same(S.readSavedState(JSON.stringify(state)).plan.sessions,JSON.parse(JSON.stringify(plan.sessions)),'source plan survives actual saved-state schema');
 }
 const p={...T.blankProfile,name:'Synthetic',age:30,goal:ref.goal,mode:'manual',experience:'Experienced',start:'2026-11-01',days:[0,1,2,3,4,5,6],weeks:2,minutes:120,equipment:ref.equipment==='dumbbells'?'Dumbbells':'Full gym',programId:ref.id};
 same(T.buildPlan({...p,age:16}).plan,null,'adult named templates reject youth');same(T.buildPlan({...p,mode:'app'}).plan,null,'explicit manual choice required');same(T.buildPlan({...p,minutes:15}).plan,null,'time budget is enforced');same(T.buildPlan({...p,equipment:'No equipment'}).plan,null,'no silent equipment substitution');same(T.buildPlan({...p,days:[1]}).plan,null,'missing days rejected');if(ref.noFloor)ok(T.buildPlan({...p,noFloor:true}).plan,'verified no-floor source uses no ground transfers');else same(T.buildPlan({...p,noFloor:true}).plan,null,'unverified no-floor adaptation rejected');
 const original=T.buildPlan(p).plan;
 const state={...O.freshState(),profile:original.profile,plan:original},ss=original.sessions[0];
 const edit={planId:original.id,version:original.version,sessionId:ss.id,items:ss.items,allowLonger:false,repeatWeekday:true};
 const preview=E.previewTrackingEdit(state,edit);same(preview.errors,[],'valid source-target edit');
 same(preview.sessions.map(x=>x.roleId),Array(preview.sessions.length).fill(ss.roleId),'edits follow the workout role across weeks, never overwrite another A/B day');
 const applied=E.applyTrackingEdit(state,edit);same(applied.error,undefined,'source edit accepted');
 same(JSON.parse(JSON.stringify(applied.state.plan.sessions[0].items)),JSON.parse(JSON.stringify(ss.items)),'unchanged edit keeps range, notes and source load role');
 same(applied.state.plan.sessions.filter(x=>x.roleId!==ss.roleId),original.sessions.filter(x=>x.roleId!==ss.roleId),'other source workout roles remain intact');
 const badItems=ss.items.map((x,i)=>i?x:{...x,repMin:10,repMax:5});ok(E.previewTrackingEdit(state,{...edit,items:badItems}).errors.length,'invalid rep range rejected');
 if(ref.experience!=='Beginner')same(T.buildPlan({...p,experience:'First time'}).plan,null,'source requiring movement experience rejected for first time');
 const event={id:'blocked',name:'Commitment',date:original.sessions[1].date,kind:'Day off',priority:'Normal',minutes:0,provisional:false};const moved=T.buildPlan(p,[event]);ok(moved.plan,'commitment may extend calendar');ok(moved.plan.sessions.every(x=>x.date!==event.date),'commitment protected');same(moved.plan.sessions.map(x=>x.items),original.sessions.map(x=>x.items),'calendar pause preserves source targets/cycle');
 for(const goal of ref.goals||[])ok(O.referenceOption({...p,goal},[],ref.id).plan,'related goal can select source');
 const accepted=O.acceptSetup(O.freshState(),p,original,[]);same(accepted.error,undefined,'source accepts through real onboarding boundary');
}
const src=C.programReferences.find(r=>r.id==='ref-stronglifts');same(src.workouts.map(w=>w.items.map(i=>i[1])),[[5,5,5],[5,5,1]],'published StrongLifts base set counts');
const gz=C.programReferences.find(r=>r.id==='ref-gzclp');same(gz.workouts.map(w=>w.items[0][0]),['bar-squat','lib-bar-overhead-press','bench','deadlift'],'GZCLP four-workout order');
const base=C.programReferences.find(r=>r.id==='ref-fitness-basic');same(base.workouts[1].items[0][0],'pulldown','Basic Beginner B selects its disclosed source-allowed chin-up alternative');
console.log(`PASS ${checks} named-template, cross-week cycle, seven-start-day, duration/equipment/age, saved-state, event and manual-authority assertions.`);
