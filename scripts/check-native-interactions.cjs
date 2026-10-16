// Runs the executed native component callbacks with deterministic hook/OS boundaries.
// This is not a React Native renderer, touch-device or screen-reader test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const domain=require('./domain-test-loader.cjs');
const T=domain.load('mobile/src/shared/training.ts'),E=domain.load('mobile/src/shared/equipment.ts');
function harness(filename,props,extra={}){
 const slots=[],effects=[];let cursor=0,dirty=true,tree;
 const changed=(a,b)=>!a||a.length!==b?.length||a.some((x,i)=>!Object.is(x,b[i]));
 const react={useState(initial){const n=cursor++;if(!(n in slots))slots[n]=typeof initial==='function'?initial():initial;return [slots[n],v=>{const next=typeof v==='function'?v(slots[n]):v;if(!Object.is(next,slots[n])){slots[n]=next;dirty=true}}]},useRef(initial){const n=cursor++;if(!(n in slots))slots[n]={current:initial};return slots[n]},useMemo(fn,deps){const n=cursor++;if(!slots[n]||changed(slots[n].deps,deps))slots[n]={value:fn(),deps};return slots[n].value},useEffect(fn,deps){const n=cursor++;if(!slots[n]||changed(slots[n].deps,deps)){slots[n]?.cleanup?.();slots[n]={deps};effects.push(()=>{slots[n].cleanup=fn()})}}};
 react.useLayoutEffect=(fn,deps)=>react.useEffect(fn,deps);
 react.createElement=(type,props,...children)=>({type,props:{...props,children:children.length===1?children[0]:children},key:props?.key});
 const jsx=(type,props,key)=>({type,props:props||{},key});
 const rn={View:'View',Text:'Text',TextInput:'TextInput',ScrollView:'ScrollView',StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:390,height:844,fontScale:1}),Alert:{alert(){}},Keyboard:{dismiss(){}}};
 const mocks={'react':{...react,default:react,__esModule:true},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':rn,
  './wild-interactions':{GrizzlyPressable:'Pressable',NativeWildReveal:'Reveal'},'./appearance':{useThemedStyles:x=>x,useNativeAppearance:()=>({p:{textSize:100},colors:{ink:'#111',green:'#070',line:'#aaa',onAccent:'#fff',white:'#fff',danger:'#900'}})},
  './phone-ui':{NativeFlowScreen:'FlowScreen',NativeActionFooter:'ActionFooter'},'./equipment-survey':{NativeEquipmentSurvey:'EquipmentSurvey'},'./science':{NativePlanEvidence:'Evidence'},...extra};
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>mocks[name]||domain.load(path.resolve(path.dirname(filename),name)+(path.extname(name)?'':'.ts')),module,module.exports);
 const component=Object.values(module.exports).find(x=>typeof x==='function');
 function render(){cursor=0;dirty=false;tree=component(props);for(const effect of effects.splice(0))effect();return tree}
 function nodes(value=tree,result=[]){if(Array.isArray(value)){for(const x of value)if(x!==undefined)nodes(x,result)}else if(value&&typeof value==='object'){result.push(value);if(value.props?.children!==undefined)nodes(value.props.children,result);if(value.props?.footer)nodes(value.props.footer,result);if(value.props?.primary)nodes({type:'Primary',props:value.props.primary},result);if(value.props?.onBack)nodes({type:'Back',props:{label:'Back',onPress:value.props.onBack}},result)}return result}
 async function flush(){for(let i=0;i<20;i++){if(dirty)render();await Promise.resolve();await Promise.resolve()}return tree}
 return {render,flush,nodes,find:predicate=>nodes().find(predicate),all:predicate=>nodes().filter(predicate),text:()=>nodes().flatMap(x=>typeof x.props?.children==='string'?[x.props.children]:[]).join('\n'),async press(label){const node=nodes().find(x=>x.props.label===label||x.props.accessibilityRole==='button'&&nodes(x).some(y=>y.props.children===label));assert.ok(node,'Missing action: '+label);assert.ok(!node.props.disabled,'Disabled action: '+label);await node.props.onPress();await flush()}};
}
async function setupJourney(sourceChoice){
 const state={...domain.load('mobile/src/mobile-engine.ts').emptyDemo(),profile:{...T.blankProfile,name:'Synthetic profile',age:28,start:T.day(),days:[0,1,2,3,4,5,6],trainingDays:2,minutes:120,equipment:'Full gym',experience:'Experienced',establishedTraining:true,runBase:true,runDays:5,runMinutes:150,jumpReady:true,inventory:{...E.defaultInventory(),confirmed:true}}};
 let accepted=0,acceptedProfile,fail=true,draft;
 const component=harness('mobile/src/plan-setup-runtime.js',{state,sourceChoice,onAccept:async(profile,plan)=>{accepted++;acceptedProfile=profile;if(fail)return 'Synthetic disk failure';assert.ok(plan.sessions.length);return undefined}}, {'./storage':{readLocalSetup:async()=>null,saveLocalSetup:async v=>{draft=v},clearLocalSetup:async()=>{draft=null}}});
 await component.flush();assert.equal(component.find(x=>x.type==='FlowScreen').props.title,'About you');assert.equal(accepted,0);
 for(let i=0;i<24&&!component.find(x=>x.props.label==='Review this plan');i++){const action=component.find(x=>x.type==='Primary');assert.ok(action,'wizard primary action');await component.press(action.props.label)}
 const choices=component.all(x=>x.props.label==='Review this plan');assert.ok(choices.length>0,'actual setup offers compatible plans');
 await component.press('Review this plan');assert.equal(component.find(x=>x.type==='FlowScreen').props.title,'Review your plan','review focuses on one choice');
 await component.press('Choose another plan');assert.ok(component.all(x=>x.props.label==='Review this plan').length>0);
 await component.press('Review this plan');await component.press('Start this plan');assert.match(component.text(),/Synthetic disk failure/);assert.ok(draft,'failed acceptance retains setup');
 fail=false;await component.press('Start this plan');assert.equal(accepted,2);assert.equal(draft,null);assert.equal(acceptedProfile.name,'Synthetic profile');assert.equal(acceptedProfile.age,28);
 if(sourceChoice){assert.equal(acceptedProfile.goal,sourceChoice.goal);assert.equal(acceptedProfile.programId,sourceChoice.id,'requested program is first when it fits');}
}
async function calendarJourney(){
 const state=domain.workoutFixture();let resumed=0;
 const component=harness('mobile/src/calendar.tsx',{state,initialDate:'2026-10-15',onChange:async()=>true,onProposal:async()=>true,onStart:async()=>true,onHistory(){},onEdit(){},onResume(){resumed++}});
 await component.flush();const chooseDate=component.find(x=>x.props.accessibilityRole==='button'&&x.props.accessibilityLabel?.startsWith(T.niceDate('2026-11-01')+'.'));assert.ok(chooseDate);chooseDate.props.onPress();await component.flush();assert.match(component.text(),/November 2026/);
 await component.press('Add time off or a commitment');assert.equal(component.find(x=>x.props.accessibilityLabel==='Commitment date YYYY-MM-DD').props.value,'2026-11-01');
 await component.press('Close commitment form');await component.press('Today');await component.press('Resume this workout');assert.equal(resumed,1);assert.equal(state.active.id,'synthetic-active');
}
async function editReorderJourney(){
 const state=domain.workoutFixture();state.active=null;state.profile.mode='manual';state.plan.profile.mode='manual';
 const session=state.plan.sessions[0],original=session.items.map(x=>x.exerciseId);let saved;
 const component=harness('mobile/src/session-editor.tsx',{state,sessionId:session.id,onSave:async edit=>{saved=edit}});
 await component.flush();await component.press('Edit');await component.press('Move down');await component.press('Keep edited targets');await component.press('Save workout targets');
 assert.ok(saved);assert.deepEqual(saved.items.map(x=>x.exerciseId),[original[1],original[0],...original.slice(2)],'reordering during an edit keeps the exercise identity');
 assert.deepEqual(session.items.map(x=>x.exerciseId),original,'draft operations do not mutate accepted targets');
}
async function notificationJourney(){
 const code=ts.transpileModule(fs.readFileSync('mobile/src/rest-alerts.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const kind of ['training-workout','grizzly-fitness.training-workout']){
  let handler;const module={exports:{}},mocks={'react':{},'react-native':{Platform:{OS:'android'}},'expo-notifications':{setNotificationHandler:v=>{handler=v}},'./shared/rest-timer':domain.load('mobile/src/shared/rest-timer.ts'),'./shared/workout-reminders':{workoutReminderKind:kind},'./workout-notifications':{isWorkoutNotificationAllowed:id=>id==='allowed'}};
  new Function('require','module','exports',code)(name=>mocks[name],module,module.exports);
  for(const [id,actualKind,expected] of [['allowed',kind,true],['stale',kind,false],['allowed','unrelated',false]]){
   const result=await handler.handleNotification({request:{identifier:id,content:{data:{kind:actualKind}}}});
   assert.equal(result.shouldShowBanner,expected,kind+' foreground reminder identity');assert.equal(result.shouldPlaySound,expected);
  }
 }
}
module.exports={harness};
if(require.main===module)(async()=>{await setupJourney();await setupJourney({id:'PLCOMPACT2',goal:'powerlifting'});await setupJourney({id:'src-sl5x5-2',goal:'powerlifting'});await calendarJourney();await editReorderJourney();await notificationJourney();console.log('PASS native callback journeys: default/catalog/source setup, focused plan review, failed-save retry and profile preservation; calendar adjacent-month/date-seeded commitment/direct resume; reorder during target editing preserves identities; both brands permit only current foreground reminders. Hook and OS boundaries mocked; no device claim.');})().catch(e=>{console.error(e);process.exitCode=1});
