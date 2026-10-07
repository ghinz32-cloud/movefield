# Training Studio — full product requirements

This is the continuing product contract from Garret's requests, not a reduced MVP definition. Completing the library or the Expo starter does not complete the whole product. Status describes implemented behavior, not the presence of a screen. Updated 7 October 2026. Revision 11 status is recorded below. Revision 7 adds a deep audit and 64 future acceptance scenarios; see deep-audit-2026-10-07.md and audit-acceptance-matrix.json.

## Decisions that stay in force

- One product across iPhone, Android and a website with equivalent core functions and the same account/history.
- Support ages 14+; youth sports are a first-class path, with appropriate supervision and age-specific rules. Do not prescribe merely from chronological age or sex alone. Collect relevant training history, equipment, preferences and goals, and use evidence for any age/sex-specific rule.
- App-directed training is the default. Athletes following a coach use the coach's plan for tracking; the app does not add competing workloads. Off-season athletes may switch to app-directed plans through an explicit transition.
- Accepting a plan accepts its scheduled progression. Feedback-driven changes are proposals with a visible before/after and accept/decline. Every training-day move requires approval. Optional automation preferences must have explicit, bounded scope.
- Ask dates, desired duration, available days and hours, equipment, experience, priorities and competitions. Rank competition importance. Respect recovery, practice, travel, vacations, seasons and multiple events in one week.
- Keep core lifts stable within a block when appropriate to the discipline. Offer a variety preference and deliberate swaps. A swap gets its own history, equipment context and progression rules.
- Use brief optional check-ins, with a longer version available. Track exercise enjoyment, session effort, RPE/RIR, soreness and concerns. Never claim that minutes of sport drills assess skill or that the app has seen technique.
- Offer the next block, maintenance or new goals at block end, carrying history forward. After a long absence, review a gradual return. Conflicting goals can require a longer timeline or more training time; do not promise all goals in an impossible schedule.
- Parents see only what the young user shares, subject to the actual legal consent model for launch markets. Viewing and editing are separate permissions. Team/coaching dashboards are later scope, not canceled.
- Workout terms stay intact. Explain them in plain language. Guides describe equipment setup and movement without motivational coaching filler.

- Initial setup supports optional smaller focuses alongside the primary discipline. Selection changes actual plan work only when time, age, equipment and recovery rules permit it. Main competition lifts retain their role; supersets are a grouping choice and do not promise fat loss.

## Coverage and remaining implementation

