# Calendar and personalized coaching — 9 October 2026

Plans now uses bounded, equal tabs and stable panel spacing. The floating Appearance control is removed; Settings still provides appearance choices. Web and native Today dates open read-only recorded-day details with Yesterday/N days ago headings, actual completed sets and truthful Day off/unlogged/skipped distinctions. Historical details precede coaching.

## Personalized coaching

The web coach accepts actual completed lift/workout metrics, comparable prior performance, truthful 28-day attendance and a minimized adult training profile. It waits for durable local save. Explicit consent and a separate automatic-review opt-in are required. Model output is a validated selection of recorded facts and engine-owned review options, not arbitrary instructions or automatic plan changes. New targets require an explicit current-context preview and owner acceptance.

Experimental browser options are pinned Qwen3.5 4B and 9B. Downloads require size confirmation, WebGPU and substantial device storage/memory. The exact download allowlist, hash-verified files, network-refusing worker, deadlines, cancellation and current context/model checks are enforced. The current verified service worker is required before local runtime startup; first visits need a reload after installation. No weights were downloaded and no GPU inference or device performance was measured here. Automatic model choice remains unqualified.

Secure optional cloud coaching uses a same-origin authenticated backend and the additive workout_ai_coaching table. Provider keys stay on the server. Explicit upload consent, owner/context binding, shared bounded quotas, provider timeout, cancellation/resumption leases and durable validated-result publication are enforced. Completed/failed/cancelled context is cleared; receipt metadata remains. The newest12 local result selections are encrypted. No provider key is configured, so live remote inference is not claimed. Native personal inference and account authentication are still unavailable.

## Verification

Integrated application source passed75/75 regression suites, web/native TypeScript, product ESLint without warnings,47 canonical shared-file hashes, the78-plan native engine and both iOS/Android Hermes exports. Production build has zero warnings;3/3 production suites pass. New focused evidence includes12 context groups/160 assertions,29 UI scenarios/168 assertions,6 calendar callback scenarios/51 assertions,12 encrypted-result scenarios/95 assertions,21 D1 backend groups,15 client lifecycle groups,102 runtime checks,709 worker-policy checks and608 generated Pages checks (the final Pages build is separately verified at deployment).

An initial production security test exceeded Node's default16KiB HTTP response-header parser because the CSP enumerates exact pinned assets. The test now uses the hosting128KiB parser boundary while retaining a stricter100KiB CSP ceiling, every exact asset source, nonce and worker restrictions. It passed after correction. Three mistyped/mislocated shared-check invocations failed before the correct root check passed. Browser interaction, real phone acceptance, authenticated live cloud inference, physical-iPhone distribution and clean release-dependency qualification remain unverified. Existing release advisories are not waived by passing CI.

Cloud upload consent is bound to the exact current context and consumed synchronously by each request. Retained checkbox/button callbacks cannot reuse it after workout, lift, recorded metric, profile or attendance changes. Corrected source96496ffd/tree20397284 passed the complete75/75 hosted suite,29/29 compiled UI scenarios/168 assertions, types/lint and3/3 production checks in quality run37999781041. This qualification precedes the subsequent hosting-worker correction; complete official evidence is retained under docs/qa/workout-coaching-2026-10-09/ci/.

## Hosted worker correction

Live private hosting served both model workers with exact source bytes but omitted the restrictive Content-Security-Policy from public/_headers. The existing runtime gate refused startup correctly. The correction uses the existing service worker to verify current-build model code before attaching the canonical worker policy. Runtime URLs cannot use retained older caches; manifest, worker byte digest, current page bundle and controller identity must agree. Page CSP remains unchanged, and no blob, eval or weaker-policy fallback is introduced. The correction passes34/34 offline scenarios,745 worker-policy assertions,102 runtime assertions, web TypeScript, focused lint with zero warnings,47 shared-file hashes, a zero-warning fresh build and3/3 production suites. Its built offline manifest covers82 assets/19,966,146bytes and initial bundle399,884gzip bytes remains below400,000. Deployment readback follows at this correction checkpoint; actual browser control and GPU inference remain unexecuted.

## Publication checkpoint

