# S01 — transactional encrypted browser storage

The browser app now stores its encrypted training and setup snapshots with their non-extractable AES-256-GCM key in IndexedDB `movefield-vault`, version 2. Records, key changes, migration metadata and deletion tombstones commit in one transaction. A failed request or aborted transaction never acknowledges a successful save. Browser model files remain in their separate disposable cache.

Encryption and hashes are prepared before opening a write transaction. The transaction compares the expected global revision, key epoch, ciphertexts, tombstones and migration hashes before writing. The existing origin-wide Web Lock remains required for mutations. Without it, existing reads and exports remain available while saves, restores and resets refuse to change data.

Legacy import first finishes the existing restore journal. It seals plaintext outside the transaction and preserves existing ciphertext byte-for-byte. A fresh transaction verifies the imported records before matching legacy inputs may be removed. Failed cleanup cannot resurrect an old history or draft after reset/discard because the committed migration marker and tombstones remain authoritative. An unreadable optional encrypted setup is retained unchanged without blocking a readable main profile. Lost-key records are never assigned a replacement key automatically; an explicitly accepted transfer can replace them atomically.

The app loads paired ciphertext/plaintext snapshots, uses the committed raw token for stale-save/restore checks, and listens for other tabs through BroadcastChannel with a per-instance sender ID and focus fallback. Its own migration notifications cannot cause a false conflict. Sample-only reset preserves the real profile's token. Storage failure is presented as unavailable storage, rather than an empty profile; locked-copy export is shown only when bytes are available.

## Validation

- 43/43 regression suites, 3/3 production suites, web TypeScript, full product ESLint and the production build pass.
- 76 low-level record-store assertions and 24 actual vault scenarios / 163 assertions use fake-indexeddb transactions and real WebCrypto. They cover commit/abort/quota failure, stale in-flight writes and transfers, six legacy restore interruptions, missing keys, damaged setup, denied legacy cleanup/access, tombstones, reopen and large records.
- 133 retained legacy-vault assertions pass; eight compiled actual Home callback scenarios check database hydration, autosave/restore tokens, stale-tab refusal, sample reset, own migration notifications and unavailable-storage recovery.
- The initial JavaScript graph is 397,290 gzip bytes, within the existing 400,000-byte budget. The generated offline manifest and production checks pass.

Exact source/log hashes, fresh generated reports and suite results are in `docs/qa/browser-storage-2026-10-09/`. Historical generated reports were restored unchanged after their fresh copies were saved. No new dependencies were added.

This completes the transactional browser **snapshot** milestone, not incremental entities or unlimited history. Existing 5M-character / 5000-workout guards remain. Real secure-browser disk/quota/eviction/power-loss acceptance remains pending; fake-indexeddb is not a physical browser. Phone acceptance, optional accounts/sync, native Qwen, final trained-artifact qualification and two dependency advisory roots still block a release. No main merge, live deployment or new service was performed.

## Publication and continuation

The prior complete audit was published as `07e540dcfe8bcd9339651db868f9a07184b4d49a` on `audit/2026-10-08-quality`; its tree exactly matches preserved local `22a208b10a7cb8a726478617ae6d70fee1210b3b`. The owner explicitly approved GitHub commit creation and this source/audit evidence on 9 October 2026. The previous automatic approval blocker is resolved. Local history was reconciled with that verified publication without changing its source tree.

Resolve this storage implementation checkpoint with `git log -1 --format=%H -- docs/browser-storage-2026-10-09.md`. Verify the current remote head/tree and report readback before claiming publication. Preserve the full-history bundle in `.sites-runtime/checkpoints/`. Next: decompose S02 incremental native entities, then obtain real secure-browser/physical-device acceptance. Keep existing data recovery and disabled recovered training adapters intact.
