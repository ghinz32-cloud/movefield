// Executes real wizard/survey callbacks with deterministic hook/storage boundaries.
// App geometry and platform back/keyboard behavior are checked separately in RN Web.
const assert=require('node:assert/strict');
const {harness}=require('./check-native-interactions.cjs');
const domain=require('./domain-test-loader.cjs');
const T=domain.load('mobile/src/shared/training.ts'),E=domain.load('mobile/src/shared/equipment.ts'),S=domain.load('mobile/src/shared/saved-data.ts');
const fresh=()=>({...domain.load('mobile/src/mobile-engine.ts').emptyDemo(),profile:{...T.blankProfile,name:'Wizard fixture',age:28,goal:'general',start:T.day(),days:[1,3,5],trainingDays:3,minutes:45,inventory:{...E.defaultInventory(),confirmed:true}}});
const title=c=>c.find(x=>x.type==='FlowScreen')?.props.title;
const primary=c=>c.find(x=>x.type==='Primary');
async function advance(c){await c.press(primary(c).props.label)}
async function reach(c,target){for(let n=0;n<24&&title(c)!==target;n++)await advance(c);assert.equal(title(c),target)}
// Field is an actual local component boundary in this hook harness, so exercise
// its onChange callback directly; full TextInput interaction is in RN Web tests.
async function input(c,label,value){const node=c.find(x=>x.props.label===label&&x.props.onChange);assert.ok(node,label);if(node.props.numeric){const numeric=harness('mobile/src/numeric-input.tsx',{value:node.props.value,nullable:node.props.nullable??false,max:node.props.max??9999,onValueChange:node.props.onChange});await numeric.flush();numeric.find(x=>x.type==='TextInput').props.onChangeText(value);await numeric.flush()}else node.props.onChange(value);await c.flush()}
async function journey(){
 const state=fresh();let draft,back,accepts=0;
 const c=harness('mobile/src/plan-setup-runtime.js',{state,onAccept:()=>{accepts++},onRegisterBack:v=>{back=v}},{'./storage':{readLocalSetup:async()=>null,saveLocalSetup:async v=>{S.readSetupDraft(JSON.stringify(v));draft=structuredClone(v)},clearLocalSetup:async()=>{draft=null}}});
 await c.flush();assert.equal(title(c),'About you');assert.equal(back(),false);
 await input(c,'Age','13');await advance(c);assert.equal(title(c),'About you');assert.match(c.text(),/14–100/);
 await input(c,'Age','28');await advance(c);assert.equal(title(c),'Your goal');
 await c.press('Strength');assert.equal(title(c),'Your goal','selection must not advance');
 assert.equal(back(),true);await c.flush();assert.equal(title(c),'About you');assert.equal(draft.profile.goal,'strength','Back retains choice');
 await reach(c,'Days per week');await c.press('7 days');await advance(c);assert.equal(title(c),'Days per week');assert.match(c.text(),/within your available weekdays/);
 await c.press('3 days');await reach(c,'Time per workout');await input(c,'Minutes per session · 15–120','14');await advance(c);assert.equal(title(c),'Time per workout');assert.match(c.text(),/15–120/);
 await input(c,'Minutes per session · 15–120','60');await reach(c,'Your training block');await input(c,'Training weeks · 2–12','1');await advance(c);assert.equal(title(c),'Your training block');
 await input(c,'Training weeks · 2–12','8');await reach(c,'Your training space');await c.press('Bodyweight + band');assert.equal(draft.profile.inventory.confirmed,false,'changing preset invalidates inventory confirmation');assert.equal(draft.step,2,'schema keeps coarse equipment position');
 await reach(c,'Your equipment');await advance(c);assert.equal(title(c),'Your equipment');assert.match(c.text(),/Confirm the equipment/);
 const survey=c.find(x=>x.type==='EquipmentSurvey');survey.props.onChange({...draft.profile.inventory,confirmed:true});await c.flush();await advance(c);assert.equal(title(c),'Movement preferences');
 assert.equal(accepts,0,'all wizard navigation is draft-only');assert.equal(state.profile.goal,'general','accepted profile was not mutated');
 // Restore the exact schema-1 draft rather than inventing a new step format.
 const restored=harness('mobile/src/plan-setup-runtime.js',{state,onAccept:()=>{}},{'./storage':{readLocalSetup:async()=>draft,saveLocalSetup:async()=>{},clearLocalSetup:async()=>{}}});
 await restored.flush();assert.equal(title(restored),'Your training space');assert.equal(restored.find(x=>x.props.label==='Bodyweight + band').props.selected,true);
}
async function blockedDraft(){
 let fail=true,writes=0;const c=harness('mobile/src/plan-setup-runtime.js',{state:fresh(),onAccept:()=>{throw Error('must not accept')}},{'./storage':{readLocalSetup:async()=>{if(fail)throw Error('read');return null},saveLocalSetup:async()=>{writes++},clearLocalSetup:async()=>{}}});
 await c.flush();assert.equal(primary(c).props.disabled,true);assert.equal(writes,0,'unreadable draft is never overwritten');fail=false;await c.press('Retry saved setup');assert.equal(primary(c).props.disabled,false);assert.equal(writes,1);
}
async function youthGuard(){
 const state=fresh();state.profile.age=16;state.profile.supervision=false;
 const c=harness('mobile/src/plan-setup-runtime.js',{state,onAccept:()=>{throw Error('must not accept')}},{'./storage':{readLocalSetup:async()=>null,saveLocalSetup:async()=>{},clearLocalSetup:async()=>{}}});
 await c.flush();await reach(c,'Training readiness');await advance(c);assert.equal(title(c),'Training readiness');assert.match(c.text(),/Qualified supervision/);
 await c.press('Qualified supervision is available');assert.equal(title(c),'Training readiness','supervision does not advance');
 await advance(c);assert.equal(title(c),'Choose your plan');
}
async function surveyJourney(){
 const profile={...fresh().profile};let changes=0;
 const c=harness('mobile/src/equipment-survey.tsx',{profile,section:'equipment',onChange:v=>{changes++;profile.inventory=v}});
 await c.flush();await c.press(`Machines · ${E.equipmentChoices.filter(x=>x[2]==='Machines').length} selected`);
 let allIds=new Set();
 for(let page=0;page<5;page++){
  const shown=E.equipmentChoices.filter(([,label,group])=>group==='Machines'&&c.all(x=>x.props.accessibilityRole==='button').some(x=>c.nodes(x).some(y=>y.props.children===label)));
  assert.ok(shown.length>0&&shown.length<=6,'machine choices have bounded pages');for(const [id] of shown)allIds.add(id);
  if(page<4)await c.press('More equipment');
 }
 assert.equal(allIds.size,E.equipmentChoices.filter(x=>x[2]==='Machines').length,'every machine is reachable');
 const item=E.equipmentChoices.find(x=>x[2]==='Machines'&&c.text().includes(x[1]));await c.press(item[1]);c.render();await c.flush();assert.equal(profile.inventory.confirmed,false);assert.ok(!profile.inventory.items.includes(item[0]));
 await c.press('Back to equipment groups');await c.press('Confirm this equipment list');assert.equal(profile.inventory.confirmed,true);
 const dumbbells=harness('mobile/src/equipment-survey.tsx',{profile,section:'dumbbells',onChange:v=>{profile.inventory=v}});await dumbbells.flush();await dumbbells.press('One dumbbell');assert.equal(profile.inventory.dumbbells,'single');assert.equal(profile.inventory.confirmed,false);assert.ok(changes>=2);
}
(async()=>{await journey();await blockedDraft();await youthGuard();await surveyJourney();console.log('PASS focused native setup callbacks: explicit progression/back, profile/age/frequency/time/block validation, no accepted-state mutation, legacy coarse draft restore, protected failed draft read/retry, youth supervision, all machine pages, inventory confirmation invalidation and single-dumbbell selection. Hook/storage boundaries mocked; no device claim.')})().catch(e=>{console.error(e);process.exitCode=1});
