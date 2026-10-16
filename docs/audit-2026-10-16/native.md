# Native audit — Movefield and Grizzly — 16 October 2026

Scope: the executed native app in `mobile/App-runtime.js`, native screens/components, canonical-snapshot consumption, and native configuration. The same native application serves both separate brands. This audit does not qualify an installed iPhone/Android device or imply completed native publication; the root agent owns final shared-data synchronization, flavor exports, compiled APK inspection and publication receipts.

## Findings fixed

| Priority | Finding | Change and evidence |
| --- | --- | --- |
| High | At a 320×568 viewport and 130% app text, the exercise-library header occupied the available content height. The actual guide-row tap timed out because bottom navigation/save status covered the row. | Moved the header into `FlatList.ListHeaderComponent`. The search/filter header and virtualized results now share one bounded scroll surface. Reproduced with a normal Playwright click (no forced event); the exact large-text tap and modal close now pass in both native app flavors. |
| Medium | Explore constructed sample workouts for every matching app plan and offered no routine-name/author or training-frequency filter. A larger shared catalog increases both rendering work and browsing burden. | Added All styles, name/author/description/equipment search, 2–7-day filtering, result counts, empty recovery and Show more. Only the first eight app-plan samples are constructed initially; source/reference cards also page eight at a time. Additional pages remain reachable. Choosing a source routine from All styles retains its actual goal. Browsing never mutates accepted training. |
| Medium | History rendered every saved workout in a nonvirtualized view. | Initially render the latest 20 saved workouts; Show more reveals the next 20 without removing records. A 45-workout synthetic fixture verifies 20→40 rows and preserves every historical record. |
| Medium | The main actual-load field rejected comma decimals even though native measurement/history fields already accepted them. | Actual set logger now accepts dot or comma decimals and preserves unknown vs zero and the existing kg/lb conversion and bounds. The real logger test records `12,5`, injects a failed save, then retries without changing history. |
| Medium | Per-set RIR and saved-workout correction controls ignored the selected app text size. | Those labels and inputs now follow app text scaling as well as the platform's default text scaling. The real history correction input has the expected enlarged font and canceled edits leave all records unchanged. |
| Low | Library displayed a total excluding the owner's custom exercises. | Total now includes saved custom movements, matching the actual searchable collection. |

## Coverage reviewed

- Navigation and layout: five main tabs; selected-tab visibility; horizontal navigation overflow for larger text; safe-area shell; bounded content area; iOS keyboard avoidance on main and modal screens; Android native resizing; modal close/back callbacks; larger app text; Grizzly wild/clean and reduced-motion composition. Actual OS keyboard, OS Back and assistive technology remain device gates.
- Plans and routines: app/source/reference distinctions, source attribution, explicit source choice, plan review and accepted-plan preservation, 2–7-day discovery, sample assumptions, readiness/equipment constraints, saved-plan reuse and dated calendar browsing. Catalog filtering occurs before expensive sample generation. Final content correctness also relies on the root/research agents' canonical training audits.
- Exercise library: virtualized rows, movement/muscle/name search, listed-equipment filters, explicit empty state, detailed offline guides, safe HTTPS references and close controls. A custom movement may have quick cues rather than a fabricated universal detailed guide.
- Equipment/substitutions: explicit actual-equipment survey, per-hand dumbbell convention, available load/increment/context, separate alternatives, warnings, reviewed scope and acceptance. Native already renders the new shared substitution warnings added by the security/data audit. No native silent equipment substitution was added.
- Workouts and history: active/focused exercise logging, actual amounts and optional measurements, per-set RIR, durable-save failure/retry, unknown loads, deadline rest timer and foreground refresh, reviewed history corrections, immutable historical identities and progress filtering.
- Backup/errors: Settings contains encrypted backup/export/import and recovery in one scroll area. Error banners/announcements and retry paths remain reachable. Synthetic writer tests do not exercise Expo SQLite/SecureStore encryption or OS share/document-picker UI.
- Branding and privacy configuration: Movefield historical Android identity and Grizzly separate identity remain unchanged by these UI fixes. Native OAuth callbacks are separately `movefield://` and `grizzlyfitness://`, guarded by explicit verified backend configuration. Android backup/cleartext exclusions and permission minimization remain configured by the existing plugin. OS notifications are opt-in and current notification identities remain scoped; actual delivery/timing is not established here.

