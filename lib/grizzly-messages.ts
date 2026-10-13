/** Decorative encouragement only; the actual Today status and actions stay separate. */
export type GrizzlyMessageContext='ready'|'active'|'recovery'|'review';
export type GrizzlyDailyMessage={id:string;title:string;body:string};
export const trainingMessages = [
 {id:'wake',title:'Wake the grizzly.',body:'Your den. Your discipline. Your next strong day.'},
 {id:'strong',title:'Strong starts here.',body:'One good session. One step forward. Make it yours.'},
 {id:'quiet',title:'Quiet focus. Bear strength.',body:'Settle in. Find your rhythm. Make each rep count.'},
 {id:'trail',title:'Leave a stronger trail.',body:'The work you record today becomes the progress you can see tomorrow.'},
 {id:'den',title:'This is your den.',body:'Bring your goal. Bring your focus. Build at your own pace.'},
 {id:'claws',title:'Claws out. Focus in.',body:'Follow your plan, own your technique, and take it one set at a time.'},
 {id:'haul',title:'Built for the long haul.',body:'A little consistency goes a long way. Your next good day starts here.'},
 {id:'wild',title:'Find your wild side.',body:'Make room for the things you want to become stronger at.'},
 {id:'steady',title:'Steady is a superpower.',body:'Show up where you are. Let good work add up.'},
 {id:'momentum',title:'Make your own momentum.',body:'You choose the pace. Your plan gives the day a direction.'},
 {id:'chapter',title:'Write a strong chapter.',body:'Today is another page in your training story.'},
 {id:'roar',title:'Let the work roar.',body:'No need for a perfect day. Give your next set your attention.'},
 {id:'roots',title:'Strong roots. Big goals.',body:'Build the basics well. Give your progress room to grow.'},
 {id:'hunt',title:'The daily hunt.',body:'Find your focus. Follow your plan. Leave with something to build on.'},
 {id:'own',title:'Own your next strong day.',body:'Your training belongs to you. Make today a step you can be proud of.'},
 {id:'tracks',title:'Good work leaves tracks.',body:'Log the little wins. Watch your story take shape.'},
 {id:'pack',title:'Different goals. One pack.',body:'This den has room for your kind of strong.'},
 {id:'ground',title:'Find your footing.',body:'Start with the basics. Build a day that feels like yours.'},
 {id:'stride',title:'A strong stride starts small.',body:'Give the next step your attention. Let the bigger picture grow.'},
 {id:'territory',title:'Make this your territory.',body:'A place to focus. A plan to follow. A story to keep building.'},
 {id:'patient',title:'Patient work. Bear strength.',body:'Leave the rush outside. Bring your attention to what is in front of you.'},
 {id:'craft',title:'Put some craft in your claws.',body:'Good technique deserves as much attention as the number on the bar.'},
 {id:'spark',title:'Small spark. Big grizzly.',body:'You do not need a dramatic start. You need a next step that fits.'},
 {id:'rhythm',title:'Find the rhythm of your den.',body:'Settle in, review the plan, and make space for focused work.'},
 {id:'north',title:'Keep your goal in sight.',body:'The trail can turn. Your training still belongs to you.'},
 {id:'noise',title:'Less noise. More grizzly.',body:'A clear plan and a little focus can give today its own shape.'},
 {id:'roots-deep',title:'Grow deep. Stand strong.',body:'Give the basics your best attention. They are worth coming back to.'},
 {id:'signature',title:'Leave your own paw print.',body:'Your goal, your pace, your progress. Make the day your own.'},
 {id:'return',title:'Welcome to your next chapter.',body:'No perfect streak required. Start with the plan in front of you.'},
 {id:'purpose',title:'Bring the bear. Keep the purpose.',body:'Choose the work that fits your goal. Give it your full attention.'},
 {id:'learn',title:'Curiosity has claws.',body:'Notice what works for you. Your training story has room to learn.'},
 {id:'forward',title:'Your next strong day.',body:'Take a look at the plan. Choose your next step with purpose.'},
] as const;
export const recoveryMessages = [
 {id:'rest-den',title:'Even grizzlies need the den.',body:'Rest belongs in the plan. Give yourself room to recharge.'},
 {id:'rest-haul',title:'Built for the long haul.',body:'A quieter day can still be a good training day.'},
 {id:'rest-strong',title:'Recover with purpose.',body:'Make space for rest today. Your next session will be waiting.'},
 {id:'rest-pace',title:'Your pace. Your path.',body:'You do not have to make every day a workout day.'},
 {id:'rest-roots',title:'Let your roots grow.',body:'Take the day as it comes. Consistency includes recovery.'},
 {id:'rest-quiet',title:'A little quiet. A lot of grizzly.',body:'Settle into your den. The next chapter can wait.'},
 {id:'rest-trail',title:'The trail is still yours.',body:'One day of rest does not erase the work you have done.'},
 {id:'rest-pride',title:'Keep your purpose. Take the pause.',body:'Give yourself a little breathing room. The next step can wait.'},
 {id:'rest-reset',title:'Recharge the grizzly.',body:'Your plan has room for recovery. Let today be part of it.'},
 {id:'rest-next',title:'Your next strong day is coming.',body:'Rest now. Return when your plan and your body are ready.'},
 {id:'rest-room',title:'Make room for tomorrow.',body:'A steady routine has space for the quieter days too.'},
 {id:'rest-home',title:'Welcome back to the den.',body:'Check your plan, enjoy the pause, and keep your own rhythm.'},
 {id:'rest-exhale',title:'Let the den do its thing.',body:'Set the training aside for a while. There is room for life outside the gym.'},
 {id:'rest-fuel',title:'Take care of the bear.',body:'A little rest, a good meal, and a quieter pace can belong to today too.'},
 {id:'rest-season',title:'Every trail has quieter stretches.',body:'Your training story includes the days between sessions.'},
 {id:'rest-unhurried',title:'No roar required today.',body:'Keep your own rhythm. The den is here when you need it.'},
] as const;
export const activeMessages=[
 {id:'active-rhythm',title:'One set. Your full focus.',body:'Stay with the work in front of you. Log what actually happened.'},
 {id:'active-den',title:'You are in your den.',body:'Your saved workout is here. Take a look before choosing your next step.'},
 {id:'active-tracks',title:'Keep your tracks clear.',body:'Record your sets as they happen. The details belong to your story.'},
 {id:'active-craft',title:'Put the craft before the roar.',body:'Technique, rest, and honest logging all belong in this session.'},
 {id:'active-pace',title:'Bear strength. Your pace.',body:'Give yourself time between sets. Let the plan guide the work.'},
 {id:'active-attention',title:'Claws out. Attention in.',body:'Your next set deserves a clear head and a moment to prepare.'},
 {id:'active-real',title:'Real work leaves real tracks.',body:'A changed target or an unfinished set can be part of an honest training log.'},
 {id:'active-steady',title:'Steady through the session.',body:'Check your next target. Take the rest you need. Keep the details clear.'},
 {id:'active-chapter',title:'This chapter is yours.',body:'Record the work you do. You choose how the session unfolds.'},
 {id:'active-breath',title:'A little space between the roars.',body:'There is no hurry to outrun your rest timer.'},
 {id:'active-focus',title:'A quieter kind of fierce.',body:'Bring your attention to the setup, the movement, and the log.'},
 {id:'active-ground',title:'Keep your paws on the ground.',body:'Follow the targets that fit today. Leave room to adjust your session.'},
] as const;
export const reviewMessages=[
 {id:'review-den',title:'The den is here for you.',body:'Take a look at today’s status. Choose the next step that fits.'},
 {id:'review-map',title:'Check the trail before you roam.',body:'Your plan is worth a closer look. There is no rush to start a session.'},
 {id:'review-own',title:'Your path is still yours.',body:'Review the details before deciding what comes next.'},
 {id:'review-pause',title:'Keep the pause. Keep the purpose.',body:'A moment to review can be part of a thoughtful training routine.'},
 {id:'review-chapter',title:'A new chapter starts with a plan.',body:'Choose goals and a schedule that fit the life you have today.'},
 {id:'review-room',title:'Room to rethink. Room to grow.',body:'Your training can change with you. Start by reviewing the plan.'},
 {id:'review-compass',title:'Find your bearings.',body:'Read the day’s details. Let your next choice have a clear direction.'},
 {id:'review-pack',title:'There is room for your kind of strong.',body:'Build a plan around your goal, your time, and your available equipment.'},
 {id:'review-clear',title:'Clear head. Clear trail.',body:'Check the status and targets before choosing your next step.'},
 {id:'review-steady',title:'The long haul has room for changes.',body:'Review what fits now. Your saved work remains part of your story.'},
 {id:'review-ground',title:'Find solid ground first.',body:'Take time with the plan. A good next step can start with a closer look.'},
 {id:'review-grizzly',title:'Still grizzly. Still your choice.',body:'Follow the day’s status and give yourself room to decide.'},
] as const;
export const grizzlyMessages={ready:trainingMessages,active:activeMessages,recovery:recoveryMessages,review:reviewMessages} as const;

