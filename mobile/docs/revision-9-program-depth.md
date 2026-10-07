# Revision 9: complete sessions, suitability and bounded reviews

## Implemented

The catalog expanded from 18 to 55 selectable app-original plan options. Some disciplines appropriately share foundation movements; this is not a claim of 55 entirely unrelated methods or equal outcomes. Added first-time powerbuilding, two-day SBD, dumbbell and home hypertrophy, machine-led starts, fuller calisthenics, hybrid home/dumbbell paths, a screened four-day easy-running base, and established-lifter development blocks. Existing SBD and barbell-strength sessions have purposeful assistance. Adult foundation core work is no longer an indefinitely one-set afterthought.

All generated sessions specify movements, work sets, ranges or intervals, rest, effort guidance, starting-load uncertainty, prerequisites and time. Warm-up/practice/finish instructions are visible during plan selection, review, workout details and logging. Practice sets are distinct from work sets; jump contacts are not silently increased by warm-up advice. A default bar is not assumed manageable for a novice.

Experienced development blocks require a recent-training confirmation. Main-lift rep ranges change over three-week waves; every fourth week reduces sets. New ranges recalibrate loads. Beginner opening work stays at up to two sets, with later work gated by prior sessions. Youth second sets are staggered from week 4, at most one additional exercise per repeated session, and require two comfortable, supervised exposures. The longer youth foundation reserves 40 minutes for its fuller instruction and work. Supervised brief variants also fit 15-minute windows with one work set per movement, youth-specific instructions and no adult automatic load rules. No calendar catch-up volume.

Running base plans check recent weekly running days/minutes, separate from lifting experience. Fixed easy durations are base maintenance, not race training. Missing prerequisites and insufficient availability produce actionable messages rather than false personalization. Short blocks have bounded, non-overlapping phase labels.

Load history includes a training-role identifier, separating technical/heavy targets even when ranges match. Session role IDs preserve recurring substitutions/custom additions across title changes. Historical records without a matching role need recalibration rather than importing an uncertain weight.

The new finite workout review uses fixed rules only. See ai-coaching-decision.md for costs and the future server design. No paid AI connection, real authentication, cloud workout database, once-per-workout billing lock or model-quality evaluation is claimed.

## Ten families and available time

The ten families are general fitness, general strength, pure powerlifting, powerbuilding, full-body muscle growth, split muscle growth, calisthenics, strength plus endurance, running development, and athletic foundations. The 55 catalog entries are variants within those families, not 55 independently validated methods. The older supervised youth and NHS run/walk paths remain available separately.

Setup accepts 15–120 minutes as a maximum, not a target to fill. Fifteen-minute options use focused preparation, a smaller set count, protected rest and across-week movement coverage. First-time learning can take longer: use fewer actual work sets or more time instead of rushing. Two-day short variants cover general fitness, strength, hypertrophy, calisthenics, dumbbell powerbuilding and athletic foundations. Pure powerlifting still requires a barbell/rack/bench and its brief variant assumes familiar lifts. Home powerbuilding is not mislabeled competition powerlifting. There is no promise that a smaller dose produces equal outcomes to a longer plan.

Age and optional sex do not manufacture starting weights or change goal access. Actual experience, recent training, supervision and capacity guide eligibility. Older adults retain experienced options; accessible movement choices are based on function. Pregnancy/postpartum rehabilitation, disease-specific plans and automatic medical clearance are not implemented by inferring a demographic label.

## Equipment limits

- Save the heaviest SINGLE dumbbell during setup or in Settings. Pounds and kilograms convert once into canonical kg.
- Save a machine/exercise maximum in Exercise history. Machine limits match the exact exercise and setup label. Blank is unknown; zero is unavailable.
- The global dumbbell limit and exercise-specific limit both apply; the lower wins. A maximum does not imply all smaller increments are available.
- Never suggest an accepted or historical load above current equipment capacity. Ask for recalibration without rewriting factual history.
- Revalidate pending suggestions when equipment changes; stale proposals cannot apply. Historical weights above a newly lowered cap remain factual records.
- For eligible adult muscle-focused work, offer a reviewed wider rep range up to 20 reps, preserving sets/rest/dates and checking the time window. More reps are not claimed equivalent to heavy competition-lift practice. Strength/powerlifting retain goal-specific equipment or maintenance choices.
- Assisted variations do not gain ordinary added-load progression. Unknown machine units, irregular load inventories, plate-pair inventory and maximum kettlebell settings are not yet modeled as a full equipment inventory.

## Security and integrity

- Reject malformed or duplicate weekdays, unsupported profile values and empty plans.
- Validate saved duplicate record/session/set IDs and reversed rep ranges before using data.
- Rebuild non-date proposals through trusted engine constructors before accepting their patches. Date proposals may only change dates. A model cannot bypass scope by supplying a generic session patch.
- Patched web source-map-js to 1.2.2, preserving the existing seven-day release-age policy.
- Narrow mobile override: xcode's UUID 7 to 11.1.1. Verified actual CommonJS project ID generation and Expo prebuild configuration; mobile exports and engine checks are required.
- Fresh audit after fixes: web 2 advisories (1 high braces, 1 moderate legacy build-tool esbuild); mobile 15 affected package entries from 2 underlying high advisories (braces,node-forge), no critical findings. Upstream fixes were not published when checked. No forced Expo/RN downgrade.

