# Program names, evidence and gaps

Checked 8 October 2026 against primary pages where they could be read. The full records are in `docs/workout-evidence.json`. Sources the app cites are in `app/page.tsx` (`SOURCE_LINKS`). The discipline-to-source map is in `lib/program-evidence.ts`.

## 1. Discipline to evidence

| Discipline | Sources cited in the app | What they support | What they do not show |
|---|---|---|---|
| Powerlifting | Schoenfeld et al. 2017 (loads taken to failure); Peterson et al. 2004; Suchomel et al. 2018; Williams et al. 2017; Grgic et al. 2018; Barbell Medicine (expert) | Heavy loads and maximal strength; periodised plans beat non-periodised ones on 1RM (moderate effect, 0.43); strength development for athletes | No verified primary source for squat, bench or deadlift specificity |
| Powerbuilding | Schoenfeld et al. 2017; Williams et al. 2017; Schoenfeld et al. 2016 (frequency); Refalo et al. 2023 (failure); Barbell Medicine (expert) | Combining heavy and moderate work; volume and frequency for muscle growth | No verified trial of the combined format |
| Bodybuilding (build muscle) | Schoenfeld et al. 2017 (volume); Schoenfeld et al. 2016 (frequency); Refalo et al. 2023; rest studies; ACSM 2026 | Weekly volume and muscle growth are linked (graded dose-response); training close to failure is not clearly better than stopping short | Exact set counts for each muscle |
| Strength | Schoenfeld et al. 2017; Suchomel et al. 2018; Williams et al. 2017 | Multiple sets beat a single set; build strength before emphasising power | Individual response |
| Sport performance | Wisløff et al. 2004; Suchomel et al. 2018; Stojanović et al. 2017; Markovič 2007 | Squat strength correlates with sprint and jump performance (correlational only); plyometrics improve jump height | Position-specific prescriptions. The app does not claim them |
| Jump practice (focus) | Markovič 2007 (partly checked); Stojanović et al. 2017 | Plyometric training improves vertical jump in meta-analyses | Once-weekly jump practice (gap noted in the research) |
| Running and hybrid | NHS Couch to 5K; Schumann et al. 2022 (concurrent training review) | Staged run/walk progression; combining strength and endurance does not block hypertrophy or maximal strength on average | A run/walk trial beyond the NHS plan |
| Calisthenics and general | WHO 2020; ACSM 2026 (public summary, partly checked) | Adult guidance: moderate activity 150–300 minutes a week, plus strength work on two or more days | Calisthenics-specific trials |
| Youth | AAP 2020; NSCA youth statement; IOC consensus; NSCA long-term athletic development (partly checked) | Individualised, supervised progression; no maximal testing in the app | Youth dose-response (Lesinski 2016 was not confirmed and is excluded) |

Sources are published research or public-health guidance unless marked "expert", which means a commercial coach's program page. Expert pages describe program design; they are not trials.

## 2. Names

Program IDs did not change, and stored history is not renamed. Display names come from one table, `programDisplayNames` in `lib/program-catalog.ts`. The family pill on each plan still shows the discipline, so the name itself does not need to carry it.

