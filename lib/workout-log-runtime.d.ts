import type { State, SetLog } from "./training";
declare function normalizeWorkoutRest(s: State): State;
declare function changeWorkoutSet(s: State, index: number, patch: Partial<SetLog>): State;
declare function logWorkoutSet(s: State, index: number, seconds: number, now?: number): State;
export { normalizeWorkoutRest };
export { changeWorkoutSet };
export { logWorkoutSet };
