# M03 — recoverable native restore

Parent local checkpoint `8836240fcab12710edab852576a4dee54be302c7`. Source stays on the local integration branch; automatic approval review blocked pushing the new source/documentation. Last verified GitHub head remains `8cd39e42f2178b807d63af2042b70481041b028b`. No merge/deployment.

## Result

Native restore now keeps the previous and next encryption keys in a small SecureStore recovery item. Its ID is independent random data, never derived from key material. An AsyncStorage journal holds new ciphertext and SHA-256 fingerprints of the prior state/setup; it contains neither keys nor copied legacy plaintext.

A fresh module checks these persistent records before reads/writes. If ciphertext was not installed, it retains the old state/key. If installed, it activates the next key, retires the old setup, then removes the journals in an order that keeps keys available through interruption. A secure ring without a ciphertext journal represents either uninstalled preparation or completed finalization and is removed only when the active key matches one of the retained keys.

Cleanup denial preserves readable restored state, hides the captured obsolete setup and pauses edits until retry succeeds. Unexpected changes are retained and reported. Explicit reset clears state, setup and recovery items while preserving unrelated preferences. All ordinary reads now use the storage queue, including initial recovery; legacy migration remains compare-and-set and occurs outside its read transaction to avoid deadlock.

Existing XChaCha20-Poly1305 envelope, stable main storage keys and legacy/key-loss behavior remain compatible. This does not implement the S02 SQLite history migration or account sync.

## Verification

- `node scripts/check-native-storage.cjs`: passes existing cases and **eight independently reopened persistent-boundary snapshots**, from before preparation through secure-ring retirement. Fresh module instances have no original key cache/promise chain. Checks include previous/restored state, setup lifecycle, later save/reopen, scoped reset, both keys kept out of AsyncStorage and secure ring under 2048 characters.
- Additional cases pass for failed final key activation, cleanup denial/retry, unexpected record collision, legacy plaintext fingerprint privacy and existing key-loss protection.
- Native `npm run check` and product `pnpm lint`: pass.
- `npm run export:mobile`: Android/iOS Metro/Hermes exports pass. Both bundles are about 3.8 MB; generated bundles are ignored local outputs, not installable signed binaries.
- `git diff --check`: checked before commit.

The harness uses injected SecureStore/AsyncStorage and real cipher/hash functions. It does not prove real Keystore/Keychain failure semantics, OS power-loss durability or phone UI/keyboard accessibility. Physical Android/iPhone acceptance remains required. Temporary restore storage can be larger than one record; M04/S02 still address realistic capacity and database migration.

## Next

U06: verify Qwen assets, licenses, context/download/runtime limits for web and Android. U07: original provenance-aware exercise summaries, retrieval and held-out model evaluations. Actual inference and hardware qualification are U08/U09; do not mark model preference controls as inference.

Exact local checkpoint: `git log -1 --format=%H -- docs/native-restore-recovery-2026-10-08.md`. Push needs explicit approval for the concrete commit range; do not retry through another route.
