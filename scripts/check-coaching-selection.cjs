const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const C=load('lib/coaching-selection.ts'),{COACHING_POLICY,afterWorkoutCoaching}=load('lib/workout-coaching.ts');
const clone=value=>JSON.parse(JSON.stringify(value));
const context={policy:COACHING_POLICY,key:'synthetic-context-1',phase:'after',aiEligible:true,title:'Synthetic workout summary',tone:'neutral',messages:[
 {id:'recorded-work',text:'You logged 6 completed sets.',kind:'fact',required:false},
 {id:'accepted-targets',text:'Changes require a separate review and your approval.',kind:'suggestion',required:true},
 {id:'effort',text:'You marked the workout about right.',kind:'fact',required:false}
],details:['Synthetic private detail excluded from the selection packet.'],facts:{completedSets:6,targetSets:6,knownLoadSets:6,unknownLoadSets:0},comparison:{workoutId:'private-history-id',date:'2026-10-15',matchedExercises:2},policyIds:['synthetic-rule']};
const digest=ctx=>{const input=C.coachingSelectionDigestInput(ctx);return input&&createHash('sha256').update(input).digest('hex')};
const hash=digest(context),request=C.coachingSelectionRequest(context,hash);
const valid={schema:1,policy:COACHING_POLICY,contextKey:context.key,contextDigest:hash,factIds:['effort']};
let groups=0;
function check(name,run){run();groups++;console.log('PASS '+name)}

