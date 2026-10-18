# Training, exercise-library and prescription audit — 18 October 2026

Audited baseline: `ca96011ac53b7d544856281a175cfee0859ca844`, branch `codex/comprehensive-audit-2026-10-18`. This audit tested shared canonical domain code and content used by Movefield and Grizzly. It did not certify installed binaries, clinical efficacy, individual exercise technique, remote video playback or media rights. No training prescriptions or application source files were changed by this audit. One standalone test loader was repaired after preserving its failure receipt; its original fixtures and assertions are unchanged.

**Result:** no newly reproduced functional defect in this scope. The additional preference matrix, add-on assertions and adversarial checks pass. There are material coverage and evidence limits below; “all preference combinations supported” or “995 exercises independently reviewed” would be incorrect.

## Checks and actual coverage

| Check | Result | What the result establishes |
| --- | --- | --- |
| `scripts/check-fitness-fit.cjs` | 7,776 scenarios; 8,478 generated plans; 1,687,668 assertions passed | Matching-goal plans respect selected days, time ceilings, tested inventory, no-floor preference, recovery spacing and unknown starting loads. |
| Matching options within that matrix | 3,351 scenarios have at least one same-goal app option; 4,425 have none | Safe withholding is part of the result. The matrix includes 15/20-minute windows, stringent inventories, no-floor variants and goals needing unavailable equipment. It is not a population or clinical coverage estimate. |
| Add-on regression | All 13 original assertion groups pass through the repaired `node scripts/check-focus.cjs` CLI | Main lift dose/rest, owner control, jump readiness/supervision, youth limits, time constraints, event spacing, assistance-only supersets and idempotence. |
| Additional adversarial probe | 6 groups passed | Landing and running readiness, difficult history inputs, side-count substitutions, all 465 available curated substitution edges, guide/media fields, URL syntax and local photo existence. |
| Structural exercise inventory | 995 canonical exercises; all 995 have required guide fields | Required setup, execution, finish, breathing, errors, easier option, safety, logging convention and source fields are populated. This is field coverage, not independent form verification. |
| Catalog inventory | 213 definitions; 46 distinct exercise IDs in catalog slot definitions; 53 six/seven-day definitions | Counts exclude additional source-program and dynamic recipe definitions from the 46-ID statistic. No unresolved catalog IDs or advertised-duration understatements were found by this inventory. |
| Core native snapshot comparison | 9 selected domain/content modules byte-identical to canonical source | The selected training, inventory, substitution, catalog, source-program, focus, science and JSON modules agree. This does not prove a currently installed app contains them. |

The broad matrix covers six equipment profiles, nine goals, desired frequency 2–7 days, first-time/some-experience users, 15/20/30/45/60/90-minute windows, and no-floor on/off. Inventories are explicitly confirmed: wall/route only; bands/support/floor; one fixed dumbbell; adjustable pair; comprehensive home gym; and selected machines without barbells. The “no equipment” matrix profile deliberately does not confirm floor space. Many combinations are expected to have no qualified plan.

A separate representative check with a confirmed full inventory, some experience, 60-minute windows and all weekdays available found a fitting option for every one of the nine goals at 2, 6 and 7 days. This is one concrete configuration, not a promise for every setup. Seven days can contain easy walking/recovery; it does not mean seven hard lifting or running sessions.

The root agent owns the full-core baseline and final source/native verification. This report does not count an in-progress or unseen baseline as passed.

## Findings and limits to retain

### T18-01 — preference constraints can leave no matching plan; supported withholding, not a defect

Reproduce using the stored matrix profiles in `fitness-fit-validation.json`. For example, powerlifting without the defining barbell equipment is not silently converted to a machine plan, desired days exceeding available days are rejected, and a short window cannot remove necessary work/rest merely to qualify an option. `lib/training-runtime.js:2028` enforces matching frequency and subsequent equipment, experience, running-base and scheduling guards.

The setup must continue to show the actual reasons and let the user revise choices or use owner-directed tracking. Do not market the current set as solving every combination of goal, equipment and time. The matrix already verifies that recommendations which are returned match the selected goal and mode.

