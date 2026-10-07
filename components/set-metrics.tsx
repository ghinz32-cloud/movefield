"use client";
import {useState} from 'react';
import {type SetMetrics} from '@/lib/training';
import {Input} from '@/components/ui/input';
const FIELDS=[
 {key:'distanceM',label:'Distance (meters)',max:1000000},
 {key:'durationSeconds',label:'Time (seconds)',max:604800},
 {key:'heightCm',label:'Jump / box height (cm)',max:10000},
 {key:'heartRate',label:'Heart rate (bpm)',max:300},
 {key:'cadence',label:'Cadence (steps or turns/min)',max:1000},
 {key:'powerWatts',label:'Power (watts)',max:10000},
 {key:'speedKph',label:'Speed (km/h)',max:300},
 {key:'inclinePercent',label:'Incline (%)',min:-100,max:100},
 {key:'level',label:'Machine level',max:1000},
 {key:'assistanceKg',label:'Assistance (kg)',max:1500},
] as const;
export function SetMetricsFields({name,set,value={},onChange}:{name:string;set:number;value?:SetMetrics;onChange:(v:SetMetrics)=>void}){
 const [visible,setVisible]=useState<string[]>(()=>[...new Set(['distanceM','durationSeconds',...Object.keys(value)])]);
 const patch=(key:string,v:number|string|undefined)=>{const next={...value,[key]:v};if(v===undefined)delete next[key as keyof SetMetrics];onChange(next)};
 return <details className="set-extra"><summary>Set {set}: distance, time and notes</summary><p className="small-copy">Optional. Keep the units shown here. Assistance is recorded separately from the weight lifted.</p><div className="field-grid">{FIELDS.filter(f=>visible.includes(f.key)).map(f=><label className="field" key={f.key}>{f.label}<Input aria-label={`${name} set ${set} ${f.label}`} type="number" inputMode="decimal" min={'min' in f?f.min:0} max={f.max} step="any" value={value[f.key]??''} onChange={e=>{const n=e.target.value===''?undefined:Number(e.target.value);if(n===undefined||Number.isFinite(n)&&n>=('min' in f?f.min:0)&&n<=f.max)patch(f.key,n)}}/></label>)}</div><label className="field">Add another measurement<select aria-label={`${name} set ${set} add measurement`} value="" onChange={e=>{if(e.target.value)setVisible(v=>[...v,e.target.value])}}><option value="">Choose a field</option>{FIELDS.filter(f=>!visible.includes(f.key)).map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label><div className="field-grid"><label className="field">Tempo<Input aria-label={`${name} set ${set} tempo`} maxLength={100} placeholder="e.g. 3–1–1" value={value.tempo||''} onChange={e=>patch('tempo',e.target.value||undefined)}/></label><label className="field">Side<select aria-label={`${name} set ${set} side`} value={value.side||''} onChange={e=>patch('side',e.target.value||undefined)}><option value="">Not recorded</option><option>Both</option><option>Left</option><option>Right</option><option>Alternating</option></select></label></div><label className="field">Notes<textarea aria-label={`${name} set ${set} notes`} rows={2} maxLength={1000} placeholder="Surface, route, attachment, or other details" value={value.notes||''} onChange={e=>patch('notes',e.target.value||undefined)}/></label><p className="small-copy">These details stay in your history and export. They do not change your plan by themselves.</p></details>;
}
export function MetricsSummary({value}:{value?:SetMetrics}){if(!value||!Object.values(value).some(v=>v!==undefined&&v!==''))return null;return <p className="metric-summary">{[...FIELDS.filter(f=>value[f.key]!==undefined).map(f=>`${f.label}: ${value[f.key]}`),value.tempo&&`Tempo: ${value.tempo}`,value.side&&`Side: ${value.side}`,value.notes].filter(Boolean).join(' · ')}</p>}
