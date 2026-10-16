# Claude routine integration and detailed audit · 16 October 2026

## Result and provenance

Reviewed Claude's `ea9e4d5e450957d6304ef2fdba967660e8579ec9` on `origin/routine-library` against the current application engine. Its unrelated older branch history was not merged. Its header claims 180 combinations; execution actually produced **125 offered variants from 30 families**. This integration retains **68 viable IDs from 18 families** and withholds **57** with explicit reasons. The existing **145** app-authored/researched definitions remain first in the catalog, for **213 total** definitions. Existing creator programs, stored histories, accepted plan IDs, and default selection order are preserved.

The additions are 18 powerlifting, 7 hypertrophy, 16 hybrid, 4 general strength for endurance athletes, and 23 general-fitness options. None of the originally offered powerbuilding variants passes both the current complete-duration and recovery-group rules; existing powerbuilding programs remain available. The submitted branch had already omitted most longer powerbuilding variants using its own arbitrary volume threshold. This review does not resurrect unoffered variants or certify that threshold.

The machine-readable companion `routine-library-qualification-2026-10-16.json` records every one of the 125 IDs, acceptance or withholding, actual maximum duration, primary/secondary weekly work, disclosed limitations, and input SHA256 values. Individual results are evidence about the implemented prescription and checks, not clinical validation or a trial of an exact routine.

## Concrete findings and fixes

1. **The branch's copied estimator understated real scheduling time.** It used 4 seconds per repetition, 13 minutes of preparation and a hand-maintained list of unilateral/barbell exercises. The current engine uses 5 seconds at the high end, 16.25 minutes of preparation, exercise-specific side accounting, current transitions and barbell preparation. The new generator calls the actual `estimateSessionMinutes`, then checks complete `buildPlan` outputs against `estimateDuration`. It does not ship another estimator.
2. **Time availability increased volume automatically.** The proposal greedily filled longer windows with up to five main sets and four accessory sets. A two-set “minimum effective dose” therefore lost its advertised dose. The integration never adds sets beyond each reviewed family reference; shorter variants can reduce set counts while retaining every listed movement, main-lift minimums, rep ranges and rest. The label is now “Low-Volume Lift Practice,” with no minimum-effectiveness claim. A runtime `fixedDose` flag also prevents the existing generic brief-plan expansion from silently changing a selected new variant when availability increases. Existing programs retain their previous behavior.
3. **Recovery groups were invalid or concealed actual overlap.** `legs`, `chestback` and `shouldersarms` are not supported program-slot categories. The review maps actual exercise roles to current lower/upper/full categories and recognizes mixed push/pull and deadlift/back sessions. Seven variants cannot meet the existing separation rules even with all seven days available. Those variants are withheld; the rules are not weakened to make tests pass.
4. **Empty run slots bypassed the copied duration check.** The complete current walk/run sequence needs at least 33 minutes including its scheduling allowance. The proposed 30-minute hybrid and general run/walk variants therefore cannot fit. The new qualification checks actual timed steps across all eight weeks.
5. **Generic run/walk was mislabeled as NHS Couch to 5K.** The affected general-fitness family now clearly describes the app-authored two-week stages. It cites general activity guidance instead of claiming the NHS sequence. The actual NHS source pathway is preserved separately.
6. **The walking prescription could grow from one 25-minute item to multiple sets.** The revised full-body-and-walk family uses the existing fixed, comfortable recovery-walk behavior, up to 20 minutes, with matching text. It cannot accidentally become repeated 25-minute work sets.
7. **Equipment/movement semantics were incomplete.** The band-row placeholder now uses canonical `lib-band-standing-row`. The parallel exercise audit supplies explicit current roles, equipment capabilities and primary/secondary accounting for eight already guide-backed exercises. New plans retain those actual exercise IDs and require real equipment availability; machine settings and loads keep separate histories. The dumbbell upper/lower family now discloses its listed incline-bench requirement. The short band family includes a band hinge rather than treating glute-bridge secondary hamstring work as full primary coverage.
8. **Source IDs came from an older app and exact claims were unsupported.** Current plans use the canonical evidence registry, with explicit limits: references support training principles, not these exact routines. The branch's universal ten-set/twice-weekly pass rules are not treated as scientific certification. Actual primary and secondary work remains visible through the existing science view. A higher-repetition family no longer promises measured low load or forces failure against the engine's displayed effort instructions.
9. **Unqualified sprint/jump templates bypassed current safety semantics.** Twenty-six proposed variants include generic sprint/change-of-direction or jump work without the current readiness, fixed-dose, task-specific progression, and total sport schedule policies. They remain audit inputs, not selectable generated plans. Existing guarded sport and landing-practice pathways remain available.

