// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Function bodies/data recovered from the successful 12 October export after scratch cleanup.
import * as _workoutFlow from "./workout-flow";
function specification(i, set) {
    if (i.setPlan)
        return i.setPlan[set - 1];
    var position = i.note?.startsWith('A1. [Focus] Assistance superset A:') ? 1 : i.note?.startsWith('A2. [Focus] Assistance superset A:') ? 2 : undefined;
    return position ? {
        pair: 'focus-A',
        position,
        rest: i.rest
    } : undefined;
}
function round(s, log) {
    var rows = (0, _workoutFlow.workoutExercises)(s), target = rows.find(x => x.target.exerciseId === log.exerciseId)?.target, spec = target && specification(target, log.set);
    if (!target || !spec)
        return null;
    var ordinal = Array.from({
        length: log.set
    }, (_, n) => specification(target, n + 1)).filter(x => x?.pair === spec.pair && x.position === spec.position).length - 1;
    var members = [];
    var _loop = function () {
        var i = rows[row].target, matches = Array.from({
            length: i.sets
        }, (_, n) => ({
            set: n + 1,
            spec: specification(i, n + 1)
        })).filter(x => x.spec?.pair === spec.pair);
        var _loop2 = function (position) {
            var m = matches.filter(x => x.spec?.position === position)[ordinal];
            var actual = m && s.active?.sets.find(x => x.exerciseId === i.exerciseId && x.set === m.set);
            if (actual && m.spec)
                members.push({
                    log: actual,
                    position,
                    rest: m.spec.rest,
                    row
                });
        };
        for (var position of [1, 2]) {
            _loop2(position);
        }
    };
    for (var row = 0; row < rows.length; row++) {
        _loop();
    }
    return members.length === 2 && members.some(x => x.position === 1) && members.some(x => x.position === 2) ? members.sort((a, b) => a.position - b.position) : null;
}
function restAfterSet(s, index, fallback) {
    var log = s.active?.sets[index];
    if (!log)
        return fallback;
    var members = round(s, log);
    return members ? members.every(x => x.log.done) ? members.find(x => x.position === 2).rest : 0 : fallback;
}
function focusAfterSet(s, index) {
    var log = s.active?.sets[index];
    if (!log)
        return null;
    var rows = (0, _workoutFlow.workoutExercises)(s), members = round(s, log);
    if (members) {
        var next = members.find(x => !x.log.done);
        if (next)
            return next.log.exerciseId;
        var first = members.find(x => x.position === 1), target = rows[first.row].target, used = first.log.set, spec = specification(target, used);
        var nextRound = Array.from({
            length: target.sets - used
        }, (_, n) => used + n + 1).find(set => specification(target, set)?.pair === spec.pair && !s.active.sets.find(x => x.exerciseId === target.exerciseId && x.set === set)?.done);
        if (nextRound)
            return target.exerciseId;
        return rows.slice(first.row + 1).find(x => !x.complete && x.target.exerciseId !== members.find(m => m.position === 2).log.exerciseId)?.target.exerciseId ?? null;
    }
    return rows.find(x => x.target.exerciseId === log.exerciseId)?.complete ? (0, _workoutFlow.nextUnfinishedExercise)(s, log.exerciseId) : log.exerciseId;
}
export { restAfterSet };
export { focusAfterSet };
