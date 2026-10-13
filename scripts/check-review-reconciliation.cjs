const assert=require('node:assert/strict'),path=require('node:path');
const {createHookHarness,createTsxLoader}=require('./lib/component-hook-harness.cjs');
const repo=path.resolve(__dirname,'..'),loader=createTsxLoader(repo);
const T=loader.load(path.join(repo,'lib/training.ts')),O=loader.load(path.join(repo,'lib/onboarding.ts')),catalog=loader.load(path.join(repo,'lib/program-catalog.ts'));
const base=T.initialState(),profile={...base.profile,name:'Actual athlete',age:28,minutes:120,days:[1,3,5],weeks:4};
for(const name of ['','Demo athlete','Local demo']){const p=O.setupStartProfile({...profile,name},T.day());assert.equal(p.name,'');assert.equal(p.age,0)}
assert.equal(O.setupStartProfile(profile,T.day()).name,profile.name);assert.equal(O.setupStartProfile(profile,T.day()).age,28);
const ui=names=>Object.fromEntries(names.map(n=>[n,n]));
const icon=new Proxy({}, {get:(_,n)=>'Icon'+String(n)});
global.window={scrollTo:()=>{}};
function overrides(h){return {react:h.react,'react/jsx-runtime':h.runtime,'lucide-react':icon,'react-native':{...ui(['View','Text','Pressable','TextInput','ScrollView']),StyleSheet:{create:x=>x}},'./appearance':{useThemedStyles:x=>x,useNativeAppearance:()=>({colors:{ink:'#111',green:'#234',line:'#ddd',onAccent:'#fff',danger:'#900',muted:'#777'}})},'./named-programs':{NamedPrograms:'NamedPrograms'},'@/components/brand-mark':{BrandMark:'BrandMark'},'@/components/session-guide':{SessionGuide:'SessionGuide'},'@/components/named-program-picker':{NamedProgramPicker:'NamedProgramPicker'},'@/components/training-focus-picker':{TrainingFocusPicker:'TrainingFocusPicker'},'@/components/ui/button':ui(['Button']),'@/components/ui/input':ui(['Input']),'@/components/ui/checkbox':ui(['Checkbox']),'@/components/ui/select':ui(['Select','SelectContent','SelectItem','SelectTrigger','SelectValue']),'@/components/ui/progress':ui(['Progress']),'@/components/ui/alert-dialog':ui(['AlertDialog','AlertDialogAction','AlertDialogCancel','AlertDialogContent','AlertDialogDescription','AlertDialogFooter','AlertDialogHeader','AlertDialogTitle'])}}
(async()=>{
 const h=createHookHarness();let calls=0,clears=0;
 const ref=catalog.programReferences.find(r=>r.workouts&&r.days===3);assert.ok(ref);
 const load=createTsxLoader(repo,{...overrides(h),'./storage':{readLocalSetup:async()=>null,saveLocalSetup:async()=>{},clearLocalSetup:async()=>{clears++}}});
 const C=load.load(path.join(repo,'mobile/src/plan-setup.tsx')).PlanSetup;
 await h.mount(C,{state:{...base,profile},initialProgramId:ref.id,onAccept:()=>{calls++;return undefined}});
 let start=h.find(n=>n.props.label==='Start this plan');assert.ok(start,'native named review retains start control');start.props.onPress();await h.settle();assert.equal(calls,0,'replacement cannot happen before confirmation');
 h.find(n=>n.props.label==='Keep current plan').props.onPress();await h.settle();assert.equal(calls,0);
 h.find(n=>n.props.label==='Start this plan').props.onPress();await h.settle();const replace=h.find(n=>n.props.label==='Replace with this plan');assert.ok(replace);replace.props.onPress();await h.settle();replace.props.onPress();await h.settle();assert.equal(calls,1,'stale repeat cannot reaccept');assert.equal(clears,1,'successful native replacement discards setup once');
 const w=createHookHarness();let webCalls=0,webClear=0;
 const draft={schema:1,basePlanId:base.plan.id,baseEvents:'[]',profile,events:[],step:6};
 const web=createTsxLoader(repo,{...overrides(w),'@/lib/browser-vault':{getVault:()=>({read:async()=>JSON.stringify(draft),write:async()=>'',discard:async()=>{webClear++}})}});
 const WC=web.load(path.join(repo,'components/training-onboarding.tsx')).TrainingOnboarding;
 await w.mount(WC,{initial:profile,events:[],basePlanId:base.plan.id,currentPlanName:'Current block',onCancel:()=>{},onAccept:()=>{webCalls++;return undefined}});
 const option=w.find(n=>n.type==='input'&&n.props.type==='radio');assert.ok(option);option.props.onChange();await w.settle();w.find(n=>n.type==='Button'&&n.props.children==='Confirm this plan').props.onClick();await w.settle();
 w.find(n=>n.type==='Button'&&n.props.children==='Start this plan').props.onClick();await w.settle();assert.equal(webCalls,0);assert.equal(w.find(n=>n.type==='AlertDialog').props.open,true);
 const accept=w.find(n=>n.type==='AlertDialogAction');accept.props.onClick();await w.settle();accept.props.onClick();await w.settle();assert.equal(webCalls,1);assert.equal(webClear,1);
 console.log('PASS sample profiles clear invented age; actual details preserved; web/native replacement requires confirmation; stale repeated accept is ignored; accepted setup is discarded once. Compiled TSX harness, not device acceptance.');
})().catch(e=>{console.error(e);process.exit(1)});