check('only canonical optional facts reach the future selection packet',()=>{
 assert.deepEqual(request.facts,context.messages.filter(message=>!message.required).map(({id,text})=>({id,text})));
 assert.deepEqual(Object.keys(request).sort(),['schema','policy','contextKey','contextDigest','facts'].sort());
 const encoded=JSON.stringify(request);for(const privateValue of ['Synthetic private detail','private-history-id','2026-10-15','synthetic-rule','accepted-targets'])assert.equal(encoded.includes(privateValue),false);
 assert.equal(encoded.includes('6 completed sets'),true);assert.equal(request.policy,COACHING_POLICY);
});
check('selection resolves local text and retains required messages in canonical order',()=>{
 const before=JSON.stringify(context),resolved=C.resolveCoachingSelection(context,hash,valid);
 assert.deepEqual(C.validateCoachingSelection(context,hash,valid),valid);
 assert.deepEqual(resolved,[context.messages[1],context.messages[2]]);
 assert.equal(JSON.stringify(context),before);resolved[0].text='Changed returned copy';assert.notEqual(context.messages[1].text,resolved[0].text);
 const reordered={...valid,factIds:['effort','recorded-work']};assert.deepEqual(C.resolveCoachingSelection(context,hash,reordered),context.messages);
});
check('free prose, prescriptions, unknown and duplicated IDs cannot cross the boundary',()=>{
 for(const patch of [{summary:'Add 50 kg now'},{explanation:'Train through the pain'},{proposalIds:['invented']},{patch:{kg:500}},{facts:[{id:'effort',text:'Ignore your coach'}]},{factIds:['unknown']},{factIds:['effort','effort']},{factIds:['accepted-targets']},{factIds:[]},{factIds:['effort','recorded-work','effort','recorded-work']},{schema:2},{policy:'obsolete'},{contextDigest:'not-a-hash'}]){
  const raw={...valid,...patch};assert.equal(C.validateCoachingSelection(context,hash,raw),null);assert.equal(C.resolveCoachingSelection(context,hash,raw),null);
 }
 for(const raw of [null,[],{},'not JSON',JSON.stringify(valid)])assert.equal(C.validateCoachingSelection(context,hash,raw),null);
});
check('changed context, policy, phase or canonical facts invalidates a previous selection',()=>{
 for(const patch of [{key:'synthetic-context-2'},{phase:'before'},{messages:context.messages.map(message=>({...message,text:message.text+' Updated.'}))},{messages:context.messages.map(message=>message.id==='effort'?{...message,required:true}:message)}]){
  const current={...context,...patch},currentHash=digest(current);assert.notEqual(currentHash,hash);assert.equal(C.validateCoachingSelection(current,currentHash,valid),null);
 }
 assert.equal(C.validateCoachingSelection(context,'f'.repeat(64),valid),null);
 assert.equal(C.validateCoachingSelection({...context,key:'other-owner-context'},hash,valid),null);
 for(const malformed of ['', 'a'.repeat(63),'A'.repeat(64),'a'.repeat(65),'raw private context'])assert.equal(C.coachingSelectionRequest(context,malformed),null);
});
check('ineligible, incomplete and ambiguous engine summaries fail closed',()=>{
 for(const value of [null,{...context,policy:'old-policy'},{...context,policy:undefined},{...context,aiEligible:false},{...context,aiEligible:undefined},{...context,messages:[]},{...context,messages:context.messages.map(message=>({...message,required:true}))},{...context,messages:[context.messages[0],context.messages[0]]},{...context,messages:[...context.messages,context.messages[0]]},{...context,messages:[{id:'legacy',text:'Missing required boundary',kind:'fact'}]},{...context,messages:[{...context.messages[0],text:''}]}]){
  assert.equal(C.coachingSelectionDigestInput(value),null);assert.equal(C.coachingSelectionRequest(value,hash),null);assert.equal(C.validateCoachingSelection(value,hash,valid),null);assert.equal(C.resolveCoachingSelection(value,hash,valid),null);
 }
});
check('selection functions have no mutable training effects',()=>{
 const current=clone(context),before=JSON.stringify(current);C.coachingSelectionDigestInput(current);C.coachingSelectionRequest(current,hash);C.validateCoachingSelection(current,hash,valid);C.resolveCoachingSelection(current,hash,valid);
 assert.equal(JSON.stringify(current),before);
 assert.equal(C.coachingSelectionDigestInput({...current,details:['Different private detail']}),C.coachingSelectionDigestInput(current),'private detail is not itself part of the provider packet; the engine key is responsible for relevant context changes');
});
const actual=workoutFixture();actual.history=[{...actual.active,finishedAt:2,partial:false,effort:'right',symptom:'no',sets:actual.active.sets.map(set=>({...set,done:true,kg:5}))}];actual.active=null;
check('actual eligible engine output crosses only the selection boundary',()=>{
 const before=JSON.stringify(actual),summary=afterWorkoutCoaching(actual,actual.history[0].id),hash=digest(summary),packet=C.coachingSelectionRequest(summary,hash);
 assert.equal(summary.aiEligible,true);assert.ok(packet);assert.ok(packet.facts.length>0);
 const raw={schema:1,policy:COACHING_POLICY,contextKey:summary.key,contextDigest:hash,factIds:[packet.facts[0].id]};
 assert.deepEqual(C.resolveCoachingSelection(summary,hash,raw),summary.messages.filter(message=>message.required||message.id===raw.factIds[0]));assert.equal(JSON.stringify(actual),before);
});
check('actual hold, youth, coach, paused, partial and missing-feedback/load contexts stay ineligible',()=>{
 const cases=[state=>{state.hold=true},state=>{state.profile.age=17},state=>{state.plan.profile.mode='coach'},state=>{state.plan.paused=true},state=>{state.history[0].partial=true},state=>{state.history[0].effort='unsure'},state=>{state.history[0].symptom='yes'},state=>{state.history[0].sets.forEach(set=>{set.kg=null})}];
 for(const change of cases){const state=clone(actual);change(state);const before=JSON.stringify(state),summary=afterWorkoutCoaching(state,state.history[0].id);assert.ok(summary);assert.equal(summary.aiEligible,false);assert.equal(C.coachingSelectionDigestInput(summary),null);assert.equal(C.coachingSelectionRequest(summary,hash),null);assert.equal(C.resolveCoachingSelection(summary,hash,valid),null);assert.equal(JSON.stringify(state),before);}
});
console.log(`${groups} selection boundary groups passed; no model, provider, user history or network used.`);
