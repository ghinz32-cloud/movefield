# Training Studio: deep product review

Prepared for Garret Hinz | 7 October 2026 | Revision 7

## 1. The decision

The concept is ready for the next app-design phase. It is not ready for public use as a secure, personalized coaching service. This review strengthens the prototype, records the gaps, and defines what must work before real people depend on it. All original product goals remain in scope.

The strongest foundation is the web prototype: plan selection, exercise search and guides, local tracking, progress views, custom additions, and approved changes. The mobile starter shares training logic and written content but still uses an adult sample profile. A screen or toggle is not evidence that the corresponding service exists.

The most important next milestone is one dependable journey: create an account, complete personal setup, accept a plan, log a workout, recover from an interruption, and see the same record on the website. Build this before multiplying sport templates or integrations.

No finite audit proves that every bug has been found. We will prevent omissions with a requirements register, explicit training rules, reproducible tests, qualified content review, and release gates. Each feature needs an owner, a completion test, and evidence that it works.

## 2. What this review examined

Reviewed the current web source, shared training and scheduling engine, persisted-data validation, exercise additions, charts, content coverage, and Expo starter. Reproduced several defects with the actual engine. Ran regression checks and production-response security checks. Used the browser to inspect progress tables, exercise history, and blank-set protection. Checked current primary security, accessibility, store, and exercise-science sources.

This was not an independent penetration test, a medical review, a legal opinion, or physical iPhone/Android testing. Successful mobile exports mean the JavaScript bundles compile; they do not establish that biometrics, notifications, OS recovery, or a signed app work on phones.

The 989 exercise entries have written guides. That count does not mean 989 independently reviewed movements or 989 videos. The website has 1,726 source photographs; the native starter does not yet bundle those photos. Exact-variation video coverage and rights review remain unfinished.

## 3. Concrete defects addressed

| Finding | Change made | Remaining limit |
| --- | --- | --- |
| Web actual reps copied from planned targets | New sets start at zero with unknown load; empty sets cannot be completed | Explicit user-entered actuals are still self-reported |
| Overdue native workouts could be stacked today | Starting requires today's approved date; a cascade preview shows dates before acceptance | Whole-year scheduling still needs implementation |
| Partial native workout could strand progression | Added a shorter-session review and separate date-change approval | Later dependent sessions may also need review; not a complete return-block generator |
| New competition bypassed jump checks | Existing jumps are rechecked at start and during schedule changes | The two/three-day buffers are conservative app choices, not medical clearance |
| Restoring a skipped session created collisions | Restore now validates commitments, dates, spacing and collisions before changing state | Overdue skipped sessions need a fuller restore-and-move flow |
| Long setup label or enormous timed addition broke reload | Shared customization validation caps labels and resulting session length | Larger persistent storage needs a database design |
| Too many archived/copied plans broke reload | Matching 100-plan guards; validate before overwriting the last readable web save | Export/archive-management UX needs expansion |
| Old accepted load survived a return proposal | Return previews clear the accepted weight/setup and call for recalibration | Reviewed return programs by discipline remain to build |
| Native rapid edits could use stale state | Mutations use a current-state reference | Real-device rapid-tap and app-kill tests remain |
| Reset could race pending writes | Reset joins the storage queue and blocks mutations while running | Full transactional offline storage remains a production task |
| Replacing a native plan cleared commitments and a concern hold | Both are retained; conflicting replacement plans are rejected | Native commitment entry and concern flows are not yet complete |
| Prerequisite selection depended on array order | Uses the most recent finished attempt by timestamp | Genuine repeat/correction workflows need explicit attempt rules |
| Charts were difficult to inspect without a mouse | Each progress chart now offers a data table | Screen-reader and large-text testing on real devices remain |
| End of schedule implied every workout was completed | Shows a block review with completed, partial and skipped counts | Automatic next-block proposals remain unfinished |
| Commitment removal had no quick recovery | Added Undo in the web Calendar | Multi-day trip editing and onboarding deletion still need refinement |
| Custom entries promised a guide they did not have | Labels now distinguish custom entries without instructions | Custom instructional media editor is not built |
| Missing-guide advice did not retry loading | Reopening a missing guide now retries | Offline media cache and a richer retry surface remain |
| Side labels and fractional native reps were ambiguous | Known side values only; alternating sets excluded from load recommendations; reps must be whole numbers | Full per-side charting and explicit alternating-rep conventions remain |

