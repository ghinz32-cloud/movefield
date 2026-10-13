# Web workflow audit — 13 October 2026

Scope: shared Movefield and Grizzly web UI. Both use the same plan, logging, history and calendar controls. This record covers source inspection and focused component/domain checks. The root audit separately records browser observations, production bundle verification and publication. It does not claim that every browser/device/button permutation was manually exercised.

## Fixed defects

| Flow | Finding | Change |
| --- | --- | --- |
| Active set logging | Five children were placed in a four-column grid. RIR displaced the load, amount and Save cells from their headers. Optional measurements were separated from their associated sets. | A focused `WorkoutSetRow` renders set number, load, amount and Save first; each set owns its RIR, undo and optional measurements below. Inputs retain unknown versus zero and timed decimals. |
| Workout keyboard navigation | Selecting or automatically advancing an exercise did not focus its heading; every focused exercise was labeled Exercise 1 because its index was taken after filtering. | Focus the selected heading/overview and display the original exercise ordinal and total. |
| Machine/setup text | Committing every keystroke could discard subsequent keys while a save was busy. | Stage text and smallest-increment input through the existing serial writer, keep it visible while writes queue, and disable during a complete command. The training/storage algorithm is unchanged. |
| Exercise substitution | Removing the focused exercise left the logger focused on a nonexistent ID. | Return to the overview when the accepted target snapshot no longer contains that exercise. |
| Saved workout editing | Editing state could carry over after closing and reopening through a session. A large edit form duplicated the read-only record below it. | Reset editing on close/open, key the editor by record, show independent exercise groups with the first open, and hide duplicate read-only rows during editing. Unfinished sets remain editable. |
| Session action labels | An active-session modal offered “Start workout”; a completed session without history could show an ineffective record button. | Label resume/return accurately and disable absent-record actions. |
| Calendar event creation | Previously selected dates and end dates could remain in a fresh event dialog. | General add buttons use today and clear the range; a date-specific action retains its date and clears the previous range. |
| Returning plan setup | Browsing another goal required repeating the personal/coaching/schedule screens. | Existing plan profiles may start at Goal and review saved equipment directly. Forward jumps validate all preceding steps. Equipment and commitments still precede plan choice, review and explicit acceptance. Fresh users and draft resumption retain their paths. |
| Preview recovery | An exception while constructing plan options could blank the app. | A setup boundary provides Retry/Return actions while retaining the accepted plan and history. The production-only runtime import defect discovered in browser testing is repaired separately by the runtime audit. |
| Today clutter | Sample status was duplicated and offline/update information competed with the first workout. Six secondary coaching controls were always expanded. | Compact sample and save chrome, a status disclosure for app files, and a disclosure for optional training adjustments. Holds, pending proposals and primary workout actions stay visible. |
| Settings | The page heading/focus target appeared below account and backup controls. | Move it to the beginning of Settings. |
| Motion | Generic buttons animated all properties, and closing panels could continue blocking navigation. | Limit ordinary button transitions to color/border/shadow. Cap closing dialog/sheet/alert surfaces at 150 ms and remove their pointer interception while closing. Grizzly opening/press effects remain, and reduced-motion overrides remain authoritative. |
| Offline lifecycle | Initial install could look like a pending replacement; copy named Movefield in Grizzly. | Integrate the platform audit's scoped registration observer and use the active brand in update instructions. No forced activation or reload. |
| Import instructions | Exercise import copy said whole-plan importing was future work despite an existing importer. | Point to the current credited plan importer in Plans. |

## Verification

- `tsc --noEmit --pretty false`: passed with the existing local-only hosting stub.
- `check-workout-ui.cjs`: six groups passed under both `EXPO_PUBLIC_APP_VARIANT=movefield` and `grizzly`. Exercises actual JSX handlers, actual workout updates, and synthetic React-hook boundaries for the history editor and setup. Checks correct set association, unknown/zero/RIR, busy controls, decimal timed work, reviewed history edits, unconfirmed inventory and youth-supervision guards.
- `check-web-calendar.cjs`: five groups passed in `America/Chicago` and `Pacific/Auckland`; navigation/callback checks remain intact.
- `check-today-view.cjs`, `check-grizzly-extreme.cjs` and `check-grizzly-preferences.cjs`: passed.
- `check-onboarding.cjs`: repaired its obsolete copied-dependency harness to use the canonical loader; all twelve checks pass. Its initial missing-module failure was a harness failure, not a successful application check.
- Focused ESLint over changed TSX: zero errors, 22 existing unused-variable/dependency warnings in the legacy page/setup files. No new control-flow error is suppressed.
- The existing browser test now waits for the attached offline status inside its intentional disclosure. It was not executed by this sub-audit; root browser evidence is recorded separately.

## Remaining acceptance boundaries

This work does not certify installed APK/IPA behavior, screen-reader operation, device battery use, all screen sizes or every custom profile combination. The branch's production bundle gate and root browser audit must be considered alongside these checks, especially because source-only tests did not catch the recovered-runtime import cycle. Private cloud credentials, phone distribution and store acceptance are separate domains.

All changes preserve per-set RIR, actual history, explicit plan acceptance, guarded changes, brand ownership, unknown starting loads and Grizzly's Wild/Clean options. OG Grizzly remains retired.
