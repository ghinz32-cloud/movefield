import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';
/** Version every precached resource so guide-only corrections reach returning users. */
export function offlineShell(base='/',staticReview=false,cachePrefix=staticReview?'movefield-review-shell-':'movefield-shell-',brandAssets:string[]=[]):Plugin {
 return {name:'movefield-offline-shell',apply:'build',applyToEnvironment:env=>env.name==='client',generateBundle(_,bundle){
  const entries=Object.entries(bundle).filter(([name])=>/\.(?:js|css)$/.test(name)),hash=createHash('sha256');
  for(const [name,file] of entries.sort(([a],[b])=>a.localeCompare(b)))hash.update(name).update(file.type==='chunk'?file.code:typeof file.source==='string'?file.source:Buffer.from(file.source));
  const workerTemplate=readFileSync(new URL('../public/movefield-sw.js',import.meta.url),'utf8');
  hash.update(workerTemplate);
  // Keep this list aligned with the worker's STATIC public resources. Guides and
  // photos metadata are cache-first, so their bytes must also identify a release.
  const publicAssets=[...new Set(['app-loading.js','exercise-guides.json','exercise-content.json','fonts/inter-variable.ttf','fonts/barlow-condensed-semibold.ttf',...brandAssets])];
  for(const name of publicAssets.sort())hash.update(name).update(readFileSync(new URL('../public/'+name,import.meta.url)));
  const source=workerTemplate
   .replace("'DEVELOPMENT_DISABLED'",JSON.stringify(hash.digest('hex').slice(0,20)))
   .replace("const BASE = '/';",'const BASE = '+JSON.stringify(base)+';')
   .replace('const STATIC_REVIEW = false;','const STATIC_REVIEW = '+JSON.stringify(staticReview)+';')
   .replace("const CACHE_PREFIX = 'movefield-shell-';",'const CACHE_PREFIX = '+JSON.stringify(cachePrefix)+';')
   .replace('/* BRAND_ASSETS */ []',JSON.stringify(brandAssets))
   .replace('/* BUILD_ASSETS */ []',JSON.stringify(entries.map(([name])=>base+name)));
  this.emitFile({type:'asset',fileName:'movefield-sw.js',source});
 }};
}
