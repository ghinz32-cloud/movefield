# Complaint-to-solution map: gym and workout-tracking apps

Prepared 7 October 2026 for the Movefield product team. Movefield is a working name with no trademark clearance. This file is research input only. It does not change app behavior, and it makes no claim that any app listed here has or has not fixed a problem.

## Method and limits

- Searches used WebSearch: extended mode for two broad sweeps, standard mode for targeted lookups. The search tool rarely returned Reddit threads directly. One r/xxfitness thread was read through a public Reddit mirror.
- Most claims were confirmed by opening the page with WebFetch, which was used for 16 pages. Items marked "title only" appeared in search results and were not opened.
- Aggregator sites (Kimola, justuseapp, marlvel, onclarity, garagegymreviews) summarize app-store reviews. Used here only as pointers. Setgraph, Nutrola, unstar.app and Dr. Muscle are competitor or review-business blogs. Their claims are treated as unverified.
- No complaint counts are given. "Several threads" is used only where separate threads were actually seen.
- Movefield status comes from grep and file reads of `/home/claude/movefield` on 2026-10-07. Nothing was run on a phone or in a browser, so every "in place" status still needs a device or browser check.
- Individual forum users are not named.

## Status key

- **In place**: implemented in the repo, with the file path given. Device or browser testing may still be missing.
- **Partial**: some of the behavior exists. The gap is named.
- **Planned**: a requirement in `docs/product-requirements.md` (ID given) that is not built.
- **Out of scope**: not built, with the reason given.
- **Unverified**: a claim I could not confirm.

---

## 1. Paywalls and subscriptions

**Complaint.** Features users relied on move behind a subscription or are removed, and users feel they are paying for less. Some cancel.

**Where.**
- Peloton dropped its free unlimited app tier. Headline seen in search results: https://www.cnbc.com/2024/04/15/peloton-removes-free-app-membership.html (15 April 2024, from URL). Article body not opened.
- Strava made its Year in Sport recap subscriber-only. https://road.cc/content/news/strava-year-sport-now-only-subscribers-317425 (23 December 2025). A syndicated headline gives "$80"; that price is unconfirmed.
- Freeletics forum, feature-removal thread (July to November 2022). Three users say they cancelled subscriptions after changes. https://forum.freeletics.com/t/updates-and-feature-removal-in-the-app/2791?page=4
- Freeletics forum, 23 July 2026. A user calls the paid app's suggestions unreliable. https://forum.freeletics.com/t/strange-progression-and-similar-stretches/24249
- MyFitnessPal moved its barcode scanner behind premium. Headline from The Verge, syndicated by Slashdot: https://news.slashdot.org/story/22/08/25/1955238/myfitnesspal-paywalls-barcode-scanner-that-made-counting-calories-easy (25 August 2022, from URL). Body not opened.

Seen in several separate sources (articles and forums).

**Movefield should.** Keep logging, plan viewing, history and export free. Never put saved history or an export behind payment. If a paid tier is ever added, announce it before it takes effect and show what it adds before any purchase.

**Status.** Out of scope for now. Grep of `app/`, `components/`, `lib/` and `mobile/` found no purchase, subscription, paywall or premium code. A monetization decision is needed before any paid feature is designed.

**Risk if wrong.** A later gate on existing data reads as holding history hostage. Users cancel and leave reviews.

---

## 2. Forced or automatic plan changes without consent

**Complaint.** The app changes loads, sets or dates without agreement, or the progression swings without explanation, so the user has to redo the adjustments.

**Where.**
- Freeletics forum, 23 July 2026, replies 2 August 2026. Suggested weights swing between too heavy and too easy even after the user adjusts them. The same workout repeats. One user reports that a lower warm-up halves the working weight. That report is unconfirmed by staff: https://forum.freeletics.com/t/strange-progression-and-similar-stretches/24249
- Starting Strength app forum, a question from November 2020 with a support reply from December 2020. The reply says the app does not switch programs automatically and that the trainee decides. Not a complaint, but a useful design reference: https://startingstrength.com/resources/forum/starting-strength-app/90835-nvp-progression-program-changes-app-automatic.html
- TechRadar, 28 February 2026, on AI running plans and injury. It reports general concern, not quoted user complaints, and cites a running blog and a coach. Runna's response says its plans are coach-designed and adjustable: https://www.techradar.com/health-fitness/are-ai-training-apps-like-runna-putting-you-at-risk-of-injury-i-asked-a-real-life-running-coach

