# Current continuation — 9 October 2026, strict dependency release gate

S02 is published and independently verified at `cbb39a4b04f7d9f8d3ba19bf44d20d72304bd73b`, exact tree `ea2d63918653adcc0fa6193df3748487571443aa`, matching local `64eb774168a0690b4d5ea466a6214275bb05e2fe`; report readback and fresh Git head checks pass. Publication metadata: `docs/qa/native-history-2026-10-09/publication.json`. Both source histories are retained locally and in the verified bundle.

R01 implementation is complete locally. `node scripts/check-dependencies.mjs --release` rejects every high/critical, including the two CI exceptions. Default CI permits only exact known high advisory/package pairs until 8 November; malformed/incomplete/error audits, unknown flags and critical escalations fail closed. Seven policy scenarios pass; live CI exit0, strict release exit1, invalid flag exit1. Fresh reports retain one web and 15 propagated native high entries; no compatible published fixes were found and no dependency versions changed. The seven-day release-age rule remains. Evidence: `docs/dependency-release-gate-2026-10-09.md`, `docs/qa/dependency-release-gate-2026-10-09/`. No application rebuild/device proof claimed for this policy-only checkpoint.

Resolve this source commit by the policy report history. Save/verify `.sites-runtime/checkpoints/dependency-release-gate.bundle`, publish to the standing approved `audit/2026-10-08-quality` destination with expected-head lease, compare the exact tree and read back its report. Main/review-fixes remain unchanged; no merge/deploy/distribution.

Next prompt: Resume from the verified release-policy checkpoint and implement U09a native model-file handling using installed Expo FS/SQLite/hashes: explicit frozen-manifest consent, private opaque attempt files, bounded SHA256/byte validation, completion pointers, cancel/timeout/late-callback suppression, restart cleanup and load/delete exclusion. Native inference stays disconnected until a real native runtime build and hardware qualification. Actual phone/browser acceptance and cloud accounts/sync remain pending.

# Previous continuation — incremental phone history

# Current continuation — 9 October 2026, incremental phone history

Repository `https://github.com/ghinz32-cloud/movefield.git`; checkout `/workspace/scratch/30756d258ac2/movefield`; local branch `audit/2026-10-09-approved`, upstream `origin/audit/2026-10-08-quality`. Verified starting local checkpoint `9196735b51d26e6b65d1b5537cf387184103e799`; remote baseline `d4f94890cf0c19c1bfb399d1080d615553e2f70a`. Main `80e6ea26437f0aeaa1d8f816ace464da81fe0a81` and review-fixes `667a3e381035b16cb1aa611c85cdf9d143b7b835` remain unchanged. Standing explicit owner approval covers GitHub commit creation and this source/audit evidence to the existing review branch; historical approval blockers below are resolved.

S02a/b is implemented and checked locally: completed workouts have encrypted hashed SQLite slots, ordered authenticated references in the encrypted profile head, atomic revision/CAS mutations, tombstones, verified legacy migration, complete key-loss recovery bundles, journal-preserving restore and reset. Cached own active edits read/write zero history entities; cache validity requires exact head/revision/key. The shared key lifecycle queue supports module reloads within one JS runtime, not multiple OS processes/JS engines. Failed restore/reset acknowledgment leaves old UI tokens stale. Recovery copies may retain legacy plaintext; corrupted SQLite chunks can prevent copying. Existing 5M-character/5,000-workout bounds remain.

Validation: 45/45 application regressions plus a prepared dependency-policy suite, 3/3 production suites; 27 actual SQLite history scenarios / 192 assertions, 13 batch scenarios, 14 retained snapshot scenarios, eight fresh-module restore captures, web/native types, full product lint, native engine and Android/iOS Hermes exports pass. Exact source/log/artifact hashes and fresh generated reports: `docs/qa/native-history-2026-10-09/`; report `docs/native-history-2026-10-09.md`. Harness SecureStore/crypto/OS stand-ins and Hermes exports do not qualify physical phones.

Resolve source checkpoint via `git log -1 --format=%H -- docs/native-history-2026-10-09.md`. After commit save/verify `.sites-runtime/checkpoints/s02-native-history.bundle` and metadata; publish only to `audit/2026-10-08-quality`, compare exact tree and read report back. Connector commit SHA may differ from the local commit while matching its source tree; preserve both histories.

Next prompt: Resume from the verified S02 source/tree, inspect refs and preserve all concurrent work. Integrate the prepared strict dependency policy into `scripts/check-dependencies.mjs` (`--release` must fail any high/critical, including dated CI exceptions), record fresh audit outcomes, then implement U09a verified native model files using installed Expo FileSystem with bounded hashing/consent/cancellation. No published compatible braces/node-forge fix was found. Physical device/build acceptance, cloud accounts/sync, native inference and trained artifact qualification remain. No main merge, live deployment or new service occurred.

# Previous continuation — transactional browser storage

# Current continuation — 9 October 2026, transactional browser storage

Repository `https://github.com/ghinz32-cloud/movefield.git`; checkout `/workspace/scratch/30756d258ac2/movefield`; local branch `audit/2026-10-09-approved` tracks `origin/audit/2026-10-08-quality`. Main remains `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`; review-fixes `667a3e381035b16cb1aa611c85cdf9d143b7b835` is retained in ancestry.

The owner delegates technical/destination choices and explicitly approved GitHub commit creation and this source/audit evidence going to the repository on 9 October 2026. The earlier automatic-review rejection is resolved. Prior complete audit publication is independently verified at `07e540dcfe8bcd9339651db868f9a07184b4d49a`, tree `829b0d5e11593d326a96bcee94942bbe792d4720`, exactly matching local `22a208b10a7cb8a726478617ae6d70fee1210b3b`; final audit/training report readback succeeds. Local merge `d643ba6a3567de8cf0d419a6c8240a12880f5b3d` preserves both histories without changing the published source. Historical blocked-publication text below is superseded.

S01 is pushed and independently verified at `ea437ccb8a3383db0230006b453de90b867dbb4f`, tree `34a6d30b0c418dca8b1edf39244a8ae546c4a941`, matching local implementation `2cb27c13a950103858f70d331e5f8ab6977d970f`. Git fetch/remote head and validation/handoff readback pass. See `docs/qa/browser-storage-2026-10-09/publication.json`. The final publication-record update is documentation-only; the application checks below apply to that exact implementation tree.

S01 implementation complete: encrypted browser snapshots and their non-extractable AES-256 key share one IndexedDB transaction with revision/key-epoch comparisons, migration metadata and deletion tombstones. Legacy restore recovery precedes verified idempotent import; failed cleanup never restores retired records. Damaged optional setup remains preserved and does not block valid main training. Web Locks still gate mutations. The app uses raw+plaintext snapshot tokens, writer-aware cross-tab notifications/focus checks, intact real-profile tokens on sample reset, and honest unavailable-storage/locked-copy recovery controls.

Fresh validation: 43/43 regressions, 3/3 production suites, web types, full product lint and production build pass. Low-level backend: 76 assertions. Transactional vault: 24 scenarios/163 assertions. Legacy vault: 133 assertions. Actual compiled Home persistence callbacks: 8 scenarios. Initial gzip 397,290 bytes; generated offline manifest 66 assets / 20,484,593 bytes. Exact source/log hashes and fresh reports in `docs/qa/browser-storage-2026-10-09/`; report `docs/browser-storage-2026-10-09.md`. Historical generated reports were preserved. No dependencies added; no browser screenshots/device acceptance inferred from the harness.

Resolve current local implementation commit with `git log -1 --format=%H -- docs/browser-storage-2026-10-09.md`; verify remote head/tree/report readback before calling it pushed. Recoverable bundle `.sites-runtime/checkpoints/s01-browser-storage.bundle` plus checkpoint metadata is created after commit. Connector metadata may produce a different commit SHA; exact source trees must match and local history remains in the bundle.

Remaining: incremental native/browser entities beyond whole-profile snapshots and existing 5M-character / 5000-workout guards; actual secure-origin browser and physical Android/iOS storage/transfer/offline/reflow acceptance; accounts/sync and native Qwen; trained artifact qualification; two documented advisory roots. No main merge, live deployment, paid-service provisioning or store distribution occurred.

Next prompt: Resume Movefield from the verified S01 checkpoint, inspect current refs/changes and preserve both local and GitHub histories. Decompose S02 incremental native entities into bounded schema/import and mutation milestones, preserving encrypted SQLite snapshots and key-recovery/tombstone behavior. Qualify actual browser/device behavior when available; do not replace it with harness claims. Keep manual source routines and recovered training adapters disabled until separately qualified.

# Historical application audit and prior checkpoints

# Active full application audit — 9 October 2026 UTC

User request: independently audit and improve phone/web data storage, every tool and journey, workout programming/progression and daily/weekly loads; commit improvements without asking for routine approval. Working checkout `/workspace/scratch/30756d258ac2/movefield`, branch `audit/2026-10-09-approved`, clean initial HEAD `a53f0e9295cbdd6c6f9311a10b2a1154a7399ae7`. Remote review baseline `c390b1208869a746417cd35655f1d0ce3e2a268b`, main `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`, review-fixes `667a3e381035b16cb1aa611c85cdf9d143b7b835`; reconciled review-fixes history retained.

Current milestone A05 complete locally: parallel read-only storage, workout engine, native UX and tool/security audits; root owns application edits and browser inspection. Publish only to `ghinz32-cloud/movefield` branch `audit/2026-10-08-quality` when permitted. Automatic approval review again rejected normal Git push, stating that the broad audit approval did not clearly authorize the recovered payload and exact destination after its prior rejection. No push succeeded. Do not try connector/alternate export workarounds; complete local work, document exact commits/scope, save recoverable checkpoints, and report the remaining publication blocker. No main merge or deployment.

A01 audit baseline is complete. Browser sample Today/start/set logging/rest/partial-finish entry observed; native engine and complete storage/program/tool source paths inspected. A02a now refuses all browser-vault mutations and prepared recovery without origin-wide locking; existing reads remain available. 133 real WebCrypto vault checks, web types and focused lint pass. This prevents lost first-save keys and save/reset races in the unsupported fallback. Native dependencies recovered via successful offline lockfile install; native types are being rechecked.

A02b is implemented and verified: transactional encrypted SQLite snapshots, bounded chunks/hashes, legacy preservation/readback migration and deletion tombstones. Actual SQLite 14-scenario harness includes 2,000 workouts/24,000 sets (5,082,846 encrypted bytes), rollback/ambiguity/corruption/key-loss and fresh restore recovery. Eight native key-journal boundary checks, types/lint/shared hashes/engine and iOS/Android 4.4 MB exports pass. Report `docs/application-audit-2026-10-09.md`; logs `.sites-runtime/a02b-*`. Compatible expo-sqlite added with lockfile. Physical phone/power/free-space acceptance and incremental entities remain.

