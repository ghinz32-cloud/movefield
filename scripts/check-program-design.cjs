const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
// Evidence rules for the built-in programs. Every catalog program is built with the same profile the app uses
// for a full, established lifter, then checked week by week. Thresholds are product quality checks
// informed by source principles (docs/program-evidence.md), not validated individualized prescriptions.
const root = path.join(__dirname, '..');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const m = {exports: {}};
  cache.set(name, m);
  const source = ts.transpileModule(fs.readFileSync(path.join(root, 'lib', name + '.ts'), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true}}).outputText;
  new Function('require', 'module', 'exports', source)(s => (s.startsWith('./') ? (s.endsWith('.json') ? JSON.parse(fs.readFileSync(path.join(root, 'lib', s), 'utf8')) : load(s.slice(2))) : require(s)), m, m.exports);
  return m.exports;
}
const T = load('training'), C = load('program-catalog');

// Weighted sets: a set counts 1 toward a primary muscle and 0.5 toward a secondary one. The 0.5 weight is an app
// convention for indirect work, not a figure from a named trial. Exercises the app stores without muscle data are
// set here from the exercise name and standard anatomy. Library exercises use their first-listed muscle as primary.
const NAMED = {
  'band-row': {back: 1, biceps: 0.5}, 'bar-squat': {quads: 1, glutes: 0.5}, bench: {chest: 1, triceps: 0.5, shoulders: 0.5},
  bridge: {glutes: 1, hams: 0.5}, 'bw-squat': {quads: 1, glutes: 0.5}, calf: {calves: 1}, curl: {biceps: 1}, deadbug: {core: 1},
  deadlift: {hams: 1, back: 1, glutes: 0.5}, 'incline-press': {chest: 1, shoulders: 0.5, triceps: 0.5}, lateral: {shoulders: 1},
  'leg-curl': {hams: 1}, 'leg-extension': {quads: 1}, ohp: {shoulders: 1, triceps: 0.5}, pulldown: {back: 1, biceps: 0.5},
  pushup: {chest: 1, triceps: 0.5}, rdl: {hams: 1, glutes: 0.5}, row: {back: 1, biceps: 0.5}, split: {quads: 1, glutes: 0.5},
  squat: {quads: 1, glutes: 0.5}, triceps: {triceps: 1},
};
const LIBRARY = {
  quadriceps: 'quads', Quadriceps: 'quads', hamstrings: 'hams', Hamstrings: 'hams', glutes: 'glutes', Gluteals: 'glutes',
  chest: 'chest', Pectorals: 'chest', lats: 'back', 'Latissimus dorsi': 'back', 'middle back': 'back', 'Mid-back': 'back', traps: 'back',
  'lower back': 'back', 'Erector spinae': 'back', 'Spinal erectors': 'back', shoulders: 'shoulders', Deltoids: 'shoulders',
  'Anterior deltoids': 'shoulders', 'Posterior deltoids': 'shoulders', 'Lateral deltoids': 'shoulders', biceps: 'biceps', Biceps: 'biceps',
  Brachialis: 'biceps', triceps: 'triceps', Triceps: 'triceps', calves: 'calves', Soleus: 'calves', Gastrocnemius: 'calves',
  abdominals: 'core', 'Rectus abdominis': 'core', Obliques: 'core',
};
// Audited major groups. Glutes, calves and abdominals are reported but not required: the main lifts give them indirect work.
const MAJOR = ['chest', 'back', 'quads', 'hams', 'shoulders', 'biceps', 'triceps'];
const VOLUME_TARGET = 10; // app weighted-set coverage target; source dose-response does not validate these exact muscle weights or an individual optimum
const FREQ_TARGET = 2; // app distribution preference; 2019 volume-equated evidence does not require twice-weekly frequency for superior hypertrophy
const HEAVY_REPS = 6; // app lower-rep band proxy; reps alone do not establish actual load, effort or percentage of 1RM
const HEAVY_REST = 120; // app minimum for this lower-rep band; preserve time for actual technique and recovery needs
const LIFT_IDS = {squat: 'bar-squat', bench: 'bench', deadlift: 'deadlift'};
const MAIN_IDS = Object.values(LIFT_IDS);

// Designed exemptions: learning blocks that deliberately have no heavy work yet.
const EXEMPT_R5 = {
  PLSTART3: 'Learning block: one competition lift a day, started light while the setup is learned. Heavy sets belong in the build blocks.',
};
// Designed allowances. Each one is printed by the check with its reason. Nothing else is waived.
const GROUP_ALLOWANCE = {
  BBHOME3: {biceps: 'The exercise library has no curl that needs only bodyweight or bands, so biceps get indirect pulling work (band rows, about 5 weighted sets a week). The description tells the user to add a dumbbell or band curl.'},
};
// Known gaps are listed, not hidden. Each one names the reason and is printed by the check.
const KNOWN_GAPS = {
  BB2: 'Two sessions a week cannot give each major group 10 weighted sets at this session length. The description says the plan has less volume than a three- or four-day plan.',
  BBDBST2: 'Two dumbbell sessions cannot give each major group 10 weighted sets at this session length. Use a three-day dumbbell plan for the full guide.',
  PBDBST2: 'Two dumbbell sessions cannot give each major group 10 weighted sets at this session length. Use a three-day dumbbell plan for the full guide.',
  PBSTART2: 'Two sessions a week cannot give each major group 10 weighted sets at this session length. The description says each group gets less weekly work than a three- or four-day plan.',
};

