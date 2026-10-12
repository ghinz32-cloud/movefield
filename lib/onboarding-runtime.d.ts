import type { Profile, Plan, Event, State } from "./training";
export type PlanOption = {
    id: string;
    title: string;
    description: string;
    profile: Profile;
    plan: Plan | null;
    errors: string[];
    recommended: boolean;
};
declare let setupSteps: string[];
declare function hydrateSetupProfile(p: Profile): Profile;
declare function freshState(): State;
declare function setupErrors(p: Profile, step: number): string[];
declare function planOptions(p: Profile, events: Event[]): PlanOption[];
declare function acceptSetup(s: State, p: Profile, plan: Plan, events: Event[], expectedEvents?: string): {
    state: State;
    error?: string;
};
declare function referenceOption(p: Profile, events: Event[], id: string): PlanOption;
export { setupSteps };
export { hydrateSetupProfile };
export { freshState };
export { setupErrors };
export { planOptions };
export { acceptSetup };
export { referenceOption };
