const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,workoutFixture}=require('./domain-test-loader.cjs'),{harness}=require('./check-native-interactions.cjs');
const T=load('lib/training.ts'),B=load('lib/reusable-plan.ts'),L=load('lib/block-starting-loads.ts');
const cases=[];
function fixture(){const s={...workoutFixture(),active:null};return B.savePlanCopy(s,s.plan.id,s.plan.version)}
async function test(name,fn){await fn();cases.push(name);console.log('PASS '+name)}
async function click(h,text){const node=h.find(x=>x.type==='Button'&&x.props.children===text);assert.ok(node,'missing '+text);assert.ok(!node.props.disabled);node.props.onClick();await h.flush()}
(async()=>{
 await test('Web entry requires review after editing and retains the same draft after a failed write',async()=>{
  const s=fixture();let writes=0,closed=0,fail=true,result;
  const h=harness('components/reuse-plan.tsx',{state:s,sourceId:s.saved[0].id,onClose:()=>closed++,onChange:async fn=>{writes++;if(fail)return false;result=fn(s);return true}},{'@/lib/training':T,'@/lib/reusable-plan':B,'@/lib/block-starting-loads':L,'@/lib/presentation':load('lib/presentation.ts'),'./ui/button':{Button:'Button'},'./ui/input':{Input:'Input'},'./ui/dialog':{Dialog:'Dialog',DialogContent:'DialogContent',DialogHeader:'DialogHeader',DialogTitle:'DialogTitle',DialogDescription:'DialogDescription'}});
  await h.flush();await click(h,'Preview reused block');
  let field=h.find(x=>x.props['aria-label']?.startsWith('Starting weight for '));assert.equal(field.props.value,'');field.props.onChange({target:{value:'45'}});await h.flush();
  await click(h,'Review starting weights');assert.equal(writes,0);assert.ok(h.text().includes('Starting weights'));
  await click(h,'Start this reviewed block · keep history');assert.equal(writes,1);assert.equal(closed,0);assert.match(h.text(),/draft is kept/);
  fail=false;await click(h,'Start this reviewed block · keep history');assert.equal(closed,1);assert.ok(result.plan.sessions.flatMap(x=>x.items).some(i=>Math.abs(i.kg-T.toKg(45,s.profile.units))<1e-6));assert.deepEqual(result.history,s.history);
 });
 await test('Web date edits discard prior weights and force a fresh schedule review',async()=>{
  const s=fixture(),h=harness('components/reuse-plan.tsx',{state:s,sourceId:s.saved[0].id,onClose(){},onChange:async()=>true},{'@/lib/training':T,'@/lib/reusable-plan':B,'@/lib/block-starting-loads':L,'@/lib/presentation':load('lib/presentation.ts'),'./ui/button':{Button:'Button'},'./ui/input':{Input:'Input'},'./ui/dialog':{Dialog:'Dialog',DialogContent:'DialogContent',DialogHeader:'DialogHeader',DialogTitle:'DialogTitle',DialogDescription:'DialogDescription'}});
  await h.flush();await click(h,'Preview reused block');h.find(x=>x.props['aria-label']?.startsWith('Starting weight for ')).props.onChange({target:{value:'30'}});await h.flush();h.find(x=>x.props['aria-label']==='Reused block starting date').props.onChange({target:{value:T.addDays(T.day(),14)}});await h.flush();assert.ok(!h.find(x=>x.props['aria-label']?.startsWith('Starting weight for ')));await click(h,'Preview reused block');assert.equal(h.find(x=>x.props['aria-label']?.startsWith('Starting weight for ')).props.value,'');
 });
 await test('Native parent reviews chosen weights before persistence and preserves a failed-save draft',async()=>{
  const s=fixture();let writes=0,accepted=0,fail=true,result;
  const h=harness('mobile/src/saved-plans.tsx',{state:s,onAccepted:()=>accepted++,onExport:async()=>{},onChange:async fn=>{writes++;if(fail)return false;result=fn(s);return true}},{'./block-starting-loads':{NativeBlockStartingLoads:'NativeBlockStartingLoads'}});
  await h.flush();await h.press('Review reuse of '+load('lib/presentation.ts').planName(s.saved[0]));await h.press('Preview full reused schedule');let child=h.find(x=>x.type==='NativeBlockStartingLoads'),r=L.blockStartingLoadRows(s,child.props.plan)[0];child.props.onEdit(r.key,{value:'55'});await h.flush();await h.press('Review starting weights');assert.equal(writes,0);
  await h.press('Start this reviewed block · keep history');assert.equal(writes,1);assert.equal(accepted,0);assert.match(h.text(),/draft is kept/);
  fail=false;await h.press('Start this reviewed block · keep history');assert.equal(accepted,1);assert.ok(result.plan.sessions.flatMap(x=>x.items).some(i=>Math.abs(i.kg-T.toKg(55,s.profile.units))<1e-6));assert.deepEqual(result.history,s.history);
 });
 await test('Native expandable controls use the real numeric and recorded-weight callbacks',async()=>{
  let s=fixture(),p=B.previewReusablePlan(s,s.saved[0].id,T.day()),r=L.blockStartingLoadRows(s,p.plan)[0];s={...s,history:[{id:'ui-reference',sessionId:'past',title:'Synthetic',date:T.addDays(T.day(),-1),startedAt:1,finishedAt:2,targets:[r.item],sets:Array.from({length:r.item.sets},(_,n)=>({exerciseId:r.exercise.id,set:n+1,reps:r.item.repMin??r.item.reps,kg:20,done:true,rir:3})),symptom:'no'}]};p=B.previewReusablePlan(s,s.saved[0].id,T.day());const edits=[];
  const h=harness('mobile/src/block-starting-loads.tsx',{state:s,plan:p.plan,draft:{},chosen:0,busy:false,onEdit:(key,patch)=>edits.push({key,patch})});await h.flush();assert.equal(h.all(x=>x.type==='TextInput').length,0);h.find(x=>x.props.accessibilityRole==='button'&&x.props.accessibilityState?.expanded===false).props.onPress();await h.flush();const field=h.find(x=>x.props.accessibilityLabel?.startsWith('Starting weight for '));assert.equal(field.props.keyboardType,'decimal-pad');field.props.onChangeText('35');assert.equal(edits[0].patch.value,'35');const recorded=h.find(x=>x.props.accessibilityLabel?.startsWith('Use recorded '));recorded.props.onPress();assert.ok(Math.abs(L.startingLoadValue(edits[1].patch.value,s.profile.units)-20)<1e-5);
 });
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/block-starting-loads-ui.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual web/native JSX callbacks with deterministic hook/OS boundaries, not rendered accessibility or installed-device acceptance.',cases},null,2)+'\n');
 console.log('PASS '+cases.length+' starting-weight callback journeys');
})().catch(e=>{console.error(e);process.exitCode=1});
