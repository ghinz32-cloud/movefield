# Movefield security, platform, science and Pages audit — 9 October 2026

This is the current completion record for the owner's Android/iOS security audit, workout review and GitHub Pages publication request. Earlier milestone reports retain their original failures and pending states as historical evidence. This record does not certify store acceptance, physical-device behavior or independent penetration testing.

## Application and security changes

The audit hardened bounded imports and encrypted transfers, atomic browser/native persistence and legacy cleanup, secret-buffer handling, source packaging and CI permissions. Android excludes all nine legacy/cloud/device-transfer backup domains, denies release cleartext, and removes unused camera/audio/storage/overlay, biometric, push-registration, attribution and badge permissions. Unused Firebase/Google/data-transport startup components stay removed. Local reminder and sharing capabilities remain explicit.

iOS has a stable application ID, explicit OS floor and API-reason privacy declarations. Arbitrary ATS loads are denied; the deliberate local-networking allowance remains. Built-artifact checks cover app/SDK privacy declarations and source-denied biometric/direct-Documents exposure. Manifest/plist declarations are not native-API reachability or network-traffic proof.

The final-artifact inspector requires actual Android launcher/reminder components, boot capability, reviewed intent topology and bounded optional AndroidX startup declarations. Narrow lint annotations apply only to observed library-removal markers. Other findings remain visible. Native builds retain exact checkout commit/tree receipts. The workflow is configured to preserve running native builds across later website/documentation updates. A proven unchanged-input skip is a change receipt, never a substitute for a prior passing binary qualification.

The native-library review also identified vendored SQLite 3.50.3 in the upstream WAL-reset corruption range, with relevant concurrent-connection ingredients in the model metadata store. No corruption was reproduced. Implemented at published source `8abfca45f1f910155011516eabffbebdf070821b` (tree `b8a0dc7b9c820a44f98fd13df75b2970984fcc26`): checked DELETE rollback journaling plus EXTRA synchronization on every connection removes the WAL-only operating condition while preserving the durability setting. The supported Expo compiler default flag, runtime mode guards, existing-WAL migration/refusal tests and compiled-vendor checks are recorded separately. This is an application mitigation, not a patched SQLite library or a physical power-loss certification.

The native source starter requires a custom Android/iOS rebuild so the SQLite default 3 flag reaches every new transaction connection. Expo Go and other unqualified default 2 hosts intentionally refuse storage. Reopen with the current Movefield native build; retain existing records/backups and do not delete the database to bypass a refusal. Existing encryption keys, database names, schema and ciphertext are preserved.

Two bounded runtime follow-ups remain: Qwen can create new empty cache/model/attempt directories before a later mode qualification rejects an operation, and failed initialization clears its retry promise without closing an already acquired Expo database wrapper. The first is a refusal-contract gap; the second can retain acquired wrapper references across retries. Existing records/files were preserved in the focused refusal probes. Neither finding establishes existing-file loss, SQLite corruption or a measured native memory/OS leak.

## Recorded qualification

| Area | Observed result | Practical limit |
| --- | --- | --- |
| Full application quality | Qualified application source `e85a1ad320ec23db29b337fdee10f41f1dc24962` (tree `890d598d36ee1f09a3ad67268275e2de16309a48`) passed run37984196434:55/55 regression suites,3/3 production suites and31 reader fixtures. Its integration `d42921cc7a45be186895f408c56d2391aea1767a` has the identical tree | Source/harness suites do not establish physical-device behavior |
| Android | Run37984196327, job114002023999, passed release assembly/lint, actual APK inspection and strict resolved-dependency/SQLite default3 C build-route collection | CI test APK; unit-test task NO-SOURCE; no physical-device or distribution/store qualification |
| iOS | Run37984196327, job114002024138, passed unsigned Release simulator compilation, packaged privacy/transport inspection and strict Release SQLite/full privacy collection | No distribution signature or physical iPhone; historical source7 all11-manifest independent replay remains a separate receipt |
| Inspector | 90 fixtures and 18 independent NATIVE4 probes passed; Android backup resource binding/decoder and package tests were recorded | Fixtures and decoded metadata do not prove notification delivery, OS interruption handling or all binary API paths |
| Website | Pages commit `b8fe5ea6b12ff460aba3f35dc7249f18b778dfe1` deployed successfully in run 37981704616; all 37 HTTPS files match the verified build. 421 build/worker assertions and 120 independent VM checks passed; 118 starter files match source `8ab` | Worker tests are a VM harness. A synthetic desktop workout reload and protected same-dataset restore passed; real offline, physical-phone and accessibility/reflow acceptance remain pending |