A02c protects unreadable setup drafts from automatic replacement on both web and phone, including fresh/source entry. Ten compiled actual-TSX callback scenarios pass; failed reads and parse errors keep subsequent field/step edits visit-only, while readable/empty drafts save normally. Types and focused lint pass. Recoverable bundle `.sites-runtime/checkpoints/a02c-setup-recovery.bundle`.

A03 repairs rolling RNBASE4 recovery/load constraints using actual completed/active dates; uses canonical rounded time estimates for substitutions/additions and both sides of timed work; retains capacity progression superset notes. A new checked continuation proposal clears only the selected target-review flag, after unchanged prerequisites, with web/native review actions. Thirty regression cases, training/design/depth/named-program/goal/focus/shared suites, web/native types and focused lint pass. Program counts remain coverage, not clinical validation. Reports `docs/qa/application-audit/progression-validation.json` and `program-depth-validation.json`. Recoverable bundle `.sites-runtime/checkpoints/a03-progression.bundle`.

A04a tools/cancellation complete: warm-up grids use the entered available increment, never exceed working load or invent zero-load dumbbells; too-small equipment gets an explicit unavailable result. Web/native expose step inputs. Estimated bests require eligible rep/load progression and a known matching machine setup. Reminder cleanup attempts all owned cancellations/dismissals even after enumeration/OS failures, with no new schedules or foreground authorization on failed cleanup. Async transfer Cancel/unmount prevents late download and repeated submission. Fourteen tools, four notification and three deferred-export cases plus existing 33 tool checks, types/lint/shared parity pass. Bundle `.sites-runtime/checkpoints/a04a-tools.bundle`.

A04b complete: each successful managed/portable build generates a pinned public code/content manifest. The service worker verifies every asset and stored hash/size, matching generic shell and readiness marker before activation; failures remove the incomplete new cache while retaining the last build. Includes unopened lazy features/research; excludes records, downloads, models and source photos. Twenty-three actual-source VM cases and actual generated54-asset/19,660,994-byte manifest validation pass; production build and existing security/bundle checks pass (393,296 initial gzip bytes). Secure real-browser offline acceptance remains unavailable in the HTTP preview. Bundle `.sites-runtime/checkpoints/a04b-offline.bundle`.

A04c complete: atomic seeded finish feedback, guarded shared plan pause/resume, custom native library, selected-only unfamiliar exercise prompts and visible link errors, reviewed overdue actions, collapsed tools, canonical cross-platform date-first history sorting, accurate native storage-copy/units, decimal-comma fields and 44-point actions. Twelve compiled actual callback/engine cases, shared parity, web/native types and full lint pass. Browser sample pause/resume versions 1→2→3 and one main landmark verified; final Today screenshot at 130% preference `docs/qa/application-audit/browser-today.jpg`, observations JSON alongside it. Physical phone/reflow/secure-origin acceptance remains. Bundle `.sites-runtime/checkpoints/a04c-workflows.bundle`.

A05 complete locally: 40/40 regression suites, 3/3 production suites, web/native types, full lint, native engine: 78 plans across 7 starting weekdays / 989 guides, and Android/iOS Hermes exports: 4,452,792 / 4,443,533 bytes pass. Full regression results are saved independently of truncated stdout; final artifacts/readback verified. Final offline manifest: 54 assets / 19,661,787 bytes; initial gzip: 393,516 bytes. Added 26 offline boundaries including corrupt/missing cache, readiness/shell replacement and activation recheck. Final Settings distinguishes visit-only sample data and unconnected native model features. Clean generated output before builds, and stop the supervised preview before final build: concurrent preview writes had retained obsolete chunks. Final successful build ran after preview stop. Evidence `docs/qa/application-audit/final-validation.json`; historical generated reports preserved with fresh final copies alongside it. Dependency gate recognizes only the two unchanged temporary release blockers; no patched versions in current official advisories; exception expires 8 November 2026. No clean-release claim.

All eight audit implementation/checkpoint commits are local after `a53f0e9`; final checkpoint resolves with `git log -1 --format=%H -- docs/qa/application-audit/final-validation.json`. Full-history bundle `.sites-runtime/checkpoints/application-audit-complete.bundle`, verified after final commit. Remote audit remains `c390b1208869a746417cd35655f1d0ce3e2a268b`; main/review-fixes unchanged. Automatic approval review rejected source push for exact recovered-payload/destination authorization, despite broad approval. Ask only for this concrete completed checkpoint (audit repairs plus recovered source/training/evaluation records) to `ghinz32-cloud/movefield` → `audit/2026-10-08-quality`; do not use another export route, merge main or deploy.

Next continuation: verify final HEAD/bundle/clean tree and exact publication permission. Publish only to the existing audit branch after its blocker is resolved, then verify remote head/tree/file readback. Continue S01 transactional browser records and incremental native entities, then real secure-browser/physical-device acceptance and upstream dependency repair. Browser ciphertext still uses quota-bound localStorage; native uses transactional snapshots with shared 5M-character / 5000-workout bounds. Accounts/cloud sync, native Qwen and secure-trained artifact qualification remain unfinished. Preserve manual source routines and disabled recovered training adapters.

# Current continuation — 9 October 2026

## Current approved publication — recovered U15, newer runtime preserved

Publication update: the reconciled source checkpoint is local `b40219119ecaf334cb7c72d0f515a9092e67693c`, tree `91f09e38b189ff96be2ccfb8582b1528e80e04e0`, parents `c390b1208869a746417cd35655f1d0ce3e2a268b` and exact original `0597d5ebc46864bc3066d54ece13e645dd54dd41`. Automatic approval review rejected its Git push because the trusted approval named the prior commits, not this recovered/reconciled payload. No push succeeded, and no connector or alternate route was attempted after this rejection. Fresh approval must describe this recovered source/data/results/handoff checkpoint and review-branch reconciliation to the existing destination. Preserve source exactly; do not bypass the rejection.

The user explicitly approved uploading the completed source/handoff range after the earlier automatic-review rejection. Repository `https://github.com/ghinz32-cloud/movefield.git`; only publication target `audit/2026-10-08-quality`, draft/open PR #1. Current isolated checkout `/workspace/scratch/30756d258ac2/movefield`, branch `audit/2026-10-09-approved`, verified remote baseline `c390b1208869a746417cd35655f1d0ce3e2a268b`. Main remains `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`. No main merge/deployment.

Workspace maintenance removed the prior `1df2471e74c33bb6c3aaa8e7b9736e4b29f97297` checkout/Git metadata before approval could be published. The saved pilot archive survived. Trainer, exporter, evaluator and the 162-train/44-development-validation dataset were recovered; their exact SHA-256 fingerprints agree with the saved training/evaluation results. The old complete tree/commit metadata was not recovered, so this is a new reconciled checkpoint. Original `0597d5ebc46864bc3066d54ece13e645dd54dd41` is retained as an additional parent. Its original source modules remain available for the historical experiment fingerprint; active app entry points keep the newer runtime.

The restored historical experiment uses 1024/192 tokens and a 16-step CPU bfloat16 LoRA pilot. Saved actual answers: base 0/8 correct, adapter 6/8, with two unsupported-question abstention failures; this adapter stays disabled. The newer baseline's escaped prompt, 2048/256 browser runtime and separate older 132/34 CPU pilot/66-run evidence are preserved. These are different adapters/protocols, not conflicting results for one run. No new model generation/training/device qualification occurred in recovery.

Fresh checks: 650 integrity assertions, four evaluator tests, 33/33 regressions, web types and restored-module lint pass. Exact saved measurements/source recovery are in `docs/qwen-training-2026-10-09.md`/`.json` and `docs/qa/u15/`. Historical validation files were retained; fresh generated copies have separate names. Trained artifact is separately saved; recovered local copy `/workspace/scratch/30756d258ac2/outputs/Movefield_Qwen_Training_Pilot_2026-10-09.zip` passes its prior SHA-256/ZIP CRC. Repository bundle after commit `.sites-runtime/checkpoints/approved-u15-complete.bundle` plus `approved-u15-checkpoint.json`; verify exact GitHub head/tree and report/file readback before reporting publication. Resolve commit via `git log -1 --format=%H -- docs/qwen-training-2026-10-09.md`.

Next short prompt: Resume this approved recovery checkout, verify current refs and preserve source histories. Unsupported-question behavior still needs stronger original development examples and separately measured evaluation. Keep the recovered adapter disabled; align any future compiled artifact to the current runtime protocol and immutable manifest before secure WebGPU/native qualification. The newer browser already escapes reserved ChatML tokens; do not reintroduce the historical raw worker. Storage, accounts/sync, advisory and Android/physical-device release work remains. Approval covers review-branch source publication, not main merge/deployment.

## Latest milestone — U08b optional Qwen demo and real CPU training

Independent checkout `/workspace/scratch/855d6d943ad0/movefield-continuation`, branch `audit/2026-10-09-continuation`, baseline/pushed U14 `026ac627a67bbba6feeffcf0b1c1097e43b2b0a4` (tree `1690356c556b13ed479b2c03b9a8d5a49c70b5bf`), tracking remote `audit/2026-10-08-quality`. Standing push authorization applies; preserve the original overlapping checkout.

U08b: collapsed Coaching sample, strict default prompt/source-ID output, cache-only verified worker, real tokenizer limits, Off/close/delete/cancel/timeouts. Pinned WebLLM 0.2.85/tokenizers 0.1.6; fixed upstream UMD export and worker-without-window storage defects. Separate browser-only build before dev/build; scoped worker CSP permits WASM with no fetch/child workers or page eval. Chrome controls/question selection/blocker observed after concrete build-wrapper restart; saved profile and 130% preference retained. No actual secure browser downloads or GPU inference.

Actual isolated CPU LoRA pilot: original 132-train/34-validation dataset, 16 updates/16 unique cases, 1,146,880 trainable parameters, pinned verified HF base, 4.6 MB adapter. Unchanged 22-case held-out suite in three fresh generation sessions: 39 actual generations and 27 gated non-invocations, all 66 automated results passed. Raw reports, environment, timing/tokens and source fingerprints are in `docs/evals/qwen-cpu-pilot-2026-10-09-*.json`; user artifact `movefield-qwen3-evidence-pilot.zip` saved separately. CPU greedy results do not qualify the different WebGPU artifact or the demo's sampling. The demo still uses the publisher model.

