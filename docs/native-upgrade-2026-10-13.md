# Android installed-data reconciliation

The next candidate preserves the October 9 Movefield test install identity and
uses versionCode 2. Default Movefield and Grizzly prototype identities remain
separate. `EXPO_PUBLIC_NATIVE_LINEAGE=legacy-movefield` is explicit at prebuild
and Metro compilation. The current source is based on compact checkpoint
`0687bd95d0bac03cf6f7962f10e333d88cf12bb4`, whose final Pages release is
`af70de390d937db669322e9214c4ebc8b66cef8e`.

The migrator reads and authenticates the original chunked SQLite generation,
XChaCha20-Poly1305 envelopes and all history references. It interprets previous
versus installed restore journals without replacing the old platform keys or
database. Tombstones take precedence over stale AsyncStorage. A separate staged
AES-GCM snapshot holds the source and validated training/setup. Current writes
must pass readback before a completion receipt prevents later re-import.

History IDs/order, recorded amounts, unknown loads, accepted prescriptions,
pending proposals, events, custom exercises, active work, rest timing, setup,
timestamps, notes and superset metadata are retained. Schema 2 becomes 3. No
routine, target, date or progression is recalculated. Unknown future fields,
missing/corrupt records, absent/wrong keys, changed preparation sources and
coexisting current profiles stop the upgrade with originals intact.

Recovery shows the actual error and offers retry and an owner-requested original
snapshot without platform keys. Explicit erasure removes both the old database
and staged archive before dropping the corresponding keys. Grizzly never reads
Movefield's legacy store.

All 35 core groups and 26 migration groups passed. The latter use the historical
cipher, real SQLite transactions and real AES-GCM with mocked OS boundaries.
Cases include five interrupted-write points, restart/retry, whole/split history,
AsyncStorage-only records, stale deleted profiles, interrupted restores, missing
keys/history, unknown fields, profile/source conflicts and a history over 5 MB.
Both static builds, four default/Grizzly Hermes exports and one Android upgrade
export passed. Two source archives contain 244 verified files each. These are
source and runtime checks, not compiled installer or physical-device proof.

The manual **Current Android test installers** workflow records its exact source,
compiles each app, runs Android lint/unit checks and inspects the actual manifest,
transport, complete backup/extraction exclusions and historical test certificate.
It is a development-signed test route. Existing upstream advisories and store
qualification remain open. The exact old/new APK installation test is the next
acceptance gate. Older Argon2id transfer-file import is a separate open task.

Exact qualification data is in `native-upgrade-validation-2026-10-13.json`.