The last prior qualification at source `ba8fec4f0a5cf54ccd7c2c7ed4de4fd976e514cf` passed both native builds in run 37978371785 and 53/53+3/3 quality in run 37978371782. Its iOS CI inspected 11 privacy files; the NATIVE6 independent replay covered root only. The new NATIVE7 iOS official artifact contains all 11 files for independent replay.

Source7 Android compilation/inspection succeeded but its collector failed on an assumed adjacent CMake cache. NATIVE8 repairs that layout assumption, binds the actual vendor entry's working directory/cache/output, deduplicates only identical validated invocations and continues rejecting missing/conflicting evidence. The dependency task now uses the same ABI/JVM inputs as assembly. Eleven added fixtures bring the reader suite to31; hosted native collection now passes on both platforms. Raw APK/app binaries and SQLite objects are not retained for independent execution or instruction inspection; iOS per-file C invocations are not retained. Build configuration is not a device PRAGMA query, complete binary SCA or a physical durability guarantee.

The initial NATIVE3 run was cancelled before inspection. Its successor assembled Android but failed eight `MissingClass` lint diagnostics on removal markers; its metadata step was skipped. Neither failed/cancelled Android run is presented as qualification. Official workflow records remain available; local cancellation/failure receipt recovery is tracked below.

## Every workout definition reviewed

All 75 original catalog definitions and 20 named reference records were inventoried, together with seven current/legacy executable paths and ten grouped modifier families. The 14-record targeted source register distinguishes adult/youth/older-adult applicability, consensus/guideline recommendations, abstract-only access and full-text review. Named/manual tracking retains its own authorship and is not presented as an app research prescription.

Repairs include feasible hybrid scheduling, rolling A/B alternation, final time estimates after focus additions, population-specific citations, selected-focus sources and a preference for smaller equally fitting novice foundations. Fresh immutable GitHub comparisons confirm six scientific core files, including the catalog, recipes, training and evidence code, are byte-identical to the reviewed SCI1 checkpoint. The final collector repair leaves the complete mobile, lib and public Git subtrees unchanged; the PAGE4 peer separately verified all 39 canonical/native/starter snapshot files. The earlier unpublished 124-check peer output was unavailable after the execution interruption and is not reconstructed as a new test result. SCI1 source `5af4582fe4bc78e60a07952a3b0bf0eca3592c8f`, tree `4efd7bd8d72f503e47c26e451e8c5e5395635699`, also passed actual 53/53+3/3 hosted CI in run 37969466143. The adult completion-based 36-to-57 whole-body-set progression remains a disclosed limitation; completion does not measure recovery or individual readiness.

Consensus supports broad training principles and goal-specific programming. No exact Movefield template has an independent outcome validation or established individual optimality. Engineering sweeps verify construction and boundaries, not measured training adaptations. Detailed review: [workout-science-2026-10-09.md](workout-science-2026-10-09.md). The original science integration narrative is retained as history; the later actual all-green CI and unchanged final provenance are recorded here.

## Website destination and later updates

Live site: https://ghinz32-cloud.github.io/movefield/ . Application source remains on `audit/2026-10-08-quality`; generated public files alone belong on `gh-pages`. Main has not been merged.

