import type { State, Workout } from "./training";
export type HistoryEdit = {
    base: string;
    draft: Workout;
};
declare function beginHistoryEdit(state: State, id: string): HistoryEdit;
declare function applyHistoryEdit(state: State, edit: HistoryEdit): State;
export { beginHistoryEdit };
export { applyHistoryEdit };