Also enlarged selected web controls and native touch targets, increased native body/supporting text, identified native Done controls by exercise, and put link errors inside the guide modal. This is targeted accessibility work, not a conformance claim.

## 4. Product rules that must never be violated

1. **Actual work is separate from planned work.** Unknown is not zero. Skipped is not completed. A partial session keeps its completed sets without inventing the rest.
2. **No silent schedule changes.** Show every affected date, conflict and block extension. Accepting a plan authorizes its stated progression; feedback changes still need approval.
3. **No catch-up debt.** Missed training does not justify stacking sessions or automatically increasing the next workout.
4. **One coaching authority.** Coach-directed mode records the coach's plan. App add-ons must not compete with it. Offseason handover needs a preview and a date.
5. **Comparable means the same thing.** Exercise variation, load convention, units, machine setup, range, assistance and side matter. A similar name is not enough.
6. **A new plan changes future work, not the past.** Keep finished records, current concerns and real commitments. Finish or discard the active workout first.
7. **Concerns override increases.** Pain, illness, uncertain symptoms and return-to-sport are distinct from routine soreness. The app cannot diagnose, assess video technique, or clear a concussion.
8. **Never claim a save or sync that did not happen.** Separate saved-on-device, pending upload, synced, conflict and failed states.
9. **Privacy follows the record.** An invitation, team membership or shared device does not grant access to all health notes or photos.
10. **Unsupported input gets a useful exit.** Offer tracking, a simpler reviewed plan, fewer add-ons, more time, or a different date. Do not manufacture scientific specificity.

## 5. Training science and coaching governance

The current ACSM adult resistance-training statement is the 2026 update. Its recommendations concern healthy adults; they do not validate youth sport-position programs or our exact adaptive algorithm. The older 2009 adult statement is now labeled historical in the prototype. [S1]

Every program and coaching rule needs a compact evidence record: population, goal, eligible exercises, prerequisites, exclusions, sources, evidence limits, reviewer, review date, version, and acceptance tests. Separate established principles from expert interpretation and our product defaults. For example, two successful exposures, a specific RIR threshold, a 5% increment ceiling, and jump scheduling buffers are app rules; they are not universal research conclusions.

For youth, experience, equipment fit, instruction and suitable supervision matter alongside age. A barbell is not necessarily a light implement. Do not unlock adult training just because a birthday occurs. Do not add youth weight cutting, dehydration or compensatory exercise flows. Use individual progress rather than public rankings or a claim that a score measures athletic potential. [S2, S3]

For sports, keep a coverage matrix by sport, position/event, season, experience and equipment. Separate general preparation, conditioning, skills practice and medical/safety rules. Football quarterback and baseball pitcher cannot be treated as labels on the same generic plan. Throwing workload across teams, heat, surfaces, equipment, and facility supervision need discipline-specific handling. [S4, S5]

Include football/flag football, basketball, baseball/softball, soccer, volleyball, track and field, cross-country, swimming/diving, wrestling, lacrosse, field/ice hockey, tennis, golf, cheer/dance, gymnastics and bowling; check state and regional gaps. A sport being selectable does not mean its full programming is complete.

Annual seasons must account for overlapping sports and multiple games per week. Competition importance helps allocate training; it cannot guarantee zero soreness. Adding or deleting a game must not silently raise or lower work. Practice and outside training remain relevant even when no wearable data is available.

Before automated youth coaching is released, qualified youth strength-and-conditioning and sports-medicine reviewers should examine the actual programs, exclusions, and concern flows. Adult, running and technical skill pathways need their own appropriate reviewers. A reference link alone is not a review.

## 6. Exercise and program completeness

The exercise catalog needs a release record for each variation: stable identity, implement, machine type, setup, start position, movement, finish, breathing, common errors, easier option, target metric, load convention, progression eligibility, exact media match, source/license, reviewer and revision.

Keep plate-loaded machines, selectorized machines, cables, barbells, dumbbells and kettlebells distinct. If the source does not identify the machine mechanism, say so. Clearly state per-hand, per-side or total load beside the field, not only in a long guide. Bodyweight, added load and assistance must be separate.

Use short sentences and ordered steps while retaining exercise terms. A detailed description should say how the person adjusts the equipment and moves; it must not pretend the app has positioned them or watched their form. Long explanations belong behind clear section names. Keep quick cues visible without hiding safety-critical setup requirements.

