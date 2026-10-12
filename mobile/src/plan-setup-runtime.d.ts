import type {ReactNode} from 'react';
import type { Profile, Plan, State, Event } from "./shared/training";
import * as __dependency9 from "react";
declare function PlanSetup({ state, onAccept, sample }: {
    sample?: boolean;
    state: State;
    onAccept: (profile: Profile, plan: Plan, events: Event[]) => string | undefined | Promise<string | undefined>;
}): ReactNode;
export { PlanSetup };
