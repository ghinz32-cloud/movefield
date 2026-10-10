# V01 — integrated validation after native capacity recovery

Tested application commit: `aa57726f7d0615a47587758c8c9a965e2c5c7ed0`, local `audit/2026-10-08-resume`. This includes the reconciled audit/feature baseline, U04b workout sources, M02/M03 restore recovery, U06/U07 Qwen assets/references/evaluation gates, the dependency reviews and M04 native capacity/recovery controls. The following documentation checkpoint introduces no further application changes.

All **26 regression suites**, both production suites, web/native TypeScript, lint, native engine and Android/iOS Metro/Hermes exports pass. The production response rotates matching CSP nonces, closes write/internal/QA/photo routes and serves the source ZIP generated from current mobile files. Initial static JavaScript is **387,165 gzip bytes**, within the 400,000-byte budget; charts remain deferred. This is a bundle check, not measured device startup speed.

`docs/integrated-validation-with-capacity-2026-10-08.json` records the exact source/tree, per-suite results, command statuses, bundle graph and log hashes. Local logs are under ignored `.sites-runtime/validation/v01-*.log`; these scratch logs are not durable external deliverables. The regression runner's per-suite JSON confirms 26/26 despite the aggregate redirected text ending early. Four regenerated content reports are preserved under `docs/qa/v01-with-capacity/`; their historical counterparts remain unchanged.

The build used this checkout's portable Vinext path because no ignored execution-profile file had been copied into the isolated worktree. The resulting production Worker and asset checks pass. A future managed preview needs its own correctly configured profile; no preview/browser result is inferred from this build. Existing locked dependency installations were reused. This was not a fresh clean install or GitHub Actions run.

## Remaining release limits

- The dependency gate returns zero only with its existing temporary exceptions for **GHSA-vfj7-8cjw-p6xm** and **GHSA-86w9-cpqp-85rv**. Both remain release blockers; exceptions end 8 November 2026. See the separately saved web/native advisory reviews.
- Actual Qwen weights, runtime inference, tokenizer/memory/latency benchmarks and device qualification remain absent. U07's passing synthetic tests establish contracts and grading behavior, not model accuracy or training.
- Native M04 is an interim row-capacity guard; S02 encrypted SQLite entities/migration remain required for growing history.
- No new physical-phone, browser restore/offline/reflow/screen-reader, signed Android binary or two-device sync acceptance occurred. Accounts/cloud sync and broader product requirements remain unfinished.
- Last verified remote review head remains `8cd39e42f2178b807d63af2042b70481041b028b`. Current application work is local and unpublished. Automatic approval review previously rejected its push for lack of explicit export permission. No push retry, merge, service provisioning or live deployment was performed.

Next bounded milestone: U08a verified optional browser asset download/cache, cancellation and deletion; then U08b WebLLM worker/inference and measured qualification. Resolve this validation checkpoint with `git log -1 --format=%H -- docs/integrated-validation-with-capacity-2026-10-08.md` and verify refs/changes before resuming.
