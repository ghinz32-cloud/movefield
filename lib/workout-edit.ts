import {changed, exFor, type Plan, type State, type Workout} from './training';
import {completedSetError} from './rest-timer';
import {savedWorkoutSchema} from './saved-data';
import {workoutCompletionSignature, workoutExerciseProgress} from './workout-navigation';

export type SavedWorkoutEdit = {workoutId: string; original: string; draft: Workout};

export function beginSavedWorkoutEdit(state: State, workoutId: string): SavedWorkoutEdit {
  const record = state.history.find(workout => workout.id === workoutId);
  if (!record || record.finishedAt === undefined) throw Error('That saved workout is no longer available.');
  const original = JSON.stringify(record);
  return {workoutId, original, draft: JSON.parse(original) as Workout};
}

function immutableFields(workout: Workout) {
  const {sets, details, loadContext, ...identity} = workout;
  void sets; void details; void loadContext;
  return JSON.stringify(identity);
}

/** Replace one saved record in the normal local transaction, never reopen it as an active workout. */
export function applySavedWorkoutEdit(state: State, edit: SavedWorkoutEdit, partialAcknowledgement?: string): State {
  const index = state.history.findIndex(workout => workout.id === edit.workoutId);
  const original = state.history[index];
  if (!original || JSON.stringify(original) !== edit.original) throw Error('That workout changed. Reopen its latest record before editing.');
  const draft = edit.draft;
  if (!savedWorkoutSchema.safeParse(draft).success) throw Error('A workout entry is outside the supported range. Your saved record is unchanged.');
  if (immutableFields(original) !== immutableFields(draft)
      || JSON.stringify(original.sets.map(set => [set.exerciseId, set.set])) !== JSON.stringify(draft.sets.map(set => [set.exerciseId, set.set]))) {
    throw Error('Workout identity, dates, targets and set identities cannot change in this editor.');
  }
  if (JSON.stringify(draft) === edit.original) return state;
  for (const set of draft.sets) {
    if (exFor(set.exerciseId, state.custom).metric === 'reps' && !Number.isInteger(set.reps)) throw Error('Enter whole-number reps.');
    if (set.done) {
      const problem = completedSetError(set.reps, set.kg, exFor(set.exerciseId, state.custom).metric);
      if (problem) throw Error(problem);
    }
  }
  if (!draft.sets.some(set => set.done)) throw Error('Keep at least one logged set in a saved workout.');
  const partial = workoutExerciseProgress(state, draft).some(entry => !entry.complete);
  if (partial && partialAcknowledgement !== workoutCompletionSignature(state, draft)) throw Error('Confirm the unfinished exercises before saving a partial workout.');
  const recorded: Workout = {...draft, partial};
  const history = state.history.map((workout, i) => i === index ? recorded : workout);
  const related = history.filter(workout => workout.sessionId === recorded.sessionId && workout.finishedAt !== undefined);
  const status = related.some(workout => !workout.partial) ? 'completed' : 'partial';
  const updatePlan = (plan: Plan | null): Plan | null => {
    if (state.active?.sessionId === recorded.sessionId) return plan;
    if (!plan?.sessions.some(session => session.id === recorded.sessionId && session.status !== status)) return plan;
    return {...plan, version: plan.version + 1, sessions: plan.sessions.map(session => session.id === recorded.sessionId ? {...session, status} : session)};
  };
  return changed({...state, history, plan: updatePlan(state.plan), saved: state.saved.map(plan => updatePlan(plan)!),
    proposals: state.proposals.map(proposal => proposal.status === 'pending' || proposal.status === 'queued' ? {...proposal, status: 'stale'} : proposal),
    hold: state.hold || recorded.symptom === 'yes' || recorded.symptom === 'unsure'}, 'Updated saved workout: ' + recorded.title);
}
