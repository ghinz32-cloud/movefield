// Source/handler regression for native layout composition. Not a rendered-device test.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const raw=fs.readFileSync('mobile/App-runtime.js','utf8'),source=ts.createSourceFile('App-runtime.js',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const nodes=[];function visit(node){nodes.push(node);ts.forEachChild(node,visit)}visit(source);
const variable=name=>nodes.find(node=>ts.isVariableDeclaration(node)&&node.name.getText(source)===name)?.initializer;
const properties=node=>new Map(node.properties.map(item=>[item.name.getText(source),item.initializer]));
const settings=nodes.find(node=>ts.isCallExpression(node)&&node.arguments[0]?.getText(source)==='_srcSettings.NativeSettings');
assert.ok(settings,'Settings remains a reachable screen');
const settingProps=properties(settings.arguments[1]);
assert.match(settingProps.get('children').getText(source),/NativeCloudAccount/,'account remains in Settings scroll content');
assert.match(settingProps.get('footer').getText(source),/Export encrypted backup/,'backup belongs to Settings scroll content');
assert.match(settingProps.get('footer').getText(source),/Preview backup restore/,'restore remains available');
const settingsSource=fs.readFileSync('mobile/src/settings.tsx','utf8');
const settingsTree=ts.createSourceFile('settings.tsx',settingsSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),settingsScreens=[];
function settingsVisit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(settingsTree)==='NativeFlowScreen')settingsScreens.push(node);ts.forEachChild(node,settingsVisit)}settingsVisit(settingsTree);
assert.ok(settingsScreens.some(node=>node.children.some(child=>ts.isJsxExpression(child)&&/page==='backup'&&footer/.test(child.expression?.getText(settingsTree)||''))),'backup controls remain inside a focused screen scroll body');
assert.ok(settingsScreens.some(node=>node.children.some(child=>ts.isJsxExpression(child)&&/page==='account'&&children/.test(child.expression?.getText(settingsTree)||''))),'account controls remain inside their focused screen scroll body');
const phoneUI=fs.readFileSync('mobile/src/phone-ui.tsx','utf8');assert.match(phoneUI,/<ScrollView[^>]*>\{children\}<\/ScrollView>\s*\{footer\}/,'shared screen has one scroll body and a separate action footer');
const plan=variable('planView').getText(source);
for(const label of ['Build plan','Import plan','Export plan','Saved & previous'])assert.ok(plan.includes(label),'Plan keeps '+label+' discoverable');
assert.ok(!plan.includes("planSection === 'saved' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button"),'toolbar actions cannot depend on Saved subtab');
const style=variable('baseStyles').arguments[0].getText(source),styles=new Function('COLORS','return ('+style+')')({});
for(const key of ['button','pill','exerciseRow','numberInput','check','tab'])assert.ok(styles[key].minHeight>=44,key+' keeps a usable minimum touch target');

const today=variable('todayView').getText(source);
assert.match(today,/phonePage === 'workout' && active \? h\(NativeWorkoutScreen/,'active logger mounts as a dedicated screen');
assert.match(today,/onFocusExercise:setFocusedExercise/,'the focused workout delegates exercise identity to App');
const workoutSource=fs.readFileSync('mobile/src/workout-screen.tsx','utf8');
assert.match(workoutSource,/<NativeFlowScreen[^>]*footer=\{action\}/,'workout screens place the action in the shared fixed footer');
assert.match(workoutSource,/<NativeActionFooter primary=/,'logging retains one explicit primary action');
for(const obsolete of ['todayScroll','loggerPosition','revealWorkoutSection','scrollToWorkoutSection','workoutScrollPending'])assert.equal(variable(obsolete),undefined,'old long-page scroll machinery is removed: '+obsolete);
const focusRef={current:null};let rendered;
const setFocus=new Function('focusRef','renderFocus','return ('+variable('setFocusedExercise').getText(source)+')')(focusRef,id=>{rendered=id});
setFocus('bench');assert.equal(rendered,'bench');assert.equal(focusRef.current,'bench');setFocus('row');assert.equal(rendered,'row');assert.equal(focusRef.current,'row');setFocus(null);assert.equal(rendered,null);assert.equal(focusRef.current,null);
assert.match(variable('startReviewedWorkout').getText(source),/if \(saved\)[\s\S]*setPhonePage\('workout'\)[\s\S]*setFocusedExercise\(stateRef.current\?\.active\?\.targets\?\.\[0\]\?\.exerciseId/,'only a successful start opens the first focused set');

(async()=>{
 const {load,workoutFixture}=require('./domain-test-loader.cjs'),W=load('lib/workout-log.ts'),P=load('lib/paired-sets.ts');
 for(const outcome of ['failed','saved','changed-focus']){
  const initial=workoutFixture(),stateRef={current:initial};let now,announced=0;
  focusRef.current=initial.active.sets[0].exerciseId;rendered=undefined;
  const env={stateRef,focusRef,setFocusedExercise:setFocus,setNow:value=>{now=value},_srcSharedWorkoutLog:W,_srcSharedPairedSets:P,_reactNative:{AccessibilityInfo:{announceForAccessibility:()=>{announced++}}},persistChange:async update=>{if(outcome==='failed')return false;stateRef.current=update(stateRef.current);if(outcome==='changed-focus')focusRef.current='user-chose-another-exercise';return true}};
  const saveSet=new Function(...Object.keys(env),'return ('+variable('saveSet').getText(source)+')')(...Object.values(env));
  assert.equal(await saveSet(0,60,12345),outcome!=='failed');
  if(outcome==='failed'){assert.equal(stateRef.current,initial);assert.equal(rendered,undefined);assert.equal(announced,0);assert.equal(now,undefined)}
  else{assert.equal(stateRef.current.active.sets[0].done,true);assert.equal(now,12345);assert.equal(announced,1);assert.equal(rendered,outcome==='saved'?P.focusAfterSet(stateRef.current,0):undefined,'paired focus advances only after a saved set and preserves newer user selection')}
 }
 console.log('PASS native focused-screen composition: Settings categories retain account/backup, Plan tools remain reachable, touch targets and bounded footer ownership remain, successful start selects the first set, and actual set-save callbacks preserve failures and paired focus. No rendered-device claim.');
})().catch(error=>{console.error(error);process.exitCode=1});
