import { setMetricsSchema } from './shared/saved-data';
import { blankProfile, buildPlan, day, eligibility, exFor, initialState, isLoadTracked, uid, type Exercise, type Plan, type Profile, type SetLog, type State, type Workout } from './shared/training';
import { focusScheduleConflict } from './shared/training-focus';
import { programCatalog, programEquipment } from './shared/program-catalog';
export const FOUNDATION = 'foundation';
export const RUN_WALK = 'run-walk';
export const SPORT_FOUNDATION = 'sport-foundation';
export function emptyDemo(): State {
  return { ...initialState(), plan: null, history: [], active: null, saved: [], profile: { ...blankProfile, name: 'Local demo', age: 28 } };
}
export function previewPlan(id: string, start = day()): {plan: Plan | null; errors: string[]} {
  const choice = programCatalog.find(x => x.id === id);
  if(!choice&&![FOUNDATION,RUN_WALK,SPORT_FOUNDATION].includes(id))return {plan:null,errors:['This program is unavailable. Choose a program from the selected training style.']};
  const offsets = !choice ? (id===RUN_WALK?[0,2,4]:[0,3]) : choice.days===2 ? [0,3] : choice.id==='RNBASE4'?[0,2,4,6]:choice.days === 5 ? [0, 1, 3, 4, 6] : choice?.days === 4 ? [0, 1, 3, 4] : [0, 2, 4];
  const profile: Profile = { ...blankProfile, age: 28, name: 'Local demo', start, weeks: 4,
    goal: choice?.goal ?? (id===RUN_WALK?'running':id===SPORT_FOUNDATION?'sport':'general'), programId: choice?.id, experience: choice?.experience === 'advanced'?'Experienced':choice?.experience === 'some' ? 'Some experience' : 'First time',
    minutes: 120, equipment: choice ? programEquipment(choice) : 'Dumbbells',
    days: offsets.map(n => (new Date(start + 'T12:00:00').getDay() + n) % 7).sort(), runBase: choice?.runBase ?? false,runDays:choice?.id==='RNBASE4'?4:3,runMinutes:100,establishedTraining:true };
  const result=buildPlan(profile);if(result.plan)result.plan.profile.minutes=Math.max(...result.plan.sessions.map(x=>x.minutes));return result;
}
export function adoptPlan(state: State, plan: Plan): State {
  if (state.active) throw new Error('Finish or discard the current workout before changing plans.');
  if (state.plan && state.saved.length >= 100) throw new Error('This local demo holds 100 archived plans. Export your records before starting another block.');
  if(plan.sessions.some(x=>state.events.some(e=>e.date===x.date)||focusScheduleConflict(plan,state.events,x))) throw new Error('This plan conflicts with saved commitments. Review its dates before replacing your block.');
  return { ...state, profile: { ...plan.profile, units: state.profile.units },
    plan: { ...plan, profile: { ...plan.profile, units: state.profile.units }, acceptedAt: new Date().toISOString() },
    proposals: state.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p), saved: state.plan ? [state.plan,...state.saved] : state.saved };
}
export function startWorkout(state: State, sessionId: string): State {
  if (state.active) return state;
  const session = state.plan?.sessions.find(x => x.id === sessionId);
  if (!session) throw new Error('Session not found.');
  const blocked = eligibility(state, session);
  if (blocked) throw new Error(blocked);
  if (session.date !== day()) throw new Error('Review moving this workout to today before starting.');
  const active: Workout = { id: uid('workout'), sessionId, title: session.title, date: day(), startedAt: Date.now(), demo: true,
    targets: session.items.map(x => ({ ...x })),
    sets: session.items.flatMap(x => Array.from({ length: x.sets }, (_, i) => ({ exerciseId: x.exerciseId, set: i + 1, reps: 0, kg: null, done: false }))), loadContext: {...state.loadContext} };
  return { ...state, active };
}
export function editSet(state: State, index: number, patch: Partial<SetLog>): State {
  if (!state.active || !state.active.sets[index]) return state;
  const updated = { ...state.active.sets[index], ...patch };
  if (!Number.isFinite(updated.reps) || updated.reps < 0 || updated.reps > 9999) throw new Error('Enter an amount between 0 and 9,999.');
  if(exFor(updated.exerciseId,state.custom).metric==='reps'&&!Number.isInteger(updated.reps)) throw new Error('Enter whole-number reps.');
  if (updated.kg !== null && (!Number.isFinite(updated.kg) || updated.kg < 0 || updated.kg > 1500)) throw new Error('Enter a valid load.');
  if (updated.metrics && !setMetricsSchema.safeParse(updated.metrics).success) throw new Error('Optional measurements are outside the supported range.');
  if (updated.done && updated.reps <= 0) throw new Error('Enter the actual reps or time before marking the set done.');
  const sets = state.active.sets.map((x, i) => i === index ? updated : x);
  return { ...state, active: { ...state.active, sets } };
}
export function finishWorkout(state: State): State {
  const w = state.active;
  if (!w || !state.plan) throw new Error('No active workout.');
  for(let i=0;i<w.sets.length;i++) editSet(state,i,{});
  if(state.history.some(x=>x.id===w.id)) throw new Error('This workout is already saved.');
  const done = w.sets.filter(x => x.done);
  if (!done.length) throw new Error('Log at least one completed set, or discard this workout.');
  const partial = done.length < w.sets.length;
  const recorded = { ...w, finishedAt: Date.now(), partial };
  return { ...state, active: null, history: [...state.history, recorded], loadContext:{...state.loadContext,...w.loadContext}, restTimer:null, plan: { ...state.plan, version: state.plan.version + 1,
    sessions: state.plan.sessions.map(x => x.id === w.sessionId ? { ...x, status: partial ? 'partial' : 'completed' } : x) } };
}
export function unknownLoads(w: Workout, custom: Exercise[] = []): number {
  return w.sets.filter(x => x.done && x.kg === null && isLoadTracked(exFor(x.exerciseId,custom))).length;
}
