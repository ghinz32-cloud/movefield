// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _training from "./training";
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
    const records = s.history.filter(w => w.finishedAt).sort((a, b) => a.date.localeCompare(b.date) || (a.finishedAt || a.startedAt) - (b.finishedAt || b.startedAt));
    const empty = { basket: [], points: [], current: null };
    if (s.profile.age < 18 || !records.length)
        return empty;
    // Compute each recorded estimate once. Preserve first-seen exercise order,
    // even when that first set itself cannot contribute an estimate.
    const definitions = new Map(), serials = new Map(), byLift = new Map(), candidates = [], events = [];
    const serial = date => {
        if (!serials.has(date)) serials.set(date, (0, _training.dayDistance)('2000-01-01', date));
        return serials.get(date);
    };
    for (const w of records) {
        let candidate = false;
        const date = serial(w.date);
        for (const id of new Set(w.sets.map(x => x.exerciseId))) {
            if (!definitions.has(id)) {
                const e = (0, _training.exFor)(id, s.custom);
                definitions.set(id, { comparable: (0, _training.isLoadTracked)(e) && !(0, _training.requiresSetup)(e) && e.progressionEnabled, reps: e.metric === 'reps' });
            }
            const e = definitions.get(id);
            if (!e.comparable) continue;
            const value = estimatedMax(w, id);
            if (value === null) continue;
            candidate = true;
            if (e.reps && Number.isFinite(date)) {
                const point = { date, value };
                if (!byLift.has(id)) byLift.set(id, []);
                byLift.get(id).push(point);
                events.push({ id, date });
            }
        }
        if (candidate) candidates.push({ date: w.date, serial: date });
    }
    if (!candidates.length) return empty;
    const ids = [...definitions].filter(([, e]) => e.comparable && e.reps).map(([id]) => id);
    // Sweep the inclusive 14-day candidate windows instead of rescanning the
    // complete history for every candidate and lift.
    let first = candidates[0].serial, left = 0, right = 0, ready = 0;
    const counts = new Map();
    const count = (id, delta) => {
        const before = counts.get(id) || 0, after = before + delta;
        if (before < 2 && after >= 2) ready++;
        if (before >= 2 && after < 2) ready--;
        counts.set(id, after);
    };
    for (const candidate of candidates) {
        if (!Number.isFinite(candidate.serial)) continue;
        while (right < events.length && events[right].date <= candidate.serial + 14) count(events[right++].id, 1);
        while (left < right && events[left].date < candidate.serial) count(events[left++].id, -1);
        if (ready >= 3) { first = candidate.serial; break; }
    }
    const baseline = new Map();
    for (const id of ids) {
        const values = (byLift.get(id) || []).filter(p => p.date >= first && p.date <= first + 14);
        if (values.length >= 2) baseline.set(id, (values[0].value + values[1].value) / 2);
        if (baseline.size === 3) break;
    }
    const basket = [...baseline.keys()];
    if (basket.length < 3) return { basket, points: [], current: null };
    const cursors = basket.map(() => -1), format = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const score = (date, positions) => {
        const ratios = basket.map((id, i) => {
            const series = byLift.get(id);
            while (positions[i] + 1 < series.length && series[positions[i] + 1].date <= date) positions[i]++;
            const last = series[positions[i]];
            return last && date - last.date <= 21 ? last.value / baseline.get(id) : null;
        });
        return ratios.some(x => x === null) ? null : Math.round(ratios.reduce((a, b) => a + b, 0) / 3 * 100);
    };
    const points = [...new Set(records.filter(w => serial(w.date) >= first + 14).map(w => w.date))].map(date => ({
        date,
        label: format.format(new Date(date + 'T12:00:00')),
        index: score(serial(date), cursors)
    }));
    // Current remains anchored to today; future recorded points never supply it.
    return { basket, points, current: score(serial((0, _training.day)()), basket.map(() => -1)) };
}
export { volume };
export { estimatedMax };
export { exerciseSeries };
export { strengthIndex };
