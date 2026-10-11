export const SET_METRIC_FIELDS=[
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