## Verification

The latest matrix passes 3,737 scenarios. scripts/check-program-depth.cjs checks all 55 catalog choices over7 starting weekdays and5 block lengths, then goal × experience × equipment × time × availability combinations. It checks nonempty schedules, unique dates/exercises, valid targets, unknown initial loads, time fit, persistence, youth equipment/progression, malformed proposals and the future AI schema. docs/program-depth-validation.json records the precise latest counts and compatible-option matrix. This is generated-program verification, not proof of exercise efficacy or independent validation of every exact prescription. This research and prototype work does not wait on external expert review.

The existing 126 regression checks and 17 new equipment-capacity checks pass. Web/native type checks, native 58-option × 7-day engine suite, production nonce/closed-route checks and mobile exports remain gates. Browser walkthrough checks novice powerbuilding at60minutes, preview/acceptance, Today/sidebar replacement, warm-up access and saved-workout review. The browser also verified 15-minute onboarding, a 25 lb per-dumbbell cap, accepted-plan replacement and a saved three-set workout with skipped feedback. Missing feedback leaves accepted targets unchanged.

## Research findings and provenance

Evidence informs the rules; exact exercise combinations, 15-minute budgets, dose changes and progression triggers are clearly identified as app-designed extrapolations. Full public exercise routines were compared to understand structure, not copied wholesale.

- Iversen et al. (2021), full time-efficient-training review: https://link.springer.com/article/10.1007/s40279-021-01490-1 . Supports distributed short training; weekly dose and goal still matter.
- Hermann et al. (2025), full author manuscript for the single-set trial: https://sportrxiv.org/index.php/server/preprint/download/484/1032/967 . Nine exercises twice weekly took about 30 minutes. It is not evidence for fitting those nine exercises into 15 minutes.
- Plotkin et al. (2022), repetition versus load progression: https://pubmed.ncbi.nlm.nih.gov/36199287/ . Supports bounded rep progression as one option; eight-week findings do not prove unlimited fixed-load progression or equal maximal-strength transfer.
- Roberts et al. (2020), sex comparison meta-analysis: https://pubmed.ncbi.nlm.nih.gov/32218059/ . Full author paper reviewed. Relative training responses do not establish separate optimal programs or fixed load multipliers for each sex.
- The 2025 hypertrophy sex meta-analysis, abstract reviewed only: https://pubmed.ncbi.nlm.nih.gov/40028215/ . Full text was unavailable in this research path; no full-paper review is claimed.
- NSCA older-adult position stand, full paper: https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf . Adapt by capacity and training history, not age alone.
- Ten Hoor et al. (2018), school cluster trial: https://pmc.ncbi.nlm.nih.gov/articles/PMC6156874/ . Short supervised strength work embedded in PE supports feasibility, not validation of our sport prescriptions.
- Robinson et al. (2022), adolescent classroom trial: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.811534/full . Four-minute sessions did not improve muscular fitness over four weeks; brief does not automatically mean effective.

Public threads provided usability cases, not scientific authority:

- https://www.reddit.com/r/MacroFactor/comments/1qcc172/maxed_out_machines_with_smart_progression/ — recommendations exceeding stored equipment capacity.
- https://www.reddit.com/r/caliberstrong/comments/za963f/maxed_out_on_home_dumbbell_set_what_comes_next/ — goals differ when dumbbells run out of load.
- https://www.reddit.com/r/daddit/comments/1u61id5/1520_minute_strength_training_nominimal_gear/ — predictable brief sessions and minimal assumed equipment.

Additional source families:

- ACSM2026 healthy-adult resistance-training overview: https://acsm.org/resistance-training-guidelines-update-2026/ and https://pubmed.ncbi.nlm.nih.gov/41843416/
- IUSCA hypertrophy position stand: https://journal.iusca.org/index.php/Journal/article/download/81/140/5323
- NSCA youth position stand: https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf
- NHS run/walk sequence: https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/
- Concurrent-training systematic review: https://link.springer.com/article/10.1007/s40279-021-01587-7

Full public author workout methods reviewed included PHUL, PHAT, StrongLifts5×5, GZCL and Hal Higdon5K schedules. They inform comparison; the new catalog uses original prescriptions and descriptions. Exact named programs remain clearly labeled original-source references, not falsely preloaded copies. TSA web previews exposed only week1 and included conflicting metadata; later weeks were not fabricated. Public reading does not license photos, videos or branded spreadsheets.

## Still incomplete

Position-specific programs for every high-school sport, advanced race/meet peaks, technique assessment, production accounts/consent/cloud sync and live AI remain unbuilt. Sport pathways are explicitly general foundations or coach tracking. Advanced running needs longest run, recent breaks, race distance/date, performance and other workload before personalized pace/volume programming. No universal claim of equal outcomes, all-population safety, scientific validation of exact app templates, or independent penetration testing is made.
