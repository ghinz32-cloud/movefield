# Native application audit — 18 October 2026

Baseline: `ca96011ac53b7d544856281a175cfee0859ca844`, branch `codex/comprehensive-audit-2026-10-18`. This report distinguishes source/callback evidence from actual Android or iOS qualification. Both brands use the reviewed native implementation. No real profile, secret, identity, release metadata or `.openai` content was read or changed for these reproductions.

## Initial findings

| ID | Priority | Evidence | Baseline outcome |
| --- | --- | --- | --- |
| N18-01 | P2 | Actual provider + reminder hook reproduction | A failed preference read marks defaults ready, cancels existing authorized workout reminders and permits unrelated edits to overwrite unread preferences. |
| N18-02 | P2 | Actual provider reproduction with delayed/rejected OS promise | Cold start treats unknown reduced-motion permission as false; a rejected OS accessibility read is unhandled. |
| N18-03 | P3 | Source and existing denied-permission callbacks | Notification-denial guidance lacks a direct phone-settings action and explicit permission-refresh recovery. Earlier N-05 remains open. |
| N18-04 | P3 | Root composition review | Unexpected render errors have no app-owned fallback. Known record-read errors have their own preserved-file recovery. Earlier N-06 remains open. |

P2 identifies a user-visible correctness/accessibility defect; P3 identifies bounded usability/resilience work. Initial findings remain recorded even if repaired below.

### N18-01 — Failed preference hydration acts as a reminder opt-out

`mobile/src/appearance.tsx:22` catches a rejected `AsyncStorage.getItem` but calls `setReady(true)` in `finally`. The provider still exposes `defaultPreferences`, including `reminders:false`. `mobile/App-runtime.js:606` passes this false preference and ready flag to `useNativeWorkoutReminders`; `mobile/src/workout-notifications.ts:24–38` interprets it as an explicit disabled preference and cancels this brand's scheduled alerts. The provider's `update` at line23 also accepts an unrelated palette edit and serializes these unread defaults over the original preference record.

The actual provider and notification hook were executed with synthetic React hooks, a rejecting preference store and an existing owned scheduled notification. Receipt `.sites-runtime/comprehensive-audit-2026-10-18/native/baseline.json` records `readyAfterReadFailure:true`, `ownedReminderRetained:false`, cancellation of `owned-existing`, and one preference write after the unrelated update. The independent child review reproduced the reminder cancellation separately in `native-platform-review.md` in the same audit directory. No real notification or persisted profile was touched.

Required correction: retain unknown/read-failed readiness separately from valid default preferences, never reconcile reminders or save preference patches before successful hydration, and provide an explicit retry from Settings. A genuinely absent preference record may initialize defaults normally. Existing stored choices must not be reset when their read fails.

### N18-02 — Unknown accessibility preference starts motion; rejected read is unhandled

The same provider initializes `systemReduce` to false and calls `AccessibilityInfo.isReduceMotionEnabled().then(...)` without a rejection handler. The baseline probe holds this OS promise pending, observes `reduceMotion:false`, then rejects it and captures an unhandled rejection. This can permit decorative animation before the system's reduced-motion setting is known. A separate stale-result risk exists if the initial promise resolves after a newer `reduceMotionChanged` event.

Required correction: use a conservative no-motion runtime state while the OS setting is unknown, catch read failures without changing saved user choices, and prevent a late initial read from overwriting a newer OS event. No user preference or default heading-font choice needs changing.

### N18-03 — Notification settings recovery

`enableWorkoutReminders` and `enableRestAlerts` correctly request notification access only on explicit enable actions, and keep timers usable if permission is denied. Their denial messages currently stop at instructional text. `NativeSettings` has no direct `Linking.openSettings` action; the focused workout's Rest screen also has no direct recovery action. Permission grants must not silently enable either independent app preference.

Required correction: a named action in existing scroll content when permission requires settings; read-only permission refresh after returning; explicit distinction between denied, blocked and unavailable/unknown permission checks; no repeated automatic permission requests, new modal stack, fixed-header growth or workout/timer mutation.

