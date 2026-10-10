# Exercise-first mobile workouts

9 October2026. This request applies to the Android/iOS workout recorder. Existing web logging and AI activation boundaries are preserved.

## Overview and focused recording

The horizontal exercise strip is removed from active workouts. The overview lists every exercise with prescribed sets/rep ranges (or duration), logged counts and completion state. Tap to record only that exercise. Completing its last set advances to the next unfinished exercise in order. At the bottom, earlier unfinished exercises are listed; once all work is logged, the completion screen offers review/save. Completed exercises stay accessible for corrections. First-time demonstrations wait for an exercise selection. Navigation is bound to workout identity; reopening the app starts with the preserved overview/draft.

Milestone checks:14 compiled native callback scenarios, navigation domain cases, web/native TypeScript, zero-warning focused lint and48 shared hashes pass. Simulated hooks/device interfaces do not establish physical-phone layout, interruption, install or OS acceptance. New application changes are not yet deployed/built at this milestone.

## Finish and edit saved workouts

Finishing unfinished work first asks whether to save a partial workout and lists the remaining exercises. The confirmation binds to current set completion and is checked again at save. Complete workouts proceed directly to the existing check-in; symptom holds and empty-work safeguards remain.

From History, open a record and choose Edit workout, then select an exercise. The same focused fields support reps/duration, loads, RIR, optional measurements and notes. Changes are staged until Save changes; cancel preserves the original record. Partial corrections require explicit confirmation. Saving replaces the same record and keeps its date/times/target/set identities. Matching current/archived completion status is updated when appropriate, pending proposals are invalidated, and a concurrent active workout/rest timer is preserved. Another module’s changed record, a reopened editor, replayed callbacks, invalid measurements or zero logged sets cannot overwrite the original silently.

## Integrated local verification

18 compiled native UI scenarios,28 native encrypted-history/SQLite scenarios with205 assertions, navigation/edit domain guards, web/native TypeScript, zero-warning product lint,49 shared hashes and78 native plans pass. Both mobile Hermes exports succeed, with color-environment warnings retained. Web production build has zero warnings and all3 production suites pass.

The initial broad regression passed76/77; a retained-controls fixture assumed the former immediate entry view. The fixture now explicitly opens an exercise and executes the extracted pure field component. Its original safety assertions pass16/16. All77 suites therefore have passing final results, with the original broad log and repaired suite retained separately. A saved-edit UI test also found that a same-session status update could close an active workout; the corrected writer preserves active session status, with same/different-session tests.

Evidence: docs/qa/exercise-first-2026-10-09/. These checks use compiled callbacks, actual shared domain and real separate-connection SQLite, with simulated hooks/OS interfaces. Physical-phone layout, installation/interruption, browser/GPU/provider inference and store release are unverified. Existing AI credential/native-inference/release dependency/signing limitations remain.

## Publication and deployment

Application source `9cdcec081bee3525838ac334da1bb48de6690f13`, tree `45d6d18cc693a72179424c1936dd503bd7d09517`, is published/read back on `audit/2026-10-08-quality`. The earlier `ae5c181e` checkpoint qualifies overview/navigation only. This final source includes partial confirmation and saved editing.

Fresh exact-source [quality run38007809565](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809565) succeeds:77/77 regression suites, types/lint, native/shared checks, both Hermes exports and3/3 production suites. [Native compilation38007809566](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809566) succeeds on both platforms, with399seconds of compilation overlap. The retained [Android arm64 testing package](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809566/artifacts/11652690887) contains `Movefield-arm64-test.apk` and expires9November2026. The [unsigned iOS Release simulator package](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809566/artifacts/11651814590) expires9November2026; it is not an iPhone/TestFlight build. Android merged-manifest/resource/signing inspection and iOS privacy/transport inspection passed in the official jobs. Decoded quality/Android logs and official metadata are retained; iOS log retrieval returned a connector transport error. No independent binary download/replay or physical-phone acceptance is claimed. Native/CI toolchain warnings and existing release dependency exceptions remain qualified; root production build has zero warnings.

