// Run after build:pages and check:pages. Requires your normal GitHub Git login.
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
function git(args,cwd=process.cwd()){const r=spawnSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});if(r.status!==0)throw Error(r.stderr||r.stdout||'Git failed');return r.stdout.trim();}
const root=process.cwd();
const check=spawnSync(process.execPath,['scripts/check-pages.mjs'],{stdio:'inherit'});if(check.status!==0)throw Error('Pages validation failed');
const origin=git(['remote','get-url','origin']);if(origin!=='https://github.com/ghinz32-cloud/movefield.git'&&origin!=='git@github.com:ghinz32-cloud/movefield.git')throw Error('Unexpected repository');
git(['fetch','origin','gh-pages']);const expected=git(['rev-parse','origin/gh-pages']);
const temp=mkdtempSync(path.join(tmpdir(),'movefield-pages-'));
try{
 git(['clone','--no-checkout','--shared',root,temp]);git(['checkout','--detach',expected],temp);
 // Remove the complete prior generated tree. Do not carry historical files into the new site.
 git(['rm','-r','--ignore-unmatch','.'],temp);cpSync(path.join(root,'dist-pages'),temp,{recursive:true});
 git(['add','--all'],temp);git(['commit','-m','Publish verified Movefield Pages prototype'],temp);
 const commit=git(['rev-parse','HEAD'],temp);
 // A normal fast-forward push refuses concurrent branch changes; never force-push.
 git(['push',origin,commit+':refs/heads/gh-pages'],temp);
 const head=git(['ls-remote',origin,'refs/heads/gh-pages']).split(/\s/)[0];if(head!==commit)throw Error('Published head differs');
 console.log('Published '+commit+' to gh-pages. Wait for Pages deployment; verify https://ghinz32-cloud.github.io/movefield/');
}finally{rmSync(temp,{recursive:true,force:true});}