Custom movements can always be tracked, but automated progression requires a known movement and reviewed rule. A user checking a box that says 'controlled resistance' is insufficient validation for a production coaching engine. AI-imported plans need the same boundaries as manually entered plans.

Each plan style must have a distinct purpose and progression: true squat/bench/deadlift-centered powerlifting; hypertrophy-focused bodybuilding; mixed strength/hypertrophy powerbuilding; separately budgeted endurance and lifting for hybrid plans; event-specific running; and appropriate skill prerequisites for calisthenics, jumping and agility. Do not pretend one template covers all these.

Mix-and-match setup keeps one primary goal and one total time/recovery budget. Core, jumps, assistance supersets and activity support are bounded additions. If they do not fit, explain the tradeoff. Do not trim defining powerlifting work or rest simply to accept every preference.

## 7. Security architecture before real accounts

Use a managed identity provider and one server-owned account identity across all platforms. Google, passkeys, an Apple-compatible login choice, optional authenticator MFA and recovery must be real implementations. Never merge accounts solely because email text matches. Test relay emails, revoked login, expired callbacks, lost devices and linking mistakes. [S6, S7]

Biometrics unlock a device-held credential or passkey; a local success flag is not server authorization. We should not collect fingerprints or facial images. Native secrets need OS-backed secure storage. An encrypted workout cache is a separate design problem. Expo documents credential-loss cases after uninstall or biometric changes, so recovery needs physical-device tests. [S8]

Every server operation must authorize the requested record: workouts, photos, plans, exports, imports, invitations and API keys. Test one account requesting another account's IDs. Client-submitted user/athlete/team IDs cannot grant access. Short-lived photo links and private cache rules must protect thumbnails too.

Web sessions should use secure HttpOnly cookies, appropriate SameSite behavior and CSRF protection. Native refresh sessions need provider-supported rotation/revocation. Keep secrets out of source bundles, URLs, logs, analytics and ordinary local storage. Logout and account switching must isolate pending writes and cached photos.

Treat imports as untrusted data. Validate shape and meaning: unique IDs, known exercise references, units, dates, finite values, range ordering, dependency cycles, duplicates, size limits and permissions. Preview first, then apply atomically. AI prose cannot override training rules. Public API tokens need narrow scopes, expiry, revocation and rate limits; importing a plan must not grant photo access.

Use OWASP ASVS for web/API verification and MASVS/MASTG for mobile requirements and testing. These guide a testable security program; this report does not certify compliance. Obtain an independent authenticated API/mobile assessment before public beta. [S9, S10]

## 8. Privacy, youth and integrations

Start with minimal collection and private defaults. Bodyweight and progress photos should be optional. Use system photo pickers, strip location metadata, validate/re-encode uploads, limit size/dimensions, and provide deletion/export. Do not request microphone or precise location until a shipped feature needs it.

Parent and coach access should be scoped by category and date, visibly listed, revocable, and enforced by the server. Viewing and editing differ. A training invitation must not automatically expose photos, weight or private symptom notes. Handle a coach leaving, a forwarded invitation, a teen turning 18, and shared phones. The user's preferred youth-sharing model remains subject to the actual legal model chosen for launch.

A 14+ label does not resolve all youth obligations. Assess COPPA boundaries, applicable teen and state consumer-health privacy rules, FTC Health Breach Notification Rule coverage, store policies, and any school/team relationships before collecting real data. Do not assume HIPAA automatically applies or that being outside HIPAA removes obligations. A breach may include unauthorized disclosure, not just hacking. This needs qualified launch-market legal review. [S11, S12]

Apple and Google disclosures must describe actual SDK/data behavior. Provide in-app account deletion and the required external deletion route where applicable. Deletion must cover photos, tokens, queues, vendor copies and backup-retention processes. A stale offline phone or restored backup must not recreate deleted data. [S7, S13]

Integrations are later work, still in scope. Verify access and vendor approval before promising Garmin, MyFitnessPal, Samsung or other connections. Store source IDs and provenance to avoid counting one run from Garmin, Strava and HealthKit three times. Handle revoked permissions, partial access, delayed updates and deletions. HealthKit intentionally hides read-permission denial, so an empty result cannot mean the person did not train. [S14]

## 9. Reliability and the user experience

The app needs a local transaction journal and a server sync protocol, not only repeated whole-profile JSON writes. Each operation needs a stable ID, original account, revision and retry key. Corrections and deletes need ordering rules. Resolve two-device conflicts without quietly overwriting newer work. Keep an export/recovery path even when normal loading fails.