Checks: 33/33 regression before last worker/selector repairs; focused 91 runtime/520 training assertions/38 shared hashes and relevant types/lint/build/production rerun. 182 real WASM-tokenizer prompts (max 501 tokens), actual browser-target initialization/tokenizer inspected with standard API fixtures. Final build and production 2/2 pass below 400,000 gzip bytes. Logs `.sites-runtime/u08b-*`; full reports `docs/qwen-demo-2026-10-09.md`/`.json`; recoverable full-history checkpoint `.sites-runtime/checkpoints/u08b-complete.bundle`. Verify final remote head/tree and report readback before saying pushed.

Next short prompt: Resume Movefield here, verify live refs/changes and preserve concurrent work. U12/U13/U14 are pushed; U08b implementation plus actual CPU training/evaluation are checked. Finish trained-adapter merge/MLC conversion/new pinned manifest, final artifact and secure-WebGPU device qualification, then native runtime and physical-phone usability/storage acceptance. Keep held-out questions/answers out of training, retain strict source-ID and deterministic training authority, and distinguish the publisher demo from the CPU adapter. No main merge, deployment or account service provisioning has occurred.

## Latest milestone — U14 named programs

Independent checkout `/workspace/scratch/855d6d943ad0/movefield-continuation`, local branch `audit/2026-10-09-continuation`, baseline `aba25b02cde3d8717de1eda36a365684dd96625c`; publish to existing remote `audit/2026-10-08-quality` with expected-head guard. The original checkout gained overlapping edits; all were copied to this isolated clone and reviewed without overwriting its files. Root dependencies copied into the clone to restore supervised preview; native dependency link retained. Standing push permission applies.

U14: 20 source entries, 8 prefilled manual variants, 12 source calendars. Three initial choices/search/details, native duplicate picker removed; rolling cycles, equipment/time/recovery constraints and source-role edits checked. Reports `docs/named-programs-2026-10-09.md`/`.json`. Passed 3,582 named assertions; initial regression 29/31, both failed suites corrected/passed on targeted rerun; web/native types/lint, 38 shared hashes, native engine, build/production 2/2 (391,201 gzip bytes), Android/iOS 4.3 MB exports. Browser sample search/review/accept/Today observed. Protected profile preserved; no phone/secure-account acceptance. Logs `.sites-runtime/u14-*`. Recoverable checkpoint after commit `.sites-runtime/checkpoints/u14-complete.bundle`. Verify remote tree/head/report readback before reporting pushed.

Next short prompt: Resume Movefield in this isolated checkout. Verify refs and preserve concurrent remote work. Implement U08b optional Qwen demo with the strict default prompt, verified cache-only asset consumption, real runtime cancellation and evaluation/training work. Keep training and actual inference/device qualification distinct. No main merge, deployment or account service provisioning has occurred.

## Latest milestone — U13 evidence archive and forum feedback

Baseline `8da26f2fd8dc859947b0c29195ac8b3d5fc69501`; same checkout and audit branch. Added 855 deduplicated PubMed-indexed records, 718 first published in 2025–2026, 18 exact query/fingerprint ledger entries, web/native local search, 7 original reviewed notes (fitness corpus v2), updated plan evidence mappings and 10-thread original feedback ledger. Selected abstracts are distinct from unreviewed search records; the metadata index is not model context/training. No full-text/paid-program copying or automatic scientific validation of templates. Reports: `docs/research-archive-2026-10-09.md`/`.json`, `docs/research-reviewed-2026-10-09.json`, `docs/forum-feedback-2026-10-09.json`.

Passed web/native types, lint, metadata/search checks, 645 goal/evidence, 256 grounding, 21 synthetic grading, 38 shared hashes, native engine, production build/both production suites (386010 gzip bytes initial graph), Android/iOS 4.3 MB Hermes exports. Browser sample Sources/PMID/recent filter and resumable workout observed. Screenshot inspected, saved and attached-file availability verified. Tests use synthetic responses; no actual model accuracy, training, device or real-account acceptance. Exact source fingerprints and limits are in the report. Recoverable checkpoint after commit: `.sites-runtime/checkpoints/u13-complete.bundle`; resolve exact commit with Git history and independently verify remote head/tree/readback after the standing-authorized push.

Next short prompt: Resume Movefield here. Verify refs and changes, then implement U14 source-attributed public named-program schedules and honest manual progression, web/native parity and relevant tests. Checkpoint/push before U08b. Preserve Today-first compact UI, recovery boundaries, held-out model evaluation separation and existing release/device limits. No merge/deploy or account-service provisioning has occurred.

## Latest milestone — U12 Today and compact UI

Current checkout/branch unchanged. Baseline `3681258a6095d977e67b0f1d8c6fadfd135fbff1`; U12 source/observations/results are in `docs/ux-today-entry-2026-10-08.md` and `.json`. Web/native types/lint, onboarding/security/shared checks, native engine, production build/both production suites and iOS/Android exports pass. Browser sample Today, set navigation retention, partial finish and profile/setup entry observed. Screenshot inspected but local shared-file sync failed. No physical-phone or secure-storage/account acceptance. Resolve the checkpoint from this report's Git history, and verify remote/tree/readback; standing push permission applies.

Next: U13 recent evidence/archive search and source-screening ledger, then U14 public attributed named-plan data and U08b Qwen runtime/training work. One independently checked/pushed milestone at a time. No fine-tuning or actual inference is complete yet; preserve safety/qualification gates and exact data provenance.

## Latest authorization and publication — 8 October 2026

User explicitly grants full standing permission to **always push the work**. Do not re-request push permission. Recovered audit/U08a2 source is on GitHub at `3681258a6095d977e67b0f1d8c6fadfd135fbff1`, identical tree `9a2e68b95222f7bd5be082bed95b8c60e1d3d0f4` to former local `861cd78`. Git CLI push failed for absent login; connected GitHub create-tree/commit/ref succeeded, remote head and report readback verified. Original local three commits are retained under `backup/u08a2-local-861cd78` and the verified bundle. Current continuation branch now follows the connector checkpoint with identical files.

New scope: reduce oversized/cluttered web and phone UI, open on Today, improve setup/account entry/workout selection, research hundreds of recent papers and exercise archives, expand attributed named plans, inspect forum complaints, and make Qwen work in the demo with a default prompt and real training work. U12 and U13 are complete; U14/U08b follow as independent checked/pushed milestones. Do not claim training or inference from corpus/prompt construction. App accounts/sync and physical-phone acceptance remain unavailable; release blockers and separate main merge/deployment boundary remain.

The earlier U12 continuation below is historical. Use the current milestone at the top.

## Previous milestone — U08a2 browser file controls and source recovery

Current independent checkout `/workspace/scratch/855d6d943ad0/movefield`, branch `audit/2026-10-08-continue`, tracking `origin/audit/2026-10-08-quality`. Application checkpoint `65232aae0fab994f00ca725497caf39886e5d027`; recovered baseline `5c117e4fb3ea490326cb92be8a8bb377f564c409`. Last verified remote head remains `8cd39e42f2178b807d63af2042b70481041b028b`; draft PR #1 targets `main` at `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`; review-fixes remains `667a3e381035b16cb1aa611c85cdf9d143b7b835`. Original local metadata disappeared with the deleted base checkout. Preserved source matched all 11 U08a1 fingerprints and was recovered on the live remote baseline without modifying the older worktrees. Original local commit/staging state is not recoverable. This checkout owns its Git metadata, rather than pointing to another scratch directory.

Implemented lazy Settings file controls for the first planned Qwen3 0.6B browser artifact (356,920,759 bytes), separate exact download review/confirmation, progress/cancel/retry/delete/Off, stale/duplicate/collision/cleanup guards, and an observed exact publisher/CDN policy. No Automatic/Off/mount/status action downloads files. Download completion never enables inference. Explicit Delete keeps workouts and preferences. Other models remain unavailable until qualification. U08a1 service and U07 fingerprints are preserved.

Passed: 132 controls/policy, 190 download, 74 IndexedDB-adapter, 29 security, 31 offline, 1,675 artifact/qualification, 221 grounding and 21 synthetic grading assertions; 36 canonical/native hashes; web types/lint; managed production build; all 29 regression and both production suites. Initial graph is 388,537 gzip bytes under 400,000, with the optional model cache/hash/catalog out of the initial graph. Reports and source/log hashes: `docs/model-download-controls-2026-10-08.md`/`.json`, `docs/qwen-endpoints-head-2026-10-08.json`, and `docs/qa/u08a2/`. Existing locked dependencies were reused locally; no dependency inputs, fresh install, new CI/native export/device acceptance claimed. Historical content reports remain preserved.

Actual Chrome HTTP preview: sample Settings/manager opened, HTTPS blocker shown without file requests, Off applied/Automatic restored, Enter closes file controls; existing dark mode/130% text readable and 1348 px document has no horizontal overflow. Secure download/IndexedDB/Web Locks, full keyboard/screen-reader/reflow, physical quota/OS interruption remain pending. Browser zoom shortcuts did not change viewport; do not claim 200%/phone acceptance. Sample entry also shows an existing inherited save-paused notice; retain this recovery/UI follow-up. Metadata-only HEAD/CORS checks reached publishers; no model bodies/weights, inference, training, memory/GPU/speed/accuracy or qualification were measured.

Exact documentation checkpoint: `git log -1 --format=%H -- docs/model-download-controls-2026-10-08.md`. Recoverable bundle after this documentation commit: `.sites-runtime/checkpoints/u08a2-complete.bundle`; inspect `.sites-runtime/checkpoints/u08a2-checkpoint.json` and verify the bundle before relying on it. These are local, not a pushed or durable remote checkpoint. Automatic approval review previously rejected source export for missing explicit push permission. Ask for the concrete completed range before pushing; no workaround, merge or deployment. Advisory roots still block release, and S02/U09 remain required.

Next short prompt: “Resume Movefield in `/workspace/scratch/855d6d943ad0/movefield` on `audit/2026-10-08-continue`. Read AGENTS/TASKS/HANDOFF, verify HEAD/upstream/remote/changes and the recoverable bundle. U08a2 application is `65232aae0fab994f00ca725497caf39886e5d027` with saved results. Complete U08b verified WebLLM worker loading in a bounded tested slice, then real secure-browser task/tokenizer/context/memory/latency/interruption qualification. Preserve U07 and download gates; no silent requests/uploads or untested larger tiers. Secure download acceptance, S02/U09 and advisories remain open. Ask for explicit permission to push the completed recovered source range to the existing audit branch after the prior review rejection; no merge/deploy.”

## Previous milestone — U08a1 verified browser model-download foundation

