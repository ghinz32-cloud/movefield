import {readSavedState} from './saved-data';
import {changed,type State} from './training';

// A UTF-8 file may use four bytes per character; the parser also enforces its
// existing five-million-character and nested record limits before restoration.
export const maxBackupBytes=20_000_000;
export function serializeBackup(state:State):string{
 const raw=JSON.stringify(state);
 return JSON.stringify(readSavedState(raw)); // Export only validated, known fields.
}
export function previewBackup(raw:string){
 const state=readSavedState(raw);
 return {state,name:state.profile.name,workouts:state.history.length,
  sets:state.history.reduce((n,w)=>n+w.sets.filter(x=>x.done).length,0),
  plans:state.saved.length+(state.plan?1:0),active:!!state.active};
}
/** Replacement is reviewed and atomic. Never merge records by array position. */
export function restoreBackup(current:State,incoming:State,expected:string):State{
 if(serializeBackup(current)!==expected)throw Error('Your records changed after this preview. Choose the backup again.');
 if(current.active)throw Error('Finish or discard the current workout before replacing this device’s records.');
 const checked=readSavedState(serializeBackup(incoming));
 const restored:State={...checked,restTimer:null,restAlerts:false,simulatedOffline:false,
  proposals:checked.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)};
 return changed(restored,'Restored a reviewed local backup. Old timers and proposed changes require a fresh review.');
}
