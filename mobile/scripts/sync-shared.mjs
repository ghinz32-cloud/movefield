// Run from mobile: npm run sync:shared -- C:\path\to\training-studio
// Only reads the website. Writes a local snapshot; no Metro symlinks required on Windows.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2] && resolve(process.argv[2]);
if (!site) throw new Error('Provide the website folder: npm run sync:shared -- C:\\path\\to\\training-studio');
const files = ['local-backup.ts', 'set-metrics.ts', 'app-preferences.ts', 'workout-reminders.ts', 'brand.ts', 'presentation.ts', 'tracking.ts', 'workout-log.ts', 'onboarding.ts', 'rest-timer.ts', 'training.ts', 'training-tools.ts', 'training-focus.ts', 'program-catalog.ts', 'substitutions.ts', 'session-guide.ts', 'workout-review.ts', 'safety-copy.ts', 'exercise-video.ts', 'program-evidence.ts', 'saved-data.ts', 'transfer-bundle.ts', 'progress.ts', 'exercise-library.json', 'recipes.json'].map(name => [`lib/${name}`, `src/shared/${name}`]);
files.push(['public/exercise-guides.json', 'assets/content/exercise-guides.json'], ['public/exercise-content.json', 'assets/content/exercise-content.json'], ['docs/exercise-library-LICENSE.txt', 'docs/exercise-library-LICENSE.txt'], ['docs/exercise-library-provenance.json', 'docs/exercise-library-provenance.json'], ['docs/product-requirements.md', 'docs/product-requirements.md'], ['docs/exercise-library-completion.json', 'docs/exercise-library-completion.json']);
files.push(['lib/qwen-assets.json', 'src/shared/qwen-assets.json'], ['lib/qwen-catalog.ts', 'src/shared/qwen-catalog.ts']);
files.push(['lib/fitness-reference.json', 'src/shared/fitness-reference.json'], ['lib/fitness-grounding.ts', 'src/shared/fitness-grounding.ts'], ['lib/qwen-evaluation-lock.json', 'src/shared/qwen-evaluation-lock.json']);
const records = [];
for (const [from, to] of files) {
  const source = resolve(site, from), target = resolve(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  records.push({ source: from, target: to, sha256: createHash('sha256').update(await readFile(target)).digest('hex') });
}
await writeFile(resolve(root, 'docs/shared-snapshot.json'), JSON.stringify({ source: 'Training Studio website domain modules; paths relative to its root', files: records }, null, 2) + '\n');
console.log(`Copied ${files.length} shared files. Run npm run check and npm run export:mobile next.`);