Parent local checkpoint `a4a56c16039b121b9179d5c9e0c1610207608f65`; current isolated checkout `/workspace/scratch/205446dc0ae6/movefield`, branch `audit/2026-10-08-resume`, tracking `origin/audit/2026-10-08-quality`. GitHub draft PR #1 still targets `main` at `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`; review head remains `8cd39e42f2178b807d63af2042b70481041b028b`. The earlier checkout's separate validation-document commit `54980d68cbbdbd1a605dbb9dc6ac517387e1500b` remains preserved on `audit/2026-10-08-integration`; no files or dependencies there were changed. Resume this branch to retain M04 and the new service.

Added `lib/qwen-download.ts` and `lib/browser-qwen-cache.ts`: snapshots of four pinned web manifests, an exact model/manifest-fingerprint/byte consent tuple, cookie-free/referrer-free GETs, incremental size/SHA-256 checks, cancellation/idle timeout, quota errors, dedicated chunked IndexedDB, exclusive per-model Web Locks and atomic completion pointers. Incomplete/obsolete attempts are isolated and cleaned in 128-key transactions with resumable markers. Failed replacement preserves the prior complete model; explicit Delete forgets availability before removing files, and interrupted deletion resumes on opening. Verified file reads re-hash cached bytes and apply a caller-supplied loading limit before returning an ArrayBuffer. The native snapshot includes the catalog's metadata type update; browser adapters stay browser-only.

Passed: 190 lifecycle assertions, 74 IndexedDB-adapter assertions with pinned `fake-indexeddb 6.2.5`, all 28 regression suites, web/native TypeScript, lint, 1,675 Qwen metadata/qualification assertions and 36 shared-file hashes. The dependency gate returns success only with the two existing temporary exceptions; both remain release blockers. Existing locked dependencies were reused, with an integrity-verified test-only dependency added in this checkout. No clean install, new CI/production build, device run, real weights, model output, measured GPU/memory/latency or inference qualification is claimed. The integrated runner's stdout again ends partway through; its current 28/28 results JSON and direct cache-suite reports are preserved.

Report and exact source fingerprints: `docs/qwen-download-foundation-2026-10-08.md` and `.json`, with check results in `docs/qa/u08a1/`. Historical content-test report files were restored after verification. The product has no new download screen or network allowance: U08a2 must collect actual user opt-in and wire the service with a narrowly scoped policy; U08b must load through the verified boundary and measure the real task. The currently supervised HTTP preview is from the earlier checkout and blocks secure storage; it is not acceptance evidence for this new adapter. Configure this checkout's managed preview before new UI checks.

Exact local checkpoint: `git log -1 --format=%H -- docs/qwen-download-foundation-2026-10-08.md`. Source/documentation is not pushed. Prior automatic approval review rejected the GitHub export because explicit permission was missing; request permission for the concrete completed range before pushing. No workaround, merge, deployment or direct message to bro.

Next short prompt: “Resume Movefield in `/workspace/scratch/205446dc0ae6/movefield` on `audit/2026-10-08-resume`. Verify AGENTS/TASKS/HANDOFF, refs and changes. Complete U08a2 lazy model-download controls with exact opt-in, cancellation/delete/off and narrowly scoped publisher/CDN policy, preserving the tested U08a1 service. Then U08b verified WebLLM worker loading and actual device/task qualification. Keep U07 fingerprints and deterministic training authority; no workout uploads or unsupported tier claims. Native S02/U09 and advisory remedies remain required. Obtain explicit approval before pushing the completed range; no merge/deploy.”

## Previous milestone — V01 combined application validation

Tested application `aa57726f7d0615a47587758c8c9a965e2c5c7ed0` on local `audit/2026-10-08-resume`, tracking `origin/audit/2026-10-08-quality`. All 26 regression suites, both production checks, web/native TypeScript, lint, native engine and Android/iOS Metro/Hermes exports pass. Initial web graph is 387,165 gzip bytes within the 400,000-byte budget. The generated mobile source ZIP and rotating matching CSP nonces are verified; forbidden routes remain closed. Reports: `docs/integrated-validation-with-capacity-2026-10-08.md` and `.json`. Current content-test reports are saved separately under `docs/qa/v01-with-capacity/`; historical files are preserved.

Existing locked dependencies were reused; this is not a fresh clean install or CI run. Build used the checkout's portable path. No fresh actual-browser/phone acceptance, model weights/inference/training/qualification, signed binary or sync test occurred. Dependency gate passes only with the two existing exceptions; both roots still block release. SQLite history migration remains pending.

Exact validation documentation checkpoint: `git log -1 --format=%H -- docs/integrated-validation-with-capacity-2026-10-08.md`. Remote remains last verified `8cd39e42f2178b807d63af2042b70481041b028b`; explicit export approval needed before pushing the concrete local range. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in `/workspace/scratch/205446dc0ae6/movefield` on `audit/2026-10-08-resume`. Read AGENTS/TASKS/HANDOFF, verify refs/changes and the V01 tested SHA. Complete U08a verified optional browser model cache/download/cancel/delete in a tested slice, then U08b actual WebLLM worker inference and device qualification. Preserve U07 fingerprints, no-data-upload and deterministic training authority. Native S02/U09 require further storage/toolchain/device work. Explicit approval is needed to push the completed range; no merge/deploy.”

## Previous milestone — M04 native capacity and failed-save recovery

Parent local checkpoint `a36fc005b3a68e1d4249096c6391819171d4ab25`. The earlier session was still writing to the integration checkout, so continuation used an isolated worktree `/workspace/scratch/205446dc0ae6/movefield`, branch `audit/2026-10-08-resume`, tracking `origin/audit/2026-10-08-quality`. Its completed U07/M05/M06 checkpoints were incorporated by a clean rebase before this checkpoint; no earlier-session files were edited. Resume from this branch, rather than losing M04 by using the older integration HEAD.

Added an exact UTF-8 encrypted-envelope size check before native save/restore/setup/key creation. Oversized legacy records remain readable and exportable. Failed saves retain current edits in memory, show an explicit recovery panel, offer retry for transient failures, and put transfer/backup before Appearance in Settings during recovery. Startup opens valid saved records without rewriting the whole history. This is an interim 1,750,000-byte row guard, not a capacity increase or guaranteed phone quota. S02 transactional SQLite history remains required. Report: `docs/native-capacity-recovery-2026-10-08.md`.

Passed: focused native storage/restore harness including eight recovery snapshots, 312 synthetic sessions (1,658,824 encrypted bytes), exact boundary/Unicode preflight, oversized save/restore/setup, full-disk retry, legacy preservation and export of unsaved records. Native TypeScript, lint, native engine (78 plans across seven starting weekdays), 45 transfer and 29 security checks, canonical/native hashes and Android/iOS Metro exports pass. No physical-device quota, screen-reader/keyboard/reflow or signed Android binary acceptance is claimed.

Exact local checkpoint: `git log -1 --format=%H -- docs/native-capacity-recovery-2026-10-08.md`. Last verified remote remains `8cd39e42f2178b807d63af2042b70481041b028b`. New local source/documentation is not pushed; automatic approval review previously rejected that export for lack of explicit permission. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in `/workspace/scratch/205446dc0ae6/movefield` on `audit/2026-10-08-resume`, tracking `audit/2026-10-08-quality`. Verify AGENTS/TASKS/HANDOFF, HEAD/upstream/remote and changes. Complete V01 integrated regression/build/security/native-export validation, checkpoint locally, then U08 verified web downloads/worker inference in bounded slices. S02 SQLite migration and actual device/inference qualification remain required. Explicit approval is needed to push the concrete completed range; no merge/deploy.”

## Previous milestone — M06 native dependency recheck

Parent documentation checkpoint `4105086958c9df67de919ef758259bf02be0a2a7`; application remains `4b92b0a4db915b8ea5b75ca5702b063e7c6f8677`. Fresh native audit confirms 15 affected high entries from braces/node-forge, zero moderate/critical findings. Registry latest 3.0.3/1.4.0 and official no-patch status remain unchanged. Three installed Metro/CLI/certificate paths, raw audit fingerprint and incompatible downgrade remedies are recorded in `docs/native-dependency-review-2026-10-08.md` and `.json`. No code/package/lock change. Audit/registry/installed-path/source/JSON/diff checks completed; no app test attributed to a documentation-only change.

M06 review/documentation is complete; release remains blocked by both roots and real Android build/signing/device acceptance. CI exception ends 8 November 2026. Exact local checkpoint: `git log -1 --format=%H -- docs/native-dependency-review-2026-10-08.md`. Last verified remote is `8cd39e42f2178b807d63af2042b70481041b028b`; explicit push approval required. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree. Verify AGENTS/TASKS/HANDOFF, branch/commits and remote. Run final integrated regression/build/security/native-export validation for the new application range, record remaining release/device/inference blockers and checkpoint. Then U08 verified web model download/worker inference in bounded slices; U09 needs a native development toolchain/device. Use U07 exact evaluation fingerprints and actual tokenizer/memory measurements. Push needs explicit approval; no merge/deploy.”

## Previous milestone — M05 web dependency recheck

Parent/application checkpoint `4b92b0a4db915b8ea5b75ca5702b063e7c6f8677`. Fresh web audit still reports one high braces root; registry latest is 3.0.3 and official GHSA-vfj7-8cjw-p6xm lists no patched version. Both installed lint/build paths, raw audit fingerprint and required next remedy validation are saved in `docs/web-dependency-review-2026-10-08.md` and `.json`. No package/lock/application code was changed. Audit, registry, paths, source and JSON/diff checks completed; no new app build attributed to this documentation milestone.

M05 review/documentation is complete, while release remains blocked. The CI exception expires 8 November 2026 and is not a launch waiver. Resolve this local checkpoint with `git log -1 --format=%H -- docs/web-dependency-review-2026-10-08.md`. Remote remains last verified `8cd39e42f2178b807d63af2042b70481041b028b`; explicit push approval required. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree. Verify AGENTS/TASKS/HANDOFF, branch/commits and remote. Complete M06 precise native braces/node-forge path and remedy review in its own checkpoint. Run the final integrated validation for the new application range and save the continuation point. U08/U09 actual inference remains open; use U07 exact evaluation fingerprints and device measurements. Push needs explicit approval; no merge/deploy.”

## Previous milestone — U07 grounded evidence/evaluation foundation

Parent local checkpoint `d012ced532792b31726640a80eec459a67745f12`. Added nine original sourced notes and one disabled bibliography record, population/source/payload-bounded offline retrieval, a strict evidence-ID selection contract and 22 held-out accuracy/safety/injection cases. Reply rendering resolves canonical authored explanations; arbitrary model advice, URLs/tools/state changes are refused. The request preserves the existing adult/complete/app-owned/no-concern engine gate and checks current-context staleness. No UI or runtime calls this yet. Report: `docs/fitness-grounding-2026-10-08.md`.

