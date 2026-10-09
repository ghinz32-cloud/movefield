const {spawnSync}=require('node:child_process');
for(const [command,args] of [[process.execPath,['scripts/prepare-qwen-training.cjs','--check']],['python3',['scripts/test-qwen-training.py']]]){
 const result=spawnSync(command,args,{stdio:'inherit'});
 if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
