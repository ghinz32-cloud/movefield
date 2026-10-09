import {build} from 'vite';
import {mkdir,copyFile,readdir,readFile,writeFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'dist-pages');
// Build the same browser-only workers before collecting the static allowlist.
await build({configFile:path.join(root,'build/qwen-worker.config.mjs')});
await build({configFile:path.join(root,'vite.pages.config.ts')});
// Explicit public allowlist: never recursively copy public, server output or runtime state.
const files=['favicon.svg','privacy.html','exercise-content.json','exercise-guides.json','fitness-research.json','downloads/movefield-mobile-r14.zip'];
for(const entry of await readdir(path.join(root,'public/runtime')))if(/^[\w.-]+\.js$/.test(entry))files.push('runtime/'+entry);
for(const entry of await readdir(path.join(root,'public/fonts')))if(/\.(ttf|woff2|txt)$/i.test(entry))files.push('fonts/'+entry);
for(const file of files){const source=path.join(root,'public',file);if(!(await lstat(source)).isFile())throw Error('Not a regular public asset: '+file);await mkdir(path.dirname(path.join(out,file)),{recursive:true});await copyFile(source,path.join(out,file));}
await writeFile(path.join(out,'.nojekyll'),'');
const modelPolicy=JSON.parse(await readFile(path.join(root,'lib/qwen-network-policy.json'),'utf8'));
const sources=[...new Set([modelPolicy,...modelPolicy.models].flatMap(model=>model.assets.flatMap(asset=>[asset.url,asset.finalUrl])))];
const connect="connect-src 'self' "+sources.join(' ');
if(new TextEncoder().encode(connect).byteLength>100*1024)throw Error('Exact model CSP exceeds the documented response-header budget.');
const htmlPath=path.join(out,'index.html'),html=await readFile(htmlPath,'utf8');
if(!html.includes("connect-src 'self';"))throw Error('Missing static document connect policy.');
await writeFile(htmlPath,html.replace("connect-src 'self';",connect+';'));
async function walk(dir){const result=[];for(const name of await readdir(dir)){const file=path.join(dir,name),stat=await lstat(file);if(stat.isSymbolicLink())throw Error('Symlinks forbidden');if(stat.isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
const assets={};for(const file of await walk(out)){const name=path.relative(out,file).replaceAll(path.sep,'/');assets['/movefield/'+name]=createHash('sha256').update(await readFile(file)).digest('hex');}
const templateBytes=await readFile(path.join(root,'static-web/sw-template.js'));
const workerTemplateSha256=createHash('sha256').update(templateBytes).digest('hex');
const coachingWorker=JSON.parse(await readFile(path.join(root,'lib/workout-coaching-worker-policy.json'),'utf8'));
// Worker-only fixes require an isolated candidate cache and rollback namespace.
const version=createHash('sha256').update(JSON.stringify({workerTemplateSha256,coachingWorker,assets})).digest('hex');
const manifest={schema:1,base:'/movefield/',version,workerTemplateSha256,coachingWorker,assets};
await writeFile(path.join(out,'pages-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(out,'sw.js'),templateBytes.toString('utf8').replace('__MANIFEST__',JSON.stringify(manifest)));
console.log(`Pages output: ${Object.keys(assets).length} allowlisted files; version ${version}`);
