const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const repo = process.argv[2] || path.resolve(__dirname, '..');
const {createHookHarness, createTsxLoader} = require(path.join(repo, 'scripts/lib/component-hook-harness.cjs'));
const relativeFiles = ['mobile/App.tsx', 'mobile/src/mobile-engine.ts'];
const sources = Object.fromEntries(relativeFiles.map(relative => [path.join(repo, relative),
  process.env.NATIVE_WORKFLOW_TEST_REF ? execFileSync('git', ['show', process.env.NATIVE_WORKFLOW_TEST_REF + ':' + relative], {cwd:repo, encoding:'utf8'}) :
  process.env.NATIVE_WORKFLOW_SOURCE_ROOT ? fs.readFileSync(path.join(process.env.NATIVE_WORKFLOW_SOURCE_ROOT, relative), 'utf8') :
  fs.readFileSync(path.join(repo, relative), 'utf8')
]));
// Expose existing private components in the compiled test source only. Application exports stay unchanged.
sources[path.join(repo, 'mobile/App.tsx')] = sources[path.join(repo, 'mobile/App.tsx')]
  .replace('function TrainingApp()', 'export function TrainingApp()')
  .replace('function NumericField(', 'export function NumericField(')
  .replace('function Disclosure(', 'export function Disclosure(');
