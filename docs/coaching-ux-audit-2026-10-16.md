# Workout coaching and UI/compatibility audit — October 16, 2026

This change adds local before/after workout coaching to Movefield and Grizzly and removes the generated day off from new calendars. Existing obligations and workout history stay intact. Final validation and release identities are recorded below when available.

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

Pending final receipts. The audit distinguishes domain tests, actual browser controls, RN Web rendering, unsigned exports and compiled installers. Passing one level does not establish another. Firefox/WebKit installation endpoints were denied by the configured network policy; Safari, physical iPhone/Android hardware and screen-reader usability cannot be claimed from Chromium or RN Web checks.
