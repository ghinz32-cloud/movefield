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
- The workout review says it does not use an AI model, and what would change if one were added (`AI_DISCLAIMER`). The review code has a draft contract for a future model (`REVIEW_PROMPT`, `aiReviewSchema`, `validateAiReview`). No code path calls it.
- Design and training plan for the optional on-device feedback model: `docs/ai-feedback-plan.md`. Nothing is installed.

**Run and host**
- `docs/RUN-AND-HOST.md`: desktop and phone steps, the checks to run, hosting options, and what still needs a real phone.
- `mobile/eas.json`: development, preview and production build profiles. `expo-dev-client` and `npm run start:dev` for a development build. Nothing has been built.

**Model and account**
- Qwen3 0.6B is the only model offered, as the first planned model. Nothing is installed or tested. The old 1.7B and 4B choices are no longer offered; a saved 1.7B or 4B preference now reads as Automatic.
- No username or password. Account and two-factor screens are previews and describe recovery by verified email or a second factor.

**Program design audit**
- `scripts/check-program-design.cjs` checks all 71 catalog programs against the rules in `docs/program-evidence.md`, section 5: weekly sets and frequency for major muscle groups, rep ranges, heavy-set rest, competition-lift coverage, run spacing, hybrid session structure, youth limits and session length.
- Changes made to meet the rules: Bodybuilding 3, Bodybuilding 4 upper days, Powerbuilding 3 and 4, the powerbuilding variants, Dumbbell Bodybuilding 3 and Powerbuilding 3, Machine Bodybuilding 3, and Home Bodybuilding 3 (explicit exercise lists instead of shared helpers). Two-day and brief descriptions now say that each muscle group gets less weekly work.
- Run-only Easy base 4 now runs Saturday, Sunday, Tuesday and Thursday instead of four days in a row. Four runs in seven days must include one back-to-back pair; the engine keeps it to one.
- Two allowances are printed by the check, not hidden: Home Bodybuilding 3 biceps (no bodyweight or band curl in the library) and Easy base 4 run spacing. One known gap is printed: the two-day programs (Bodybuilding 2, Powerbuilding Foundation 2, and the two dumbbell two-day programs).
- Result: 71 programs, 0 rule failures.
- Four check scripts copied a fixed list of `lib` modules that left out `program-evidence`, so they failed before any test ran. Three checks still expected old values (the saved model name, a plan name and a powerlifting name prefix). The scripts were updated; the app was not changed for them.

**Research records (not app code)**
- `docs/complaint-solution-map.md`: gym-app complaints mapped to Movefield status and fixes.
- `docs/model-verification-2026-10.md`: which Qwen models exist, their licences and mobile builds.
- `docs/workout-evidence.json`, `docs/official-program-facts.md` and `.json`: sources and program facts.

## Checks run

- Web: `pnpm exec tsc --noEmit`, `pnpm build`, `check-preferences`, `check-audit`, `check-native-storage`, `check-tools`, `check-goals`, `check-transfer`, `check-browser-vault`, `check-program-depth`, `check-catalog`, `check-training`, `check-program-selection`, `check-onboarding`, `check-program-design` (all exit 0).
- Phone: `npm run check`, `npm run test:engine` (includes a starting-plan test), `npm run export:mobile` (iOS and Android bundles exported to `dist-mobile`).
- Generated reports rewritten by the checks were reviewed. `docs/program-depth-validation.json` changed only in timestamp, assertion count and coverage counts, and is kept. `docs/revision-13-validation.json` and `tsconfig.tsbuildinfo` were restored and not committed.
- Browser, headless Chromium on the dev server: typed goal reader; plan step with START HERE and fit notes; first workout prompt (shown only when a link exists; the plan used had none, so the prompt correctly stayed closed).
- Second pass (same branch): `check-focus` (its module list was missing `program-evidence`, now fixed), `check-transfer` (a changed Argon2 setting is now refused before the password is used), `check-browser-vault` (43 checks, including a failed restore that keeps the previous key and a failed clean-up that does not undo a stored restore), `check-native-storage` (the same two cases for the phone), `check-training` (29 tests). All check scripts exit 0.
- Offline shell, rebuilt app on a restarted local server, headless Chromium: online load fills the shell cache; with the network off the page reloads with no failed requests, no page errors, and the bundles served from cache.
- Phone type check and engine tests pass after the restore change.
- Workout review gate (`check-workout-review.cjs`, 25 checks): a model reply must be one JSON object, match the review context, use only figures that appear in the facts, and avoid clearance and diagnosis wording. Anything else returns null. No model runs and no model text is displayed; the schema notes say held-out evaluations come first.
- Reports the checks rewrote (`docs/revision-10-validation.json`, `docs/revision-11-validation.json`, `docs/revision-13-validation.json`, `docs/program-depth-validation.json`) were restored to their committed versions. The revision 11 rewrite had removed the `deliveryChecks` record with `published: false`. The revision 13 rewrite shows 98 checks where the committed report shows 62; the committed report is kept and not updated.

