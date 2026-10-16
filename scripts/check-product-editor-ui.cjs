// Executes actual JSX component callbacks; hooks/OS primitives are mocked.
// This is not a browser, React Native renderer, or physical-device test.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {load,workoutFixture}=require('./domain-test-loader.cjs'),{harness}=require('./check-native-interactions.cjs');
const T=load('lib/training.ts'),K=load('lib/tracking.ts'),P=load('lib/presentation.ts');
const cases=[];
function fixture(){const s=workoutFixture();s.active=null;s.schema=4;s.profile.mode='coach';s.plan.profile.mode='coach';s.plan.profile.minutes=1440;s.plan.sessions[0].items[0]={...s.plan.sessions[0].items[0],reps:8,repMin:8,repMax:12,kg:20,loadContext:'Synthetic machine A',loadRole:'owner',sourceRule:{kind:'double'},note:'Keep this owner cue'};return s;}
async function test(name,fn){await fn();cases.push(name);console.log('PASS '+name)}
const webMocks={'@/lib/training':T,'@/lib/tracking':K,'@/lib/presentation':P,'@/components/ui/button':{Button:'Button'},'@/components/ui/input':{Input:'Input'},'@/components/ui/checkbox':{Checkbox:'Checkbox'},'@/components/ui/dialog':{Dialog:'Dialog',DialogContent:'DialogContent',DialogHeader:'DialogHeader',DialogTitle:'DialogTitle',DialogDescription:'DialogDescription'}};
const nativeMocks={'./shared/training':T,'./shared/tracking':K,'./shared/presentation':P};
async function webPress(h,label,index=0){const node=h.all(n=>n.type==='Button'&&n.props.children===label)[index];assert.ok(node,'Missing web action '+label);assert.ok(!node.props.disabled);await node.props.onClick();await h.flush();}
(async()=>{
 for(const platform of ['web','native'])for(const moveNeighbor of [false,true])await test(platform+' tracks edited exercise through '+(moveNeighbor?'a neighboring row moving across it':'its own reorder')+' and retains metadata after failed save',async()=>{
  const state=fixture(),session=state.plan.sessions[0],original=structuredClone(session.items);let saved,fail=true,closed=0,writes=0;
  const web=platform==='web',props=web?{state,sessionId:session.id,onClose(){closed++},onApply:async next=>{writes++;saved=next;return !fail}}:{state,sessionId:session.id,onSave:async edit=>{writes++;const result=K.applyTrackingEdit(state,edit);saved=result.state;return result.error||(fail?'Synthetic write failure':undefined)}};
  const h=harness(web?'components/tracking-editor.tsx':'mobile/src/session-editor.tsx',props,web?webMocks:nativeMocks);await h.flush();
  if(web)await webPress(h,'Edit');else await h.press('Edit');
  const target=web?h.all(n=>n.type==='Input')[1]:h.find(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Target reps');assert.ok(target);if(web)target.props.onChange({target:{value:'10'}});else target.props.onChangeText('10');await h.flush();
  if(web){const id=moveNeighbor?original[1].exerciseId:original[0].exerciseId,direction=moveNeighbor?'up':'down';const button=h.find(n=>n.props['aria-label']===`Move ${T.exFor(id,state.custom).name} ${direction}`);button.props.onClick();await h.flush();await webPress(h,'Keep edited targets');}
  else {await h.press(moveNeighbor?'Move up':'Move down');await h.press('Keep edited targets');}
  assert.match(h.text(),/previous range is replaced by this single target/);
  if(web)await webPress(h,'Save reviewed targets');else await h.press('Save workout targets');
  assert.equal(writes,1);assert.equal(closed,0);assert.match(h.text(),web?/could not be saved/:/Synthetic write failure/);
  const expected=[original[1],{...original[0],reps:10,repMin:10,repMax:10},...original.slice(2)];assert.deepEqual(saved.plan.sessions[0].items,expected);assert.deepEqual(session.items,original);
  fail=false;if(web)await webPress(h,'Save reviewed targets');else await h.press('Save workout targets');assert.equal(writes,2);if(web)assert.equal(closed,1);assert.deepEqual(saved.plan.sessions[0].items,expected);
 });
 for(const platform of ['web','native'])await test(platform+' opening and keeping a target without edits preserves its accepted range and source fields',async()=>{
  const state=fixture(),session=state.plan.sessions[0],web=platform==='web';let saved;
  const props=web?{state,sessionId:session.id,onClose(){},onApply:async next=>{saved=next;return true}}:{state,sessionId:session.id,onSave:async edit=>{saved=K.applyTrackingEdit(state,edit).state}};
  const h=harness(web?'components/tracking-editor.tsx':'mobile/src/session-editor.tsx',props,web?webMocks:nativeMocks);await h.flush();if(web){await webPress(h,'Edit');await webPress(h,'Keep edited targets');await webPress(h,'Save reviewed targets');}else{await h.press('Edit');await h.press('Keep edited targets');await h.press('Save workout targets');}assert.strictEqual(saved,state);
 });
 for(const platform of ['web','native'])await test(platform+' cannot keep a conflicting per-set count edit and retains the open draft',async()=>{
  const state=fixture(),session=state.plan.sessions[0],item=session.items[0];item.setPlan=Array.from({length:item.sets},()=>({pair:'prescribed-pair',position:1,rest:90}));const web=platform==='web';let writes=0;
  const h=harness(web?'components/tracking-editor.tsx':'mobile/src/session-editor.tsx',web?{state,sessionId:session.id,onClose(){},onApply:async()=>{writes++;return true}}:{state,sessionId:session.id,onSave:async()=>{writes++}},web?webMocks:nativeMocks);await h.flush();if(web)await webPress(h,'Edit');else await h.press('Edit');
  const field=web?h.all(n=>n.type==='Input')[0]:h.find(n=>n.props.accessibilityLabel==='Sets');if(web)field.props.onChange({target:{value:String(item.sets+1)}});else field.props.onChangeText(String(item.sets+1));await h.flush();if(web)await webPress(h,'Keep edited targets');else await h.press('Keep edited targets');assert.match(h.text(),/per-set pairing or rest instructions/);assert.equal(writes,0);assert.ok(h.find(n=>web?n.type==='Button'&&n.props.children==='Cancel exercise edit':n.props.label==='Cancel exercise edit'));
 });
 await test('Web sources display exact media qualification and retain safe external links',async()=>{
  const exercise=T.exFor('bench'),verification='Synthetic source qualification: playback and exact variation are not independently verified.',guide={variant:'Synthetic guide',summary:'Readable summary',setup:['Setup'],execution:['Move'],finish:['Finish'],breathing:['Breathe'],commonErrors:['Avoid error'],easierOption:'Easier',safety:'Stop for pain',loadConvention:'Total load',sourceNote:'Owner source note',sourceURLs:['https://example.com/form','javascript:alert(1)','https://user:password@example.com/private']};
  const h=harness('components/exercise-guide.tsx',{exercise,guide,media:{verification,sourceUrl:'https://example.com/form'}},{'@/lib/public-path':{publicPath:x=>x},'@/lib/training':T,'lucide-react':{ExternalLink:'ExternalLink',BookOpen:'BookOpen'}});await h.flush();assert.ok(h.text().includes(verification));assert.ok(h.text().includes('Owner source note'));assert.ok(h.text().includes('Stop for pain'));const links=h.all(n=>n.type==='a');assert.ok(links.length);assert.ok(links.every(n=>n.props.href==='https://example.com/form'&&n.props.rel==='noopener noreferrer'));
 });
 const files=['lib/tracking.ts','lib/presentation.ts','lib/substitutions.ts','lib/plan-import-runtime.js','components/tracking-editor.tsx','mobile/src/session-editor.tsx','components/exercise-guide.tsx'];
 fs.mkdirSync('.sites-runtime/comprehensive-2026-10-16/product',{recursive:true});fs.writeFileSync('.sites-runtime/comprehensive-2026-10-16/product/fix-ui-receipt.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual JSX callbacks with deterministic mocked hooks/OS primitives; canonical modules injected while native snapshot sync is owned by the parent. No layout, screen-reader, installed-device or deployment claim.',cases,sourceHashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2)+'\n');
 console.log('PASS '+cases.length+' product editor/guide callback groups');
})().catch(e=>{console.error(e);process.exitCode=1});
