# Shared exercise-library audit · 16 October 2026

Scope: Movefield and Grizzly canonical shared library, with a row-by-row structural inventory and targeted instruction/source review. This does not certify independent technique, physiological efficacy, universal media rights, or physical phone behavior.

## Findings fixed

1. **Exact-name search:** the `pec` → `chest` alias prevented “Selectorized pec deck fly” from finding itself. Queries now match either the literal token or its alias. Every 995 canonical name self-matches; abbreviations and exclusions still work.
2. **Unknown machine type:** `ref-Lying_Leg_Curls` was explicitly unconfirmed but a role mapping incorrectly marked it available for a selectorized leg-curl inventory. All 27 unconfirmed machine entries now remain unavailable/unknown for automatic matching, while IDs, stored history, guides and role descriptions remain intact.
3. **Eight previously unmapped exercise variations:** added explicit guide-backed inventory and broad muscle-region roles for cable face pulls, supported dumbbell rows, cable chest flyes, single-arm cable lateral raises, dumbbell reverse flyes, barbell hip thrusts, selectorized pec-deck and selectorized reverse flyes. New survey choices cover two cable towers, rope attachment, a hip-thrust pad, chest-fly capability and reverse-fly capability. Existing confirmed inventories do not silently gain those capabilities. Flyes do not become presses, face pulls do not become rows/reverse flyes, and hip thrusts do not replace hamstring hinges. No load equivalence is inferred.
4. **Three misleading primary references:** the two dumbbell split-squat variants previously opened a general kettlebell introduction; the standing reverse fly opened a row. They now link verified movement-family source records and prominently state their different support/loading. These references remain related variations, not exact demonstrations. No photos or videos are falsely reused.

## Complete structural inventory

| Item | Result |
|---|---:|
| Canonical exercises / unique IDs | 995 / 995 |
| Complete guides, each with all 14 required fields | 995 |
| Missing guides / orphan guide IDs | 0 / 0 |
| Media records / records matching shipped IDs | 888 / 885 |
| Exercises with photos | 863 |
| Local JPEG files, all fully decoded | 1,726 |
| Missing / corrupt / orphan local photo files | 0 / 0 / 0 |
| Shipped exercises with direct video URLs | 6 |
| Shipped exercises with source pages marked as video | 8 |
| Exercises without photos or a direct video URL | 126 |
| Distinct guide URLs, all valid credential-free HTTPS | 976 |
| Live upstream source IDs matched | 866 / 866 |
| Unconfirmed machine entries intentionally restricted | 27 |

All guides have a variant, summary, equipment, setup, execution, finish, breathing, errors, easier option, safety, load convention, sources, provenance note and quick cues. This confirms field coverage. Detailed editorial review focused on the eight newly mapped exercises and the three corrected source relationships. It does not imply a new human form review of all 995 entries.

Three legacy media keys (`floor-pushup`, `db-calf`, `squat-jump`) do not correspond to a current library ID. Three kettlebell source entries have empty photo arrays. These have no missing local file request and remain housekeeping/coverage items. Source photos match their upstream record IDs; still images do not establish every phase of a movement.

## Source availability

The live upstream exercise database contains 876 records and includes all 866 locally referenced source IDs. The repository source IDs were checked against that canonical dataset; they were not misreported as 866 individual HTTP page tests.

Every one of the remaining 109 unique external guide URLs was inventoried: 69 returned HTTP 200; 22 received proxy CONNECT denials; 18 were skipped after an explicit denial for the same host. None of the supplied URLs returned HTTP 404. Separately, all eight linked YouTube watch pages were denied by the proxy. These denials mean playback/availability remains unverified here, not that the public URLs are broken. The two corrected source-record pages returned HTTP 200 and their source instructions were read before editing.

## Verification

- Existing library test: 6 groups passed, including all guides, safe photo paths, JPEG headers, search, metrics and unsupported estimates.
- New library-equipment/search test: 8 groups passed, including all 995 names, all 27 unknown machine gates, eight exact inventory mappings, no-floor and single-dumbbell cases, distinct muscle roles, saved-inventory preservation and validated export/parse.
- Existing source-program regression: 20 groups passed; historical report writes redirected into runtime.
- Root TypeScript check passed during integration; parent runs final shared/native/build checks after synchronizing canonical data.

Full per-exercise rows, input hashes and counts: `.sites-runtime/audit-2026-10-16-library-report.json`. HTTP responses: `.sites-runtime/audit-2026-10-16-library/all-reference-network.json`. Existing fitness audit output was redirected to runtime and historical tracked reports were not overwritten.

## Final preference and equipment matrix

The final `check-fitness-fit.cjs` run passed 1,687,668 assertions across 7,776 synthetic preference/inventory scenarios and 8,478 returned plans. Every returned plan satisfied the tested time, frequency, equipment, recovery and persistence constraints. Of those scenarios, 3,351 had at least one matching plan; 4,425 had none. A passing test does not mean every requested combination has supported programming. The matrix includes short time limits, restricted equipment, first-time experience, six/seven-day preferences and floor restrictions, including combinations for which the app appropriately declines to generate a plan.

The full coverage matrix, goal/location summaries and unchanged hashes for 108 canonical input files are recorded in `fitness-fit-validation.json` alongside this report. These checks do not establish exact-variation visual verification, media rights, physical device acceptance or individual physiological efficacy.
