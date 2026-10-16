# Offline coaching copy review — 16 October 2026

The final shared Movefield/Grizzly copy was reviewed against the [coaching research rules](coaching-research-2026-10-16.md), the actual selection engine and saved-record examples. All current editorial array entries were read. No blocking wording issue remained at the reviewed snapshot; this is an editorial and factual-integrity review, not evidence that the messages improve adherence, fitness or clinical outcomes.

## What the library contains

| Item | Count and meaning |
|---|---|
| Primary selection families | 22; context, feedback and authority determine the applicable family. |
| Additional feedback family | 1; six “about right” phrases appear in optional details, rather than selecting a separate primary policy. |
| Suggestions | 124 authored strings across those 23 families. |
| Fact frames | 24: eight matching-history, eight new-context and eight saved-work frames. Numbers and dates are inserted from records. |
| Brand encouragement | 32 entries per brand; 16 are intentionally shared, making 48 distinct brand encouragement strings overall. |
| Review encouragement | 16 general phrases without invented symptoms or history. |
| Total editorial strings | 212 unique strings in 228 array slots. Additional conditional factual sentences exist in the engine and are not included in this array count. |

A normal matching-history preparation message has **3,072 possible base combinations** per brand: eight frames × 12 suggestions × 32 encouragements. A normal saved-work message has the same base count. These are compositions of authored phrases, not thousands of independently written policies or independently reviewed scientific recommendations. Review branches use smaller banks; factual comparisons and logging milestones can replace the ending. Changing a personalized number or date is not counted as a new editorial item.

Independent execution varied 12,000 synthetic contexts for each phase and brand. The final receipt observed 3,019 distinct Movefield preparation triples, 3,019 Grizzly preparation triples, 3,006 Movefield saved-work triples and 3,007 Grizzly saved-work triples. All eight frames, 12 suggestions and 32 encouragements appeared in each applicable pool. These counts came from actual rendered text returned by the shared engine, not just multiplying array lengths. They do not mean every possible composition was manually read.

## Issues resolved during review

| Issue | Final behavior checked |
|---|---|
| No whole-workout match implied no exercise load history | Baseline advice now distinguishes a missing comparable workout from each exercise’s own history. |
| Generic review encouragement implied a symptom or prior experience | The general review bank now avoids those unsupported factual assumptions. Current and historical symptom advice have separate wording. |
| Three completed rows against two planned rows appeared as “3 of 2,” with unfinished-work advice | A validated save/reopen probe now reports three saved entries against a plan of two and uses incomplete-context review. Extra rows are distinct from missing planned work. |
| A partial flag with every target row complete implied missing work | A validated save/reopen probe now uses incomplete-context review without asserting unfinished or remaining work. |
| Equal aggregate reps implied every set matched | A validated 5/5 versus 6/4 probe now says the **same total repetitions across two matching loaded sets**, at the same recorded loads. It does not claim identical individual sets or all workout activities. |
| Claimed combination count exceeded what the picker reached | The corrected picker produced more than 3,000 distinct actual text triples in each independent normal-pool probe. |
| “About right” phrases existed without a reachable presentation | They now appear in optional details and are counted separately from primary policy families. |
| Technical or awkward wording obscured the next action | Wording now refers to the workout, planned targets, exercise choices, length, structure and accurate records. |

The review also checked that harder/easier reports remain reports, unknown loads remain unknown, missed work does not become a debt, and ordinary encouragement does not promise a PR, certify technique or clear a concern. Grizzly wording changes the imagery, while concern, supervision and coach-authority messages retain clear language. Suggestions do not set a new load, add work or reschedule a session.

## Evidence and remaining limits

The supporting research substantively read seven official CDC/NHS guidance pages. It supports process goals, individual fit, useful tracking, neutral treatment of setbacks and appropriate attention to concerns. No original trial of this message bank was reviewed. The exact wording, bear imagery, frequency and presentation remain product decisions requiring user feedback. Inaccessible sources and CAPTCHA pages were excluded rather than represented as read.

This pass reviewed source copy and deterministic domain output. It does not establish screen-reader usability, physical-phone readability, long-term engagement or response latency on a phone. Those platform checks belong to the [UI/compatibility audit](coaching-ux-audit-2026-10-16.md). Complete exercise fields, a working media URL or these coaching messages do not independently verify exact exercise variations, technique, scientific suitability or media rights.

The reproducible synthetic probe and JSON receipt are in `.sites-runtime/coaching-2026-10-16/independent-copy-review.cjs` and `copy-review-validation.json`. The receipt records exact output, save-parser checks and source hashes. Reviewed SHA-256 values:

- `lib/workout-coaching-library.ts`: `2bc97bb8cd15e7aadc13dbca5a0b0182df4a228d030a11e2bcbddaf2779f4ba0`
- `lib/workout-coaching.ts`: `bc08251cdeb80de82f57d5641f639c15e60b75e0bc530ad9e4005dc5c960e857`

Later source changes require a corresponding review or receipt update; these hashes identify the review scope rather than a published-build claim.
