# U05 — storage architecture decision

Reviewed 8 October 2026. Parent local checkpoint: `8229f76f45fa47518e5f201bb34139db991250b0`. Last verified GitHub head: `8cd39e42f2178b807d63af2042b70481041b028b`. The U04b push was rejected by automatic approval review for lacking explicit approval to export this source/documentation to the remote. No retry, bypass, merge, service provisioning or deployment is part of this decision.

## Selected design

Use an offline-first app with encrypted local transactional storage, a portable data model, and optional managed Postgres account sync. Prefer Supabase for the future managed Postgres/auth/private-object service. This selects an architecture; it does not create an account, incur charges, enable uploads or claim cloud sync works. Recheck provider terms, region, backup/restore and pricing at provisioning.

The first writes remain local. Web storage should move encrypted records and their non-extractable CryptoKey into one IndexedDB transaction. Native storage should migrate growing history from one AsyncStorage JSON blob to SQLite transactions, with authenticated encrypted entity payloads and a device key in SecureStore. SQLite may use SQLCipher in a qualified development/release build, but that is not supported in Expo Go. Existing storage identity and legacy reads remain intact during migration.

Source basis: [IndexedDB transactional/offline storage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [Expo SQLite and SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Supabase owner policies](https://supabase.com/docs/guides/database/postgres/row-level-security), [Cloudflare D1](https://developers.cloudflare.com/d1/), [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline). These are product documentation checked for this decision, not tests of this app.

## Existing locations

| Data | Current location | Boundary |
| --- | --- | --- |
| Browser training/setup | Five named localStorage slots in `lib/browser-vault.ts` | AES-GCM ciphertext; a non-extractable key in IndexedDB `movefield-vault` / `keys` / `data-key-v1` |
| Phone training/setup | `training-studio:mobile-local-demo:v1` and `training-studio:mobile-setup:v1` in AsyncStorage | XChaCha20-Poly1305 ciphertext; `movefield.dataKey.v1` in SecureStore |
| Appearance/settings | Separate browser/native local preference stores | Not a real user account or cloud history |
| Transfers | Files explicitly exported/restored through Settings | Protected format is portable; plain JSON remains an explicitly chosen option |
| Database stub | `db/schema.ts`, `db/index.ts` | Empty schema and optional D1 adapter; no app account/history backend |
| Qwen weights | Not downloaded | Future disposable model cache, separate from private workout history |

The current server rejects non-GET/HEAD methods. Keep that boundary until authenticated endpoints have a separate implementation and ownership tests. No existing sign-in preview proves authentication.

## Options compared

| Option | Benefit | Why selected or deferred |
| --- | --- | --- |
| Current localStorage/AsyncStorage snapshots only | Simple, offline and already encrypted | Keep as migration input. Whole-history writes, quotas and separate key/data commits are unsuitable as the final durable system; they do not provide cross-device recovery |
| IndexedDB + native SQLite + managed Postgres | Local atomic operations, structured history, portable SQL, ownership policies and account service | Selected. Requires implementing outbox/conflict/recovery flows; Supabase does not automatically make this app offline-first |
| D1 with a custom account backend | Fits the existing website worker platform | Deferred. The current D1 code is a stub; account lifecycle, multi-device authorization and sync would need a separate service design |
| Firestore | Built-in SDK offline persistence and realtime data | Deferred. Its document data model and conflict behavior require app-specific safeguards for completed workouts; the relational/portable model better fits this product's history and plan relationships |
| Cloud-only saves | One remote copy | Deferred. Poor fit for workouts without a connection and does not replace a local recovery flow |

The provider is replaceable behind a sync interface. No fixed price, unlimited capacity, free backup or zero maintenance claim is made.

## One recoverable data flow

1. Validate a set edit against the deterministic engine, current record revision and approved training context. Create an operation ID and device sequence.
2. In one local transaction, append/update the encrypted entity and append an outbox operation. Only then acknowledge the save. An app kill yields the previous committed version or the new version, never a mismatched key and payload.
3. Optional sync runs only after sign-in and explicit sync enablement. The server checks authenticated owner and expected revision, then commits an idempotent operation. RLS enforces owner visibility in addition to endpoint checks; service-role credentials never enter either client.
4. Mark the local operation acknowledged only after a valid server response. A timeout retries the same operation ID. It must not create duplicate sets/workouts.
5. Keep completed workout facts immutable through revision records. A concurrent plan/date/load change requires a visible conflict review; no silent last-writer-wins merge changes the accepted prescription. Deletion uses tombstones until authorized devices acknowledge it.
6. On a fresh device, authenticate and unwrap the account data key using an explicit user-held recovery secret/device pairing design. OAuth identity alone is not a decryption secret. Device keys remain device-local; cloud payloads are encrypted with a separately versioned sync key. Never upload a browser non-extractable key or a SecureStore device key. Lost recovery material must produce an honest recovery/reset choice, not a fake successful restore.
7. Keep export/deletion possible without cloud connectivity. Account deletion removes server data and revokes tokens; local deletion is a separate explicit choice. Provider backup retention must be documented at provisioning.

Minimum future entities: profile, accepted plan revision, scheduled session, active workout, completed workout revision, measurements, equipment context, preferences, outbox and deletion tombstones. Separate media/model caches from this store. No workout record, note or photo is used to train Qwen.

Browser storage can be cleared/evicted and a transaction acknowledgment is not a guarantee against every disk/power failure. Physical crash tests and user export remain necessary. SecureStore is for small secrets, not an encrypted history database. Native key-loss recovery must be explicit.

## Implementation sequence and acceptance

| Task | Bounded delivery | Acceptance |
| --- | --- | --- |
| M02 | Browser restore transition recovery before broad migration | Crash/reopen at each key/ciphertext/cleanup boundary; previous or restored main record readable; no unrelated slots changed; stale and active restore guards retained |
| M03 | Equivalent native key/ciphertext transition recovery | Fresh-module SecureStore/AsyncStorage interruption matrix; previous/restored record readable; key loss never silently overwrites data |
| S01 | Transactional web record store and idempotent legacy import | Commit/abort and quota tests, stale-tab revision checks, legacy keys preserved until verified readback; real browser acceptance |
| S02 | Transactional native history store | Schema migration, realistic large histories, interrupted commit and low-storage checks; Android build/device acceptance |
| S03 | Shared encrypted-entity/outbox and conflict contract | Duplicate/timeouts/two-device edit/delete cases; no silent rewrite of actual workout facts |
| S04 | Auth/owner schema and server tests, initially local | Two-user isolation including inserts/updates/deletes, anonymous denial and expired-session behavior; no production credentials |
| S05 | Provision and qualify optional account sync | Concrete tested build plus explicit service/release authorization; recovery-key UX, export/deletion, backup restore and real two-device test |

U05 acceptance is this justified decision and decomposed flow. It does not complete S01–S05. The immediate M02/M03 repairs should not require provisioning a cloud service.

## Verification and checkpoint

Reviewed the actual browser/native storage modules, empty database schema and HTTP boundary. Checked the official sources above and the decision against the retained product requirements. Documentation-only milestone: required paths/tasks and `git diff --check` are checked; no broad application rerun is presented as new evidence.

Resolve the local commit with `git log -1 --format=%H -- docs/storage-architecture-2026-10-08.md`. The push is blocked by automatic approval review, so do not call this a durable GitHub checkpoint. Continue M02 locally and request approval to push the concrete reviewed commit range when the result is ready.
