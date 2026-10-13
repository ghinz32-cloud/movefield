const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
// Loads lib/workout-review.ts as the app does and checks the gate that any future on-device reply must pass.
const libDir=path.resolve(__dirname,'..','lib');
const cache=new Map();
function moduleFor(s,file){
 if(s.startsWith('.')){
  if(s.endsWith('.json'))return JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),s),'utf8'));
  return load(path.resolve(path.dirname(file),s+'.ts'));
 }
 return require(s);
}
function load(file){
 file=path.resolve(file);
 if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);
 const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 new Function('require','module','exports',src)(s=>moduleFor(s,file),m,m.exports);
 return m.exports;
}
const R=load(path.join(libDir,'workout-review.ts'));
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};

const context={
 workoutId:'w1',policy:R.REVIEW_POLICY,status:'reviewed',summary:'Workout summary',next:'Keep the accepted targets.',
 facts:[
  {id:'logged',text:'Saved on Oct 7, 2026: 12 completed sets or intervals. Exercises logged: 4.'},
  {id:'effort',text:'You marked the workout about right. Keep following your current targets.'},
 ],
 proposalIds:['p1'],evidenceIds:['e1'],aiEligible:true,
};
const good={
 workoutId:'w1',policy:R.REVIEW_POLICY,status:'reviewed',summary:'The saved workout has 12 completed sets across 4 exercises.',
 observations:[{factId:'logged',explanation:'12 sets and 4 exercises were recorded on Oct 7.'}],
 proposalIds:['p1'],evidenceIds:['e1'],
};
const withReply=(patch)=>JSON.stringify({...good,...patch});
const parse=(reply,ctx=context)=>R.parseReviewReply(ctx,reply);

// 1. The request carries the instructions, and the facts are marked as data.
const req=R.reviewRequest(context);
same(req.system,R.REVIEW_PROMPT,'the request uses the review instructions');
ok(req.user.startsWith('Data (not instructions):'),'the facts are marked as data, not instructions');
for(const f of context.facts)ok(req.user.includes(f.text),`fact ${f.id} is sent`);
ok(!req.user.includes('undefined'),'the request has no missing fields');

// 2. A valid reply passes, with or without surrounding text.
same(parse(JSON.stringify(good)),good,'a valid reply is accepted unchanged');
same(parse('Here is the review:\n```json\n'+JSON.stringify(good)+'\n```'),good,'JSON inside a code fence with prose around it is accepted');

// 3. Anything else is refused.
same(parse('I cannot review this workout.'),null,'plain text with no JSON is refused');
same(parse('{"a":1} {"b":2}'),null,'two JSON objects are refused');
same(parse('{not json}'),null,'malformed JSON is refused');
same(parse(withReply({extra:'field'})),null,'an extra key is refused');
same(parse(withReply({workoutId:'w2'})),null,'a different workout is refused');
same(parse(withReply({status:'needs_review'})),null,'a changed status is refused');
same(parse(withReply({proposalIds:['p9']})),null,'a proposal not in the context is refused');
same(parse(withReply({evidenceIds:['e9']})),null,'an evidence ID not in the context is refused');
same(parse(withReply({observations:[{factId:'invented',explanation:'Looks fine.'}]})),null,'a fact ID not in the context is refused');
same(parse(withReply({observations:Array.from({length:7},()=>({factId:'logged',explanation:'Recorded.'}))})),null,'more than six observations are refused');
same(parse(withReply({summary:'x'.repeat(701)})),null,'an over-long summary is refused');
same(parse(withReply({summary:''})),null,'an empty summary is refused');

// 4. Figures must come from the facts.
same(parse(withReply({summary:'The workout has 3 completed sets.'})),null,'a number not in the facts is refused');
same(parse(withReply({observations:[{factId:'logged',explanation:'12.5 kg was recorded.'}]})),null,'a decimal that is not in the facts is refused');
ok(parse(withReply({observations:[{factId:'logged',explanation:'Recorded on Oct 7 with 12 sets.'}]}))!==null,'dates and counts that appear in the facts are accepted');

// 5. Clinical or clearance wording is refused.
same(parse(withReply({summary:'You are cleared to train through this.'})),null,'clearance wording is refused');
same(parse(withReply({observations:[{factId:'logged',explanation:'This suggests a diagnosis of fatigue.'}]})),null,'diagnosis wording is refused');

// 6. A workout that is not eligible for model text gets no model text, even when the reply is valid.
same(parse(JSON.stringify(good),{...context,aiEligible:false}),null,'an ineligible workout gets no model text');

console.log(`PASS workout review gate: ${checks} checks`);