| ID | Requirement | Current state | Completion test |
|---|---|---|---|
| LIB-01 | Search an expansive exercise library by name, muscles/movement and equipment | Web implementation; native starter search/filter | All shipped entries resolve to a guide; clear empty results; large-text and screen-reader checks |
| LIB-02 | Separate barbell, dumbbell, kettlebell, cable, plate-loaded and selectorized variations | Catalog and filters; exact source distinctions | Distinct IDs and logging rules; unknown machine model never silently maps to a different drive type |
| LIB-03 | Detailed self-setup, movement, exit, breathing, cues, mistakes and load convention | Expanded guide content | Every shipped entry has each required section, provenance and specific movement details |
| LIB-04 | Accurate visual examples for each movement | Source photos and selected demo links; universal video coverage is unfinished | Exact-variation video manifest, rights/permission records, human matching review, captions and broken-link fallback |
| LIB-05 | Custom movements with every useful tracking metric | Local custom entries; optional web set metrics added | User-defined fields/units, consistent conversions, imported/exported values, history and chart support without invented values |
| PLAN-01 | Beginner through experienced training | Local engine templates and preview | Calibration from history or light familiarization; no assumed personal starting weight; decline unsupported input clearly |
| PLAN-02 | True powerlifting, bodybuilding, powerbuilding and hybrid options | 63 app-original catalog variants in ten goal families plus existing foundation paths | Independent program/content review, distinct goals/volume/progression, no forced running in powerlifting |
| PLAN-03 | Running: sprint, speed, distance and race plans | Beginner run/walk and hybrid base only | Separate event-specific progressions, timing/distance surfaces, race dates and return rules |
| PLAN-04 | Calisthenics, jumping, agility and other disciplines | Library/tracking and limited templates | Discipline-specific prerequisites, dose, progression and regressions, including skill limits |
| PLAN-05 | All common American high-school sports, in detail | Sport selection exists; detailed position programs are not complete | Reviewed catalog for football/flag football, basketball, baseball/softball, soccer, volleyball, track and field, cross-country, swimming/diving, wrestling, lacrosse, field/ice hockey, tennis, golf, cheer/dance, gymnastics and bowling; audit state/regional gaps |
| PLAN-06 | Sport positions and events | Position input; detailed planning remains to build | Requirements and reviewed templates per position/event, practice load and competition calendar |
| PLAN-07 | Skills instruction | Tracking and guides; no skill assessment | Named drills, clear duration/reps, exact visual examples and sport-specific evidence; never infer skill from minutes |
| PLAN-08 | Custom plans and reusable saved workouts | Add-to-plan works locally; saved setup choices are not a full plan editor | Create, reorder, remove, replace, duplicate and save entire workouts/blocks; preserve history and versioned progression |
| PLAN-09 | Add exercises to progression | Local controlled-resistance additions; native tracking-session target editor | Time/volume review, setup/rep context, smallest available increment, no generic rep progression for jumps or Olympic lifts |
| PLAN-10 | Multiple ranked goals and smaller training styles | Primary goal plus optional core, jumping, assistance supersets and activity modules in web setup | Goal conflicts and tradeoffs shown; longer duration/time proposals are optional |
| PLAN-11 | Variation preference and stable main lifts | Manual additions and curated equipment substitutions | Per-discipline variety settings; explain changes; avoid novelty replacing main competition lifts |
| PLAN-12 | Next block, maintenance and changed goals | Manual new-plan flow; automated continuation incomplete | Carry comparable history, preview next phases, replace only future schedule after acceptance |
| CAL-01 | Daily/weekly schedule, commitments, None, vacations and days off | Local web implementation | No accidental clearing, duplicate events, overlapping range errors or silent workout moves |
| CAL-02 | Move workout into an occupied day | Approved cascade implemented locally | Atomic shift, preserve recovery gaps, show all affected dates and block extension, stop on conflicts |
| CAL-03 | Annual seasons auto-start/stop | Season selection only | Versioned annual schedule with offseason/preseason/in-season/postseason dates; pause/resume and user-approved transitions |
| CAL-04 | Competition priority and multiple games/week | Event priority captured; specialized tapering incomplete | Reviewed sport-specific game-week rules, practice load and importance-aware reductions; never guarantee zero soreness |
| CAL-05 | Travel, time zones and daylight saving | Date-only scheduling and DST checks | Account time zone, travel policy, notification times and cross-device date tests |
| COACH-01 | Feedback adaptation with approval | Local proposals for selected cases | Before/after, accept/decline, stale-version protection, no duplicate apply, explicit reason and evidence/rule version |
| COACH-02 | RPE/RIR, soreness, exercise rating and quick check-in | Local RIR/session check-in/ratings; soreness reminders are preference previews | Delayed soreness capture, RPE and RIR definitions, optional detailed check-in, confidence/uncertainty handling |
| COACH-03 | Missed work and return after absence | Local skip/restore and conservative return proposal | Multi-week absence, illness/injury review, partial training elsewhere, no automatic catch-up pileup |
| COACH-04 | Coach-directed youth/athlete mode | Local tracking distinction | Lock coaching authority boundaries, imported coach plans, off-season switch and no conflicting added dose |
| COACH-05 | Evidence-based recommendations | Sources and app-default disclosure | Versioned evidence ledger, qualified review by discipline, conflicting evidence, expiry and documented updates |
| LOG-01 | Sets, reps, load, rest and individual history | Local web and native starter | Partial sets persist, interrupted sessions recover, actuals differ from targets, no duplicate completion |
| LOG-02 | All tracking metrics | Web optional set details: distance/time/height/heart rate/cadence/power/speed/incline/level/assistance/tempo/side/notes | Planned targets, custom units, per-side asymmetry and charts across disciplines; native controls to match web |
| LOG-03 | Suggested loads and rep ranges | Local bounded adult resistance rules | Exact variation, same machine/setup/range, two comparable exposures, feedback and available increments; no youth autonomous maxima |
| LOG-04 | Import or enter historical performance | Exercise JSON import only; full workout-history import unfinished | Validated preview, date/unit/exercise mapping, duplicates, rollback, RPE/RIR and provenance |
| PROG-01 | Exercise chart, volume per session, estimated 1RM | Local web implementation | Valid comparison units; distinguish unknown from zero, assistance and one-sided records; exclude unsupported estimates |
| PROG-02 | Caliber-like performance score | Personal baseline index, not a validated population rank | Define and validate a scoring model before age/sex ranking claims; explain uncertainty and eligibility |
| PROG-03 | Body weight and photo progress | Not implemented | Private measurements/photos, camera permission denial/revocation, export/delete, storage limits and youth safeguards |
| AUTH-01 | Secure shared accounts | No live app-owned accounts | Managed identity, per-user server authorization, verified sessions, account linking and recovery |
| AUTH-02 | Google login, biometrics, optional 2FA | Web previews only | Real OAuth/PKCE; server-verified passkeys; local Face ID/fingerprint unlock distinguished; TOTP/recovery codes; lost-device flow |
| AUTH-03 | Parent sharing | Not implemented | Explicit categories/date ranges, revocation, view vs edit, consent rules and audit; no default access |
| DATA-01 | Web/mobile sync and offline recovery | Separate local prototypes | Local queue, unique operation IDs, version conflict review, encryption and two-device testing; no false 'synced' status |
| DATA-02 | Export, backup and deletion | Local JSON export; unreadable-file recovery | Account export/deletion, retention, backup restore, deletion of photos and sessions, local/cloud separation |
| DATA-03 | Public API and AI plan import | No public API; limited exercise JSON | Scoped/revocable tokens, plan schema, preview and validation, rate limits, no instruction text treated as authority |
| INT-01 | Apple, Google, Samsung and other device data | Not connected | Evaluate current HealthKit/Health Connect/vendor capabilities, permission scopes, provenance, duplicates and revoked access |
| INT-02 | MyFitnessPal, Strava, Garmin Connect and peers | Not connected | Vendor approval/API access, minimal scopes, signed callbacks, retries and missing-data handling; no promised access before verification |
| TEAM-01 | Coach uploads by athlete/position and team view | Later feature, still required | Rosters, roles, consent, invitations, athlete exceptions, versioned assignment and restricted visibility |
| UI-01 | Equivalent, easy web/iOS/Android experience | Web plus native personal-setup/logging starter | Screen-reader, large text, small screens, keyboard/back, app kill/reopen, denied permissions and slow networks |
| SEC-01 | Strong ongoing cybersecurity | Prototype hardening and audit; real-account security remains | Server authorization tests, secrets handling, dependency upkeep, monitoring, independent penetration test and incident/restore plan |

