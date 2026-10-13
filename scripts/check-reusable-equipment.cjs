const assert = require('node:assert/strict');
const {load, workoutFixture} = require('./domain-test-loader.cjs');
const T = load('lib/training.ts'), B = load('lib/reusable-plan.ts'), E = load('lib/equipment.ts');
const checks = [];
function test(name, fn) { fn(); checks.push(name); console.log('PASS: ' + name); }
function fixture() {
  const s = {...workoutFixture(), active: null};
  return B.savePlanCopy(s, s.plan.id, s.plan.version);
}
function preview(s) { return B.previewReusablePlan(s, s.saved[0].id, T.addDays(s.plan.sessions[0].date, 14)); }
function inventory(s, change = {}) {
  return {...s, profile: {...s.profile, inventory: {...E.defaultInventory('Dumbbells'), confirmed: true, ...change}}};
}
test('Saved app block rechecks missing dumbbells despite an unchanged preset', () => {
  const s = inventory(fixture(), {dumbbells: 'none'}), before = JSON.stringify(s);
  assert.throws(() => preview(s), /dumbbell/i);
  assert.equal(JSON.stringify(s), before);
});
test('A single dumbbell cannot qualify a paired-dumbbell prescription', () => {
  assert.throws(() => preview(inventory(fixture(), {dumbbells: 'single'})), /two equal dumbbells/i);
});
test('Current floor-transfer restriction is checked before reuse', () => {
  const s = inventory(fixture()); s.profile.noFloor = true;
  assert.throws(() => preview(s), /floor transfers/i);
});
test('Removed floor space is checked without substituting the saved exercises', () => {
  const s = inventory(fixture()); s.profile.inventory.items = s.profile.inventory.items.filter(x => x !== 'floor');
  const before = JSON.stringify(s.saved);
  assert.throws(() => preview(s), /floor/i);
  assert.equal(JSON.stringify(s.saved), before);
});
test('Timed sessions also need the currently confirmed walking/running route', () => {
  const s = inventory(fixture());
  s.saved[0].sessions[0].runSteps = [{label: 'Synthetic easy run', seconds: 60}];
  s.profile.inventory.items = s.profile.inventory.items.filter(x => x !== 'route');
  assert.throws(() => preview(s), /route/i);
});
test('Available equipment accepts new unperformed sessions with unknown loads', () => {
  const s = inventory(fixture()), before = JSON.stringify(s), q = preview(s), next = B.acceptReusablePlan(s, q);
  assert.notEqual(next.plan.id, s.plan.id);
  assert.ok(next.plan.sessions.every(x => x.items.every(i => i.kg === null)));
  assert.deepEqual(next.history, s.history);
  assert.equal(JSON.stringify(s), before);
});
test('Equipment changed after preview invalidates acceptance without mutation', () => {
  const s = inventory(fixture()), q = preview(s), changed = inventory(s, {dumbbells: 'none'}), before = JSON.stringify(changed);
  assert.throws(() => B.acceptReusablePlan(changed, q), /changed/i);
  assert.equal(JSON.stringify(changed), before);
});
test('Coach and manual tracking retain their original exercise authority', () => {
  for (const mode of ['coach', 'manual']) {
    const s = inventory(fixture(), {dumbbells: 'none'}); s.saved[0].profile.mode = mode;
    assert.equal(B.acceptReusablePlan(s, preview(s)).plan.profile.mode, mode);
  }
});
test('Legacy profiles with no detailed survey retain their existing reuse path', () => {
  const s = fixture(); assert.equal(s.profile.inventory, undefined);
  assert.equal(B.acceptReusablePlan(s, preview(s)).plan.profile.inventory, undefined);
});
test('Native shared entrypoint enforces missing equipment and accepts available equipment', () => {
  const N = load('mobile/src/shared/reusable-plan.ts');
  const s = inventory(fixture()), start = T.addDays(s.plan.sessions[0].date, 14);
  const blocked = inventory(s, {dumbbells: 'none'});
  assert.throws(() => N.previewReusablePlan(blocked, blocked.saved[0].id, start), /dumbbell/i);
  assert.equal(N.acceptReusablePlan(s, N.previewReusablePlan(s, s.saved[0].id, start)).plan.profile.inventory.confirmed, true);
});
console.log('PASS: ' + checks.length + ' reusable-block equipment scenarios');
