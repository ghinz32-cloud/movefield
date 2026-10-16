# Foldable, tablet and multiwindow audit — 2026-10-16

## Baseline audit and scope

The audited release apps preserve active workout state across the tested window changes, but they are not yet qualified as foldable-optimized apps. Three reproducible layout defects need correction: the native logger loses usable input height in short windows, web set values are clipped beside the medium-width sidebar, and a Today action causes horizontal overflow at 840px with enlarged text. Native wide screens otherwise stretch the phone layout without using the extra space for useful context.

The baseline below was a read-only audit of source commit `f0130487760aa03d64b22f23002da5423da7ff4e`. No frozen application source, dependency, native project or release configuration was changed. The native browser harness compiled the actual App runtime with bundled Inter, Barlow Condensed and Frijole fonts. Its storage and OS boundaries are synthetic. The web probes used the existing local built Movefield review and Grizzly apps at ports 8826/8827; their HTML hashes and script URLs are recorded in the receipts, rather than claiming an unverified source commit for those pre-existing builds.

Window sizes below are logical browser pixels, used as approximations for app window dimensions. They are not physical device measurements. Browser resizing does not simulate a hinge, a fold posture, an Android activity recreation, safe-area changes, a software keyboard, UIKit multitasking, or hardware focus behavior.

## Verification completed

| Check | Coverage | Result |
| --- | --- | --- |
| Native App layout and resize continuity | Both brands, app text 100%/130%, 108 captured states across Today, logger, guide, workout list and setup | No root horizontal overflow; primary actions remain within the window; workout/history/rest deadline and setup values preserved |
| Native input identity | Repeated 360→720→840→600→1024→1180→360 widths, including short windows | Current input stays mounted; entered reps and normalized decimal load remain unchanged |
| Native clipping follow-up | Both brands at 130%, 600×360 and 360×360, input focused and scrolled into view | All four cases fail full input visibility through clipping ancestors |
| Shared web resize continuity | Both brands, root text scale 100%/130%, 76 captured states, including both sides of 768px navigation breakpoint | Input stays mounted; complete sample state, history and rest deadline remain unchanged |
| Shared web targeted widths | Both brands at 130%, Today at 840px and logger at 768/840px, plus drawer transitions | Confirms clipped numeric values and the overflowing Today action |

Native widths included 360, 600, 720, 840, 1024 and 1180; heights included 360, 480, 600, 720, 768, 780, 820 and 840. Web widths also included 767 and 768. The web 130% probe applies the same root font-size styling used by preferences, directly, for layout testing; it is not a browser zoom or preference-persistence test. All scenarios use isolated synthetic training records, and no user data or live hosted site was modified.

The initial native scan checks viewport bounds, which alone can incorrectly describe an input as visible when an ancestor clips it. The follow-up intersects the input with every clipping ancestor after scrolling/focusing. The latter is the relevant evidence for the short-height defect.

## Findings

### FOLD-01 — High: fixed native chrome can leave less height than one input

Reproduction: resume a workout, log a set to start rest, select 130% text, then resize the app window to 600×360 or 360×360. The next set's input is 65px high. After explicitly scrolling and focusing it, the visible height is:

| Brand | Window | Visible input height | Full input height |
| --- | --- | --- | --- |
| Movefield | 600×360 | 54.48px | 65px |
| Movefield | 360×360 | 54.48px | 65px |
| Grizzly | 600×360 | 54.48px | 65px |
| Grizzly | 360×360 | 27.20px | 65px |

The header, rest/footer area, persistent save-status line and bottom navigation consume nearly all vertical space. The Log set button remains visible, but the editable work cannot be fully displayed. Grizzly's two-line Frijole title compounds the loss. This is a real layout failure in short windows; it does not require horizontal overflow. A physical keyboard/IME may create related conditions, but that was not simulated.

Relevant source: `mobile/src/phone-ui.tsx` (fixed header/footer and bounded scrolling body), `mobile/src/workout-screen.tsx:55` (width/text-only stacking decision and footer rest text), `mobile/App-runtime.js:1577` (outer app shell/status/navigation).

