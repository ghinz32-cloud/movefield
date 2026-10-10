const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, workoutFixture } = require('./domain-test-loader.cjs');
const { createDurableState } = load('lib/durable-state.ts');
const { writeBrowserState, StorageConflict, PERSONAL_STATE_KEY, SAMPLE_STATE_KEY } = load('lib/browser-state.ts');
const flow = load('lib/workout-flow.ts');
const { logWorkoutSet } = load('lib/workout-log.ts');
const { readSavedState } = load('lib/saved-data.ts');
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
function controller(initial, write) {
  const published = [], statuses = [];
  const store = createDurableState({ initial, validate: s => { readSavedState(JSON.stringify(s)); return s; }, write, publish: s => published.push(s), status: (state, error) => statuses.push({ state, error }) });
  return { store, published, statuses };
}
(async () => {
  await test('Failed set write publishes no completion, advancement, or timer; retry saves once', async () => {
    let fail = true, disk = '', writes = 0;
    const s = workoutFixture();
    const { store, published, statuses } = controller(s, async next => { writes++; if (fail) throw new Error('Quota exceeded'); disk = JSON.stringify(next); });
    await assert.rejects(store.commit(v => logWorkoutSet(v, 0, 60)), /Quota/);
    assert.equal(store.get(), s); assert.equal(published.length, 0); assert.equal(store.get().active.sets[0].done, false); assert.equal(store.get().restTimer, undefined);
    assert.equal(statuses.at(-1).state, 'failed');
    fail = false; assert.equal(await store.commit(v => logWorkoutSet(v, 0, 60)), true);
    assert.equal(readSavedState(disk).active.sets[0].done, true); assert.equal(published.length, 1); assert.equal(writes, 2);
  });
  await test('Delayed save disables concurrent commands and does not announce saved early', async () => {
    let release; const gate = new Promise(r => release = r);
    const { store, published, statuses } = controller(workoutFixture(), () => gate);
    const save = store.commit(v => logWorkoutSet(v, 0, 60));
    assert.equal(store.busy(), true); assert.equal(await store.commit(v => logWorkoutSet(v, 0, 60)), false);
    assert.equal(store.stage(v => v), false); assert.equal(published.length, 0); assert.equal(statuses.at(-1).state, 'saving');
    release(); await save; assert.equal(published.length, 1); assert.equal(statuses.at(-1).state, 'saved');
  });
  await test('Staged input is kept when storage fails and a later retry uses the latest draft', async () => {
    let fail = true, saved;
    const { store, statuses } = controller(workoutFixture(), async v => { if (fail) throw new Error('Offline disk'); saved = v; });
    store.stage(v => ({ ...v, profile: { ...v.profile, name: 'Latest synthetic input' } }));
    await assert.rejects(store.flush()); assert.equal(store.get().profile.name, 'Latest synthetic input'); assert.equal(statuses.at(-1).state, 'failed');
    fail = false; await store.commit(v => v); assert.equal(saved.profile.name, 'Latest synthetic input');
  });
  await test('Staged writes precede the durable command and cannot overwrite it later', async () => {
    const records = []; const { store } = controller(workoutFixture(), async v => records.push(JSON.stringify(v)));
    store.stage(v => ({ ...v, profile: { ...v.profile, units: 'lb' } }));
    await store.commit(v => logWorkoutSet(v, 0, 60)); await store.flush();
    assert.equal(records.length, 2); assert.equal(JSON.parse(records[1]).active.sets[0].done, true); assert.equal(JSON.parse(records[1]).profile.units, 'lb');
  });
  await test('Invalid commands reject before touching storage and release the busy guard', async () => {
    let writes = 0; const { store } = controller(workoutFixture(), async () => writes++);
    await assert.rejects(store.commit(v => ({ ...v, profile: { ...v.profile, age: -1 } })));
    assert.equal(writes, 0); assert.equal(store.busy(), false);
  });
  await test('Finish confirmation rejects a different workout and changed set data', () => {
    const s = workoutFixture(), token = flow.workoutConfirmation(s.active);
    assert.throws(() => flow.assertWorkoutConfirmation({ ...s, active: { ...s.active, id: 'another-workout' } }, token));
    assert.throws(() => flow.assertWorkoutConfirmation(logWorkoutSet(s, 0, 60), token));
    assert.throws(() => flow.assertWorkoutConfirmation({ ...s, active: null }, token));
    assert.doesNotThrow(() => flow.assertWorkoutConfirmation({ ...s, active: { ...s.active, effort: 'right' } }, token));
  });
  await test('Overview follows prescription order and advancement skips completed exercises', () => {
    const s = workoutFixture(); const ids = s.active.targets.map(i => i.exerciseId); assert.ok(ids.length > 2);
    const done = { ...s, active: { ...s.active, sets: s.active.sets.map(x => ({ ...x, done: ids.slice(0, 2).includes(x.exerciseId) })) } };
    assert.deepEqual(flow.workoutExercises(done).map(x => x.target.exerciseId), ids);
    assert.equal(flow.nextUnfinishedExercise(done, ids[0]), ids[2]); assert.equal(flow.nextUnfinishedExercise(s, ids.at(-1)), null);
  });
  await test('Missing prescribed sets never produce an all-complete exercise', () => {
    const s = workoutFixture(); s.active = { ...s.active, sets: s.active.sets.slice(1).map(x => ({ ...x, done: true })) };
    assert.equal(flow.workoutExercises(s)[0].complete, false);
  });
  await test('Browser writes reject another tab and preserve its bytes', () => {
    const disk = new Map([[PERSONAL_STATE_KEY, 'another-tab']]); const storage = { getItem: k => disk.get(k) ?? null, setItem: (k, v) => disk.set(k, v) };
    assert.throws(() => writeBrowserState(storage, PERSONAL_STATE_KEY, 'old', 'new'), StorageConflict);
    assert.equal(disk.get(PERSONAL_STATE_KEY), 'another-tab');
  });
  await test('Browser quota errors propagate and sample writes cannot replace personal data', () => {
    assert.throws(() => writeBrowserState({ getItem: () => '', setItem: () => { throw new Error('Quota'); } }, PERSONAL_STATE_KEY, '', 'next'), /Quota/);
    const disk = new Map([[PERSONAL_STATE_KEY, 'personal']]); const storage = { getItem: k => disk.get(k) ?? null, setItem: (k, v) => disk.set(k, v) };
    writeBrowserState(storage, SAMPLE_STATE_KEY, '', 'sample'); assert.equal(disk.get(PERSONAL_STATE_KEY), 'personal');
  });
  await test('Web and native use byte-identical shared durability and flow contracts', () => {
    for (const file of ['durable-state.ts', 'workout-flow.ts']) assert.equal(fs.readFileSync('lib/' + file, 'utf8'), fs.readFileSync('mobile/src/shared/' + file, 'utf8'));
  });
  console.log(`${passed} durability/flow regression groups passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