## Not verified

- Phone builds for this batch: `npm run export:mobile` not run in this batch. Native screens (demo prompt via Alert, pain text, starting label) were checked by type-check and engine tests only, not on a device.
- The demonstration link path in the browser (a link appears in the dialog) was not seen on screen. It is covered by unit checks and type checks.
- Node 22 was used in this environment. CLAUDE.md names Node 24 as the target.
- Argon2id timing on the phone (not measured).
- Accessibility with VoiceOver or TalkBack, and lock-screen rest alerts.
- A full restore in a browser (choose a file, enter the password, confirm, see the data change). The vault paths are covered by unit checks only.
- The phone restore on a device: the new-key order is covered by the native storage check against an in-memory store, not by a real secure store.
- Android storage size. The phone seals data as hex, which roughly doubles its size; the Android AsyncStorage limit is near 6 MB, so this is a known ceiling for long histories. Not fixed.

## Gaps from the complaint map still open

- Suggested loads are not checked against the bar floor inside `loadSuggestion`. The warm-up ladder already enforces it.
- Progression reasons: the sessions used are not listed in the UI, and there is no override record.
- Equipment families cannot be excluded across exercises (only per-exercise limits).
- Guides and videos have no "report this" control.
- Web offline use: the app shell works offline in Chromium (automated check). Not tested in Safari or on a phone. Old bundles are not removed until the cache name changes.
- Minors: parent consent is not built. Supervision is a self-declared statement.
- A symptom check-in does not yet ask where the pain is.

## Decisions for you

1. **Model family. Decided: Qwen3 0.6B first.** It is the smallest Qwen3 model with a confirmed React Native ExecuTorch export. Qwen3 1.7B and 4B stay as later options, offered only after device tests pass. Qwen3.5 is not chosen, because no runtime for it is confirmed.
2. **Username and password. Decided: none for now.** Nothing asks for a username or password, and the app does not lock with a password (no app lock). Future accounts will recover through a verified email address or another second factor. The account and two-factor screens remain previews and say so.
3. **Phone build route.** EAS Build (Expo's hosted service), configured in `mobile/eas.json`. Building needs your Expo account (`eas login`), a project ID from `eas init`, and an iOS bundle identifier and Android package name that you choose. None has been created here. Store releases also need Apple and Google developer accounts.
4. **Publication. Not deployed.** You asked for a deploy. No credentialed route was available in this session: the Cloudflare Developer Platform connector is not installed or connected, and no Cloudflare token or account is set in this environment. Nothing was published, shared or pushed to a live endpoint. To deploy, connect the Cloudflare connector in claude.ai (or give a deploy credential for the Sites project in `.openai/hosting.json`), then confirm. The current build (`pnpm build`) passes.
5. **Program names.** The new names are proposals. Change any you do not like in `programDisplayNames`.
6. **Official programs.** Facts are recorded, but none is added to the catalog yet, because several are only partly verified.
