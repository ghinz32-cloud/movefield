// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "./equipment";
import * as __dependency1 from "./training-focus";
import * as __dependency2 from "./source-programs";
import * as __dependency3 from "./program-catalog";
import * as __dependency4 from "./training";
var _equipment = __dependency0;
var _trainingFocus = __dependency1;
var _sourcePrograms = __dependency2;
var _programCatalog = __dependency3;
var _training = __dependency4;
var setupSteps = ['You', 'Goal', 'Coaching', 'Schedule', 'Equipment', 'Commitments', 'Choose a plan', 'Review'];
function hydrateSetupProfile(p) {
    return {
        ...p,
        inventory: p.inventory || (0, _equipment.defaultInventory)(p.equipment)
    };
}
function freshState() {
    return {
        ...(0, _training.initialState)(),
        profile: {
            ..._training.blankProfile,
            name: '',
            goal: 'general',
            experience: 'First time',
            start: (0, _training.day)(),
            equipment: 'Full gym',
            inventory: (0, _equipment.defaultInventory)()
        },
        plan: null
    };
}
function setupErrors(p, step) {
    if (step === 0)
        return [...(!p.name.trim() ? ['Enter a name for this device’s profile.'] : []), ...(!Number.isInteger(p.age) || p.age < 14 || p.age > 100 ? ['This prototype supports ages 14–100.'] : [])];
    if (step === 2) {
        if (p.age < 18 && p.mode === 'app' && p.season === 'In-season' && p.goal === 'sport')
            return ['Choose coach-directed tracking during the school sport season.'];
        if (p.age < 18 && p.mode === 'app' && !p.supervision)
            return ['Qualified supervision is needed for the youth foundation. Confirm availability or choose tracking.'];
        if (p.age < 18 && p.mode === 'app' && p.goal === 'running')
            return ['The current run/walk program is for adults. Choose coach tracking for youth running.'];
    }
    if (step === 4)
        return [...(0, _equipment.inventoryErrors)(p), ...(0, _trainingFocus.focusSetupErrors)(p), ...(p.dumbbellMaxKg !== undefined && (!Number.isFinite(p.dumbbellMaxKg) || p.dumbbellMaxKg < 0 || p.dumbbellMaxKg > 500) ? ['Enter a valid weight for one dumbbell, or leave it blank.'] : [])];
    if (step === 3)
        return [...(!(0, _training.validDay)(p.start) || p.start < (0, _training.day)() ? ['Choose today or a future start date.'] : []), ...(!Number.isInteger(p.weeks) || p.weeks < 2 || p.weeks > 12 ? ['Choose 2–12 weeks.'] : []), ...(!Number.isInteger(p.minutes) || p.minutes < 15 || p.minutes > 120 ? ['Choose 15–120 minutes per session.'] : []), ...(!p.days.length ? ['Choose at least one available day.'] : []), ...(p.trainingDays !== undefined && (!Number.isInteger(p.trainingDays) || p.trainingDays < 2 || p.trainingDays > 7 || p.trainingDays > p.days.length) ? ['Choose 2–7 training days within your available weekdays.'] : [])];
    return [];
}
function planOptions(p, events) {
    var specialized = p.mode === 'app' && _programCatalog.programCatalog.some(d => d.goal === p.goal);
    var variants = specialized ? _programCatalog.programCatalog.filter(d => d.goal === p.goal).map((d, i) => ({
        id: d.id,
        title: d.name,
        description: d.description,
        profile: {
            ...p,
            programId: d.id
        },
        recommended: false
    })) : [{
            id: 'matched',
            title: p.mode === 'coach' ? 'Coach-directed tracking' : p.mode === 'manual' ? 'Your own training schedule' : 'Your goal-based plan',
            description: p.mode === 'app' ? 'Uses your goal, experience, available days, equipment and session window.' : 'Scheduled spaces for the exercises and targets you enter. No automatic additions.',
            profile: {
                ...p,
                programId: undefined
            },
            recommended: true
        }];
    if (p.mode === 'app')
        variants.push(..._sourcePrograms.sourcePrograms.filter(d => d.goals.includes(p.goal)).map(d => ({
            id: d.id,
            title: d.name,
            description: `PRELOADED · ${d.creator}. ${d.scope}`,
            profile: {
                ...p,
                programId: d.id
            },
            recommended: false
        })));
    if (p.mode === 'app' && p.goal === 'running')
        variants.unshift({
            id: 'RUN-WALK',
            title: 'NHS Couch to 5K · run/walk plan',
            description: 'The staged NHS Couch to 5K run/walk sequence on three separated days. Start here if you are new to running.',
            profile: {
                ...p,
                programId: undefined
            },
            recommended: false
        });
    if (p.mode === 'app' && p.age < 18 && specialized)
        variants.push({
            id: 'youth-foundation',
            title: 'Supervised youth foundation',
            description: 'General strength practice with qualified supervision, adapted for younger users.',
            profile: {
                ...p,
                programId: undefined,
                goal: 'sport'
            },
            recommended: false
        });
    if (p.mode === 'app')
        variants.push({
            id: 'tracking',
            title: 'Write and track my own plan',
            description: 'Keep your available days and enter your own targets. No app-prescribed exercises or progression.',
            profile: {
                ...p,
                programId: undefined,
                mode: 'manual'
            },
            recommended: false
        });
    var built = variants.map(v => ({
        ...v,
        ...(0, _training.buildPlan)(v.profile, events),
        recommended: false
    }));
    var score = v => {
        var d = _programCatalog.programCatalog.find(d => d.id === v.id);
        if (!d)
            return v.id === 'RUN-WALK' && !p.runBase ? 30 : 0;
        var strength = v.plan.sessions.filter(s => s.week === Math.min(3, p.weeks) && s.items.some(i => !['walk', 'run'].includes(i.exerciseId)));
        var work = strength.reduce((n, s) => n + s.items.reduce((m, i) => m + (!['walk', 'run'].includes(i.exerciseId) ? i.sets : 0), 0), 0);
        var preferredEquipment = d.equipment === {
            'Full gym': 'gym',
            'Dumbbells': 'dumbbells',
            'Bodyweight + band': 'bodyweight-band',
            'No equipment': 'none'
        }[p.equipment];
        return (d.distributed && p.trainingDays === undefined ? -25 : 0) + (d.brief ? -30 : 15) + (preferredEquipment ? 5 : 0) + (p.noFloor && d.noFloor ? 5 : 0) + (p.experience === 'First time' && d.level === 'foundation' ? 8 : 0) + (p.experience !== 'First time' && d.level === 'build' ? 8 : 0) + (d.experience === 'advanced' ? -4 : 0) + Math.min(8, work / 8);
    };
    var first = built.filter(v => v.plan && v.profile.mode === p.mode && v.profile.goal === p.goal).sort((a, b) => score(b) - score(a))[0];
    if (first)
        first.recommended = true;
    return built.sort((a, b) => Number(!!b.plan) - Number(!!a.plan) || Number(b.recommended) - Number(a.recommended));
}
function acceptSetup(s, p, plan, events, expectedEvents = JSON.stringify(s.events)) {
    if (s.plan && s.saved.length >= 100)
        return {
            state: s,
            error: 'This local demo holds 100 archived or saved plans. Export your records before starting another block.'
        };
    if (expectedEvents !== JSON.stringify(s.events))
        return {
            state: s,
            error: 'Your calendar changed while this plan was being prepared. Save and reopen setup to review the current commitments.'
        };
    if (s.active)
        return {
            state: s,
            error: 'Finish or save your current workout before accepting a different plan.'
        };
    if (s.simulatedOffline)
        return {
            state: s,
            error: 'Reconnect before accepting a plan.'
        };
    var validation = [...setupErrors(p, 0), ...setupErrors(p, 2), ...setupErrors(p, 3), ...setupErrors(p, 4), ...(0, _training.buildPlan)(p, events).errors];
    if (validation.length)
        return {
            state: s,
            error: validation.join(' ')
        };
    if (JSON.stringify(p) !== JSON.stringify(plan.profile) && JSON.stringify({
        ...p,
        programId: plan.profile.programId,
        days: plan.profile.days
    }) !== JSON.stringify(plan.profile))
        return {
            state: s,
            error: 'Your choices changed. Select the plan again before accepting.'
        };
    if (plan.sessions.some(x => events.some(e => e.date === x.date)))
        return {
            state: s,
            error: 'A workout conflicts with your current commitments. Select the plan again to see a new draft schedule.'
        };
    var accepted = {
        ...plan,
        acceptedAt: new Date().toISOString()
    };
    return {
        state: (0, _training.changed)({
            ...s,
            schema: plan.progressionModel === 'source' ? 4 : s.schema,
            profile: {
                ...p
            },
            plan: accepted,
            events,
            saved: s.plan ? [s.plan, ...s.saved] : s.saved,
            proposals: s.proposals.map(q => q.status === 'pending' || q.status === 'queued' ? {
                ...q,
                status: 'stale'
            } : q)
        }, 'Accepted plan ' + accepted.name)
    };
}
function referenceOption(p, events, id) {
    var ref = _programCatalog.programReferences.find(x => x.id === id && x.goal === p.goal);
    var profile = {
        ...p,
        programId: id,
        mode: 'manual'
    };
    return {
        id,
        title: ref?.name || 'Unknown program',
        description: 'User-entered tracking for the official program. Original workouts are not preloaded.',
        profile,
        recommended: false,
        ...(0, _training.buildPlan)(profile, events)
    };
}
export { setupSteps };
export { hydrateSetupProfile };
export { freshState };
export { setupErrors };
export { planOptions };
export { acceptSetup };
export { referenceOption };
