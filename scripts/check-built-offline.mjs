import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),client=path.join(root,'dist/client'),manifest=JSON.parse(fs.readFileSync(path.join(client,'offline-build.json'),'utf8')),worker=fs.readFileSync(path.join(client,'sw.js'),'utf8'),match=worker.match(/^const OFFLINE = (.*); \/\/ __OFFLINE_BUILD__$/m);
assert.ok(match,'generated worker embeds its immutable build');const embedded=JSON.parse(match[1]);assert.equal(embedded.version,manifest.version);assert.notEqual(manifest.version,'unbuilt');assert.deepEqual(embedded.assets,manifest.assets);
assert.deepEqual(embedded.coachingWorker,manifest.coachingWorker);assert.deepEqual(manifest.coachingWorker,JSON.parse(fs.readFileSync(path.join(root,'lib/workout-coaching-worker-policy.json'),'utf8')),'current worker policy is embedded in both controller and manifest');
const template=fs.readFileSync(path.join(root,'public/sw.js'),'utf8');assert.equal(manifest.version,createHash('sha256').update(JSON.stringify({assets:manifest.assets,coachingWorker:manifest.coachingWorker})+'\n'+template).digest('hex'),'build identity binds the asset set, worker policy and service worker template');
const included=new Set(manifest.assets.map(asset=>asset.path));assert.equal(included.size,manifest.assets.length,'no duplicate paths');
let total=0;for(const asset of manifest.assets){assert.ok(/^\/(?:_next\/static\/.*\.(?:js|css)|fonts\/.*\.(?:ttf|otf|woff2?)|brand\/.*\.(?:png|jpe?g|webp|svg)|runtime\/.*\.js|exercise-guides\.json|exercise-content\.json|fitness-research\.json|favicon\.svg)$/.test(asset.path),'public allowlisted path '+asset.path);const bytes=fs.readFileSync(path.join(client,asset.path.slice(1)));assert.equal(bytes.length,asset.bytes,asset.path+' length');assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path+' fingerprint');total+=bytes.length;}
const walk=directory=>fs.existsSync(directory)?fs.readdirSync(directory).flatMap(name=>{const full=path.join(directory,name);return fs.statSync(full).isDirectory()?walk(full):[full]}):[];
for(const file of walk(path.join(client,'_next/static')).filter(file=>/\.(?:js|css)$/.test(file)))assert.ok(included.has('/'+path.relative(client,file).split(path.sep).join('/')),'all built/lazy assets included: '+file);
for(const required of ['/exercise-guides.json','/exercise-content.json','/fitness-research.json','/favicon.svg','/runtime/qwen-worker.js','/'+manifest.coachingWorker.path])assert.ok(included.has(required),required+' required');
assert.equal(total,manifest.totalBytes);assert.ok(!fs.existsSync(path.join(client,'sw.js.br'))&&!fs.existsSync(path.join(client,'sw.js.gz')),'no stale compressed template');
console.log(JSON.stringify({status:'pass',assets:manifest.assets.length,totalBytes:total,build:manifest.version,allBuiltClientChunksCovered:true,workerManifestMatches:true,assetHashesMatch:true,privateDataAndModelWeightsAbsent:true},null,2));
