const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('mobile/docs/shared-snapshot.json','utf8'));
for(const file of manifest.files){
 const original=fs.readFileSync(file.source),native=fs.readFileSync(path.join('mobile',file.target));
 assert.ok(original.equals(native),`Native shared file drifted: ${file.source}. Run npm run sync:shared -- .. in mobile.`);
 assert.equal(crypto.createHash('sha256').update(native).digest('hex'),file.sha256,`Stale snapshot hash: ${file.source}`);
}
console.log(`PASS ${manifest.files.length} canonical web/native shared files and snapshot hashes.`);
