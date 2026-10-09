# Claude audit repairs and deployment checkpoint — 9 October 2026

The repaired application is published on the existing GitHub audit branch. Both web prototypes are live, and the Android test APK and unsigned iOS simulator builds passed and are retained for testing. All 66 local regression suites and all 3 local production suites pass. Web/native TypeScript and product ESLint complete with zero errors or warnings. The core and native qualification source is `83b2f94cdc7cd697b9cb45f311794c4371ca4826`, with tree `1c47d2b0343e0d1768deda6850e50be38cac6ad7`. A final web-only copy correction and deployment receipts follow that qualification; native and backend inputs are unchanged. [GitHub quality run 37990501064](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501064) also completed successfully.

Both hosted and public web builds compile. The retained local integration report measures an initial browser graph of 396,925 gzip bytes; the hosted production checks measure 396,922 gzip bytes. Both stay below the existing 400,000-byte budget. Optional account encryption, setup, editor and review panels load on demand. The complete reference-catalog chunk remains below 1 MB; its intentional uncompressed warning budget is 1 MB, with actual gzip and initial-graph limits independently enforced. Hosted production checks pass 3/3 and cover 75 offline assets.

## Modified targets

| Audit target | Result and principal files |
|---|---|
| C1 saved-history capacity | `lib/browser-history.ts`, `lib/browser-vault.ts`, `lib/browser-record-store.ts`, `lib/record-capacity.ts`, `lib/storage-capacity.ts`, native history/storage modules: individually encrypted histories, bounded 24 MB compatible state and 96 MB transfer parsing, exact CAS, migration rollback, orphan/key-loss protection and complete encrypted recovery exports. A 5,000-workout, 8.66 MB save/export/import/reopen scenario is verified. |
| C2 forward fields, C14 record identity | `lib/saved-data.ts`, `lib/record-identity.ts`, platform initializers and shared snapshots refuse lossy future schemas and unknown fields, preserve existing identifiers, and generate secure new UUIDs plus UTC/time-zone metadata. Schema 2 remains compatible; historical records are not assigned fabricated time zones. |
| C3 native retry, C7/C8 current workout | `app/page.tsx`, `mobile/App.tsx`, `lib/workout-log.ts`, native engine use current-state finalization, current-workout/exercise/set identities, duplicate-action guards, and three bounded native save attempts with 1 s and 2 s delays. Capacity errors retain entries and offer export. |
| C4 rest notifications | `components/rest-timer.tsx` delivers permitted late notifications and suppresses obsolete audio, retaining cancellation and permission checks. |
| C5/C6 custom workouts | `lib/customize.ts`, `lib/tracking.ts`, creator/editor components and native session editor preserve target ranges and structured superset positions. Notes remain prose; stale session/editor acceptance and repeated taps cannot rewrite a replacement plan. |
| C9 offline account sync | `lib/sync-outbox.ts`, transactional IndexedDB/SQLite adapters, `lib/browser-cloud-sync.ts`, `lib/cloud-envelope.ts`, `components/account-sync.tsx`, `/api/account` and `/api/sync`: local ciphertext and opaque outbox changes commit together; UUID replay, leased receipts, CAS account revision and explicit reviewed-copy replacement retain conflicts. Network work follows durable local commits. Preparation and queue-capacity failures pause sync and still permit local saving. |
| C10 async feedback | Backend routes, `server/feedback.ts`, strict contracts and `drizzle/0000_account_sync.sql` persist job state and `daily_ai_feedback` before the UI displays a result. Adult explicit-consent metrics only; 8 s provider timeout, bounded attempts, tenant isolation, required expected-account precondition, per-workout/completion idempotency, owner revalidation and stale/unmounted UI cancellation. No client calls a remote LLM. |
| C11/C12/C13 web/native paths | Existing bounded photo service-worker policy and 44 shared-file integrity checks are preserved. Native guide/media module evaluation is deferred until requested. Optional browser features are split without loosening the 400 KB gzip entry-graph budget. Existing desktop control sizes remain the reviewed accessibility policy. |
| K1/K2/K4 native provisioning | Existing Expo project ID/slug and `com.ghinz32.movefield` identifiers are retained to avoid inventing a new EAS account/project binding. Native CI retains inspected arm64 test APK and unsigned iOS simulator app after both platform builds passed. Physical-iPhone, EAS and TestFlight signing and native account authentication require actual owner credentials. |
| K3/K5/K6/K7 cleanup/security | Existing bundle and backup repairs, CSP and internal route protections are retained. Two unused request/database wrappers were removed; live Worker connector infrastructure stays. Mock authentication is disabled by default and limited to explicit local development opt-in. No active TODO/social-feed scaffolding or browser/Node globals in shared native modules were found. |

