// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _training from "./training";
function sessionGuide(plan, session) {
    var guide = baseGuide(plan, session), manual = plan.profile.mode !== 'app', strength = session.items.filter(i => !['walk', 'run', 'lib-small-jump-reset'].includes(i.exerciseId));
    var order = manual ? [] : strength.map((i, n) => `${n + 1}. ${(0, _training.exFor)(i.exerciseId).name}: ${i.sets} work ${i.sets === 1 ? 'set' : 'sets'} of ${(0, _training.targetText)(i)} ${(0, _training.exFor)(i.exerciseId).metric}. ${i.setPlan ? 'Follow the listed triceps/lateral-raise rounds: move directly from each triceps set to its lateral raise, then rest 90 seconds.' : `Rest ${i.rest} seconds between sets${/per side|per leg|both sides/i.test((0, _training.exFor)(i.exerciseId).loadConvention || '') ? ' after completing both sides' : ''}.`}`);
    var progression = manual ? [] : plan.progressionModel === 'source' ? [plan.progression, 'Record RIR within each repetition set. A final quality AMRAP allows extra controlled reps only on the listed final set. Follow the source effort instructions; do not chase uncontrolled failure.', 'Review source load or set/rep changes before accepting. Partial or missing work does not become a successful or failed attempt. Starting weights remain individually selected.'] : plan.profile.age < 18 ? ['Repeat the displayed supervised work. Your supervisor chooses any changes in reps or resistance.'] : strength.length ? ['Choose a weight that lets you reach the bottom of the range with controlled technique. Keep that weight while you add reps within the range; sets do not all need identical reps.', 'Log the good reps left (RIR) for each individual work set. After two comparable complete workouts reach the top of the range with at least 2 RIR on every relevant set, review the next available weight increase.', 'If you miss the range or lose control, keep the load or review a reduction. An unknown RIR, partial workout or missed session does not qualify for an increase. Fixed weights need a reviewed rep-range or exercise change.', 'Keep the planned rest. Take longer when needed, and record a partial session if time runs out. Finish earlier sessions before adding the planned later sets; the lighter review week remains part of your block.'] : [];
    return {
        ...guide,
        effort: !manual && plan.progressionModel === 'source' ? `Use this routine’s published effort and rest instructions. ${strength.some(i => i.sourceRule?.minRir === 1) ? 'Keep at least one good rep left. ' : ''}${strength.some(i => i.sourceRule?.amrapLast) ? 'Quality AMRAPs stop when control changes. ' : ''}RIR stays specific to each repetition set.` : guide.effort,
        order,
        progression: [...progression, ...(!manual && session.items.some(i=>i.exerciseId==='lib-small-jump-reset') ? ['Landing practice stays at the listed small jumps, with a full reset and no RIR, extra height, load or automatic rep progression.'] : []), ...(!manual && !strength.length && session.runSteps ? [plan.progression] : [])]
    };
}
function baseGuide(plan, session) {
    var youth = plan.profile.age < 18, run = !!session.runSteps, manual = plan.profile.mode !== 'app';
    if (manual)
        return {
            warmup: ['Use the warm-up and targets from your coach or your own plan.'],
            effort: 'Your coach or plan sets the effort.',
            finish: 'Save only the work you did. Keep any coach instructions with this session.'
        };
    if (session.kind === 'Easy activity')
        return {
            warmup: ['Choose a suitable walking route and a pace that lets you talk comfortably.', ...session.items.map(i => `Comfortable walk: ${i.reps} minutes`)],
            effort: 'Easy activity for your daily habit. No fast pace, hard intervals or extra lifting are added.',
            finish: 'Record the actual minutes. A missed walk does not require catch-up training.'
        };
    if (run)
        return {
            warmup: session.runSteps.map(s => `${s.label}: ${s.seconds >= 60 ? Math.round(s.seconds / 6) / 10 + ' min' : s.seconds + ' sec'}`),
            effort: session.runSteps.some(s=>s.label.startsWith('Controlled moderate')) ? 'Keep warm-up, recovery and closing steps easy. Only the listed moderate bouts use a controlled effort where short phrases remain possible; never all-out. Walk or keep the whole session easy if needed. No automatic pace increase.' : 'Keep an easy pace that lets you talk in full sentences. Walk when needed. Do not add speed to make up a missed run.',
            finish: 'Include the closing walk when you log your time. Finish this workout before moving to the next stage.'
        };
    if (session.timeProfile === 'brief')
        return {
            warmup: ['Spend about 5 minutes preparing: easy movement, then a few light practice reps of each strength exercise today. This focused warm-up is included in the estimate.', 'Read the setup before starting. If an exercise is unfamiliar or needs more practice, allow more time or finish fewer work sets; do not rush the listed rest.', ...(session.items.some(i => i.exerciseId === 'lib-small-jump-reset') ? ['Do only the listed jumps and reset fully between reps. Do not add extra practice jumps.'] : []), ...(session.items.some(i => (0, _training.exFor)(i.exerciseId).equipment === 'Barbell') ? ['For a familiar barbell lift, allow the extra ramp-up time in the estimate for light practice sets. Heavy or unfamiliar work may need longer; do not rush to fit the clock.'] : []), ...(youth ? ['Your qualified supervisor chooses the variation, starting load and any extra practice.'] : [])],
            effort: youth ? 'Use controlled reps with your qualified supervisor. No sets to failure or maximum tests.' : 'Keep 2–3 controlled reps left (RIR). These brief sessions provide less work; longer available time does not require extra sets.',
            finish: 'Use the final minute to settle and record actual work. Practice sets are not work sets. No catch-up work after a missed or partial session.'
        };
    var firstItem = session.items.find(i => i.exerciseId !== 'lib-small-jump-reset' && (0, _training.exFor)(i.exerciseId).metric === 'reps');
    var first = firstItem && (0, _training.exFor)(firstItem.exerciseId).name;
    return {
        warmup: ['Start with 5 minutes of easy walking, cycling or similar movement.', 'Move the joints used today through a comfortable range for 2–3 minutes. Read the setup for each unfamiliar exercise.', `${first ? 'Before ' + first.toLowerCase() + ' and each new strength movement' : 'Before each new strength movement'}, try 5–8 controlled reps with little or no load. These are practice reps, not work sets.`, ...(session.items.some(i => i.exerciseId === 'lib-small-jump-reset') ? ['For jump practice, do only the listed jumps and reset fully between reps. Do not add extra practice jumps.'] : []), youth ? 'Have your qualified supervisor choose the version and starting load. Ask for more practice or rest when needed.' : 'For a heavier barbell lift, add 1–3 short warm-up sets with small load steps. Keep them easy; use a lighter training bar if the standard bar is too heavy.'],
        effort: youth ? 'Keep every rep controlled. Your supervisor chooses the effort; no max tests or sets to failure.' : 'Aim to finish work sets with about 2–3 good reps left (RIR). While learning, use less weight. The listed rest starts after both sides of a per-side exercise.',
        finish: 'Take 2–3 easy minutes to finish. Save actual work sets, RIR and feedback. Warm-up work is not a strength record. More practice or rest may make the session longer.'
    };
}
export { sessionGuide };
