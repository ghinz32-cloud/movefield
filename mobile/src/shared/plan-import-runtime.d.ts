import type { State, Plan } from "./training";
export type PlanImport = {
    base: string;
    plan: Plan;
    credit: string;
    sourcePlanId: string;
    prescription: string;
};
declare function previewPlanImport(state: State, raw: string, options: {
    credit: string;
    start: string;
    mode: 'manual' | 'coach';
}): PlanImport;
declare function acceptPlanImport(state: State, preview: PlanImport): State;
export { previewPlanImport };
export { acceptPlanImport };
