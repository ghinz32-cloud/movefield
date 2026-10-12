// Recovered executed implementation; typed public contract is in the adjacent declaration.
/** A transparent scheduling heuristic. These ranges are not measured sessions. */
import * as __dependency0 from "./training";
var _training = __dependency0;
/** A transparent scheduling heuristic. These ranges are not measured sessions. */
function estimateDuration(session, custom = []) {
    if (!session.items.length)
        return null;
    if (session.kind === 'Easy activity') {
        var work = session.items.reduce((n, i) => n + i.sets * i.reps, 0);
        return {
            low: Math.ceil(work),
            high: Math.ceil(work + 5),
            workMinutes: work,
            restMinutes: 0,
            version: 'duration-v1',
            assumptions: ['Comfortable walking minutes; allow up to five extra minutes for preparation and recording. No running or strength sets are inferred.']
        };
    }
    if (session.runSteps?.length) {
        var _work = session.runSteps.reduce((n, x) => n + x.seconds, 0) / 60;
        var other = session.items.filter(i => (0, _training.exFor)(i.exerciseId, custom).metric !== 'minutes');
        if (other.length) {
            var strength = estimateDuration({
                ...session,
                runSteps: undefined,
                items: other
            }, custom);
            return {
                ...strength,
                low: strength.low + Math.ceil(_work),
                high: strength.high + Math.ceil(_work) + 5,
                workMinutes: strength.workMinutes + _work,
                assumptions: [...strength.assumptions, 'This combined session also includes the full timed run/walk sequence and up to five minutes to change activities. Listed walking warm-up/cool-down is retained; it is not a strength warm-up.']
            };
        }
        return {
            low: Math.ceil(_work),
            high: Math.ceil(_work + 5),
            workMinutes: _work,
            restMinutes: 0,
            version: 'duration-v1',
            assumptions: ['The listed timed sequence includes its prescribed walking recoveries.', 'Allow 0–5 extra minutes for setup and recording. Route, pace and distance are not inferred.']
        };
    }
    var lowWork = 0, highWork = 0, rest = 0, transitions = 0, ramp = 0;
    for (var i of session.items) {
        if ([i.sets, i.reps, i.rest, i.repMin ?? i.reps, i.repMax ?? i.reps].some(n => !Number.isFinite(n) || n < 0))
            throw Error('The session has invalid duration inputs.');
        var e = (0, _training.exFor)(i.exerciseId, custom), sides = /per side|per leg|each side|both sides|both legs/i.test(e.loadConvention || '') ? 2 : 1;
        lowWork += i.sets * workSeconds(i, e, sides, 3, i.repMin ?? i.reps);
        highWork += i.sets * workSeconds(i, e, sides, 5, i.repMax ?? i.reps);
        rest += i.setPlan ? i.setPlan.slice(0, -1).reduce((n, x) => n + x.rest, 0) : Math.max(0, i.sets - 1) * i.rest;
        transitions += session.timeProfile === 'brief' ? Math.max(60, i.rest) : 120;
        if (e.equipment === 'Barbell')
            ramp += 120;
    }
    var preparation = session.timeProfile === 'brief' ? 360 : 780;
    var low = Math.ceil((preparation + lowWork + rest + transitions + ramp) / 60), high = Math.ceil((preparation * 1.25 + highWork + rest + transitions * 1.25 + ramp * 1.5) / 60);
    return {
        low,
        high: Math.max(low, high),
        workMinutes: highWork / 60,
        restMinutes: rest / 60,
        version: 'duration-v1',
        assumptions: ['Repetition work assumes 3–5 seconds per repetition; per-side and per-leg work includes both sides.', 'Listed between-set rest is retained; paired sets rest after the pair. Preparation, transitions and barbell ramp-up time are scheduling assumptions.', 'Unfamiliar setups, extra warm-up sets, task-specific sprint/jump recovery or longer rests can exceed this range. It is not an observed timing measurement.']
    };
}
function workSeconds(i, e, sides, secondsPerRep, reps) {
    return e.metric === 'minutes' ? i.reps * 60 : e.metric === 'seconds' ? i.reps : reps * secondsPerRep * sides;
}
function durationText(session, custom = []) {
    var estimate = estimateDuration(session, custom);
    return estimate ? `${estimate.low}–${estimate.high} min estimated` : 'Add targets for a time estimate';
}
function observedDuration(s, sessionId) {
    return s.history.filter(w => w.sessionId === sessionId && w.finishedAt && w.finishedAt >= w.startedAt).map(w => ({
        workoutId: w.id,
        minutes: (w.finishedAt - w.startedAt) / 60000,
        partial: !!w.partial,
        label: 'App elapsed time; pauses, background time and clock changes may be included.'
    }));
}
export { estimateDuration };
export { durationText };
export { observedDuration };
