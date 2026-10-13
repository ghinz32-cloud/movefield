// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _equipment from "./equipment";
import * as __dependency1 from "./exercise-library.json";
import * as __dependency2 from "./recipes.json";
import * as _trainingFocus from "./training-focus";
import * as _programCatalog from "./program-catalog";
import * as _sourcePrograms from "./source-programs";
function _interopDefault(e) {
    return e && e.__esModule ? e : {
        default: e
    };
}
var _exerciseLibraryJson = __dependency1.default;
var expandedLibrary = _interopDefault(_exerciseLibraryJson);
var _recipesJson = __dependency2.default;
var recipes = _interopDefault(_recipesJson);
/** Unknown is distinct from zero. Workout.rir is retained only as legacy exercise feedback. */
function validSetRir(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;
}
function rirText(value) {
    return validSetRir(value) ? value === 5 ? '5 or more' : String(value) : 'not recorded';
}
var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function day(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(date, n) {
    var d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return day(d);
}
function niceDate(date) {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}
function uid(prefix = 'id') {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
var foundationExercises = [{
        id: 'squat',
        name: 'Goblet squat',
        pattern: 'Squat',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Hold one weight close to your chest.', 'Sit between your hips through a comfortable range.', 'Keep the whole foot grounded and stand smoothly.']
    }, {
        id: 'bench',
        name: 'Barbell bench press',
        pattern: 'Push',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Set a stable position with feet supported.', 'Lower the bar under control to a comfortable chest position.', 'Press smoothly; use appropriate safeties or a qualified spotter.']
    }, {
        id: 'row',
        name: 'Standing one-arm dumbbell row',
        pattern: 'Pull',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Take a stable split stance and hinge forward with a controlled trunk.', 'Draw your elbow toward your hip without twisting.', 'Lower under control; log repetitions per side and load per hand.']
    }, {
        id: 'rdl',
        name: 'Dumbbell Romanian deadlift',
        pattern: 'Hinge',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Keep a soft knee bend and send your hips back.', 'Keep the weights close and stop within a controlled range.', 'Stand by extending the hips, without leaning back.']
    }, {
        id: 'pushup',
        name: 'Incline push-up',
        pattern: 'Push',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Use a secure, elevated support.', 'Keep your body aligned as you lower.', 'Choose a support height that allows controlled repetitions.']
    }, {
        id: 'plank',
        name: 'Forearm plank',
        pattern: 'Trunk',
        equipment: 'Bodyweight',
        metric: 'seconds',
        cues: ['Support yourself on forearms and toes or knees.', 'Maintain a comfortable trunk position.', 'Breathe normally; end the hold when control changes.']
    }, {
        id: 'deadbug',
        name: 'Dead bug',
        pattern: 'Trunk',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Lie on your back with arms and legs lifted.', 'Move an opposite arm and leg slowly within a controlled range.', 'Return and alternate; record repetitions per side.']
    }, {
        id: 'bw-squat',
        name: 'Bodyweight squat',
        pattern: 'Squat',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Stand with a comfortable stance.', 'Lower through a comfortable range with feet supported.', 'Stand smoothly; use a stable chair as a depth reference if useful.']
    }, {
        id: 'calf',
        name: 'Standing calf raise',
        pattern: 'Calf',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Use a stable support for balance.', 'Rise through your forefoot without rolling the ankle.', 'Lower slowly through a comfortable range.']
    }, {
        id: 'pulldown',
        name: 'Lat pulldown',
        pattern: 'Pull',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Set the thigh support securely.', 'Pull the bar toward your upper chest.', 'Return under control without swinging your torso.']
    }, {
        id: 'bar-squat',
        name: 'Barbell back squat',
        pattern: 'Squat',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Set the rack and safeties for your position.', 'Brace and descend within your controlled range.', 'Stand with a stable bar path; unfamiliar lifters need instruction.']
    }, {
        id: 'ohp',
        name: 'Standing dumbbell shoulder press',
        pattern: 'Push',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Stand with a stable stance and controlled trunk.', 'Press through a comfortable range without excessive back arch.', 'Lower the weights under control.']
    }, {
        id: 'split',
        name: 'Static split squat',
        pattern: 'Single leg',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Use a stable split stance and support for balance if needed.', 'Lower through a comfortable range.', 'Press up with control; log repetitions per side.']
    }, {
        id: 'bridge',
        name: 'Glute bridge',
        pattern: 'Hinge',
        equipment: 'Bodyweight',
        metric: 'reps',
        cues: ['Lie on your back with bent knees and feet supported.', 'Raise your hips within a comfortable controlled range.', 'Lower smoothly; breathe normally.']
    }, {
        id: 'band-row',
        name: 'Seated resistance-band row',
        pattern: 'Pull',
        equipment: 'Resistance band',
        metric: 'reps',
        cues: ['Use a resistance band and an anchor intended for this exercise.', 'Keep a stable trunk and draw elbows back under control.', 'Do not improvise an unsecured household anchor.']
    }, {
        id: 'deadlift',
        name: 'Barbell deadlift',
        pattern: 'Hinge',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Use the familiar setup taught for your chosen deadlift variation.', 'Brace and lift with controlled coordinated hip and knee extension.', 'Return the bar under control; qualified instruction is needed for an unfamiliar lift.']
    }, {
        id: 'leg-curl',
        name: 'Machine leg curl',
        pattern: 'Knee flexion',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Adjust the machine for your limb length.', 'Curl through a comfortable controlled range.', 'Return slowly; keep the machine setup consistent in your log.']
    }, {
        id: 'leg-extension',
        name: 'Machine leg extension',
        pattern: 'Knee extension',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Adjust the seat and pad to fit your leg.', 'Extend through a comfortable controlled range.', 'Return smoothly without bouncing.']
    }, {
        id: 'incline-press',
        name: 'Incline dumbbell press',
        pattern: 'Push',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Use a secure incline bench and a manageable pair of weights.', 'Press through a controlled comfortable range.', 'Record the bench angle and load per hand.']
    }, {
        id: 'lateral',
        name: 'Dumbbell lateral raise',
        pattern: 'Shoulder',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Stand with a stable trunk and manageable weights.', 'Raise through a comfortable range without swinging.', 'Lower under control; load is per hand.']
    }, {
        id: 'curl',
        name: 'Dumbbell curl',
        pattern: 'Arm',
        equipment: 'Dumbbells',
        metric: 'reps',
        cues: ['Use a stable stance and manageable weights.', 'Bend the elbows without swinging your torso.', 'Lower under control; load is per hand.']
    }, {
        id: 'triceps',
        name: 'Cable triceps extension',
        pattern: 'Arm',
        equipment: 'Full gym',
        metric: 'reps',
        cues: ['Choose a suitable cable attachment and stable position.', 'Extend the elbows through a controlled range.', 'Return smoothly; record the machine and attachment.']
    }, {
        id: 'walk',
        name: 'Brisk walk',
        pattern: 'Endurance',
        equipment: 'Bodyweight',
        metric: 'minutes',
        cues: ['Choose a suitable route and conditions.', 'Walk at a comfortable purposeful pace.', 'You should still be able to speak comfortably.']
    }, {
        id: 'run',
        name: 'Easy run / walk',
        pattern: 'Endurance',
        equipment: 'Bodyweight',
        metric: 'minutes',
        cues: ['Begin with the planned walking warm-up.', 'Keep running conversational rather than chasing speed.', 'Finish with a comfortable walk; stop for concerning symptoms.']
    }, {
        id: 'skill',
        name: 'Coach-selected sport skill practice',
        pattern: 'Skill',
        equipment: 'Sport equipment',
        metric: 'minutes',
        cues: ['Use your coach’s instructions and a suitable environment.', 'Record only the minutes or drills you actually perform.', 'Completion does not establish assessed skill or technical readiness.']
    }];
var foundationMetadata = {
    'squat': {
        equipment: 'Dumbbell',
        loadMultiplier: 1,
        loadConvention: 'One dumbbell total; repetitions total.'
    },
    'row': {
        equipment: 'Dumbbell',
        loadMultiplier: 2,
        loadConvention: 'Per dumbbell; repetitions per side. Complete both sides before marking the set done.'
    },
    ...Object.fromEntries(['rdl', 'ohp', 'incline-press', 'lateral', 'curl'].map(id => [id, {
            equipment: 'Dumbbell',
            loadMultiplier: 2,
            loadConvention: 'Per dumbbell; count each simultaneous lift once. Both dumbbells must have the same weight.'
        }])),
    ...Object.fromEntries(['bench', 'bar-squat', 'deadlift'].map(id => [id, {
            equipment: 'Barbell',
            loadMultiplier: 1,
            loadConvention: 'Total weight including bar and plates; repetitions total.'
        }])),
    ...Object.fromEntries(['pulldown', 'triceps'].map(id => [id, {
            equipment: 'Cable',
            loadMultiplier: 1,
            requiresSetup: true,
            loadConvention: 'One selected stack weight; repetitions total. Keep machine, pulley and attachment identical.'
        }])),
    ...Object.fromEntries(['leg-curl', 'leg-extension'].map(id => [id, {
            equipment: 'Selectorized machine',
            loadMultiplier: 1,
            requiresSetup: true,
            loadConvention: 'Selected stack weight; repetitions total. Keep machine and seat/pad settings identical.'
        }]))
};
var exercises = [...foundationExercises.map(e => ({
        ...e,
        pattern: e.pattern === 'Trunk' ? 'Core' : e.pattern,
        instructionStatus: e.id === 'skill' ? 'coach-selected' : 'reviewed-source',
        loadTracked: !!foundationMetadata[e.id],
        progressionEnabled: !!foundationMetadata[e.id],
        loadMultiplier: 0,
        loadConvention: ['split', 'deadbug'].includes(e.id) ? 'Bodyweight; repetitions per side. Complete both sides.' : 'Bodyweight or task time; external load not included in volume.',
        primaryMuscles: _equipment.movementRoles[e.id]?.muscles || {
            plank: ['trunk stabilizers'],
            walk: ['quadriceps', 'glutes', 'calves'],
            run: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
            skill: []
        }[e.id] || [],
        ...foundationMetadata[e.id]
    })), ...expandedLibrary.default];
function isLoadTracked(e) {
    return e.loadTracked === true;
}
function requiresSetup(e) {
    return e.requiresSetup === true;
}
function matchesExercise(e, query) {
    var aliases = {
        db: 'dumbbell',
        dumbell: 'dumbbell',
        dumbells: 'dumbbell',
        kb: 'kettlebell',
        bb: 'barbell',
        abs: 'core',
        abdominal: 'core',
        abdominals: 'core',
        pec: 'chest',
        pecs: 'chest'
    };
    var normalize = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    var text = normalize(`${e.name} ${e.pattern} ${e.equipment} ${(e.primaryMuscles || []).join(' ')} ${/abdom|trunk/i.test(e.pattern + ' ' + e.primaryMuscles?.join(' ')) ? 'core' : ''}`);
    return normalize(query).split(/\s+/).filter(Boolean).every(t => text.includes(aliases[t] || t));
}
var sports = ['Football', 'Flag football', 'Basketball', 'Baseball', 'Softball', 'Soccer', 'Volleyball', 'Track and field', 'Cross country', 'Swimming', 'Diving', 'Wrestling', 'Lacrosse', 'Field hockey', 'Ice hockey', 'Tennis', 'Golf', 'Cheer', 'Dance', 'Gymnastics', 'Bowling', 'Other sport'];
var goals = [['strength', 'Strength'], ['hypertrophy', 'Build muscle'], ['powerbuilding', 'Powerbuilding'], ['hybrid', 'Hybrid · strength + running'], ['running', 'Running'], ['sport', 'Sport performance'], ['general', 'General fitness'], ['calisthenics', 'Calisthenics'], ['powerlifting', 'Powerlifting']];
var blankProfile = {
    age: 28,
    goal: 'hybrid',
    experience: 'Some experience',
    mode: 'app',
    minutes: 60,
    days: [1, 3, 5],
    weeks: 8,
    start: day(),
    equipment: 'Full gym',
    sport: 'Basketball',
    position: 'All-round',
    season: 'Off-season',
    supervision: false,
    units: 'lb',
    name: 'Demo athlete'
};
function roundLoad(kg, increment) {
    return Math.floor((kg + 1e-8) / increment) * increment;
}
function displayLoad(kg, units) {
    return kg == null ? 'Choose a light load' : `${Math.round(kg * (units === 'lb' ? 2.2046226218 : 1) * 10) / 10} ${units}`;
}
function toKg(n, units) {
    return units === 'lb' ? n / 2.2046226218 : n;
}
function exFor(id, custom = []) {
    return exercises.find(e => e.id === id) || custom.find(e => e.id === id) || {
        id,
        name: 'Archived exercise',
        pattern: 'Custom',
        equipment: 'Custom',
        metric: 'reps',
        cues: []
    };
}
function validateProfile(p) {
    if (!p || !Array.isArray(p.days))
        return ['Choose valid available weekdays.'];
    var errors = [...(0, _equipment.inventoryErrors)(p)];
    if (p.trainingDays !== undefined && (!Number.isInteger(p.trainingDays) || p.trainingDays < 2 || p.trainingDays > 7 || p.trainingDays > p.days.length))
        errors.push('Choose 2–7 training days, within your available weekdays.');
    if (!Array.isArray(p.days) || !p.days.length || p.days.some(d => !Number.isInteger(d) || d < 0 || d > 6) || new Set(p.days).size !== p.days.length)
        errors.push('Choose distinct weekdays from Sunday through Saturday.');
    if (!['First time', 'Some experience', 'Experienced'].includes(p.experience) || !['app', 'coach', 'manual'].includes(p.mode) || !['Full gym', 'Dumbbells', 'Bodyweight + band', 'No equipment'].includes(p.equipment) || !['kg', 'lb'].includes(p.units))
        errors.push('Choose supported experience, coaching, equipment and units.');
    if (!Number.isInteger(p.age) || !Number.isInteger(p.minutes))
        errors.push('Age and session minutes must be whole numbers.');
    if (!goals.some(([id]) => id === p.goal))
        errors.push('Choose a supported training goal.');
    if (!Number.isFinite(p.age) || p.age < 14 || p.age > 100)
        errors.push('This prototype supports ages 14–100. Under-14 planning is outside its scope.');
    if (!validDay(p.start))
        errors.push('Choose a valid start date.');
    if (!Number.isFinite(p.minutes) || p.minutes < 15 || p.minutes > 120)
        errors.push('Choose a session window of 15–120 minutes.');
    if (p.sex !== undefined && !['female', 'male', 'intersex', 'unspecified'].includes(p.sex))
        errors.push('Choose a supported sex option or leave it unspecified.');
    if (p.dumbbellMaxKg !== undefined && (!Number.isFinite(p.dumbbellMaxKg) || p.dumbbellMaxKg < 0 || p.dumbbellMaxKg > 500))
        errors.push('Enter a valid maximum weight for one dumbbell.');
    if (!Number.isInteger(p.weeks) || p.weeks < 2 || p.weeks > 12)
        errors.push('Choose a block of 2–12 weeks.');
    if (p.runDays !== undefined && (!Number.isInteger(p.runDays) || p.runDays < 0 || p.runDays > 7))
        errors.push('Running days must be 0–7.');
    if (p.runMinutes !== undefined && (!Number.isFinite(p.runMinutes) || p.runMinutes < 0 || p.runMinutes > 1500))
        errors.push('Running minutes must be 0–1500.');
    if (!p.days.length)
        errors.push('Select at least one available day.');
    if (p.mode === 'app' && p.days.length < 2)
        errors.push('These planning templates need at least two days. Add a day or choose manual tracking.');
    if (p.mode === 'app' && p.goal === 'running' && !p.programId && p.days.length < 3)
        errors.push('The beginner run/walk plan uses three nonconsecutive days. Add a third day or use tracking.');
    if (p.age < 18 && p.mode === 'app' && !p.supervision)
        errors.push('Youth automated strength planning requires suitable qualified supervision. Select coach/manual tracking if it is unavailable.');
    if (p.age < 18 && p.goal === 'running' && p.mode === 'app')
        errors.push('This run/walk template is an adult pathway. Youth runners can use coach tracking and the supervised strength foundation.');
    return errors;
}
var nonConsecutive = (a, count) => {
    var combos = [];
    function f(i, b) {
        if (b.length === count) {
            combos.push(b);
            return;
        }
        for (var j = i; j < a.length; j++)
            f(j + 1, [...b, a[j]]);
    }
    f(0, []);
    return combos.find(b => b.every((v, i) => b.every((w, j) => i === j || ![1, 6].includes(Math.abs(v - w))))) || [];
};
/** Only draft dates may shift without a second approval. Acceptance shows every date. */
function buildPlan(p, events = []) {
    var protectedEvents = [...events];
    if (p.mode === 'app')
        for (var e of events.filter(e => e.kind === 'Competition')) {
            var buffer = e.priority === 'Normal' ? 1 : 2;
            for (var n = 1; n <= buffer; n++)
                protectedEvents.push({
                    ...e,
                    id: e.id + '-buffer-' + n,
                    date: addDays(e.date, -n),
                    name: 'Recovery before ' + e.name
                });
        }
    var result = buildBasePlan(p, protectedEvents);
    if (!result.plan && protectedEvents.length) {
        var open = buildBasePlan(p, []);
        if (open.plan) {
            var draft = open.plan, original = draft.sessions.map(s => s.date), limit = addDays(original.at(-1), 28);
            var moved = 0;
            var _loop = function () {
                var session = draft.sessions[i], gap = i ? dayDistance(original[i - 1], original[i]) : 0;
                var date = i && addDays(draft.sessions[i - 1].date, gap) > original[i] ? addDays(draft.sessions[i - 1].date, gap) : original[i];
                while (date <= limit && (!draft.profile.days.includes(new Date(date + 'T12:00:00').getDay()) || protectedEvents.some(e => e.date === date)))
                    date = addDays(date, 1);
                if (date > limit)
                    return {
                        v: {
                            plan: null,
                            errors: ['Your commitments leave too few training dates. Try a later start or fewer weekly sessions. We can extend a draft by up to four weeks.']
                        }
                    };
                if (date !== session.date)
                    moved++;
                session.date = date;
            }, _ret;
            for (var i = 0; i < draft.sessions.length; i++) {
                _ret = _loop();
                if (_ret)
                    return _ret.v;
            }
            if (moved) {
                draft.scheduleEnd = draft.sessions.at(-1).date;
                draft.notes.unshift(`Days off pause this draft: ${moved} sessions have later dates. It now ends ${niceDate(draft.scheduleEnd)}. The session order, recovery gaps and planned work stay the same. Review every date before starting.`);
            }
            result = open;
        }
    }
    if (result.plan && events.some(e => e.kind === 'Competition') && p.mode === 'app')
        result.plan.notes.unshift('Competition dates are protected. This draft leaves the day before each competition free, or two days for a high-priority event. These are app planning rules, not a promise to prevent soreness or a sport-specific taper.');
    if (result.plan)
        result = addEasyActivityDays(result, p, protectedEvents);
    if (result.plan)
        result = (0, _trainingFocus.applyTrainingFocus)(result.plan, events);
    if (result.plan && p.mode === 'app')
        for (var session of result.plan.sessions) {
            var jumpIssue = (0, _trainingFocus.focusScheduleConflict)(result.plan, events, session);
            if (jumpIssue) return {plan:null, errors:[jumpIssue]};
        }
    if (result.plan && p.mode === 'app' && p.inventory?.confirmed)
        for (var session of result.plan.sessions) {
            var error = resolveInventory(session.items, p);
            if (error)
                return {
                    plan: null,
                    errors: [error]
                };
            if (!session.runSteps?.length) {
                session.minutes = Math.max(session.minutes, estimateSessionMinutes(session.items, session.timeProfile === 'brief'));
                if (session.minutes > p.minutes)
                    return {
                        plan: null,
                        errors: [`${session.title} needs ${session.minutes} minutes with your available equipment and add-ons. Review time or add-ons.`]
                    };
            }
        }
    return result;
}
function addEasyActivityDays(result, p, events) {
    var plan = result.plan, wanted = p.trainingDays;
    if (!plan || p.mode !== 'app' || !wanted || wanted < 6 || !['running', 'hybrid'].includes(p.goal))
        return result;
    var existing = new Set(plan.sessions.map(s => new Date(s.date + 'T12:00:00').getDay()));
    if (existing.size >= wanted)
        return result;
    if (p.inventory?.confirmed && !(0, _equipment.equipmentFit)(exFor('walk'), p).available)
        return {
            plan: null,
            errors: ['Daily activity options need a suitable walking route. Confirm it in Equipment.']
        };
    var extra = p.days.filter(d => !existing.has(d)).slice(0, wanted - existing.size);
    if (extra.length < wanted - existing.size)
        return {
            plan: null,
            errors: ['Add enough available weekdays for your requested activity frequency.']
        };
    var _loop2 = function () {
        var date = addDays(p.start, n);
        if (!extra.includes(new Date(date + 'T12:00:00').getDay()))
            return 0; // continue
        if (events.some(e => e.date === date))
            return {
                v: {
                    plan: null,
                    errors: ['An easy activity day overlaps a commitment. Review availability or choose a later start.']
                }
            };
        plan.sessions.push({
            id: plan.id + '-activity-' + n,
            date,
            week: Math.floor(n / 7) + 1,
            title: 'Easy activity · recovery walk',
            kind: 'Easy activity',
            minutes: Math.min(20, p.minutes - 5) + 5,
            items: [{
                    exerciseId: 'walk',
                    sets: 1,
                    reps: Math.min(20, p.minutes - 5),
                    rest: 0,
                    kg: null,
                    note: 'Comfortable conversational walk. This is an easy activity day, not another hard run or strength session.'
                }],
            status: 'scheduled',
            recoveryGroup: 'activity',
            roleId: 'easy-activity'
        });
    }, _ret2;
    for (var n = 0; n < p.weeks * 7; n++) {
        _ret2 = _loop2();
        if (_ret2 === 0)
            continue;
        if (_ret2)
            return _ret2.v;
    }
    plan.sessions.sort((a, b) => a.date.localeCompare(b.date));
    plan.profile = {
        ...plan.profile,
        days: [...new Set([...plan.profile.days, ...extra])].sort((a, b) => a - b)
    };
    plan.name += ` · ${wanted}-day activity week`;
    plan.notes.unshift(`Your ${wanted}-day preference includes easy walking between the displayed strength or running sessions. Their work, order and recovery gaps are preserved. A daily habit does not mean daily hard training.`);
    return result;
}
function resolveInventory(items, p) {
    if (!p.inventory?.confirmed)
        return;
    for (var item of items) {
        var original = exFor(item.exerciseId), fit = (0, _equipment.equipmentFit)(original, p);
        if (fit.available)
            continue;
        var protectedLift = p.goal === 'powerlifting' && ['bar-squat', 'bench', 'deadlift'].includes(item.exerciseId);
        var replacement = !protectedLift ? (0, _equipment.prescriptionAlternatives)(item.exerciseId, p).find(id => (0, _equipment.equipmentFit)(exFor(id), p).available && !items.some(i => i.exerciseId === id)) : undefined;
        if (!replacement)
            return `${original.name}: ${fit.reason} No available substitute preserves this movement's role. Review equipment or choose another plan.`;
        item.exerciseId = replacement;
        item.kg = null;
        item.note = (item.note || '') + ` Equipment fit: ${exFor(replacement).name} replaces ${original.name}; starting load and history stay separate. ${_equipment.movementRoles[replacement]?.difference || ''}`;
    }
}
function buildBasePlan(p, events = []) {
    var errors = validateProfile(p);
    if (errors.length)
        return {
            plan: null,
            errors
        };
    if (p.mode === 'app' && p.programId?.startsWith('src-'))
        return (0, _sourcePrograms.buildSourcePlan)(p, events);
    if (p.programId?.startsWith('ref-')) {
        var ref = _programCatalog.programReferences.find(x => x.id === p.programId && x.goal === p.goal);
        if (!ref || p.mode !== 'manual')
            return {
                plan: null,
                errors: ['Choose a matching official program in user-entered tracking mode.']
            };
        if (p.age < 18)
            return {
                plan: null,
                errors: ['These adult program references are not youth prescriptions. Review training with your coach and choose coach-directed tracking.']
            };
        if (p.days.length < ref.days)
            return {
                plan: null,
                errors: [`${ref.name} uses ${ref.days} days per week. Add availability before creating its tracking schedule.`]
            };
        if (ref.weeks && p.weeks > ref.weeks)
            return {
                plan: null,
                errors: [`${ref.name} lasts ${ref.weeks} weeks. Choose that length or a shorter tracking segment.`]
            };
        var offsets = ref.days === 5 ? [0, 1, 3, 4, 5] : [0, 1, 3, 4], startDay = new Date(p.start + 'T12:00:00').getDay();
        var arranged = Array.from({
            length: 7
        }, (_, n) => offsets.map(o => (startDay + n + o) % 7)).find(ds => ds.every(d => p.days.includes(d)));
        if (!arranged)
            return {
                plan: null,
                errors: ['This tracking calendar needs training days with recovery gaps. Add availability for two training days, a rest day, then two training days (three for PHAT). Review the original schedule before using it.']
            };
        var _days = arranged.slice().sort((a, b) => a - b);
        var result = buildBasePlan({
            ...p,
            programId: undefined,
            days: _days
        }, events);
        if (!result.plan)
            return result;
        var plan = result.plan;
        plan.name = ref.name + ' by ' + ref.author + ' · user-entered tracking';
        plan.phases = [{
                name: 'Track the original',
                weeks: `1–${p.weeks}`,
                description: 'Enter the author’s targets and progression. No app-written phases replace the source program.'
            }];
        plan.profile = {
            ...plan.profile,
            programId: ref.id
        };
        plan.notes = [`Official program by ${ref.author}: ${ref.url}`, `This is an empty ${p.weeks}-week tracking schedule, not a preloaded or automated copy of ${ref.name}. Enter the author’s exercises, loads and progression yourself.`, `The calendar leaves a recovery gap between training groups. Confirm the dates, phase and session order against your original copy.`, ...(ref.weeks && p.weeks < ref.weeks ? [`The original lasts ${ref.weeks} weeks. This schedule covers only the first ${p.weeks} weeks.`] : []), ...plan.notes];
        plan.sessions = plan.sessions.map((x, i) => ({
            ...x,
            title: ref.name + ' by ' + ref.author + ' · Day ' + (i % ref.days + 1)
        }));
        return result;
    }
    if (p.mode === 'app' && (p.programId || (p.noFloor || p.equipment === 'No equipment' || p.age >= 18) && p.goal !== 'running' && _programCatalog.programCatalog.some(d => d.goal === p.goal)))
        return buildCatalogPlan(p, events);
    var youth = p.age < 18, run = p.goal === 'running', tracking = p.mode !== 'app', gym = p.equipment === 'Full gym', db = !p.equipment.startsWith('Bodyweight');
    if (!tracking && run && p.trainingDays !== undefined && p.trainingDays < 6 && p.trainingDays !== 3)
        return {
            plan: null,
            errors: ['The NHS beginner sequence needs three running days. Choose three days, or six/seven activity days with easy walks.']
        };
    if (!tracking && !run && db && p.dumbbellMaxKg === 0)
        return {
            plan: null,
            errors: ['This foundation uses dumbbells but your available maximum is zero. Choose bodyweight/band training or update your equipment.']
        };
    if (youth && !tracking && p.season === 'In-season')
        return {
            plan: null,
            errors: ['In-season youth sport defaults to coach-directed tracking. A complementary app plan needs an explicitly coordinated total schedule; use tracking in this prototype.']
        };
    if (!tracking && run && p.inventory?.confirmed && !(0, _equipment.equipmentFit)(exFor('run'), p).available)
        return {
            plan: null,
            errors: ['Confirm a suitable walking/running route in Equipment.']
        };
    if (!tracking && run && p.weeks > 9)
        return {
            plan: null,
            errors: ['The source run/walk sequence contains nine stages. Choose 2–9 weeks for this preview, then review the next block.']
        };
    var template = tracking ? 'TRACK' : run ? 'RUN-WALK' : youth ? 'YOUTH-FOUNDATION' : p.goal === 'hypertrophy' && p.experience !== 'First time' ? 'AT02' : ['powerlifting', 'strength', 'hybrid'].includes(p.goal) && p.experience !== 'First time' && gym ? 'AT03' : p.goal === 'calisthenics' || !db ? 'AT04' : 'AT01';
    var days = p.days.slice().sort();
    if (!tracking) {
        if (template === 'AT02') {
            if (!gym || p.minutes < 60)
                return {
                    plan: null,
                    errors: ['This four-day hypertrophy template requires full-gym equipment and at least 60 minutes. Choose the general-fitness foundation for less work.']
                };
            var candidates = [];
            for (var a = 0; a < days.length; a++)
                for (var b = a + 1; b < days.length; b++)
                    for (var c = b + 1; c < days.length; c++)
                        for (var d = c + 1; d < days.length; d++) {
                            var x = [days[a], days[b], days[c], days[d]];
                            if (x[2] - x[0] >= 2 && 7 - x[2] + x[0] >= 2 && x[3] - x[1] >= 2 && 7 - x[3] + x[1] >= 2)
                                candidates.push(x);
                        }
            days = candidates[0] || [];
        }
        else {
            var wanted = run || template === 'AT03' ? 3 : 2;
            days = nonConsecutive(p.days, wanted);
            if (!days.length && template === 'AT03') {
                days = nonConsecutive(p.days, 2);
                template = 'AT01';
            }
        }
    }
    if (!days.length)
        return {
            plan: null,
            errors: ['No supported schedule fits those days. Add separated availability or choose a simpler foundation; the app will not silently move a day.']
        };
    if (youth && !tracking && p.minutes < 40)
        return {
            plan: null,
            errors: ['The supervised youth foundation needs a 40-minute slot including instruction and rest. Increase available time or choose tracking.']
        };
    var id = uid('plan'), sessions = [];
    var priorByTitle = {};
    var foundationA = ['squat', 'rdl', 'pushup', 'row', 'ohp', 'calf', 'deadbug'];
    var foundationB = ['squat', 'rdl', 'pushup', gym ? 'pulldown' : 'row', 'ohp', 'calf', 'deadbug'];
    var home = ['bw-squat', 'bridge', 'pushup', 'band-row', 'calf', 'deadbug'];
    var strengthMenus = [['bar-squat', 'bench', 'row', 'leg-curl'], ['deadlift', 'ohp', 'pulldown', 'split'], ['bar-squat', 'bench', 'rdl', 'row']];
    var hypertrophyMenus = [['bench', 'row', 'incline-press', 'pulldown', 'lateral', 'curl', 'triceps'], ['bar-squat', 'rdl', 'leg-extension', 'leg-curl', 'calf', 'deadbug'], ['incline-press', 'pulldown', 'bench', 'row', 'lateral', 'curl', 'triceps'], ['bar-squat', 'rdl', 'leg-extension', 'leg-curl', 'calf', 'deadbug']];
    var _loop3 = function () {
        var date = addDays(p.start, offset), weekday = new Date(date + 'T12:00:00').getDay();
        if (!days.includes(weekday))
            return 0; // continue
        var index = sessions.length, week = Math.floor(index / days.length) + 1, slot = index % days.length, cycle = Math.min(week - 1, 5);
        var title = '', items = [], runSteps;
        if (tracking) {
            title = 'Enter your ' + (p.mode === 'coach' ? 'coach’s' : 'custom') + ' session';
        }
        else if (run) {
            var cfg = recipes.default.running;
            var stage = cfg.weeks_pattern_ids[Math.min(week - 1, 8)][slot];
            var pattern = cfg.patterns[stage];
            var seq = Array.isArray(pattern) ? pattern : Array.from({
                length: pattern.repeat
            }, () => pattern.pair_seconds).flat().concat(pattern.final_run_seconds);
            runSteps = [{
                    label: 'Warm-up walk',
                    seconds: 300
                }, ...seq.map(n => ({
                    label: n > 0 ? 'Easy run' : 'Recovery walk',
                    seconds: Math.abs(n)
                })), {
                    label: 'Cool-down walk',
                    seconds: 300
                }];
            title = `Run/walk · stage ${week}${week === 5 || week === 6 ? ' / ' + (slot + 1) : ''}`;
            items = [{
                    exerciseId: 'run',
                    sets: 1,
                    reps: runSteps.reduce((n, r) => n + r.seconds, 0) / 60,
                    rest: 0,
                    kg: null,
                    note: 'Log the total time, including the walking intervals. Follow the steps at an easy pace. If you walk through a prescribed running bout, repeat this stage before moving to longer running; total recorded minutes do not establish that every running bout was completed.'
                }];
        }
        else if (youth) {
            title = 'Youth foundation ' + (slot % 2 ? 'B' : 'A');
            var ids = slot % 2 ? [db ? 'squat' : 'bw-squat', 'bridge', 'pushup', gym ? 'pulldown' : db ? 'row' : 'lib-band-standing-row', 'calf', 'deadbug'] : ['bw-squat', 'bridge', 'pushup', db ? 'row' : 'lib-band-standing-row', 'split', 'deadbug'];
            items = ids.map((exerciseId, index) => ({
                exerciseId,
                sets: week >= 4 && index < week - 3 ? 2 : 1,
                reps: 8,
                rest: 90,
                kg: null,
                note: 'Your supervisor chooses the exercise variation and a light starting weight. Take more rest when needed.'
            }));
        }
        else if (template === 'AT03') {
            title = 'Strength ' + ['A', 'B', 'C'][slot];
            var ts = recipes.default.adult.find(x => x.id === 'AT03').sessions[slot];
            items = strengthMenus[slot].map((exerciseId, j) => {
                var item = ts.slots[j];
                var primary = item.reps[0] === 3, secondary = item.reps[0] === 5;
                return {
                    exerciseId,
                    sets: item.sets,
                    reps: primary ? [3, 4, 5, 3, 4, 5][cycle] : secondary ? [5, 6, 7, 8, 8, 8][cycle] : [8, 9, 10, 11, 12, 12][cycle],
                    rest: item.rest_seconds,
                    kg: null
                };
            });
        }
        else if (template === 'AT02') {
            title = ['Upper A', 'Lower A', 'Upper B', 'Lower B'][slot];
            var _ts = recipes.default.adult.find(x => x.id === 'AT02').sessions[slot % 2];
            items = hypertrophyMenus[slot].map((exerciseId, j) => {
                var item = _ts.slots[j];
                return {
                    exerciseId,
                    sets: item.sets,
                    reps: item.reps[0] === 10 ? [10, 11, 12, 13, 14, 15][cycle] : [8, 9, 10, 11, 12, 12][cycle],
                    rest: item.rest_seconds,
                    kg: null
                };
            });
        }
        else {
            title = (template === 'AT04' ? 'Home foundation ' : 'Full-body ') + (slot % 2 ? 'B' : 'A');
            var _ids = template === 'AT04' ? home : slot % 2 ? foundationB : foundationA;
            items = _ids.map((exerciseId, j) => {
                var trunk = exerciseId === 'deadbug', calf = exerciseId === 'calf', push = template === 'AT04' && exerciseId === 'pushup';
                return {
                    exerciseId,
                    sets: week === 1 ? 1 : (template === 'AT04' ? j < 4 : j < 4) ? 2 : 1,
                    reps: trunk ? [6, 6, 7, 8, 9, 10][cycle] : calf ? [10, 10, 11, 12, 13, 14][cycle] : push ? [6, 6, 7, 8, 9, 10][cycle] : [8, 8, 9, 10, 11, 12][cycle],
                    rest: trunk ? 60 : calf || exerciseId === 'ohp' ? 90 : 120,
                    kg: null
                };
            });
        }
        if (!tracking && !run && !youth)
            items = items.map(i => rangeItem(i, template, title));
        if (!tracking) {
            var inventoryError = resolveInventory(items, p);
            if (inventoryError)
                return {
                    v: {
                        plan: null,
                        errors: [inventoryError]
                    }
                };
        }
        var estimated = estimateSessionMinutes(items);
        var minutes = tracking ? p.minutes : run ? Math.ceil(runSteps.reduce((n, r) => n + r.seconds, 0) / 60) + 5 : youth ? Math.max(40, estimated) : Math.max(template === 'AT03' ? 50 : template === 'AT02' ? 60 : 30, estimated);
        if (minutes > p.minutes)
            return {
                v: {
                    plan: null,
                    errors: [`${title} in week ${week} needs about ${minutes} minutes including work, rest and setup. Increase your time or choose a smaller foundation template.`]
                }
            };
        var prior = run ? sessions.length ? [sessions[sessions.length - 1].id] : [] : priorByTitle[title]?.slice(youth ? -2 : -1) || [];
        var ss = {
            id: id + '-s' + index,
            date,
            week,
            title,
            kind: tracking ? 'Tracking' : run ? 'Run/walk' : 'Strength',
            minutes,
            items,
            status: 'scheduled',
            runSteps,
            dependsOn: tracking ? [] : prior,
            progressionStep: tracking ? 'User-entered targets' : run ? 'Accepted source sequence' : youth ? 'Start with one controlled set. From week 4, add a second set to at most one exercise each time the workout repeats, after two comfortable sessions with your supervisor.' : 'Accepted repetition schedule; loads stay individually selected'
        };
        sessions.push(ss);
        priorByTitle[title] = [...(priorByTitle[title] || []), ss.id];
    }, _ret3;
    for (var offset = 0; offset < p.weeks * 7; offset++) {
        _ret3 = _loop3();
        if (_ret3 === 0)
            continue;
        if (_ret3)
            return _ret3.v;
    }
    if (!sessions.length)
        return {
            plan: null,
            errors: ['This schedule has no workouts. Choose valid available weekdays.']
        };
    var conflict = sessions.filter(x => events.some(e => e.date === x.date));
    if (conflict.length)
        return {
            plan: null,
            errors: [`${conflict.length} proposed session(s) share a date with a fixed commitment. Change availability/start date or use tracking. No commitment was moved.`]
        };
    var label = tracking ? p.mode === 'coach' ? 'Coach-directed tracking' : 'Manual training' : run ? 'Beginner run/walk' : youth ? `${p.sport} · youth foundation` : template === 'AT02' ? 'Hypertrophy · upper/lower' : template === 'AT03' ? 'Strength · full body' : p.goal === 'sport' ? `${p.sport} · general strength foundation` : template === 'AT04' ? 'Calisthenics / home foundation' : 'Full-body foundation';
    var notes = tracking ? ['Empty session slots are placeholders. Add your coach’s or your own actual exercise targets before logging.', 'The app does not supply extra sessions, change the coach’s sets and reps, or infer skill from minutes.'] : [youth ? 'Qualified youth instruction and supervision are required each session. A reported supervisor is not app-verified technique.' : run ? 'Follow the NHS timed running and walking steps at an easy effort. Repeat a week when needed; walking is part of the plan.' : 'Choose a starting weight after practicing the exercise, or use your recent results from the same exercise and setup.', run ? 'The running and walking durations follow the NHS sequence. Completion, feedback and review gates are app choices.' : 'The exercise selection and progression rules are this app’s choices, informed by the sources listed below.', 'All estimated session times include warm-up, rest, setup and transitions; actual required rest can be longer.'];
    if (!tracking && template === 'AT04')
        notes.push('This home template requires a resistance band and a suitable secure anchor for rows. If unavailable, use manual tracking or select equipment; do not improvise an anchor.');
    if (!tracking && p.goal === 'hybrid')
        notes.push('This block develops the strength foundation. Sprint and jump training remain a separate supervised module; selecting athleticism does not add unreviewed maximal work.');
    if (!tracking && p.goal === 'sport')
        notes.push('Sport and position provide context. This is a general foundation, not an independently validated position-specific prescription.');
    if (!tracking && run)
        notes.push('Three nonconsecutive sessions. The accepted source sequence progresses only after the prior session is completed. Longer running bouts also wait for comfortable feedback and no reported symptoms; repeat a stage when needed. Thirty minutes of running is not a guaranteed 5 km.');
    var progression = tracking ? 'You or your coach decide when to change the targets.' : youth ? 'Start with one set of 8 reps for the first three weeks. From week 4, a second set can be added to one more exercise each time the workout repeats. First, complete two comparable sessions that felt comfortable, with your supervisor’s confirmation. Reps and weight do not increase together. Missing workouts or feedback pause progression. Review weight or exercise changes separately.' : run ? 'Accepted baseline: the displayed NHS run/walk sequence, in order. Complete the preceding session before advancing; longer running bouts also need comfortable feedback and no reported symptoms. Missed or partial work leaves progression waiting. Repeats, reductions and day moves are separate proposals.' : RANGE_PROGRESSION;
    var phases = p.weeks <= 3 ? [{
            name: 'Foundation',
            weeks: `1–${p.weeks}`,
            description: 'Find a comfortable starting point, follow the plan and review how it went.'
        }] : [{
            name: 'Familiarize',
            weeks: '1–2',
            description: tracking ? 'Enter your workouts and build a regular logging habit.' : run ? 'Find an easy running pace and get used to the walk breaks.' : 'Practice each exercise and find a weight you can control.'
        }, {
            name: 'Build',
            weeks: `3–${p.weeks - 1}`,
            description: 'Complete the earlier workouts before moving to the next targets.'
        }, {
            name: 'Review',
            weeks: String(p.weeks),
            description: 'Use your workout history to choose your next plan or maintain your current routine.'
        }];
    return {
        errors: [],
        plan: {
            id,
            name: label,
            version: 1,
            progressionModel: !tracking && !run && !youth ? 'ranges' : undefined,
            profile: {
                ...p,
                days
            },
            acceptedAt: null,
            sessions,
            phases,
            evidence: run ? ['NHS-C25K'] : youth ? ['AAP-2020', 'NSCA-YOUTH', 'IOC-YOUTH'] : ['ACSM-2026', 'ACSM-2009'],
            notes,
            progression,
            template,
            paused: false
        }
    };
}
function latestSessionRecord(s, id) {
    return s.history.filter(w => w.sessionId === id && w.finishedAt).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))[0];
}
function competitionConflict(profile, date, events) {
    if (profile.mode !== 'app')
        return null;
    var e = events.find(e => e.kind === 'Competition' && dayDistance(date, e.date) >= 0 && dayDistance(date, e.date) <= (e.priority === 'Normal' ? 1 : 2));
    return e ? `This date is protected for ${e.name} on ${niceDate(e.date)}. Review another training date. Competition buffers are app planning rules, not a guarantee of recovery.` : null;
}
// A changed total session time cannot identify a harder running stage: the NHS
// sequence can shorten the whole workout while lengthening its continuous run.
// Only staged introductions use this gate; accepted short/long base-run layouts
// retain their separate, fixed prescriptions.
function advancesRunningStage(plan, previous, next) {
    if (!previous.runSteps?.length || !next.runSteps?.length)
        return false;
    var def = _programCatalog.programCatalog.find(d => d.id === plan.template);
    var staged = plan.template === 'RUN-WALK' || next.progressionStep?.startsWith('Two-week walk–run stages') ||
        def?.slots.some(s => s.kind === 'walkrun' || s.runStages?.length > 1);
    if (!staged)
        return false;
    var measure = steps => {
        var bouts = steps.filter(s => /\b(run|jog)/i.test(s.label) && !/recovery|warm-up|cool-down/i.test(s.label));
        return {total: bouts.reduce((n, s) => n + s.seconds, 0), longest: Math.max(0, ...bouts.map(s => s.seconds)),
            recovery: steps.filter(s => /recovery/i.test(s.label)).reduce((n, s) => n + s.seconds, 0)};
    };
    var before = measure(previous.runSteps), after = measure(next.runSteps);
    return after.total > before.total || after.longest > before.longest ||
        after.total > 0 && before.total > 0 && after.recovery < before.recovery;
}
function eligibility(s, target) {
    if (!s.plan)
        return 'No active plan.';
    if (target.status !== 'scheduled')
        return 'This session is already recorded or missed. Open its history instead.';
    if (target.needsReview)
        return 'An earlier workout changed. Review this workout’s targets before continuing.';
    if (s.plan.paused)
        return 'Your plan is paused.';
    if (s.events.some(e => e.date === target.date))
        return 'A fixed commitment conflicts with this date. Review the schedule first.';
    if (s.plan.profile.mode !== 'app')
        return target.items.length ? null : 'Add the coach’s or your own exercises and targets before starting.';
    if (s.hold)
        return 'Automated recommendations are on hold after a reported concern.';
    var competitionIssue = competitionConflict(s.plan.profile, target.date, s.events);
    if (competitionIssue)
        return competitionIssue;
    var focusIssue = (0, _trainingFocus.focusScheduleConflict)(s.plan, s.events, target);
    if (focusIssue)
        return focusIssue;
    if (s.plan.profile.age < 18 && !s.plan.profile.supervision)
        return 'Qualified supervision is required for this youth pathway.';
    var _loop4 = function (dep) {
        var expected = s.plan.sessions.find(x => x.id === dep), work = latestSessionRecord(s, dep);
        if (!expected || !work || work.partial)
            return {
                v: s.plan.progressionModel === 'source' ? 'Source order is waiting for a missed or partial workout. Restore and move a skipped workout, or review a new opening source block after incomplete work. No successful or failed attempt is inferred.' : 'Progression is waiting for a missed or incomplete prerequisite. Review a repeat or return option; no fitness loss is assumed.'
            };
        if (s.plan.profile.age < 18 && target.items.some(i => i.sets > 1) && expected?.items.some(i => i.sets === 1) && (work.effort !== 'right' && work.effort !== 'easier' || work.symptom !== 'no'))
            return {
                v: 'More sets wait for two comfortable supervised sessions with no reported symptoms. Review a repeat if that feedback is missing.'
            };
        if (s.plan.profile.age < 18 && !work.supervisorConfirmed)
            return {
                v: 'Progression waits for the reported qualified supervisor’s confirmation for comparable work.'
            };
        if (expected.items.some(i => isLoadTracked(exFor(i.exerciseId, s.custom)) && work.sets.some(x => x.exerciseId === i.exerciseId && x.done && x.kg === null)))
            return {
                v: 'Record the actual load for loaded exercises before using this history to advance. Unknown load stays unknown.'
            };
        if (expected.items.some(i => {
            var logs = work.sets.filter(x => x.exerciseId === i.exerciseId && x.done);
            return logs.length < i.sets || logs.some(x => s.plan.progressionModel === 'source' ? x.reps <= 0 : x.reps < i.reps);
        }))
            return {
                v: 'The earlier workout’s targets are unfinished. Review a repeat or an easier target before moving on.'
            };
        if (advancesRunningStage(s.plan, expected, target) &&
            (!['right', 'easier'].includes(work.effort) || work.symptom !== 'no'))
            return {v: 'A longer jogging stage waits for comfortable completed work and no reported symptoms. Review a repeat when that feedback is missing or the earlier stage was too hard.'};
    }, _ret4;
    for (var dep of target.dependsOn || []) {
        _ret4 = _loop4(dep);
        if (_ret4)
            return _ret4.v;
    }
    return null;
}
function initialState() {
    var p = {
        ...blankProfile,
        goal: 'strength',
        programId: undefined
    };
    var today = new Date().getDay();
    p.days = [today, (today + 2) % 7, (today + 4) % 7].sort();
    var plan = buildPlan(p).plan;
    plan.acceptedAt = new Date().toISOString();
    return {
        schema: 3,
        profile: p,
        plan,
        history: [],
        active: null,
        proposals: [],
        events: [],
        custom: [],
        ratings: {},
        audit: [],
        saved: [],
        checkins: true,
        soreness: false,
        hold: false,
        simulatedOffline: false
    };
}
function nextSession(s) {
    return s.plan?.sessions.filter(x => x.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];
}
function changed(s, message) {
    return {
        ...s,
        audit: [{
                at: new Date().toISOString(),
                message
            }, ...s.audit].slice(0, 150)
    };
}
function makeProposal(s, type, input) {
    var plan = s.plan, session = nextSession(s);
    if (!plan || !session || plan.profile.mode !== 'app' || s.hold || plan.paused)
        return null;
    if (type === 'capacity')
        return makeCapacityProposal(s);
    if (type === 'load')
        return makeLoadProposal(s).proposal || null;
    if (type === 'ranges')
        return makeRangeProposal(s);
    if (type === 'move')
        return input ? makeMoveProposal(s, session.id, input, false).proposal || null : null;
    if (plan.progressionModel === 'source')
        return null;
    var title = 'Adjust next session', reason = '', before = '', after = '', patch = {};
    if (type === 'return' && Boolean(session.runSteps)) {
        var first = plan.sessions.find(x => x.runSteps);
        title = 'Restart with the opening run/walk stage';
        reason = 'After an interruption, review the opening source sequence before resuming. This conservative prototype choice does not estimate fitness loss.';
        before = session.title;
        after = 'Opening run/walk stage · review later progression';
        patch = {
            items: first.items.map(i => ({
                ...i
            })),
            runSteps: first.runSteps,
            title: first.title + ' · restart',
            minutes: first.minutes,
            dependsOn: [],
            needsReview: false
        };
    }
    else if (type === 'return') {
        title = 'Resume with a shorter familiar session';
        reason = 'Your recent training needs context. This conservative restart choice is a prototype default, not a calculated loss of fitness.';
        before = `${session.items.reduce((n, i) => n + i.sets, 0)} working sets`;
        patch = {
            items: session.items.map(i => ({
                ...i,
                sets: Math.min(i.sets, 1),
                kg: null,
                loadContext: undefined
            })),
            dependsOn: [],
            needsReview: false
        };
        after = `${patch.items.reduce((n, i) => n + i.sets, 0)} working sets · choose a manageable load again`;
    }
    else if (type === 'sets' && Boolean(session.runSteps)) {
        var previous = plan.sessions.filter(x => x.runSteps && x.date < session.date && x.status === 'completed').at(-1) || plan.sessions.find(x => x.runSteps);
        title = 'Repeat the familiar run/walk stage';
        reason = 'Harder-than-expected feedback can justify repeating a familiar stage. This is a proposed repeat, not an automatic percentage cut.';
        before = session.title;
        after = previous.title + ' · repeat';
        patch = {
            items: previous.items.map(i => ({
                ...i
            })),
            runSteps: previous.runSteps,
            title: previous.title + ' · repeat',
            minutes: previous.minutes,
            dependsOn: [],
            needsReview: false
        };
    }
    else if (type === 'sets') {
        var index = session.items.findIndex(i => i.sets > 1);
        if (index < 0)
            return null;
        title = 'Reduce the next session’s work';
        reason = 'You reported that the session was harder than expected. One report does not measure recovery; this is a small, reversible option.';
        var old = session.items[index];
        before = `${exFor(old.exerciseId, s.custom).name}: ${old.sets} sets`;
        patch = {
            items: session.items.map((i, j) => j === index ? {
                ...i,
                sets: i.sets - 1
            } : i)
        };
        after = `${exFor(old.exerciseId, s.custom).name}: ${old.sets - 1} sets · same load and reps`;
    }
    else if (type === 'substitute')
        return null; // Replaced by curated, version-checked equipment substitution previews.
    else {
        var _index = session.items.findIndex(i => exFor(i.exerciseId, s.custom).metric === 'reps' && s.history.some(w => !w.partial && w.sets.filter(x => x.exerciseId === i.exerciseId && x.done).length >= i.sets && w.sets.filter(x => x.exerciseId === i.exerciseId && x.done).every(x => x.reps >= i.reps && (!isLoadTracked(exFor(i.exerciseId, s.custom)) || x.kg !== null))));
        if (_index < 0)
            return null;
        var _old = session.items[_index];
        title = 'Add one repetition per set';
        reason = 'You marked the workout easier than expected. Check your recent sets and technique before adding a rep. One extra rep is this app’s suggested step.';
        before = `${exFor(_old.exerciseId, s.custom).name}: ${_old.sets} × ${_old.reps}`;
        after = `${_old.sets} × ${_old.reps + 1} · same load`;
        patch = {
            items: session.items.map((i, j) => j === _index ? {
                ...i,
                reps: i.reps + 1
            } : i)
        };
    }
    var continuation;
    if (type === 'return') {
        if (s.active)
            return null;
        var _previous = {};
        var openingRun = plan.sessions.find(x => x.runSteps);
        continuation = plan.sessions.filter(x => x.status === 'scheduled' && x.date >= session.date).sort((a, b) => a.date.localeCompare(b.date)).map(x => {
            var running = !!x.runSteps, key = running ? 'run' : x.roleId || x.title.replace(' · review week', '');
            var items = running && openingRun ? openingRun.items.map(i => ({
                ...i
            })) : x.items.map(i => ({
                ...i,
                sets: 1,
                kg: null,
                loadContext: undefined
            }));
            var next = {
                items,
                dependsOn: _previous[key] ? [_previous[key]] : [],
                needsReview: false,
                progressionStep: 'Reviewed return block: repeat the displayed manageable work. More work needs another accepted change.'
            };
            if (running && openingRun) {
                next.runSteps = openingRun.runSteps;
                next.minutes = openingRun.minutes;
                next.title = 'Return · repeat opening walk/run';
            }
            else
                next.minutes = Math.min(x.minutes, estimateSessionMinutes(items, x.timeProfile === 'brief', s.custom));
            _previous[key] = x.id;
            return {
                sessionId: x.id,
                patch: next
            };
        });
        patch = continuation[0]?.patch || patch;
        title = 'Review a shorter return block';
        reason = 'Resume with one work set per strength exercise and the opening walk/run sequence where applicable. The remaining block repeats this reduced work, without an automatic ramp back. Your dates and completed records stay unchanged. This is a conservative planning option, not medical clearance.';
        before = continuation.length + ' remaining scheduled workouts';
        after = continuation.length + ' shorter workouts · choose manageable loads again · no automatic return to prior volume';
    }
    return {
        id: uid('proposal'),
        title,
        reason,
        type,
        planId: plan.id,
        baseVersion: plan.version,
        historyCount: s.history.length,
        sessionId: session.id,
        before,
        after,
        status: 'pending',
        patch,
        ...(continuation ? {
            changes: continuation
        } : {}),
        source: plan.evidence[0],
        createdAt: new Date().toISOString()
    };
}
function applyProposal(s, id) {
    var p = s.proposals.find(x => x.id === id);
    if (!p || p.status !== 'pending')
        return {
            state: s,
            error: 'This proposal is no longer pending.'
        };
    var stale = message => ({
        state: {
            ...s,
            proposals: s.proposals.map(x => x.id === id ? {
                ...x,
                status: 'stale'
            } : x)
        },
        error: message
    });
    if (!s.plan || s.plan.id !== p.planId || s.plan.version !== p.baseVersion || p.historyCount !== undefined && p.historyCount !== s.history.length)
        return stale('The plan or history changed. Create a fresh preview.');
    if (p.type === 'substitute')
        return stale('This older substitute preview is no longer supported. Choose a substitute beside the exercise to review its equipment, targets and separate history.');
    if (p.eventSignature !== undefined && p.eventSignature !== eventSignature(s))
        return stale('Your commitments changed. Preview these dates again.');
    if (p.type !== 'move' && (s.hold || s.plan.paused))
        return {
            state: s,
            error: 'Automated training changes are on hold or paused.'
        };
    if (p.type !== 'move' && s.plan.profile.mode !== 'app')
        return {
            state: s,
            error: 'Coach-directed and manual targets stay under your control.'
        };
    var changes = p.changes || [{
            sessionId: p.sessionId,
            patch: p.patch
        }];
    if (p.type === 'move') {
        if (changes.some(c => Object.keys(c.patch).some(k => k !== 'date')))
            return stale('A date change cannot alter workout targets or history. Preview it again.');
    }
    else {
        var expected = p.type === 'ranges' ? makeRangeProposal(s) : p.type === 'load' ? makeLoadProposal(s).proposal : makeProposal(s, p.type);
        if (!expected || !sameData(changes, expected.changes || [{
                sessionId: expected.sessionId,
                patch: expected.patch
            }]))
            return stale('This change does not match a current, checked training proposal. Preview it again.');
    }
    if (!changes.length || new Set(changes.map(c => c.sessionId)).size !== changes.length)
        return {
            state: s,
            error: 'This preview is invalid. Create a fresh one.'
        };
    var _loop5 = function (c) {
        var x = s.plan.sessions.find(x => x.id === c.sessionId);
        if (!x || x.status !== 'scheduled' || s.active?.sessionId === x.id || s.history.some(w => w.sessionId === x.id && w.finishedAt))
            return {
                v: stale('A selected session has started, finished or been skipped. Preview again.')
            };
        if (c.beforeDate && c.beforeDate !== x.date)
            return {
                v: stale('A date changed. Preview again.')
            };
    }, _ret5;
    for (var c of changes) {
        _ret5 = _loop5(c);
        if (_ret5)
            return _ret5.v;
    }
    if (p.type === 'move') {
        var error = checkSchedule(s, changes);
        if (error)
            return {
                state: s,
                error
            };
    }
    if (p.type === 'load' && s.plan.progressionModel !== 'source') {
        var ss = s.plan.sessions.find(x => x.id === p.sessionId);
        var _loop6 = function (next) {
            var old = ss?.items.find(i => i.exerciseId === next.exerciseId);
            if (old && next.kg !== old.kg) {
                var latest = loadSuggestion(s, old);
                if (latest.nextKg === undefined || next.kg === null || Math.abs(latest.nextKg - next.kg) > 1e-6)
                    return {
                        v: stale('The load evidence or equipment changed. Review a fresh load suggestion.')
                    };
            }
        }, _ret6;
        for (var next of p.patch.items || []) {
            _ret6 = _loop6(next);
            if (_ret6)
                return _ret6.v;
        }
    }
    if (s.simulatedOffline)
        return {
            state: changed({
                ...s,
                proposals: s.proposals.map(x => x.id === id ? {
                    ...x,
                    status: 'queued'
                } : x)
            }, 'Offline acceptance queued; targets unchanged.'),
            error: 'Queued only. Reconnect, review and confirm before anything changes.'
        };
    var affected = new Set();
    if (!['move', 'ranges', 'load', 'capacity'].includes(p.type)) {
        affected.add(p.sessionId);
        for (var _ss of s.plan.sessions)
            if (_ss.dependsOn?.some(id => affected.has(id)))
                affected.add(_ss.id);
    }
    var sessions = s.plan.sessions.map(x => {
        var c = changes.find(c => c.sessionId === x.id);
        return c ? {
            ...x,
            ...c.patch
        } : affected.has(x.id) ? {
            ...x,
            needsReview: true
        } : x;
    }).sort((a, b) => a.date.localeCompare(b.date));
    var plan = {
        ...s.plan,
        version: s.plan.version + 1,
        sessions,
        scheduleEnd: sessions.at(-1)?.date,
        ...(p.type === 'ranges' ? {
            progressionModel: 'ranges',
            progression: RANGE_PROGRESSION
        } : {})
    };
    return {
        state: changed({
            ...s,
            plan,
            proposals: s.proposals.map(x => x.id === id ? {
                ...x,
                status: 'accepted'
            } : x.status === 'pending' || x.status === 'queued' ? {
                ...x,
                status: 'stale'
            } : x)
        }, `Accepted: ${p.title}. ${changes.length} session(s) updated. Completed history unchanged.`)
    };
}
function validateImport(raw) {
    if (raw.length > 100000)
        return {
            error: 'This import is too large. Use up to 30 exercises and 100,000 characters.'
        };
    try {
        var data = JSON.parse(raw);
        if (!Array.isArray(data.exercises) || data.exercises.length < 1 || data.exercises.length > 30)
            return {
                error: 'Use an exercises array containing 1–30 items.'
            };
        var clean = [];
        for (var e of data.exercises) {
            if (typeof e.name !== 'string' || e.name.trim().length < 2 || e.name.length > 100 || !['reps', 'seconds', 'minutes'].includes(e.metric))
                return {
                    error: 'Each exercise needs a name (2–100 characters) and metric: reps, seconds, or minutes.'
                };
            clean.push({
                id: uid('custom'),
                name: e.name.trim(),
                pattern: 'Custom',
                equipment: 'Custom',
                metric: e.metric,
                cues: ['User-provided exercise. Automated progression and technique assessment are unavailable.'],
                custom: true
            });
        }
        return {
            exercises: clean
        };
    }
    catch {
        return {
            error: 'This is not valid JSON. No changes were made.'
        };
    }
}
var RANGE_PROGRESSION = 'Stay within the listed rep range and finish most sets with about 2–3 good reps left. Keep the weight steady while you build reps. After two comparable workouts at the top of the range with at least 2 reps left, review a small weight increase and return to the lower end of the range. These thresholds are this app’s rules. Weight changes based on feedback, and all date changes, need your approval.';
function validDay(v) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v))
        return false;
    var [y, m, d] = v.split('-').map(Number);
    var x = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && y <= 2200 && x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
}
function dayDistance(a, b) {
    if (!validDay(a) || !validDay(b))
        return NaN;
    var parse = x => {
        var [y, m, d] = x.split('-').map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return (parse(b) - parse(a)) / 86400000;
}
function rangeItem(i, template, title = '') {
    if (exFor(i.exerciseId).metric !== 'reps')
        return {
            ...i
        };
    var lo = i.repMin, hi = i.repMax;
    if (lo === undefined || hi === undefined) {
        if (template === 'AT03' && ['bar-squat', 'bench', 'deadlift', 'ohp'].includes(i.exerciseId) && i.reps <= 8) {
            var main = title === 'Strength A' && ['bar-squat', 'bench'].includes(i.exerciseId) || title === 'Strength B' && i.exerciseId === 'deadlift';
            [lo, hi] = main ? [3, 5] : [5, 8];
        }
        else if (template === 'AT03')
            [lo, hi] = [8, 12];
        else if (template === 'AT02' && ['calf', 'lateral', 'curl', 'triceps', 'leg-curl', 'leg-extension'].includes(i.exerciseId) || i.exerciseId === 'calf')
            [lo, hi] = [10, 15];
        else if (i.exerciseId === 'deadbug')
            [lo, hi] = template === 'AT02' ? [8, 12] : [6, 10];
        else if (template === 'AT04' && i.exerciseId === 'pushup')
            [lo, hi] = [6, 12];
        else
            [lo, hi] = [8, 12];
    }
    return {
        ...i,
        repMin: lo,
        repMax: hi,
        reps: lo
    };
}
function targetText(i) {
    if (i.sourceRule?.kind === 'hold')
        return 'controlled hold';
    var target = i.repMin !== undefined && i.repMax !== undefined ? i.repMin === i.repMax ? String(i.repMin) : `${i.repMin}–${i.repMax}` : String(i.reps);
    return target + (i.sourceRule?.amrapLast ? ' (last set +)' : '');
}
function loadConvention(id, custom = []) {
    return exFor(id, custom).loadConvention || 'Not configured. Choose a logging convention before enabling progression.';
}
function exerciseRecords(s, id) {
    return s.history.filter(w => w.finishedAt && Array.isArray(w.sets) && w.sets.some(x => x.exerciseId === id && x.done)).sort((a, b) => b.date.localeCompare(a.date) || (b.finishedAt || 0) - (a.finishedAt || 0));
}
function comparableSet(x) {
    return !['Left', 'Right', 'Alternating'].includes(x.metrics?.side || '') && !(x.metrics?.assistanceKg && x.metrics.assistanceKg > 0);
}
function equipmentLimit(s, exerciseId) {
    var e = exFor(exerciseId, s.custom), setup = requiresSetup(e) ? s.loadContext?.[exerciseId] || '' : '';
    var exact = s.equipmentCaps?.find(c => c.exerciseId === exerciseId && c.setup === setup)?.maxKg;
    var dumbbell = e.equipment === 'Dumbbell' ? s.profile.dumbbellMaxKg : undefined;
    var limits = [exact, dumbbell].filter(n => n !== undefined && Number.isFinite(n) && n >= 0);
    return limits.length ? Math.min(...limits) : undefined;
}
function setEquipmentLimit(s, exerciseId, maxKg) {
    var e = exFor(exerciseId, s.custom), setup = requiresSetup(e) ? s.loadContext?.[exerciseId] || '' : '';
    if (s.active)
        return {
            state: s,
            error: 'Finish or save the active workout before changing equipment.'
        };
    if (!isLoadTracked(e) || requiresSetup(e) && !setup.trim())
        return {
            state: s,
            error: 'Choose a load-tracked exercise and label the exact machine setup first.'
        };
    if (maxKg !== undefined && (!Number.isFinite(maxKg) || maxKg < 0 || maxKg > 1500))
        return {
            state: s,
            error: 'Enter a valid maximum load, or leave it blank if unknown.'
        };
    var rest = (s.equipmentCaps || []).filter(c => !(c.exerciseId === exerciseId && c.setup === setup));
    if (maxKg !== undefined && rest.length >= 500)
        return {
            state: s,
            error: 'This demo holds 500 equipment limits. Remove an unused limit first.'
        };
    return {
        state: changed({
            ...s,
            equipmentCaps: maxKg === undefined ? rest : [...rest, {
                    exerciseId,
                    setup,
                    maxKg
                }],
            proposals: s.proposals.map(p => p.status === 'pending' || p.status === 'queued' ? {
                ...p,
                status: 'stale'
            } : p)
        }, 'Updated equipment limit for ' + e.name)
    };
}
function loadSuggestion(s, i) {
    var ex = exFor(i.exerciseId, s.custom);
    var fit = (0, _equipment.equipmentFit)(ex, s.profile);
    if (s.profile.inventory?.confirmed && !fit.available)
        return {
            kg: null,
            reason: fit.reason + ' Choose an available substitute or review equipment; past records stay intact.'
        };
    if ((s.profile.mode !== 'app' || !ex.progressionEnabled) && i.kg !== null && isLoadTracked(ex) && ex.metric === 'reps') {
        var ownerLimit = equipmentLimit(s, i.exerciseId);
        if (s.hold || s.profile.age < 18 || !Number.isFinite(i.kg) || i.kg < 0 || ownerLimit !== undefined && (ownerLimit === 0 || i.kg > ownerLimit + 1e-6) || requiresSetup(ex) && (!i.loadContext || i.loadContext !== s.loadContext?.[i.exerciseId]))
            return {kg: null, reason: 'Reassess this starting weight with the current setup and equipment before using it.'};
        return {kg: i.kg, reason: s.profile.mode === 'app' ? 'Starting weight reviewed for this exercise. Review any changes to this variation yourself.' : 'Starting weight reviewed for your tracking plan. You or your coach decide what to perform and when to change it.'};
    }
    if (s.plan?.progressionModel === 'source')
        return (0, _sourcePrograms.sourceLoadSuggestion)(s, i);
    if (!ex.progressionEnabled || ex.metric !== 'reps' || !isLoadTracked(ex))
        return {
            kg: null,
            reason: 'Choose the resistance or assistance for this exact variation.'
        };
    if (s.hold)
        return {
            kg: null,
            reason: 'Load suggestions are on hold after a concern.'
        };
    var limit = equipmentLimit(s, i.exerciseId);
    if (limit === 0)
        return {
            kg: null,
            reason: 'This equipment is marked unavailable. Choose an available substitute or update its limit.'
        };
    if (limit !== undefined && i.kg !== null && i.kg > limit + 1e-6)
        return {
            kg: null,
            reason: 'The accepted weight exceeds your equipment limit. Choose a manageable weight from the equipment available.'
        };
    if (i.kg !== null && requiresSetup(ex) && (!i.loadContext || i.loadContext !== s.loadContext?.[i.exerciseId]))
        return {
            kg: null,
            reason: 'This weight was chosen for a different or unrecorded machine setup. Start light and check a suitable weight for this setup.'
        };
    if (i.kg !== null && Number.isFinite(i.kg))
        return {
            kg: i.kg,
            reason: 'Accepted load for this session. Reassess during your warm-up.'
        };
    var records = exerciseRecords(s, i.exerciseId).filter(r => {
        var t = r.targets?.find(t => t.exerciseId === i.exerciseId);
        return t && (t.loadRole || '') === (i.loadRole || '') && (t.repMin ?? t.reps) === (i.repMin ?? i.reps) && t.repMax === i.repMax && (!requiresSetup(ex) || r.loadContext?.[i.exerciseId] === s.loadContext?.[i.exerciseId]);
    }), w = records[0];
    var machine = requiresSetup(ex);
    if (machine && !s.loadContext?.[i.exerciseId])
        return {
            kg: null,
            reason: 'Add the machine and setup label above the set log, then record work with that setup before reusing its load.'
        };
    if (!w)
        return {
            kg: null,
            reason: 'No comparable history for this range and setup yet. Start with a controllable light resistance, then record the actual load.'
        };
    var log = w.sets.filter(x => x.exerciseId === i.exerciseId && x.done), kg = log[0]?.kg, lo = i.repMin ?? i.reps;
    if (w.partial || ['yes', 'unsure'].includes(w.symptom || '') || w.effort === 'harder' || log.length < i.sets || kg === null || kg === undefined || kg <= 0 || log.some(x => x.kg !== kg || x.reps < lo || !comparableSet(x)))
        return {
            kg: null,
            date: w.date,
            reason: 'Your recent sets do not give us a reliable starting weight for this target. Check your history, then start light and adjust during the warm-up.'
        };
    if (dayDistance(w.date, day()) < 0 || dayDistance(w.date, day()) > 35)
        return {
            kg: null,
            date: w.date,
            reason: 'Your last matching workout was over five weeks ago. Review your return plan and check a manageable starting weight.'
        };
    if ((s.plan?.profile.age ?? s.profile.age) < 18)
        return {
            kg: null,
            date: w.date,
            reason: 'Youth loads need the qualified supervisor’s selection; the history remains available.'
        };
    if (limit !== undefined && kg > limit + 1e-6)
        return {
            kg: null,
            date: w.date,
            reason: 'The previous weight exceeds your equipment limit. Choose an available weight you can control. Your past records stay the same.'
        };
    var hi = i.repMax;
    if (hi === undefined)
        return {
            kg,
            date: w.date,
            reason: 'Weight from your last matching workout. Preview rep ranges to build reps before increasing the weight.'
        };
    var successful = r => {
        var a = r.sets.filter(x => x.exerciseId === i.exerciseId && x.done), target = r.targets?.find(t => t.exerciseId === i.exerciseId);
        return (!machine || r.loadContext?.[i.exerciseId] === s.loadContext?.[i.exerciseId]) && !r.partial && r.symptom === 'no' && r.effort !== 'harder' && dayDistance(r.date, day()) <= 35 && target?.repMax === hi && target?.repMin === lo && a.length >= i.sets && a.every(x => x.kg === kg && x.reps >= hi && comparableSet(x) && validSetRir(x.rir) && x.rir >= 2);
    };
    var ready = records.length >= 2 && records.slice(0, 2).every(successful), step = s.incrementKg?.[i.exerciseId];
    if (ex.equipment === 'Dumbbell' && s.profile.inventory?.confirmed && s.profile.inventory.dumbbellLoading === 'fixed')
        return {
            kg,
            date: w.date,
            ready,
            atCapacity: true,
            reason: 'Your dumbbell weight is fixed. Keep this load and review more controlled reps or an appropriate variation. No heavier dumbbell is assigned.'
        };
    if (!ready)
        return {
            kg,
            date: w.date,
            reason: 'Repeat this recent load and build reps within the range. Record RIR for each work set. A load increase waits for two comparable top-of-range sessions with sufficient set effort feedback.'
        };
    if (limit !== undefined && (kg >= limit - 1e-6 || step && kg + step > limit + 1e-6))
        return {
            kg,
            date: w.date,
            ready: true,
            atCapacity: true,
            reason: 'You reached this equipment’s limit or its next available step would exceed it. Keep this load. For muscle-focused work, review a wider rep range; for heavy strength, choose suitable heavier equipment or maintain. This is an equipment limit, not a strength plateau.'
        };
    if (!step || !Number.isFinite(step) || step <= 0)
        return {
            kg,
            date: w.date,
            ready: true,
            reason: 'Top-of-range work is consistent. Enter the smallest available equipment increase to preview the next load.'
        };
    if (step / kg > 0.050000010000000004)
        return {
            kg,
            date: w.date,
            ready: true,
            coarseIncrement: true,
            reason: 'The next equipment step exceeds this app’s 5% automatic-increase limit. Keep the load; muscle-focused work can use a reviewed wider rep range. For heavier strength work, review a substitute or check an available weight during your warm-up. No heavier weight is assigned automatically.'
        };
    return {
        kg,
        nextKg: Math.round((kg + step) * 100000) / 100000,
        date: w.date,
        ready: true,
        reason: 'Two comparable top-of-range sessions with at least 2 reps left on every completed work set. Review the next available load; restart near the lower rep target.'
    };
}
function proposalBase(s, type, sessionId) {
    return {
        id: uid('proposal'),
        title: 'Review change',
        reason: '',
        type,
        planId: s.plan.id,
        baseVersion: s.plan.version,
        historyCount: s.history.length,
        sessionId,
        before: '',
        after: '',
        status: 'pending',
        patch: {},
        source: s.plan.evidence[0],
        createdAt: new Date().toISOString()
    };
}
function makeLoadProposal(s) {
    if (!s.plan || s.plan.profile.mode !== 'app' || s.plan.profile.age < 18 || s.hold || s.plan.paused)
        return {
            error: 'Automatic load increases require an adult app-directed plan without a hold. Youth loads stay with the supervisor.'
        };
    if (s.plan.progressionModel === 'source')
        return (0, _sourcePrograms.sourceLoadProposal)(s);
    for (var ss of s.plan.sessions.filter(x => x.status === 'scheduled' && !x.needsReview && x.id !== s.active?.sessionId).sort((a, b) => a.date.localeCompare(b.date))) {
        var _loop7 = function (item) {
            var a = loadSuggestion(s, item);
            if (a.nextKg !== undefined) {
                var p = proposalBase(s, 'load', ss.id);
                return {
                    v: {
                        proposal: {
                            ...p,
                            title: 'Increase ' + exFor(item.exerciseId, s.custom).name,
                            reason: a.reason + ' The app waits for two matching workouts and limits a suggested weight increase to 5%.',
                            before: displayLoad(a.kg, s.profile.units) + ' · ' + targetText(item) + ' reps',
                            after: displayLoad(a.nextKg, s.profile.units) + ' · restart at ' + (item.repMin ?? item.reps) + ' reps',
                            patch: {
                                items: ss.items.map(i => i === item ? {
                                    ...i,
                                    kg: a.nextKg,
                                    loadContext: s.loadContext?.[i.exerciseId],
                                    reps: i.repMin ?? i.reps
                                } : i)
                            }
                        }
                    }
                };
            }
        }, _ret7;
        for (var item of ss.items) {
            _ret7 = _loop7(item);
            if (_ret7)
                return _ret7.v;
        }
    }
    var capacity = makeCapacityProposal(s);
    if (capacity)
        return {
            proposal: capacity
        };
    return {
        error: 'No load increase is ready. Use a rep-range plan, log two comparable complete top-of-range sessions with exercise effort and no symptoms, then enter an available load step. Suggested repeat loads are shown in session details.'
    };
}
function makeCapacityProposal(s) {
    var plan = s.plan;
    if (!plan || plan.profile.mode !== 'app' || plan.profile.age < 18 || s.active || s.hold || plan.paused || plan.progressionModel === 'source' || ['powerlifting', 'strength'].includes(plan.profile.goal))
        return null;
    var considered = new Set();
    var _loop8 = function (ss) {
        var _loop9 = function (item) {
            var a = loadSuggestion(s, item), hi = item.repMax;
            if (!a.atCapacity && !a.coarseIncrement || !a.ready || a.kg === null || hi === undefined || hi < 10 || hi >= 20)
                return 0; // continue
            var roleKey = JSON.stringify([ss.roleId || ss.title, item.exerciseId, item.repMin, hi, item.loadRole]);
            if (considered.has(roleKey))
                return 0; // continue
            considered.add(roleKey);
            var nextHi = hi < 15 ? 15 : 20, nextLo = hi;
            var matches = plan.sessions.filter(x => x.status === 'scheduled' && !x.needsReview && x.date >= ss.date && (x.roleId || x.title) === (ss.roleId || ss.title));
            var changes = [];
            var fits = true;
            var _loop0 = function () {
                var old = x.items.find(i => i.exerciseId === item.exerciseId && i.repMin === item.repMin && i.repMax === hi && (i.loadRole || '') === (item.loadRole || ''));
                if (!old)
                    return 0; // continue
                var items = x.items.map(i => i === old ? {
                    ...i,
                    reps: nextLo,
                    repMin: nextLo,
                    repMax: nextHi,
                    kg: null,
                    loadContext: undefined,
                    note: 'Build reps with the equipment you have. Choose a weight that leaves 2–3 good reps left, and keep the same number of sets and the same rest.'
                } : i);
                var minutes = x.minutes + Math.max(0, estimateSessionMinutes(items, x.timeProfile === 'brief') - estimateSessionMinutes(x.items, x.timeProfile === 'brief'));
                if (minutes > plan.profile.minutes) {
                    fits = false;
                    return 1; // break
                }
                changes.push({
                    sessionId: x.id,
                    patch: {
                        items,
                        minutes
                    }
                });
            }, _ret0;
            for (var x of matches) {
                _ret0 = _loop0();
                if (_ret0 === 0)
                    continue;
                if (_ret0 === 1)
                    break;
            }
            if (!fits || !changes.length)
                return 0; // continue
            return {
                v: {
                    v: {
                        ...proposalBase(s, 'capacity', ss.id),
                        title: a.coarseIncrement ? 'Build reps before a large equipment step' : 'Build reps within your equipment limit',
                        reason: 'Two comfortable top-of-range sessions support reviewing more reps. The new range is an app choice informed by rep-progression research. It does not replace heavy-load practice for maximal strength. Recalibrate; keep the same set count and rest.',
                        source: 'REP-PROGRESSION',
                        before: exFor(item.exerciseId, s.custom).name + ' · ' + targetText(item) + ' reps',
                        after: nextLo + '–' + nextHi + ' reps · ' + changes.length + ' future matching sessions · available load only',
                        changes
                    }
                }
            };
        }, _ret9;
        for (var item of ss.items) {
            _ret9 = _loop9(item);
            if (_ret9 === 0)
                continue;
            if (_ret9)
                return _ret9.v;
        }
    }, _ret8;
    for (var ss of plan.sessions.filter(x => x.status === 'scheduled' && !x.needsReview).sort((a, b) => a.date.localeCompare(b.date))) {
        _ret8 = _loop8(ss);
        if (_ret8)
            return _ret8.v;
    }
    return null;
}
function makeRangeProposal(s) {
    if (!s.plan || s.active || s.plan.profile.mode !== 'app' || s.plan.profile.age < 18 || s.plan.template === 'RUN-WALK' || s.plan.progressionModel === 'source' || s.plan.progressionModel === 'ranges')
        return null;
    var sessions = s.plan.sessions.filter(x => x.status === 'scheduled');
    if (!sessions.length)
        return null;
    return {
        ...proposalBase(s, 'ranges', sessions[0].id),
        title: 'Use rep ranges for future strength sessions',
        reason: RANGE_PROGRESSION,
        before: 'Fixed repetition targets',
        after: 'Goal-specific rep ranges · existing sets and dates retained',
        changes: sessions.map(x => ({
            sessionId: x.id,
            patch: {
                items: x.items.map(i => rangeItem(i, s.plan.template, x.title)),
                progressionStep: 'Accepted rep range; load changes need approval.'
            }
        }))
    };
}
function eventSignature(s) {
    return JSON.stringify(s.events.map(e => ({
        id: e.id,
        date: e.date,
        kind: e.kind,
        priority: e.priority
    })).sort((a, b) => a.id.localeCompare(b.id)));
}
function checkSchedule(s, changes) {
    if (!s.plan)
        return 'No plan to move.';
    var ids = new Set(changes.map(c => c.sessionId));
    var all = s.plan.sessions.map(x => ({
        ...x,
        ...changes.find(c => c.sessionId === x.id)?.patch
    }));
    var _loop1 = function (c) {
        var old = s.plan.sessions.find(x => x.id === c.sessionId), x = all.find(x => x.id === c.sessionId);
        if (!old || old.status !== 'scheduled' || s.active?.sessionId === old.id)
            return {
                v: 'Only unstarted scheduled sessions can move.'
            };
        if (!validDay(x.date) || x.date < day() || x.date < s.plan.profile.start)
            return {
                v: 'Choose a real date on or after today and the block start.'
            };
        if (s.events.some(e => e.date === x.date))
            return {
                v: `${niceDate(x.date)} has a fixed commitment. Pick another date; commitments are never moved.`
            };
        var competitionIssue = competitionConflict(s.plan.profile, x.date, s.events);
        if (competitionIssue)
            return {
                v: competitionIssue
            };
        if (all.some(y => y.id !== x.id && y.status !== 'missed' && y.date === x.date))
            return {
                v: `${niceDate(x.date)} already has a workout. Select “Shift this and later workouts” or another date.`
            };
    }, _ret1;
    for (var c of changes) {
        _ret1 = _loop1(c);
        if (_ret1)
            return _ret1.v;
    }
    var _loop10 = function (x) {
        if (x.dependsOn?.some(id => {
            var y = all.find(z => z.id === id);
            return y && (ids.has(x.id) || ids.has(y.id)) && y.date >= x.date;
        }))
            return {
                v: 'This move would reverse progression order. Shift later workouts together or choose another date.'
            };
    }, _ret10;
    for (var x of all) {
        _ret10 = _loop10(x);
        if (_ret10)
            return _ret10.v;
    }
    var requiresRest = s.plan.profile.mode === 'app';
    if (requiresRest) {
        var _loop11 = function (_x) {
            for (var y of all.filter(y => y.id !== _x.id && y.status !== 'missed')) {
                var full = !_x.recoveryGroup && !y.recoveryGroup && s.plan.template !== 'AT02', sameRegion = _x.recoveryGroup && y.recoveryGroup ? (0, _equipment.recoveryGroupsOverlap)(_x.recoveryGroup, y.recoveryGroup) : _x.title.split(' ')[0] === y.title.split(' ')[0];
                var actual = (s.active?.sessionId === y.id ? s.active.date : undefined) || latestSessionRecord(s, y.id)?.date || y.date;
                if (!allowsAdjacentEasyRuns(s.plan, _x, y) && (full || sameRegion) && Math.abs(dayDistance(_x.date, actual)) < 2)
                    return {
                        v: 'The move would remove the recovery day between comparable sessions. Shift later workouts together or choose a more separated date.'
                    };
            }
        }, _ret11;
        for (var _x of all.filter(x => ids.has(x.id))) {
            _ret11 = _loop11(_x);
            if (_ret11)
                return _ret11.v;
        }
    }
    for (var _x2 of all.filter(x => x.status === 'scheduled')) {
        var issue = (0, _trainingFocus.focusScheduleConflict)({
            ...s.plan,
            sessions: all
        }, s.events, _x2);
        if (issue)
            return issue;
    }
    return null;
}
function makeMoveProposal(s, sessionId, date, cascade) {
    if (!s.plan)
        return {
            error: 'Create a plan first.'
        };
    var ss = s.plan.sessions.find(x => x.id === sessionId);
    if (!ss || ss.status !== 'scheduled' || s.active?.sessionId === ss.id)
        return {
            error: 'Choose an unstarted scheduled workout.'
        };
    if (!validDay(date))
        return {
            error: 'Choose a valid calendar date.'
        };
    var delta = dayDistance(ss.date, date);
    if (!delta)
        return {
            error: 'Choose a different date.'
        };
    if (Math.abs(delta) > 90)
        return {
            error: 'For a change over 90 days, review a new block instead.'
        };
    var moving = cascade ? s.plan.sessions.filter(x => x.status === 'scheduled' && x.date >= ss.date) : [ss];
    var changes = moving.map(x => ({
        sessionId: x.id,
        beforeDate: x.date,
        patch: {
            date: addDays(x.date, delta)
        }
    }));
    var error = checkSchedule(s, changes);
    if (error)
        return {
            error
        };
    var oldEnd = s.plan.sessions.map(x => x.date).sort().at(-1);
    var end = s.plan.sessions.map(x => changes.find(c => c.sessionId === x.id)?.patch.date || x.date).sort().at(-1);
    var warnings = [];
    if (end !== oldEnd)
        warnings.push(`Last workout: ${niceDate(oldEnd)} → ${niceDate(end)}. This changes calendar duration, not the training amount.`);
    var off = moving.filter(x => !s.plan.profile.days.includes(new Date(addDays(x.date, delta) + 'T12:00:00').getDay())).length;
    if (off)
        warnings.push(`${off} shifted workout(s) fall outside your original weekly availability. Confirm you can train on these dates.`);
    return {
        proposal: {
            ...proposalBase(s, 'move', ss.id),
            title: cascade ? 'Shift this and later workouts' : 'Move this workout',
            reason: 'Review every affected date. Session order and recovery spacing are checked; fixed commitments and completed history stay in place.',
            before: `${moving.length} workout(s) · starts ${niceDate(ss.date)}`,
            after: `Starts ${niceDate(date)} · ${Math.abs(delta)} day(s) ${delta > 0 ? 'later' : 'earlier'}`,
            changes,
            warnings,
            eventSignature: eventSignature(s),
            patch: {
                date
            }
        }
    };
}
function changeSessionStatus(s, id, status) {
    var x = s.plan?.sessions.find(x => x.id === id);
    if (!x || s.active?.sessionId === id || s.history.some(w => w.sessionId === id && w.finishedAt))
        return {
            state: s,
            error: 'An active or recorded workout cannot be changed this way.'
        };
    if (s.simulatedOffline)
        return {
            state: s,
            error: 'Reconnect before changing the schedule.'
        };
    if (status === 'scheduled') {
        var restored = {
            ...s,
            plan: {
                ...s.plan,
                sessions: s.plan.sessions.map(y => y.id === id ? {
                    ...y,
                    status
                } : y)
            }
        };
        var issue = checkSchedule(restored, [{
                sessionId: id,
                patch: {
                    date: x.date
                }
            }]);
        if (issue)
            return {
                state: s,
                error: issue
            };
    }
    return {
        state: changed({
            ...s,
            plan: {
                ...s.plan,
                version: s.plan.version + 1,
                sessions: s.plan.sessions.map(x => x.id === id ? {
                    ...x,
                    status
                } : x)
            },
            proposals: s.proposals.map(p => p.status === 'pending' || p.status === 'queued' ? {
                ...p,
                status: 'stale'
            } : p)
        }, status === 'missed' ? 'Skipped a session. You can restore it.' : 'Restored a skipped session.')
    };
}
;
function allowsAdjacentEasyRuns(plan, a, b) {
    return ['RNBASE4', 'RNEASYREC4'].includes(plan.template) &&
        a.recoveryGroup === 'run' && b.recoveryGroup === 'run' &&
        [a, b].every(s => s.runSteps?.length && !s.runSteps.some(x => /moderate|sprint|hard|threshold/i.test(x.label)));
}
function catalogDays(p, d, events = []) {
    var eventDates = new Set(events.map(e => e.date));
    var available = [...new Set(p.days)].sort((a, b) => a - b), combos = [];
    function collect(i, a) {
        if (a.length === d.days) {
            combos.push(a);
            return;
        }
        for (var j = i; j < available.length; j++)
            collect(j + 1, [...a, available[j]]);
    }
    collect(0, []);
    var startDay = new Date(p.start + 'T12:00:00').getDay();
    combos.sort((a, b) => Math.min(...a.map(d => (d - startDay + 7) % 7)) - Math.min(...b.map(d => (d - startDay + 7) % 7)));
    var _loop12 = function () {
        var assigned = combo.slice().sort((a, b) => (a - startDay + 7) % 7 - (b - startDay + 7) % 7);
        var groups = d.slots.map(x => x.group);
        var fits = groups.every((g, i) => groups.every((h, j) => i === j || (d.id === 'RNBASE4' || d.allowAdjacentEasyRuns) && g === 'run' && h === 'run' && [d.slots[i], d.slots[j]].every(s => s.runIntensity !== 'moderate') || !(0, _equipment.recoveryGroupsOverlap)(g, h) || ![1, 6].includes(Math.abs(assigned[i] - assigned[j]))));
        if (fits && !Array.from({
            length: p.weeks * 7
        }, (_, n) => addDays(p.start, n)).some(date => assigned.includes(new Date(date + 'T12:00:00').getDay()) && eventDates.has(date)))
            return {
                v: assigned
            };
    }, _ret12;
    for (var combo of combos) {
        _ret12 = _loop12();
        if (_ret12)
            return _ret12.v;
    }
    return [];
}
function buildCatalogPlan(p, events) {
    if (!p.programId) {
        var first;
        for (var d of _programCatalog.programCatalog.filter(d => d.goal === p.goal)) {
            var r = buildCatalogPlan({
                ...p,
                programId: d.id
            }, events);
            first ??= r;
            if (r.plan)
                return r;
        }
        return first || {
            plan: null,
            errors: ['No program is available for this goal.']
        };
    }
    var def = _programCatalog.programCatalog.find(d => d.id === p.programId && d.goal === p.goal) || (!p.programId ? _programCatalog.programCatalog.find(d => d.goal === p.goal) : undefined);
    if (!def)
        return {
            plan: null,
            errors: ['Choose a program that matches this training focus.']
        };
    var errors = [...(0, _equipment.inventoryErrors)(p)];
    if (p.trainingDays !== undefined && def.days !== p.trainingDays && !(p.trainingDays >= 6 && ['running', 'hybrid'].includes(p.goal) && def.days < p.trainingDays))
        errors.push(`You requested ${p.trainingDays} training days; this plan schedules ${def.days}. Choose a matching plan or change your preference.`);
    if (p.noFloor && !p.inventory?.confirmed && !def.noFloor && !(p.equipment === 'Full gym' && ['QHY3', 'QHY4'].includes(def.id)) && p.goal !== 'running')
        errors.push('This plan includes floor work. Choose a standing or seated foundation, or change your floor-work setting.');
    if (!p.inventory?.confirmed && p.equipment === 'No equipment' && def.equipment !== 'none' && p.goal !== 'running')
        errors.push('This plan needs equipment. Choose the no-equipment movement start under General fitness, or update your equipment.');
    if (p.age < 18 && !def.youth)
        errors.push('These specialized templates are adult pathways. Choose supervised youth foundations or follow your coach’s program in tracking mode.');
    if (def.experience === 'advanced' && (p.experience !== 'Experienced' || !p.establishedTraining))
        errors.push('This development block needs established technique and consistent recent training. Confirm that readiness in setup, or choose a foundation or build plan.');
    if (def.goal !== 'running' && def.experience === 'some' && p.experience === 'First time')
        errors.push('This template needs established lifting experience. Choose a foundation in this discipline or coach-directed learning.');
    if (!p.inventory?.confirmed && def.equipment === 'gym' && p.equipment !== 'Full gym')
        errors.push('This program requires a full gym with the listed equipment: ' + (0, _programCatalog.equipmentRequirements)(def, p.equipment).join('; ') + '. The defining lifts will not be silently replaced.');
    if (!p.inventory?.confirmed && p.goal !== 'running' && def.equipment === 'dumbbells' && p.equipment.startsWith('Bodyweight'))
        errors.push('This plan needs dumbbells and a stable support. Choose the home option or update your equipment.');
    if (!p.inventory?.confirmed && def.equipment === 'bodyweight-band' && p.equipment === 'Dumbbells')
        errors.push('This plan needs a resistance band, a secure anchor and a stable push-up support. Select Bodyweight + band or a full gym.');
    if (def.runBase && !p.runBase)
        errors.push('Confirm an existing comfortable 30-minute running base, or choose Lift + run base. Lifting experience does not establish running readiness.');
    if (def.runBase) {
        var requiredDays = def.runMinimumDays ?? (def.id === 'RNBASE4' ? 4 : def.id === 'HYDB4' ? 2 : 3), requiredMinutes = def.runMinimumMinutes ?? (def.id === 'RNBASE4' ? 100 : def.id === 'HYDB4' ? 50 : 70);
        if ((p.runDays ?? 0) < requiredDays || (p.runMinutes ?? 0) < requiredMinutes)
            errors.push(`This running base needs at least ${requiredDays} recent running days and ${requiredMinutes} easy running minutes per week. Enter your current base or choose walk–run.`);
    }
    if (def.jumpPractice && (!p.jumpReady || p.noFloor))
        errors.push('This landing-practice plan needs a clear landing area and already comfortable landing skill. Confirm readiness in setup, or choose a strength-only sport plan.');
    if (p.days.length < def.days)
        errors.push(`This template uses ${def.days} training days. Add availability or choose another template.`);
    if (p.age < 18 && p.season === 'In-season')
        errors.push('Use coach-directed tracking for in-season youth training.');
    var assigned = catalogDays(p, def, events);
    if (!assigned.length && !errors.length)
        errors.push('These days cannot fit this split with separated repeated muscle-group or running sessions. Add other available days or review commitments.');
    if (errors.length)
        return {
            plan: null,
            errors
        };
    var id = uid('plan'), sessions = [], previous = {};
    var _loop13 = function () {
        var date = addDays(p.start, offset), weekday = new Date(date + 'T12:00:00').getDay(), slot = assigned.indexOf(weekday);
        if (slot < 0)
            return 0; // continue
        var spec = def.slots[slot], week = Math.floor(offset / 7) + 1, deload = def.wave && week % 4 === 0 || week === p.weeks && p.weeks >= 6;
        var items = spec.items.map(([exerciseId, sets, lo, hi, rest], index) => {
            var strengthWave = !!def.wave && index === 0 && !spec.title.toLowerCase().includes('volume');
            var band = strengthWave ? [[5, 7], [4, 6], [3, 5], [6, 8]][(week - 1) % 4] : [lo, hi];
            return {
                exerciseId,
                sets: exerciseId === 'lib-small-jump-reset' ? sets : deload ? Math.max(1, Math.ceil(sets / 2)) : p.experience === 'First time' && week <= 2 ? Math.min(sets, 2) : sets,
                reps: band[0],
                repMin: band[0],
                repMax: band[1],
                rest,
                kg: null,
                loadRole: spec.title + ' / ' + (strengthWave ? 'wave ' + (week - 1) % 4 : 'work'),
                note: exerciseId === 'lib-small-jump-reset' ? 'After the warm-up and before lifting: six small jumps in two sets of three. Land softly and reset fully between reps; rest two minutes between sets. Stop for pain, loss of balance or worsening landing control. No added height, load, sets or reps; this practice does not use RIR or automatic load progression.' : strengthWave ? 'The rep range changes this week. Choose a weight that leaves about 2–3 good reps left at the end of each set.' : exerciseId === 'bench' && spec.title.includes('practice') ? 'Use a lighter weight for this practice set. We track these weights separately from your heavier bench work.' : 'Finish each set with about 2–3 good reps left (RIR). Start light while learning and stop if you lose control of the movement.'
            };
        });
        if (!p.inventory?.confirmed && !def.distributed && (def.equipment === 'flexible' || def.brief && def.equipment === 'bodyweight-band'))
            items = items.map(i => {
                var home = def.equipment === 'bodyweight-band' || p.equipment === 'Bodyweight + band', gym = p.equipment === 'Full gym';
                var map = home ? {
                    'squat': 'bw-squat',
                    'rdl': 'ref-Band_Good_Morning',
                    'lib-db-floor-press': 'pushup',
                    'ohp': 'ref-Shoulder_Press_-_With_Bands',
                    'row': 'lib-band-standing-row'
                } : gym ? {
                    'squat': 'lib-stack-leg-press',
                    'lib-db-floor-press': 'lib-stack-chest-press',
                    'row': 'lib-cable-seated-row'
                } : {};
                return {
                    ...i,
                    exerciseId: map[i.exerciseId] || i.exerciseId
                };
            });
        if (def.brief && !def.distributed && p.minutes >= 20 && !spec.kind) {
            var expanded = items.map(i => ({
                ...i,
                sets: p.age < 18 || deload ? 1 : 2
            }));
            if (estimateSessionMinutes(expanded, true) <= p.minutes)
                items = expanded;
        }
        var inventoryError = resolveInventory(items, p);
        if (inventoryError)
            return {
                v: {
                    plan: null,
                    errors: [inventoryError]
                }
            };
        var runSteps;
        if (spec.kind === 'timed-run') {
            if (!spec.runStages?.length || spec.runStages.some(t => !t.length || t.some(x => !Number.isInteger(x.seconds) || x.seconds <= 0 || !x.label)))
                return {v: {plan:null, errors:['This running prescription needs a valid reviewed interval sequence.']}};
            runSteps = spec.runStages[Math.min(spec.runStages.length - 1, Math.floor((week - 1) / 2))].map(x => ({...x}));
        }
        else if (spec.kind === 'recovery-walk') {
            runSteps = [{
                    label: 'Comfortable recovery walk · conversational, no pace target',
                    seconds: Math.min(p.minutes - 5, 20) * 60
                }];
        }
        else if (spec.kind === 'brief-run') {
            runSteps = [{
                    label: 'Warm-up walk',
                    seconds: 300
                }, ...Array.from({
                    length: 5
                }, () => [{
                        label: 'Easy jog (or walk)',
                        seconds: 20
                    }, {
                        label: 'Recovery walk',
                        seconds: 40
                    }]).flat(), {
                    label: 'Cool-down walk',
                    seconds: 300
                }];
        }
        else if (spec.kind === 'walkrun') {
            var stage = Math.min(3, Math.floor((week - 1) / 2)), pairs = [[60, 120, 6], [90, 90, 6], [120, 60, 6], [180, 90, 4]][stage];
            runSteps = [{
                    label: 'Warm-up walk',
                    seconds: 300
                }, ...Array.from({
                    length: pairs[2]
                }, () => [{
                        label: 'Conversational jog (or walk)',
                        seconds: pairs[0]
                    }, {
                        label: 'Recovery walk',
                        seconds: pairs[1]
                    }]).flat(), {
                    label: 'Cool-down walk',
                    seconds: 300
                }];
        }
        else if (spec.kind === 'easy') {
            var base = spec.title === 'Longer easy run' ? 30 : 20;
            runSteps = [{
                    label: 'Warm-up walk',
                    seconds: 300
                }, {
                    label: 'Conversational easy run',
                    seconds: base * 60
                }, {
                    label: 'Cool-down walk',
                    seconds: 300
                }];
        }
        if (p.inventory?.confirmed && runSteps && !(0, _equipment.equipmentFit)(exFor(spec.kind === 'recovery-walk' ? 'walk' : 'run'), p).available)
            return {
                v: {
                    plan: null,
                    errors: ['Confirm a suitable walking/running route in your equipment survey.']
                }
            };
        if (p.dumbbellMaxKg === 0 && items.some(i => exFor(i.exerciseId).equipment === 'Dumbbell'))
            return {
                v: {
                    plan: null,
                    errors: ['This plan uses dumbbells but your available maximum is zero. Choose the bodyweight/band option or update your equipment.']
                }
            };
        if (p.age < 18)
            items = items.map(i => ({
                ...i,
                sets: 1,
                reps: 8,
                repMin: 8,
                repMax: 12,
                note: 'Your qualified supervisor chooses the manageable variation, load and reps within this range. No adult automatic load increases.'
            }));
        if (def.noFloor)
            items = items.map(i => ({
                ...i,
                note: (i.note || '') + (i.exerciseId === 'pushup' ? ' Use a wall push-up for this standing plan. Keep the wall and foot distance the same for comparisons.' : ['bw-squat', 'calf'].includes(i.exerciseId) ? ' Use steady support as needed. Record the same range and support each time.' : '')
            }));
        if (spec.conditioning === 'walkrun')
            items.push({
                exerciseId: 'run',
                sets: 1,
                reps: 10,
                rest: 0,
                kg: null,
                note: 'After strength, walk easily for 2 minutes. Then repeat 20 seconds of easy jogging (or walking) and 40 seconds of walking six times. Finish with 2 easy walking minutes. Stay conversational; walking throughout is allowed. Log the whole 10-minute block. Duration stays fixed until a reviewed change.'
            });
        if (runSteps)
            items = [{
                    exerciseId: spec.kind === 'recovery-walk' ? 'walk' : 'run',
                    sets: 1,
                    reps: runSteps.reduce((n, x) => n + x.seconds, 0) / 60,
                    rest: 0,
                    kg: null,
                    note: spec.runIntensity === 'moderate' ? 'Keep the opening, closing and recovery work easy. Only the listed middle bouts use controlled moderate effort: short phrases remain possible, never all-out. Walk or make the whole session easy when needed. Log actual total time and feedback; there is no automatic pace or intensity increase.' : 'Log your total time. Repeat this workout if it still feels too hard or you have not recovered. Keep an easy pace.'
                }];
        var finalInventoryError = resolveInventory(items, p);
        if (finalInventoryError)
            return {
                v: {
                    plan: null,
                    errors: [finalInventoryError]
                }
            };
        var minutes = runSteps ? Math.ceil(runSteps.reduce((n, x) => n + x.seconds, 0) / 60) + 5 : estimateSessionMinutes(items, !!def.brief);
        if (minutes > p.minutes)
            return {
                v: {
                    plan: null,
                    errors: [`${spec.title} needs about ${minutes} minutes including warm-up, rest and setup. Increase the time window; no defining work was dropped.`]
                }
            };
        var key = runSteps ? 'run' : spec.title, sessionId = id + '-s' + sessions.length;
        sessions.push({
            id: sessionId,
            date,
            week,
            recoveryGroup: spec.group,
            roleId: def.id + '-' + slot,
            timeProfile: def.brief ? 'brief' : undefined,
            title: spec.title + (deload && !runSteps ? ' · review week' : ''),
            kind: spec.kind === 'recovery-walk' ? 'Easy activity' : runSteps ? 'Run/walk' : p.goal === 'powerlifting' ? 'Powerlifting' : p.goal === 'hypertrophy' ? 'Hypertrophy' : 'Strength',
            minutes,
            items,
            runSteps: spec.kind === 'recovery-walk' ? undefined : runSteps,
            dependsOn: spec.kind === 'recovery-walk' ? [] : previous[key] ? [previous[key]] : [],
            progressionStep: spec.kind === 'recovery-walk' ? 'Easy activity; record actual minutes without a pace target' : p.age < 18 ? 'One supervised work set per exercise; progression stays with the supervisor' : spec.kind === 'walkrun' || spec.runStages?.length > 1 ? 'Two-week walk–run stages; longer jogging waits for comfortable complete work and no reported symptoms' : runSteps ? spec.runIntensity === 'moderate' ? 'Fixed controlled-moderate bouts; no automatic pace or intensity progression' : 'Accepted easy-duration sequence; repeat when needed' : 'Rep ranges with approved load changes; review-week volume is preplanned',
            status: 'scheduled'
        });
        previous[key] = sessionId;
    }, _ret13;
    for (var offset = 0; offset < p.weeks * 7; offset++) {
        _ret13 = _loop13();
        if (_ret13 === 0)
            continue;
        if (_ret13)
            return _ret13.v;
    }
    var conflicts = sessions.filter(x => events.some(e => e.date === x.date));
    if (conflicts.length)
        return {
            plan: null,
            errors: [`${conflicts.length} sessions overlap a commitment or day off. Adjust availability, start date or commitments before accepting.`]
        };
    var notes = [def.description, 'An original app plan informed by the sources below. It is not a copy of a creator’s program or endorsed by them. The app chooses the exercises, sets and progression rules; workout times are estimates.',
        ...(p.goal === 'running' ? ['Follow the displayed running and walking steps. Keep easy work conversational and walk when needed. If you walk through a prescribed jogging bout, repeat the stage before accepting more running. Total logged minutes do not verify individual bouts; no pace, distance or weight target is inferred.'] : ['Choose starting weights during practice or from recent results with the same exercise and setup. Use lighter weights for technique practice when needed.', def.wave ? 'You’ll do fewer work sets every fourth week and in the final week of plans lasting six weeks or longer. Check your weight whenever the rep range changes.' : 'Plans lasting six weeks or longer finish with fewer strength sets, keeping at least one per exercise. This lighter week is part of the schedule; it is not based on an assessment of your fatigue.', 'First-time lifters start with up to two work sets for the first two weeks. Finish the earlier workouts before adding the later sets. Choose weights from your recent performance, even if you have trained before.']),
        'Equipment: ' + (p.inventory?.confirmed ? (0, _equipment.equipmentSummary)(sessions.flatMap(s => s.items.map(i => exFor(i.exerciseId))), p) : (0, _programCatalog.equipmentRequirements)(def, p.equipment)).join('; ')];
    if (def.distributed)
        notes.push('Six-day strength splits separate pushing, pulling and lower-body work, or upper/lower competition practice. Seven-day options add an easy walk, not a seventh hard lifting day. Weekly work is listed in the preview; frequency alone does not increase results. Short starters provide less volume than growth blocks. Adjust through reviewed changes when recovery or enjoyment suffers.');
    if (p.inventory?.confirmed && p.goal !== 'running')
        notes.push('Exercises were matched to your confirmed equipment at this location. Any swap is visible in the exercise notes. Machine loads and new variations keep separate histories. Fixed dumbbells need rep or variation changes, not a fictitious weight increase.');
    if (def.brief)
        notes.push(p.goal === 'running' ? 'Short running sessions keep the complete timed walking and jogging sequence. The time estimate includes preparation and recording. Keep the recoveries and skip catch-up training; you do not need to fill every available minute.' : 'Short plans include fewer work sets. The time estimate includes preparation and rest, but learning an exercise may take longer. Keep the listed rest and skip catch-up sets. You do not need to fill every available minute.');
    if (def.rationale)
        notes.push('Why this arrangement: ' + def.rationale);
    if (def.jumpPractice)
        notes.push('The fixed landing practice needs at least 48 hours from another session or training commitment and 72 hours from competition. These are app review buffers, not a guarantee of recovery. Sport skill practice outside this calendar must also be reviewed.');
    if (def.slots.some(s => s.runIntensity === 'moderate'))
        notes.push('Only one running session each week includes controlled moderate bouts. These are not measured threshold zones, sprints or a validated polarized intensity ratio. Durations and intensity stay fixed; prefer easy work if recovery or control changes.');
    if (p.age < 18) {
        notes.splice(notes.findIndex(n => n.startsWith('First-time lifters')), 1, 'Youth brief sessions use one controlled work set per movement. The supervisor guides rep and resistance changes. This block does not automatically add load or adult set progressions.');
    }
    if (p.sex && p.goal !== 'running')
        notes.push('Sex does not set a starting weight or a fixed amount of work. Your actual work, preferences and recovery guide changes.');
    if (p.age >= 65 && p.goal !== 'running')
        notes.push('Age alone does not rule out strength work. Use the exercise support and range you can control; choose an accessible substitute when floor transfers or balance are difficult.');
    if (p.goal === 'powerlifting')
        notes.push('Squat, bench press and deadlift remain primary. Use qualified instruction for unfamiliar lifts. This is a development block, not meet peaking, attempt selection or an automatic 1RM test.');
    if (p.goal === 'hybrid')
        notes.push((def.slots.some(x => x.conditioning) ? 'Strength comes first, then the listed ten-minute walk/jog finish on the same day. This low-volume introduction does not replace a higher-frequency running plan.' : 'Lifting and running are on separate days.') + ' Running and strength targets have separate prerequisites. This is not a sprint program or a guarantee of race performance. Easy continuous-run durations remain stable in this base block. The walk–run sequence is app-authored, not the NHS program.');
    return {
        errors: [],
        plan: {
            id,
            name: def.name,
            version: 1,
            progressionModel: 'ranges',
            profile: {
                ...p,
                programId: def.id,
                days: assigned.slice().sort((a, b) => a - b)
            },
            acceptedAt: null,
            sessions,
            phases: p.goal === 'running' ? runningPhases(p, def) : catalogPhases(p, !!def.wave, !!def.brief),
            evidence: p.age < 18 ? ['NSCA-YOUTH', def.source] : [...new Set([...(p.goal === 'running' ? ['WHO-ACTIVITY'] : ['ACSM-2026']), def.source, ...(def.evidenceSources || [])])],
            notes,
            progression: p.age < 18 ? 'Complete the displayed supervised practice. Your qualified supervisor chooses any change in reps or resistance. No maximum tests, adult automatic load increases or catch-up work.' : (p.goal === 'running' ? def.slots.some(s=>s.runStages?.length>1) ? 'Follow the displayed two-week walk–run stages. Longer jogging waits for comfortable complete earlier work with no reported symptoms. Review a repeat if it was too hard; no weekly percentage or pace increase is inferred.' : 'Keep the displayed timed steps and effort. Repeat or reduce after feedback; duration or intensity increases need review.' : RANGE_PROGRESSION) + (p.goal === 'hybrid' ? ' Running follows its own displayed sequence; no universal weekly percentage increase.' : '') + (def.jumpPractice ? ' Landing practice stays at six small reset jumps without RIR, added load or automatic rep increases.' : ''),
            template: def.id,
            paused: false
        }
    };
}
// One estimator for all strength plans: general warm-up / movement prep, work,
// between-set rest, setup transitions and a short finish. Practice sets are not logged as work.
function estimateSessionMinutes(items, brief = false, custom = []) {
    if (items.length && items.every(i => i.exerciseId === 'walk' && exFor(i.exerciseId, custom).metric === 'minutes'))
        return Math.ceil(items.reduce((n, i) => n + i.sets * i.reps, 0) + 5);
    var seconds = (brief ? 6 : 13) * 75 + items.reduce((n, i) => {
        var e = exFor(i.exerciseId, custom), perSide = /per side|per leg|each side|both sides|both legs/i.test(e.loadConvention || '') ? 2 : 1;
        var work = e.metric === 'minutes' ? i.reps * 60 : e.metric === 'seconds' ? i.reps : (i.repMax ?? i.reps) * 5 * perSide;
        var rest = i.setPlan ? i.setPlan.slice(0, -1).reduce((n, x) => n + x.rest, 0) : Math.max(0, i.sets - 1) * i.rest;
        return n + i.sets * work + rest + (brief ? Math.max(60, i.rest) * 1.25 : 150) + (e.equipment === 'Barbell' ? 180 : 0);
    }, 0);
    return Math.ceil(seconds / 60);
}
function catalogPhases(p, wave, brief = false) {
    if (p.age < 18)
        return [{
                name: 'Supervised practice',
                weeks: `1–${p.weeks}`,
                description: 'Do one controlled work set per exercise. Your supervisor chooses the weight and helps you practice. Repeat the workout when you need more practice.'
            }];
    if (p.weeks <= 3)
        return [{
                name: 'Learn and build',
                weeks: `1–${p.weeks}`,
                description: 'Practice each movement, find manageable loads and review actual results before your next block.'
            }];
    if (wave)
        return [{
                name: 'Strength waves',
                weeks: `1–${p.weeks}`,
                description: 'The first lift uses a different rep range each week for three weeks, followed by a week with fewer sets. Choose a suitable weight for each range and finish the earlier workouts before advancing.'
            }];
    return [{
            name: 'Find your starting weights',
            weeks: '1–2',
            description: brief ? 'Practice the listed movements and find a manageable load. Keep the small set count shown.' : 'Practice the movements. First-time lifters start with up to two work sets.'
        }, {
            name: 'Build',
            weeks: `3–${p.weeks >= 6 ? p.weeks - 1 : p.weeks}`,
            description: brief ? 'Keep the displayed sets and rest. Build controlled reps within the range; any load change needs review.' : 'Keep the movements stable. Complete the preceding session before adding planned sets; build reps at a manageable load.'
        }, ...(p.weeks >= 6 ? [{
                name: 'Review',
                weeks: String(p.weeks),
                description: 'Fewer work sets where possible, with at least one per movement. Review your recent training before choosing the next block.'
            }] : [])];
}
function runningPhases(p, def) {
    var staged = def.slots.some(s => s.kind === 'walkrun' || s.runStages?.length > 1);
    return [{
        name: 'Find an easy pace',
        weeks: `1–${Math.min(2, p.weeks)}`,
        description: 'Follow the timed steps at a comfortable effort, keeping walking recoveries. Record actual minutes and how the session felt. Walking throughout is allowed; repeat the stage before increasing running if you walked through prescribed jogging bouts.'
    }, ...(p.weeks > 2 ? [{
        name: staged ? 'Build when ready' : 'Repeat and review',
        weeks: `3–${p.weeks}`,
        description: staged ? 'Follow the displayed two-week stages only after comfortable completed work with no reported symptoms. Repeat a stage when needed. The final stage stays unchanged until a reviewed next block.' : 'Repeat the accepted durations and easy or controlled-moderate efforts. No automatic pace or duration increase is added. Review comfort and consistency before the next block.'
    }] : [])];
}
function sameData(a, b) {
    var normalize = v => {
        if (Array.isArray(v))
            return v.map(normalize);
        if (v && typeof v === 'object') {
            var record = v;
            return Object.fromEntries(Object.keys(record).filter(k => record[k] !== undefined).sort().map(k => [k, normalize(record[k])]));
        }
        return v;
    };
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}
export { validSetRir };
export { rirText };
export { weekdays };
export { day };
export { addDays };
export { niceDate };
export { uid };
export { exercises };
export { isLoadTracked };
export { requiresSetup };
export { matchesExercise };
export { sports };
export { goals };
export { blankProfile };
export { roundLoad };
export { displayLoad };
export { toKg };
export { exFor };
export { validateProfile };
export { buildPlan };
export { latestSessionRecord };
export { competitionConflict };
export { eligibility };
export { initialState };
export { nextSession };
export { changed };
export { makeProposal };
export { applyProposal };
export { validateImport };
export { RANGE_PROGRESSION };
export { validDay };
export { dayDistance };
export { rangeItem };
export { targetText };
export { loadConvention };
export { exerciseRecords };
export { comparableSet };
export { equipmentLimit };
export { setEquipmentLimit };
export { loadSuggestion };
export { makeLoadProposal };
export { makeCapacityProposal };
export { makeRangeProposal };
export { eventSignature };
export { checkSchedule };
export { makeMoveProposal };
export { changeSessionStatus };
export { buildCatalogPlan };
export { estimateSessionMinutes };
