# S02 — incremental encrypted phone history

Completed workouts now have separate XChaCha20-Poly1305 encrypted SQLite records. The encrypted profile head holds their order and content fingerprints, plus the current plan and active workout. SQLite sees hashed workout slot names and ciphertext; keys remain in this device's SecureStore. Normal protected/plain transfers still serialize the validated complete training state.

Reads validate old plaintext and encrypted whole-profile snapshots before importing them atomically. Failed migration retains the previous source and key. An exclusive batch compares expected ciphertexts and the database revision, commits new/changed workouts and the profile head together, and verifies committed readback before removing matching legacy input. Removed workouts become tombstones. Restore rotates the device key, replaces all entities atomically, and retains the existing two-key recovery journal until activation finishes. Reset retires history and the journal before secure-key cleanup.

Current-session active edits reuse authenticated history only while the encrypted head, database revision and key fingerprint match. New, changed and removed workouts alone are written. Any managed record change invalidates that cache. Stale saves and restores refuse to overwrite a newer generation. A shared lifecycle queue protects first-key creation and restore preparation across module reloads within one JavaScript runtime. Save tokens advance only after the operation succeeds, so an old screen cannot overwrite an installed restore or resurrect a reset after failed key cleanup.

## Validation

- 45/45 application regression suites and 3/3 production suites pass; one additional prepared dependency-policy suite also passed outside this source checkpoint.
- Real SQLite integration: 27 scenarios / 192 assertions for legacy imports, reconstruction, append/edit/delete/order, corrupted/missing records, key loss, complete recovery copies, stale and concurrent modules, rollback, ambiguous acknowledgment and key activation/reset interruption.
- Batch backend: 13 scenarios, including every write/precommit rollback, committed readback ambiguity, mutable queued input, legacy cleanup, reset ABA, orphan retirement and 2,000 individually encrypted workouts / 24,000 sets.
- Retained 14 SQLite snapshot scenarios and eight native restore boundaries pass. Native capacity fixtures retain 312-session, Unicode and low-storage checks.
- Cached active-session saves with 3 and 2,000 completed workouts each use 18 fixed SQL SELECTs and three SecureStore reads, with zero history-row reads or writes. This measures the harness operation count, not phone latency. Full state validation/serialization still scales with total history.
- Web/native TypeScript, full product ESLint, the native engine, production build and Android/iOS Hermes exports pass. Exact source, log and artifact hashes are in `docs/qa/native-history-2026-10-09/validation.json`.

No packages were added. Existing shared 5M-character / 5,000-workout limits remain. Separate OS processes or JavaScript runtimes are unsupported; actual Android/iPhone storage, free-space, process-kill and power-loss acceptance still needs physical devices. An intact SQLite generation can be exported without its decryption key as a complete recovery-record bundle; damaged SQLite manifests/chunks can still prevent that export. Legacy plaintext may be preserved in a recovery copy, so the UI describes its privacy accurately. Recovery copies are not normal transfer files.

## Checkpoint and continuation

Repository `ghinz32-cloud/movefield`; existing review branch `audit/2026-10-08-quality`; verified baseline `d4f94890cf0c19c1bfb399d1080d615553e2f70a`. Resolve the local implementation commit with `git log -1 --format=%H -- docs/native-history-2026-10-09.md`. Recoverable history bundle: `.sites-runtime/checkpoints/s02-native-history.bundle`. Verify the published head, exact tree and report readback before calling it pushed.

Next: strict dependency release checks, then verified native model-file lifecycle without an inference claim. Actual secure-browser/phone acceptance, account/sync services, native build/inference and trained-artifact qualification remain. No main merge, live deployment or distribution occurred.
