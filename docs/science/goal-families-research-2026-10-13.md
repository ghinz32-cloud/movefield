# Research-informed workout choices

The catalog now provides at least ten distinct structures for each supported goal. This is a library-wide count: the selector offers the subset that fits actual equipment, available days, desired frequency, experience, running readiness, floor-work preference, commitments and session time. A narrow setup may fit fewer than ten routines. The app gives the concrete reason when another option needs a change.

The structure audit builds actual eight-week plans with an explicit synthetic adult readiness profile. It removes IDs/titles, repeated identical sessions and added easy walks before comparing exercise, set/rep/rest and timed-run stage prescriptions. It counts a rep wave only when generated targets actually change. No NHS or public strength version is needed to reach the original-library minimum.

| Goal | Original entries | Distinct structures |
| --- | ---: | ---: |
| powerlifting | 13 | 12 |
| powerbuilding | 19 | 16 |
| hypertrophy | 22 | 19 |
| hybrid | 11 | 10 |
| strength | 18 | 13 |
| general | 19 | 14 |
| calisthenics | 15 | 10 |
| running | 13 | 11 |
| sport | 15 | 11 |

The adjacent validation JSON records every equivalence group. The per-plan review records the actual muscle-work allocation, source depth, arrangement, duration, progression and limits for all 154 shipped entries, including eight public strength versions and NHS. Primary and secondary muscle work stay separate.

## How the research changes choices

Bodybuilding has full-body, upper/lower, push/pull/lower, machine, dumbbell, band, brief and fuller-volume choices. Powerbuilding retains a strength lift plus muscle work or separate strength/size days. Powerlifting retains actual squat/bench/deadlift specificity with focused, combined, emphasis, intensity/volume and generated wave structures. General strength, fitness and calisthenics retain distinct home, supported, standing, brief and distributed choices. New sport options add unilateral, barbell and supported strength plus fixed landing practice; position-specific field drills remain coach-directed. Hybrid distinguishes modest same-day easy finishes from separate-day work. Running distinguishes timed walk/run recoveries, staged longer bouts, short/medium/long easy runs and fixed controlled moderate interval or continuous work.

Research supports principles and comparisons, rather than validating each of these exact combinations. The selector no longer ranks a plan higher simply for containing more work sets. Every accepted plan remains reviewable; actual weights stay unknown until selected from practice or comparable history. Manual and coach modes retain their authority.

## Reviewed sources and boundaries

Eight new source records are in `docs/evidence-ledger.json` and appear with links and review depth in the app. This targeted review does not claim a systematic review, complete full-paper qualification or a trial of an exact app recipe.

| Source | Use in the app | Review depth |
| --- | --- | --- |
| [Ramos-Campo et al., 2024](https://doi.org/10.1519/JSC.0000000000004774) | Split / full-body choice with workload context | Fetched original abstract and metadata |
| [Moesgaard et al., 2022](https://doi.org/10.1007/s40279-021-01636-1) | Strength-periodization interpretation and limits | Fetched original abstract and metadata |
| [Hickmott et al., 2022](https://doi.org/10.1186/s40798-021-00404-9) | Reviewed actual-work progression, without a velocity-to-RIR conversion | Abstract and selected primary methods/results/limitations |
| [Haugen et al., 2023](https://doi.org/10.1186/s13102-023-00713-4) | Equipment preference with movement specificity | Selected primary methods/results/limitations |
| [Llanos-Lagos et al., 2024](https://doi.org/10.1007/s40279-023-01978-y) | Established-runner strength context for hybrid choices | Selected primary methods/results/limitations |
| [Oliveira, Boppre & Fonseca, 2024](https://doi.org/10.1007/s40279-024-02034-z) | Endurance intensity choices with population limits | Abstract and selected primary methods/results/subgroups/limitations |
| [Filipas et al., 2022 issue; 2021 online](https://doi.org/10.1111/sms.14101) | Trained-running protocol limits; no novice copy | Wiley abstract, methods/training-table and perspective passages |
| [Kons et al., 2023](https://doi.org/10.1186/s40798-022-00550-8) | Power/landing practice context and study-quality limits | Selected primary methods/results/limitations |

Wiley Scholar Gateway · targeted Filipas query · 4 passages · 2 articles · publication dates 2021-11-18–2022-11-03. Three passages from the running trial were relevant; a separate plyometric article was excluded from this question. Broad screening also returned disease-specific articles unsuitable for healthy-user workout choices and did not qualify their prescriptions. The trained runner protocol does not cover a novice at this app’s small dose. Source interpretation was checked against returned primary passages, rather than relying on an AI-generated summary alone. Corpus update reported September 2026; [coverage details](https://support.scholargateway.ai/s/article/Available-Content).

Consensus searches were followed by original-record fetches for sources used from its results. Public primary publisher/indexed pages supplied additional methods, results and limitations. Access failures and PMC sign-in/challenge pages were not bypassed. Complete scientific figures/supplements, correction screening and all underlying trials remain outside this targeted qualification. Exact timing, readiness, rest and progression cutoffs are labeled app policies in both clients.

## Execution and verification

`node scripts/check-researched-families.cjs` checks uniqueness, selection, budgets, actual inventory, unknown loads, saved timed steps, run readiness, comfortable-stage prerequisites, a fixed quality-day count and nonduplicated landing practice. `node scripts/check-program-depth.cjs` checks all definitions across block lengths/start days and a broader selection matrix. `node scripts/review-program-science.cjs 2026-10-13` produces the per-plan index. Shared core/type checks, both brand builds and four native Hermes exports are separate release checks. These are software tests with synthetic inputs, not physiological trials or physical-device acceptance.
