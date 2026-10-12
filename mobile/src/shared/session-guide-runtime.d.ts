import type { Plan, Session } from "./training";
declare function sessionGuide(plan: Plan, session: Session): {
    warmup: string[];
    effort: string;
    finish: string;
    order: string[];
    progression: string[];
};
export { sessionGuide };
