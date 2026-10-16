# Product and training-flow consistency audit · 16 October 2026

Initial audited source: `f0130487760aa03d64b22f23002da5423da7ff4e`. The implementation follow-up at the end records subsequent fixes separately. Scope is the current shared Movefield and Grizzly web applications and their Android/iOS source. This is a read-only audit of product behavior and data handling; it changes no application, shared snapshot, workout data or frozen release. The preserved older original Pages root is a separate implementation and is not covered by these findings.

Five concrete defects were reproduced through current domain functions or literal UI-state selectors. Three additional native/web discrepancies were established by source-path review. The most consequential finding is an unchanged coach/manual target save removing accepted prescription details. No finding here establishes that existing completed workout records have been lost on the owner's phone.

## Prioritized defects

| ID | Priority | Affected surfaces | Finding | Verification |
|---|---|---|---|---|
| PRODUCT-01 | P1 | Both brands, web and native | Saving coach/manual targets removes untouched prescription metadata | Executed shared reducer |
| PRODUCT-02 | P2 | Both brands, web and native | Substitution discards an entered per-set RIR when other actual fields are empty | Executed shared reducer, four ratings |
| PRODUCT-03 | P2 | Both brands, web and native | Import accepts fixed-calendar conflicts that immediately block starting | Executed preview, accept and eligibility for all six commitment kinds |
| PRODUCT-04 | P2 | Both web brands | Reordering while editing a target leaves the edit attached to its old index | Literal callback/state reproduction; browser not run |
| PRODUCT-05 | P2 | Web/native interoperability | History lists assume opposite insertion orders | Validated synthetic saved state and literal selectors |

P1 means address before expanding use of the affected prescription editor. P2 means a concrete correctness/usability defect with an available workaround or narrower trigger. Priorities do not imply clinical risk grading.

### PRODUCT-01 — An unchanged tracking save removes prescription details

**Source:** `lib/tracking.ts:21`; callers `components/tracking-editor.tsx:31` and `mobile/src/session-editor.tsx:17`. Individual row edits also construct a minimal item at `components/tracking-editor.tsx:17` and `mobile/src/session-editor.tsx:15`.

**Reproduce:** use a coach/manual session, including a credited imported plan, with an item carrying an 8–12 rep range, an explicit 20 kg target, setup label, load role and coach note. Open workout targets and save without changing any row. `previewTrackingEdit` rebuilds every item as only `{exerciseId, sets, reps, rest, kg:null}`. The reproduced item loses its range, weight, setup, role and note; all six fixture items changed despite no requested edit. Per-set plans/source metadata are likewise outside the retained field list.

**Impact:** future prescriptions and instructions change silently. Completed history is retained. The preview lists the reduced targets and duration but does not disclose which existing metadata is removed.

**Recommended boundary:** preserve untouched items exactly. For an edited row, retain fields outside the requested change or explicitly preview any incompatible metadata that must be reset. Reordering alone must not rewrite prescriptions. Keep coach ownership and never turn an imported source rule into app-authorized progression.

**Acceptance:** unchanged save and reorder round-trip all valid item fields; changing one row leaves the others byte-equivalent; deliberate resets have a visible before/after; repeated-weekday application preserves each intended scope.

### PRODUCT-02 — Substitution drops a per-set reps-left entry

**Source:** `lib/substitutions.ts:25` and the replacement-set construction in `applySubstitution`; native entry control `mobile/src/workout-screen.tsx` uses `NativeSetRir` through Set details.

**Reproduce:** start an exercise, leave actual reps at zero and load unknown, enter only a set RIR, then accept an available substitute. The guard checks completed flags, reps, load, set metrics, legacy exercise-level RIR, notes and setup, but not `SetLog.rir`. Replacement removes the original sets and builds fresh ones without the rating. Values 0, 2, 6 and 10 all reproduced this outcome; explicit zero is also entered data.

**Impact:** an entered actual rating is discarded while the dialog implies that recorded inputs prevent substitution. This is distinct from the deliberate rule that editing reps or load invalidates their previous RIR.

**Recommended boundary:** treat any non-null per-set RIR as entered work in the substitution guard. Preserve the existing untouched-exercise path and null/unknown distinction. The original record should remain unchanged on rejection.

### PRODUCT-03 — Imported workouts can start with an undisclosed blocking calendar conflict

**Source:** `lib/plan-import-runtime.js:47`; `lib/training-runtime.js:920`; shared commitment kinds in `lib/calendar.ts:3`.

**Reproduce:** place a fixed commitment on the first imported workout date, preview a credited coach-directed import, accept it, then ask whether that session can start. Vacation and Day off are rejected during import. Travel / unavailable, Competition, Team practice and Other training are accepted, but `eligibility` immediately returns “A fixed commitment conflicts with this date. Review the schedule first.” All six kinds were exercised through the actual functions.

