import {programCatalog, programReferences} from './program-catalog';
import type {Plan, Session, State, Workout} from './training';

// Display names never replace stored titles, load roles or progression keys.
export function planName(plan: Plan): string {
  const source = programReferences.find(p => p.id === plan.profile.programId);
  if (source) return `${source.name} by ${source.author} · ${source.workouts?'manual template':'tracking calendar'}`;
  if (plan.profile.mode !== 'app') return plan.name;
  if (plan.template === 'RUN-WALK') return 'NHS Couch to 5K · run/walk plan';
  return programCatalog.find(p => p.id === plan.template)?.name ?? plan.name;
}

export const workoutDisplayNames: Record<string, string> = {
  "Squat + bench": "Squat & bench",
  "Deadlift + bench practice": "Deadlift & bench practice",
  "Squat + bench + deadlift practice": "Squat, bench & deadlift practice",
  "Squat emphasis": "Lower body · Squat focus",
  "Bench emphasis": "Upper body · Bench focus",
  "Deadlift emphasis": "Lower body · Deadlift focus",
  "Bench volume": "Upper body · Extra bench sets",
  "Squat strength + muscle": "Full body · Squat focus",
  "Deadlift strength + muscle": "Full body · Deadlift focus",
  "Bench strength + muscle": "Full body · Bench focus",
  "Lower · squat strength": "Lower body · Squat focus",
  "Upper · bench strength": "Upper body · Bench focus",
  "Lower · deadlift strength": "Lower body · Deadlift focus",
  "Upper · muscle emphasis": "Upper body · Higher reps",
  "Full body · A": "Full body · Squat & bench",
  "Full body · B": "Full body · Squat & incline press",
  "Full body · C": "Full body · Split squats & arms",
  "Upper growth · A": "Upper body · Bench & back",
  "Upper growth · B": "Upper body · Incline press & arms",
  "Lower growth · A": "Lower body · Barbell squats",
  "Lower growth · B": "Lower body · Goblet & split squats",
  "Hybrid strength · A": "Full body strength · Workout 1",
  "Hybrid strength · B": "Full body strength · Workout 2",
  "Easy walk–run · A": "Easy walk–run 1",
  "Easy walk–run · B": "Easy walk–run 2",
  "Easy run · A": "Easy run 1",
  "Easy run · B": "Easy run 2",
  "Easy run · C": "Easy run 3",
  "Longer easy run": "Longer easy run",
  "SBD · squat emphasis": "Squat focus · Bench & rows",
  "SBD · deadlift emphasis": "Deadlift focus · Bench & core",
  "SBD · bench emphasis": "Bench focus · Squat & deadlift",
  "Upper · power": "Upper body · Lower reps",
  "Lower · power": "Lower body · Lower reps",
  "Upper · hypertrophy": "Upper body · Higher reps",
  "Lower · hypertrophy": "Lower body · Higher reps",
  "Tiered lower · squat": "Lower body · Squat focus",
  "Tiered upper · bench": "Upper body · Bench focus",
  "Tiered lower · deadlift": "Lower body · Deadlift focus",
  "Tiered upper · press": "Upper body · Shoulder press focus",
  "Strength foundation · A": "Full body · Squats & push-ups",
  "Strength foundation · B": "Full body · Squats & shoulder press",
  "Barbell strength · A": "Squat & bench · Lower reps",
  "Barbell strength · B": "Deadlift & shoulder press",
  "Barbell strength · C": "Squat & bench · Higher reps",
  "General fitness · A": "Full body · Squats & push-ups",
  "General fitness · B": "Full body · Squats & shoulder press",
  "Home fitness · A": "Home full body · Squats & core",
  "Home fitness · B": "Home full body · Split squats & calves",
  "Calisthenics · A": "Bodyweight & bands · Squats & core",
  "Calisthenics · B": "Bodyweight & bands · Split squats & calves",
  "Calisthenics practice · A": "Bodyweight & bands · Squats & core",
  "Calisthenics practice · B": "Bodyweight & bands · Split squats & glutes",
  "Calisthenics practice · C": "Bodyweight & bands · Squats & calves",
  "SBD foundation · A": "Squat, bench & deadlift · Workout 1",
  "SBD foundation · B": "Squat, bench & deadlift · Workout 2",
  "Foundation · squat + bench": "Full body · Squat & bench",
  "Foundation · hinge + press": "Full body · Deadlift & bench",
  "Foundation 3 · squat": "Full body · Squat focus",
  "Foundation 3 · bench": "Full body · Bench focus",
  "Foundation 3 · deadlift": "Full body · Deadlift focus",
  "Dumbbell strength + size · A": "Dumbbell full body · Squat focus",
  "Dumbbell strength + size · B": "Dumbbell full body · Deadlift focus",
  "Dumbbell strength + size · C": "Dumbbell full body · Chest press focus",
  "Two-day muscle · A": "Full body · Machines & arms",
  "Two-day muscle · B": "Full body · Squats & incline press",
  "Dumbbell muscle · A": "Dumbbell full body · Chest & core",
  "Dumbbell muscle · B": "Dumbbell full body · Shoulders & arms",
  "Dumbbell muscle · C": "Dumbbell full body · Chest & shoulders",
  "Machine muscle · A": "Machine full body · Rows & curls",
  "Machine muscle · B": "Machine full body · Pulldowns & triceps",
  "Machine muscle · C": "Machine full body · Rows & leg extensions",
  "Machine strength · A": "Machine full body · Row workout",
  "Machine strength · B": "Machine full body · Pulldown workout",
  "Dumbbell strength · A": "Dumbbell full body · Chest & core",
  "Dumbbell strength · B": "Dumbbell full body · Shoulders & arms",
  "Dumbbell strength · C": "Dumbbell full body · Chest & shoulders",
  "Full fitness · A": "Full body · Chest & core",
  "Full fitness · B": "Full body · Shoulders & arms",
  "Full fitness · C": "Full body · Chest & shoulders",
  "Machine fitness · A": "Machine full body · Row workout",
  "Machine fitness · B": "Machine full body · Pulldown workout",
  "Bodyweight build · A": "Bodyweight & bands · Squat workout 1",
  "Bodyweight build · B": "Bodyweight & bands · Split squat workout",
  "Bodyweight build · C": "Bodyweight & bands · Squat workout 2",
  "Bodyweight build 2 · A": "Bodyweight & bands · Squat workout",
  "Bodyweight build 2 · B": "Bodyweight & bands · Split squat workout",
  "Home hybrid · A": "Home strength · Squat workout",
  "Home hybrid · B": "Home strength · Split squat workout",
  "Home walk–run · A": "Easy walk–run 1",
  "Home walk–run · B": "Easy walk–run 2",
  "Dumbbell hybrid · A": "Dumbbell full body · Squats & chest",
  "Dumbbell hybrid · B": "Dumbbell full body · Deadlifts & shoulders",
  "Home muscle · A": "Bodyweight & bands · Squat workout 1",
  "Home muscle · B": "Bodyweight & bands · Split squat workout",
  "Home muscle · C": "Bodyweight & bands · Squat workout 2",
  "Brief squat practice": "Short squat practice",
  "Brief bench practice": "Short bench practice",
  "Brief deadlift practice": "Short deadlift practice",
  "Brief walk–run · A": "Short walk–run 1",
  "Brief walk–run · B": "Short walk–run 2",
  "15-minute walk–run · A": "15-minute walk–run 1",
  "15-minute walk–run · B": "15-minute walk–run 2",
  "15-minute walk–run · C": "15-minute walk–run 3",
  "Athletic foundation · A": "Full body strength · Workout 1",
  "Athletic foundation · B": "Full body strength · Workout 2",
  "Learn the squat + row": "Squat technique & rows",
  "Learn the bench + calf raise": "Bench technique & calf raises",
  "Learn the deadlift + core": "Deadlift technique & core",
  "Standing strength · A": "Standing full body · Squat workout",
  "Standing strength · B": "Standing full body · Band good mornings",
  "Machine foundation · A": "Machine workout · Legs, chest & rows",
  "Machine foundation · B": "Machine workout · Legs, chest & pulldowns",
  "Movement start · A": "Bodyweight basics · Workout 1",
  "Movement start · B": "Bodyweight basics · Workout 2",
  "Bodyweight + pulling · A": "Bodyweight & dumbbell rows · Squat workout",
  "Bodyweight + pulling · B": "Bodyweight & dumbbell rows · Split squat workout",
  "Combined strength + walk/jog · A": "Strength & walk–run · Workout 1",
  "Combined strength + walk/jog · B": "Strength & walk–run · Workout 2",
  "Brief full body 2 · squat + push + pull": "Short full body · Workout 1",
  "Brief full body 2 · hinge + pull + core": "Short workout · Back, glutes & core",
  "Brief full body 3 · squat + push + pull": "Short full body · Workout 1",
  "Brief full body 3 · hinge + push + pull": "Short full body · Workout 2",
  "Brief full body 3 · legs + trunk": "Short workout · Legs & core",
  "Brief practice 2 · squat + push + pull": "Short full body · Workout 1",
  "Brief practice 2 · hinge + pull + core": "Short workout · Back, glutes & core",
  "Brief muscle base 2 · squat + push + pull": "Short full body · Workout 1",
  "Brief muscle base 2 · hinge + pull + core": "Short workout · Back, glutes & core",
  "Brief strength + size 2 · squat + push + pull": "Short full body · Workout 1",
  "Brief strength + size 2 · hinge + push + pull": "Short full body · Workout 2",
  "Brief strength foundation 2 · squat + push + pull": "Short full body · Workout 1",
  "Brief strength foundation 2 · hinge + pull + core": "Short workout · Back, glutes & core",
  "Brief practice 3 · squat + push + pull": "Short full body · Workout 1",
  "Brief practice 3 · hinge + push + pull": "Short full body · Workout 2",
  "Brief practice 3 · legs + trunk": "Short workout · Legs & core",
  "Brief muscle base · squat + push + pull": "Short full body · Workout 1",
  "Brief muscle base · hinge + push + pull": "Short full body · Workout 2",
  "Brief muscle base · legs + trunk": "Short workout · Legs & core",
  "Brief strength + size · squat + push + pull": "Short full body · Workout 1",
  "Brief strength + size · hinge + push + pull": "Short full body · Workout 2",
  "Brief strength + size · press + legs": "Short workout · Chest, legs & core",
  "Brief practice · squat + push + pull": "Short full body · Workout 1",
  "Brief practice · hinge + push + pull": "Short full body · Workout 2",
  "Brief practice · legs + trunk": "Short workout · Legs & core",
  "Brief strength foundation · squat + push + pull": "Short full body · Workout 1",
  "Brief strength foundation · hinge + push + pull": "Short full body · Workout 2",
  "Brief strength foundation · legs + trunk": "Short workout · Legs & core",
  "Brief hybrid · squat + push + pull": "Short full body · Workout 1",
  "Brief hybrid · hinge + push + pull": "Short full body · Workout 2",
  "Strength · Standing A": "Standing dumbbells · Squat & push-up workout",
  "Strength · Standing B": "Standing dumbbells · Split squat & shoulder press",
  "General fitness · Standing A": "Standing dumbbells · Squat & push-up workout",
  "General fitness · Standing B": "Standing dumbbells · Split squat & shoulder press",
  "Build muscle · Standing A": "Standing dumbbells · Squat & push-up workout",
  "Build muscle · Standing B": "Standing dumbbells · Split squat & shoulder press",
  "Strength + muscle · Standing A": "Standing dumbbells · Squat & push-up workout",
  "Strength + muscle · Standing B": "Standing dumbbells · Split squat & shoulder press",
  "Sport strength foundation · Standing A": "Standing dumbbells · Squat & push-up workout",
  "Sport strength foundation · Standing B": "Standing dumbbells · Split squat & shoulder press"
};

