# Movefield quality audit — 8 October 2026

The web and Expo clients are substantially functional local prototypes. They are **not yet production-ready apps with shared accounts and history**. This patch repairs the uploaded repository, fixes identified reliability and performance issues, and preserves the broader product scope.

Audit base: `ghinz32-cloud/movefield`, commit `80e6ea26437f0aeaa1d8f816ace464da81fe0a81`. Requirements were checked against `docs/product-requirements.md`, the previous handoff and recovered project decisions. A complete original conversation transcript was unavailable; this is not a claim to have reviewed every original message.

## Fixed in this patch

| Finding | Change and result |
|---|---|
| GitHub upload flattened `public/` and `.openai/` into the root; shell scripts lost executable bits | Restore static/config directories and executable modes. Fonts, brand assets and guide data resolve in the production build. Remove the obsolete upload manifest. |
| Exercise guides/media fetched at startup and fetched again when opened | Load the approximately 3.06 MB optional JSON payload only when a guide is opened, share the request, and allow retry after failure. Loading and image-failure states preserve movement instructions. |
| Progress charts inflated the first screen | Load the chart component on demand. Initial static JavaScript falls from approximately 473,182 to 369,548 gzip bytes (22%). The page chunk falls from 301,243 to 86,206 gzip bytes (71%); shared dependencies are counted separately. These are build sizes, not a measured phone speedup. |
| The whole web/native app redrew several times per second while idle | Move deadline-based ticking into active rest displays; stop intervals when paused, finished or idle. Resume time uses wall-clock deadlines. No timer starts while merely entering a set. |
| Failed writes could leave users believing entries were saved | Mark pending/failed saves, retain in-memory entries, expose retry/export, protect web unloads, and pause edits after a storage conflict. Native writes enter the ordered queue immediately with versioned status. |
| Exports had no supported restore journey | Add bounded, validated JSON preview and explicit replacement on web/native. Web restoration is also available at welcome. Reject changed previews and replacement during an active workout; retain actuals/unknown/zero values; invalidate restored proposals and cancel old timers. This is manual transfer, not sync. |
| Native optional measurements lagged behind web | Add distance, time, height, heart rate, cadence, power, speed, signed incline, level, assistance, tempo, side and notes. Keep zeros, unknown loads and exact equipment histories distinct. |
| Keyboard and text scaling could obscure phone controls | Add keyboard avoidance to native modals, scrolling navigation and wrapped statistics; align line heights/minimum text sizes, respect reduced motion, and use typed static font imports. Phone browser layouts were checked at 320 pixels with standard and 130% text. |
| Small-screen welcome lacked a visible first-level heading; home/plan shortcuts could leave navigation open | Give welcome its own h1 and make the mobile home/plan actions close navigation. |
| Repeated catalog lookup and type/lint issues | Index the 989-entry catalog; remove unsafe `any` casts and unused code; keep intentional external-state effects narrowly documented. Product lint passes with no errors or warnings. |
| Next dependencies had published advisories with fixes | Update Next and its ESLint configuration from 16.3.6 to 16.3.8 using the locked install. Other advisories remain below. |
| Mobile download could contain stale source | Generate revision 14 ZIP from the current native tree during dev/build, excluding dependencies, environment files and generated output. Historical ZIPs remain historical. |
| Shared native snapshots and checks could silently drift | Add snapshot comparison, regression aggregation, bundle budgets and a pinned GitHub Actions workflow for web/native checks. Consume all worker test response bodies so cleanup completes. |
| Imported exercise photos had missing files and unclear rights | Withhold imported photo files and gate their display. Preserve authored guides and source links. The source maintainer explicitly could not confirm image origin/rights; a later discussion considered replacing them. No assertion about legal permission is made. |

## Exact data locations

