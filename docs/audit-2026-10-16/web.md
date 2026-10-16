# Web UX and accessibility audit — 16 October 2026

Scope: Movefield review and Grizzly variants from the shared current source. Existing original-root publication is audited independently. All tests below use disposable synthetic profiles; no owner records are read or modified. Native app/physical device evidence belongs to the native audit. Completed locally on 16 October 2026; exact public publication is qualified separately by the release audit.

## Confirmed issues and changes

| ID | Severity | Finding and reproduction | Change | Verification |
|---|---|---|---|---|
| WEB-01 | High for content freshness | A correction confined to exercise-guides.json or exercise-content.json left the previous offline cache revision unchanged. Returning installed/offline-capable web apps use those resources cache-first and could indefinitely retain obsolete instructions even after a published guide correction. The same omission covered Movefield's two base fonts and worker-only changes. | build/offline-plugin.ts now hashes all public resources actually precached, including the guide/media JSON, base fonts, brand resources, and the worker template. Existing wait-for-window-close update policy remains. | Real plugin executes against isolated fixture files: guide-only, media-only, base-font, brand and worker edits change revision; unrelated downloads and bundle iteration order do not. scripts/check-offline-build.cjs passes. |
| WEB-02 | Low / discovery | Settings only offered a developer source ZIP despite actual Android previews being available. Users looking for an installable phone app could not discover the APK page from the workspace. | Existing Phone apps section links the correct brand's Android preview page, states iPhone signing status accurately and folds developer source ZIP into details. | Both actual brand URLs and 320px/130% Settings reflow passed in the final integration journey. APK package/install qualification belongs to the release/native audit. |
| WEB-03 | Test coverage | The cross-tab preference browser test hardcoded the original Worker preference key and Movefield palette name, so it could not validate published review/Grizzly namespaces. Historical Grizzly identity test expected superseded Metal Mania/Frost defaults. | Harnesses derive the actual key/label/defaults from brand/base, keep separate receipts, and test current Frijole/Pine defaults. Font/palette collection now covers all 17 palettes instead of only 10 outdoor choices. Theme and dialog tests await actual finite transitions before scanning/focus assertions. | Both six-behavior preference suites, 35 online/offline fonts, 35 collection axe states, identity/isolation checks and four style axe states passed. |
| WEB-04 | Medium | Searching the exact displayed name “Selectorized pec deck fly” returned no matching row. The search alias converted pec to chest and discarded the literal token, despite the canonical row containing pec/Pectorals. | Library agent changed the shared matcher to allow literal or alias matches and added all 995 canonical-name self-match regression coverage. | Both final browser journeys search and open this exact guide, plus chest-supported dumbbell row and cable face pull. |
| WEB-05 | Medium | At 320px and 130% text, the five-column set logger left load inputs around 34px wide. Ordinary multi-digit loads could not be read in full, while “Set” wrapped into fragments. This was found by visual inspection despite zero automated axe errors. | At widths up to 480px only, each set uses two full-width field columns with visible labels, set heading, and 44px minimum inputs/actions. Existing desktop grid, callbacks, save guards, data conversion and unknown-load semantics remain. | Both final actual apps show and retain 1000.5 in 117.4px inputs; measured 63.9px text fits 74.2px available text width after padding/spinner allowance. Labels are visible, no outer overflow, and an encrypted reload preserves the draft without marking it done. Six control behavior groups and final logger/guide axe checks pass. |

## Source review completed

- Setup: visible step progress, saved draft serialization/recovery, meaningful error summary focus, adult/youth gate, explicit available versus requested training days, exact equipment confirmation, preference edits reset stale plan selection, before/after plan review and acceptance.
- Plans: app-generated versus credited/reference tracking disclosure; unavailable-fit reasons; imports preview; future-session-only custom additions; machine setup/context and distinct load conventions; new source library registration delegated to routine audit.
- Calendar: selected-day detail separate from mutation, arrow/Home/End/PageUp/PageDown navigation, a single tab stop and focus restoration, local date/month clamping, current-day start eligibility, explicit proposal flow for actual rescheduling.
- Logging: unknown load distinct from zero, set-level RIR, optional metrics/notes, stale-write guards, partial completion, visible substitutions, movement guide discovery, real save state before showing success.
- Library: name/pattern/equipment search, explicit no-results state, bounded initial rows and Show more; accessible detailed steps; source links use HTTPS and noopener/noreferrer; guide/media fetched on demand, visible retry and retained successful media; missing photo message preserves written instructions.
- Progress/history: comparison context, machine setup separation, accessible data-table alternative, estimated strength disclosure, partial-session labels and editable saved actuals.
- Settings and data: profile/sample separation, review-before-replace encrypted restore, stale preview and active-workout blockers, explicit local versus cloud boundary, Apple/native release status, appearance available before vault setup.
- Appearance: preserved artwork, heading-only decorative type, readable workout inputs, reduced-motion conditions, font scaling, mobile sheet/modal focus boundaries.
- Offline: exact service-worker registration; first install distinct from pending update; no forced update/reload over active training; shell/code/guides only in cache; app variants use distinct storage/cache namespaces.

The apparent shared reminder-key issue was traced through the actual static build namespace transforms and ruled out. No unnecessary application change was made.

## Non-browser checks actually run

- scripts/check-offline-build.cjs: passed (actual build plugin resource invalidation).
- scripts/check-offline-registration.cjs: passed (first install/update/failure/listener lifecycle boundaries).
- scripts/check-web-calendar.cjs: passed five groups (actual component callbacks and date utilities with synthetic hook boundaries).
- scripts/check-workout-ui.cjs: passed six control groups after responsive label wrappers, including unknown versus zero loads, individual RIR, disabled/save/undo behavior, timed decimal values and history controls.
- Scoped ESLint on changed workout component and final browser/control harnesses: passed with no findings. Both final static builds passed.

