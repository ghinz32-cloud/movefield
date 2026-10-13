const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const C=load('lib/calendar.ts'),T=load('lib/training.ts'),cases=[];
function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
function flatten(root){const nodes=[];const visit=node=>{if(Array.isArray(node))return node.forEach(visit);if(node&&typeof node==='object'){nodes.push(node);visit(node.props?.children)}};visit(root);return nodes}
function renderer(state,initialDate,callbacks={}){
 const hooks=[];let cursor=0,effects=[],focused='';
 const slot=initial=>{const index=cursor++;if(index>=hooks.length)hooks[index]=typeof initial==='function'?initial():initial;return index};
 const React={useState:initial=>{const index=slot(initial);return [hooks[index],value=>hooks[index]=typeof value==='function'?value(hooks[index]):value]},useRef:initial=>hooks[slot({current:initial})],useId:()=>':calendar-fixture:',useLayoutEffect:fn=>effects.push(fn)};
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('components/calendar-browse.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mocks={'react':React,'./ui/button':{Button:'Button'},'@/lib/calendar':C,'@/lib/training':T,'@/lib/session-duration':load('lib/session-duration.ts'),'@/lib/presentation':load('lib/presentation.ts')};
 new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 const render=()=>{cursor=0;effects=[];const root=module.exports.CalendarBrowse({state,initialDate,onSession:()=>{},onHistory:()=>{},...callbacks}),nodes=flatten(root);for(const node of nodes)if(node.type==='button'&&node.props.ref)node.props.ref({focus:()=>{focused=node.props['aria-label']}});for(const effect of effects)effect();return nodes};
 return {render,focused:()=>focused};
}
function dateButton(nodes,date){return nodes.find(node=>node.type==='button'&&node.props['aria-label'].startsWith(T.niceDate(date)+'.'))}
function text(node){return Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:''}
function action(nodes,label){return nodes.find(node=>node.type==='Button'&&(node.props['aria-label']===label||text(node.props.children)===label))}
test('Month navigation clamps local dates across leap years, DST and December boundaries',()=>{
 for(const [date,offset,expected] of [['2024-01-31',1,'2024-02-29'],['2025-01-31',1,'2025-02-28'],['2026-03-31',-1,'2026-02-28'],['2026-12-31',1,'2027-01-31'],['2024-02-29',12,'2025-02-28'],['2026-03-08',1,'2026-04-08'],['2026-11-01',-1,'2026-10-01']])assert.equal(C.calendarMonthDate(date,offset),expected);
 assert.throws(()=>C.calendarMonthDate('2025-02-29',1),/valid/);assert.throws(()=>C.calendarMonthDate('2026-03-31',.5),/valid/);
 for(const weekStart of [0,1]){const dates=C.monthDates('2024-02-29',weekStart);assert.equal(dates.length,42);assert.equal(new Set(dates).size,42);assert.equal(new Date(dates[0]+'T12:00:00').getDay(),weekStart)}
});
test('Actual date clicks reveal scheduled, saved, partial and event records without mutating training',()=>{
 const fixture=workoutFixture(),date='2024-02-29',session={...fixture.plan.sessions[0],date},record={...fixture.active,date,finishedAt:12345,partial:true};
 const state={...fixture,plan:{...fixture.plan,sessions:[session]},history:[record],events:[{id:'synthetic-event',name:'Team practice',date,kind:'Team practice',priority:'Normal',minutes:60,provisional:false}]};
 const before=JSON.stringify(state),called=[],r=renderer(state,'2024-02-01',{onSession:x=>called.push(x),onHistory:x=>called.push(x),onAddEvent:x=>called.push(x)});
 let nodes=r.render();assert.equal(nodes.filter(node=>node.props?.role==='gridcell').length,42);assert.equal(nodes.filter(node=>node.type==='button'&&node.props.tabIndex===0).length,1);
 dateButton(nodes,date).props.onClick();nodes=r.render();assert.equal(dateButton(nodes,date).props['aria-pressed'],true);assert.equal(nodes.filter(node=>node.props?.role==='gridcell'&&node.props['aria-selected']).length,1);
 action(nodes,'Review workout').props.onClick();action(nodes,'View recorded workout').props.onClick();
 const add=nodes.find(node=>node.type==='Button'&&node.props.className==='calendar-add-event');add.props.onClick();assert.deepEqual(called,[session,record,date]);
 assert.ok(nodes.some(node=>node.type==='h4'&&node.props.children==='Team practice'));assert.equal(JSON.stringify(state),before);
 // An adjacent-month click updates both visible month and selected details.
 dateButton(nodes,'2024-03-01').props.onClick();nodes=r.render();assert.equal(dateButton(nodes,'2024-03-01').props.tabIndex,0);assert.ok(nodes.some(node=>node.type==='h2'&&/March/.test(node.props.children)));
});
test('Actual month controls, Today and keyboard navigation preserve one focused date',()=>{
 const r=renderer(workoutFixture(),'2024-01-31');let nodes=r.render();action(nodes,'Next month').props.onClick();nodes=r.render();assert.equal(dateButton(nodes,'2024-02-29').props['aria-pressed'],true);
 let prevented=false;dateButton(nodes,'2024-02-29').props.onKeyDown({key:'ArrowRight',preventDefault:()=>prevented=true});nodes=r.render();assert.ok(prevented);assert.equal(dateButton(nodes,'2024-03-01').props['aria-pressed'],true);assert.ok(r.focused().startsWith(T.niceDate('2024-03-01')));
 action(nodes,'Sunday first').props.onClick();nodes=r.render();dateButton(nodes,'2024-03-01').props.onKeyDown({key:'Home',preventDefault:()=>{}});nodes=r.render();assert.equal(dateButton(nodes,'2024-02-26').props['aria-pressed'],true);
 dateButton(nodes,'2024-02-26').props.onKeyDown({key:'PageDown',shiftKey:true,preventDefault:()=>{}});nodes=r.render();assert.equal(dateButton(nodes,'2025-02-26').props.tabIndex,0);
 action(nodes,'Today').props.onClick();nodes=r.render();assert.equal(dateButton(nodes,T.day()).props['aria-current'],'date');assert.equal(dateButton(nodes,T.day()).props['aria-pressed'],true);
});
test('Actual start and resume actions use the selected session and enforce current eligibility',()=>{
 const fixture=workoutFixture(),state={...fixture,active:null},session=state.plan.sessions[0],called=[];
 let r=renderer(state,T.day(),{onStart:x=>called.push(x)}),nodes=r.render(),start=action(nodes,'Start workout');assert.ok(start&&!start.props.disabled);start.props.onClick();assert.equal(called[0],session);
 r=renderer({...state,hold:true},T.day(),{onStart:()=>assert.fail('Held start')});nodes=r.render();assert.equal(action(nodes,'Start workout').props.disabled,true);
 r=renderer(state,T.day(),{busy:true,onStart:()=>{}});assert.equal(action(r.render(),'Start workout').props.disabled,true);
 r=renderer(fixture,T.day(),{onResume:()=>called.push('resume'),onStart:()=>{}});nodes=r.render();assert.ok(!action(nodes,'Start workout'));action(nodes,'Resume workout').props.onClick();assert.equal(called.at(-1),'resume');
});
test('Actual workspace places the calendar before setup cards and routes review/history/date callbacks',()=>{
 const page=fs.readFileSync('app/page.tsx','utf8'),section=page.slice(page.indexOf("{tab==='Calendar'"),page.indexOf("{tab==='Plans'"));assert.ok(section.indexOf('<CalendarBrowse')<section.indexOf('className="calendar-top"'));
 assert.match(section,/onSession=\{setInspectSession\}/);assert.match(section,/setEditingHistory\(false\);setHistoryWorkout\(w\)/);assert.match(section,/setEventDate\(date\);setEventOpen\(true\)/);assert.match(section,/Full schedule and event controls/);
});
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/web-calendar-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),timezone:process.env.TZ||'environment',scope:'Actual React component handlers and shared calendar with synthetic hook/storage boundaries. No browser layout, keyboard-device or rendered accessibility qualification.',cases},null,2)+'\n');
