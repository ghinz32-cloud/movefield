const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
// Loads lib/ modules the same way check-preferences.cjs does, then checks the training tools against hand-worked numbers.
const cache=new Map();function load(name){if(cache.has(name))return cache.get(name).exports;const m={exports:{}};cache.set(name,m);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path.join('lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(s=>s.startsWith('./')?(s.endsWith('.json')?JSON.parse(fs.readFileSync(path.join('lib',s.slice(2)),'utf8')):load(s.slice(2))):require(s),m,m.exports);return m.exports;}
const T=load('training'),X=load('training-tools');
let checks=0;const groups=[];
const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
function test(n,fn){fn();groups.push(n);console.log('PASS '+n)}
const r3=n=>Math.round(n*1000)/1000;

test('Plates: unknown stays unknown, zero is an error, and totals split into the largest plates per side',()=>{
 same(X.platesForLoad(null,'kg',20).status,'unknown');
 same(X.platesForLoad(0,'kg',20).status,'error');
 same(X.platesForLoad(19,'kg',20).status,'error');
 const bar=X.platesForLoad(20,'kg',20);same(bar.status,'ok');same(bar.perSide,[]);same(bar.exact,true);
 same(X.platesForLoad(60,'kg',20).perSide,[{weight:20,count:1}]);
 const p100=X.platesForLoad(100,'kg',20);same(p100.perSide,[{weight:25,count:1},{weight:15,count:1}]);same(p100.exact,true);
 same(X.platesForLoad(62.5,'kg',20).perSide,[{weight:20,count:1},{weight:1.25,count:1}]);
 const short=X.platesForLoad(83.3,'kg',20);same(short.exact,false);same(short.achieved,82.5);same(short.shortBy,0.8);
 const lb=X.platesForLoad(135,'lb',45);same(lb.perSide,[{weight:45,count:1}]);same(lb.exact,true);
 same(X.platesForLoad(60,'kg',20,[25,20]).perSide,[{weight:20,count:1}],'a custom plate list is respected');
});

test('Warm-up ladder: percentages of the working load, rounded to loadable steps, bar floor, adults only',()=>{
 const barbell=(w,unit='kg',bar=20)=>X.warmupLadder(w,{unit,kind:'barbell',bar,adult:true});
 same(X.warmupLadder(null,{unit:'kg',kind:'barbell',bar:20,adult:true}).status,'unknown');
 same(X.warmupLadder(100,{unit:'kg',kind:'barbell',bar:20,adult:false}).status,'not-available');
 same(barbell(100).rows.map(r=>r.load),[40,60,75,85]);
 same(barbell(40).rows.map(r=>[r.load,r.barOnly]),[[20,true],[25,false],[30,false],[35,false]],'a warm-up under the bar becomes bar only');
 same(X.warmupLadder(20,{unit:'kg',kind:'dumbbell',bar:0,adult:true}).rows.map(r=>r.load),[8,12,16,18],'dumbbell loads are per hand, in 2 kg steps');
 same(barbell(225,'lb',45).rows.map(r=>r.load),[90,135,170,190],'pound loads round to 5 lb');
 same(barbell(10).status,'error','a working load under the bar is an error');
 same(barbell(100).rows.map(r=>r.reps),[5,3,2,1]);
});

test('Personal bests need an earlier rated estimate, are adult-only, and are not awarded for lower results',()=>{
 const ex=T.exercises.find(e=>e.loadTracked&&!e.requiresSetup&&e.metric==='reps'&&e.progressionEnabled);
 ok(ex,'a load-tracked, rep-based, progression-enabled exercise exists');
 const mk=(id,date,kg,reps,rir=1)=>({id,sessionId:'s-'+id,title:'Check',date,startedAt:999,finishedAt:1000,sets:[{exerciseId:ex.id,set:1,reps,kg,done:true}],rir:{[ex.id]:rir},symptom:'no'});
 const s0=T.initialState();
 const adult={...s0,profile:{...s0.profile,age:28}};
 const a=mk('a','2026-09-01',100,5),b=mk('b','2026-09-08',105,5),c=mk('c','2026-09-15',90,5),d=mk('d','2026-09-20',130,5,undefined);
 const s1={...adult,history:[a,b]};
 same(X.personalBests(s1,'a'),[],'the first estimate is a baseline, not a record');
 const pb=X.personalBests(s1,'b');
 same(pb.map(p=>[p.exerciseId,p.estimate,p.previous]),[[ex.id,r3(105*(1+5/30)),r3(100*(1+5/30))]]);
 same(X.personalBests({...adult,history:[a,b,c]},'c'),[],'a lower estimate is not a personal best');
 same(X.personalBests({...adult,history:[a,b,{...d,rir:{}}]},'d'),[],'a set without a rated effort gives no estimate');
 same(X.personalBests({...adult,profile:{...s0.profile,age:16},history:[a,b]},'b'),[],'people under 18 get no estimated bests');
});

test('Weekly review counts the seven days ending today from the plan; today stays open until it ends',()=>{
 const s0=T.initialState();
 const sess=(id,date)=>({...s0.plan.sessions[0],id,date});
 const plan={...s0.plan,paused:false,sessions:[sess('a','2026-10-01'),sess('b','2026-10-03'),sess('c','2026-10-05'),sess('d','2026-10-07'),sess('old','2026-09-20')]};
 const done=(id,sessionId,date,sets,partial=false)=>({id,sessionId,title:'T',date,startedAt:1,finishedAt:2,partial,sets:Array.from({length:sets},(_,i)=>({exerciseId:'x',set:i+1,reps:5,kg:null,done:true})),symptom:'no'});
 const history=[done('h1','a','2026-10-01',3),done('h2','c','2026-10-05',2,true),done('h3','zz','2026-10-06',1),done('h4','old','2026-09-20',4)];
 const state={...s0,plan,history};
 const r=X.weeklyReview(state,'2026-10-07');
 same({start:r.start,planned:r.planned,completed:r.completed,partial:r.partial,missed:r.missed,setsLogged:r.setsLogged,otherWorkouts:r.otherWorkouts,streak:r.streak},{start:'2026-10-01',planned:4,completed:2,partial:1,missed:1,setsLogged:6,otherWorkouts:1,streak:1});
 same(X.weeklyReview({...state,plan:{...plan,paused:true}},'2026-10-07'),{start:'2026-10-01',end:'2026-10-07',paused:true,planned:4,completed:2,partial:1,missed:0,setsLogged:6,otherWorkouts:1,streak:null},'a paused plan does not count misses or a streak');
 same(X.weeklyReview({...state,plan:null},'2026-10-07'),null,'no plan, no review');
});

console.log(`${groups.length} groups, ${checks} checks passed.`);
