# Active implementation checkpoint — 10 October 2026

The user requested all six version 3 master prompts. The package explicitly uses tested, bounded **PROTOTYPE_FIRST** milestones and authorizes $0 new service spending. This checkout is earlier than the encrypted/account/AI implementation described by parts of those prompts. Do not assume those systems already exist.

The canonical scope and current statuses are in `docs/master-prompts-task-register.json` (72 requirement sections, original requirement text and shared contract retained). This checkpoint implements the first data-safety repair; it does **not** complete all six prompts or qualify a production release.

Implemented:

- One serialized persistence controller shared by web/native. Staged input remains visible on failure; logging and finishing publish completion only after a successful write. Repeated commands are guarded. Web writes use Web Locks and compare the current stored snapshot before writing.
- Workout overview → focused exercise logger → next unfinished exercise → remaining/completion overview on both platforms. Successful saves advance once; failed saves do not advance. Deliberate back navigation during a pending save is preserved.
- Finish confirmations bind workout identity, targets, sets and equipment context; stale confirmations reject. Partial/full finishing preserves dates and IDs and clears the active timer only after saving.
- Web sample data uses a separate session-storage key. Reset restores the example dataset. Returning to personal data preserves the active workout and timer. Native dataset isolation remains pending.
- Account simulations are confined to sample mode; personal screens show real connections as unavailable. Appearance lives in Settings. Narrow-screen exercise/timer controls no longer clip or wrap labels letter by letter.
- Restored 396 static assets flattened by the original upload, checking their original manifest SHA256 first. 1,354 exercise photos remain missing; written guides and photo-unavailable states are available. The recovery script is idempotent. Do not fabricate the absent images.
- Updated `next` and `eslint-config-next` to 16.3.8. Added pinned Playwright Core for real browser checks. Root still uses pnpm 11.25.0 and mobile retains its npm lockfile.

Evidence already run: web/native type checks; 11 durability/flow regression groups; 11 audit groups; native storage ordering/reset regression; 29 schema/HTTP security checks; native engine checks covering 74 plans across seven starting weekdays; web build and production nonce/route/static-asset check; iOS and Android Hermes bundle exports; seven dev-browser journeys and the same seven journeys against a freshly started final built Worker, including sample exit with an active personal rest timer. An earlier built-browser attempt hit an orphaned old preview and 404 chunks; clearing that process and restarting the current Worker resolved it. HTTP 200 alone was not accepted as readiness.

Application-source SHA256 (code, tests, configuration and available static assets): `47bc35e43f6e96435736595e85062d5ca9eeb0375b2b49751d8ffcb8e4aff783`. Detailed local file/artifact hashes are in ignored `.sites-runtime/candidate-receipt.json`. Native exports are JS/Hermes bundles, **not** installable APK/IPA artifacts. Physical-device behavior was not tested. The public revision 13 starter ZIP remains historical and is labeled accordingly.

Known limits and release gates:

- Browser localStorage and native AsyncStorage remain plaintext. Encryption, key loss/recovery, vault migration and true transactional outboxes are required code work.
- Some existing plan/custom-exercise/import callbacks still stage optimistically. Extend commit-before-display contracts to those paths before claiming all saves are atomic.
- History editing, revision-aware summaries, full training/evidence/rights qualification, connected identity/sync/AI, broader accessibility/performance checks and device/signing qualification remain tracked.
- Web production dependency audit reports zero advisories after the patch. Native audit reports 33 affected dependency-chain entries originating in **two** high advisories: braces <=3.0.3 (Expo Metro pattern processing, GHSA-vfj7-8cjw-p6xm) and node-forge <=1.4.0 (Expo CLI/signature tooling, GHSA-86w9-cpqp-85rv). Registry latest versions remain those affected versions. No blind upgrade or suppressed scan was used; native distribution/update security remains unqualified.
- No repository CI workflows were found. External deployment triggers, owner-console configuration, quotas and open-PR status were not independently qualified. A source push/deployment is not claimed. Do not spend money or deploy from this checkpoint.

