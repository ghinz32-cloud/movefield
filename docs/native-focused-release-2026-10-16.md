# Focused phone release audit · 16 October 2026

**Android previews published and independently inspected; GitHub Pages delivery and both browser downloads are verified.** The companion [validation receipt](native-focused-release-2026-10-16.json) separates completed source/component checks, prior integration runs and pending final release gates. The wider audit and foldable follow-up remains in progress; this release does not complete every master-prompt requirement.

The working branch is `codex/native-focused-screens-2026-10-16`, based on `7ab35a251c60900e08a707f82c0a4f2dfc01d438`. The qualified source is committed as `f0130487760aa03d64b22f23002da5423da7ff4e`, tree `9c322c9d1f465c5e9157b76b67e97c0b65dc2104`; source push and Android CI completion have been verified. Published Android identities are Movefield **0.1.7 / code 8**, package `com.ghinz32.movefield`, and Grizzly **0.1.6 / code 7**, package `com.ghinz32.grizzlyfitness.prototype`. Their historical signing certificate remains unchanged. Build `38949459698` and publisher `38950874024` passed on their first attempts. Both actual public installers were independently downloaded and inspected. Release: https://github.com/ghinz32-cloud/movefield/releases/tag/android-ux-preview-f0130487760a.

## Product changes

Both brands move toward focused phone screens with one clear next action:

- Today presents a compact workout summary with the appropriate Start, Resume, Build or Review action. Calendar, plan tools and guidance open separately. Grizzly retains its artwork, paw/claws, appearance choices and context-sensitive messages.
- The active workout centers on one exercise/set, actual reps/load and a fixed Log set action. Rest stays visible; exercise selection, prior sets, metrics, guides, substitutions and plan instructions open in focused views. Finish is a short effort/concern/save sequence; existing partial-workout and concern rules remain authoritative.
- Setup separates related decisions and equipment groups, with Back and Continue, saved draft recovery and reviewed plan acceptance. Existing restrictions, exact equipment capabilities and source-program choices remain available.
- Settings opens short categories for profile/equipment, appearance, accessibility, coaching, reminders, account, backup and the future assistant preference. Palette/font pickers are separate screens; all 35 Grizzly fonts remain available.
- Shared screen primitives provide a titled header, one bounded scroll body and an action footer. The main workout header uses an accessible compact Back target. Long read-only guide bodies accept keyboard focus and scrolling. Main navigation retains five labeled destinations.
- Exercise guides separate the overview, setup, movement instructions, safety/common errors and reference/equipment controls. The guide component retains source fields, safe reference handling, custom-exercise fallbacks and injected equipment controls.

The new logger receives an explicit save result: `saveSet` now returns the saved boolean to its caller. `persistChange` already returned the durable commit result before this redesign; its new behavior is to clear a stale failure message only after a confirmed successful save. Targeted tests exercise failed staging/logging/finish and subsequent retry, with unknown loads, history and newer exercise focus preserved. This is not evidence that the prior released wrapper falsely reported successful writes.

## Preserved boundaries

At the draft snapshot, the canonical `lib/` training/library sources, copied `mobile/src/shared/` snapshot, native storage adapter and web application source have no changes from the branch base. This redesign does not revise workout prescriptions, exercise-library content, encrypted storage format or saved-record schemas. The native runtime changes how existing commands are reached and how their results are handled. Fresh website builds matched all 1,824 non-download files per brand against the current published manifests. The final source archives subsequently receive only two documentation corrections for the version tables, S24 acceptance scope and iPhone checks; all 260 other archived source/code/asset members remain identical to the frozen export archives.

Keep distinct Movefield/Grizzly package identities, datasets and preferences. An appearance or navigation change must not mark a set complete, infer a load, replace history, accept a progression proposal or remove an equipment constraint. Future full APKs remain generated only in the final Pages candidate from verified bounded parts; they do not belong in `public/` or Cloudflare Worker assets.

## Evidence available in this draft

