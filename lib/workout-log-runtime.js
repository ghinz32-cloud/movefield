// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _training from "./training";
import * as _restTimer from "./rest-timer";
import * as _pairedSets from "./paired-sets";
function normalizeWorkoutRest(s) {
    var timer = (0, _restTimer.validRest)(s.restTimer, s.active?.id);
    return {
        ...s,
        restTimer: timer && s.active?.sets.some(x => x.done && x.exerciseId + ':' + x.set === timer.setKey) ? timer : null
    };
}
function changeWorkoutSet(s, index, patch) {
    if (!s.active || !s.active.sets[index])
        throw Error('That set is no longer open.');
    var old = s.active.sets[index], valueChanged = 'reps' in patch || 'kg' in patch;
    var updated = {
        ...old,
        ...patch,
        ...(valueChanged ? {
            done: false,
            rir: 'rir' in patch ? patch.rir : null
        } : {})
    };
    if (updated.rir != null && (!(0, _training.validSetRir)(updated.rir) || (0, _training.exFor)(updated.exerciseId, s.custom).metric !== 'reps'))
        throw Error('Enter reps in reserve from 0 to 10 for a repetition set, or leave it unrecorded.');
    if (!Number.isFinite(updated.reps) || updated.reps < 0 || updated.reps > 9999 || updated.kg !== null && (!Number.isFinite(updated.kg) || updated.kg < 0 || updated.kg > 1500))
        throw Error('Enter a valid amount.');
    if (updated.done) {
        var e = (0, _restTimer.completedSetError)(updated.reps, updated.kg, (0, _training.exFor)(updated.exerciseId, s.custom).metric);
        if (e)
            throw Error(e);
    }
    return normalizeWorkoutRest({
        ...s,
        active: {
            ...s.active,
            sets: s.active.sets.map((x, j) => index === j ? updated : x)
        }
    });
}
function logWorkoutSet(s, index, seconds, now = Date.now()) {
    if (!s.active || !s.active.sets[index])
        throw Error('That set is no longer open.');
    var old = s.active.sets[index];
    if (old.done)
        return s;
    var error = (0, _restTimer.completedSetError)(old.reps, old.kg, (0, _training.exFor)(old.exerciseId, s.custom).metric);
    if (error)
        throw Error(error);
    var next = changeWorkoutSet(s, index, {
        done: true
    });
    var rest = (0, _pairedSets.restAfterSet)(next, index, seconds);
    return {
        ...next,
        restTimer: next.active.sets.every(x => x.done) || rest === 0 ? null : (0, _restTimer.startRest)(s.active.id, old.exerciseId + ':' + old.set, rest, now)
    };
}
export { normalizeWorkoutRest };
export { changeWorkoutSet };
export { logWorkoutSet };