### T18-02 — 24 routine variants have lower weekly region frequency; disclosed scope needs to stay visible

The structural script labels nearly every nonbrief general/hybrid/sport option “Complete foundation coverage” and flags any primary region below twice per sampled week. This is an audit heuristic, not a clinical pass/fail definition. It flags four window variants each of `LIB-HB1`, `LIB-HB2`, `LIB-SP5`, `LIB-GF1`, `LIB-GF2` and `LIB-GF4` (45/60/90/120 minutes).

Examples:

- `LIB-GF1-45` is a two-day bodyweight/band beginner routine. Its sampled week has quadriceps and hamstrings each on one day, with chest/back on two.
- `LIB-HB1-45` divides two lifts and two runs; its primary-region distribution is not the same as a two-day repeated full-body dose.
- `LIB-SP5-45` is strength support for an endurance athlete, explicitly asking the user to account for running/cycling outside this plan.

**Verified mitigation:** all 24 actual `programScience(plan)` results explicitly disclose regions with primary work below twice per sampled week; they also state that no controlled trial of the exact shipped routine was identified. See `lib/program-science-runtime.js:42` and the complete `coverage-and-shared-validation.json` receipt. No routine was altered merely to satisfy this broad heuristic. Retain these limitations when selecting, reviewing or marketing these plans; a qualified individualized review can decide whether the scope matches a particular user.

### T18-03 — media and independent technique review remain incomplete

- 995 written guides with source links and short cues.
- 885 canonical media records; 110 exercises use written guides/source links without a separate media record.
- 863 exercises have local photo references, totaling 1,726 image references; every referenced local file existed.
- Six canonical direct video links. A source webpage may contain additional media, but that was not established here.
- 2,529 HTTPS source/video references across 30 distinct hosts passed URL syntax checks. No remote availability or playback checks were performed in this audit.
- Eight media entries use `referenceScope` rather than a `verification` field. Their guides disclose that linked material is a parent/related movement, not a verified demonstration of the exact app variation. These include standing versus seated reverse fly and floor-supported versus rear-foot-elevated split squats.
- Three noncanonical legacy media keys remain: `floor-pushup`, `db-calf`, `squat-jump`. They are not selected through canonical catalog IDs. This is a small cleanup opportunity, not a reason to remove a saved movement or its history.

Sampled guide/source/load text covers bench/rack safety, single versus paired dumbbells, the two dead-bug counting conventions, reverse fly, split squat, cable variations and unconfirmed machine drive type. This is not an independent movement-by-movement review of all 995 instructions. Guide source notes and media qualification are surfaced in the web and native source views (`components/exercise-guide.tsx:23`, `mobile/src/exercise-guide-screen.tsx:86`). Attribution and source availability do not by themselves establish rights to reuse photos or video.

### T18-04 — exact machine identity stays unresolved for 27 reference entries

All 27 source machines whose loading type is unconfirmed remain unavailable/unknown for automatic prescription or substitution even with a confirmed full-gym inventory. They keep stable IDs and stored history. A visually similar machine does not establish selectorized/plate-loaded equivalence or a comparable load. Existing `scripts/check-library-equipment.cjs` explicitly asserts this guard; the structural report identifies every affected entry. One coach-selected task intentionally has unknown muscles, and the bounded jump-landing practice has no generic interchangeable substitute. Neither is silently counted as an ordinary reviewed strength movement.

### T18-05 — source evidence supports principles and specified source formats, not universal outcomes

The qualification record still offers **68 of Claude’s 125 submitted variants and withholds 57** with explicit reasons. It does not label every proposal scientifically validated. Known rejected arrangements retain their IDs in the qualification record and are absent from selectable catalog data. `scripts/check-routine-library.cjs` is part of the root-owned core suite and checks generated input hashes, actual duration/recovery, exclusions and preserved dose in longer windows.

The existing evidence ledger has 38 source entries with different access depths: metadata/abstracts, selected full-text portions, official public guidance, public creator instructions and linked references. Prior Consensus/Wiley material is recorded with its access limits; this audit did not fetch new full texts, revalidate prior access or imply a plugin was freshly used. A full PDF retrieval also does not mean every claim, table or figure was independently reviewed.

