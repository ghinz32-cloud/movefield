# Movefield saved task list

Last updated: 8 October 2026. Read `AGENTS.md` and the current `HANDOFF.md` section first. This list sequences the approved audit and repairs; it does not remove requirements from `docs/product-requirements.md`.

Repository: `https://github.com/ghinz32-cloud/movefield.git`.
GitHub review branch: `audit/2026-10-08-quality`; draft PR #1 targets `main`.
Last verified GitHub checkpoint: `8cd39e42f2178b807d63af2042b70481041b028b`. Integration baseline: `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`. Current independent checkout `/workspace/scratch/855d6d943ad0/movefield` on `audit/2026-10-08-continue`, tracking the GitHub review branch. Cleanup removed the older worktrees’ base Git metadata; preserved source matched all 11 U08a1 fingerprints and was checkpointed at `5c117e4fb3ea490326cb92be8a8bb377f564c409`. Current U08a2 application is `65232aae0fab994f00ca725497caf39886e5d027`. Original local commit/staging state is unavailable; older source directories were not modified. Recovered source is now pushed at `3681258a6095d977e67b0f1d8c6fadfd135fbff1`; standing push permission supersedes the earlier rejection.

U13 is next/current after the checked U12 UI checkpoint. The latest request expands the audit to full web/native usability, workout evidence and variety, practical Qwen integration, durable storage selection and website/Android release readiness. Repository refs and the clean documentation checkpoint were reverified before starting U01. If a milestone is blocked, record the blocker and checkpoint before selecting another independent task.

| ID | State | Independently testable milestone | Completion evidence |
| --- | --- | --- | --- |
| M00 | Complete in this documentation checkpoint | Save the user's milestone workflow, task list and resumable handoff | Required sections/prompts/IDs verified, documentation diff checked, GitHub commit and readback verified before reporting success |
| M01 | Complete at `9d7c13e` | Reconcile feature and audit histories; retain both sets of repairs/features | 23 regression suites, web/native types, lint, production/security checks and iOS/Android exports pass; GitHub quality run 4 succeeds; both source parents recorded |
| M02 | Complete in focused harness — browser acceptance pending | Make browser transfer restore recoverable if interrupted between key and ciphertext persistence | 115 vault assertions with six fresh-vault boundary snapshots; 45 transfer/29 security checks, web types/lint pass; real IndexedDB/OS interruption acceptance remains pending; local-only checkpoint |
| M03 | Complete in focused harness — phone acceptance pending | Apply interrupted-restore recovery to native storage | Eight fresh-module persistence snapshots, finalization/cleanup/collision/legacy/key-loss cases pass; native types/lint/Metro exports checked; phone/OS interruption remains pending; local-only checkpoint |
| M04 | Interim guard complete — SQLite/device capacity pending | Address native encrypted-history capacity and failure reporting | Exact UTF-8 encrypted-row preflight; 312-session synthetic save/reopen; oversized save/restore/setup, legacy and injected full-disk recovery pass; current edits stay exportable; visible recovery controls and backup-first Settings; native types/lint/engine/Metro exports pass; S02 still required |
| M05 | Review complete — upstream release blocker remains | Resolve or precisely document the web dependency advisory | Fresh web audit: one high braces finding, registry latest 3.0.3 and official no-patch status; both exact lint/build paths, evidence JSON and next remedy/validation step saved; no dependency changes or clean-release claim |
| M06 | Review complete — upstream release blockers remain | Resolve or precisely document native dependency advisories | Fresh native audit: 15 affected entries from two high roots; exact confirmed Metro/CLI/certificate paths, latest affected registry versions, official no-patch status and incompatible downgrade remedies recorded; no package changes; exception still expires 8 November |
| M07 | Queued — browser access needed | Verify offline first-load, reload and update behavior in a real browser | Network/offline/update flow, shell/bundle completeness, cache isolation and no record requests; preserve nonce/security behavior; existing 31 offline checks pass; save reproducible observations |
| M08 | Queued — browser access needed | Verify complete browser protected/plain restore UI | File selection, malformed/wrong-password paths, preview/cancel/confirm, active/stale guards, refresh and key loss; recorded UI evidence plus focused storage checks |
| M09 | Queued — physical devices needed | Verify one native save/interruption/restore flow on iPhone and Android | Enter workout, interrupt/reopen, recover history, denied permissions and protected transfer; device/OS/build recorded; bundle export alone does not complete this milestone |
| M10 | Queued — browser/device access needed | Verify appearance, reflow and keyboard/screen-reader behavior | Representative small screens and large text, light/dark, all palette/font controls, focus and readable errors; fix observed defects and run targeted checks; do not infer accessibility conformance from token contrast |

## Current owner request — 8 October 2026, 19:38 Chicago

Standing authorization: **always push completed work**. The recovered source was published through the connected GitHub account as `3681258a6095d977e67b0f1d8c6fadfd135fbff1`, with tree `9a2e68b95222f7bd5be082bed95b8c60e1d3d0f4` identical to local `861cd7874bb238a644001f594d7cff772a64a579`. CLI GitHub authentication was absent. Local commit history is preserved under `backup/u08a2-local-861cd78` and the full-history bundle. Remote head and report readback verified. Previous push-approval blockers below are historical and superseded by this explicit authorization.

