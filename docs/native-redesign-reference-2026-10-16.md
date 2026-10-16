# Native redesign: reference review and implementation guidance

The user confirmed that the Movefield APK installs with saved workouts, then asked for a major phone redesign for both brands: clearer next actions, fewer simultaneous choices, much less text and less whole-page scrolling. Preserve working records and training rules while changing how people reach them.

**Reference access is pending.** The first 12 requests to official fitness-app and platform pages were denied by the configured proxy before page content was returned. None of those pages has been substantively read in this pass. The recommendations below are original product proposals grounded in that user feedback and the existing app's data/authority requirements; they must not be presented as findings from a completed competitor or Apple/Material study. No branded assets or screen layouts were copied.

## Proposed phone structure

| Surface | Main decision | Visible first | Open separately |
|---|---|---|---|
| Setup | Answer the current setup question | Short title, relevant choices, progress, Back and Continue | Explanations and advanced preferences; preserve every answer on Back/reopen. |
| Today | Take the next appropriate action | Current status, one workout summary and one primary action | Workout preview, calendar, coaching detail and longer explanations. |
| Active workout | Record the current set | Exercise, set position, planned target, actual inputs and Log set | Exercise picker, guide, past records, substitute selector and additional metrics. |
| Finish | Save the work actually performed | Completed/remaining summary and Save workout | Optional effort/enjoyment detail; keep any concern question clear and optional where existing rules allow. |
| Progress | Review recorded work | Recent records and a clear exercise/date filter | Individual workout, correction and comparison detail. |
| Settings | Choose one setting group | Short labeled destinations | Appearance, equipment, reminders, storage/account and advanced options each get their own screen. |

These are proposed destinations and hierarchy, not a requirement to add six bottom tabs. Keep a small, stable set of labeled primary destinations, with secondary tools inside their owning area. Do not give Today, Calendar and Plan several competing buttons that all start the same workout.

## Onboarding

Use one coherent decision per screen rather than a long form. A sensible order is training authority and relevant age context, main goal, schedule, session length, location/equipment, then plan review. Show only relevant follow-ups, such as sport/event context or exact equipment availability. Preserve the existing youth and coach-owned-plan restrictions; fewer words must not remove necessary questions.

Equipment selection needs a focused drill-down rather than one cramped checkbox wall. Ask the location first, then broad equipment categories, then exact capabilities when needed. One dumbbell is different from a pair; a generic gym selection does not prove that a particular machine exists. Show a concise selected-equipment summary with an Edit action before plan acceptance.

Do not make every optional setting a mandatory screen. Offer “More preferences” and allow the current choices to be reviewed together before acceptance. Back, close and app restart must preserve the draft. Accepting a plan remains a distinct action after the actual schedule and any unresolved constraints are visible.

## Today and navigation

Make Today answer “What should I do next?” A visible concern or required review takes priority over ordinary encouragement. Otherwise, an eligible open workout should offer Resume; an eligible scheduled workout should offer Start workout; an empty personal plan should offer Build a plan. Future, overdue, paused and blocked sessions retain their existing reviewed actions rather than acquiring a misleading Start button.

The workout summary can show its title, duration estimate and exercise count. Use a small secondary Preview control. Put history charts, full plan editing, source explanations and appearance options on their own screens. Keep optional coaching to one brief line or a clearly labeled disclosure; required concern/authority notices remain visible.

Use stable destination names with text labels, a selected state and a predictable Back path. A tab switch should preserve drafts and any active workout. Avoid nested sheets for ordinary navigation; reserve a sheet/dialog for a focused choice or confirmation. Do not rely on a swipe gesture as the only way to reach the next exercise or return.

## Active workout

Center the screen on the current exercise and set. Keep the planned target visually distinct from what the person actually enters. Show load units and the relevant load convention at the input; per-hand dumbbells, assistance and a machine setup must not become hidden assumptions. Preserve the useful previous-set context without displaying every historical explanation.

