import {type State,type Workout,changed} from './training';
import {readSavedState} from './saved-data';
export type HistoryEdit={base:string;draft:Workout};
export function beginHistoryEdit(state:State,id:string):HistoryEdit{
 const record=state.history.find(w=>w.id===id);if(!record?.finishedAt)throw Error('This saved workout is unavailable.');
 return {base:JSON.stringify(record),draft:JSON.parse(JSON.stringify(record))};
}
export function applyHistoryEdit(state:State,edit:HistoryEdit):State{
 const before=state.history.find(w=>w.id===edit.draft.id);
 if(!before||JSON.stringify(before)!==edit.base)throw Error('This workout changed after you opened it. Reopen the saved record before editing.');
 const draft=edit.draft;
 // Identity, prescription, original timing and equipment context are historical facts.
 const immutable=(w:Workout)=>JSON.stringify([w.id,w.sessionId,w.title,w.date,w.startedAt,w.finishedAt,w.targets,w.loadContext,w.supervisorConfirmed,w.demo]);
 if(immutable(before)!==immutable(draft)||before.sets.length!==draft.sets.length||before.sets.some((x,i)=>x.exerciseId!==draft.sets[i]?.exerciseId||x.set!==draft.sets[i]?.set))throw Error('An edit cannot change workout identity, dates, targets or exercise order.');
 if(!draft.sets.some(x=>x.done))throw Error('Keep at least one performed set. An empty record cannot be marked completed.');
 const partial=draft.sets.some(x=>!x.done)||!!draft.targets?.some(t=>draft.sets.filter(x=>x.exerciseId===t.exerciseId&&x.done).length<t.sets);
 const saved={...draft,partial,revision:(before.revision||1)+1};
 const plan=state.plan?.sessions.some(s=>s.id===before.sessionId)?{...state.plan,version:state.plan.version+1,sessions:state.plan.sessions.map(s=>s.id===before.sessionId&&state.active?.sessionId!==before.sessionId?{...s,status:partial?'partial' as const:'completed' as const}:s)}:state.plan;
 const next=changed({...state,plan,history:state.history.map(w=>w.id===saved.id?saved:w),proposals:state.proposals.map(p=>p.planId===plan?.id&&['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},'Edited a saved workout. Existing workout IDs, dates and active work were preserved.');
 readSavedState(JSON.stringify(next));
 return next;
}
