// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _equipment from "./equipment";
import * as _zodV from "zod/v3";
import * as _training from "./training";
var text = _zodV.z.string().max(6000), short = _zodV.z.string().max(200), id = _zodV.z.string().min(1).max(150), number = _zodV.z.number().finite(), date = _zodV.z.string().refine(_training.validDay), bool = _zodV.z.boolean();
var strings = _zodV.z.array(short).max(500), map = v => _zodV.z.record(v).refine(v => Object.keys(v).length <= 1500);
var profile = _zodV.z.object({
    noFloor: bool.optional(),
    trainingDays: number.int().min(2).max(7).optional(),
    inventory: _zodV.z.object({
        confirmed: bool,
        items: _zodV.z.array(_zodV.z.enum(_equipment.equipmentChoices.map(x => x[0]))).max(_equipment.equipmentChoices.length),
        dumbbells: _zodV.z.enum(['none', 'single', 'pair']),
        dumbbellLoading: _zodV.z.enum(['fixed', 'adjustable'])
    }).optional(),
    age: number.min(14).max(100),
    goal: short,
    experience: short,
    mode: _zodV.z.enum(['app', 'coach', 'manual']),
    minutes: number.min(5).max(1440),
    days: _zodV.z.array(number.int().min(0).max(6)).max(7),
    weeks: number.int().min(1).max(52),
    start: date,
    equipment: short,
    sport: short,
    position: short,
    season: short,
    supervision: bool,
    units: _zodV.z.enum(['kg', 'lb']),
    name: short,
    sex: _zodV.z.enum(['female', 'male', 'intersex', 'unspecified']).optional(),
    dumbbellMaxKg: number.min(0).max(500).optional(),
    programId: short.optional(),
    runBase: bool.optional(),
    runDays: number.int().min(0).max(7).optional(),
    runMinutes: number.min(0).max(1500).optional(),
    establishedTraining: bool.optional(),
    focuses: _zodV.z.array(_zodV.z.enum(['core', 'jumping', 'supersets', 'activity'])).max(4).optional(),
    jumpReady: bool.optional()
});
var item = _zodV.z.object({
    exerciseId: id,
    sets: number.int().min(1).max(100),
    reps: number.min(0).max(9999),
    repMin: number.min(0).max(9999).optional(),
    repMax: number.min(0).max(9999).optional(),
    rest: number.min(0).max(3600),
    kg: number.min(0).max(1500).nullable(),
    loadContext: short.optional(),
    loadRole: short.optional(),
    supersetGroup: id.optional(),
    supersetPosition: _zodV.z.union([_zodV.z.literal(1), _zodV.z.literal(2)]).optional(),
    note: text.optional(),
    sourceRule: _zodV.z.object({
        kind: _zodV.z.enum(['sl5x5', 'fitness-basic', 'gzcl-t1', 'gzcl-t2', 'gzcl-t3', 'ppl-main', 'double', 'phul', 'db-stopgap', 'hold']),
        amrapLast: bool.optional(),
        stage: _zodV.z.union([_zodV.z.literal(0), _zodV.z.literal(1), _zodV.z.literal(2)]).optional(),
        minRir: number.min(0).max(10).optional(),
        publishedSetsMax: number.int().min(1).max(100).optional()
    }).optional(),
    setPlan: _zodV.z.array(_zodV.z.object({
        pair: short,
        position: _zodV.z.union([_zodV.z.literal(1), _zodV.z.literal(2)]),
        rest: number.min(0).max(3600)
    })).max(100).optional()
});
var session = _zodV.z.object({
    id,
    date,
    week: number.int().min(1).max(1000),
    title: short,
    kind: short,
    minutes: number.min(0).max(1440),
    items: _zodV.z.array(item).max(100),
    dependsOn: strings.optional(),
    progressionStep: text.optional(),
    needsReview: bool.optional(),
    status: _zodV.z.enum(['scheduled', 'completed', 'partial', 'missed']),
    recoveryGroup: short.optional(),
    roleId: short.optional(),
    timeProfile: _zodV.z.literal('brief').optional(),
    runSteps: _zodV.z.array(_zodV.z.object({
        label: short,
        seconds: number.min(0).max(86400)
    })).max(500).optional()
});
var plan = _zodV.z.object({
    id,
    name: short,
    version: number.int().min(1),
    progressionModel: _zodV.z.enum(['ranges', 'source']).optional(),
    scheduleEnd: date.optional(),
    profile,
    acceptedAt: short.nullable(),
    sessions: _zodV.z.array(session).max(500),
    phases: _zodV.z.array(_zodV.z.object({
        name: short,
        weeks: short,
        description: text
    })).max(30),
    evidence: strings,
    notes: _zodV.z.array(text).max(100),
    progression: text,
    template: short,
    paused: bool
});
var exercise = _zodV.z.object({
    id,
    name: short,
    pattern: short,
    equipment: short,
    metric: _zodV.z.enum(['reps', 'seconds', 'minutes']),
    cues: _zodV.z.array(text).max(60),
    source: short.optional(),
    video: short.optional(),
    videoNote: text.optional(),
    custom: bool.optional(),
    loadConvention: text.optional(),
    loadMultiplier: number.min(0).max(4).optional(),
    loadTracked: bool.optional(),
    requiresSetup: bool.optional(),
    primaryMuscles: strings.optional(),
    instructionStatus: short.optional(),
    progressionEnabled: bool.optional(),
    category: short.optional()
});
var setMetricsSchema = _zodV.z.object({
    distanceM: number.min(0).max(1000000).optional(),
    durationSeconds: number.min(0).max(604800).optional(),
    heightCm: number.min(0).max(10000).optional(),
    heartRate: number.min(0).max(300).optional(),
    cadence: number.min(0).max(1000).optional(),
    powerWatts: number.min(0).max(10000).optional(),
    speedKph: number.min(0).max(300).optional(),
    inclinePercent: number.min(-100).max(100).optional(),
    level: number.min(0).max(1000).optional(),
    assistanceKg: number.min(0).max(1500).optional(),
    tempo: short.optional(),
    side: _zodV.z.enum(['Both', 'Left', 'Right', 'Alternating']).optional(),
    notes: text.optional()
});
var workout = _zodV.z.object({
    revision: number.int().min(1).max(1000000).optional(),
    id,
    sessionId: id,
    title: short,
    date,
    startedAt: number.min(0),
    finishedAt: number.min(0).optional(),
    timeZone: _zodV.z.string().max(100).refine(value => {
        try { return !!value && !!new Intl.DateTimeFormat('en', {timeZone: value}).format(0); }
        catch { return false; }
    }).optional(),
    startedAtUtc: _zodV.z.string().max(35).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value).optional(),
    finishedAtUtc: _zodV.z.string().max(35).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value).optional(),
    sets: _zodV.z.array(_zodV.z.object({
        exerciseId: id,
        set: number.int().min(1).max(100),
        reps: number.min(0).max(9999),
        kg: number.min(0).max(1500).nullable(),
        done: bool,
        rir: number.min(0).max(10).nullable().optional(),
        metrics: setMetricsSchema.optional()
    })).max(1000),
    targets: _zodV.z.array(item).max(100).optional(),
    loadContext: map(short).optional(),
    rir: map(number.min(0).max(10).nullable()).optional(),
    details: map(_zodV.z.object({notes: text.optional()})).optional(),
    effort: short.optional(),
    symptom: short.optional(),
    rating: number.min(0).max(5).optional(),
    partial: bool.optional(),
    supervisorConfirmed: bool.optional(),
    demo: bool.optional()
});
var eventSchema = _zodV.z.object({
    id,
    name: short,
    date,
    kind: short,
    priority: short,
    minutes: number.min(0).max(1440),
    provisional: bool
});
var proposal = _zodV.z.object({
    id,
    title: short,
    reason: text,
    type: _zodV.z.enum(['sets', 'move', 'return', 'load', 'substitute', 'ranges', 'capacity', 'review']),
    changes: _zodV.z.array(_zodV.z.object({
        sessionId: id,
        beforeDate: date.optional(),
        patch: session.partial()
    })).max(500).optional(),
    warnings: _zodV.z.array(text).max(100).optional(),
    eventSignature: _zodV.z.string().max(1000000).optional(),
    historyCount: number.int().min(0).optional(),
    planId: id,
    baseVersion: number.int().min(1),
    sessionId: id,
    before: text,
    after: text,
    status: _zodV.z.enum(['pending', 'accepted', 'declined', 'stale', 'queued']),
    patch: session.partial(),
    source: short,
    createdAt: short
});
var restTimer = _zodV.z.object({
    id,
    workoutId: id,
    setKey: short,
    endAt: number.min(0).nullable(),
    pausedSeconds: number.min(0).max(3600).nullable(),
    alerted: bool
}).refine(t => t.endAt === null !== (t.pausedSeconds === null));
var stateSchema = _zodV.z.object({
    restTimer: restTimer.nullable().catch(null).optional(),
    restAlerts: bool.optional(),
    restSound: bool.optional(),
    videoPromptsAnswered: _zodV.z.array(id).max(2000).optional(),
    schema: _zodV.z.union([_zodV.z.literal(2), _zodV.z.literal(3), _zodV.z.literal(4)]),
    profile,
    plan: plan.nullable(),
    history: _zodV.z.array(workout).max(5000),
    active: workout.nullable(),
    proposals: _zodV.z.array(proposal).max(1000),
    events: _zodV.z.array(eventSchema).max(2000),
    custom: _zodV.z.array(exercise).max(1500),
    ratings: map(number.min(1).max(5)),
    audit: _zodV.z.array(_zodV.z.object({
        at: short,
        message: text
    })).max(10000),
    saved: _zodV.z.array(plan).max(100),
    checkins: bool,
    soreness: bool,
    hold: bool,
    simulatedOffline: bool,
    equipmentCaps: _zodV.z.array(_zodV.z.object({
        exerciseId: id,
        setup: short,
        maxKg: number.min(0).max(1500)
    })).max(500).optional(),
    incrementKg: map(number.min(0).max(100)).optional(),
    loadContext: map(short).optional(),
    restEnd: number.min(0).nullable().optional(),
    restPaused: number.min(0).max(3600).nullable().optional()
});
function parseSafeJson(raw, max = 5_000_000) {
    if (raw.length > max || new TextEncoder().encode(raw).length > max)
        throw Error('Saved data is too large to open here.');
    return JSON.parse(raw, (k, v) => {
        if (['__proto__', 'constructor', 'prototype'].includes(k))
            throw Error('Unexpected data field.');
        return v;
    });
}
function readSavedState(raw, options = {}) {
    const max = options.maxChars ?? 24_000_000;
    if (!Number.isSafeInteger(max) || max < 1 || max > 24_000_000)
        throw Error('The saved data size limit is unsupported.');
    var value = stateSchema.parse(parseSafeJson(raw, max));
    if (value.active && !value.plan?.sessions.some(x => x.id === value.active.sessionId))
        throw Error('The saved workout has no matching plan.');
    assertSavedIntegrity(value);
    return {
        ...value,
        schema: value.schema === 4 ? 4 : 3
    };
}
function readSetupDraft(raw) {
    return _zodV.z.object({
        schema: _zodV.z.literal(1),
        basePlanId: id.nullable(),
        baseEvents: _zodV.z.string().max(1000000).default(''),
        profile: profile.extend({
            start: _zodV.z.union([date, _zodV.z.literal('')]),
            age: number.min(0).max(120),
            minutes: number.min(0).max(1440),
            weeks: number.min(0).max(52)
        }),
        events: _zodV.z.array(eventSchema).max(2000),
        step: number.int().min(0).max(7)
    }).parse(parseSafeJson(raw, 1_500_000));
}
/** Import prescriptions only. Caller must preview ownership, dates and local conflicts. */
function readPlanFile(raw) {
    return plan.parse(parseSafeJson(raw, 1_500_000));
}
function assertSavedIntegrity(s) {
    if (s.schema !== 4 && [s.plan, ...s.saved].some(p => p?.progressionModel === 'source' || p?.sessions.some(x => x.items.some(i => i.sourceRule || i.setPlan))))
        throw Error('Published source prescriptions require schema 4 to preserve their rules.');
    if (s.schema !== 4 && [...s.history, ...(s.active ? [s.active] : [])].some(w => w.targets?.some(i => i.sourceRule || i.setPlan)))
        throw Error('Source workout targets require schema 4.');
    var unique = ids => new Set(ids).size === ids.length;
    if (!unique((s.equipmentCaps || []).map(c => JSON.stringify([c.exerciseId, c.setup]))))
        throw Error('Duplicate equipment limits.');
    if (!unique(s.events.map(e => e.id)) || !unique(s.proposals.map(e => e.id)))
        throw Error('Duplicate event or change IDs.');
    if (!unique(s.history.map(w => w.id)) || !unique(s.custom.map(e => e.id)))
        throw Error('Duplicate saved record IDs.');
    for (var p of [s.plan, ...s.saved].filter(Boolean)) {
        if (!p.sessions.length || !unique(p.sessions.map(x => x.id)))
            throw Error('The saved plan has empty or duplicate sessions.');
        for (var x of p.sessions) {
            if (!unique(x.items.map(i => i.exerciseId)))
                throw Error('Duplicate exercise targets in a session.');
            for (var i of x.items) {
                if (i.repMin !== undefined && i.repMax !== undefined && i.repMin > i.repMax || !Number.isInteger(i.sets))
                    throw Error('Invalid saved rep range.');
                if (i.setPlan && i.setPlan.length !== i.sets)
                    throw Error('A paired set plan must match the prescribed set count.');
            }
        }
    }
    for (var w of [...s.history, ...(s.active ? [s.active] : [])]) {
        if (w.startedAtUtc !== undefined && Date.parse(w.startedAtUtc) !== w.startedAt)
            throw Error('The workout UTC start timestamp does not match its recorded time.');
        if (w.finishedAtUtc !== undefined && (w.finishedAt === undefined || Date.parse(w.finishedAtUtc) !== w.finishedAt))
            throw Error('The workout UTC finish timestamp does not match its recorded time.');
        if (!unique(w.sets.map(x => x.exerciseId + ':' + x.set)))
            throw Error('Duplicate set numbers in a workout.');
        if (w.targets && (!unique(w.targets.map(x => x.exerciseId)) || w.targets.some(x => x.repMin !== undefined && x.repMax !== undefined && x.repMin > x.repMax)))
            throw Error('Invalid workout target snapshot.');
        if (w.sets.some(x => x.rir != null && (0, _training.exFor)(x.exerciseId, s.custom).metric !== 'reps'))
            throw Error('Reps in reserve belong only to repetition sets.');
        if (w.sets.some(x => x.done && (x.reps <= 0 || (0, _training.exFor)(x.exerciseId, s.custom).metric === 'reps' && !Number.isInteger(x.reps))))
            throw Error('A logged set needs a valid completed amount.');
    }
    if (s.active) {
        var _w = s.active, _session = s.plan?.sessions.find(x => x.id === _w.sessionId), targets = _w.targets || _session?.items || [];
        if (_session?.status !== 'scheduled' || s.history.some(x => x.id === _w.id) || _w.finishedAt !== undefined)
            throw Error('This active workout is already closed.');
        if (_w.sets.some(x => !targets.some(t => t.exerciseId === x.exerciseId && x.set <= t.sets)))
            throw Error('An active set does not match its target.');
    }
}
export { setMetricsSchema };
export { eventSchema };
export { parseSafeJson };
export { readSavedState };
export { readSetupDraft };
export { readPlanFile };
