# Revision 10 — usability, plans, rest alerts and readiness

Reviewed 7 October 2026. This is a private, device-local prototype and a React Native/Expo source starter. It is not a launched coaching service. The website and phone keep separate records until a secure account service is implemented.

## What changed

- Removed “dose” from user-facing training copy. Used sets, workouts or weekly training according to meaning. Preserved RPE, RIR, 1RM and other useful workout terms. Clearer setup actions, validation focus and larger set-logging controls reduce ambiguity; no certified reading-grade or full accessibility-conformance claim is made.
- Plan selection puts compatible plans first. Choosing powerlifting never silently selects powerbuilding. Added short three-day hybrid, two-day running, novice SBD, no-equipment movement and standing/seated paths. The catalog contains 63 variants; the no-equipment introduction is explicitly limited and does not claim complete pulling or strength coverage.
- Draft plans can pause around trips and fixed events, preserve workout order and recovery gaps, and display a later finish date. This is bounded to 28 extra days. Existing accepted dates still require a reviewed change. Competition protection is rechecked when starting and moving workouts; one/two-day buffers are transparent product rules, not evidence of a validated sport-specific taper or guaranteed freedom from soreness.
- Log set starts rest after valid completed work. Blank/fractional repetition entries fail clearly. Repeated taps are idempotent. Editing completed reps/load or Undo requires logging again and clears that set’s timer; optional notes do not. Finishing the final set of the workout starts no new rest timer.
- Timers use stored deadlines, support pause/resume/extension/end, and survive valid saved-state restoration. Missing or undone source sets clear stale timers. Native scheduling serializes cancellation and scheduling, and includes the deadline in notification identity so stale alerts cannot replace newer ones.
- Native personal setup now uses the shared planning engine, with complete-block review. Coach/manual tracking targets remain user-entered. New plan acceptance preserves recorded history and rejects replacement during an active workout.
- Saved-state checks cover duplicate identifiers, invalid targets, impossible completed sets, active/history collisions and stale timers. Checked mutations retain dialogs on rejection. Browser saves detect another tab’s changes and use Web Locks where available. Invalid saved records are not silently overwritten.

## Verification

The regression suites cover training, onboarding, program selection, substitutions, exercise library, measurements, secondary focuses, equipment capacity, calendar changes, saved-state integrity and security. The program matrix passed 4,017 scenarios across 63 variants. Thirty-five revision-specific scenario groups exercise timer lifecycle, asynchronous scheduling races, malformed records, vacation scheduling and competition checks. The matrix is implementation testing, not clinical validation of every user/program combination.

Browser interaction verified compatible plan selection, full-block review, current-plan/sidebar replacement, invalid set entry, set logging, pause/extend/resume, notes versus actual-value edits and restoring a paused timer after reload. Desktop visual inspection found no clipping in the tested workout view. This is not a complete responsive or assistive-technology audit.

The Expo starter passes TypeScript, shared engine checks and Android/iOS Metro exports. Metro exports are JavaScript bundles, not compiled or signed native applications. No real-device notification delivery, lock-screen sound, process-kill behavior, device reboot or OS permission flow has been verified yet. See the revision validation JSON and mobile validation notes for scope.

## Notification boundaries

Native rest alerts use an OS local notification with default sound; no push server is needed. The user opts into permission. OS notification channels, Focus/silent settings and battery policies can suppress sound or delay delivery. The SDK's Android implementation falls back to inexact scheduling when exact-alarm access is unavailable; this starter does not request that special access.

The website provides a foreground chime and optional supported browser notification. Keep the page open. A background or closed browser cannot be treated as a reliable rest alarm. Enabling a notification preference is not proof of delivery.

## Security status and launch gaps

Current audits still report upstream findings. The web tree has one high braces finding and one moderate legacy esbuild finding. The mobile tree reports 15 high package entries arising from braces and node-forge advisories, with zero critical findings. These are dependency findings, not 15 independently demonstrated app exploits. The checked advisories list no patched release; audit suggestions include incompatible downgrades to Expo 44/older React Native. Those downgrades were not applied. Do not label this prototype production-secure or vulnerability-free.

Training Studio login, Google sign-in, biometric unlock, optional two-factor authentication, server authorization, shared accounts, encrypted backups and website/phone sync are not implemented. The website's sign-in is a labeled interface preview; the native starter uses unencrypted local AsyncStorage and stores no credentials. Production requires an identity provider, per-account server checks, recovery and deletion flows, least-privilege storage, youth/guardian sharing controls and tested sync conflict handling.

The library has 989 complete text guides and 1,726 source photos on the website. It does not have a verified video for every movement. General athletic foundations and coach tracking do not establish complete sport/position/season coaching for every US high-school sport. Advanced sport-specific blocks, ability adaptations, complete website/native feature parity and wearable integrations remain explicitly open work.

## Next implementation stage

1. Build branded iOS/Android development apps and run a physical-device acceptance matrix: fresh setup, interrupted logging, denied/revoked alerts, silent/Focus modes, lock screen, delayed alerts, pause/undo/end, relaunch, time-zone changes, large text and screen readers.
2. Add the shared secure account and data service. Establish ownership checks, offline sync, conflict resolution, export/deletion and recovery before real users rely on the app.
3. Complete native feature parity and remaining explicitly named sport/content coverage against the product requirements. Keep every program's evidence and extrapolations visible.
4. Evaluate one bounded post-workout AI explanation. Keep prescription, factual numbers and accepted changes in the tested engine. A phone model is optional; no runtime or paid AI endpoint is enabled in this revision.

## References used in this pass

- CDC plain-language guidance: https://www.cdc.gov/health-literacy/php/develop-materials/plain-language.html
- W3C predictable input: https://www.w3.org/WAI/WCAG22/Understanding/on-input.html
- W3C status messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- GOV.UK validation: https://design-system.service.gov.uk/patterns/validation/
- Expo notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Android alarm limits: https://developer.android.com/develop/background-work/services/alarms
- Expo SDK 58 beta: https://expo.dev/changelog/sdk-58-beta
- braces advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- node-forge advisory: https://github.com/advisories/GHSA-86w9-cpqp-85rv
- On-device AI options and restrictions: see ai-coaching-decision.md.


## Current continuation verification

See revision-10-continuation.md for additional fixes and 35 new scenario groups. The browser walkthrough above belongs to the inherited revision work. No fresh browser-control skill was available for this continuation; additional native controls have compile/domain/bundle checks only. Native tracking targets, equipment increments, reviewed progression, secondary focuses and sport/position context are now usable. Accounts/sync and real-device verification remain open.