const groupsFor = id => {
  if (id === 'run') return {cardio: 1};
  if (NAMED[id]) return NAMED[id];
  const e = T.exFor(id);
  const list = e.primaryMuscles || [];
  const out = {};
  list.forEach((m, n) => { const g = LIBRARY[m]; if (g) out[g] = Math.max(out[g] || 0, n === 0 ? 1 : 0.5); });
  return out;
};
const isRun = (id, session) => id === 'run' || session.kind === 'walkrun' || session.kind === 'brief-run' || session.group === 'run';
const isLift = id => id !== 'run';

const base = {...T.blankProfile, start: T.addDays(T.day(), 2), days: [0, 1, 2, 3, 4, 5, 6], minutes: 120, weeks: 3, experience: 'Experienced', establishedTraining: true, runBase: true, runDays: 4, runMinutes: 100};

const failures = [], rows = [];
const fail = (program, rule, detail) => failures.push({program, rule, detail});

for (const d of C.programCatalog) {
  const built = T.buildPlan({...base, goal: d.goal, programId: d.id, equipment: C.programEquipment(d), weeks: 3});
  if (!built.plan) { fail(d.id, 'builds', built.errors.join(' ')); continue; }
  const plan = built.plan;
  const summary = {id: d.id, goal: d.goal, days: d.days, minutes: d.minutes, brief: !!d.brief, worst: {}};
  const byWeek = {};
  for (const week of [1, 2, 3]) {
    const sessions = plan.sessions.filter(s => s.week === week);
    if (!sessions.length) continue;
    const sets = {}, freq = {};
    for (const s of sessions) {
      const seen = new Set();
      const runSession = s.items.some(i => isRun(i.exerciseId, s));
      const liftSession = s.items.some(i => isLift(i.exerciseId));
      if (d.goal === 'hybrid' && runSession && liftSession && d.days > 2) fail(d.id, 'R8 run and lifting in one session', s.title);
      if (d.goal === 'hybrid' && runSession && liftSession && d.days <= 2) {
        // Two-day starters combine a short walk-run with strength. The run must come last and stay short.
        const last = s.items[s.items.length - 1];
        if (!isRun(last.exerciseId, s) || (last.sets * (last.repMax ?? last.reps) * 4) > 20 * 60) fail(d.id, 'R8 combined two-day session: run must be last and short', s.title);
      }
      for (const i of s.items) {
        if (isRun(i.exerciseId, s)) continue;
        const groups = groupsFor(i.exerciseId);
        for (const [g, w] of Object.entries(groups)) { sets[g] = (sets[g] || 0) + i.sets * w; seen.add(g); }
        const top = i.repMax ?? i.reps;
        const low = i.repMin ?? i.reps;
        if (d.youth && top < 6) fail(d.id, 'R9 youth near-maximal work', `${i.exerciseId} ${low}-${top}`);
        if (top <= HEAVY_REPS && i.rest < HEAVY_REST) fail(d.id, 'R6 heavy sets need longer rest', `${i.exerciseId} ${low}-${top} rest ${i.rest}s week ${week}`);
        if (i.rest < 60 || i.rest > 300) fail(d.id, 'R6 rest outside 60-300 seconds', `${i.exerciseId} rest ${i.rest}s`);
        if (d.goal === 'hypertrophy' || d.goal === 'powerbuilding') {
          const main = MAIN_IDS.includes(i.exerciseId);
          if (!main && top > HEAVY_REPS && (low < 5 || top > 20)) fail(d.id, 'R3 muscle-building rep range 5-20', `${i.exerciseId} ${low}-${top}`);
        }
      }
      for (const g of seen) freq[g] = (freq[g] || 0) + 1;
      const computed = s.minutes;
      if (computed > d.minutes + 5) fail(d.id, 'R11 session longer than the stated time', `${computed} min vs ${d.minutes}`);
    }
    byWeek[week] = {sets, freq};
    // R4, R5: powerlifting main lifts (gym programs)
    if (d.goal === 'powerlifting' && d.equipment === 'gym' && !EXEMPT_R5[d.id]) {
      for (const [name, id] of Object.entries(LIFT_IDS)) {
        const present = sessions.some(s => s.items.some(i => i.exerciseId === id));
        if (!present) fail(d.id, 'R4 competition lift missing', `${name} in week ${week}`);
        const heavy = sessions.some(s => s.items.some(i => i.exerciseId === id && (i.repMax ?? i.reps) <= HEAVY_REPS));
        if (!heavy) fail(d.id, 'R5 no heavy set for a competition lift', `${name} in week ${week}`);
      }
    }
    // R1, R2: full-length hypertrophy and powerbuilding volume and frequency
    if ((d.goal === 'hypertrophy' || d.goal === 'powerbuilding') && !d.brief && d.minutes >= 45 && !KNOWN_GAPS[d.id]) {
      for (const g of MAJOR) {
        if (GROUP_ALLOWANCE[d.id] && GROUP_ALLOWANCE[d.id][g]) continue;
        if ((sets[g] || 0) < VOLUME_TARGET) fail(d.id, 'R1 weekly sets below 10 for a major group', `${g} ${sets[g] || 0} in week ${week}`);
        if ((freq[g] || 0) < FREQ_TARGET) fail(d.id, 'R2 group trained fewer than 2 sessions a week', `${g} ${freq[g] || 0} in week ${week}`);
      }
    }
  }
  // R7: run spacing. Walk-run and beginner sessions keep a rest day between runs (NHS Couch to 5K). An easy-only base may
  // pair days, but four runs in seven days always include at least one back-to-back pair, so the allowance per calendar
  // week is the fewest pairs possible: runs minus three (never below zero). Any other pair fails.
  const runSessions = plan.sessions.filter(s => s.items.some(i => isRun(i.exerciseId, s))).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const easyOnly = d.slots.filter(s => s.group === 'run').every(s => s.kind === 'easy');
  const pairsByWeek = {}, runsByWeek = {};
  for (const s of runSessions) runsByWeek[s.week] = (runsByWeek[s.week] || 0) + 1;
  for (let k = 1; k < runSessions.length; k++) {
    const gap = (new Date(runSessions[k].date) - new Date(runSessions[k - 1].date)) / 86400000;
    if (gap < 1) fail(d.id, 'R7 two run sessions on one day', runSessions[k].date);
    if (gap === 1) pairsByWeek[runSessions[k].week] = (pairsByWeek[runSessions[k].week] || 0) + 1;
  }
  for (const [week, pairs] of Object.entries(pairsByWeek)) {
    const allowed = easyOnly ? Math.max(0, runsByWeek[week] - 3) : 0;
    if (pairs > allowed) fail(d.id, 'R7 run sessions on consecutive days', `${pairs} back-to-back pair(s) in week ${week}, allowed ${allowed}`);
  }
  // R10: brief muscle programs must say that they carry less work
  if (d.brief && (d.goal === 'hypertrophy' || d.goal === 'powerbuilding') && !/less|base|shorter|smaller/i.test(d.description)) fail(d.id, 'R10 brief muscle program does not state its lower volume', d.name);
  summary.byWeek = byWeek;
  rows.push(summary);
}