## Checks completed before final shared-data synchronization

- `node scripts/check-native-app-ui.mjs`: PASS, Movefield and Grizzly. Executed native App rendered through React Native Web in sandboxed Chromium at 320×568, including the five tabs; comma-decimal actual load; failure/retry; Library guide at 130% text; selected navigation; 45-record history paging; enlarged correction fields and canceled draft; app-plan paging, source search, empty filters, 6/7-day options; no saved-state mutation while browsing.
- `node scripts/check-native-density.cjs`: PASS. Source/handler checks preserve scroll composition, touch targets and focus movement semantics. This is not a rendered OS test.
- Native TypeScript: initial and post-history-control checks passed. The final check against the synchronized 97-file shared snapshot also passed.
- Baseline actual native App suite passed before changes; the added large-text Library path then reproduced a real failure before the fix.

Rendered test receipts: `.sites-runtime/ux-native-app-results.json`; per-brand screenshots and diagnostics under `.sites-runtime/ux-native-app-movefield/` and `.sites-runtime/ux-native-app-grizzly/`. A historical failure screenshot is retained in that runtime area and is not a claim that the final check failed.

## Limits and remaining release gates

The owner explicitly has no Apple setup yet. No signed IPA, TestFlight delivery, iOS compiler execution, physical iPhone/Android test, TalkBack/VoiceOver run, on-device performance/battery benchmark, actual notification delivery, biometric flow, provider account/sync qualification or app-store acceptance is established by this audit. RN Web tests mock font loading, JSON persistence, file IO, notifications and disabled cloud boundaries. Shared-data byte alignment, compiled Android artifact provenance, dependencies and live web distribution are separately checked by the root team.

## Final synchronized snapshot checks

The root agent synchronized 97 shared files, including the qualified 68 added catalog routine variants and equipment/substitution corrections. Both `node scripts/check-native-workflows.mjs` and `node scripts/check-native-workflows.mjs --grizzly` passed against that snapshot. These execute native components via RN Web for commitment-range review, injected save failure/retry, custom-movement addition, saved-block reuse, 320px text/layout/date targets, progress filters, science references, Today callbacks and the Grizzly font/palette/Clean controls. The expanded actual native App suite also passed both brands against that same synchronized snapshot, and final native TypeScript passed.

Visual review of the 320px screenshots confirms that the plan filters and larger-text settings controls remain contained, the active tab is visible, and both brand appearances remain distinct. Font loading is mocked in this renderer, so the screenshots do not qualify installed heading fonts.

## Final native export qualification

After the routine agent fixed the native sample scheduler for fixed-dose five-day routines and its native engine passed 1,512 date-specific previews plus 216 complete first-workout lifecycles, both final brand exports were rebuilt sequentially with cleared Metro caches. The builds used `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 CI=1` and writable XDG directories. Movefield and Grizzly each produced separate Android and iOS Hermes bundles. `scripts/check-native-flavor-exports.py` passed; the Android flavors differ and the iOS flavors differ.

Each of the four actual `.hbc` files contains all 68 added `LIB-*` routine IDs, all eight creator-routine IDs, the two corrected exercise-reference URLs (used by six changed guide/media entries), and all five checked new native filter/history strings. Of the 213 total app-plan IDs, 171 occur as complete literals. The remaining 42 D6/D7 IDs are assembled at runtime by the catalog's template strings; their absence as complete binary strings is recorded explicitly and their behavior is covered by the native engine execution. This binary check proves literal inclusion, not installed-device execution or link availability.

Final export receipts: `.sites-runtime/audit-2026-10-16-native-flavor-exports.json` and `.sites-runtime/audit-2026-10-16-native-bundle-contents.json`. The latter records each actual bundle hash/size, counts/missing literals, and hashes of the final mobile engine, UI and relevant shared/content files. Build logs: `.sites-runtime/audit-2026-10-16-export-movefield.log` and `.sites-runtime/audit-2026-10-16-export-grizzly.log`. Preliminary/superseded build logs are labeled separately and do not establish this final qualification. No source ZIP, GitHub publication, APK build or iPhone signing was performed by this agent.
