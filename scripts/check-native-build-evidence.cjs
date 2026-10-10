// Reader fixtures only. Native CI supplies the actual platform build evidence.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const result=spawnSync('python3',[path.join(__dirname,'test-native-build-evidence.py')],{
 cwd:root,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},encoding:'utf8',timeout:60000,
});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
if(result.error)throw result.error;
if(result.status!==0)throw Error('Native build evidence fixtures failed');
console.log(JSON.stringify({passed:true,scope:'Portable reader fixtures; actual native builds and evidence remain CI qualifications'}));