Passed: 221 provenance/retrieval/current-context/engine-gate/fixture assertions; 21 synthetic raw-result grading assertions; 1,675 Qwen metadata/qualification assertions; all 36 canonical/native file hashes, web/native TypeScript, lint and pre-commit whitespace check. Grading requires 66 rows, actual token/time data and exact corpus/contract/suite fingerprints; human and memory/interruption review remain required. The initial ordinary-miss test assumption was corrected to match the explicit 90% accuracy/100% critical policy. All model replies/measurements used in tests are synthetic. Zero actual inference results or device qualifications; no training or weight download.

Exact local checkpoint: `git log -1 --format=%H -- docs/fitness-grounding-2026-10-08.md`. Remote is last verified `8cd39e42f2178b807d63af2042b70481041b028b`; explicit approval is required to push the concrete source/documentation range. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree tracking `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify local commits/remote/changes. Recheck M05/M06 current dependency release blockers in separate tested checkpoints; prepare U08 verified web download/worker inference in bounded slices and U09 a native development build when the Android toolchain/device is available. Use the U07 held-out suite and deployed tokenizer/context limits; do not invent model accuracy or device qualification. Explicit approval is needed to push the completed range. No merge/deploy.”

## Previous milestone — U06 Qwen asset/runtime verification

Parent local checkpoint `ae6fd1d1603efc05467e18d953607af5f3cfb084`. Seven selected web/Android candidates now have immutable artifact URLs, exact bytes/hashes, deployed context limits and current runtime/API/license evidence. The shared qualification selector requires matching measured device/build/runtime/model/context/evaluation records; empty records select no model. Report: `docs/qwen-runtime-verification-2026-10-08.md`. Native candidate runtime is ExecuTorch 0.10.4, web is WebLLM 0.2.85; neither is installed or invoked by the app yet.

Passed: 1,672 manifest/synthetic-selector assertions, all 33 canonical/native file hashes, web/native TypeScript, product lint and pre-commit whitespace check. No weight download, actual inference, training or hardware qualification was performed. Native SDK/adb/Gradle/emulator/physical device are unavailable; browser GPU is unmeasured. Published VRAM estimates are not measured peak app memory. U08/U09 remain open.

Exact local checkpoint: `git log -1 --format=%H -- docs/qwen-runtime-verification-2026-10-08.md`. Remote remains last verified `8cd39e42f2178b807d63af2042b70481041b028b`; explicit approval is required to push the source/documentation range. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree tracking `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify local commits/remote/changes. Complete U07 original sourced exercise-science summaries, bounded retrieval and held-out accuracy/safety/injection cases; checkpoint locally. Then connect U08/U09 actual inference in tested slices. Preserve deterministic training and adult/youth/coach gates; do not invent training or hardware qualification. Explicit approval is needed to push the concrete range. No merge/deploy.”

## Previous milestone — M03 native restore recovery

Parent local checkpoint `8836240fcab12710edab852576a4dee54be302c7`. Added a small SecureStore two-key ring and encrypted/fingerprint-only AsyncStorage journal. Fresh-module recovery retains the old state or finishes the restore; failed cleanup hides obsolete setup and pauses edits while allowing restored history to open. Reads are serialized with recovery. Existing cipher/storage identity remains compatible. Report: `docs/native-restore-recovery-2026-10-08.md`.

Focused storage checks pass eight fresh-module snapshots and finalization/cleanup/collision/legacy/key-loss cases. Native TypeScript and product lint pass; Android/iOS Metro export and whitespace checks are confirmed before committing. These are injected persistence checks and bundle exports, not physical phone/Keystore/power-loss or signed-binary acceptance. M04/S02 history capacity/database migration remains open.

Exact local checkpoint: `git log -1 --format=%H -- docs/native-restore-recovery-2026-10-08.md`. Remote is still last verified `8cd39e42f2178b807d63af2042b70481041b028b`; explicit approval is required to push the new source/documentation. No workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree tracking `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify local commits/remote/changes. Complete U06 current Qwen asset/runtime/license/capability verification; checkpoint locally. Continue U07 a sourced reference corpus and held-out evaluation set, then connect U08/U09 actual inference in tested slices. Do not invent device qualification or model training. Explicit approval is needed to push the completed range. No merge/deploy.”

## Previous milestone — M02 browser restore recovery

Parent local checkpoint `271c63b660b2b8ef92e02d1106928d0d29eb7e5a`. Added an IndexedDB key/ciphertext-fingerprint journal, fresh-start roll-back/finish recovery, cleanup retry/read behavior and Web Locks restore gating. Stable encryption format, legacy reads and deterministic training rules remain intact. Report: `docs/browser-restore-recovery-2026-10-08.md`.

115 vault assertions pass, including six independently reopened persistence-boundary snapshots, quota/finalization/cleanup failures, key-loss restore and legacy privacy. Transfer checks 45 and security checks 29/29 pass. Web type/lint/whitespace checks are completed before commit. The initial IndexedDB return-type mismatch was fixed and rerun. Actual browser IndexedDB durability/restore UI and OS interruption remain unverified; no phone or full power-loss certification.

Exact local checkpoint: `git log -1 --format=%H -- docs/browser-restore-recovery-2026-10-08.md`. Remote remains last verified `8cd39e42f2178b807d63af2042b70481041b028b`; automatic approval review blocks pushing the new source/documentation until explicit approval. No retry workaround, merge or deployment.

Next short prompt: “Resume Movefield in the integration worktree tracking `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify local commits/remote/changes. Complete M03 native interrupted-restore recovery with fresh-module SecureStore/AsyncStorage tests, then U06 Qwen models/runtime verification. Keep one milestone active and checkpoint locally. Obtain explicit approval before pushing the concrete commit range. No merge/deploy.”

## Previous milestone — U05 storage architecture

Selected encrypted offline-first transactional storage: IndexedDB on web, SQLite for growing native history, device-local keys and optional managed Postgres/Supabase account sync. No account/service/charges/uploads were enabled. The decision, current locations, six compared options, recoverable outbox/conflict/key flow and S01–S05 implementation split are in `docs/storage-architecture-2026-10-08.md`. This is documentation-only; actual account sync and transactional migration remain incomplete.

U04b is committed locally at `8229f76f45fa47518e5f201bb34139db991250b0`. Automatic approval review rejected its push because explicit approval to export this source/documentation to the remote was missing. `git ls-remote` independently confirmed remote `audit/2026-10-08-quality` still at `8cd39e42f2178b807d63af2042b70481041b028b`; main/review-fixes remain unchanged. No workaround/retry was used. Local commits are recoverable in this worktree but not a durable remote save.

U05 checks: actual storage/database/HTTP boundary inspected; official provider/runtime documentation checked; document paths/tasks and whitespace diff checked. Resolve this local checkpoint with `git log -1 --format=%H -- docs/storage-architecture-2026-10-08.md`. Do not claim it is pushed. No merge/deployment.

