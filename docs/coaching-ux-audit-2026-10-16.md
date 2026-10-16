# Workout coaching and UI/compatibility audit — October 16, 2026

This change adds local before/after workout coaching to Movefield and Grizzly and removes the generated day off from new calendars. Existing obligations and workout history stay intact. Local verification is complete within the scopes below; compiled Android release checks and live publication verification remain separate pending steps.

## User flow

- A new personal or sample calendar begins without example obligations. Saved commitments and setup drafts retain the user's choices.
- Starting an eligible workout opens a short preparation note. Canceling leaves the workout unstarted; confirming rechecks the current plan, date, obligations and training restrictions before saving the start.
- Finishing a workout opens feedback only after the record is successfully saved. A failed save keeps the recovery path and cannot produce a successful coaching review.
- Coaching uses at most three short messages, with comparison context behind a disclosure. Today keeps preparation and last-workout reviews behind buttons to avoid adding another large text card. Settings offers automatic messages, messages on request, or off. Existing safety notices are independent of that preference.
- Both brands use the same rules and history boundaries. Grizzly has its own encouragement wording and existing visual identity.
- A single easier/harder rating no longer automatically creates a target-change proposal on the web. Explicit review actions and the existing progression checks remain available.

## Coaching behavior

The shared engine selects original, local wording using saved records and accepted targets. It handles new sessions, comparable history, partial or additional work, missing weights or feedback, harder/easier effort, low enjoyment, old records, logging milestones, concerns, youth supervision and coach/manual plan ownership. Numbers describe recorded work; they do not diagnose fitness, certify technique or establish a strength PR.

Matching requires exercise identity, target details, progression context and equipment setup. Different running intervals, machines, missing owners, unsupported custom records and sample/personal history do not become interchangeable performance evidence. Edited records are reviewed as their current saved revision. The engine cannot change a plan, clear a hold or send history anywhere.

Research and wording limitations: [coaching research](coaching-research-2026-10-16.md). The source guidance supports the communication principles, not the clinical effectiveness of this message bank. Editorial phrase counts and independently selectable combinations are reported separately in the validation receipt.

## Platform preparation

| Surface | Implementation and remaining qualification |
| --- | --- |
| Shared websites | Same coaching module, local/offline operation, keyboard-operated dialogs and disclosures, responsive layouts and stored preferences. Build baseline is Chromium/Edge 111, Firefox 114 and Safari/iOS 16.4; exact browser verification is listed separately below. |
| Android previews | Shared snapshot, native coaching controls, encrypted saving and separate package identities. New preview versions are Movefield 0.1.6/code 7 and Grizzly 0.1.5/code 6. Installer identity and artifact receipts must pass before publication. |
| iPhone preparation | Separate bundle identities, explicit version/build settings, iOS 16.4 deployment floor and native keyboard/safe-area support. Unsigned iOS Hermes exports do not constitute an Xcode build, signed installer or TestFlight release. Apple signing and physical-device testing remain outstanding. |
| Future AI | Strict, unconnected selection adapter permits only current canonical message IDs and retains mandatory notices. It rejects stale contexts, unknown IDs and arbitrary prose/target proposals. Current cloud-v1 consent, budgets and minimized payload remain separate and unchanged. No new AI service is enabled. |

Native accessibility fixes include keyboard avoidance in the recovery screen and calendar badges/columns that account for app text size and system font scaling. See [Apple distribution preparation](../mobile/IOS-DISTRIBUTION.md) and [AI boundary](offline-coaching-ai-boundary.md).

## Verification scope

The reviewed application candidate is commit `de6c7abf2438cbcb01d67c8f4e259efa9d4aac9c`, tree `2831460f6e90b3374ac7e5e5db629f7a51eca25c`. The [machine-readable aggregate](coaching-ux-audit-2026-10-16-validation.json) preserves receipt timestamps, scopes, hashes, counts and outstanding release steps. Audit documentation can be committed separately from this frozen application candidate.

The reviewed website targets are `/movefield/review/` and `/movefield/grizzly/`. The original `/movefield/` root remains a separate earlier app; this audit does not claim that it contains the new coaching changes. Final audited application JavaScript/CSS hashes are frozen separately so installer-link publication can be checked without confusing it with an application-code change.

