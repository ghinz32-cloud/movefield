import {exFor,type Plan} from './training';
import {movementRoles} from './equipment';
export function planFit(plan:Plan){
 const weeks=[...new Set(plan.sessions.map(s=>s.week))];
 const week=weeks.find(w=>w>=3)||weeks[0]||1,sessions=plan.sessions.filter(s=>s.week===week);
 const strength=sessions.filter(s=>s.kind!=='Easy activity'&&!s.runSteps?.length&&s.items.some(i=>exFor(i.exerciseId).metric==='reps'));
 const regions:Record<string,{sets:number;days:Set<string>}>=Object.fromEntries(['Chest','Back','Shoulders','Quadriceps','Hamstrings','Glutes','Calves','Arms','Trunk'].map(x=>[x,{sets:0,days:new Set<string>()}]));
 const aliases:Record<string,string>={chest:'Chest','upper back':'Back',lats:'Back',shoulders:'Shoulders','front shoulders':'Shoulders','side shoulders':'Shoulders',quadriceps:'Quadriceps',hamstrings:'Hamstrings',glutes:'Glutes',calves:'Calves',triceps:'Arms','elbow flexors':'Arms','trunk stabilizers':'Trunk','back extensors':'Trunk'};
 const unmapped:string[]=[];
 for(const session of strength)for(const item of session.items){
  const m=movementRoles[item.exerciseId];if(!m){unmapped.push(item.exerciseId);continue;}
  for(const region of new Set(m.muscles.map(x=>aliases[x]).filter(Boolean))){regions[region].sets+=item.sets;regions[region].days.add(session.date);}
 }
 return {week,totalDays:sessions.length,strengthDays:strength.length,runningDays:sessions.filter(s=>s.runSteps?.length&&s.kind!=='Easy activity').length,easyDays:sessions.filter(s=>s.kind==='Easy activity').length,minutes:Math.max(0,...sessions.map(s=>s.minutes)),weeklyWorkSets:strength.reduce((n,s)=>n+s.items.reduce((m,i)=>m+i.sets,0),0),regions:Object.entries(regions).map(([name,x])=>({name,sets:x.sets,days:x.days.size})),unmapped:[...new Set(unmapped)],inventoryConfirmed:!!plan.profile.inventory?.confirmed};
}
