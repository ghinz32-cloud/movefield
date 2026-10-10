const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { workoutFixture, load } = require('./domain-test-loader.cjs');
const base = process.env.MOVEFIELD_BASE_URL || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('These synthetic mutation tests are limited to a local app.');
const { exFor } = load('lib/training.ts');
const fixture = workoutFixture();
fixture.active.targets = fixture.active.targets.slice(0, 3).map(x => ({ ...x, sets: 1 }));
fixture.active.sets = fixture.active.targets.map(x => ({ exerciseId: x.exerciseId, set: 1, reps: 8, kg: null, done: false }));
const ids = fixture.active.targets.map(x => x.exerciseId), names = ids.map(id => exFor(id).name);
let passed = 0;
const waitFor = async (page, predicate) => { await page.waitForFunction(predicate, undefined, { timeout: 15000 }); };
async function seeded(context) {
  const page = await context.newPage();
  await page.goto(base);
  await page.evaluate(s => { localStorage.setItem('training-studio-v2', JSON.stringify(s)); localStorage.setItem('training-studio-access-v1', 'open'); }, fixture);
  await page.reload();
  await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Resume workout', exact: true }).click();
  await page.getByRole('heading', { name: 'Exercises in this workout', exact: true }).waitFor();
  return page;
}
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', chromiumSandbox: true, args: ['--disable-setuid-sandbox'], env: { ...process.env, XDG_CONFIG_HOME: '/workspace/movefield/.sites-runtime/config', XDG_CACHE_HOME: '/workspace/movefield/.sites-runtime/cache' } });
  try {
    await test('Actual quota failure keeps the set unfinished, focused, and recoverable', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'training-studio-v2') throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); return window.originalSetItem.call(this, key, value); }; });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByText('Synthetic quota failure', { exact: false }).first().waitFor();
        assert.equal(await page.getByRole('heading', { name: names[0], exact: true }).count(), 1);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).active.sets[0].done), false);
        assert.equal(await page.getByRole('button', { name: `Saved ${names[0]} set 1`, exact: true }).count(), 0);
        await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).active.sets[0].done), true);
        await page.reload(); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).active.sets[0].done), true);
      } finally { await context.close(); }
    });
    await test('Partial finish cannot appear saved when the real storage write fails', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
        await page.getByText('2 sets or tasks are not logged.', { exact: false }).waitFor();
        await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'training-studio-v2') throw new DOMException('Synthetic finish failure', 'QuotaExceededError'); return window.originalSetItem.call(this, key, value); }; });
        await page.getByRole('button', { name: 'Save workout', exact: true }).click();
        await page.getByText('Synthetic finish failure', { exact: false }).first().waitFor();
        assert.equal(await page.getByRole('dialog').count(), 1);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).history.length), 0);
        await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
        await page.getByRole('button', { name: 'Save workout', exact: true }).dblclick();
        await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')));
        assert.equal(saved.active, null); assert.equal(saved.history.length, 1); assert.equal(saved.history[0].partial, true); assert.equal(saved.history[0].sets.filter(x => x.done).length, 1);
        await page.reload(); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).history.length), 1);
      } finally { await context.close(); }
    });
    await test('Delayed save respects deliberate navigation back to the remaining list', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.evaluate(() => { void navigator.locks.request('training-studio-save:training-studio-v2', () => new Promise(resolve => { window.releaseSyntheticSave = resolve; })); });
        await page.waitForFunction(() => typeof window.releaseSyntheticSave === 'function', undefined, { timeout: 15000 });
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('button', { name: 'All exercises / remaining work', exact: true }).click();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).active.sets[0].done), false);
        await page.evaluate(() => { window.releaseSyntheticSave(); });
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('training-studio-v2')).active.sets[0].done, undefined, { timeout: 15000 });
        await page.getByRole('heading', { name: 'Exercises in this workout', exact: true }).waitFor();
        assert.equal(await page.getByRole('heading', { name: names[1], exact: true }).count(), 0);
      } finally { await context.close(); }
    });
    await test('Full completion saves exactly one workout with the original workout identity and date', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        for (let index = 0; index < names.length; index++) {
          await page.getByRole('heading', { name: names[index], exact: true }).waitFor();
          await page.getByRole('button', { name: `Log ${names[index]} set 1`, exact: true }).click();
        }
        await page.getByRole('heading', { name: 'Workout complete', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
        await page.getByRole('button', { name: 'Save workout', exact: true }).click();
        await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')));
        assert.equal(saved.history.length, 1); assert.equal(saved.history[0].id, fixture.active.id); assert.equal(saved.history[0].date, fixture.active.date); assert.equal(saved.history[0].partial, false); assert.equal(saved.history[0].sets.filter(x => x.done).length, 3); assert.equal(saved.active, null); assert.equal(saved.restTimer, null);
        await page.reload(); await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')).history.length), 1);
      } finally { await context.close(); }
    });
    await test('A second tab changes the snapshot without being overwritten by a stale command', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        const other = await context.newPage(); await other.goto(base);
        await other.evaluate(() => { const s = JSON.parse(localStorage.getItem('training-studio-v2')); s.profile.name = 'Synthetic other tab'; localStorage.setItem('training-studio-v2', JSON.stringify(s)); });
        await page.getByText('Your saved profile changed in another tab.', { exact: false }).first().waitFor();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('training-studio-v2')));
        assert.equal(saved.profile.name, 'Synthetic other tab'); assert.equal(saved.active.sets[0].done, false);
      } finally { await context.close(); }
    });
    await test('Sample actions and reset leave the personal snapshot byte-for-byte unchanged', async () => {
      const context = await browser.newContext(); const page = await seeded(context);
      try {
        await page.getByRole('button', { name: `1. ${names[0]}`, exact: false }).click();
        await page.getByRole('button', { name: `Log ${names[0]} set 1`, exact: true }).click();
        await page.getByRole('heading', { name: names[1], exact: true }).waitFor();
        const personal = await page.evaluate(() => localStorage.getItem('training-studio-v2'));
        assert.ok(JSON.parse(personal).restTimer);
        await page.getByRole('button', { name: 'Progress', exact: true }).click();
        await page.getByRole('button', { name: 'View 12-week example', exact: false }).click();
        await page.getByRole('button', { name: 'Return to my profile', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Profile & settings', exact: true }).click();
        await page.getByRole('button', { name: 'Reset prototype', exact: true }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
        await waitFor(page, () => sessionStorage.getItem('training-studio-sample-v1') !== null).catch(async error=>{console.log('Reset state:',await page.evaluate(()=>({samplePresent:sessionStorage.getItem('training-studio-sample-v1') !== null,status:document.body.innerText.slice(-1200)})));throw error});
        assert.equal(await page.evaluate(() => localStorage.getItem('training-studio-v2')), personal);
        assert.ok(await page.evaluate(() => JSON.parse(sessionStorage.getItem('training-studio-sample-v1')).history.length > 0));
        await page.getByRole('button', { name: 'Return to my profile', exact: true }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('training-studio-v2')), personal);
      } finally { await context.close(); }
    });
    await test('Recovered static assets and narrow exercise overview render in the actual app', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 740 } }); const page = await seeded(context);
      try {
        for (const asset of ['/exercise-guides.json', '/exercise-content.json', '/fonts/inter-variable.ttf', '/brand/movefield-mark.svg']) assert.equal((await page.request.get(base + asset)).status(), 200);
        const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(width.document <= width.viewport, JSON.stringify(width));
        fs.mkdirSync('.sites-runtime/evidence', { recursive: true });
        await page.screenshot({ path: '.sites-runtime/evidence/workout-overview-320.png', fullPage: true });
      } finally { await context.close(); }
    });
    assert.ok(passed > 0, 'No browser journeys ran');
    console.log(`${passed} real browser regression journeys passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