**Movefield should.** Keep every change that alters load, sets or dates as a proposal showing before and after values, the reason, and the input that caused it. Require accept or decline. Keep the rule that a load increase needs two comparable completed sessions.

**Status.** In place, local only. Proposals with accept and decline are in `lib/training.ts` (Proposal type, COACH-01). Day moves need approval (CAL-02 in `docs/product-requirements.md`). The load rule is in `lib/training.ts` `loadSuggestion`, around lines 289 to 317. Partial: the reason text is one sentence, and the sessions used are not listed in the UI.

**Risk if wrong.** A silent change, or a too-heavy suggestion from a bad rule, injures someone or erodes trust. A rule that is too strict makes users override suggestions and stop trusting them.

---

## 3. Data loss, no export, account lock-in

**Complaint.** History disappears after an update, reinstall or account change. There is no clear way to export. There is no cloud recovery.

**Where.**
- Fitbit community, 2 April 2025. After an automatic Android app update, a user lost about ten years of history. The account had been migrated in December 2024. One reply says reinstalling restored the data. No Fitbit reply: https://community.fitbit.com/t5/Android-App/Lost-historical-data-after-Android-app-update/m-p/5740621
- Garmin Connect forum, late October 2024. Editing a workout in the Android app set rest periods to zero. Another user reproduced it. No Garmin reply: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-andriod/389516/rest-periods-wiped-by-garmin-android-app-grrrrr/1852460
- Hevy help article, undated. Data is stored on the company's servers under a signed-in profile. An unsaved active workout is lost if the app is uninstalled: https://help.hevyapp.com/hc/en-us/articles/38223672272791
- ABC Trainerize feature request for CSV or PDF export, undated, title only: https://ideas.abcfitness.com/forums/940789-client-gym-members-abc-trainerize/suggestions/7843761-let-users-export-data-to-csv-or-pdf

**Movefield should.** Show the date of the last export. Prompt an export before a reinstall, phone change or risky edit. Make the export complete and re-importable. Add a test that exports, clears and restores, and then checks rest values, custom exercises and history.

**Status.** Partial. The web app has JSON downloads for backup, plan and history (`app/page.tsx`, around lines 66 to 141) and a saved-data export (`components/saved-data-recovery.tsx`). Native has backup and restore (`mobile/App.tsx`, around lines 108 to 117). Not built: account export and deletion, cloud backup, sync (DATA-01, DATA-02). Native import is limited to exercise JSON (LOG-04).

**Risk if wrong.** Irreversible history loss is the most damaging failure a training log can have.

---

## 4. Moving to a new phone

**Complaint.** After switching phones, data is missing or cannot be opened, and the user is told to start again.

**Where.**
- The Fitbit thread in section 3 shows history lost after an update that followed an account migration.
- Hevy help article (undated). Signing in again on a new install restores the profile: https://help.hevyapp.com/hc/en-us/articles/38223672272791
- Movefield itself. The native data key is stored with "this device only" access (`mobile/src/storage.ts`, header comment and secure-store options). A restored copy of app data cannot be opened on another phone. The app says so (`KEY_MISSING_MESSAGE` in the same file) and refuses to overwrite. That message tells the user to reset the demo before restoring a text backup in Settings.

**Movefield should.** Add a guided move: export on the old phone, confirm the export was saved, then restore on the new phone by picking a file or pasting a backup, with a preview of what will be replaced. Change the key-missing message so the first step is restoring a backup, not resetting. Never suggest a reset before a restore.

**Status.** Partial. Encryption and the key-missing guard are in place (`mobile/src/storage.ts`). Restore is a paste of the whole backup text (`mobile/App.tsx`). Not built: a guided move, a native file picker for restore, and a tested real phone move.

**Risk if wrong.** The current message asks for a reset before restore. If the user has no recent backup, the encrypted copy cannot be recovered on the new phone. This is the highest-risk path in the native app.

---

## 5. Offline use

**Complaint.** The app fails or loses data with no signal, for example in basement gyms or when travelling.

**Where.**
- Freeletics forum, an open Android bug: the app does not work offline in a training view. Title only, date not checked: https://forum.freeletics.com/t/open-android-the-app-doesnt-work-offline-for-those-in-the-training-flow-test-view/6145
- ABC Trainerize request to track workout stats without a wireless connection. Title only: https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/6595234-allow-workout-stats-to-be-tracked-without-a-wireless-connec
- Wahoo forum thread, "offline mode missing". Title only: https://wahoox.forum.wahoofitness.com/t/offline-mode-missing/16050

