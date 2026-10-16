// Run from mobile: npm run sync:shared -- C:\path\to\training-studio
// Only reads the website. Writes a local snapshot; no Metro symlinks required on Windows.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2] && resolve(process.argv[2]);
if (!site) throw new Error('Provide the website folder: npm run sync:shared -- C:\\path\\to\\training-studio');
const files = ["training-runtime.js","training-runtime.d.ts","equipment-runtime.js","equipment-runtime.d.ts","program-catalog-runtime.js","program-catalog-runtime.d.ts","onboarding-runtime.js","onboarding-runtime.d.ts","plan-fit-runtime.js","plan-fit-runtime.d.ts","evidence-sources-runtime.js","evidence-sources-runtime.d.ts","saved-data-runtime.js","saved-data-runtime.d.ts","plan-import-runtime.js","plan-import-runtime.d.ts","reusable-plan-runtime.js","reusable-plan-runtime.d.ts","session-duration-runtime.js","session-duration-runtime.d.ts","session-guide-runtime.js","session-guide-runtime.d.ts","workout-log-runtime.js","workout-log-runtime.d.ts","progress-runtime.js","progress-runtime.d.ts","history-edit-runtime.js","history-edit-runtime.d.ts","source-programs-runtime.js","source-programs-runtime.d.ts","muscle-work-runtime.js","muscle-work-runtime.d.ts","program-science-runtime.js","program-science-runtime.d.ts","paired-sets-runtime.js","paired-sets-runtime.d.ts",'researched-programs.ts','goal-evidence.ts','source-programs.ts','muscle-work.ts','program-science.ts','paired-sets.ts','plan-fit.ts', 'equipment.ts', 'today-view.ts', 'record-state.ts', 'sql-records.ts', 'activity-progress.ts', 'session-duration.ts', 'evidence-sources.ts', 'account-sessions.ts', 'customize.ts', 'calendar.ts', 'reusable-plan.ts', 'coaching-facts.ts', 'workout-coaching.ts', 'workout-coaching-library.ts', 'coaching-selection.ts', 'cloud-sync.ts', 'plan-import.ts', 'set-metric-fields.ts', 'history-edit.ts', 'experienced-demo.ts', 'legacy-transfer.ts', 'preserved-state.ts', 'vault-format.ts', 'encrypted-storage.ts', 'durable-state.ts', 'workout-flow.ts', 'app-preferences.ts', 'grizzly-messages.ts', 'workout-reminders.ts', 'brand.ts', 'presentation.ts', 'tracking.ts', 'workout-log.ts', 'onboarding.ts', 'rest-timer.ts', 'training.ts', 'training-focus.ts', 'program-catalog.ts', 'substitutions.ts', 'session-guide.ts', 'workout-review.ts', 'saved-data.ts', 'progress.ts', 'exercise-library.json', 'recipes.json'].map(name => [`lib/${name}`, `src/shared/${name}`]);
files.push(['docs/transfer-compatibility-2026-10-13.md', 'docs/transfer-compatibility-2026-10-13.md'], ['docs/fitness-audit/README.md', 'docs/fitness-audit.md'], ['docs/evidence-ledger.json', 'docs/evidence-ledger.json'], ['docs/cloudflare-implementation.md', 'docs/cloudflare-implementation.md'], ['public/exercise-guides.json', 'assets/content/exercise-guides.json'], ['public/exercise-content.json', 'assets/content/exercise-content.json'], ['docs/exercise-library-LICENSE.txt', 'docs/exercise-library-LICENSE.txt'], ['docs/exercise-library-provenance.json', 'docs/exercise-library-provenance.json'], ['docs/product-requirements.md', 'docs/product-requirements.md'], ['docs/exercise-library-completion.json', 'docs/exercise-library-completion.json']);
const records = [];
files.push(['lib/routine-library.json','src/shared/routine-library.json']);
files.push(['lib/block-starting-loads.ts','src/shared/block-starting-loads.ts']);
for (const [from, to] of files) {
  const source = resolve(site, from), target = resolve(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  records.push({ source: from, target: to, sha256: createHash('sha256').update(await readFile(target)).digest('hex') });
}
await writeFile(resolve(root, 'docs/shared-snapshot.json'), JSON.stringify({ source: 'Training Studio website domain modules; paths relative to its root', files: records }, null, 2) + '\n');
console.log(`Copied ${files.length} shared files. Run npm run check and npm run export:mobile next.`);
