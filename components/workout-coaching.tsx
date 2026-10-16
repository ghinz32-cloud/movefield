'use client';
import type {CoachingSummary} from '@/lib/workout-coaching';
import {useAppPreferences} from '@/components/app-preferences';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';

/** Short by default; the same local facts are used on the web and phones. */
export function CoachingMessages({summary}:{summary:CoachingSummary}){
 return <div className="workout-coaching-copy">
  <ul className="coaching-messages">{summary.messages.map(message=><li key={message.id}>{message.text}</li>)}</ul>
  <details><summary>What this is based on</summary>
   {summary.details.map((detail,index)=><p key={index}>{detail}</p>)}
   <p>Coaching uses the records on this device. It works offline and does not send your workout to an AI service. Suggestions leave your accepted targets unchanged.</p>
  </details>
 </div>;
}

export function CoachingSettings(){
 const {p,update,saveError}=useAppPreferences();
 return <section className="card"><h2>Workout coaching</h2><p className="muted">A short preparation note and a review of what you saved.</p>
  <label className="field"><span>Coaching messages</span><Select value={p.coaching} onValueChange={coaching=>update({coaching:coaching as 'auto'|'manual'|'off'})}>
   <SelectTrigger aria-label="Coaching messages"><SelectValue/></SelectTrigger><SelectContent>
    <SelectItem value="auto">Automatic before and after</SelectItem><SelectItem value="manual">Only when I open coaching</SelectItem><SelectItem value="off">Off</SelectItem>
   </SelectContent></Select></label>
  <p className="small-copy">Your optional workout check-in is separate. These messages use a local coaching library; no AI account or download is needed.</p>
  {saveError&&<p role="alert" className="notice warning">{saveError}</p>}
 </section>;
}