Three separate threads seen. Titles only, so details are unconfirmed.

**Movefield should.** Make logging, rest timing and today's session work fully offline on web and native. Test both in airplane mode. Show a plain "saved on this device" state, not a sync claim.

**Status.** Partial. Native saves locally (`mobile/src/storage.ts`, AsyncStorage). Web: grep found no service worker, web app manifest or offline shell in the repo, so a reload with no network may fail. Not tested in airplane mode on either platform.

**Risk if wrong.** A set that fails to save with no signal means lost work and lost trust in the log.

---

## 6. Plate, bar and unit handling

**Complaint.** The app suggests loads that cannot be made with the user's equipment: below the empty bar, not on the available plates, or wrong after a unit change.

**Where.**
- Freeletics forum, first post 18 February 2026. A coach suggests a 55 kg warm-up. The user has an 8 kg bar and no 0.5 kg plates, so only even totals are possible. The user says it used to work. No staff or user confirmation on the page: https://forum.freeletics.com/t/weight-calculation-bug-coach-suggesting-unreachable-weight-despite-equipment-settings/23858
- r/xxfitness thread on a fitness app (Fitbod), read via a public Reddit mirror. The date is not shown; the thread ID suggests about autumn 2024, which is unverified. Complaints: suggested barbell loads below the empty bar weight; a 10 lb-step EZ bar does not match suggestions; users round loads by hand; no confirmed setting to hide the barbell below a weight: https://redlib.belloworld.it/r/xxfitness/comments/1fvy3gt/fitbod_app
- Barbell Medicine forum, "Can I switch from lbs to kg in the app?" Title only: https://forum.barbellmedicine.com/t/can-i-switch-from-lbs-to-kg-in-the-app/14595

**Movefield should.** Round every suggested load to a load the user has entered as available. Hide any load below the bar weight or above an equipment limit, and show the nearest reachable load with a note. Test a unit switch so stored values convert without drift.

**Status.** Partial, with the basics in place:
- Floor rounding to an increment: `lib/training.ts` `roundLoad` (line 70).
- Per-exercise increments and equipment caps (`incrementKg`, `equipmentCaps`), with an equipment limit of 0 treated as unavailable (`lib/training.ts`, around line 293).
- Plate calculators on web (`components/training-tools.tsx`) and native (`mobile/src/tools.tsx`), sharing `lib/training-tools.ts`, which checks the bar weight (lines 24 and 53). Native notes that collars are not counted.
- Gap: `loadSuggestion` has no explicit check that a suggested barbell load is at or above the bar. Plates on hand are modeled as increments, not as a set. Not tested.

**Risk if wrong.** Users who cannot load the suggestion skip the set, load it wrongly, or stop trusting the app. A unit error is a large load error.

---

## 7. Exercise instructions and video

**Complaint.** Demo videos or photos show the wrong exercise or setup, and there is no way to report it.

**Where.**
- Garmin Connect forum, asking how to report wrong workout videos. Title only, date not checked: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/278801/is-there-a-way-to-report-wrong-workout-videos/1337134
- ABC Trainerize request to report and change demo videos. Title only, undated: https://ideas.abcfitness.com/forums/940789-client-gym-members-abc-trainerize/suggestions/48816296-to-be-able-to-report-change-demo-videos

Two threads seen, titles only.

**Movefield should.** Add a "report this guide or photo" link to each exercise guide that records the exercise ID and the reason. Give each guide's source a review date. Keep cues specific to the variation being performed.

**Status.** Partial. `public/exercise-guides.json` has 989 guides, each with `sourceNote` and `sourceURLs` fields. The HANDOFF lists 1,726 web photos. Grep found no video fields or video links in the guide data, and no report control in `app/`, `components/` or `mobile/src/`. Video coverage is open (LIB-04).

**Risk if wrong.** Wrong form cues can cause injury. An error that users see and cannot report undermines the whole guide library.

---

## 8. Substitutions and equipment changes

**Complaint.** The app suggests a barbell exercise the user cannot load, or a dumbbell swap that does not work. Users cannot remove a whole equipment type from suggestions.

