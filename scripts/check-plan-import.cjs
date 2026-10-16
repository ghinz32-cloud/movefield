const assert=require('node:assert/strict'),{load,workoutFixture}=require('./domain-test-loader.cjs');
const {previewPlanImport,acceptPlanImport}=load('lib/plan-import.ts'),T=load('lib/training.ts');
const state=workoutFixture();state.active=null;state.history=[{id:'synthetic-retained',sessionId:'old',title:'Original title',date:'2026-01-01',startedAt:1,finishedAt:2,sets:[{exerciseId:'squat',set:1,reps:8,kg:null,done:true}]}];
const original=JSON.stringify(state.plan),options={credit:'Synthetic owner plan',start:state.plan.sessions[0].date,mode:'coach'};
const preview=previewPlanImport(state,original,options);assert.equal(preview.plan.profile.mode,'coach');assert.equal(preview.plan.profile.name,state.profile.name);assert.ok(preview.plan.sessions.every(s=>s.status==='scheduled'));assert.equal(preview.plan.evidence.length,0);assert.ok(preview.plan.notes.some(n=>n.includes(options.credit)));assert.notEqual(preview.plan.id,state.plan.id);assert.ok(preview.plan.sessions.every(s=>!state.plan.sessions.some(old=>old.id===s.id)));
const next=acceptPlanImport(state,preview);assert.strictEqual(next.history,state.history);assert.strictEqual(next.saved[0],state.plan);assert.equal(next.history[0].date,'2026-01-01');assert.ok(next.plan.acceptedAt);
assert.throws(()=>acceptPlanImport({...state,events:[{id:'new',name:'Synthetic time off',date:T.day(),kind:'Day off',priority:'Normal',minutes:60,provisional:false}]},preview),/changed/);
assert.throws(()=>previewPlanImport({...state,active:workoutFixture().active},original,options),/active workout/);
const altered=structuredClone(preview);altered.plan.sessions[0].items[0].sets++;assert.throws(()=>acceptPlanImport(state,altered),/changed/);
const imported=JSON.parse(original);imported.sessions[0].items[0].exerciseId='nonexistent';assert.throws(()=>previewPlanImport(state,JSON.stringify(imported),options),/unavailable/);
assert.throws(()=>previewPlanImport(state,original,{...options,credit:''}),/credit/);assert.throws(()=>previewPlanImport(state,'{"constructor":{}}',options));assert.throws(()=>previewPlanImport({...state,profile:{...state.profile,minutes:5}},original,options),/available/);
assert.throws(()=>acceptPlanImport({...state,profile:{...state.profile,minutes:5}},preview),/changed/);
const understated=JSON.parse(original);understated.sessions[0].minutes=1;understated.sessions[0].items[0].sets=100;assert.throws(()=>previewPlanImport(state,JSON.stringify(understated),options),/available/);
const zeroTarget=JSON.parse(original);zeroTarget.sessions[0].items[0].reps=0;assert.throws(()=>previewPlanImport(state,JSON.stringify(zeroTarget),options),/positive/);
for(const kind of load('lib/calendar.ts').commitmentKinds)for(const provisional of [false,true]){
 const event={id:'synthetic-fixed',name:'Synthetic commitment',date:preview.plan.sessions[0].date,kind,priority:'Normal',minutes:60,provisional};
 const conflicting={...state,events:[event]},before=JSON.stringify(conflicting);
 assert.throws(()=>previewPlanImport(conflicting,original,options),error=>error.message.includes('fixed commitments')&&error.message.includes(event.date),kind+' import must match start eligibility');
 assert.equal(JSON.stringify(conflicting),before,'Rejection must not move existing commitments or plans.');
 const outside={...state,events:[{...event,date:T.addDays(preview.plan.sessions.at(-1).date,30)}]};
 const allowed=previewPlanImport(outside,original,options),accepted=acceptPlanImport(outside,allowed);
 assert.deepEqual(accepted.events,outside.events);assert.strictEqual(accepted.history,state.history);
}
console.log('PASS full-schedule plan import: explicit tracking authority/credit, fresh identities, preserved history/archive, unperformed targets, stale/tampered previews, bounds, unknown exercise and time constraints');
console.log('PASS fixed-calendar import preflight: all six kinds, provisional and confirmed, reject conflicting dates and retain nonconflicting commitments');