| ID | State | Milestone | Acceptance |
| --- | --- | --- | --- |
| U12 | Implementation complete — phone acceptance pending | Calm web/phone UI; Today first; setup/account-entry and workout selection | Smaller default visual density without shrinking touch targets; secondary content disclosed; sample recovery fixed; real authentication limits clear; focused flow tests, web/native types/lint, visual web review |
| U13 | In progress | Search and curate hundreds of recent exercise-science papers and forum feedback | Deduplicated primary-source metadata/abstract screening with queries/dates/limits, selected original evidence notes mapped to plans; actual review levels distinct; forum themes sourced, not prevalence claims |
| U14 | Queued | Expand public named-program library | Source-attributed factual program structures with original app wording; scheduling/progression/equipment and adult/youth constraints tested; no paid books or copied commercial instructions |
| U08b | Queued after UI/evidence | Working Qwen demo and default prompt | Verified cached-asset runtime loading, grounded task contract, cancellation/errors, real execution evidence where supported; training dataset/tooling and completed weight training distinct |

## Expanded owner request — 8 October 2026

The user grants autonomy to audit and improve the web and phone apps, repair button placement and usability, verify evidence-based programming across weekly schedules/progression, implement the largest practical Qwen models on both platforms, prepare a well-sourced exercise-science knowledge base, choose appropriate storage, and work toward a live website and Android app. Use judgment within that scope; ask only consequential missing questions. Existing no-merge/no-deploy-without-permission rules remain in force until an explicit release decision. Do not incur paid service charges or use unavailable accounts silently.

These are ordered delivery milestones, not claims that all are implemented. Keep only one active. Split any row further if it cannot be independently verified in one checkpoint.

| ID | State | Milestone | Acceptance |
| --- | --- | --- | --- |
| U01 | Complete with browser/device limits | Establish current web/native UX baseline and prioritized defects | Verify repository/refs/changes; recover an authorized inspectable preview; exercise onboarding, workout logging, navigation, history and settings; record screenshots/observations or exact browser/device blockers |
| U02 | Split into U02a/U02b | Repair primary workout controls and responsive placement | Reachable start/log/undo/finish actions, clear separation of destructive actions, no overlaps/clipping with keyboard/large text; relevant regression and observed UI checks on each available platform |
| U02a | Complete — observed browser limits | Repair web logging/action placement | Collapsed optional calculators/guidance, sticky finish/rest controls, no floating-button overlap; browser log/undo/partial-save and type/lint checks |
| U02b | Implementation complete — device acceptance pending | Repair native logging/action placement | Persistent finish/rest controls, labeled fields and full-width log actions; native type/engine/export checks; device limits retained |
| U03 | Foundation audit complete — deeper evidence gaps recorded | Independently audit workout evidence and schedule/progression coverage | Primary-source ledger with applicability and limits; enumerate supported weekly-day/time/equipment combinations and dose/progression/recovery rules; identify concrete gaps without calling template counts scientific validation |
| U04 | Split into U04a/U04b | Correct the highest-priority workout gap | A bounded recipe/progression fix, comparative before/after cases, time/equipment/youth/coach constraints retained, canonical/native parity and targeted engine checks |
| U04a | Complete — UI recheck limited by preview reload | Align fit notes and recommendation ranking with generated session duration | PLU3 and other eligible drafts stop claiming their actual sessions exceed the budget; time-limit guards and native parity retained |
| U04b | Complete | Correct current-plan evidence mapping | Verified 2019 frequency/2026 dose sources, historical sources excluded from current mappings; 580 evidence/goal assertions, 31 shared files, web/native types and lint pass; see evidence-mapping repair report |
| U05 | Complete — local checkpoint, push blocked | Choose storage architecture and define one recoverable data flow | Encrypted IndexedDB/native SQLite with optional managed Postgres chosen; legacy/recovery/outbox/conflict/account boundaries and S01–S05 split in storage architecture report; no service provisioned |
| U06 | Complete — inference/device qualification pending | Verify current Qwen runtime/model options for web and Android | Seven candidates with immutable URLs/bytes/hashes, current package/API/context/license evidence, exact-device qualification gate; 1,672 manifest/selector assertions, 33 shared files, web/native types and lint pass; no actual device qualified or weights downloaded |
| U07 | Foundation complete — actual model evaluation pending | Build a sourced exercise-science reference corpus and model evaluation set | Nine original notes plus one disabled record; bounded population/source retrieval, ID-only grounding contract, 22 held-out cases and fingerprinted grading; 221 grounding/21 grading/1,675 Qwen assertions, 36 shared files/types/lint pass; no training or actual model accuracy claim |
| U08 | Split into U08a/U08b — download foundation complete | Connect real web Qwen inference | Explicit model download/cancel/delete, progress/error/off paths, strict output validation, source-grounded explanations and unchanged deterministic training authority; real inference tested on available hardware |
| U08a | Split into U08a1/U08a2 — opt-in screen pending | Implement verified optional browser model asset cache | Pinned byte/hash verification, bounded streaming, cancel/retry/delete and partial-download isolation; no workouts in downloads; explicit opt-in and ordinary app still usable |
| U08a1 | Foundation complete — actual browser/OS acceptance pending | Implement and test the browser download/cache service | Immutable model/size/hash consent tuple, streamed SHA-256/byte verification, 256 KiB IDB chunks, atomic completion pointer, Web Locks and resumable 128-key cleanup; 190 lifecycle/74 adapter assertions, all 28 regression suites and types/lint pass; no app screen/CSP/runtime wiring or real weight download |
| U08a2 | Implementation complete — secure-browser acceptance pending | Connect explicit optional model-download controls | Lazy first-model view, 356,920,759-byte review/confirmation, progress/cancel/retry/delete/Off, stale/duplicate/cleanup guards and exact HEAD-observed publisher/CDN policy; 132 new assertions and 29/29 regression plus 2/2 production pass; Chrome HTTP settings/Off/Enter and 130% text observed; secure actual downloads and device acceptance pending |
| U08b | Queued — next; actual secure GPU needed for acceptance | Connect WebLLM worker inference and qualify exact models | Strict U07 task/outputs, actual tokenizer/context and runtime measurements, cancellation/unload, device qualification and no unsupported automatic tier |
| U09 | Queued | Connect real native Qwen inference and qualify larger tiers | Development-build runtime, verified model assets and downloads, fallback/offline/cancellation, peak-memory/latency tests on available Android hardware; record unavailable physical-device tests honestly |
| U10 | Queued | Prepare a deployable website release candidate | Complete critical UX/data/security checks, document remaining release blockers, create a recoverable source/build checkpoint; publish only with release permission |
| U11 | Queued | Prepare an installable Android release candidate | Native dependency/build configuration, signing/package identity and install/test checklist, build artifact when authorized accounts/toolchain are available; distribution/store submission needs explicit release permission |

