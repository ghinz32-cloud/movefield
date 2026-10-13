# M02 — recoverable browser restore

Parent local checkpoint `271c63b660b2b8ef92e02d1106928d0d29eb7e5a`. Repository `ghinz32-cloud/movefield`; local integration branch tracks GitHub `audit/2026-10-08-quality`. This source checkpoint remains local pending explicit push approval; last verified GitHub head is `8cd39e42f2178b807d63af2042b70481041b028b`.

## Defect and result

Previously restore wrote a new IndexedDB key before replacing the localStorage ciphertext. JavaScript rollback handled a thrown error, but a browser shutdown between those steps could leave the previous record with the wrong key.

Restore now prepares a durable IndexedDB journal containing the two non-extractable keys, the new ciphertext, and SHA-256 fingerprints of previous records. It never duplicates plaintext, including legacy plaintext slots. The single localStorage record write selects whether recovery retains the previous key or finishes the restore. Activating the chosen key and retiring the journal happen in one IndexedDB transaction.

Every queued read/write first recovers pending work. An uninstalled restore retains previous records; an installed restore completes key activation and obsolete-draft cleanup. Cleanup denial retains the journal, permits reading restored records, ignores captured obsolete drafts and pauses mutations until cleanup succeeds. Unexpected concurrent changes pause recovery without overwriting them. Confirmed reset clears the records, journal and keys. Unrelated preferences remain untouched. Original encryption format, stable keys/slot identity and legacy readability remain compatible.

Actual browser restore requires Web Locks. Unsupported browsers reject restore before modifying records instead of pretending a per-page queue protects multiple tabs. Existing stale-save/restore expectations remain in place. This bounded fix precedes S01's broader transactional record-store migration.

## Tests

`node scripts/check-browser-vault.cjs`: **115 assertions pass** using real Node Web Crypto AES-GCM/SHA-256 and injected persistent key/storage stores. Independent disk snapshots are reopened in fresh vault instances before/after journal, ciphertext, obsolete-slot cleanup and final atomic key/journal commit. They assert previous/restored main-record readability, matching setup lifecycle, scoped cleanup, non-extractable keys and subsequent save/reopen. Also covers preparation quota failure, finalization failure, cleanup denial/retry, unexpected concurrent changes, key-lost explicit restore, unsupported Web Locks and legacy-plaintext journal privacy. Existing tamper, slot binding, stale-write and legacy cases continue to pass.

`node scripts/check-transfer.cjs`: **45 assertions pass**, preserving protected/plain formats and restore guards. `node scripts/check-security.cjs`: **29/29 pass**, preserving schema validation and HTTP/security restrictions.

Web TypeScript, product lint and whitespace diff checks are required before the commit. The first type run exposed an IndexedDB generic return-type mismatch; it was corrected and the relevant checks rerun. No native shared files change: browser-vault is a web adapter, not a canonical shared training module.

## Limits

The focused harness injects key/storage persistence; it does not emulate an OS power loss or prove actual IndexedDB/browser transaction durability. Secure-context browser restore UI and physical interruption tests remain M08/M09 acceptance work. Browser eviction/disk damage can still remove data; user export remains necessary. No cloud sync, complete database migration, model inference, merge or deployment is claimed.

## Checkpoint and next

Resolve the exact local commit using `git log -1 --format=%H -- docs/browser-restore-recovery-2026-10-08.md`. Automatic approval review blocked source export to GitHub; do not infer push success. Next M03: equivalent native restore recovery with fresh-module SecureStore/AsyncStorage boundary tests, then U06 Qwen model/runtime verification.