| Data | Current storage | Protection / behavior |
|---|---|---|
| Web profile, accepted/saved plans, events, active workout, set history, feedback, concerns, exercise/equipment context, proposals and audit log | Browser `localStorage`, key `training-studio-v2` | Validated JSON; local to that browser and site origin; no application-level encryption or account isolation. Cross-tab write conflict protection. |
| Unaccepted web setup | `localStorage`, `training-studio-setup-v1` | Separate resumable draft. Sample setup uses its own key. |
| Welcome open/closed | `localStorage`, `training-studio-access-v1` | A navigation preference, not authentication. |
| Appearance, accessibility, reminder and future-model preferences | Web localStorage / native AsyncStorage, `training-studio:preferences:v1` | Device-local choices; future model choice does not install/run a model. |
| Security preview flags | Web localStorage, `training-studio-security-preview-v1` | Boolean UI choices only. No passwords, credentials, biometrics or MFA secrets. |
| Browser reminder deduplication | `localStorage`, `training-studio:reminder-sent:<date>` | Prevents repeated open-page reminders; does not provide background push delivery. |
| Native accepted profile, plans, history, active workout and related domain state | AsyncStorage, `training-studio:mobile-local-demo:v1` | Unencrypted on-device JSON with validation and ordered writes. Separate from the web store. |
| Native setup draft | AsyncStorage, `training-studio:mobile-setup:v1` | Resumes before acceptance; cleared after reset/restore. |
| Backup files | Web explicit JSON download; native temporary OS cache file and explicit share destination | Plain JSON with profile and workout notes. Cache copies are cleaned after sharing/import; there is no automatic cloud backup. |
| Native reminder/rest notifications | Phone notification service | Generic scheduled alert content and timing; permission and OS delivery restrictions apply. |
| Exercise catalog, guides, fonts and brand assets | Repository, web static bundle and native bundled assets | Shared application content, not user workout storage. Source links open external sites. |
| Cloud records / accounts | None configured | `.openai/hosting.json` has `d1: null`, `r2: null`; `db/schema.ts` has no tables. Hosting access controls do not create Movefield accounts or workout sync. |

Clearing site data or uninstalling the native app can lose local records. Compatible backups provide an explicit replacement flow, not merging, encrypted recovery or shared-account guarantees. Sample training remains separate from the saved profile. Existing security controls are a prototype boundary; personal production data needs an authenticated data service and a reviewed encryption/retention policy.

## Reconciliation with the requested product

The full ID-by-ID contract remains in `product-requirements.md`; sequencing does not cancel scope.

| Requirements | Verified current scope | Still required |
|---|---|---|
| LIB-01–03 | 989 exact exercise IDs and complete guide sections, search and load conventions | Independent movement/content review, full screen-reader acceptance. |
| LIB-04 | Selected external source/demo links | Rights-cleared exact-variant photos/video, captions and human matching review. Imported photo binaries withheld; metadata retains candidates for replacement. |
| LIB-05, LOG-01–03 | Validated local logging, optional measurements, rest after Log set, comparable load proposals | Custom fields/units, metric targets/charts, physical keyboard and interrupted-app testing. |
| PLAN-01–02, PLAN-09–11 | 71 catalog variants across ten families, equipment/time eligibility, smaller focuses, substitutions and reviewed proposals | This is not universal setup coverage: the existing selection matrix has 268 unmatched setups of 1,701. Further specialization, variety and goal-conflict workflows. |
| PLAN-03–07, CAL-03–04 | General run/walk, hybrid and sport foundations; sport/position/season inputs | Race/sprint/event-specific progressions, detailed high-school sport positions, skill instruction, practice-aware competition weeks and annual seasons. |
| PLAN-08, PLAN-12 | Local customization, saved copies/setup reuse and native coach/manual target editing | Complete reusable multiweek editor and next-block/maintenance transitions. |
| CAL-01–02, CAL-05 | Web commitments/vacations and explicitly reviewed date cascades; date/DST checks | Equivalent native commitment editing and real travel/time-zone/device checks. |
| COACH-01–05 | Local approval/stale-proposal rules, optional feedback, conservative returns and coach tracking boundaries | Full delayed soreness/RPE capture, reviewed discipline-specific evidence and production feedback flows. |
| PROG-01–03 | Web history/volume/estimated strength and a personal baseline index | Native chart parity, validated population scoring, body measurements and private progress photos. |
| AUTH-01–03, DATA-01 | Preview controls and independent local stores | Real identity, server authorization, recovery, shared history, offline operation queue/conflict handling and consent-based parent sharing. |
| DATA-02–03, LOG-04 | Validated local export/restore and exercise JSON import | Encrypted/account backups, account deletion/retention, full history/plan importer and scoped public API. |
| INT-01–02, TEAM-01 | No connected services or team accounts | Health/vendor integrations with actual API approval and permissions; team rosters, roles, consent and assignment. |
| UI-01, SEC-01 | Responsive prototype, six palettes/light-dark-system, local accessibility choices and production HTTP hardening | Real iOS/Android accessibility/notifications, two-device testing, server security, monitoring, independent security review and signed store distribution. |
| Optional Qwen3 assistant | Auto / 0.6B / 1.7B / 4B / off preferences | Model download/runtime and performance tests, 4B only on qualified phones. Tracking must remain usable without it. |