export function grizzlyLocalDayKey(date = new Date()):string {
 if(!Number.isFinite(date.getTime()))return '1970-01-01';
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function getGrizzlyDailyMessage(context:GrizzlyMessageContext,date:Date|string=new Date()):GrizzlyDailyMessage {
 const messages=grizzlyMessages[context],dayKey=typeof date==='string'?date:grizzlyLocalDayKey(date);
 // Interpret a local calendar date as an ordinal, never as a timezone-shifted instant.
 const parsed=/^\d{4}-\d{2}-\d{2}$/.test(dayKey)?Date.parse(dayKey+'T00:00:00Z'):NaN;
 const valid=Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===dayKey;
 const day=valid?Math.floor(parsed/86400000):0;
 return messages[((day%messages.length)+messages.length)%messages.length];
}
/** Holds/paused plans take priority over active-session encouragement. */
export function grizzlyMessageContext({active,hold,paused,action,issue=false,overdue=false}:{active:boolean;hold?:boolean;paused?:boolean;action:string;issue?:boolean;overdue?:boolean}):GrizzlyMessageContext {
 if(hold||paused)return 'review';
 if(active)return 'active';
 if(action==='start')return 'ready';
 if(issue||overdue||action==='plan'||action==='targets')return 'review';
 return 'recovery';
}
/** Calendar arithmetic preserves 23/25-hour days and local midnight boundaries. */
export function millisecondsUntilNextLocalDay(date=new Date()):number {
 if(!Number.isFinite(date.getTime()))return 60000;
 const next=new Date(date);next.setHours(24,0,0,0);
 return Math.max(1,next.getTime()-date.getTime());
}
// Retain the previous helper API for existing imports and saved review scripts.
export const localDayKey=grizzlyLocalDayKey;
export function grizzlyMessage(dayKey:string,rest:boolean):GrizzlyDailyMessage {
 return getGrizzlyDailyMessage(rest?'recovery':'ready',dayKey);
}
