const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
// Checks the typed-goal reader in lib/goal-match.ts. Expected values are worked out by hand from the rules.
const root = path.join(__dirname, '..');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const m = {exports: {}};
  cache.set(name, m);
  const source = ts.transpileModule(fs.readFileSync(path.join(root, 'lib', name + '.ts'), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  new Function('require', 'module', 'exports', source)(() => ({}), m, m.exports);
  return m.exports;
}
const G = load('goal-match');
const V = load('exercise-video');
let checks = 0;
const groups = [];
const same = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++; };
const ok = (v, msg) => { assert.ok(v, msg); checks++; };
function test(name, fn) { fn(); groups.push(name); console.log('PASS ' + name); }

test('Empty, unrelated and ignored text suggest nothing', () => {
  same(G.readGoal(''), null);
  same(G.readGoal('   '), null);
  same(G.readGoal('something unrelated to training'), null);
  same(G.readGoal('running shoes'), null, '"running shoes" is not a goal');
  same(G.readGoal('size chart'), null, '"size chart" is not a goal');
});

test('Lifting words map to the specific weight-training goal', () => {
  const bench = G.readGoal('bench 100 kg and squat 140');
  same(bench.goal, 'powerlifting');
  same(bench.matched, ['bench', 'squat'], 'matched words keep the order they appear in the text');
  same(G.readGoal('get better at the deadlift').goal, 'powerlifting');
  same(G.readGoal('powerbuilding for strength and size').goal, 'powerbuilding');
  same(G.readGoal('build muscle').goal, 'hypertrophy');
  same(G.readGoal('bigger arms and a better physique').goal, 'hypertrophy');
  same(G.readGoal('get stronger').goal, 'strength');
});

test('Running and mixed goals resolve in a fixed order, with alternatives shown', () => {
  const mixed = G.readGoal('run a 10K and get stronger');
  same(mixed.goal, 'hybrid');
  ok(mixed.alternatives.some(a => a.goal === 'running'), 'running is offered as an alternative');
  ok(mixed.alternatives.some(a => a.goal === 'strength'), 'strength is offered as an alternative');
  same(G.readGoal('I want to run a 5K').goal, 'running');
  same(G.readGoal('couch to 5k').goal, 'running');
  same(G.readGoal('run and lift').goal, 'hybrid');
});

test('Sport wins over lifting words and carries a jump hint when jumping is named', () => {
  const sport = G.readGoal('jump higher for basketball and squat more');
  same(sport.goal, 'sport');
  ok(sport.hint && sport.hint.includes('Jump practice'), 'jump hint is shown');
  same(G.readGoal('soccer fitness').goal, 'sport');
  same(G.readGoal('cross country season').goal, 'sport');
  same(G.readGoal('basketball').hint, undefined, 'no jump hint without jump words');
});

test('Calisthenics, general and beginner wording map to their goals', () => {
  same(G.readGoal('first muscle-up and pull ups').goal, 'calisthenics');
  same(G.readGoal('handstand practice').goal, 'calisthenics');
  same(G.readGoal('lose weight and feel better').goal, 'general');
  same(G.readGoal('general fitness, I am a beginner').goal, 'general');
});

test('Every suggested goal has a plain label', () => {
  for (const text of ['bench', 'powerbuilding', 'sport', 'run', 'pull ups', 'build muscle', 'get stronger', 'healthy']) {
    const r = G.readGoal(text);
    ok(r && r.label && r.label.length > 3, 'label for ' + text);
  }
});


