# Movefield saved task list

Last updated: 8 October 2026. Read `AGENTS.md` and the current `HANDOFF.md` section first. This list sequences the approved audit and repairs; it does not remove requirements from `docs/product-requirements.md`.

Repository: `https://github.com/ghinz32-cloud/movefield.git`.
GitHub review branch: `audit/2026-10-08-quality`; draft PR #1 targets `main`.
Application checkpoint: `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`, pushed and verified. The local worktree branch is `audit/2026-10-08-integration`, tracking that GitHub review branch.

No application milestone is currently in progress. The latest request expands the audit to full web/native usability, workout evidence and variety, practical Qwen integration, durable storage selection and website/Android release readiness. Repository refs and the clean documentation checkpoint were reverified before starting U01. If a milestone is blocked, record the blocker and checkpoint before selecting another independent task.

| ID | State | Independently testable milestone | Completion evidence |
| --- | --- | --- | --- |
| M00 | Complete in this documentation checkpoint | Save the user's milestone workflow, task list and resumable handoff | Required sections/prompts/IDs verified, documentation diff checked, GitHub commit and readback verified before reporting success |
| M01 | Complete at `9d7c13e` | Reconcile feature and audit histories; retain both sets of repairs/features | 23 regression suites, web/native types, lint, production/security checks and iOS/Android exports pass; GitHub quality run 4 succeeds; both source parents recorded |
| M02 | Queued | Make browser transfer restore recoverable if interrupted between key and ciphertext persistence | Focused crash injection and fresh-vault reopen tests at each persistence boundary; old or restored records remain readable; active/stale restore guards and existing format/history continue to pass; web type/lint checks |
| M03 | Queued | Apply interrupted-restore recovery to native storage | SecureStore/AsyncStorage boundary failures and fresh-module reopen tests; previous or restored records remain readable; existing setup/key-loss/storage tests and native types pass; physical-device limitations recorded separately |
| M04 | Queued | Address native encrypted-history capacity and failure reporting | Test realistic large histories and oversized saves; failures retain last readable record and expose an actionable recovery/export path; preserve legacy record readability; native storage/type checks |
| M05 | Queued | Resolve or precisely document the web dependency advisory | Fresh official advisory/package evidence; compatible locked fix if available; affected checks/build pass; otherwise record GHSA-vfj7-8cjw-p6xm as blocked with its exact dependency path and next review action |
| M06 | Queued | Resolve or precisely document native dependency advisories | Fresh evidence for braces/node-forge paths; compatible fixes preserve locked install, native types and iOS/Android exports; otherwise record blockers and exception expiry without claiming a clean audit |
| M07 | Queued — browser access needed | Verify offline first-load, reload and update behavior in a real browser | Network/offline/update flow, shell/bundle completeness, cache isolation and no record requests; preserve nonce/security behavior; existing 31 offline checks pass; save reproducible observations |
| M08 | Queued — browser access needed | Verify complete browser protected/plain restore UI | File selection, malformed/wrong-password paths, preview/cancel/confirm, active/stale guards, refresh and key loss; recorded UI evidence plus focused storage checks |
| M09 | Queued — physical devices needed | Verify one native save/interruption/restore flow on iPhone and Android | Enter workout, interrupt/reopen, recover history, denied permissions and protected transfer; device/OS/build recorded; bundle export alone does not complete this milestone |
| M10 | Queued — browser/device access needed | Verify appearance, reflow and keyboard/screen-reader behavior | Representative small screens and large text, light/dark, all palette/font controls, focus and readable errors; fix observed defects and run targeted checks; do not infer accessibility conformance from token contrast |

## Expanded owner request — 8 October 2026

The user grants autonomy to audit and improve the web and phone apps, repair button placement and usability, verify evidence-based programming across weekly schedules/progression, implement the largest practical Qwen models on both platforms, prepare a well-sourced exercise-science knowledge base, choose appropriate storage, and work toward a live website and Android app. Use judgment within that scope; ask only consequential missing questions. Existing no-merge/no-deploy-without-permission rules remain in force until an explicit release decision. Do not incur paid service charges or use unavailable accounts silently.