// Print a compact table: one row per program, worst case over weeks 1-3.
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('ID', 10) + pad('goal', 13) + pad('days', 5) + pad('min', 5) + 'major group sets (chest back quads hams glutes shoulders biceps triceps), week 1');
for (const r of rows) {
  const w = r.byWeek[1];
  if (!w) continue;
  console.log(pad(r.id, 10) + pad(r.goal, 13) + pad(r.days, 5) + pad(r.minutes, 5) + MAJOR.map(g => w.sets[g] || 0).join(' '));
}
const byRule = {};
for (const f of failures) (byRule[f.rule] = byRule[f.rule] || []).push(f);
console.log('');
for (const [rule, list] of Object.entries(byRule)) {
  const programs = [...new Set(list.map(f => f.program))];
  console.log(`${rule}: ${list.length} case(s) in ${programs.length} program(s): ${programs.join(', ')}`);
}
if (process.env.AUDIT_DETAIL) for (const f of failures) console.log(f.program, f.rule, f.detail);
const programCount = rows.length;
console.log(`\nPrograms checked: ${programCount}. Rule failures: ${failures.length}.`);
for (const [id, why] of Object.entries(KNOWN_GAPS)) console.log(`Known gap ${id}: ${why}`);
for (const [id, groups] of Object.entries(GROUP_ALLOWANCE)) for (const [g, why] of Object.entries(groups)) console.log(`Allowance ${id} ${g}: ${why}`);
console.log('Allowance RNBASE4 R7: an easy-only run base may pair back-to-back easy days, at most runs minus three per week (four runs in seven days force one pair).');
for (const [id, why] of Object.entries(EXEMPT_R5)) console.log(`Exemption ${id} R5: ${why}`);
module.exports = {failures, rows};
if (failures.length && !process.env.AUDIT_REPORT_ONLY) {
  console.error('Program design check failed. See the rules above and docs/program-evidence.md.');
  process.exitCode = 1;
}
