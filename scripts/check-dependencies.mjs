import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import dependencyPolicy from './lib/dependency-policy.cjs';
const flags=process.argv.slice(2);
if(flags.some(flag=>flag!=='--release')||flags.length>1){console.error('Usage: node scripts/check-dependencies.mjs [--release]');process.exit(1)}
const mode=flags.includes('--release')?'release':'ci';
// Dated CI exceptions never waive the strict release gate. Malformed or
// incomplete audit evidence also fails, rather than looking like zero issues.
mkdirSync('.sites-runtime',{recursive:true});
let failed=false;
const decisions=[];
for(const [name,command,args,cwd] of [['web','pnpm',['audit','--json'],'.'],['mobile','npm',['audit','--json'],'mobile']]){
 const result=spawnSync(command,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:10_000_000});
 if(result.error){console.error(`${name} audit could not run: ${result.error.message}`);failed=true;continue}
 let report;try{report=JSON.parse(result.stdout)}catch{console.error(`${name} audit did not return valid JSON.`);failed=true;continue}
 writeFileSync(`.sites-runtime/${name}-dependency${mode==='release'?'-release':''}-checks.json`,JSON.stringify(report,null,2)+'\n');
 const decision=dependencyPolicy.evaluateDependencyReport(report,{mode,now:Date.now(),exitCode:result.status});
 decisions.push({name,...decision});
 for(const issue of decision.findings)console.log(`${issue.allowed?'KNOWN CI EXCEPTION / RELEASE BLOCKED':'FAIL'} ${name}: ${issue.name} ${issue.url} (${issue.disposition})`);
 for(const error of decision.errors)console.error(`${name}: ${error}`);
 if(!decision.ok)failed=true;
}
writeFileSync(`.sites-runtime/dependency-${mode}-decision.json`,JSON.stringify({mode,passed:!failed,decisions},null,2)+'\n');
if(failed)process.exitCode=1;
