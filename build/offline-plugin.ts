import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';
/** Version the offline cache by final client bytes, not a clock or source guess. */
export function offlineShell():Plugin{return {name:'movefield-offline-shell',apply:'build',applyToEnvironment:env=>env.name==='client',generateBundle(_,bundle){const entries=Object.entries(bundle).filter(([name])=>/\.(?:js|css)$/.test(name));const hash=createHash('sha256');for(const [name,file] of entries.sort(([a],[b])=>a.localeCompare(b)))hash.update(name).update(file.type==='chunk'?file.code:typeof file.source==='string'?file.source:Buffer.from(file.source));const source=readFileSync(new URL('../public/movefield-sw.js',import.meta.url),'utf8').replace("'DEVELOPMENT_DISABLED'",JSON.stringify(hash.digest('hex').slice(0,20))).replace('/* BUILD_ASSETS */ []',JSON.stringify(entries.map(([name])=>'/'+name)));this.emitFile({type:'asset',fileName:'movefield-sw.js',source})}}}
