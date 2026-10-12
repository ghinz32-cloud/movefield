import type {Plan} from '@/lib/training';
import {planFit} from '@/lib/plan-fit';
import {ProgramScience} from './program-science';
export function PlanFit({plan}:{plan:Plan}){
 const fit=planFit(plan);if(plan.profile.mode!=='app')return null;
 return <details className="guide-extra"><summary>How this plan fits your goal and week</summary><p>Week {fit.week}: {fit.strengthDays} strength days, {fit.runningDays} running days and {fit.easyDays} easy activity days. {fit.weeklyWorkSets} strength work sets; longest estimated session {fit.minutes} minutes.</p>
 {fit.weeklyWorkSets>0&&<><table><caption>Work sets involving each region in week {fit.week}</caption><thead><tr><th>Region</th><th>Sets</th><th>Days</th></tr></thead><tbody>{fit.regions.map(r=><tr key={r.name}><td>{r.name}</td><td>{r.sets}</td><td>{r.days}</td></tr>)}</tbody></table><p className="small-copy">A compound exercise can appear in several regions. These counts describe planned work; they do not convert indirect work into equivalent isolation sets or guarantee growth. Warm-up sets are separate. Early practice and review weeks may use fewer sets.</p></>}
 {plan.profile.goal==='hypertrophy'&&<p className="small-copy">ACSM’s 2026 public guidance highlights roughly ten weekly sets per muscle group for a greater growth emphasis. A short starter supplies less work; choose a fuller block when time, equipment and recovery allow.</p>}
 {plan.profile.goal==='strength'&&<p className="small-copy">Strength also depends on resistance and practice of the lift you want to improve. A light fixed dumbbell or bodyweight starter has a different ceiling from heavier equipment.</p>}
 {!fit.inventoryConfirmed&&<p className="small-copy">Actual equipment remains unconfirmed. Complete the inventory in setup to avoid unavailable machines.</p>}
 <ProgramScience plan={plan}/>
 </details>;
}