Next short prompt: “Resume Movefield in the integration worktree tracking `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF, verify refs and local unpushed commits. Complete M02 crash-recoverable browser restore with fresh-vault failure-boundary tests; checkpoint locally. Then M03 native and U06 Qwen qualification. Remote push requires explicit approval after the concrete commits are ready. No merge/deploy.”

## Previous milestone — U04b current evidence mapping

Recovered the frozen chat at `8cd39e42f2178b807d63af2042b70481041b028b`. The worktree was clean, HEAD/upstream matched live GitHub draft PR #1, and main/review-fixes were unchanged. Local branch `audit/2026-10-08-integration` tracks GitHub `audit/2026-10-08-quality` in `/workspace/scratch/37008205acde/movefield-integration`.

Completed: 2019 hypertrophy-frequency and 2026 dose-response evidence mapped to applicable goals; ACSM 2009/2016 frequency preserved as historical entries and excluded from current mappings. Canonical/native mapping is synchronized. No workouts or saved prescriptions changed. Report: `docs/evidence-mapping-repair-2026-10-08.md`.

Tests: 9 goal/evidence groups and 580 assertions, 31 canonical/native file hashes, web/native TypeScript and product lint pass. Whitespace diff checked before commit. No fresh rendered Sources-panel or physical-device acceptance claimed. Exact recoverable checkpoint: `git log -1 --format=%H -- docs/evidence-mapping-repair-2026-10-08.md`, then verify remote head and file readback; do not infer a push from this document alone. No merge/deployment.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify refs/changes. Complete U05: compare and choose storage with a recoverable offline-first flow, then checkpoint and implement M02 browser crash-recoverable restore. Follow with U06 Qwen runtime/model verification and U07 evidence corpus. Keep one milestone active and verify each pushed checkpoint. No merge/deploy.”

## Previous milestone — U04a generated plan fit

Parent `95571a5ecf2cd4d5a5fab3dbf8c60924452f7cf2` is pushed/verified. Exact checkpoint: `git log -1 --format=%H -- docs/plan-fit-repair-2026-10-08.md`, then compare remote/status. Changed canonical/native onboarding fit helpers and native snapshot, plus two regression cases. PLU3's actual 50-minute draft now fits a 75-minute window instead of displaying stale 80-minute catalog text. Ranking uses the generated block, including later weeks.

14 onboarding checks, 31 shared-file checks, web/native types, lint, native engine and Android/iOS Metro exports pass. Actual browser recheck was interrupted by a development preview reload; no new rendered acceptance or phone test claimed. Report `docs/plan-fit-repair-2026-10-08.md` records limitations. No merge/deployment.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF, verify refs and changes. Complete U04b: add verified 2019 frequency and 2026 volume evidence to current plans, remove superseded ACSM 2009 from current mapping while retaining history. Sync native, test source mapping/parity and types, checkpoint/verify; then U05 storage and Qwen milestones. No merge or deploy.”

## Previous milestone — U03 workout foundation evidence audit

Parent `243dfaa5ca697c293644f6b556fc6f22dd05e241` is pushed/verified. This audit checkpoint contains `docs/workout-evidence-audit-2026-10-08.md`; resolve exact SHA with `git log -1 --format=%H -- docs/workout-evidence-audit-2026-10-08.md` and verify remote/status. Saved inventory: `docs/workout-coverage-2026-10-08.json`; canonical generator `scripts/audit-workout-coverage.cjs`.

Completed: ten primary-source ledger entries with retrieval limits, 75 matching-profile builds and 3150 availability/time inventory builds, weekly frequency mapping, product-vs-research progression/recovery review. Existing 75-program structural audit passes with explicit low-dose/anatomy allowances. No application prescription changed; no clinical validation or AI training claimed. Observed gaps: nominal times differ from generated maximum in 62 programs; newer volume/frequency evidence not mapped; anatomy, one-day/five-day choices, guides/sport/endurance/special-population and model evaluations still need work.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and the U03 evidence audit; verify refs/changes. Complete U04a: calculate fit notes/ranking from the generated draft, not stale catalog times. Test PLU3 time mismatch, preserve generator budget guards and sync native canonical code. Checkpoint/verify, then U04b evidence mapping, U05 storage and U06–U09 Qwen. No merge or deploy.”

## Previous milestone — U02b native controls

Parent `acd95cb4e1d93f52b699324232980f81be98c214` is pushed/verified. This source checkpoint contains `docs/ux-native-controls-2026-10-08.md`; resolve the exact SHA with `git log -1 --format=%H -- docs/ux-native-controls-2026-10-08.md`, then verify remote head and existing changes. Code: `mobile/App.tsx`.

Completed: labeled wrapping numeric field groups, full-width Log controls, persistent finish/count/rest controls outside the scroll list, collapsed rest-alert options, active training before historical summary. Native types, engine, Android/iOS Metro exports and root lint pass. Generated `mobile/dist-mobile` and `public/downloads/movefield-mobile-r14.zip` are local-only ignored outputs, reproducible from saved source. They are not signed Android/iOS binaries. Physical-device/keyboard/font-scale/TalkBack acceptance remains pending; the report records the initial wrong-directory patch and post-edit rerun accurately.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and verify refs/changes. Complete U03: primary-source workout evidence ledger and generated weekly-day/dose/progression coverage; separate product heuristics from studied prescriptions and identify the highest bounded gap. Save/verify GitHub checkpoint, update handoff and continue U04, then storage/Qwen milestones. No merge or deploy.”

## Previous milestone — U02a web controls

Parent `701c8b8a7a77c19e1be6ce17effd702917fbe3ff` is pushed/verified. This application checkpoint contains `docs/ux-web-controls-2026-10-08.md`; resolve its exact SHA with `git log -1 --format=%H -- docs/ux-web-controls-2026-10-08.md`, compare remote head, and check existing changes. Code: `app/page.tsx`, `app/globals.css`. Evidence: `docs/qa/u02a-workout-after.jpg`.

Completed: collapsed optional calculators/guidance, sticky finish/rest actions, floating Appearance removed from the workout surface. Browser verifies log/undo/partial-save, paused rest and sticky position while scrolled; first Log moves up ≈870px. Tests: web types, lint, 29 training checks and 7 revision-11 groups/428582 assertions pass. Historical validation JSON retained. No fresh production-build claim; no physical-phone or real-profile persistence acceptance. See the report for the initial nonexistent script attempt and remaining layout limits.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF, verify refs and changes. Complete U02b: native labeled set-entry groups, full-width log action and persistent finish/rest controls; preserve existing finish confirmation and deterministic training behavior. Run native types/engine/export and product lint, checkpoint/verify GitHub and update handoff. Then continue U03 evidence audit. No merge or deploy.”

## Previous milestone — U01 UX baseline

Parent checkpoint: `c9679d50c161a4407c3e4ca8dd70bc5d89d277e6`, pushed and verified. Application source remains `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`. The U01 documentation/evidence checkpoint is the commit containing `docs/ux-baseline-2026-10-08.md`; resolve `git log -1 --format=%H -- docs/ux-baseline-2026-10-08.md`, then verify remote head.

Completed: actual supervised browser sample navigation/start/log/undo/partial-save/setup/settings observations, prioritized web/native source findings, and saved synthetic sample screenshot `docs/qa/u01-workout-before.jpg`. Checks: preview ready, observed 0→1→0 set count, partial save preserves only completed work, document/screenshot existence, whitespace diff, fresh remote refs. No new application code or fresh application test claim. Native source inspection is not phone acceptance.

Limits: HTTP internal preview lacks Web Crypto, so saved-profile/reload/restore acceptance remains blocked. No physical phone UI surface; small-screen/keyboard/TalkBack remain pending. First web log action is below expanded calculators at y≈1987px; floating Appearance crowds rest controls; native finish follows the entire long log and rows risk wrapping. See the baseline report for evidence and additional copy defects.

Next short prompt: “Resume Movefield on `audit/2026-10-08-quality`. Read AGENTS/TASKS/HANDOFF and `docs/ux-baseline-2026-10-08.md`; verify refs and existing changes. Complete U02 in small slices: prioritize set logging, collapse optional calculators, make finish/rest controls reachable and improve native set rows. Run relevant UI/type/regression checks, checkpoint and verify GitHub, update handoff, then continue U03. Do not merge or deploy.”

## Required milestone workflow

Read `AGENTS.md` and `TASKS.md`. The user requires small, independently testable milestones, one at a time, with verified recoverable checkpoints and this handoff updated after each. Continue approved work without asking the user to invent prompts. Do not merge or deploy without permission.

## Verified application checkpoint

- Repository: `ghinz32-cloud/movefield`, remote `https://github.com/ghinz32-cloud/movefield.git`.
- Pushed application commit: `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`.
- GitHub branch: `audit/2026-10-08-quality`; draft PR `https://github.com/ghinz32-cloud/movefield/pull/1`, base `main`.
- Local worktree: `/workspace/scratch/37008205acde/movefield-integration`, local branch `audit/2026-10-08-integration`, tracking `origin/audit/2026-10-08-quality`. This scratch path is transient; use the GitHub checkpoint in a new environment.
- Existing changes were checked before this documentation milestone: the application checkout was clean and matched the pushed commit.
- Integration parents: audit `cc36ff73715eec1d0e278668d2f81f11c5ba19f8` and feature `667a3e381035b16cb1aa611c85cdf9d143b7b835`. M01 reconciliation is complete. `review-fixes` and `main` are preserved.

## Completed milestones and tests

- **M01 application integration:** retained feature updates and audit repairs, added stale/active restore guards, isolated offline caching and corrected the current mobile download link. Local web/native types, lint, all 23 regression suites, both production suites and iOS/Android exports passed. GitHub Actions quality run **4**, ID **37846922697**, succeeded for the application commit above.
- **M00 workflow documentation:** added `AGENTS.md`, `TASKS.md`, and this current handoff section. Relevant checks are documentation structure, exact checkpoint references, a whitespace diff check and remote content readback. No new application behavior is introduced; M01's application tests must not be presented as a fresh test run for this documentation commit.

## Checkpoint locations and status

The recoverable application checkpoint is pushed to the GitHub review branch above, with its reports under `docs/branch-integration-2026-10-08.md` and `docs/branch-integration-validation-2026-10-08.json`. Local-only build/test logs from M01 are under `/workspace/scratch/1e916c3f78bc/integration-*.log`; they are transient and are not uploaded deliverables. GitHub's successful quality run is independent saved evidence.

The workflow documentation checkpoint is the commit containing this section, `AGENTS.md` and `TASKS.md`. Resolve its full SHA with `git log -1 --format=%H -- AGENTS.md TASKS.md HANDOFF.md`, then compare the current remote head and inspect existing changes. The exact documentation commit is recorded in the PR description and completion message only after push/readback verification. A document cannot embed its own eventual Git commit hash; this lookup is deliberate, not a guessed checkpoint ID.

Do not infer that later commits were tested from an earlier passing run. At every milestone, record the application commit actually tested and distinguish local-only changes, pushed commits, merges and deployments. No merge into `main` or deployment was performed.

## Unresolved problems

The latest user request expands work to a full web/native UX and workout audit, practical large-Qwen integration, exercise-science grounding, storage selection and website/Android release readiness. U01 is recorded above; start U02 next. Interruption recovery between encryption-key replacement and ciphertext persistence remains a high-priority repair. Web/native crash recovery, native history capacity, two dependency advisory roots, offline/browser restore UI and physical-device acceptance remain open; see the individually testable milestones in `TASKS.md`. The dependency exceptions expire 8 November 2026. Accounts/sync, broader planning features and model inference remain unfinished. No direct connection to bro is available; GitHub branch verification is documented instead.

## Exact short prompt for the next task

> Resume Movefield from `ghinz32-cloud/movefield` on `audit/2026-10-08-quality`. Read `AGENTS.md`, `TASKS.md` and the current `HANDOFF.md`. Verify remote refs, HEAD, upstream and existing changes. M01 reconciliation is complete at `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`. Complete U02: repair the primary workout controls from `docs/ux-baseline-2026-10-08.md` in independently testable slices, with honest browser/device limits. Save and verify a checkpoint, update the task list/handoff and generate the next short prompt. Then continue approved milestones one at a time. Do not merge or deploy without permission.

If a fresh conversation is needed, the user may need to paste that prompt or provide repository access. Generating it does not automatically open or authorize a replacement chat. If blocked, record the exact blocker and the next safe step before stopping.

Use `audit/2026-10-08-quality` and draft PR #1 as the combined review branch targeting `main`. The integration reconciles the earlier quality repairs with the `review-fixes` feature line. Read `docs/branch-integration-2026-10-08.md` before using the historical handoff below.

The current code includes encrypted local web/native storage and password-protected manual transfer files. It still has no real app accounts, shared cloud history or automatic device sync. Model inference remains unimplemented. The older data-storage and revision statements below are historical and are superseded by the integration report. `review-fixes` is preserved, `restructure` is the export baseline, and `gh-pages` is an older generated test build. No live deployment or merge into `main` is authorized by this handoff.

# Movefield / Training Studio — Claude Code handoff

Prepared 7 October 2026. Movefield is a **working name**. This package transfers the existing project; continue it rather than creating another starter.

## 1. Snapshot and authority

| Item | State at handoff |
| --- | --- |
| Latest application commit | `cbb41417dc29029122cb43ab2d92bc5632174e2d` — Add personalized themes, accessible settings, and workout reminders |
| Previous application revisions | `25e0e74c49adca3c1a777151d320f7cd811f2b72` — editorial/branding; `5b1d116` — usability, recovery and coverage |
| Source included | Complete tracked web/mobile working tree and its asset files, plus handoff instructions; generated caches excluded |
| Web | Working local prototype using Vinext, React, TypeScript and Tailwind |
| Mobile | Expo/React Native starter with shared training logic and independent local storage |
| Accounts and sync | Not implemented as real app services; account/security interfaces are previews |
| AI | No model installed, inference runtime integrated, phone benchmark completed or cloud fallback enabled |
| Publication | Latest revision has not been successfully published; explicit source-upload/deployment approval is still required |

Read `CLAUDE.md`, this file, and `docs/product-requirements.md` first. Then read `docs/revision-13-appearance-reminders.md`, `docs/revision-12-editorial-branding.md`, `docs/revision-11-ux-audit.md`, and `docs/deep-audit-2026-10-07.md`. Earlier reports explain how the implementation developed; they are not all current recommendations.

