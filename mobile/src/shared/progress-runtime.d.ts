import type { State, Workout } from "./training";
declare function volume(s: State, w: Workout): {
    kg: number;
    count: number;
    excluded: number;
};
declare function estimatedMax(w: Workout, id: string): number | null;
declare function exerciseSeries(s: State, id: string, setup?: string): {
    id: string;
    date: string;
    label: string;
    load: number | null;
    amount: number;
    estimated: number | null;
    partial: boolean | undefined;
}[];
declare function strengthIndex(s: State): {
    basket: string[];
    points: {
        date: string;
        label: string;
        index: number | null;
    }[];
    current: number | null;
};
export { volume };
export { estimatedMax };
export { exerciseSeries };
export { strengthIndex };