| ID | Display name |
|---|---|
| PL3 | Three Lifts, Three Days |
| PL4 | Four-Day Lift Split |
| PB3 | Strength and Size Blend |
| PB4 | Upper-Lower Blend |
| BB3 | Full-Body Muscle Builder |
| BB4 | Upper-Lower Muscle Builder |
| HY4 | Lift Plus Easy Run |
| HY5 | Strength and Stride |
| PLU3 | Undulating Triad |
| PBPH4 | Power and Size Four |
| PBT4 | Tiered Strength and Size |
| ST2 | Dumbbell Starter Two |
| ST3 | Barbell Full-Body Three |
| GF2 | Everyday Strength Two |
| GFHOME2 | Home Base Two |
| CAL2 | Bodyweight Foundation Two |
| CAL3 | Bodyweight Practice Three |
| RNEASY3 | Easy Base Three |
| PL2 | Two Days, Three Lifts |
| PBSTART2 | Blend Foundation Two |
| PBSTART3 | Blend Foundation Three |
| PBDB3 | Dumbbell Blend |
| BB2 | Two-Day Muscle Base |
| BBDB3 | Dumbbell Muscle Builder |
| BBM3 | Machines and Cables Builder |
| STGYM2 | Guided Machine Start |
| STDB3 | Dumbbell Full-Body Three |
| GF3 | Everyday Strength Three |
| GFM2 | Machine Base Two |
| CALBUILD3 | Bodyweight Builder Three |
| CALBUILD2 | Bodyweight Builder Two |
| HYHOME4 | Home Strength and Walk-Run |
| HYDB4 | Dumbbells and Easy Runs |
| RNBASE4 | Easy Base Four |
| BBHOME3 | Home Muscle Base |
| BBADV4 | Advanced Upper-Lower Builder |
| PLW4 | Advanced Four-Day Lifts |
| PBW4 | Advanced Blend Four |
| ST4 | Advanced Upper-Lower Strength |
| QG2 | Short Everyday Base Two |
| QG3 | Short Everyday Base Three |
| QS2 | Short Strength Two |
| QM2 | Short Muscle Builder Two |
| QC2 | Short Bodyweight Two |
| QPB2 | Short Blend Two |
| QSP2 | Short Sport Strength Two |
| QS3 | Short Strength Three |
| QM3 | Short Muscle Builder Three |
| QPB3 | Short Blend Three |
| QC3 | Short Bodyweight Three |
| QSP3 | Short Sport Strength Three |
| QPL3 | Quick Lift Triad |
| QHY4 | Short Lift and Run Four |
| QR3 | Three Fifteen-Minute Walk-Runs |
| SP2 | Sport Strength Foundation Two |
| QHY3 | Short Lift and Run Three |
| HY3 | Lift and Walk-Run Starter |
| QR2 | Two Fifteen-Minute Walk-Runs |
| PLSTART3 | Learn the Lifts |
| GFSTAND2 | Standing Band Base Two |
| STSTAND2 | Standing Band Strength Two |
| GFNOGROUND2 | Seated Machine Base |
| GFNONE2 | Movement Start, No Equipment |
| STDBST2 | Standing Dumbbell Strength Two |
| GFDBST2 | Standing Dumbbell Base Two |
| BBDBST2 | Standing Dumbbell Muscle Two |
| PBDBST2 | Standing Dumbbell Blend Two |
| SPDBST2 | Standing Dumbbell Sport Two |
| CALDB2 | Pull and Carry Two |
| HYDB2 | Dumbbell Lift and Run Starter |
| HYHOME2 | Home Lift and Walk-Run Starter |

The names are descriptive. None of them claims an outcome. The evidence lives on the Sources tab, not in the name.

## 3. Official programs: researched, not added

`docs/official-program-facts.md` records facts from published program pages (for example the NHS Couch to 5K plan, StrongLifts 5×5, GZCLP, 5/3/1 for Beginners, Starting Strength and a basketball athletic-development plan). Status by source:

- Verified on the primary page: NHS Couch to 5K.
- Partly verified (a mirror, a free excerpt, or conflicting copies): StrongLifts 5×5 session length, GZCLP, 5/3/1 for Beginners, the basketball plan.
- Not found in a free primary source: Starting Strength.

None of these is added to the catalog yet. Adding one means storing its set and rep facts with the author's name, linking to the original, and checking the licence. Partly verified entries wait until the conflicts are resolved.

## 4. Open gaps (from the research)

- No verified primary source for squat, bench or deadlift specificity.
- No verified trial of the powerbuilding format.
- No verified source for once-weekly jump practice.
- No verified run/walk trial beyond the NHS plan.
- The youth dose-response paper (Lesinski et al. 2016) could not be confirmed and is excluded.

PubMed pages returned a bot check during the research, so some records were confirmed through Europe PMC or the publisher's DOI page, which the research notes record.

## 5. Program design audit

`scripts/check-program-design.cjs` builds every catalog program (71) with the engine for an established lifter: seven training days, 120 minutes, three weeks, Experienced, and for run bases four running days and 100 easy running minutes a week. It then checks each week against the rules below. It checks each program against its own stated goal. It does not check whether a particular user's goal suits a program; that is `lib/goal-match.ts`, which this audit does not cover.

Result at this revision: 71 programs, 0 rule failures, with the designed allowances, known gaps and exemption listed below printed by the check.