In repository Settings → Pages, use **Deploy from a branch**, **gh-pages**, **/(root)** and HTTPS. From the current source in WSL/Linux with Node 24 and GitHub authentication, run `npm run install:ci`, `npm run package:mobile`, `npm run build:pages`, `npm run check:pages`, then `npm run publish:pages`. The guide includes the branch update steps and deployment checks: [github-pages-2026-10-09.md](github-pages-2026-10-09.md).

The live native starter is developer source, not an installable signed phone app. Its 118 files and 39 shared scientific files match the published reviewed source; source ZIP SHA-256 is `6874de8ada413e6f2dd1c48a676737fc3dcc33955124ab22a34e9a1c7ab8bb7c`. The manifest version is `5d66719d4ad2048fb3f0d5056bafa862be493e38e3700d1aaa061f433d5165b6`.

Normal local training/logging, settings, protected transfers and reviewed research are available. Qwen is unavailable on Pages because this host cannot provide the required worker security headers. Native model inference, accounts/cloud sync and wearable integrations remain unimplemented or unqualified; placeholder controls are not release functionality.

## Gates before store distribution

The strict release dependency gate still fails on the high-severity `braces` and `node-forge` advisory roots. Dated CI exceptions do not waive release. The web production-only dependency audit is clean; native propagated package counts do not prove absence of a vulnerable build/runtime path.

Distribution still needs compatible patched dependencies or a separately reviewed remedy, developer-owned signing/store identities and accurate final privacy/export/health-app/age disclosures, plus Android/iPhone acceptance for save/restore interruption, permissions/reboot, low storage, accessibility and lifecycle behavior. No store submission or fabricated identity was performed. See [release-readiness-2026-10-09.md](release-readiness-2026-10-09.md) for the current gate matrix. CI exceptions expire 8 November 2026; the recorded strict release check exits 1; the recorded web-production-only audit has 0 findings. The collector repair does not alter dependency inputs.

Native dependency review extends beyond npm to retained Pods and installed native declarations. Resolved Maven and native SQLite build route evidence is now required in final CI; complete embedded C/C++ binary SBOM/SCA coverage remains incomplete; targeted source searches and lint version notices are not a clean native-dependency scan. Fresco's upstream image hardening is a compatible-framework maintenance follow-up, with app image reachability and resolved binary ancestry still unverified.

## Evidence index

Published qualified source is e85a1ad320ec23db29b337fdee10f41f1dc24962. Final documentation is a later documentation-only checkpoint; mobile/lib/public/scripts/workflow inputs remain identical. Official source8 native/quality job metadata and raw Android/quality logs are retained below. After the execution environment disconnected, fresh native ZIP bytes could not be independently extracted, hashed/CRC-checked or replayed, and one iOS full-log request failed. Successful strict hosted collection is the source8 qualification; the earlier source7 all11-manifest independent replay is preserved as a bounded reconstructed historical receipt. Unavailable original uncommitted files are not claimed to have survived.

- SQLite source/checkpoint history and local harness receipts: `docs/qa/native-sqlite-journal-2026-10-09/` and `docs/native-sqlite-journal-2026-10-09.md`.
- Final hosted native/quality qualification: `docs/qa/native-compilation-2026-10-09/native8/ci/hosted-validation-review.json`, official metadata and raw Android/quality logs.
- PAGE4 deployment/sourceZIP proof: `docs/qa/final-audit-2026-10-09/page4-final-peer-reconstructed.json`; PAGE3 original detailed receipts remain as history.
- Fresh immutable application/science comparisons: `docs/qa/final-audit-2026-10-09/application-science-equivalence.json`; historical source7 iOS replay: `native7-ios-peer-reconstructed.json` in the same directory.
- Current release gate policy/reports remain under `docs/security-audit-2026-10-09.md`, `docs/release-readiness-2026-10-09.md` and the retained earlier dependency artifacts. No fresh execution after the environment interruption is claimed.

This evidence does not promise maximum personal results, clinical suitability, absence of every vulnerability or Apple/Google approval.
