import type {State} from './training';
import type {AppPreferences} from './app-preferences';
export const workoutReminderKind='training-workout';
export type WorkoutReminder={id:string;date:string;at:number;sessionIds:string[]};
export function workoutReminders(s:State,p:AppPreferences,now=Date.now(),limit=30):WorkoutReminder[]{
  if(!p.reminders||!s.plan||s.plan.paused||s.hold||typeof p.reminderTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.reminderTime))return [];
  const [hour,minute]=p.reminderTime.split(':').map(Number);
  const completed=new Set(s.history.filter(w=>w.finishedAt).map(w=>w.sessionId));
  const grouped=new Map<string,string[]>();
  for(const session of s.plan.sessions){
    if(session.status!=='scheduled'||completed.has(session.id)||s.active?.sessionId===session.id||s.events.some(e=>e.date===session.date))continue;
    const ids=grouped.get(session.date)||[];ids.push(session.id);grouped.set(session.date,ids);
  }
  return [...grouped].sort(([a],[b])=>a.localeCompare(b)).map(([date,sessionIds])=>{
    const [year,month,d]=date.split('-').map(Number);
    const at=new Date(year,month-1,d,hour,minute,0,0).getTime();
    return {id:`workout-${date}`,date,at,sessionIds};
  }).filter(r=>Number.isFinite(r.at)&&r.at>=now).slice(0,limit);
}
function stamp(at:number){return new Date(at).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
export function reminderCalendar(reminders:WorkoutReminder[],productName:string,now=Date.now()):string{
  const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,'\\$&');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Training App//Workout Reminders//EN','CALSCALE:GREGORIAN'];
  for(const r of reminders)lines.push('BEGIN:VEVENT',`UID:${r.id}@training-local`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(r.at)}`,`DTEND:${stamp(r.at+30*60000)}`,`SUMMARY:${escape(productName)} workout`,`DESCRIPTION:Open your app to review today’s training. Calendar entries do not update automatically.`,'BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:Your workout reminder','END:VALARM','END:VEVENT');
  return [...lines,'END:VCALENDAR',''].join('\r\n');
}
