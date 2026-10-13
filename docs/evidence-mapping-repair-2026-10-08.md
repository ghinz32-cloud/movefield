# U04b — current-plan evidence mapping

Parent: `8cd39e42f2178b807d63af2042b70481041b028b`. Repository `ghinz32-cloud/movefield`; local branch `audit/2026-10-08-integration` tracks GitHub `audit/2026-10-08-quality`. The worktree was clean; live GitHub refs and draft PR #1 were verified and `git fetch origin --prune` completed. `main` and `review-fixes` retain their recorded heads.

## Change

Current adult plans no longer attach ACSM 2009 as current guidance. Historical Sources entries remain accessible. Hypertrophy, powerbuilding and hybrid now cite the 2019 volume-equated frequency review. Strength, powerlifting, powerbuilding and hypertrophy also cite the 2026 issue of the Pelland dose-response meta-regressions. The former 2016 frequency entry is labeled historical, with a pointer to the newer evidence.

Sources were read again on 8 October 2026:

- [Schoenfeld, Grgic and Krieger 2019](https://pubmed.ncbi.nlm.nih.gov/30558493/), DOI 10.1080/02640414.2018.1555906: abstract and bibliography checked. Equal weekly volume comparisons do not show a meaningful hypertrophy advantage from higher frequency. This is not a claim of equal strength outcomes or equal results from different volumes.
- [Pelland et al. 2026](https://link.springer.com/article/10.1007/s40279-025-02344-w), DOI 10.1007/s40279-025-02344-w: publisher abstract and bibliography checked; full text is subscription content. Online publication 4 December 2025, 2026 journal issue. The modeled associations have diminishing returns, indirect-set accounting matters, and frequency effects differ by outcome. The app's individual anatomy weights, recovery and set targets are not validated by this paper.
- [ACSM 2026 position stand](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/), DOI 10.1249/MSS.0000000000003897, and [official ACSM explanation](https://acsm.org/resistance-training-guidelines-update-2026/): current healthy-adult guidance. This replaces the 2009 stand as current plan support.

Only brief original summaries and bibliography are included. No full texts are redistributed or used for training. No exercise, dose, load, date, plan ID, saved record or progression rule changed. Historical reports are retained.

## Verification

- `node scripts/check-goals.cjs`: 9 groups, 580 assertions pass. Covers every evidence family with run/youth combinations, key resolution, historical-source exclusion from current mappings, new-source applicability and deduplication.
- `node scripts/check-shared.cjs`: 31 canonical/native files and snapshot hashes pass after `node mobile/scripts/sync-shared.mjs /workspace/scratch/37008205acde/movefield-integration`.
- `pnpm exec tsc --noEmit` and native `npm run check`: pass.
- `pnpm lint`: pass with no errors/warnings. `git diff --check`: pass before commit.

No new physical-phone, rendered Sources-panel, complete scientific validation, model training or signed-binary acceptance is claimed. Source mapping alone does not certify the templates' outcomes. No merge or deployment.

## Next

U05: select an offline-first storage design and decompose the migration/sync work. Prioritize recoverable local restore before adding an account service. Then verify current Qwen assets/runtimes and build a provenance-aware reference corpus.
