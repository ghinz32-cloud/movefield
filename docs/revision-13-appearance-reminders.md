# Revision 13 — appearance, accessibility and workout reminders

Movefield remains a working name. This revision does not claim trademark clearance, public app-store availability, or completed AI integration.

## Changes

- Six selectable palettes: Volt green, Ocean blue, Iris violet, Sunset, Berry pink and Glacier teal. Green is the default. Preferences persist independently of workout records on each device.
- System, light and dark modes across the web workspace and native starter. Local Barlow Condensed headings and Inter reading text; commercial embedding permitted by the bundled SIL Open Font License notices.
- Original vector M, full-name wordmarks, monochrome mark, favicon and native app icons. Files are in `public/brand`. The construction was created for this project; no competitor logo is incorporated. Original artwork does not establish trademark exclusivity.
- Text sizes, stronger contrast, reduced motion, visible focus, a skip link, navigation heading focus, larger primary touch targets, theme-aware charts and form borders. Web text links can be underlined. Native text also honors system text scaling.
- One workout reminder per scheduled day, excluding rest days, paused/held plans, skipped/completed sessions, current active sessions and dates with commitments. Multiple sessions on a date share one reminder.
- Web reminders run only with the page open and may be missed when throttled. Calendar export provides explicit UTC-time events and alarms; imports are snapshots and do not sync with later edits.
- Native local notifications reconcile the next 30 workout days after relevant state changes and on foregrounding. Permission is requested only when enabled. Quiet iOS provisional permission is supported. Cancellation is scoped to workout notifications and does not delete rest alerts. Travel/time-zone changes require reopening the app to reconcile local times.
- Future model preference: Automatic, Qwen3 0.6B, 1.7B, 4B, or Off. Nothing is downloaded or run. Automatic is designed to prefer 4B only after device/runtime-specific qualification. The deterministic selector rejects unknown devices and falls back only to tested smaller choices.

## Naming screen

Preliminary web searches are not a clearance search. Exact names were searched with fitness, workout, training and app terms. Federal/state registrations, similar-sounding names, common-law use, domain ownership, app-store distribution markets and logo similarity still need a comprehensive check before a launch decision.

| Candidate | Pronunciation | Rationale | Current status |
| --- | --- | --- | --- |
| Setward | SET-ward | Moving forward one set at a time | No obvious exact-name fitness app surfaced in preliminary search |
| Repspan | REP-span | Training progress over time | No obvious exact-name fitness app surfaced; unrelated technical uses |
| Setstride | SET-stride | Strength plus athletic movement | No obvious exact-name fitness app surfaced; unrelated technical uses |
| Liftrel | LIFT-rel | Compact invented lifting name | No obvious exact-name fitness app surfaced; unrelated technical usage |
| Movefield | MOVE-field | Broad strength and movement identity | Provisional; no obvious fitness app surfaced, unrelated historical company references |

LiftSense is excluded: a directly competing strength-training app is listed by Dubaya Apps on Apple and Google stores. The earlier Liftsen suggestion is withdrawn because it sounds too similar. Also excluded after direct fitness-app conflicts: Liftspan, Liftward, LiftMark, RepWard, RepCrest, Strenva and SetForge.

## Verification and limits

Web and native TypeScript checks, targeted preference/reminder/model-selection tests, native storage and training regression checks, and native iOS/Android exports were run. `revision-13-validation.json` contains token-contrast results and test groups. A delayed-permission notification race was reproduced and fixed; the newer scheduled alert remains allowed after the stale response resolves.

The standard light/dark palette text and input tokens pass calculated contrast thresholds. This is not a claim of complete WCAG 2.2 AA conformance. Full browser reflow/keyboard/screen-reader testing and physical-device notification delivery remain required. The required managed browser skill was unavailable in this environment, so no substitute browser automation was used. Models have not been installed, tuned or benchmarked.

## Primary references

- [USPTO comprehensive search guidance](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks)
- [Existing LiftSense iPhone app](https://apps.apple.com/us/app/liftsense/id6802363370) and [Android app](https://play.google.com/store/apps/details?id=com.dubayaapps.liftsense)
- [Barlow Condensed license](https://github.com/google/fonts/blob/main/ofl/barlowcondensed/OFL.txt) and [Inter license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt)
- [WCAG 2.2 text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Qwen3 mobile builds and licenses](https://huggingface.co/software-mansion/react-native-executorch-qwen-3)

## Publication status

The live update was blocked by automatic approval review because explicit approval to upload the source and deploy to Cloudflare is required. All changes are saved locally; no successful publication occurred during this revision.
