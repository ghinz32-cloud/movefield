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

## Publication

Final source publication and fresh compilation/deployment results follow in the deployment checkpoint. Resolve this local application source with git log -1 --format=%H -- mobile/src/workout-exercise-fields.tsx. The earlier ae5c181e checkpoint qualifies overview/navigation only; its builds do not qualify saved editing. PR1 stays draft and main/review-fixes remain unchanged.
