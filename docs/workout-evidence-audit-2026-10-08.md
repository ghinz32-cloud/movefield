# U03 — workout evidence and coverage audit

Code reviewed at `243dfaa5ca697c293644f6b556fc6f22dd05e241`, branch `audit/2026-10-08-quality`. No application prescriptions changed in this milestone. Retrieval date: 8 October 2026. Conclusions below are an engineering evidence audit, not measured Movefield outcomes.

## Assessment

The broad structure is defensible: stable exercises, goal-specific rep ranges, rest time, gradual repetition/load progression, availability-aware schedules, reduced initial sets, explicit partial-workout history, and limits on youth/coach/symptom authority. The exact two-comparable-session threshold, ≥2 reported reps left, timed work estimates, deload timing, volume thresholds and anatomy weighting are product rules. None is individually established as the universally optimal rule by a cited trial. Templates are not proven effective simply because structural tests pass.

## Primary-source ledger

Original short summaries only; no full papers or paid program text copied. Abstract-only review is explicitly identified. Scientific facts and bibliography can ground explanations; full-text access does not imply a license for bulk model training.

| Evidence / source | Applicable finding | Limits / app implication |
| --- | --- | --- |
| [ACSM 2026 position stand](https://pubmed.ncbi.nlm.nih.gov/41843416/), DOI 10.1249/MSS.0000000000003897; abstract checked, [official interpretation](https://acsm.org/resistance-training-guidelines-update-2026/) | Progressive resistance training benefits healthy adults. Strength, hypertrophy and power respond differently to prescription variables. | The review covers adults and trials through October 2024. Keep beginner practice distinct from heavier strength optimization. Approximately ten weekly sets is a growth-oriented guide, not a minimum needed for any benefit. Supersedes the 2009 adult stand. |
| [Pelland et al. 2026](https://pubmed.ncbi.nlm.nih.gov/41343037/), DOI 10.1007/s40279-025-02344-w; abstract checked | More weekly volume is associated with gains and diminishing returns. Fractional indirect-set accounting fits the models best. Frequency effects differ between strength and muscle growth. | 67 studies, mostly young men. The app's particular anatomy weights are still estimates; more work is not automatically better for a particular person. |
| [Schoenfeld et al. 2019 frequency](https://pubmed.ncbi.nlm.nih.gov/30558493/), DOI 10.1080/02640414.2018.1555906; abstract checked | Higher frequency did not meaningfully improve hypertrophy when weekly volume was equated. | Replace the implication that twice weekly is inherently superior in all situations. Frequency helps distribute work and fit adherence/recovery. |
| [Robinson et al. 2024 RIR](https://pubmed.ncbi.nlm.nih.gov/38970765/), DOI 10.1007/s40279-024-02069-2; abstract checked | Estimated proximity to failure relates differently to hypertrophy and strength; growth was associated with closer sets in these analyses. | Exploratory estimates with imperfect fit. A fixed 2–3 RIR default is a conservative product choice, not a universal optimum. Do not require failure or diagnose readiness from RIR. |
| [Plotkin et al. 2022 overload](https://pubmed.ncbi.nlm.nih.gov/36199287/), DOI 10.7717/peerj.14142; bibliography/search evidence only this pass | Trial compares repetition progression and load progression. | Full article retrieval failed here. Prior report remains historical; do not infer an indefinite fixed-load plateau solution, an exact progression increment or all-population equivalence. Keep load/repetition routes distinguished. |
| [Iversen et al. 2021 time efficiency](https://link.springer.com/article/10.1007/s40279-021-01490-1); publisher/search abstract checked | Narrative synthesis favors prioritizing major lower-body, push and pull movements when time is scarce. | Narrative review, not a trial of these 15-minute templates. Lower-volume starters cannot promise the results of larger programs. |
| [Schumann et al. 2022 concurrent training](https://pubmed.ncbi.nlm.nih.gov/34757594/), DOI 10.1007/s40279-021-01587-7; abstract checked | Concurrent aerobic/strength work generally retained muscle-size and maximal-strength gains; explosive-strength gains could be attenuated, especially in the same session. | Separate-session hybrids are reasonable; combined two-day starters have a different purpose from power optimization. This is not a race or sport-specific plan. |
| [AAP 2020 youth report](https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents), reaffirmed November 2024; recommendations checked | Qualified instruction, competence-based progression and nonconsecutive youth resistance sessions are emphasized. | Current app's one-set defaults and exclusions are conservative capability limits. A self-reported supervision checkbox does not assess technique or make the app a supervisor. |
| [NHS Couch to 5K](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/); original schedule checked | Three weekly walk/run sessions across nine weeks, with rest days between runs. | Completion goal is continuous running duration; do not guarantee every user will run 5km. App-specific hybrid walk/run templates must not be called the NHS sequence. |
| [WHO 2020 guidelines](https://www.who.int/publications/i/item/9789240015128), [official current summary](https://www.who.int/europe/news-room/fact-sheets/item/physical-activity) | Adult health guidance combines aerobic activity and muscle-strengthening work. | A lifting-only or brief movement starter is not necessarily a complete weekly health-activity prescription. Clinical/special-population guidance needs separate coverage. |

The PMC full-text endpoint returned a browser-check page for ACSM; PubMed and ACSM's own publication were used instead. No safeguard was bypassed. Commercial architecture pages can inform split naming, but do not establish exact doses or grant reproduction rights.

## Actual programming inventory

| Goal | Catalog training days/week |
| --- | --- |
| powerlifting | 2, 3, 4 |
| powerbuilding | 2, 3, 4 |
| hypertrophy | 2, 3, 4, 6 |
| hybrid | 2, 3, 4, 5 |
| strength | 2, 3, 4 |
| general | 2, 3 |
| calisthenics | 2, 3 |
| running | 2, 3, 4 |
| sport | 2, 3 |

`node scripts/audit-workout-coverage.cjs` reads canonical TypeScript and generates `docs/workout-coverage-2026-10-08.json`: 75 catalog programs, all matching maximum-budget profiles build; 3150 matrix builds across six time budgets and seven explicit availability patterns. It is a reproducible inventory, not 3150 clinical validations. Matching equipment, established lifting/running and supervised youth are assumptions. Matrix includes unsuccessful combinations rather than silently dropping defining exercises. Three older/foundation options are outside this catalog count.

There is no built-in one-day resistance program or seven-day training recommendation. Five-day strength/bodybuilding choices are limited; six-day hypertrophy is for users with experience. These are coverage gaps to consider, not grounds to prescribe seven days or force more work. All-weekday availability does not mean training every day.

Existing program-design audit: 75 plans, zero structural-rule failures, with four explicit low-volume allowances, one home biceps allowance and one beginner heavy-work exemption. Its ten-weighted-set/twice-weekly gates describe the product's full-volume templates; they are not general medical minima. Muscle weighting, particularly compound-lift contributions and missing library annotations, needs separate review.

## Progressive overload and recovery review

- Comparable actual sets and matching equipment/machine setup determine suggestions; missing/older data, partial work, harder effort and changed context do not unlock increases.
- Explicit equipment increments prevent invented available weights. Range expansion is limited to suitable muscle-building work; strength improvements are not promised indefinitely with fixed load.
- First-time lifters start at up to two work sets before later planned sets. Dependency checks prevent advancing an incomplete prior exposure. Wave/range changes and later-set increases are part of the accepted plan; subsequent load/date proposals require approval.
- Symptom holds and youth/coach authority suppress adult automation. Optional reporting means absence of a symptom entry is not proof of fitness to train.
- Whole-session time estimates include work/rest/setup, and generators reject plans outside the selected budget. Estimates are heuristics, not timing observations; never shorten required rest just to satisfy a displayed number.

## Concrete gaps and next repairs

1. **Time-fit mismatch:** 62/75 nominal catalog times differ from maximum generated times. Example PLU3 says about 80 minutes versus a generated maximum of 50; fit notes can call an actually eligible plan too long. Use the generated draft for notes and ranking. U04a.
2. **Evidence framing:** frequency sources still foreground 2016, and every adult plan maps the superseded ACSM 2009 stand as current support. Add the verified 2019 frequency/2026 volume sources and remove 2009 from current-plan evidence. Keep historical source accessible. U04b.
3. Review named 5×5 marketing/progression text against actual two-session approval rules; inspect anatomy weighting and limited-volume disclosures. Do not silently change completed plans or add extra sets to meet a paper's group average.
4. Later add bounded one-day/appropriate five-day choices only with explicit limited-dose framing, schedule/recovery tests and stable canonical/native parity.
5. Full science review still needs exercise-by-exercise guide/mechanics validation, contemporary sport-specific/endurance and special-population coverage, and held-out model evaluations. No “fully validated” or “trained on all exercise science” claim is warranted.

Checks: canonical coverage generator passes; existing program-design structural audit passes. Documentation/JSON diff and remote readback required at checkpoint. Next U04a, then U04b, followed by storage and Qwen qualification.
