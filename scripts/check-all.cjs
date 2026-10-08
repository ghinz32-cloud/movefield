const {spawnSync}=require('node:child_process');
const {readdirSync,mkdirSync,writeFileSync}=require('node:fs');
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const production=process.argv.includes('--production');
const checks=readdirSync('scripts').filter(name=>/^check-.*\.cjs$/.test(name)&&name!=='check-all.cjs'&&(/^(check-production-security|check-bundle)\.cjs$/.test(name)===production)).sort();
const results=[];
for(const name of checks){
 console.log(`Checking ${name}`);
 const result=spawnSync(process.execPath,[path.join('scripts',name)],{stdio:'inherit',timeout:180000});
 results.push({check:name,passed:result.status===0,error:result.error?.message});
}
mkdirSync('.sites-runtime',{recursive:true});
writeFileSync(`.sites-runtime/${production?'production':'regression'}-checks.json`,JSON.stringify(results,null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/${results.length} check suites passed.`);
if(results.some(r=>!r.passed))process.exitCode=1;
