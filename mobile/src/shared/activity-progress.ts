import {addDays,day,exFor,type State} from './training';
export type ActivityPoint={id:string;date:string;partial:boolean;distanceM:number|null;seconds:number|null;paceSecondsPerKm:number|null;knownDistanceSets:number;knownTimeSets:number};
export function activityProgress(s:State,period:28|84|'all'='all',today=day()):ActivityPoint[]{
 const start=period==='all'?null:addDays(today,-period+1);
 return s.history.filter(w=>w.finishedAt&&(!start||w.date>=start&&w.date<=today)).sort((a,b)=>a.date.localeCompare(b.date)||(a.finishedAt||0)-(b.finishedAt||0)).map(w=>{
  let distance=0,seconds=0,pairedDistance=0,pairedSeconds=0,knownDistanceSets=0,knownTimeSets=0;
  for(const set of w.sets.filter(x=>x.done)){
   const metric=exFor(set.exerciseId,s.custom).metric,d=set.metrics?.distanceM,t=set.metrics?.durationSeconds??(metric==='minutes'?set.reps*60:metric==='seconds'?set.reps:undefined);
   if(d!==undefined&&Number.isFinite(d)&&d>=0){distance+=d;knownDistanceSets++}
   if(t!==undefined&&Number.isFinite(t)&&t>=0){seconds+=t;knownTimeSets++}
   if(d!==undefined&&t!==undefined&&Number.isFinite(d)&&Number.isFinite(t)&&d>0&&t>0){pairedDistance+=d;pairedSeconds+=t}
  }
  return {id:w.id,date:w.date,partial:!!w.partial,distanceM:knownDistanceSets?distance:null,seconds:knownTimeSets?seconds:null,paceSecondsPerKm:pairedDistance>0?pairedSeconds/(pairedDistance/1000):null,knownDistanceSets,knownTimeSets};
 });
}
export function distanceValue(metres:number,units:'km'|'mi'){return metres/(units==='mi'?1609.344:1000)}
export function paceText(secondsPerKm:number|null,units:'km'|'mi'){
 if(secondsPerKm===null)return 'Not available';
 const seconds=Math.round(secondsPerKm*(units==='mi'?1.609344:1));
 return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} min/${units}`;
}
