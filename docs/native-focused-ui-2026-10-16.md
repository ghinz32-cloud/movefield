# Focused phone interface · 16 October 2026

This checkpoint records the native redesign source and focused component checks for Movefield and Grizzly. It does not establish publication of a new build. Full application navigation, final bundles, installer identity and deployment are separate release gates; the final release receipt will bind their exact source.

The user confirmed the previous Movefield APK installed with saved workouts, then requested clearer phone screens, fewer words, more space and less scrolling. This work changes navigation and presentation while retaining the existing training, record, appearance and permission boundaries.

## Implemented source

| Area | Current behavior |
| --- | --- |
| Shared phone screens | `NativeFlowScreen` provides a fixed titled header, one scrolling body and a footer outside that body. Back remains explicit. Safe-area/keyboard handling is opt-in when the parent does not already own it. Hardware Back is opt-in to avoid nested listeners; native Modal dismissal remains the parent’s responsibility. The scroll body accepts keyboard focus even when it contains only read-only instructions, with its children remaining separately accessible. |
| Shared actions | `NativeSettingsRow` and `NativeActionFooter` use full wrapping text and generous touch areas. Footer actions retain disabled state and optional exercise-specific accessible names. A later opt-in `compactBack` keeps a 48-unit Back target and full accessible label while showing an arrow in constrained workout headers. |
| Settings | A category hub opens Profile & equipment, Appearance, Accessibility, Workout coaching, Workout reminders, Account, Backup & data and the future on-device assistant preference separately. Account, backup and profile controls remain supplied by the application. Each category has a visible Back path. |
| Appearance | Display mode, color palettes, Grizzly style and heading fonts have their own screens. All 35 Grizzly fonts remain reachable through Readable/Wild filters and name search; saved appearance choices are preserved. |
| Reminders | Enable/disable and the local time remain available. The time draft survives category navigation; Save reminder time stays in the screen footer. Platform permission and scheduling messages remain visible in the scroll body. |
| Today | One compact workout card offers the existing appropriate Start, Resume, Build or Review action. Calendar is reached through the parent’s separate navigation row. The duplicate standalone bear hero is removed; Grizzly’s paw, claws and context-sensitive daily message remain. Concern, paused and overdue states keep their appropriate information and reviewed actions. |
| Main navigation | Five labeled destinations use consistent drawn icons, selected state and touch targets. At ordinary text size all five fit a 320-unit viewport. Enlarged labels use a bounded horizontal surface that keeps the selected destination visible. |

The parent integration also introduces focused setup, workout and guide flows. Their application-level behavior and final screenshots are qualified by separate checks; the Settings receipt here does not stand in for those journeys.

## Completed checks

`node scripts/check-native-phone-settings.mjs` passed for both brands with **13 accessibility/layout states**: six Movefield and seven Grizzly. It executes the real native Settings, shared screen/footer and tab components through React Native Web, using the actual appearance preference persistence implementation. Font loading and notification permission are mocked at their platform boundaries.

The checks cover:

- A short hub with separate profile, account and backup content, with no hidden removal of those functions.
- Reminder draft preservation across Back/reopen, time saving and the notification permission callback.
- Coaching, model preference, display mode, palette, accessibility and all 35 Grizzly font choices.
- Preference persistence after reload.
- The action footer remaining above navigation at 320 units and 130% app text.
- Full tab labels, selected-tab visibility, touch areas and bounded scrolling at 320, 390 and 768 units.
- Zero axe violations in the selected WCAG A/AA rule sets for the 13 tested states.

Native TypeScript and lint checks passed for the four owned UI components. Six existing Grizzly message/clock groups passed after replacing an obsolete layout assertion. The native-density check now verifies dedicated workout-screen/footer ownership and executes actual set-save callbacks: failed writes keep the state and focus, successful writes use paired-set focus, and a newer user focus is preserved.

The machine-readable [receipt](native-focused-ui-2026-10-16.json) retains per-state counts, source hashes and scope. The Settings run predates two isolated shared-primitive changes: the `compactBack` opt-in and keyboard focusability for the scroll body. The guide audit found a real `scrollable-region-focusable` violation on long read-only instructions at 320 units / 130% text. `tabIndex={0}` and `focusable`, both supported by the installed React Native View/ScrollView props, address that boundary without grouping or hiding children. The targeted guide rerun passed 22 axe/geometry states with zero violations across both brands, and a real keyboard End action scrolled the long read-only Set up body. Its receipt pins the updated shared-primitive hash. Compact workout headers remain part of the separate application logger checks; the original 13-state Settings hashes are retained unchanged.

## Visual review and remaining limits

Both brands’ screenshots were inspected, including actual 320-unit views. The ordinary Settings hub shows five categories before scrolling in a 568-unit-high viewport. Category labels are distinct and unclipped. At 130% text, the Reminders title wraps to two lines and its supporting text scrolls; the time field and fixed Save action remain usable above the tabs. Longer palette/font lists intentionally remain scrollable inside their dedicated pickers. The enlarged-text tab strip also scrolls horizontally at the smallest width.

These are browser-rendered native-component checks. They do not prove physical Android/iPhone keyboard behavior, screen-reader focus, cutout insets, installed-app performance, font rendering or a new APK upgrade. The final native application flow checks, compiled bundles, actual APK inspection and publication remain separate gates. No Apple signing setup has been supplied.

The [reference-review note](native-redesign-reference-2026-10-16.md) records that the initial 12 requests to official fitness-app and platform design pages were denied before substantive content was returned. This redesign is grounded in the user’s feedback and the app’s existing requirements; no completed competitor, Apple or Material review is claimed.
