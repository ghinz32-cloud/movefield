import type {ProgramDefinition, ProgramSlot} from './program-catalog';

// Routine library: 30 families × 6 session lengths (15, 30, 45, 60, 90, 120 minutes) = 180 routines.
// Each family is written once as a 60-minute reference. The session length sets the working-set budget per session,
// trimming or adding sets to the family's items (see fitItems). Rep ranges and rest come from the family.
// Evidence keys must exist in app/page.tsx SOURCE_LINKS. Rules R1 to R11 are enforced by scripts/check-program-design.cjs.
// Sources: docs/program-evidence.md. Brief versions (R10) say so in their description.

type Item = ProgramSlot['items'][number];
type Band = 15 | 30 | 45 | 60 | 90 | 120;
type Slot = {title: string; group: ProgramSlot['group']; items?: Item[]; kind?: ProgramSlot['kind']};
type Family = {
  code: string;
  goal: ProgramDefinition['goal'];
  name: string;
  days: number;
  experience: ProgramDefinition['experience'];
  equipment: ProgramDefinition['equipment'];
  budget: 'hypertrophy' | 'strength';
  source: string;
  summary: string;
  slots: Slot[];
};

const BANDS: Band[] = [15, 30, 45, 60, 90, 120];
const GOAL_LABEL: Record<string, string> = {
  powerlifting: 'Powerlifting', hypertrophy: 'Bodybuilding', powerbuilding: 'Powerbuilding',
  hybrid: 'Hybrid', sport: 'Sport', general: 'General fitness',
};
const MAIN_ITEMS = 2; // the first two items are the main work; they keep at least two sets when trimming
const MAIN_CAP = 5;
const ACCESSORY_CAP = 4;

// Mirrors estimateSessionMinutes in lib/training.ts (warm-up, work, rest, setup, rounded up to 5-minute blocks).
// Timed drills read reps as seconds (or minutes for walk). Per-side and barbell adjustments follow the exercise records.
const TIMED: Record<string, 'minutes' | 'seconds'> = {
  walk: 'minutes', 'ref-Carioca_Quick_Step': 'seconds', 'ref-Frog_Hops': 'seconds',
  'ref-Side_Hop-Sprint': 'seconds', 'ref-Single-Cone_Sprint_Drill': 'seconds',
};
const PER_SIDE = new Set(['deadbug', 'row', 'split', 'lib-cable-lateral-raise', 'lib-cable-single-arm-pushdown', 'lib-stack-single-leg-extension']);
const BARBELL = new Set(['bar-squat', 'bench', 'deadlift', 'lib-bar-hip-thrust']);

function estimateMinutes(items: Item[], brief: boolean): number {
  const seconds = (brief ? 6 : 13) * 60 + items.reduce((n, [id, sets, lo, hi, rest]) => {
    const kind = TIMED[id];
    const work = kind === 'minutes' ? lo * 60 : kind === 'seconds' ? lo : hi * 4 * (PER_SIDE.has(id) ? 2 : 1);
    return n + sets * work + Math.max(0, sets - 1) * rest + (brief ? Math.max(60, rest) : 120) + (BARBELL.has(id) ? 120 : 0);
  }, 0);
  return Math.ceil(seconds / 300) * 5;
}

// Rest stays between 60 and 300 seconds, and sets of six reps or fewer rest at least 120 seconds (R6).
function normalize(items: Item[]): Item[] {
  return items.map(([id, sets, lo, hi, rest]) => {
    const r = Math.min(300, Math.max(60, rest));
    return [id, sets, lo, hi, hi <= 6 ? Math.max(120, r) : r] as Item;
  });
}