The UI checkpoint81840879 is pushed and independently read back. Quality37996257648 and native37996257659 succeeded for that earlier UI tree. The combined coaching sourcec0aab491/tree8821849a and corrected consent source96496ffd/tree20397284 are pushed and read back on the existing audit branch. Both hosts deployed the corrected consent tree; live inspection then identified the private host's omitted worker header. The correction is the active deployment milestone. PR1 remains draft and main is unchanged.

Actual Android and unsigned iOS Release simulator compilation at c0aab491 succeeded in run37999301260; both test binaries are retained. Corrected-source native gate37999781136 succeeded with both platforms skipped because the five changed web/UI-test/documentation files did not alter compiled native inputs. The recorded188-file fingerprint and127-member starter equality prove that distinction. Current artifact-byte retrieval returned HTTP403 and the iOS decoded log was unavailable; no independent binary replay, device installation, signed iPhone package or TestFlight claim is made. A library change in the worker correction conservatively requires fresh official native CI.

## Modified files

The inventory below covers this request relative to core checkpoint83b2f94, including retained public verification receipts. Generated deployment outputs and ignored runtime logs are excluded.

- `HANDOFF.md`
- `TASKS.md`
- `app/api/workout-coaching/route.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `build/qwen-worker.config.mjs`
- `build/worker-node-refusal.ts`
- `components/account-security.tsx`
- `components/app-preferences.tsx`
- `components/qwen-model-files.tsx`
- `components/training-day.tsx`
- `components/training-onboarding.tsx`
- `components/workout-coach.tsx`
- `components/workout-review.tsx`
- `db/schema.ts`
- `docs/audit-completion-2026-10-09.md`
- `docs/calendar-and-coaching-2026-10-09.md`
- `docs/claude-audit-deployment-2026-10-09.md`
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
- `docs/qa/claude-integration-2026-10-09/dependency-blockers.md`
- `docs/qa/claude-integration-2026-10-09/hosted-copy-publication.json`
- `docs/qa/claude-integration-2026-10-09/hosted-publication.json`
- `docs/qa/claude-integration-2026-10-09/pages-publication.json`
- `docs/qa/claude-integration-2026-10-09/web-copy-validation.json`
- `docs/qa/workout-coaching-2026-10-09/ci/README.md`
- `docs/qa/workout-coaching-2026-10-09/ci/SHA256SUMS`
- `docs/qa/workout-coaching-2026-10-09/ci/android-job-114053245360.log`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-integration.json`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-native-gate-artifacts-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-native-gate-job-114054754463.log`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-native-gate-jobs-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-native-gate-run-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/corrected-source.json`
- `docs/qa/workout-coaching-2026-10-09/ci/current-artifact-retrieval-status.json`
- `docs/qa/workout-coaching-2026-10-09/ci/final-quality-artifacts.json`
- `docs/qa/workout-coaching-2026-10-09/ci/final-quality-job-114054952762.log`
- `docs/qa/workout-coaching-2026-10-09/ci/final-quality-jobs.json`
- `docs/qa/workout-coaching-2026-10-09/ci/final-quality-run.json`
- `docs/qa/workout-coaching-2026-10-09/ci/final-summary.json`
- `docs/qa/workout-coaching-2026-10-09/ci/integration.json`
- `docs/qa/workout-coaching-2026-10-09/ci/inventory.json`
- `docs/qa/workout-coaching-2026-10-09/ci/ios-log-retrieval-status.json`
- `docs/qa/workout-coaching-2026-10-09/ci/native-artifacts-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/native-jobs-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/native-run-final.json`
- `docs/qa/workout-coaching-2026-10-09/ci/source.json`
- `docs/qa/workout-coaching-2026-10-09/native-input-equality.json`
- `docs/qa/workout-coaching-2026-10-09/pages/controlled-worker-policy-verification.json`
- `docs/qa/workout-coaching-2026-10-09/pages/deployment-jobs.json`
- `docs/qa/workout-coaching-2026-10-09/pages/deployment-run.json`
- `docs/qa/workout-coaching-2026-10-09/pages/evidence-inventory.json`
- `docs/qa/workout-coaching-2026-10-09/pages/generated-inventory.json`
- `docs/qa/workout-coaching-2026-10-09/pages/independent-git-tree-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/live-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/mobile-package.log`
- `docs/qa/workout-coaching-2026-10-09/pages/native-starter-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/pages-build.log`
- `docs/qa/workout-coaching-2026-10-09/pages/pages-check.log`
- `docs/qa/workout-coaching-2026-10-09/pages/pages-commit-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/pages-tree-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/publication.json`
- `docs/qa/workout-coaching-2026-10-09/pages/published-source-readback.json`
- `docs/qa/workout-coaching-2026-10-09/pages/verify-live-pages.py`
- `docs/qa/workout-coaching-2026-10-09/pages/workout-coaching-runtime-checks.json`
- `docs/qa/workout-coaching-2026-10-09/pages/workout-coaching-worker-policy-checks.json`
- `docs/qa/workout-coaching-2026-10-09/qwen-larger-endpoints-head.json`
- `docs/qa/workout-coaching-2026-10-09/runtime-implementation.md`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/evidence-inventory.json`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/local-validation.json`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/site-controlled-worker-checks.json`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/site-controlled-worker-fixture.log`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/site-worker-correction-build.log`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/site-worker-correction-production.log`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/workout-coaching-runtime-checks.json`
- `docs/qa/workout-coaching-2026-10-09/site-controlled-worker/workout-coaching-worker-policy-checks.json`
- `docs/qa/workout-coaching-2026-10-09/workout-coaching-runtime-checks.json`
- `docs/qa/workout-coaching-2026-10-09/workout-coaching-worker-policy-checks.json`
- `docs/qwen-muse-current-feasibility-2026-10-09.md`
- `docs/release-readiness-2026-10-09.md`
- `docs/workout-coaching-backend-2026-10-09.md`
- `drizzle/0001_workout_coaching.sql`
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/_journal.json`
- `lib/app-preferences.ts`
- `lib/browser-record-store.ts`
- `lib/browser-vault.ts`
- `lib/cloud-client.ts`
- `lib/http-security.ts`
- `lib/qwen-network-policy.json`
- `lib/qwen-network-policy.ts`
- `lib/qwen-network.ts`
- `lib/qwen-runtime-cache.ts`
- `lib/training-day.ts`
- `lib/workout-coaching-client.ts`
- `lib/workout-coaching-identity.ts`
- `lib/workout-coaching-models.ts`
- `lib/workout-coaching-runtime-contract.ts`
- `lib/workout-coaching-runtime.ts`
- `lib/workout-coaching-store.ts`
- `lib/workout-coaching-worker-policy.json`
- `lib/workout-coaching-worker-security.ts`
- `lib/workout-coaching.ts`
- `lib/workout-coaching.worker.ts`
- `mobile/App.tsx`
- `mobile/docs/AI-COACHING.md`
- `mobile/docs/shared-snapshot.json`
- `mobile/scripts/sync-shared.mjs`
- `mobile/src/shared/app-preferences.ts`
- `mobile/src/shared/training-day.ts`
- `mobile/src/shared/workout-coaching-identity.ts`
- `mobile/src/shared/workout-coaching.ts`
- `public/privacy.html`
- `public/sw.js`
- `scripts/build-pages.mjs`
- `scripts/check-backend.cjs`
- `scripts/check-built-offline.mjs`
- `scripts/check-calendar-ui.cjs`
- `scripts/check-coaching-backend.cjs`
- `scripts/check-coaching-client.cjs`
- `scripts/check-offline-fixture.mjs`
- `scripts/check-pages.mjs`
- `scripts/check-production-security.cjs`
- `scripts/check-training-day.cjs`
- `scripts/check-workout-coaching-runtime.cjs`
- `scripts/check-workout-coaching-store.cjs`
- `scripts/check-workout-coaching-ui.cjs`
- `scripts/check-workout-coaching-worker-policy.cjs`
- `scripts/check-workout-coaching.cjs`
- `scripts/generate-offline.mjs`
- `scripts/lib/coaching-fixture.cjs`
- `server/ai-quota.ts`
- `server/api.ts`
- `server/auth.ts`
- `server/coaching.ts`
- `server/feedback.ts`
- `static-web/main.tsx`
- `static-web/sw-template.js`
- `vite.pages.config.ts`