**Impact:** an apparently valid import replaces the active plan with a schedule that cannot start until it is moved or the commitment is changed. Travel / unavailable is especially inconsistent with the other full-day unavailable categories.

**Recommended boundary:** reuse the same fixed-date conflict policy during import preview and start. Show all affected dates before acceptance. If owner-directed training alongside an event is intentionally supported later, make that an explicit reviewed policy and apply it consistently; do not silently move commitments or workouts.

### PRODUCT-04 — Web reordering breaks an open tracking-row edit

**Source:** `components/tracking-editor.tsx:22` changes the items array without updating `editing`; duplicate guard at line 19. Native `mobile/src/session-editor.tsx:16` already remaps its edit index.

**Reproduce:** with Squat then Row, edit Squat, change a draft value, press Down on Squat, then Keep edited targets. `selected` still identifies Squat, while `editing` remains index 0 now occupied by Row. The duplicate guard rejects the edit because Squat is at index 1. The user must cancel and reopen the row, losing the unsaved edit draft.

**Recommended boundary:** track the edited exercise by stable ID, remap its index as native does, or disable reordering during a row edit. Verify both moving the edited row and moving a neighboring row across it. This reproduction executes the literal selector operations, not a mounted browser callback.

### PRODUCT-05 — History presentation depends on which client wrote the array

**Source:** web save prepends at `app/page.tsx:194`, and its history list uses `completed.slice(...)` at line 271. Native save appends at `mobile/src/mobile-engine.ts:68`, and its list reverses at `mobile/App-runtime.js:1553`. `lib/record-state.ts:28` preserves stored index order; `readSavedState` does not normalize history order.

**Reproduce:** a valid newest-first saved history `[new, old]` displays as `[new, old]` on web and `[old, new]` on native. An oldest-first native history has the inverse problem on web. Both orders are accepted and preserved by saved-state validation. Portable/legacy transfers or migrated records can therefore appear oldest-first on the receiving client, with recent workouts beyond the initial history page.

**Impact:** records are retained but harder to find. Current coaching's explicit chronological sort avoids this particular issue; this finding is about history presentation.

**Recommended boundary:** sort a copied presentation array by a documented date/finish-time/stable-ID rule on both clients. Preserve stored records and their IDs. Verify mixed-order restored history and appending a new workout after restore. This audit did not execute a cross-device transfer UI.

## Additional source-confirmed parity gaps

| ID / priority | Difference and reproduction | Evidence | Recommended follow-up |
|---|---|---|---|
| PARITY-01 / P2 | Native correction controls cannot display the selected value for a valid older exact RIR of 6–10. No option is selected, although the saved value remains intact. Web appends the exact older value. | `mobile/src/set-rir.tsx:5`, `mobile/src/history-editor.tsx:14`; compare `components/history-set-rir.tsx:7`. | Retain an explicit selected older value in native corrections, or display it separately until the owner changes it. Do not silently coerce it to 5+. |
| PARITY-02 / P2 | Native setup's complete schedule lists exercise totals, but exact timed run/walk steps are exposed only for the first session through its instructions alert. Future Calendar session details also show totals only. A user cannot inspect every later running stage before acceptance/start through those screens. Web setup renders `SessionGuide` for each expanded session. | `mobile/src/plan-setup-runtime.js:134`, `mobile/src/plan-setup-runtime.js:135`, `mobile/src/calendar.tsx:34`; compare `components/training-onboarding.tsx:69` and `components/session-guide.tsx:3`. | Provide per-session instructions from schedule/review, reusing the exact saved `runSteps`; active logger already exposes them. A total duration is not the same as the interval prescription. |
| PARITY-03 / P3 | Web ignores the media `verification` field; native Sources & details displays it. Existing records qualify playback, still-image limits and independent review/rights status there. | `components/exercise-guide.tsx:6`, `components/exercise-guide.tsx:23`; compare `mobile/src/exercise-guide-screen.tsx:89`. 880 of 888 media records contain this field. | Show the available qualification beside media or under Sources; retain the existing draft/source notes. Do not claim playback, exact movement or rights verification from the field's presence. |

The following are feature differences, not reproduced data-corruption bugs:

- Native setup cannot add commitments within the wizard; its dates page points to Calendar later (`mobile/src/plan-setup-runtime.js:122`). Existing saved commitments are included, and Calendar is available before a plan. Web has commitment entry and “None for now” inside setup. An in-wizard link/step would let users review constraints before choosing a plan without leaving setup.
- Web has movement and equipment library filters, standalone custom exercise creation/import, and full exercise-history links. Native has query/equipment filters and general History/Progress; its custom exercise creation is inside `NativePlanCustomizer`, while coach/manual editing is routed to `SessionEditor`. A new coach/manual user cannot create an absent custom movement directly from that editor. These distinctions should be explicit in parity acceptance work.
- Web Progress exposes estimated 1RM and a personal strength index. Native Progress currently exposes recorded load/amount, task distance/time/pace and external-load totals. This difference does not imply incorrect calculations or an equivalent native chart implementation.
- Personal concern holds have no in-app clearance action; only sample holds can be reset. The implementation deliberately cannot provide medical clearance. Treat the recovery/owner-review product path as unresolved design work, preserving recorded concerns and access to logs; do not remove hold guards as a shortcut.

## Coverage and observed safeguards

| Area | Work performed and result | Scope boundary |
|---|---|---|
| Shared web/native content | Compared all 100 entries in `mobile/docs/shared-snapshot.json` to their canonical source files: zero mismatches. | Same shared bytes do not prove identical UI behavior or compiled/deployed bytes. |
| Exercise identity and search | Executed all 995 canonical names against `matchesExercise`: every name self-matches; 995 unique IDs. | Does not measure search ranking quality or all synonyms. |
| Guide structure | Every canonical exercise has a guide; all 14 required fields populated; no missing or orphan guide IDs. | Field completeness does not mean 995 independent expert technique reviews. |
| Equipment qualification | Exercised all 27 unconfirmed/unspecified-machine entries against fully confirmed inventory: none automatically available. Reviewed one/pair dumbbells, no-floor, setup keys and curated role paths. | No physical inspection of a gym, machine or implement. Double-kettlebell work remains restricted without pair confirmation. |
| Media inventory | 888 media records, 885 matching shipped exercises, 863 exercises with photos, six with direct video URLs, 126 without photos or direct video. Three legacy media keys remain orphaned. | Counts are from local manifests. No new photo decode, source access, playback, licensing or exact-variation review. |
| Date-only scheduling | Five Node timezone processes checked local day interpretation, US spring/fall transitions, leap-day addition and month-end clamping. Date distances remained one day across the selected DST transitions. | No device-clock, travel notification, OS suspension or two-device account-timezone test. |
| Setup/accepted intent | Read both setup flows, shared plan matching/acceptance, duration/frequency/inventory checks and explicit manual fallback. Native includes prior commitments; web validates its captured calendar baseline. | No new exhaustive preference matrix or current browser onboarding run. The older matrix remains separately identified below. |
| Scheduling and stale changes | Read `eligibility`, `applyProposal`, commitment previews, skip/restore and pause/reuse guards. Stale plan/version, changed-event and active-work checks remain in source; date changes cannot carry arbitrary target changes. | Only the import-conflict cases above were newly executed in this audit. |
| Unknown/partial records | Read save validation, target snapshots, unknown-load handling, history corrections and progression prerequisites. History corrections preserve IDs/dates/targets/context and invalidate pending proposals; partial work does not become completed progression evidence. | Not a new storage-failure, interruption or encryption test. |
| Coach authority and youth | Read UI personal-youth acceptance restrictions, supervisor/dependency gates, app/manual/coach proposal separation and coaching restrictions. | Restore/legacy-youth policy is being examined by the separate security/data audit; this report does not claim a complete privacy/consent audit. |
| Static coaching | Read current before/after context matching, hold/symptom/owner/youth ordering, missing/partial/unknown handling, corrected-history use and unconnected selection adapter. It does not mutate plans/loads or treat logged volume as a proven PR. | No new 40,000-context run, external AI invocation or behavioral/clinical validation. |

The earlier fitness matrix in [the exercise-library audit](audit-2026-10-16/exercise-library.md) recorded 7,776 synthetic preference/inventory scenarios and 8,478 returned plans. That is prior evidence, not a test rerun by this review. It also recorded unsupported combinations; a structurally passing catalog is not a promise that every selected goal, frequency, equipment set and time window has a supported program.

## Receipts and limits

Ignored local evidence is under `.sites-runtime/comprehensive-2026-10-16/product/`:

- `probe.cjs`: reproducible synthetic calls and static selector reproductions; it asserts the current defect outcomes rather than pretending they are passing product regression tests.
- `receipt.json`: exact source commit, 28 file hashes, five defect observations, complete structural counts and shared-snapshot comparison.
- `date-receipt.json`: five timezone-process outputs and their explicit method.

No tracked historical report was overwritten. Only this new report and ignored receipts were written. No source change, build, publication, network research retry, live service request, physical-device run or medical/scientific efficacy claim is part of this audit. Network-denied reference research remains unverified; no denied host was retried or bypassed.