Reproduce checks from the root: `pnpm test:durability`, `node scripts/check-audit.cjs`, `node scripts/check-native-storage.cjs`, `node scripts/check-security.cjs`, `pnpm exec tsc --noEmit --incremental false`, `pnpm build`, `node scripts/check-production-security.cjs`. For browser tests, start the app locally and run `pnpm test:browser`; use `MOVEFIELD_BASE_URL` to test a fresh built Worker. Chromium must retain its user-namespace sandbox; this cloud runner requires executing browser tests outside the outer command sandbox. A browser or sandbox failure is an unavailable/failed check, never a pass. Screenshots use only synthetic data and live in `.sites-runtime/evidence/`.

From mobile: `npm run check`, `npm run test:engine`, `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 CI=1 npm run export:mobile -- --max-workers 4`. Native secure storage and physical notification/restore tests are still pending. Use a writable XDG cache for Expo; optional desktop DevTools sandbox support is separate from Metro.

**Next checkpoint:** complete encrypted local storage/key recovery and native sample/personal isolation using the existing stores and shared schema, with explicit legacy-data migration and failure tests. Then implement staged saved-workout editing while preserving another active workout/timer and invalidate only relevant reviews. Extend durable acknowledgment to remaining mutation callbacks. Resume the register rather than restarting the audit.

Rollback must preserve device records: export a backup first; revert the source checkpoint without resetting storage or deleting app installations. This repair retains state schema 2 and existing personal record IDs/keys. It introduces a separate disposable sample key and no production-data migration.

---

The historical handoff below remains context; current source/evidence above takes precedence.

# Movefield / Training Studio — Claude Code handoff

Prepared 7 October 2026. Movefield is a **working name**. This package transfers the existing project; continue it rather than creating another starter.

## 1. Snapshot and authority

| Item | State at handoff |
| --- | --- |
| Latest application commit | `cbb41417dc29029122cb43ab2d92bc5632174e2d` — Add personalized themes, accessible settings, and workout reminders |
| Previous application revisions | `25e0e74c49adca3c1a777151d320f7cd811f2b72` — editorial/branding; `5b1d116` — usability, recovery and coverage |
| Source included | Complete tracked web/mobile working tree and its asset files, plus handoff instructions; generated caches excluded |
| Web | Working local prototype using Vinext, React, TypeScript and Tailwind |
| Mobile | Expo/React Native starter with shared training logic and independent local storage |
| Accounts and sync | Not implemented as real app services; account/security interfaces are previews |
| AI | No model installed, inference runtime integrated, phone benchmark completed or cloud fallback enabled |
| Publication | Latest revision has not been successfully published; explicit source-upload/deployment approval is still required |

Read `CLAUDE.md`, this file, and `docs/product-requirements.md` first. Then read `docs/revision-13-appearance-reminders.md`, `docs/revision-12-editorial-branding.md`, `docs/revision-11-ux-audit.md`, and `docs/deep-audit-2026-10-07.md`. Earlier reports explain how the implementation developed; they are not all current recommendations.

This is a consolidated engineering handoff from available conversation context, source and saved reports. It is **not a verbatim export of every prior conversation**, and it must not be presented as one. The repository retains the detailed product requirements. New explicit user decisions override older proposals.

The source ZIP has no `.git` directory. Commit IDs identify the original snapshot; they will not resolve in the extracted folder unless its original Git history is separately supplied. `HANDOFF_MANIFEST.json` records the export and file hashes. You may initialize a new local Git repository after import; do not push it externally without permission.

## 2. Product intent and working style

The goal is a complete training app for web, iOS and Android, ultimately with one account and shared history. It serves users 14 and older across experience levels, equipment, goals and available time. Strength, muscle, general fitness, bodyweight work, running/hybrid training, sport and competition needs are within the intended scope. The current catalog does not fulfill every combination.

The user wants continued useful development, not repeated confirmation of reversible implementation choices. Do not quietly shrink the agreed scope to a generic MVP. Be candid about unsupported plans, absent services and incomplete validation. A detailed end-to-end launch plan is wanted later, **not as the next deliverable**. The import/setup instructions here are only for resuming work.

Preserve these decisions:

- A rules-based training engine owns progression, recovery, workload constraints and dates. Feedback-driven changes show before/after and require acceptance; explicit plan acceptance covers its already scheduled progression.
- Coach-owned programs remain under the coach's authority. Track them without adding a competing program. Changes of authority must be explicit.
- Never fabricate weights, completed sets, performance, readiness or source attribution. Unknown load is not zero; dumbbell load is per hand; barbell load includes the bar and both sides.
- Keep core lifts and measurement contexts comparable across blocks. Substitutions need appropriate history/setup handling, not falsely interchangeable records.
- Personalization must account for time, equipment, experience and recovery. Age/sex alone must not dictate unsupported prescriptions. Youth restrictions and supervision rules remain first-class requirements.
- Imported routines retain creator/source credit. Named reference cards are not permission to redistribute someone's full program. Original generated workouts use clear descriptive names.
- Exercise notes should be specific, useful and natural. The user disliked repetitive AI-sounding prose and the Caliber comparison in Strength over time. Remove generic filler; preserve licenses and honest provenance.
- Progress metrics are personal indicators, not validated rankings or diagnostic claims. Optional photos, health/device imports and richer measurements remain broader product requirements.

## 3. What is implemented

### Training, logging and catalog

The web app has plan setup, program selection, a training calendar, session logging, saved history, rest timing, substitutions, reviewed adjustments, progress displays and exercise guides. The native starter carries much of the same engine and logging behavior, with resumable plan setup, coach/manual targets, same-weekday target copying, saved/undo controls and local rest alerts.

The catalog contains 71 current program variants plus three legacy preview choices. There are 989 exercise guides and 1,726 web photo assets. These counts describe included content, not independently validated training coverage. Native content includes guide/reference data, but does not bundle all web exercise photos.

Revision 11 expanded standing-dumbbell and two-day hybrid choices and addressed return blocks, equipment increments, saved custom timed actuals, feedback drafts and machine context. Unsupported combinations still need explicit explanations. The separate adult coverage matrix has 1,433 matched and 268 unmatched combinations out of 1,701 sampled setups; see section 8.

### Editorial changes and naming

Revision 12 reviewed first-party interface text, the catalog and exercise guides. It changed 943 guides, added movement-specific summaries, simplified instructions and corrected several unrelated movement notes. It removed the Caliber comparison while retaining the strength index's actual calculation and limitations.

There are display aliases for 71 plan names and 159 distinct workout titles. `lib/presentation.ts` separates display wording from stored titles and load roles. **Do not migrate stored records just to rename a workout.** Preserve custom names, IDs, role keys and history. If a main exercise changes, the display can fall back to a suitable body-region title.

NHS and creator-derived reference programs retain attribution. PHUL/PHAT-style named references are tracking schedules requiring the user's own routine entry; they are not copies of the full original routines.

### Appearance and accessibility

Revision 13 adds six palettes: Volt green, Ocean blue, Iris violet, Sunset, Berry pink and Glacier teal. Green remains the default. System, Light and Dark modes are saved per device. The original geometric gradient M and Movefield wordmarks are provisional assets in `public/brand`.

Headings use Barlow Condensed; reading text, controls and workout data use Inter. Fonts are self-hosted and their SIL OFL notices are bundled. Settings include text sizes, stronger contrast and reduced motion; web also has link underlining. Focus treatment, a skip link, larger primary targets and theme-aware chart/form tokens were added. Native text respects system scaling.

Calculated design-token contrast passed the included checks. Full rendered contrast, reflow, keyboard and assistive-technology behavior has not been verified. Do not claim WCAG conformance from token tests alone.

### Daily workout reminders

Reminders are off by default; the saved default time is 18:00. Scheduling deduplicates to one reminder per workout day and respects completed/skipped/partial sessions, active sessions, held/paused plans and relevant commitments. Do not change training dates or completion records while calculating alerts.

