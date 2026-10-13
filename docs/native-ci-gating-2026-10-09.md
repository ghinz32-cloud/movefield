# Native CI input gating — 9 October 2026

NATIVE5 preserves required Android/iOS builds across later source and documentation updates. The observed NATIVE3 run37975149335 was cancelled when the PAGE2 source update triggered another native workflow. The old pull-request paths filter evaluated cumulative changed files; it could not establish whether the new update changed native inputs. A concurrency group could also replace a queued build even with cancel-in-progress disabled.

The native workflow now has no workflow-wide concurrency group or outer pull-request paths filter. A small exact-source job reads the synchronize event before/head range and compares complete NUL-delimited Git tree paths, without rename heuristics or API file-list limits. It skips compilation only after proving the checkout matches the event head and no native source, canonical shared/data input, inspection/extraction policy, or native workflow/gate changed. Opened/reopened requests and manual dispatch compile. Unknown/malformed events, unavailable before commits, checkout mismatches, comparison errors and missing/failed gate outputs compile conservatively. Explicit cancellation remains effective; the separate quality workflow retains its own cancellation setting.

The gate records decision.json as an artifact. An unchanged-input decision describes source inputs only; it does not turn a failed or missing earlier build into a passing binary qualification.

## Validation

`python3 scripts/test-native-change-gate.py` passes29 tests, independently rerun by the root. Real temporary Git histories cover multi-commit updates, divergent/force-pushed histories, renames, deletion, modes, non-UTF8 names, over3100 paths, unavailable commits, incomplete/failing diffs, CLI output and the observed06ca10f→d740c61 website-only range. Parsed workflow contracts check the exact-source checkout, failure fallback, retained dispatch/open/reopen behavior and absence of concurrency/path filters. Evidence: `docs/qa/native-compilation-2026-10-09/native5/`.

This is local gate/workflow validation. Actual hosted event execution remains pending until publication. The d740 native replacement run37975669983 has successful unsigned iOS Release simulator compilation and metadata inspection, but Android lint reports eight MissingClass errors for intentional unused-SDK removal markers. NATIVE6 must repair those narrowly and receive fresh actual CI; these gate tests do not clear Android, physical devices or store release.
