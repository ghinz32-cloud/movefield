import {estimateSessionMinutes,type Profile,type Plan,type Session,type Item,type Event} from './training';
import {focusEvidence} from './program-evidence';

export type TrainingFocus='core'|'jumping'|'supersets'|'activity';
export const focusChoices:{id:TrainingFocus;title:string;description:string}[]=[
 {id:'core',title:'Core work',description:'Keep or add a short core block on up to two days each week.'},
 {id:'jumping',title:'Jump practice',description:'Practice a few bodyweight jumps once a week, with time to rest between sets.'},
 {id:'supersets',title:'Supersets',description:'Do two accessory exercises back to back, then rest. Main lifts keep their own sets and rest.'},
 {id:'activity',title:'Weight-management support',description:'Short brisk walks when they fit. Exercise supports health; it does not guarantee weight loss.'},
];
export const focusSources=[
 {id:'ACSM-2026',title:'ACSM healthy-adult resistance training position stand (2026)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/'},
 {id:'ZHANG-2025-SUPERSET',title:'Zhang and colleagues: adult superset review (2025)',url:'https://pubmed.ncbi.nlm.nih.gov/39903375/'},
 {id:'NSCA-YOUTH',title:'NSCA youth resistance training position statement',url:'https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf'},
 {id:'NSCA-PLYOMETRICS',title:'NSCA: account for existing jumping load',url:'https://www.nsca.com/education/articles/kinetic-select/plyometric-exercises/'},
 {id:'CDC-ACTIVITY',title:'CDC physical activity and weight',url:'https://www.cdc.gov/healthy-weight-growth/physical-activity/'},
 {id:'WHO-2020',title:'WHO physical activity guidance',url:'https://www.who.int/europe/news-room/fact-sheets/item/physical-activity'},
];
export function selectedFocusSources(focuses:readonly string[],youth:boolean){const ids=new Set(focusEvidence(focuses,youth));return focusSources.filter(s=>ids.has(s.id));}
const PREFIX='[Focus]';
const daysApart=(a:string,b:string)=>Math.abs(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
const addNote=(item:Item,note:string)=>{item.note=[item.note,note].filter(Boolean).join(' ')};
export function selectedFocuses(p:Profile):TrainingFocus[]{return [...new Set(p.focuses??[])].filter((f):f is TrainingFocus=>focusChoices.some(x=>x.id===f));}
/** Recheck existing jump work whenever dates, events or starting context change. */
export function focusScheduleConflict(plan:Plan,events:Event[],target:Session):string|null{
 if(plan.profile.mode!=='app'||!target.items.some(i=>i.exerciseId==='lib-small-jump-reset'))return null;
 const event=events.find(e=>daysApart(e.date,target.date)<(e.kind==='Competition'?3:2));
 if(event)return `Jump practice on ${target.date} is too close to ${event.name} on ${event.date}. Review the dates or remove the jump add-on. The 48/72-hour buffers are app defaults, not a guarantee of readiness.`;
 const other=plan.sessions.find(s=>s.id!==target.id&&s.status!=='missed'&&daysApart(s.date,target.date)<2);
 if(other)return `Jump practice on ${target.date} needs a review: another session is within this app's two-day buffer. Review the schedule before starting.`;
 return null;
}
export function focusSetupErrors(p:Profile):string[]{
 const f=selectedFocuses(p);if(!f.length||p.mode!=='app')return [];
 const errors:string[]=[];
 if(p.noFloor&&f.includes('core'))errors.push('The core add-on uses floor exercises. Remove this add-on to keep standing or seated training.');
 if(p.age<18&&f.includes('activity'))errors.push('Weight-management add-ons are adult-only. Youth plans focus on supervised skill, strength and healthy activity.');
 if(p.age<18&&f.includes('supersets'))errors.push('Youth foundations keep straight sets and coached rest. Remove supersets or use coach-directed tracking.');
 if(f.includes('jumping')){
  if(!p.jumpReady)errors.push('For jump practice, confirm a clear landing area and a comfortable landing skill, or remove this add-on.');
  if(p.experience==='First time'&&!p.supervision)errors.push('New jump practice needs qualified supervision. Confirm supervision or begin with the strength foundation.');
  if(p.age<18&&!p.supervision)errors.push('Youth jump practice requires qualified supervision for every session.');
  if(p.season==='In-season'&&p.goal==='sport')errors.push('In-season jumping needs coordination with sport practices. Use coach tracking for that add-on.');
  if(['powerlifting','hybrid','running'].includes(p.goal))errors.push('Automatic jump add-ons are not supported for this discipline. Keep its main plan and coordinate jumps in coach or manual tracking.');
 }
 return errors;
}
/** Bounded product defaults, not a source-validated individualized prescription.
 * Adds no dates; never trims a primary lift or a prescribed rest to make time.
 */
export function applyTrainingFocus(input:Plan,events:Event[]=[]):{plan:Plan|null;errors:string[]}{
 const p=input.profile,focuses=selectedFocuses(p);
 if(!focuses.length)return {plan:input,errors:[]};
 if(input.notes.some(n=>n.startsWith(PREFIX)))return {plan:input,errors:[]};
 const plan:Plan={...input,notes:[...input.notes],evidence:[...input.evidence],sessions:input.sessions.map(s=>({...s,items:s.items.map(i=>({...i}))}))};
 if(p.mode!=='app'){
  plan.notes.push(`${PREFIX} Saved interests: ${focuses.map(f=>focusChoices.find(c=>c.id===f)!.title).join(', ')}. ${p.mode==='coach'?'Your coach':'You'} chooses all exercises and grouping; no work, rest or dates were added.`);
  return {plan,errors:[]};
 }
 const errors=focusSetupErrors(p);if(errors.length)return {plan:null,errors};
 const byWeek=new Map<number,Session[]>();for(const s of plan.sessions){const group=byWeek.get(s.week)||[];group.push(s);byWeek.set(s.week,group)}
 const totals={core:0,jumping:0,supersets:0,activity:0};
 const fits=(s:Session,minutes:number)=>s.minutes+minutes<=p.minutes;
 const strength=(s:Session)=>!s.runSteps&&s.items.length>0;
 for(const [week,sessions] of byWeek){
  const lifts=sessions.filter(strength),weekErrors:string[]=[];
  if(focuses.includes('jumping')){
   const eligible=lifts.find(s=>fits(s,5)&&!plan.sessions.some(other=>other.id!==s.id&&daysApart(other.date,s.date)<2)&&!events.some(e=>daysApart(e.date,s.date)<(e.kind==='Competition'?3:2)));
   if(!eligible)weekErrors.push(`Week ${week}: jump practice needs five spare minutes and at least 48 hours from another planned session or training commitment (72 hours from competition). Change the selection or schedule; no day was moved.`);
   else {eligible.items.unshift({exerciseId:'lib-small-jump-reset',sets:p.age<18?1:2,reps:3,rest:120,kg:null,note:`${PREFIX} Jump practice after the warm-up, before lifting: ${p.age<18?'1':'2'} × 3 small, controlled jumps. Land softly and reset fully between reps. Stop for pain, poor balance or slower landings. No height, load or automatic increase in sets or reps.`});eligible.minutes+=5;totals.jumping++;}
  }
  if(focuses.includes('core')){
   const existing=lifts.filter(s=>s.items.some(i=>['deadbug','plank'].includes(i.exerciseId)));
   const target=Math.min(2,lifts.length);
   if(!target)weekErrors.push(`Week ${week}: core add-ons need a strength session in this prototype. Keep the run-only sequence or choose a strength/hybrid plan.`);
   for(const s of existing.slice(0,target)){const item=s.items.find(i=>['deadbug','plank'].includes(i.exerciseId))!;addNote(item,`${PREFIX} Core focus: this exercise already covers your core add-on. Move slowly, keep control and breathe normally.`);totals.core++;}
   let needed=Math.max(0,target-existing.length);
   for(const s of lifts.filter(s=>!existing.includes(s))){if(!needed)break;if(!fits(s,5))continue;s.items.push({exerciseId:'deadbug',sets:p.age<18?1:2,reps:6,rest:60,kg:null,note:`${PREFIX} Core focus: 6 reps per side, finish both sides before logging the set. Slow reach, steady back and normal breathing. Keep these sets and reps the same; stop when control changes.`});s.minutes+=5;totals.core++;needed--;}
   if(needed)weekErrors.push(`Week ${week}: core work needs five spare minutes in ${needed} more strength session${needed>1?'s':''}. Increase session time or remove the add-on; the main work was retained.`);
  }
  if(focuses.includes('activity')){
   if(sessions.some(s=>s.runSteps||s.items.some(i=>i.exerciseId==='run'||i.exerciseId==='walk'))){plan.notes.push(`${PREFIX} Week ${week}: the existing easy running/walking sessions supply activity support. No extra endurance minutes were added.`);totals.activity++;}
   else {let needed=Math.min(2,lifts.length);for(const s of lifts){if(!needed)break;if(!fits(s,10))continue;s.items.push({exerciseId:'walk',sets:1,reps:10,rest:0,kg:null,note:`${PREFIX} Walk for 10 minutes after lifting on a safe route or familiar treadmill. Keep a pace that lets you talk. No calorie target; this does not replace nutrition, sleep or individualized care.`});s.minutes+=10;totals.activity++;needed--;}
    if(needed)weekErrors.push(`Week ${week}: the walking add-on needs ten spare minutes in ${needed} strength session${needed>1?'s':''}. Increase session time or remove this add-on.`);}
  }
  if(focuses.includes('supersets')){
   let pairs=0;
   const allowedPairs=[['curl','triceps'],['calf','deadbug'],['calf','plank'],['leg-curl','curl'],['lateral','deadbug'],['lateral','calf']];
   for(const s of lifts){
    const pair=allowedPairs.map(([a,b])=>[s.items.findIndex(i=>i.exerciseId===a),s.items.findIndex(i=>i.exerciseId===b)]).find(([a,b])=>a>=0&&b>=0&&s.items[a].sets===s.items[b].sets);
    if(!pair)continue;const [ai,bi]=pair,[a,b]=[s.items[ai],s.items[bi]],roundRest=Math.max(120,a.rest+b.rest);
    // Same total between-round recovery budget; never use primary lifts or assume time saved.
    a.rest=0;b.rest=roundRest;
    const instruction=`${PREFIX} Assistance superset A: do one A1 set, then one A2 set; rest ${roundRest} seconds after A2 before repeating. Log the matching set on each exercise. Take extra rest if technique changes. Main lifts stay as straight sets.`;
    addNote(a,'A1. '+instruction);addNote(b,'A2. '+instruction);
    const later=Math.max(ai,bi);s.items=s.items.filter((_,i)=>i!==ai&&i!==bi);s.items.splice(Math.min(later-1,s.items.length),0,a,b);pairs++;totals.supersets++;
   }
   if(!pairs)weekErrors.push(`Week ${week}: this plan has no compatible assistance pair with equal set counts. Supersets will not be applied to main lifts. Remove supersets or select a foundation/bodybuilding plan with suitable assistance work.`);
  }
  errors.push(...weekErrors);
 }
 // Flat add-on allowances retain instruction time; the final canonical item
 // estimate also accounts for work, transitions and the resulting rest budget.
 for(const s of plan.sessions.filter(strength)){
  s.minutes=Math.max(s.minutes,estimateSessionMinutes(s.items,s.timeProfile==='brief'));
  if(s.minutes>p.minutes)errors.push(`${s.title} in week ${s.week} needs about ${s.minutes} minutes after the selected add-ons, beyond your ${p.minutes}-minute window. Increase available time or remove an add-on; the main work and rest were retained.`);
 }
 if(errors.length)return {plan:null,errors:[...new Set(errors)].slice(0,6)};
 plan.evidence=[...new Set([...plan.evidence,...focusEvidence(focuses,p.age<18)])];
 plan.notes.push(`${PREFIX} Selected: ${focuses.map(f=>focusChoices.find(c=>c.id===f)!.title).join(', ')}. The primary discipline, scheduled dates and main lift sets and reps are retained. Added time includes setup and rest; do not shorten rest to hit the estimate.`);
 if(focuses.includes('core'))plan.notes.push(`${PREFIX} Core: ${totals.core} session blocks, at most two per week. Existing trunk work counts first; added work is ${p.age<18?'one set':'two sets'} of six dead-bug reps per side with 60-second rest.`);
 if(focuses.includes('jumping'))plan.notes.push(`${PREFIX} Jumps: ${totals.jumping} small practice blocks, one per week, ${p.age<18?'three':'six'} landings per block. Two-minute set rest, a full reset between reps, and no automatic increase. Qualified supervision is required for youth and first-time users.`);
 if(focuses.includes('supersets'))plan.notes.push(`${PREFIX} Supersets: ${totals.supersets} assistance pairs. A1 then A2, then the combined rest (at least two minutes). Pair notes tell you what to log; no time saving is assumed and no main lift is paired.`);
 if(focuses.includes('activity'))plan.notes.push(`${PREFIX} Activity support adds two 10-minute walks per week when this is a strength-only plan, or uses existing easy run/walk work. These walks are a small addition, not a complete activity or weight-management plan. Supersets do not guarantee fat loss.`);
 plan.notes.push(`${PREFIX} The exact sets and reps and scheduling cutoffs are conservative product choices within source principles, not a validated personalized program. Selected principle sources: ${selectedFocusSources(focuses,p.age<18).map(s=>s.url).join(' ; ')}`);
 return {plan,errors:[]};
}
