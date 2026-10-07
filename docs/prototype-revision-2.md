# Prototype revision 2

This revision repairs workout history navigation, adds a reviewed calendar shift, expands 25 exercise guides and introduces adult rep-range progression.

## User-visible changes

- Progress opens a full workout record with every completed exercise and set. Partial work and unknown loads remain explicit. Each exercise opens directly to its history tab.
- Calendar displays the full block. Any unstarted workout may move alone or shift with all later scheduled workouts. Every affected date, changed block end and departure from original availability is previewed. Commit is atomic. Competitions, active and recorded work remain fixed.
- All 25 sample exercises have setup, execution, breathing, common errors, regressions, safety context and logging conventions. Related-variation media is labeled instead of represented as an exact match.
- New adult resistance plans use goal-specific rep ranges. Existing accepted plans keep their targets until the user selects Preview rep ranges and accepts. Youth and run/walk progression remain distinct.
- Future session details and the logger show recent comparable loads when available. The logger copies a suggestion only into unfinished sets at the user's request. No starting load is invented from demographics.
- A load increase requires two comparable top-of-range exposures, recorded exercise-level reps in reserve of at least 2, no reported symptoms, and a user-entered available increment no greater than 5 percent. The app proposes the exact load for approval. Machine and setup labels prevent cross-machine transfer. Those triggers and the 35-day recalibration prompt are conservative product rules, not universal physiological cutoffs.
- Skipping is confirmed and reversible. Active or completed targets cannot be edited. Offline, stale and previously decided proposals no longer leave an actionable pending modal.

## Evidence

ACSM 2026 emphasizes individualization, sufficient effort and goal-dependent loading, without requiring failure or a universal double-progression algorithm. The older ACSM 2009 progression stand described 2–10 percent increases when a workload permits 1–2 repetitions beyond the target. The exact app rule above is a separate design choice.

- https://acsm.org/resistance-training-guidelines-update-2026/
- https://pubmed.ncbi.nlm.nih.gov/19204579/
- https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents
- Each exercise guide retains official source links in public/exercise-guides.json.

## Verification

Run `TZ=America/Chicago node scripts/check-training.cjs`. The harness fixes its clock and checks 28 cases covering calendar shifts, occupied dates, fixed commitments, DST/leap dates, offline queues, stale context, repeat acceptance, history, loading and legacy-plan opt-in. TypeScript checking and production build also run before publication.

Browser checks cover persisted partial history, direct exercise history, an occupied-date error followed by a successful 23-workout cascade, and explicit rep-range conversion. Native-device testing and production security/synchronization remain outside this device-local prototype.
