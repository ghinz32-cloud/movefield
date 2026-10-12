import type {Plan} from './training';
declare function programScience(plan: Plan): {
    label: string;
    recipeTrial: string;
    scope: string;
    creator: string | undefined;
    sourceUrl: string | undefined;
    sourceVersion: string | undefined;
    principles: string[];
    references: string[];
    limits: string[];
    implementationChoices: string[];
    work: {
        firstWeek: number;
        periodWeeks: number;
        completeCycle: boolean;
        rows: {
            name: string;
            primarySets: number;
            secondarySets: number;
            primaryDays: number;
            secondaryDays: number;
        }[];
        unclassified: string[];
        scope: string;
    };
};
export { programScience };