## Storage and final validation follow-up

| ID | State | Milestone | Acceptance |
| --- | --- | --- | --- |
| S02 | Queued — required capacity migration | Implement transactional encrypted native history entities in SQLite | Idempotent legacy import, migration/readback rollback, large multi-year histories, low-storage/interrupted transactions and real Android build/device tests; preserve previous records until verified |
| V01 | Complete — measured device and advisory limits remain | Validate the complete reconciled local application range | aa57726: 26/26 regression, 2/2 production, web/native types/lint, engine/exports pass; initial graph 387,165 gzip bytes; saved exact source/tree/results/log hashes; no clean install, CI or hardware inference claim |

## Broader scope retained

Accounts and cloud sync, complete reusable block editing, sport/event/season programs, integrations, private photos, sharing and on-device model inference remain unfinished. Each must be decomposed into smaller milestones before implementation. Do not start unrelated feature expansion before the reconciliation checkpoint is verified. Account/service/provider decisions, merges and deployment are separate authorization boundaries.

## Current limitations

- Automatic approval review rejected the U04b GitHub push. Last independently verified remote is `8cd39e42f2178b807d63af2042b70481041b028b`; U04b is local `8229f76f45fa47518e5f201bb34139db991250b0`. Do not claim local checkpoints were pushed or retry by another route. Request explicit push approval for the completed concrete commit range.
- GHSA-vfj7-8cjw-p6xm and GHSA-86w9-cpqp-85rv remain release blockers; temporary CI exceptions expire 8 November 2026.
- M02/M03 interrupted-restore recovery passes injected fresh-instance persistence tests; actual browser/phone storage and OS-interruption acceptance remains unverified.
- U06 pins seven Qwen candidates; U07 adds the reference/strict selection/evaluation foundation; U08a1 adds the tested browser cache/download service. U08a2 now wires explicit opt-in/file controls and the exact network policy. No weights were downloaded and no model runs in either app. Secure-browser download acceptance, U08b actual worker inference/measurements and U09 native integration remain required.
- Supervised preview works for sample UI; U08a2 Settings/Off/keyboard-close and existing dark/130% text were observed. Its HTTP origin blocks Web Crypto/model downloads and real saved-profile flows. Existing sample entry shows an inherited save-paused notice to review. No physical-phone, 200% zoom or secure download acceptance is claimed.
- No direct messaging connection to bro is exposed. Branches were verified through GitHub instead.
- No merge into `main` or live deployment has occurred.

## Checkpoint lookup

Application evidence: `docs/branch-integration-2026-10-08.md`, `docs/branch-integration-validation-2026-10-08.json`, and GitHub quality run 4 for the full application SHA above.

This documentation checkpoint is the Git commit containing these task-list and handoff updates. Resolve its full SHA with `git log -1 --format=%H -- AGENTS.md TASKS.md HANDOFF.md`; inspect `git status` and the live remote head before treating it as the newest checkpoint. Its SHA is also recorded in the checkpoint's PR description and completion message after verification. Do not put a guessed self-referential SHA into these files.
