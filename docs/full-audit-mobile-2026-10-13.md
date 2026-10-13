# Native application audit · 13 October 2026

Scope: executed native source for both Movefield and Grizzly Fitness, plus focused callback and training-engine checks. Reviewed the five main tabs, plan setup/selection, sample switching, exercise logging and per-set RIR, finish/discard confirmation, saved-block reuse, calendar actions, target editing, substitution, history correction, modal keyboard behavior, settings and foreground notification dispatch. This is a source/callback audit, not a claim that every screen was tapped on installed Android and iOS phones.

## Findings fixed

| Finding | Correction |
| --- | --- |
| Every setup route could crash: the executed `PlanSetup` implementation referenced undeclared `sourceChoice`. Its adjacent declaration did not cover that prop. | Restored the actual prop and matching type. Default setup, a catalog choice and a public source routine now execute through selection and acceptance in the callback regression. |
| Actual native previews for `SPJUMP2` and `RNEASYREC4` failed. Existing native tests bypassed the actual preview helper with a much broader synthetic profile. | Samples explicitly include the definition's landing readiness or minimum recent running prerequisites, and disclose them in the preview. Tests now call the same `previewPlan` entry point as the buttons for every original program. These assumptions are never applied as a real user's readiness. |
| Accepting a sample preview in the personal profile replaced real profile fields with sample age, name, equipment and readiness. | Personal previews now open setup using the user's saved profile and chosen discipline/program. Only the isolated sample profile can adopt the demo assumptions directly. |
| The entire app repainted every 500 ms, including background/inactive screens; Explore generated complete plans inside that render path. | The rest repaint runs only in the foreground on Today with an unexpired deadline, stops at expiry, and cleans up on navigation/backgrounding. A separate local-midnight/foreground refresh maintains correct dates. Explore previews are memoized by date and discipline and its tree is constructed only on the Plan tab. No device battery/FPS benchmark is claimed. |
| Choosing a plan left the entire candidate list above its review; acceptance had no immediate duplicate guard or local exception handling. | Selecting a candidate focuses the review on that plan, with a direct “Choose another plan” action. Acceptance has an immediate ref guard, disabled saving action, caught errors and retry preservation. Setup step/review changes use the existing Wild reveal with reduced-motion/contrast rules. |
| Calendar adjacent-month taps kept the old heading; commitments always started on today; resuming required closing the calendar separately. | Adjacent dates update the visible month. Opening the commitment form seeds the selected date. The selected active workout has a direct resume action. |
| Reordering exercises while editing a target kept a stale array index and could overwrite the other exercise. | The in-progress editor follows the moved exercise's index. A callback regression verifies both identities and the original accepted targets remain intact. |
| Native Grizzly foreground workout reminders were suppressed by a hardcoded Movefield notification kind. | The foreground dispatcher uses the shared brand-aware `workoutReminderKind`. Both brands allow only the current registered reminder, and reject stale IDs and unrelated kinds. Rest-alert scope stays separate. |
| Keyboard-dismissal taps could consume modal actions, and some close/RIR touch areas were undersized. | Modal scroll containers retain handled keyboard taps, support drag dismissal, name their close action, and provide a 48 × 48 minimum close target. Per-set RIR choices also have 48 × 48 minimum targets. |
| Switching sample/private profiles left some modal/editor state from the previous dataset. | Switching clears calendar, target/customization editors, substitution/proposal/history-edit state and science disclosure. Training records and brand storage identities are unchanged. |
| Import/share buttons led every Plan subtab, adding distraction above ordinary plan selection. | Those tools are grouped under Saved & previous. |

The runtime audit also replaced eager namespace aliases in the recovered native runtime modules; that change is described in the separate runtime report and was integrated before final checks.

## Verification

- `npm run check` in `mobile`: passed.
- `npm run test:engine` in `mobile`: the actual 148 catalog/shortcut previews are checked across all seven starting weekdays (1,036 preview builds). There are 145 original catalog definitions plus three shortcuts; the shortcuts are not three additional unique researched programs. Every preview's first workout runs through native start, logging all required sets, finish and validated save/reload, preserving individual-set RIR. Existing partial-save, actual amount/load validation, guide completeness, history preservation, substitution, machine context and archive checks remain. The library contains 995 exercise guide entries.
- `node scripts/check-native-interactions.cjs`: passed real component callbacks with deterministic hook/OS boundaries. Covers default/catalog/source setup, selected-plan focus, acceptance failure/retry, profile fields, selected date/adjacent month/active resume, edit-and-reorder identity, and both-brand foreground notification permission filtering.
- `eslint` `no-undef` gate on `mobile/App-runtime.js`, `mobile/src/plan-setup-runtime.js` and `mobile/src/science-runtime.js`: passed. The pre-fix setup module had 14 undeclared `sourceChoice` references.

Root integration runs both brands' native platform exports and the full shared verification suite. Refer to the final integration receipt for those results, rather than treating them as independent installed-device validation here.

## Remaining verification and product limits

- No installed Android/iOS application, APK/IPA, physical touch behavior, VoiceOver/TalkBack, real OS permission sheet, locked-screen notification delivery, battery, or native performance profiling was available in this audit. The callback harness is explicitly not a native renderer.
- The new lifecycle check covers each preview's first workout. The separate canonical training audit covers broader staged/source progression; neither substitutes for longitudinal user testing.
- Account-provider configuration, signed distribution/store submission, on-device model execution, external health integrations and richer sport-specific coaching remain governed by the existing task register. This audit does not represent those outstanding features as complete.
- Exercise research supports principles and reviewed program structure; it does not prove these exact app-created routines superior for every individual. Equipment, time, experience and readiness constraints still control personal plan eligibility.
