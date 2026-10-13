const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const site=process.argv[2]||path.resolve(__dirname,'..');
const requireSite=createRequire(path.join(site,'package.json'));
const ts=requireSite('typescript'),cache=new Map();
function load(name){if(cache.has(name))return cache.get(name).exports;const file=path.join(site,'lib',name+'.ts');const module={exports:{}};cache.set(name,module);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;const localRequire=(spec)=>spec.startsWith('./')?spec.endsWith('.json')?JSON.parse(fs.readFileSync(path.join(site,'lib',spec),'utf8')):load(spec.slice(2)):requireSite(spec);new Function('require','module','exports',code)(localRequire,module,module.exports);return module.exports;}
const T=load('training'),O=load('onboarding'),D=load('experienced-demo'),S=load('saved-data');
const results=[],compatibility=[];function test(name,fn){try{fn();results.push({name,status:'pass'});}catch(error){results.push({name,status:'FAIL',error:error.issues||error.message});}}
const clone=x=>JSON.parse(JSON.stringify(x));
for(const [name,make] of [['initial',T.initialState],['fresh',O.freshState],['experienced sample',D.experiencedDemo]])test(name+' state round trips without changed data',()=>{const x=clone(make());assert.deepEqual(S.readSavedState(JSON.stringify(x)),x);});
const x=clone(T.initialState());
function activeState(){const s=clone(T.initialState()),ss=s.plan.sessions[0];s.active={id:'test-workout',sessionId:ss.id,title:ss.title,date:ss.date,startedAt:Date.now(),sets:ss.items.flatMap(i=>Array.from({length:i.sets},(_,n)=>({exerciseId:i.exerciseId,set:n+1,reps:i.reps,kg:i.kg,done:false}))),targets:ss.items,loadContext:{},rir:{}};return s;}
test('valid active workout and rest timers round trip',()=>{const s={...activeState(),restEnd:Date.now()+60000,restPaused:null};assert.deepEqual(S.readSavedState(JSON.stringify(s)),s);});
test('mismatched active session rejected',()=>{const s=activeState();s.active.sessionId='missing';assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
test('active workout without a plan rejected',()=>{const s=activeState();s.plan=null;assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
test('unknown root, profile and workout fields rejected without a lossy save',()=>{for(const add of [s=>s.authorized=true,s=>s.profile.admin=true,s=>s.active.cloudToken='sample']){const s=activeState();add(s);const raw=JSON.stringify(s);assert.throws(()=>S.readSavedState(raw),/cannot preserve/);assert.equal(JSON.stringify(s),raw);}});
for(const key of ['__proto__','constructor','prototype'])test(key+' in nested raw JSON rejected',()=>{assert.throws(()=>S.parseSafeJson('{"nested":{"'+key+'":{"polluted":true}}}'));assert.equal(({}).polluted,undefined);});
for(const raw of ['','null','[]','{"schema":2}',JSON.stringify(x).replace('"age":28','"age":1e400')])test('invalid state '+JSON.stringify(raw.slice(0,55))+' rejected',()=>assert.throws(()=>S.readSavedState(raw)));
test('oversized raw input rejected before parsing',()=>assert.throws(()=>S.parseSafeJson(' '.repeat(5000001))));
test('too many weekdays rejected',()=>{const s=clone(x);s.profile.days=Array(100).fill(1);assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
test('invalid calendar date rejected',()=>{const s=clone(x);s.profile.start='2026-02-30';assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
test('invalid nested set value rejected',()=>{const s=activeState();s.active.sets[0].reps=-1;assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
test('oversized set count rejected',()=>{const s=clone(x);s.plan.sessions[0].items[0].sets=1e9;assert.throws(()=>S.readSavedState(JSON.stringify(s)));});
const draft={schema:1,basePlanId:null,baseEvents:'[]',profile:clone(O.freshState().profile),events:[],step:0};
test('normal unfinished setup round trips',()=>assert.deepEqual(S.readSetupDraft(JSON.stringify(draft)),draft));
test('cleared numeric inputs persist in unfinished setup',()=>{const d=clone(draft);d.profile.age=0;d.profile.weeks=0;d.profile.minutes=0;assert.deepEqual(S.readSetupDraft(JSON.stringify(d)),d);});
test('negative draft step rejected',()=>assert.throws(()=>S.readSetupDraft(JSON.stringify({...draft,step:-1}))));
for(const [name,mutate] of [
 ['Draft with cleared start-date input',d=>d.profile.start=''],
 ['Draft with typed negative age before validation',d=>d.profile.age=-1],
 ['Legacy draft without baseEvents',d=>delete d.baseEvents],
]){const d=clone(draft);mutate(d);try{S.readSetupDraft(JSON.stringify(d));compatibility.push({name,accepted:true});}catch(e){compatibility.push({name,accepted:false,issues:e.issues?.map(i=>({path:i.path,message:i.message}))||e.message});}}
const H=load('http-security');
test('unfinished blank date survives reload',()=>{const d=clone(draft);d.profile.start='';assert.equal(S.readSetupDraft(JSON.stringify(d)).profile.start,'')});
test('legacy setup draft forces calendar review',()=>{const d=clone(draft);delete d.baseEvents;assert.equal(S.readSetupDraft(JSON.stringify(d)).baseEvents,'')});
test('oversized import does not parse or create exercises',()=>assert.ok(T.validateImport(' '.repeat(100001)).error));
test('request nonce cannot be supplied by a client and changes every request',()=>{const r=new Request('https://example.test/',{headers:{'Content-Security-Policy':"script-src 'nonce-attacker'",'Content-Security-Policy-Report-Only':"default-src *"}});const a=H.securityContext(r),b=H.securityContext(r);assert.notEqual(a.nonce,b.nonce);assert.equal(a.request.headers.get('Content-Security-Policy'),a.policy);assert.equal(a.request.headers.get('Content-Security-Policy-Report-Only'),null);assert.ok(!a.policy.includes('attacker'));assert.ok(!a.policy.includes("script-src 'unsafe-inline'"));assert.equal(atob(a.nonce).length,24)});
test('unused write and internal routes are closed',()=>{assert.equal(H.blockedRequest(new Request('https://example.test/',{method:'POST'})).status,405);assert.equal(H.blockedRequest(new Request('https://example.test/__vinext/cache')) .status,404);assert.equal(H.blockedRequest(new Request('https://example.test/_next/image')).status,404);assert.equal(H.blockedRequest(new Request('https://example.test/')),null)});
test('response hardening preserves status and prevents nonce caching',()=>{const r=H.secureResponse(new Response('ok',{status:200,headers:{'X-Powered-By':'test'}}),"default-src 'self'");assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(r.headers.get('X-Powered-By'),null)});
const report={passed:results.filter(x=>x.status==='pass').length,total:results.length,results,compatibility};
for(const x of results)console.log(x.status,x.name,x.error||'');console.log(report.passed+'/'+report.total+' security checks passed');fs.mkdirSync(path.join(site,'.sites-runtime'),{recursive:true});fs.writeFileSync(path.join(site,'.sites-runtime/security-check-results.json'),JSON.stringify(report,null,2)+'\n');if(report.passed!==report.total)process.exitCode=1;
