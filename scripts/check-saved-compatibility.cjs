const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const module={exports:{}};cache.set(name,module);
 const code=ts.transpileModule(fs.readFileSync(path.join('lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(spec=>spec.startsWith('./')?spec.endsWith('.json')?JSON.parse(fs.readFileSync(path.join('lib',spec),'utf8')):load(spec.slice(2)):require(spec),module,module.exports);
 return module.exports;
}
const T=load('training'),S=load('saved-data'),I=load('record-identity'),R=load('rest-timer');
let checks=0;const same=(actual,expected)=>{assert.deepEqual(actual,expected);checks++};
const ok=value=>{assert.ok(value);checks++};
const clone=value=>JSON.parse(JSON.stringify(value));
function fixture(){
 const s=clone(T.initialState()),session=s.plan.sessions[0],item=session.items[0];
 const workout={id:'legacy-workout-0',sessionId:session.id,title:session.title,date:session.date,startedAt:1,finishedAt:2,
  sets:[{exerciseId:item.exerciseId,set:1,reps:8,kg:null,done:true,metrics:{notes:'Recorded notes'}}],targets:[item],details:{[item.exerciseId]:{notes:'Keep notes'}}};
 s.history=[workout];
 s.proposals=[T.makeProposal(s,'sets')];
 s.proposals[0].changes=[{sessionId:session.id,patch:{title:session.title}}];
 s.events=[{id:'legacy-event',name:'Event',date:session.date,kind:'training',priority:'normal',minutes:10,provisional:false}];
 s.custom=[{id:'legacy-exercise',name:'Exercise',pattern:'Custom',equipment:'Custom',metric:'reps',cues:['Cues'],custom:true}];
 s.audit=[{at:'2026-10-09T20:00:00.000Z',message:'Historical message'}];
 s.equipmentCaps=[{exerciseId:item.exerciseId,setup:'rack',maxKg:100}];
 s.restTimer={id:'legacy-rest',workoutId:workout.id,setKey:item.exerciseId+':1',endAt:10000,pausedSeconds:null,alerted:false};
 session.runSteps=[{label:'Warm up',seconds:60}];
 return s;
}
const base=fixture();same(S.readSavedState(JSON.stringify(base)),base);
const padded=JSON.stringify(base)+' '.repeat(5_000_001);
assert.throws(()=>S.readSavedState(padded),/too large/);checks++;
same(S.readSavedState(padded,{maxChars:24_000_000}),base);
for(const maxChars of [0,24_000_001,Infinity,1.5]){assert.throws(()=>S.readSavedState(JSON.stringify(base),{maxChars}),/limit is unsupported/);checks++}
const unknownTargets=[
 s=>s,s=>s.profile,s=>s.plan,s=>s.plan.profile,s=>s.plan.sessions[0],s=>s.plan.sessions[0].items[0],s=>s.plan.sessions[0].runSteps[0],s=>s.plan.phases[0],
 s=>s.history[0],s=>s.history[0].sets[0],s=>s.history[0].sets[0].metrics,s=>s.history[0].targets[0],s=>Object.values(s.history[0].details)[0],
 s=>s.proposals[0],s=>s.proposals[0].patch,s=>s.proposals[0].changes[0],s=>s.proposals[0].changes[0].patch,
 s=>s.events[0],s=>s.custom[0],s=>s.audit[0],s=>s.equipmentCaps[0],s=>s.restTimer,
];
for(const target of unknownTargets){
 const state=clone(base);target(state).futureValue={critical:'Retain this field'};
 const before=JSON.stringify(state);
 assert.throws(()=>S.readSavedState(before),/cannot preserve/);checks++;
 same(JSON.stringify(state),before);
}
for(const schema of [1,3,'2']){
 const raw=JSON.stringify({...base,schema});
 assert.throws(()=>S.readSavedState(raw),/version is not supported/);checks++;
 same(JSON.parse(raw).schema,schema);
}
const draft={schema:1,basePlanId:null,baseEvents:'[]',profile:base.profile,events:[],step:0};
for(const add of [d=>d.futureValue=true,d=>d.profile.futureValue=true]){
 const value=clone(draft);add(value);const raw=JSON.stringify(value);
 assert.throws(()=>S.readSetupDraft(raw));checks++;same(JSON.stringify(value),raw);
}
// Legacy timers with malformed known values retain their existing bounded recovery behavior.
same(S.readSavedState(JSON.stringify({...base,restTimer:{id:'old',endAt:'invalid'}})).restTimer,null);
const legacy=clone(base);legacy.simulatedOffline=true;legacy.proposals[0].status='queued';
const normalized=S.readSavedState(JSON.stringify(legacy));
same(normalized.simulatedOffline,false);same(normalized.proposals[0].status,'stale');
same(normalized.history,legacy.history);same(normalized.plan,legacy.plan);
same(normalized.history[0].id,'legacy-workout-0');same(normalized.history[0].startedAt,1);
same(normalized.history[0].timeZone,undefined);
const beforeZone=process.env.TZ;
try{
 process.env.TZ='America/Chicago';
 const now=Date.parse('2026-11-01T06:30:00.000Z');
 const metadata=I.workoutTimeMetadata(now);
 same(metadata.startedAtUtc,'2026-11-01T06:30:00.000Z');same(metadata.timeZone,'America/Chicago');
 const state=clone(base);state.history[0]={...state.history[0],startedAt:now,finishedAt:now+60000,...metadata,...I.workoutFinishedAtUtc(now+60000)};
 process.env.TZ='Pacific/Auckland';
 const restored=S.readSavedState(JSON.stringify(state));same(restored.history[0],state.history[0]);
 same(restored.history[0].timeZone,'America/Chicago');
 for(const mutate of [
  w=>w.startedAtUtc='2026-11-01T06:31:00.000Z',w=>w.finishedAtUtc='2026-11-01T06:32:00.000Z',
  w=>delete w.finishedAt,w=>w.startedAtUtc='2026-11-01T01:30:00-05:00',w=>w.timeZone='Not/AZone',
 ]){const changed=clone(state);mutate(changed.history[0]);assert.throws(()=>S.readSavedState(JSON.stringify(changed)));checks++}
}finally{if(beforeZone===undefined)delete process.env.TZ;else process.env.TZ=beforeZone}
const ids=new Set(Array.from({length:1000},()=>T.uid('workout')));
same(ids.size,1000);
for(const id of ids)ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id));
ok(/^[0-9a-f-]{36}$/.test(R.startRest('legacy-workout','squat:1',60).id));
// Native injection avoids reliance on a browser or Node crypto implementation.
const nativeBytes=Uint8Array.from({length:16},(_,i)=>i),beforeBytes=new Uint8Array(nativeBytes);
I.configureRecordRandom(length=>{same(length,16);return nativeBytes});
same(I.recordUuid(),'00010203-0405-4607-8809-0a0b0c0d0e0f');same(nativeBytes,beforeBytes);
I.configureRecordRandom(()=>new Uint8Array(1));assert.throws(()=>I.recordUuid(),/invalid bytes/);checks++;
const standalone={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/record-identity.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('globalThis','module','exports',code)({},standalone,standalone.exports);
assert.throws(()=>standalone.exports.recordUuid(),/unavailable/);checks++;
const sharedSource=fs.readFileSync('lib/record-identity.ts','utf8');
ok(!/\b(?:window|document|require)\b|node:/.test(sharedSource));
const nativeEntry=fs.readFileSync('mobile/index.ts','utf8');
ok(nativeEntry.indexOf("import './src/record-platform'")<nativeEntry.indexOf("import App"));
console.log(`PASS ${checks} schema compatibility, preserved legacy identities, UTC/zone and UUID assertions.`);