`lib/program-science-runtime.js:47` distinguishes evidence-informed app principles from owner plans whose source support is unassessed. Its exact-routine trial disclaimer and implementation-choice section explicitly qualify numeric load ceilings, RIR targets, history windows, recovery gaps and progression triggers as app choices. Keep those statements; outcomes, exact optimum doses and injury-prevention claims are not established by passing software tests.

### T18-06 — resolved: standalone focus-check loader restored

The original `node scripts/check-focus.cjs` CLI reproduced exit code 1 because its private wrapper-only transpilation could not find `./training-runtime.js`. The failed command, source hash and output are retained in `focus-cli-before.json`, alongside a copy of the pre-fix script. The earlier in-memory adaptation receipt remains unchanged in `focus-validation.json`.

After the shared baseline, the tracked script was repaired to use the supported `domain-test-loader.cjs`. Its original fixture (including the fixed scenario date) and all 13 assertion bodies are byte-identical to the pre-fix version. The actual unmodified CLI command now passes all 13 groups with exit code 0; see `focus-cli-after.json`. This changes test loading only, with no training-policy changes or weakened assertions. Root/core training tests separately cover relevant focus flows.

## Adversarial behavior checked

- `SPJUMP2` rejects missing landing readiness, first-time lifting and youth use of the adult specialized template. With qualified experience/readiness it builds one fixed six-landing practice per week plus strength. The generic structural inventory's single build rejection for this plan was the missing-readiness guard, not a broken routine.
- A continuous four-day running base rejects absent running history, one missing required day, insufficient weekly running minutes and an unconfirmed comfortable base. Lifting experience alone does not qualify it.
- Partial sessions, reported or uncertain symptoms, excessive effort, future/stale logs, missing sets, mixed loads, a unilateral-only logged side, zero load and unknown load cannot produce a new automatic load. RIR zero/one/unknown does not qualify an increase; concern holds and youth rules suppress inferred loads. Synthetic input records remain unchanged.
- Switching between the two dead-bug IDs converts 6 per side to 12 total, and 12 total to 6 per side; set count/rest, other targets and validated saved-state round trips remain intact.
- All 465 curated substitution edges available under confirmed full inventory keep the same reviewed movement role and repetition metric, require available equipment, and use distinct exercise IDs. Different movement roles are not made interchangeable merely because they use the same broad muscle group.
- Add-ons preserve primary work and dates, need actual spare time, retain rest, never force powerlifting main lifts into supersets, and do not add adult doses to youth or automatically change coach/manual programs. Jumps respect readiness and existing practice/competition buffers. These buffers are product policies, not a safety guarantee.

## Receipts and reproducibility

Ignored receipts are under `.sites-runtime/comprehensive-audit-2026-10-18/training/`:

- `fitness-fit-validation.json` — copied from the current check output immediately after the run; full 7,776-scenario coverage map.
- `current-audit.json` — every canonical exercise and catalog definition; the historical audit script was run with only its output directory redirected in memory, leaving tracked historical reports untouched.
- `focus-validation.json` — exact 13 passing groups and loader/date adaptation.
- `focus-cli-before.json`, `check-focus-before.cjs`, `focus-cli-after.json` — preserved actual CLI failure and source, followed by the repaired CLI result with fixture/assertion identity verification.
- `adversarial-probe.cjs` and `adversarial-results.json` — reproducible synthetic probes, per-group results, coverage counts and SHA-256 hashes of audited inputs.
- `representative-options.json` — the 27 concrete full-inventory goal/frequency cases.
- `coverage-and-shared-validation.json` — all 24 frequency flags beside their actual source/plan disclosures, plus nine canonical/native byte comparisons.

These domain results apply to the shared implementation. Web/native interaction accessibility, Android/iOS build signing, real-device behavior, final package contents and publication status belong to the separate platform/release receipts. No user workout, accepted plan, source prescription or historical audit report was modified by this audit.
