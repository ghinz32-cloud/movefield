const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(filename) {
  const file = path.resolve(filename);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (!name.startsWith('.')) return require(name);
    const target = path.resolve(path.dirname(file), name);
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(target, 'utf8')) : load(target + (path.extname(target) ? '' : '.ts'));
  }, module, module.exports);
  return module.exports;
}
function workoutFixture() {
  const T = load('lib/training.ts');
  const s = load('lib/onboarding.ts').freshState();
  const weekday = new Date(T.day() + 'T12:00:00').getDay();
  const p = { ...T.blankProfile, name: 'Synthetic test athlete', age: 28, goal: 'general', mode: 'app', minutes: 90, weeks: 2, start: T.day(), days: [weekday, (weekday + 3) % 7].sort(), equipment: 'Dumbbells' };
  const result = T.buildPlan(p); if (!result.plan) throw new Error(result.errors.join(' '));
  const plan = { ...result.plan, acceptedAt: new Date().toISOString() };
  const x = plan.sessions[0];
  const active = { id: 'synthetic-active', sessionId: x.id, title: x.title, date: x.date, startedAt: 1, targets: x.items.map(i => ({ ...i })), sets: x.items.flatMap(i => Array.from({ length: i.sets }, (_, n) => ({ exerciseId: i.exerciseId, set: n + 1, reps: 8, kg: null, done: false }))) };
  return { ...s, profile: p, plan, active };
}
module.exports = { load, workoutFixture };