**Where.**
- The r/xxfitness thread on a fitness app (section 6). Some barbell lifts do not translate to dumbbells. Users want to exclude the barbell below a weight. Replies suggest swapping exercises or creating a custom gym profile: https://redlib.belloworld.it/r/xxfitness/comments/1fvy3gt/fitbod_app

**Movefield should.** Let users mark an equipment family unavailable. Offer swaps only from curated families that share the movement role and setup. Record a swapped exercise with its own history and equipment context.

**Status.** Partial. Curated movement families and substitutions are in `lib/substitutions.ts`. Substitutions are blocked while a plan is on hold or paused (`lib/substitutions.ts`, line 31). An equipment limit of 0 marks the item unavailable (`lib/training.ts`, around line 293). Not found: a family-wide exclusion that applies across exercises.

**Risk if wrong.** Silent swaps can corrupt progression records. Swaps without history separation mislead the user about progress.

---

## 9. Injuries and pain

**Complaint.** The app keeps prescribing hard work after a pain report, or gives no guidance on what to do next.

**Where.**
- TechRadar, 28 February 2026 (section 2). Concern about injury, drawn from general posts, a running blog and a coach. No individual user complaint is quoted, so treat this as press concern rather than a verified complaint pattern.
- Freeletics forum, 8 December 2023. A staff reply says HIIT is unsuitable for growing bodies. This is about youth dosing, not an injury report: https://forum.freeletics.com/t/kids-routines-family-plans/10639

No individual injury threads were verified in this pass.

**Movefield should.** After a "yes" or "unsure" symptom answer, hold automatic changes, show where to stop, and say when to see a clinician. Keep the "not medical clearance" wording. Never imply that a completed workout clears the user to train.

**Status.** In place for the workout-level concern. A symptom answer of yes or unsure marks that workout as a concern (`lib/workout-review.ts`, lines 11 to 23), and the load rule withholds a suggestion after it (`lib/training.ts`, line 299). A separate plan-level hold (`State.hold`) also blocks suggestions and substitutions. The conservative return option says it is not medical clearance (`lib/training.ts`, line 233). Gap: no clinician or emergency guidance and no body-location question. Grep found no such wording.

**Risk if wrong.** A user with pain keeps training because the message is vague. This is the highest-harm gap in the list.

---

## 10. Beginners overwhelmed or misled

**Complaint.** New users cannot choose a program, get starting weights that are too heavy, or do not know how to begin.

**Where.** Evidence is thin in this pass. A Starting Strength "newbie help" thread exists, title only: https://startingstrength.com/resources/forum/programming-modifications/92169-total-newbie-help-post1811563 . No beginner-specific complaint thread was opened and verified.

**Movefield should.** Run a first-run test with about five people who have never lifted. Check whether setup, first load and first logged set are clear. Offer one recommended path with a plain way to change it.

**Status.** Partial. Experience levels and calibration with no assumed starting weight are in the requirements (PLAN-01). The session guide is plain (`lib/session-guide.ts`). The beginner path has not been tested with users.

**Risk if wrong.** Overwhelmed users leave before their first logged session.

---

## 11. Opaque progression logic

**Complaint.** Users cannot tell why a weight was suggested or why a workout repeated.

**Where.**
- Freeletics forum, 23 July 2026 (section 2): suggestions swing and workouts repeat, with no staff reply.
- Freeletics forum, 18 February 2026 (section 6): a suggestion does not match the user's equipment, and the user says it used to work.

**Movefield should.** For each suggested load, show the two sessions used, the rule in one sentence, and a "keep my load" action. Record the override as the user's choice. Store the rule version with each proposal so a rule change can be traced.

**Status.** Partial. The engine returns a reason string with each suggestion (`lib/training.ts` `loadSuggestion`, lines 289 to 317). COACH-01 requires evidence and rule version in the production workflow. The sessions used are not listed in the UI.

**Risk if wrong.** Users distrust the app and override it without a record, so stored data no longer shows what they actually did.

---

## 12. Logging speed and rest timer

**Complaint.** The rest timer fails when the phone is locked or the app is closed. Rest values are lost on edit. Logging takes too many taps.

**Where.**
- Freeletics forum, 1 to 2 December 2023. On iOS, the rest countdown does not alert when the phone is locked or the app is closed. Another user reports it works on Android. Staff were tagged; no reply is shown: https://forum.freeletics.com/t/rest-timer-notification/10557
- Garmin Connect forum, late October 2024 (section 3): editing a workout reset rest periods to zero.
- ABC Trainerize feedback, "too much tapping on workouts". Title only, undated: https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/50583500-too-much-tapping-on-workouts

