const assert=require('node:assert/strict');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const {applySubstitution,substitutionOptions,previewSubstitution}=load('lib/substitutions.ts');
const {readSavedState}=load('lib/saved-data.ts');
const T=load('lib/training.ts'),E=load('lib/equipment.ts'),O=load('lib/onboarding.ts'),B=load('lib/reusable-plan.ts');

function fixture(){
 const state=workoutFixture();
 state.active.sets=state.active.sets.map(set=>({...set,reps:0}));
 const session=state.plan.sessions[0];
 const item=session.items.find(item=>substitutionOptions(item.exerciseId,state.profile).some(next=>!session.items.some(existing=>existing.exerciseId===next.id)));
 assert.ok(item,'The fixture needs an available substitute outside this session.');
 const replacement=substitutionOptions(item.exerciseId,state.profile).find(next=>!session.items.some(existing=>existing.exerciseId===next.id));
 const request={sessionId:session.id,from:item.exerciseId,to:replacement.id,all:false,setup:'Synthetic exact setup',allowLonger:true,acknowledgeSpecificity:true,planId:state.plan.id,version:state.plan.version,historyCount:state.history.length};
 return {state,request};
}

for(const note of ['Keep my original exercise setup note',' ']){
 const {state,request}=fixture();
 state.active.details={[request.from]:{notes:note}};
 const reopened=readSavedState(JSON.stringify(state)),before=JSON.stringify(reopened);
 const result=applySubstitution(reopened,request);
 assert.match(result.error,/already has entered.*notes/);
 assert.strictEqual(result.state,reopened);
 assert.equal(JSON.stringify(reopened),before,'Rejected substitution must preserve all saved data.');
}
for(const details of [undefined,{}, {notes:''}]){
 const {state,request}=fixture();
 if(details!==undefined)state.active.details={[request.from]:details};
 const result=applySubstitution(state,request);
 assert.equal(result.error,undefined,'Empty legacy details must not prevent an untouched substitute.');
 assert.ok(result.state.active.targets.some(item=>item.exerciseId===request.to));
 assert.deepEqual(result.state.history,state.history);
 assert.deepEqual(result.state.plan.sessions.map(session=>session.date),state.plan.sessions.map(session=>session.date));
}
for(const kind of ['set note','load','effort','setup']){
 const {state,request}=fixture(),set=state.active.sets.find(set=>set.exerciseId===request.from);
 if(kind==='set note')set.metrics={notes:'Retain this set note'};
 if(kind==='load')set.kg=0;
 if(kind==='effort')state.active.rir={[request.from]:0};
 if(kind==='setup')state.active.loadContext={[request.from]:'Retain this setup'};
 assert.match(applySubstitution(state,request).error,/already has entered/,kind);
}
console.log('PASS substitution integrity: restored legacy exercise notes, untouched/empty details, existing set notes, explicit zero load/effort, setup, history and dates');

