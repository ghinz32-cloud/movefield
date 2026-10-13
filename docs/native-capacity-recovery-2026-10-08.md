# M04 — native capacity guard and failed-save recovery

Parent local checkpoint `a36fc005b3a68e1d4249096c6391819171d4ab25`. Review branch remains `audit/2026-10-08-quality`; this continuation uses isolated local branch `audit/2026-10-08-resume`. The earlier session continued writing to its checkout, so this work preserved it and incorporated completed U07/M05/M06 checkpoints before recording M04. Last independently verified remote head: `8cd39e42f2178b807d63af2042b70481041b028b`. No push, merge or deployment.

## Problem and behavior

The native starter saves the complete state as one AsyncStorage value. Its XChaCha20-Poly1305 envelope encodes ciphertext in hex, so UTF-8 payload bytes roughly double before storage. A shared import-size check in JavaScript characters does not establish that the encrypted row is readable on Android. The installed AsyncStorage 2.2.0 Android configuration uses a default 6 MiB database limit; free space, row read windows and other app records impose additional constraints. This backend is an interim snapshot store, not the selected long-term history database.

`mobile/src/local-crypto.ts` now calculates the exact byte count of its existing envelope, including nonce and authentication tag. `mobile/src/storage-capacity.ts` rejects projected records above **1,750,000 bytes** before creating keys or mutating state/setup/restore journals. This conservative product limit applies to both phone platforms until S02; it is not a measured device quota or a guarantee that smaller writes succeed.

The old ciphertext/key stays unchanged when this preflight rejects a write. Readable legacy records above the new write limit are left in their original format rather than migrated into a larger unreadable encrypted row. Startup opens valid saved history without rewriting it merely because the app launched.

On any asynchronous save failure, current validated edits remain in memory. The UI shows a recovery panel, gives transient failures a full-size Retry save action, and takes Export current records to Settings. Transfer/backup controls move before Appearance during recovery. The existing password-protected transfer and explicitly labeled plain backup use current in-memory state, including edits that failed to persist. Closing the share sheet is not proof the file was saved. A capacity failure does not offer a misleading endless retry of the same oversized record.

No workout history is truncated, silently pruned or uploaded. The storage slots, cipher format and deterministic training rules are unchanged. The guard does **not** increase history capacity. Transactional encrypted SQLite entities, tested legacy migration and real-phone capacity tests remain necessary under S02.

## Validation

| Check | Result |
| --- | --- |
| `node scripts/check-native-storage.cjs` | Pass: existing eight fresh-module restore boundaries, key-loss/tamper/legacy cases, plus exact encoded boundary/Unicode size, large history, oversized save/restore/setup, disk-full/retry and export preservation |
| Synthetic 312-session history | Saved and reopened with all sessions; encrypted record **1,658,824 bytes**. This one fixture represents a session count equivalent to two years at three sessions/week; it is not a universal year/workout capacity |
| Oversized valid Unicode history | Accepted by shared data validation, refused by native write preflight; previous key/ciphertext intact, no restore journal started, current state still exportable |
| Injected `SQLITE_FULL` below the guard | Save rejected; previous record opened in a fresh module; retained edit saved after fault removed |
| `npm run check` in `mobile` | Native TypeScript pass |
| Root `npm run lint` | Pass with no errors/warnings |
| `npm run test:engine` in `mobile` | Pass, including 78 plan choices across all seven starting weekdays, 989 exercises/guides, crypto and transfer behavior |
| Shared, security and transfer checks | Shared hashes pass (33 before integration, 36 after U07 incorporation); security 29/29 and transfer 45 pass |
| `npm run export:mobile` in `mobile` | Android/iOS Metro/Hermes exports pass, including the final recovery-control ordering |
| `git diff --check` | Pass before checkpoint |

These tests use in-memory AsyncStorage/SecureStore stand-ins with fresh-module reopen and injected failures. They do not establish actual Android CursorWindow/quota/Keystore behavior, OS power-loss durability, phone rendering, keyboard/font scaling/TalkBack acceptance or a signed installable build. Final integrated validation follows in V01; inherited tests are not relabeled as fresh physical-device results.

## Checkpoint and continuation

Resolve the exact local commit with `git log -1 --format=%H -- docs/native-capacity-recovery-2026-10-08.md`. Its saved code and this report are local; the prior automatic-review push rejection remains in force until explicit approval to export the concrete range. Keep the task list and current handoff updated. Next: V01 integrated validation, then bounded U08 web runtime/download work; S02 remains the required long-term native capacity repair.