10. **Native sample previews guessed a five-day calendar.** The canonical planner accepted `LIB-PL5-45`, but the actual native preview button supplied one hardcoded five-day arrangement that could not separate its mixed lift sessions. New fixed-dose samples now give the real scheduler seven available weekdays while explicitly requesting the definition's training-day count. This creates the appropriate five workouts without extra sessions and preserves existing preview behavior for prior definitions. The web sample uses its existing experienced-demo fixture and normal onboarding planner; it has no equivalent hardcoded preview path.

## Withheld variants

- **24** fail the current full-duration requirement while retaining the defining work and listed movements.
- **7** cannot meet the current recovery-group scheduling rules.
- **26** require separate sprint/jump/readiness/progression design before generated-plan use.

The original IDs that were not offered are not reused for a different routine. Choosing an unavailable ID fails explicitly; the app does not silently substitute another goal or an empty calendar.

| Family | Included session-window IDs (minutes) | Withheld session-window IDs (minutes) |
| --- | --- | --- |
| PL1 | 60, 90, 120 | 30, 45 |
| PL2 | 45, 60, 90, 120 | 30 |
| PL3 | 45, 60, 90, 120 | 30 |
| PL4 | 60, 90, 120 | 45 |
| PL5 | 45, 60, 90, 120 | 30 |
| HY1 | 90, 120 | 30 |
| HY2 | 90, 120 | 30 |
| HY3 | 60, 90, 120 | 30 |
| HY4 | None | 30, 60, 90, 120 |
| HY5 | None | 30 |
| PB1 | None | 30 |
| PB2 | None | 30 |
| PB3 | None | 30, 90, 120 |
| PB4 | None | 30, 90, 120 |
| PB5 | None | 30 |
| HB1 | 45, 60, 90, 120 | 30 |
| HB2 | 45, 60, 90, 120 | 30 |
| HB3 | 45, 60, 90, 120 | 30 |
| HB4 | 45, 60, 90, 120 | 30 |
| HB5 | None | 30, 45, 60, 90, 120 |
| SP1 | None | 30, 45, 60, 90, 120 |
| SP2 | None | 30, 45, 60, 90, 120 |
| SP3 | None | 15, 30, 45, 60, 90, 120 |
| SP4 | None | 30, 45, 60, 90, 120 |
| SP5 | 45, 60, 90, 120 | 30 |
| GF1 | 30, 45, 60, 90, 120 | 15 |
| GF2 | 45, 60, 90, 120 | None |
| GF3 | 30, 45, 60, 90, 120 | None |
| GF4 | 45, 60, 90, 120 | 30 |
| GF5 | 30, 45, 60, 90, 120 | 15 |

## Validation and maintainability

`node scripts/check-routine-library.cjs` passes **7 groups, 855 actual plan builds, and 212 expected rejections**. It covers every added variant, 2/4/8-week blocks, all seven starting weekdays, complete duration ranges, week-boundary recovery gaps, original rep/rest preservation, unchanged doses when availability increases, confirmed equipment, first-time/advanced/youth gates, unavailable days and short windows, real onboarding selection and acceptance, retained old history, six-day splits and seven-day hybrid activity behavior. Seven-day hybrid requests add easy activity rather than another hard session. A known-invalid ID, invalid full-body split, and 30-minute walk/run sequence each have explicit regression checks.

`node scripts/check-training-audit.cjs` also passes the complete synthetic lifecycle for **222 plans** (213 original definitions, eight creator versions, and NHS), **6,995 sessions**, **48,414 logged sets**, and **1,999 saved-state round trips**. Its coverage assertion separately preserves all 154 prior choices and requires the 68 new IDs. This exercises actual native workout actions with canonical shared code; it is not a physical-phone test.

`npm run test:engine` additionally passes the actual native preview entry point for **216 catalog/shortcut choices across all seven starting weekdays** (1,512 previews), verifies each first session starts on the requested date, and saves/reloads every required first-session set for all 216 choices. New fixed-dose samples are checked for exact weekly frequency and their selected variant's duration ceiling. The broader native check still covers retained history, substitutions, optional measurements, individual-set RIR and all 995 exercise guides.

The generator writes deterministic `lib/routine-library.json` for runtime use and the companion receipt for review. `node scripts/generate-routine-library.cjs --check` rebuilds the data with the actual current engine and rejects input-hash or prescription drift. After deliberately changing any qualification input, rerun generation and review the resulting diff and exclusions. No accepted user's plan is automatically rebuilt from this catalog.

The catalog imports generated JSON directly, so it does not introduce a training/catalog initialization cycle or runtime prescription generator. Native and web consume the same canonical data after the standard shared snapshot sync. This report does not itself prove publication, APK compilation, physical-device behavior, Apple distribution, or every broader app feature; the parent platform audit and delivery receipts address those separately.