Recommended fix: add a measured compact-height treatment. Keep the current action and a reachable Back route, but move rest context into a compact header control and temporarily remove redundant global status/navigation rows from the active logger when the measured body cannot fit an input plus its label. Preserve sample identity, save failures and concern notices in the remaining shell. Do not shrink text, crop safety messages, or solve this by putting more content behind a zero-height scroll area. Setup should also avoid two tall headers when height is constrained.

Acceptance: after focusing and scrolling each input, its rectangle must fit inside the intersection of all clipping ancestors. Test 100%/130% app text combined with OS font scaling, rest active/paused/complete, sample mode, long error and concern messages, and the actual keyboard. A viewport-only bounding-box assertion is insufficient.

### FOLD-02 — High: web numeric values are clipped beside the medium-width sidebar

Reproduction: open a sample workout, choose its first exercise, log one set, enter load `12.5` on set 2, use 130% text, and resize to 768×720. Both brands reproduce the issue.

`hooks/use-mobile.ts` changes navigation at 768px. At 130% text, the sidebar's `16rem` consumes 332.80px, leaving a 435.20px workspace. The logger still uses its multi-column desktop set layout because the compact fields are selected by viewport `max-width:480px`, not the logger's actual width. A load field is only 43.75px wide, with 21.20px of content width before any browser number control allowance. The rendered `12.5` needs 37.78px in the loaded Inter font. Its complete value cannot be read in the field. The rest timer card also becomes narrow enough to wrap the time across lines.

Relevant source: `hooks/use-mobile.ts:3`, `components/ui/sidebar.tsx` (`SIDEBAR_WIDTH`), `app/globals.css:216` and `app/globals.css:258`, `components/workout-set-row.tsx`.

Recommended fix: make logger field layout respond to its container width. Keep the labeled compact rows whenever the actual pane cannot fit complete values and accessible controls. Collapse the navigation to a drawer/rail before it leaves an unusably narrow main pane; enlarged text must affect that decision. Apply the same container rule to rest/concern cards. Test long realistic numeric values, not only a single digit or an empty input.

### FOLD-03 — Medium: Today overflows horizontally at 840px and 130% text

Both brands produce a document width of 862px in an 840px viewport. The `Add time off or an event` button is 269.22px wide and ends at x=862.23. This happens between existing viewport breakpoints, with the full sidebar present. The targeted scan identifies that action as the interactive overflow source; Grizzly's intentionally oversized decorative fog is separate and should not be mistaken for the cause.

Recommended fix: allow the Today action group to wrap based on its available content width, with a multiline button label and a maximum width of 100%. Prefer one consistent container rule rather than another isolated viewport exception. Recheck all Today actions with 100%/130% text at 767/768/800/840/900px.

### FOLD-04 — Medium: opened native windows have no purposeful wide layout

`NativeFlowScreen` has no maximum reading width or alternate pane. At 1024px, two numeric fields and the Log button stretch nearly edge-to-edge while most of the screen remains empty. Settings, setup and guides likewise remain one broad column. `useWindowDimensions` is currently used only by the logger, tab bar and calendar. The logger only decides whether fields stack; it never exposes the exercise list alongside the current set.

This is an opportunity rather than a state-integrity defect. Use the extra space for useful context without restoring the crowded phone dashboard.

### FOLD-05 — Platform qualification gap: orientation, lateral safe areas and hinges

Both brands inherit `orientation: "portrait"` from `mobile/app.json`, while `ios.supportsTablet` is true. The independent native platform audit verified that the installed Expo config transform enables all four iPad orientations with `UIRequiresFullScreen=false`; the portrait setting therefore does not remove the need to test iPad landscape and multitasking. See `comprehensive-2026-10-16-native.md` for that evidence.

The main App safe-area view specifies only `edges: ['top','bottom']`; modal shells use their own default insets. Lateral cutouts and taskbar/inset changes require device checks and a deliberate main-shell inset policy.

There is no app-level hinge/posture bridge or usage of `FoldingFeature`, `WindowInfoTracker`, viewport segments, or a device-posture browser API. React Native `useWindowDimensions` reports available dimensions and font scale; it does not identify a hinge, its occlusion, or tabletop posture. `react-native-safe-area-context` is available for insets. No new native module or dependency is required for a useful width/height-adaptive first phase, but that phase must not claim hinge-aware placement.

### FOLD-06 — Low: an open web drawer returns after folding back