**Movefield should.** Test lock-screen and background rest alerts on a real iPhone and a real Android phone before any claim is made. Make sure typing a number does not restart the rest timer. Time a full set log on a phone.

**Status.** Partial. Native schedules a local notification at rest end (`mobile/src/rest-alerts.ts`, line 15). Web plays a sound and shows an alert only while the page is open (`components/rest-timer.tsx`, line 21). Rest starts after Log set, not while numbers are entered (`docs/product-requirements.md`, revision 11 checkpoint). Lock-screen delivery and time per set are untested.

**Risk if wrong.** A missed rest end causes a missed or rushed set. Users then turn alerts off.

---

## 13. Privacy and data sharing

**Complaint.** Users learn that location, routes or health data was exposed or shared with third parties.

**Where.**
- Strava heat map, January 2018: the public map revealed military sites. Strava restricted visibility afterward. https://www.cnbc.com/2018/01/28/global-heat-map-for-joggers-exposing-sensitive-us-military-information.html and https://www.engadget.com/2018/03/13/after-exposing-secret-military-bases-strava-restricts-data-visi/
- MyFitnessPal breach, March 2018: about 150 million accounts, per a headline dated 29 March 2018: https://www.bnnbloomberg.ca/under-armour-says-150-million-myfitnesspal-user-accounts-were-breached-1.1042133
- A 2014 FTC study, reported by an attorney. Twelve mobile health and fitness apps shared data with 76 vendors. No apps are named in the article: https://www.fiercehealthcare.com/mobile/ftc-health-fitness-apps-share-user-info-vendors (12 May 2014)

**Movefield should.** Publish a plain statement of what is stored on the device and what leaves it (currently nothing). Keep analytics and third-party scripts out. Warn before a backup file is shared, because the export is readable JSON.

**Status.** In place for the current build. Grep found no analytics, advertising or third-party script code. A strict content security policy is set (`lib/http-security.ts`, line 12). Native backup is plain JSON that the user chooses to share (comment in `mobile/src/storage.ts`). Gap: no plain data statement, and no share warning in the export text (`mobile/App.tsx`). Accounts and security are planned (AUTH-01, SEC-01).

**Risk if wrong.** Trust and regulatory exposure rise sharply once accounts or integrations exist.

---

## 14. Minors

**Complaint.** Parents and teens want age-appropriate training. Some apps refuse them outright, and age rules depend on a self-declared adult supervisor.

**Where.**
- Freeletics forum, 8 December 2023. Parents asked for kids and teen workouts. A staff reply says users must be 18 and that HIIT is unsuitable for growing bodies. Another user cited the same 18+ rule: https://forum.freeletics.com/t/kids-routines-family-plans/10639
- The same page links a related German topic on family sharing (title only, last activity 27 August 2023). Its URL was not captured, so it is not cited further.

**Movefield should.** Keep the youth restrictions: no maximal tests, supervised progression, no HIIT-style content for under-18s. Keep parent visibility off until consent rules are set. State plainly that supervisor attestation is the user's own statement, not verification.

**Status.** In place, partly. Age floor of 14 (`lib/onboarding.ts`, line 8; `lib/recipes.json`, `age_min` 14). Youth gates on warm-ups, sets, supersets, jumps and running (`lib/training.ts`, lines 86 and 87; `lib/training-focus.ts`, lines 34 to 39; `lib/session-guide.ts`, line 3). Supervision is recorded as an attestation, not verified (`lib/recipes.json`, around line 728). Parent sharing is not built (AUTH-03).

**Risk if wrong.** Wrong youth progression or unclear consent for minors creates safety and legal exposure.

---

## 15. Accessibility and text size

**Complaint.** A fitness app's screens do not work with VoiceOver, or large text breaks the layout.

**Where.**
- AppleVis comment thread, 4 to 7 June 2025. On iOS 18, the session and trends sections of Apple's Fitness app do not open with VoiceOver. Apple acknowledged the report. This is a first-party app, not a third-party gym app; it is included because it is a fitness app: https://applevis.com/comment/190526
- AppleVis thread on the accessibility of Runtastic apps. Title only, undated: https://applevis.com/comment/52817

