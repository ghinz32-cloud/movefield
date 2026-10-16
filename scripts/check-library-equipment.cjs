/* Exercise-specific inventory and muscle semantics; synthetic records only. */
const assert = require('node:assert/strict');
const {load} = require('./domain-test-loader.cjs');
const T = load('lib/training.ts'), E = load('lib/equipment.ts'), M = load('lib/muscle-work.ts');
const O = load('lib/onboarding.ts'), S = load('lib/saved-data.ts');
const cases = [];
function test(name, check) { check(); cases.push(name); console.log('PASS ' + name); }
const profile = (items, dumbbells = 'none', extra = {}) => ({...T.blankProfile,
  inventory: {confirmed: true, items, dumbbells, dumbbellLoading: 'adjustable'}, ...extra});
const fit = (id, p) => E.equipmentFit(T.exFor(id), p);
const casesById = [
  ['lib-cable-face-pull', ['cable', 'cable-rope'], 'none', 'face-pull', ['Shoulders', 'Back']],
  ['lib-db-chest-supported-row', ['incline-bench'], 'pair', 'horizontal-pull', ['Back']],
  ['lib-cable-standing-fly', ['dual-cable'], 'none', 'chest-fly', ['Chest']],
  ['lib-cable-lateral-raise', ['cable'], 'none', 'lateral-raise', ['Shoulders']],
  ['lib-db-reverse-fly', [], 'pair', 'rear-shoulder', ['Shoulders', 'Back']],
  ['lib-bar-hip-thrust', ['barbell', 'bench', 'floor', 'bar-pad'], 'none', 'hip-extension', ['Glutes']],
  ['lib-stack-pec-deck', ['pec-deck'], 'none', 'chest-fly', ['Chest']],
  ['lib-stack-reverse-fly', ['reverse-fly'], 'none', 'rear-shoulder', ['Shoulders', 'Back']],
];
test('Every canonical exercise can be found by its exact name while abbreviation filters still work', () => {
  for (const e of T.exercises) assert.equal(T.matchesExercise(e, e.name), true, e.id + ': ' + e.name);
  const pec = T.exFor('lib-stack-pec-deck');
  assert.equal(T.matchesExercise(pec, 'pec deck'), true);
  assert.equal(T.matchesExercise(T.exFor('bench'), 'pec'), true);
  assert.equal(T.matchesExercise(T.exFor('squat'), 'squat db'), true);
  assert.equal(T.matchesExercise(T.exFor('squat'), 'dumbell goblet'), true);
  assert.equal(T.matchesExercise(T.exFor('plank'), 'abs'), true);
  assert.equal(T.matchesExercise(T.exFor('squat'), 'cable'), false);
  assert.equal(T.matchesExercise(pec, 'pec deck barbell'), false);
});
test('Every added movement requires its exact guide-backed equipment, with no assumed extra dumbbell', () => {
  for (const [id, items, dumbbells, role, primary] of casesById) {
    const p = profile(items, dumbbells);
    assert.deepEqual(E.inventoryErrors(p), [], id);
    assert.equal(fit(id, p).available, true, id);
    assert.equal(fit(id, p).known, true, id);
    for (const missing of items) assert.equal(fit(id, profile(items.filter(k => k !== missing), dumbbells)).available, false, id + ' needs ' + missing);
    if (dumbbells === 'pair') assert.equal(fit(id, profile(items, 'single')).available, false, id + ' requires a pair');
    assert.equal(E.movementRoles[id].role, role, id);
    assert.deepEqual(M.itemMuscleWork({exerciseId: id}).primary, primary, id);
  }
});
test('Single cable and chest press equipment cannot silently satisfy dual cable or pec-deck variations', () => {
  const generic = profile(['cable', 'chest-press', 'row-machine'], 'pair');
  for (const id of ['lib-cable-face-pull', 'lib-cable-standing-fly', 'lib-stack-pec-deck', 'lib-stack-reverse-fly']) assert.equal(fit(id, generic).available, false, id);
  assert.equal(fit('lib-stack-reverse-fly', profile(['pec-deck'])).available, false);
  assert.equal(fit('lib-stack-pec-deck', profile(['reverse-fly'])).available, false);
});
test('Every source machine with an unconfirmed loading type stays unknown even in a confirmed full gym', () => {
  const unknown = T.exercises.filter(e => /unconfirmed|unspecified/i.test(e.equipment));
  assert.equal(unknown.length, 27);
  const p = {...T.blankProfile, inventory: {...E.defaultInventory(), confirmed: true}};
  for (const e of unknown) {
    assert.equal(E.equipmentFit(e, p).available, false, e.id);
    assert.equal(E.equipmentFit(e, p).known, false, e.id);
  }
  assert.equal(E.movementRoles['ref-Lying_Leg_Curls'].role, 'knee-flexion');
  assert.equal(T.exFor('ref-Lying_Leg_Curls').progressionEnabled, false);
});
test('Hip thrust floor transfers remain excluded by the no-floor preference', () => {
  const p = profile(['barbell', 'bench', 'floor', 'bar-pad'], 'none', {noFloor: true});
  assert.equal(fit('lib-bar-hip-thrust', p).available, false);
  assert.match(fit('lib-bar-hip-thrust', p).reason, /floor transfers/i);
});
test('Flyes, face pulls, rows and hinges retain distinct movement and muscle roles', () => {
  for (const id of ['lib-cable-standing-fly', 'lib-stack-pec-deck']) {
    assert.ok(!E.sameFunctionIds(id).includes('bench'));
    assert.deepEqual(M.itemMuscleWork({exerciseId: id}).secondary, []);
  }
  assert.deepEqual(E.sameFunctionIds('lib-cable-face-pull'), ['ref-Face_Pull']);
  assert.ok(!E.sameFunctionIds('lib-db-reverse-fly').includes('row'));
  assert.ok(!E.sameFunctionIds('lib-bar-hip-thrust').includes('rdl'));
  assert.deepEqual(M.itemMuscleWork({exerciseId: 'lib-db-chest-supported-row'}).secondary, ['Biceps', 'Shoulders']);
});
test('New capability choices remain unconfirmed in new setups and are never inserted into existing confirmed inventory', () => {
  const added = ['dual-cable', 'cable-rope', 'bar-pad', 'pec-deck', 'reverse-fly'];
  const fresh = O.freshState();
  assert.equal(fresh.profile.inventory.confirmed, false);
  assert.ok(added.every(key => fresh.profile.inventory.items.includes(key)));
  const old = profile(['cable', 'barbell', 'bench', 'floor', 'chest-press'], 'pair');
  assert.deepEqual(O.hydrateSetupProfile(old).inventory, old.inventory);
  const s = {...T.initialState(), profile: old};
  assert.deepEqual(S.readSavedState(JSON.stringify(s)).profile.inventory, old.inventory);
  for (const id of ['lib-cable-face-pull', 'lib-cable-standing-fly', 'lib-bar-hip-thrust', 'lib-stack-pec-deck', 'lib-stack-reverse-fly']) assert.equal(fit(id, old).available, false, id);
});
test('New inventory choices and setup-specific load records survive validated export and parse', () => {
  const s = T.initialState();
  s.profile.inventory = {...E.defaultInventory(), confirmed: true};
  s.loadContext = {'lib-stack-pec-deck': 'Machine A seat 3', 'lib-cable-lateral-raise': 'Tower B low pulley'};
  const restored = S.readSavedState(JSON.stringify(s));
  assert.deepEqual(restored.profile.inventory, s.profile.inventory);
  assert.deepEqual(restored.loadContext, s.loadContext);
  assert.ok(T.exFor('lib-stack-pec-deck').requiresSetup);
  assert.equal(T.exFor('lib-cable-lateral-raise').loadMultiplier, 2);
  assert.equal(T.exFor('lib-cable-standing-fly').loadMultiplier, 2);
});
console.log('PASS ' + cases.length + ' exercise-library inventory and classification scenarios');