function sourceFixture(to='lib-db-flat-bench-press'){
 const profile={...T.blankProfile,name:'Synthetic source substitution',age:30,units:'kg',experience:'Some experience',days:[0,1,2,3,4,5,6],weeks:4,minutes:120,start:T.day(),goal:'strength',programId:'src-sl5x5-3',trainingDays:3,inventory:{...E.defaultInventory(),confirmed:true}};
 const built=T.buildPlan(profile);assert.ok(built.plan,built.errors.join(' '));
 const state={...O.freshState(),schema:4,profile,plan:built.plan};
 const request={sessionId:state.plan.sessions[0].id,from:'bench',to,all:true,setup:to==='lib-stack-chest-press'?'Synthetic machine A':'',allowLonger:true,acknowledgeSpecificity:true,planId:state.plan.id,version:state.plan.version,historyCount:0};
 return {state,request};
}
function logged(item,kg=20){return {id:'synthetic-source-history',sessionId:'synthetic-prior-session',title:'Synthetic recorded movement',date:T.addDays(T.day(),-1),startedAt:1,finishedAt:2,targets:[item],sets:Array.from({length:item.sets},(_,n)=>({exerciseId:item.exerciseId,set:n+1,reps:item.repMax,kg,done:true,rir:2})),effort:'right',symptom:'no'};}
{
 const {state,request}=sourceFixture(),original=JSON.stringify(state);
 assert.ok(previewSubstitution(state,request).warnings.some(w=>w.includes('automatic source increases')));
 const result=applySubstitution(state,request);assert.equal(result.error,undefined);assert.equal(JSON.stringify(state),original);
 const changed=result.state,item=changed.plan.sessions[0].items.find(i=>i.exerciseId===request.to);
 assert.equal(item.sourceRule,undefined);assert.equal(item.loadRole,undefined);assert.equal(item.kg,null);
 for(let n=0;n<state.plan.sessions.length;n++)for(const old of state.plan.sessions[n].items.filter(i=>i.exerciseId!=='bench'))assert.deepEqual(changed.plan.sessions[n].items.find(i=>i.exerciseId===old.exerciseId),old,'Untouched source targets retain their exact rules.');
 const withHistory={...changed,history:[logged(item)],incrementKg:{[item.exerciseId]:2.5}};
 assert.equal(T.loadSuggestion(withHistory,item).nextKg,undefined,'Substitute must not inherit a source-specific increment.');
 assert.equal(T.loadSuggestion(withHistory,item).kg,null,'Unreviewed weight stays unknown.');
 for(const kg of [0,20])assert.equal(T.loadSuggestion(withHistory,{...item,kg}).kg,kg,'Explicit owner-reviewed weight stays visible, including zero.');
 assert.equal(T.loadSuggestion({...withHistory,hold:{reason:'Synthetic hold'}},{...item,kg:20}).kg,null);
 assert.equal(T.loadSuggestion({...withHistory,plan:{...withHistory.plan,paused:true}},{...item,kg:20}).kg,null);
 assert.equal(T.loadSuggestion({...withHistory,equipmentCaps:[{exerciseId:item.exerciseId,setup:'',maxKg:10}]},{...item,kg:20}).kg,null);
 const unavailable={...withHistory,profile:{...withHistory.profile,inventory:{...withHistory.profile.inventory,dumbbells:'none'}}};
 assert.equal(T.loadSuggestion(unavailable,{...item,kg:20}).kg,null);
 const restored=readSavedState(JSON.stringify(withHistory));assert.deepEqual(restored.history,JSON.parse(JSON.stringify(withHistory.history)));
 assert.equal(restored.plan.sessions[0].items.find(i=>i.exerciseId===item.exerciseId).sourceRule,undefined);
 assert.match(applySubstitution(restored,request).error,/changed/,'An old preview cannot overwrite the revised plan.');
 const saved=B.savePlanCopy(restored,restored.plan.id,restored.plan.version),preview=B.previewReusablePlan(saved,saved.saved[0].id,T.addDays(T.day(),28));
 const first=preview.plan.sessions.find(session=>session.items.some(i=>i.exerciseId===item.exerciseId));
 const reviewed=B.reviewReusableLoads(saved,preview,[{sessionId:first.id,exerciseId:item.exerciseId,kg:17.5}]);
 const next=B.acceptReusablePlan(saved,reviewed),nextItem=next.plan.sessions.find(session=>session.id===first.id).items.find(i=>i.exerciseId===item.exerciseId);
 assert.equal(nextItem.sourceRule,undefined);assert.equal(nextItem.loadRole,undefined);assert.equal(T.loadSuggestion(next,nextItem).kg,17.5);assert.equal(T.loadSuggestion(next,nextItem).nextKg,undefined);assert.deepEqual(next.history,restored.history);
 const originalLift=state.plan.sessions[0].items.find(i=>i.exerciseId==='bar-squat'),originalHistory=logged(originalLift,100);
 assert.equal(T.loadSuggestion({...state,history:[originalHistory],incrementKg:{'bar-squat':2.5}},originalLift).nextKg,102.5,'Untouched published progression remains intact.');
 const oldSourceBench=state.plan.sessions[0].items.find(i=>i.exerciseId==='bench'),legacyItem={...oldSourceBench,exerciseId:request.to};
 const legacyState={...state,history:[logged(legacyItem)],incrementKg:{[legacyItem.exerciseId]:2.5}},legacyBefore=JSON.stringify(legacyState);
 assert.equal(T.loadSuggestion(legacyState,legacyItem).nextKg,undefined,'Already-saved pre-fix substitutions cannot inherit an unqualified source rule.');
 assert.equal(T.loadSuggestion(legacyState,{...legacyItem,kg:20}).kg,20);
 assert.equal(JSON.stringify(legacyState),legacyBefore,'Qualifying an old rule must never rewrite original targets or history.');
}
{
 const {state,request}=sourceFixture('lib-stack-chest-press'),result=applySubstitution(state,request);assert.equal(result.error,undefined);
 const item=result.state.plan.sessions[0].items.find(i=>i.exerciseId===request.to),reviewed={...item,kg:20,loadContext:request.setup};
 assert.equal(T.loadSuggestion(result.state,reviewed).kg,20);
 assert.equal(T.loadSuggestion(result.state,{...reviewed,loadContext:'Other machine'}).kg,null);
 assert.equal(T.loadSuggestion({...result.state,loadContext:{}},reviewed).kg,null);
}
console.log('PASS source substitutions: owner-directed replacement progression, reviewed/unknown/zero weights, holds, equipment/setup guards, stale requests, saved-history round trip, reused blocks and untouched published rules');
