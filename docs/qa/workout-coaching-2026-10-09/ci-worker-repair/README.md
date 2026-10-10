# Service-worker repair CI evidence

`c60ee243baaf88eb9aa7dbd4c1dea16a01af1d58` is the exact automatically triggered source for both completed workflows. Its full tree is `0d84999d80c57c7731713aea85cec5901e54475c`. The PR integration commit `e6494209a994ab8a03db473b8c60ad8c0c0c8468` has the same full tree. Minimal official commit receipts are retained in source.json and integration.json.

This directory qualifies the service-worker repair. The sibling ci directory is historical evidence for the earlier 964/c0 checkpoints; those runs are not used as the repair's fresh qualification.

- [Quality run 38002481257](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481257): completed success. Official final run/jobs/artifacts, one successful decoded job log and extracted counts are retained.
- [Native run 38002481357](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357): completed success. The conservative input gate required compilation, and both platforms compiled, passed built-artifact inspection and retained their test binaries. No run was cancelled, dispatched or mutated by this monitor.

The quality decoded log verifies 75/75 regression suites, 34/34 offline VM fixture cases, 745 worker-policy assertions, 102 local-runtime assertions, 29/29 coaching UI cases with 168 assertions, the encrypted store's 12 scenarios/95 checks, and 3/3 production suites. Initial gzip bytes were 399,874 against a 400,000 budget. Exact evidence lines and fixture limits are in quality-counts.json.

Android compilation ran 23:04:37–23:12:09 UTC; iOS compilation ran 23:05:13–23:11:11 UTC. Their actual compilation overlapped for 358 seconds. The Android decoded log says BUILD SUCCESSFUL; its testReleaseUnitTest task was NO-SOURCE, so this receipt does not claim Android unit tests executed. Final official job steps establish iOS compilation, privacy/transport and SQLite replay inspection, packaging and upload; the full iOS decoded log was not requested again.

| Official retained artifact | ID and download page | ZIP bytes | Official ZIP digest | Expiration UTC |
| --- | --- | ---: | --- | --- |
| native-input-decision | [11649978145](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357/artifacts/11649978145) | 383 | `sha256:f57160c4776dfc061c93409d2e4a36455f2fdca94584f56bdcacba601b1abcaa` | 2027-01-07T23:03:26Z |
| android-release-compilation-test-only | [11649369079](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357/artifacts/11649369079) | 344,389 | `sha256:c94602ad99c4bf80054e7427dc3a4d7afbf285978806575d407e076b7525e283` | 2027-01-07T23:03:26Z |
| ios-release-simulator-compilation | [11649119080](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357/artifacts/11649119080) | 23,246 | `sha256:bab7a3570c47fe23f078109d91a612db7af3d0b53b32905d7026ae8ae72919e9` | 2027-01-07T23:03:26Z |
| android-arm64-preview-test-only | [11649014357](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357/artifacts/11649014357) | 18,814,555 | `sha256:f7a3839c6c5d304761436a2e1fee95c4a82c72d5b795823ea5b028d24c0fa051` | 2026-11-08T23:12:26Z |
| ios-simulator-preview-test-only | [11649009267](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481357/artifacts/11649009267) | 18,576,172 | `sha256:97e4b9c9b086fa2f74fef9c7bccc7a6d45cdd2a32f47312dd7650ee14aa72c0a` | 2026-11-08T23:11:21Z |
| quality-results | [11649203787](https://github.com/ghinz32-cloud/movefield/actions/runs/38002481257/artifacts/11649203787) | 11,451 | `sha256:585f6077b04acf31294ad8ab08d489a7cc7cba6a07934bb9b352342f3a694d72` | 2027-01-07T23:03:26Z |

Artifact digests above identify official GitHub ZIP archives. Fresh binaries were not downloaded or independently inspected locally for this checkpoint; current materialization attempts were zero as instructed. Prior HTTP403 and iOS transport failures are documented only in the historical directory and do not establish current availability. retrieval-limits.json records the exact scope.

Android output is an arm64 test APK. iOS output is an unsigned Release simulator application archive. These are staging/testing outputs, with no signed store, TestFlight, EAS or IPA delivery claim. Synthetic runtime/UI and worker VM fixtures do not qualify browser GPU inference, model downloads, paid backend execution, real-browser offline use or physical-device acceptance.

Product type, lint and build checks passed. Toolchain/upload-action deprecation warnings remain in logs. The quality log retains declared release-blocking braces (web/mobile) and node-forge (mobile) dependency exceptions; green CI does not remove that release boundary.

SHA256SUMS verifies every retained file except itself. inventory.json inventories receipts and README; SHA256SUMS additionally verifies that inventory. No private hosting origins, credentials, signed download URLs or model keys are included.