| Check | Observed result | Scope |
| --- | --- | --- |
| Settings/components | Both brands passed 13 axe/layout states, including 130% app text, real preference persistence, reminder drafts, category reachability, font discovery, footer position and tab geometry. | React Native Web; font loading and notification permission mocked. Original hashes retained before later compact-back/scroll-focus changes. |
| Exercise guide | Both brands passed 22 axe/geometry states with zero violations. Keyboard End actually scrolls long read-only setup instructions. | Actual guide/shared-screen components through RNWeb; external URL/font and injected equipment test boundaries documented. |
| Focused workout callbacks | Ten groups pass actual workout reducer/callback scenarios, including active-workout guidance: unknown/zero/load units, failure/retry, metrics, prior edits, guide/substitution/setup/rest, timed tasks, paired sets, staged finish and Back/reset. | Deterministic component callbacks and reducers; not a physical-device renderer. |
| Setup callbacks | Four wizard/equipment journeys pass; existing default/catalog/source setup acceptance, failed-save retry and other interaction regressions also pass. | Callback/draft boundary checks; final actual App setup rerun is tracked separately. |
| Legacy actual App journeys | Both brands passed nine assertion categories each at 18:36 UTC on the final source. Includes active-workout guidance, 320/390/412-unit workout layout, 130% app text, retry-banner clearing, history correction cancellation, guide reachability, plan filtering and state preservation during resize/browsing. | Actual App through RNWeb with synthetic JSON writes and documented platform mocks; six source modules remained stable. |
| Deeper App flows | Final 18:37 checks passed 14 behavioral groups plus two compiled bundles, with 36 geometry scans and zero browser errors. They cover reload, sample identity and isolation, failure/retry, complete active-workout guidance, exercise-guide navigation and the explicit iOS dismissal branch. | Both brands at 320×568 and 100/130% app text, with Today/logger/setup also at 390×844 and 412×915 at 130%; recorded source hashes stayed unchanged. |
| Coaching | Final normal and explicit iOS-transition checks passed after the guidance/sample-label fixes: 32 assertion groups across four brand/mode runs. All 145 captured source/fixture hashes stayed unchanged. | Actual App through RNWeb with synthetic fixture storage; the explicit iOS branch exercises dismissal callbacks, not UIKit. |
| Core checks | The initial run passed 51 of 52 groups. Its one failure was an obsolete ModalFrame child-index assertion; the semantic-node/single-scroll-owner repair passed a standalone rerun. Final workout/density/keyboard checks then passed after the guidance/sample-label fixes, including all ten focused workout groups. | The composite receipt preserves the original failure, successful targeted rerun and final source qualification. Final changed-file lint: zero errors, 11 warnings. |
| Metadata/publisher | 20 metadata groups, 16 synthetic compiled-identity fixtures and 113 publisher fixtures passed. | Version/package/certificate/publication guards only; no new APK is implied. |
| Bundled-font layout | 16 final-source captures passed: both brands × 320/412-unit widths × Today/logger/workout list/setup. No horizontal overflow or browser errors; primary targets are 49–51 units tall and visible. | Actual bundled Inter, Barlow Condensed and Frijole loaded and checked in RNWeb. Native OS font rasterization remains unverified. |
| Exports/source archives | All four cleared-cache Android/iOS Hermes exports passed identity and coaching/focused-screen content checks. Both portable ZIPs contain 262 files and match the source manifest; verified copies are now in the local public downloads directory. | Local exports and archive inspection only. These are not signed Android/iPhone installers or a live publication. |

Native types and targeted lint pass for the owned components. Focused density/message checks also pass. A broader lint receipt records zero errors and 11 warnings; it is retained as its actual result. The final integrated/coaching runs include the resolved guidance and sample-label findings. Their source hashes match the current App and focused workout; the exact committed source and successful installer runs are recorded above. Detailed evidence and hash comparisons are in the JSON receipt and [scoped UI audit](native-focused-ui-2026-10-16.md).

The final 320-unit workout screenshots for both brands were visually inspected with their actual bundled fonts. Reps/load, the load convention and Log set are clearly separated. Movefield's set title fits one line; Frijole in Grizzly wraps the set counter to two lines without overlap or horizontal overflow. The earlier font-mocked screenshot's one-line header is not a guarantee for all fonts. In Settings, small screens and enlarged text scroll within their bounded category bodies; full font/palette lists and enlarged tab labels remain scrollable.

## Review findings resolved before source freeze

Independent review found that session guidance was no longer reachable while a workout was active. The dedicated **Workout guidance** screen now preserves warmup, effort, exercise order, progression and finish instructions, with a clear Back action. The ten-group callback check, final actual App journeys and final focused flows exercise this route.

The visible **Sample** identity also now remains after sample set writes. Final focused flows verify its label and personal-record isolation. Final coaching normal/iOS-transition checks were rerun after both fixes. Earlier source-scoped checkpoints remain in the JSON history rather than being relabeled as final passes.

## Android artifact inspection and remaining gates

The public Movefield APK is 39,335,972 bytes, SHA256 `1f3d387b5ff05b20a2e5f341bd515f6cf4a56b7d8293aa31a0eceb9dfc624759`. Grizzly is 39,487,234 bytes, SHA256 `aafb36100ec149bacbeb4cd9d62921012c95e277e61c31f4dfa3777f255d159e`. Both retain the expected historical certificate, distinct package identity, advancing version code, Android 7+ floor and ARM64 architecture. Inspection checked transport/backup boundaries, bundle hashes and all 14 coaching/focused-screen markers. Both passed `zipalign -P16`; every LOAD segment in all 17 native libraries per APK passed the recorded 16 KiB alignment requirements. These are packaging checks, not installed-device performance evidence.

The ten verified manifest/page/part files are applied to public downloads and both fresh static builds. Full APKs are generated only in the Pages candidate. The two updated source archives add only Android/iPhone documentation corrections to their frozen counterparts; all application code/assets remain identical.

1. **Passed:** delivery source `920a73621d9f2ab15bbddcd00139c9cebd155238`, Pages `481b781308e03804c78a50ceec703af715dabdf5`, successful deployment `38952414814`. All 357 selected served files matched, including all 63 original-root files. Both APKs returned correct MIME, full length and first/last HTTP 206 ranges; both sandboxed browser Saves completed at 320px and matched the inspected hashes.
2. Obtain acceptance of the new installed builds on the user’s device. Physical keyboard, platform screen reader, reminders, restart/storage, inset and performance behavior remain separate device gates.

The user’s earlier S24 Ultra confirmation applies to **Movefield 0.1.6**, including saved workouts being present. It does not establish installation, record retention or usability for the new redesigned Movefield 0.1.7 or Grizzly 0.1.6. Do not ask the user to uninstall existing records to resolve an update problem.

No Apple Developer/Mac signing setup has been supplied. There is no signed iPhone installer or TestFlight delivery in this milestone. Browser/RNWeb and native export checks also do not establish all-Android, all-iPhone or store acceptance.

## External design references

The initial 12 requests to official fitness-app and Apple/Android/Material pages received proxy CONNECT **403** responses before substantive content was read. The [reference note](native-redesign-reference-2026-10-16.md) and research receipt preserve this limitation. These interface decisions follow the user’s feedback and existing product/data requirements; no completed competitor review, hands-on app comparison or platform certification is claimed.
