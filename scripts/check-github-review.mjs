import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const grizzly=process.argv.includes('--grizzly');
const directory=resolve(grizzly?'.sites-runtime/grizzly-tests':'.sites-runtime/github-review-tests');await mkdir(directory,{recursive:true});
const base=process.env.MOVEFIELD_BASE_URL||(grizzly?'http://127.0.0.1:8817/movefield/grizzly/':'http://127.0.0.1:8816/movefield/review/');
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Run mutation checks on a local synthetic review only');
// Reuse all assertions. Only adapt the independently specified storage namespace
// and module locations, so the original app's synthetic checks remain unchanged.
const adapt=code=>grizzly?code.replaceAll('training-studio:preferences:v1','grizzly-fitness:preferences:v1').replaceAll('Volt green','Grizzly amber').replaceAll('training-studio','grizzly-training-studio').replaceAll('movefield-private-records-v1','grizzly-private-records-v1').replaceAll('movefield-cloud-outbox-v1','grizzly-cloud-outbox-v1'):code.replaceAll('training-studio','movefield-review-training-studio').replaceAll('movefield-private-records-v1','movefield-review-private-records-v1').replaceAll('movefield-cloud-outbox-v1','movefield-review-cloud-outbox-v1');
for(const name of ['browser-record-read.cjs','check-workout-browser.cjs','check-accessibility.cjs','check-browser-preferences.mjs']){
 let code=adapt(await readFile(resolve('scripts',name),'utf8'));
 code=code.replace("require('./domain-test-loader.cjs')",'require('+JSON.stringify(resolve('scripts/domain-test-loader.cjs'))+')').replace('base + asset',"base.replace(/\\/$/,'') + asset");
 await writeFile(resolve(directory,name),code);
}
const results=[];
for(const name of ['check-workout-browser.cjs','check-accessibility.cjs','check-browser-preferences.mjs']){const result=spawnSync(process.execPath,[resolve(directory,name)],{env:{...process.env,MOVEFIELD_BASE_URL:base,...(grizzly?{MOVEFIELD_DEFAULT_PALETTE:'pine',MOVEFIELD_DEFAULT_MODE:'dark'}:{})},stdio:'inherit',timeout:300000});results.push({name,exit:result.status});if(result.status!==0)break}
await writeFile(grizzly?'.sites-runtime/grizzly-regressions.json':'.sites-runtime/github-review-regressions.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'All existing built-browser assertions against the static subpath review; storage namespace, first palette label and module locations adapted, no assertion suppressed.',results},null,2)+'\n');
if(results.length!==3||results.some(x=>x.exit!==0))process.exitCode=1;
