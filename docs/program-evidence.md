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
| Youth | AAP 2020; NSCA youth statement; NSCA long-term athletic development (partly checked); IOC consensus (background only) | Individualised, supervised progression; no maximal testing in the app. The IOC consensus is not cited for maximal lifts, testing or supervision | Youth dose-response (Lesinski 2016 was not confirmed and is excluded) |

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
| R1 | At least 10 weighted sets a week for each major group (chest, back, quads, hamstrings, shoulders, biceps, triceps) in full-length muscle-building and powerbuilding programs of 45 minutes or more that are not brief | An app design target, not a published threshold. Schoenfeld, Ogborn and Krieger 2017 reports a graded dose-response between weekly volume and muscle growth. The 10-set figure is often quoted from it, but comes from a trend the authors called non-significant (P = 0.074), so the app labels 10 as its own planning choice (see below) |
| R2 | Each major group is trained in at least two sessions a week | Schoenfeld, Ogborn and Krieger 2016: in volume-matched comparisons, twice a week gave more hypertrophy than once a week (checked from the abstract record) |
| R3 | Muscle-building sets with a top of more than six reps use a low of at least five and a top of at most 20 | App rule. Sets with a top of six or fewer are heavy work and are exempt from this range |
| R4 | Powerlifting gym programs include squat, bench and deadlift every week | App design rule for a competition-lift block |
| R5 | Each competition lift has at least one heavy set (top of six or fewer reps) a week | App design rule; the exempt learning block is listed below |
| R6 | Heavy sets rest at least 120 seconds; every rest is between 60 and 300 seconds | Schoenfeld et al. 2016 (8 weeks, 21 men): three-minute rests gave greater squat and bench gains than one-minute rests. Two minutes is the app's minimum for heavy sets and was not tested on its own |
| R7 | Walk-run and beginner run sessions have a rest day between them (NHS Couch to 5K). An easy-only run base may pair days, up to runs minus three in a calendar week; four runs in seven days always contain at least one such pair | NHS Couch to 5K; the week arithmetic is exact |
| R8 | Hybrid programs of three or more days keep running and lifting in separate sessions. A two-day combined session ends with a run of 20 minutes or less | App rule, from the concurrent-training review (Schumann et al. 2022) |
| R9 | Youth programs have no near-maximal sets (top of fewer than six reps) | AAP 2020; NSCA youth statement. The IOC consensus is not cited for this rule, because it does not address maximal lifts, testing or supervision |
| R10 | Brief muscle-building or powerbuilding programs say that they carry less work | App rule for honest descriptions |
| R11 | The computed session length is no more than five minutes over the stated length | App rule |

### Weighting

A set counts 1 toward a primary muscle and 0.5 toward a secondary one. This is an app convention for indirect work. It is not a figure from a named trial. Exercises without muscle data in the app are mapped in the script's `NAMED` table from the exercise name and standard anatomy. Library exercises use their first-listed muscle as primary.

### Allowances and exemptions (printed by the check)

- **BBHOME3, biceps.** The exercise library has no curl that needs only bodyweight or bands, so biceps get indirect pulling work (about five weighted sets a week). The description tells the user to add a dumbbell or band curl.
- **RNBASE4, R7.** The easy-only base may pair back-to-back easy days, at most one pair a week.
- **PLSTART3, R5.** A learning block: one competition lift a day, started light while the setup is learned. Heavy work belongs in the build blocks.

### Known gaps (printed, not hidden)

Two sessions a week cannot reach the app's 10-set target for each major group at this session length. These programs are BB2, BBDBST2, PBDBST2 and PBSTART2. Their descriptions now say that each muscle group gets less weekly work than in a three- or four-day plan.

### What the audit does not check

- Deload weeks, and the first-time reduction to two sets in weeks one and two. The audit uses the Experienced profile.
- Whether a user can recover from or complete a plan, or what their progress will be. Outcomes are not measured here.
- Exercise technique, equipment set-up in a specific gym, and session time on a real phone.
- Whether any program produces the outcome its goal names. No trial of the Movefield programs has been run.

