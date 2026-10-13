import {type State,type Workout,exFor,isLoadTracked,requiresSetup,dayDistance,day,comparableSet,exerciseRir} from './training';
export function volume(s:State,w:Workout){let kg=0,count=0,excluded=0;for(const x of w.sets.filter(x=>x.done)){const e=exFor(x.exerciseId,s.custom);if((x.metrics?.assistanceKg||0)>0||e.metric!=='reps'||!isLoadTracked(e)||!e.loadMultiplier||x.kg===null||!Number.isFinite(x.kg)||x.kg<0||!Number.isFinite(x.reps)||x.reps<=0){excluded++;continue}kg+=x.kg*x.reps*(['Left','Right'].includes(x.metrics?.side||'')&&e.loadMultiplier>1?e.loadMultiplier/2:e.loadMultiplier);count++;}return{kg,count,excluded};}
export function estimatedMax(w:Workout,id:string){const rir=exerciseRir(w,id);if(w.partial||w.symptom!=='no'||rir===null||rir===undefined||rir<0||rir>2)return null;const values=w.sets.filter(x=>x.exerciseId===id&&x.done&&comparableSet(x)&&x.kg!==null&&Number.isFinite(x.kg)&&x.kg>0&&Number.isFinite(x.reps)&&x.reps>=1&&x.reps<=10).map(x=>x.reps===1?x.kg!:x.kg!*(1+x.reps/30));return values.length?Math.max(...values):null;}
export function exerciseSeries(s:State,id:string,setup?:string){const ex=exFor(id,s.custom);return s.history.filter(w=>w.finishedAt&&(!requiresSetup(ex)||(w.loadContext?.[id]||'')===(setup||''))).sort((a,b)=>a.date.localeCompare(b.date)||(a.finishedAt||a.startedAt)-(b.finishedAt||b.startedAt)).flatMap(w=>{const sets=w.sets.filter(x=>x.exerciseId===id&&x.done);if(!sets.length)return[];const loads=sets.filter(x=>x.kg!==null).map(x=>x.kg!);return[{id:w.id,date:w.date,label:new Date(w.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}),load:loads.length?Math.max(...loads):null,amount:Math.max(...sets.map(x=>x.reps)),estimated:s.profile.age>=18&&ex.metric==='reps'&&ex.progressionEnabled&&isLoadTracked(ex)&&(!requiresSetup(ex)||!!setup)?estimatedMax(w,id):null,partial:w.partial}];});}
export function strengthIndex(s:State){
 const records=s.history.filter(w=>w.finishedAt).sort((a,b)=>a.date.localeCompare(b.date)||(a.finishedAt||a.startedAt)-(b.finishedAt||b.startedAt));
 if(s.profile.age<18||!records.length)return{basket:[] as string[],points:[] as {date:string;label:string;index:number|null}[],current:null as number|null};
 const eligibleRecords=records.filter(w=>w.sets.some(x=>{const e=exFor(x.exerciseId,s.custom);return isLoadTracked(e)&&!requiresSetup(e)&&e.progressionEnabled&&estimatedMax(w,x.exerciseId)!==null}));
 if(!eligibleRecords.length)return{basket:[],points:[],current:null};
 let first=eligibleRecords[0].date;
 const eligible=(id:string)=>{const e=exFor(id,s.custom);return isLoadTracked(e)&&!requiresSetup(e)&&e.metric==='reps'&&e.progressionEnabled;};
 const ids=[...new Set(records.flatMap(w=>w.sets.map(x=>x.exerciseId)))].filter(eligible);
 const windowStart=eligibleRecords.find(candidate=>ids.filter(id=>records.filter(w=>w.date>=candidate.date&&dayDistance(candidate.date,w.date)<=14&&estimatedMax(w,id)!==null).length>=2).length>=3);
 if(windowStart)first=windowStart.date;
 const basket=ids.filter(id=>records.filter(w=>dayDistance(first,w.date)>=0&&dayDistance(first,w.date)<=14&&estimatedMax(w,id)!==null).length>=2).slice(0,3);
 if(basket.length<3)return{basket,points:[],current:null};
 const baseline=Object.fromEntries(basket.map(id=>{const values=records.filter(w=>dayDistance(first,w.date)>=0&&dayDistance(first,w.date)<=14).map(w=>estimatedMax(w,id)).filter((n):n is number=>n!==null).slice(0,2);return[id,(values[0]+values[1])/2]}));
 const points=[...new Set(records.filter(w=>dayDistance(first,w.date)>=14).map(w=>w.date))].map(date=>{
  const ratios=basket.map(id=>{const r=records.filter(w=>w.date<=date&&dayDistance(w.date,date)<=21&&estimatedMax(w,id)!==null).at(-1);return r?estimatedMax(r,id)!/baseline[id]:null});
  return{date,label:new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}),index:ratios.some(x=>x===null)?null:Math.round(ratios.reduce<number>((a,b)=>a+b!,0)/3*100)};
 });
 const currentRatios=basket.map(id=>{const r=records.filter(w=>w.date<=day()&&dayDistance(w.date,day())<=21&&estimatedMax(w,id)!==null).at(-1);return r?estimatedMax(r,id)!/baseline[id]:null});return{basket,points,current:currentRatios.some(x=>x===null)?null:Math.round(currentRatios.reduce<number>((a,b)=>a+b!,0)/3*100)};
}
