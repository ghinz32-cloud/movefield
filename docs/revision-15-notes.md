# Revision 15 notes

Status: local work on `review-fixes`. Not deployed, not published, not shared. Publishing needs your explicit approval.

## Commits in this revision

- `6078466` Web: encrypted local data, password-protected transfer files, restore with confirmation.
- `638c660` Phone: password-protected transfer files, key-missing recovery through a transfer file.
- This batch (see "What changed").

## What changed in this batch

**Starting plans and goals**
- Typed goal. Under the goal tiles, you can describe your goal in your own words. Keyword rules (`lib/goal-match.ts`) suggest one goal, list the words that matched, and show any other goals mentioned. Nothing changes until you choose "Use this goal".
- Starting plan. The best-fitting plan for your goal is recommended by days, session length and experience (`fitScore` in `lib/onboarding.ts`). For a first-time lifter it is labelled "START HERE · FIRST TIME".
- Fit notes on every plan card: how many of your days it uses, whether it fits your session window, and whether it assumes experience.
- Clearer names for the self-designed programs (one table, `programDisplayNames` in `lib/program-catalog.ts`). IDs and stored history are unchanged.

**First-time exercises**
- Before the first set of an exercise you have never logged, a prompt offers a demonstration. A curated video link is used when one is recorded, otherwise the exercise's source page. The prompt only appears when a link exists. "Don't ask about these" is saved in your data. Movefield does not host or play video.
- Web and phone (`lib/exercise-video.ts`, `components/demo-prompt.tsx`, `mobile/App.tsx`).

**Evidence**
- Fifteen sources were checked against primary pages and added to the Sources tab (`SOURCE_LINKS` in `app/page.tsx`). Partly checked sources are labelled.
- Each plan now cites the sources for its discipline (`lib/program-evidence.ts`). A check fails if a cited source has no Sources entry.
- Details, gaps and the discipline map: `docs/program-evidence.md`.

**Safety and AI wording**
- Pain and symptom answers now show clear instructions to seek medical care, not only "stop and seek guidance" (`lib/safety-copy.ts`). Shown on web and phone, and in the workout review.
- The workout review says plainly that no AI is used and what would change if one were added (`AI_DISCLAIMER`).
- Design and training plan for the optional on-device feedback model: `docs/ai-feedback-plan.md`. Nothing is installed.

**Run and host**
- `docs/RUN-AND-HOST.md`: desktop and phone steps, the checks to run, hosting options, and what still needs a real phone.

**Research records (not app code)**
- `docs/complaint-solution-map.md`: gym-app complaints mapped to Movefield status and fixes.
- `docs/model-verification-2026-10.md`: which Qwen models exist, their licences and mobile builds.
- `docs/workout-evidence.json`, `docs/official-program-facts.md` and `.json`: sources and program facts.

## Checks run

- Web: `pnpm exec tsc --noEmit`, `pnpm build`, `check-preferences` (98), `check-audit` (11), `check-native-storage`, `check-tools` (33), `check-transfer` (45), `check-browser-vault` (35), `check-goals` (94).
- Phone: `npm run check`, `npm run test:engine` (now includes a starting-plan test).
- Browser, headless Chromium on the dev server: typed goal reader; plan step with START HERE and fit notes; first workout prompt (shown only when a link exists; the plan used had none, so the prompt correctly stayed closed).

## Not verified

- Phone builds for this batch: `npm run export:mobile` not run in this batch. Native screens (demo prompt via Alert, pain text, starting label) were checked by type-check and engine tests only, not on a device.
- The demonstration link path in the browser (a link appears in the dialog) was not seen on screen. It is covered by unit checks and type checks.
- Node 22 was used in this environment. CLAUDE.md names Node 24 as the target.
- Argon2id timing on the phone (not measured).
- Accessibility with VoiceOver or TalkBack, and lock-screen rest alerts.

## Gaps from the complaint map still open

- Suggested loads are not checked against the bar floor inside `loadSuggestion`. The warm-up ladder already enforces it.
- Progression reasons: the sessions used are not listed in the UI, and there is no override record.
- Equipment families cannot be excluded across exercises (only per-exercise limits).
- Guides and videos have no "report this" control.
- Web offline use: no service worker.
- Minors: parent consent is not built. Supervision is a self-declared statement.
- A symptom check-in does not yet ask where the pain is.

## Decisions for you

1. **Model family.** Start with Qwen3 1.7B, which has React Native ExecuTorch exports, or commit to Qwen3.5 2B, which has no confirmed mobile runtime yet. The research favours Qwen3 1.7B for a first test.
2. **App lock.** A password on every app open is not built. It would mean that a forgotten password makes local data unrecoverable, so it needs your decision on recovery before it is added.
3. **Phone build route.** EAS Build (Expo's hosted service) or another route. Nothing is configured yet.
4. **Publication.** Nothing is deployed or shared. Ask before any change to the live site.
5. **Program names.** The new names are proposals. Change any you do not like in `programDisplayNames`.
6. **Official programs.** Facts are recorded, but none is added to the catalog yet, because several are only partly verified.