Opening the drawer at 720px, widening to 840px, then returning to 720px reopens the drawer in all four brand/text contexts. `openMobile` survives the desktop navigation branch. Training data is unaffected and the drawer can be closed. Decide whether retaining an intentionally open drawer is desired. If not, close it on the transition to wide navigation without stealing focus or mutating the selected destination.

## Proposed adaptive design

Use the available content rectangle, not the device model or an assumption that a wide window means an open foldable. Derive width, height and effective text scale once, and pass the available pane width to field layouts. `onLayout` is important inside modals and split panes because whole-window dimensions can overestimate the space actually available to a child.

| Window treatment | Presentation | Main interaction |
| --- | --- | --- |
| Compact or short | Current focused single-screen flow, with compact-height shell when necessary | One current set/task and one primary action |
| Medium | Center the primary content with a practical maximum width; preserve a single route | Same controls and order, less unnecessary stretching |
| Expanded with sufficient height | Exercise/list pane beside one focused detail pane | Select an exercise on the left, log its current set on the right |

Start the expanded treatment conservatively around 840 logical pixels and at least 600px height, then require both panes to meet measured minimum widths. These are implementation starting points, not hardware standards. A 130% or larger text scale should delay the two-pane switch. A 720px open foldable can still use a centered, readable single pane when two usable panes do not fit. Never force two panes merely because a device is marketed as foldable.

For the workout, keep the exercise sequence and completion counts in a compact left pane. The right pane keeps the current set, load convention, optional detail routes and one Log action. A small rest control belongs with that pane. Guide or previous-set information can replace the optional detail area on request; do not display every coaching, guide, timer and history panel simultaneously. The engine remains responsible for paired-set order and the next exercise.

For Library, Plan and History, a selectable list can sit beside the selected guide, session or record. For Calendar, the month and selected day are natural panes. For setup, a short progress rail can accompany the current question; keep one question and one continuation action, rather than reintroducing the old long form. On tablets, a navigation rail can replace the oversized bottom bar when it leaves enough content width. Share structure and behavior between Movefield and Grizzly while retaining each brand's fonts, color and decoration.

Keep the existing workout/editor instance mounted as the layout changes. Do not put viewport dimensions into React keys, create separate phone/tablet state stores, or render duplicate logging controls in two responsive branches. Store selection by workout/exercise/set identity, preserve text drafts including unknown loads, and update layout styles around the same stateful children. On collapse, the selected detail becomes the compact screen, and Back returns to the same list selection. One save callback and the existing durable-state guards remain authoritative.

Without a posture API, describe this as an adaptive wide layout. A later optional Android WindowManager integration can report separating/occluding fold features and reserve their actual bounds. A tabletop mode should only activate from a real posture signal and explicit design; it cannot be inferred from a wide/short rectangle. On web, any viewport-segment enhancement must be feature-detected with the normal responsive layout as fallback. Do not add a decorative central gap and call it hinge support.

## Implementation order and acceptance tests

1. Correct FOLD-01/02/03 before advertising multiwindow or foldable optimization. Use available body/pane size and test clipped ancestors, complete input values and long labels.
2. Add a centered medium-width surface and a stable expanded list/detail layout. Keep the current data model, save/retry behavior and engine unchanged.
3. Qualify orientation and safe areas using Android fold/unfold and split-screen emulators plus at least one physical foldable. Test iPad portrait/landscape, split view and Stage Manager where available. Do not remove the orientation request until the resulting configurations have been exercised.
4. Consider posture-specific layout only after an actual API is selected and its native lifecycle/configuration effects are understood.

Required regression scenarios include active edits while folding, a pending/failed save while resizing, unknown versus zero load, machine setup locked after logging, all timed metrics, paired-set focus, guide/substitution return, setup drafts, history corrections, explicit partial finish, sample/private separation, and rest deadline continuity. Fold/unfold must never duplicate a save, complete a set, change a target or replace a profile. Add clipping-aware geometry checks and screenshot comparison with actual fonts. Include split-window heights down to 360px and OS font enlargement, not just 320px-wide portrait phones.

Accessibility checks should cover screen-reader order in both layouts, focus retention on resize, Back behavior after pane collapse, keyboard navigation, visible focus, touch target sizes, reduced motion, and no action beneath an actual hinge or cutout. Test browser 200% zoom/text separately from the app's 130% preference. The independent web audit identified additional 200% navigation/settings issues; those should be consolidated with the container-width fixes rather than treated as unrelated breakpoints.

