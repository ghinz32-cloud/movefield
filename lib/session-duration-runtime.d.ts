import type { State, Session, Exercise } from "./training";
export type DurationEstimate = {
    low: number;
    high: number;
    workMinutes: number;
    restMinutes: number;
    version: 'duration-v1';
    assumptions: string[];
};
/** A transparent scheduling heuristic. These ranges are not measured sessions. */
declare function estimateDuration(session: Session, custom?: Exercise[]): DurationEstimate | null;
declare function durationText(session: Session, custom?: Exercise[]): string;
declare function observedDuration(s: State, sessionId: string): {
    workoutId: string;
    minutes: number;
    partial: boolean;
    label: string;
}[];
export { estimateDuration };
export { durationText };
export { observedDuration };
