// Recover the public/ layout flattened by the original repository upload.
// Move only exact manifest matches; preserve modified and missing files.
import { readFile, mkdir, rename, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(await readFile(resolve(root, 'HANDOFF_MANIFEST.json'), 'utf8'));
let restored = 0, present = 0, missing = 0;
for (const entry of manifest.files) {
  if (!entry.path.startsWith('public/')) continue;
  const target = resolve(root, entry.path);
  if (!target.startsWith(resolve(root, 'public') + sep)) throw new Error('Invalid public asset path.');
  try { await access(target); present++; continue; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const relative = entry.path.slice('public/'.length).replace(/^exercise-photos\//, '');
  const source = resolve(root, relative);
  if (!source.startsWith(root + sep)) throw new Error('Invalid source asset path.');
  let bytes;
  try { bytes = await readFile(source); } catch (error) { if (error.code === 'ENOENT') { missing++; continue; } throw error; }
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
    throw new Error('Asset differs from the handoff manifest: ' + relative);
  }
  await mkdir(dirname(target), { recursive: true });
  await rename(source, target);
  restored++;
}
console.log(JSON.stringify({ restored, present, missing, note: 'Missing assets were not fabricated or downloaded.' }));