// Fits one session to its window. Trim accessory sets first, then drop trailing accessories, then trim main sets to two.
// Growth (not for brief sessions) adds accessory sets, then main sets, while the session still fits.
// Returns null when the session cannot fit, so that length is not offered.
function fitSlot(items: Item[], minutes: number, brief: boolean): Item[] | null {
  const out = normalize(items).map(i => (brief ? [i[0], 2, i[2], i[3], i[4]] : i) as Item);
  const fits = (xs: Item[]) => estimateMinutes(xs, brief) <= minutes;
  while (!fits(out)) {
    let k = -1;
    for (let j = out.length - 1; j >= 0; j--) {
      const floor = brief || j < MAIN_ITEMS ? 2 : 1;
      if (out[j][1] > floor) { k = j; break; }
    }
    if (k >= 0) { out[k][1]--; continue; }
    if (out.length > MAIN_ITEMS) { out.pop(); continue; }
    return null;
  }
  if (!brief) {
    const order = [...out.keys()].filter(j => j >= MAIN_ITEMS).concat([0, 1].filter(j => j < out.length));
    let grew = true;
    while (grew) {
      grew = false;
      for (const j of order) {
        const cap = j < MAIN_ITEMS ? MAIN_CAP : ACCESSORY_CAP;
        if (out[j][1] >= cap) continue;
        const trial = out.map(i => [...i] as Item);
        trial[j][1]++;
        if (fits(trial)) { out[j][1]++; grew = true; break; }
      }
    }
  }
  return out;
}

// Bands listed here are not offered because they fail a volume or structure rule that trimming cannot fix (see the checker output).
const NOT_OFFERED: Record<string, number[]> = {
  PL4: [30], // R4/R5: the brief version cannot keep a squat, bench and deadlift on each day within the window.
  HY1: [45, 60], HY2: [45, 60], HY3: [45], HY4: [45], // R1: fewer than 10 weighted sets a week for a major group.
  HY5: [45, 60, 90, 120],
  PB1: [45, 60, 90, 120], PB2: [45, 60, 90, 120], PB3: [45, 60], PB4: [45, 60], PB5: [45, 60, 90, 120], // R1, and R2 for PB2 and PB5.
};