An active workout should survive backgrounding, a call, low battery, process termination and a restart. A rest timer uses a persisted deadline associated with the workout. Distinguish suspending a workout, saving partial work, discarding an empty draft and deleting a finished record. Double taps must not double-save or apply a proposal twice.

Scheduling uses explicit dates and an account time zone. Test daylight saving, travel, crossing midnight, leap day and notification permission changes. Keep original scheduled date and actual performed time separate. A workout that crosses midnight needs a clear date policy; do not infer new training from the clock alone.

Use five core destinations in the upcoming mobile design: Today, Plan, Exercises, Progress and Account. Calendar and seasons live within Plan, with a direct commitment action on Today. Coaching proposals and check-ins live on Today; the history of coaching changes can remain a secondary view. Sources remain accessible beside instructions and explanations.

Prefer task labels: Start workout, Resume workout, Save partial workout, Review change, Accept change, Keep current plan, Move this workout, Shift this and later workouts, and Choose next block. Avoid a vague Continue when a click replaces a plan or removes data.

Target 48dp native controls and roughly 44-48px mobile-web controls; those are our usability targets. WCAG 2.2 AA's target-size rule has a 24px minimum with exceptions, so larger design targets are not a literal statement of that standard. Test visible focus, keyboard access, VoiceOver/TalkBack, contrast, reduced motion and 200-400% web zoom. [S15, S16]

Numeric entry needs local text drafts and explicit field errors, including comma-decimal keyboards, pasted values and unit changes. The current prototype still has some silently rejected inputs; finish this shared field system in the next design/implementation phase. A graph must also have a readable data table. Missing values must not draw a misleading zero.

## 10. Security scan findings still open

The fresh web dependency audit reports three advisories: two high and one moderate. The affected packages are source-map-js, braces and a legacy esbuild tooling path. This is not evidence of three demonstrated remote exploits. The source-map-js patch was not yet eligible under the existing seven-day release-age policy at the scan; do not disable that policy to make a score green. Recheck and update when eligible.

The native dependency audit reports 22 affected package entries: 15 high and seven moderate, with no critical entries. These propagate from three underlying advisories: braces, node-forge and uuid. Braces and node-forge had no patched release listed at this review. UUID is used by xcode tooling via v4; the reported bounds issue concerns other APIs. This narrows the observed path but does not close the advisory. The audit's suggested downgrade to old Expo/React Native versions is not an acceptable automatic fix.

Track each advisory by reachable path, mitigation, owner and upstream remedy. Keep untrusted glob patterns and certificate input out of tooling. Review signing/update trust before enabling production releases. Repeat scans when dependencies change and before beta. No claim of 'maximum' or complete cybersecurity is justified by headers or a scan alone. [S17-S19]

SDK 58 was still advertised as a beta in Expo's official announcement at this review. The starter stays on its compatible SDK 57 cohort; upgrade the whole supported dependency set when the intended Expo Go/development-build target requires it, then test native builds and devices. Do not change only the SDK number. [S20]

## 11. What remains in the complete product

| Area | Current reality | Required next work |
| --- | --- | --- |
| Accounts | Simulated web security choices; local native demo | Real login, recovery, authorization, deletion and shared identity |
| Cross-device data | Separate local stores | Reliable offline queue, sync, conflicts, backup and recovery |
| Native setup | Adult sample plans | Personal onboarding, goal/add-on selection, feedback and coaching UI |
| Plan editing | Web additions; partial scheduling | Full workout/block editor, substitutions, repeats, corrected history, next-block flow |
| Sport programs | General pathways and sport labels | Reviewed sport/position/event templates and annual seasons |
| Other disciplines | Library and selected templates | Event-specific running, sprinting, agility, jumping and calisthenics programming |
| Metrics and progress | Web charts and optional set fields | Planned metric targets, native chart parity, per-side series and custom units |
| Media | Written guides, web photos, selected links | Exact reviewed videos, rights, captions, native visuals and offline fallback |
| Personal progress | Training history | Optional bodyweight/photos with private storage and controls |
| Imports/API | Limited exercise JSON import | Full history and plan import, mapping, preview, duplicates, scoped public API |
| Integrations/teams | Not connected | Vendor access, consent/sync semantics; coach uploads, roster roles and team views |
| Operations | Private prototype | Monitoring, incident response, backup drills, rollback, accessibility and device beta |

## 12. Release gates and ownership

