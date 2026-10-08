import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
// No fixes are currently published for these two development-tool roots.
// Temporary exceptions expire in 30 days; any additional high/critical issue fails CI.
const known=new Set(['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm','https://github.com/advisories/GHSA-86w9-cpqp-85rv']);
const expires=Date.parse('2026-11-08T00:00:00Z');
mkdirSync('.sites-runtime',{recursive:true});
let failed=false;
for(const [name,command,args,cwd] of [['web','pnpm',['audit','--json'],'.'],['mobile','npm',['audit','--json'],'mobile']]){
 const result=spawnSync(command,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:10_000_000});
 if(result.error){console.error(`${name} audit could not run: ${result.error.message}`);failed=true;continue}
 let report;try{report=JSON.parse(result.stdout)}catch{console.error(`${name} audit did not return valid JSON.`);failed=true;continue}
 writeFileSync(`.sites-runtime/${name}-dependency-checks.json`,JSON.stringify(report,null,2)+'\n');
 if(report.error){console.error(`${name} advisory service error.`,report.error);failed=true;continue}
 const issues=report.advisories?Object.values(report.advisories):Object.values(report.vulnerabilities||{}).flatMap(v=>v.via.filter(x=>typeof x==='object'));
 for(const issue of issues.filter(x=>['high','critical'].includes(x.severity))){
  const accepted=known.has(issue.url)&&Date.now()<expires;
  console.log(`${accepted?'KNOWN / temporary release blocker':'FAIL'} ${name}: ${issue.name||issue.module_name} ${issue.url}`);
  if(!accepted)failed=true;
 }
 if(result.status!==0&&issues.length===0){console.error(`${name} audit failed without advisory details.`);failed=true}
}
if(failed)process.exitCode=1;
