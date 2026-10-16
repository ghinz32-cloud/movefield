// Shared prescription and presentation regression checks. Synthetic data only.
const assert=require('node:assert/strict');
const {load,workoutFixture}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),K=load('lib/tracking.ts'),P=load('lib/presentation.ts'),D=load('lib/saved-data.ts');
let groups=0;
function test(name,fn){fn();groups++;console.log('PASS '+name)}
function fixture(){
 const s=workoutFixture();s.schema=4;s.active=null;s.profile={...s.profile,mode:'coach',minutes:1440};s.plan={...s.plan,profile:{...s.plan.profile,mode:'coach',minutes:1440}};
 const first=s.plan.sessions[0];first.minutes=45;first.items[0]={...first.items[0],reps:8,repMin:8,repMax:12,kg:20,loadContext:'Owner setup A',loadRole:'owner-assistance',sourceRule:{kind:'double',minRir:2},note:'Preserve this owner instruction',supersetGroup:'owner-group',supersetPosition:1};
 s.history=[{id:'synthetic-retained-history',sessionId:'old-session',title:'Saved original',date:T.addDays(T.day(),-1),startedAt:1,finishedAt:2,targets:structuredClone(first.items),sets:[]}];
 return s;
}
function edit(s,items=s.plan.sessions[0].items){return {planId:s.plan.id,version:s.plan.version,sessionId:s.plan.sessions[0].id,items:structuredClone(items),allowLonger:true}}
function apply(s,e){const r=K.applyTrackingEdit(s,e);assert.equal(r.error,undefined);return r.state}

