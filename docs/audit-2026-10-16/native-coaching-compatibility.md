# Native coaching and compatibility audit

Date: 2026-10-16. Scope: current Movefield and Grizzly React Native source, shared coaching integration, Expo configuration and automated RN Web interactions. The accompanying release receipts determine which source was actually compiled or published. This document does not establish a physical Android/iPhone test, an Xcode build, or store acceptance.

## Implemented behavior

Both apps display the same shared engine's three-or-fewer messages before a workout and after a successfully saved workout. The default is automatic popups. Settings also offers manual opening or off. Today and saved workout records provide explicit review controls; lengthy explanations start collapsed. Grizzly receives its own encouragement wording while training facts and restrictions remain shared.

Starting from Today or Calendar checks the current session, date and eligibility before presenting a popup. Starting after review rechecks the current store, training snapshot, sample identity, local date and native engine rules inside the durable commit. Dismissal changes no targets or records. A failed start retains the review. Post-workout feedback opens only after the actual history write succeeds, and failed saves keep the active workout. Existing explicit progression review remains separate; native finishing does not automatically create easier/harder proposals.

Pending coaching becomes invalid after a profile, plan, record, sample or local-day change. On iOS, coaching transitions wait for the previous native sheet's `onDismiss` event before showing Calendar-to-coaching, save-to-feedback, History-to-feedback or feedback-to-record content. The pending presentation rechecks its original store and state. This avoids relying on a fixed delay; actual UIKit behavior still needs device qualification.

## Findings and changes

| Area | Finding and result |
| --- | --- |
| Recovery keyboard | The unreadable-profile recovery page had editable key/backup fields outside a keyboard avoidance view. It now uses the same iOS avoidance pattern as the main screen and modals. |
| Keyboard dismissal | Today, Plan, Library, Settings and recovery scroll surfaces support dismissal on drag while preserving handled button taps. |
| Calendar text | Saved/Event/Plan badges were fixed at 11px. They now follow the app text preference, and the scrollable grid width grows with app and system text scaling. Date labels and minimum touch targets remain. |
| Coaching disclosure | Expanded state is exposed through both native accessibility state and `aria-expanded`; it resets by context identity without an effect-driven state update. |
| Crowding | The previous always-expanded latest-workout summary is replaced by explicit feedback buttons. Explanations remain inside the requested popup. Manual mode does not automatically expand feedback on Today. |
| Sheet transitions | iOS coaching transitions use a dismissal queue with stale-context checks; other platforms present directly. |
| Release identities | Source now explicitly configures Movefield 0.1.6/build 7 and Grizzly 0.1.5/build 6 for iOS and Android. Existing package IDs, schemes and Android upgrade lineage are retained. Version settings do not prove a new build exists. |
| Distribution guidance | Updated Android release-number guidance and iOS build-number, identity, artifact inspection and device acceptance instructions. No Apple enrollment, signing or paid service was configured. |

## Existing platform protections reviewed

- Safe-area provider and top/bottom screen insets; bounded horizontal navigation that grows with app and system text scaling.
- Scrollable page-sheet modals, explicit close buttons and Android `onRequestClose` support.
- Labeled numeric and recovery fields; save/error accessibility announcements; separate unknown and zero loads; decimal comma entry and explicit correction review.
- High contrast, text size, Grizzly font/palette/clean-style choices and OS reduced-motion handling. Decorative art avoids accessibility focus; animated effects stop in the background.
- Main exercise library, instructions, photos and deterministic coaching are bundled. External form pages and videos require connectivity.
- Encrypted local records, failed-write retry, preserved original data after unreadable storage, manual backup/recovery, and isolated sample/personal and brand identities.
- Deadline-based rest timer and optional local notification permission. Phone settings may delay or silence notification delivery; denied permission retains the in-app timer.
- Cloud sign-in/backup remains gated on a configured and qualified backend. No network model is connected to these local coaching popups.
- iOS deployment floor is 16.4, matching the installed Expo runtime; Android minimum SDK is 24 and target SDK is 36. iPad support is configured and the installed Expo config plugin supplies its required orientation declarations; generated and compiled output remains to be inspected on Apple infrastructure.
- The actual-iOS-artifact inspector checks bundle identity, deployment floor, transport declarations and privacy manifests. No generated or compiled iOS app was treated as present during this source audit.

## Verification and its limits

`check-native-coaching-ui.mjs` executes the actual native App through React Native Web for both brands with synthetic per-profile JSON writes and documented OS-boundary mocks. It covers automatic Today/Calendar review, cancel/reopen, failed start/save preservation and retry, exact engine messages, manual/off preferences across reload, history navigation, 320px layout at 130% app text, sample isolation and recovery retry. Its `--ios-transitions` mode changes only the Platform.OS branch to exercise dismissal callbacks; it does not simulate UIKit or an iOS keyboard.

The existing actual-App UI regression checks all five tabs, load entry, logger write failure, guides, plan search/paging, 6/7-day discoverability, 45-record history paging and scaled/canceled corrections. Focused native workflow checks cover calendar commitments, saved plans, custom additions, progress, research references, Grizzly appearance and preserved training. A strengthened calendar assertion checks the rendered badge text at 130%. Typed compilation, native callback journeys, source layout checks, lint and resolved app-configuration identity checks accompany these workflows.

Final dated runner receipts record completion. Dependency advisories and canonical research/engine tests are tracked in the broader audit; this UI review does not certify them resolved.

## Open device acceptance

Real iPhone/iPad and Android runs are still required for safe-area cutouts, hardware/system navigation, software keyboards, largest system accessibility sizes, VoiceOver/TalkBack focus traversal, notification delivery, background/process restoration, native sharing, device-bound key recovery and installation over an existing record store. Apple compilation, signing, privacy aggregation, encryption/export declarations and TestFlight/App Store processing remain future steps. The owner has no Apple setup; source preparation and Hermes exports are not installable iPhone applications.
