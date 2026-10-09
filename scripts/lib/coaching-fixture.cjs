const path = require('node:path');
const {createTsxLoader} = require('./component-hook-harness.cjs');
function coachingFixture(repo, accountId, options = {}) {
  const loader = createTsxLoader(repo), training = loader.load(path.join(repo, 'lib/training.ts'));
  const coaching = loader.load(path.join(repo, 'lib/workout-coaching.ts'));
  const identity = loader.load(path.join(repo, 'lib/workout-coaching-identity.ts'));
  const state = training.initialState(), session = state.plan.sessions[0], now = Date.now();
  const workout = {id: crypto.randomUUID(), sessionId: session.id, title: 'private workout title', date: training.day(), startedAt: now - 300_000,
    targets: session.items.map(item => ({...item})), sets: session.items.flatMap(item => Array.from({length: item.sets}, (_, index) =>
      ({exerciseId: item.exerciseId, set: index + 1, reps: item.reps, kg: 50, done: true, rir: 2, metrics: {notes: 'private workout note'}}))),
    effort: 'right', symptom: 'no', ...(!options.lift ? {finishedAt: now} : {})};
  state.profile.name = 'private profile name';
  if (options.lift) state.active = workout;
  else {state.history = [workout]; session.status = 'completed';}
  const built = coaching.buildWorkoutCoaching(state, workout.id, options.lift ? {exerciseId: workout.sets[0].exerciseId} : {});
  if (!built.eligible) throw Error('Actual coaching fixture failed: ' + JSON.stringify(built));
  const context = built.context, contextDigest = identity.workoutCoachingDigest(context), requestId = identity.workoutCoachingRequestId(accountId, contextDigest);
  const reply = {policy: coaching.COACHING_POLICY, workoutId: context.workoutId, contextDigest,
    observationIds: [...new Set([context.observations[0].id, ...context.observations.filter(row => row.required).map(row => row.id)])].slice(0, 6),
    reviewIds: [context.reviews[0].id], priority: 'performance'};
  return {loader, training, coaching, identity, state, workout, context, contextDigest, requestId, reply,
    payload: {requestId, contextDigest, context, consent: true}};
}
module.exports = {coachingFixture};
