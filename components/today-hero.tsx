'use client';
import {CalendarDays,Play,Dumbbell,Timer} from 'lucide-react';
import {todayView} from '@/lib/today-view';
import {sessionName,workoutName} from '@/lib/presentation';
import {niceDate,type State,type Session} from '@/lib/training';
import {durationText} from '@/lib/session-duration';
import {Button} from './ui/button';
import {isGrizzly} from '@/lib/brand';
import {GrizzlyPaw} from '@/grizzly/grizzly-mark';

export function TodayHero({state:s,busy=false,onResume,onStart,onPreview,onTargets,onPlan,onCalendar}:{state:State;busy?:boolean;onResume:()=>void;onStart:(session:Session)=>void;onPreview:(session:Session)=>void;onTargets:(session:Session)=>void;onPlan:()=>void;onCalendar:()=>void}){
 const view=todayView(s),session=view.session;
 const act=()=>{if(view.action==='resume')onResume();else if(view.action==='start'&&session)onStart(session);else if(view.action==='targets'&&session)onTargets(session);else if(view.action==='preview'&&session)onPreview(session);else onPlan()};
 const rest=!s.active&&!view.scheduledToday.length&&['Rest day','Unplanned day','Recorded training','Fixed commitment','Skipped workout'].includes(view.calendar.label);
 return <section className="session-feature" aria-label="Today’s training"><div className="split"><span className="pill dark">{view.label.toUpperCase()}</span>{isGrizzly?<GrizzlyPaw/>:<Dumbbell size={30} aria-hidden="true"/>}</div>
 {rest&&<p className="today-day-status">{view.calendar.label==='Recorded training'?`${view.calendar.records.length} workout${view.calendar.records.length===1?'':'s'} recorded today.`:view.calendar.label==='Fixed commitment'?'A fixed commitment is on your calendar today.':view.calendar.label==='Skipped workout'?'Today’s planned workout is marked skipped.':view.calendar.label==='Rest day'?'Rest day · your next workout is below.':session?'Today is unplanned · review your next workout below.':'Choose a plan when you’re ready to schedule training.'}</p>}
 <h2>{s.active?workoutName(s.active,s):session?sessionName(session,s.plan):s.plan?'Review this block':'Your first plan starts here'}</h2>
 {session&&<div className="feature-metrics"><span><Timer aria-hidden="true"/>{durationText(session,s.custom)}</span><span>{session.items.length} exercises</span><span>{niceDate(s.active?.date||session.date)}</span></div>}
 {s.active&&<p>{s.active.sets.filter(x=>x.done).length} of {s.active.sets.length} sets/tasks saved. Your workout and rest timer are kept.</p>}
 {view.issue&&!s.active&&<p>{view.issue}</p>}
 {view.overdue.length>0&&!s.active&&<p>{view.overdue.length} earlier workout{view.overdue.length===1?' needs':'s need'} review. Dates and logged work stay as recorded.</p>}
 {view.calendar.events.length>0&&<p>{view.calendar.events.map(event=>event.name).join(' · ')}</p>}
 <div className="button-row"><Button disabled={busy&&(view.action==='start'||view.action==='targets')} onClick={act}><Play size={17} aria-hidden="true"/>{view.actionLabel}</Button>{session&&!s.active&&view.action==='start'&&<Button className="lime-outline" variant="outline" onClick={()=>onPreview(session)}>Session details</Button>}<Button className="lime-outline" variant="outline" onClick={onCalendar}><CalendarDays size={17} aria-hidden="true"/>Calendar</Button></div>
 <div className="feature-foot">{s.hold?'A reported concern is on hold. Stop the affected activity and seek appropriate guidance.':s.plan?.paused?'Your plan stays paused until you choose to resume it.':s.plan?.profile.mode==='app'?'Your accepted plan · proposed changes need your approval':s.plan?'Your tracking copy · your coach’s or your own targets':'Choose your goal, equipment and available time.'}</div></section>;
}
