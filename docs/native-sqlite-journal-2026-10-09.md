# Native SQLite journaling mitigation — 9 October 2026

Both app-owned databases previously enabled WAL on ExpoSQLite 57.0.4, whose installed Android and iOS source vendors SQLite 3.50.3. SQLite’s upstream WAL-reset corruption notice covers that version. Multiple same-file connections with overlapping checkpoints and writes are relevant to the Qwen metadata database; the training adapter serializes its operations, which limits its demonstrated concurrency. No actual app corruption or the rare upstream interleaving was reproduced.

## Implemented boundary

The encrypted record database and public model-file metadata database now initialize checked `journal_mode=DELETE` and `synchronous=EXTRA` before schema or application SQL. Initialization reads SQLite’s effective conversion result, then reads both effective modes. Locked, refused, missing or malformed results stop the operation. Existing database names, schema, encrypted envelopes and SecureStore keys remain unchanged. SQLite handles existing WAL checkpoint/conversion; the app never removes `-wal` or `-shm`, renames databases or rewrites ciphertext to change modes.

The official installed ExpoSQLite plugin applies the **string** `customBuildFlags: "-DSQLITE_DEFAULT_SYNCHRONOUS=3"` to Android and iOS. EXTRA is per connection. Expo’s existing `withExclusiveTransactionAsync` opens a fresh native connection and begins a transaction before calling app code, so setting EXTRA only on the cached base connection would be insufficient. All twelve exclusive callbacks now read both modes before any application callback SQL and reject unless they are exactly DELETE and numeric3. These guards never set PRAGMAs inside a transaction. Missing compiler configuration is refused even when the original base connection was explicitly set to EXTRA.

Existing encrypted batching, revision/CAS guards, rollback, separate committed readback, legacy cleanup receipts and failure reporting remain. Mode failures preserve the existing generation and surface a storage error. A failed postcommit readback can still leave a complete committed generation under the existing acknowledgement rules; tests require that generation to remain valid rather than treating every rejected call as proof that no commit occurred. Initialization can be retried after lock refusal. No reset is performed automatically.

The source starter now requires a custom native build with this configuration. Expo Go cannot apply a project compiler flag; an unqualified host is refused. The README and START-HERE guide explain rebuilding the installed app and keeping records/backups instead of deleting database files. Ordinary UI errors describe installing a current Movefield app build.

## Evidence and qualification

The accompanying validation receipt and logs distinguish actual host SQLite checks, installed Expo config generation, compiled TypeScript app adapters with native API stand-ins, and pending actual Android/iOS builds. The node transaction harness explicitly models native default3 before BEGIN; a separate case leaves the real host default2 unchanged and verifies refusal. It uses an exclusive BEGIN and an in-process transaction queue, which differ from Expo’s deferred BEGIN and native concurrent queues. The interleaved different-model fixture verifies recoverable contention, complete pointer/file preservation and retry, not native concurrent throughput.

A separate independent peer compiled the exact installed vendored C source with GCC, comparing unmodified default2 against flag3 and testing fresh connections, file migration/refusal, rollback and process reopen. That evidence is source-specific Linux proof, not an Expo or physical-phone test. Actual native CI must still bind successful Android/iOS compilation, strict final manifest/privacy inspection and the SQLite build route to the published commit before qualifying those builds.

The bounded native evidence collector additionally retains the actual Android resolved release runtime dependency report and ExpoSQLite C compile invocation/output object; on iOS it retains the ExpoSQLite Release compiler settings/source/object identities and the full built privacy-manifest tree for independent replay. These records do not provide complete native binary SCA, an instruction-level macro proof, a device SQLite version query or a complete SBOM.

DELETE rollback journaling can reduce concurrency compared with WAL. A busy operation is surfaced and can be retried; physical performance and abrupt power-loss behavior were not measured. This mitigation avoids the affected WAL configuration; it does not patch vendored SQLite or claim that rare corruption, physical power cuts, Android/iOS devices or store acceptance were tested. Existing JavaScript advisory release blockers, production signing/disclosures and device acceptance remain separate.

## Primary source basis

- [SQLite WAL-reset bug and affected/fixed versions](https://sqlite.org/wal.html#walreset).
- [SQLite journal_mode effective result and transaction constraints](https://sqlite.org/pragma.html#pragma_journal_mode).
- [SQLite synchronous modes, DELETE/FULL versus EXTRA durability](https://sqlite.org/pragma.html#pragma_synchronous).
- [SQLite transactions and locking](https://sqlite.org/lang_transaction.html).
- [Expo SQLite configuration](https://docs.expo.dev/versions/latest/sdk/sqlite/). The installed plugin’s both-platform string option, Android Gradle/CMake route, iOS podspec and native transaction implementation were inspected directly; no SDK upgrade or vendor fork was introduced.

Canonical workout/science files and their native snapshots are unchanged by this mitigation. Publication and final native results are recorded separately after this local source checkpoint; a local commit is not a deployment or store release.

## Current qualification and bounded follow-ups — 9 October 2026

This update leaves the source-checkpoint history above intact. Published source `8abfca45f1f910155011516eabffbebdf070821b` passed iOS unsigned Release simulator compilation and packaged inspection in run 37981546336, job 113993116703. Android job 113993116672 passed compilation and final packaged inspection, then failed SQLite build-route evidence collection because the CMake cache was missing. Collector repair and successful final-source Android route qualification remain pending; the prior NATIVE6 passing binary does not substitute for this evidence.

Two runtime follow-ups remain. Qwen can create new empty cache/model/attempt directories before a later mode qualification rejects an operation; this is a bounded refusal-contract gap. Failed initialization clears its retry promise without closing an already acquired Expo database wrapper, so acquired wrapper references can remain across retries. Focused refusal probes preserve existing records/files. No existing-file loss, SQLite corruption or native memory/OS leak was measured.

Official final NATIVE7 workflow artifacts remain available. Local repository retention of uncommitted validation and peer receipts is being recovered after workspace loss; this update does not claim all such files survived. Final compiler/artifact qualification and physical-device, power-loss, signing/store and complete native-SCA limits remain separate.

## Collector repaired and qualified — NATIVE8

Qualified application source `e85a1ad320ec23db29b337fdee10f41f1dc24962`, tree `890d598d36ee1f09a3ad67268275e2de16309a48`, passed native run37984196327 on Android and unsigned iOS Release simulator, including strict packaged inspection and SQLite build-route collection. Quality37984196434 passed31 reader fixtures,55/55 regression and3/3 production suites; its integration tree is identical.

The Android failure above is retained as source7 history. Aggregate/per-ABI compile databases now bind the exact vendor C entry to its actual working directory, cache and object. Identical validated copies deduplicate; real cache absence, conflicting macros/invocations, wrong ABI, outside inputs/outputs and distinct release objects still fail. Gradle dependency resolution matches assembly architecture/JVM inputs. All mobile/runtime/scientific source is unchanged.

Final source8 qualification is successful hosted execution of the strict collector and inspections. Official source/job/artifact metadata and raw Android/quality logs are retained under `docs/qa/native-compilation-2026-10-09/native8/ci/`. Fresh source8 ZIP bytes were not independently extracted or replayed after the execution interruption; the bounded source7 all11-privacy replay remains historical. No binary instruction, device PRAGMA, power-cut, physical-phone, distribution-signing or store claim follows.
