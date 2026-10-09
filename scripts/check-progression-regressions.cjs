const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');

// Standalone audit harness; no application files or tracked reports are written.
// Usage: node check-progression-regressions.cjs /absolute/path/to/movefield [report.json]
const root = path.resolve(process.argv[2] || path.resolve(__dirname, '..'));
const reportPath = path.resolve(process.argv[3] || path.join(root, '.sites-runtime/a03-progression-checks.json'));
const projectRequire = createRequire(path.join(root, 'package.json'));
const ts = projectRequire('typescript');
const OriginalDate = Date;
let clock = '2026-10-09T15:00:00Z';
global.Date = class extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return new OriginalDate(clock).getTime(); }
};
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const module = {exports: {}};
  cache.set(name, module);
  const source = ts.transpileModule(fs.readFileSync(path.join(root, 'lib', name + '.ts'), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText;
  new Function('require', 'module', 'exports', source)(specifier => specifier.startsWith('./')
    ? specifier.endsWith('.json')
      ? JSON.parse(fs.readFileSync(path.join(root, 'lib', specifier), 'utf8'))
      : load(specifier.slice(2))
    : projectRequire(specifier), module, module.exports);
  return module.exports;
}
const T = load('training'), U = load('substitutions'), A = load('customize'), S = load('saved-data');
const results = [];
function test(name, fn) {
  clock = '2026-10-09T15:00:00Z';
  try { fn(); results.push({name, passed: true}); console.log('PASS ' + name); }
  catch (error) { results.push({name, passed: false, error: error.message}); console.log('FAIL ' + name + ': ' + error.message); }
}
const clone = value => structuredClone(value);
function runningState() {
  const profile = {...T.blankProfile, goal: 'running', programId: 'RNBASE4', start: '2026-11-02',
    days: [0, 1, 2, 3, 4, 5, 6], experience: 'Experienced', weeks: 2,
    runBase: true, runDays: 4, runMinutes: 100};
  const built = T.buildPlan(profile);
  assert.ok(built.plan, built.errors.join(' '));
  return {...T.initialState(), profile: built.plan.profile, plan: built.plan,
    history: [], active: null, events: [], proposals: []};
}
function acceptMove(state, from, to, cascade = false) {
  const target = state.plan.sessions.find(session => session.date === from);
  assert.ok(target, 'source session exists');
  const preview = T.makeMoveProposal(state, target.id, to, cascade);
  assert.ok(preview.proposal, preview.error);
  const applied = T.applyProposal({...state, proposals: [preview.proposal]}, preview.proposal.id);
  assert.equal(applied.error, undefined);
  return applied.state;
}
function finished(session, actualDate) {
  return {id: 'record-' + session.id, sessionId: session.id, title: session.title, date: actualDate,
    startedAt: Date.now() - 3600000, finishedAt: Date.now() - 1800000, partial: false,
    effort: 'right', symptom: 'no', targets: clone(session.items),
    sets: session.items.map(item => ({exerciseId: item.exerciseId, set: 1, reps: item.reps, kg: null, done: true}))};
}

test('RNBASE4 original pattern and seven-day cascade remain valid', () => {
  const state = runningState();
  assert.deepEqual(state.plan.sessions.map(session => session.date), [
    '2026-11-02', '2026-11-04', '2026-11-06', '2026-11-08',
    '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-15']);
  assert.equal(T.checkSchedule(state, [{sessionId: state.plan.sessions[0].id, patch: {date: '2026-11-02'}}]), null);
  const shifted = acceptMove(state, '2026-11-02', '2026-11-09', true);
  assert.deepEqual(shifted.plan.sessions.map(session => session.items), state.plan.sessions.map(session => session.items));
  assert.ok(shifted.plan.sessions.every((session, i) => T.dayDistance(state.plan.sessions[i].date, session.date) === 7));
});
test('RNBASE4 one bounded adjacent pair is allowed but a three-day run streak is refused', () => {
  const state = acceptMove(runningState(), '2026-11-04', '2026-11-03');
  const before = JSON.stringify(state);
  const target = state.plan.sessions.find(session => session.date === '2026-11-06');
  const preview = T.makeMoveProposal(state, target.id, '2026-11-04', false);
  assert.ok(preview.error, 'second move must reject Nov 2, 3, 4 runs');
  assert.equal(preview.proposal, undefined);
  assert.equal(JSON.stringify(state), before, 'a refused preview must not mutate state');
});
test('RNBASE4 direct schedule validation rejects four consecutive runs', () => {
  const state = runningState();
  const changes = state.plan.sessions.slice(0, 4).map((session, i) => ({
    sessionId: session.id, patch: {date: T.addDays('2026-11-02', i)},
  }));
  assert.ok(T.checkSchedule(state, changes), 'four-day cluster must fail shared validation');
});
test('RNBASE4 recovery uses a completed workout actual date instead of only its old planned date', () => {
  clock = '2026-11-03T15:00:00Z';
  const state = runningState();
  const completed = state.plan.sessions[0];
  completed.status = 'completed';
  state.history = [finished(completed, '2026-11-03')];
  const before = JSON.stringify(state);
  const preview = T.makeMoveProposal(state, state.plan.sessions[1].id, '2026-11-03', false);
  assert.ok(preview.error, 'another run cannot move onto a recorded run actual date');
  assert.equal(preview.proposal, undefined);
  assert.equal(JSON.stringify(state), before);
});
test('RNBASE4 recovery includes an active workout actual date', () => {
  clock = '2026-11-03T15:00:00Z';
  const state = runningState(), activeSession = state.plan.sessions[0];
  state.active = {...finished(activeSession, '2026-11-03'), finishedAt: undefined};
  const preview = T.makeMoveProposal(state, state.plan.sessions[1].id, '2026-11-03', false);
  assert.ok(preview.error, 'another run cannot move onto an active run actual date');
  assert.equal(preview.proposal, undefined);
});

const benchItem = () => ({exerciseId: 'lib-db-flat-bench-press', sets: 3, reps: 8,
  repMin: 8, repMax: 12, rest: 150, kg: null});
function stateWithItems(items, options = {}) {
  const profile = {...T.blankProfile, goal: 'general', start: '2026-11-02', days: [1, 4],
    minutes: 120, weeks: 2, experience: 'Experienced'};
  const built = T.buildPlan(profile);
  assert.ok(built.plan, built.errors.join(' '));
  const custom = options.custom || [];
  const minutes = T.estimateSessionMinutes(items, false, custom);
  built.plan.sessions = built.plan.sessions.map(session => ({...session, items: clone(items), minutes}));
  built.plan.profile.minutes = options.budget || 120;
  return {...T.initialState(), profile: built.plan.profile, plan: built.plan,
    custom, history: [], active: null, events: [], proposals: []};
}
function substituteQuery(state) {
  return {sessionId: state.plan.sessions[0].id, from: 'lib-db-flat-bench-press', to: 'lib-plate-chest-press',
    all: false, setup: 'Gym A press seat 3', allowLonger: false, acknowledgeSpecificity: true,
    planId: state.plan.id, version: state.plan.version, historyCount: state.history.length};
}
function additionQuery(state, exercise, override = {}) {
  return {sessionId: state.plan.sessions[0].id, exercise, sets: 3, lo: 8, hi: 12, rest: 150,
    all: false, setup: 'Gym A press seat 3', allowLonger: false,
    planId: state.plan.id, version: state.plan.version, ...override};
}
test('Bilateral plate load wording does not double exercise execution time', () => {
  const item = {sets: 8, reps: 20, repMin: 20, repMax: 20, rest: 90, kg: null};
  assert.equal(T.estimateSessionMinutes([{...item, exerciseId: 'lib-plate-chest-press'}]), 40);
  assert.equal(T.estimateSessionMinutes([{...item, exerciseId: 'row'}]), 50,
    'a true repetitions-per-side row includes both sides');
});
test('Substitution preview and committed estimate match canonical time for equal bilateral work', () => {
  const state = stateWithItems([benchItem()], {budget: 25});
  const before = JSON.stringify(state);
  const query = substituteQuery(state), preview = U.previewSubstitution(state, query);
  assert.equal(preview.errors.length, 0, preview.errors.join(' '));
  const change = preview.changes[0];
  assert.equal(change.before, 25);
  assert.equal(change.after, 25, 'same work/rest should fit the existing 25-minute budget');
  assert.equal(change.after, T.estimateSessionMinutes([change.item]));
  assert.equal(JSON.stringify(state), before);
  const applied = U.applySubstitution(state, query);
  assert.equal(applied.error, undefined);
  assert.equal(applied.state.plan.sessions[0].minutes, 25);
});
test('Plate addition preview agrees with canonical estimate and permits a fitting tight budget', () => {
  const state = stateWithItems([benchItem()], {budget: 35});
  const query = additionQuery(state, T.exFor('lib-plate-chest-press'));
  const preview = A.previewAddition(state, query);
  assert.equal(preview.errors.length, 0, preview.errors.join(' '));
  const change = preview.changes[0];
  const expected = T.estimateSessionMinutes([...state.plan.sessions[0].items, change.item]);
  assert.equal(expected, 35);
  assert.equal(change.after, expected);
  const applied = A.applyAddition(state, query);
  assert.equal(applied.error, undefined);
  assert.equal(applied.state.plan.sessions[0].minutes, expected);
});
test('Substitution preserves separately allocated focus time when changing canonical work time', () => {
  const state = stateWithItems([benchItem()]);
  state.plan.sessions[0].minutes += 7;
  const preview = U.previewSubstitution(state, {...substituteQuery(state), allowLonger: true});
  assert.equal(preview.errors.length, 0, preview.errors.join(' '));
  const change = preview.changes[0];
  assert.equal(change.after, T.estimateSessionMinutes([change.item]) + 7);
});
test('Seconds recorded per side include both sides and keep five-minute estimate rounding', () => {
  const item = {exerciseId: 'ref-All_Fours_Quad_Stretch', sets: 3, reps: 90, rest: 0, kg: null};
  assert.equal(T.estimateSessionMinutes([item]), 25,
    '13 preparation minutes + 9 execution minutes + 2 setup minutes = 24, rounded to 25');
});
test('Minutes recorded per side include both sides', () => {
  const exercise = {...T.exFor('ref-All_Fours_Quad_Stretch'), id: 'custom-side-minutes', name: 'Timed sides',
    metric: 'minutes', custom: true, loadConvention: 'Record minutes per side. Complete both sides before Done.'};
  const item = {exerciseId: exercise.id, sets: 3, reps: 1.5, rest: 0, kg: null};
  assert.equal(T.estimateSessionMinutes([item], false, [exercise]), 25);
});
test('Timed per-side addition matches canonical time and rejects an insufficient budget', () => {
  const state = stateWithItems([benchItem()], {budget: 30});
  const query = additionQuery(state, T.exFor('ref-All_Fours_Quad_Stretch'), {lo: 90, hi: 90, rest: 0});
  const preview = A.previewAddition(state, query);
  const change = preview.changes[0];
  const expected = T.estimateSessionMinutes([...state.plan.sessions[0].items, change.item]);
  assert.equal(expected, 35);
  assert.equal(change.after, expected);
  assert.ok(preview.errors.length, '35-minute work must not silently fit a 30-minute budget');
});

function capacityState(which = 'A1') {
  const profile = {...T.blankProfile, goal: 'powerbuilding', programId: 'PB3', start: '2026-11-02',
    days: [1, 3, 5], minutes: 120, weeks: 2, experience: 'Experienced', focuses: ['supersets']};
  const built = T.buildPlan(profile);
  assert.ok(built.plan, built.errors.join(' '));
  const session = built.plan.sessions.find(session => session.items.some(item => item.note?.includes(which + '.')));
  const item = session.items.find(item => item.note?.includes(which + '.'));
  assert.ok(item, 'superset member exists');
  const setup = T.requiresSetup(T.exFor(item.exerciseId)) ? 'Gym A cable, rope, high pulley' : '';
  const state = {...T.initialState(), profile: built.plan.profile, plan: built.plan,
    active: null, events: [], proposals: [], incrementKg: {[item.exerciseId]: 2.5},
    loadContext: setup ? {[item.exerciseId]: setup} : {},
    equipmentCaps: [{exerciseId: item.exerciseId, setup, maxKg: 10}]};
  state.history = [0, 1].map(n => ({id: 'past-' + n, sessionId: 'past-session-' + n, title: 'Prior matching work',
    date: T.addDays(T.day(), -n * 3), startedAt: Date.now() - 3600000 - n * 86400000,
    finishedAt: Date.now() - 1800000 - n * 86400000, partial: false, effort: 'right', symptom: 'no',
    targets: [clone(item)], loadContext: setup ? {[item.exerciseId]: setup} : {}, rir: {[item.exerciseId]: 3},
    sets: Array.from({length: item.sets}, (_, i) => ({exerciseId: item.exerciseId, set: i + 1,
      reps: item.repMax, kg: 10, done: true}))}));
  return {state, session, item};
}
for (const which of ['A1', 'A2']) test('Capacity range progression retains ' + which + ' superset instructions and paired rest', () => {
  const {state, session, item} = capacityState(which);
  const before = JSON.stringify(state);
  const proposal = T.makeCapacityProposal(state);
  assert.ok(proposal, 'qualifying capacity proposal exists');
  assert.equal(JSON.stringify(state), before, 'preview leaves current targets and history unchanged');
  const structural = item.note.match(/A[12]\. \[Focus\] Assistance superset A:.*$/)[0];
  const applied = T.applyProposal({...state, proposals: [proposal]}, proposal.id);
  assert.equal(applied.error, undefined);
  const result = applied.state.plan.sessions.find(candidate => candidate.id === session.id);
  const adjusted = result.items.find(candidate => candidate.exerciseId === item.exerciseId);
  assert.equal(adjusted.repMin, 15);
  assert.equal(adjusted.repMax, 20);
  assert.equal(adjusted.sets, item.sets);
  assert.equal(adjusted.rest, item.rest);
  assert.ok(adjusted.note.includes(structural), which + ' pairing sequence must survive the range change');
  assert.equal((adjusted.note.match(/A[12]\. \[Focus\]/g) || []).length, 1, 'pair marker is not duplicated');
  assert.deepEqual(applied.state.history, state.history);
  assert.deepEqual(applied.state.plan.sessions.map(candidate => candidate.date), state.plan.sessions.map(candidate => candidate.date));
  for (const member of session.items.filter(candidate => candidate.note?.includes('Assistance superset A:')))
    assert.equal(result.items.find(candidate => candidate.exerciseId === member.exerciseId).rest, member.rest);
});

function continuationState() {
  clock = '2026-11-09T15:00:00Z';
  const profile = {...T.blankProfile, goal: 'strength', programId: 'ST2', start: '2026-11-02',
    days: [1, 4], minutes: 120, weeks: 3, experience: 'Experienced'};
  const built = T.buildPlan(profile);
  assert.ok(built.plan, built.errors.join(' '));
  let state = {...T.initialState(), profile: built.plan.profile, plan: built.plan,
    history: [], active: null, events: [], proposals: []};
  const reduction = T.makeProposal(state, 'sets');
  assert.ok(reduction, 'real one-session set reduction exists');
  const reduced = T.applyProposal({...state, proposals: [reduction]}, reduction.id);
  assert.equal(reduced.error, undefined);
  state = reduced.state;
  function strengthRecord(session) {
    return {id: 'finished-' + session.id, sessionId: session.id, title: session.title, date: session.date,
      startedAt: Date.now() - 7200000, finishedAt: Date.now() - 3600000, partial: false,
      effort: 'right', symptom: 'no', supervisorConfirmed: true, targets: clone(session.items),
      sets: session.items.flatMap(item => Array.from({length: item.sets}, (_, i) => ({
        exerciseId: item.exerciseId, set: i + 1, reps: item.reps,
        kg: T.isLoadTracked(T.exFor(item.exerciseId)) ? 15 : null, done: true, rir: 3,
      })))};
  }
  const firstTwo = state.plan.sessions.slice(0, 2);
  state.history = firstTwo.map(strengthRecord);
  for (const session of firstTwo) session.status = 'completed';
  state.proposals = [];
  const selected = state.plan.sessions[2];
  assert.ok(selected.needsReview, 'reduction invalidated a real dependent future workout');
  assert.ok(state.plan.sessions[4].needsReview, 'later dependent flag exists to test one-session scope');
  // An already accepted session load must survive continuation review exactly.
  const loaded = selected.items.find(item => T.isLoadTracked(T.exFor(item.exerciseId)));
  assert.ok(loaded);
  loaded.kg = 20;
  assert.equal(T.nextSession(state).id, selected.id, 'selected review is the next scheduled workout');
  const temporarilyCleared = {...selected, needsReview: false};
  assert.equal(T.eligibility(state, temporarilyCleared), null, 'all ordinary prerequisites are complete');
  return {state, selected, later: state.plan.sessions[4]};
}
function continuationPreview(state, sessionId) {
  assert.equal(typeof T.makeContinuationReview, 'function', 'explicit continuation constructor is available');
  const response = T.makeContinuationReview(state, sessionId);
  return response?.type === 'review' ? response : response?.proposal || null;
}
function readyReview() {
  const fixture = continuationState();
  const proposal = continuationPreview(fixture.state, fixture.selected.id);
  assert.ok(proposal, 'a completed reduced prerequisite permits explicit target review');
  return {...fixture, proposal};
}
test('Continuation preview targets only one review flag and preserves displayed targets', () => {
  const {state, selected} = continuationState();
  const before = JSON.stringify(state);
  const proposal = continuationPreview(state, selected.id);
  assert.ok(proposal);
  assert.equal(proposal.type, 'review');
  assert.equal(proposal.planId, state.plan.id);
  assert.equal(proposal.baseVersion, state.plan.version);
  assert.equal(proposal.historyCount, state.history.length);
  assert.equal(proposal.sessionId, selected.id);
  const changes = proposal.changes || [{sessionId: proposal.sessionId, patch: proposal.patch}];
  assert.equal(changes.length, 1, 'review does not clear a whole dependency chain');
  assert.equal(changes[0].sessionId, selected.id);
  assert.deepEqual(changes[0].patch, {needsReview: false}, 'review does not prescribe different targets');
  assert.equal(JSON.stringify(state), before);
});
test('Accepted continuation review clears one flag without changing loads/items/history/dates/dependencies', () => {
  const {state, selected, later, proposal} = readyReview();
  const before = clone(state);
  const result = T.applyProposal({...state, proposals: [proposal]}, proposal.id);
  assert.equal(result.error, undefined);
  const reviewed = result.state.plan.sessions.find(session => session.id === selected.id);
  assert.equal(reviewed.needsReview, false);
  assert.deepEqual(reviewed, {...before.plan.sessions.find(session => session.id === selected.id), needsReview: false});
  for (const session of result.state.plan.sessions.filter(session => session.id !== selected.id))
    assert.deepEqual(session, before.plan.sessions.find(old => old.id === session.id), 'other session is unchanged');
  assert.equal(result.state.plan.sessions.find(session => session.id === later.id).needsReview, true);
  assert.deepEqual(result.state.history, before.history);
  assert.deepEqual(result.state.loadContext, before.loadContext);
  assert.deepEqual(result.state.equipmentCaps, before.equipmentCaps);
  assert.equal(result.state.plan.version, before.plan.version + 1);
  assert.equal(T.eligibility(result.state, reviewed), null, 'review resolves this blocked workout');
  assert.equal(result.state.proposals.find(item => item.id === proposal.id).status, 'accepted');
  assert.ok(T.applyProposal(result.state, proposal.id).error, 'acceptance cannot replay');
});
test('Continuation review cannot bypass a still-unfinished later dependency', () => {
  const {state, later} = continuationState();
  assert.equal(continuationPreview(state, later.id), null, 'later review cannot skip the selected prerequisite');
});
for (const kind of ['paused', 'hold', 'active']) test('Continuation constructor refuses ' + kind + ' state', () => {
  const {state, selected} = continuationState();
  if (kind === 'paused') state.plan.paused = true;
  if (kind === 'hold') state.hold = true;
  if (kind === 'active') state.active = {id: 'open-workout', sessionId: selected.id, title: selected.title,
    date: selected.date, startedAt: Date.now(), sets: [], targets: clone(selected.items)};
  const before = JSON.stringify(state);
  assert.equal(continuationPreview(state, selected.id), null);
  assert.equal(JSON.stringify(state), before);
});
for (const kind of ['missing', 'partial', 'unfinished', 'unknown-load']) test('Continuation refuses ' + kind + ' prerequisite evidence', () => {
  const {state, selected} = continuationState();
  const dependency = selected.dependsOn[0];
  const record = state.history.find(workout => workout.sessionId === dependency);
  assert.ok(record);
  if (kind === 'missing') state.history = state.history.filter(workout => workout !== record);
  if (kind === 'partial') record.partial = true;
  if (kind === 'unfinished') record.sets[0].done = false;
  if (kind === 'unknown-load') record.sets.find(set => T.isLoadTracked(T.exFor(set.exerciseId))).kg = null;
  const before = JSON.stringify(state);
  assert.equal(continuationPreview(state, selected.id), null);
  assert.equal(JSON.stringify(state), before);
});
test('Continuation refuses an ordinary unflagged or already recorded workout', () => {
  const {state, selected} = continuationState();
  selected.needsReview = false;
  assert.equal(continuationPreview(state, selected.id), null);
  selected.needsReview = true;
  selected.status = 'completed';
  assert.equal(continuationPreview(state, selected.id), null);
});
for (const kind of ['plan', 'history']) test('Continuation acceptance rejects a stale ' + kind + ' snapshot', () => {
  const {state, proposal} = readyReview();
  if (kind === 'plan') state.plan.version++;
  if (kind === 'history') state.history.push({...clone(state.history[0]), id: 'additional-record', sessionId: 'additional-session'});
  const before = clone(state.plan);
  const result = T.applyProposal({...state, proposals: [proposal]}, proposal.id);
  assert.ok(result.error);
  assert.deepEqual(result.state.plan, before);
  assert.equal(result.state.proposals.find(item => item.id === proposal.id).status, 'stale');
});
test('Continuation acceptance rechecks missing prerequisites even when history count stays the same', () => {
  const {state, selected, proposal} = readyReview();
  const dependency = selected.dependsOn[0];
  state.history.find(workout => workout.sessionId === dependency).partial = true;
  const before = clone(state.plan);
  const result = T.applyProposal({...state, proposals: [proposal]}, proposal.id);
  assert.ok(result.error, 'evidence content is revalidated, not just its count');
  assert.deepEqual(result.state.plan, before);
});
test('Continuation acceptance rejects forged loads/dates/dependencies/status and multiple review targets', () => {
  const {state, selected, later, proposal} = readyReview();
  const before = clone(state.plan);
  const itemChanges = clone(selected.items);
  itemChanges.find(item => T.isLoadTracked(T.exFor(item.exerciseId))).kg = 777;
  for (const patch of [{items: itemChanges}, {date: '2026-12-31'}, {dependsOn: []}, {status: 'completed'}]) {
    const forged = {...proposal, patch: {...proposal.patch, ...patch}};
    if (proposal.changes) forged.changes = proposal.changes.map(change => ({...change, patch: {...change.patch, ...patch}}));
    const result = T.applyProposal({...state, proposals: [forged]}, forged.id);
    assert.ok(result.error, 'forged ' + Object.keys(patch)[0] + ' is rejected');
    assert.deepEqual(result.state.plan, before);
  }
  const forged = {...proposal, changes: [
    {sessionId: selected.id, patch: {needsReview: false}},
    {sessionId: later.id, patch: {needsReview: false}},
  ]};
  const result = T.applyProposal({...state, proposals: [forged]}, forged.id);
  assert.ok(result.error, 'review cannot smuggle a second flag clearance');
  assert.deepEqual(result.state.plan, before);
});
test('Continuation proposals survive saved-state validation and reopen for review', () => {
  const {state, proposal} = readyReview();
  const restored = S.readSavedState(JSON.stringify({...state, proposals: [proposal]}));
  assert.equal(restored.proposals[0].type, 'review');
  const result = T.applyProposal(restored, proposal.id);
  assert.equal(result.error, undefined);
});

const sourceHashes = Object.fromEntries(['training.ts', 'substitutions.ts', 'customize.ts', 'training-focus.ts', 'program-catalog.ts', 'saved-data.ts'].map(name => [name,
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'lib', name))).digest('hex')]));
const report = {repository: root, checkedAt: new OriginalDate().toISOString(), sourceHashes,
  passed: results.filter(result => result.passed).length, total: results.length, results};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(report.passed + '/' + report.total + ' desired-behavior regression cases passed. Report: ' + reportPath);
if (report.passed !== report.total) process.exitCode = 1;
