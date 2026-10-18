# Security, privacy and data integrity audit — 18 October 2026

The current audit reproduced three defects in recovery or optional server dispatch and corrected them. Ordinary saved workout reads and whole-state backups were not generally broken. Two defects affected less common recovery paths; the third affected the optional AI service if enabled. No live service, account, credential or user training record was used in these tests.

## Scope and evidence

The baseline was `ca96011ac53b7d544856281a175cfee0859ca844` on `codex/comprehensive-audit-2026-10-18`. The root audit captured 58 core groups before authorized source repairs: 57 passed and one failed on an outdated Grizzly UI test expectation. Its receipt is `.sites-runtime/comprehensive-audit-2026-10-18/core-check-receipt.json`; it is baseline evidence, not a claim that all repaired source passed a final release gate. Security-related baseline groups passed, including encrypted records, cloud API, sync/retry, vault/history, native storage, historical upgrade, setup compare-and-swap and large-record recovery.

This workstream freshly inspected canonical record storage, actual browser/SQLite backends, native key/storage/migration code, backup/rotation/import boundaries, authenticated cloud ownership, retry outboxes and coaching authority. Its initial 22-file source map is `security/baseline-source-hashes.json` under the same ignored workstream. The earlier 16 October report was background; none of its receipts was relabeled as a fresh test. Browser end-to-end save, quota, stale-tab, rotation and setup checks belong to the current web audit. Dependency/package and published artifact checks belong to the release audit.

## Reproduced findings and corrections

### S-01 — P1 recovery path: repeated failed replacements could produce an unrestorable original-record bundle

**Original trigger:** create a valid 5,000-workout archive; twice attempt replacement through a fresh writer while its legacy/cache projection fails after the record transaction. At baseline, `lib/record-state.ts` restored the old root but kept every newly encrypted row. The exact current state remained readable, but the original-record exporter included 15,000 same-vault rows. Its 17,186,664-byte bundle was below the 32 MiB byte limit yet exceeded the decoder's 10,000-row bound and could not restore.

This affected the original-record recovery export after repeated projection failures, not every ordinary unlocked backup. Original failure evidence is `security/recovery-orphans-result.json` with a controlled memory backend and real schema/AES-GCM writer/exporter/decoder. The baseline source hash is recorded there.

**Correction:** `lib/record-state.ts:85` uses transaction-returned introduced keys. `lib/sql-records.ts:10` and `lib/browser-records.ts:14` compute those keys inside the successful expected-root transaction. On projection failure, restoring the previous root and removing only that transaction's newly introduced ciphertext happen atomically. A preexisting identical row key, unrelated original orphan, other vault or newer writer's root/rows is retained. An aborted rollback deletes nothing. Native portable restore forwards both the cleanup argument and transaction result at `mobile/src/storage.ts:129`.

**Fresh verification:** `scripts/check-record-rollback.mjs` passed 8 actual SQLite groups and 8 actual Chromium IndexedDB groups, including 5,000 historical workouts and two failed replacements. The preserved recovery bundle decoded to the exact state, including unknown loads, notes and RIR. Tests explicitly cover an initial null root, identical existing key, unrelated ciphertext, a newer root adopting the attempted write's rows, and a real transaction abort. Receipt: `security/record-rollback-fixed.json`; log: `security/record-rollback-fixed.log`. Chromium retained its sandbox. SQLite uses the actual shared adapter; this does not qualify the native OS bridge.

**Remaining compatibility bound:** the correction prevents new rollback debris. It does not mutate a previously downloaded 15,000-row file, automatically prune old unrelated rows, remove the 10,000-row/32 MiB limits or guarantee recovery from arbitrary corruption. Keep such originals intact. When the current profile still opens, export a verified ordinary backup; a separate, explicitly reviewed recovery conversion would be needed for an already oversized original-record bundle. This audit did not perform that conversion on user data.

### S-02 — P1 before optional AI activation: consent could change during quota awaits before dispatch

**Original trigger:** an otherwise eligible coaching job was claimed, then consent was revoked, the cloud profile was deleted, or its revision changed while the two quota reservations awaited storage. The old worker still dispatched one provider request in each case. Its existing final publication guard correctly withheld the stale answer, but that could not undo the sent facts.