[Public prototype](https://ghinz32-cloud.github.io/movefield/) is refreshed at Pages `831fc32e045736fb9bb907b4de772099ce201ad7`, tree `a3916b10eb37eb64821cd0cc93a7a7589fc84957`. [Deployment38008331518](https://github.com/ghinz32-cloud/movefield/actions/runs/38008331518) succeeds. All63 live generated files/21,815,845bytes match their expected SHA256 and Git blobs. Manifest version is `750fc5a8f56e8ecbfe1caa2590c32f4e2cfd57233c552da370aa04923a748673`. The downloadable native starter has130 members/2,116,908bytes, valid CRC and SHA256 `c4739f89df0e4c868d96dad694539f62f13ce2fb86fb9a420d72e958f7eee57f`; every member matches this committed mobile source. This ZIP is source code, not an APK. The existing owner-private prototype was also refreshed from the exact canonical tree, preserving its audience/environment revision2/database. All101 live hosted assets match the packaged build; its130-member native ZIP has the same canonical digest and committed bytes. The sanitized receipt is retained as `hosted-delivery.json`. No private hosting origin, opaque IDs or credentials are in public evidence.

Install the Android artifact on your phone by signing into GitHub, downloading/extracting the testing package and opening `Movefield-arm64-test.apk`. Use Update over the existing app where offered; if Android reports a signing conflict, preserve the current app/data and record the exact message before replacing it.

Documentation-only delivery follows these application builds; resolve its checkpoint through `git log -1 --format=%H -- docs/workout-navigation-2026-10-09.md`. PR1 stays draft/open and main/review-fixes remain unchanged. The final documentation does not require another native binary.

## Modified application and verification files

| File(s) | Change |
| --- | --- |
| `mobile/App.tsx` | Exercise overview, focused recording, completion-aware advancement, partial consent and staged History/last-summary editor. |
| `mobile/src/workout-exercise-fields.tsx` | Reusable pure focused input component for active and saved workouts. |
| `lib/workout-navigation.ts`, `mobile/src/shared/workout-navigation.ts` | Target-snapshot/archived/legacy progress, navigation destinations and completion signatures. |
| `lib/workout-edit.ts`, `mobile/src/shared/workout-edit.ts` | Strict compare-and-swap history correction, immutable record identities, partial consent, plan/proposal updates and active-session preservation. |
| `lib/saved-data.ts`, `mobile/src/shared/saved-data.ts` | Export the existing strict saved-record validator for correction. |
| `mobile/src/mobile-engine.ts` | Enforce completion-bound partial acknowledgement at actual save. |
| `mobile/scripts/sync-shared.mjs`, `mobile/docs/shared-snapshot.json` | Register/synchronize49 canonical shared sources. |
| `scripts/check-workout-navigation.cjs`, `scripts/check-workout-edit.cjs` | Domain progress, advance, correction, identity and stale-consent guards. |
| `scripts/check-native-workflows.cjs` |18 actual compiled UI callback scenarios across overview, advancement, save and correction. |
| `scripts/check-native-history.cjs` |28 real encrypted SQLite scenarios/205 assertions, including one-entity correction and reopen. |
| `scripts/check-current-log-controls.cjs`, `scripts/lib/component-hook-harness.cjs` | Exercise-selection fixture and opt-in pure-component expansion; retained callback safety assertions stay intact. |
| `TASKS.md`, `HANDOFF.md`, this report | Milestones, exact-source publication, deployment and next physical-device acceptance. |
| `docs/qa/exercise-first-2026-10-09/` | Local, official CI and live download evidence; complete path/hash inventory in `evidence-inventory.json`. |

Next acceptance on a physical phone: overview fits without horizontal exercise scrolling; record a normal workout; skip an early exercise and complete the last; confirm/cancel partial finish; close/reopen an active draft; edit/cancel/save a past record; preserve another active workout and timer during correction. Existing AI activation, native authentication/inference, developer-owned distribution and strict release qualification remain separate outstanding work.
