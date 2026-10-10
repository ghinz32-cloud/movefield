# U02a — web workout controls

Parent checkpoint `701c8b8a7a77c19e1be6ce17effd702917fbe3ff`. Review branch `audit/2026-10-08-quality`; local branch `audit/2026-10-08-integration`. No merge/deployment.

Changed `app/page.tsx` and `app/globals.css`: finish/count and compact rest controls share a sticky action bar; calculators and effort/load reference information are collapsed on entry. Machine setup remains before its log. Existing guide, load prefill, substitution, undo, notes and partial-workout behavior remain available. The floating Appearance shortcut is hidden only on the active workout surface; Settings still offers all appearance controls.

## Observed browser checks

Same 1363×936 viewport, 130% text and dark comfortable theme as U01. First Log action document position improved from ≈1987 to ≈1117 CSS pixels (≈870 pixels/44% less scrolling); still below the first viewport with this text setting, so this is a bounded improvement, not a completed redesign. At scrollY 678, action-bar rectangle top was 0 and bottom 90.375. Pause changed both clocks to paused. Log/undo changed count 0→1→0. Finish warns accurately about 11 unfinished tasks after logging one set; partial save adds exactly that completed work to sample history. Native secure save/restore not tested by this HTTP sample.

After screenshot: `docs/qa/u02a-workout-after.jpg`. Synthetic data only. Browser report limitations from U01 remain: no true phone viewport, no physical device, no secure saved-profile persistence.

## Automated checks

- `npm run check`: passes.
- `npm run lint`: passes, zero product warnings/errors (npm environment warning about its proxy setting is unrelated).
- `node scripts/check-training.cjs`: 29/29 checks pass.
- `node scripts/check-revision-11.cjs`: 7 groups / 428582 assertions pass; its generated historical JSON was restored, rather than relabeling old evidence as current.
- `git diff --cached --check`: passes before checkpoint.

An initial attempted `check-logging.cjs` command failed because no such script exists. The existing training/revision suites above were then run successfully; the missing command is not counted as a test.

No new unit test mirrors these reversible layout declarations; actual UI interactions verify the changed behavior. No fresh production build/security claim is made here. Run the required release build after the remaining UI slices.

Next: U02b native labeled set controls and a persistent session action area. Rendered Android keyboard/font-scale/TalkBack checks remain an explicit acceptance requirement.
