// Executes preserved score semantics and a bounded-history work-count check; no device speed claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const D=require(path.resolve('scripts/domain-test-loader.cjs')),T=D.load('lib/training.ts');
const next=D.load('lib/progress.ts');
// Independent pre-optimization reference retained for behavior equivalence, ca96011.
const old={strengthIndex:(()=>{const _training=T,estimatedMax=next.estimatedMax;
function strengthIndex(s) {
    var records = s.history.filter(w => w.finishedAt).sort((a, b) => a.date.localeCompare(b.date) || (a.finishedAt || a.startedAt) - (b.finishedAt || b.startedAt));
    if (s.profile.age < 18 || !records.length)
        return {
            basket: [],
            points: [],
            current: null
        };
    var eligibleRecords = records.filter(w => w.sets.some(x => {
        var e = (0, _training.exFor)(x.exerciseId, s.custom);
        return (0, _training.isLoadTracked)(e) && !(0, _training.requiresSetup)(e) && e.progressionEnabled && estimatedMax(w, x.exerciseId) !== null;
    }));
    if (!eligibleRecords.length)
        return {
            basket: [],
            points: [],
            current: null
        };
    var first = eligibleRecords[0].date;
    var eligible = id => {
        var e = (0, _training.exFor)(id, s.custom);
        return (0, _training.isLoadTracked)(e) && !(0, _training.requiresSetup)(e) && e.metric === 'reps' && e.progressionEnabled;
    };
    var ids = [...new Set(records.flatMap(w => w.sets.map(x => x.exerciseId)))].filter(eligible);
    var windowStart = eligibleRecords.find(candidate => ids.filter(id => records.filter(w => w.date >= candidate.date && (0, _training.dayDistance)(candidate.date, w.date) <= 14 && estimatedMax(w, id) !== null).length >= 2).length >= 3);
    if (windowStart)
        first = windowStart.date;
    var basket = ids.filter(id => records.filter(w => (0, _training.dayDistance)(first, w.date) >= 0 && (0, _training.dayDistance)(first, w.date) <= 14 && estimatedMax(w, id) !== null).length >= 2).slice(0, 3);
    if (basket.length < 3)
        return {
            basket,
            points: [],
            current: null
        };
    var baseline = Object.fromEntries(basket.map(id => {
        var values = records.filter(w => (0, _training.dayDistance)(first, w.date) >= 0 && (0, _training.dayDistance)(first, w.date) <= 14).map(w => estimatedMax(w, id)).filter(n => n !== null).slice(0, 2);
        return [id, (values[0] + values[1]) / 2];
    }));
    var points = [...new Set(records.filter(w => (0, _training.dayDistance)(first, w.date) >= 14).map(w => w.date))].map(date => {
        var ratios = basket.map(id => {
            var r = records.filter(w => w.date <= date && (0, _training.dayDistance)(w.date, date) <= 21 && estimatedMax(w, id) !== null).at(-1);
            return r ? estimatedMax(r, id) / baseline[id] : null;
        });
        return {
            date,
            label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            index: ratios.some(x => x === null) ? null : Math.round(ratios.reduce((a, b) => a + b, 0) / 3 * 100)
        };
    });
    var currentRatios = basket.map(id => {
        var r = records.filter(w => w.date <= (0, _training.day)() && (0, _training.dayDistance)(w.date, (0, _training.day)()) <= 21 && estimatedMax(w, id) !== null).at(-1);
        return r ? estimatedMax(r, id) / baseline[id] : null;
    });
    return {
        basket,
        points,
        current: currentRatios.some(x => x === null) ? null : Math.round(currentRatios.reduce((a, b) => a + b, 0) / 3 * 100)
    };
}
return strengthIndex;})()};let seed=812631,rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296},pick=a=>a[Math.floor(rng()*a.length)],checks=0;
function eq(s,label){const before=JSON.stringify(s);assert.deepEqual(next.strengthIndex(s),old.strengthIndex(s),label);assert.equal(JSON.stringify(s),before,label+' input immutable');checks++}
const today=T.day(),make=(n,gap=1)=>{const s=D.workoutFixture();s.active=null;s.profile.age=30;s.history=Array.from({length:n},(_,i)=>({id:'history-'+i,sessionId:'session-'+i,title:'Synthetic',date:T.addDays(today,-n*gap+i*gap),startedAt:100+i,finishedAt:200+i,symptom:'no',sets:['bench','squat','rdl'].map(exerciseId=>({exerciseId,set:1,reps:8,kg:50,done:true,rir:1}))}));return s};
for(let n=0;n<100;n++){const s=make(Math.floor(rng()*50),1);s.profile.age=pick([14,17,18,30]);s.history.forEach(w=>{w.date=T.addDays(today,Math.floor(rng()*100)-80);w.partial=rng()<.12;w.symptom=pick(['no','no','no','yes',undefined]);if(rng()<.08)w.finishedAt=undefined;w.sets=Array.from({length:Math.ceil(rng()*8)},(_,i)=>({exerciseId:pick(['bench','squat','rdl','pulldown','pushup','run']),set:i+1,reps:pick([0,1,5,8,10,11]),kg:pick([null,0,20,40,65]),done:rng()>.1,rir:pick([undefined,null,0,1,2,3,6]),...(rng()<.25?{metrics:{side:pick(['Both','Left','Right','Alternating']),assistanceKg:pick([0,10])}}:{})}));});eq(s,'seeded-'+n)}
for(const gap of [1,7,14,15,21,22,30])for(const count of [1,2,3,6,28])eq(make(count,gap),'boundary-'+count+'-'+gap);
const late=make(50);late.history.slice(0,25).forEach(w=>w.sets=w.sets.slice(0,2));eq(late,'baseline starts later');eq({...late,history:[...late.history].reverse()},'reordered');const oldInsert=structuredClone(late);oldInsert.history.push(...make(6).history.map((w,i)=>({...w,id:'older'+i,date:T.addDays(today,-100+i)})));eq(oldInsert,'older inserted baseline');
const future=make(30);future.history.forEach((w,i)=>w.date=T.addDays(today,i+1));eq(future,'future points do not supply current');const tied=make(40);tied.history.forEach((w,i)=>{w.date=T.addDays(today,-20+Math.floor(i/2));w.sets[0].kg=30+i});eq(tied,'same-date finish ordering');const unknown=make(30);unknown.history.forEach(w=>{w.partial=true;w.sets.forEach(x=>x.kg=null)});eq(unknown,'unknown partial records cannot establish baseline');const frozen=make(30);const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}};freeze(frozen);eq(frozen,'frozen input');
const b=make(1000);const startOld=performance.now(),reference=old.strengthIndex(b),oldMs=performance.now()-startOld,startNew=performance.now(),actual=next.strengthIndex(b),newMs=performance.now()-startNew;assert.deepEqual(actual,reference);checks++;
const large=make(5000);D.load('lib/saved-data.ts').readSavedState(JSON.stringify(large));let distanceCalls=0;const runtime=fs.readFileSync('lib/progress-runtime.js','utf8'),start=runtime.indexOf('function strengthIndex(s) {'),end=runtime.indexOf('export { volume };',start);assert.ok(start>=0&&end>start);const measuredIndex=new Function('_training','estimatedMax',runtime.slice(start,end)+';return strengthIndex;')({...T,dayDistance:(...args)=>{distanceCalls++;return T.dayDistance(...args)}},next.estimatedMax);const largeStart=performance.now(),result=measuredIndex(large),largeMs=performance.now()-largeStart;assert.deepEqual(result,next.strengthIndex(large),'Instrumented canonical function matches normal module execution');assert.ok(distanceCalls>=5000&&distanceCalls<=5001,'Date-distance work is actually observed and bounded by distinct dates, not record pairs: '+distanceCalls);assert.equal(result.points.length,4986);assert.equal(result.current,100);assert.ok(result.points.every(p=>p.index===100));checks++;
const receipt={checkedAt:new Date().toISOString(),checks,performance:{records1000:{baselineMs:oldMs,candidateMs:newMs},records5000:{candidateMs:largeMs,points:result.points.length,dateDistanceCalls:distanceCalls}},scope:'Reference-equivalent strength-index calculations; seeded and boundary synthetic histories, saved-parser validation for5000-record ceiling, unchanged input. Local Node timing excludes UI, OS, encryption and module initialization.'};if(process.env.PROGRESS_AUDIT_RECEIPT)fs.writeFileSync(process.env.PROGRESS_AUDIT_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