## Limits

Automated rendered checks cannot certify screen-reader usability, all color-perception conditions, decorative font legibility, physical phone touch/keyboard behavior, Safari, notification delivery while a browser is suspended, third-party exercise video playback, or individual exercise technique. Clinical/program suitability remains separate from UI execution. Public publication and exact served source are verified by the parent/release audit.

## Additional findings from actual built browser journeys

- **Performance follow-up, measured**: Final offline precache covers 6,544,041 uncompressed static bytes in 10 files for Movefield and 18,442,509 bytes in 48 files for Grizzly. Both include 3,077,066 bytes of guide/media JSON. Grizzly's 35 licensed offline fonts account for 11,990,744 bytes; Movefield's two base fonts account for 986,004 bytes. This intentionally retains the user's requested offline font customization but is a first-install network/storage cost. HTML/HTTP compression and device CPU are excluded. Exact asset inventory: `.sites-runtime/web-offline-size-2026-10-16.json`. No font removal or unsupported phone performance claim.

## Browser checks completed before final search/unknown-machine rebuild

- Both brand guide/logger journeys: six rendered axe states, no violations. Confirmed no guide/media requests before opening instructions, visible 503/retry, retry retains the already successful media response, safe reference links, 320px guide reflow, and unchanged sample records.
- Movefield full accessibility: 32 actual light/dark rendered states, no axe violations or outer overflow, including gate, Today, Calendar, Plans, Progress, saved-workout/edit dialogs, Exercises, Coaching, Sources, Settings, 320px/130% layouts, modal focus trapping and restoration.
- Both actual cross-tab preference suites: 12 behaviors passed, including save/reload, other-tab updates, injected quota failure with visible error and preserved stored preferences, successful retry and deletion/default restore. Each brand uses its true static-app preference key.
- Grizzly collection: 35 fonts loaded online and after offline reopening; all 17 palettes tested in both light/dark for 34 zero-violation axe scans; font gallery 320px/130% scan passed; in-progress synthetic workout unchanged byte-for-byte.

These presentation runs used the current routine-containing build before the final shared exact-name search and unknown-machine eligibility corrections. Those corrections affect search/equipment selection; final rendered integration checks below exercise the refreshed builds. No claim is made that earlier binary hashes equal a later rebuilt application.

## Final integration and focused verification

- Both refreshed brands completed real encrypted onboarding with confirmed equipment, selected and accepted the new `LIB-PL3-60` powerlifting routine, and received nine planned sessions. Calendar keyboard/month browsing preserved the exact plan state. Exact canonical exercise search, detailed guides and safe source links worked for all three mapped guide examples above. Settings exposed the correct Android installer link.
- In both brands, the first logged set retained unknown load as null; the second set retained a decimal load as an unfinished draft across encrypted unlock/reload. The final logger was visually inspected at 320px and 130% text, with full numeric contents and visible labels. The final guide/logger suite rechecked six rendered axe states, lazy fetching, simulated 503 retry, successful media retention and data preservation.
- On the refreshed shared search/equipment build, both brands completed a real seven-day, single-dumbbell preference/equipment survey and accepted 21 sessions. A same-function substitute preserved dosage, rest, dates and previous records and survived an encrypted reload. Both narrow survey axe scans passed.
- Grizzly completed its independent 32-state accessibility matrix with no axe findings or outer overflow. Branding, source logo identity, reduced motion, isolated storage/cache erasure and offline shell/font reopening passed. The final narrow-logger build passed four further style axe states, active workout preservation during Wild/Clean changes, and focus restoration after the customization dialog actually closed.
- Across the audit, 111 rendered automated axe states passed: 64 full accessibility matrix states, 35 font/palette collection states, six guide/logger states, two inventory states and four style states. Earlier broad presentation scans preceded the final narrow logger change; final tests specifically rechecked affected logger/control/guide flows and the integrated routine, with full details in the receipts. This is not a WCAG or physical-device certification.

Final static service-worker revisions: Movefield `93103ec0e00dc1d094fd`; Grizzly `74ce1d43e6524bfee66b`. The scoped logger edit does not alter training calculations or mobile source. APK downloads/source archives are packaged separately by the release agent and are not qualified merely by the Settings links working.

## Evidence

- `.sites-runtime/audit-2026-10-16-web-state.json`: structured findings, scope and receipt index.
- `.sites-runtime/web-accessibility-movefield-2026-10-16.json` and `web-accessibility-grizzly-2026-10-16.json`: full matrices.
- `.sites-runtime/routine-library-browser/results.json`: final accepted routine, guides, installer links, decimal geometry and encrypted reload.
- `.sites-runtime/routine-library-browser/movefield-new-routine-viewport.png` and `grizzly-new-routine-viewport.png`: final narrow logger visuals.
- `.sites-runtime/ux-browser/results.json`, `fitness-browser/results.json`: final guide/logger and seven-day single-weight journeys.
- `.sites-runtime/browser-preferences/`: both quota/cross-tab preference receipts.
- `.sites-runtime/grizzly-collection-checks.json`, `grizzly-style-checks.json`, `grizzly-brand-checks.json`: customization, identity, offline and isolation checks.
- `.sites-runtime/web-offline-size-2026-10-16.json`: final exact precache inventory.

All structured receipts and the final static hashes above are retained in `docs/audit-2026-10-16/web-validation.json`. Earlier broad scans did not record exact binary hashes; their build scope is stated individually, without assigning final hashes retroactively. The parent also confirmed the final production build, TypeScript/changed-file lint, production security/bootstrap and 18 encrypted Worker browser journeys passed after the logger change.