| Verification layer | Result and practical limit |
| --- | --- |
| Shared code and adapters | All 50 core checks passed, including web/native types, snapshot byte parity, existing training/data regressions and the future coaching-selection contract. Local or mocked cloud/provider checks do not establish a connected live service. |
| Coaching engine | All 20 groups passed: actual history/setup matching, concern and authority guards, missing/extra/partial records, feedback, stale context, factual comparisons and variation. A 40,000-context run per phase reached all 3,072 normal base combinations. These are phrase compositions, not independent coaching policies. |
| Editorial review | All 212 unique array strings were read. Independent 48,000-context probes and validated save/reopen edge cases passed. See the [copy review](coaching-copy-review-2026-10-16.md) for counts and research limits. |
| Lint | 380 files checked; zero errors and 82 warnings. Warnings include unused code, hook dependencies and image/alt-text rules. This is not a warning-free or complete accessibility result. |
| Actual static websites | Sandboxed Chromium checked both brands at 320, 390, 768 and 1280 CSS pixels, including 130% text, keyboard dialogs, setup preservation, settings, complete/partial saves and offline service-worker reloads. Across the documented runs, 82 axe states had zero reported violations. |
| Independent browser safety | Eight functional checks passed across both brands: stale concern/profile callbacks reject, failed finish retains work without a success popup, and double-click retry saves one record that survives encrypted reload. These are separate from the 82 axe states and are counted only once in the aggregate. |
| Native components and callbacks | Both brands passed actual React Native components rendered through RN Web, including before/after dialogs, save failures/retry, preferences, profile isolation, compact layouts and recovery controls. The iOS transition callback branch ran with `Platform.OS=ios`; this does not simulate UIKit. All ten recorded native source hashes match the frozen candidate. |
| Native bundle preparation | Four cleared-cache Hermes exports passed: Android and iOS for each brand, with coaching policy/copy present and recorded hashes. Both source ZIP manifests verify 259 entries against the candidate. Neither a source ZIP nor an iOS Hermes export is an installable iPhone app. |

The web audit fixed a narrow setup-header overflow, enlarged-text tablet Settings overflow, and a success-message contrast failure. The final visible success text measured approximately 6.36:1. The [detailed web receipt](audit-2026-10-16/coaching-web.json) retains the actual older asset hashes for the general matrix and independent safety runs; final coaching, harder-effort and initial-focus runs identify the final assets after the scoped Settings CSS correction. It does not relabel every earlier check as a run against identical bytes.

Offline reload preserved canonical saved values, workout counts, selected policy, authority/concern guards and comparison facts. Saved-object key ordering can change during normalization, which can change the editorial context digest and select different wording. Each displayed summary matched the engine for its observed state; the same serialized context remains deterministic. Exact wording across normalization is therefore not a persistence guarantee.

The primary web JavaScript grew by about 34.5 KB per brand, approximately 11.2 KB with local gzip compression; CSS grew by about 1.2 KB (under 0.3 KB gzipped). These are artifact size comparisons against the previous published previews, not measured loading-time results.

The local Node timing probe took approximately 12/10 ms before/after with 1,000 records and 172/170 ms with 10,000 records. These are single environment measurements, not phone performance guarantees. Native results are detailed in the [native receipt](audit-2026-10-16/native-coaching-results.json).

Firefox/WebKit installation endpoints were denied by the configured network policy. Safari, physical Android/iPhone use, installed-app upgrades, OS keyboard behavior, VoiceOver and TalkBack remain unqualified. Finite axe states and emulated viewports do not establish complete WCAG conformance, every font/palette combination or real-device usability. Apple build/signing and TestFlight are not configured; there is no signed iPhone installer from this work.

## Publication and compiled release verification

| Item | Current receipt status |
| --- | --- |
| Frozen application source | `de6c7abf2438cbcb01d67c8f4e259efa9d4aac9c`; source/tree identity verified locally. |
| Android build workflow | Run `38936451848` passed both brands: compilation, lint, unit tests and artifact checks. Publisher `38938205085` passed on its first attempt. |
| Android download release | [Verified Android preview release](https://github.com/ghinz32-cloud/movefield/releases/tag/android-ux-preview-de6c7abf2438): Movefield 0.1.6/code 7 and Grizzly 0.1.5/code 6. Both public APKs passed independent signature, package, version, source, manifest, backup, transport and coaching-marker inspection; ARM64, Android 7+. |
| GitHub Pages publication | Pending exact Pages commit/workflow and live HTTP/asset checks for both brands. |
| Signed iPhone distribution | Not configured; Apple build/signing and physical-device qualification remain required. |

The release owner will fill these publication fields and the matching JSON section after exact release/live receipts are available. Local passing checks and export files alone do not establish that the public site or downloaded installers contain this candidate.