- **Web:** checks while the page is open, offers an in-app reminder and optional browser notification, and uses persistent day deduplication. Sleeping/throttled/closed tabs can miss alerts. Calendar export creates a static `.ics` snapshot with timed events/alarms; later plan edits do not update an imported calendar.
- **Native:** reconciles up to the next 30 workout days after relevant changes and on foregrounding. Permission is requested on enable; quiet iOS provisional permission is handled. Workout cancellations are scoped so they do not erase rest alerts. Reopen after travel/time-zone changes to reconcile local time.

An asynchronous stale-permission response race was reproduced and fixed. Delivery while locked/backgrounded and real device behavior remain untested. These are local notifications, not a remote push service.

### Future model preference

Settings can save Automatic, Qwen3 0.6B, Qwen3 1.7B, Qwen3 4B or Off. This is a **preference only**. Qualification/fallback helpers are deterministic logic; no actual hardware qualification, model download or inference is connected.

## 4. Branding decisions still open

The user likes green, gradients, athletic headings and a readable body font. They want a short lifting/training-related name, preferably one word and two syllables, plus full-name and single-letter marks. Strava and Runna were references for simplicity, not assets to copy. Avoid close imitation of their geometry or Caliber's mark.

Movefield was adopted provisionally, not selected as a legally cleared final name. **LiftSense is excluded** because a directly competing fitness app was found in the Apple and Google stores. The earlier **Liftsen** idea was withdrawn because it sounds too similar. Current unapproved candidates: **Setward, Repspan, Setstride, Liftrel**. Earlier names with obvious app collisions were also rejected; see the revision 13 report.

Preliminary searches do not establish trademark, domain, app-store or logo rights. No domain or registration was purchased. Do not silently choose/register a new final brand, alter stable storage keys/app identity, or describe a name as legally available. Keep Movefield until the user chooses, then research the relevant markets and similar marks before launch investment.

## 5. On-device model direction

The latest user preference is a Qwen3 tier strategy, including **4B on phones that actually qualify**, with smaller choices and a useful app when AI is off. This supersedes the earlier recommendation to prioritize Apple Foundation Models/Liquid models. Those remain comparison research, not the selected product direction.

See `docs/on-device-models.md` for dated source links and build-specific sizes. Published model file sizes are not peak RAM requirements. Qualification must use the exact model revision, quantization, runtime/backend, OS and device, measuring cold start, response time, peak total app memory, thermal behavior, power use and output accuracy. “Newest phone” or advertised RAM is not a passing benchmark.

Start with short, user-requested explanations of verified workout facts and a small relevant set of licensed local reference passages. We do not need to train a language model from scratch. Fine-tuning may later improve task/style behavior using licensed examples on development hardware; it is not continuous phone training or a replacement for factual evaluation.

Keep these boundaries:

- Existing deterministic training rules remain authoritative. Models can explain facts or propose a change; they cannot commit it.
- Preserve the current restricted AI-review eligibility, including youth/concern/context exclusions. Expanding it is a separate evaluated product decision.
- Treat imported titles, notes and reference text as untrusted content. Validate output structure and factual support; fall back to the existing rules-based summary when unreliable.
- Download only with user agreement, showing size/progress and allowing cancel/retry/delete. Verify the revision/checksum and keep license notices.
- No silent cloud fallback, uploads of workout records, continuous background inference or inference during rest timing.
- Native inference requires a native development build; Expo Go cannot load the planned custom native runtime. Web needs its own runtime and capability checks.

No model weights or native inference dependencies are in this export. Recheck model/runtime availability and terms at integration time; the research is a snapshot.

## 6. Run locally

Use Node 24; the prior workspace used 24.19.0. Manifests require Node >=22.13.0. Install/activate **pnpm 11.25.0** through your normal Node tooling. Web and mobile deliberately have different lockfiles; do not replace either incidentally.

From the extracted `movefield` root:

```sh
pnpm install --frozen-lockfile --prod=false
pnpm dev
```

Open the actual URL printed by the server, normally port 5173. Current local training features do not need a cloud API key. Keep the non-secret `.openai/hosting.json`: the Vite/build configuration reads its project metadata. Do not delete it as if it were a credential.

Development servers stay running. Use a second terminal for checks, or stop the server with Ctrl+C first.