**Gate A - Before real accounts:** engineering implements identity, object-level authorization, protected storage, recovery, deletion and logging limits. A privacy/security reviewer validates the data inventory and launch model. Prove two accounts cannot read each other's records. Prove logout and offline queues cannot cross accounts.

**Gate B - Before automated coaching:** the training lead approves each shipped population/discipline and rule version. Every proposal explains its inputs and preserves unknown values. Test competition changes, coach mode, concerns, missed sessions, long absence and custom movement boundaries. Unsupported pathways remain clearly labeled tracking/general preparation.

**Gate C - Before public beta:** QA demonstrates the complete first-workout journey on real iPhone and Android devices and web, including offline/reopen/recovery, accessibility, notifications and denied permissions. Security performs an independent assessment; engineering resolves critical/high findings or documents a reviewed, bounded exception. Support has incident, restore and user-recovery procedures.

**Gate D - Before each integration/team launch:** verify vendor access, scopes, provenance, deduplication, revocation and deletion. Test invitations, role changes and youth-sharing boundaries. Integration absence cannot be treated as lack of activity.

Garret's role is product direction and review of the experience. I can make implementation and design decisions consistent with those goals. Production account ownership, store enrollment, legal terms, payment commitments and qualified professional sign-off still require the appropriate responsible person. They are not replaced by a checkbox or by this audit.

## 13. How we avoid losing requirements

Keep docs/product-requirements.md as the full product contract. Pair it with the 64-case acceptance matrix and this findings log. A feature moves to complete only when its behavior passes its completion test. Maintain separate labels for implemented, verified, expert-reviewed and released. Do not collapse them into one 'done' status.

Every change should identify which invariant it might affect. Add a regression test when fixing a concrete high-impact defect. Test interactions across features: a youth athlete with two teams, an overdue partial session, a new competition, a changed machine and an offline phone is more revealing than testing each setting alone.

For the next design phase, produce the full screen map and all empty, loading, error, partial, conflict and recovery states. Then build the secure vertical journey, followed by the complete editor/coaching system and reviewed sport catalog. This sequencing preserves the full ambition while giving us evidence of dependability early.

## 14. Primary source register

Sources were checked on 7 October 2026. These inform requirements; they do not endorse Training Studio. Store rules and laws need a fresh check for the actual launch date and markets.

- S1. ACSM 2026 adult resistance-training position stand and official overview: https://pubmed.ncbi.nlm.nih.gov/41843416/ ; https://acsm.org/resistance-training-guidelines-update-2026/
- S2. NSCA youth resistance training statement: https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf
- S3. IOC youth development and REDs consensus: https://bjsm.bmj.com/content/49/13/843 ; https://bjsm.bmj.com/content/57/17/1073
- S4. NFHS sports-medicine guidance index: https://www.nfhs.org/resources/sports/nfhs-sports-medicine-position-statements-and-guidelines
- S5. MLB Pitch Smart, ages 15-18: https://www.mlb.com/pitch-smart/pitching-guidelines/ages-15-18
- S6. NIST digital identity/authentication and OAuth security best practice: https://pages.nist.gov/800-63-4/sp800-63b.html ; https://www.rfc-editor.org/rfc/rfc9700.html
- S7. Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- S8. Expo SecureStore and React Native security: https://docs.expo.dev/versions/latest/sdk/securestore/ ; https://reactnative.dev/docs/security
- S9. OWASP ASVS: https://owasp.org/projects/asvs
- S10. OWASP MASVS: https://mas.owasp.org/MASVS/
- S11. FTC Health Breach Notification Rule: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0
- S12. FTC COPPA FAQs: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- S13. Google account-deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- S14. HealthKit authorization and Health Connect sync: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data ; https://developer.android.com/health-and-fitness/health-connect/sync-data
- S15. WCAG target size, errors and focus: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html ; https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html ; https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- S16. Android accessibility: https://developer.android.com/guide/topics/ui/accessibility/views/apps-views
- S17. Braces advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- S18. Node-forge advisory: https://github.com/advisories/GHSA-86w9-cpqp-85rv
- S19. UUID advisory: https://github.com/advisories/GHSA-w5hq-g745-h8pq
- S20. Expo SDK 58 beta announcement: https://expo.dev/changelog/sdk-58-beta

## 15. Required future test matrix

The attached matrix contains 64 release scenarios. It is a work contract, not a list of tests that passed in this review. The code regression suites and browser checks are reported separately in docs/revision-7.md.
