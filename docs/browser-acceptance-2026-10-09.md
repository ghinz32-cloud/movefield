# Live browser persistence and protected transfer observations — 9 October 2026

The root agent exercised the live HTTPS app at https://ghinz32-cloud.github.io/movefield/ using a synthetic **QA browser profile**. The observed desktop flow retained a logged set across normal reloads, saved only performed work from a partial workout, rejected invalid transfer passwords, and restored the same synthetic dataset after a protected transfer. This is bounded browser evidence, not full browser or phone acceptance.

The documentation agent recorded the root agent's actual interaction observations and independently copied and visually inspected the supplied screenshot. No additional browser interactions were performed while preparing this report. The browser version was not recorded in the supplied observation summary. Machine-readable observations are in [observations.json](qa/github-pages-2026-10-09/browser/observations.json).

| Observed action | Observed result |
| --- | --- |
| Complete synthetic profile setup | Eight setup steps completed. |
| Create plan and open workout | Plan contained 24 sessions. The opened workout showed 20 minutes, three exercises and six planned sets. |
| Log a synthetic selectorized seated leg press set | One set recorded with `QA stack / seat 3`, a 40 lb selected-stack value, eight repetitions and RIR 3. |
| Reload the active workout | Resume showed one of six sets logged and retained a rest deadline. |
| Save the partial workout | The UI warned about five unlogged sets. History contained one workout with one saved set and retained that history after reload. |
| Enter mismatched protected-transfer password confirmation | Transfer rejected. |
| Complete the protected-transfer download | An actual browser download occurred. |
| Restore using a wrong password | Restore rejected and the existing synthetic QA data remained. |
| Preview restore using the correct password | Preview showed one profile, one workout, one set and one plan. |
| Confirm replacement restore and reload | The same synthetic QA data was restored and remained after reload. |

The rest observation concerns a retained deadline, not a measured timing-accuracy test. Reloads were ordinary page reloads, not OS crashes or process kills. The replacement restore used the same synthetic data already present, so this flow does not establish replacement behavior for a different or larger dataset. The actual download was observed; its content was not independently inspected for this report. No passwords or exported transfer file are included.

The screenshot [workout-after-restore.png](qa/github-pages-2026-10-09/browser/workout-after-restore.png) is 1363 × 936 pixels and 120,536 bytes. Its SHA256 is `c35ef32f388dacb8c2e2626b1b15eb2863c3664cdca7fc23b47f79c43cb8a6a0`. It visibly shows the QA profile, partial-workout status, one completed set and one exercise, the leg press and `QA stack / seat 3`, the device-local label, the instruction to review unfinished work without adding catch-up sets, and the disclosure that this review applies fixed training rules without an AI model. The numeric 40 lb / eight repetitions / RIR 3 row is below the captured modal viewport; those values are supported by the root agent's interaction observations rather than the screenshot.

The existing [PAGE2 live readback receipt](qa/github-pages-2026-10-09/page2/live-readback.json) identifies Pages commit `4ab2b7ade02a431eb0798166149fbe882c893555`, source commit `d740c61084f44505273e900f7672ac92bae1a218`, and manifest version `26b641628dc88e99625d2422fb5d63c0ac74273ce465718e6f47e593fef01b10`. This links the observations to the live release context; the screenshot alone does not independently fingerprint the browser's loaded assets.

These observations do not qualify offline browser behavior, service-worker updates, OS interruption or storage exhaustion, physical Android or iPhone behavior, accessibility or phone reflow, large histories or concurrent tabs, account authentication or cloud sync, or real model inference. Those require separate acceptance evidence.
