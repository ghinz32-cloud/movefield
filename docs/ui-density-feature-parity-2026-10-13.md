# UI density and feature parity review — 13 October 2026

Read-only source and archive comparison, pinned to `7b489c929d7188e8cd8354116bc3ff1abfe84fb3`, against pre-audit `00559e3` and restored baseline `edb0d18`. This repository has October 7 uploads followed by the October 10 restored baseline; it does not contain a separately dated October 9 source checkpoint. User requests from October 9 establish intended behavior but are not an executable historical snapshot.

## Findings

No primary saved-plan, calendar, workout-logging, history-editing, customization or equipment action was removed by the latest audit. Some actions became harder to discover. A separate native Settings layout defect can make existing controls inaccessible on a phone. The current source ZIPs include the audited features; the user's exact installed or downloaded version cannot be identified from the report alone.

| Feature | Pinned web entry point | Pinned native entry point | Classification |
| --- | --- | --- | --- |
| Saved and previous blocks | Plans → Saved & previous | Plan → Saved & previous | Present before and after the audit. |
| Plan import/export | Plans import/export and saved-block controls | Plan → Saved & previous → Import a plan / Share plan | Native toolbar was moved from all Plan subtabs to Saved & previous in the audit; relocated, not deleted. |
| Calendar and day off | Calendar → date → add time off/event; Today also opens calendar | Today → Calendar and commitments, or My plan → workout date | Present. Native date-specific commitment creation and adjacent-month selection were repaired in the audit. Day off supports a through date. |
| Workout overview | Start/resume workout → exercise list with targets and completion | Today active workout → Exercises in this workout | Present. Matches the requested exercise-list-first workflow instead of horizontal exercise scrolling. |
| Focused exercise and auto-advance | Select exercise; logging its last set calls `focusAfterSet` | Same shared `focusAfterSet` flow | Present. At the end, returns to overview; earlier unfinished work remains listed. The overview includes completed rows as well, rather than showing only remaining work. |
| Partial-workout confirmation | Finish workout → explicit unlogged-work confirmation | Finish & save workout → confirmation | Present. Unlogged sets remain unperformed; shared workout snapshot guard protects confirmation. |
| Saved-workout correction | Saved record → Edit saved workout → review/save | History → record → Edit saved workout | Present. Web editing now opens the first exercise group and collapses the others; read-only duplicate rows are hidden during editing. |
| Training adjustments | Today → Adjust your training | Today coaching/change controls | Six web actions became default-collapsed in the audit. This is a meaningful discoverability regression. |
| Customization and equipment | Session details, plan customization and Settings equipment limits | Calendar/session actions → Customize your plan; exercise guide equipment settings | Present. Conditions for active workouts, accepted authority and reviewed changes remain deliberate guards. |
| Fonts, themes and accessibility | Settings appearance controls | Settings → Choose font / Choose palette; display/accessibility controls | Present. Grizzly font/palette disclosures predate the latest audit. OG Grizzly was intentionally removed at the user's request. |
| Backup/recovery | Private-profile Settings | Private-profile Settings | Native backup card was a sibling outside `NativeSettings`' ScrollView. Its full-height form competes with the bounded scroll area and can hide settings; mobile owner is correcting the layout. |

The six web actions hidden inside **Adjust your training** are Last session felt harder, Work felt easier, Equipment unavailable?, Move a workout, Returning after a break, and Report pain or a concern. The web owner is restoring their visibility while reducing layout density.

Two existing focus/scroll issues can make controls seem absent without removing them. Native `setFocusedExercise` only changed state; only the hero's Resume action scrolled to the logger. Web focused the exercise heading with `preventScroll: true`, while scroll-to-top depended on tab changes. Selecting or automatically advancing an exercise could therefore leave the new section outside the viewport. Both owners received these exact source findings.

Native Wild Today also stacked a 230-pixel artwork panel, a 40-pixel headline and body copy above a separate workout card. Large rest and contextual cards further displaced the logger. This height was introduced by wilderness styling before the latest audit. It is a density defect, not evidence that the workout features disappeared. The mobile owner is compacting these surfaces while retaining readable body text and touch targets.

## Download provenance

At the pinned checkpoint, both current source archives contain 241 entries. Seven user-facing feature files were compared byte-for-byte with the same checkpoint: `mobile/App-runtime.js`, calendar, settings, history editor, plan customizer, saved plans and shared workout flow. All seven matched in both archives.

| Archive | SHA-256 at the pinned checkpoint |
| --- | --- |
| `public/downloads/movefield-native-current.zip` | `d106a3d232830a33518f63c4fa1cc0e18260fcdf3701ac3ecc71a31c57b437cd` |
| `public/downloads/grizzly-fitness-native-source.zip` | `dbfd495e249080b0ba0536f00d7ca42d3bf282b500d529dcef6faa408cb2d135` |

Updated web Settings link to these current archives under the brand's own `/review/` or `/grizzly/` path. Older revision 10–13 archives remain in source, and the original `/movefield/` installation is deliberately preserved rather than silently migrated. An old archive, an existing Expo development folder, an installed website shortcut and the new source ZIP are different delivery paths. No conclusion about which one the user opened is established by this review. The source archives are not signed APK/IPA packages, and website/native profiles remain separate.

## Previously unfinished features

On-device Qwen execution and downloads, provider-qualified connected accounts, signed mobile distribution, next-block/starting-baseline editing, advanced sport/race coaching and external integrations remain explicit product gaps in the task register. The native model selector says it saves a future preference. These capabilities were not removed in the last audit and should not be presented as restored by density work.

This report records the pre-fix checkpoint and findings supplied to the web and mobile owners. It does not claim installed-device acceptance, a full rendered regression sweep, or validation of the subsequent density edits. No application source was edited by this read-only review.
