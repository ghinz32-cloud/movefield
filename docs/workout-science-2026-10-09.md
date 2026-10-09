# Workout science and prescription review — 9 October 2026

The verified sources support resistance training, gradual progression, appropriate supervision and aerobic activity. This targeted review identified **no independently validated or optimal exact Movefield templates**. An engineering check of source links, exercise counts, schedules or targets is not a clinical outcome study.

This review covers all **75 original catalog definitions and 20 named reference records**, plus legacy AT01–AT04, the supervised youth foundation, the NHS sequence, empty tracking calendars and ten grouped modifier families. The per-definition inventory and engineering findings are in [catalog-review.json](qa/workout-science-2026-10-09/catalog-review.json). The complete source register, access limits and machine-readable scope are in [primary-sources.json](qa/workout-science-2026-10-09/primary-sources.json).

## Review status and method

The original source audit began at `587438a8a2ba21cf88c943f857348dd7190eb078`. Relevant code was checked again after the SEC2 checkpoint `0e43ddf47730bdb264be45326884646b17a25ade`. The reproductions below retain the **pre-SCI1 findings**. Repairs are now implemented in the local working tree and the changed source mapping was inspected. The focused regression passed all 16 groups. Independent checks covered 51,191 schedule profiles, 86 boundary cases and 1,125 focus profiles with no invariant failures. Full application integration, the final commit and checkpoint readback are recorded separately by the checkpoint owner.

Primary publication pages, society PDFs and official public-health/program pages were inspected on 9 October 2026. “Primary source” here means the original publisher or responsible organization; an umbrella review, meta-analysis or consensus document is not itself a primary randomized trial. Review depth is recorded individually. Abstract access is not silently treated as full-paper review. This was a targeted evidence audit, not an exhaustive systematic literature search.

Counts describe stored definitions or reference records. They do not count clinical validations, endorsements, unique research populations or necessarily unique source programs. The named references have manual authority; availability in the app does not establish reproduction rights or measured outcomes.

## Ten decisive sources

The source register contains exact URLs, dates, populations, supported principles and limits. Dates distinguish online publication from issue publication where relevant.