The old workspace's runtime selection is excluded. `scripts/execution-profile.mjs` defaults to portable when `.sites-runtime/execution-profile.json` is absent. pnpm can create its own new `.sites-runtime/pnpm-store`; that is normal. Do not copy cached managed runtime state into the new machine.

Root `install:ci` uses Linux-specific Bash/flock/GNU timeout helpers. Use the explicit pnpm command above on import. The generic root README's npm instructions are stale. Native Windows/WSL installation has not been re-tested for this handoff; PowerShell users may need `pnpm.cmd`/`npm.cmd`. Install dependencies within the OS where they will run.

Web verification, from root:

```sh
pnpm exec tsc --noEmit
pnpm build
node scripts/check-preferences.cjs
node scripts/check-audit.cjs
node scripts/check-native-storage.cjs
```

Run the specific catalog/onboarding/focus/training checks affected by a change rather than every huge matrix repeatedly. The root has no single comprehensive `test` script. Several checks rewrite tracked reports: inspect diffs before committing. In particular, `check-preferences.cjs` regenerates `docs/revision-13-validation.json` and can remove manually recorded delivery/publication context; preserve that context separately or restore it accurately.

For the native starter:

```sh
cd mobile
npm ci
npm run check
npm run test:engine
npm run export:mobile
npm start
```

Use `mobile/START-HERE.md` for the existing phone setup notes. `export:mobile` creates iOS/Android JavaScript bundles; it does not sign or install a production app. Expo Go is the current starter workflow. Source ZIPs under `public/downloads` are historical website download artifacts; edit the top-level `mobile/` source, not an older nested ZIP.

Shared code is canonical in root `lib/`. After editing shared logic/data, from root run:

```sh
node mobile/scripts/sync-shared.mjs <absolute-project-root>
```

This refreshes copied native modules/content. Then run native type/engine checks. Do not patch only `mobile/src/shared` and leave the source divergent.

## 7. Source map

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | Main web workspace, session flow and navigation; large existing file, avoid unrelated reformatting |
| `app/layout.tsx`, `app/globals.css` | Root providers/metadata, self-hosted fonts, theme/accessibility styles |
| `components/app-preferences.tsx` | Web appearance/preferences/settings UI and provider |
| `components/brand-mark.tsx`, `public/brand/` | Original provisional logos and previews |
| `components/training-onboarding.tsx` | Web plan setup |
| `components/progress-dashboard.tsx`, `lib/progress.ts` | Personal progress calculations/displays |
| `lib/training.ts`, `lib/saved-data.ts` | Core training types/rules/proposals and saved-data validation |
| `lib/onboarding.ts`, `lib/program-catalog.ts`, `lib/recipes.json` | Setup matching, programs and recipe data |
| `lib/training-focus.ts`, `lib/substitutions.ts`, `lib/tracking.ts` | Focus adjustments, substitutions and tracking behavior |
| `lib/presentation.ts`, `lib/brand.ts` | Safe display naming and provisional brand strings |
| `lib/workout-log.ts`, `lib/rest-timer.ts` | Logged sets/rest deadlines; typing or editing must not start a fresh rest cycle |
| `lib/workout-review.ts` | Existing rules-based summary and restricted optional-model boundary |
| `lib/app-preferences.ts`, `lib/workout-reminders.ts` | Shared preferences, future model-tier selection and reminder/calendar logic |
| `lib/exercise-library.json`, `public/exercise-guides.json` | Exercise metadata and guide prose |
| `public/exercise-photos/`, `docs/exercise-library-*` | Exercise assets and provenance/license/completion records |
| `mobile/App.tsx`, `mobile/src/mobile-engine.ts` | Native workspace and engine adapter |
| `mobile/src/storage.ts` | Native local persistence; preserve existing storage identity/schema |
| `mobile/src/plan-setup.tsx`, `mobile/src/session-editor.tsx` | Native setup and manual/coach targets |
| `mobile/src/appearance.tsx`, `mobile/src/settings.tsx` | Native themes/settings/font loading |
| `mobile/src/workout-notifications.ts`, `mobile/src/rest-alerts.ts` | Native daily reminders/rest alerts; cancellation scopes must stay separate |
| `mobile/src/shared/` | Generated/copied shared snapshot, not sole source of truth |
| `scripts/check-*.cjs`, `mobile/scripts/check-engine.ts` | Focused validation tools |
| `build/sites-worker.ts`, `lib/http-security.ts` | Worker/security behavior; not a production account backend |
| `docs/product-requirements.md`, `docs/audit-acceptance-matrix.json` | Full requirements and outstanding acceptance scenarios |