## Receipts

All supplemental scripts and browser artifacts remain ignored under `.sites-runtime/`:

- `foldable-native-audit/results.json` — 108 states, source/font hashes, geometry, complete synthetic state continuity and screenshots.
- `foldable-native-audit/short-height-results.json` — four clipping-aware focused-input reproductions.
- `foldable-web-audit/results.json` — 76 states, HTML hashes, asset URLs, drawer behavior, state continuity and screenshots.
- `foldable-web-widths/results.json` — targeted input widths, text widths and exact overflow elements.
- `check-foldable-native-audit.mjs`, `check-foldable-short-height.mjs`, `check-foldable-web-audit.mjs`, `check-foldable-web-widths.mjs` — reproducible read-only harnesses.

The native probes bind App runtime SHA256 `f3b2b8046f92a624ae6fc2329e9411834daadd0c14998fc71d8b806a43704b1a` and workout screen SHA256 `6f0130196a5cdf3e2a22fb097a29e31beb4a4f9e3ac6dfa594eb5cbc1afcf299`. Existing release/main regression receipts were not replaced by these audit receipts.


## Corrective implementation

The subsequent authorized correction uses available window dimensions and measured child bounds. It does not infer a hinge or device posture. The original findings above remain as the reproducible baseline; release status belongs to the matching release receipt.

- Native workout logging keeps the same input/component instance when the layout changes. At sufficient width and height, a separately scrolling exercise list appears beside the current set. Selecting an exercise calls the existing focus callback; it does not complete or alter any set. The pane threshold rises with text scale, and a centered reading width limits stretching on larger windows.
- Short windows retain one primary action and Back while moving rest context into the scrollable body and hiding redundant global tabs/status. Sample identity, save errors and retry stay available in the logger. A measured-parent-height callback with hysteresis also enters this mode when the parent shrinks without a window-dimension change, as can happen under a keyboard-avoiding parent. Dimensions are not part of React keys.
- The main native safe area now includes left and right insets, and the shared native orientation is `default`. These configure rotation and inset handling; they are not proof of physical fold/unfold lifecycle, cutout, keyboard or posture behavior.
- Web navigation uses the available width, height and root text size to choose the drawer. Mobile navigation has a single scroll owner containing its header, destinations and footer. Logger fields respond to their content container; narrow panes use labeled rows that can show complete decimal values. Rest text stays on one line.
- Today actions and Settings account actions wrap within their container. Narrow weekly schedule cards keep complete day abbreviations and use two ordered rows when seven readable labels cannot fit. The same rules apply to both brands.
- History presentation uses the shared newest-first helper without changing persisted history order. Training targets, storage boundaries and routine selection are unchanged by the adaptive presentation.

The focused workload regression still covers ten groups: one current set, unknown versus zero load, invalid/failed save and retry, every optional metric/RIR, guide/substitution/run/setup/rest routes, timed activity, complete session guidance, paired-set order, explicit finish check-in and Back/reset behavior. The adaptive browser harness adds real-font geometry and state-continuity checks, rather than treating a screenshot or root-overflow assertion as sufficient.


Compact setup also removes the duplicate outer title, keeps the 48px Save & close action, and moves step/progress and validation feedback into the scrolling content. The fixed footer retains Continue. The strengthened probe found a real 360×360/200% case where the 69px age field was only 40px visible, then a validation-error case with 37px visibility. Those failures informed the compact treatment; normal viewport bounds alone would have missed them.

A separate focus regression probe identified a browser-adapter difference. React Native Web's `ScrollView` calls `dismissKeyboard` on every scroll event when configured `on-drag`, including delayed scroll-end events caused by removing an error above a field. Six isolated probes retained the same input node but lost focus through that exact call stack. The shared Flow scroll view now uses `none` on web and keeps `on-drag` on Android/iOS. Clearing an error also no longer requests a same-screen heading focus/scroll reset. The final correction assertion waits through the browser's delayed scroll-end event, then checks field identity, focus, complete visible geometry and successful corrected continuation. This is evidence about the browser-rendered native implementation, not an installed iOS/Android focus qualification.