This is a consolidated engineering handoff from available conversation context, source and saved reports. It is **not a verbatim export of every prior conversation**, and it must not be presented as one. The repository retains the detailed product requirements. New explicit user decisions override older proposals.

The source ZIP has no `.git` directory. Commit IDs identify the original snapshot; they will not resolve in the extracted folder unless its original Git history is separately supplied. `HANDOFF_MANIFEST.json` records the export and file hashes. You may initialize a new local Git repository after import; do not push it externally without permission.

## 2. Product intent and working style

The goal is a complete training app for web, iOS and Android, ultimately with one account and shared history. It serves users 14 and older across experience levels, equipment, goals and available time. Strength, muscle, general fitness, bodyweight work, running/hybrid training, sport and competition needs are within the intended scope. The current catalog does not fulfill every combination.

The user wants continued useful development, not repeated confirmation of reversible implementation choices. Do not quietly shrink the agreed scope to a generic MVP. Be candid about unsupported plans, absent services and incomplete validation. A detailed end-to-end launch plan is wanted later, **not as the next deliverable**. The import/setup instructions here are only for resuming work.

Preserve these decisions:

- A rules-based training engine owns progression, recovery, workload constraints and dates. Feedback-driven changes show before/after and require acceptance; explicit plan acceptance covers its already scheduled progression.
- Coach-owned programs remain under the coach's authority. Track them without adding a competing program. Changes of authority must be explicit.
- Never fabricate weights, completed sets, performance, readiness or source attribution. Unknown load is not zero; dumbbell load is per hand; barbell load includes the bar and both sides.
- Keep core lifts and measurement contexts comparable across blocks. Substitutions need appropriate history/setup handling, not falsely interchangeable records.
- Personalization must account for time, equipment, experience and recovery. Age/sex alone must not dictate unsupported prescriptions. Youth restrictions and supervision rules remain first-class requirements.
- Imported routines retain creator/source credit. Named reference cards are not permission to redistribute someone's full program. Original generated workouts use clear descriptive names.
- Exercise notes should be specific, useful and natural. The user disliked repetitive AI-sounding prose and the Caliber comparison in Strength over time. Remove generic filler; preserve licenses and honest provenance.
- Progress metrics are personal indicators, not validated rankings or diagnostic claims. Optional photos, health/device imports and richer measurements remain broader product requirements.

## 3. What is implemented

### Training, logging and catalog

The web app has plan setup, program selection, a training calendar, session logging, saved history, rest timing, substitutions, reviewed adjustments, progress displays and exercise guides. The native starter carries much of the same engine and logging behavior, with resumable plan setup, coach/manual targets, same-weekday target copying, saved/undo controls and local rest alerts.

The catalog contains 71 current program variants plus three legacy preview choices. There are 989 exercise guides and 1,726 web photo assets. These counts describe included content, not independently validated training coverage. Native content includes guide/reference data, but does not bundle all web exercise photos.

Revision 11 expanded standing-dumbbell and two-day hybrid choices and addressed return blocks, equipment increments, saved custom timed actuals, feedback drafts and machine context. Unsupported combinations still need explicit explanations. The separate adult coverage matrix has 1,433 matched and 268 unmatched combinations out of 1,701 sampled setups; see section 8.

### Editorial changes and naming

Revision 12 reviewed first-party interface text, the catalog and exercise guides. It changed 943 guides, added movement-specific summaries, simplified instructions and corrected several unrelated movement notes. It removed the Caliber comparison while retaining the strength index's actual calculation and limitations.

There are display aliases for 71 plan names and 159 distinct workout titles. `lib/presentation.ts` separates display wording from stored titles and load roles. **Do not migrate stored records just to rename a workout.** Preserve custom names, IDs, role keys and history. If a main exercise changes, the display can fall back to a suitable body-region title.

NHS and creator-derived reference programs retain attribution. PHUL/PHAT-style named references are tracking schedules requiring the user's own routine entry; they are not copies of the full original routines.

### Appearance and accessibility

Revision 13 adds six palettes: Volt green, Ocean blue, Iris violet, Sunset, Berry pink and Glacier teal. Green remains the default. System, Light and Dark modes are saved per device. The original geometric gradient M and Movefield wordmarks are provisional assets in `public/brand`.

Headings use Barlow Condensed; reading text, controls and workout data use Inter. Fonts are self-hosted and their SIL OFL notices are bundled. Settings include text sizes, stronger contrast and reduced motion; web also has link underlining. Focus treatment, a skip link, larger primary targets and theme-aware chart/form tokens were added. Native text respects system scaling.

Calculated design-token contrast passed the included checks. Full rendered contrast, reflow, keyboard and assistive-technology behavior has not been verified. Do not claim WCAG conformance from token tests alone.

### Daily workout reminders

Reminders are off by default; the saved default time is 18:00. Scheduling deduplicates to one reminder per workout day and respects completed/skipped/partial sessions, active sessions, held/paused plans and relevant commitments. Do not change training dates or completion records while calculating alerts.

- **Web:** checks while the page is open, offers an in-app reminder and optional browser notification, and uses persistent day deduplication. Sleeping/throttled/closed tabs can miss alerts. Calendar export creates a static `.ics` snapshot with timed events/alarms; later plan edits do not update an imported calendar.
- **Native:** reconciles up to the next 30 workout days after relevant changes and on foregrounding. Permission is requested on enable; quiet iOS provisional permission is handled. Workout cancellations are scoped so they do not erase rest alerts. Reopen after travel/time-zone changes to reconcile local time.

An asynchronous stale-permission response race was reproduced and fixed. Delivery while locked/backgrounded and real device behavior remain untested. These are local notifications, not a remote push service.

### Future model preference

Settings can save Automatic, Qwen3 0.6B, Qwen3 1.7B, Qwen3 4B or Off. This is a **preference only**. Qualification/fallback helpers are deterministic logic; no actual hardware qualification, model download or inference is connected.

## 4. Branding decisions still open

The user likes green, gradients, athletic headings and a readable body font. They want a short lifting/training-related name, preferably one word and two syllables, plus full-name and single-letter marks. Strava and Runna were references for simplicity, not assets to copy. Avoid close imitation of their geometry or Caliber's mark.

Movefield was adopted provisionally, not selected as a legally cleared final name. **LiftSense is excluded** because a directly competing fitness app was found in the Apple and Google stores. The earlier **Liftsen** idea was withdrawn because it sounds too similar. Current unapproved candidates: **Setward, Repspan, Setstride, Liftrel**. Earlier names with obvious app collisions were also rejected; see the revision 13 report.

Preliminary searches do not establish trademark, domain, app-store or logo rights. No domain or registration was purchased. Do not silently choose/register a new final brand, alter stable storage keys/app identity, or describe a name as legally available. Keep Movefield until the user chooses, then research the relevant markets and similar marks before launch investment.

## 5. On-device model direction

The latest user preference is a Qwen3 tier strategy, including **4B on phones that actually qualify**, with smaller choices and a useful app when AI is off. This supersedes the earlier recommendation to prioritize Apple Foundation Models/Liquid models. Those remain comparison research, not the selected product direction.

See `docs/on-device-models.md` for dated source links and build-specific sizes. Published model file sizes are not peak RAM requirements. Qualification must use the exact model revision, quantization, runtime/backend, OS and device, measuring cold start, response time, peak total app memory, thermal behavior, power use and output accuracy. “Newest phone” or advertised RAM is not a passing benchmark.

Start with short, user-requested explanations of verified workout facts and a small relevant set of licensed local reference passages. We do not need to train a language model from scratch. Fine-tuning may later improve task/style behavior using licensed examples on development hardware; it is not continuous phone training or a replacement for factual evaluation.

Keep these boundaries:

- Existing deterministic training rules remain authoritative. Models can explain facts or propose a change; they cannot commit it.
- Preserve the current restricted AI-review eligibility, including youth/concern/context exclusions. Expanding it is a separate evaluated product decision.
- Treat imported titles, notes and reference text as untrusted content. Validate output structure and factual support; fall back to the existing rules-based summary when unreliable.
- Download only with user agreement, showing size/progress and allowing cancel/retry/delete. Verify the revision/checksum and keep license notices.
- No silent cloud fallback, uploads of workout records, continuous background inference or inference during rest timing.
- Native inference requires a native development build; Expo Go cannot load the planned custom native runtime. Web needs its own runtime and capability checks.

No model weights or native inference dependencies are in this export. Recheck model/runtime availability and terms at integration time; the research is a snapshot.

## 6. Run locally

Use Node 24; the prior workspace used 24.19.0. Manifests require Node >=22.13.0. Install/activate **pnpm 11.25.0** through your normal Node tooling. Web and mobile deliberately have different lockfiles; do not replace either incidentally.

From the extracted `movefield` root:

```sh
pnpm install --frozen-lockfile --prod=false
pnpm dev
```

Open the actual URL printed by the server, normally port 5173. Current local training features do not need a cloud API key. Keep the non-secret `.openai/hosting.json`: the Vite/build configuration reads its project metadata. Do not delete it as if it were a credential.

Development servers stay running. Use a second terminal for checks, or stop the server with Ctrl+C first.

The old workspace's runtime selection is excluded. `scripts/execution-profile.mjs` defaults to portable when `.sites-runtime/execution-profile.json` is absent. pnpm can create its own new `.sites-runtime/pnpm-store`; that is normal. Do not copy cached managed runtime state into the new machine.

Root `install:ci` uses Linux-specific Bash/flock/GNU timeout helpers. Use the explicit pnpm command above on import. The generic root README's npm instructions are stale. Native Windows/WSL installation has not been re-tested for this handoff; PowerShell users may need `pnpm.cmd`/`npm.cmd`. Install dependencies within the OS where they will run.

Web verification, from root:

```sh
pnpm exec tsc --noEmit
pnpm build
node scripts/check-preferences.cjs
node scripts/check-audit.cjs
node scripts/check-native-storage.cjs
```

Run the specific catalog/onboarding/focus/training checks affected by a change rather than every huge matrix repeatedly. The root has no single comprehensive `test` script. Several checks rewrite tracked reports: inspect diffs before committing. In particular, `check-preferences.cjs` regenerates `docs/revision-13-validation.json` and can remove manually recorded delivery/publication context; preserve that context separately or restore it accurately.

For the native starter:

```sh
cd mobile
npm ci
npm run check
npm run test:engine
npm run export:mobile
npm start
```