### Rules

| Rule | What it requires | Basis |
|---|---|---|
| R1 | At least 10 weighted sets a week for each major group (chest, back, quads, hamstrings, shoulders, biceps, triceps) in full-length muscle-building and powerbuilding programs of 45 minutes or more that are not brief | Volume-growth review (Schoenfeld, Ogborn and Krieger 2017). The 10-set figure is the app's target. The full paper was not readable, so the exact wording is unverified (see below) |
| R2 | Each major group is trained in at least two sessions a week | Schoenfeld, Ogborn and Krieger 2016: in volume-matched comparisons, twice a week gave more hypertrophy than once a week (checked from the abstract record) |
| R3 | Muscle-building sets with a top of more than six reps use a low of at least five and a top of at most 20 | App rule. Sets with a top of six or fewer are heavy work and are exempt from this range |
| R4 | Powerlifting gym programs include squat, bench and deadlift every week | App design rule for a competition-lift block |
| R5 | Each competition lift has at least one heavy set (top of six or fewer reps) a week | App design rule; the exempt learning block is listed below |
| R6 | Heavy sets rest at least 120 seconds; every rest is between 60 and 300 seconds | Schoenfeld et al. 2016 (8 weeks, 21 men): three-minute rests gave greater squat and bench gains than one-minute rests. Two minutes is the app's minimum for heavy sets and was not tested on its own |
| R7 | Walk-run and beginner run sessions have a rest day between them (NHS Couch to 5K). An easy-only run base may pair days, up to runs minus three in a calendar week; four runs in seven days always contain at least one such pair | NHS Couch to 5K; the week arithmetic is exact |
| R8 | Hybrid programs of three or more days keep running and lifting in separate sessions. A two-day combined session ends with a run of 20 minutes or less | App rule, from the concurrent-training review (Schumann et al. 2022) |
| R9 | Youth programs have no near-maximal sets (top of fewer than six reps) | AAP 2020; NSCA youth statement; IOC consensus |
| R10 | Brief muscle-building or powerbuilding programs say that they carry less work | App rule for honest descriptions |
| R11 | The computed session length is no more than five minutes over the stated length | App rule |

### Weighting

A set counts 1 toward a primary muscle and 0.5 toward a secondary one. This is an app convention for indirect work. It is not a figure from a named trial. Exercises without muscle data in the app are mapped in the script's `NAMED` table from the exercise name and standard anatomy. Library exercises use their first-listed muscle as primary.

### Allowances and exemptions (printed by the check)

- **BBHOME3, biceps.** The exercise library has no curl that needs only bodyweight or bands, so biceps get indirect pulling work (about five weighted sets a week). The description tells the user to add a dumbbell or band curl.
- **RNBASE4, R7.** The easy-only base may pair back-to-back easy days, at most one pair a week.
- **PLSTART3, R5.** A learning block: one competition lift a day, started light while the setup is learned. Heavy work belongs in the build blocks.

### Known gaps (printed, not hidden)

Two sessions a week cannot give each major group 10 weighted sets at this session length. These programs are BB2, BBDBST2, PBDBST2 and PBSTART2. Their descriptions now say that each muscle group gets less weekly work than in a three- or four-day plan.

### What the audit does not check

- Deload weeks, and the first-time reduction to two sets in weeks one and two. The audit uses the Experienced profile.
- Whether a user can recover from or complete a plan, or what their progress will be. Outcomes are not measured here.
- Exercise technique, equipment set-up in a specific gym, and session time on a real phone.
- Whether any program produces the outcome its goal names. No trial of the Movefield programs has been run.

### Sources only partly verified

- **Schoenfeld, Ogborn and Krieger 2017.** The app's 10-set target is often quoted from this review. The record in `docs/workout-evidence.json` was verified through a Europe PMC record with the abstract wording "graded dose-response". The "at least 10 weekly sets" wording comes from a secondary summary and is not confirmed in the full paper. The DOI page returned 403.
- **ACSM 2026**, **NSCA youth** and **IOC** material: public summaries, partly checked.
- **Barbell Medicine** and **PB-EXPERT**: commercial coaching pages. They describe program design, not trials. The PB-EXPERT hybrid claim is unconfirmed.
