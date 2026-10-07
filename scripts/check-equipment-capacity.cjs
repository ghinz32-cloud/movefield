const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

// Use the same in-memory source loader as check-program-depth.cjs. No build or
// generated fixture files are needed, and the tests exercise the current source.
const NativeDate = Date;
const seedTime = new NativeDate('2026-10-07T17:00:00Z').getTime();
let clock = seedTime;
global.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
};
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const module = {exports: {}};
  cache.set(name, module);
  const source = ts.transpileModule(fs.readFileSync(path.join('lib', name + '.ts'), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText;
  new Function('require', 'module', 'exports', source)(request => request.startsWith('./')
    ? request.endsWith('.json')
      ? JSON.parse(fs.readFileSync(path.join('lib', request), 'utf8'))
      : load(request.slice(2))
    : require(request), module, module.exports);
  return module.exports;
}
const T = load('training');
const C = load('program-catalog');
const S = load('saved-data');
let passed = 0;
const failures = [];
function test(name, run) {
  clock = seedTime;
  try { run(); passed++; console.log('PASS ' + name); }
  catch (error) { failures.push({name, message: error.message}); console.error('FAIL ' + name + ': ' + error.message); }
}
function stateFor(programId = 'BBDB3', overrides = {}) {
  const definition = C.programCatalog.find(p => p.id === programId);
  assert.ok(definition, programId + ' is a real program');
  const profile = {
    ...T.blankProfile, name: 'Capacity test', goal: definition.goal, programId,
    equipment: C.programEquipment(definition), start: T.addDays(T.day(), -14),
    days: [0, 1, 2, 3, 4, 5, 6], weeks: 8, minutes: 120,
    experience: 'Some experience', ...overrides,
  };
  const result = T.buildPlan(profile);
  assert.ok(result.plan, result.errors.join(' '));
  return {...T.initialState(), profile, plan: result.plan, history: [], proposals: [],
    equipmentCaps: [], incrementKg: {}, loadContext: {}};
}
function record(session, focusId, kg, number, setup = '') {
  return {
    id: 'capacity-workout-' + number + '-' + session.id,
    sessionId: session.id, title: session.title, date: session.date,
    startedAt: new NativeDate(session.date + 'T12:00:00Z').getTime(),
    finishedAt: new NativeDate(session.date + 'T13:00:00Z').getTime(),
    targets: session.items.map(item => ({...item})),
    sets: session.items.flatMap(item => Array.from({length: item.sets}, (_, index) => ({
      exerciseId: item.exerciseId, set: index + 1,
      reps: item.repMax ?? item.reps,
      kg: T.isLoadTracked(T.exFor(item.exerciseId)) ? item.exerciseId === focusId ? kg : 1 : null,
      done: true,
    }))),
    loadContext: setup ? {[focusId]: setup} : {}, rir: {[focusId]: 3},
    partial: false, effort: 'right', symptom: 'no', supervisorConfirmed: true,
  };
}
function seedComparable(state, exerciseId = 'row', kg = 20, chosenRole) {
  const first = state.plan.sessions.find(session => session.status === 'scheduled' && (!chosenRole || (session.roleId || session.title) === chosenRole) && session.items.some(i => i.exerciseId === exerciseId));
  assert.ok(first, exerciseId + ' is in the actual plan');
  const role = first.roleId || first.title;
  const matching = state.plan.sessions.filter(session => session.status === 'scheduled' && (session.roleId || session.title) === role);
  assert.ok(matching.length >= 3, 'two completed exposures and a following session exist');
  const completed = matching.slice(0, 2);
  const setup = state.loadContext?.[exerciseId] || '';
  const history = [...state.history, ...completed.map((session, i) => record(session, exerciseId, kg, state.history.length + i, setup))];
  const next = {...state, history, incrementKg: {...state.incrementKg, [exerciseId]: 0.5},
    plan: {...state.plan, sessions: state.plan.sessions.map(session => completed.some(c => c.id === session.id) ? {...session, status: 'completed'} : session)}};
  const session = next.plan.sessions.find(s => s.id === matching[2].id);
  return {state: next, session, item: session.items.find(i => i.exerciseId === exerciseId)};
}
function capacityFixture(programId = 'BBDB3', exerciseId = 'row', overrides = {}) {
  let state = stateFor(programId, overrides);
  if (T.requiresSetup(T.exFor(exerciseId))) state.loadContext = {[exerciseId]: 'Machine A / seat 3 / handle 1'};
  const saved = T.setEquipmentLimit(state, exerciseId, 20);
  assert.equal(saved.error, undefined);
  return seedComparable(saved.state, exerciseId, 20);
}
function pending(state, proposal) { return {...state, proposals: [...state.proposals, proposal]}; }

test('Dumbbell capacity is per hand, independent of the volume multiplier', () => {
  const state = stateFor('BBDB3', {dumbbellMaxKg: 25});
  assert.equal(T.exFor('lib-db-floor-press').loadMultiplier, 2);
  for (const id of ['row', 'rdl', 'lib-db-floor-press']) assert.equal(T.equipmentLimit(state, id), 25);
  assert.equal(T.equipmentLimit(state, 'bench'), undefined);
  assert.equal(T.equipmentLimit(state, 'pulldown'), undefined);
  const exact = T.setEquipmentLimit(state, 'row', 18).state;
  assert.equal(T.equipmentLimit(exact, 'row'), 18);
  assert.equal(T.equipmentLimit(exact, 'rdl'), 25);
  assert.equal(T.equipmentLimit(T.setEquipmentLimit(exact, 'row', 30).state, 'row'), 25);
});

test('Machine capacity needs a label and remains isolated by exact setup and exercise', () => {
  let state = stateFor('BBM3');
  assert.ok(T.setEquipmentLimit(state, 'lib-stack-chest-press', 40).error);
  state.loadContext = {'lib-stack-chest-press': 'Machine A / seat 3'};
  state = T.setEquipmentLimit(state, 'lib-stack-chest-press', 40).state;
  state = {...state, loadContext: {'lib-stack-chest-press': 'Machine B / seat 3'}};
  assert.equal(T.equipmentLimit(state, 'lib-stack-chest-press'), undefined);
  state = T.setEquipmentLimit(state, 'lib-stack-chest-press', 60).state;
  assert.equal(state.equipmentCaps.length, 2);
  assert.equal(T.equipmentLimit(state, 'lib-stack-chest-press'), 60);
  assert.equal(T.equipmentLimit(state, 'lib-stack-leg-press'), undefined);
  state = {...state, loadContext: {'lib-stack-chest-press': 'Machine A / seat 3'}};
  assert.equal(T.equipmentLimit(state, 'lib-stack-chest-press'), 40);
  state = T.setEquipmentLimit(state, 'lib-stack-chest-press', undefined).state;
  assert.equal(T.equipmentLimit(state, 'lib-stack-chest-press'), undefined);
  assert.equal(state.equipmentCaps.length, 1);
});

test('Unknown capacity permits a supported next step; zero means unavailable', () => {
  const fixture = seedComparable(stateFor(), 'row');
  assert.equal(T.equipmentLimit(fixture.state, 'row'), undefined);
  assert.equal(T.loadSuggestion(fixture.state, fixture.item).nextKg, 20.5);
  const zero = T.setEquipmentLimit(fixture.state, 'row', 0).state;
  assert.equal(T.equipmentLimit(zero, 'row'), 0);
  assert.equal(T.loadSuggestion(zero, fixture.item).kg, null);
  assert.equal(T.loadSuggestion(zero, fixture.item).nextKg, undefined);
  assert.equal(T.makeCapacityProposal(zero), null);
  const cleared = T.setEquipmentLimit(zero, 'row', undefined).state;
  assert.equal(T.loadSuggestion(cleared, fixture.item).nextKg, 20.5);
});

test('Invalid limits and unsupported exercises are rejected without mutating state', () => {
  const state = stateFor();
  for (const value of [-1, NaN, Infinity, 1501]) {
    const result = T.setEquipmentLimit(state, 'row', value);
    assert.ok(result.error); assert.equal(result.state, state);
  }
  for (const id of ['deadbug', 'not-an-exercise']) assert.ok(T.setEquipmentLimit(state, id, 20).error);
  const active = {...state, active: record(state.plan.sessions[0], 'row', 20, 'active')};
  assert.ok(T.setEquipmentLimit(active, 'row', 20).error);
});

test('Lower capacity suppresses accepted and historical loads without clamping or deleting records', () => {
  const {state, item} = capacityFixture();
  const before = JSON.stringify(state.history);
  const lower = T.setEquipmentLimit(state, 'row', 15).state;
  assert.equal(T.loadSuggestion(lower, {...item, kg: 20}).kg, null);
  assert.equal(T.loadSuggestion(lower, item).kg, null);
  assert.equal(T.loadSuggestion(lower, item).nextKg, undefined);
  assert.equal(JSON.stringify(lower.history), before);
  assert.ok(lower.history.every(w => w.sets.some(s => s.exerciseId === 'row' && s.kg === 20)));
});

test('Both reaching the maximum and an increment overshooting it suppress nextKg', () => {
  const {state, item} = capacityFixture();
  const at = T.loadSuggestion(state, item);
  assert.equal(at.kg, 20); assert.equal(at.atCapacity, true); assert.equal(at.nextKg, undefined);
  const between = T.setEquipmentLimit(state, 'row', 20.25).state;
  const blocked = T.loadSuggestion(between, item);
  assert.equal(blocked.kg, 20); assert.equal(blocked.atCapacity, true); assert.equal(blocked.nextKg, undefined);
  const room = T.setEquipmentLimit(state, 'row', 20.5).state;
  assert.equal(T.loadSuggestion(room, item).nextKg, 20.5);
});

test('Capacity readiness requires two comparable comfortable exposures', () => {
  const {state, item} = capacityFixture();
  for (const change of [
    w => ({...w, partial: true}), w => ({...w, effort: 'harder'}),
    w => ({...w, symptom: 'yes'}), w => ({...w, symptom: 'skip'}),
    w => ({...w, rir: {row: 1}}), w => ({...w, loadContext: {}, targets: w.targets.map(i => i.exerciseId === 'row' ? {...i, loadRole: 'different work'} : i)}),
  ]) {
    const changed = {...state, history: state.history.map((w, i) => i === 1 ? change(w) : w)};
    assert.equal(T.loadSuggestion(changed, item).atCapacity, undefined);
    assert.equal(T.makeCapacityProposal(changed), null);
  }
});

test('Changing machine setup does not carry comparable load or capacity readiness across', () => {
  const {state, item} = capacityFixture('BBM3', 'lib-stack-chest-press');
  assert.equal(T.loadSuggestion(state, item).atCapacity, true);
  const moved = {...state, loadContext: {'lib-stack-chest-press': 'Machine B / seat 3 / handle 1'}};
  assert.equal(T.equipmentLimit(moved, item.exerciseId), undefined);
  assert.equal(T.loadSuggestion(moved, item).kg, null);
  assert.equal(T.makeCapacityProposal(moved), null);
  assert.equal(T.loadSuggestion(moved, {...item, kg: 20, loadContext: state.loadContext[item.exerciseId]}).kg, null);
});

test('Canonical kilogram limits survive persistence and display-unit changes', () => {
  const kg = T.toKg(25, 'lb');
  let state = stateFor('BBDB3', {units: 'lb', dumbbellMaxKg: kg});
  state = T.setEquipmentLimit(state, 'row', kg).state;
  const restored = S.readSavedState(JSON.stringify(state));
  assert.equal(restored.profile.dumbbellMaxKg, kg);
  assert.equal(restored.equipmentCaps[0].maxKg, kg);
  const metric = {...restored, profile: {...restored.profile, units: 'kg'}};
  assert.equal(T.equipmentLimit(metric, 'row'), kg);
  assert.equal(T.equipmentLimit({...metric, profile: {...metric.profile, units: 'lb'}}, 'row'), kg);
  assert.match(T.displayLoad(kg, 'lb'), /^25 lb$/);
  assert.throws(() => S.readSavedState(JSON.stringify({...state, equipmentCaps: [...state.equipmentCaps, state.equipmentCaps[0]]})), /Duplicate equipment/);
});

test('Changing a limit stales pending and queued previews, including a load increase', () => {
  const {state} = seedComparable(stateFor(), 'row');
  const proposal = T.makeLoadProposal(state).proposal;
  assert.ok(proposal); assert.equal(proposal.type, 'load');
  const queued = {...proposal, id: proposal.id + '-queued', status: 'queued'};
  const staged = {...state, proposals: [proposal, queued]};
  const changed = T.setEquipmentLimit(staged, 'row', 20).state;
  assert.ok(changed.proposals.every(p => p.status === 'stale'));
  const result = T.applyProposal(changed, proposal.id);
  assert.ok(result.error); assert.equal(result.state.plan, changed.plan);
  // Apply also rechecks trusted calculations if a caller restores an old pending status.
  const resurrected = {...changed, proposals: [proposal]};
  assert.ok(T.applyProposal(resurrected, proposal.id).error);
});

test('A wider range changes matching future work only and requires explicit acceptance', () => {
  const {state, item, session} = capacityFixture();
  const before = JSON.stringify(state);
  const proposal = T.makeCapacityProposal(state);
  assert.ok(proposal); assert.equal(proposal.type, 'capacity');
  assert.equal(T.makeLoadProposal(state).proposal.type, 'capacity');
  assert.equal(JSON.stringify(state), before, 'preview has no state mutation');
  for (const change of proposal.changes) {
    const previous = state.plan.sessions.find(s => s.id === change.sessionId);
    assert.equal(previous.status, 'scheduled'); assert.equal(previous.roleId, session.roleId);
    assert.ok(previous.date >= session.date);
    const updated = change.patch.items.find(i => i.exerciseId === item.exerciseId);
    const prior = previous.items.find(i => i.exerciseId === item.exerciseId);
    assert.equal(updated.repMin, 12); assert.equal(updated.repMax, 15);
    assert.equal(updated.sets, prior.sets); assert.equal(updated.rest, prior.rest);
    assert.equal(updated.kg, null); assert.ok(change.patch.minutes <= state.plan.profile.minutes);
  }
  const result = T.applyProposal(pending(state, proposal), proposal.id);
  assert.equal(result.error, undefined); assert.equal(result.state.plan.version, state.plan.version + 1);
  assert.deepEqual(result.state.history, state.history);
  assert.deepEqual(result.state.plan.sessions.map(s => s.date), state.plan.sessions.map(s => s.date));
  for (const sessionBefore of state.plan.sessions.filter(s => !proposal.changes.some(c => c.sessionId === s.id)))
    assert.deepEqual(result.state.plan.sessions.find(s => s.id === sessionBefore.id), sessionBefore);
  assert.ok(S.readSavedState(JSON.stringify(result.state)).plan);
});

test('Tampered capacity patches and capacity changes after preview are rejected', () => {
  const {state} = capacityFixture();
  const proposal = T.makeCapacityProposal(state);
  assert.ok(proposal);
  const forged = {...proposal, changes: proposal.changes.map((c, n) => n ? c : {...c, patch: {...c.patch, date: T.addDays(T.day(), 1)}})};
  assert.ok(T.applyProposal(pending(state, forged), forged.id).error);
  const largerEquipment = {...state, equipmentCaps: state.equipmentCaps.map(c => ({...c, maxKg: 30}))};
  assert.ok(T.applyProposal(pending(largerEquipment, proposal), proposal.id).error);
  const smallerEquipment = {...state, equipmentCaps: state.equipmentCaps.map(c => ({...c, maxKg: 10}))};
  assert.ok(T.applyProposal(pending(smallerEquipment, proposal), proposal.id).error);
});

test('Youth, pure powerlifting, general strength and coach-owned plans do not widen ranges', () => {
  for (const [id, overrides] of [['QG3', {age: 14, supervision: true}], ['PL3', {}], ['ST2', {}]]) {
    const {state} = capacityFixture(id, 'row', overrides);
    assert.equal(T.makeCapacityProposal(state), null, id);
  }
  const {state} = capacityFixture();
  for (const mode of ['manual', 'coach']) assert.equal(T.makeCapacityProposal({...state, plan: {...state.plan, profile: {...state.plan.profile, mode}}}), null);
  assert.equal(T.makeCapacityProposal({...state, hold: true}), null);
  assert.equal(T.makeCapacityProposal({...state, plan: {...state.plan, paused: true}}), null);
  assert.equal(T.makeCapacityProposal({...state, active: record(state.plan.sessions[0], 'row', 20, 'active')}), null);
});

test('Wider ranges stop at 20 after new comparable evidence for each accepted range', () => {
  let {state, session} = capacityFixture();
  const role = session.roleId || session.title;
  for (const expected of [15, 20]) {
    const proposal = T.makeCapacityProposal(state);
    assert.ok(proposal, 'new evidence allows the next bounded range');
    assert.ok(proposal.changes.every(c => c.patch.items.find(i => i.exerciseId === 'row').repMax === expected));
    const result = T.applyProposal(pending(state, proposal), proposal.id);
    assert.equal(result.error, undefined);
    state = result.state;
    assert.equal(T.makeCapacityProposal(state), null, 'old-range evidence cannot immediately justify another increase');
    clock += 14 * 24 * 60 * 60 * 1000;
    state = seedComparable(state, 'row', 20, role).state;
  }
  assert.equal(T.makeCapacityProposal(state), null, '20 is the upper bound');
});

for (const weeks of [5, 8]) test(`Capacity progression respects time throughout a ${weeks}-week block`, () => {
  let checked = false;
  for (const [program, exerciseId] of [['GFM2', 'leg-curl'], ['BBM3', 'lib-stack-chest-press'], ['PBSTART3', 'row'], ['PBT4', 'leg-extension']]) {
    const {state} = capacityFixture(program, exerciseId, {weeks});
    const proposal = T.makeCapacityProposal(state);
    if (!proposal) continue;
    const beforeMax = Math.max(...proposal.changes.map(c => state.plan.sessions.find(s => s.id === c.sessionId).minutes));
    const afterMax = Math.max(...proposal.changes.map(c => c.patch.minutes));
    if (afterMax <= beforeMax) continue;
    // The original whole plan must genuinely fit this smaller window. Only the
    // proposed extra reps make it stop fitting, not another existing session.
    if (!T.buildPlan({...state.plan.profile, minutes: beforeMax}).plan) continue;
    if (weeks === 8) {
      // Reproduce the former bypass: a later reduced-volume review session can
      // fit, but must not be offered by skipping the current matching sessions.
      assert.ok(proposal.changes.some(change => {
        const original = state.plan.sessions.find(s => s.id === change.sessionId);
        return original.week === weeks && change.patch.minutes <= beforeMax;
      }), 'the review week is a genuinely shorter alternative');
    }
    const tight = {...state, profile: {...state.profile, minutes: beforeMax}, plan: {...state.plan, profile: {...state.plan.profile, minutes: beforeMax}}};
    const unchanged = JSON.stringify(tight.plan.sessions);
    assert.equal(T.makeCapacityProposal(tight), null, 'do not bypass the time limit by jumping to a later review week');
    assert.equal(JSON.stringify(tight.plan.sessions), unchanged);
    checked = true; break;
  }
  assert.ok(checked, 'a real program supplies a range increase that needs more time');
});

test('Offline capacity acceptance queues the change without changing targets', () => {
  const {state} = capacityFixture();
  const proposal = T.makeCapacityProposal(state);
  assert.ok(proposal);
  const offline = {...pending(state, proposal), simulatedOffline: true};
  const result = T.applyProposal(offline, proposal.id);
  assert.ok(result.error);
  assert.equal(result.state.plan, state.plan);
  assert.equal(result.state.proposals.find(p => p.id === proposal.id).status, 'queued');
});

console.log(`${passed} equipment-capacity checks passed; ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