## Build order, without removing scope

1. Complete the catalog and its logging semantics; resolve source conflicts. Prototype catalog corrections can be made directly because there are no real user records.
2. Run the native starter on Garret's phone. Establish the permanent account/data service and one real sign-in → workout → offline save → history → web-sync flow.
3. Complete the custom plan editor, full history/plan import, metric targets/charts and production feedback workflow.
4. Build the reviewed sport/position, sprint/jump/agility and annual-season program catalog, with competition-aware planning and qualified discipline review.
5. Add body measurements/photos, sharing and release-grade security/privacy/accessibility; beta on real iPhone and Android devices.
6. Add vendor integrations and team/coaching tools as approved access and consent workflows are ready.

The order is sequencing, not a change to the requested final product. Each item moves to complete only when its completion test works; a mocked switch or placeholder does not count.

## Program-selection update (revision 8)

See revision-8.md for the discipline-matched catalog, author-source program references, curated substitutions, and verification. Exact named-program automation remains distinct from the implemented source-reference/tracking cards. Keep this distinction visible in future designs and imports.


## Revision 10 continuation checkpoint

The recovered source and saved specifications remain the product contract. A complete verbatim transcript of the originating chat was unavailable; no claim of reviewing every raw message is made. Latest explicit direction allows research and prototype implementation without external expert input. Existing references to future independent assessment do not block this prototype iteration.

The current catalog has 63 variants within ten goal families, not 63 independently validated methods. Setup handles a maximum of 15–120 minutes, relevant training readiness and equipment limits. The web and mobile clients share planning/validation rules. Native personal setup now includes secondary focuses, sport/position context, coach/manual mode and full-block preview. Coach/manual session targets can be created, edited, reordered and removed on native before training. Native equipment settings include exact machine setup, available load increments, per-hand dumbbell limits and explicitly approved load/range proposals. Rest timers, interruptions and optional feedback work locally.

Accounts, cloud sync, commitment entry on native, a complete reusable multiweek editor, event-specific endurance/sport plans, annual seasons, integrations, private photos, real-device validation and signed app distributions remain open. Do not mark those complete because a prototype control or source file exists. See revision-10-continuation.md for this turn's exact verification and fixes.


## Revision 11 UX and coverage checkpoint

The catalog now has 71 variants. Standing dumbbell and two-day combined strength/walk-jog coverage is broader; a separate adult selection matrix still has 268 unmatched setups out of 1,701. Do not label every unmatched setup unsafe or claim universal coverage. Coach/manual workout targets can be explicitly copied onto upcoming same-weekday sessions. A complete multiweek editor, prescribed load/range editing, event/season plans and shorter combined workouts remain open.

Native setup drafts resume after reopening. Saved set and Undo are separate actions, custom timed actuals use their own metric, web machine context is available in the active workout, and check-in drafts survive refresh. Rest starts after Log set, not while entering numbers. The native app schedules local sound notifications after permission; browser and physical-phone delivery guarantees remain unverified. “Dose” is not user-facing vocabulary.

Reviewed return-to-training changes now repair the remaining dependency chain while preserving dates and history. Coarse load increments can offer explicitly reviewed rep increases for eligible muscle-focused work. Real accounts, sync and native device acceptance are the next implementation stage; a model remains a subsequent optional explanation experiment. See revision-11-ux-audit.md, revision-11-validation.json and revision-11-coverage.json for exact scope and evidence.