**Movefield should.** Run VoiceOver on iOS and TalkBack on Android across the core flows (plan accept, log set, rest, history). Test at the largest system text size. Record the results before describing the app as accessible.

**Status.** Partial. Text size, reduced motion, contrast and underline controls exist (`app/globals.css`, lines 76, 153, 184 and 208; `lib/app-preferences.ts`; `mobile/src/appearance.tsx`). Native inputs have labels (`mobile/src/tools.tsx`). The HANDOFF says screen-reader, reflow and keyboard behavior have not been verified (section 8).

**Risk if wrong.** Users who rely on assistive technology cannot log sets. An accessibility claim without testing is a serious problem.

---

## 16. Reminders and notifications

**Complaint.** Users receive marketing push notifications or too many reminders, and then switch all notifications off.

**Where.**
- Freeletics forum, 3 April 2023. A user complains about marketing push notifications from the shop. No staff commitment shown: https://forum.freeletics.com/t/please-be-respectful-and-do-not-use-push-notifications-for-marketing-purposes/6981
- Freeletics "Coach notifications" thread. Title only, undated: https://forum.freeletics.com/t/coach-notifications/19181

**Movefield should.** Keep reminders off by default. Send only workout and rest notifications. Add quiet hours and a daily cap. Keep marketing out of push entirely.

**Status.** Partial. Reminders are off by default with one per workout day (`HANDOFF.md`, section 3, "Daily workout reminders"; `mobile/src/workout-notifications.ts`, line 36). Rest alerts are separate (`mobile/src/rest-alerts.ts`). Grep found no quiet-hours or frequency setting and no marketing push code.

**Risk if wrong.** Users who get noisy alerts turn off everything, including rest alerts.

---

## 17. Ads and upsells

**Complaint.** Ads or upgrade prompts interrupt logging, or features the user relied on move behind an upsell.

**Where.**
- MyFitnessPal barcode scanner moved behind premium (section 1).
- Freeletics marketing push complaint (section 16).
- Kimola summary of MyFitnessPal's barcode removal. Aggregator; date not checked: https://kimola.com/reports/myfitnesspal-removes-free-barcode-scanner-feature-140890

**Movefield should.** Keep ads out of logging, rest and history. Limit any upgrade message to Settings. Never put an upsell between the user and a set.

**Status.** Out of scope now. Grep found no advertising, upsell or in-app purchase code.

**Risk if wrong.** An upsell in the logging path drives users away during a session.

---

## Ranked top ten gaps

1. **Phone change and data restore** (sections 3 and 4). Restore is paste-only, the native key is device-bound, and the key-missing message asks for a reset before restore. Fix before any beta.
2. **Pain and symptom escalation** (section 9). The hold exists, but there is no stop-and-seek-care guidance and no body-location question.
3. **Unreachable suggested loads** (section 6). No explicit bar-floor check in `loadSuggestion`, and plates on hand are not modeled as a set.
4. **Accessibility verification** (section 15). Settings exist, but there is no screen-reader or large-text evidence.
5. **Rest and lock-screen alert delivery** (section 12). Native alerts are scheduled, but lock-screen delivery is untested on phones.
6. **Web offline use** (section 5). No service worker or offline shell for the web version.
7. **Progression reasons and overrides** (section 11). Show the sessions used, and let users record an override.
8. **Minors and parent visibility** (section 14). Youth gates exist, but parent consent is not built and supervision is self-declared.
9. **Guide and video error reporting** (section 7). No report control, and no video.
10. **Equipment exclusion** (section 8). An equipment limit of 0 exists, but there is no family-wide exclusion.

Next tier, not in the top ten: notification controls (section 16), a privacy statement and backup share warning (section 13), a monetization decision (sections 1 and 17), and a beginner first-run test (section 10).

## Unverified or not confirmed

- Most Reddit threads did not appear in search results. The one Reddit thread read was opened through a mirror, and its date is not shown.
- The Peloton and MyFitnessPal items were confirmed from headlines and URLs, not article bodies.
- The Strava "$80" price is not confirmed.
- Google Fit API shutdown dates conflict across sources. A May 2024 article gives 30 June 2025, and other results name later 2026 dates. Not cited for Movefield status because Movefield has no integration (INT-01, INT-02).
- Offline, video and some Trainerize items are titles only.
- Hevy, Runna and Fitbod statements are from their own pages or press and were not checked further.
- All Movefield statuses come from code reading on 2026-10-07. Nothing was run on a phone or in a browser.
