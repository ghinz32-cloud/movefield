import {day,dayDistance,displayLoad,exFor,isLoadTracked,niceDate,targetText,validDay,type Event,type Item,type Plan,type Session,type SetLog,type State,type Workout} from './training';
import {sessionName,trainingCopy,workoutName} from './presentation';
import {metricSummary} from './set-metrics';

export type TrainingDaySet={number:number;amount:number;amountText:string;load:string;rir:string;details:string};
export type TrainingDayExercise={id:string;name:string;metric:'reps'|'seconds'|'minutes';sets:TrainingDaySet[];setup?:string;notes?:string};
export type TrainingDayWorkout={workout:Workout;title:string;exercises:TrainingDayExercise[];loggedSets:number;elapsedMinutes:number|null;partial:boolean};
export type TrainingDayTarget={exerciseId:string;name:string;target:string;restSeconds:number;note?:string};
export type TrainingDaySession={session:Session;plan:Plan;title:string;archived:boolean;recorded:boolean;targets:TrainingDayTarget[]};
export type TrainingDay={date:string;today:string;heading:string;dateLabel:string;relation:'past'|'today'|'future';status:'recorded'|'planned'|'not-logged'|'missed'|'rest';workouts:TrainingDayWorkout[];sessions:TrainingDaySession[];events:Event[];loggedSets:number};

/** Calendar-day arithmetic uses date components, so DST never turns yesterday into two days ago. */
export function trainingDayHeading(date:string,today=day()):string{
 if(!validDay(date)||!validDay(today))throw Error('Choose a valid calendar date.');
 const ago=dayDistance(date,today);
 return ago===0?'Today':ago===1?'Yesterday':ago>1?`${ago} days ago`:niceDate(date);
}

export function trainingWeekDates(referenceDate:string):string[]{
 if(!validDay(referenceDate))throw Error('Choose a valid calendar date.');
 const [year,month,date]=referenceDate.split('-').map(Number),reference=Date.UTC(year,month-1,date);
 const monday=reference-((new Date(reference).getUTCDay()+6)%7)*86400000;
 return Array.from({length:7},(_,index)=>new Date(monday+index*86400000).toISOString().slice(0,10));
}

function actualSet(set:SetLog,state:State,workout:Workout):TrainingDaySet{
 const exercise=exFor(set.exerciseId,state.custom),rir=set.rir!==undefined?set.rir:workout.rir?.[set.exerciseId];
 return {number:set.set,amount:set.reps,amountText:`${set.reps} ${exercise.metric}`,load:set.kg!==null?displayLoad(set.kg,state.profile.units):isLoadTracked(exercise)?'Not recorded':'—',
  rir:rir===undefined?'Not recorded':rir===null?'Unsure':String(rir),details:metricSummary(set.metrics)};
}
function actualWorkout(workout:Workout,state:State):TrainingDayWorkout{
 const done=workout.sets.filter(set=>set.done),ids=[...new Set(done.map(set=>set.exerciseId))];
 const elapsed=workout.finishedAt===undefined?NaN:(workout.finishedAt-workout.startedAt)/60000;
 return {workout,title:workoutName(workout,state),loggedSets:done.length,partial:!!workout.partial||done.length<workout.sets.length,
  elapsedMinutes:Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*10)/10:null,
  exercises:ids.map(id=>({id,name:exFor(id,state.custom).name,metric:exFor(id,state.custom).metric,
   sets:done.filter(set=>set.exerciseId===id).map(set=>actualSet(set,state,workout)),setup:workout.loadContext?.[id],notes:workout.details?.[id]?.notes}))};
}
function target(item:Item,state:State):TrainingDayTarget{
 const exercise=exFor(item.exerciseId,state.custom);
 return {exerciseId:item.exerciseId,name:exercise.name,target:`${item.sets} × ${targetText(item)} ${exercise.metric}`,restSeconds:item.rest,note:item.note?trainingCopy(item.note):undefined};
}
function acceptanceDay(plan:Plan):string|null{
 if(!plan.acceptedAt)return null;
 const time=Date.parse(plan.acceptedAt);return Number.isFinite(time)?day(new Date(time)):null;
}

/** Read-only projection. Stored workout dates remain authoritative even after travel or plan replacement. */
export function trainingDay(state:State,date:string,today=day()):TrainingDay{
 const heading=trainingDayHeading(date,today),relation=date===today?'today':date<today?'past':'future';
 const records=state.history.filter(workout=>workout.date===date&&workout.finishedAt!==undefined&&Number.isFinite(workout.finishedAt))
  .slice().sort((a,b)=>a.startedAt-b.startedAt||(a.finishedAt??a.startedAt)-(b.finishedAt??b.startedAt)||a.id.localeCompare(b.id));
 const workouts=records.map(workout=>actualWorkout(workout,state)),recordedIds=new Set(records.map(workout=>workout.sessionId));
 const plans=state.plan?[state.plan,...state.saved]:state.saved;
 const knownTimeline=plans.every(plan=>acceptanceDay(plan)!==null);
 const sessionIds=new Set<string>(),sessions:TrainingDaySession[]=[];
 for(const plan of plans){
  const archived=plan.id!==state.plan?.id,accepted=acceptanceDay(plan);
  const replacement=accepted?plans.filter(other=>other.id!==plan.id).map(acceptanceDay).filter((value):value is string=>value!==null&&value>accepted).sort()[0]:undefined;
  for(const session of plan.sessions){
   if(session.date!==date||sessionIds.has(session.id))continue;
   const recorded=recordedIds.has(session.id);
   // Old schedules are shown only where a record/status or the replacement boundary supports them.
   // Never make an archived future schedule look like this device's current prescription.
   const priorSchedule=knownTimeline&&relation==='past'&&accepted!==null&&accepted<=date&&replacement!==undefined&&date<replacement;
   if(archived&&!recorded&&!(relation!=='future'&&session.status!=='scheduled')&&!priorSchedule)continue;
   sessionIds.add(session.id);
   sessions.push({session,plan,title:sessionName(session,plan),archived,recorded,targets:session.items.map(item=>target(item,state))});
  }
 }
 const unrecorded=sessions.filter(session=>!session.recorded),status:TrainingDay['status']=workouts.length?'recorded':
  sessions.length?relation==='future'?'planned':unrecorded.every(entry=>entry.session.status==='missed')?'missed':relation==='past'?'not-logged':'planned':'rest';
 return {date,today,heading,dateLabel:niceDate(date),relation,status,workouts,sessions,
  events:state.events.filter(event=>event.date===date).map(event=>({...event})),loggedSets:workouts.reduce((sum,workout)=>sum+workout.loggedSets,0)};
}
