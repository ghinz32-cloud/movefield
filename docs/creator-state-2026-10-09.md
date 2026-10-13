# Creator and active-set repairs, 9 October 2026

Baseline: `8abfca45f1f910155011516eabffbebdf070821b`, repository `ghinz32-cloud/movefield`, isolated branch `audit/2026-10-09-creator`. Root owns integration and publication to `audit/2026-10-08-quality`; this milestone has not deployed or published independently.

## Claude findings and implemented behavior

| Finding | Source repair | Boundary |
| --- | --- | --- |
| C5 | Web and native whole-workout editors preserve explicit rep minimum and maximum, including named-template ranges. `userTargetError` defines the same validation for both editors. Edits follow exercise identity after reorder/removal. | App-led additions retain the conservative existing limits of 1–8 sets, target 300 and rest 600 seconds. User/coach tracking retains 1–20 sets, target 999 and rest 3,600 seconds. These are two distinct workflows with matching platform limits, not an expanded app prescription. |
| C6 | New app supersets carry `supersetGroup` and `supersetPosition`. Replacement preserves grouping, sets and rest from those fields exclusively. Saved-state integrity requires two ordered adjacent members with matching sets and rest after the second member. | Legacy note-only records retain their encoded sets, rest and notes. Importing or editing prose never creates grouping metadata. A legacy substitution receives its reviewed replacement defaults; no pairing is inferred from note wording. |
| C8 | `workoutSetReference` captures workout ID, exercise ID and set number. Shared edit/log operations locate that identity in current state, reject removed or different-workout references, prohibit identity mutation, and keep duplicate logging idempotent. | Numeric arguments remain for existing engine/test adapters. Root must convert every product event callback to the stable reference before claiming C8 complete for the integrated app. |
| Creator double taps | Both editors synchronously guard duplicate keep/save callbacks, resolve remove/edit by exercise identity, preserve drafts on rejected writes, and handle missing/replaced plans without non-null assertions. Native buttons and browser reorder actions debounce rapid repeats. The customizer requires a boolean acceptance result and leaves a rejected review retryable. | Root must update the customizer parent callback to return its actual acceptance result. |
| C7 | Root owns the latest-state finish repair in `app/page.tsx`. This milestone deliberately leaves that file and `mobile/App.tsx` untouched. | Integrated current-control tests and compilation remain root acceptance steps. |

Canonical shared changes were copied with `node mobile/scripts/sync-shared.mjs .`; the snapshot now includes `customize.ts` because native tracking uses its centralized validator. No browser or Node runtime dependency was added to shared product code.

## Verification

`scripts/check-creator-state.cjs` executes the actual transpiled native editor, browser editor and customizer with retained React hook state. Its 16 scenario groups cover rep-range save/readback, both workflow limits, identity after set reorder, stale/removed/different-workout references, metadata-based supersets independent of notes, legacy preservation, malformed pairs, duplicate keep/save, refused-write retries, missing-plan guards, stale remove callbacks, identity-preserving reorder edits and customizer duplicate acceptance.

Existing focused verification passed: 35 revision-10 groups, 18 program-selection/substitution groups, 13 focus groups, 9 catalog groups, 7 revision-11 groups/428,582 assertions, 3,582 named-template assertions, 30 progression regressions, 11 deep-audit checks, 29 training checks and the native 78-plan/seven-start-day engine checks. Narrow ESLint completed with zero errors and warnings; native TypeScript completed successfully. Web TypeScript exposed only the expected parent `PlanCustomizer` callback return-type integration change, which root owns.

The focused report and source fingerprints are in `docs/qa/creator-state-2026-10-09/validation.json`. Harness execution is not a physical iPhone, Android or browser interaction result. Root must run integrated web/native compilation, product lint and current-control regression tests after merging.
