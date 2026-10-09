# Native older-copy cleanup — 9 October 2026

SEC2 adds persistent privacy status for the three owned legacy AsyncStorage training slots. A denied cleanup no longer disappears across a restart or masquerades as a failed encrypted save. The encrypted SQLite generation remains authoritative. Settings offers explicit retry, recovery screens show the warning, and reset reports older copies that remain.

This is source and harness evidence. Android/iOS OS storage, process termination, physical devices, screenshots and forensic erasure have not been qualified by these tests. Resolve the source checkpoint with `git log -1 --format=%H -- mobile/docs/native-privacy-cleanup-2026-10-09.md`; publication and exact-tree verification belong to the parent milestone report.

## Durable receipt and deletion boundary

`training_legacy_cleanup` stores only the owned slot, SHA-256 fingerprint and raw character count. The fingerprint is domain-separated by `movefield-legacy-utf16le-v1\0` and hashes lossless UTF-16LE code units. Distinct lone surrogates accepted by JSON parsing cannot collapse to the same UTF-8 replacement sequence. Hashing uses at most 256 KiB additional byte buffers and refuses to fingerprint values above the existing 48,000,000-character record limit. Legacy reads still use the installed AsyncStorage bridge and may allocate its entire returned string.

The first cleanup receipt commits inside the same exclusive SQLite transaction as the encrypted replacement or tombstone. A failed transaction rolls both back. An outstanding receipt is immutable: later saves never adopt a changed older value. If a previous SQL generation already exists without a receipt, a later write records an untracked null fingerprint; its legacy copy cannot be guessed to be the validated source. Historical untracked values, changed values, oversized values and denied reads are preserved.

Deletion requires all of the following:

1. A validated receipt for one of the three fixed training slots.
2. The exact current SQL head/draft value authenticated by storage, or a valid tombstone explicitly retiring that slot.
3. A fresh SQL snapshot that still equals that proof.
4. A fresh legacy fingerprint and character count that equal the oldest receipt.
5. A legacy removal followed by a successful read confirming absence.

Only then is the matching cleanup receipt retired. A cleanup-only mutation does not advance the training revision or invalidate its save comparison. A missing legacy value can safely retire a stale receipt after the SQL proof is checked. Denied removal, ineffective removal, failed receipt retirement and unavailable cleanup metadata cannot change an acknowledged save into a failure. A precommit failure to create a required receipt remains a save failure so an untracked install is not silently acknowledged.

Existing application writes share one JS-runtime lifecycle queue. The legacy compare/read/remove sequence is not an atomic compare-and-delete protocol against another OS process or unsupported external legacy writer. No multi-process or crash/power-loss guarantee is claimed.

## Inspection, retry and reset

`readLocalPrivacyStatus()` is read-only. Opening the database, inspecting status or exporting raw authoritative records does not authorize legacy deletion. A successful normal training read authenticates the complete history generation before retrying its exact head. A successful setup read validates the encrypted draft first. Explicit `retryLocalPrivacyCleanup()` verifies those same records; active restore journals remain subject to the existing secure key-ring recovery. Missing keys, failed authentication and corrupted tombstones preserve pending copies.

| Status | Meaning | User action |
| --- | --- | --- |
| `clear` | None of the three owned older training values was found. | No cleanup action is needed. This says nothing about exported files or forensic remnants. |
| `pending` | At least one matching receipted older value remains. | Explicit retry may retire it after the current generation is verified. |
| `attention` | A changed, untracked, oversized, unreadable or unverified copy must be preserved. | Keep earlier backups; retry does not authorize deletion of changed or unknown values. |
| `unavailable` | The cleanup journal/status could not be inspected safely. | The warning stays independent of the current training save result. |

Status counts are bounded to owned legacy values. Explicit retry additionally reports an unresolved current-generation verification as an attention/unreadable issue while preserving matching pending values. Status does not reveal contents, fingerprints, database paths or keys in the UI.

Reset still commits current-record/history tombstones before retiring the device keys. It returns the privacy status separately. Matching cleanup denied by the OS remains pending; changed or untracked copies remain attention. The UI says current records were reset and older local copies may remain. Tombstones prevent the retained legacy values from reappearing as current training. A corrupt tombstone is rejected rather than treated as deletion proof.

Changed older values are preserved in their original storage. The current recovery-copy export follows authoritative records and does not provide an editor/exporter for a separately changed legacy shadow. This milestone does not blindly delete those values, claim full erasure or remove unknown historical storage. A future reviewed recovery flow may offer separately bounded inspection/export of such copies.

## Native UI and public links

The global warning, Settings control and startup recovery warning are independent of save success/failure. Later operations and unmount invalidate stale privacy results. A failed restore/reset does not suppress an already pending save result. Public privacy and support links open only after a user action, catch link-opening failures visibly, and warn that public issues must not include private backups or health data. Destinations are the existing project [privacy notice](https://ghinz32-cloud.github.io/movefield/privacy.html) and [public issue tracker](https://github.com/ghinz32-cloud/movefield/issues). This does not assert app-store privacy approval.

## Validation

| Command | Result | Scope |
| --- | --- | --- |
| `node scripts/check-native-privacy-cleanup.cjs` | 22 scenarios pass | Actual source, real node:sqlite separate-connection transactions and crypto, injected legacy/SecureStore APIs. |
| `node scripts/check-native-privacy-ui.cjs` | 25 scenarios / 77 assertions pass | Compiled TSX callback execution with mocked native/storage hooks. |
| `node scripts/check-native-storage.cjs` | Pass | Existing eight fresh-module restore boundaries, key-loss/legacy/capacity behavior; explicit no-legacy privacy mock. |
| `npm --prefix mobile run check` | Pass | Native TypeScript. |
| `npx eslint mobile/src/native-record-store.ts mobile/src/storage.ts mobile/App.tsx mobile/src/settings.tsx` | Pass | Changed native source lint. |

The new real SQLite suite covers atomic receipt rollback at every first-migration write/precommit boundary; denied removal and reopen; explicit/authenticated retry; read-only inspection/raw export; changed or untracked copies; distinct literal lone surrogates; unreadable/oversized copies; committed-readback ambiguity; missing keys/authentication failure/corrupt tombstones; ineffective removal; failed receipt retirement; malformed/unknown/excessive journal rows; status read errors; stale proof refusal; setup and reset. Real SQLite/history/batch regressions are also rerun for the final checkpoint; their exact results are recorded in the parent validation report.

## Remaining platform limits

Record removal is logical storage deletion, not proof that flash, SQLite/AsyncStorage journals, OS backup remnants or previously exported files have been securely erased. SEC1's platform backup configuration remains separately subject to assembled-artifact and physical-device checks. A historical copy that cannot be identified safely stays preserved and visibly reported.

An app-switcher shield and screenshot policy are separate native lifecycle work. A JS AppState overlay cannot establish that the OS snapshot was covered at the required native callback boundary, and no new screenshot SDK was added here. After opening the app, decrypted training remains in JS memory and visible UI; this prototype does not implement biometric/app-lock authorization. Qualify native inactive/background snapshot coverage, supported Android screenshot flags and device behavior in a separate bounded milestone rather than representing the cleanup warning as those protections.
