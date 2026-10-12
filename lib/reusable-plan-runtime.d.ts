import type { State, Plan } from "./training";
export type ReusablePlanPreview = {
    base: string;
    sourceId: string;
    source: string;
    plan: Plan;
    prescription: string;
};
declare function savePlanCopy(s: State, planId: string, version: number): State;
declare function previewReusablePlan(s: State, sourceId: string, start: string): ReusablePlanPreview;
declare function acceptReusablePlan(s: State, preview: ReusablePlanPreview): State;
declare function setPlanPaused(s: State, id: string, version: number, paused: boolean): State;
export { savePlanCopy };
export { previewReusablePlan };
export { acceptReusablePlan };
export { setPlanPaused };
