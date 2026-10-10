import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const assetPath=relative=>'/'+relative.split(path.sep).join('/');
export function generateOffline(clientDirectory,templateFile,policyFile=fileURLToPath(new URL('../lib/workout-coaching-worker-policy.json',import.meta.url))){
 const root=path.resolve(clientDirectory),assets=[];
 function append(relative){
  const file=path.join(root,relative),stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('Offline assets must be ordinary built files: '+relative);
  const bytes=fs.readFileSync(file);
  assets.push({path:assetPath(relative),bytes:bytes.length,sha256:sha(bytes)});
 }
 function walk(relative,accept){
  const directory=path.join(root,relative);
  if(!fs.existsSync(directory))return;
  if(fs.lstatSync(directory).isSymbolicLink())throw Error('Offline directories cannot be symbolic links: '+relative);
  for(const name of fs.readdirSync(directory).sort()){
   const item=path.join(relative,name),stat=fs.lstatSync(path.join(root,item));
   if(stat.isSymbolicLink())throw Error('Offline assets cannot be symbolic links: '+item);
   if(stat.isDirectory())walk(item,accept);else if(stat.isFile()&&accept(item))append(item);
  }
 }
 // These paths contain public code/content only. Never walk the entire public tree.
 walk('_next/static',p=>/\.(?:js|css)$/.test(p));
 walk('fonts',p=>/\.(?:woff2?|ttf|otf)$/.test(p));
 walk('brand',p=>/\.(?:png|jpe?g|webp|svg)$/.test(p));
 walk('runtime',p=>/\.js$/.test(p));
 for(const name of ['exercise-guides.json','exercise-content.json','fitness-research.json','favicon.svg'])append(name);
 assets.sort((a,b)=>a.path.localeCompare(b.path));
 if(!assets.some(a=>a.path.startsWith('/_next/static/')&&a.path.endsWith('.js'))||!assets.some(a=>a.path.endsWith('.css')))throw Error('Complete built client JavaScript and CSS are required.');
 if(assets.length>2000||assets.some(a=>a.bytes>64*1024*1024)||assets.reduce((sum,a)=>sum+a.bytes,0)>128*1024*1024)throw Error('Offline asset budget exceeded; review the build before increasing the budget.');
 const template=fs.readFileSync(templateFile,'utf8'),marker=/^const OFFLINE = .*; \/\/ __OFFLINE_BUILD__$/m;
 if(!marker.test(template))throw Error('Offline worker build marker is absent.');
 const coachingWorker=JSON.parse(fs.readFileSync(policyFile,'utf8'));
 if(coachingWorker.path!=='runtime/workout-coaching-worker.js'||typeof coachingWorker.csp!=='string'||!coachingWorker.csp||/[\r\n]/.test(coachingWorker.csp)||coachingWorker.csp.length>1024||
  !assets.some(asset=>asset.path==='/'+coachingWorker.path)||!assets.some(asset=>asset.path==='/runtime/qwen-worker.js'))throw Error('The complete pinned model worker build and security policy are required.');
 const build={schema:1,version:sha(JSON.stringify({assets,coachingWorker})+'\n'+template),coachingWorker,assets};
 const output=template.replace(marker,'const OFFLINE = '+JSON.stringify(build)+'; // __OFFLINE_BUILD__');
 fs.writeFileSync(path.join(root,'sw.js'),output);
 // A framework may have compressed the unbuilt public template. Never leave
 // stale compressed siblings that could be served instead of this worker.
 for(const suffix of ['.br','.gz'])fs.rmSync(path.join(root,'sw.js'+suffix),{force:true});
 fs.writeFileSync(path.join(root,'offline-build.json'),JSON.stringify({...build,totalBytes:assets.reduce((sum,a)=>sum+a.bytes,0)},null,2)+'\n');
 return build;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const root=fileURLToPath(new URL('..',import.meta.url));
 const result=generateOffline(process.argv[2]||path.join(root,'dist/client'),process.argv[3]||path.join(root,'public/sw.js'));
 console.log('Prepared '+result.assets.length+' offline assets for '+result.version.slice(0,12)+'.');
}