Web dependencies include React 19.2.8, Next 16.3.6 compatibility, Vinext 1.0.0-beta.5, Vite 8.0.16, TypeScript 5.9.3, Tailwind 4.2.1 and Wrangler 4.92.0. Native uses Expo ~57.0.27, React Native 0.86.3 and its own TypeScript ~6.0.3. The included manifests/lockfiles are authoritative.

The pnpm workspace enforces a seven-day minimum release age and explicit dependency build permissions. Preserve that policy and compatible pins. Do not blindly run forced audit fixes or downgrade framework components to satisfy a scanner.

## 8. Verification evidence and known limits

These are **recorded checks from application development**, not a claim that a fresh install on the recipient's computer has been tested. Handoff creation changes documentation/export only.

| Area | Evidence | Limit |
| --- | --- | --- |
| Revision 13 preferences/reminders | 62 checks in five groups; `docs/revision-13-validation.json` | Token contrast is not rendered UI certification; model selection is mocked qualification data |
| Type/build | Web/native TypeScript, web production build and iOS/Android Metro exports passed | No signed binaries, native compile or phone installation claimed |
| Training/storage regressions | 11 training regression checks and native storage checks passed for r13 | Does not certify every desired program or storage failure scenario |
| Native reminder race | Delayed old permission result tested against newer allowed schedule; fixed | Focused harness was not saved as a standalone regression script; persist a targeted test when changing this code |
| Production worker | HTTP 200, 22 matching CSP script nonces, per-request nonce rotation, POST/internal rejection, private/no-store, assets/ZIP served | Local worker checks; cleanup hung and required interruption after assertions, so not a clean process exit |
| Editorial invariants | R12 compared all 71 catalog plans to r11; IDs, loads, dates/roles, source links preserved | Historical comparison harness relied on old Git history and a workspace-only script; not independently rerunnable from this ZIP alone |
| Broader engine | R11 report records large parameterized matrices and 74 choices across seven start weekdays | Assertion totals are not unique clinical cases or independent scientific validation |
| Browser/phone UX | Not freshly completed for r13 | Reflow, keyboard, screen readers, touch behavior and locked/background notification delivery need testing |

The former environment lacked its required managed browser capability. That is an environment-specific limitation, not a prohibition on Claude using an available, authorized local browser/Playwright workflow. Inspect the app in the recipient's environment and state any limits honestly.

Known outstanding items:

- **Program matching:** `docs/revision-11-coverage.json` reports 268 unmatched out of 1,701 sampled adult setups: 63 powerbuilding cases without a suitable loadable anchor, 36 short two-day hybrid windows, 27 dumbbell-assisted calisthenics cases with insufficient time and 142 competition-barbell equipment/time cases. Distinguish legitimate constraints from missing recipes; don't fill every gap with an inappropriate plan. Existing unsupported responses must stay explicit.
- **Security dependencies:** the latest retained r11 audit found one high-severity web advisory path involving `braces`, and 15 high-severity mobile affected-package entries involving `braces`/`node-forge`, with no critical findings. These are historical, overlapping dependency counts, not a fresh audit. Review current advisories and compatible fixes before release. Older r10 counts are superseded.
- **Performance:** large web client chunk warnings remain; real-device loading, bundle strategy, cold starts and memory are unmeasured.
- **Data platform:** no real account ownership, passkeys/OAuth/2FA service, secure cloud storage, backups, conflict resolution or web/native sync. Existing account/security cards must not claim these services work.
- **Native parity:** not every web metric/editor/integration is present. Full reusable multiweek plan editing, richer imports and measurement tracking remain unfinished.
- **Planning breadth:** annual/seasonal automation, competition/event detail, sport-position programs and full coach/parent/team sharing requirements are incomplete. See the product contract rather than inferring completion from UI labels.
- **Integrations:** HealthKit, Health Connect, Samsung, MyFitnessPal, Strava and Garmin are not connected. Do not imply API access or data syncing from placeholder controls.
- **AI/brand:** no model benchmark/runtime and no final cleared identity. These remain separate decisions and implementation work.