export function sessionName(session: Session, plan?: Plan | null): string {
  const source = programReferences.find(p => p.id === plan?.profile.programId);
  if (source && session.title.startsWith(source.name + ' · day ')) {
    return `${source.name} by ${source.author} · Day ${session.title.split(' · day ')[1]}`;
  }
  if (plan && plan.profile.mode !== 'app') return session.title;
  const base = session.title.replace(/ · review week$/, '');
  const definition = session.roleId ? programCatalog.find(p => p.slots.some((_, i) => session.roleId === `${p.id}-${i}`)) : undefined;
  const slotIndex = definition?.slots.findIndex((slot, i) => session.roleId === `${definition.id}-${i}` && slot.title === base) ?? -1;
  if (definition && slotIndex >= 0) {
    const slot = definition.slots[slotIndex];
    const originalMainExercisesRemain = slot.items.slice(0, 2).every(([id]) => session.items.some(item => item.exerciseId === id));
    // A replacement exercise can make a lift-specific title inaccurate.
    const title = !slot.kind && !originalMainExercisesRemain
      ? `${['upper','push','pull','chestback','shouldersarms'].includes(slot.group) ? 'Upper body' : ['lower','legs'].includes(slot.group) ? 'Lower body' : 'Full body'} · Workout ${slotIndex + 1}`
      : workoutDisplayNames[base] ?? base;
    return title + (session.title.endsWith(' · review week') ? ' · lighter week' : '');
  }
  if (plan?.template === 'RUN-WALK' && /^Run\/walk · stage \d+( \/ \d+)?$/.test(base)) {
    return 'NHS run/walk · Week ' + base.slice('Run/walk · stage '.length).replace(' / ', ' · Run ');
  }
  // Only recognize legacy titles when the owning app plan is known.
  if (plan && ['AT01', 'AT02', 'AT03', 'AT04', 'YOUTH-FOUNDATION'].includes(plan.template)) {
    const legacy: Record<string, string> = {
      'Full-body A': 'Full body · Workout 1', 'Full-body B': 'Full body · Workout 2',
      'Home foundation A': 'Bodyweight & bands · Workout 1', 'Home foundation B': 'Bodyweight & bands · Workout 2',
      'Strength A': 'Full body · Squat & bench', 'Strength B': 'Full body · Deadlift & press', 'Strength C': 'Full body · Squat, bench & back',
      'Upper A': 'Upper body · Workout 1', 'Upper B': 'Upper body · Workout 2', 'Lower A': 'Lower body · Workout 1', 'Lower B': 'Lower body · Workout 2',
      'Youth foundation A': 'Supervised full body · Workout 1', 'Youth foundation B': 'Supervised full body · Workout 2',
    };
    return (legacy[base] ?? session.title) + (legacy[base] && session.title.endsWith(' · review week') ? ' · lighter week' : '');
  }
  return session.title;
}

