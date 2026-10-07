# Revision 11 — usability, plan coverage and workout reliability

Reviewed 7 October 2026. These changes are saved in the development project. They have not been published to the existing private site. This is an audited prototype revision, not a production-readiness or universal-plan claim.

## What changed

| Journey | Repair or improvement | Boundary |
| --- | --- | --- |
| First visit | Clear local-prototype status; Saved training replaces misleading Log in; samples are identified; smaller screens put the entry choices first | Production account creation, recovery, authorization and sync remain unimplemented |
| Setup | Native setup drafts persist and resume; storage reads wait for queued writes; reset failures remain visible | Website and phone records remain separate |
| Plan choice | Eight additions bring the catalog to 71 variants: standing dumbbell foundations, dumbbell-assisted calisthenics and two-day strength plus walk/jog options | A foundation is not an event- or position-specific program; limitations stay visible |
| Coach/manual plans | Full exercise target editor, add/reorder/remove, time preview and explicit repetition onto upcoming same-weekday dates | This is not a complete multiweek editor; per-session prescribed load and rep-range editing remain open |
| Workout | Separate Saved and Undo controls prevent repeated taps undoing sets; custom timed exercise validation is consistent across clients | Entering numbers is a draft; rest begins automatically when Log set confirms completion |
| Rest | Compact sticky web timer on narrow screens; deadline survives reopening; native cancellation attempts both schedule cancellation and dismissal | No new timer after the final workout set; phone delivery and sound need physical-device tests |
| Equipment | Machine/setup editable before logging; active labels, limits and suggestions agree; setup carries into history | A new machine context does not inherit an old machine's progression |
| Progression | Coarse dumbbell jumps can offer reviewed extra reps for eligible muscle-focused work | No automatic jump above the existing percentage guard; strength-specific cases remain separately constrained |
| Recovery | Effort, symptoms and rating persist in an active workout; concern holds remain; reviewed return-to-training rebuilds all remaining sessions at reduced work with a valid dependency chain | Existing dates and completed actuals are preserved; no automatic return to previous volume |
| Reading and interaction | Plain workout/sets/training language; no user-facing “dose”; larger small text, 44px controls, visible focus, reduced-motion support, wrapping native rows | Visual and assistive-technology checks remain outstanding |

## Coverage, including unsuccessful selections

The general audit passed 4,297 planning scenarios over 71 catalog variants, with 2,481,929 assertions. Revision-specific checks added seven groups and 428,582 assertions, including 8,064 standing-dumbbell combinations across goal, adult age, experience, sex, block length and start weekday. These are deterministic software checks, not independent clinical validation or proof of suitability for every person.

A separate adult selection matrix contains 1,701 setups: 1,433 match a plan and **268 remain unmatched**, down from 331. Empty tracking calendars are not counted as app-generated plans.

| Unmatched selection group | Setups | Current response / next coverage work |
| --- | ---: | --- |
| Powerlifting with incompatible equipment or insufficient time | 142 | Explain the equipment/time requirement and offer a different goal or coach/manual tracking |
| Powerbuilding with bodyweight and bands | 63 | Offer home strength/muscle work with honest labeling; do not imply competition barbell progression |
| Two-day hybrid with short time windows | 36 | Explain the combined-session time requirement; shorter combined variants remain a gap |
| Dumbbell-assisted calisthenics with short time windows | 27 | Explain current duration limits; shorter variants remain a gap |

Separate checks cover no-floor restrictions, limited loads, unsupported youth selections, coach/manual repeat edits, actuals/history preservation, stale proposals and recovery. Sport/position-specific plans, event-specific endurance blocks and annual seasons remain product work. No-floor is one constraint and must not be treated as a general disability or rehabilitation assessment.

## Verification actually performed

- Web and native TypeScript checks passed.
- Native engine checks passed for 74 choices across all seven start weekdays.
- Existing planning, onboarding, program selection, focus, equipment capacity, audit, security, catalog, library and revision-10 suites passed.
- New revision-11 and native-storage checks passed, including ordered draft writes/reads, reset cleanup and custom timed/load handling.
- Android and iOS Metro exports passed. These are JavaScript bundles, not signed APK/IPA builds.
- Production website build passed. Built-worker checks passed: page 200; all 20 scripts have the response nonce; nonce rotates per request; POST returns 405; internal route returns 404; private/no-store response; revision-11 ZIP download returns 200 with a valid ZIP signature.
- The build warns that some client chunks exceed 500 kB; first-load performance still needs measurement on slow devices/networks. No fresh browser walkthrough, screenshot review, screen-reader audit or physical-device testing was performed. The required managed browser skill was unavailable; no substitute browser workflow was improvised.