## 9. Suggested next work

Resume in this order, adjusting for actual defects found:

1. **Establish the imported baseline.** Confirm dependency versions and get the web app running. Inspect onboarding, Today/workout, Progress and Settings. Keep source unchanged until you understand persistence and existing tests.
2. **Finish concrete r13 UX verification.** Exercise all six palettes, light/dark/system mode, larger text, reduced motion, focus/keyboard and error states. Test mobile notification permission denial/provisional/full access, edits, pause/resume, completion, time-zone changes and rest-alert coexistence on actual supported devices when available. Fix defects with focused checks.
3. **Address justified program gaps.** Use the coverage report to prioritize real supported cases. Maintain honest time/equipment constraints, youth boundaries and no empty-calendar fallback. Add meaningful cases for each corrected branch and sync native data.
4. **Continue copy review during actual flows.** R12 was broad but is not proof every line is perfect. Check generated summaries, guide-specific movement accuracy, understandable workout titles, creator credits and remaining competitor comparisons without deleting provenance or historical documentation.
5. **Resolve final branding with the user.** Keep the provisional assets until selection. Do the relevant clearance work and create original wordmark/initial variants after selection; do not purchase/register anything automatically.
6. **Prototype local Qwen in an isolated, reversible branch when ready.** Start with a native development build and one short verified-facts task, qualify exact model/runtime combinations, and keep the ordinary app usable. Do not make paid calls or upload user data.
7. **Continue the full product contract.** Accounts/sync, backend ownership/security, richer plan editing, integrations and wider sport/season support require deliberate architecture and implementation. Prepare the requested detailed release plan only when the user asks for that stage.

Items above are priorities, not a claim that the app is near production readiness. Do not deploy just because local checks pass.

## 10. Hosting, privacy and export boundaries

Existing project metadata points to Sites project `appgprj_6ac5a7c96d9481919df913f42a4a4353`. The existing private URL is `https://training-studio-prototype.bigcheese3232.chatgpt.site`. It can be older than this source. The last observed hosted version number was 10; hosted version numbering and development revision numbering are different.

Automatic approval review rejected the attempted latest upload/publication because explicit user permission to transmit source and deploy to Cloudflare was missing. **There was no successful r13 publication.** Do not treat transfer to Claude Code as permission to publish, push externally, change access, or bypass that rejection. Finish a concrete local result before asking for publication approval.

The ZIP excludes dependencies, build outputs, runtime caches, Git history, environment credentials, cookies and bypass tokens. The non-secret project metadata needed by the build is retained. It does not contain the user's browser/phone workout records; those are device-local and separate from the repository. Sample/demo records in source are prototype fixtures.

Current worker behavior limits routes and sets a restrictive CSP with request-specific nonces. Fonts/assets are local. A future real backend or authentication flow will need explicit security design; don't blanket-disable protections to make a new endpoint work.

Preserve exercise source links and `docs/exercise-library-LICENSE.txt` (the recorded dataset license is the Unlicense, not the earlier mislabeled CC0), font OFL notices and other included attribution. Natural copy and original branding do not justify erasing licenses or misrepresenting authorship.

## 11. Import reference

`START_HERE_CLAUDE.md` is the short human setup guide. `CLAUDE_START_PROMPT.txt` is ready to paste into a new Claude Code session. `CLAUDE.md` is the project instruction file Claude Code reads at startup when opened in this project; it is contextual guidance, not a permissions enforcement mechanism.

Official Claude Code context documentation: https://code.claude.com/docs/en/memory. Installation/use documentation: https://code.claude.com/docs/en/overview. No prior ChatGPT conversation is automatically imported by those files; this handoff and the included project documents provide the transferred context.