Original evidence: `security/consent-dispatch-result.json`. This used actual `runCoachingJob`, fact validation and SQL against real Node SQLite, with controlled quota completion and a synthetic `fetch` capture. There was no live provider or external request.

**Correction:** `lib/server/coaching.ts:18` checks the running job's current owner profile, deletion state, consent/version and profile revision after both quota reservations and immediately before dispatch. The existing postresponse check at line 26 remains. A blocked job clears its input through the existing cancellation/stale/failure handling. Budgets are not refunded or retried ambiguously.

**Fresh verification:** `scripts/check-coaching-dispatch.cjs` passed five cases: revoked consent, deleted profile and newer revision each produce zero provider calls; a normal current job makes one call and publishes only validated fact IDs; revocation after dispatch starts makes one call but publishes no result and retains no prompt in the job. Receipt: `security/consent-dispatch-fixed.json`.

**Precise boundary:** this validates authority at the last database decision before dispatch. It does not promise that revocation can recall an already transmitted request or eliminate all distributed timing intervals after that decision. The offline coaching engine remains local; its future selection adapter remains unconnected. Deployment/provider readiness, retention terms and live consent flows are separate gates.

### S-03 — P1 native recovery path: the original-file action could omit all post-upgrade workouts

**Original trigger:** upgrade a historical Movefield database, save a new workout and changed profile, then call the recovery action's `originalSavedFile()`. Because the old database is deliberately retained after migration, the exporter always chose it. The fresh reproduction had two current workouts but exported only the one pre-upgrade workout and old profile name; it omitted the modern root entirely. The ordinary `encryptedLocalBackup()` still included current data.

Original evidence: `security/legacy-export-result.json`, using actual historical XChaCha decryption, migration, SQLite, AES-GCM, storage save and legacy export/decode. SecureStore/filesystem adapters were mocked; this was not an installed-device upgrade.

**Correction:** `mobile/src/storage.ts:101` waits for existing personal writes and prefers the current encrypted root/bundle whenever one exists. An unmigrated/no-modern-root profile retains the legacy recovery export. The exporter does not need to decrypt the current records and does not delete retained legacy files or key material.

**Verification:** three new groups in `scripts/check-legacy-native-upgrade.cjs` check unmigrated fallback; exact post-upgrade workout/profile inclusion; and preservation of the current ciphertext plus index cache when the root ciphertext is damaged and the current device key is absent. They also assert that historical files remain byte-identical and read-only. The stable full historical-upgrade suite passed **48 groups** at `2026-10-18T14:55:38.657Z` (including these three); see `security/legacy-upgrade-final.log` and `security/focused-verification-pre-sync.json`. The receipt separately marks the final shared synchronization/native portable-restore regression still pending at its capture time. The first run reached these assertions successfully but encountered a concurrent release-version edit in the existing synthetic identity gate; that failure log is retained and is not counted as a passing suite.

## Focused verification status

| Check | Fresh result | Exact scope |
| --- | --- | --- |
| Record rollback, default mode | 16 groups passed | Eight real SQLite groups, including 5,000 records, and eight real browser IndexedDB groups; final canonical hashes still match the full receipt. |
| Record rollback, `--node-only` | 8 groups passed | Explicit portable core mode; it writes a separate receipt and does not claim browser execution. Full default mode remains a release gate. |
| Optional coaching dispatch | 5 cases passed | Real SQLite and actual job/fact code; provider is a synthetic capture, no network. Final source hash still matches. |
| Legacy native migration/recovery | 48 groups passed | Includes three new original-export checks; actual cipher/SQLite, mocked platform APIs and synthetic identity outputs. This run preceded the final shared-record sync; the root final core run qualifies that final integration. |
| Native encrypted storage adapter | Passed after shared sync | Existing key recovery/sample/erase checks plus new exact failed-portable-import rollback assertion. |
| Web and native TypeScript | Passed | Type correctness, not physical device validation. |
| Canonical/native record files | Exact byte parity | `record-state.ts` and `sql-records.ts` after root synchronization. |

The consolidated receipt is `.sites-runtime/comprehensive-audit-2026-10-18/security/focused-verification-final.json`. Original failure receipts, the pre-sync receipt and the mid-edit version mismatch log remain preserved. No final APK/web publication is asserted by this workstream.

## Authority and privacy review