## Deployment status and live boundaries

| Target | Actual status | Source or evidence |
|---|---|---|
| GitHub source | Core qualification published and tree-verified; final web copy and receipts follow on the same audit branch | Source `83b2f94cdc7cd697b9cb45f311794c4371ca4826`; tree `1c47d2b0343e0d1768deda6850e50be38cac6ad7`; successful [quality run](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501064). |
| Authenticated prototype Site | Deployment completed successfully; audience remains owner-only | [Open the prototype](https://training-studio-prototype.bigcheese3232.chatgpt.site). Site source `b61ded3cddd7c976228042040c7ead58b6d3c8d2` has tree `0c89ceba9fe858d52eb60ac04d73ebd9ece546b9`: the qualified core plus two corrected web availability labels. Deployment `appgdep_6ac95be5080c8191a169dfe88cb7b30e`; version `appgprj_6ac5a7c96d9481919df913f42a4a4353~appgver_f31e532a47448191bde4cddf01a42bf8`. |
| Backend schema and ingress | Database binding and trusted ingress are active; trust flag is revision 1 | Actual database overview confirms `daily_ai_feedback`, `sync_accounts`, `sync_receipts` and `sync_records`. This confirms deployed tables, not a completed signed-in sync or model-feedback journey. |
| Public GitHub Pages | Published and verified live; all 52 published files match expected SHA-256 and byte counts | [Open GitHub Pages](https://ghinz32-cloud.github.io/movefield/). Published `gh-pages` commit `f3286afe4a68a4ea2f0c6d8b9531d6fdbd284414`, tree `43a14399f5acf79ed96dcaa207b9e25a4952ad3e`; live version `63aa0077e23f77d6194119f71aef28fa141d8cb8281b576a000143ce8013fdb4` matches the rebuilt output. Receipt: [pages-publication.json](qa/claude-integration-2026-10-09/pages-publication.json). |

The public Pages rebuild passed 541 assertions across 50 manifest assets. Publication prepared 25 changed blobs and pruned 5 obsolete chunks. Live HTTP verification covers all 52 published files, including the manifest assets, service worker and manifest; every file returned HTTP 200 with the expected size and SHA-256. This verifies the deployed artifacts, without claiming browser or OS interruption acceptance.

A live smoke check returned HTTP 200 for the deployed Site root with `Cache-Control: private, no-store`. The deployed `/privacy.html` returned HTTP 200 and SHA-256 `3751ef5dbb3f22f949974808317f98b44d5f8e080c32169f304afa54897ab6e7`. A request to `/api/account` with owner-private dispatch access but without signed-in user ingress returned HTTP 401 with `sign_in_required`, the expected fail-closed result. Dispatch access does not authenticate an application account. Successful signed-in device sync is not claimed from this probe or the database overview.

Model provider credentials are absent, so feedback reports unavailable safely. Native account authentication is explicitly unavailable. The implementation and deployed schema establish the processing path, but live model completion, native cloud sync and physical-device acceptance require separate verification.

The public Pages prototype provides local training features; authenticated account routes belong to the private Site. The generated mobile source starter contains 124 entries matching the selected source. It is developer source, separate from the retained native binaries.

The final copy correction updates `components/account-security.tsx` and `components/training-onboarding.tsx` so they no longer describe all account features as unavailable. Local source `d6710d945889d7e10e8db772ae49ee3d0b56cfae` passed web TypeScript, scoped ESLint, compiled setup hydration checks, 541 Pages assertions and 3/3 hosted production suites. Its native and backend inputs match the qualified source. The final Site deployment receipt is [hosted-copy-publication.json](qa/claude-integration-2026-10-09/hosted-copy-publication.json); the initial deployment/live fail-closed probe remains separately recorded in [hosted-publication.json](qa/claude-integration-2026-10-09/hosted-publication.json).

## Native build tracking

[Native run 37990501073](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073) builds Android and iOS in parallel. The completed workflow retained both test packages only after manifest, privacy, transport and SQLite build-route checks. Source and binary receipts distinguish an Android test-signing certificate and an unsigned iOS simulator package from store distribution.

| Platform | Current result | Retained package or next step |
|---|---|---|
| iOS | Release simulator build completed successfully | [Artifact 11644643820](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/artifacts/11644643820), unsigned simulator package, GitHub-reported 18,568,401-byte archive, SHA-256 `154c24e2e1acfb8a6cbe8aeb1365633ed036086c0a180825920cd7e02de10f55`. This is not a TestFlight or installable physical-iPhone distribution build. |
| Android | Release test APK compilation, lint, packaged inspection and SQLite build-route checks completed successfully | [Artifact 11644933560](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/artifacts/11644933560), arm64 test-only APK archive, GitHub-reported 18,808,015 bytes, SHA-256 `c74a5395ee43031e641bdc40248ca9a7b6e536aad7740374022ac5b2d5e528e5`. Test signing is not store distribution signing. |

Current artifact download references were obtained, but the advertised transfer helper returned HTTP 403. Package contents and digests were not independently replayed here; sizes and digests are GitHub metadata and successful inspection/upload steps are hosted CI evidence.

## System health and remaining release gates

The web and native source configurations, shared snapshots and local verification matrices are synchronized. Native Hermes exports, actual Android/iOS compilation, packaged inspections and SQLite build-route checks pass. Both web deployments and all 52 public live-file checks pass. No production signing credentials, provider secret, native account-authentication binding or physical-device acceptance are available.

Existing bounded source follow-ups also remain: `native-record-store.ts` and `qwen-file-cache.ts` reset failed initialization promises without closing acquired database wrappers; Qwen can create new empty cache/attempt directories before a later mode refusal. Prior probes preserved existing records and did not establish corruption or a measured native leak. These lifecycle/refusal findings require separate qualification.

The strict release dependency gate remains blocked. `braces` advisory `GHSA-vfj7-8cjw-p6xm` affects web and native dependency paths; `node-forge` advisory `GHSA-86w9-cpqp-85rv` affects native dependency paths. No patched versions are available in the recorded dependency review. Dated CI exceptions allow the recorded checks to run but do not satisfy or waive the release gate. The retained [read-only dependency review](qa/claude-integration-2026-10-09/dependency-blockers.md) records the exact affected dependency paths, current registry versions, observed exposure and supported remedy boundary. No dependencies, locks or policies were changed during that review. Do not describe these staging results as store approval or a clean production release.

## Validation

`docs/qa/claude-integration-2026-10-09/validation.json` records all suite results, measured bundle sizes and source-run log digests. Current component controls pass 16/16; client/UI lifecycle passes 24/24 with 91 assertions; actual backend tests cover 22 groups; browser history covers 53 checks; compatible capacity covers 30 checks; native privacy passes 25/25 with 80 assertions; native workflows cover 12 scenarios. Native types, 78-plan/989-guide engine checks and iOS/Android Hermes exports pass. Public Pages validation verifies allowlisted bytes and hashes; offline VM checks do not prove OS/browser interruption behavior. Hosted production checks separately pass 3/3 with 75 offline assets and a 396,922-byte initial gzip graph.

## Complete changed-file inventory

The inventory includes application files, synchronized snapshots, tests and retained historical audit/evidence documents relative to the starting `8abfca4` source. The two unused wrappers are deletions. Generated scientific test reports were restored instead of replacing prior evidence.


The complete inventory contains 196 changed paths, including deletions and final deployment/CI receipts.

- `.github/workflows/native-builds.yml`
- `.openai/hosting.json`
- `HANDOFF.md`
- `TASKS.md`
- `app/api/account/route.ts`
- `app/api/daily-feedback/route.ts`
- `app/api/sync/route.ts`
- `app/globals.css`
- `app/page.tsx`
- `build/sites-vite-plugin.ts`
- `cloudflare-env.d.ts`
- `components/account-security.tsx`
- `components/account-sync.tsx`
- `components/daily-feedback.tsx`
- `components/plan-customizer.tsx`
- `components/rest-timer.tsx`
- `components/tracking-editor.tsx`
- `components/training-onboarding.tsx`
- `components/transfer-dialog.tsx`
- `db/index.ts`
- `db/schema.ts`
- `docs/audit-completion-2026-10-09.md`
- `docs/backend-sync-2026-10-09.md`
- `docs/claude-audit-deployment-2026-10-09.md`
- `docs/cloud-client-review-2026-10-09.md`
- `docs/creator-state-2026-10-09.md`
- `docs/engineering-action-plan-2026-10-09.md`
- `docs/github-pages-2026-10-09.md`
- `docs/history-capacity-2026-10-09.md`
- `docs/native-sqlite-journal-2026-10-09.md`
- `docs/qa/backend-sync-2026-10-09/integration-tests.log`
- `docs/qa/backend-sync-2026-10-09/validation.json`
- `docs/qa/claude-integration-2026-10-09/ci/CI-SUMMARY.md`
- `docs/qa/claude-integration-2026-10-09/ci/android-job-114023200579.log`
- `docs/qa/claude-integration-2026-10-09/ci/current-artifact-byte-retrieval-status.json`
- `docs/qa/claude-integration-2026-10-09/ci/current-artifact-retrieval-status.json`
- `docs/qa/claude-integration-2026-10-09/ci/ios-log-retrieval-status.json`
- `docs/qa/claude-integration-2026-10-09/ci/native-artifacts-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/native-gate-job-114023122990.log`
- `docs/qa/claude-integration-2026-10-09/ci/native-jobs-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/native-jobs-initial.json`
- `docs/qa/claude-integration-2026-10-09/ci/native-run-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/native-run-initial.json`
- `docs/qa/claude-integration-2026-10-09/ci/observation-timeline.json`
- `docs/qa/claude-integration-2026-10-09/ci/published-source.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-artifacts-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-job-114023122797.log`
- `docs/qa/claude-integration-2026-10-09/ci/quality-jobs-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-jobs-initial.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-merge-commit-initial.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-run-final.json`
- `docs/qa/claude-integration-2026-10-09/ci/quality-run-initial.json`
- `docs/qa/claude-integration-2026-10-09/current-log-controls-coupled-negative.json`
- `docs/qa/claude-integration-2026-10-09/current-log-controls-validation.json`
- `docs/qa/claude-integration-2026-10-09/dependency-blockers.md`
- `docs/qa/claude-integration-2026-10-09/hosted-copy-publication.json`
- `docs/qa/claude-integration-2026-10-09/hosted-publication.json`
- `docs/qa/claude-integration-2026-10-09/pages-publication.json`
- `docs/qa/claude-integration-2026-10-09/validation.json`
- `docs/qa/claude-integration-2026-10-09/web-copy-validation.json`
- `docs/qa/creator-state-2026-10-09/validation.json`
- `docs/qa/final-audit-2026-10-09/application-science-equivalence.json`
- `docs/qa/final-audit-2026-10-09/final-documentation-checkpoint.json`
- `docs/qa/final-audit-2026-10-09/native7-ios-peer-reconstructed.json`
- `docs/qa/final-audit-2026-10-09/native8-static-peer.json`
- `docs/qa/final-audit-2026-10-09/page4-final-peer-reconstructed.json`
- `docs/qa/history-capacity-2026-10-09/browser-validation.json`
- `docs/qa/history-capacity-2026-10-09/validation.json`
- `docs/qa/native-compilation-2026-10-09/native7/android-collector-failure.log`
- `docs/qa/native-compilation-2026-10-09/native7/collector-failure.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/android-job.log`
- `docs/qa/native-compilation-2026-10-09/native8/ci/hosted-validation-review.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/ios-job-log-collection.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/native-artifacts.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/native-change-gate-job.log`
- `docs/qa/native-compilation-2026-10-09/native8/ci/native-jobs.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/native-run.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-artifacts.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-integration-commit.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-job.log`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-jobs-raw.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-jobs.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/quality-run.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/source-commit.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/source-native-builds.yml`
- `docs/qa/native-compilation-2026-10-09/native8/ci/source-quality.yml`
- `docs/qa/native-compilation-2026-10-09/native8/ci/source-scripts-tree.json`
- `docs/qa/native-compilation-2026-10-09/native8/ci/source-tree.json`
- `docs/qa/native-compilation-2026-10-09/native8/publication.json`
- `docs/qa/review-fixes-reconciliation-2026-10-09/validation.json`
- `docs/qa/schema-compatibility-2026-10-09/focused.log`
- `docs/qa/schema-compatibility-2026-10-09/regression-results.json`
- `docs/qa/schema-compatibility-2026-10-09/regression.log.gz`
- `docs/qa/schema-compatibility-2026-10-09/security-results.json`
- `docs/qa/schema-compatibility-2026-10-09/validation.json`
- `docs/release-readiness-2026-10-09.md`
- `docs/review-fixes-reconciliation-2026-10-09.md`
- `docs/schema-compatibility-2026-10-09.md`
- `docs/security-audit-2026-10-09.md`
- `docs/sync-outbox-2026-10-09.md`
- `drizzle/0000_account_sync.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`
- `lib/browser-cloud-sync.ts`
- `lib/browser-history.ts`
- `lib/browser-record-store.ts`
- `lib/browser-vault.ts`
- `lib/cloud-client.ts`
- `lib/cloud-envelope.ts`
- `lib/connectors.ts`
- `lib/customize.ts`
- `lib/http-security.ts`
- `lib/local-backup.ts`
- `lib/onboarding.ts`
- `lib/record-capacity.ts`
- `lib/record-identity.ts`
- `lib/rest-timer.ts`
- `lib/saved-data.ts`
- `lib/storage-capacity.ts`
- `lib/substitutions.ts`
- `lib/sync-outbox.ts`
- `lib/tracking.ts`
- `lib/training-focus.ts`
- `lib/training.ts`
- `lib/transfer-bundle.ts`
- `lib/workout-log.ts`
- `mobile/App.tsx`
- `mobile/docs/shared-snapshot.json`
- `mobile/index.ts`
- `mobile/scripts/check-engine.ts`
- `mobile/scripts/sync-shared.mjs`
- `mobile/src/backup.tsx`
- `mobile/src/content.ts`
- `mobile/src/mobile-engine.ts`
- `mobile/src/native-history.ts`
- `mobile/src/native-record-store.ts`
- `mobile/src/plan-setup.tsx`
- `mobile/src/record-platform.ts`
- `mobile/src/session-editor.tsx`
- `mobile/src/shared/customize.ts`
- `mobile/src/shared/local-backup.ts`
- `mobile/src/shared/onboarding.ts`
- `mobile/src/shared/record-capacity.ts`
- `mobile/src/shared/record-identity.ts`
- `mobile/src/shared/rest-timer.ts`
- `mobile/src/shared/saved-data.ts`
- `mobile/src/shared/storage-capacity.ts`
- `mobile/src/shared/substitutions.ts`
- `mobile/src/shared/sync-outbox.ts`
- `mobile/src/shared/tracking.ts`
- `mobile/src/shared/training-focus.ts`
- `mobile/src/shared/training.ts`
- `mobile/src/shared/transfer-bundle.ts`
- `mobile/src/shared/workout-log.ts`
- `mobile/src/storage-capacity.ts`
- `mobile/src/storage.ts`
- `public/privacy.html`
- `scripts/check-backend.cjs`
- `scripts/check-backup.cjs`
- `scripts/check-browser-history.cjs`
- `scripts/check-browser-record-store.cjs`
- `scripts/check-browser-vault.cjs`
- `scripts/check-bundle.cjs`
- `scripts/check-catalog.cjs`
- `scripts/check-cloud-client-ui.cjs`
- `scripts/check-cloud-encryption.cjs`
- `scripts/check-creator-state.cjs`
- `scripts/check-current-log-controls.cjs`
- `scripts/check-export-cancellation.cjs`
- `scripts/check-focus.cjs`
- `scripts/check-history-capacity.cjs`
- `scripts/check-native-privacy-ui.cjs`
- `scripts/check-native-storage.cjs`
- `scripts/check-native-sync-outbox.cjs`
- `scripts/check-native-workflows.cjs`
- `scripts/check-onboarding.cjs`
- `scripts/check-production-security.cjs`
- `scripts/check-program-selection.cjs`
- `scripts/check-review-reconciliation.cjs`
- `scripts/check-revision-10.cjs`
- `scripts/check-saved-compatibility.cjs`
- `scripts/check-security.cjs`
- `scripts/check-setup-hydration.cjs`
- `scripts/check-sync-outbox.cjs`
- `scripts/check-transactional-browser-vault.cjs`
- `scripts/check-transfer.cjs`
- `scripts/collect-native-build-evidence.py`
- `scripts/test-native-build-evidence.py`
- `server/api.ts`
- `server/auth.ts`
- `server/contracts.ts`
- `server/feedback.ts`
- `server/runtime.ts`
- `server/sync.ts`
- `vite.config.ts`
- `vite.pages.config.ts`
