const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map(),results=[];
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const module={exports:{}};cache.set(name,module);
 const filename=path.join(root,'lib',name+'.ts'),source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',source)(id=>id.startsWith('./')?id.endsWith('.json')?JSON.parse(fs.readFileSync(path.join(root,'lib',id),'utf8')):load(id.slice(2)):require(id),module,module.exports);
 return module.exports;
}
const T=load('training'),L=load('workout-log'),C=load('customize'),E=load('tracking'),F=load('training-focus'),S=load('saved-data'),Sub=load('substitutions');
function test(name,fn){fn();results.push(name);console.log('PASS '+name)}
function state(){
 const profile={...T.blankProfile,age:28,mode:'coach',days:[1,4],start:T.addDays(T.day(),7),minutes:120,weeks:2};
 const plan=T.buildPlan(profile).plan;
 plan.sessions[0].items=[{exerciseId:'row',sets:2,reps:8,repMin:8,repMax:12,rest:90,kg:null},{exerciseId:'plank',sets:1,reps:30,rest:60,kg:null}];
 return {...T.initialState(),profile,plan};
}
function active(){const s=state(),session=s.plan.sessions[0];return {...s,active:{id:'workout-one',sessionId:session.id,title:session.title,date:session.date,startedAt:1,targets:session.items,sets:L.startingSets(s,session.items)}}}
function edit(s,items=s.plan.sessions[0].items){return {planId:s.plan.id,version:s.plan.version,sessionId:s.plan.sessions[0].id,items,allowLonger:true}}
test('Tracking ranges survive save/readback for coach and manual plans',()=>{
 for(const mode of ['coach','manual']){const s=state();s.plan.profile.mode=mode;const result=E.applyTrackingEdit(s,edit(s));assert.equal(result.error,undefined);assert.equal(result.state.plan.sessions[0].items[0].repMin,8);assert.equal(result.state.plan.sessions[0].items[0].repMax,12);assert.equal(S.readSavedState(JSON.stringify(result.state)).plan.sessions[0].items[0].repMax,12)}
});
test('One owner defines limits for each matching web/native workflow',()=>{
 assert.equal(C.userTargetError({sets:8,reps:300,rest:600},'reps','app'),null);
 assert.equal(C.userTargetError({sets:20,reps:999,rest:3600},'reps','tracking'),null);
 for(const scope of ['app','tracking']){const limits=C.USER_TARGET_LIMITS[scope],base={sets:1,reps:8,repMin:8,repMax:12,rest:90};for(const patch of [{sets:0},{sets:limits.sets+1},{reps:1.5,repMin:1.5},{repMax:limits.target+1},{repMin:13},{repMax:undefined},{rest:limits.rest+1},{rest:NaN}])assert.ok(C.userTargetError({...base,...patch},'reps',scope))}
 const s=state();assert.ok(E.applyTrackingEdit(s,edit(s,[{exerciseId:'plank',sets:1,reps:30,repMin:20,repMax:40,rest:60,kg:null}])).error);
});
test('A retained set reference edits the same set after reordering',()=>{
 const s=active(),original=s.active.sets[0],reference=L.workoutSetReference(s.active,original);
 const reordered={...s,active:{...s.active,sets:[s.active.sets[2],s.active.sets[1],s.active.sets[0]]}};
 const changed=L.changeWorkoutSet(reordered,reference,{reps:11,kg:20});
 assert.equal(changed.active.sets[0].reps,0);assert.equal(changed.active.sets[2].reps,11);assert.equal(changed.active.sets[2].exerciseId,original.exerciseId);
 const logged=L.logWorkoutSet(changed,reference,90,1000);assert.equal(logged.active.sets[2].done,true);assert.equal(logged.restTimer.setKey,'row:1');assert.equal(L.logWorkoutSet(logged,reference,90,3000),logged);
});
test('Removed or replacement-workout set references reject without touching another set',()=>{
 const s=active(),reference=L.workoutSetReference(s.active,s.active.sets[0]);
 for(const current of [{...s,active:{...s.active,id:'workout-two'}},{...s,active:{...s.active,sets:s.active.sets.slice(1)}},{...s,active:null}]){const before=JSON.stringify(current);assert.throws(()=>L.changeWorkoutSet(current,reference,{reps:10}));assert.throws(()=>L.logWorkoutSet(current,reference,90));assert.equal(JSON.stringify(current),before)}
 for(const patch of [{exerciseId:'plank'},{set:2}])assert.throws(()=>L.changeWorkoutSet(s,reference,patch),/identity/);
});
function focusState(){const profile={...T.blankProfile,start:T.addDays(T.day(),7),goal:'powerbuilding',programId:'PB4',minutes:120,weeks:2,days:[0,1,2,3,4,5,6],experience:'Experienced',establishedTraining:true,focuses:['supersets']};const plan=T.buildPlan(profile).plan;assert.ok(plan);return {...T.initialState(),profile,plan}}
test('Structured superset metadata survives save and replacement even when notes change',()=>{
 const s=focusState(),session=s.plan.sessions.find(x=>x.items.some(i=>i.exerciseId==='triceps'&&i.supersetGroup));const old=session.items.find(x=>x.exerciseId==='triceps');old.note='My equipment is available.';
 const to=Sub.substitutionOptions(old.exerciseId)[0]?.id;
 assert.ok(to);{const request={sessionId:session.id,from:old.exerciseId,to,all:false,setup:'Gym A',allowLonger:true,acknowledgeSpecificity:true,planId:s.plan.id,version:s.plan.version,historyCount:0};const result=Sub.applySubstitution(s,request);assert.equal(result.error,undefined);const changed=result.state.plan.sessions.find(x=>x.id===session.id).items.find(x=>x.exerciseId===to);assert.equal(changed.supersetGroup,old.supersetGroup);assert.equal(changed.supersetPosition,2);assert.equal(changed.rest,old.rest);assert.equal(changed.sets,old.sets);assert.equal(S.readSavedState(JSON.stringify(result.state)).plan.sessions.find(x=>x.id===session.id).items.find(x=>x.exerciseId===to).supersetPosition,2)}
 const saved=S.readSavedState(JSON.stringify(s));assert.equal(saved.plan.sessions.find(x=>x.id===session.id).items.find(x=>x.exerciseId===old.exerciseId).supersetPosition,2);
});
test('Imported note wording cannot create pairing or change replacement dose',()=>{
 const s=state();s.plan.profile.mode='app';const session=s.plan.sessions[0],old=session.items[0];old.exerciseId='curl';old.sets=6;old.rest=0;old.note='A1. [Focus] Assistance superset A: do one A1 set, then one A2 set; rest 900 seconds after A2 before repeating.';
 const request={sessionId:session.id,from:'curl',to:'lib-db-hammer-curl',all:false,setup:'',allowLonger:true,acknowledgeSpecificity:true,planId:s.plan.id,version:s.plan.version,historyCount:0};
 const result=Sub.applySubstitution(s,request);assert.equal(result.error,undefined);const changed=result.state.plan.sessions[0].items[0];assert.equal(changed.sets,3);assert.equal(changed.rest,90);assert.equal(changed.supersetGroup,undefined);
 const saved=S.readSavedState(JSON.stringify(s));assert.equal(saved.plan.sessions[0].items[0].note,old.note);assert.equal(saved.plan.sessions[0].items[0].supersetGroup,undefined);
});
test('Malformed structured pairs are rejected; legacy records retain existing targets',()=>{
 const original=focusState();for(const modify of [items=>delete items.find(i=>i.supersetPosition===2).supersetPosition,items=>items.find(i=>i.supersetPosition===2).sets++,items=>items.find(i=>i.supersetPosition===1).rest=60,items=>items.find(i=>i.supersetPosition===2).supersetPosition=1]){const s=structuredClone(original);modify(s.plan.sessions.find(x=>x.items.some(i=>i.supersetGroup)).items);assert.throws(()=>S.readSavedState(JSON.stringify(s)))}
 const legacy=structuredClone(original);for(const session of legacy.plan.sessions)for(const item of session.items){delete item.supersetGroup;delete item.supersetPosition}const saved=S.readSavedState(JSON.stringify(legacy));assert.deepEqual(saved.plan.sessions,JSON.parse(JSON.stringify(legacy.plan.sessions)));assert.equal(F.supersetFieldsError(saved.plan.sessions[0].items),null);
});

