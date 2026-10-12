// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "./training";
var _training = __dependency0;
function volume(s, w) {
    var kg = 0, count = 0, excluded = 0;
    for (var x of w.sets.filter(x => x.done)) {
        var e = (0, _training.exFor)(x.exerciseId, s.custom);
        if (x.metrics?.side === 'Alternating' || (x.metrics?.assistanceKg || 0) > 0 || e.metric !== 'reps' || !(0, _training.isLoadTracked)(e) || !e.loadMultiplier || x.kg === null || !Number.isFinite(x.kg) || x.kg < 0 || !Number.isFinite(x.reps) || x.reps <= 0) {
            excluded++;
            continue;
        }
        kg += x.kg * x.reps * (['Left', 'Right'].includes(x.metrics?.side || '') && e.loadMultiplier > 1 ? e.loadMultiplier / 2 : e.loadMultiplier);
        count++;
    }
    return {
        kg,
        count,
        excluded
    };
}
function estimatedMax(w, id) {
    if (w.partial || w.symptom !== 'no')
        return null;
    var values = w.sets.filter(x => x.exerciseId === id && x.done && typeof x.rir === 'number' && Number.isFinite(x.rir) && x.rir >= 0 && x.rir <= 2 && (0, _training.comparableSet)(x) && x.kg !== null && Number.isFinite(x.kg) && x.kg > 0 && Number.isFinite(x.reps) && x.reps >= 1 && x.reps <= 10).map(x => x.reps === 1 ? x.kg : x.kg * (1 + x.reps / 30));
    return values.length ? Math.max(...values) : null;
}
function exerciseSeries(s, id, setup) {
    var ex = (0, _training.exFor)(id, s.custom);
    return s.history.filter(w => w.finishedAt && (!(0, _training.requiresSetup)(ex) || (w.loadContext?.[id] || '') === (setup || ''))).sort((a, b) => a.date.localeCompare(b.date) || (a.finishedAt || a.startedAt) - (b.finishedAt || b.startedAt)).flatMap(w => {
        var sets = w.sets.filter(x => x.exerciseId === id && x.done);
        if (!sets.length)
            return [];
        var loads = sets.filter(x => x.kg !== null && (0, _training.comparableSet)(x) && (!(0, _training.requiresSetup)(ex) || !!setup)).map(x => x.kg);
        return [{
                id: w.id,
                date: w.date,
                label: new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }),
                load: loads.length ? Math.max(...loads) : null,
                amount: Math.max(...sets.map(x => x.reps)),
                estimated: s.profile.age >= 18 && ex.metric === 'reps' && ex.progressionEnabled && (0, _training.isLoadTracked)(ex) && (!(0, _training.requiresSetup)(ex) || !!setup) ? estimatedMax(w, id) : null,
                partial: w.partial
            }];
    });
}
function strengthIndex(s) {
    var records = s.history.filter(w => w.finishedAt).sort((a, b) => a.date.localeCompare(b.date) || (a.finishedAt || a.startedAt) - (b.finishedAt || b.startedAt));
    if (s.profile.age < 18 || !records.length)
        return {
            basket: [],
            points: [],
            current: null
        };
    var eligibleRecords = records.filter(w => w.sets.some(x => {
        var e = (0, _training.exFor)(x.exerciseId, s.custom);
        return (0, _training.isLoadTracked)(e) && !(0, _training.requiresSetup)(e) && e.progressionEnabled && estimatedMax(w, x.exerciseId) !== null;
    }));
    if (!eligibleRecords.length)
        return {
            basket: [],
            points: [],
            current: null
        };
    var first = eligibleRecords[0].date;
    var eligible = id => {
        var e = (0, _training.exFor)(id, s.custom);
        return (0, _training.isLoadTracked)(e) && !(0, _training.requiresSetup)(e) && e.metric === 'reps' && e.progressionEnabled;
    };
    var ids = [...new Set(records.flatMap(w => w.sets.map(x => x.exerciseId)))].filter(eligible);
    var windowStart = eligibleRecords.find(candidate => ids.filter(id => records.filter(w => w.date >= candidate.date && (0, _training.dayDistance)(candidate.date, w.date) <= 14 && estimatedMax(w, id) !== null).length >= 2).length >= 3);
    if (windowStart)
        first = windowStart.date;
    var basket = ids.filter(id => records.filter(w => (0, _training.dayDistance)(first, w.date) >= 0 && (0, _training.dayDistance)(first, w.date) <= 14 && estimatedMax(w, id) !== null).length >= 2).slice(0, 3);
    if (basket.length < 3)
        return {
            basket,
            points: [],
            current: null
        };
    var baseline = Object.fromEntries(basket.map(id => {
        var values = records.filter(w => (0, _training.dayDistance)(first, w.date) >= 0 && (0, _training.dayDistance)(first, w.date) <= 14).map(w => estimatedMax(w, id)).filter(n => n !== null).slice(0, 2);
        return [id, (values[0] + values[1]) / 2];
    }));
    var points = [...new Set(records.filter(w => (0, _training.dayDistance)(first, w.date) >= 14).map(w => w.date))].map(date => {
        var ratios = basket.map(id => {
            var r = records.filter(w => w.date <= date && (0, _training.dayDistance)(w.date, date) <= 21 && estimatedMax(w, id) !== null).at(-1);
            return r ? estimatedMax(r, id) / baseline[id] : null;
        });
        return {
            date,
            label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            index: ratios.some(x => x === null) ? null : Math.round(ratios.reduce((a, b) => a + b, 0) / 3 * 100)
        };
    });
    var currentRatios = basket.map(id => {
        var r = records.filter(w => w.date <= (0, _training.day)() && (0, _training.dayDistance)(w.date, (0, _training.day)()) <= 21 && estimatedMax(w, id) !== null).at(-1);
        return r ? estimatedMax(r, id) / baseline[id] : null;
    });
    return {
        basket,
        points,
        current: currentRatios.some(x => x === null) ? null : Math.round(currentRatios.reduce((a, b) => a + b, 0) / 3 * 100)
    };
}
export { volume };
export { estimatedMax };
export { exerciseSeries };
export { strengthIndex };
