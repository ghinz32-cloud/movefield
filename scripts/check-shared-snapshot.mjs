import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root=process.cwd(), snapshot=JSON.parse(readFileSync('mobile/docs/shared-snapshot.json','utf8'));
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
assert.ok(snapshot.files.length>0,'Shared snapshot must contain actual files');
assert.equal(new Set(snapshot.files.map(row=>row.target)).size,snapshot.files.length,'Duplicate snapshot target');
assert.ok(snapshot.files.some(row=>row.source==='lib/routine-library.json' && row.target==='src/shared/routine-library.json'),'Native routines must be included');
for(const row of snapshot.files){
 const source=resolve(root,row.source), target=resolve(root,'mobile',row.target);
 assert.ok(source.startsWith(root+'/') && target.startsWith(root+'/mobile/'),'Snapshot path must remain within its project');
 assert.equal(hash(source),row.sha256,`Canonical file changed: ${row.source}; run the shared sync`);
 assert.equal(hash(target),row.sha256,`Native copy differs: ${row.target}; run the shared sync`);
}
console.log(`PASS ${snapshot.files.length} canonical/native file hashes, including routine data and exercise guides`);