const helperLoader = createTsxLoader(repo, {}, sources);
const T = helperLoader.load(path.join(repo, 'mobile/src/shared/training.ts'));
const E = helperLoader.load(path.join(repo, 'mobile/src/mobile-engine.ts'));
const R = helperLoader.load(path.join(repo, 'mobile/src/shared/rest-timer.ts'));
function activeState() {
  let state = E.adoptPlan(E.emptyDemo(), E.previewPlan(E.FOUNDATION).plan);
  state = E.startWorkout(state, state.plan.sessions[0].id);
  state = E.editSet(state, 0, {reps:8, kg:10, done:true});
  return {...state, restTimer:R.startRest(state.active.id,state.active.sets[0].exerciseId+':1',90), active:{...state.active, symptom:'no', effort:'right'}};
}
function ui(names) { return Object.fromEntries(names.map(name => [name, name])); }
async function mount(state, componentName = 'TrainingApp', input = {}) {
  const h = createHookHarness(), saved = [], alerts = [], opened = [];
  const media = Object.fromEntries((state.active?.targets || state.plan?.sessions[0]?.items || []).map(item => [item.exerciseId, {sourceUrl:'https://example.com/' + item.exerciseId}]));
  const colors = {bg:'#fff', ink:'#123', muted:'#456', green:'#234', line:'#ddd', pale:'#eee', white:'#fff', onAccent:'#fff', danger:'#900'};
  const appearance = {p:{textSize:100}, colors, dark:false, reduceMotion:false, fonts:false, ready:true};
  const overrides = {
    react:h.react, 'react/jsx-runtime':h.runtime,
    'react-native': {...ui(['View','Text','Pressable','TextInput','ActivityIndicator','FlatList','KeyboardAvoidingView','Modal','ScrollView']), StyleSheet:{create:value=>value},
      Platform:{OS:'android'}, AppState:{addEventListener:()=>({remove:()=>{}})}, AccessibilityInfo:{announceForAccessibility:()=>{}},
      Alert:{alert:(...args)=>alerts.push(args)}, Linking:{openURL:async url=>{opened.push(url);throw Error('Injected browser failure');}}},
    'react-native-safe-area-context':ui(['SafeAreaProvider','SafeAreaView']), 'expo-status-bar':ui(['StatusBar']),
    './src/appearance':{NativeAppearanceProvider:'NativeAppearanceProvider', useThemedStyles:value=>value, useNativeAppearance:()=>appearance},
    './src/settings':{NativeSettings:'NativeSettings'}, './src/research-library':{NativeResearchLibrary:'NativeResearchLibrary'},
    './src/backup':{shareBackup:async()=>{}}, './src/transfer':{NativeTransferOpen:'NativeTransferOpen'}, './src/plan-setup':{PlanSetup:'PlanSetup'}, './src/session-editor':{SessionEditor:'SessionEditor'},
    './src/rest-alerts':{enableRestAlerts:async()=>({enabled:false,message:'Disabled'}), useNativeRestAlerts:()=>''},
    './src/workout-notifications':{useNativeWorkoutReminders:()=>''},
    './src/storage':{readLocalState:async()=>structuredClone(state), readLocalRaw:async()=>JSON.stringify(state), saveLocalState:async next=>saved.push(structuredClone(next)), replaceLocalState:async()=>{}, resetLocalState:async()=>{}},
    './src/content':{guides:{},media,safeWebUrl:value=>value || null},
    './src/tools':{NativeTrainingTools:'NativeTrainingTools', NativeWeeklyReview:'NativeWeeklyReview'},
    'expo-crypto':{getRandomBytes:n=>new Uint8Array(n)},
  };
  const loader = createTsxLoader(repo, overrides, sources);
  const app = loader.load(path.join(repo,'mobile/App.tsx'));
  await h.mount(app[componentName], input);
  return {h,saved,alerts,opened,app};
}
function button(h, label) {
  const node = h.find(node => node.props.label === label && typeof node.props.onPress === 'function');
  assert.ok(node, 'Rendered action: ' + label);
  return node;
}
async function press(h, label) {button(h,label).props.onPress();await h.settle();}
async function tab(h,label) {
  const node = h.find(node=>node.type==='Pressable' && node.props.accessibilityRole==='tab' && node.props.accessibilityLabel===label);
  assert.ok(node,'Rendered tab: '+label);node.props.onPress();await h.settle();
}
let count = 0;
async function scenario(name, run) {await run();count++;console.log('PASS ' + name);}
(async()=>{
  await scenario('finish uses previously entered feedback and saves partial work once',async()=>{
    const state=activeState(), {h,saved}=await mount(state);
    await press(h,'Finish & save workout');
    assert.ok(h.find(node=>node.props.label==='✓ No'),'Previous symptom answer is selected');
    assert.ok(h.find(node=>node.props.label==='✓ About right'),'Previous effort answer is selected');
    await press(h,'Save workout');
    assert.equal(saved.length,1,'One atomic state save');
    assert.equal(saved[0].history.at(-1).effort,'right');assert.equal(saved[0].history.at(-1).symptom,'no');
    assert.equal(saved[0].history.at(-1).partial,true);assert.equal(saved[0].active,null);assert.equal(saved[0].restTimer,null);
  });
  await scenario('finish supports explicitly skipping effort without clearing concern hold',async()=>{
    const state={...activeState(),hold:true}, {h,saved}=await mount(state);
    await press(h,'Finish & save workout');const skip=h.nodes().filter(node=>node.props.label==='Skip'&&typeof node.props.onPress==='function').at(-1);assert.ok(skip);skip.props.onPress();await h.settle();await press(h,'Save workout');
    assert.equal(saved[0].history.at(-1).effort,undefined);assert.equal(saved[0].hold,true);
  });
  await scenario('finish rejects stale workout check-ins and empty non-concern work',async()=>{
    const state=activeState(), before=JSON.stringify(state), checkin=E.workoutCheckin(state);
    assert.throws(()=>E.completeWorkoutCheckin({...state,active:{...state.active,id:'another-workout'}},checkin),/changed/);
    assert.equal(JSON.stringify(state),before);
    const empty={...state,active:{...state.active,sets:state.active.sets.map(set=>({...set,done:false}))}};
    assert.throws(()=>E.completeWorkoutCheckin(empty,checkin),/at least one/);
    assert.equal(E.completeWorkoutCheckin(empty,{...checkin,symptom:'yes'}).history.length,state.history.length);
    const held=E.completeWorkoutCheckin(empty,{...checkin,symptom:'unsure'});
    assert.equal(held.hold,true);assert.equal(held.active,null);assert.equal(held.restTimer,null);
  });
  await scenario('paused imported plan resumes without changing dates/history or lifting holds',async()=>{
    const state=E.adoptPlan(E.emptyDemo(),E.previewPlan(E.FOUNDATION).plan);state.plan.paused=true;state.hold=true;
    const dates=state.plan.sessions.map(s=>s.date), before=JSON.stringify(state), {h,saved}=await mount(state);
    await tab(h,'Plan');await press(h,'Resume plan');
    assert.equal(saved[0].plan.paused,false);assert.equal(saved[0].plan.version,state.plan.version+1);
    assert.deepEqual(saved[0].plan.sessions.map(s=>s.date),dates);assert.deepEqual(saved[0].history,state.history);assert.equal(saved[0].hold,true);
    assert.throws(()=>E.setPlanPaused(state,'other',state.plan.version,false),/changed/);
    assert.throws(()=>E.setPlanPaused(state,state.plan.id,state.plan.version+1,false),/changed/);
    assert.throws(()=>E.setPlanPaused(activeState(),state.plan.id,state.plan.version,true),/changed|active workout/);
    assert.equal(JSON.stringify(state),before);
  });
  await scenario('pause invalidates pending proposals and prevents active-workout changes',async()=>{
    const state=E.adoptPlan(E.emptyDemo(),E.previewPlan(E.FOUNDATION).plan);
    const proposal=T.makeProposal(state,'return');assert.ok(proposal);state.proposals=[proposal];
    const paused=E.setPlanPaused(state,state.plan.id,state.plan.version,true);
    assert.equal(paused.proposals[0].status,'stale');assert.equal(paused.plan.paused,true);
    const active=activeState();assert.throws(()=>E.setPlanPaused(active,active.plan.id,active.plan.version,true),/active workout/);
  });
  await scenario('only selected new exercise prompts; external link errors remain visible',async()=>{
    let state=activeState();state={...state,active:{...state.active,sets:state.active.sets.map(set=>({...set,done:false}))}};
    const {h,alerts,opened,saved}=await mount(state);assert.equal(alerts.length,1);
    const first=alerts[0];assert.match(first[0],new RegExp(T.exFor(state.active.targets[0].exerciseId).name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    first[2].find(choice=>choice.text==='Not now').onPress();await h.settle();assert.equal(alerts.length,1,'No cascade to second exercise');
    const target=state.active.targets[1];await press(h,`2. ${T.exFor(target.exerciseId).name}`);assert.equal(alerts.length,2);
    alerts[1][2].find(choice=>choice.text==='Open the source page').onPress();await h.settle();
    assert.equal(opened.length,1);assert.match(h.text(),/Could not open the demonstration/);assert.equal(alerts.length,2);assert.equal(saved.length,0,'Failed reference does not persist an answered preference');
  });
  await scenario('library searches imported custom exercises and exposes their equipment',async()=>{
    const state=E.adoptPlan(E.emptyDemo(),E.previewPlan(E.FOUNDATION).plan);
    state.custom=[{id:'custom-timer',name:'Custom timed movement',pattern:'Custom',equipment:'Custom equipment',metric:'seconds',cues:['Keep form controlled.'],custom:true}];
    const {h}=await mount(state);await tab(h,'Library');
    const search=h.find(node=>node.type==='TextInput'&&node.props.accessibilityLabel==='Search exercise library');assert.ok(search);
    search.props.onChangeText('Custom timed movement');await h.settle();
    const list=h.find(node=>node.type==='FlatList');assert.equal(list.props.data.length,1);assert.equal(list.props.data[0].id,'custom-timer');
    assert.ok(h.find(node=>node.props.label==='Custom equipment'),'Custom equipment is filterable');
  });
  await scenario('overdue primary action stages a reviewed date change without starting',async()=>{
    const state=E.adoptPlan(E.emptyDemo(),E.previewPlan(E.FOUNDATION,T.addDays(T.day(),-7)).plan), {h,saved}=await mount(state);
    await press(h,'Review moving to today');assert.equal(saved.length,1);
    assert.equal(saved[0].active,null);assert.equal(saved[0].proposals[0].type,'move');
    assert.deepEqual(saved[0].plan.sessions.map(s=>s.date),state.plan.sessions.map(s=>s.date),'Preview leaves dates unchanged');
    assert.equal(saved[0].proposals[0].changes[0].patch.date,T.day());
  });
  await scenario('history order is newest first for both imported storage conventions',async()=>{
    const state=activeState(), workout={...state.active,finishedAt:3000}, newer={...workout,id:'newer',startedAt:2000}, older={...workout,id:'older',startedAt:1000,finishedAt:1500};
    for(const history of [[newer,older],[older,newer]]){
      const {h}=await mount({...state,active:null,history});await tab(h,'History');
      const records=h.nodes().filter(node=>node.type==='Pressable'&&['newer','older'].includes(node.key));assert.deepEqual(records.map(node=>node.key),['newer','older']);
      assert.deepEqual(history.map(w=>w.id),history[0].id==='newer'?['newer','older']:['older','newer']);
    }
  });
  await scenario('backfilled history follows workout dates before import timestamps',async()=>{
    const state=activeState(), newer={...state.active,id:'newer',date:T.day(),startedAt:1000,finishedAt:2000}, older={...state.active,id:'older',date:T.addDays(T.day(),-7),startedAt:9000,finishedAt:10000};
    const {h}=await mount({...state,active:null,restTimer:null,history:[older,newer]});await tab(h,'History');
    const records=h.nodes().filter(node=>node.type==='Pressable'&&['newer','older'].includes(node.key));assert.deepEqual(records.map(node=>node.key),['newer','older']);
  });
  await scenario('numeric fields accept decimal comma and retain integer/range restrictions',async()=>{
    for(const text of ['45,5','45.5']){
      const values=[],args={value:0,label:'Load',min:0,max:100,nullable:true,onChange:n=>{values.push(n);args.value=n}};
      const mounted=await mount(E.emptyDemo(),'NumericField',args);
      mounted.h.find(n=>n.type==='TextInput').props.onChangeText(text);await mounted.h.settle();assert.deepEqual(values,[45.5]);
      mounted.h.find(n=>n.type==='TextInput').props.onChangeText('45,5,1');await mounted.h.settle();assert.deepEqual(values,[45.5]);
      mounted.h.find(n=>n.type==='TextInput').props.onChangeText('101');await mounted.h.settle();assert.deepEqual(values,[45.5]);
    }
    const values=[],args={value:2,label:'RIR',max:5,nullable:true,integer:true,onChange:n=>{values.push(n);args.value=n}};
    const mounted=await mount(E.emptyDemo(),'NumericField',args);
    mounted.h.find(n=>n.type==='TextInput').props.onChangeText('2,5');await mounted.h.settle();assert.deepEqual(values,[]);
  });
  await scenario('tools disclosure starts collapsed and responds to its action',async()=>{
    const mounted=await mount(E.emptyDemo(),'Disclosure',{label:'Tools',children:'Visible calculator content'});
    assert.doesNotMatch(mounted.h.text(),/Visible calculator content/);
    const action=mounted.h.find(n=>n.type==='Pressable');assert.equal(action.props.accessibilityState.expanded,false);action.props.onPress();await mounted.h.settle();assert.match(mounted.h.text(),/Visible calculator content/);
  });
  console.log(JSON.stringify({scenarios:count,scope:'Actual compiled native App TSX callbacks and real planning/workout helpers; mocked hook scheduler and device I/O. No physical-device, React Native layout, or OS acceptance claim.'}));
})().catch(error=>{console.error(error);process.exit(1)});