### N18-04 — App render recovery

The App root supplies SafeAreaProvider, NativeAppearanceProvider, wilderness decoration and TrainingApp without a render boundary. The known storage-read error screen does preserve encrypted records, but it cannot catch a child rendering exception. No spontaneous production crash is claimed: this is a missing hardening layer to qualify with injected errors.

A useful fallback must render independently of custom fonts/theme providers, omit raw exception/profile contents, preserve files, and label reopening honestly. Pending durable and setup writes must settle before the UI remounts so a late old writer cannot race a fresh store. Any last-saved recovery must state that unsaved edits may need re-entry; reopening must not imply that an unsuccessful write became durable.

## Review coverage and retained platform gates

The current shell preserves the guarded iOS modal-dismissal queue, sample/profile ownership checks, saved-data validation, single-writer commit-before-display, explicit workout saves, deadline-based rest timing, complete shell safe-area edges and responsive bounded screens. These source protections are not evidence of actual UIKit, TalkBack/VoiceOver or OEM notification behavior.

The platform configuration and prior inspected binaries remain useful historical evidence, not a fresh installed-build pass. Final new APK merged-manifest/backup/signature/ABI/page-alignment inspection belongs to release qualification. Physical gates include notification permission/channel return flows on Android/iOS, device lock/background delivery, process death while saving, native keyboard/cutout/foldable transitions, screen-reader focus after modal dismissal and fallback, and signed Apple distribution. The owner has no Apple signing setup; this audit does not claim an installable iOS build.

The product-parity agent owns feature availability/performance and the security agent owns storage, crypto, import and cloud boundaries. Native findings that cross these scopes will be linked rather than independently changing shared logic.

## Repairs and executed regression evidence

All four bounded findings above are repaired in source. Baseline line numbers describe the original source, not the revised files.

| Finding | Implemented behavior | Evidence |
| --- | --- | --- |
| N18-01 | `NativeAppearanceProvider` keeps `ready=false` after a failed read, blocks preference writes until hydration succeeds, and offers **Retry opening preferences**. Settings retains explicitly selected profile/account/backup routes while preference controls are unavailable. Missing records still initialize normal defaults. | Actual provider composed with the actual reminder hook: both brands and Android/iOS branches keep an existing owned reminder, reject default-overwriting updates, and recover exact saved preferences on retry. |
| N18-02 | Unknown or rejected OS reduced-motion reads suppress motion. A newer system event takes precedence over the initial read. Saved font/motion choices remain unchanged. | Delayed and rejected OS promises, captured unhandled-rejection stream, newer-event/late-read ordering. |
| N18-03 | Existing Workout reminders and Rest timer screens offer **Open phone settings** when access is denied/blocked. Unknown permission offers **Check phone permission**. Returning to the app refreshes permission read-only, without changing reminder/rest-alert preferences or training. | Actual component callbacks on both platform branches cover denied/blocked, unknown, settings-opening failure and returning with granted permission. System Settings UI and actual notification delivery remain device gates. |
| N18-04 | A theme-independent render boundary offers **Reopen saved app**, discloses that unsaved edits may need re-entry, and omits raw exception/private contents. Reopening waits for whole native operations and durable/setup/preference queues. Closed instances cannot stage or commit new mutations. | Eight actual React/App scenarios through RNWeb cover both brands × delayed save/restore × success/failure. A further callback group executes the App's registered recovery barrier and actual durable writer against pending/rejected records plus a pending draft; the provider's serialized preference queue is also checked. |

Implementation locations: `mobile/src/appearance.tsx`, `mobile/src/settings.tsx`, `mobile/src/notification-settings.tsx`, `mobile/src/app-boundary.tsx`, `mobile/src/native-recovery.ts`, `mobile/App-runtime.js` and the optional notification-settings slot in `mobile/src/workout-screen.tsx`. The App recovery gate includes initial reads that may migrate data, dataset switches, sample reset, device-key recovery, profile replacement and erase operations. Existing authoritative operations finish; this mechanism does not claim to cancel an in-progress restore. The independent security review found no additional late-write blocker in the gate/flush composition.

