// Run from mobile: npm run sync:shared -- C:\path\to\training-studio
// Only reads the website. Writes a local snapshot; no Metro symlinks required on Windows.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2] && resolve(process.argv[2]);
if (!site) throw new Error('Provide the website folder: npm run sync:shared -- C:\\path\\to\\training-studio');
const files = ['plan-fit.ts', 'equipment.ts', 'today-view.ts', 'record-state.ts', 'sql-records.ts', 'activity-progress.ts', 'session-duration.ts', 'evidence-sources.ts', 'account-sessions.ts', 'customize.ts', 'calendar.ts', 'reusable-plan.ts', 'coaching-facts.ts', 'cloud-sync.ts', 'plan-import.ts', 'set-metric-fields.ts', 'history-edit.ts', 'experienced-demo.ts', 'vault-format.ts', 'encrypted-storage.ts', 'durable-state.ts', 'workout-flow.ts', 'app-preferences.ts', 'workout-reminders.ts', 'brand.ts', 'presentation.ts', 'tracking.ts', 'workout-log.ts', 'onboarding.ts', 'rest-timer.ts', 'training.ts', 'training-focus.ts', 'program-catalog.ts', 'substitutions.ts', 'session-guide.ts', 'workout-review.ts', 'saved-data.ts', 'progress.ts', 'exercise-library.json', 'recipes.json'].map(name => [`lib/${name}`, `src/shared/${name}`]);
files.push(['docs/fitness-audit/README.md', 'docs/fitness-audit.md'], ['docs/evidence-ledger.json', 'docs/evidence-ledger.json'], ['docs/cloudflare-implementation.md', 'docs/cloudflare-implementation.md'], ['public/exercise-guides.json', 'assets/content/exercise-guides.json'], ['public/exercise-content.json', 'assets/content/exercise-content.json'], ['docs/exercise-library-LICENSE.txt', 'docs/exercise-library-LICENSE.txt'], ['docs/exercise-library-provenance.json', 'docs/exercise-library-provenance.json'], ['docs/product-requirements.md', 'docs/product-requirements.md'], ['docs/exercise-library-completion.json', 'docs/exercise-library-completion.json']);
const records = [];
for (const [from, to] of files) {
  const source = resolve(site, from), target = resolve(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  records.push({ source: from, target: to, sha256: createHash('sha256').update(await readFile(target)).digest('hex') });
}
await writeFile(resolve(root, 'docs/shared-snapshot.json'), JSON.stringify({ source: 'Training Studio website domain modules; paths relative to its root', files: records }, null, 2) + '\n');
console.log(`Copied ${files.length} shared files. Run npm run check and npm run export:mobile next.`);