| Boundary | Current source evidence and test coverage | Qualification limit |
| --- | --- | --- |
| Local encryption | Browser uses WebCrypto AES-256-GCM, 600,000-iteration PBKDF2-SHA256, fresh nonce and authenticated metadata; native uses Expo AES-GCM with platform key storage. Record IDs/types and exact ciphertext digests are checked before accepting history. Baseline vault/record suites and new rollback tests passed. | Code review and synthetic execution are not independent cryptographic certification. An unlocked process, compromised origin or compromised device can access decrypted data. |
| Recovery and erasure | Missing key and stable damaged records fail closed; writes are acknowledged after verification; current root CAS protects replacement; ciphertext removal precedes key erasure. Legacy raw files remain until explicit erasure. | Export file and recovery key must both be available where applicable. Filesystem erasure is not a physical secure-wipe guarantee. OS eviction, uninstall/reinstall, secure-store recovery and power-loss behavior require devices. |
| Browser passphrase rotation | Root-protected retirement removes superseded-vault database rows only after replacement acknowledgement. Cleanup failure is visible. Current setup draft adapter uses expected-value CAS and conflict recovery. | Current actual-browser verification is in the web workstream; this report does not infer it solely from old receipts. Already downloaded backups are unaffected by rotation. |
| Native/sample boundaries | Brand-specific native namespaces, separate sample storage, explicit personal erasure, exact expected-state checks for portable restore and generation guards remain. The portable restore wrapper now retains the record transaction's rollback receipt. | Native render/remount lifecycle fixes and actual callback tests are owned by the native workstream; no physical UIKit/Android storage claim. |
| Outbox and account ownership | Owner ID and expected revision bind encrypted retry operations; acknowledgement must match ciphertext digest; exact queued operation is checked before clearing. Browser locks and native serialized writes protect replacement. Youth/sample cloud checks remain. | A real account-switch/expired-cookie/device-backup exercise is still required before enabling services. |
| Optional server auth | Explicit readiness flags/bindings, verified Google ID token/JWKS issuer/audience, restricted return origins, secure production session cookies, account-context header, owner-scoped queries, fresh-session destructive actions and no arbitrary public API routes. Baseline cloud/auth tests passed. | Synthetic local Workers/D1/R2/auth tests do not establish that a particular Cloudflare/Google account, domain, callback or secret is configured. |
| Optional AI | Adult/consent/hold/mode/input restrictions, fixed existing fact IDs, strict response validation, bounded request/response, quotas, predispatch and postresponse ownership checks, no provider-error/prompt logging. | No live provider was activated or probed. AI cannot be described as a verified clinician, freeform training authority or fully private local computation when cloud dispatch is enabled. |
| Future coaching adapter | `lib/coaching-selection.ts` accepts only eligible current local context, expected digest/key and allowed optional message IDs; required messages remain. It sends no network request and cannot authorize training. | The caller must compute and retain the expected context digest; the unconnected adapter is not a deployed AI feature. |

No newly confirmed cross-owner disclosure, passphrase disclosure, sample-to-personal overwrite or cryptographic algorithm defect was found in the inspected paths. That is a scoped result, not a guarantee that every possible defect is absent. Focused logging review of storage/cloud paths found no newly introduced secret or training-record logging; release artifact scans have separate finite-pattern scope.

## Release and service gates

1. Run final integrated checks after canonical-to-native synchronization; attach exact source hashes and both-brand browser/native callback receipts. The baseline 57/58 outcome alone is insufficient for the repaired release.
2. Keep optional account/cloud/provider features disabled until live owner isolation, callback/session expiry, backup restore, account deletion, service quotas and provider retention/consent terms are qualified. Do not send real history merely to verify this audit.
3. Exercise an actual existing-install Android upgrade, interruption/restart, share-sheet/file picker and recovery-key workflow. iPhone/TestFlight and physical secure-store behavior remain unverified without the Apple/device setup.
4. Preserve originals for an already oversized/corrupt record bundle and validate any recovery conversion separately. The new prospective cleanup is not a historical repair tool.
5. Resolve or explicitly accept applicable production dependency advisories and maintain patch/rotation/deletion procedures; see the current release audit for exact reachability and fix availability rather than a blanket zero-vulnerability claim.

All fixture names, profile records, keys and provider captures in this workstream are synthetic. Owner `.openai/` files were not read or exported.
