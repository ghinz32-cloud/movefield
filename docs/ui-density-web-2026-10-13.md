# Web density and feature-access repair — 2026-10-13

Baseline: `7b489c929d7188e8cd8354116bc3ff1abfe84fb3`, compared with the pre-audit checkpoint `00559e3`. Changes are shared by Movefield and Grizzly web builds. Native changes have a separate owner and report.

## Findings

- The audit moved each set's RIR selector onto its own large row. Combined with an additional measurements row, a straightforward load/reps/effort entry took unnecessary vertical space.
- Six existing Today actions remained implemented but were hidden inside a generic, initially closed “Adjust your training” disclosure. This made available features look absent.
- Repeated logger instructions, broad card padding, generous margins and the large Grizzly hero image pushed useful controls below the initial view.
- Moving between focused exercises changed keyboard focus with `preventScroll`, so the next exercise heading could remain outside the viewport.
- The native download button delivers a source ZIP. Its immediate description did not explicitly distinguish that file from an APK installer.

## Changes

- `components/workout-set-row.tsx`: load, amount, per-set RIR and the log/save control now share one aligned row. Unknown remains `null`, zero remains zero, and 5+ remains 5. Timed activities retain their four-column row without RIR. Small screens display a shorter Log label and a check icon for Saved, with full exercise/set accessible names preserved.
- `components/set-metrics.tsx`: optional measurements and notes remain directly accessible for every set under a shorter labeled disclosure. A recorded indicator shows when extra data exists. Undo stays directly beside that disclosure for saved sets. No metric fields were removed.
- `app/page.tsx`: restored all six Today adjustments as visible buttons: harder session, easier session, unavailable equipment, move a workout, return after a break and report a concern. Existing availability guards and handlers remain intact.
- `app/page.tsx`: suggested weight, its actual reason and the fill-unfinished-sets button remain visible. Existing source-specific exercise notes stay visible. Repeated general effort wording and the available-equipment maximum remain under a labeled disclosure. Warm-up/finish guidance, exercise guides, substitutions and machine setup remain available.
- `app/page.tsx`: focused-exercise and overview headings scroll into view only when outside the usable viewport. This does not change exercise ordering, completion, persistence or automatic advancement logic.
- `app/globals.css`: tightened card padding, page and section gaps, Today hero/weekly chart spacing, workout rows, rest-card spacing and the phone calendar. Primary touch controls and disclosures retain at least 44px height. Body text and input type sizes were not globally reduced.
- `grizzly/grizzly.css`: reduced the working Today card's artwork height and top offset, while retaining its bear artwork, claws, daily message, theme palette and animation behavior. The card no longer requires a 540px minimum height.
- `app/page.tsx`: added “Source ZIP for development; not an APK installer.” next to the native source download control.

## Preserved access and behavior

Plan tabs, full plan, custom plan, workout preview, calendar, time-off/event entry, workout overview, per-exercise logging, set undo, per-set RIR, optional metrics, exercise guide, substitution, suggested-load fill, setup entry, finish/partial-save confirmation, history correction, rest pause/resume/extend/end, sound and browser alerts are retained. The earlier fixes to setup typing, substitution focus, exercise numbering, history correction and guarded saving remain in place. No domain programming or storage schema changes were made in this web repair.

## Responsive implementation

Resistance rows use Set / Load / Amount / RIR / Save. At widths up to 480px, fixed columns are 1.25rem for the set number, 2.9rem for RIR and 2.75rem for save; load and amount share remaining space with 0.375rem gaps. At widths up to 350px, gaps reduce to 0.25rem and the set number to 1.1rem; RIR and save remain 2.75rem. Select padding is reduced so short RIR values remain usable. Optional details occupy the next row rather than squeezing controls further. These are source/layout checks, not a claim of phone browser visual verification.

## Focused verification

- `node scripts/check-workout-ui.cjs`: all six existing groups pass after updating the expected inline-column structure. Coverage includes core/header order; independent per-set unknown, zero, 3 and 5+ values; load conversions; blocked input during saving; saved-set undo; decimal timed tasks; history correction; and returning setup validation.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed.
- Shared component and guarded-handler review against the pinned baseline: no primary action removed.

Production build and supported live browser verification are performed by the root task. No local browser or preview was launched for this repair, and no phone screenshot or device-runtime claim is made here. No commit or publication was performed by this implementation agent.
