import type { Plan } from "./training";
declare function planFit(plan: Plan): {
    week: number;
    totalDays: number;
    strengthDays: number;
    runningDays: number;
    easyDays: number;
    minutes: number;
    weeklyWorkSets: number;
    regions: {
        name: string;
        sets: number;
        days: number;
    }[];
    unmapped: string[];
    inventoryConfirmed: boolean;
};
export { planFit };