## Verification and limits

- Web TypeScript and product ESLint: passed (zero errors/warnings).
- Regression runner: 16 of 16 suites passed, including stored-data/security rules, onboarding, equipment caps, scheduling, backups, native storage and shared snapshots. Program depth includes 4,297 scenarios and 2,481,929 assertions; these are software assertions, not clinical validation.
- Native TypeScript and training checks: passed; 74 supported plans across all seven starting weekdays, 989 exercises and 989 guides. Android and iOS Metro/Hermes exports passed with the new file/share/picker modules and fonts.
- Production build and two production suites: passed. Font/brand/current ZIP assets resolve, CSP script nonces match and rotate, POST/internal routes are closed, the temporary responsive-review route is absent and uncleared photos return 404.
- Initial JavaScript dependency budget: 369,548 gzip bytes, below 400,000. Chart code is outside the initial static graph; guide/media fetches are deferred.
- Browser review: desktop sample progress, empty/valid set logging, rest initiation and a guide; 320-pixel welcome/progress/settings/navigation and 130% text with dark mode. Checked screens did not horizontally overflow. This is not a complete accessibility audit or a physical phone test.
- Backup file-picker review could not finish in the remote browser; restore confirmation/persistence UI, Safari, low-storage failures, app kill/reopen, real sound delivery, TalkBack/VoiceOver, vendor integrations and two-device sync remain acceptance work. Automated restore guards passed.
- No merge or live deployment was performed. This audit cannot guarantee that every bug has been found.

## Security and media release blockers

The current dependency reports contain one high-severity web package and fifteen high-severity native affected-package entries, rooted in two advisories; no critical advisory was reported. Affected-package counts include dependency chains, not fifteen independent vulnerabilities.

- [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): present in the build tool chains.
- [node-forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): present through Expo tooling.

No safe upstream patch was available in the checked dependency resolution. `check-dependencies.mjs` prints these as known release blockers and gates new high/critical advisories. Its temporary exception expires 8 November 2026; it does not mean the vulnerabilities are resolved. Do not force a breaking Expo downgrade to make an audit look clean. Recheck upstream updates and dependency reachability before release.

Image provenance: [maintainer statement](https://github.com/yuhonas/free-exercise-db/issues/2#issuecomment-1609681281) and [later maintainer discussion](https://github.com/yuhonas/free-exercise-db/issues/13#issuecomment-5154712995). The dataset's Unlicense is not sufficient evidence that each imported photo is cleared. Replace the visuals or obtain/document rights before enabling photo display. Original Git history remains intact.

## Next implementation priorities

1. Build one authenticated account → workout → offline save → web/phone sync journey with authorization, operation IDs, conflict review, encryption and tested recovery. This is the largest gap between a polished prototype and the requested product.
2. Complete reusable plans, full history import and native calendar/chart parity without rewriting logged actuals.
3. Expand the reviewed sport/position/race/season programs and demonstrate exact movements with cleared media.
4. Run a device beta covering notifications, permissions, large text, screen readers, low storage, background/app termination, account recovery and two-device conflicts; resolve the dependency blockers and security review before public/store release.