Use one clear Log set action. Rest begins after a successful save, and a failed save must leave the entered values available with a visible retry action. Keep Undo separate from logging. During rest, show a compact timer and the next action without replacing the whole screen with instructions.

Offer labeled controls for Form, History and Substitute, plus an exercise picker. Substitution must remain easy to find when the gym lacks equipment; selecting it still uses the existing compatibility and review rules. A full-workout overview remains available for jumping between exercises, paired sets and unfinished work. Advancing should not silently mark a set complete or change a target.

Finish should first summarize saved versus unfinished work, then offer a short check-in. Show post-workout coaching only after durable saving succeeds. Closing a popup must not discard a workout, repeat a save or erase a failure notice.

## Text, branding and accessibility

Use action labels such as “Log set,” “Resume workout,” “Change exercise” and “View plan.” Prefer one short supporting sentence; move rationale and uncommon options behind a clearly labeled details control. Removing all explanation is not the goal: keep errors, required warnings, load meaning and the consequence of acceptance available at the decision.

Apply the same structure and readable data controls to Movefield and Grizzly. Grizzly can keep its expressive headings, artwork, color and restrained motion around the content. Numeric inputs, instructions and primary actions should retain readable type, clear contrast and usable spacing. Do not make a decorative claw, color alone or an unlabeled icon the only indication of completion or a warning.

For this implementation, adopt a generous 48-logical-unit touch-area target and verify actual layout at small widths and enlarged system/app text. This is a proposed product acceptance target, not a newly verified quotation from Apple or Material. Permit scrolling when large text or a small keyboard viewport requires it; reducing routine scrolling must not turn into clipped content. Primary actions need safe-area and keyboard clearance, with focused inputs and errors reachable without losing position.

## Concrete review checks

- On first arrival and after reopening, the next action is identifiable without reading a paragraph or opening a menu.
- A new plan can be created with focused screens; Back/restart preserves choices and the final review shows real targets and equipment.
- An existing saved workout remains present after installation/update, navigation and appearance changes. The user's successful install is one real-device observation, not qualification of every device or upgrade route.
- A person can log the next set, access its guide, substitute equipment and resume after interruption without scrolling through the entire workout.
- Failed save, duplicate tap, stale preview, concern/hold, paused plan, youth and coach-owned-plan scenarios retain their current protections.
- Small-screen/large-text, keyboard, screen-reader labels/focus, Android Back and iOS dismissal behavior are checked separately. RN Web results alone do not establish native OS or assistive-technology behavior.

## Official pages requested

All entries below currently have the same result: **proxy CONNECT 403; no page content read**. They are a reading queue, not supporting citations for unobserved competitor features. Retry only after the normal managed allowlist is updated; no denial was bypassed.

| Publisher | Requested official page |
|---|---|
| Hevy | [Features](https://www.hevyapp.com/features/) and [workout routines](https://www.hevyapp.com/features/workout-routines/) |
| Strong | [Product](https://www.strong.app/) and [Help Center](https://help.strongapp.io/) |
| Fitbod | [Product](https://fitbod.me/) |
| Strava | [Record an Activity](https://support.strava.com/hc/en-us/articles/216919177-Record-an-Activity) |
| Nike Training Club | [Product](https://www.nike.com/ntc-app) |
| Apple | [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search) and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Android design | [Navigation](https://developer.android.com/design/ui/mobile/guides/layout-and-content/navigation) and [Accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility) |
| Material | [Navigation bar](https://m3.material.io/components/navigation-bar/overview) |

The exact request times and denial outcomes are retained in `.sites-runtime/native-redesign-2026-10-16/access-initial.json`; the research receipt distinguishes verified local requirements from pending external review. Existing local references consulted: the decisions/invariants in [product requirements](product-requirements.md), [project instructions](../CLAUDE.md), and the scope/limitations of the [prior native component audit](audit-2026-10-16/native-coaching-results.json). Historical completion tables are not treated as the current implementation inventory.
