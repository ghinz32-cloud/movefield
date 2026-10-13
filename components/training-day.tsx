import {trainingDay,type TrainingDayWorkout} from '@/lib/training-day';
import {day,type State} from '@/lib/training';

function RecordedWorkout({record}:{record:TrainingDayWorkout}){
 const workout=record.workout;
 return <section className="card training-day-workout" aria-label={record.title}>
  <div className="split"><h2>{record.title}</h2><span className="pill">{record.partial?'PARTIAL WORKOUT':'COMPLETED WORKOUT'}</span></div>
  <p className="muted">{record.loggedSets} logged sets or tasks{record.elapsedMinutes!==null?` · ${record.elapsedMinutes} min elapsed`:''}</p>
  <p className="small-copy">Effort: {workout.effort||'not recorded'} · Symptoms: {workout.symptom==='no'?'none reported':workout.symptom==='yes'?'reported':workout.symptom==='unsure'?'uncertain':'not recorded'}{workout.rating!==undefined?` · Rating: ${workout.rating}/5`:''}</p>
  {!record.exercises.length&&<p>No performed sets were recorded in this saved workout.</p>}
  {record.exercises.map(exercise=><section className="history-exercise" key={exercise.id}>
   <h3>{exercise.name}</h3>{exercise.setup&&<p className="small-copy">Setup: {exercise.setup}</p>}
   <div className="training-day-sets" role="list" aria-label={`Recorded sets for ${exercise.name}`}>
    {exercise.sets.map(set=><div className="training-day-set" role="listitem" key={set.number}>
     <div className="split"><b>Set {set.number}</b><span>{set.amountText}{set.load==='—'?'':` · Load: ${set.load}`}</span></div>
     <p className="small-copy">RIR: {set.rir}{set.details?` · ${set.details}`:''}</p>
    </div>)}
   </div>
   {exercise.notes&&<p className="small-copy">Exercise notes: {exercise.notes}</p>}
  </section>)}
  {record.partial&&<p className="small-copy">Unfinished sets are not counted as performed work.</p>}
 </section>;
}

/** Calendar detail shares Today card styling and deliberately exposes no state-changing actions. */
export function TrainingDay({state,date,today=day(),showHeading=true}:{state:State;date:string;today?:string;showHeading?:boolean}){
 const detail=trainingDay(state,date,today);
 const title=detail.status==='rest'?'Day off':detail.status==='missed'?'Skipped workout':detail.status==='not-logged'?'No workout logged':detail.status==='planned'?'Planned workout':detail.workouts.length===1?detail.workouts[0].title:`${detail.workouts.length} recorded workouts`;
 const text=detail.status==='rest'?'No workout was scheduled or logged for this date.':detail.status==='missed'?'A planned workout was marked skipped. No performed sets were recorded.':detail.status==='not-logged'?'A workout was scheduled, but no completed workout was saved for this date.':detail.status==='planned'?detail.relation==='future'?'A look at the planned work for this date.':'Your planned work for this date.':`${detail.loggedSets} sets or tasks recorded. These are the amounts you actually logged.`;
 return <div className="training-day-detail">
  {showHeading&&<div className="page-heading"><div><p className="eyebrow">{detail.dateLabel}</p><h1>{detail.heading}</h1></div></div>}
  <section className="session-feature today-session"><div className="split"><span className="pill dark">{detail.status==='recorded'?'RECORDED WORKOUT':detail.status==='rest'?'DAY OFF':detail.status==='planned'?'PLANNED WORK':'WORKOUT HISTORY'}</span><span className="small-copy">Read only</span></div><h2>{title}</h2><p>{text}</p></section>
  {detail.workouts.map(record=><RecordedWorkout key={record.workout.id} record={record}/>)}
  {detail.sessions.filter(entry=>!entry.recorded).map(entry=><section className="card training-day-plan" key={entry.session.id}>
   <div className="split"><h2>{entry.title}</h2><span className="pill">{entry.session.status==='missed'?'SKIPPED':detail.relation==='past'?'NOT LOGGED':'PLANNED'}</span></div>
   <p className="muted">{entry.session.minutes} min planned · {entry.targets.length} exercises{entry.archived?' · Archived plan':''}</p>
   <div className="session-detail-list">{entry.targets.map(item=><div key={item.exerciseId}><h3>{item.name}</h3><p className="small-copy">{item.target} · {item.restSeconds}s rest</p>{item.note&&<p className="small-copy">{item.note}</p>}</div>)}</div>
  </section>)}
  {detail.events.length>0&&<section className="card"><h2>Events and time off</h2>{detail.events.map(event=><div key={event.id}><h3>{event.name}</h3><p className="small-copy">{event.kind} · {event.minutes} min{event.provisional?' · Provisional':''}</p></div>)}</section>}
 </div>;
}
