'use client';
import {Check} from 'lucide-react';
import {type Exercise,type SetLog,toKg} from '@/lib/training';
import {SetMetricsFields} from './set-metrics';
import {Button} from './ui/button';
import {Input} from './ui/input';

type Props={
 exercise:Exercise;log:SetLog;units:'kg'|'lb';busy:boolean;
 onChange:(patch:Partial<SetLog>)=>void;onLog:()=>void;
};

/** A set's optional effort and measurements stay attached to its core logging row. */
export function WorkoutSetRow({exercise:ex,log,units,busy,onChange,onLog}:Props){
 return <div className={'set-row '+(ex.metric==='reps'?'has-rir ':'')+(log.done?'done':'')}>
  <span className="set-number"><span className="set-field-label">Set </span>{log.set}</span>
  <label className="set-data-field"><span className="set-field-label">Load ({units})</span><Input aria-label={`${ex.name} set ${log.set} load`} disabled={busy} inputMode="decimal" type="number" min={0} step="any" value={log.kg===null?'':Math.round(log.kg*(units==='lb'?2.2046226218:1)*100)/100} placeholder={ex.equipment==='Bodyweight'?'—':'Light load'} onChange={event=>{const value=event.target.value===''?null:Number(event.target.value);if(value===null||(Number.isFinite(value)&&value>=0&&toKg(value,units)<=1500))onChange({kg:value===null?null:toKg(value,units)})}}/></label>
  <label className="set-data-field"><span className="set-field-label">{ex.metric}</span><Input aria-label={`${ex.name} set ${log.set} ${ex.metric}`} disabled={busy} type="number" min={0} max={9999} value={log.reps||''} placeholder="Actual" step={ex.metric==='reps'?1:'any'} inputMode={ex.metric==='reps'?'numeric':'decimal'} onChange={event=>{const value=Number(event.target.value);if(Number.isFinite(value)&&value>=0&&value<=9999)onChange({reps:value})}}/></label>
  {ex.metric==='reps'&&<label className="set-rir-field"><span className="set-field-label" aria-hidden="true">RIR</span><span className="sr-only">Reps left (RIR) · set {log.set}</span><select title="Reps left after this set (RIR)" aria-label={`${ex.name} set ${log.set} reps left`} value={log.rir==null?'unknown':String(log.rir)} disabled={busy} onChange={event=>onChange({rir:event.target.value==='unknown'?null:Number(event.target.value)})}><option value="unknown">—</option>{[0,1,2,3,4,5].map(value=><option key={value} value={value}>{value===5?'5+':value}</option>)}</select></label>}
  <Button className="log-set-button" variant={log.done?'outline':'default'} disabled={log.done||busy} aria-label={`${log.done?'Saved':'Log'} ${ex.name} set ${log.set}`} onClick={onLog}>{log.done?<><Check size={15}/><span className="set-save-label">Saved</span></>:<>Log<span className="set-save-label"> set</span></>}</Button>
  <div className="set-row-details">
   {log.done&&<Button variant="ghost" size="sm" className="undo-set" disabled={busy} aria-label={`Undo ${ex.name} set ${log.set}`} onClick={()=>onChange({done:false})}>Undo</Button>}
   <fieldset disabled={busy}><SetMetricsFields name={ex.name} set={log.set} value={log.metrics} onChange={metrics=>onChange({metrics})}/></fieldset>
  </div>
 </div>;
}