Dependency review removed the moderate esbuild advisory by updating the nested development dependency to 0.25.12; the Drizzle CLI still starts. The remaining web audit reports one high advisory in braces. Native audit reports 15 high package entries stemming from two advisories, braces and node-forge, and zero critical entries. No compatible patched releases were available in the checked advisories; incompatible framework downgrade suggestions were not applied. These findings remain tracked launch work.

## Rest alerts: implemented behavior and acceptance gates

Rest starts from a successfully saved set, using a stored deadline. Pause, resume, add-time, undo, changed actuals and workout completion reconcile the timer and alert. Native alerts are local operating-system notifications with default sound and notification permission; they need no push server. The website uses its browser timer/notification path and cannot promise a reliable alarm after the browser is suspended or closed.

Before calling alerts production-ready, test iPhone and Android with the app foregrounded, backgrounded, locked and terminated; permission allowed, denied and revoked; silent/Focus modes; battery restrictions; timer pause/resume/extension; rapid consecutive saved sets; undo; clock change; and restored workouts. Confirm one alert at the current deadline and no stale alert after cancellation. Exact Android alarm access is not requested in the starter, so delivery can be inexact.

## A small model inside the app

**Feasible, but no model has been installed or benchmarked in this revision.** Evaluate a local model for a short explanation of an already-saved workout. The tested engine continues to own exercise eligibility, loads, repetitions, progression, dates and approved changes. Keep its readable review as the fallback on every device.

React Native ExecuTorch supports local inference and requires a native development build rather than Expo Go. The current project meets its documented React Native/Expo version floor, but that does not prove full dependency, operating-system or hardware compatibility. Start with an optional model download, interrupted-download recovery and explicit storage controls; evaluate older and newer iPhone/Android devices for factual accuracy, latency, memory, heat, battery and download size. Browser inference through WebLLM is an optional WebGPU-dependent route, not a universal browser capability. ML Kit GenAI's current under-18 app restriction makes it unsuitable for the existing 14+ product design.

Local inference avoids a per-request cloud inference fee, while model delivery, maintenance and development still cost money. A final model/runtime choice follows measured quality and device results, not parameter count alone. No external AI provider account, paid call or credential was added.

## Next implementation stage

1. Implement real account identity, ownership checks, shared records, conflict resolution, backup/export and deletion for web and native. Test two-user isolation, signed-out access, expired sessions, offline edits, retries and simultaneous changes.
2. Produce a native development build and execute the device/browser acceptance checks above. Resolve accessibility and layout findings, and recheck upstream dependency advisories before distribution.
3. Continue the plan coverage backlog, distinguishing impossible constraints, explicitly limited foundations and genuinely missing variants. Add event/season plans only with their required readiness and schedule inputs.
4. Benchmark the narrow on-device explanation feature against held-out saved-workout cases; keep all plan mutations behind engine validation and explicit approval.

Publishing remains paused because an earlier automatic approval review rejected the cloud deployment workflow under the development-only authorization. Approval to publish this concrete revision to the existing private app is the remaining release decision.

## Sources used for decisions

- [ACSM 2026 resistance-training update](https://acsm.org/resistance-training-guidelines-update-2026/) — supports consistency, individualized resistance training and major-muscle training at least twice weekly for healthy adults; it does not validate each app variant.
- [Concurrent strength/aerobic training systematic review](https://link.springer.com/article/10.1007/s40279-021-01587-7) — supports cautious combined-workout design; explosive-strength outcomes and sequencing still matter.
- [GOV.UK error messages](https://design-system.service.gov.uk/components/error-message/) and [error summary](https://design-system.service.gov.uk/components/error-summary/) — clear, actionable errors and focus behavior.
- [WCAG target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — target-size and spacing considerations; our 44px control choice is not a claim that WCAG AA always requires 44px.
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local scheduling, sound, channels, permissions and platform limitations.
- [React Native ExecuTorch](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started), [WebLLM](https://webllm.mlc.ai/docs/), and [ML Kit GenAI terms](https://developers.google.com/ml-kit/genai-terms) — local-inference feasibility and integration/age constraints.
- [esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv) — dependency findings checked this revision.
