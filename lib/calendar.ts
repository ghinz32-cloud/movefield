import {addDays,changed,competitionConflict,day,dayDistance,uid,validDay,type Event,type State} from './training';

export const commitmentKinds=['Competition','Team practice','Other training','Vacation','Day off','Travel / unavailable'] as const;
export const commitmentPriorities=['Normal','High','Season priority'] as const;
export type CommitmentInput={name:string;date:string;through?:string;kind:string;priority:string;minutes:number;provisional:boolean};
export type CommitmentPreview={input:CommitmentInput;base:string;dates:string[];conflicts:string[];prescription:string};
export const calendarSignature=(s:State)=>JSON.stringify([s.plan?.id,s.plan?.version,s.active?.id,s.events]);
const fixedDay=(kind:string)=>['Vacation','Day off','Travel / unavailable'].includes(kind);

/** Commitments are local calendar dates, not instants converted on travel. */
export function previewCommitment(s:State,input:CommitmentInput):CommitmentPreview{
 const name=input.name.trim();
 if(!name||name.length>100||!validDay(input.date)||!commitmentKinds.includes(input.kind as typeof commitmentKinds[number])||!commitmentPriorities.includes(input.priority as typeof commitmentPriorities[number])||typeof input.provisional!=='boolean')throw Error('Enter a name, valid date, commitment type and importance.');
 if(!Number.isFinite(input.minutes)||input.minutes<=0||input.minutes>1440)throw Error('Enter a duration from 1 to 1,440 minutes.');
 if(input.through&&!fixedDay(input.kind))throw Error('A date range is available for time off and travel only.');
 const span=input.through?dayDistance(input.date,input.through):0;
 if(!Number.isInteger(span)||span<0||span>89)throw Error('Choose an end date within 90 days, on or after the start.');
 const dates=Array.from({length:span+1},(_,i)=>addDays(input.date,i));
 if(s.events.length+dates.length>2000)throw Error('The calendar is full. Export your records before adding more commitments.');
 if(dates.some(date=>s.events.some(e=>e.date===date&&e.kind===input.kind&&e.name.toLocaleLowerCase()===name.toLocaleLowerCase())))throw Error('A matching commitment already exists in this range.');
 const normalized={...input,name,minutes:fixedDay(input.kind)?1440:input.minutes};
 const proposed=dates.map(date=>({id:'preview-'+date,name,date,kind:input.kind,priority:input.priority,minutes:normalized.minutes,provisional:input.provisional}));
 const conflicts=(s.plan?.sessions||[]).filter(x=>x.status==='scheduled'&&(dates.includes(x.date)||!!competitionConflict(s.plan!.profile,x.date,[...s.events,...proposed]))).map(x=>x.id);
 return {input:normalized,base:calendarSignature(s),dates,conflicts,prescription:JSON.stringify(normalized)};
}
export function acceptCommitment(s:State,preview:CommitmentPreview):State{
 if(calendarSignature(s)!==preview.base||JSON.stringify(preview.input)!==preview.prescription)throw Error('Your calendar or preview changed. Review the commitment again.');
 const checked=previewCommitment(s,preview.input);
 const added:Event[]=checked.dates.map(date=>({id:uid('event'),name:checked.input.name,date,kind:checked.input.kind,priority:checked.input.priority,minutes:checked.input.minutes,provisional:checked.input.provisional}));
 return changed({...s,events:[...s.events,...added],proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},'Added fixed commitment '+checked.input.name+'. Workout dates and recorded work were kept.');
}
export function removeCommitment(s:State,id:string,expected:string):State{
 const event=s.events.find(e=>e.id===id);
 if(!event||JSON.stringify(event)!==expected)throw Error('This commitment changed. Review its current details before removing it.');
 return changed({...s,events:s.events.filter(e=>e.id!==id),proposals:s.proposals.map(p=>['pending','queued'].includes(p.status)?{...p,status:'stale' as const}:p)},'Removed commitment '+event.name+'. Workout dates and history were kept.');
}
export function monthDates(date:string,weekStart:0|1=0):string[]{
 if(!validDay(date))throw Error('Choose a valid calendar date.');
 const first=date.slice(0,8)+'01',weekday=new Date(first+'T12:00:00').getDay();
 const start=addDays(first,-((weekday-weekStart+7)%7));
 return Array.from({length:42},(_,i)=>addDays(start,i));
}
/** Keep the selected day when browsing months, clamping short months locally. */
export function calendarMonthDate(date:string,offset:number):string{
 if(!validDay(date)||!Number.isInteger(offset)||Math.abs(offset)>1200)throw Error('Choose a valid calendar month.');
 const first=new Date(date.slice(0,8)+'01T12:00:00');first.setMonth(first.getMonth()+offset);
 const last=new Date(first.getFullYear(),first.getMonth()+1,0,12).getDate();
 first.setDate(Math.min(Number(date.slice(-2)),last));
 const result=day(first);if(!validDay(result))throw Error('Choose a valid calendar month.');
 return result;
}
export function calendarDay(s:State,date:string,today=day()){
 if(!validDay(date)||!validDay(today))throw Error('Choose a valid calendar date.');
 const sessions=(s.plan?.sessions||[]).filter(x=>x.date===date),events=s.events.filter(e=>e.date===date),records=s.history.filter(w=>w.finishedAt&&w.date===date);
 const dates=s.plan?.sessions.map(x=>x.date).sort()||[],within=!!dates.length&&date>=dates[0]&&date<=dates[dates.length-1];
 const label=records.length?'Recorded training':sessions.some(x=>x.status==='scheduled')?(date<today?'Overdue workout':date===today?'Workout today':'Scheduled workout'):sessions.some(x=>x.status==='missed')?'Skipped workout':sessions.length?'Recorded session':events.length?'Fixed commitment':within&&s.plan?.profile.mode==='app'?'Rest day':'Unplanned day';
 return {date,label,sessions,events,records,isToday:date===today,active:s.active?.date===date?s.active:null};
}
