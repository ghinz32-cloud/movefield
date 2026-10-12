import type {Profile,Plan,Item,State,Proposal} from './training';
export type SourceProgram={id:string;name:string;creator:string;url:string;version:string;ruleVersion?:string;goals:string[];days:number;experience:'all'|'some';slots:{title:string;group:string;items:Item[]}[];offsets:number[];scope:string;adaptations:string[];progression:string};
export declare const sourcePrograms:SourceProgram[];
export declare function sourceProgram(id?:string):SourceProgram|undefined;
export declare function buildSourcePlan(p:Profile,events:import('./training').Event[]):{plan:Plan|null;errors:string[]};
export declare function sourceLoadSuggestion(s:State,i:Item):{kg:number|null;nextKg?:number;nextItem?:Item;date?:string;reason:string;ready?:boolean;atCapacity?:boolean};
export declare function sourceLoadProposal(s:State):{proposal?:Proposal;error?:string};
