// Independent source-loaded scheduling invariant probe. No application edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const {createSourceLoader}=require(path.join(root,'scripts/lib/native-source-loader.cjs'));
const L=createSourceLoader(root),T=L.load(path.join(root,'lib/training.ts')),C=L.load(path.join(root,'lib/program-catalog.ts'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const sourceFiles=['lib/training.ts','lib/training-focus.ts','lib/program-catalog.ts','lib/program-evidence.ts','lib/exercise-library.json','lib/recipes.json','scripts/lib/native-source-loader.cjs'];
const fingerprint=Object.fromEntries(sourceFiles.map(file=>[file,hash(file)]));
let built=0,unavailable=0,combinations=0;const failures=[],byProgram={};
for(const d of C.programCatalog){byProgram[d.id]={profiles:0,built:0,unavailable:0};for(let mask=1;mask<128;mask++){
 const days=Array.from({length:7},(_,i)=>i).filter(i=>mask&(1<<i));if(days.length<d.days)continue;
 for(let start=0;start<7;start++){
  combinations++;byProgram[d.id].profiles++;
  const p={...T.blankProfile,age:d.youth?16:28,supervision:!!d.youth,experience:d.experience==='advanced'?'Experienced':'Some experience',establishedTraining:true,mode:'app',minutes:120,start:T.addDays('2026-10-04',start),weeks:3,goal:d.goal,programId:d.id,equipment:C.programEquipment(d),runBase:true,runDays:4,runMinutes:120,days};
  const r=T.buildPlan(p);if(!r.plan){unavailable++;byProgram[d.id].unavailable++;continue;}
  built++;byProgram[d.id].built++;const ss=r.plan.sessions;
  const fail=m=>failures.push({id:d.id,days,start:p.start,error:m});
  if(ss.length!==p.weeks*d.days)fail('Session count differs from weeks * program days');
  if(ss[0].title!==d.slots[0].title)fail('First session is not source slot zero');
  if(ss.some(s=>!days.includes(new Date(s.date+'T12:00:00').getDay())))fail('Session falls outside chosen weekdays');
  for(let i=0;i<ss.length;i++){
   const s=ss[i];if(s.week!==Math.floor(i/d.days)+1)fail('Training week differs from ordered slot cycle');
   if(s.minutes>p.minutes)fail('Generated session exceeds window');
   if(i&&ss[i-1].date>=s.date)fail('Dates are not strictly increasing');
   for(const dep of s.dependsOn||[]){const prior=ss.find(x=>x.id===dep);if(!prior||prior.date>=s.date)fail('Dependency is absent or not earlier');}
   const slot=d.rotation==='rolling-ab'?i%2:i%d.days;
   if(s.roleId!==d.id+'-'+slot||s.recoveryGroup!==d.slots[slot].group||s.title!==d.slots[slot].title)fail('Actual title, role or recovery group differs from ordered slot');
   for(let j=i+1;j<ss.length;j++){
    const other=ss[j];if(T.dayDistance(s.date,other.date)>=2)break;
    if(s.recoveryGroup===other.recoveryGroup&&!(d.id==='RNBASE4'&&s.recoveryGroup==='run'))fail('Comparable sessions violate app recovery-day rule');
   }
  }
 }
}}
const changed=sourceFiles.filter(file=>hash(file)!==fingerprint[file]);
if(changed.length)failures.push({error:'Sources changed while probe was running',files:changed});
const result={timestamp:new Date().toISOString(),sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceSHA256:fingerprint,scriptSHA256:hash('.sites-runtime/science-review/peer-schedule.cjs'),catalogPrograms:C.programCatalog.length,combinations,built,unavailable,byProgram,invariants:['full weeks * days session count','slot zero first','chosen weekdays','ordered week assignment','hard session window','strict date order','present earlier dependencies','actual slot title/role/recovery group including rolling A/B','app comparable-session recovery rule'],assumptions:{weeks:3,availability:'Every nonempty subset of Sunday-Saturday with sufficient days for the split',startDates:'2026-10-04 through 2026-10-10, one per weekday',minutes:120,equipment:'Matching catalog equipment',adults:'Age 28; some lifting experience, or experienced for advanced programs; established training',youth:'Age16 with qualified supervision reported',running:'Reported comfortable base, four recent running days and 120 easy minutes',events:[],focuses:[]},limits:['Source-level deterministic invariant check, not clinical or individual safety validation','Unavailable profiles are not asserted invalid for every possible training design','Three-week blocks omit later deload and higher-set weeks','No commitments, date proposals, feedback progression, physical devices or actual exercise outcomes tested in this sweep','RNBASE4 intentionally exempts the same-run recovery-day invariant; its separate rolling-window rule is not checked here'],failureCount:failures.length,failures:failures.slice(0,30)};
fs.writeFileSync(path.join(__dirname,'peer-schedule-result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({combinations,built,unavailable,failureCount:failures.length,changedSourceFiles:changed}));
if(failures.length)process.exitCode=1;