### Web correction evidence

The independent web agent ran a 16-state matrix across both brands covering Today at840px/130%, logger at768/840/1024/1280px/130%, Settings and the drawer at320px/200%, plus the additional Today return at320px/200%. The original logger, Today840, Settings and drawer cases passed, with exact `123.45` content-width measurements and unchanged complete sample state through resize. The extra Today320 case exposed the section action/week-label issue described above. After correction, both affected Today states passed, followed by a final two-state check of stacked statistic labels. The final screenshots show complete non-overlapping weekday abbreviations and whole statistic words; no page overflow or axe findings were reported in these scoped checks.

Receipts: `.sites-runtime/comprehensive-2026-10-16-web/layout-fixed/results.json`, `weekday-details.json` and `visible-viewport-details.json`. The final visual artifacts are each brand's `*-week-bars-actual-viewport.png` and `*-mini-stats-actual-viewport.png`. The earlier 16-state matrix and final two-state polish checks have different build hashes; they are not presented as one identical-build whole-site audit.


### Final native correction evidence

Final receipt: `.sites-runtime/native-adaptive-ui/results.json`, checked at **2026-10-16 19:32:38 UTC**; clean runner log: `.sites-runtime/native-adaptive-ui-final.log`. The process exited0 and verified all nine recorded UI-source hashes still matched after execution.

| Check | Final coverage | Result |
| --- | --- | --- |
| Actual native App rendered through RNWeb | Both brands ×100/130/200% text;180 assessed screen states | No captured root overflow or page errors |
| Complete input visibility |240 full-width/full-height ancestor-clipping assertions across logger, setup and setup validation | All pass after scrolling the field into view |
| Constant-window parent reduction |360×780 window with the real logger parent constrained to300px, all six contexts | Both inputs fully fit after scroll; primary action stays inside the measured parent; state unchanged |
| Window and pane continuity |360→720→840→600→1024→1180→1680 and return, heights down to360 | Same current input instance; exact saved state/history/rest deadline and decimal values retained |
| Wide-pane exercise selection |Select another exercise and return in each context | Existing callbacks preserve all recorded work |
| Failed compact logging |Synthetic storage failure in each context | No saved state mutation; current entries retained |
| Setup validation correction |Invalid age13 then28 at360×360, all six contexts | Same field and focus after delayed scroll-end; full52/55/69px input visibility at100/130/200%; successful continuation |
| Existing focused workout regressions |Ten callback groups using real reducers | All pass |
| Static checks |Mobile TypeScript, scoped lint, diff whitespace | Pass |

The100% and130% cases use actual app preferences. The200% native case is an explicit test-only appearance-context multiplier, not an offered preference or a physical OS font-scale result. The test loads bundled Inter, Barlow Condensed and Frijole fonts. Storage, notifications, file transfer and other OS boundaries remain synthetic; physical keyboard/insets, Android activity recreation, iOS multitasking and hinge occlusion remain unqualified.

Final key source hashes:

- `mobile/App-runtime.js`: `024c96c7b2f5d33e86732b7d3a2072f13b676266db36ed64730272d5bf3455e5`
- `mobile/src/phone-ui.tsx`: `70eb5f0370b763fbad076c449671e49550078935c23ec3c7779642edb83800c8`
- `mobile/src/workout-screen.tsx`: `d4113cb6fb1047026493f8b167208df5f25d394b97a6c892389167f5c90e304c`
- `mobile/src/plan-setup-runtime.js`: `ca0c996de98286ff5618515d939501e0d4cd6a8d362e41381ad957d2cf6df482`

Representative screenshots are under `.sites-runtime/native-adaptive-ui/`: `movefield/logger-100-360x780.png`, `grizzly/logger-130-1024x768.png`, `grizzly/logger-200-1680x920.png`, `grizzly/short-visible-200-600.png`, `grizzly/reduced-parent-200.png` and `grizzly/setup-error-200-360x360.png`.

FOLD-01/02/03 and the main workout portion of FOLD-04 are addressed within this measured scope. Separate two-pane Library/Plan/History designs remain proposals. FOLD-05's platform/hinge qualification still requires actual device or suitable OS-emulator evidence. The low-priority drawer-open-state preference in FOLD-06 is not presented as a data defect or as a newly implemented behavior change.
