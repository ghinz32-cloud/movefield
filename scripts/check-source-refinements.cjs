/* Actual shared rules and history corrections on synthetic records. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {load, workoutFixture} = require('./domain-test-loader.cjs');
const T = load('lib/training.ts'), O = load('lib/onboarding.ts'), E = load('lib/equipment.ts');
const H = load('lib/history-edit.ts'), S = load('lib/saved-data.ts');
const SCI = load('lib/program-science.ts'), REF = load('lib/evidence-sources.ts');
const cases = [];
function test(name, fn) { fn(); cases.push(name); console.log('PASS ' + name); }
function state() {
 const profile = {...T.blankProfile, name:'Synthetic source refinement', age:30, units:'kg',
  experience:'Some experience', days:[0,1,2,3,4,5,6], weeks:4, minutes:120,
  start:T.day(), goal:'strength', programId:'src-gzclp-3', trainingDays:3,
  inventory:{...E.defaultInventory(), confirmed:true}};
 const r = T.buildPlan(profile); assert.ok(r.plan, r.errors.join(' '));
 return {...O.freshState(), schema:4, profile:r.plan.profile, plan:r.plan};
}
function target(s, id, kind) { return s.plan.sessions.flatMap(x=>x.items).find(i=>i.exerciseId===id && i.sourceRule.kind===kind); }
function recorded(s, i, reps, extra={}) {
 const kg= i.sourceRule.kind==='gzcl-t3' ? 20 : 100;
 const context = {[i.exerciseId]:'Synthetic identical machine setup'};
 const record = {id:'synthetic-refinement',sessionId:'synthetic-old-session',title:'Synthetic source work',
  date:T.addDays(T.day(),-1),startedAt:1,finishedAt:2,targets:[i],loadContext:context,
  sets:Array.from({length:i.sets},(_,n)=>({exerciseId:i.exerciseId,set:n+1,
   reps:Array.isArray(reps)?reps[n]:reps,kg,done:true,rir:2})),effort:'right',symptom:'no',...extra};
 return {...s,history:[record],loadContext:context,incrementKg:{[i.exerciseId]:i.sourceRule.kind==='gzcl-t3'?1.25:2.5}};
}
test('Creator T3 uses the final-set 25-rep threshold and the real equipment step',()=>{
 const s=state(),i=target(s,'pulldown','gzcl-t3');
 assert.equal(T.loadSuggestion(recorded(s,i,[15,15,24]),i).nextKg,undefined);
 assert.equal(T.loadSuggestion(recorded(s,i,[15,15,25]),i).nextKg,21.25);
 assert.equal(T.loadSuggestion(recorded(s,i,[14,15,25]),i).nextKg,undefined);
});
test('Creator AMRAP increases require final-set reserve and never borrow legacy RIR',()=>{
 const s=state(),i=target(s,'pulldown','gzcl-t3');
 for(const rir of [null,0]) {
  const r=recorded(s,i,[15,15,25],{rir:{pulldown:3}});r.history[0].sets[2].rir=rir;
  assert.equal(T.loadSuggestion(r,i).nextKg,undefined);
 }
 const r=recorded(s,i,[15,15,25]);r.history[0].sets[0].rir=null;
 assert.equal(T.loadSuggestion(r,i).nextKg,21.25);
});
test('T3 partial, concern, changed-machine and capacity records cannot increase',()=>{
 const s=state(),i=target(s,'pulldown','gzcl-t3');
 for(const extra of [{partial:true},{symptom:'yes'},{loadContext:{pulldown:'Different machine'}}])
  assert.equal(T.loadSuggestion(recorded(s,i,[15,15,25],extra),i).nextKg,undefined);
 const r=recorded(s,i,[15,15,25]);r.equipmentCaps=[{exerciseId:i.exerciseId,setup:r.loadContext[i.exerciseId],maxKg:20}];
 assert.equal(T.loadSuggestion(r,i).atCapacity,true);
});
test('Creator T1 evaluates base volume and respects its ten-rep AMRAP ceiling',()=>{
 const s=state(),i=target(s,'bar-squat','gzcl-t1');
 assert.equal(T.loadSuggestion(recorded(s,i,[3,3,3,2,4]),i).nextKg,102.5);
 assert.equal(T.loadSuggestion(recorded(s,i,[3,3,3,3,11]),i).nextKg,undefined);
 const r=recorded(s,i,[3,3,3,3,3]);r.history[0].sets[4].rir=null;
 assert.equal(T.loadSuggestion(r,i).nextKg,undefined);
});
test('Creator metric main-lift step is realizable without exceeding the advised range',()=>{
 const s=state();
 for(const [id,kind] of [['bar-squat','gzcl-t1'],['deadlift','gzcl-t1'],['bench','gzcl-t1']]) {
  const i=target(s,id,kind),r=recorded(s,i,i.repMin);
  assert.equal(T.loadSuggestion(r,i).nextKg,102.5);
 }
});
test('Reviewed T1 stage changes preserve source version, history and future timing',()=>{
 const s=state(),i=target(s,'bar-squat','gzcl-t1'),r=recorded(s,i,[3,3,3,3,2]);
 const before=JSON.stringify(r.history),q=T.makeLoadProposal(r).proposal;assert.ok(q);
 const out=T.applyProposal({...r,proposals:[q]},q.id);assert.equal(out.error,undefined);
 assert.equal(JSON.stringify(out.state.history),before);
 const future=out.state.plan.sessions.flatMap(x=>x.items).filter(x=>x.loadRole===i.loadRole&&x.exerciseId===i.exerciseId);
 assert.ok(future.every(x=>x.sets===6&&x.repMin===2&&x.loadRole.endsWith('/creator-2016-v2')));
 assert.ok(out.state.plan.sessions.every(x=>x.minutes<=120));
});
test('Old accepted community contexts keep their manual T3 rule and original disclosure',()=>{
 const s=state();for(const x of s.plan.sessions)for(const i of x.items)i.loadRole=i.loadRole.replace('/creator-2016-v2','');
 s.plan.notes=s.plan.notes.map(n=>n.startsWith('Version: ')?'Version: Community-maintained public base, checked 2026-10-12':n.startsWith('Creator/source: ')?'Creator/source: Cody Lefever; public r/gzcl base template. https://www.reddit.com/r/gzcl/wiki/gzclp/':n);
 const i=target(s,'pulldown','gzcl-t3');assert.equal(T.loadSuggestion(recorded(s,i,[15,15,25]),i).nextKg,undefined);
 const science=SCI.programScience(s.plan);assert.match(science.sourceVersion,/Community-maintained/);
 assert.equal(science.sourceUrl,'https://www.reddit.com/r/gzcl/wiki/gzclp/');
 const current=target(state(),'pulldown','gzcl-t3');assert.equal(T.loadSuggestion(recorded(s,i,[15,15,25]),current).kg,null);
});
test('Per-set RIR correction preserves identity, older feedback, active work and timer',()=>{
 const s=workoutFixture(),w={...s.active,id:'synthetic-saved-rir',sessionId:'synthetic-old-session',finishedAt:20,
  sets:s.active.sets.map(x=>({...x,done:true,rir:2})),rir:{[s.active.sets[0].exerciseId]:4}};
 s.history=[w];s.restTimer={endAt:9999999999999,label:'Synthetic active timer'};
 const edit=H.beginHistoryEdit(s,w.id);edit.draft.sets[0].rir=0;
 const out=H.applyHistoryEdit(s,edit);assert.equal(out.history[0].sets[0].rir,0);
 assert.deepEqual(out.active,s.active);assert.deepEqual(out.restTimer,s.restTimer);
 assert.deepEqual(out.history[0].rir,w.rir);assert.deepEqual(out.history[0].targets,w.targets);
 assert.equal(out.history[0].date,w.date);assert.equal(S.readSavedState(JSON.stringify(out)).history[0].sets[0].rir,0);
 edit.draft.sets[0].rir=11;assert.throws(()=>H.applyHistoryEdit(s,edit));
 const stale=H.beginHistoryEdit(s,w.id);assert.throws(()=>H.applyHistoryEdit(out,stale));
});
test('Creator sources and studies are separated in the shared science filter',()=>{
 assert.equal(REF.isProgramSource('src-gzclp-3'),true);assert.equal(REF.isProgramSource('EXERCISE-DATA'),true);
 for(const id of ['RIR-RESEARCH','RIR-TRIAL','RIR-PERCEPTION'])assert.equal(REF.isProgramSource(id),false);
 const science=SCI.programScience(state().plan);
 assert.ok(science.references.includes('RIR-TRIAL')&&science.references.includes('RIR-PERCEPTION'));
 assert.match(REF.evidenceReview('RIR-TRIAL'),/Same intervention/);
});
test('Web history control distinguishes zero from unknown and retains older exact ratings',()=>{
 const module={exports:{}};const code=ts.transpileModule(fs.readFileSync('components/history-set-rir.tsx','utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(n=>n==='@/lib/training'?T:require(n),module,module.exports);
 const C=module.exports.HistorySetRir;
 const html=renderToStaticMarkup(React.createElement(C,{name:'Synthetic squat',set:1,value:0,onChange:()=>{}}));
 assert.match(html,/<option value="0" selected="">0<\/option>/);
 assert.match(html,/aria-label="Edit Synthetic squat set 1 reps left"/);
 assert.match(renderToStaticMarkup(React.createElement(C,{name:'Synthetic squat',set:1,value:6,onChange:()=>{}})),/<option value="6" selected="">6<\/option>/);
 let actual;const element=C({name:'Synthetic squat',set:1,value:null,onChange:n=>actual=n});
 const select=element.props.children.find(x=>x.type==='select');
 select.props.onChange({target:{value:'0'}});assert.equal(actual,0);
 select.props.onChange({target:{value:''}});assert.equal(actual,null);
});
fs.writeFileSync('docs/science/source-refinements-validation-2026-10-12.json',JSON.stringify({checkedAt:new Date().toISOString(),
 scope:'Shared domain and actual rendered web control on synthetic records; no browser, installed-device or physiological acceptance.',cases},null,2)+'\n');
console.log('PASS '+cases.length+' source/effort refinements');