test('Unchanged coach prescriptions round-trip every field and do not create a plan revision',()=>{
 const s=fixture(),before=JSON.stringify(s),p=K.previewTrackingEdit(s,edit(s));assert.deepEqual(p.errors,[]);assert.deepEqual(p.warnings,[]);assert.deepEqual(p.items,s.plan.sessions[0].items);assert.equal(p.minutes,45);assert.strictEqual(apply(s,edit(s)),s);assert.equal(JSON.stringify(s),before);
 const restored=D.readSavedState(JSON.stringify(s));assert.deepEqual(K.previewTrackingEdit(restored,edit(restored)).items,restored.plan.sessions[0].items);
});
test('Reordering and a minimal legacy editor payload preserve accepted metadata, history and owner authority',()=>{
 const s=fixture(),before=JSON.stringify(s),items=s.plan.sessions[0].items;
 const reordered=[items[1],items[0],...items.slice(2)].map(({exerciseId,sets,reps,rest})=>({exerciseId,sets,reps,rest,kg:null}));
 const next=apply(s,edit(s,reordered));assert.deepEqual(next.plan.sessions[0].items,[items[1],items[0],...items.slice(2)]);assert.equal(next.plan.sessions[0].minutes,45);assert.equal(next.plan.profile.mode,'coach');assert.strictEqual(next.history,s.history);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(D.readSavedState(JSON.stringify(next)).plan.sessions[0].items,next.plan.sessions[0].items);
});
test('A deliberate rep-range replacement previews before/after and changes only that target',()=>{
 const s=fixture(),e=edit(s);e.items[0].reps=10;const p=K.previewTrackingEdit(s,e);assert.deepEqual(p.errors,[]);assert.equal(p.warnings.length,1);assert.match(p.warnings[0],/8–12.*10.*previous range is replaced/);
 const next=apply(s,e),expected={...s.plan.sessions[0].items[0],reps:10,repMin:10,repMax:10};assert.deepEqual(next.plan.sessions[0].items[0],expected);assert.deepEqual(next.plan.sessions[0].items.slice(1),s.plan.sessions[0].items.slice(1));assert.deepEqual(next.plan.sessions.slice(1),s.plan.sessions.slice(1));assert.strictEqual(next.history,s.history);
 const restOnly=edit(s);restOnly.items[0].rest+=15;assert.equal(K.previewTrackingEdit(s,restOnly).items[0].repMax,12);
 const changed=K.reviseTrackingTarget(s.plan.sessions[0].items[0],{...s.plan.sessions[0].items[0],reps:10});assert.equal(changed.kg,20);assert.equal(changed.repMax,10);
});
test('Paired prescriptions survive unchanged/reorder; conflicting count/rest/partial removal is rejected',()=>{
 const s=fixture(),items=s.plan.sessions[0].items;for(let n=0;n<2;n++){items[n].sets=2;items[n].setPlan=[1,2].map(()=>({pair:'synthetic-pair',position:n+1,rest:90}));}
 assert.deepEqual(K.previewTrackingEdit(s,edit(s)).errors,[]);assert.deepEqual(K.previewTrackingEdit(s,edit(s,[items[1],items[0],...items.slice(2)])).items[1].setPlan,items[0].setPlan);
 for(const field of ['sets','rest']){const e=edit(s);e.items[0][field]++;const result=K.applyTrackingEdit(s,e);assert.match(result.error,/per-set pairing/);assert.strictEqual(result.state,s);}
 const partial=K.applyTrackingEdit(s,edit(s,items.slice(1)));assert.match(partial.error,/part of a paired-set prescription/);assert.strictEqual(partial.state,s);
 assert.deepEqual(K.previewTrackingEdit(s,edit(s,items.slice(2))).errors,[],'Removing both paired exercises leaves no orphan pairing.');
 const repEdit=edit(s);repEdit.items[0].reps++;assert.deepEqual(K.previewTrackingEdit(s,repEdit).items[0].setPlan,items[0].setPlan);
});
test('Existing supported large targets are retained while newly entered targets keep editor bounds',()=>{
 const s=fixture(),i=s.plan.sessions[0].items[0];i.sets=21;i.reps=1000;i.repMin=1000;i.repMax=1001;assert.deepEqual(K.previewTrackingEdit(s,edit(s)).errors,[]);assert.strictEqual(apply(s,edit(s)),s);
 assert.equal(K.trackingTargetError({...i,rest:30},i,'reps'),undefined);assert.match(K.trackingTargetError({...i,sets:22},i,'reps'),/1–20 sets/);assert.match(K.trackingTargetError({...i,reps:1002},i,'reps'),/999/);
});
test('Repeated scope copies explicitly reviewed full prescriptions and skips active/finished work',()=>{
 const s=fixture(),base=s.plan.sessions[0],clone=(id,n)=>({...structuredClone(base),id,date:T.addDays(base.date,n),items:base.items.map(i=>({...i,kg:7,note:'Different later prescription'}))});
 s.plan.sessions=[base,clone('later-review',7),clone('active-later',14),clone('finished-later',21)];s.active={id:'different-active',sessionId:'active-later',title:'Started',date:s.plan.sessions[2].date,startedAt:3,sets:[]};s.history.push({id:'finished-record',sessionId:'finished-later',title:'Saved',date:s.plan.sessions[3].date,startedAt:4,finishedAt:5,sets:[]});
 const e={...edit(s),repeatWeekday:true},p=K.previewTrackingEdit(s,e);assert.deepEqual(p.sessions.map(x=>x.id),[base.id,'later-review']);assert.ok(p.warnings.some(x=>/complete listed prescriptions.*loads, setups, notes/.test(x)));
 const next=apply(s,e);assert.deepEqual(next.plan.sessions[1].items,base.items);assert.deepEqual(next.plan.sessions.slice(2),s.plan.sessions.slice(2));assert.strictEqual(next.history,s.history);assert.strictEqual(next.active,s.active);
});
test('Exact interval instructions cannot be left stale by a duration edit or different repeat-day target',()=>{
 const s=fixture(),base=s.plan.sessions[0];base.items.push({exerciseId:'run',sets:1,reps:10,rest:0,kg:null});base.runSteps=[{label:'Run',seconds:600}];
 assert.deepEqual(K.previewTrackingEdit(s,edit(s)).errors,[]);const e=edit(s);e.items.at(-1).reps=12;const r=K.applyTrackingEdit(s,e);assert.match(r.error,/timed interval instructions/);assert.strictEqual(r.state,s);
 const strengthEdit=edit(s);strengthEdit.items[0].reps=10;assert.deepEqual(K.previewTrackingEdit(s,strengthEdit).errors,[]);
 const later=structuredClone(base);later.id='later-interval';later.date=T.addDays(base.date,7);later.items.at(-1).reps=20;later.runSteps=[{label:'Run',seconds:1200}];s.plan.sessions.push(later);
 assert.match(K.applyTrackingEdit(s,{...edit(s),repeatWeekday:true}).error,/timed interval instructions/);
});
test('Stale, completed, active, app-owned and invalid duplicate edits retain the exact state',()=>{
 const s=fixture(),e=edit(s);for(const [state,request] of [[{...s,plan:{...s.plan,version:s.plan.version+1}},e],[{...s,plan:{...s.plan,profile:{...s.plan.profile,mode:'app'}}},e],[{...s,active:{sessionId:e.sessionId}},e],[s,{...e,items:[e.items[0],e.items[0]]}],[s,{...e,items:[]}]] ){const r=K.applyTrackingEdit(state,request);assert.ok(r.error);assert.strictEqual(r.state,state);}
 const complete=structuredClone(s);complete.plan.sessions[0].status='completed';assert.ok(K.applyTrackingEdit(complete,e).error);
});
test('Newest-first history is independent of saved array order and never mutates records',()=>{
 const make=(id,date,startedAt,finishedAt)=>({id,sessionId:id,title:id,date,startedAt,finishedAt,sets:[]}),rows=[make('old','2026-10-01',100,200),make('b','2026-10-02',300,400),make('a','2026-10-02',300,400),make('later-finish','2026-10-02',500,600),make('date-first','2026-10-03',1,2)];
 const expected=['date-first','later-finish','a','b','old'];for(const list of [rows,[...rows].reverse(),[rows[2],rows[0],rows[4],rows[1],rows[3]]]){Object.freeze(list);const before=JSON.stringify(list),sorted=P.newestFirstWorkouts(list);assert.deepEqual(sorted.map(x=>x.id),expected);assert.equal(JSON.stringify(list),before);assert.ok(sorted.every(x=>list.includes(x)));}
 const afterAppend=[...rows,make('newest','2026-10-04',700,800)];assert.equal(P.newestFirstWorkouts(afterAppend)[0].id,'newest');
});
console.log('PASS '+groups+' shared tracking/history integrity groups');
