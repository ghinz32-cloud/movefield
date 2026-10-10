import {type Item, type State, type Workout} from './training';

export const WORKOUT_OVERVIEW = -1;
export const WORKOUT_COMPLETE = -2;
export const WORKOUT_REMAINING = -3;

export type WorkoutExerciseProgress = {
  target: Item;
  index: number;
  loggedSets: number;
  totalSets: number;
  remainingSets: number;
  complete: boolean;
};

/** Prefer the targets captured at workout start, including when its plan was archived. */
export function workoutExerciseProgress(state: State, workout: Workout): WorkoutExerciseProgress[] {
  const session = [state.plan, ...state.saved].find(plan => plan?.sessions.some(entry => entry.id === workout.sessionId))
    ?.sessions.find(entry => entry.id === workout.sessionId);
  const targets = [...(workout.targets ?? session?.items ?? [])];
  for (const set of workout.sets) {
    if (!targets.some(target => target.exerciseId === set.exerciseId)) {
      targets.push({exerciseId: set.exerciseId, sets: Math.max(...workout.sets.filter(row => row.exerciseId === set.exerciseId).map(row => row.set)), reps: 0, rest: 60, kg: null});
    }
  }
  return targets.map((target, index) => {
    const sets = workout.sets.filter(set => set.exerciseId === target.exerciseId);
    const loggedSets = sets.filter(set => set.done).length;
    const totalSets = Math.max(target.sets, sets.length);
    const prescribedDone = Array.from({length: target.sets}, (_, i) => sets.some(set => set.set === i + 1 && set.done)).every(Boolean);
    const complete = totalSets > 0 && prescribedDone && sets.every(set => set.done);
    return {target, index, loggedSets, totalSets, remainingSets: Math.max(0, totalSets - loggedSets), complete};
  });
}

/** At the end, show the remaining list rather than silently abandoning earlier exercises. */
export function nextWorkoutExercise(state: State, workout: Workout, exerciseId: string): number {
  const progress = workoutExerciseProgress(state, workout);
  const current = progress.findIndex(entry => entry.target.exerciseId === exerciseId);
  if (current < 0) return WORKOUT_OVERVIEW;
  const next = progress.find(entry => entry.index > current && !entry.complete);
  if (next) return next.index;
  return progress.some(entry => !entry.complete) ? WORKOUT_REMAINING : WORKOUT_COMPLETE;
}

export function workoutCompletionSignature(state: State, workout: Workout): string {
  return JSON.stringify({id: workout.id, targets: workoutExerciseProgress(state, workout).map(entry => [entry.target.exerciseId, entry.target.sets]), sets: workout.sets.map(set => [set.exerciseId, set.set, set.done])});
}
