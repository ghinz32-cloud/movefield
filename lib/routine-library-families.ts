import type {ProgramDefinition, ProgramSlot} from './program-catalog';

// Reviewed inputs adapted from Claude's ea9e4d5 routine-library branch.
// These are proposals, not runtime plans. scripts/generate-routine-library.cjs
// uses the current engine to qualify each original offered ID before publication.
// Longer availability never increases reference sets automatically. Unsupported
// sport/jump/sprint prescriptions remain in this audit input and are withheld.
type Item = ProgramSlot['items'][number];
type Slot = {title: string; group: ProgramSlot['group']; items?: Item[]; kind?: ProgramSlot['kind']};
type Family = {
  code: string; goal: ProgramDefinition['goal']; name: string; days: number;
  experience: ProgramDefinition['experience']; equipment: ProgramDefinition['equipment'];
  budget: 'hypertrophy' | 'strength'; source: string; summary: string; slots: Slot[];
};

export const routineFamilies: Family[] = [
  // Powerlifting reference work. Qualification retains weekly competition-lift practice.
  {code: 'PL1', goal: 'powerlifting', name: 'Full Body A/B/C', days: 3, experience: 'all', equipment: 'gym', budget: 'strength', source: 'ACSM-2026',
    summary: 'Three full-body days. Squat, bench and deadlift each appear every week, with heavy sets of six reps or fewer.',
    slots: [
      {title: 'Squat and bench · A', group: 'full', items: [['bar-squat', 3, 3, 5, 180], ['bench', 3, 4, 6, 180], ['row', 3, 8, 10, 120], ['triceps', 2, 10, 12, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Deadlift and press · B', group: 'full', items: [['deadlift', 3, 3, 5, 210], ['ohp', 3, 6, 8, 120], ['pulldown', 3, 8, 10, 120], ['leg-extension', 2, 12, 15, 90], ['leg-curl', 2, 10, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Squat and bench · C', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 3, 5, 6, 150], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['lib-cable-seated-row', 3, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL2', goal: 'powerlifting', name: 'Upper and Lower, Heavy and Volume', days: 4, experience: 'some', equipment: 'gym', budget: 'strength', source: 'PERIODIZATION',
    summary: 'Four days: heavier squat, bench and deadlift sessions plus additional bench volume. The heavier work uses sets of six reps or fewer.',
    slots: [
      {title: 'Lower · heavy squat', group: 'lower', items: [['bar-squat', 3, 3, 5, 180], ['rdl', 3, 6, 8, 150], ['leg-curl', 2, 10, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Upper · heavy bench', group: 'upper', items: [['bench', 3, 3, 5, 180], ['row', 3, 6, 8, 120], ['pulldown', 2, 8, 10, 120], ['triceps', 2, 10, 12, 90]]},
      {title: 'Lower · deadlift strength', group: 'lower', items: [['deadlift', 3, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-extension', 2, 10, 12, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Upper · bench volume', group: 'upper', items: [['bench', 3, 6, 8, 150], ['incline-press', 3, 8, 10, 120], ['lib-cable-seated-row', 3, 8, 10, 120], ['lateral', 3, 10, 15, 90], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL3', goal: 'powerlifting', name: 'Low-Volume Lift Practice', days: 3, experience: 'all', equipment: 'gym', budget: 'strength', source: 'ACSM-2026',
    summary: 'Two working sets for each main lift across three days. This lower-volume option leaves time for preparation and does not promise maximal progress.',
    slots: [
      {title: 'Squat and bench · A', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 2, 4, 6, 180], ['row', 2, 8, 10, 120], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Deadlift and press · B', group: 'full', items: [['deadlift', 2, 3, 5, 210], ['ohp', 2, 8, 10, 120], ['pulldown', 2, 8, 10, 120], ['calf', 2, 10, 15, 60]]},
      {title: 'Squat and bench · C', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 2, 4, 6, 180], ['lib-plate-leg-press-45', 2, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL4', goal: 'powerlifting', name: 'Heavy, Medium and Light Days', days: 3, experience: 'some', equipment: 'gym', budget: 'strength', source: 'PERIODIZATION',
    summary: 'Squat and bench practice across three days, with deadlift on two days. Rep ranges vary; choose the load from your own performance and the displayed effort target.',
    slots: [
      {title: 'Heavy day', group: 'full', items: [['bar-squat', 3, 3, 5, 210], ['bench', 3, 3, 5, 180], ['deadlift', 2, 3, 5, 210], ['row', 3, 8, 10, 120], ['triceps', 2, 10, 12, 90]]},
      {title: 'Medium day', group: 'full', items: [['bar-squat', 3, 5, 8, 150], ['bench', 3, 5, 8, 150], ['deadlift', 2, 5, 6, 180], ['pulldown', 3, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
      {title: 'Light day', group: 'full', items: [['bar-squat', 3, 6, 8, 120], ['bench', 3, 6, 8, 120], ['rdl', 3, 8, 10, 120], ['lateral', 3, 10, 15, 90], ['deadbug', 2, 8, 12, 60]]},
    ]},
  {code: 'PL5', goal: 'powerlifting', name: 'Five-Day Competition Lift Split', days: 5, experience: 'advanced', equipment: 'gym', budget: 'strength', source: 'PL-EXPERT',
    summary: 'Five days. Squat and bench are trained twice a week, and deadlift once with heavier work. That deadlift session also includes hinge assistance.',
    slots: [
      {title: 'Squat heavy', group: 'lower', items: [['bar-squat', 4, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-curl', 3, 10, 12, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Bench heavy', group: 'push', items: [['bench', 4, 3, 5, 180], ['row', 3, 6, 8, 120], ['ohp', 3, 6, 10, 120], ['triceps', 3, 10, 12, 60]]},
      {title: 'Deadlift and back', group: 'pull', items: [['deadlift', 3, 3, 5, 210], ['rdl', 3, 6, 8, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60]]},
      {title: 'Squat volume', group: 'lower', items: [['bar-squat', 3, 6, 8, 150], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Bench volume', group: 'push', items: [['bench', 3, 6, 8, 150], ['incline-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['curl', 2, 10, 12, 60]]},
    ]},

  // Hypertrophy reference arrangements; actual primary/secondary work is audited.
  {code: 'HY1', goal: 'hypertrophy', name: 'Full Body A/B/C', days: 3, experience: 'all', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Three full-body sessions for muscle growth. Most sets use 6 to 15 reps and stop short of failure.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['bar-squat', 3, 6, 10, 150], ['lib-db-flat-bench-press', 3, 6, 10, 120], ['lib-db-chest-supported-row', 3, 8, 12, 120], ['leg-curl', 3, 10, 15, 90], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60], ['curl', 2, 10, 15, 60]]},
      {title: 'Full body · B', group: 'full', items: [['rdl', 3, 6, 10, 120], ['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['leg-extension', 2, 12, 15, 90], ['leg-curl', 2, 10, 15, 90], ['ohp', 2, 8, 12, 90], ['lib-db-hammer-curl', 2, 10, 15, 60]]},
      {title: 'Full body · C', group: 'full', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-plate-incline-chest-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 10, 12, 90], ['leg-curl', 2, 10, 15, 90], ['lib-cable-standing-fly', 2, 12, 15, 60], ['lib-cable-lateral-raise', 3, 12, 20, 60], ['lib-cable-overhead-triceps', 2, 10, 12, 60]]},
    ]},
  {code: 'HY2', goal: 'hypertrophy', name: 'Upper and Lower', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Upper and lower sessions, each muscle group trained twice a week. Most sets use 6 to 15 reps.',
    slots: [
      {title: 'Upper · A', group: 'upper', items: [['lib-db-flat-bench-press', 3, 6, 10, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['incline-press', 2, 8, 12, 120], ['pulldown', 2, 10, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60], ['curl', 1, 10, 15, 60]]},
      {title: 'Lower · A', group: 'lower', items: [['bar-squat', 3, 6, 10, 150], ['rdl', 3, 8, 10, 120], ['lib-plate-leg-press-45', 2, 10, 12, 120], ['leg-curl', 3, 10, 15, 90], ['calf', 3, 10, 15, 60], ['leg-extension', 2, 12, 15, 60]]},
      {title: 'Upper · B', group: 'upper', items: [['ohp', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['row', 3, 10, 12, 90], ['lib-cable-standing-fly', 2, 12, 15, 60], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 2, 10, 15, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Lower · B', group: 'lower', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'HY3', goal: 'hypertrophy', name: 'Push, Pull and Legs', days: 6, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'SPLIT-FULLBODY',
    summary: 'Push, pull and leg days, repeated twice a week, so each muscle group is trained twice a week.',
    slots: [
      {title: 'Push · A', group: 'push', items: [['bench', 3, 6, 10, 150], ['lib-plate-incline-chest-press', 3, 8, 12, 120], ['ohp', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Pull · A', group: 'pull', items: [['row', 3, 6, 10, 120], ['pulldown', 3, 8, 12, 120], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 3, 10, 15, 60]]},
      {title: 'Legs · A', group: 'lower', items: [['bar-squat', 3, 6, 10, 150], ['rdl', 3, 8, 12, 120], ['leg-extension', 3, 10, 15, 90], ['leg-curl', 3, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Push · B', group: 'push', items: [['incline-press', 3, 8, 12, 120], ['lib-cable-standing-fly', 3, 12, 15, 60], ['lib-db-flat-bench-press', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Pull · B', group: 'pull', items: [['pulldown', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60], ['curl', 2, 10, 15, 60]]},
      {title: 'Legs · B', group: 'lower', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['leg-curl', 3, 10, 15, 90], ['leg-extension', 2, 12, 15, 90], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'HY4', goal: 'hypertrophy', name: 'Six-Day Body-Part Split', days: 6, experience: 'advanced', equipment: 'gym', budget: 'hypertrophy', source: 'SPLIT-FULLBODY',
    summary: 'Six days: chest and back, shoulders and arms, then legs, each repeated once. Each muscle group is trained twice a week.',
    slots: [
      {title: 'Chest and back · A', group: 'upper', items: [['bench', 4, 6, 10, 150], ['incline-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-standing-fly', 2, 12, 15, 60]]},
      {title: 'Shoulders and arms · A', group: 'upper', items: [['ohp', 4, 6, 10, 150], ['lateral', 3, 10, 15, 90], ['curl', 3, 8, 12, 90], ['triceps', 3, 8, 12, 90]]},
      {title: 'Legs · A', group: 'lower', items: [['bar-squat', 4, 6, 10, 150], ['split', 3, 8, 12, 120], ['leg-curl', 4, 10, 15, 90], ['calf', 4, 10, 15, 60]]},
      {title: 'Chest and back · B', group: 'upper', items: [['incline-press', 4, 8, 12, 120], ['bench', 3, 6, 10, 150], ['pulldown', 4, 8, 12, 120], ['row', 3, 8, 12, 120]]},
      {title: 'Shoulders and arms · B', group: 'upper', items: [['lateral', 4, 10, 15, 90], ['ohp', 3, 8, 12, 120], ['lib-db-hammer-curl', 3, 8, 12, 90], ['triceps', 3, 8, 12, 90]]},
      {title: 'Legs · B', group: 'lower', items: [['deadlift', 3, 4, 6, 180], ['rdl', 3, 8, 12, 120], ['leg-extension', 3, 10, 15, 90], ['calf', 4, 10, 15, 60]]},
    ]},
  {code: 'HY5', goal: 'hypertrophy', name: 'Higher-Repetition Full Body', days: 3, experience: 'all', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Two machine and cable days with 15 to 20 reps and one day with 6 to 12 reps. Choose a manageable resistance and stop with about 2–3 good repetitions left; a higher rep target does not establish a measured low load.',
    slots: [
      {title: 'Low load · A', group: 'full', items: [['lib-stack-leg-press', 3, 15, 20, 60], ['lib-stack-seated-row', 3, 15, 20, 60], ['lib-stack-pec-deck', 3, 15, 20, 60], ['lib-stack-single-leg-extension', 3, 15, 20, 60], ['lib-stack-seated-leg-curl', 3, 15, 20, 60], ['lateral', 3, 15, 20, 60]]},
      {title: 'Heavier · B', group: 'full', items: [['bar-squat', 3, 6, 10, 150], ['bench', 3, 6, 10, 150], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 12, 90], ['curl', 2, 10, 12, 90]]},
      {title: 'Low load · C', group: 'full', items: [['lib-stack-hack-squat', 3, 15, 20, 60], ['lib-stack-incline-chest-press', 3, 15, 20, 60], ['lib-cable-seated-row', 3, 15, 20, 60], ['lib-stack-reverse-fly', 3, 15, 20, 60], ['lib-cable-single-arm-pushdown', 3, 15, 20, 60]]},
    ]},

  // Powerbuilding proposals. No universal set-count threshold certifies a routine.
  {code: 'PB1', goal: 'powerbuilding', name: 'Upper and Lower Strength and Size', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Four days: heavy squat, bench and deadlift work, then muscle-building sets for the same muscle groups.',
    slots: [
      {title: 'Lower · strength', group: 'lower', items: [['bar-squat', 3, 3, 6, 180], ['rdl', 3, 6, 10, 150], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Upper · strength', group: 'upper', items: [['bench', 3, 3, 6, 180], ['row', 3, 6, 10, 120], ['ohp', 3, 6, 10, 120], ['lateral', 2, 10, 15, 90], ['triceps', 2, 10, 15, 90]]},
      {title: 'Lower · size', group: 'lower', items: [['deadlift', 2, 3, 5, 210], ['lib-stack-hack-squat', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['leg-curl', 2, 10, 15, 90]]},
      {title: 'Upper · size', group: 'upper', items: [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-standing-fly', 3, 12, 15, 60], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 3, 10, 15, 60]]},
    ]},
  {code: 'PB2', goal: 'powerbuilding', name: 'Full Body Heavy and Volume', days: 3, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'PB-EXPERT',
    summary: 'Three full-body days. Each day starts with a heavy squat, bench or deadlift set, then adds muscle-building sets.',
    slots: [
      {title: 'Squat heavy', group: 'full', items: [['bar-squat', 3, 3, 6, 180], ['row', 3, 8, 10, 120], ['lib-plate-leg-press-45', 2, 10, 12, 120], ['triceps', 2, 10, 12, 60], ['curl', 2, 10, 12, 60]]},
      {title: 'Bench heavy', group: 'full', items: [['bench', 3, 3, 6, 180], ['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 10, 120], ['lateral', 3, 12, 20, 60], ['leg-curl', 3, 10, 15, 90]]},
      {title: 'Deadlift heavy', group: 'full', items: [['deadlift', 2, 3, 5, 210], ['rdl', 3, 8, 10, 120], ['leg-extension', 3, 12, 15, 90], ['lib-cable-seated-row', 3, 10, 12, 90], ['lib-cable-face-pull', 2, 12, 15, 60]]},
    ]},
  {code: 'PB3', goal: 'powerbuilding', name: 'Heavy Day and Volume Day', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'PERIODIZATION',
    summary: 'Two heavy days (squat and bench; deadlift and press) and two volume days (squat and bench; hinge and leg work).',
    slots: [
      {title: 'Heavy · squat and bench', group: 'full', items: [['bar-squat', 3, 3, 5, 210], ['bench', 3, 3, 5, 180], ['row', 3, 6, 8, 120], ['triceps', 2, 8, 12, 90]]},
      {title: 'Heavy · deadlift and press', group: 'lower', items: [['deadlift', 3, 3, 5, 210], ['ohp', 3, 4, 6, 150], ['pulldown', 3, 6, 8, 120], ['curl', 2, 8, 12, 90]]},
      {title: 'Volume · squat and bench', group: 'full', items: [['bar-squat', 3, 8, 10, 150], ['incline-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 10, 12, 90], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Volume · hinge and legs', group: 'lower', items: [['rdl', 3, 8, 10, 120], ['lib-plate-leg-press-45', 3, 10, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 2, 10, 15, 60]]},
    ]},
  {code: 'PB4', goal: 'powerbuilding', name: 'Five-Day Heavy and Volume Split', days: 5, experience: 'advanced', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Five days: heavy squat, heavy bench, a deadlift and back day, then upper and lower muscle-building days.',
    slots: [
      {title: 'Squat heavy', group: 'lower', items: [['bar-squat', 4, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-curl', 3, 10, 12, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Bench heavy', group: 'push', items: [['bench', 4, 3, 5, 180], ['row', 3, 6, 8, 120], ['ohp', 3, 6, 10, 120], ['triceps', 3, 10, 12, 60]]},
      {title: 'Deadlift and back', group: 'pull', items: [['deadlift', 3, 3, 5, 210], ['rdl', 3, 6, 8, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60]]},
      {title: 'Upper · size', group: 'upper', items: [['incline-press', 4, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lateral', 4, 12, 20, 60], ['curl', 3, 10, 15, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Lower · size', group: 'lower', items: [['bar-squat', 3, 8, 10, 150], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'PB5', goal: 'powerbuilding', name: 'Lower Strength and Upper Volume', days: 3, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'ACSM-2026',
    summary: 'Three days: two lower-body strength days with squat and deadlift, and an upper-body volume day in between.',
    slots: [
      {title: 'Lower · squat strength', group: 'lower', items: [['bar-squat', 3, 3, 6, 180], ['rdl', 3, 6, 10, 150], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Upper · volume', group: 'upper', items: [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-standing-fly', 3, 12, 15, 60], ['lateral', 3, 12, 20, 60], ['curl', 3, 10, 15, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Lower · deadlift strength', group: 'lower', items: [['deadlift', 2, 3, 5, 210], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['lib-bar-hip-thrust', 3, 8, 12, 120]]},
    ]},

  // Hybrid reference arrangements. Generic walk/run stages are app-authored.
  {code: 'HB1', goal: 'hybrid', name: 'Two Lift and Two Run', days: 4, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'CONCURRENT',
    summary: 'Two strength days and two run/walk days, never on the same day.',
    slots: [
      {title: 'Strength · lower', group: 'lower', items: [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['split', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Strength · upper', group: 'upper', items: [['pushup', 2, 6, 12, 120], ['row', 3, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['curl', 2, 10, 12, 60]]},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
    ]},
  {code: 'HB2', goal: 'hybrid', name: 'Three Lift and Two Run', days: 5, experience: 'some', equipment: 'gym', budget: 'strength', source: 'CONCURRENT',
    summary: 'Three strength days and two app-authored run/walk days. Strength and run/walk sessions fall on separate days.',
    slots: [
      {title: 'Strength · A', group: 'full', items: [['bar-squat', 3, 3, 5, 180], ['bench', 3, 4, 6, 180], ['row', 2, 6, 10, 120]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Strength · B', group: 'lower', items: [['deadlift', 2, 3, 5, 180], ['ohp', 3, 4, 6, 150], ['pulldown', 2, 6, 10, 120], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Strength · C', group: 'upper', items: [['bar-squat', 2, 6, 8, 150], ['incline-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['curl', 2, 10, 12, 60]]},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
    ]},
  {code: 'HB3', goal: 'hybrid', name: 'Three Lift and Three Run', days: 6, experience: 'some', equipment: 'gym', budget: 'strength', source: 'CONCURRENT',
    summary: 'Three strength days alternating with three run/walk days.',
    slots: [
      {title: 'Strength · A', group: 'full', items: [['bar-squat', 3, 4, 6, 180], ['bench', 3, 4, 6, 180], ['row', 3, 8, 10, 120], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Strength · B', group: 'full', items: [['deadlift', 2, 3, 5, 210], ['ohp', 3, 6, 8, 120], ['pulldown', 3, 8, 10, 120], ['calf', 2, 10, 15, 60]]},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
      {title: 'Strength · C', group: 'full', items: [['bar-squat', 2, 6, 8, 150], ['incline-press', 3, 8, 12, 120], ['rdl', 3, 8, 10, 120], ['lateral', 3, 10, 15, 90]]},
      {title: 'Run/walk · C', group: 'run', kind: 'walkrun'},
    ]},
  {code: 'HB4', goal: 'hybrid', name: 'Four Lift and Two Run', days: 6, experience: 'some', equipment: 'gym', budget: 'strength', source: 'CONCURRENT',
    summary: 'Four strength days and two run/walk days. Run days sit between strength days.',
    slots: [
      {title: 'Strength · upper', group: 'upper', items: [['bench', 3, 4, 6, 180], ['row', 3, 8, 10, 120], ['ohp', 2, 8, 12, 120], ['curl', 2, 10, 12, 60]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Strength · lower', group: 'lower', items: [['bar-squat', 3, 4, 6, 180], ['rdl', 3, 8, 10, 120], ['leg-curl', 2, 10, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Strength · upper 2', group: 'upper', items: [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lateral', 3, 10, 15, 90], ['triceps', 2, 10, 12, 60]]},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
      {title: 'Strength · lower 2', group: 'lower', items: [['deadlift', 2, 3, 5, 210], ['split', 3, 8, 12, 120], ['leg-extension', 3, 10, 15, 90], ['deadbug', 2, 8, 12, 60]]},
    ]},
  {code: 'HB5', goal: 'hybrid', name: 'Strength and Sprint Drills', days: 4, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'CONCURRENT',
    summary: 'Two strength days and two conditioning days with short sprint drills, with rest between efforts. These are drills, not timed race sprints. Sprint and change-of-direction numbers are not sourced to a specific trial.',
    slots: [
      {title: 'Strength · A', group: 'full', items: [['squat', 3, 6, 10, 120], ['pushup', 3, 6, 10, 90], ['row', 3, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Sprint drills · A', group: 'run', items: [['ref-Single-Cone_Sprint_Drill', 6, 5, 8, 120], ['ref-Carioca_Quick_Step', 3, 6, 8, 60]]},
      {title: 'Strength · B', group: 'full', items: [['rdl', 3, 6, 10, 120], ['ohp', 3, 6, 10, 120], ['split', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Sprint drills · B', group: 'run', items: [['ref-Side_Hop-Sprint', 6, 5, 8, 120], ['ref-Carioca_Quick_Step', 3, 6, 8, 60]]},
    ]},

  // SPORT (field and court athletes). Position-specific or season-specific prescriptions are not included.
  {code: 'SP1', goal: 'sport', name: 'In-Season Maintenance', days: 2, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'WISLOFF-2004',
    summary: 'Two low-volume sessions for a team or court athlete with a season schedule. Practice comes first.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['squat', 3, 6, 8, 120], ['rdl', 2, 6, 8, 120], ['ohp', 2, 6, 10, 120], ['row', 2, 6, 10, 120], ['ref-Freehand_Jump_Squat', 2, 5, 8, 90]]},
      {title: 'Full body · B', group: 'full', items: [['split', 2, 6, 8, 120], ['pushup', 2, 6, 10, 90], ['lib-db-chest-supported-row', 2, 6, 10, 120], ['calf', 2, 8, 12, 60], ['deadbug', 2, 6, 10, 60]]},
    ]},
  {code: 'SP2', goal: 'sport', name: 'Off-Season Strength and Jumps', days: 3, experience: 'some', equipment: 'dumbbells', budget: 'strength', source: 'STOJANOVIC-2017',
    summary: 'Three days of strength and jumping for the off-season. Sprints and position work are not included.',
    slots: [
      {title: 'Strength and jumps · A', group: 'full', items: [['squat', 3, 5, 8, 120], ['rdl', 3, 6, 8, 120], ['ref-Freehand_Jump_Squat', 3, 5, 6, 90], ['ohp', 3, 6, 8, 120], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Jumps and upper · B', group: 'full', items: [['ref-Frog_Hops', 3, 6, 10, 90], ['ref-Lateral_Bound', 3, 5, 6, 90], ['pushup', 3, 6, 10, 90], ['row', 3, 8, 10, 90], ['calf', 2, 8, 12, 60]]},
      {title: 'Strength and jumps · C', group: 'full', items: [['split', 3, 6, 8, 90], ['ref-Alternate_Leg_Diagonal_Bound', 3, 5, 8, 90], ['incline-press', 3, 6, 10, 90], ['lib-db-chest-supported-row', 2, 8, 10, 90]]},
    ]},
  {code: 'SP3', goal: 'sport', name: 'Jump Focus', days: 3, experience: 'some', equipment: 'flexible', budget: 'strength', source: 'MARKOVIC-2007',
    summary: 'Three sessions with jumps and landings, built on a base of squat and hinge strength.',
    slots: [
      {title: 'Jumps · A', group: 'full', items: [['ref-Freehand_Jump_Squat', 3, 8, 10, 90], ['ref-Lateral_Bound', 3, 6, 8, 90], ['ref-Alternate_Leg_Diagonal_Bound', 3, 6, 8, 90], ['split', 2, 6, 8, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Jumps · B', group: 'full', items: [['ref-Frog_Hops', 3, 6, 10, 90], ['ref-Knee_Tuck_Jump', 3, 5, 8, 90], ['pushup', 3, 6, 10, 90], ['row', 2, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Jumps · C', group: 'full', items: [['ref-Freehand_Jump_Squat', 3, 8, 10, 90], ['ref-Lateral_Bound', 3, 6, 8, 90], ['rdl', 3, 6, 8, 120], ['ohp', 2, 8, 10, 90], ['lateral', 2, 10, 15, 60]]},
    ]},
  {code: 'SP4', goal: 'sport', name: 'Sprint and Change of Direction', days: 3, experience: 'some', equipment: 'flexible', budget: 'strength', source: 'WISLOFF-2004',
    summary: 'Sprint drills, change-of-direction drills and lower-body strength. Drills are short repeated efforts, not timed race work.',
    slots: [
      {title: 'Sprint drills and squat', group: 'run', items: [['ref-Single-Cone_Sprint_Drill', 6, 5, 8, 120], ['squat', 3, 5, 8, 120], ['ref-Freehand_Jump_Squat', 3, 5, 8, 90]]},
      {title: 'Lower strength', group: 'lower', items: [['rdl', 3, 6, 8, 120], ['split', 3, 6, 8, 90], ['calf', 2, 8, 12, 60], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Change of direction', group: 'run', items: [['ref-Side_Hop-Sprint', 6, 5, 8, 120], ['ref-Lateral_Bound', 3, 5, 8, 90], ['ref-Carioca_Quick_Step', 3, 6, 8, 60]]},
    ]},
  {code: 'SP5', goal: 'sport', name: 'Endurance Athlete Strength', days: 2, experience: 'some', equipment: 'dumbbells', budget: 'strength', source: 'CONCURRENT',
    summary: 'Two strength days for an athlete who runs or cycles on other days. Review spacing from hard endurance sessions and account for your total weekly training.',
    slots: [
      {title: 'Lower', group: 'lower', items: [['split', 3, 5, 8, 150], ['rdl', 3, 5, 8, 150], ['calf', 3, 8, 12, 60], ['deadbug', 2, 6, 10, 60], ['row', 2, 6, 10, 120]]},
      {title: 'Upper', group: 'upper', items: [['ohp', 3, 5, 8, 150], ['pushup', 3, 5, 10, 120], ['row', 3, 6, 10, 120], ['bridge', 2, 8, 12, 90]]},
    ]},

  // GENERAL FITNESS. Adult guidance for muscle-strengthening work on two or more days (WHO 2020).
  {code: 'GF1', goal: 'general', name: 'Beginner Full Body', days: 2, experience: 'all', equipment: 'bodyweight-band', budget: 'strength', source: 'ACSM-2026',
    summary: 'Two full-body sessions with bodyweight and a resistance band.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['bridge', 2, 10, 12, 60], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Full body · B', group: 'full', items: [['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['lib-band-standing-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
    ]},
  {code: 'GF2', goal: 'general', name: 'Full Body and Walk', days: 3, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'WHO-ACTIVITY',
    summary: 'Two full-body strength sessions and one comfortable recovery walk of up to 20 minutes. Adult guidance suggests 150 to 300 minutes of moderate activity a week, so this plan alone does not reach that total.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Comfortable walk', group: 'activity', kind: 'recovery-walk'},
      {title: 'Full body · B', group: 'full', items: [['rdl', 2, 8, 12, 90], ['ohp', 2, 8, 12, 90], ['split', 2, 8, 12, 90], ['bridge', 2, 10, 12, 60]]},
    ]},
  {code: 'GF3', goal: 'general', name: 'Upper and Lower', days: 4, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'ACSM-2026',
    summary: 'Two upper-body and two lower-body sessions with dumbbells. An adjustable incline bench is needed for the listed incline press; a suitable equipment-matched alternative can be reviewed.',
    slots: [
      {title: 'Upper · A', group: 'upper', items: [['pushup', 3, 6, 10, 90], ['row', 3, 8, 12, 90], ['ohp', 2, 8, 12, 90], ['curl', 2, 10, 15, 60], ['lib-db-overhead-triceps', 2, 10, 15, 60]]},
      {title: 'Lower · A', group: 'lower', items: [['squat', 3, 8, 12, 90], ['rdl', 2, 8, 12, 90], ['split', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Upper · B', group: 'upper', items: [['incline-press', 3, 8, 12, 90], ['row', 3, 8, 12, 90], ['lateral', 2, 12, 15, 60], ['lib-db-overhead-triceps', 2, 10, 15, 60]]},
      {title: 'Lower · B', group: 'lower', items: [['bridge', 3, 10, 12, 90], ['split', 3, 8, 12, 90], ['rdl', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
    ]},
  {code: 'GF4', goal: 'general', name: 'Walk-Run and Strength', days: 5, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'WHO-ACTIVITY',
    summary: 'Three app-authored run/walk days and two strength days, with a non-running day between runs. The displayed two-week stages are not the NHS Couch to 5K sequence.',
    slots: [
      {title: 'Strength · A', group: 'full', items: [['squat', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['row', 2, 8, 12, 90], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
      {title: 'Strength · B', group: 'full', items: [['rdl', 2, 8, 12, 90], ['ohp', 2, 8, 12, 90], ['bridge', 2, 10, 12, 60], ['calf', 2, 10, 15, 60]]},
      {title: 'Run/walk · C', group: 'run', kind: 'walkrun'},
    ]},
  {code: 'GF5', goal: 'general', name: 'Short Bodyweight and Band', days: 2, experience: 'all', equipment: 'bodyweight-band', budget: 'strength', source: 'TIME-EFFICIENT',
    summary: 'Two short sessions with bodyweight and a resistance band, for a limited schedule. Less work than the longer plans.',
    slots: [
      {title: 'Bodyweight and band · A', group: 'full', items: [['bw-squat', 2, 8, 12, 60], ['pushup', 2, 6, 10, 60], ['lib-band-standing-row', 2, 8, 12, 60], ['deadbug', 2, 6, 10, 45]]},
      {title: 'Bodyweight and band · B', group: 'full', items: [['ref-Band_Good_Morning', 2, 8, 12, 60], ['pushup', 2, 6, 10, 60], ['lib-band-standing-row', 2, 8, 12, 60], ['calf', 2, 10, 15, 45]]},
    ]},
];


// Exact IDs the submitted branch generated, before current-engine qualification.
export const submittedRoutineIds = ["LIB-PL1-30","LIB-PL1-45","LIB-PL1-60","LIB-PL1-90","LIB-PL1-120","LIB-PL2-30","LIB-PL2-45","LIB-PL2-60","LIB-PL2-90","LIB-PL2-120","LIB-PL3-30","LIB-PL3-45","LIB-PL3-60","LIB-PL3-90","LIB-PL3-120","LIB-PL4-45","LIB-PL4-60","LIB-PL4-90","LIB-PL4-120","LIB-PL5-30","LIB-PL5-45","LIB-PL5-60","LIB-PL5-90","LIB-PL5-120","LIB-HY1-30","LIB-HY1-90","LIB-HY1-120","LIB-HY2-30","LIB-HY2-90","LIB-HY2-120","LIB-HY3-30","LIB-HY3-60","LIB-HY3-90","LIB-HY3-120","LIB-HY4-30","LIB-HY4-60","LIB-HY4-90","LIB-HY4-120","LIB-HY5-30","LIB-PB1-30","LIB-PB2-30","LIB-PB3-30","LIB-PB3-90","LIB-PB3-120","LIB-PB4-30","LIB-PB4-90","LIB-PB4-120","LIB-PB5-30","LIB-HB1-30","LIB-HB1-45","LIB-HB1-60","LIB-HB1-90","LIB-HB1-120","LIB-HB2-30","LIB-HB2-45","LIB-HB2-60","LIB-HB2-90","LIB-HB2-120","LIB-HB3-30","LIB-HB3-45","LIB-HB3-60","LIB-HB3-90","LIB-HB3-120","LIB-HB4-30","LIB-HB4-45","LIB-HB4-60","LIB-HB4-90","LIB-HB4-120","LIB-HB5-30","LIB-HB5-45","LIB-HB5-60","LIB-HB5-90","LIB-HB5-120","LIB-SP1-30","LIB-SP1-45","LIB-SP1-60","LIB-SP1-90","LIB-SP1-120","LIB-SP2-30","LIB-SP2-45","LIB-SP2-60","LIB-SP2-90","LIB-SP2-120","LIB-SP3-15","LIB-SP3-30","LIB-SP3-45","LIB-SP3-60","LIB-SP3-90","LIB-SP3-120","LIB-SP4-30","LIB-SP4-45","LIB-SP4-60","LIB-SP4-90","LIB-SP4-120","LIB-SP5-30","LIB-SP5-45","LIB-SP5-60","LIB-SP5-90","LIB-SP5-120","LIB-GF1-15","LIB-GF1-30","LIB-GF1-45","LIB-GF1-60","LIB-GF1-90","LIB-GF1-120","LIB-GF2-45","LIB-GF2-60","LIB-GF2-90","LIB-GF2-120","LIB-GF3-30","LIB-GF3-45","LIB-GF3-60","LIB-GF3-90","LIB-GF3-120","LIB-GF4-30","LIB-GF4-45","LIB-GF4-60","LIB-GF4-90","LIB-GF4-120","LIB-GF5-15","LIB-GF5-30","LIB-GF5-45","LIB-GF5-60","LIB-GF5-90","LIB-GF5-120"];
