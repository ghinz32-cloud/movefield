# Transactional encrypted sync outbox

The optional browser record commit sync payload is sealed before the database
transaction. Local ciphertext, keys, record revision and the queued cloud
mutation commit in the same IndexedDB transaction. The queue uses a new
metadata row in the existing version 2 database; old records and restore journals
retain their identities. Failed outbox writes or a transaction abort preserve
both the old local generation and the old queue.

Each enqueue accepts at most 5,001 opaque encrypted records and 64 million serialized
characters. The queue splits them into at most 25 records and 1.1 million characters
per request; a state-head record is staged alone after its history entities.
Mutation UUIDs derive deterministically from a cryptographically random enqueue
UUID, preserving the RFC version/variant bits. Never-dispatched compatible
entity batches may coalesce. Attempted requests retain their exact UUID, remote
base revision and records, even after a timeout, lease expiry or reopen.

Only the exact movefield-sync v1 envelope is accepted: Argon2id 19,456 KiB / t2 / p1,
32 hex-character salt, AES-256-GCM, 24 hex-character nonce and base64 ciphertext.
Passwords, raw keys, plaintext workout objects, extra fields and email-shaped
account identifiers are refused. Account-scoped metadata contains no credential.
The outbox does not authenticate/decrypt ciphertext; the vault owns that step.

Cross-tab claims commit before transport. A receipt clears only the currently
leased matching UUID/base revision and advances the remote revision by exactly
one. Older receipts/failures cannot clear or modify a newer mutation. Transient
failures retain pending ciphertext with exponentially increasing delay capped
at five minutes. Authentication errors pause until reauthentication; revision
conflicts and malformed receipts require explicit resolution. Queue claim and
acknowledgement never advance the local training record revision.

Removing or replacing a local key invalidates pending queues atomically while
retaining known remote revisions. A fresh supplied sync payload can enqueue the
approved replacement in that same transaction. Account disconnect can invalidate
only that account's pending data. A network request already dispatched cannot
be un-sent; the integrating lifecycle must abort transport on disconnect/reset
and queue an approved cloud tombstone or replacement where appropriate.

Validation: scripts/check-sync-outbox.cjs passes nine scenarios / 68 assertions,
including real WebCrypto local ciphertext and actual fake-indexeddb transactions,
post-request abort/quota, 5,000 entity bootstrap, concurrent claims, stale receipts,
timeout/response loss, restart lease replay, account reset and cancellation.
Existing browser record storage 76 checks and transactional vault 24 scenarios /
163 checks pass. Web TypeScript passes. These are focused storage/transport
harness results, not deployed cloud, physical-device or OS interruption tests.

## Native transaction adapter

`NativeRecordCommit.sync` accepts the same sealed enqueue. The saved training
head/entities, outbox chunks/manifests and record revision commit in one checked
exclusive SQLite transaction. New outbox tables preserve existing training
record identities. The serialized queue is limited to 64 million characters and
chunked into 128 KiB rows with per-chunk and aggregate SHA-256 receipts, avoiding
Android's single-row read-window limit. Every new transaction reads and enforces
DELETE journaling and synchronous EXTRA before application SQL.

`clearHistory`, explicit `clearSync`, and main-profile tombstones invalidate
pending queues atomically. A supplied replacement sync envelope can enqueue
inside that same approved restore. Queue claim/ack/failure updates preserve the
training revision. Corrupt outbox chunks fail sync closed while local training
remains independently readable/exportable. Native accounts remain unconfigured;
this adapter does not claim native account enrollment or real cloud sync.

Six new real host SQLite scenarios / 54 assertions pass, covering chunk size,
readback, every write/precommit rollback, initialized-store lease contention,
stale acknowledgements, fresh unqualified-mode refusal, reset and corruption.
Retained native record batches (13 scenarios), SQLite journal policy (7 groups),
SQLite storage (14 groups), legacy cleanup (22 groups), and incremental native
history (27 scenarios / 192 assertions) pass. Web TypeScript, focused strict
TypeScript for the native adapter and scoped lint pass. Host SQLite models the
qualified native connection default of 3. This is not physical phone, native
OS process termination, power-loss or deployed account-service acceptance.

Canonical `lib/sync-outbox.ts` and the included mobile shared copy match. The
root integration must add this shared module to the generation manifest and
regenerate snapshots together with the parallel history-capacity milestone.
