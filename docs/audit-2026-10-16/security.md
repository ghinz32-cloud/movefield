# Security and data-integrity audit — 16 October 2026

Scope: the shared web/native application on `codex/claude-routine-audit-2026-10-16`, starting from the parent's combined `4db8f2a` checkpoint, plus the narrowly reviewed fixes below. This is a source/domain/adapter assessment, not a penetration test, real-account deployment, phone installation or scientific validation. Canonical shared edits are in `lib/`; parent owns final native snapshot synchronization and release verification.

## Confirmed defects fixed

### P1 — A substitute inherited a published routine's exercise-specific progression

- Locations: `lib/substitutions.ts:10`, `lib/source-programs-runtime.js:318`.
- Reproduction before the fix: build the existing `src-sl5x5-3` routine, replace its bench press with `lib-db-flat-bench-press`, record a complete 5×5 at 20 kg **per hand**, and specify a 2.5 kg increment. The replacement retained `sourceRule.kind=sl5x5` and `loadRole=src-sl5x5-3/sl5x5`. The next suggestion was 22.5 kg per hand with the claim that the recorded **source** progression criterion had been met. The published source barbell prescription does not establish that progression for a dumbbell substitute.
- Fix: replacement targets clear source rule/role metadata and disclose in the shared preview and saved exercise note that the user chooses this variation's progression. Other lifts retain their exact source rules. Already-saved pre-fix substitutions are protected by a non-mutating source-definition exercise/kind qualification before automatic progression. Original accepted targets and historical records are kept.
- Companion behavior: explicit reviewed starting weights still display for owner-directed substitutes, including zero. Unknown stays null. Holds, paused plans, age/authority, confirmed equipment, capacity, and exact machine setup remain enforced. Ruleless targets never derive a source increase or stage transition from history.
- Verification: `scripts/check-substitution-integrity.cjs`; all 20 existing source-program cases, all 10 source/effort refinement cases, and all 18 starting-weight cases passed. The focused test covers future repetitions, unmodified source lifts, old previews, legacy pre-fix source metadata, persisted/reopened history and reusable next blocks.

### P2 — Substitution could strand notes from a restored older active workout

- Location: `lib/substitutions.ts:25`.
- Reproduction before the fix: reopen a valid saved active workout with no entered sets and with `active.details[oldExerciseId].notes`. Replace that exercise. Its target disappeared while its saved note stayed under the old ID, detached from the new target. The guard's message promised to protect notes but checked only set metrics, RIR and setup.
- Fix: any nonempty legacy exercise note now blocks that active substitution and preserves the entire original state. Empty details remain eligible. No note is transferred to a different movement or silently discarded.
- Verification: focused test reopens the state through the real schema reader, covers meaningful/whitespace notes, empty details, existing per-set notes, explicit zero load/RIR, setup, unchanged history and unchanged dates.

## Completed verification

| Check | Result and scope |
|---|---|
| `check-security.cjs` | 29/29. Saved schemas, nested prototype keys, data/size/calendar limits, state validity, nonce generation, closed routes and response headers. |
| `check-plan-import.cjs` | Passed. Credited tracking authority, fresh plan/session IDs, preserved history/archive, unperformed targets, stale/tampered preview refusal, unknown exercises and time limits. |
| `check-vault.cjs` | Passed. Real crypto round trips, unique nonces, tamper/owner/purpose binding, wrong passwords, versions, failed migration preservation, revision and history guards. |
| `check-record-state.cjs` | Passed. Real SQLite transactions, reopening, per-record history, failed-write rollback, stale writers, cross-record substitution, complete backup and erasure. |
| `check-native-storage.cjs` | Passed. Native adapter with real SQLite/WebCrypto and mocked platform boundaries: ordered encrypted writes, quota failure, missing-key preservation/recovery, interrupted/successful migration, sample separation and interrupted erasure recovery. |
| `check-legacy-transfer.cjs` | 32 checks passed. Old phone/web transfers, Unicode password compatibility, authenticated headers/ciphertext, fixed KDF cost, future-field refusal and original preservation on stale/active/setup/outbox/failed-write rejection. |
| `check-cloud.mjs` | Passed. Actual SDK with mocked Google transport: OAuth state/PKCE/JWT signature and claims, persistent/revocable sessions, owner isolation, origins, replay/CAS, consent, provider facts/budgets, deletion and native callback brand restrictions. No real account or service was used. |
| `check-cloud-sync.cjs` | Passed. Portable web/native encryption, authenticated tampering, queued retry and account binding, acknowledgements, snapshot integrity, youth gate and bounded highlights. |
| `check-native-auth-adapter.mjs` | 5 adapter checks passed. No installed OS callback qualification implied. |
| `check-native-files.cjs` | Passed. Picker cancellation/size limits, original-file preservation, owner-scoped temporary cleanup, late erasure guard, unavailable/failed sharing and file URI transport. Mock file APIs, not physical filesystem qualification. |
| `check-fitness-fit.cjs` | Passed: 7,776 scenarios, 7,502 plans, 1,513,405 assertions, before the library agent's later inventory expansion. Parent reruns final integrated checks. |
| `check-substitution-integrity.cjs` | Passed after fixes. Legacy notes and source progression defects plus the compatibility controls described above. |
| Source/weight regression checks | 20 source-program, 10 source/effort refinement and 18 starting-weight scenarios passed after the relevant changes. |

Existing source tests refresh tracked scientific-validation timestamps. Parent owns reconciliation of those report changes. No dependency versions, private profiles, remote services, signing material or owner `.openai/` files were modified or read.

## Dependency results

