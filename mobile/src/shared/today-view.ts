import {calendarDay} from './calendar';
import {day,eligibility,nextSession,type State,type Session} from './training';

export type TodayAction='resume'|'start'|'targets'|'preview'|'plan';
export function todayView(s:State,today=day()){
 const calendar=calendarDay(s,today,today),next=nextSession(s),activeSession=s.active?s.plan?.sessions.find(x=>x.id===s.active!.sessionId):undefined;
 const session:Session|undefined=activeSession?{...activeSession,items:s.active?.targets||activeSession.items}:next;
 const scheduledToday=calendar.sessions.filter(x=>x.status==='scheduled'),overdue=(s.plan?.sessions||[]).filter(x=>x.status==='scheduled'&&x.date<today&&x.id!==s.active?.sessionId);
 const issue=next?eligibility(s,next):null;
 let label=scheduledToday.length?'Workout today':calendar.label;
 let action:TodayAction='plan',actionLabel=s.plan?'Review your plan':'Build my plan';
 if(s.active){label='Workout in progress';action='resume';actionLabel=s.hold?'Open saved workout':'Resume workout'}
 else if(s.hold&&s.plan?.profile.mode==='app'){label='Concern needs review';actionLabel='Review your plan'}
 else if(s.plan?.paused){label='Plan paused';actionLabel='Review paused plan'}
 else if(next){
  if(next.date<today){label='Earlier workout to review';action='preview';actionLabel='Review overdue workout'}
  else if(next.date>today){action='preview';actionLabel='Preview next workout'}
  else if(!next.items.length){action='targets';actionLabel='Add session targets'}
  else if(issue){label='Workout needs review';action='preview';actionLabel='Review workout details'}
  else{action='start';actionLabel=s.plan?.profile.mode==='app'?'Start workout':'Open tracking session'}
 }
 else if(s.plan){label='Block ready for review';actionLabel='Choose next block'}
 return {today,label,calendar,session,next,overdue,scheduledToday,issue,action,actionLabel};
}
