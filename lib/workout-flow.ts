import { type State, type Workout } from './training';

export function workoutExercises(s: State) {
  const w = s.active;
  if (!w) return [];
  const targets = w.targets ?? s.plan?.sessions.find(x => x.id === w.sessionId)?.items ?? [];
  return targets.map(target => {
    const sets = w.sets.filter(x => x.exerciseId === target.exerciseId);
    const done = sets.filter(x => x.done).length;
    return { target, done, total: target.sets, complete: sets.length === target.sets && done === target.sets };
  });
}

/** At the end, return to the remaining list rather than wrap unexpectedly. */
export function nextUnfinishedExercise(s: State, after: string): string | null {
  const rows = workoutExercises(s);
  return rows.slice(rows.findIndex(x => x.target.exerciseId === after) + 1)
    .find(x => !x.complete)?.target.exerciseId ?? null;
}

export function workoutConfirmation(w: Workout): string {
  // The confirmation screen may collect feedback; its workout and set snapshot
  // must still match when it is accepted.
  return JSON.stringify({ id: w.id, sessionId: w.sessionId, sets: w.sets, targets: w.targets, loadContext: w.loadContext });
}

export function assertWorkoutConfirmation(s: State, expected: string) {
  if (!s.active || workoutConfirmation(s.active) !== expected) {
    throw new Error('This workout changed. Review the current workout before finishing.');
  }
}
