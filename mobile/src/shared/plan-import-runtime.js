// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "./training";
import * as __dependency1 from "./saved-data";
var _training = __dependency0;
var _savedData = __dependency1;
var signature = s => JSON.stringify([s.plan?.id, s.plan?.version, s.active?.id, s.events, s.profile, s.custom]);
function previewPlanImport(state, raw, options) {
    var credit = options.credit.trim();
    if (!credit || credit.length > 200)
        throw Error('Enter the creator or source credit, up to 200 characters.');
    if (!(0, _training.validDay)(options.start) || options.start < (0, _training.day)())
        throw Error('Choose today or a future starting date.');
    if (!['manual', 'coach'].includes(options.mode))
        throw Error('Imported prescriptions use your own or coach-directed tracking.');
    if (state.active)
        throw Error('Finish or discard the active workout before replacing the plan.');
    var source = (0, _savedData.readPlanFile)(raw);
    if (!source.sessions.length)
        throw Error('A plan needs a complete schedule.');
    if (!_training.goals.some(([id]) => id === source.profile.goal))
        throw Error('This plan has an unsupported goal.');
    var first = source.sessions.map(s => s.date).sort()[0], ids = new Map(source.sessions.map(s => [s.id, (0, _training.uid)('import-session')]));
    if (ids.size !== source.sessions.length)
        throw Error('Imported sessions have duplicate identities.');
    var sessions = source.sessions.map(session => {
        if (!session.items.length || session.items.reduce((n, item) => n + item.sets, 0) > 1000)
            throw Error('Every imported workout needs 1–1,000 planned sets.');
        for (var item of session.items)
            if ((0, _training.exFor)(item.exerciseId, state.custom).name === 'Archived exercise')
                throw Error('An imported exercise is unavailable. Import its custom definition first.');
        if (session.items.some(i => i.reps <= 0 || (i.repMin ?? i.reps) <= 0 || (i.repMax ?? i.reps) <= 0))
            throw Error('Imported targets need a positive amount.');
        var minutes = Math.max(session.minutes, session.runSteps?.length ? Math.ceil(session.runSteps.reduce((n, r) => n + r.seconds, 0) / 60) + 5 : (0, _training.estimateSessionMinutes)(session.items, session.timeProfile === 'brief', state.custom));
        if (minutes > state.profile.minutes)
            throw Error('An imported workout exceeds your available session time. Review your availability or the source schedule first.');
        if (session.dependsOn?.some(id => !ids.has(id)))
            throw Error('The plan contains an unavailable prerequisite.');
        return {
            ...session,
            minutes,
            id: ids.get(session.id),
            date: (0, _training.addDays)(options.start, (0, _training.dayDistance)(first, session.date)),
            status: 'scheduled',
            dependsOn: session.dependsOn?.map(id => ids.get(id)),
            needsReview: false
        };
    });
    if (sessions.some(s => !state.profile.days.includes(new Date(s.date + 'T12:00:00').getDay())))
        throw Error('An imported workout falls outside your available weekdays. Review the starting date or availability first.');
    if (new Set(sessions.map(s => s.date)).size !== sessions.length)
        throw Error('This importer supports one workout per calendar date. Review overlapping sessions before importing.');
    if (sessions.some(s => state.events.some(e => e.date === s.date && (e.kind === 'Day off' || e.kind === 'Vacation'))))
        throw Error('This schedule conflicts with fixed time off. Choose another starting date or review your calendar first.');
    var profile = {
        ...state.profile,
        goal: source.profile.goal,
        mode: options.mode,
        start: options.start,
        weeks: source.profile.weeks,
        days: [...new Set(sessions.map(s => new Date(s.date + 'T12:00:00').getDay()))].sort(),
        programId: undefined
    };
    var plan = {
        ...source,
        id: (0, _training.uid)('import-plan'),
        name: source.name,
        template: 'user-imported-tracking',
        version: 1,
        acceptedAt: null,
        profile,
        sessions,
        scheduleEnd: sessions.map(s => s.date).sort().at(-1),
        paused: false,
        evidence: [],
        progression: 'Follow the progression instructions from the credited source or your coach. The app records actual work; it does not supply competing progression.',
        notes: [`Creator/source credit supplied by you: ${credit}`, 'Imported prescriptions are unperformed targets. Previous completion statuses, ratings and performance are not imported.', 'The app has not certified this imported program or its content rights. Review the complete schedule and source instructions before accepting.', ...source.notes].slice(0, 100)
    };
    var preview = {
        base: signature(state),
        plan,
        credit,
        sourcePlanId: source.id,
        prescription: JSON.stringify(plan)
    };
    (0, _savedData.readSavedState)(JSON.stringify({
        ...state,
        schema: source.progressionModel === 'source' ? 4 : state.schema,
        plan,
        profile
    }));
    return preview;
}
function acceptPlanImport(state, preview) {
    if (JSON.stringify(preview.plan) !== preview.prescription || !['manual', 'coach'].includes(preview.plan.profile.mode))
        throw Error('The imported prescription changed after preview. Review it again.');
    if (signature(state) !== preview.base || state.active)
        throw Error('Your calendar or current plan changed. Preview the import again.');
    if (state.plan && !state.saved.some(p => p.id === state.plan.id) && state.saved.length >= 100)
        throw Error('The plan archive is full. Export an old plan before accepting another.');
    var plan = {
        ...preview.plan,
        acceptedAt: new Date().toISOString()
    }, saved = state.plan && !state.saved.some(p => p.id === state.plan.id) ? [state.plan, ...state.saved] : state.saved;
    var next = (0, _training.changed)({
        ...state,
        schema: plan.progressionModel === 'source' ? 4 : state.schema,
        plan,
        profile: plan.profile,
        saved,
        proposals: state.proposals.map(p => ['pending', 'queued'].includes(p.status) ? {
            ...p,
            status: 'stale'
        } : p)
    }, 'Accepted a credited tracking-plan import. Existing history and original workout dates were kept.');
    (0, _savedData.readSavedState)(JSON.stringify(next));
    return next;
}
export { previewPlanImport };
export { acceptPlanImport };
