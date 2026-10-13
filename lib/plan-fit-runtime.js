// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _training from "./training";
import * as _equipment from "./equipment";
var strengthItem = i => {
    var e = (0, _training.exFor)(i.exerciseId), m = _equipment.movementRoles[i.exerciseId];
    return e.metric === 'reps' && m?.role !== 'jump-landing' || e.metric === 'seconds' && !!m && m.role !== 'jump-landing';
};
function planFit(plan) {
    var weeks = [...new Set(plan.sessions.map(s => s.week))];
    var week = weeks.find(w => w >= 3) || weeks[0] || 1, sessions = plan.sessions.filter(s => s.week === week);
    var strength = sessions.filter(s => s.kind !== 'Easy activity' && s.items.some(strengthItem));
    var regions = Object.fromEntries(['Chest', 'Back', 'Shoulders', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Arms', 'Trunk'].map(x => [x, {
            sets: 0,
            days: new Set()
        }]));
    var aliases = {
        chest: 'Chest',
        'upper back': 'Back',
        lats: 'Back',
        shoulders: 'Shoulders',
        'front shoulders': 'Shoulders',
        'side shoulders': 'Shoulders',
        'rear shoulders': 'Shoulders',
        quadriceps: 'Quadriceps',
        hamstrings: 'Hamstrings',
        glutes: 'Glutes',
        calves: 'Calves',
        triceps: 'Arms',
        'elbow flexors': 'Arms',
        'trunk stabilizers': 'Trunk',
        'back extensors': 'Trunk'
    };
    var unmapped = [];
    for (var session of strength)
        for (var item of session.items.filter(strengthItem)) {
            var m = _equipment.movementRoles[item.exerciseId];
            if (!m) {
                unmapped.push(item.exerciseId);
                continue;
            }
            for (var region of new Set(m.muscles.map(x => aliases[x]).filter(Boolean))) {
                regions[region].sets += item.sets;
                regions[region].days.add(session.date);
            }
        }
    return {
        week,
        totalDays: sessions.length,
        strengthDays: strength.length,
        runningDays: sessions.filter(s => s.kind !== 'Easy activity' && (s.runSteps?.length || s.items.some(i => i.exerciseId === 'run'))).length,
        easyDays: sessions.filter(s => s.kind === 'Easy activity').length,
        minutes: Math.max(0, ...sessions.map(s => s.minutes)),
        weeklyWorkSets: strength.reduce((n, s) => n + s.items.filter(strengthItem).reduce((m, i) => m + i.sets, 0), 0),
        regions: Object.entries(regions).map(([name, x]) => ({
            name,
            sets: x.sets,
            days: x.days.size
        })),
        unmapped: [...new Set(unmapped)],
        inventoryConfirmed: !!plan.profile.inventory?.confirmed
    };
}
export { planFit };
