// Executes focused-screen callbacks with the actual workout reducers. OS/layout
// primitives are mocked; rendered RN Web and physical-phone checks are separate.
const assert=require('node:assert/strict');
const {harness}=require('./check-native-interactions.cjs');
const domain=require('./domain-test-loader.cjs');
const T=domain.load('mobile/src/shared/training.ts');
const W=domain.load('mobile/src/shared/workout-log.ts');
const P=domain.load('mobile/src/shared/paired-sets.ts');
const {sessionGuide}=domain.load('mobile/src/shared/session-guide.ts');
const copy=x=>structuredClone(x);
let groups=0;
function fixture(){
 const state=domain.workoutFixture(),targets=[{exerciseId:'bench',sets:2,reps:8,rest:90,kg:null,loadRole:'strength',note:'Keep the reviewed technique cue.'},{exerciseId:'run',sets:1,reps:10,rest:0,kg:null,loadRole:'activity'}];
 state.plan.sessions[0].items=copy(targets);state.plan.sessions[0].runSteps=[{label:'Walk',seconds:300},{label:'Jog',seconds:300}];
 state.active.targets=copy(targets);state.active.sets=targets.flatMap(t=>Array.from({length:t.sets},(_,i)=>({exerciseId:t.exerciseId,set:i+1,reps:t.reps,kg:null,done:false})));
 return state;
}
function create({textSize=100,fontScale=1,width=320}={}){
 let fail=false,logged=0,finished=0,discarded=0,exited=0;
 const props={state:fixture(),focusedExercise:'bench',busy:false,remaining:null,restMessage:'Synthetic alert state',
  onFocusExercise(id){props.focusedExercise=id},
  onChangeSet(index,patch){props.state=W.changeWorkoutSet(props.state,index,patch)},
  async onLogSet(index,seconds){logged++;if(fail)return false;props.state=W.logWorkoutSet(props.state,index,seconds);props.focusedExercise=P.focusAfterSet(props.state,index);return true},
  onChangeSetup(id,text){props.state={...props.state,active:{...props.state.active,loadContext:{...props.state.active.loadContext,[id]:text}}}},
  onOpenGuide(ex){props.openedGuide=ex.id},onSubstitute(id){props.substitute=id},
  onChangeFeedback(patch){props.state={...props.state,hold:['yes','unsure'].includes(patch.symptom)?true:props.state.hold,active:{...props.state.active,...patch}}},
  onPauseRest(){props.timerAction='pause'},onExtendRest(){props.timerAction='extend'},onEndRest(){props.timerAction='end'},onToggleRestAlerts(){props.timerAction='alerts'},
  onFinish(){finished++},onDiscard(){discarded++},onExit(){exited++}};
 const h=harness('mobile/src/workout-screen.tsx',props,{'react-native':{View:'View',Text:'Text',TextInput:'TextInput',useWindowDimensions:()=>({width,height:568,fontScale})},'./appearance':{useNativeAppearance:()=>({p:{textSize},colors:{ink:'#111',muted:'#555',green:'#070',line:'#aaa',onAccent:'#fff',white:'#fff',danger:'#900'}})},'./phone-ui':{NativeFlowScreen:'Flow',NativeActionFooter:'Footer',NativeSettingsRow:'SettingsRow'},'./numeric-input':{NativeNumericInput:'Numeric'},'./set-rir':{NativeSetRir:'Rir'},'./set-metrics':{NativeSetMetrics:'Metrics'}});
 const refresh=async()=>{h.render();await h.flush()};
 const flow=()=>h.find(x=>x.type==='Flow');
 const primary=async()=>{const action=flow().props.footer.props.primary;assert.ok(!action.disabled,'primary action is available');await action.onPress();await refresh()};
 const press=async label=>{if(label==='Options')flow().props.trailing.props.onPress();else await h.press(label);await refresh()};
 const back=async()=>{flow().props.onBack();await refresh()};
 return {h,props,refresh,flow,primary,press,back,setFail:value=>{fail=value},counts:()=>({logged,finished,discarded,exited})};
}
async function test(name,fn){await fn();groups++;console.log('PASS '+name)}
(async()=>{
 await test('One actual set is visible with a fixed primary action; details remain optional',async()=>{
  const f=create();await f.refresh();assert.equal(f.flow().props.title,'Set 1 of 2');assert.equal(f.flow().props.handleHardwareBack,true);assert.equal(f.flow().props.compactBack,true);assert.equal(f.flow().props.backLabel,'Workout');
  assert.ok(f.h.find(x=>x.type==='View'&&x.props.style?.flexDirection==='row'&&x.props.style?.gap===12),'Normal-size fields share a row at 320px');
  assert.equal(f.h.all(x=>x.type==='Numeric').length,2);assert.equal(f.h.all(x=>x.type==='Rir'||x.type==='Metrics').length,0);
  assert.equal(f.flow().props.footer.type,'Footer');assert.equal(f.flow().props.footer.props.primary.label,'Log set');
  assert.match(f.flow().props.footer.props.primary.accessibilityLabel,/Log .* set 1/);
  assert.equal(f.h.all(x=>x.props.label==='Substitute exercise').length,0);
  for(const options of [{textSize:130},{fontScale:1.3},{width:290}]){const expanded=create(options);await expanded.refresh();assert.ok(expanded.h.find(x=>x.type==='View'&&x.props.style?.flexDirection==='column'&&x.props.style?.gap===12),'Enlarged text and exceptionally narrow screens keep stacked fields');}
 });
 await test('Unknown load stays different from zero; changing actuals never changes targets',async()=>{
  const f=create();await f.refresh();const targets=copy(f.props.state.active.targets);
  let load=f.h.find(x=>x.type==='Numeric'&&x.props.nullable);assert.equal(load.props.value,null);load.props.onValueChange(0);await f.refresh();assert.equal(f.props.state.active.sets[0].kg,0);
  f.h.find(x=>x.type==='Numeric'&&x.props.nullable).props.onValueChange(null);await f.refresh();assert.equal(f.props.state.active.sets[0].kg,null);assert.deepEqual(f.props.state.active.targets,targets);
  f.props.state.profile.units='lb';await f.refresh();f.h.find(x=>x.type==='Numeric'&&x.props.nullable).props.onValueChange(100);assert.ok(Math.abs(f.props.state.active.sets[0].kg-T.toKg(100,'lb'))<1e-9);
 });
 await test('Invalid amounts cannot log; failed durable save retains current fields for retry',async()=>{
  const f=create();await f.refresh();f.h.find(x=>x.type==='Numeric'&&!x.props.nullable).props.onValueChange(0);await f.refresh();await f.primary();assert.equal(f.counts().logged,0);assert.ok(f.h.find(x=>x.props.accessibilityRole==='alert'));
  f.h.find(x=>x.type==='Numeric'&&!x.props.nullable).props.onValueChange(9);await f.refresh();f.setFail(true);const snapshot=copy(f.props.state);await f.primary();assert.equal(f.counts().logged,1);assert.deepEqual(f.props.state,snapshot);assert.equal(f.flow().props.title,'Set 1 of 2');assert.match(f.h.text(),/could not be saved/);
  f.setFail(false);await f.primary();assert.equal(f.props.state.active.sets[0].done,true);assert.equal(f.props.state.active.sets[0].reps,9);assert.equal(f.flow().props.title,'Set 2 of 2');assert.ok(f.props.state.restTimer);
 });
 await test('RIR and every optional measurement survive detail routes, logging, and prior-set edits',async()=>{
  const f=create();await f.refresh();await f.press('Options');await f.press('Set details');
  const metrics={distanceM:120,durationSeconds:30,heightCm:20,heartRate:100,cadence:80,powerWatts:100,speedKph:5,inclinePercent:-2,level:3,assistanceKg:10,tempo:'3-1-1',side:'Left',notes:'Synthetic note'};
  f.h.find(x=>x.type==='Rir').props.onChange(0);f.h.find(x=>x.type==='Metrics').props.onChange(metrics);await f.refresh();assert.equal(f.props.state.active.sets[0].rir,0);assert.deepEqual(f.props.state.active.sets[0].metrics,metrics);
  await f.primary();await f.primary();await f.press('Options');await f.press('Sets / edit previous');await f.press('Set 1');assert.equal(f.flow().props.title,'Set 1 of 2');assert.equal(f.flow().props.footer.props.primary.disabled,true);
  await f.press('Undo saved set 1');assert.equal(f.props.state.active.sets[0].done,false);assert.deepEqual(f.props.state.active.sets[0].metrics,metrics);assert.equal(f.props.state.active.sets[0].rir,0);
 });
 await test('Options preserve guides, substitution, run sequence, machine setup and rest controls',async()=>{
  const f=create();await f.refresh();await f.press('Options');await f.press('Exercise guide');assert.equal(f.props.openedGuide,'bench');await f.press('Substitute exercise');assert.equal(f.props.substitute,'bench');await f.press('Plan instructions');assert.match(f.h.text(),/Run \/ walk sequence/);assert.match(f.h.text(),/reviewed technique cue/);
  await f.back();await f.press('Rest timer and alerts');await f.press('Enable rest alerts');assert.equal(f.props.timerAction,'alerts');await f.primary();
  f.props.state.active.targets[0].exerciseId='pulldown';f.props.state.active.sets[0].exerciseId='pulldown';f.props.state.active.sets[1].exerciseId='pulldown';f.props.focusedExercise='pulldown';await f.refresh();const setup=f.h.find(x=>x.type==='TextInput');assert.equal(setup.props.editable,true);setup.props.onChangeText('Machine A / seat 2');await f.refresh();assert.equal(f.props.state.active.loadContext.pulldown,'Machine A / seat 2');
  f.props.state.active.sets[0].done=true;await f.refresh();assert.equal(f.h.find(x=>x.type==='TextInput').props.editable,false);
 });
 await test('Timed activities use actual time fields and the same explicit save callback',async()=>{
  const f=create();f.props.focusedExercise='run';await f.refresh();assert.equal(f.h.all(x=>x.type==='Numeric').length,1);assert.match(f.h.find(x=>x.type==='Numeric').props.accessibilityLabel,/actual minutes/);assert.equal(f.h.all(x=>x.type==='Rir').length,0);
  await f.primary();assert.equal(f.props.state.active.sets[2].done,true);assert.equal(f.counts().finished,0);assert.equal(f.flow().props.title,'Your workout');
 });
 await test('Active-workout guidance preserves every session field from both set and workout-list routes',async()=>{
  for(const mode of ['app','coach']){
   const f=create();f.props.state.plan.profile.mode=mode;await f.refresh();const original=copy(f.props.state),session=f.props.state.plan.sessions.find(row=>row.id===f.props.state.active.sessionId),guide=sessionGuide(f.props.state.plan,session);
   await f.press('Options');await f.press('Workout guidance');assert.equal(f.flow().props.title,'Workout guidance');
   for(const line of [...guide.warmup,guide.effort,...guide.order,...guide.progression,guide.finish])assert.ok(f.h.text().includes(line),'Current session guidance remains available: '+line);
   await f.back();assert.equal(f.flow().props.title,'Workout options');await f.back();await f.back();assert.equal(f.flow().props.title,'Your workout');
   await f.press('Options');await f.press('Workout guidance');assert.ok(f.h.text().includes(guide.effort));await f.primary();assert.equal(f.flow().props.title,'Your workout');assert.deepEqual(f.props.state,original,'Reading session guidance does not change targets, sets, rest or ownership');
  }
 });
 await test('Paired sets keep engine-selected exercise order and rest only after the pair',async()=>{
  const f=create(),targets=['bench','pulldown'].map((exerciseId,index)=>({exerciseId,sets:2,reps:8,rest:90,kg:null,setPlan:[1,2].map(()=>({pair:'synthetic-pair',position:index+1,rest:90}))}));
  f.props.state.active.targets=targets;f.props.state.active.sets=targets.flatMap(t=>[1,2].map(set=>({exerciseId:t.exerciseId,set,reps:8,kg:null,done:false})));
  await f.refresh();await f.primary();assert.equal(f.props.focusedExercise,'pulldown');assert.equal(f.flow().props.title,'Set 1 of 2');assert.equal(f.props.state.restTimer,null);
  await f.primary();assert.equal(f.props.focusedExercise,'bench');assert.equal(f.flow().props.title,'Set 2 of 2');assert.ok(f.props.state.restTimer);
 });
 await test('Finish is an optional stepped check-in, then the existing confirmation callback',async()=>{
  const f=create();await f.refresh();await f.press('Options');await f.primary();assert.equal(f.flow().props.title,'How did it feel?');assert.equal(f.counts().finished,0);
  await f.press('Harder');await f.primary();assert.equal(f.flow().props.title,'Any pain or concern?');await f.press('Yes');assert.equal(f.props.state.hold,true);await f.primary();assert.equal(f.flow().props.title,'Save workout');assert.match(f.h.text(),/partial workout/);assert.equal(f.counts().finished,0);
  const snapshot=copy(f.props.state);await f.primary();assert.equal(f.counts().finished,1);assert.deepEqual(f.props.state,snapshot,'screen does not save, remove or advance the workout');
  await f.back();assert.equal(f.flow().props.title,'Any pain or concern?');await f.back();assert.equal(f.flow().props.title,'How did it feel?');await f.back();assert.equal(f.flow().props.title,'Set 1 of 2');
 });
 await test('Back routes and leaving Today preserve workout data; a new workout resets local route',async()=>{
  const f=create();await f.refresh();const original=copy(f.props.state);await f.press('Options');await f.press('Set details');await f.back();assert.equal(f.flow().props.title,'Workout options');await f.back();assert.equal(f.flow().props.title,'Set 1 of 2');await f.back();assert.equal(f.flow().props.title,'Your workout');await f.back();assert.equal(f.counts().exited,1);assert.deepEqual(f.props.state,original);
  await f.press('Options');f.props.state.active={...f.props.state.active,id:'another-workout'};f.props.focusedExercise='run';await f.refresh();assert.equal(f.flow().props.title,'Set 1 of 1');
 });
 console.log(JSON.stringify({groups,scope:'Focused native presentation callbacks with real workout reducers; not physical-device rendering, OS BackHandler execution or storage durability.'}));
})().catch(error=>{console.error(error);process.exitCode=1});
