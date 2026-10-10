# U13: recent research and user feedback

Movefield now provides a searchable **855-paper bibliographic archive** on web and phone. **718** records were first published in 2025–2026. The broad search found 849 unique records across 17 topics; an explicit ten-PMID query supplied six additional records and ensured selected syntheses were included. The cutoff is 8 October 2026. Each query records its exact URL, returned/matching counts and response fingerprint in `public/fitness-research.json`.

This is a capped, recent-first discovery index, not an exhaustive systematic review or 855 individually appraised papers. Clinical populations, protocols and correction/retraction language receive automated flags; those flags are neither complete screening nor clinical judgments. The product ships bibliographic metadata and abstract fingerprints, not abstracts or full papers. An unchanged abstract fingerprint is required to retain a separately recorded review label after refresh.

## Reviewed guidance

Seven new original notes update `fitness-reference-v2`. They include populations, review level, limits and source links. Plan mappings expose applicable notes, without changing accepted loads, schedules or technique automatically.

| Primary record | Finding used in the original note | Limit affecting plans |
| --- | --- | --- |
| [Currier 2023, PMID 37414459](https://pubmed.ncbi.nlm.nih.gov/37414459/) | Resistance-training prescriptions improve strength/growth over no exercise; heavier loading favors maximal-strength measures | Network rankings and indirect comparisons do not establish a novice's starting weight or an optimal app plan |
| [Singer 2024, PMID 39205815](https://pubmed.ncbi.nlm.nih.gov/39205815/) | Small estimated hypertrophy advantage beyond 60-second rests, with substantial uncertainty | No universal rest cap; preserving work and technique can require longer rests |
| [Zhang 2025, PMID 39903375](https://pubmed.ncbi.nlm.nih.gov/39903375/) | Supersets reduce time but increase perceived effort; pair choice matters | Limited chronic evidence; no automatic superset conversion or compressed recovery |
| [Varovic 2025, PMID 40570881](https://pubmed.ncbi.nlm.nih.gov/40570881/) | Small pooled regional-growth differences between average muscle-length conditions | Modest separation between conditions, young-adult studies, not all muscles/techniques |
| [Wolf 2025, PMID 39959841](https://pubmed.ncbi.nlm.nih.gov/39959841/) | Similar adaptations with lengthened partial/full-range upper-body work in this trial | Thirty trained participants, eight weeks; not proof for all partial movements or lower-body work |
| [Moesgaard 2022, PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/) | Periodization favors maximal-strength measures in volume-matched comparisons, with training-status differences | Complexity is not required for beginners. The [2026 LP/UP review](https://pubmed.ncbi.nlm.nih.gov/41869632/) reports similar pooled athletic outcomes across different populations/outcomes |
| [Molinari 2024, PMID 38090747](https://pubmed.ncbi.nlm.nih.gov/38090747/) | Healthy young women improve strength and muscle-size measures with resistance training | Search ended May 2022; no fixed sex-specific starting weights or automatic volume escalation |

Selected primary abstracts and official interpretations were reviewed, not every included trial's methods. Existing [ACSM 2026](https://pubmed.ncbi.nlm.nih.gov/41843416/) and [Pelland 2026 dose](https://pubmed.ncbi.nlm.nih.gov/41343037/) notes remain. The ACSM publication's review search ended in October 2024; a 2026 publication date does not mean it includes all 2026 trials. The separate reviewed-note ledger records nine matching archive records. Other retrieved abstracts, including repetition progression and loaded-training flexibility, remain discovery evidence rather than enabled new assistant claims.

## Exercise archives and forum themes

[ACE](https://www.acefitness.org/resources/everyone/exercise-library/), [ExRx](https://exrx.net/Lists/Directory), [wger](https://wger.readthedocs.io/) and [free-exercise-db](https://github.com/yuhonas/free-exercise-db) were investigated. ACE/ExRx remain linked references; ExRx's directory was unavailable in this retrieval. wger specifies per-entry Creative Commons rights. Existing 876 imported text records retain their public-domain provenance; unresolved imported photos remain withheld. The complete 989-entry Movefield library keeps authored guide/logging/source notes. No new image or commercial-instruction rights are inferred.

Ten original forum-thread summaries are saved in `docs/forum-feedback-2026-10-09.json`. Repeated themes include buried controls, extra taps, layout churn, equipment/exclusion mismatches, ambiguous exported units, unclear history scope and timer customization. This convenience sample supports design priorities, not market-wide prevalence or verified current competitor defects. Replies sometimes reveal an existing hidden feature: Strong's date-filter thread and Fitbod's history thread illustrate discoverability problems. Official help was consulted where available.

The compact Today-first UI addresses control visibility and clutter. One-exercise logging preserves the draft; equipment limits/exclusions and explicit backup units remain. Per-set rest defaults, external CSV imports and filtered exports remain future slices; they are not presented as completed features.

## Validation and boundaries

Web/native types, lint, 855-record provenance/search checks, 645 goal/evidence assertions, 256 grounding assertions, 21 synthetic grading assertions and 38 shared snapshots pass. The native engine covers 78 plans across seven starting weekdays and 989 exercise guides. Production build and both production suites pass, with 386010 gzip bytes in the initial graph. Research metadata loads lazily on the website and is bundled offline on phone. Android/iOS Metro/Hermes exports pass at 4.3 MB each.

In Chrome's sample profile, Sources opened, PMID 39205815 returned the reviewed rest record, the recent filter excluded it, and the current sample workout remained resumable. The screenshot was inspected and its synchronized file verified. Physical-phone, secure-storage and real-account acceptance remain pending.

The research index is never fed to Qwen or used as training examples. The separate original corpus and held-out evaluation fingerprints were refreshed; existing held-out cases use synthetic replies for contract tests. No model accuracy, inference, weight training or hardware qualification was measured. Existing dependency advisory, SQLite capacity and release limits remain. Source/report hashes and logs are recorded in the companion JSON. Standing authorization applies to pushing this checked milestone; merging and deployment remain separate.