Use `mobile/START-HERE.md` for the existing phone setup notes. `export:mobile` creates iOS/Android JavaScript bundles; it does not sign or install a production app. Expo Go is the current starter workflow. Source ZIPs under `public/downloads` are historical website download artifacts; edit the top-level `mobile/` source, not an older nested ZIP.

Shared code is canonical in root `lib/`. After editing shared logic/data, from root run:

```sh
node mobile/scripts/sync-shared.mjs <absolute-project-root>
```

This refreshes copied native modules/content. Then run native type/engine checks. Do not patch only `mobile/src/shared` and leave the source divergent.

## 7. Source map

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | Main web workspace, session flow and navigation; large existing file, avoid unrelated reformatting |
| `app/layout.tsx`, `app/globals.css` | Root providers/metadata, self-hosted fonts, theme/accessibility styles |
| `components/app-preferences.tsx` | Web appearance/preferences/settings UI and provider |
| `components/brand-mark.tsx`, `public/brand/` | Original provisional logos and previews |
| `components/training-onboarding.tsx` | Web plan setup |
| `components/progress-dashboard.tsx`, `lib/progress.ts` | Personal progress calculations/displays |
| `lib/training.ts`, `lib/saved-data.ts` | Core training types/rules/proposals and saved-data validation |
| `lib/onboarding.ts`, `lib/program-catalog.ts`, `lib/recipes.json` | Setup matching, programs and recipe data |
| `lib/training-focus.ts`, `lib/substitutions.ts`, `lib/tracking.ts` | Focus adjustments, substitutions and tracking behavior |
| `lib/presentation.ts`, `lib/brand.ts` | Safe display naming and provisional brand strings |
| `lib/workout-log.ts`, `lib/rest-timer.ts` | Logged sets/rest deadlines; typing or editing must not start a fresh rest cycle |
| `lib/workout-review.ts` | Existing rules-based summary and restricted optional-model boundary |
| `lib/app-preferences.ts`, `lib/workout-reminders.ts` | Shared preferences, future model-tier selection and reminder/calendar logic |
| `lib/exercise-library.json`, `public/exercise-guides.json` | Exercise metadata and guide prose |
| `public/exercise-photos/`, `docs/exercise-library-*` | Exercise assets and provenance/license/completion records |
| `mobile/App.tsx`, `mobile/src/mobile-engine.ts` | Native workspace and engine adapter |
| `mobile/src/storage.ts` | Native local persistence; preserve existing storage identity/schema |
| `mobile/src/plan-setup.tsx`, `mobile/src/session-editor.tsx` | Native setup and manual/coach targets |
| `mobile/src/appearance.tsx`, `mobile/src/settings.tsx` | Native themes/settings/font loading |
| `mobile/src/workout-notifications.ts`, `mobile/src/rest-alerts.ts` | Native daily reminders/rest alerts; cancellation scopes must stay separate |
| `mobile/src/shared/` | Generated/copied shared snapshot, not sole source of truth |
| `scripts/check-*.cjs`, `mobile/scripts/check-engine.ts` | Focused validation tools |
| `build/sites-worker.ts`, `lib/http-security.ts` | Worker/security behavior; not a production account backend |
| `docs/product-requirements.md`, `docs/audit-acceptance-matrix.json` | Full requirements and outstanding acceptance scenarios |

Web dependencies include React 19.2.8, Next 16.3.6 compatibility, Vinext 1.0.0-beta.5, Vite 8.0.16, TypeScript 5.9.3, Tailwind 4.2.1 and Wrangler 4.92.0. Native uses Expo ~57.0.27, React Native 0.86.3 and its own TypeScript ~6.0.3. The included manifests/lockfiles are authoritative.

The pnpm workspace enforces a seven-day minimum release age and explicit dependency build permissions. Preserve that policy and compatible pins. Do not blindly run forced audit fixes or downgrade framework components to satisfy a scanner.

## 8. Verification evidence and known limits

These are **recorded checks from application development**, not a claim that a fresh install on the recipient's computer has been tested. Handoff creation changes documentation/export only.

| Area | Evidence | Limit |
| --- | --- | --- |
| Revision 13 preferences/reminders | 62 checks in five groups; `docs/revision-13-validation.json` | Token contrast is not rendered UI certification; model selection is mocked qualification data |
| Type/build | Web/native TypeScript, web production build and iOS/Android Metro exports passed | No signed binaries, native compile or phone installation claimed |
| Training/storage regressions | 11 training regression checks and native storage checks passed for r13 | Does not certify every desired program or storage failure scenario |
| Native reminder race | Delayed old permission result tested against newer allowed schedule; fixed | Focused harness was not saved as a standalone regression script; persist a targeted test when changing this code |
| Production worker | HTTP 200, 22 matching CSP script nonces, per-request nonce rotation, POST/internal rejection, private/no-store, assets/ZIP served | Local worker checks; cleanup hung and required interruption after assertions, so not a clean process exit |
| Editorial invariants | R12 compared all 71 catalog plans to r11; IDs, loads, dates/roles, source links preserved | Historical comparison harness relied on old Git history and a workspace-only script; not independently rerunnable from this ZIP alone |
| Broader engine | R11 report records large parameterized matrices and 74 choices across seven start weekdays | Assertion totals are not unique clinical cases or independent scientific validation |
| Browser/phone UX | Not freshly completed for r13 | Reflow, keyboard, screen readers, touch behavior and locked/background notification delivery need testing |

The former environment lacked its required managed browser capability. That is an environment-specific limitation, not a prohibition on Claude using an available, authorized local browser/Playwright workflow. Inspect the app in the recipient's environment and state any limits honestly.

Known outstanding items:

- **Program matching:** `docs/revision-11-coverage.json` reports 268 unmatched out of 1,701 sampled adult setups: 63 powerbuilding cases without a suitable loadable anchor, 36 short two-day hybrid windows, 27 dumbbell-assisted calisthenics cases with insufficient time and 142 competition-barbell equipment/time cases. Distinguish legitimate constraints from missing recipes; don't fill every gap with an inappropriate plan. Existing unsupported responses must stay explicit.
- **Security dependencies:** the latest retained r11 audit found one high-severity web advisory path involving `braces`, and 15 high-severity mobile affected-package entries involving `braces`/`node-forge`, with no critical findings. These are historical, overlapping dependency counts, not a fresh audit. Review current advisories and compatible fixes before release. Older r10 counts are superseded.
- **Performance:** large web client chunk warnings remain; real-device loading, bundle strategy, cold starts and memory are unmeasured.
- **Data platform:** no real account ownership, passkeys/OAuth/2FA service, secure cloud storage, backups, conflict resolution or web/native sync. Existing account/security cards must not claim these services work.
- **Native parity:** not every web metric/editor/integration is present. Full reusable multiweek plan editing, richer imports and measurement tracking remain unfinished.
- **Planning breadth:** annual/seasonal automation, competition/event detail, sport-position programs and full coach/parent/team sharing requirements are incomplete. See the product contract rather than inferring completion from UI labels.
- **Integrations:** HealthKit, Health Connect, Samsung, MyFitnessPal, Strava and Garmin are not connected. Do not imply API access or data syncing from placeholder controls.
- **AI/brand:** no model benchmark/runtime and no final cleared identity. These remain separate decisions and implementation work.

## 9. Suggested next work

Resume in this order, adjusting for actual defects found:

1. **Establish the imported baseline.** Confirm dependency versions and get the web app running. Inspect onboarding, Today/workout, Progress and Settings. Keep source unchanged until you understand persistence and existing tests.
2. **Finish concrete r13 UX verification.** Exercise all six palettes, light/dark/system mode, larger text, reduced motion, focus/keyboard and error states. Test mobile notification permission denial/provisional/full access, edits, pause/resume, completion, time-zone changes and rest-alert coexistence on actual supported devices when available. Fix defects with focused checks.
3. **Address justified program gaps.** Use the coverage report to prioritize real supported cases. Maintain honest time/equipment constraints, youth boundaries and no empty-calendar fallback. Add meaningful cases for each corrected branch and sync native data.
4. **Continue copy review during actual flows.** R12 was broad but is not proof every line is perfect. Check generated summaries, guide-specific movement accuracy, understandable workout titles, creator credits and remaining competitor comparisons without deleting provenance or historical documentation.
5. **Resolve final branding with the user.** Keep the provisional assets until selection. Do the relevant clearance work and create original wordmark/initial variants after selection; do not purchase/register anything automatically.
6. **Prototype local Qwen in an isolated, reversible branch when ready.** Start with a native development build and one short verified-facts task, qualify exact model/runtime combinations, and keep the ordinary app usable. Do not make paid calls or upload user data.
7. **Continue the full product contract.** Accounts/sync, backend ownership/security, richer plan editing, integrations and wider sport/season support require deliberate architecture and implementation. Prepare the requested detailed release plan only when the user asks for that stage.

Items above are priorities, not a claim that the app is near production readiness. Do not deploy just because local checks pass.

## 10. Hosting, privacy and export boundaries

The checkout includes the existing non-secret hosting configuration needed by the build. Private hosting URLs and project identifiers are omitted from this public handoff. Read authorized project settings locally when preparing a deployment. The hosted build may be older than this source; hosting versions and development revisions are different.

Automatic approval review rejected the attempted latest upload/publication because explicit user permission to transmit source and deploy to Cloudflare was missing. **There was no successful r13 publication.** Do not treat transfer to Claude Code as permission to publish, push externally, change access, or bypass that rejection. Finish a concrete local result before asking for publication approval.

The ZIP excludes dependencies, build outputs, runtime caches, Git history, environment credentials, cookies and bypass tokens. The non-secret project metadata needed by the build is retained. It does not contain the user's browser/phone workout records; those are device-local and separate from the repository. Sample/demo records in source are prototype fixtures.

Current worker behavior limits routes and sets a restrictive CSP with request-specific nonces. Fonts/assets are local. A future real backend or authentication flow will need explicit security design; don't blanket-disable protections to make a new endpoint work.

Preserve exercise source links and `docs/exercise-library-LICENSE.txt` (the recorded dataset license is the Unlicense, not the earlier mislabeled CC0), font OFL notices and other included attribution. Natural copy and original branding do not justify erasing licenses or misrepresenting authorship.

## 11. Import reference

`START_HERE_CLAUDE.md` is the short human setup guide. `CLAUDE_START_PROMPT.txt` is ready to paste into a new Claude Code session. `CLAUDE.md` is the project instruction file Claude Code reads at startup when opened in this project; it is contextual guidance, not a permissions enforcement mechanism.

Official Claude Code context documentation: https://code.claude.com/docs/en/memory. Installation/use documentation: https://code.claude.com/docs/en/overview. No prior ChatGPT conversation is automatically imported by those files; this handoff and the included project documents provide the transferred context.
