/* Execute an optimized production bundle, including the circular training/source
 * module graph. Transpiled CommonJS tests alone cannot detect eager ESM captures. */
import {build} from 'vite';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir = resolve('.sites-runtime/production-training');
mkdirSync(dir, {recursive: true});
const entry = resolve(dir, 'entry.ts');
writeFileSync(entry, `
import {blankProfile, buildPlan, day, addDays, eligibility} from '../../lib/training';
import {sourcePrograms} from '../../lib/source-programs';
import {programCatalog} from '../../lib/program-catalog';
import {planOptions, freshState, acceptSetup} from '../../lib/onboarding';
import {defaultInventory} from '../../lib/equipment';
import {experiencedDemo} from '../../lib/experienced-demo';
import {readSavedState} from '../../lib/saved-data';
export function runAudit() {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  const sample = experiencedDemo();
  const wizard = {...sample.profile, goal:'hypertrophy', programId:undefined, days:[2,4,6], minutes:75,
    start:day(), inventory:{...defaultInventory(), confirmed:true}};
  const options = planOptions(wizard, sample.events);
  check(options.some(x=>x.plan && x.profile.mode==='app'), 'Actual bodybuilding wizard has no fitting options');
  check(options.filter(x=>x.recommended).length===1, 'Wizard must have one fitting recommendation');
  const base = {...blankProfile, name:'Synthetic production audit', age:30, start:day(), weeks:8, minutes:120,
    days:[0,1,2,3,4,5,6], experience:'Experienced', establishedTraining:true, runBase:true,runDays:7,
    runMinutes:300,jumpReady:true,inventory:{...defaultInventory(),confirmed:true}};
  let built=0,accepted=0,sourceBuilds=0;
  for(const def of [...programCatalog,...sourcePrograms]) {
    const source=sourcePrograms.some(x=>x.id===def.id);
    for(let weekday=0;weekday<(source?7:1);weekday++) {
      const p={...base,start:addDays(base.start,weekday),goal:source?def.goals[0]:def.goal,programId:def.id};
      const result=buildPlan(p);check(result.plan,def.id+': '+result.errors.join(' '));built++;
      const saved=acceptSetup(freshState(),result.plan.profile,result.plan,[]);
      check(!saved.error,def.id+': '+saved.error);
      const restored=readSavedState(JSON.stringify(saved.state));
      check(restored.plan.template===def.id,def.id+': persisted identity');
      check(eligibility(restored,restored.plan.sessions[0])===null,def.id+': first session blocked');
      accepted++;if(source)sourceBuilds++;
    }
  }
  check(sourceBuilds===56,'All eight public versions must pass seven starts');
  return {wizardOptions:options.length,wizardFitting:options.filter(x=>x.plan&&x.profile.mode==='app').length,built,accepted,sourceBuilds};
}
`);
const results = [];
for (const minify of [false, true]) {
  try {
    const output = await build({configFile: false, publicDir: false, logLevel: 'error', build: {
      write: false, minify, target: 'es2022', lib: {entry, formats: ['es'], fileName: 'training'},
    }});
    const chunks = (Array.isArray(output) ? output : [output]).flatMap(x => x.output);
    const main = chunks.find(x => x.type === 'chunk' && x.isEntry);
    if (!main || chunks.filter(x => x.type === 'chunk').length !== 1) throw Error('Expected a single self-contained audit bundle');
    const filename = resolve(dir, minify ? 'minified.mjs' : 'optimized.mjs');
    writeFileSync(filename, main.code);
    const api = await import(pathToFileURL(filename).href + '?t=' + Date.now());
    results.push({minify, status: 'pass', ...api.runAudit()});
  } catch (error) { results.push({minify, status: 'fail', error: error.message}); }
}
const report = {scope:'Executed optimized Vite library bundles using the actual onboarding, source, storage and training graph; no browser or physical-device claim.',results};
writeFileSync(resolve(dir, 'receipt.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (results.some(x => x.status !== 'pass')) process.exitCode = 1;
