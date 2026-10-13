import type {SetMetrics} from './training';
export const metricFields=[
 {key:'distanceM',label:'Distance (meters)',min:0,max:1000000},
 {key:'durationSeconds',label:'Time (seconds)',min:0,max:604800},
 {key:'heightCm',label:'Jump / box height (cm)',min:0,max:10000},
 {key:'heartRate',label:'Heart rate (bpm)',min:0,max:300},
 {key:'cadence',label:'Cadence (steps or turns/min)',min:0,max:1000},
 {key:'powerWatts',label:'Power (watts)',min:0,max:10000},
 {key:'speedKph',label:'Speed (km/h)',min:0,max:300},
 {key:'inclinePercent',label:'Incline (%)',min:-100,max:100},
 {key:'level',label:'Machine level',min:0,max:1000},
 {key:'assistanceKg',label:'Assistance (kg)',min:0,max:1500},
] as const;
export function metricSummary(value?:SetMetrics):string{
 if(!value)return '';
 return [...metricFields.filter(f=>value[f.key]!==undefined).map(f=>`${f.label}: ${value[f.key]}`),value.tempo&&`Tempo: ${value.tempo}`,value.side&&`Side: ${value.side}`,value.notes].filter(Boolean).join(' · ');
}
