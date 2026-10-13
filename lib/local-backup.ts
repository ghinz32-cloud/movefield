import {readStoredSavedState, MAX_SAVED_STATE_BYTES} from './storage-capacity';
import {changed,type State} from './training';

// File bytes, parsed text and local persistence share the same bounded budget.
export const maxBackupBytes=MAX_SAVED_STATE_BYTES;
export function serializeBackup(state:State):string{
 const raw=JSON.stringify(state);
 return JSON.stringify(readStoredSavedState(raw)); // Refuse unsupported fields instead of producing a lossy backup.
}
export function previewBackup(raw:string){
 const state=readStoredSavedState(raw);
 return {state,name:state.profile.name,workouts:state.history.length,
  sets:state.history.reduce((n,w)=>n+w.sets.filter(x=>x.done).length,0),
  plans:state.saved.length+(state.plan?1:0),active:!!state.active};
}
/** Replacement is reviewed and atomic. Never merge records by array position. */
export function restoreBackup(current:State,incoming:State,expected:string):State{
 if(serializeBackup(current)!==expected)throw Error('Your records changed after this preview. Choose the backup again.');
 if(current.active)throw Error('Finish or discard the current workout before replacing this device’s records.');
 const checked=readStoredSavedState(serializeBackup(incoming));
 const restored:State={...checked,restTimer:null,restAlerts:false,simulatedOffline:false,
  proposals:checked.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)};
 return changed(restored,'Restored a reviewed local backup. Old timers and proposed changes require a fresh review.');
}
