'use client';
import {useId,useLayoutEffect,useRef,useState,type KeyboardEvent} from 'react';
import {ChevronLeft,ChevronRight,CalendarDays,Dumbbell,Flag,CheckCircle2,Play} from 'lucide-react';
import {Button} from './ui/button';
import {calendarDay,calendarMonthDate,monthDates} from '@/lib/calendar';
import {durationText} from '@/lib/session-duration';
import {addDays,day,eligibility,niceDate,type State,type Session,type Workout} from '@/lib/training';
import {sessionName,workoutName} from '@/lib/presentation';

type Props={state:State;onSession:(session:Session)=>void;onHistory:(workout:Workout)=>void;onStart?:(session:Session)=>void;onResume?:()=>void;onAddEvent?:(date:string)=>void;busy?:boolean;initialDate?:string};
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function CalendarBrowse({state,onSession,onHistory,onStart,onResume,onAddEvent,busy=false,initialDate=day()}:Props){
 const [selected,setSelected]=useState(initialDate),[month,setMonth]=useState(initialDate),[weekStart,setWeekStart]=useState<0|1>(0);
 const id=useId(),buttons=useRef(new Map<string,HTMLButtonElement>()),focusDate=useRef(false);
 const today=day(),dates=monthDates(month,weekStart),details=calendarDay(state,selected,today);
 const monthLabel=new Date(month+'T12:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const labels=weekdays.slice(weekStart).concat(weekdays.slice(0,weekStart));
 const select=(date:string,focus=false)=>{focusDate.current=focus;setSelected(date);setMonth(date)};
 const move=(offset:number)=>select(calendarMonthDate(selected,offset));
 useLayoutEffect(()=>{if(focusDate.current){buttons.current.get(selected)?.focus();focusDate.current=false}},[selected,month,weekStart]);
 const keyDown=(event:KeyboardEvent<HTMLButtonElement>,date:string)=>{
  let next:string|undefined;
  const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
  if(event.key in offsets)next=addDays(date,offsets[event.key]);
  if(event.key==='Home'||event.key==='End'){
   const weekday=(new Date(date+'T12:00:00').getDay()-weekStart+7)%7;
   next=addDays(date,event.key==='Home'?-weekday:6-weekday);
  }
  if(event.key==='PageUp'||event.key==='PageDown')next=calendarMonthDate(date,(event.key==='PageUp'?-1:1)*(event.shiftKey?12:1));
  if(next){event.preventDefault();select(next,true)}
 };
 return <section className="card workout-calendar" aria-label="Workout calendar">
  <div className="workout-calendar-layout">
   <div className="workout-calendar-month">
    <div className="workout-calendar-toolbar">
     <div><p className="eyebrow">YOUR TRAINING DAYS</p><h2 id={id+'-month'}>{monthLabel}</h2></div>
     <div className="workout-calendar-navigation">
      <Button variant="outline" aria-label="Previous month" onClick={()=>move(-1)}><ChevronLeft size={18} aria-hidden="true"/></Button>
      <Button variant="outline" onClick={()=>select(today)}>Today</Button>
      <Button variant="outline" aria-label="Next month" onClick={()=>move(1)}><ChevronRight size={18} aria-hidden="true"/></Button>
     </div>
    </div>
    <p className="muted calendar-hint">Click a date to open its workouts, events and saved training.</p>
    <div className="calendar-grid-wrap">
     <div role="grid" aria-labelledby={id+'-month'} className="workout-calendar-grid">
      <div role="row" className="calendar-week">{labels.map(label=><span key={label} role="columnheader" aria-label={label} className="calendar-weekday">{label.slice(0,3)}</span>)}</div>
      {Array.from({length:6},(_,week)=><div role="row" className="calendar-week" key={week}>{dates.slice(week*7,week*7+7).map(date=>{
       const detail=calendarDay(state,date,today),chosen=date===selected;
       const markers=[detail.records.length?'Saved':'',detail.sessions.some(session=>session.status==='scheduled')?'Plan':detail.sessions.some(session=>session.status==='missed')?'Skipped':'',detail.events.length?'Event':'',detail.active?'Active':''].filter(Boolean);
       const accessible=niceDate(date)+'. '+detail.label+(detail.events.length?'. '+detail.events.length+' event(s)':'')+(detail.records.length?'. '+detail.records.length+' saved workout(s)':'')+(detail.active?'. Active workout':'')+(detail.isToday?'. Today':'');
       return <div role="gridcell" aria-selected={chosen} key={date}>
        <button type="button" ref={element=>{if(element)buttons.current.set(date,element);else buttons.current.delete(date)}} className={'calendar-date'+(chosen?' selected':'')+(detail.isToday?' today':'')+(date.slice(0,7)!==month.slice(0,7)?' adjacent':'')} tabIndex={chosen?0:-1} aria-label={accessible} aria-pressed={chosen} aria-current={detail.isToday?'date':undefined} onClick={()=>select(date)} onKeyDown={event=>keyDown(event,date)}>
         <span className="calendar-date-number">{Number(date.slice(-2))}</span>
         <span className="calendar-date-markers" aria-hidden="true">{markers.map(marker=><span key={marker}>{marker}</span>)}</span>
        </button>
       </div>;
      })}</div>)}
     </div>
    </div>
    <div className="workout-calendar-footer"><span className="small-copy">Arrow keys browse days. Page Up / Down changes months.</span><Button variant="ghost" onClick={()=>setWeekStart(weekStart?0:1)}>{weekStart?'Monday first':'Sunday first'}</Button></div>
   </div>
   <div className="calendar-day-panel" aria-labelledby={id+'-date'}>
    <p className="eyebrow">{details.isToday?'TODAY':'SELECTED DAY'}</p><h3 id={id+'-date'}>{niceDate(selected)}</h3>
    <p className="calendar-day-status" role="status">{niceDate(selected)} · {details.label}</p>
    {details.active&&<div className="calendar-detail"><p>Your workout is in progress.</p>{onResume&&<Button onClick={onResume}><Play size={16} aria-hidden="true"/>Resume workout</Button>}</div>}
    {!details.sessions.length&&!details.events.length&&!details.records.length&&!details.active&&<div className="calendar-empty"><CalendarDays size={30} aria-hidden="true"/><p>{details.label==='Rest day'?'Room to recover. Your next training day is marked on the calendar.':'No workout or event on this date.'}</p></div>}
    {details.events.map(event=><div className="calendar-detail" key={event.id}><Flag size={18} aria-hidden="true"/><div><h4>{event.name}</h4><p>{event.kind} · {event.minutes===1440?'All day':event.minutes+' min'}{event.provisional?' · Provisional':''}</p></div></div>)}
    {details.sessions.map(session=>{
     const active=details.active?.sessionId===session.id,issue=eligibility(state,session);
     return <div className="calendar-detail calendar-workout-detail" key={session.id}>
      <div className="calendar-detail-heading"><Dumbbell size={18} aria-hidden="true"/><h4>{sessionName(session,state.plan)}</h4></div>
      <p>{durationText(session,state.custom)} · Week {session.week} · {session.status==='scheduled'&&selected<today?'Overdue':session.status}</p>
      <p>{session.items.length} exercise{session.items.length===1?'':'s'}</p>
      <div className="button-row"><Button variant="outline" onClick={()=>onSession(session)}>Review workout</Button>{onStart&&!active&&selected===today&&session.status==='scheduled'&&<Button disabled={busy||!!state.active||!!issue} onClick={()=>onStart(session)}>Start workout</Button>}</div>
      {selected===today&&session.status==='scheduled'&&!active&&issue&&<p className="small-copy">{issue}</p>}
     </div>;
    })}
    {details.records.map(workout=><div className="calendar-detail calendar-workout-detail" key={workout.id}><div className="calendar-detail-heading"><CheckCircle2 size={18} aria-hidden="true"/><h4>{workoutName(workout,state)}</h4></div><p>{workout.sets.filter(set=>set.done).length} logged sets / tasks · {workout.partial?'Partial':'Complete'}</p><Button variant="outline" onClick={()=>onHistory(workout)}>View recorded workout</Button></div>)}
    {onAddEvent&&<Button variant="ghost" className="calendar-add-event" onClick={()=>onAddEvent(selected)}><Flag size={16} aria-hidden="true"/>Add an event on this date</Button>}
   </div>
  </div>
 </section>;
}
