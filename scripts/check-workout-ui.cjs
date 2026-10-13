const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts');
const cases=[];
function flatten(root){const nodes=[];function visit(node){if(Array.isArray(node))return node.forEach(visit);if(node&&typeof node==='object'){nodes.push(node);visit(node.props?.children)}}visit(root);return nodes}
function component(file,mocks={}){const module={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;const deps={'@/lib/training':T,'./ui/button':{Button:'Button'},'./ui/input':{Input:'Input'},'./set-metrics':{SetMetricsFields:'SetMetricsFields'},...mocks};new Function('require','module','exports',source)(name=>name in deps?deps[name]:require(name),module,module.exports);return module.exports}
const {WorkoutSetRow}=component('components/workout-set-row.tsx');
async function test(name,fn){await fn();cases.push(name);console.log('PASS '+name)}
function field(nodes,label){const node=nodes.find(node=>node.props?.['aria-label']===label);assert.ok(node,label);return node}
(async()=>{
 await test('Set core columns align with headers and each set owns its effort and extra measurements',()=>{
  const log={exerciseId:'squat',set:2,reps:8,kg:null,done:false,rir:null},exercise=T.exFor('squat');
  const row=WorkoutSetRow({exercise,log,units:'lb',busy:false,onChange:()=>{},onLog:()=>{}}),children=row.props.children;
  assert.deepEqual(children.slice(0,4).map(node=>node.type),['span','Input','Input','Button']);
  assert.match(children[1].props['aria-label'],/set 2 load$/);assert.match(children[2].props['aria-label'],/set 2 reps$/);assert.match(children[3].props['aria-label'],/^Log .* set 2$/);
  assert.equal(children[4].props.className,'field set-rir-field');
  const details=flatten(children[5]);assert.equal(details.find(node=>node.type==='SetMetricsFields').props.set,2);
 });
 await test('Actual set controls preserve unknown, zero and per-set RIR without touching another set',()=>{
  let state=workoutFixture();const index=0,exercise=T.exFor(state.active.sets[index].exerciseId);const {changeWorkoutSet}=load('lib/workout-log.ts');const before=JSON.stringify(state.active.sets.slice(1));
  const nodes=flatten(WorkoutSetRow({exercise,log:state.active.sets[index],units:'lb',busy:false,onChange:patch=>state=changeWorkoutSet(state,index,patch),onLog:()=>{}}));
  const loadField=field(nodes,`${exercise.name} set 1 load`);loadField.props.onChange({target:{value:'135'}});assert.equal(state.active.sets[0].kg,T.toKg(135,'lb'));
  loadField.props.onChange({target:{value:''}});assert.equal(state.active.sets[0].kg,null);loadField.props.onChange({target:{value:'0'}});assert.equal(state.active.sets[0].kg,0);
  loadField.props.onChange({target:{value:'-5'}});assert.equal(state.active.sets[0].kg,0);
  const rir=field(nodes,`${exercise.name} set 1 reps left`);rir.props.onChange({target:{value:'3'}});assert.equal(state.active.sets[0].rir,3);rir.props.onChange({target:{value:'0'}});assert.equal(state.active.sets[0].rir,0);rir.props.onChange({target:{value:'unknown'}});assert.equal(state.active.sets[0].rir,null);
  assert.equal(JSON.stringify(state.active.sets.slice(1)),before);
 });
 await test('Busy sets block every input and saved sets retain the undo path',()=>{
  const exercise=T.exFor('squat'),log={exerciseId:'squat',set:1,reps:8,kg:20,done:true,rir:2},changes=[];
  const nodes=flatten(WorkoutSetRow({exercise,log,units:'kg',busy:true,onChange:patch=>changes.push(patch),onLog:()=>assert.fail('Saved set logged twice')}));
  for(const node of nodes.filter(node=>['Input','select','fieldset','Button'].includes(node.type)))assert.equal(node.props.disabled,true);
  const editable=flatten(WorkoutSetRow({exercise,log,units:'kg',busy:false,onChange:patch=>changes.push(patch),onLog:()=>{}}));field(editable,`Undo ${exercise.name} set 1`).props.onClick();assert.deepEqual(changes,[{done:false}]);
 });
 await test('Timed tasks allow decimal amounts and omit resistance-only RIR',()=>{
  const exercise={...T.exFor('squat'),id:'synthetic-timed',name:'Timed activity',metric:'minutes'},changes=[];
  const nodes=flatten(WorkoutSetRow({exercise,log:{exerciseId:exercise.id,set:1,reps:0,kg:null,done:false},units:'kg',busy:false,onChange:patch=>changes.push(patch),onLog:()=>{}}));
  assert.ok(!nodes.some(node=>node.type==='select'));const amount=field(nodes,'Timed activity set 1 minutes');assert.equal(amount.props.step,'any');amount.props.onChange({target:{value:'2.5'}});assert.deepEqual(changes,[{reps:2.5}]);
 });
 await test('History groups show one exercise first, preserve partial sets and save only reviewed corrections',async()=>{
  const state=workoutFixture(),record={...state.active,id:'synthetic-record',finishedAt:2,partial:true};record.sets=record.sets.map((set,i)=>({...set,done:i===0}));state.history=[record];state.active=null;
  const hooks=[];let cursor=0,saved=null;const slot=initial=>{const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return i};
  const React={useState:initial=>{const i=slot(initial);return [hooks[i],value=>hooks[i]=typeof value==='function'?value(hooks[i]):value]},useId:()=>':history-fixture:'};
  const {HistoryEditor}=component('components/history-editor.tsx',{'react':React,'./history-set-rir':{HistorySetRir:'HistorySetRir'},'@/lib/history-edit':load('lib/history-edit.ts')});
  const render=()=>{cursor=0;return flatten(HistoryEditor({state,id:record.id,onCancel:()=>{},onSave:async edit=>{saved=edit;return true}}))};
  let nodes=render(),toggles=nodes.filter(node=>node.props?.className==='history-edit-exercise-toggle');assert.ok(toggles.length>1);assert.equal(toggles.filter(node=>node.props['aria-expanded']).length,1);toggles[1].props.onClick();nodes=render();assert.equal(nodes.filter(node=>node.props?.className==='history-edit-exercise-toggle'&&node.props['aria-expanded']).length,2);
  assert.equal(nodes.filter(node=>node.type==='Input'&&node.props['aria-label'].endsWith(' amount')).length,record.sets.length);
  const first=T.exFor(record.sets[0].exerciseId);field(nodes,`Edit ${first.name} set 1 amount`).props.onChange({target:{value:'9'}});nodes=render();let save=nodes.find(node=>node.type==='Button'&&node.props.children==='Review corrections');await save.props.onClick();assert.equal(saved,null);nodes=render();save=nodes.find(node=>node.type==='Button'&&node.props.children==='Save corrections');await save.props.onClick();assert.equal(saved.draft.sets[0].reps,9);assert.equal(saved.draft.sets[1].done,false);assert.equal(saved.draft.id,record.id);
 });
 await test('Returning setup skips repeated profile clicks but still blocks unconfirmed equipment and invalid coaching',()=>{
  const source=ts.createSourceFile('components/training-onboarding.tsx',fs.readFileSync('components/training-onboarding.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const create=(initial)=>{
   const hooks=[];let cursor=0,effects=[];const slot=initial=>{const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return i};
   const React={useState:initial=>{const i=slot(initial);return [hooks[i],value=>hooks[i]=typeof value==='function'?value(hooks[i]):value]},useRef:initial=>hooks[slot({current:initial})],useMemo:fn=>fn(),useEffect:(fn,deps)=>{const i=slot(undefined);if(!hooks[i]||!deps||deps.some((v,j)=>v!==hooks[i][j])){hooks[i]=deps;effects.push(fn)}}};
   const mocks={react:React};
   for(const statement of source.statements){if(!ts.isImportDeclaration(statement))continue;const name=statement.moduleSpecifier.text;if(name==='react')continue;if(name.startsWith('@/lib/')){mocks[name]=load('lib/'+name.slice('@/lib/'.length)+'.ts');continue}const exports={};for(const specifier of statement.importClause?.namedBindings?.elements||[])exports[specifier.propertyName?.text||specifier.name.text]=specifier.name.text;mocks[name]=exports;}
   const {TrainingOnboarding}=component('components/training-onboarding.tsx',mocks);
   const render=()=>{cursor=0;effects=[];const nodes=flatten(TrainingOnboarding({initial,events:[],basePlanId:'existing-plan',resume:false,reuseChoices:true,onCancel:()=>{},onAccept:()=>{},draftIO:{read:async()=>null,write:async()=>{},clear:async()=>{}}}));for(const effect of effects)effect();return nodes};
   render();return {render};
  };
  const savedWindow=global.window;global.window={scrollTo:()=>{}};
  try{
   const initial={...workoutFixture().profile,inventory:undefined},app=create(initial);let nodes=app.render();assert.ok(nodes.some(node=>node.type==='Button'&&node.props.children==='Review saved equipment'));
   nodes.find(node=>node.type==='Button'&&node.props.children==='Review saved equipment').props.onClick();nodes=app.render();assert.ok(nodes.some(node=>node.type==='h1'&&node.props.children==='Where will you train?'));
   nodes.find(node=>node.type==='Button'&&node.props.children==='Continue').props.onClick();nodes=app.render();assert.ok(nodes.some(node=>node.type==='h1'&&node.props.children==='Where will you train?'));assert.ok(nodes.some(node=>node.props?.role==='alert'));
   const youth=create({...initial,age:16,goal:'sport',mode:'app',supervision:false});nodes=youth.render();nodes.find(node=>node.type==='Button'&&node.props.children==='Review saved equipment').props.onClick();nodes=youth.render();assert.ok(nodes.some(node=>node.props?.role==='alert'));assert.ok(!nodes.some(node=>node.type==='h1'&&node.props.children==='Where will you train?'));
  }finally{global.window=savedWindow}
 });
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/workout-ui-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual JSX control handlers and domain update boundaries. Synthetic hook dependencies for history editor. No browser layout or rendered accessibility claim.',cases},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