const FAMILIES: Family[] = [
  // POWERLIFTING. Squat, bench and deadlift each get a heavy set of six reps or fewer every week (R4, R5).
  {code: 'PL1', goal: 'powerlifting', name: 'Full Body A/B/C', days: 3, experience: 'all', equipment: 'gym', budget: 'strength', source: 'PETERSON-2004',
    summary: 'Three full-body days. Squat, bench and deadlift each appear every week, with heavy sets of six reps or fewer.',
    slots: [
      {title: 'Squat and bench · A', group: 'full', items: [['bar-squat', 3, 3, 5, 180], ['bench', 3, 4, 6, 180], ['row', 3, 8, 10, 120], ['triceps', 2, 10, 12, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Deadlift and press · B', group: 'full', items: [['deadlift', 3, 3, 5, 210], ['ohp', 3, 6, 8, 120], ['pulldown', 3, 8, 10, 120], ['leg-extension', 2, 12, 15, 90], ['leg-curl', 2, 10, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Squat and bench variation · C', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 3, 5, 6, 150], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['lib-cable-seated-row', 3, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL2', goal: 'powerlifting', name: 'Upper and Lower, Heavy and Volume', days: 4, experience: 'some', equipment: 'gym', budget: 'strength', source: 'WILLIAMS-2017-PERIODIZED',
    summary: 'Four days: heavy squat and bench sessions, and volume sessions for deadlift and bench. Heavy sets stay at six reps or fewer.',
    slots: [
      {title: 'Lower · heavy squat', group: 'lower', items: [['bar-squat', 3, 3, 5, 180], ['rdl', 3, 6, 8, 150], ['leg-curl', 2, 10, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Upper · heavy bench', group: 'upper', items: [['bench', 3, 3, 5, 180], ['row', 3, 6, 8, 120], ['pulldown', 2, 8, 10, 120], ['triceps', 2, 10, 12, 90]]},
      {title: 'Lower · deadlift volume', group: 'lower', items: [['deadlift', 3, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-extension', 2, 10, 12, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Upper · bench volume', group: 'upper', items: [['bench', 3, 6, 8, 150], ['incline-press', 3, 8, 10, 120], ['lib-cable-seated-row', 3, 8, 10, 120], ['lateral', 3, 10, 15, 90], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL3', goal: 'powerlifting', name: 'Minimum Effective Dose', days: 3, experience: 'all', equipment: 'gym', budget: 'strength', source: 'SUCHOMEL-2018-STRENGTH',
    summary: 'Two working sets for each main lift, three days a week. Longer sessions add accessory work, not more main sets. This is a low-volume option. It is not shown to be sufficient for maximal progress.',
    slots: [
      {title: 'Squat and bench · A', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 2, 4, 6, 180], ['row', 2, 8, 10, 120], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Deadlift and press · B', group: 'full', items: [['deadlift', 2, 3, 5, 210], ['ohp', 2, 8, 10, 120], ['pulldown', 2, 8, 10, 120], ['calf', 2, 10, 15, 60]]},
      {title: 'Squat and bench · C', group: 'full', items: [['bar-squat', 2, 4, 6, 180], ['bench', 2, 4, 6, 180], ['lib-plate-leg-press-45', 2, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
    ]},
  {code: 'PL4', goal: 'powerlifting', name: 'Heavy, Medium and Light Days', days: 3, experience: 'some', equipment: 'gym', budget: 'strength', source: 'WILLIAMS-2017-PERIODIZED',
    summary: 'Each training day trains squat, bench and deadlift at a different intensity: heavy, medium or light. Squat and bench appear three times a week; deadlift appears twice.',
    slots: [
      {title: 'Heavy day', group: 'full', items: [['bar-squat', 3, 3, 5, 210], ['bench', 3, 3, 5, 180], ['deadlift', 2, 3, 5, 210], ['row', 3, 8, 10, 120], ['triceps', 2, 10, 12, 90]]},
      {title: 'Medium day', group: 'full', items: [['bar-squat', 3, 5, 8, 150], ['bench', 3, 5, 8, 150], ['deadlift', 2, 5, 6, 180], ['pulldown', 3, 8, 10, 120], ['curl', 2, 10, 12, 90]]},
      {title: 'Light day', group: 'full', items: [['bar-squat', 3, 6, 8, 120], ['bench', 3, 6, 8, 120], ['rdl', 3, 8, 10, 120], ['lateral', 3, 10, 15, 90], ['deadbug', 2, 8, 12, 60]]},
    ]},
  {code: 'PL5', goal: 'powerlifting', name: 'Five-Day Competition Lift Split', days: 5, experience: 'advanced', equipment: 'gym', budget: 'strength', source: 'PL-EXPERT',
    summary: 'Five days. Squat and bench are trained twice a week, and deadlift once a week with a heavy set, plus a hinge-focused day.',
    slots: [
      {title: 'Squat heavy', group: 'legs', items: [['bar-squat', 4, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-curl', 3, 10, 12, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Bench heavy', group: 'push', items: [['bench', 4, 3, 5, 180], ['row', 3, 6, 8, 120], ['ohp', 3, 6, 10, 120], ['triceps', 3, 10, 12, 60]]},
      {title: 'Deadlift and back', group: 'pull', items: [['deadlift', 3, 3, 5, 210], ['rdl', 3, 6, 8, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60]]},
      {title: 'Squat volume', group: 'legs', items: [['bar-squat', 3, 6, 8, 150], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['deadbug', 2, 8, 12, 60]]},
      {title: 'Bench volume', group: 'push', items: [['bench', 3, 6, 8, 150], ['incline-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['curl', 2, 10, 12, 60]]},
    ]},

  // BODYBUILDING (HYPERTROPHY). Rep ranges mostly 6 to 15; heavy work is not the focus. Each group is trained twice a week (R2).
  {code: 'HY1', goal: 'hypertrophy', name: 'Full Body A/B/C', days: 3, experience: 'all', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2017-VOLUME',
    summary: 'Three full-body sessions for muscle growth. Most sets use 6 to 15 reps and stop short of failure.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['bar-squat', 3, 6, 10, 150], ['lib-db-flat-bench-press', 3, 6, 10, 120], ['lib-db-chest-supported-row', 3, 8, 12, 120], ['leg-curl', 3, 10, 15, 90], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60], ['curl', 2, 10, 15, 60]]},
      {title: 'Full body · B', group: 'full', items: [['rdl', 3, 6, 10, 120], ['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['leg-extension', 2, 12, 15, 90], ['leg-curl', 2, 10, 15, 90], ['ohp', 2, 8, 12, 90], ['lib-db-hammer-curl', 2, 10, 15, 60]]},
      {title: 'Full body · C', group: 'full', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-plate-incline-chest-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 10, 12, 90], ['leg-curl', 2, 10, 15, 90], ['lib-cable-standing-fly', 2, 12, 15, 60], ['lib-cable-lateral-raise', 3, 12, 20, 60], ['lib-cable-overhead-triceps', 2, 10, 12, 60]]},
    ]},
  {code: 'HY2', goal: 'hypertrophy', name: 'Upper and Lower', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2017-VOLUME',
    summary: 'Upper and lower sessions, each muscle group trained twice a week. Most sets use 6 to 15 reps.',
    slots: [
      {title: 'Upper · A', group: 'upper', items: [['lib-db-flat-bench-press', 3, 6, 10, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['incline-press', 2, 8, 12, 120], ['pulldown', 2, 10, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60], ['curl', 1, 10, 15, 60]]},
      {title: 'Lower · A', group: 'lower', items: [['bar-squat', 3, 6, 10, 150], ['rdl', 3, 8, 10, 120], ['lib-plate-leg-press-45', 2, 10, 12, 120], ['leg-curl', 3, 10, 15, 90], ['calf', 3, 10, 15, 60], ['leg-extension', 2, 12, 15, 60]]},
      {title: 'Upper · B', group: 'upper', items: [['ohp', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['row', 3, 10, 12, 90], ['lib-cable-standing-fly', 2, 12, 15, 60], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 2, 10, 15, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Lower · B', group: 'lower', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'HY3', goal: 'hypertrophy', name: 'Push, Pull and Legs', days: 6, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2016-FREQ',
    summary: 'Push, pull and leg days, repeated twice a week, so each muscle group is trained twice a week.',
    slots: [
      {title: 'Push · A', group: 'push', items: [['bench', 3, 6, 10, 150], ['lib-plate-incline-chest-press', 3, 8, 12, 120], ['ohp', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Pull · A', group: 'pull', items: [['row', 3, 6, 10, 120], ['pulldown', 3, 8, 12, 120], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 3, 10, 15, 60]]},
      {title: 'Legs · A', group: 'legs', items: [['bar-squat', 3, 6, 10, 150], ['rdl', 3, 8, 12, 120], ['leg-extension', 3, 10, 15, 90], ['leg-curl', 3, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Push · B', group: 'push', items: [['incline-press', 3, 8, 12, 120], ['lib-cable-standing-fly', 3, 12, 15, 60], ['lib-db-flat-bench-press', 3, 8, 12, 120], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Pull · B', group: 'pull', items: [['pulldown', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60], ['curl', 2, 10, 15, 60]]},
      {title: 'Legs · B', group: 'legs', items: [['lib-stack-hack-squat', 3, 8, 12, 120], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['leg-curl', 3, 10, 15, 90], ['leg-extension', 2, 12, 15, 90], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'HY4', goal: 'hypertrophy', name: 'Six-Day Body-Part Split', days: 6, experience: 'advanced', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2016-FREQ',
    summary: 'Six days: chest and back, shoulders and arms, then legs, each repeated once. Each muscle group is trained twice a week.',
    slots: [
      {title: 'Chest and back · A', group: 'chestback', items: [['bench', 4, 6, 10, 150], ['incline-press', 3, 8, 12, 120], ['row', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-standing-fly', 2, 12, 15, 60]]},
      {title: 'Shoulders and arms · A', group: 'shouldersarms', items: [['ohp', 4, 6, 10, 150], ['lateral', 3, 10, 15, 90], ['curl', 3, 8, 12, 90], ['triceps', 3, 8, 12, 90]]},
      {title: 'Legs · A', group: 'lower', items: [['bar-squat', 4, 6, 10, 150], ['split', 3, 8, 12, 120], ['leg-curl', 4, 10, 15, 90], ['calf', 4, 10, 15, 60]]},
      {title: 'Chest and back · B', group: 'chestback', items: [['incline-press', 4, 8, 12, 120], ['bench', 3, 6, 10, 150], ['pulldown', 4, 8, 12, 120], ['row', 3, 8, 12, 120]]},
      {title: 'Shoulders and arms · B', group: 'shouldersarms', items: [['lateral', 4, 10, 15, 90], ['ohp', 3, 8, 12, 120], ['lib-db-hammer-curl', 3, 8, 12, 90], ['triceps', 3, 8, 12, 90]]},
      {title: 'Legs · B', group: 'lower', items: [['deadlift', 3, 4, 6, 180], ['rdl', 3, 8, 12, 120], ['leg-extension', 3, 10, 15, 90], ['calf', 4, 10, 15, 60]]},
    ]},
  {code: 'HY5', goal: 'hypertrophy', name: 'Low-Load Effort', days: 3, experience: 'all', equipment: 'gym', budget: 'hypertrophy', source: 'REFALO-2023-FAILURE',
    summary: 'Two machine and cable days with 15 to 20 reps taken close to failure, and one heavier day with 6 to 12 reps. Top rep counts stay at 20 or below.',
    slots: [
      {title: 'Low load · A', group: 'full', items: [['lib-stack-leg-press', 3, 15, 20, 60], ['lib-stack-seated-row', 3, 15, 20, 60], ['lib-stack-pec-deck', 3, 15, 20, 60], ['lib-stack-single-leg-extension', 3, 15, 20, 60], ['lib-stack-seated-leg-curl', 3, 15, 20, 60], ['lateral', 3, 15, 20, 60]]},
      {title: 'Heavier · B', group: 'full', items: [['bar-squat', 3, 6, 10, 150], ['bench', 3, 6, 10, 150], ['row', 3, 8, 12, 120], ['leg-curl', 2, 10, 12, 90], ['curl', 2, 10, 12, 90]]},
      {title: 'Low load · C', group: 'full', items: [['lib-stack-hack-squat', 3, 15, 20, 60], ['lib-stack-incline-chest-press', 3, 15, 20, 60], ['lib-cable-seated-row', 3, 15, 20, 60], ['lib-stack-reverse-fly', 3, 15, 20, 60], ['lib-cable-single-arm-pushdown', 3, 15, 20, 60]]},
    ]},

  // POWERBUILDING. Heavy lifts plus muscle-building sets for the same muscles. Muscle-building rules apply (R1 to R3).
  {code: 'PB1', goal: 'powerbuilding', name: 'Upper and Lower Strength and Size', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2017-LOAD',
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
  {code: 'PB3', goal: 'powerbuilding', name: 'Heavy Day and Volume Day', days: 4, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'WILLIAMS-2017-PERIODIZED',
    summary: 'Two heavy days (squat and bench; deadlift and press) and two volume days (squat and bench; hinge and leg work).',
    slots: [
      {title: 'Heavy · squat and bench', group: 'full', items: [['bar-squat', 3, 3, 5, 210], ['bench', 3, 3, 5, 180], ['row', 3, 6, 8, 120], ['triceps', 2, 8, 12, 90]]},
      {title: 'Heavy · deadlift and press', group: 'lower', items: [['deadlift', 3, 3, 5, 210], ['ohp', 3, 4, 6, 150], ['pulldown', 3, 6, 8, 120], ['curl', 2, 8, 12, 90]]},
      {title: 'Volume · squat and bench', group: 'full', items: [['bar-squat', 3, 8, 10, 150], ['incline-press', 3, 8, 12, 120], ['lib-cable-seated-row', 3, 10, 12, 90], ['lateral', 3, 12, 20, 60], ['triceps', 2, 10, 15, 60]]},
      {title: 'Volume · hinge and legs', group: 'lower', items: [['rdl', 3, 8, 10, 120], ['lib-plate-leg-press-45', 3, 10, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60], ['lib-db-reverse-fly', 2, 12, 20, 60], ['curl', 2, 10, 15, 60]]},
    ]},
  {code: 'PB4', goal: 'powerbuilding', name: 'Five-Day Heavy and Volume Split', days: 5, experience: 'advanced', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2017-VOLUME',
    summary: 'Five days: heavy squat, heavy bench, a deadlift and back day, then upper and lower muscle-building days.',
    slots: [
      {title: 'Squat heavy', group: 'legs', items: [['bar-squat', 4, 3, 5, 210], ['lib-plate-leg-press-45', 3, 8, 10, 120], ['leg-curl', 3, 10, 12, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Bench heavy', group: 'push', items: [['bench', 4, 3, 5, 180], ['row', 3, 6, 8, 120], ['ohp', 3, 6, 10, 120], ['triceps', 3, 10, 12, 60]]},
      {title: 'Deadlift and back', group: 'pull', items: [['deadlift', 3, 3, 5, 210], ['rdl', 3, 6, 8, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-face-pull', 2, 12, 15, 60]]},
      {title: 'Upper · size', group: 'upper', items: [['incline-press', 4, 8, 12, 120], ['lib-cable-seated-row', 3, 8, 12, 120], ['lateral', 4, 12, 20, 60], ['curl', 3, 10, 15, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Lower · size', group: 'lower', items: [['bar-squat', 3, 8, 10, 150], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['lib-bar-hip-thrust', 3, 8, 12, 120], ['calf', 3, 10, 15, 60]]},
    ]},
  {code: 'PB5', goal: 'powerbuilding', name: 'Lower Strength and Upper Volume', days: 3, experience: 'some', equipment: 'gym', budget: 'hypertrophy', source: 'SCHOENFELD-2017-VOLUME',
    summary: 'Three days: two lower-body strength days with squat and deadlift, and an upper-body volume day in between.',
    slots: [
      {title: 'Lower · squat strength', group: 'lower', items: [['bar-squat', 3, 3, 6, 180], ['rdl', 3, 6, 10, 150], ['leg-curl', 2, 10, 15, 90], ['calf', 3, 10, 15, 60]]},
      {title: 'Upper · volume', group: 'upper', items: [['incline-press', 3, 8, 12, 120], ['pulldown', 3, 8, 12, 120], ['lib-cable-standing-fly', 3, 12, 15, 60], ['lateral', 3, 12, 20, 60], ['curl', 3, 10, 15, 60], ['triceps', 3, 10, 15, 60]]},
      {title: 'Lower · deadlift strength', group: 'lower', items: [['deadlift', 2, 3, 5, 210], ['split', 3, 8, 12, 120], ['leg-extension', 3, 12, 15, 90], ['lib-bar-hip-thrust', 3, 8, 12, 120]]},
    ]},

  // HYBRID. Lifting and running are on separate days on any plan of three or more days (R8).
  {code: 'HB1', goal: 'hybrid', name: 'Two Lift and Two Run', days: 4, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'CONCURRENT',
    summary: 'Two strength days and two run/walk days, never on the same day.',
    slots: [
      {title: 'Strength · lower', group: 'lower', items: [['squat', 2, 8, 12, 120], ['rdl', 2, 8, 12, 120], ['split', 2, 8, 12, 120], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Run/walk · A', group: 'run', kind: 'walkrun'},
      {title: 'Strength · upper', group: 'upper', items: [['pushup', 2, 6, 12, 120], ['row', 3, 8, 12, 120], ['ohp', 2, 8, 12, 120], ['curl', 2, 10, 12, 60]]},
      {title: 'Run/walk · B', group: 'run', kind: 'walkrun'},
    ]},
  {code: 'HB2', goal: 'hybrid', name: 'Three Lift and Two Run', days: 5, experience: 'some', equipment: 'gym', budget: 'strength', source: 'CONCURRENT',
    summary: 'Three strength days and two run/walk days. Strength and run/walk sessions fall on separate days.',
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
    summary: 'Two strength days for an athlete who runs or cycles on other days. Keep lifting volume modest and avoid hard endurance work on the same day.',
    slots: [
      {title: 'Lower', group: 'lower', items: [['split', 3, 5, 8, 150], ['rdl', 3, 5, 8, 150], ['calf', 3, 8, 12, 60], ['deadbug', 2, 6, 10, 60], ['row', 2, 6, 10, 120]]},
      {title: 'Upper', group: 'upper', items: [['ohp', 3, 5, 8, 150], ['pushup', 3, 5, 10, 120], ['row', 3, 6, 10, 120], ['bridge', 2, 8, 12, 90]]},
    ]},

  // GENERAL FITNESS. Adult guidance for muscle-strengthening work on two or more days (WHO 2020).
  {code: 'GF1', goal: 'general', name: 'Beginner Full Body', days: 2, experience: 'all', equipment: 'bodyweight-band', budget: 'strength', source: 'ACSM-2026',
    summary: 'Two full-body sessions with bodyweight and a resistance band.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['bw-squat', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['band-row', 2, 8, 12, 90], ['bridge', 2, 10, 12, 60], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Full body · B', group: 'full', items: [['ref-Band_Good_Morning', 2, 8, 12, 90], ['pushup', 2, 6, 10, 90], ['band-row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
    ]},
  {code: 'GF2', goal: 'general', name: 'Full Body and Walk', days: 3, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'WHO-2020',
    summary: 'Two full-body strength sessions and one 25-minute brisk walk. Adult guidance suggests 150 to 300 minutes of moderate activity a week, so this plan alone does not reach that total.',
    slots: [
      {title: 'Full body · A', group: 'full', items: [['squat', 2, 8, 12, 90], ['pushup', 2, 6, 12, 90], ['row', 2, 8, 12, 90], ['calf', 2, 10, 15, 60], ['deadbug', 2, 6, 10, 60]]},
      {title: 'Brisk walk', group: 'run', items: [['walk', 1, 25, 25, 60]]},
      {title: 'Full body · B', group: 'full', items: [['rdl', 2, 8, 12, 90], ['ohp', 2, 8, 12, 90], ['split', 2, 8, 12, 90], ['bridge', 2, 10, 12, 60]]},
    ]},
  {code: 'GF3', goal: 'general', name: 'Upper and Lower', days: 4, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'ACSM-2026',
    summary: 'Upper and lower sessions, each muscle group trained twice a week, with dumbbells.',
    slots: [
      {title: 'Upper · A', group: 'upper', items: [['pushup', 3, 6, 10, 90], ['row', 3, 8, 12, 90], ['ohp', 2, 8, 12, 90], ['curl', 2, 10, 15, 60], ['lib-db-overhead-triceps', 2, 10, 15, 60]]},
      {title: 'Lower · A', group: 'lower', items: [['squat', 3, 8, 12, 90], ['rdl', 2, 8, 12, 90], ['split', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
      {title: 'Upper · B', group: 'upper', items: [['incline-press', 3, 8, 12, 90], ['row', 3, 8, 12, 90], ['lateral', 2, 12, 15, 60], ['lib-db-overhead-triceps', 2, 10, 15, 60]]},
      {title: 'Lower · B', group: 'lower', items: [['bridge', 3, 10, 12, 90], ['split', 3, 8, 12, 90], ['rdl', 2, 8, 12, 90], ['calf', 2, 10, 15, 60]]},
    ]},
  {code: 'GF4', goal: 'general', name: 'Walk-Run and Strength', days: 5, experience: 'all', equipment: 'dumbbells', budget: 'strength', source: 'NHS-C25K',
    summary: 'Three run/walk days and two strength days, with a rest day between runs. The run/walk sequence follows the NHS Couch to 5K stages.',
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
      {title: 'Bodyweight and band · A', group: 'full', items: [['bw-squat', 2, 8, 12, 60], ['pushup', 2, 6, 10, 60], ['band-row', 2, 8, 12, 60], ['deadbug', 2, 6, 10, 45]]},
      {title: 'Bodyweight and band · B', group: 'full', items: [['bridge', 2, 8, 12, 60], ['pushup', 2, 6, 10, 60], ['band-row', 2, 8, 12, 60], ['calf', 2, 10, 15, 45]]},
    ]},
];

const brief = (f: Family, minutes: number) => minutes <= 30 || f.code === 'GF5';

export const routineLibrary: ProgramDefinition[] = FAMILIES.flatMap(f => BANDS.flatMap(minutes => {
  if (NOT_OFFERED[f.code]?.includes(minutes)) return [];
  const isBrief = brief(f, minutes);
  const slots: ProgramSlot[] = [];
  for (const s of f.slots) {
    let items: Item[] = [];
    if (s.items) {
      const fitted = fitSlot(s.items, minutes, isBrief);
      if (!fitted) return [];
      items = fitted;
    }
    slots.push({title: s.title, group: s.group, ...(s.kind ? {kind: s.kind} : {}), items});
  }
  const short = isBrief ? ` About ${minutes} minutes. This shorter version carries less weekly work than the longer ones.` : ` About ${minutes} minutes per session.`;
  return [{
    id: `LIB-${f.code}-${minutes}`,
    goal: f.goal,
    name: `${GOAL_LABEL[f.goal]} · ${f.name} · ${minutes} min`,
    description: f.summary + short,
    days: f.days,
    minutes,
    experience: f.experience,
    equipment: f.equipment,
    brief: isBrief || undefined,
    source: f.source,
    slots,
  } as ProgramDefinition];
}));
