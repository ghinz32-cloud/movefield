import {type State,type Workout,blankProfile,buildPlan,initialState,day,addDays,uid,exFor,toKg} from './training';
export function experiencedDemo():State{
 const today=day(),dow=new Date(today+'T12:00:00').getDay();const days=[dow,(dow+2)%7,(dow+4)%7].sort((a,b)=>a-b);
 const profile={...blankProfile,name:'Jordan · sample athlete',age:29,goal:'powerlifting',programId:'PL3',experience:'Some experience',minutes:75,days,weeks:8,start:today,units:'lb' as const};
 const plan=buildPlan(profile).plan!;plan.acceptedAt=new Date().toISOString();
 const history:Workout[]=[];const start=addDays(today,-84);
 const loads:Record<string,number>={'bar-squat':70,bench:50,deadlift:90,row:20,split:0,pulldown:45};
 for(let week=0;week<12;week++)for(let slot=0;slot<3;slot++){
  if((week===4&&slot===2)||(week===8&&slot===1))continue;
  const template=plan.sessions[slot],date=addDays(start,week*7+slot*2),partial=week===6&&slot===1,light=week===5;
  const targets=template.items.map(i=>({...i,sets:light?Math.max(1,i.sets-1):i.sets}));
  const sets=targets.flatMap(i=>Array.from({length:i.sets},(_,n)=>({exerciseId:i.exerciseId,set:n+1,reps:i.repMax??i.reps,kg:exFor(i.exerciseId).loadTracked?toKg(Math.round(((Math.round((loads[i.exerciseId]||15)*2.2046226218/5)*5)+Math.min(week,7)*2.5+(week>9?(week-9)*2.5:0))*(light?.9:1)/2.5)*2.5,'lb'):null,done:!(partial&&n===i.sets-1)})));
  history.push({id:uid('sample-workout'),sessionId:uid('sample-session'),title:template.title,date,startedAt:new Date(date+'T17:00:00').getTime(),finishedAt:new Date(date+'T18:00:00').getTime(),sets,targets,rir:Object.fromEntries(targets.map(i=>[i.exerciseId,light?3:2])),loadContext:{pulldown:'Sample gym · cable A · wide bar'},effort:partial?'harder':'right',symptom:'no',rating:4,partial,demo:true});
 }
 return{...initialState(),profile,plan,history:history.reverse(),events:[{id:'sample-vacation',name:'Weekend away',kind:'Vacation',date:addDays(today,10),minutes:1440,priority:'Normal',provisional:false}],incrementKg:{bench:toKg(2.5,'lb'),'bar-squat':toKg(5,'lb'),deadlift:toKg(5,'lb'),row:toKg(2.5,'lb')},loadContext:{pulldown:'Sample gym · cable A · wide bar'},audit:[{at:new Date().toISOString(),message:'Generated sample: 12 weeks, 34 logged sessions, two omitted sessions, a light week, a plateau and one partial workout. This is not a real athlete.'}]};
}