Remaining acceptance work includes mounted browser/native reproductions of the selector findings, native OS lifecycle and assistive-technology behavior, actual iPhone distribution/testing, full media matching/rights qualification, and the documented unfinished product capabilities. This report does not mark all master-prompt requirements complete.


## Implementation follow-up — product fixes

The initial findings and receipts above describe the earlier source. The following fixes were implemented in the working tree after delivered source `920a73621d9f2ab15bbddcd00139c9cebd155238`; they do not retroactively change that release. Native builds, browser rendering and publication are separate root-owned checks.

| Finding | Current implementation status | New evidence |
|---|---|---|
| PRODUCT-01 | Fixed in canonical tracking preview/apply and both editors. Unchanged saves are no-ops. Existing item fields, explicit/unknown loads, ranges, setup, source rules and notes survive untouched saves and reorder. Numeric changes produce before/after warnings; a changed range becomes the entered single target. Unsupported per-set count/rest edits, orphaned paired prescriptions and changes conflicting with saved timed intervals are rejected. | `scripts/check-tracking-integrity.cjs`: nine domain groups, including saved-state round trips, single-row changes, paired/timed cases, stale guards and full repeated-weekday scope. `scripts/check-product-editor-ui.cjs`: actual web/native editor callbacks preserve the metadata through unchanged saves and failed-save retries. |
| PRODUCT-02 | Fixed: any non-null per-set RIR is entered work, including zero; substitution rejects without replacing that record. Null/missing RIR still permits an otherwise untouched substitution. | Expanded `scripts/check-substitution-integrity.cjs`: restored RIR 0, 2, 6, 10, unknown/null paths, unchanged state/history/dates and existing source-progression restrictions all pass. |
| PRODUCT-03 | Fixed: import preflight rejects every matching commitment date, lists the dates and makes no automatic move. | Expanded `scripts/check-plan-import.cjs`: all six kinds, both provisional and confirmed, reject conflicts; equivalent nonconflicting commitments and retained history pass. Existing stale/tamper/authority tests also pass. |
| PRODUCT-04 | Fixed in both editors using the exercise ID as the edit identity. Reordering the edited row or its neighbor preserves the open draft. | Four actual JSX-callback journeys cover both reorder directions on web and native, then failed-save retry. Two further journeys verify unchanged range/source retention, and two verify conflicting per-set edits remain open with an error. |
| PRODUCT-05 | Fixed with canonical `newestFirstWorkouts` in `lib/presentation.ts`, consumed by web and native history lists. It sorts a copy by local workout date descending, then recorded finish/start time descending, then ID ascending; it changes no stored record or date. | Mixed, reversed and interleaved history fixtures produce the same result; frozen input arrays remain unchanged; appending a newer workout puts it first. Both client call sites were inspected. This is not a physical cross-device transfer test. |
| PARITY-03 | Fixed: web Sources displays the exact available media verification qualification alongside source notes. | Actual guide JSX contains the qualification, source note and safety text. Safe HTTPS links remain external with `noopener noreferrer`; JavaScript and credential-bearing URLs are excluded. |

Repeated-weekday application is explicitly labeled as copying the full listed prescriptions, including loads, setups, notes and source instructions. It skips active or already recorded sessions. Accepted coach/manual authority is retained; preserving a `sourceRule` field does not give the app permission to progress that owner's plan. Existing large imported targets remain unchanged even when outside the basic editor's new-entry limits. Editing a different numeric field does not silently replace that larger existing value.

All four focused scripts pass: nine shared domain groups, nine web/native callback groups, the expanded substitution suite and the expanded import suite. Web TypeScript (`pnpm exec tsc --noEmit --incremental false`) passes. Scoped ESLint exits successfully with zero errors and seven pre-existing warnings (unused editor imports/appearance variables and the guide's existing image element). No lint rules were disabled. `git diff --check` passes for the owned change set.

The callback harness executes current JSX handlers with deterministic mocked hooks and OS primitives; it does not render a browser or React Native layout. Canonical shared modules are injected in those focused tests. Root owns copying the shared native snapshot, native integration/types, browser/device checks and release verification. The focused machine-readable receipts are `.sites-runtime/comprehensive-2026-10-16/product/fix-ui-receipt.json` and `fix-validation.json`; the original defect receipts remain unchanged.

PARITY-01 and PARITY-02 are assigned to the separate native audit and are not marked verified by this product fix receipt. The feature differences, media/rights limitations, unfinished personal concern-clearance design and original Pages-root exclusion remain as documented above. No complete expert exercise review, physical-phone acceptance or live deployment is claimed here.