These are ordered delivery milestones, not claims that all are implemented. Keep only one active. Split any row further if it cannot be independently verified in one checkpoint.

| ID | State | Milestone | Acceptance |
| --- | --- | --- | --- |
| U01 | Complete with browser/device limits | Establish current web/native UX baseline and prioritized defects | Verify repository/refs/changes; recover an authorized inspectable preview; exercise onboarding, workout logging, navigation, history and settings; record screenshots/observations or exact browser/device blockers |
| U02 | Queued — next | Repair primary workout controls and responsive placement | Reachable start/log/undo/finish actions, clear separation of destructive actions, no overlaps/clipping with keyboard/large text; relevant regression and observed UI checks on each available platform |
| U03 | Queued | Independently audit workout evidence and schedule/progression coverage | Primary-source ledger with applicability and limits; enumerate supported weekly-day/time/equipment combinations and dose/progression/recovery rules; identify concrete gaps without calling template counts scientific validation |
| U04 | Queued | Correct the highest-priority workout gap | A bounded recipe/progression fix, comparative before/after cases, time/equipment/youth/coach constraints retained, canonical/native parity and targeted engine checks |
| U05 | Queued | Choose storage architecture and define one recoverable data flow | Compare justified options for account ownership, offline saves, sync/conflicts, export/deletion, cost and vendor constraints; record selected design and split its implementation into independently tested tasks |
| U06 | Queued | Verify current Qwen runtime/model options for web and Android | Primary runtime/model/license evidence; explicit download/memory/context limits and capability matrix; largest practical tiers rather than a blanket largest-size claim; no assumed hardware benchmark |
| U07 | Queued | Build a sourced exercise-science reference corpus and model evaluation set | Licensed/original summaries with provenance, retrieval tests, held-out accuracy/safety/injection cases, no user data used for training; distinguish retrieval/prompting from actual fine-tuning |
| U08 | Queued | Connect real web Qwen inference | Explicit model download/cancel/delete, progress/error/off paths, strict output validation, source-grounded explanations and unchanged deterministic training authority; real inference tested on available hardware |
| U09 | Queued | Connect real native Qwen inference and qualify larger tiers | Development-build runtime, verified model assets and downloads, fallback/offline/cancellation, peak-memory/latency tests on available Android hardware; record unavailable physical-device tests honestly |
| U10 | Queued | Prepare a deployable website release candidate | Complete critical UX/data/security checks, document remaining release blockers, create a recoverable source/build checkpoint; publish only with release permission |
| U11 | Queued | Prepare an installable Android release candidate | Native dependency/build configuration, signing/package identity and install/test checklist, build artifact when authorized accounts/toolchain are available; distribution/store submission needs explicit release permission |

## Broader scope retained

Accounts and cloud sync, complete reusable block editing, sport/event/season programs, integrations, private photos, sharing and on-device model inference remain unfinished. Each must be decomposed into smaller milestones before implementation. Do not start unrelated feature expansion before the reconciliation checkpoint is verified. Account/service/provider decisions, merges and deployment are separate authorization boundaries.

## Current limitations

- GHSA-vfj7-8cjw-p6xm and GHSA-86w9-cpqp-85rv remain release blockers; temporary CI exceptions expire 8 November 2026.
- Restore interruption recovery is unverified in both storage backends; M02/M03 address it.
- Supervised preview now works for in-memory sample UI; its HTTP origin blocks Web Crypto and real saved-profile flows. No physical-phone acceptance is claimed.
- No direct messaging connection to bro is exposed. Branches were verified through GitHub instead.
- No merge into `main` or live deployment has occurred.

## Checkpoint lookup

Application evidence: `docs/branch-integration-2026-10-08.md`, `docs/branch-integration-validation-2026-10-08.json`, and GitHub quality run 4 for the full application SHA above.

This documentation checkpoint is the Git commit containing these task-list and handoff updates. Resolve its full SHA with `git log -1 --format=%H -- AGENTS.md TASKS.md HANDOFF.md`; inspect `git status` and the live remote head before treating it as the newest checkpoint. Its SHA is also recorded in the checkpoint's PR description and completion message after verification. Do not put a guessed self-referential SHA into these files.
