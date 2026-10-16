// Explicit generation step: the runtime consumes reviewed data, never a second planner.
const fs = require('node:fs');
const crypto = require('node:crypto');
const {load} = require('./domain-test-loader.cjs');
const T = load('lib/training.ts');
const C = load('lib/program-catalog.ts');
const E = load('lib/equipment.ts');
const D = load('lib/session-duration.ts');
const SCI = load('lib/program-science.ts');
const {evidenceLinks} = load('lib/evidence-sources.ts');
const {routineFamilies, submittedRoutineIds} = load('lib/routine-library-families.ts');
const dependencies = ['lib/routine-library-families.ts', 'lib/training-runtime.js', 'lib/equipment-runtime.js', 'lib/exercise-library.json', 'lib/session-duration-runtime.js', 'lib/muscle-work-runtime.js', 'scripts/generate-routine-library.cjs'];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const provenance = () => Object.fromEntries(dependencies.map(file => [file, sha(fs.readFileSync(file))]));
const label = {powerlifting:'Powerlifting', hypertrophy:'Bodybuilding', powerbuilding:'Powerbuilding', hybrid:'Hybrid', sport:'Sport', general:'General fitness'};
const deferred = {
  HB5:'Sprint/change-of-direction prescriptions lack the current readiness, effort, dose and progression policy; existing guarded hybrid plans remain available.',
  SP1:'The proposed in-season plan includes unguarded jump work and has no season-specific total-load qualification; existing sport foundations remain available.',
  SP2:'Jump variants do not implement the current fixed landing-practice readiness and non-progression boundary.',
  SP3:'Jump variants do not implement the current fixed landing-practice readiness and non-progression boundary.',
  SP4:'Sprint/change-of-direction variants lack readiness, effort, dose and progression qualification.',
};
const profileFor = (definition, extra = {}) => ({...T.blankProfile, name:'Synthetic routine audit', age:30,
  goal:definition.goal, programId:definition.id, equipment:definition.equipment === 'gym' ? 'Full gym' : definition.equipment === 'bodyweight-band' ? 'Bodyweight + band' : 'Dumbbells',
  experience:'Experienced', establishedTraining:true, days:[0,1,2,3,4,5,6], trainingDays:definition.days,
  start:'2026-10-19', weeks:8, minutes:definition.minutes, runBase:true, runDays:4, runMinutes:100,
  ...extra});