test('Demonstration links: curated video first, then the source page, and only https links', () => {
  const media = {
    squat: {sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/goblet-squat', videoUrl: 'https://www.youtube.com/watch?v=nfX7IFK9UNI'},
    row: {sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/row', videoUrl: null},
    bad: {sourceUrl: 'http://example.com/page', videoUrl: 'javascript:alert(1)'},
    creds: {sourceUrl: 'https://user:pass@example.com/x', videoUrl: null},
  };
  same(V.demoLink('squat', media).kind, 'video');
  same(V.demoLink('row', media), {url: 'https://www.nasm.org/resource-center/exercise-library/row', kind: 'source'});
  same(V.demoLink('bad', media), null, 'plain http and script links are refused');
  same(V.demoLink('creds', media), null, 'links with credentials are refused');
  same(V.demoLink('unknown', media), null);
  same(V.demoLink('squat', null), null);
  same(V.safeWebUrl('https://example.com/a'), 'https://example.com/a');
  same(V.safeWebUrl('not a url'), null);
});

test('First-time exercises: not logged in any saved workout and not dismissed', () => {
  const history = [{sets: [{exerciseId: 'squat', done: true}, {exerciseId: 'row', done: false}]}, {sets: [{exerciseId: 'bench', done: true}]}];
  same(V.firstTimeExerciseIds(history, ['squat', 'row', 'lunge', 'lunge', 'press']), ['row', 'lunge', 'press'], 'logged exercises are excluded, duplicates collapse');
  same(V.firstTimeExerciseIds(history, ['row', 'lunge', 'press'], ['lunge']), ['row', 'press'], 'dismissed exercises stay quiet');
  same(V.firstTimeExerciseIds([], ['squat']), ['squat']);
});

test('Every plan evidence key has a Sources entry, and plans cite the right families', () => {
  const page = fs.readFileSync(path.join(root, 'app', 'page.tsx'), 'utf8');
  const start = page.indexOf('const SOURCE_LINKS');
  const block = page.slice(start, page.indexOf('\n};', start));
  const registry = new Set([...block.matchAll(/['"]([A-Z][A-Z0-9-]+)['"]:\{name:/g)].map(m => m[1]));
  ok(registry.size >= 30, 'the Sources registry is present');
  const E = load('program-evidence');
  for (const [family, entry] of Object.entries(E.disciplineEvidence)) {
    for (const key of entry.keys) ok(registry.has(key), `${family} cites ${key}, which has no Sources entry`);
  }
  const keys = E.planEvidence({goal: 'powerlifting', run: false, youth: false, jumping: false});
  ok(keys.includes('PETERSON-2004') && keys.includes('ACSM-2026'), 'powerlifting plans cite strength and adult guidance');
  same(E.planEvidence({goal: 'hybrid', run: true, youth: false, jumping: false})[0], 'NHS-C25K', 'run plans keep the run source first');
  ok(E.planEvidence({goal: 'strength', run: false, youth: true, jumping: false}).includes('AAP-2020'), 'youth plans keep youth sources');
  ok(E.planEvidence({goal: 'sport', run: false, youth: false, jumping: true}).includes('MARKOVIC-2007'), 'jump focus adds jump sources');
  for (const family of Object.keys(E.disciplineEvidence)) {
    for (const run of [false, true]) for (const youth of [false, true]) {
      const current = E.planEvidence({goal: family, run, youth, jumping: true});
      ok(!current.includes('ACSM-2009'), `${family} does not use historical adult guidance as current support`);
      ok(!current.includes('SCHOENFELD-2016-FREQ'), `${family} uses current frequency evidence`);
      same(current.length, new Set(current).size, `${family} evidence is deduplicated`);
      for (const key of current) ok(registry.has(key), `${family} resolves ${key}`);
    }
  }
  for (const family of ['hypertrophy', 'powerbuilding', 'hybrid']) {
    ok(E.disciplineEvidence[family].keys.includes('SCHOENFELD-2019-FREQ'), `${family} cites volume-equated frequency review`);
  }
  for (const family of ['hypertrophy', 'powerbuilding', 'powerlifting', 'strength']) {
    ok(E.disciplineEvidence[family].keys.includes('PELLAND-2026-DOSE'), `${family} cites updated volume/strength evidence`);
  }
  ok(registry.has('ACSM-2009') && registry.has('SCHOENFELD-2016-FREQ'), 'historical sources remain available');
});

console.log(`${groups.length} groups, ${checks} checks passed.`);