- Root production scan: **0 advisories** (`pnpm audit --prod --json`). Receipt: `.sites-runtime/audit-2026-10-16-root-dependencies.json`.
- Native full dependency scan: **43 high affected package-chain entries, 0 critical**, originating from two upstream advisories. This is not 43 independently exploitable app bugs. Receipt: `.sites-runtime/audit-2026-10-16-native-dependencies.json`.
  - `braces`, deeply nested pattern stack-exhaustion denial of service, affected `<=3.0.3`, GHSA-vfj7-8cjw-p6xm: <https://github.com/advisories/GHSA-vfj7-8cjw-p6xm>.
  - `node-forge`, RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements, affected `<=1.4.0`, GHSA-86w9-cpqp-85rv: <https://github.com/advisories/GHSA-86w9-cpqp-85rv>.
- Registry reports `fixAvailable: false` for both. These remain open tooling dependency findings. No unsupported Expo downgrade, dependency suppression or claimed fix was made.

## Additional reviewed boundaries and limits

- Custom/imported content is handled as data. Schema parsing rejects dangerous prototype keys and strips unsupported authority fields; legacy preservation readers refuse silent loss of older unknown fields. Exercise IDs, target snapshots and histories are retained rather than rewritten when libraries evolve.
- Web exercise links and native `safeWebUrl` permit HTTPS without embedded user credentials. Local guide images use a constrained path pattern; current content is rendered as React text, not executable HTML. This does not certify publisher content or link availability.
- Both brand UIs render shared substitution warnings. Native content remains locally bundled; the web guide loader is separately covered by the web audit agent.
- Static GitHub Pages explicitly disables account/backup/coaching API actions. Prepared Worker backend controls passed local tests; live Cloudflare resources, OAuth provider settings, operator retention, and billing gates were not exercised.
- Physical iOS/Android keychain/keystore behavior, restore/reinstall/update, device notifications, filesystem remanence, store signing and OS callback behavior remain outside these domain/adapter results. The owner has no Apple setup yet. The dependency findings above remain open.

## Files changed by this workstream

1. `lib/substitutions.ts` — protect legacy active notes; clear inherited source metadata on replacement; shared review warning.
2. `lib/source-programs-runtime.js` — qualify source exercise/kind without rewriting old data; retain guarded owner-reviewed loads while disabling unsupported automatic source progression.
3. `scripts/check-substitution-integrity.cjs` — focused regressions for both reproduced defects and compatibility boundaries.
4. `scripts/check-cloud.mjs` — resolve the actual Workerd async-context implementation in the local Worker bundle and exercise concurrent reads by separate owners.
5. This scoped report and ignored audit receipts. Existing test scripts also refresh source validation report timestamps.

No unresolved newly reproduced application defect remains within this workstream's examined paths. That statement does not close the release, platform, dependency or broader product gates listed above.

## Independent routine integration review

Reviewed the generated 68-option routine library, generation/qualification code, the `fixedDose` branch in the canonical planner, updated movement/equipment roles, and the focused library checks. The 57 withheld proposals remain absent from the live catalog; unsupported sport/jump/sprint plans and options that cannot preserve their work within the time window are not silently offered under another ID. Existing catalog defaults remain first. New arrangements are disclosed as app-authored, and longer availability does not inflate reference sets.

No additional blocking regression was reproduced in this independent pass. Extra targeted probes confirmed that new powerlifting requires its competition barbell, hybrid requires a route, a floor restriction cannot leave dead-bug/floor targets in the plan, and a gym routine cannot assume stations absent from confirmed inventory. The brief beginner variant retains unknown loads. These five probes complement rather than repeat the integration agent's broader matrix.

The library audit agent independently identified the pre-existing unconfirmed `ref-Lying_Leg_Curls` machine as being treated as available under a selected-stack leg-curl flag. I concurred with their narrow fail-closed inventory fix while retaining its ID/history for manual tracking. That change remains owned by the library agent and covered in its report.

The qualification report establishes executable schedule, duration, equipment and movement checks. Its minimum nonzero regional work checks do not establish that every routine is optimal, that users will gain a specified amount of strength or muscle, or that each named app-authored arrangement was tested in a trial; the UI rationale correctly preserves those limits.

## Cloud test concurrency diagnosis and correction

The parent's integrated core run intermittently returned `[200, 503]` instead of the required `[200, 409]` for simultaneous writes. An unmodified isolated rerun passed all 19 existing checks, so a synthetic diagnostic exercised repeated concurrent account reads before the write test. It reproduced `[200, 503]` with Better Auth's `No request state found` error. The diagnostic did not use real accounts or change production backend code.

The local test's esbuild `platform: 'browser'` resolution selected `@better-auth/core/async_hooks`' browser fallback. Its single mutable request-state slot cannot preserve independent concurrent asynchronous contexts. The package exports its actual Node async-hooks implementation for `workerd`, which matches production. The test bundle now explicitly sets `conditions: ['workerd']`; node built-ins remain external and Miniflare's existing `nodejs_compat` provides the implementation.

The new regression performs 10 rounds of simultaneous Alice/Bob profile reads, verifies both responses are 200, and checks each owner's identity, revision and ciphertext separately. The exact simultaneous-write `[200, 409]` assertion is unchanged. The corrected suite passed **all 20 checks**, including concurrent owner reads and the original CAS invariant. This was a test-bundling defect, not evidence requiring a D1/R2 backend change.

Final production build also passed. Inspection of `dist/server/index.js` confirms `node:async_hooks` resolution and no `AsyncLocalStoragePolyfill`, so production already used the appropriate implementation. Receipts are `.sites-runtime/audit-2026-10-16/cloud-diagnostic.log` (reproduction), `cloud-recheck.log` (unmodified successful rerun), `cloud-workerd-final.log` (corrected 20-check pass), and `build-worker-final.log` (parent's final production build).