const targets = items => items.map(([exerciseId,sets,lo,hi,rest]) => ({exerciseId,sets,reps:lo,repMin:lo,repMax:hi,rest,kg:null}));
function fitItems(reference, minutes, brief) {
  const items = reference.map(x => [...x]);
  // Shorter availability can lower the work. Longer availability never fills time
  // with more sets. Keep all listed movements and preserve the first two main lifts.
  while (T.estimateSessionMinutes(targets(items), brief) > minutes) {
    const index = items.findLastIndex((item, index) => item[1] > (index < 2 ? 2 : 1));
    if (index < 0) return null;
    items[index][1]--;
  }
  return items;
}
function recoveryGroup(slot) {
  if (!slot.items?.length) return slot.group;
  const roles = slot.items.map(([id]) => E.movementRoles[id]?.role);
  const lower = roles.some(r => ['squat','split-squat','hinge','hip-extension','knee-flexion','knee-extension','calf'].includes(r));
  const push = roles.some(r => ['horizontal-press','incline-press','vertical-press','elbow-extension','lateral-raise','chest-fly'].includes(r));
  const pull = roles.some(r => ['horizontal-pull','vertical-pull','elbow-flexion','rear-shoulder','face-pull'].includes(r));
  const upper = push || pull;
  // Mixed push/pull and deadlift/back sessions must keep their real overlap.
  if (lower && upper) return 'full';
  if (lower) return 'lower';
  if (push && pull) return 'upper';
  if (upper && ['full','lower'].includes(slot.group)) return 'upper';
  return slot.group;
}
function temporaryBuild(definition, profile) {
  const prior = C.programCatalog.findIndex(p => p.id === definition.id);
  const saved = prior < 0 ? undefined : C.programCatalog[prior];
  if (prior < 0) C.programCatalog.push(definition); else C.programCatalog[prior] = definition;
  try {return T.buildPlan(profile);} finally {if (prior < 0) C.programCatalog.pop(); else C.programCatalog[prior] = saved;}
}
function qualify(definition) {
  const p = profileFor(definition);
  const result = temporaryBuild(definition,p);
  if (!result.plan) return {errors:result.errors};
  const errors = [];
  const science = SCI.programScience(result.plan);
  if (science.work.unclassified.length) errors.push('Unclassified strength movements: '+science.work.unclassified.join(', '));
  for (const s of result.plan.sessions) {
    const duration = D.estimateDuration(s);
    if (s.minutes > p.minutes || !duration || duration.high > p.minutes) errors.push(s.title+': complete duration exceeds availability.');
    if (s.items.some(i => T.exFor(i.exerciseId).name === 'Archived exercise')) errors.push('Unknown exercise ID.');
  }
  if (definition.goal === 'powerlifting') for (const id of ['bar-squat','bench','deadlift']) {
    if (!result.plan.sessions.some(s => s.week === 3 && s.items.some(i => i.exerciseId === id && i.repMax <= 6))) errors.push('Missing weekly heavier competition lift '+id);
  }
  // No invented universal ten-set pass threshold. Expose the actual dose in the
  // normal science panel, and retain at least some primary work for broad goals.
  if (['hypertrophy','powerbuilding','general','hybrid'].includes(definition.goal)) {
    for (const region of ['Chest','Back','Quadriceps','Hamstrings']) if (!science.work.rows.some(r=>r.name===region && r.primarySets>0)) errors.push('No primary weekly work for '+region);
  }
  if (!evidenceLinks[definition.source]) errors.push('Unknown evidence key '+definition.source);
  return {errors:[...new Set(errors)], result:result.plan, science};
}
function generate() {
  const programs=[], audit=[];
  for (const id of submittedRoutineIds) {
    const [,code,length] = id.split('-'), minutes=Number(length), family=routineFamilies.find(f=>f.code===code);
    if (!family) throw Error('Missing family '+code);
    if (deferred[code]) {audit.push({id,offered:false,reasons:[deferred[code]]}); continue;}
    const brief=minutes<=30 || code==='GF5';
    const slots=[]; let failure;
    for (const slot of family.slots) {
      const items = slot.items ? fitItems(slot.items,minutes,brief) : [];
      if (!items) {failure=`${slot.title}: cannot retain all listed movements and main work within ${minutes} minutes using the current preparation/rest/per-side estimate.`;break;}
      slots.push({...slot,group:recoveryGroup(slot),items});
    }
    if (failure) {audit.push({id,offered:false,reasons:[failure]});continue;}
    const definition={id,goal:family.goal,name:`${label[family.goal]} · ${family.name} · up to ${minutes} min`,
      description:family.summary+` This option fits a ${minutes}-minute window. The preview shows the actual estimated duration and weekly work; spare time does not automatically add sets.`,
      days:family.days, minutes,fixedDose:true,experience:family.experience,equipment:family.equipment,
      level:family.experience==='advanced'?'advanced':family.experience==='some'?'build':'foundation',
      ...(brief?{brief:true}:{}),source:family.source,evidenceSources:[family.source],
      rationale:'An app-authored arrangement adapted from the reviewed routine proposal. Session length is an availability ceiling. Shorter variants may reduce work sets while preserving the listed movements and rest. Scientific references support principles, not this exact routine or a promised result.',
      requirements:family.equipment==='gym'?['Confirm the listed free weights and machines in the equipment survey.']:family.equipment==='bodyweight-band'?['Resistance band with a suitable anchor, secure push-up support and floor space.']:['Confirm dumbbells, supports and any listed bench in the equipment survey.'],slots};
    const qualified=qualify(definition);
    if (qualified.errors.length) {audit.push({id,offered:false,reasons:qualified.errors});continue;}
    programs.push(definition);
    audit.push({id,offered:true,days:definition.days,maximumMinutes:Math.max(...qualified.result.sessions.map(s=>s.minutes)),weeklyWork:qualified.science.work.rows,limitations:qualified.science.limits});
  }
  return {programs,report:{submittedCommit:'ea9e4d5e450957d6304ef2fdba967660e8579ec9',submittedCount:submittedRoutineIds.length,offeredCount:programs.length,withheldCount:submittedRoutineIds.length-programs.length,scope:'Actual current-engine schedule, time, exercise, source and movement qualification. No clinical or exact-routine efficacy certification.',dependencies:provenance(),variants:audit}};
}
if (require.main === module) {
  const result=generate();
  if (process.argv.includes('--check')) {
    if (JSON.stringify(JSON.parse(fs.readFileSync('lib/routine-library.json'))) !== JSON.stringify(result.programs)) throw Error('Routine data drifted: review and run node scripts/generate-routine-library.cjs');
    const saved=JSON.parse(fs.readFileSync('docs/routine-library-qualification-2026-10-16.json'));
    if (JSON.stringify(saved.dependencies)!==JSON.stringify(result.report.dependencies)) throw Error('Routine qualification inputs changed: regenerate and review the report.');
  } else {
    fs.writeFileSync('lib/routine-library.json',JSON.stringify(result.programs,null,2)+'\n');
    fs.writeFileSync('docs/routine-library-qualification-2026-10-16.json',JSON.stringify(result.report,null,2)+'\n');
  }
  console.log(JSON.stringify({submitted:result.report.submittedCount,offered:result.report.offeredCount,withheld:result.report.withheldCount}));
}
module.exports={generate,qualify,profileFor,targets,temporaryBuild};