| Source | Publication / type / content inspected | Supported use and important limit |
| --- | --- | --- |
| [ACSM 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/) | Online 5 Mar 2026; issue 1 Apr 2026. Position stand and umbrella review; eligibility, interpretation and practical-recommendation sections inspected, plus abstract and official interpretation. Supplementary review-level appendices were not reappraised. | Healthy adults, 137 reviews, over 30,000 participants; evidence through Oct 2024. Progressive training supports muscle function. Strength, hypertrophy and power have different dose considerations. Heavy-load optimization is not a universal beginner starting load; no exact app template was tested. |
| [WHO 2020](https://www.who.int/publications/i/item/9789240015128) | 25 Nov 2020. Public-health guideline; official age-group summary checked. | Adults need aerobic activity alongside strengthening. Older adults also need balance/strength multicomponent activity; youth need a broader daily activity pattern. A brief lifting template or two walks need not meet the complete weekly guidance. |
| [AAP youth report](https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents) | Jun 2020 issue; reaffirmed Nov 2024. Clinical report; official indexed recommendations and reaffirmation checked. | Start lightly and progress with competence, instruction and qualified supervision. Full text was blocked by SSO. The exact three-week 1×8 app foundation is not prescribed by the report; the app's no-max-testing limit is a capability choice. |
| [NSCA youth](https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf) | Aug 2009. Position statement; relevant sections of official full PDF reviewed. | Dynamic preparation, light initial loads, balanced work and 2–3 nonconsecutive days. Typical strength ranges include 1–3 sets of 6–15. These are broad supervised guidelines, not validation of the app's exact youth progression. |
| [NSCA older adults](https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf) | Aug 2019. Position statement; relevant sections of official full PDF reviewed. | Adapt exercise, dose and progression to function and tolerance. Work toward appropriately loaded regular training; age alone does not set load. General recommendations do not establish individual suitability of every adult template. |
| [Pelland dose response](https://link.springer.com/article/10.1007/s40279-025-02344-w) | Online 4 Dec 2025; 2026 issue. Systematic review/meta-regressions; abstract checked. | 67 studies, 2,058 participants, mostly young men. Volume associates with gains and diminishing returns. Fractional indirect sets fit the models; the app's muscle coefficients and exact set totals remain estimates. No universal weekly increase cap follows. |
| [Robinson proximity to failure](https://link.springer.com/article/10.1007/s40279-024-02069-2) | Online 6 Jul 2024. Exploratory meta-regressions; abstract and caveats checked. | Estimated proximity related more clearly to hypertrophy than strength. RIR was reconstructed and model fit was modest. This supports distinguishing outcomes, not proving a universal 2–3 RIR or two-exposure threshold. |
| [Wu non-failure review](https://link.springer.com/article/10.1186/s13102-026-01861-z) | Published 6 Jul 2026; publisher version of record 17 Jul. Systematic review/meta-analysis; open article reviewed. | 20 studies, 556 healthy adults with varied training status. Non-failure had a small dynamic-strength advantage; other pooled differences were not significant. Heterogeneity and small samples prevent claims that every non-failure prescription is equivalent. |
| [Binmahfoz dietary weight loss](https://pubmed.ncbi.nlm.nih.gov/40909191/) | 2 Sep 2025. Systematic review/meta-analysis; indexed abstract checked; full publisher/PMC text blocked. | 25 trials, 1,608 adults aged 18–65 with overweight/obesity. Resistance exercise supported lean-mass preservation, fat loss and strength during dieting. Certainty varied; additional scale-weight loss was not significant. This does not validate walking add-ons as treatment. |
| [NHS Couch to 5K](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/) | Current official program page; publication/review date not exposed. All nine stages checked. | The stored NHS intervals match, including differing sessions in weeks 5–6 and opening/closing walks. Three weekly runs have rest days between. The final target is 30 minutes running, not guaranteed 5 km. Source fidelity is not individual readiness or app clinical validation. |

ACSM's [17 March announcement](https://acsm.org/resistance-training-guidelines-update-2026/) is distinct from the paper's online/issue dates. Pelland's “2026” app key refers to the issue year, despite online publication in December 2025.

## Focus source principles

| Source | Review level and use | Limit |
| --- | --- | --- |
| [Zhang superset review](https://pubmed.ncbi.nlm.nih.gov/39903375/), online 4 Feb 2025; Apr issue | Open publisher article checked. Nineteen studies, 313 participants, mostly young trained men; only three chronic studies. | Perceived exertion was higher; chronic estimates were limited. Exact app pairings, combined rest, time savings and fat loss are not validated. |
| [NSCA plyometric exercises](https://www.nsca.com/education/articles/kinetic-select/plyometric-exercises/), Aug 2019 | Official book excerpt checked. Existing sport jumps and movement mastery matter when adding practice. | Does not validate three/six weekly app landings or 48/72-hour app buffers. |
| [CDC activity and weight](https://www.cdc.gov/healthy-weight-growth/physical-activity/), updated 7 Apr 2026 | Official guidance checked. Activity supports health and weight-management needs vary. | Twenty added walking minutes are not a complete activity prescription or guaranteed weight-loss dose. |

The implemented selection mapping is population-specific:

| Selected focus | Adult source keys | Youth source keys |
| --- | --- | --- |
| Core | ACSM-2026 | NSCA-YOUTH |
| Jump practice | NSCA-PLYOMETRICS | NSCA-YOUTH |
| Supersets | ZHANG-2025-SUPERSET | Not offered |
| Activity support | CDC-ACTIVITY, WHO-2020 | Not offered |

Focus notes and the picker now show only the selected principles; structured plan evidence receives the corresponding keys. The [NSCA time-efficient article](https://www.nsca.com/education/articles/ptq/time-efficient-training), November 2022, remains historical/contextual reading in the ledger, not the current selected superset source. These references explain principles; precise overlay doses remain app choices.

## All 75 original definitions

The [compact catalog review](qa/workout-science-2026-10-09/catalog-review.json) owns per-definition dose, source/population context and engineering observations. The identifier inventory below prevents specialized, brief and accessible variants from disappearing behind a few representative examples.

| Goal | Count | Definition IDs |
| --- | ---: | --- |
| Powerlifting | 9 | PL3, PL4, PLTX3, PLSL3, PLU3, PL2, PLW4, QPL3, PLSTART3 |
| Powerbuilding | 11 | PB3, PB4, PBPH4, PBT4, PBSTART2, PBSTART3, PBDB3, PBW4, QPB2, QPB3, PBDBST2 |
| Hypertrophy | 12 | BB3, BB4, BBPPL6, BBARN6, BB2, BBDB3, BBM3, BBHOME3, BBADV4, QM2, QM3, BBDBST2 |
| Hybrid | 9 | HY4, HY5, HYHOME4, HYDB4, QHY4, QHY3, HY3, HYDB2, HYHOME2 |
| Strength | 9 | ST2, ST3, STGYM2, STDB3, ST4, QS2, QS3, STSTAND2, STDBST2 |
| General | 10 | GF2, GFHOME2, GF3, GFM2, QG2, QG3, GFSTAND2, GFNOGROUND2, GFNONE2, GFDBST2 |
| Calisthenics | 7 | CAL2, CAL3, CALBUILD3, CALBUILD2, QC2, QC3, CALDB2 |
| Running | 4 | RNEASY3, RNBASE4, QR3, QR2 |
| Sport | 4 | QSP2, QSP3, SP2, SPDBST2 |

These are original app definitions informed by principles. Split names, nominal level labels, muscle coverage, successful construction and a linked consensus document do not establish that the exact exercise/set/rest sequence is optimal.

## All 20 named reference records

The source page and source-specific verification status for each record belong in the compact catalog review. Some records prefill stored source facts; others supply an empty calendar for the person's source copy. Loads, source-specific progression and resets remain manual. The two Lite and two GZCLP records are distinct app schedule variants, not four independently validated programs.

| Record ID | Named reference |
| --- | --- |
| ref-tsa-beginner | TSA Beginner Approach |
| ref-tsa-intermediate | TSA Intermediate 2.0 |
| ref-calgary16 | Calgary Barbell 16-Week |
| ref-phul | PHUL |
| ref-phat | PHAT |
| ref-jt2 | Jacked & Tan 2.0 |
| ref-stronglifts | StrongLifts 5×5 |
| ref-stronglifts-lite | StrongLifts 5×5 Lite |
| ref-stronglifts-lite-2 | StrongLifts 5×5 Lite |
| ref-fitness-basic | r/Fitness Basic Beginner Routine |
| ref-gzclp | GZCLP · first stage |
| ref-gzclp-4 | GZCLP · first stage |
| ref-metallicadpa-ppl | Metallicadpa Linear PPL |
| ref-db-stopgap | Dumbbell Stopgap |
| ref-db-ppl | Dumbbell PPL |
| ref-bwf-rr | Recommended Routine |
| ref-frankoman | Frankoman's Dumbbell Only Split |
| ref-531-beginner | 5/3/1 for Beginners |
| ref-db-steve | Dumbbell Only Full Body |
| ref-db-josh | Dumbbell Only · 3 Day Full Body |

A published author's instructions establish what that author recommends. They do not by themselves establish comparative effectiveness, general clinical suitability, endorsement of Movefield, or permission to reproduce unrestricted program text. This focused consensus audit does not newly re-verify every full author program.

## Additional generation and maintained recipe paths

| Path | Pre-implementation runtime behavior | Traceability finding |
| --- | --- | --- |
| AT01 | Legacy full-body foundation; range conversion, accepted load changes, reduction and return remain available to stored plans. | Fresh adult routing is effectively covered by the catalog. AT01 recipe metadata is not the live source of its exercise menu. |
| AT02 | Legacy upper/lower hypertrophy template; stored recipe slot sets/reps/rest inform its fallback construction. | Numeric rep waves are converted to ranges. The recipe root now explicitly labels unresolved `SCxx`/`ARxx` identifiers as inherited metadata, not verified citations or executable rules. |
| AT03 | Legacy strength full-body template; recipe slot facts inform fallback targets. | Same identifier gap; the recipe's historical wave descriptions are not proof of present range-based behavior. |
| AT04 | Legacy home/band foundation; saved plans retain modifier support. | Fresh adult catalog routing shadows this fallback; its recipe metadata is not the runtime menu. |
| YOUTH-FOUNDATION | Two supervised nonconsecutive days, initially one set of eight; second sets staged from week 4 after two comfortable supervised prerequisites. | `recipes.json.youth` instead describes rep-first progression. The recipe root now explicitly states that policy is not executed; live targets and supervisor-owned changes remain the authority. |
| Youth catalog variants | Brief, standing-band and no-equipment variants use one controlled set and supervisor-selected reps/resistance. | Youth plans now use the youth-only AAP/NSCA/LTAD mapping, rather than inheriting adult goal studies or the former sparse mapping. |
| RUN-WALK | Adult NHS sequence, prerequisite-controlled, up to nine stages. | Runtime consumes the verified recipe intervals. App-authored hybrid/brief walk–runs are explicitly separate. |
| TRACK | Empty manual/coach session slots; actual targets must be entered before starting. | Empty placeholders are not an app exercise prescription. Manual/coach and named tracking now use empty app evidence arrays, preserving source/user authorship separately. |

Recipe metadata, live defaults and accepted changes need separate provenance. Dead metadata is not an additional executed algorithm. Conversely, stored legacy plans cannot be excluded merely because fresh onboarding selects the newer catalog.

## Ten grouped modifier families

These ten families include four focuses. They are **not ten standalone proposal types**. Version checks, explicit previews, symptom holds and preserved recorded history are engineering safeguards, not measured clinical outcomes.

| Family | Target effect / authority | Evidence boundary |
| --- | --- | --- |
| Core focus | Counts existing core first; may add one youth or two adult dead-bug sets on up to two weekly strength days. | Exact six-per-side dose and placement are app choices. |
| Jump focus | Once-weekly small practice block; supervision and schedule buffers. | Existing sport load matters; exact contacts and calendar buffers are unvalidated. |
| Superset focus | Curated equal-set accessory pair, A1→A2 then combined rest. | Selected adult evidence is Zhang 2025; higher perceived effort and limited chronic data matter. Exact pairings/rest remain app choices. |
| Activity focus | Adult ten-minute walks on up to two strength days, or existing endurance work. | A small addition with no weight-loss guarantee; not the full aerobic recommendation. |
| Approved return block | One set per strength exercise, newly selected load; opening walk/run repeats for the remaining block. | App restart default, no automatic ramp back, no quantified fitness loss or medical clearance. |
| Approved set reduction | Reduce one exercise by one set or repeat a familiar run stage. | Reversible feedback option; does not measure recovery. |
| Approved load/range/capacity/substitution | Comparable-history load suggestion; range migration/extension; curated replacement with separate load baseline. | Exact RIR, exposure count, step ceiling, rep limits and replacement defaults are app rules. Capacity additionally cites REP-PROGRESSION, outside the ten-source full verification scope here. |
| Approved schedule move / competition buffer | Move one or later sessions while checking order, commitments and spacing. | Calendar checks do not guarantee recovery. The competition buffers are app planning choices. |
| Accepted user exercise / target edits | Add an exercise or rewrite upcoming manual/coach targets with time review. | User/coach authorship must stay visible. Technical numeric bounds are not recommended doses. |
| Session guide / example warm-up ladder | General movement preparation; adult calculator using entered working load. | The 40/60/75/85% working-load ladder with 5/3/2/1 reps is an example default, not independently validated. Youth loads remain supervisor-owned. |

Generic proposals inherit the first plan evidence key. That identifies context rather than a source validating the precise change. Curated substitutions and user edits also retain the original plan evidence; the altered prescription must remain distinguishable from the original source.

## Concrete pre-fix findings and implemented repairs

| Finding | Reproduction / implication | Implemented change; final verification |
| --- | --- | --- |
| HY5 feasible schedule rejected | Start 12 Oct 2026, Mon–Fri available, experienced/full gym/120 minutes, running base confirmed with four days/100 minutes. Construction rejects although strength Tue/Thu and runs Wed/Fri/Mon can fit. | Feasible role/day rotation and first-session disclosure preserve the full block. Focused tests cover all seven start weekdays and commitments; independent schedule/boundary checks pass. |
| PLSL3 alternation disagrees with copy | Original weekly slot reuse gives A/B/A/A/B/A while copy claims continuous alternation. Named `ref-stronglifts` already gives A/B/A/B/A/B with manual progression. | Explicit rolling A/B uses the actual role and prior matching role across weeks. Focused original and named-reference tests pass; named-source manual authority is retained. |
| Focus time understated | PL3, first time, full gym, Mon/Wed/Fri, four weeks, 65 minutes, activity focus: week-3 “Squat + bench” reports 65 although final canonical estimate is 70. Flat focus minutes omit item setup/transition. | The 65-minute draft now fails with a visible 70-minute estimate. A 70-minute window preserves its work and rest. Focused tests and the independent focus sweep pass. |
| Population/focus evidence incomplete | Catalog generation emits only adult ACSM or youth NSCA plus definition source; it bypasses richer discipline evidence. Older-adult source is absent; focus links are a collective note. | Population/discipline mapping, selected-only focus sources and empty tracking evidence arrays pass focused checks, including every catalog and named reference. |
| Novice completion mistaken for readiness | PBSTART3 rises 36→57 whole-body work sets from week 2→3. The squat session rises 12→19; completed prerequisites with harder effort and RIR 0 can still permit it without a symptom hold. | At 60/75/90-minute windows the equally fitting smaller QPB3 foundation is suggested; PBSTART3 remains available when it fits. Tests preserve and disclose completion-only adult eligibility, including harder-feedback history. |
| Maintained recipe drift | Unused youth recipe describes rep-first progression, whereas the live foundation stages second sets. Recipe source/rule identifiers have no resolving registry. | Recipe root labels SC/AR aliases as legacy/unresolved and detailed youth policy as not executed. Four diagnostic legacy-generator paths and current youth behavior pass focused checks; historical metadata is preserved. |

The novice later sets are already displayed and accepted as part of the block. They are not an undisclosed new load proposal. The pre-fix audit exposed that prerequisite completion can unlock greater scheduled work without establishing readiness for it. That completion-based adult eligibility remains a limitation, now expressly disclosed. Among equally fitting novice choices, ranking prefers lower later weekly work, then lower initial work. A source-based load increase guard and an accepted calendar set increase remain different paths.

The 36→57 example is a whole-body count, not a per-muscle dose. Exercise distribution, indirect work, load, effort, skill and tolerance affect its interpretation. The reviewed evidence does **not** establish a universal weekly set-increase cap; this review does not invent a ten-percent rule or equate a five-percent equipment-load guard with weekly volume progression. A product readiness check also cannot diagnose clinical fitness from self-reported RIR.

## Verification and remaining publication record

| Required evidence | Status |
| --- | --- |
| Final implementation commit and exact source tree | Source checkpoint follows this report; resolve with its Git history. Publication record will give the exact remote tree. |
| Compact review covers every original ID, every named record, seven executable current/legacy paths and ten grouped families | Published with baseline/novice first-week targets, distinct phase doses, pre/post differences and exact source/card hashes. |
| HY5 full-count feasible rotation and explicitly disclosed first date | Focused regression and independent schedule/boundary checks passed. |
| PLSL3 rolling alternation; named StrongLifts manual behavior preserved | Focused regression and existing 3,582 named-template assertions passed. |
| Final focus item estimates and time-window boundary cases | Focused regression and 1,125 independent focus profiles plus two additional cases passed. |
| Population/focus sources resolve; NHS versus app-authored runs stay distinct | Focused regression passed all 75 original and 20 named-reference baselines, youth and older contexts, running and selected focuses. |
| Foundation tie-break ranking and dose/readiness disclosures, including completion-only eligibility | Focused regression passed; adult completion-only behavior remains explicit, not a recovery assessment. |
| Canonical/native shared-code parity after changes | 39 shared hashes and six canonical modules in the final source ZIP match; both Hermes exports and native types/engine pass. |

Run `node scripts/check-workout-science.cjs` for the 16 focused groups. `node scripts/generate-workout-science.cjs` refreshes executable targets and source hashes while retaining reviewed scientific criteria. Independent scripts and results are published beside the catalog audit. These checks verify construction and boundaries; they do not measure training adaptation. The ledger now contains ten core sources, three current focus sources and one historical/contextual article (fourteen records).

Remaining limits include exercise-by-exercise mechanics validation, individual clinical assessment, full-text review of access-limited papers, source-specific verification of all named author programs, sport-specific conditioning and endurance outcomes, and measured adherence/effectiveness of Movefield. No clinical-validation, guaranteed-safety, optimal-template or “trained on all exercise science” claim follows from this audit.

Final integration: the full local regression attempt passed 51/53 suites. Its only failures were the late recipe snapshot sync and a renamed TypeScript fixture failing to resolve the newly canonical runtime import; both were repaired and rerun successfully (39 shared hashes and 29 training assertions). The 53 effective passing suites are recorded as a combined result, not a fabricated single all-green run. All three production suites pass against the final fresh build. Web/native types, product lint, native engine and both Hermes exports pass. Fresh peer sweeps report 51,191 schedule profiles, 86 boundary cases and 1,125 focus profiles without invariant failures. Exact source, report, log and output hashes are in `docs/qa/workout-science-2026-10-09/validation.json`.