Fresh evidence under `.sites-runtime/comprehensive-audit-2026-10-18/native/`:

- `resilience-callbacks.json` / `resilience-final.log`: **8 passing callback groups**, including failed preference hydration, reminder preservation, permission recovery, motion ordering, recovery barriers and safe fallback retry.
- `render-recovery/results.json` / `resilience-ui-final.log`: **8 passing actual App/React scenarios**. Exactly one new read occurs after each pending operation settles; failed writes preserve the complete prior saved state; successful restores finish before that new read; retained old logger callbacks cannot write before or after remount. Source hashes accompany the receipt. Storage/file/permission boundaries are synthetic; the real App, boundary, native callbacks and shared durable writer run through RNWeb.
- `types-final.log`: mobile TypeScript passed. `lint-final.log`: no errors, **13 existing warnings** in App/appearance. The four helper files also receive scoped lint.
- `check-native-density.log`, `check-native-interactions.log`, `check-native-audit-fixes.log`, `check-native-setup-wizard.log`: existing focused regression scripts passed, preserving retained-draft, exact RIR, schedule instructions, reminder ownership and failed-save behavior.

The initial failed Chromium launch is preserved in `resilience-ui-initial.log`; it was an outer workspace namespace restriction. The successful run retained Chromium's own sandbox and used the reviewed outer execution permission. `resilience-ui-harness-failure.*` preserves a test-injection variable-shadowing mistake that the new boundary caught; replacing the injected `window` reference with `globalThis` fixed the harness without changing application source. `resilience-order-expectation.log` preserves an over-specific test ordering assumption: draft and record flushes intentionally run concurrently. The final assertion requires both queues to settle and preserves record serialization rather than demanding an irrelevant cross-queue ordering.

The fallback catches React render/lifecycle failures. It does not promise recovery from native-process termination, an OS crash, every arbitrary rejected asynchronous operation, or unsuccessful data that was never saved. No physical-device or signed-iOS claim follows from these checks.

### Final bounded-layout qualification

The fresh adaptive run passed **180 states** across both brands and 100%/130%/200% text, with zero geometry findings or page errors. It verifies actual input clipping through ancestor containers, correction focus/identity after validation, constant-window parent-height reduction, fixed actions, and complete state/rest continuity during resize. The 200% multiplier is explicitly injected test stress beyond the offered preference, not an OS Dynamic Type test. Receipt `native/adaptive/results.json` binds **151 files** (all `mobile/src`, App and configuration plus the harness) and hashes the actual app/index/font artifacts; start/end source and artifact hashes matched.

The harness now supplies the additional read-only notification-permission boundary required by the real recovery component. It does not remove any prior geometry or callback assertion. Parity checks reuse those exact verified artifacts and independently verify their hashes before and after their journeys. The new fallback was also visually checked at 320×568 using the actual React recovery capture; its action and recovery explanation remain visible.

The final parity run also passed: **10 contextual groups, 64 captures, 32 automated axe scans, zero violations and zero page errors** at 360/390px and 100%/130% text. It exercises workspace navigation, Settings categories/galleries and link-underlining preferences, workout guidance/set entry, retained setup choices, inventory confirmation, plan alternatives and review. `native/parity/results.json` verifies the same 151 source hashes and generated bundle/index/font bytes before and after reuse. Automated checks cover those finite rendered states; they do not certify all possible content or actual OS accessibility behavior.

The final recovery rerun retains all **8 actual App scenarios** and adds **2 finite-state fallback axe scans** (one per brand) with zero violations. At320×568, both fallback roots have no viewport overflow and the named reopen action is at least48px tall and entirely visible. The earlier pre-axe receipt is retained as `render-recovery/results-before-fallback-axe.json`; the extension’s explicit Playwright-context requirement is documented by `resilience-ui-axe-context-failure.*`. No application repair was needed for that harness issue.
