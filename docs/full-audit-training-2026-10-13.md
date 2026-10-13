# Training catalog audit · 13 October 2026

This pass checks runnable prescriptions, selection, equipment, timing, progression prerequisites, actual native workout actions, persistence, and the optimized production module graph. It does not establish that each exact app recipe is clinically validated or universally optimal. The separate evidence review records source depth and limitations.

## Fixed findings

1. **Production plan-selection crash.** The real bodybuilding wizard could blank the web app when `buildSourcePlan` read `uid` from an undefined captured namespace. CommonJS domain tests passed because their circular-module behavior differs from the production bundle. `scripts/check-production-training.mjs` reproduced the exact error in both optimized and minified Vite bundles before the runtime agent replaced eager aliases with direct live namespace imports. Both bundle modes now pass the actual Jordan sample wizard, 145 original definitions, and all eight public source versions across seven starting weekdays: 201 build/accept/reopen checks per mode.
2. **Missing running-stage feedback guards.** NHS and older hybrid walk–run introductions could advance to longer running after harder or missing feedback. The old guard covered only the newer explicitly named two-week stages. The shared engine now checks increased total running, longer continuous bouts, or reduced recovery within staged introductions. NHS week 5 run 3 is specifically tested because its overall workout becomes shorter while its continuous run gets longer. Fixed varied short/long base-running layouts remain unchanged.
3. **Untracked longer-bout prerequisite.** `RNLONGBOUT2` previously described requiring comfort with shorter walk–runs but had no corresponding readiness input. Newly generated plans now open with three one-minute jogging bouts, retaining two-minute walking breaks. Four two-week stages can reach two-, three-, and four-minute bouts after comfortable completed work. The exact stages are disclosed as app-authored choices. Existing accepted sessions and historical prescriptions are not rewritten.
4. **Strength instructions in run-only plans.** Catalog running phases previously said to find starting weights and reduce strength sets. Run-only plans now describe timed running/walking, effort, stage repetition, and next-block review. The NHS source notes distinguish the original durations from app review gates.

The evidence agent separately clarified that regional set totals are not equal muscle stimulus and added high-workload context to Reddit PPL without altering credited source prescriptions.

## Catalog coverage

There are 145 original definitions, eight credited public strength versions, and one NHS sequence. The structure comparison removes names, repeated identical sessions/frequencies, and extra easy walks before counting distinct prescriptions.

| Goal | Original definitions | Distinct generated structures |
| --- | ---: | ---: |
| Bodybuilding | 22 | 19 |
| Powerbuilding | 19 | 16 |
| Powerlifting | 13 | 12 |
| Strength | 18 | 13 |
| General fitness | 19 | 14 |
| Calisthenics | 15 | 10 |
| Hybrid | 11 | 10 |
| Running | 13 | 11 |
| Sport preparation | 15 | 11 |

These are total catalog choices, not a promise of ten fitting choices for every equipment, experience, time, and weekday combination. Unavailable combinations retain an explanation rather than silently replacing defining lifts or dropping prescribed work. Sport preparation remains broad strength/landing preparation; this catalog does not contain complete individualized sprint, agility, position-specific, elite peaking, or rehabilitation programs. Reference-only creator entries remain user-entered tracking, not fully preloaded routines.

## Verification

| Executed check | Result |
| --- | --- |
| `node scripts/check-training-audit.cjs --baseline` | Four intended failing regression groups against source `00559e3`; fixed-layout control passes |
| `node scripts/check-training-audit.cjs` | Six groups pass; all 154 plans traverse complete accepted blocks, 4,899 workouts, 31,550 logged sets, 1,387 persistence round trips |
| `node scripts/check-production-training.mjs` | Both optimized and minified Vite bundles pass; 201 plan builds/accepts/reopens each, including 56 public-source starts |
| `node scripts/check-program-depth.cjs` | 145 variants, 6,881 scenarios, 5,458,044 assertions |
| `node scripts/check-fitness-fit.cjs` | 7,776 preference/inventory/time/frequency/no-floor scenarios; 7,502 fitting plans; 1,513,405 assertions |
| `node scripts/check-researched-families.cjs` | All goal minima preserved; 420 fitting scenarios, 139 successful constrained fits |
| `node scripts/check-training.cjs` | 28 progression, history, date, and proposal regressions |
| `node scripts/check-source-programs.cjs` | 20 public-source progression/schema/attribution groups |
| `node scripts/check-reusable-equipment.cjs` | 10 saved-block equipment/history guards |
| `node scripts/check-evidence-duration.cjs` | Duration/budget, unilateral accounting, evidence-map integrity, five calendar time zones |
| `node scripts/check-library.cjs` | Six groups; 995 exercise guides/logging conventions and 1,726 local source photos |

The full-block test executes the actual native `startWorkout` and `finishWorkout` functions and shared set-edit/log actions against canonical modules, using a synthetic clock and synthetic fully completed records. It is stronger than checking that a plan object exists, but it is not a rendered button test, physical-phone run, performance study, or exercise-efficacy trial. The production regression exists specifically because the earlier transpilation-only tests missed a genuine bundling crash.

## Remaining limits

- Running records store total time and feedback, not confirmed completion of each individual run interval. An entirely walked session can have the same logged duration. Instructions now explicitly say to repeat a stage after walking through prescribed jogging bouts. Actual interval-adherence tracking remains a separate improvement; the new guard does not claim to verify it.
- Full-block synthetic success covers orderly completion. Targeted tests separately cover partial work, unknown loads, missing feedback, source-stage misses, stale changes, equipment changes, holds, and interruptions. They do not exhaust every possible combination of manual edits and historical migrations.
- Unknown loads remain unknown until reviewed. Per-set RIR, creator source/stage context, accepted prescriptions, equipment conventions, detailed inventory guards, and historical records remain intact.
- Numerical programming choices and conservative recovery buffers remain disclosed product policies where evidence does not establish exact individual thresholds. More volume or more variants does not establish a better program.
- Parent integration owns final web/native parity, rendered browser workflows, release builds, publication, and physical-device limitations. This report does not substitute for those checks.

Machine-readable before/after receipts are in `docs/full-audit-training-2026-10-13.json`. Current per-plan source/principle records are in `docs/science/program-review-2026-10-13.json`.
