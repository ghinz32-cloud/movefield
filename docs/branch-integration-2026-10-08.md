# Combined GitHub audit and feature line — 8 October 2026

This is the current continuation checkpoint. Historical revision 13–15 and quality-audit reports describe their own snapshots; the combined code and this report supersede their current-state claims.

## Branch authority

Repository: `ghinz32-cloud/movefield`. Draft PR #1 targets `main` from `audit/2026-10-08-quality`.

| Branch | Verified source head | Role |
| --- | --- | --- |
| `main` | `80e6ea26437f0aeaa1d8f816ace464da81fe0a81` | Existing default branch; not changed by this integration |
| `audit/2026-10-08-quality` | `cc36ff73715eec1d0e278668d2f81f11c5ba19f8` before integration | Quality fixes and the combined PR's first parent |
| `review-fixes` | `667a3e381035b16cb1aa611c85cdf9d143b7b835` | Newer feature line, preserved; combined commit's second parent |
| `restructure` | `4318d78` | Historical restructured export baseline |
| `gh-pages` | `a900521` | Older generated static test build, not the current source |

The audit and feature lines have unrelated upload roots. They were reconciled in the isolated `audit/2026-10-08-integration` worktree instead of checking out one over the other. The combined result keeps the audit history and explicitly records the feature head as a second parent. Neither source line is force-pushed, deleted or reset. PR #1 remains a draft and `main` remains unchanged. Fetch current GitHub refs before further work; this table records the inputs, not a permanent lock on another collaborator's branch.

Available project context was searched for bro's branch coordination. No direct messaging connection to bro is exposed. GitHub refs and PR metadata were verified directly; no personal confirmation from bro is claimed.

## Reconciliation and additional repairs

- Preserve encrypted web/native records, protected transfers, eleven palettes, seven font options, text/density settings, typed goal matching, starting-plan fit notes, training calculators, weekly summaries, expanded programs, exercise notes, per-set RIR and cautious suggested-load prefill from `review-fixes`.
- Keep audit packaging repairs, executable script modes, pinned CI, deferred guides/charts, bundle budgets, source-photo withholding, idle rest-timer fixes, numeric measurement parity and storage/backup validation.
- Apply the shared restore rules to password-protected and plain files alike. Restore cannot replace an active workout or a profile edited after the preview. Imported timer/notification state is cleared and pending proposals need fresh review. Compare ciphertext inside the queued browser operation, refresh keys for open tabs and serialize restore against writes.
- Preserve the single web/native measurement definition, negative-value keyboards where appropriate, large-text layout handling and system reduced-motion behavior. Copied native modules are verified against canonical `lib/` files and snapshot hashes.
- Settings now links to the current generated `movefield-mobile-r14.zip`; production checks read the actual UI link so stale download wiring fails verification.
- Narrow offline caching to the generic root shell, build bundles, known guide files and font/brand assets. Do not intercept arbitrary pages, JSON files, query-bearing or authorized requests. Do not delete another feature's caches. Cache writes extend the worker event lifetime, cache failures leave online responses usable, redirects/private asset responses stay out, and lookups use only this worker's cache.
- Preserve historical validation reports instead of replacing their earlier evidence/publication records with current test output. The current evidence is in `branch-integration-validation-2026-10-08.json`.

## Current data locations

| Data | Location and protection |
| --- | --- |
| Web training/history | `localStorage` slot `training-studio-v2`, AES-256-GCM sealed records |
| Web setup and security preview | `training-studio-setup-v1`, `training-studio-sample-setup`, `training-studio-security-preview-v1`, `training-studio-sample-security`, sealed with the browser key |
| Web data key | IndexedDB database `movefield-vault`, store `keys`, record `data-key-v1`; non-extractable Web Crypto key |
| Web appearance/reminder preferences | `training-studio:preferences:v1`, ordinary local preferences; not workout history |
| Phone training/history | AsyncStorage `training-studio:mobile-local-demo:v1`, XChaCha20-Poly1305 sealed records |
| Phone setup draft | AsyncStorage `training-studio:mobile-setup:v1`, sealed records |
| Phone data key | Expo SecureStore `movefield.dataKey.v1`, device-only keychain accessibility setting |
| Manual transfer file | Argon2id-derived key and XChaCha20-Poly1305 encryption, same format on web/native; password is not retained |
| Plain backup/history/plan exports | User-selected JSON downloads or shares, unencrypted; interface labels distinguish protected transfers from plain exports |
| Offline shell | Cache Storage `movefield-shell-v2`, app assets only; no workout records |

Browser encryption does not protect data from compromised code running in the same origin. A transferred ciphertext record without its device key remains unreadable. An approved transfer restore is the recovery route. There is no real account database, server workout storage or automatic web/phone sync. Backup files are manual snapshots.

## Verification

- Web/native TypeScript pass; product ESLint passes with zero warnings/errors.
- All **23 regression suites** pass, including real encryption primitives, lost keys, tampering, write ordering, stale restore guards and **31 offline lifecycle/isolation checks**.
- Native engine: **78 plan choices × seven start weekdays**, 989 exercises and guides, substitution/archive retention, measurements and transfers pass.
- Production build and both production suites pass. CSP script nonces match and rotate on network requests; write/internal/test routes remain closed; uncleared photos remain absent; the current starter is served.
- Initial static JavaScript: **385,953 gzip bytes**, within the **400,000-byte** budget. The page chunk is 81,295 gzip bytes. Large individual bundle warnings remain; physical-device speed/memory is unmeasured.
- Android/iOS Metro/Hermes exports pass. These are JavaScript bundles, not signed app builds or real-phone acceptance tests.
- Fresh dependency audit returns only the documented high-severity advisory roots `GHSA-vfj7-8cjw-p6xm` and `GHSA-86w9-cpqp-85rv`. CI exceptions expire **8 November 2026**; the advisories remain release blockers.
- Fresh visual checks were blocked because this turn's cloud browser could not connect to the workspace's local server. Earlier browser evidence remains historical. File-picker/password/confirm restore, screen readers and locked/background notifications need real browser/device acceptance.

## Remaining work

The full contract in `product-requirements.md` remains in force. Account ownership, cloud sync, reusable block editing, event/season/position programs, health integrations, private photos, sharing and local model inference remain incomplete. Qwen3 0.6B is the currently offered planned model; 1.7B/4B remain later qualified-device options, not installed models.

Storage checks use in-memory stand-ins for IndexedDB/SecureStore persistence. Power-loss/crash behavior between a restore's key replacement and ciphertext write is not covered and needs a journal or atomic recovery design before release. Android history capacity with hex ciphertext remains an open limitation. Offline cold-start completeness and updates require fresh real-browser testing. The root shell is currently generic; its explicit offline cache exception must be revisited before server-rendered accounts are introduced.

No live deployment, access change or merge into `main` was performed.
