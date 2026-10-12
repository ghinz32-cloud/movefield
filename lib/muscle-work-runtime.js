// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Function bodies/data recovered from the successful 12 October export after scratch cleanup.
import * as __dependency0 from "./training";
import * as __dependency1 from "./equipment";
import * as __dependency2 from "./source-programs";
var _training = __dependency0;
var _equipment = __dependency1;
var _sourcePrograms = __dependency2;
var muscleNames = ['Chest', 'Back', 'Shoulders', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Biceps', 'Triceps', 'Trunk'];
var allocation = {
    'horizontal-press': {
        primary: ['Chest'],
        secondary: ['Shoulders', 'Triceps']
    },
    'incline-press': {
        primary: ['Chest'],
        secondary: ['Shoulders', 'Triceps']
    },
    'vertical-press': {
        primary: ['Shoulders'],
        secondary: ['Triceps']
    },
    'horizontal-pull': {
        primary: ['Back'],
        secondary: ['Biceps', 'Shoulders']
    },
    'vertical-pull': {
        primary: ['Back'],
        secondary: ['Biceps']
    },
    squat: {
        primary: ['Quadriceps', 'Glutes'],
        secondary: ['Trunk']
    },
    'split-squat': {
        primary: ['Quadriceps', 'Glutes'],
        secondary: ['Trunk']
    },
    hinge: {
        primary: ['Hamstrings', 'Glutes'],
        secondary: ['Trunk']
    },
    'hip-extension': {
        primary: ['Glutes'],
        secondary: []
    },
    'knee-flexion': {
        primary: ['Hamstrings'],
        secondary: []
    },
    'knee-extension': {
        primary: ['Quadriceps'],
        secondary: []
    },
    calf: {
        primary: ['Calves'],
        secondary: []
    },
    'elbow-flexion': {
        primary: ['Biceps'],
        secondary: []
    },
    'elbow-extension': {
        primary: ['Triceps'],
        secondary: []
    },
    'lateral-raise': {
        primary: ['Shoulders'],
        secondary: []
    },
    'chest-fly': {
        primary: ['Chest'],
        secondary: []
    },
    'rear-shoulder': {
        primary: ['Shoulders', 'Back'],
        secondary: []
    },
    'anti-extension': {
        primary: ['Trunk'],
        secondary: []
    },
    'anti-rotation': {
        primary: ['Trunk'],
        secondary: []
    },
    'opposite-limb-control': {
        primary: ['Trunk'],
        secondary: []
    }
};
function itemMuscleWork(i) {
    var e = (0, _training.exFor)(i.exerciseId), m = _equipment.movementRoles[i.exerciseId], a = m && allocation[m.role];
    if (!a || !['reps', 'seconds'].includes(e.metric))
        return null;
    return {
        ...a,
        secondary: a.secondary.filter(x => x !== 'Biceps' || m.muscles.includes('elbow flexors'))
    };
}
function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}
function muscleWork(plan) {
    var source = (0, _sourcePrograms.sourceProgram)(plan.template), cycleWeeks = source ? source.days * source.slots.length / gcd(source.days, source.slots.length) / source.days : 1;
    var firstWeek = source ? 1 : plan.sessions.some(s => s.week === 3) ? 3 : 1, periodWeeks = Math.min(cycleWeeks, Math.max(1, plan.profile.weeks)), sessions = plan.sessions.filter(s => source ? s.week <= periodWeeks : s.week === firstWeek);
    var rows = Object.fromEntries(muscleNames.map(name => [name, {
            primary: 0,
            secondary: 0,
            primaryDates: new Set(),
            secondaryDates: new Set()
        }]));
    var unclassified = [];
    for (var s of sessions)
        for (var i of s.items) {
            var a = itemMuscleWork(i);
            if (!a) {
                if (!['minutes'].includes((0, _training.exFor)(i.exerciseId).metric) && _equipment.movementRoles[i.exerciseId]?.role !== 'jump-landing')
                    unclassified.push(i.exerciseId);
                continue;
            }
            for (var name of a.primary) {
                rows[name].primary += i.sets;
                rows[name].primaryDates.add(s.date);
            }
            for (var _name of a.secondary) {
                rows[_name].secondary += i.sets;
                rows[_name].secondaryDates.add(s.date);
            }
        }
    var divisor = source ? periodWeeks : 1;
    return {
        firstWeek,
        periodWeeks: source ? periodWeeks : 1,
        completeCycle: !source || periodWeeks === cycleWeeks,
        rows: muscleNames.map(name => ({
            name,
            primarySets: rows[name].primary / divisor,
            secondarySets: rows[name].secondary / divisor,
            primaryDays: rows[name].primaryDates.size / divisor,
            secondaryDays: rows[name].secondaryDates.size / divisor
        })),
        unclassified: [...new Set(unclassified)],
        scope: 'Planned sets classified by movement target. Primary and secondary work stay separate; neither is converted into isolation-set equivalents or an individual optimum.'
    };
}
export { muscleNames };
export { itemMuscleWork };
export { muscleWork };
