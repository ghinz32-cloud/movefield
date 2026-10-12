import type {Item,Plan} from './training';
export declare const muscleNames:readonly ['Chest','Back','Shoulders','Quadriceps','Hamstrings','Glutes','Calves','Biceps','Triceps','Trunk'];
export type Muscle=typeof muscleNames[number];
export declare function itemMuscleWork(i:Item):{primary:Muscle[];secondary:Muscle[]}|null;
export declare function muscleWork(plan:Plan):{firstWeek:number;periodWeeks:number;completeCycle:boolean;rows:{name:Muscle;primarySets:number;secondarySets:number;primaryDays:number;secondaryDays:number}[];unclassified:string[];scope:string};