### Sources only partly verified

- **Schoenfeld, Ogborn and Krieger 2017 (volume).** The full text was not readable; the DOI page returned 403. The "graded dose-response" wording comes from an abstract record. The 10-set figure is attributed in secondary summaries to a non-significant trend (P = 0.074), which the authors' sensitivity analysis did not keep. The app therefore treats 10 as its own planning target.
- **Plotkin et al. 2022 (PeerJ 14142, repetition versus load progression).** The DOI page returned 403 and PubMed rate-limited further requests. The title ("Progressive overload without progressing load?") and the claim that repetition progression is one route were checked from a search summary. Study length and results were not read, so the app's summary avoids quoting them.
- **Iversen et al. 2021 (time-efficient training).** A narrative review, identified from search results; the publisher page was rate-limited. It reviews the literature and is not a trial of the 15-minute plans.
- **Schoenfeld, Grgic, Ogborn and Krieger 2017 (low versus high load).** The abstract page returned 402 (paywall). The 60% 1RM figure was removed from the app's summary because it was not confirmed. Lopez et al. 2021 supports the direction of the load claim; it is not yet in the app's Sources list and needs its own check before it is added.
- **NSCA long-term athletic development (Lloyd et al. 2016).** Read through a paywall stub. "Viewed as athletes" and "fitness behaviours they can keep later in life" were found on the page. "Treated as athletes" and "lifelong habits" were not, so the summary uses only the wording found.
- **ACSM 2026**, **NSCA youth 2009** and **IOC** material: public summaries, partly checked. The IOC consensus is kept as background only; the app does not cite it for maximal lifts, testing or supervision.
- **Barbell Medicine** and **PB-EXPERT**: commercial coaching pages. They describe program design, not trials. The PB-EXPERT hybrid claim is unconfirmed.

## 6. Corrections made 8 October 2026

U04b updates current-plan support to the 2019 volume-equated hypertrophy-frequency review and Pelland's 2026 volume/frequency meta-regressions. ACSM 2009 and the 2016 frequency review remain historical Sources entries and are no longer attached to current plans. See `docs/evidence-mapping-repair-2026-10-08.md` for checked primary sources, applicability, limits and tests. The exact app dose and progression rules remain product choices.

These changed the words users see on the Sources page and the source mapping. Catalog IDs, display names, stored workout titles and history keys did not change.

- **TIME-EFFICIENT** is now named as a narrative review. It is cited for brief strength and muscle-building sessions (the QPL3 and brief-series programs), not for run or walk-run starts.
- **Run and hybrid starts** (QR3, QR2, QHY4, QHY3) now cite the NHS Couch to 5K plan (running) or the concurrent-training review (hybrid). QR2 and QHY3 inherit this because they are built from QR3 and QHY4.
- **GFNONE2**, a youth-suitable no-equipment start, cites WHO 2020 instead of TIME-EFFICIENT.
- **IOC-YOUTH** is no longer mapped to youth plans or to rule R9. Its entry remains as background with a narrower summary.
- **REP-PROGRESSION** links the PeerJ DOI. The summary no longer says "eight-week".
- **SCHOENFELD-2017-LOAD** no longer gives a 60% 1RM threshold.
- **LLOYD-2016-LTAD** uses only the wording found on the NSCA page.
- **R1** is described as an app target, not a published threshold.
- `docs/workout-evidence.json` is the research record as it stood on 8 October. It is not rewritten, so it still lists TIME-EFFICIENT and IOC-YOUTH as reused keys. This document supersedes it where they differ.

Still open: the program design items (chest work once a week in ST2 and GF2, which needs a second press or a stated gap), the Schumann same-session note for HYDB2 and HYHOME2, the Lopez 2021 citation for load claims, and the 1×8 starting-week label for new plans. These are program or engine changes and are tracked separately.