function componentHarness(relative,exportName,props){
 const slots=[],module={exports:{}},jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'};let cursor=0;
 const hooks={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}]},useRef:initial=>{const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useMemo:fn=>fn()};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',source)(id=>id==='react'?hooks:id==='react/jsx-runtime'?jsx:id==='react-native'?{View:'View',Text:'Text',TextInput:'TextInput',Pressable:'Pressable',StyleSheet:{create:value=>value}}:id==='./appearance'?{useThemedStyles:value=>value}:id.startsWith('./shared/')?load(id.slice('./shared/'.length)):id.startsWith('@/lib/')?load(id.slice('@/lib/'.length)):id.startsWith('@/components/ui/')?new Proxy({},{get:(_target,key)=>String(key)}):require(id),module,module.exports);
 let currentProps=props;
 return {render(nextProps=currentProps){currentProps=nextProps;cursor=0;return module.exports[exportName](currentProps)}};
}
function nodes(node){if(node===null||node===undefined||typeof node==='boolean')return [];if(Array.isArray(node))return node.flatMap(nodes);if(typeof node!=='object')return [];return [node,...nodes(node.props?.children)]}
function content(node){if(Array.isArray(node))return node.map(content).join('');return typeof node==='string'||typeof node==='number'?String(node):node?.props?content(node.props.children):''}
function button(tree,label){const match=nodes(tree).find(node=>node.props?.label===label||['Button','button'].includes(node.type)&&content(node)===label);assert.ok(match,'button '+label+' exists');return match.props.onPress||match.props.onClick}
function input(tree,label){const match=nodes(tree).find(node=>node.props?.accessibilityLabel===label||node.props?.['aria-label']===label);assert.ok(match,'input '+label+' exists');return match.props}
for(const platform of ['native','web']){
 const native=platform==='native',relative=native?'mobile/src/session-editor.tsx':'components/tracking-editor.tsx',exportName=native?'SessionEditor':'TrackingEditor',saveLabel=native?'Save workout targets':'Save reviewed targets';
 function harness(s,save){return componentHarness(relative,exportName,native?{state:s,sessionId:s.plan.sessions[0].id,onSave:save}:{state:s,sessionId:s.plan.sessions[0].id,onClose:()=>{},onApply:save})}
 function type(tree,label,value){const field=input(tree,label);if(native)field.onChangeText(value);else field.onChange({target:{value}})}
 test(platform+' editor keeps ranges and prevents duplicate same-render keep/save',()=>{
  const s=state();let saves=0,submitted;const h=harness(s,value=>{saves++;submitted=value;return native?undefined:true});let tree=h.render();
  button(tree,'Edit')();tree=h.render();assert.equal(input(tree,'Minimum reps').value,'8');assert.equal(input(tree,'Maximum reps').value,'12');type(tree,'Sets','3');tree=h.render();
  const keep=button(tree,'Keep edited targets');keep();keep();tree=h.render();assert.ok(content(tree).includes('3 × 8–12'));
  const save=button(tree,saveLabel);save();save();assert.equal(saves,1);const targets=native?submitted.items:submitted.plan.sessions[0].items;assert.equal(targets[0].sets,3);assert.equal(targets[0].repMin,8);assert.equal(targets[0].repMax,12);assert.equal(targets.length,2);
 });
 test(platform+' editor retries refused saves and rejects stale plans without crashing',()=>{
  const s=state();let saves=0;const h=harness(s,()=>{saves++;return native?'Storage paused.':false});let tree=h.render();button(tree,saveLabel)();tree=h.render();assert.ok(content(tree).includes(native?'Storage paused.':'could not be saved'));button(tree,saveLabel)();assert.equal(saves,2);
  const props=native?{state:{...s,plan:null},sessionId:s.plan.sessions[0].id,onSave:()=>{throw Error('must not save')}}:{state:{...s,plan:null},sessionId:s.plan.sessions[0].id,onClose:()=>{},onApply:()=>{throw Error('must not save')}};
  tree=h.render(props);assert.match(content(tree),/plan changed/i);
 });
 test(platform+' stale Remove callback never removes a different exercise after indices shift',()=>{
  const s=state(),h=harness(s,()=>native?undefined:true);let tree=h.render();const remove=button(tree,'Remove');remove();remove();tree=h.render();assert.ok(content(tree).includes('Forearm plank'));assert.equal(content(tree).includes('Standing one-arm dumbbell row · 2 ×'),false);
 });
 test(platform+' editing follows exercise identity when moving the draft',()=>{
  const s=state();let submitted;const h=harness(s,value=>{submitted=value;return native?undefined:true});let tree=h.render();button(tree,'Edit')();tree=h.render();button(tree,native?'Move down':'Down')();tree=h.render();type(tree,'Sets','4');tree=h.render();button(tree,'Keep edited targets')();tree=h.render();button(tree,saveLabel)();const targets=native?submitted.items:submitted.plan.sessions[0].items;assert.equal(targets[0].exerciseId,'plank');assert.equal(targets[0].sets,1);assert.equal(targets[1].exerciseId,'row');assert.equal(targets[1].sets,4);
 });
}
test('Web customizer prevents duplicate acceptance and keeps refused reviews retryable',()=>{
 const s=state();for(const session of s.plan.sessions)session.minutes=T.estimateSessionMinutes(session.items,false,s.custom);let calls=0,accepted=false;
 const h=componentHarness('components/plan-customizer.tsx','PlanCustomizer',{state:s,sessionId:s.plan.sessions[0].id,onClose:()=>{},onApply:()=>{calls++;return accepted}});let tree=h.render();
 const choice=nodes(tree).find(node=>node.type==='button'&&content(node).startsWith('Dumbbell curl'));assert.ok(choice);choice.props.onClick();tree=h.render();button(tree,'Review addition')();tree=h.render();button(tree,'Accept addition to plan')();tree=h.render();assert.equal(calls,1);assert.match(content(tree),/could not be saved/);
 accepted=true;const save=button(tree,'Accept addition to plan');save();save();assert.equal(calls,2);
});
fs.mkdirSync(path.join(root,'.sites-runtime'),{recursive:true});fs.writeFileSync(path.join(root,'.sites-runtime/creator-state-validation.json'),JSON.stringify({passed:results},null,2)+'\n');console.log(results.length+' creator and stable-set scenario groups passed');
