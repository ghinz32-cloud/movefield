# U01 — web and native UX baseline

Source under review: application `9d7c13ed6352e74c0a7766bd2d80fb524a5b709f`, workflow parent `c9679d50c161a4407c3e4ca8dd70bc5d89d277e6`. Branch `audit/2026-10-08-quality`; local `audit/2026-10-08-integration`. Remote review/main/review-fixes heads rechecked, checkout clean before U01. No merge or deployment.

## Actual browser observations

Supervised internal preview opened successfully in the available cloud Chrome. Viewport 1363 × 936 CSS pixels, body 20.8px from the user's existing 130% text preference, dark Volt theme, comfortable density. No horizontal document overflow observed at this viewport (document width 1348). This is not small-screen or Android evidence.

The internal HTTP preview is not a secure context. Web Crypto is unavailable there; encrypted real-profile opening/setup persistence is correctly blocked. The opening error wrongly implies a damaged existing profile even on a fresh preview origin. The sample profile can be explored and changed in memory; no real user records were entered.

| Flow | Observed result | Limits |
| --- | --- | --- |
| Open | Encryption-unavailable recovery screen; sample opens | Normal saved-profile onboarding and save/reload cannot pass on this HTTP origin |
| Today/start | Today's eligible squat/bench workout starts; future workout shows preview | Sample only |
| Log/undo | Enter 5 squat reps; log changes count 0→1 and starts rest; undo changes 1→0 | In-memory sample; not a disk persistence test |
| Finish | Closing check-in returns to training; partial save warns about 11 unfinished tasks, then records one completed set and leaves next session scheduled | Existing records untouched; sample history becomes 35 workouts |
| Navigation | Today, Progress, Settings and Resume work; active-workout banner offers resume | Full keyboard/screen-reader acceptance remains pending |
| History | Existing 34 sessions and exercise estimates render; partial workout summary identifies unfinished sets | Chart values not independently recalculated in this UI milestone |
| Setup | About you, goal, coaching and schedule steps render; selected weekdays, start date, 8-week block and 75-minute budget are visible | Setup clearly says it is not persisted on this origin; later accept/save not tested |
| Settings | Appearance/text/density, backup, device-local data, account previews and unimplemented AI disclosed | Sample backup description claims browser encryption despite sample being memory-only; follow-up copy repair needed |

## Prioritized defects

| Priority / ID | Evidence | Bounded repair |
| --- | --- | --- |
| P1 / UX-01 | First squat Log set button starts at document y≈1987px. Expanded plate calculator/warm-up ladder precede all exercise logs. | Put calculators behind an explicit collapsed control; bring working sets before optional aids |
| P1 / UX-02 | Finish is at the top of a long web workout; native Finish is after all exercise cards/check-ins | Persistent, labeled session action area reachable from any set, without obscuring content/keyboard |
| P1 / UX-03 | Floating Appearance button overlaps the web rest panel area at bottom right | Reserve space or remove floating launcher in an active workout; Settings remains available |
| P1 / UX-04 | Fresh insecure preview says “Your saved data is still here” and “We could not open this saved profile” | Separate unavailable-encryption environment from existing locked/corrupt data; retain safe block |
| P2 / UX-05 | Native set row combines fixed-width set/RIR/log controls and flexible numeric fields with wrapping; heading columns remain fixed | Labeled responsive field groups and full-width Log action per set; inspect actual device before claiming no clipping |
| P2 / UX-06 | Native last-workout summary precedes current session; rest alert settings precede first exercise during active training | Show current activity first; collapse optional alert/setup information |
| P2 / UX-07 | Eight setup steps, long guidance paragraphs and repeated effort text consume space | Preserve necessary decisions but progressively disclose reference text; audit separately after primary controls |
| P2 / UX-08 | Sample sidebar says “Saved on this device” and settings says “encrypted in this browser” | Explain memory-only sample state consistently |

Baseline screenshot: `docs/qa/u01-workout-before.jpg` (synthetic Jordan sample, no real athlete data). The original capture also exists locally at `/workspace/scratch/1e916c3f78bc/movefield-ux-u01-workout-before.jpg`; that original is transient.

## Native review and unavailable acceptance

Inspected `mobile/App.tsx`: active training begins with the prior summary, active header, full rest-alert card, then exercises. Set-entry rows wrap; RIR wrapper is 56 points and Log is at least 64 points. Finish/save and discard follow every exercise and optional check-in. Native buttons generally meet 48-point minimums and safe-area/keyboard containers exist. These are source observations, not a rendered phone audit.

No connected physical phone or usable native UI surface is available. iOS/Android Metro exports at the earlier integration checkpoint are packaging evidence only. Android font scaling, software keyboard reachability, TalkBack, gesture navigation, rotation, background save/reopen and native inference memory remain untested. Do not mark M09/U09/U11 complete from this report.

## Checks and next milestone

U01 changed documentation/evidence only. Verified preview readiness, actual sample flows, screenshot existence, repository refs and documentation diff. Application regression results still refer to 9d7c13e, not a new run here. U01 baseline is complete with the limits above; U02 will repair UX-01/02/03/05/06 in bounded slices and verify accessible control behavior on the available browser plus native types/exports. UX-04/08 get their own small follow-up, rather than weakening encryption for preview testing.
