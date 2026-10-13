// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Checked authorship and published format, not clinical validation or a licensed app implementation.
import {researchedPrograms} from './researched-programs';
var weightGoals = ['strength', 'hypertrophy', 'powerbuilding', 'powerlifting', 'calisthenics'];
function goalForCategory(current, category) {
    return category === 'weights' ? weightGoals.includes(current) ? current : 'strength' : category;
}
var programEquipment = p => p.equipment === 'none' ? 'No equipment' : p.equipment === 'gym' ? 'Full gym' : p.equipment === 'bodyweight-band' ? 'Bodyweight + band' : 'Dumbbells';
// Original Training Studio prescriptions. Source principles are not branded-program licenses.
var lift = (title, group, items) => ({
    title,
    group,
    items
});
var run = (title, kind) => ({
    title,
    group: 'run',
    kind,
    items: []
});
var programCatalog = [{
        id: 'PL3',
        goal: 'powerlifting',
        name: 'Powerlifting · SBD foundation',
        description: 'Three days devoted to practicing and strengthening the barbell squat, bench press and deadlift. No running or mixed athletic circuit.',
        days: 3,
        minutes: 65,
        experience: 'all',
        equipment: 'gym',
        source: 'PL-EXPERT',
        slots: [lift('Squat + bench', 'full', [['bar-squat', 3, 4, 6, 180], ['bench', 3, 4, 6, 180], ['row', 2, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]]), lift('Deadlift + bench practice', 'full', [['deadlift', 2, 3, 5, 180], ['bench', 3, 5, 8, 150], ['split', 2, 8, 12, 90], ['pulldown', 2, 8, 12, 120], ['calf', 2, 10, 15, 60]]), lift('Squat + bench + deadlift practice', 'full', [['bar-squat', 2, 5, 8, 150], ['bench', 3, 4, 6, 180], ['deadlift', 2, 4, 6, 180], ['pulldown', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]])]
    }, {
        id: 'PL4',
        goal: 'powerlifting',
        name: 'Powerlifting · SBD strength',
        description: 'Four days separating squat/deadlift and bench work. Repeated competition-lift practice with limited assistance.',
        days: 4,
        minutes: 65,
        experience: 'some',
        equipment: 'gym',
        source: 'PL-EXPERT',
        slots: [lift('Squat emphasis', 'lower', [['bar-squat', 3, 3, 5, 210], ['deadlift', 2, 4, 6, 180], ['leg-curl', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 8, 12, 60]]), lift('Bench emphasis', 'upper', [['bench', 3, 3, 5, 210], ['row', 3, 6, 10, 120], ['pulldown', 2, 8, 12, 120], ['triceps', 2, 10, 15, 90], ['lateral', 2, 10, 15, 90]]), lift('Deadlift emphasis', 'lower', [['deadlift', 3, 3, 5, 210], ['bar-squat', 2, 4, 6, 180], ['leg-curl', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 8, 12, 60]]), lift('Bench volume', 'upper', [['bench', 4, 4, 6, 180], ['pulldown', 3, 6, 10, 120], ['ohp', 2, 8, 12, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]])]
    }, {
        id: 'PB3',
        goal: 'powerbuilding',
        name: 'Powerbuilding · Full body 3',
        description: 'Start each workout with a main strength lift, then train the other muscle groups.',
        days: 3,
        minutes: 75,
        experience: 'some',
        equipment: 'gym',
        source: 'PB-EXPERT',
        slots: [lift('Squat strength + muscle', 'full', [['bar-squat', 3, 3, 6, 180], ['bench', 3, 6, 10, 150], ['row', 3, 6, 10, 120], ['leg-curl', 2, 10, 15, 90], ['curl', 2, 10, 15, 90]]), lift('Deadlift strength + muscle', 'full', [['deadlift', 2, 3, 5, 210], ['incline-press', 3, 6, 10, 120], ['pulldown', 3, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['deadbug', 2, 8, 12, 60]]), lift('Bench strength + muscle', 'full', [['bench', 3, 3, 6, 180], ['bar-squat', 3, 6, 10, 150], ['rdl', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['triceps', 2, 10, 15, 90]])]
    }, {
        id: 'PB4',
        goal: 'powerbuilding',
        name: 'Powerbuilding · Upper/lower 4',
        description: 'Heavy lower and upper sessions plus dedicated muscle-building work across four days.',
        days: 4,
        minutes: 70,
        experience: 'some',
        equipment: 'gym',
        source: 'PB-EXPERT',
        slots: [lift('Lower · squat strength', 'lower', [['bar-squat', 3, 3, 6, 180], ['rdl', 3, 6, 10, 150], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 8, 12, 60]]), lift('Upper · bench strength', 'upper', [['bench', 3, 3, 6, 180], ['row', 3, 6, 10, 120], ['ohp', 2, 6, 10, 120], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Lower · deadlift strength', 'lower', [['deadlift', 2, 3, 5, 210], ['bar-squat', 3, 6, 10, 150], ['leg-extension', 2, 10, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 2, 10, 15, 60]]), lift('Upper · muscle emphasis', 'upper', [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['row', 2, 8, 12, 120], ['lateral', 3, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]])]
    }, {
        id: 'BB3',
        goal: 'hypertrophy',
        name: 'Bodybuilding · Full body 3',
        description: 'Three muscle-growth sessions with broad coverage. Start with fewer sets while learning the exercises. No maximum-strength test is required.',
        days: 3,
        minutes: 70,
        experience: 'all',
        equipment: 'gym',
        source: 'HYP-EXPERT',
        slots: [lift('Full body · A', 'full', [['bar-squat', 3, 8, 12, 150], ['bench', 3, 8, 12, 150], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['calf', 2, 10, 15, 60]]), lift('Full body · B', 'full', [['squat', 3, 8, 12, 150], ['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90]]), lift('Full body · C', 'full', [['split', 3, 8, 12, 120], ['incline-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]])]
    }, {
        id: 'BB4',
        goal: 'hypertrophy',
        name: 'Bodybuilding · Upper/lower 4',
        description: 'Upper/lower muscle-growth sessions with extra work for individual muscles, training each group more than once a week.',
        days: 4,
        minutes: 75,
        experience: 'some',
        equipment: 'gym',
        source: 'HYP-EXPERT',
        slots: [lift('Upper growth · A', 'upper', [['bench', 3, 6, 10, 150], ['row', 3, 8, 12, 120], ['pulldown', 2, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Lower growth · A', 'lower', [['bar-squat', 3, 6, 10, 150], ['rdl', 3, 8, 12, 150], ['leg-extension', 2, 10, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 8, 12, 60]]), lift('Upper growth · B', 'upper', [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['row', 2, 8, 12, 120], ['lateral', 3, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Lower growth · B', 'lower', [['squat', 3, 8, 12, 150], ['rdl', 2, 8, 12, 120], ['split', 2, 8, 12, 120], ['leg-curl', 3, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 8, 12, 60]])]
    }, {
        id: 'HY4',
        goal: 'hybrid',
        name: 'Hybrid · Lift + run base',
        description: 'Two full-body strength sessions and two easy walk–runs on separate days. A base block for new runners, not a race plan.',
        days: 4,
        minutes: 45,
        experience: 'all',
        equipment: 'dumbbells',
        source: 'CONCURRENT',
        slots: [lift('Hybrid strength · A', 'full', [['squat', 2, 8, 12, 120], ['pushup', 2, 6, 12, 120], ['row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]), run('Easy walk–run · A', 'walkrun'), lift('Hybrid strength · B', 'full', [['rdl', 2, 8, 12, 120], ['split', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]]), run('Easy walk–run · B', 'walkrun')]
    }, {
        id: 'HY5',
        goal: 'hybrid',
        name: 'Hybrid · Strength + running',
        description: 'Two strength days and three conversational runs for someone already running comfortably for 30 minutes. Maintain a running base alongside lifting.',
        days: 5,
        minutes: 60,
        experience: 'some',
        equipment: 'gym',
        runBase: true,
        source: 'CONCURRENT',
        slots: [lift('Hybrid strength · A', 'full', [['bar-squat', 3, 3, 5, 180], ['bench', 3, 4, 6, 180], ['row', 2, 6, 10, 120]]), run('Easy run · A', 'easy'), lift('Hybrid strength · B', 'full', [['deadlift', 2, 3, 5, 180], ['ohp', 3, 4, 6, 150], ['pulldown', 2, 6, 10, 120], ['deadbug', 2, 8, 12, 60]]), run('Easy run · B', 'easy'), run('Longer easy run', 'easy')]
    }];
programCatalog.push({
    id: 'PLU3',
    goal: 'powerlifting',
    name: 'Powerlifting · Undulating SBD 3',
    description: 'Three full-body days with distinct squat, bench and deadlift rep ranges. Competition lifts stay central; assistance is limited.',
    days: 3,
    minutes: 80,
    experience: 'some',
    equipment: 'gym',
    source: 'PL-EXPERT',
    slots: [lift('SBD · squat emphasis', 'full', [['bar-squat', 4, 3, 5, 210], ['bench', 3, 6, 8, 150], ['row', 2, 8, 12, 90]]), lift('SBD · deadlift emphasis', 'full', [['deadlift', 3, 3, 5, 210], ['bench', 3, 4, 6, 180], ['deadbug', 2, 8, 12, 60]]), lift('SBD · bench emphasis', 'full', [['bench', 4, 3, 5, 210], ['bar-squat', 3, 5, 7, 180], ['deadlift', 2, 5, 7, 180]])]
}, {
    id: 'PBPH4',
    goal: 'powerbuilding',
    name: 'Powerbuilding · Power + hypertrophy 4',
    description: 'Two strength-focused days, then two muscle-focused days. The upper/lower split separates heavier work from higher-rep work.',
    days: 4,
    minutes: 90,
    experience: 'some',
    equipment: 'gym',
    source: 'PB-EXPERT',
    slots: [lift('Upper · power', 'upper', [['bench', 3, 3, 5, 210], ['row', 3, 5, 8, 150], ['ohp', 2, 5, 8, 120], ['curl', 2, 8, 12, 90]]), lift('Lower · power', 'lower', [['bar-squat', 3, 3, 5, 210], ['deadlift', 2, 3, 5, 210], ['leg-curl', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]), lift('Upper · hypertrophy', 'upper', [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['row', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Lower · hypertrophy', 'lower', [['bar-squat', 3, 8, 10, 150], ['rdl', 3, 8, 12, 120], ['leg-extension', 2, 10, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 8, 12, 60]])]
}, {
    id: 'PBT4',
    goal: 'powerbuilding',
    name: 'Powerbuilding · Tiered strength + size 4',
    description: 'Each session starts with one heavier lift, adds a moderate-rep compound, and finishes with smaller muscle work. No rep-max testing.',
    days: 4,
    minutes: 75,
    experience: 'some',
    equipment: 'gym',
    source: 'PB-EXPERT',
    slots: [lift('Tiered lower · squat', 'lower', [['bar-squat', 3, 3, 5, 210], ['rdl', 3, 6, 10, 150], ['leg-extension', 2, 10, 15, 90], ['calf', 2, 10, 15, 60]]), lift('Tiered upper · bench', 'upper', [['bench', 3, 3, 5, 210], ['row', 3, 6, 10, 150], ['lateral', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Tiered lower · deadlift', 'lower', [['deadlift', 3, 3, 5, 210], ['bar-squat', 3, 6, 10, 150], ['leg-curl', 2, 10, 15, 90], ['deadbug', 2, 8, 12, 60]]), lift('Tiered upper · press', 'upper', [['ohp', 3, 4, 6, 180], ['incline-press', 3, 6, 10, 150], ['pulldown', 3, 8, 12, 120], ['curl', 2, 10, 15, 90]])]
}, {
    id: 'ST2',
    goal: 'strength',
    name: 'Strength · Dumbbell foundation 2',
    description: 'Two separated full-body days for general strength. Uses dumbbells and a stable elevated support; no competition-lift claims.',
    days: 2,
    minutes: 55,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'ACSM-2026',
    slots: [lift('Strength foundation · A', 'full', [['squat', 2, 6, 10, 150], ['rdl', 2, 6, 10, 150], ['pushup', 2, 6, 12, 120], ['row', 2, 6, 10, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]), lift('Strength foundation · B', 'full', [['squat', 2, 6, 10, 150], ['rdl', 2, 6, 10, 150], ['ohp', 2, 6, 10, 120], ['row', 2, 6, 10, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'ST3',
    goal: 'strength',
    name: 'Strength · Barbell full body 3',
    description: 'Three days to build broad strength in the squat, press, hinge and pull. General strength is the focus, without added running.',
    days: 3,
    minutes: 70,
    experience: 'some',
    equipment: 'gym',
    source: 'ACSM-2026',
    slots: [lift('Barbell strength · A', 'full', [['bar-squat', 3, 3, 5, 180], ['bench', 3, 3, 5, 180], ['row', 2, 6, 10, 120], ['leg-curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]]), lift('Barbell strength · B', 'full', [['deadlift', 3, 3, 5, 180], ['ohp', 3, 4, 6, 150], ['pulldown', 2, 6, 10, 120], ['split', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]), lift('Barbell strength · C', 'full', [['bar-squat', 3, 4, 6, 180], ['bench', 3, 4, 6, 180], ['rdl', 2, 6, 10, 120], ['row', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'GF2',
    goal: 'general',
    name: 'General fitness · Dumbbell foundation 2',
    description: 'Two repeatable sessions for strength and everyday movement. Modest starting work leaves room for walking and other activities you choose.',
    days: 2,
    minutes: 50,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'ACSM-2026',
    slots: [lift('General fitness · A', 'full', [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['pushup', 2, 6, 12, 90], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]), lift('General fitness · B', 'full', [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['ohp', 2, 8, 12, 90], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'GFHOME2',
    goal: 'general',
    name: 'General fitness · Home foundation 2',
    description: 'Bodyweight and resistance-band work on two separated days. Requires a secure band anchor and stable push-up support.',
    days: 2,
    minutes: 45,
    experience: 'all',
    equipment: 'bodyweight-band',
    source: 'ACSM-2026',
    slots: [lift('Home fitness · A', 'full', [['bw-squat', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]), lift('Home fitness · B', 'full', [['split', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]])]
}, {
    id: 'CAL2',
    goal: 'calisthenics',
    name: 'Calisthenics · Foundation 2',
    description: 'Two days of controlled bodyweight work, with band rows for pulling. Choose a manageable push-up height; skills such as muscle-ups are not included.',
    days: 2,
    minutes: 45,
    experience: 'all',
    equipment: 'bodyweight-band',
    source: 'ACSM-2026',
    slots: [lift('Calisthenics · A', 'full', [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['lib-band-standing-row', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]), lift('Calisthenics · B', 'full', [['split', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'CAL3',
    goal: 'calisthenics',
    name: 'Calisthenics · Practice 3',
    description: 'Three brief, separated days for more frequent bodyweight practice. The movements stay familiar; changing leverage needs your review.',
    days: 3,
    minutes: 45,
    experience: 'all',
    equipment: 'bodyweight-band',
    source: 'ACSM-2026',
    slots: [lift('Calisthenics practice · A', 'full', [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['lib-band-standing-row', 2, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]), lift('Calisthenics practice · B', 'full', [['split', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['lib-band-standing-row', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90]]), lift('Calisthenics practice · C', 'full', [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]])]
}, {
    id: 'RNEASY3',
    goal: 'running',
    name: 'Running · Easy base 3',
    description: 'Three conversational runs for adults who already run comfortably for 30 minutes. Stable durations support consistency; no race pace or distance target.',
    days: 3,
    minutes: 40,
    experience: 'all',
    equipment: 'dumbbells',
    runBase: true,
    source: 'WHO-ACTIVITY',
    slots: [run('Easy run · A', 'easy'), run('Easy run · B', 'easy'), run('Longer easy run', 'easy')]
});
// Complete app-original alternatives. Public programs inform design; author names are not relabeled.
var dbA = () => [['squat', 3, 8, 12, 120], ['lib-db-floor-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
var dbB = () => [['rdl', 3, 8, 12, 120], ['ohp', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['split', 2, 8, 12, 90], ['curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]];
var dbC = () => [['squat', 3, 8, 12, 120], ['lib-db-floor-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['calf', 2, 10, 15, 60]];
var machineA = () => [['lib-stack-leg-press', 3, 8, 12, 120], ['lib-stack-chest-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
var machineB = () => [['lib-stack-leg-press', 3, 8, 12, 120], ['lib-stack-chest-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['lateral', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]];
var homeA = () => [['bw-squat', 3, 8, 15, 90], ['pushup', 3, 6, 12, 120], ['band-row', 3, 8, 15, 90], ['ref-Band_Good_Morning', 3, 10, 15, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
var homeB = () => [['split', 3, 8, 12, 90], ['pushup', 3, 6, 12, 120], ['band-row', 3, 8, 15, 90], ['ref-Band_Good_Morning', 3, 10, 15, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
programCatalog.push({
    id: 'PL2',
    goal: 'powerlifting',
    name: 'Powerlifting · Two-day SBD',
    description: 'Two complete full-body sessions with all three competition lifts, pulling and trunk work. More rest days; each workout needs enough time for all three lifts.',
    days: 2,
    minutes: 80,
    experience: 'all',
    level: 'foundation',
    equipment: 'gym',
    source: 'PL-EXPERT',
    slots: [lift('SBD foundation · A', 'full', [['bar-squat', 3, 4, 6, 180], ['bench', 3, 4, 6, 180], ['deadlift', 2, 4, 6, 180], ['row', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]]), lift('SBD foundation · B', 'full', [['deadlift', 3, 3, 5, 180], ['bench', 3, 6, 8, 150], ['bar-squat', 2, 6, 8, 150], ['pulldown', 2, 8, 12, 120], ['calf', 2, 10, 15, 60]])]
}, {
    id: 'PBSTART2',
    goal: 'powerbuilding',
    name: 'Powerbuilding · Foundation 2',
    description: 'A first strength-and-muscle block. Two full sessions keep squat, bench and hinge work, then add back, shoulders and trunk work. No max tests.',
    days: 2,
    minutes: 75,
    experience: 'all',
    level: 'foundation',
    equipment: 'gym',
    source: 'PB-EXPERT',
    slots: [lift('Foundation · squat + bench', 'full', [['bar-squat', 3, 5, 8, 150], ['bench', 3, 5, 8, 150], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['lateral', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]]), lift('Foundation · hinge + press', 'full', [['deadlift', 2, 4, 6, 180], ['bench', 3, 8, 10, 120], ['squat', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['curl', 2, 10, 15, 90], ['calf', 2, 10, 15, 60]])]
}, {
    id: 'PBSTART3',
    goal: 'powerbuilding',
    name: 'Powerbuilding · Foundation 3',
    description: 'Three full-body sessions with one strength lift, moderate-rep muscle work and core or calf work. Begin with two work sets while learning.',
    days: 3,
    minutes: 70,
    experience: 'all',
    level: 'foundation',
    equipment: 'gym',
    source: 'PB-EXPERT',
    slots: [lift('Foundation 3 · squat', 'full', [['bar-squat', 3, 5, 8, 150], ['lib-db-floor-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]]), lift('Foundation 3 · bench', 'full', [['bench', 3, 5, 8, 150], ['rdl', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['split', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]), lift('Foundation 3 · deadlift', 'full', [['deadlift', 2, 4, 6, 180], ['squat', 3, 8, 12, 120], ['ohp', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'PBDB3',
    goal: 'powerbuilding',
    name: 'Powerbuilding · Dumbbell strength + size',
    description: 'A dumbbell strength-and-muscle alternative. The opening lift uses 5–8 reps; assistance uses higher ranges. This does not prepare competition barbell lifts.',
    days: 3,
    minutes: 75,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'PB-EXPERT',
    slots: [lift('Dumbbell strength + size · A', 'full', dbA().map((i, n) => n === 0 ? [i[0], 3, 5, 8, 150] : i)), lift('Dumbbell strength + size · B', 'full', dbB().map((i, n) => n === 0 ? [i[0], 3, 5, 8, 150] : i)), lift('Dumbbell strength + size · C', 'full', dbC().map((i, n) => n === 1 ? [i[0], 3, 5, 8, 150] : i))]
}, {
    id: 'BB2',
    goal: 'hypertrophy',
    name: 'Bodybuilding · Full body 2',
    description: 'Two full muscle-building sessions for a smaller weekly schedule. Covers legs, chest, back, shoulders, arms and trunk across the week.',
    days: 2,
    minutes: 85,
    experience: 'all',
    equipment: 'gym',
    source: 'HYP-EXPERT',
    slots: [lift('Two-day muscle · A', 'full', [...machineA(), ['curl', 2, 10, 15, 90], ['lateral', 2, 10, 15, 90]]), lift('Two-day muscle · B', 'full', [['bar-squat', 3, 8, 12, 150], ['rdl', 3, 8, 12, 120], ['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['triceps', 2, 10, 15, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'BBDB3',
    goal: 'hypertrophy',
    name: 'Bodybuilding · Dumbbell full body 3',
    description: 'Three full muscle-building workouts without a bench or machines. Floor presses, rows, leg work and focused assistance; record each dumbbell separately from barbell loads.',
    days: 3,
    minutes: 75,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'HYP-EXPERT',
    slots: [lift('Dumbbell muscle · A', 'full', dbA()), lift('Dumbbell muscle · B', 'full', dbB()), lift('Dumbbell muscle · C', 'full', dbC())]
}, {
    id: 'BBM3',
    goal: 'hypertrophy',
    name: 'Bodybuilding · Machines + cables 3',
    description: 'Full-body training built around clearly identified stack machines and cables, with small dumbbell and trunk exercises. A different setup from barbell training.',
    days: 3,
    minutes: 75,
    experience: 'all',
    equipment: 'gym',
    source: 'HYP-EXPERT',
    requirements: ['Selectorized leg press and chest press', 'Cable row and lat pulldown', 'Leg-curl and leg-extension machines', 'Dumbbells and floor space'],
    slots: [lift('Machine muscle · A', 'full', [...machineA(), ['curl', 2, 10, 15, 90]]), lift('Machine muscle · B', 'full', [...machineB(), ['triceps', 2, 10, 15, 90]]), lift('Machine muscle · C', 'full', [...machineA().slice(0, 4), ['leg-extension', 2, 10, 15, 90], ['lateral', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]])]
}, {
    id: 'STGYM2',
    goal: 'strength',
    name: 'Strength · Guided machine start',
    description: 'Two full sessions using stack machines, cables and controlled assistance. Learn the seat, pad and handle setup before choosing a load.',
    days: 2,
    minutes: 65,
    experience: 'all',
    level: 'foundation',
    equipment: 'gym',
    source: 'ACSM-2026',
    requirements: ['Selectorized leg press and chest press', 'Cable row and lat pulldown', 'Leg-curl machine, light dumbbells and floor space'],
    slots: [lift('Machine strength · A', 'full', machineA()), lift('Machine strength · B', 'full', machineB())]
}, {
    id: 'STDB3',
    goal: 'strength',
    name: 'Strength · Dumbbell full body 3',
    description: 'Three complete sessions with squat, hinge, push, pull and trunk work. More weekly practice without a rack or a weight bench.',
    days: 3,
    minutes: 75,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'ACSM-2026',
    slots: [lift('Dumbbell strength · A', 'full', dbA()), lift('Dumbbell strength · B', 'full', dbB()), lift('Dumbbell strength · C', 'full', dbC())]
}, {
    id: 'GF3',
    goal: 'general',
    name: 'General fitness · Full body 3',
    description: 'Three complete dumbbell sessions for broad fitness. Strength is progressed within rep ranges; easy activity can be added separately if it fits your time.',
    days: 3,
    minutes: 75,
    experience: 'all',
    equipment: 'dumbbells',
    source: 'ACSM-2026',
    slots: [lift('Full fitness · A', 'full', dbA()), lift('Full fitness · B', 'full', dbB()), lift('Full fitness · C', 'full', dbC())]
}, {
    id: 'GFM2',
    goal: 'general',
    name: 'General fitness · Machine start',
    description: 'Two repeatable gym sessions using machines and cables. Includes leg, push, pull, calf and trunk work with time for setup.',
    days: 2,
    minutes: 65,
    experience: 'all',
    equipment: 'gym',
    source: 'ACSM-2026',
    requirements: ['Selectorized leg press and chest press', 'Cable row and lat pulldown', 'Leg-curl machine, light dumbbells and floor space'],
    slots: [lift('Machine fitness · A', 'full', machineA()), lift('Machine fitness · B', 'full', machineB())]
}, {
    id: 'CALBUILD3',
    goal: 'calisthenics',
    name: 'Calisthenics · Full-body build 3',
    description: 'More work sets for established bodyweight training. Record support height and band setup. Progress reps first; a harder leverage needs your review and a new baseline.',
    days: 3,
    minutes: 70,
    experience: 'some',
    equipment: 'bodyweight-band',
    source: 'ACSM-2026',
    slots: [lift('Bodyweight build · A', 'full', homeA()), lift('Bodyweight build · B', 'full', homeB()), lift('Bodyweight build · C', 'full', homeA())]
}, {
    id: 'CALBUILD2',
    goal: 'calisthenics',
    name: 'Calisthenics · Full-body build 2',
    description: 'Two longer bodyweight sessions for people comfortable with the foundation. Complete both sides of split squats and dead bugs; band rows keep pulling in the plan.',
    days: 2,
    minutes: 70,
    experience: 'some',
    equipment: 'bodyweight-band',
    source: 'ACSM-2026',
    slots: [lift('Bodyweight build 2 · A', 'full', homeA()), lift('Bodyweight build 2 · B', 'full', homeB())]
}, {
    id: 'HYHOME4',
    goal: 'hybrid',
    name: 'Hybrid · Home strength + walk–run',
    description: 'Two complete bodyweight-and-band sessions and two separate walk–runs. A general base for new runners, with no race or sprint target.',
    days: 4,
    minutes: 60,
    experience: 'all',
    equipment: 'bodyweight-band',
    source: 'CONCURRENT',
    slots: [lift('Home hybrid · A', 'full', homeA().map(i => [i[0], 2, i[2], i[3], i[4]])), run('Home walk–run · A', 'walkrun'), lift('Home hybrid · B', 'full', homeB().map(i => [i[0], 2, i[2], i[3], i[4]])), run('Home walk–run · B', 'walkrun')]
}, {
    id: 'HYDB4',
    goal: 'hybrid',
    name: 'Hybrid · Dumbbells + easy runs',
    description: 'Two full dumbbell sessions and two easy runs for someone already running 30 minutes comfortably. Maintain a running base while building strength.',
    days: 4,
    minutes: 75,
    experience: 'all',
    equipment: 'dumbbells',
    runBase: true,
    source: 'CONCURRENT',
    slots: [lift('Dumbbell hybrid · A', 'full', dbA()), run('Easy run · A', 'easy'), lift('Dumbbell hybrid · B', 'full', dbB()), run('Longer easy run', 'easy')]
}, {
    id: 'RNBASE4',
    goal: 'running',
    name: 'Running · Easy base 4',
    description: 'Four easy runs for someone already running at least four days and 100 easy minutes each week. A stable block with 90 running minutes and 40 warm-up/cool-down walking minutes per week; no race-pace targets or automatic distance increases.',
    days: 4,
    minutes: 40,
    experience: 'some',
    equipment: 'dumbbells',
    runBase: true,
    source: 'WHO-ACTIVITY',
    slots: [run('Easy run · A', 'easy'), run('Easy run · B', 'easy'), run('Easy run · C', 'easy'), run('Longer easy run', 'easy')]
});
programCatalog.push({
    id: 'BBHOME3',
    goal: 'hypertrophy',
    name: 'Bodybuilding · Home muscle base',
    description: 'Three bodyweight-and-band sessions for a muscle-building base. Adjust support height and band resistance to keep the rep range useful. Equipment limits are shown; advanced weighted work needs a different plan.',
    days: 3,
    minutes: 70,
    experience: 'all',
    equipment: 'bodyweight-band',
    source: 'HYP-EXPERT',
    slots: [lift('Home muscle · A', 'full', homeA()), lift('Home muscle · B', 'full', homeB()), lift('Home muscle · C', 'full', homeA())]
});
var advancedMuscle = programCatalog.find(p => p.id === 'BB4');
programCatalog.push({
    ...advancedMuscle,
    id: 'BBADV4',
    name: 'Bodybuilding · Established upper/lower',
    experience: 'advanced',
    level: 'advanced',
    minutes: 100,
    description: 'Four complete muscle-building sessions for established lifters. Main movements use four sets and assistance uses three. Confirm recent training first; more work is not automatically better.',
    slots: advancedMuscle.slots.map(x => ({
        ...x,
        items: x.items.map((i, n) => [i[0], n < 2 ? 4 : 3, i[2], i[3], i[4]])
    }))
});
// Established lifters can choose distinct heavy / moderate sessions and planned lighter weeks.
var _loop = function (base) {
    var original = programCatalog.find(p => p.id === base);
    programCatalog.push({
        ...original,
        id,
        goal,
        name,
        experience: 'advanced',
        level: 'advanced',
        wave: true,
        minutes: 90,
        description: 'For established lifters with repeatable technique and recent training history. Rep targets change over three weeks, followed by a lighter week. Assistance stays in muscle-building ranges; no automatic max tests.',
        slots: original.slots.map(x => ({
            ...x,
            items: x.items.map(i => [...i])
        }))
    });
};
for (var [id, base, name, goal] of [['PLW4', 'PL4', 'Powerlifting · SBD development waves', 'powerlifting'], ['PBW4', 'PB4', 'Powerbuilding · Strength + size waves', 'powerbuilding'], ['ST4', 'PL4', 'Strength · Upper/lower development', 'strength']]) {
    _loop(base);
}
// Goal changes affect training amount as well as the label, while core movements can remain familiar.
for (var p of programCatalog) {
    if (['STDB3', 'STGYM2'].includes(p.id))
        p.slots = p.slots.map(x => ({
            ...x,
            items: x.items.map((i, n) => n < 3 ? [i[0], i[1], 6, 10, 150] : i)
        }));
    if (p.id === 'GF3')
        p.slots = p.slots.map(x => ({
            ...x,
            items: x.items.map(i => [i[0], 2, i[2], i[3], i[4]])
        }));
}
// Short-session variants complement the full plans. These are deliberately smaller amounts of training.
var briefSlots = prefix => [lift(prefix + ' · squat + push + pull', 'full', [['squat', 1, 8, 12, 90], ['lib-db-floor-press', 1, 8, 12, 90], ['row', 1, 8, 12, 90]]), lift(prefix + ' · hinge + push + pull', 'full', [['rdl', 1, 8, 12, 90], ['ohp', 1, 8, 12, 90], ['row', 1, 8, 12, 90]]), lift(prefix + ' · legs + trunk', 'full', [['split', 1, 8, 12, 90], ['calf', 1, 10, 15, 60], ['deadbug', 1, 6, 10, 60]])];
for (var [_id, _goal, _name, days] of [['QG2', 'general', 'General fitness · Brief full body 2', 2], ['QG3', 'general', 'General fitness · Brief full body 3', 3], ['QS2', 'strength', 'Strength · Brief practice 2', 2], ['QM2', 'hypertrophy', 'Bodybuilding · Brief muscle base 2', 2], ['QC2', 'calisthenics', 'Calisthenics · Brief practice 2', 2], ['QPB2', 'powerbuilding', 'Powerbuilding · Brief strength + size 2', 2], ['QSP2', 'sport', 'Sport · Brief strength foundation 2', 2], ['QS3', 'strength', 'Strength · Brief practice 3', 3], ['QM3', 'hypertrophy', 'Bodybuilding · Brief muscle base', 3], ['QPB3', 'powerbuilding', 'Powerbuilding · Brief strength + size', 3], ['QC3', 'calisthenics', 'Calisthenics · Brief practice', 3], ['QSP3', 'sport', 'Sport · Brief strength foundation', 3]]) {
    var slots = briefSlots(_name.split(' · ')[1]).slice(0, days);
    if (days === 2 && !_id.startsWith('QPB'))
        slots[1] = {
            ...slots[1],
            title: _name.split(' · ')[1] + ' · hinge + pull + core',
            items: [['rdl', 1, 8, 12, 90], ['row', 1, 8, 12, 90], ['deadbug', 1, 6, 10, 60]]
        };
    if (_id === 'QPB3') {
        slots[2] = lift('Brief strength + size · press + legs', 'full', [['lib-db-floor-press', 1, 5, 8, 120], ['split', 1, 8, 12, 90], ['deadbug', 1, 6, 10, 60]]);
    }
    if (_id === 'QPB3' || _id === 'QPB2')
        slots = slots.map(x => ({
            ...x,
            items: x.items.map((i, n) => n === 0 ? [i[0], 1, 5, 8, 120] : i)
        }));
    programCatalog.push({
        id: _id,
        goal: _goal,
        name: _name,
        days,
        minutes: 30,
        experience: 'all',
        equipment: _id.startsWith('QC') ? 'bodyweight-band' : _id.startsWith('QPB') ? 'dumbbells' : 'flexible',
        brief: true,
        youth: ['general', 'strength', 'calisthenics', 'sport'].includes(_goal),
        source: 'TIME-EFFICIENT',
        description: 'Less work each week, spread across short sessions. Start with one work set per movement. The full preparation and recovery estimate must fit your window; longer windows add work only when it fits. Review the listed equipment and weekly movement coverage. This smaller training amount is not promised equal to a longer plan.',
        slots
    });
}
programCatalog.push({
    id: 'QPL3',
    goal: 'powerlifting',
    name: 'Powerlifting · Brief SBD practice',
    days: 3,
    minutes: 30,
    experience: 'some',
    equipment: 'gym',
    brief: true,
    source: 'TIME-EFFICIENT',
    requirements: ['Barbell, sufficient plates, squat rack with safeties and bench', 'Enough time to warm up your familiar working load; no maximal tests'],
    description: 'One competition lift per short session with two controlled work sets. Practice all three lifts across the week. This is a short practice option for familiar lifters, not a full meet-preparation or maximal-strength block.',
    slots: [lift('Brief squat practice', 'full', [['bar-squat', 2, 4, 6, 150]]), lift('Brief bench practice', 'full', [['bench', 2, 4, 6, 150]]), lift('Brief deadlift practice', 'full', [['deadlift', 2, 4, 6, 150]])]
}, {
    id: 'QHY4',
    goal: 'hybrid',
    name: 'Hybrid · Brief lift + walk–run',
    days: 4,
    minutes: 30,
    experience: 'all',
    equipment: 'flexible',
    brief: true,
    source: 'TIME-EFFICIENT',
    description: 'Two short strength sessions and two separate 15-minute walk–runs. A gentle start, not race preparation. Gym, dumbbell or home strength variations use the equipment you selected.',
    slots: [briefSlots('Brief hybrid')[0], {
            title: 'Brief walk–run · A',
            group: 'run',
            kind: 'brief-run',
            items: []
        }, briefSlots('Brief hybrid')[1], {
            title: 'Brief walk–run · B',
            group: 'run',
            kind: 'brief-run',
            items: []
        }]
}, {
    id: 'QR3',
    goal: 'running',
    name: 'Running · 15-minute walk–run start',
    days: 3,
    minutes: 15,
    experience: 'all',
    equipment: 'flexible',
    brief: true,
    source: 'WHO-ACTIVITY',
    description: 'Five minutes walking, five rounds of 20 seconds easy jogging and 40 seconds walking, then five minutes walking. Repeat while building comfort. This is an app-designed introduction, not the NHS sequence or a promise to reach 5 km in 15 minutes.',
    slots: [0, 1, 2].map(i => ({
        title: '15-minute walk–run · ' + String.fromCharCode(65 + i),
        group: 'run',
        kind: 'brief-run',
        items: []
    }))
});
programCatalog.push({
    id: 'SP2',
    goal: 'sport',
    name: 'Sport · Full strength foundation 2',
    days: 2,
    minutes: 60,
    experience: 'all',
    equipment: 'flexible',
    source: 'ACSM-2026',
    description: 'Two full strength sessions to support general athletic development outside a coach-led season. Covers squat, hinge, push, pull, calf and core work. Sport skills, sprint planning and position-specific prescriptions are not included.',
    slots: [lift('Athletic foundation · A', 'full', [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['lib-db-floor-press', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]), lift('Athletic foundation · B', 'full', [['split', 2, 8, 12, 90], ['rdl', 2, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
});
// Established lifting variants can progress weighted assistance; novice options retain simpler variations.
for (var _p of programCatalog) {
    if (['some', 'advanced'].includes(_p.experience) && ['gym', 'dumbbells'].includes(_p.equipment) && !_p.brief)
        _p.slots = _p.slots.map(x => ({
            ...x,
            items: x.items.map(i => [i[0] === 'split' ? 'lib-db-split-squat' : i[0] === 'calf' ? 'ref-Standing_Dumbbell_Calf_Raise' : i[0], i[1], i[2], i[3], i[4]])
        }));
}
var pbDb = programCatalog.find(p => p.id === 'PBDB3');
[pbDb.slots[2].items[0], pbDb.slots[2].items[1]] = [pbDb.slots[2].items[1], pbDb.slots[2].items[0]];
var programFamilies = [{
        id: 'general',
        name: 'General fitness foundation'
    }, {
        id: 'strength',
        name: 'General strength'
    }, {
        id: 'powerlifting',
        name: 'Pure powerlifting'
    }, {
        id: 'powerbuilding',
        name: 'Powerbuilding'
    }, {
        id: 'muscle-full',
        name: 'Muscle growth · full body'
    }, {
        id: 'muscle-split',
        name: 'Muscle growth · split'
    }, {
        id: 'calisthenics',
        name: 'Calisthenics'
    }, {
        id: 'hybrid',
        name: 'Strength + endurance'
    }, {
        id: 'running',
        name: 'Running development'
    }, {
        id: 'sport',
        name: 'Athletic foundations'
    }];
function familyForProgram(p) {
    return programFamilies.find(f => f.id === (p.goal === 'hypertrophy' ? p.days >= 4 ? 'muscle-split' : 'muscle-full' : p.goal)).name;
}
// Accurate requirement summaries and progression levels are shown before acceptance.
for (var _p2 of programCatalog) {
    _p2.level ??= _p2.experience === 'all' ? 'foundation' : 'build';
    _p2.requirements ??= _p2.equipment === 'flexible' && _p2.goal !== 'running' ? ['Uses your selected home, dumbbell or full-gym setup', 'Home pulling needs a resistance band and suitable anchor'] : _p2.goal === 'running' ? ['Suitable route or treadmill; appropriate footwear'] : _p2.equipment === 'gym' ? ['Barbell, plates, rack with safeties and bench', 'Dumbbells, cable station and listed leg machines'] : _p2.equipment === 'dumbbells' ? ['A suitable range of dumbbell loads', 'Stable support for incline push-ups and floor space'] : ['Resistance band and an anchor designed for rows', 'Stable support for incline push-ups and floor space'];
}
// Checked authorship and published format, not clinical validation or a licensed app implementation.
var programReferences = [{
        id: 'ref-tsa-beginner',
        goal: 'powerlifting',
        name: 'TSA Beginner Approach',
        author: 'The Strength Athlete',
        days: 4,
        weeks: 9,
        experience: 'New to powerlifting',
        description: 'An introduction to structured squat, bench and deadlift training. Review the author’s loading instructions before starting.',
        url: 'https://www.thestrengthathlete.com/freebies',
        checked: '2026-10-07'
    }, {
        id: 'ref-tsa-intermediate',
        goal: 'powerlifting',
        name: 'TSA Intermediate 2.0',
        author: 'The Strength Athlete',
        days: 4,
        weeks: 9,
        experience: 'Intermediate',
        description: 'A volume-focused opening, a deload, then heavier work. Includes the author’s RPE and program guidance.',
        url: 'https://www.thestrengthathlete.com/freebies',
        checked: '2026-10-07'
    }, {
        id: 'ref-calgary16',
        goal: 'powerlifting',
        name: 'Calgary Barbell 16-Week',
        author: 'Calgary Barbell',
        days: 4,
        weeks: 16,
        experience: 'Established squat, bench and deadlift practice',
        description: 'Frequent competition-lift practice, percentage and RPE loading, and a meet taper. Get the full program from its author.',
        url: 'https://www.calgarybarbell.com/16-week-program',
        checked: '2026-10-07'
    }, {
        id: 'ref-phul',
        goal: 'powerbuilding',
        name: 'PHUL',
        author: 'Brandon Campbell',
        days: 4,
        weeks: 12,
        experience: 'Intermediate',
        description: 'Two upper/lower power days and two upper/lower hypertrophy days. Strength and muscle growth share the focus.',
        url: 'https://www.muscleandstrength.com/workouts/phul-workout',
        checked: '2026-10-07'
    }, {
        id: 'ref-phat',
        goal: 'powerbuilding',
        name: 'PHAT',
        author: 'Layne Norton',
        days: 5,
        weeks: null,
        experience: 'Experienced with higher training volume',
        description: 'Two power days and three hypertrophy days. The published example is a demanding ongoing structure, not a fixed-length block.',
        url: 'https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/',
        checked: '2026-10-07'
    }, {
        id: 'ref-jt2',
        goal: 'powerbuilding',
        name: 'Jacked & Tan 2.0',
        author: 'Cody Lefever',
        days: 4,
        weeks: 12,
        experience: 'Experienced with higher training volume',
        description: 'Two six-week blocks using primary, secondary and accessory tiers. Emphasizes muscle growth and work capacity alongside strength.',
        url: 'https://swoleateveryheight.blogspot.com/2016/07/jacked-tan-20.html',
        checked: '2026-10-07'
    }];
function equipmentRequirements(p, equipment) {
    return p.equipment !== 'flexible' || p.goal === 'running' ? p.requirements || [] : equipment === 'Bodyweight + band' ? ['Floor space, a band and a secure anchor intended for rows', 'A stable push-up support'] : equipment === 'Full gym' ? ['Selectorized leg/chest press and cable row', 'Dumbbells, floor space and stable balance support'] : ['Dumbbells with suitable available loads; no weight bench needed', 'Floor space and stable balance support'];
}
// Smaller complete blocks retain their own stated scope and training goal.
var shortHybrid = programCatalog.find(p => p.id === 'QHY4');
programCatalog.push({
    ...shortHybrid,
    id: 'QHY3',
    name: 'Hybrid · Three-day starter',
    days: 3,
    description: 'Two short strength days and one 15-minute walk–run each week. A starting plan with less running practice than the four-day option.',
    slots: [shortHybrid.slots[0], shortHybrid.slots[2], shortHybrid.slots[1]]
});
var fullHybrid = programCatalog.find(p => p.id === 'HY4');
programCatalog.push({
    ...fullHybrid,
    id: 'HY3',
    name: 'Hybrid · Strength first, three days',
    days: 3,
    description: 'Two full strength sessions and one easy walk–run each week. Strength gets most of the time. One running day is not a race training plan.',
    slots: [fullHybrid.slots[0], fullHybrid.slots[2], {
            ...fullHybrid.slots[1],
            kind: 'brief-run'
        }]
});
var shortRun = programCatalog.find(p => p.id === 'QR3');
programCatalog.push({
    ...shortRun,
    id: 'QR2',
    name: 'Running · Two-day walk–run start',
    days: 2,
    description: 'Two repeatable 15-minute introductions each week. Walk instead of jogging when needed. This app-original start is not the NHS plan and does not promise race readiness.',
    slots: shortRun.slots.slice(0, 2)
});
programCatalog.push({
    id: 'PLSTART3',
    goal: 'powerlifting',
    name: 'Powerlifting · SBD learning 3',
    description: 'Three short practice sessions. One competition lift plus assistance each day. Start light and learn the setup. This is a learning block, not meet preparation. Allow more time if a lift is new; never rush the warm-up.',
    days: 3,
    minutes: 30,
    experience: 'all',
    equipment: 'gym',
    source: 'PL-EXPERT',
    slots: [lift('Learn the squat + row', 'full', [['bar-squat', 2, 5, 8, 150], ['row', 2, 8, 12, 90]]), lift('Learn the bench + calf raise', 'full', [['bench', 2, 5, 8, 150], ['calf', 2, 10, 15, 60]]), lift('Learn the deadlift + core', 'full', [['deadlift', 2, 4, 6, 180], ['deadbug', 2, 6, 8, 60]])]
});
for (var [_id2, _goal2, label] of [['GFSTAND2', 'general', 'General fitness'], ['STSTAND2', 'strength', 'Strength']]) {
    programCatalog.push({
        id: _id2,
        goal: _goal2,
        name: label + ' · Standing band foundation',
        description: 'A foundation without floor transfers. Use a wall for push-ups and steady support for squats and calf raises. A band and a rated row anchor are required. This is not a rehabilitation plan.',
        days: 2,
        minutes: 50,
        experience: 'all',
        equipment: 'bodyweight-band',
        noFloor: true,
        youth: true,
        source: 'ACSM-2026',
        requirements: ['Resistance band and anchor designed for rows', 'A clear wall and steady support; no floor transfers'],
        slots: [lift('Standing strength · A', 'full', [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]), lift('Standing strength · B', 'full', [['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]])]
    });
}
programCatalog.push({
    id: 'GFNOGROUND2',
    goal: 'general',
    name: 'General fitness · Seated machine foundation',
    description: 'Two gym sessions without getting onto the floor. Covers legs, pushing and pulling with stable machines. Choose machines you can get into and out of comfortably; this is not rehabilitation.',
    days: 2,
    minutes: 50,
    experience: 'all',
    equipment: 'gym',
    noFloor: true,
    source: 'ACSM-2026',
    requirements: ['Selectorized leg press, chest press and seated leg curl', 'Seated cable row and lat pulldown', 'Steady support for calf raises'],
    slots: [lift('Machine foundation · A', 'full', [['lib-stack-leg-press', 2, 8, 12, 120], ['lib-stack-chest-press', 2, 8, 12, 120], ['lib-cable-seated-row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60]]), lift('Machine foundation · B', 'full', [['leg-curl', 2, 8, 12, 90], ['lib-stack-leg-press', 2, 8, 12, 120], ['lib-stack-chest-press', 2, 8, 12, 120], ['pulldown', 2, 8, 12, 120]])]
});
programCatalog.push({
    id: 'GFNONE2',
    goal: 'general',
    name: 'General fitness · No-equipment movement start',
    description: 'Two brief sessions using bodyweight, a clear wall and steady support. This introduces squat, push and calf work. It has no loaded pull or complete strength coverage; add a band or weights for that next step.',
    days: 2,
    minutes: 15,
    experience: 'all',
    equipment: 'none',
    brief: true,
    noFloor: true,
    youth: true,
    source: 'TIME-EFFICIENT',
    requirements: ['Clear wall, floor space to stand and steady support', 'No weights or band; pulling strength is not covered'],
    slots: [lift('Movement start · A', 'full', [['bw-squat', 1, 8, 12, 90], ['pushup', 1, 6, 10, 90], ['calf', 1, 10, 15, 60]]), lift('Movement start · B', 'full', [['bw-squat', 1, 8, 12, 90], ['pushup', 1, 6, 10, 90], ['calf', 1, 10, 15, 60]])]
});
// Standing alternatives retain push, pull, knee and hip work without floor transfers.
var standingA = () => [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['pushup', 2, 6, 12, 90], ['row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60]];
var standingB = () => [['split', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['calf', 2, 10, 15, 60]];
var _loop2 = function (_goal3) {
    var tune = items => items.map((i, n) => _goal3 === 'powerbuilding' && n === 0 ? [i[0], 2, 5, 8, 150] : _goal3 === 'strength' && ['squat', 'rdl', 'ohp', 'row'].includes(i[0]) ? [i[0], 2, 6, 10, 150] : i);
    programCatalog.push({
        id: _id3,
        goal: _goal3,
        name: title + ' · Standing dumbbells 2',
        description: 'Two full standing sessions with dumbbells, wall push-ups and balance support. No floor transfers, bench or band. ' + (_goal3 === 'sport' ? 'This is general strength, not position-specific sport training.' : _goal3 === 'powerbuilding' ? 'Strength and muscle work use dumbbells; this is not competition barbell practice.' : 'Keep support and movement range consistent. Wall push-ups may eventually need a more challenging reviewed alternative.'),
        days: 2,
        minutes: 55,
        experience: 'all',
        equipment: 'dumbbells',
        noFloor: true,
        source,
        requirements: ['Dumbbells, clear wall and steady balance support', 'Space for standing rows and hip hinges; no floor work'],
        slots: [lift(title + ' · Standing A', 'full', tune(standingA())), lift(title + ' · Standing B', 'full', tune(standingB()))]
    });
};
for (var [_id3, _goal3, title, source] of [['STDBST2', 'strength', 'Strength', 'ACSM-2026'], ['GFDBST2', 'general', 'General fitness', 'ACSM-2026'], ['BBDBST2', 'hypertrophy', 'Build muscle', 'HYP-EXPERT'], ['PBDBST2', 'powerbuilding', 'Strength + muscle', 'PB-EXPERT'], ['SPDBST2', 'sport', 'Sport strength foundation', 'ACSM-2026']]) {
    _loop2(_goal3);
}
programCatalog.push({
    id: 'CALDB2',
    goal: 'calisthenics',
    name: 'Calisthenics · Bodyweight + dumbbell pulling',
    description: 'Two standing bodyweight sessions with dumbbell rows for pulling. No floor transfers or band. This mixed-equipment foundation does not include advanced bodyweight skills or pure bodyweight pulling.',
    days: 2,
    minutes: 45,
    experience: 'all',
    equipment: 'dumbbells',
    noFloor: true,
    source: 'ACSM-2026',
    requirements: ['One dumbbell for rows, a clear wall and steady balance support'],
    slots: [lift('Bodyweight + pulling · A', 'full', [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]), lift('Bodyweight + pulling · B', 'full', [['split', 2, 8, 12, 90], ['pushup', 2, 6, 12, 120], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]])]
});
for (var home of [false, true])
    programCatalog.push({
        id: home ? 'HYHOME2' : 'HYDB2',
        goal: 'hybrid',
        name: 'Hybrid · Two-day ' + (home ? 'home' : 'dumbbell') + ' introduction',
        description: 'Two separated sessions combine strength practice with a fixed ten-minute walk/jog finish. A modest introduction for a small schedule, not a race plan or the same weekly work as a four-day block.',
        days: 2,
        minutes: 60,
        experience: 'all',
        equipment: home ? 'bodyweight-band' : 'dumbbells',
        noFloor: !home,
        source: 'CONCURRENT',
        requirements: home ? ['Resistance band, purpose-built secure anchor and stable push-up support', 'Suitable walking/jogging space or treadmill'] : ['Dumbbells, clear wall and steady balance support', 'Suitable walking/jogging space or treadmill'],
        slots: [{
                ...lift('Combined strength + walk/jog · A', 'full', home ? [['bw-squat', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['lib-band-standing-row', 2, 8, 12, 90]] : standingA().slice(0, 4)),
                conditioning: 'walkrun'
            }, {
                ...lift('Combined strength + walk/jog · B', 'full', home ? [['split', 2, 8, 12, 90], ['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['lib-band-standing-row', 2, 8, 12, 90]] : standingB().slice(0, 4)),
                conditioning: 'walkrun'
            }]
    });
for (var _p3 of programCatalog) {
    _p3.level ??= _p3.experience === 'all' ? 'foundation' : 'build';
    _p3.requirements ??= _p3.equipment === 'gym' ? ['Barbell, plates, rack with safeties and bench', 'Dumbbells and steady support'] : ['Review each exercise’s listed equipment'];
}
// Clear public names; program IDs and workout role titles remain stable.
var programDisplayNames = {
    "PL3": "Powerlifting · 3-day basics",
    "PL4": "Powerlifting · 4-day strength",
    "PB3": "Strength & muscle · 3-day full body",
    "PB4": "Strength & muscle · 4-day upper/lower",
    "BB3": "Build muscle · 3-day full body",
    "BB4": "Build muscle · 4-day upper/lower",
    "HY4": "Strength & running · Start with walk–runs",
    "HY5": "Strength & running · 5-day plan",
    "PLU3": "Powerlifting · 3-day varied reps",
    "PBPH4": "Strength & muscle · Heavy and higher-rep days",
    "PBT4": "Strength & muscle · Main lift and accessories",
    "ST2": "Strength · 2-day dumbbell basics",
    "ST3": "Strength · 3-day barbell plan",
    "GF2": "General fitness · 2-day dumbbell plan",
    "GFHOME2": "General fitness · 2-day home plan",
    "CAL2": "Bodyweight training · 2-day basics",
    "CAL3": "Bodyweight training · 3-day basics",
    "RNEASY3": "Running · 3 easy runs a week",
    "PL2": "Powerlifting · 2-day basics",
    "PBSTART2": "Strength & muscle · 2-day starter",
    "PBSTART3": "Strength & muscle · 3-day starter",
    "PBDB3": "Strength & muscle · 3-day dumbbell plan",
    "BB2": "Build muscle · 2-day full body",
    "BBDB3": "Build muscle · 3-day dumbbell plan",
    "BBM3": "Build muscle · Machines and cables",
    "STGYM2": "Strength · 2-day machine basics",
    "STDB3": "Strength · 3-day dumbbell plan",
    "GF3": "General fitness · 3-day dumbbell plan",
    "GFM2": "General fitness · 2-day machine plan",
    "CALBUILD3": "Bodyweight training · 3-day progression",
    "CALBUILD2": "Bodyweight training · 2-day progression",
    "HYHOME4": "Strength & running · Home workouts and walk–runs",
    "HYDB4": "Strength & running · Dumbbells and easy runs",
    "RNBASE4": "Running · 4 easy runs a week",
    "BBHOME3": "Build muscle · 3-day bodyweight and band plan",
    "BBADV4": "Build muscle · Advanced upper/lower",
    "PLW4": "Powerlifting · Advanced 4-day plan",
    "PBW4": "Strength & muscle · Advanced 4-day plan",
    "ST4": "Strength · Advanced upper/lower",
    "QG2": "General fitness · 2 short workouts",
    "QG3": "General fitness · 3 short workouts",
    "QS2": "Strength · 2 short workouts",
    "QM2": "Build muscle · 2 short workouts",
    "QC2": "Bodyweight training · 2 short workouts",
    "QPB2": "Strength & muscle · 2 short workouts",
    "QSP2": "Strength for sport · 2 short workouts",
    "QS3": "Strength · 3 short workouts",
    "QM3": "Build muscle · 3 short workouts",
    "QPB3": "Strength & muscle · 3 short workouts",
    "QC3": "Bodyweight training · 3 short workouts",
    "QSP3": "Strength for sport · 3 short workouts",
    "QPL3": "Powerlifting · Short squat, bench and deadlift practice",
    "QHY4": "Strength & running · 4 short workouts",
    "QR3": "Running · Three short walk–runs",
    "SP2": "Strength for sport · 2-day full body",
    "QHY3": "Strength & running · 3 short workouts",
    "HY3": "Strength & running · 3-day starter",
    "QR2": "Running · Two short walk–runs",
    "PLSTART3": "Powerlifting · Learn the three lifts",
    "GFSTAND2": "General fitness · Standing band workouts",
    "STSTAND2": "Strength · Standing band workouts",
    "GFNOGROUND2": "General fitness · Machines, no floor work",
    "GFNONE2": "General fitness · Start without equipment",
    "STDBST2": "Strength · Standing dumbbell workouts",
    "GFDBST2": "General fitness · Standing dumbbell workouts",
    "BBDBST2": "Build muscle · Standing dumbbell workouts",
    "PBDBST2": "Strength & muscle · Standing dumbbell workouts",
    "SPDBST2": "Strength for sport · Standing dumbbell workouts",
    "CALDB2": "Bodyweight training · With dumbbell rows",
    "HYDB2": "Strength & running · 2-day dumbbell starter",
    "HYHOME2": "Strength & running · 2-day home starter"
};
// Original app splits: six sessions distribute weekly work; day seven is easy
// activity. ACSM's public 2026 guidance supports goal-specific volume and
// individualization, not a claim that seven hard sessions are necessary.
var goalLabels = {
    general: 'General fitness',
    strength: 'Strength',
    hypertrophy: 'Build muscle',
    powerbuilding: 'Strength & muscle',
    calisthenics: 'Bodyweight training',
    sport: 'Strength for sport'
};
for (var _goal4 of Object.keys(goalLabels))
    for (var _days of [6, 7])
        for (var build of [false, true]) {
            if (build && ['general', 'sport', 'calisthenics'].includes(_goal4))
                continue;
            var main = build ? _goal4 === 'hypertrophy' ? 5 : 4 : 2, assist = build ? 2 : 1, lo = _goal4 === 'strength' || _goal4 === 'powerbuilding' ? 5 : 8, hi = _goal4 === 'strength' || _goal4 === 'powerbuilding' ? 8 : 12;
            var _slots = [];
            for (var cycle = 0; cycle < 2; cycle++) {
                _slots.push(lift(`Push · ${cycle ? 'B' : 'A'}`, 'push', [[_goal4 === 'calisthenics' ? 'pushup' : 'lib-db-floor-press', main, lo, hi, 120], ['ohp', assist, 8, 12, 90], ...(build ? [['lateral', 2, 10, 15, 60]] : [])]));
                _slots.push(lift(`Pull · ${cycle ? 'B' : 'A'}`, 'pull', [['row', build ? 5 : 2, 8, 12, 120], ['curl', assist, 10, 15, 60]]));
                _slots.push(lift(`Lower body · ${cycle ? 'B' : 'A'}`, 'lower', [['squat', main, lo, hi, 120], ['rdl', build ? _goal4 === 'hypertrophy' ? 5 : 3 : 1, 8, 12, 120], ['calf', assist, 10, 15, 60]]));
            }
            if (_days === 7)
                _slots.push({
                    title: 'Easy activity · recovery walk',
                    group: 'activity',
                    kind: 'recovery-walk',
                    items: []
                });
            programCatalog.push({
                id: `D${_days}-${_goal4}-${build ? 'BUILD' : 'START'}`,
                goal: _goal4,
                name: `${goalLabels[_goal4]} · ${_days} days, ${build ? 'more weekly work' : 'short distributed starter'}`,
                description: build ? 'Six focused lifting sessions with each movement family twice weekly. Main work is distributed rather than repeating full-body sessions every day.' : 'Six shorter lifting sessions with modest weekly work. Each movement family repeats twice; a useful starting dose, with less volume than a complete muscle-growth block.',
                days: _days,
                minutes: build ? 55 : 35,
                experience: build ? 'some' : 'all',
                level: build ? 'build' : 'foundation',
                equipment: 'flexible',
                source: 'ACSM-2026',
                brief: true,
                distributed: true,
                slots: _slots
            });
        }
for (var _days2 of [6, 7]) {
    var _slots2 = [lift('Squat practice · A', 'lower', [['bar-squat', 2, 4, 6, 180], ['lib-bar-rdl', 1, 8, 10, 120]]), lift('Bench practice · A', 'upper', [['bench', 2, 4, 6, 180], ['row', 2, 8, 12, 120]]), lift('Deadlift practice', 'lower', [['deadlift', 2, 3, 5, 180], ['calf', 1, 10, 15, 60]]), lift('Bench practice · lighter', 'upper', [['bench', 2, 6, 8, 150], ['row', 2, 8, 12, 120]]), lift('Squat practice · B', 'lower', [['bar-squat', 2, 5, 8, 180], ['lib-bar-rdl', 1, 8, 10, 120]]), lift('Bench practice · B', 'upper', [['bench', 2, 4, 6, 180], ['row', 2, 8, 12, 120]])];
    if (_days2 === 7)
        _slots2.push({
            title: 'Easy activity · recovery walk',
            group: 'activity',
            kind: 'recovery-walk',
            items: []
        });
    programCatalog.push({
        id: `D${_days2}-SBD`,
        goal: 'powerlifting',
        name: `Powerlifting · ${_days2} days, distributed SBD practice`,
        description: 'Alternate lower-body and bench-focused practice. Squat twice, deadlift once and bench three times with a lighter bench day. Small work sets; this is a learning/development block, not meet peaking.',
        days: _days2,
        minutes: 45,
        experience: 'all',
        equipment: 'gym',
        source: 'ACSM-2026',
        brief: true,
        distributed: true,
        slots: _slots2
    });
}
for (var _goal5 of Object.keys(goalLabels))
    for (var _days3 of [6, 7]) {
        var _slots3 = [];
        for (var n = 0; n < 2; n++) {
            _slots3.push(lift(`Very short push · ${n ? 'B' : 'A'}`, 'push', [['pushup', 1, 6, 10, 120], ['ohp', 1, 8, 10, 90]]));
            _slots3.push(lift(`Very short pull · ${n ? 'B' : 'A'}`, 'pull', [['row', 1, 8, 10, 120], ['curl', 1, 8, 10, 60]]));
            _slots3.push(lift(`Very short lower · ${n ? 'B' : 'A'}`, 'lower', [['squat', 1, 8, 10, 120], ['rdl', 1, 8, 10, 120]]));
        }
        if (_days3 === 7)
            _slots3.push({
                title: 'Easy activity · recovery walk',
                group: 'activity',
                kind: 'recovery-walk',
                items: []
            });
        programCatalog.push({
            id: `D${_days3}-${_goal5}-MICRO`,
            goal: _goal5,
            name: `${goalLabels[_goal5]} · ${_days3} days, very short practice`,
            description: 'Two exercises per lifting day, one work set each. Each movement family twice weekly. This is a small starting dose, not the weekly volume of a complete growth or heavy-strength block. No direct calf or trunk work.',
            days: _days3,
            minutes: 20,
            experience: 'all',
            level: 'foundation',
            equipment: 'flexible',
            source: 'ACSM-2026',
            brief: true,
            distributed: true,
            slots: _slots3
        });
    }
for (var _days4 of [6, 7]) {
    var original = programCatalog.find(d => d.id === 'GFNONE2');
    var _slots4 = [];
    for (var _n = 0; _n < _days4; _n++)
        _slots4.push(_n === 0 || _n === 3 ? {
            ...original.slots[_n === 0 ? 0 : 1],
            title: 'Supported movement practice · ' + (_n === 0 ? 'A' : 'B')
        } : {
            title: 'Easy activity · ' + (_n + 1),
            group: 'activity',
            kind: 'recovery-walk',
            items: []
        });
    programCatalog.push({
        ...original,
        id: `D${_days4}-general-NONE`,
        name: `General fitness · ${_days4} activity days without weights`,
        description: 'Two supported movement sessions plus comfortable walks. No-equipment training has limited pulling and load progression; this is an activity starter, not complete muscle-growth or heavy-strength coverage.',
        days: _days4,
        minutes: 20,
        distributed: true,
        slots: _slots4
    });
}
for (var _goal6 of ['general', 'strength', 'calisthenics', 'sport'])
    for (var _days5 of [6, 7]) {
        var _slots5 = [];
        for (var _n2 = 0; _n2 < _days5; _n2++)
            _slots5.push(_n2 === 0 || _n2 === 3 ? lift(`Supervised foundation · ${_n2 === 0 ? 'A' : 'B'}`, 'full', [['squat', 1, 8, 12, 120], ['rdl', 1, 8, 12, 120], ['pushup', 1, 8, 12, 120], ['row', 1, 8, 12, 120], ['deadbug', 1, 8, 12, 60]]) : {
                title: 'Easy activity · ' + (_n2 + 1),
                group: 'activity',
                kind: 'recovery-walk',
                items: []
            });
        programCatalog.push({
            id: `D${_days5}-${_goal6}-HABIT`,
            goal: _goal6,
            name: `${goalLabels[_goal6]} · ${_days5} activity days, two strength foundations`,
            description: 'Two nonconsecutive whole-body foundations plus easy walks. A daily activity habit with modest strength work; qualified supervision is required for youth. This does not add six hard lifting days.',
            days: _days5,
            minutes: 40,
            experience: 'all',
            equipment: 'flexible',
            source: 'ACSM-2026',
            brief: true,
            distributed: true,
            youth: true,
            slots: _slots5
        });
    }
for (var program of programCatalog)
    program.name = programDisplayNames[program.id] ?? program.name;
// Reconcile card minima with the shared duration audit (full displayed work).
var auditedMinimumMinutes = {
    "BB3": 71,
    "HY4": 60,
    "ST2": 63,
    "GF2": 63,
    "GFHOME2": 49,
    "CAL2": 56,
    "PBSTART3": 71,
    "STGYM2": 67,
    "HY3": 60,
    "PLSTART3": 34,
    "GFNONE2": 16,
    "HY5": 68,
    "CAL3": 48,
    "HYDB4": 76,
    "SP2": 66,
    "STDBST2": 59,
    "GFDBST2": 59,
    "BBDBST2": 59,
    "PBDBST2": 58,
    "SPDBST2": 59,
    "CALDB2": 52
};
for (var d of programCatalog)
    if (auditedMinimumMinutes[d.id])
        d.minutes = Math.max(d.minutes, auditedMinimumMinutes[d.id]);
for (var _d of programCatalog)
    if (['QR2', 'QR3'].includes(_d.id)) {
        _d.minutes = 20;
        _d.description += ' The timed sequence is 15 minutes; allow five additional minutes for preparation and recording, for a 20-minute session window.';
    }
// Individual coverage audit: complete foundations repeat chest, knee-dominant
// and hamstring work on at least two days. Add displayed work; never compress
// its rest or replace an already accepted user's calendar.
var coverageCorrections = {
    HY4: [[0, ['rdl', 2, 8, 12, 120]], [2, ['pushup', 2, 6, 12, 120]]],
    HY3: [[0, ['rdl', 2, 8, 12, 120]], [1, ['pushup', 2, 6, 12, 120]]],
    HY5: [[0, ['rdl', 1, 8, 12, 120]], [2, ['bar-squat', 2, 5, 8, 150]], [2, ['bench', 2, 6, 10, 150]]],
    ST2: [[1, ['pushup', 2, 6, 12, 120]]],
    GF2: [[1, ['pushup', 2, 6, 12, 120]]],
    CAL2: [[1, ['ref-Band_Good_Morning', 2, 8, 12, 90]]],
    CAL3: [[0, ['ref-Band_Good_Morning', 2, 8, 12, 90]]],
    HYDB4: [[2, ['pushup', 2, 6, 12, 120]]],
    SP2: [[1, ['pushup', 2, 6, 12, 120]]],
    GFSTAND2: [[0, ['ref-Band_Good_Morning', 2, 8, 12, 90]], [1, ['bw-squat', 2, 8, 12, 90]]],
    STSTAND2: [[0, ['ref-Band_Good_Morning', 2, 8, 12, 90]], [1, ['bw-squat', 2, 8, 12, 90]]],
    GFNOGROUND2: [[0, ['leg-curl', 2, 10, 15, 90]]],
    STDBST2: [[1, ['pushup', 2, 6, 12, 120]]],
    GFDBST2: [[1, ['pushup', 2, 6, 12, 120]]],
    BBDBST2: [[1, ['pushup', 2, 6, 12, 120]]],
    PBDBST2: [[1, ['pushup', 2, 6, 12, 120]]],
    SPDBST2: [[1, ['pushup', 2, 6, 12, 120]]],
    CALDB2: [[0, ['rdl', 2, 8, 12, 120]], [1, ['rdl', 2, 8, 12, 120]]],
    HYDB2: [[1, ['pushup', 2, 6, 12, 120]]]
};
var _loop3 = function (_id4) {
    var d = programCatalog.find(d => d.id === _id4);
    d.slots = d.slots.map(s => ({
        ...s,
        items: s.items.map(i => [...i])
    }));
    var _loop7 = function (item) {
        if (!d.slots[_slot].items.some(i => i[0] === item[0]))
            d.slots[_slot].items.push(item);
    };
    for (var [_slot, item] of additions) {
        _loop7(item);
    }
    d.description += ' Coverage includes chest, knee-dominant and hamstring work on two days. Review the complete time estimate before choosing.';
};
for (var [_id4, additions] of Object.entries(coverageCorrections)) {
    _loop3(_id4);
}
for (var _d2 of programCatalog)
    if (auditedMinimumMinutes[_d2.id])
        _d2.minutes = Math.max(_d2.minutes, auditedMinimumMinutes[_d2.id]);
// Expanded full sessions are separate from brief practice. Existing accepted
// plans retain their stored items; these changes apply to newly reviewed blocks.
function addWork(id, slot, item) {
    var d = programCatalog.find(p => p.id === id);
    d.slots = d.slots.map(s => ({
        ...s,
        items: s.items.map(i => [...i])
    }));
    if (!d.slots[slot].items.some(i => i[0] === item[0]))
        d.slots[slot].items.push(item);
}
for (var _id5 of ['BB4', 'BBADV4']) {
    addWork(_id5, 0, ['incline-press', 2, 8, 12, 120]);
    addWork(_id5, 2, ['lib-db-flat-bench-press', 2, 8, 12, 120]);
}
// Muscle blocks distribute work across repeated exposures, including hamstrings
// rather than counting every leg exercise as interchangeable lower-body work.
var _loop4 = function (_id6) {
    var d = programCatalog.find(p => p.id === _id6);
    d.slots = d.slots.map(s => ({
        ...s,
        items: s.items.map(i => {
            var next = [...i];
            if (['leg-curl', 'rdl'].includes(i[0]))
                next[1]++;
            return next;
        })
    }));
};
for (var _id6 of ['BB3', 'BBM3', 'BBDB3']) {
    _loop4(_id6);
}
addWork('BB3', 0, ['deadbug', 2, 6, 10, 60]);
addWork('BB3', 1, ['curl', 2, 10, 15, 90]);
addWork('BB3', 2, ['calf', 2, 10, 15, 60]);
addWork('BBDB3', 1, ['lib-db-floor-press', 2, 8, 12, 120]);
var _loop5 = function (_id7) {
    var d = programCatalog.find(p => p.id === _id7);
    var upper = d.slots.map((s, n) => s.group === 'upper' ? n : -1).filter(n => n >= 0);
    if (upper.length) {
        addWork(_id7, upper[0], ['incline-press', 2, 8, 12, 120]);
        addWork(_id7, upper[1], ['lib-db-flat-bench-press', 2, 8, 12, 120]);
    }
};
for (var _id7 of ['PB3', 'PB4', 'PBPH4', 'PBT4', 'PBW4']) {
    _loop5(_id7);
}
addWork('PB3', 0, ['deadbug', 2, 6, 10, 60]);
addWork('PB3', 1, ['split', 2, 8, 12, 120]);
addWork('PB3', 2, ['calf', 2, 10, 15, 60]);
addWork('PBT4', 0, ['leg-curl', 2, 10, 15, 90]);
addWork('PBT4', 1, ['pulldown', 2, 8, 12, 120]);
addWork('PBT4', 2, ['calf', 2, 10, 15, 60]);
addWork('PBT4', 3, ['lateral', 2, 10, 15, 90]);
addWork('PBPH4', 1, ['deadbug', 2, 6, 10, 60]);
// The undulating competition block now includes repeat pulling and assistance
// without turning its squat/bench/deadlift sessions into a bodybuilding split.
addWork('PLU3', 0, ['leg-curl', 2, 8, 12, 90]);
addWork('PLU3', 0, ['deadbug', 2, 6, 10, 60]);
addWork('PLU3', 1, ['pulldown', 3, 8, 12, 120]);
addWork('PLU3', 1, ['calf', 2, 10, 15, 60]);
addWork('PLU3', 2, ['row', 2, 8, 12, 120]);
addWork('PLU3', 2, ['leg-curl', 2, 8, 12, 90]);
var dbUpperA = () => [['lib-db-floor-press', 3, 6, 10, 150], ['row', 3, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['curl', 2, 10, 15, 90], ['lib-db-overhead-triceps', 2, 10, 15, 90]];
var dbUpperB = () => [['lib-db-floor-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['lib-db-hammer-curl', 2, 10, 15, 90], ['lib-db-overhead-triceps', 2, 10, 15, 90]];
var dbLowerA = () => [['squat', 3, 6, 10, 150], ['rdl', 3, 8, 12, 150], ['lib-db-split-squat', 2, 8, 12, 120], ['calf', 3, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
var dbLowerB = () => [['rdl', 3, 6, 10, 150], ['lib-db-split-squat', 3, 8, 12, 120], ['squat', 2, 8, 12, 120], ['calf', 3, 10, 15, 60], ['deadbug', 2, 6, 10, 60]];
for (var [_id8, _goal7, _label, _source] of [['BBDB4', 'hypertrophy', 'Build muscle', 'HYP-EXPERT'], ['PBDB4', 'powerbuilding', 'Strength & muscle', 'PB-EXPERT']]) {
    var _slots6 = [lift('Dumbbell upper · A', 'upper', dbUpperA()), lift('Dumbbell lower · A', 'lower', dbLowerA()), lift('Dumbbell upper · B', 'upper', dbUpperB()), lift('Dumbbell lower · B', 'lower', dbLowerB())];
    if (_goal7 === 'hypertrophy') {
        for (var _n3 of [0, 2]) {
            _slots6[_n3].items[0][1] = 4;
            _slots6[_n3].items[1][1] = 4;
        }
        _slots6[1].items[1][1] = 4;
        _slots6[3].items[0][1] = 4;
        _slots6[0].items.push(['pushup', 2, 6, 12, 120]);
    }
    else
        for (var slot of _slots6) {
            slot.items[0][2] = 5;
            slot.items[0][3] = 8;
            slot.items[0][4] = 180;
        }
    programCatalog.push({
        id: _id8,
        goal: _goal7,
        name: _label + ' · Dumbbell upper/lower 4',
        description: 'Four complete sessions without a bench or machines. Two upper and two lower days include pressing, rowing, leg work, shoulders, arms, calves and trunk. Keep per-hand loads and both sides consistent. A fixed or light pair may limit heavy-strength progress.',
        days: 4,
        minutes: 90,
        experience: 'some',
        level: 'build',
        equipment: 'dumbbells',
        source: _source,
        requirements: ['Matching dumbbells or adjustable pairs', 'Floor space and a secure push-up support; no bench required'],
        slots: _slots6
    });
}
// Five-day upper/lower + push/pull/legs uses five distinct sessions and repeats
// each main region. Hard lower-body work remains on only two separated days.
for (var [_id9, _goal8, _label2, _source2] of [['BB5', 'hypertrophy', 'Build muscle', 'HYP-EXPERT'], ['PB5', 'powerbuilding', 'Strength & muscle', 'PB-EXPERT']]) {
    var heavy = _goal8 === 'powerbuilding';
    programCatalog.push({
        id: _id9,
        goal: _goal8,
        name: _label2 + ' · Upper/lower + push/pull/legs 5',
        description: 'Five complete gym sessions. Upper and lower foundations are followed by dedicated push, pull and leg days. Each large muscle region receives repeated weekly work; the five-day calendar distributes the work rather than adding five maximal sessions.',
        days: 5,
        minutes: 90,
        experience: 'some',
        level: 'build',
        equipment: 'gym',
        source: _source2,
        requirements: ['Barbell, rack with safeties, flat and incline bench', 'Dumbbells, cable, pulldown, leg-curl and leg-extension machines', 'Floor space and calf-raise support'],
        slots: [lift('Upper foundation', 'upper', [['bench', 3, heavy ? 3 : 6, heavy ? 6 : 10, 180], ['row', 3, 6, 10, 120], ['incline-press', 2, 8, 12, 120], ['pulldown', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['curl', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]), lift('Lower foundation', 'lower', [['bar-squat', 3, heavy ? 3 : 6, heavy ? 6 : 10, 180], ['rdl', 3, 6, 10, 150], ['leg-extension', 2, 10, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]), lift('Push · chest + shoulders + triceps', 'push', [['incline-press', 3, 8, 12, 120], ['lib-db-flat-bench-press', 2, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['lateral', 2, 10, 15, 90], ['triceps', 3, 10, 15, 90]]), lift('Pull · back + biceps', 'pull', [['pulldown', 3, 6, 10, 120], ['lib-cable-seated-row', 2, 8, 12, 120], ['curl', 2, 8, 12, 90], ['lib-db-hammer-curl', 2, 10, 15, 90]]), lift('Legs · muscle + trunk', 'lower', [['bar-squat', 3, 8, 10, 150], ['rdl', 3, 8, 12, 150], ['leg-extension', 2, 10, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60], ['deadbug', 2, 6, 10, 60]])]
    });
}
programCatalog.push({
    id: 'BB2BUILD',
    goal: 'hypertrophy',
    name: 'Build muscle · Two-day complete build',
    description: 'Two longer full-body sessions for established lifters. Eight weekly sets each of chest, back, quadriceps and hamstrings, plus calf, arm and trunk work. Less weekly main-region volume than the ten-set four/five-day options, with more work per session.',
    days: 2,
    minutes: 110,
    experience: 'some',
    level: 'build',
    equipment: 'gym',
    source: 'HYP-EXPERT',
    requirements: ['Leg press, leg curl, cable row and pulldown', 'Dumbbells, flat and incline bench; calf support and floor space'],
    slots: [lift('Complete muscle build · A', 'full', [['lib-stack-leg-press', 4, 8, 12, 150], ['rdl', 4, 8, 12, 150], ['lib-db-flat-bench-press', 4, 8, 12, 150], ['lib-cable-seated-row', 4, 8, 12, 120], ['calf', 2, 10, 15, 60], ['curl', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]]), lift('Complete muscle build · B', 'full', [['squat', 4, 8, 12, 150], ['leg-curl', 4, 8, 12, 120], ['incline-press', 4, 8, 12, 150], ['pulldown', 4, 8, 12, 120], ['calf', 2, 10, 15, 60], ['triceps', 2, 10, 15, 90], ['deadbug', 2, 6, 10, 60]])]
});
// A daily fitness habit includes easy days; beginners need not lift hard five
// days to get a five-day schedule. The complete strength dose stays explicit.
var _loop6 = function (_base) {
    var original = programCatalog.find(d => d.id === _base);
    programCatalog.push({
        ...original,
        id: _id0,
        name: original.name.replace(/2[- ]day|foundation 2/i, '5-day habit'),
        description: 'Two complete separated strength sessions plus three easy walks. Repeat squat, hinge, push and pull work, with calf and trunk practice. The easy days build a routine; this is not five hard lifting days or a position-specific sport plan.',
        days: 5,
        level: 'foundation',
        slots: [original.slots[0], {
                title: 'Easy walk · A',
                group: 'activity',
                kind: 'recovery-walk',
                items: []
            }, original.slots[1], {
                title: 'Easy walk · B',
                group: 'activity',
                kind: 'recovery-walk',
                items: []
            }, {
                title: 'Easy walk · C',
                group: 'activity',
                kind: 'recovery-walk',
                items: []
            }]
    });
};
for (var [_id0, , _base] of [['GF5', 'general', 'GF2'], ['ST5', 'strength', 'ST2'], ['CAL5', 'calisthenics', 'CAL2'], ['SP5', 'sport', 'SP2']]) {
    _loop6(_base);
}
for (var _d3 of programCatalog) {
    var expandedMinutes = {
        PB4: 73,
        BB3: 79,
        BB4: 81,
        BBDB3: 79,
        BBADV4: 103
    };
    if (expandedMinutes[_d3.id])
        _d3.minutes = Math.max(_d3.minutes, expandedMinutes[_d3.id]);
}
// Complete modest-volume muscle foundations fit a one-hour window. Their lower
// dose is explicit; they do not claim the larger build blocks' weekly volume.
var modest = items => items.map((i, n) => [i[0], n < 4 ? 2 : 1, i[2], i[3], i[4]]);
for (var [_id1, equipment, _slots7] of [['BBF3', 'gym', [lift('Muscle foundation · A', 'full', modest(machineA())), lift('Muscle foundation · B', 'full', modest(machineB())), lift('Muscle foundation · C', 'full', modest(machineA()))]], ['BBFDB3', 'dumbbells', [lift('Dumbbell muscle foundation · A', 'full', modest(dbA())), lift('Dumbbell muscle foundation · B', 'full', [['rdl', 2, 8, 12, 120], ['lib-db-floor-press', 2, 8, 12, 120], ['row', 2, 8, 12, 120], ['lib-db-split-squat', 2, 8, 10, 120], ['ohp', 1, 8, 12, 90], ['calf', 1, 10, 15, 60]]), lift('Dumbbell muscle foundation · C', 'full', modest(dbC()))]], ['BBFHOME3', 'bodyweight-band', [lift('Home muscle foundation · A', 'full', modest(homeA())), lift('Home muscle foundation · B', 'full', modest(homeB())), lift('Home muscle foundation · C', 'full', modest(homeA()))]]]) {
    programCatalog.push({
        id: _id1,
        goal: 'hypertrophy',
        name: 'Build muscle · ' + (equipment === 'gym' ? 'Machine' : equipment === 'dumbbells' ? 'Dumbbell' : 'Home band') + ' foundation 3',
        description: 'Three complete, modest-volume sessions repeat chest, back, knee-dominant and hamstring work, with calf or trunk practice. Two main work sets keep this foundation within about an hour. Build controlled reps and loads; choose a larger growth block once time and tolerance allow. It does not claim the ten-set build blocks’ volume.',
        days: 3,
        minutes: 60,
        experience: 'all',
        level: 'foundation',
        equipment,
        source: 'ACSM-2026',
        slots: _slots7
    });
}
programCatalog.push(...researchedPrograms);
export { weightGoals };
export { goalForCategory };
export { programEquipment };
export { programCatalog };
export { programFamilies };
export { familyForProgram };
export { programReferences };
export { equipmentRequirements };