export function workoutName(workout: Workout, state: State): string {
  const owner = [state.plan, ...state.saved].find(p => p?.sessions.some(s => s.id === workout.sessionId));
  const session = owner?.sessions.find(s => s.id === workout.sessionId);
  return session && session.title === workout.title ? sessionName(session, owner) : workout.title;
}

// Render earlier saved plans with the current wording without rewriting their records.
const previousCopy: Record<string, string> = {
  "Whole-session minutes including walks. Follow the sequence; no speed target.": "Log the total time, including the walking intervals. Follow the steps at an easy pace.",
  "Supervisor chooses the controllable version and light starting load. Extend rest if needed.": "Your supervisor chooses the exercise variation and a light starting weight. Take more rest when needed.",
  "Starting loads stay unknown until you enter your own comparable results or complete appropriate familiarization.": "Choose a starting weight after practicing the exercise, or use your recent results from the same exercise and setup.",
  "These selected exercise combinations and progression prerequisites are transparent product defaults within the cited guidance.": "The exercise selection and progression rules are this app’s choices, informed by the sources listed below.",
  "No automated prescription progression.": "You or your coach decide when to change the targets.",
  "Establish a starting point, complete the accepted steps, then review.": "Find a comfortable starting point, follow the plan and review how it went.",
  "Enter your chosen sessions and establish a consistent log.": "Enter your workouts and build a regular logging habit.",
  "Establish comfortable run/walk pacing and repeatable sessions.": "Find an easy running pace and get used to the walk breaks.",
  "Establish manageable loads and repeatable movement variants.": "Practice each exercise and find a weight you can control.",
  "Follow accepted target steps only after their prerequisites.": "Complete the earlier workouts before moving to the next targets.",
  "Carry actual history into maintenance or another accepted block.": "Use your workout history to choose your next plan or maintain your current routine.",
  "A prerequisite was changed. Review this next target before advancing; its old progression is no longer assumed.": "An earlier workout changed. Review this workout’s targets before continuing.",
  "The prerequisite targets were not completed. Review a repeat or reduced target before advancing.": "The earlier workout’s targets are unfinished. Review a repeat or an easier target before moving on.",
  "You reported the work was easier. Verify recent actuals and control before choosing more work. This single-repetition step is a product default.": "You marked the workout easier than expected. Check your recent sets and technique before adding a rep. One extra rep is this app’s suggested step.",
  "This phase changes the rep range, not an automatic weight. Recalibrate the load and keep 2–3 RIR.": "The rep range changes this week. Choose a weight that leaves about 2–3 good reps left at the end of each set.",
  "Use a controlled lighter load for this practice exposure. Its load history is separate.": "Use a lighter weight for this practice set. We track these weights separately from your heavier bench work.",
  "Keep about 2–3 repetitions in reserve (RIR). Start lighter while learning; stop a set when control changes.": "Finish each set with about 2–3 good reps left (RIR). Start light while learning and stop if you lose control of the movement.",
  "Equipment-limited rep progression. Recalibrate within your available load and keep 2–3 RIR. No extra sets or shorter rest.": "Build reps with the equipment you have. Choose a weight that leaves 2–3 good reps left, and keep the same number of sets and the same rest.",
  "Starting loads require familiarization or comparable actual history. Technique practice can require a lower load than heavier work.": "Choose starting weights during practice or from recent results with the same exercise and setup. Use lighter weights for technique practice when needed.",
  "Every fourth week reduces work sets. The last week also reduces sets for blocks of six or more weeks. New rep ranges require load calibration.": "You’ll do fewer work sets every fourth week and in the final week of plans lasting six weeks or longer. Check your weight whenever the rep range changes.",
  "Last week of blocks lasting at least six weeks reduces strength-set volume where there is more than one set, for review. This is accepted in advance, not a fatigue diagnosis.": "Plans lasting six weeks or longer finish with fewer strength sets, keeping at least one per exercise. This lighter week is part of the schedule; it is not based on an assessment of your fatigue.",
  "First-time lifters use up to two work sets for the opening two weeks. Later sets wait for completed comparable sessions. Experience alone does not prove a heavier load is suitable.": "First-time lifters start with up to two work sets for the first two weeks. Finish the earlier workouts before adding the later sets. Choose weights from your recent performance, even if you have trained before.",
  "Brief plans have fewer work sets each week. The time window includes focused preparation and rest; more learning time may be needed. Do not shorten rest or add catch-up sets. Longer available time is a ceiling, not a requirement to fill it.": "Short plans include fewer work sets. The time estimate includes preparation and rest, but learning an exercise may take longer. Keep the listed rest and skip catch-up sets. You do not need to fill every available minute.",
  "Log actual total minutes. Repeat when effort or recovery does not support progression; no pace target.": "Log your total time. Repeat this workout if it still feels too hard or you have not recovered. Keep an easy pace.",
  "Keep one controlled work set per movement. Your supervisor guides familiarization and resistance; repeat when more practice is needed.": "Do one controlled work set per exercise. Your supervisor chooses the weight and helps you practice. Repeat the workout when you need more practice.",
  "The first lift changes rep ranges over three weeks. Every fourth week reduces sets. Each new range needs its own load calibration; missed prerequisites wait.": "The first lift uses a different rep range each week for three weeks, followed by a week with fewer sets. Choose a suitable weight for each range and finish the earlier workouts before advancing.",
  "Work within the displayed rep range, usually leaving about 2–3 repetitions in reserve. Keep a controllable load while building repetitions. After two comparable completed exposures at the upper end with at least 2 reps in reserve, review a small available load increase and restart near the lower end. Exact triggers are app defaults. Feedback-driven load changes and every date change need your approval.": "Stay within the listed rep range and finish most sets with about 2–3 good reps left. Keep the weight steady while you build reps. After two comparable workouts at the top of the range with at least 2 reps left, review a small weight increase and return to the lower end of the range. These thresholds are this app’s rules. Weight changes based on feedback, and all date changes, need your approval.",
  "Accepted baseline: 1×8 for the first three weeks. From week 4, a second set is added to at most one more exercise per repeated session, only after two comparable, comfortable, supervisor-confirmed exposures. Reps and load do not rise at the same time. Missing feedback or prerequisites waits; load and variation changes need separate review.": "Start with one set of 8 reps for the first three weeks. From week 4, a second set can be added to one more exercise each time the workout repeats. First, complete two comparable sessions that felt comfortable, with your supervisor’s confirmation. Reps and weight do not increase together. Missing workouts or feedback pause progression. Review weight or exercise changes separately.",
  "Equipment substitute. Use a manageable load for this exact exercise and the displayed rep range. Previous exercise weights do not transfer.": "Choose a starting weight for this exercise and rep range. Do not carry over the weight from the exercise it replaces.",
  "Dates and completed history stay the same. Calibrate the substitute; old weights are not converted.": "Your dates and completed workouts stay the same. Find a suitable starting weight for the replacement exercise; weights from the previous exercise are kept separate.",
  "User-added exercise. Its exact history and logging convention determine progression.": "You added this exercise. Weight suggestions use its own workout history and weight-entry rules.",
  "Keep or add a short trunk-control block on up to two days each week.": "Keep or add a short core block on up to two days each week.",
  "A small block of rested bodyweight jumps, once a week when recovery allows.": "Practice a few bodyweight jumps once a week, with time to rest between sets.",
  "Pair suitable assistance exercises. Main lifts stay separate and rest stays protected.": "Do two accessory exercises back to back, then rest. Main lifts keep their own sets and rest.",
  "both sides before Done": "finish both sides before logging the set",
  "Core focus: this existing trunk work supplies the add-on; no duplicate sets. Keep slow control and normal breathing.": "Core focus: this exercise already covers your core add-on. Move slowly, keep control and breathe normally.",
  "This small module is not a complete activity or weight-loss prescription.": "These walks are a small addition, not a complete activity or weight-management plan.",
  "Original Training Studio template informed by the listed sources. It is not a copy of, or endorsed by, a commercial program. Exact sets, split, progression and time estimates are product choices.": "An original app plan informed by the sources below. It is not a copy of a creator’s program or endorsed by them. The app chooses the exercises, sets and progression rules; workout times are estimates."
};
export function trainingCopy(text: string): string {
  for (const [before, after] of Object.entries(previousCopy)) text = text.replaceAll(before, after);
  return text.replaceAll("[Focus] ", "");
}
