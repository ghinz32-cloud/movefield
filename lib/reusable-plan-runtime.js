// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _training from "./training";
import * as _savedData from "./saved-data";
import * as _trainingFocus from "./training-focus";
import { equipmentFit } from "./equipment";
import { reviewBlockStartingLoads } from "./block-starting-loads";
var signature = s => JSON.stringify([s.plan?.id, s.plan?.version, s.active?.id, s.events, s.profile, s.history, s.custom, s.loadContext, s.equipmentCaps, s.incrementKg, s.hold, (0, _training.day)()]);
function savePlanCopy(s, planId, version) {
    if (!s.plan || s.plan.id !== planId || s.plan.version !== version)
        throw Error('Your plan changed. Review its current version before saving a copy.');
    if (s.saved.length >= 100)
        throw Error('The plan archive is full. Export an old plan before saving another.');
    var copy = {
        ...s.plan,
        id: (0, _training.uid)('saved-block'),
        sessions: s.plan.sessions.map(x => ({
            ...x,
            items: x.items.map(i => ({
                ...i
            }))
        }))
    };
    return (0, _training.changed)({
        ...s,
        saved: [copy, ...s.saved]
    }, 'Saved a reusable copy of the current block. History and the active workout were kept.');
}
function previewReusablePlan(s, sourceId, start) {
    if (s.active)
        throw Error('Finish or discard the active workout before starting another block.');
    if (!(0, _training.validDay)(start) || start < (0, _training.day)())
        throw Error('Choose today or a future starting date.');
    var source = s.saved.find(p => p.id === sourceId);
    if (!source)
        throw Error('This saved block is unavailable. Reopen your saved plans.');
    if (source.profile.equipment !== s.profile.equipment)
        throw Error('Your equipment differs from this block. Build a new plan with your current equipment instead.');
    if (source.profile.mode === 'app' && source.profile.experience !== s.profile.experience)
        throw Error('Your experience setup differs. Review a new plan for your current setup.');
    var first = source.sessions.map(x => x.date).sort()[0];
    var ids = new Map(source.sessions.map(x => [x.id, (0, _training.uid)('session')]));
    var sessions = source.sessions.map(x => ({
        ...x,
        id: ids.get(x.id),
        date: (0, _training.addDays)(start, (0, _training.dayDistance)(first, x.date)),
        status: 'scheduled',
        needsReview: false,
        dependsOn: x.dependsOn?.map(id => {
            var next = ids.get(id);
            if (!next)
                throw Error('This block has an unavailable prerequisite.');
            return next;
        }),
        items: x.items.map(i => ({
            ...i,
            kg: null
        }))
    }));
    if (sessions.some(x => !s.profile.days.includes(new Date(x.date + 'T12:00:00').getDay())))
        throw Error('A workout falls outside your available weekdays. Choose another start date or build a new plan.');
    if (sessions.some(x => Math.max(x.minutes, x.runSteps?.length ? Math.ceil(x.runSteps.reduce((n, r) => n + r.seconds, 0) / 60) + 5 : (0, _training.estimateSessionMinutes)(x.items, x.timeProfile === 'brief', s.custom)) > s.profile.minutes))
        throw Error('This block exceeds your available session time. Review your availability or choose a shorter block.');
    var profile = {
        ...s.profile,
        goal: source.profile.goal,
        mode: source.profile.mode,
        programId: source.profile.programId,
        weeks: source.profile.weeks,
        start,
        days: [...new Set(sessions.map(x => new Date(x.date + 'T12:00:00').getDay()))].sort()
    };
    var errors = (0, _training.validateProfile)(profile);
    if (errors.length)
        throw Error(errors.join(' '));
    if (profile.mode === 'app' && profile.age < 18 !== source.profile.age < 18)
        throw Error('This block belongs to a different age pathway. Build a plan for the current profile.');
    if (profile.mode === 'app' && profile.inventory?.confirmed) {
        var exerciseIds = new Set(sessions.flatMap(x => x.items.map(i => i.exerciseId)));
        if (sessions.some(x => x.runSteps?.length))
            exerciseIds.add('run');
        for (var exerciseId of exerciseIds) {
            var exercise = (0, _training.exFor)(exerciseId, s.custom), fit = equipmentFit(exercise, profile);
            if (!fit.available)
                throw Error(`${exercise.name}: ${fit.reason} Review equipment or choose an available block before starting. The saved exercises and history are kept.`);
        }
    }
    var plan = {
        ...source,
        id: (0, _training.uid)('plan'),
        version: 1,
        profile,
        acceptedAt: null,
        paused: false,
        sessions,
        scheduleEnd: sessions.map(x => x.date).sort().at(-1),
        notes: [...source.notes.slice(0, 98), 'Reused as a new block after full schedule review. Original recorded workouts stay in history.', 'Review starting loads for the first exposure to each exercise and role. Later loads follow the existing plan rules; previous completion is not copied.']
    };
    if (sessions.some(x => s.events.some(e => e.date === x.date) || (0, _trainingFocus.focusScheduleConflict)(plan, s.events, x)))
        throw Error('This block conflicts with fixed commitments. Review its start date and calendar.');
    (0, _savedData.readSavedState)(JSON.stringify({
        ...s,
        schema: plan.progressionModel === 'source' ? 4 : s.schema,
        plan,
        profile
    }));
    return {
        base: signature(s),
        sourceId,
        source: JSON.stringify(source),
        plan,
        prescription: JSON.stringify(plan),
        startingLoads: []
    };
}
function reviewReusableLoads(s, preview, choices) {
    if (signature(s) !== preview.base || s.active || JSON.stringify(preview.plan) !== preview.prescription || JSON.stringify(s.saved.find(p => p.id === preview.sourceId)) !== preview.source)
        throw Error('Your profile, calendar, history, equipment or saved block changed. Review the block again.');
    var reviewed = reviewBlockStartingLoads(s, preview.plan, choices);
    (0, _savedData.readSavedState)(JSON.stringify({...s, schema: reviewed.plan.progressionModel === 'source' ? 4 : s.schema, plan: reviewed.plan, profile: reviewed.plan.profile, loadContext: reviewed.loadContext}));
    return {...preview, plan: reviewed.plan, startingLoads: reviewed.choices, prescription: JSON.stringify(reviewed.plan)};
}
function acceptReusablePlan(s, preview) {
    if (signature(s) !== preview.base || s.active || JSON.stringify(preview.plan) !== preview.prescription || JSON.stringify(s.saved.find(p => p.id === preview.sourceId)) !== preview.source)
        throw Error('Your profile, calendar, history, equipment or saved block changed. Review the block again.');
    var reviewed = reviewBlockStartingLoads(s, preview.plan, preview.startingLoads || []);
    if (JSON.stringify(reviewed.plan) !== preview.prescription)
        throw Error('The starting-weight preview changed. Review it again.');
    if (s.plan && !s.saved.some(p => p.id === s.plan.id) && s.saved.length >= 100)
        throw Error('The plan archive is full. Export an old plan before starting another block.');
    var plan = {
        ...preview.plan,
        acceptedAt: new Date().toISOString()
    };
    var next = (0, _training.changed)({
        ...s,
        schema: plan.progressionModel === 'source' ? 4 : s.schema,
        plan,
        loadContext: reviewed.loadContext,
        profile: plan.profile,
        saved: s.plan && !s.saved.some(p => p.id === s.plan.id) ? [s.plan, ...s.saved] : s.saved,
        proposals: s.proposals.map(p => ['pending', 'queued'].includes(p.status) ? {
            ...p,
            status: 'stale'
        } : p)
    }, 'Started a reviewed reusable block. Previous history and original training dates were kept.');
    (0, _savedData.readSavedState)(JSON.stringify(next));
    return next;
}
function setPlanPaused(s, id, version, paused) {
    if (!s.plan || s.plan.id !== id || s.plan.version !== version)
        throw Error('The plan changed. Review it again.');
    if (s.active)
        throw Error('Finish or discard the active workout before changing plan status.');
    return (0, _training.changed)({
        ...s,
        plan: {
            ...s.plan,
            paused,
            version: s.plan.version + 1
        },
        proposals: s.proposals.map(p => ['pending', 'queued'].includes(p.status) ? {
            ...p,
            status: 'stale'
        } : p)
    }, paused ? 'Paused future training. Your history was kept.' : 'Resumed the accepted plan. Your history was kept.');
}
export { savePlanCopy };
export { previewReusablePlan };
export { reviewReusableLoads };
export { acceptReusablePlan };
export { setPlanPaused };
