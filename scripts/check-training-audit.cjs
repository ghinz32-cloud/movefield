/* Synthetic all-plan lifecycle and staged-running regression, not an efficacy trial. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {execFileSync} = require('node:child_process');
const baseline = process.argv.includes('--baseline');
const NativeDate = Date;
let clock = '2026-10-13T12:00:00';
global.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return new NativeDate(clock).getTime(); }
};
// Run the actual native workout actions against the canonical shared modules.
// Root/native byte parity is a separate release check.
const cache = new Map();
function load(filename) {
  const file = path.resolve(filename.replace(/^mobile\/src\/shared\//, 'lib/'));
  if (cache.has(file)) return cache.get(file).exports;
  const module = {exports: {}}; cache.set(file, module);
  const relative = path.relative(process.cwd(), file);
  const source = baseline && ['lib/training-runtime.js', 'lib/researched-programs.ts'].includes(relative)
    ? execFileSync('git', ['show', '00559e3:' + relative], {encoding: 'utf8'}) : fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (!name.startsWith('.')) return require(name);
    const target = path.relative(process.cwd(), path.resolve(path.dirname(file), name));
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(target, 'utf8')) : load(target + (path.extname(target) ? '' : '.ts'));
  }, module, module.exports);
  return module.exports;
}
const T = load('lib/training.ts'), C = load('lib/program-catalog.ts'), E = load('lib/equipment.ts'),
  O = load('lib/onboarding.ts'), S = load('lib/saved-data.ts'), W = load('lib/workout-log.ts'),
  N = load('mobile/src/mobile-engine.ts'), P = load('lib/source-programs.ts');
const base = {...T.blankProfile, name: 'Synthetic full-catalog audit', age: 30, start: '2026-11-02', weeks: 8,
  minutes: 120, days: [0,1,2,3,4,5,6], experience: 'Experienced', establishedTraining: true,
  runBase: true, runDays: 7, runMinutes: 300, jumpReady: true, inventory: {...E.defaultInventory(), confirmed: true}};
function build(id, patch = {}) {
  const d = C.programCatalog.find(x => x.id === id);
  const p = {...base, goal: d?.goal || 'running', programId: id, ...patch};
  const result = T.buildPlan(p);
  assert.ok(result.plan, id + ': ' + result.errors.join(' '));
  return result.plan;
}
function stateBefore(plan, target, feedback = {}) {
  const previous = plan.sessions.find(s => s.id === target.dependsOn[0]);
  assert.ok(previous, target.title + ' has a prerequisite');
  return {...O.freshState(), profile: plan.profile, plan, history: [{id: 'synthetic-prior', sessionId: previous.id,
    title: previous.title, date: previous.date, startedAt: 1, finishedAt: 2, targets: previous.items,
    sets: previous.items.flatMap(i => Array.from({length: i.sets}, (_, n) => ({exerciseId: i.exerciseId,
      set: n + 1, reps: i.reps, kg: T.isLoadTracked(T.exFor(i.exerciseId)) ? 10 : null, done: true, rir: 3}))),
    effort: 'right', symptom: 'no', ...feedback}]};
}
const results = [];
function test(name, fn) {
  try { fn(); results.push({name, status: 'pass'}); }
  catch (error) { results.push({name, status: 'fail', error: error.message}); }
}
test('NHS intraweek longer run waits even when total session time falls', () => {
  const plan = build(undefined, {weeks: 9});
  const target = plan.sessions.find(s => s.week === 5 && s.title.endsWith('/ 3'));
  const previous = plan.sessions.find(s => s.id === target.dependsOn[0]);
  assert.ok(target.items[0].reps < previous.items[0].reps, 'Shorter total still has a longer continuous run');
  for (const feedback of [{effort: 'harder'}, {effort: undefined}, {symptom: undefined}, {symptom: 'yes'}])
    assert.match(T.eligibility(stateBefore(plan, target, feedback), target), /comfortable completed work/);
  assert.equal(T.eligibility(stateBefore(plan, target), target), null);
  const repeat = plan.sessions[1];
  assert.equal(T.eligibility(stateBefore(plan, repeat, {effort: 'harder'}), repeat), null);
});
test('Every staged original run and hybrid introduction checks comfortable feedback', () => {
  let checked = 0;
  for (const def of C.programCatalog.filter(d => d.slots.some(s => s.kind === 'walkrun' || s.runStages?.length > 1))) {
    const plan = build(def.id), target = plan.sessions.find(s => s.week === 3 && s.runSteps);
    assert.ok(target, def.id);
    assert.match(T.eligibility(stateBefore(plan, target, {effort: 'harder'}), target), /comfortable completed work/, def.id);
    assert.equal(T.eligibility(stateBefore(plan, target), target), null, def.id);
    checked++;
  }
  assert.ok(checked >= 3);
});
test('Long-bout introduction starts shorter and preserves the last accepted stage', () => {
  const plan = build('RNLONGBOUT2', {runBase: false, runDays: 0, runMinutes: 0, experience: 'First time', weeks: 12});
  const longest = week => Math.max(...plan.sessions.find(s => s.week === week).runSteps
    .filter(s => /jog/i.test(s.label)).map(s => s.seconds));
  assert.deepEqual([1,3,5,7,9,12].map(longest), [60,120,180,240,240,240]);
  assert.ok(plan.notes.some(n => /app-authored/.test(n)));
});
test('Running phases and notes describe running without inherited strength instructions', () => {
  for (const def of C.programCatalog.filter(d => d.goal === 'running')) {
    const plan = build(def.id), text = JSON.stringify(plan.phases) + JSON.stringify(plan.notes);
    assert.doesNotMatch(text, /starting weights|First-time lifters|fewer strength sets|work sets|manageable load/i, def.id);
    assert.match(JSON.stringify(plan.phases), /pace|running/i, def.id);
  }
  assert.doesNotMatch(JSON.stringify(build(undefined).notes), /starting weight/i);
});
test('Fixed short/long easy base run layouts are not mistaken for rising stages', () => {
  const plan = build('RNVARY3'), target = plan.sessions[1];
  assert.equal(T.eligibility(stateBefore(plan, target, {effort: 'harder'}), target), null);
});

let plans = 0, sessions = 0, sets = 0, roundTrips = 0;
if (!baseline) test('Every original, public-source and NHS plan completes its full accepted block', () => {
  const choices = [...C.programCatalog.map(d => ({id: d.id, goal: d.goal})),
    ...P.sourcePrograms.map(d => ({id: d.id, goal: d.goals[0]})), {id: undefined, goal: 'running', weeks: 9}];
  for (const choice of choices) {
    clock = '2026-10-13T12:00:00';
    const plan = build(choice.id, {goal: choice.goal, weeks: choice.weeks || 8});
    const acceptance = O.acceptSetup(O.freshState(), plan.profile, plan, []);
    assert.equal(acceptance.error, undefined, String(choice.id) + ': accept');
    let state = S.readSavedState(JSON.stringify(acceptance.state)); roundTrips++;
    for (const scheduled of plan.sessions) {
      clock = scheduled.date + 'T12:00:00';
      const current = state.plan.sessions.find(s => s.id === scheduled.id);
      assert.equal(T.eligibility(state, current), null, String(choice.id) + ' / ' + current.title);
      state = N.startWorkout(state, current.id, true);
      assert.deepEqual(state.active.targets, current.items);
      for (let index = 0; index < state.active.sets.length; index++) {
        const row = state.active.sets[index], item = current.items.find(i => i.exerciseId === row.exerciseId);
        const exercise = T.exFor(item.exerciseId);
        const amount = item.setPlan?.[row.set - 1]?.reps ?? item.reps;
        state = W.changeWorkoutSet(state, index, {reps: amount, kg: T.isLoadTracked(exercise) ? 10 : null,
          ...(exercise.metric === 'reps' ? {rir: 3} : {})});
        state = W.logWorkoutSet(state, index, item.rest);
        assert.equal(state.active.sets[index].done, true);
        sets++;
      }
      state = {...state, active: {...state.active, effort: 'right', symptom: 'no', supervisorConfirmed: true}};
      state = N.finishWorkout(state);
      assert.equal(state.history.at(-1).partial, false);
      assert.equal(state.active, null);
      sessions++;
      if (current.week !== state.plan.sessions.find(s => s.status === 'scheduled')?.week) {
        const restored = S.readSavedState(JSON.stringify(state));
        assert.deepEqual(restored.history, JSON.parse(JSON.stringify(state.history)));
        assert.deepEqual(restored.plan.sessions, JSON.parse(JSON.stringify(state.plan.sessions)));
        state = restored; roundTrips++;
      }
    }
    assert.equal(T.nextSession(state), undefined);
    assert.equal(state.history.length, plan.sessions.length);
    plans++;
  }
  const addedIds = new Set(JSON.parse(fs.readFileSync('lib/routine-library.json', 'utf8')).map(d => d.id));
  assert.equal(addedIds.size, 68, 'Reviewed new routine count changed; update the full audit deliberately');
  assert.equal(choices.filter(c => !addedIds.has(c.id)).length, 154, 'All prior original, source and NHS plans remain covered');
  assert.equal(choices.filter(c => addedIds.has(c.id)).length, addedIds.size, 'Every new routine joins the complete lifecycle');
  assert.equal(plans, 154 + addedIds.size);
});
const report = {baseline, scope: 'Synthetic actual native workout actions with canonical shared engine; no rendered UI or physical device claim.',
  plans, sessions, sets, roundTrips, results, passed: results.every(r => r.status === 'pass')};
fs.mkdirSync('.sites-runtime', {recursive: true});
fs.writeFileSync('.sites-runtime/training-audit-' + (baseline ? 'before' : 'after') + '.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
