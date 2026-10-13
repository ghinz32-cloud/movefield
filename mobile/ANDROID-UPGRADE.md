# Android update candidate

The `legacy-movefield` build targets the repository's October 9 test installer,
`com.ghinz32.movefield`, with versionCode 2. It uses the existing Expo test
certificate. The default Movefield and Grizzly prototype identities remain
separate. Do not uninstall the earlier app to install this candidate.

`EXPO_PUBLIC_NATIVE_LINEAGE=legacy-movefield` must be set for both Expo prebuild
and the Gradle/Metro compilation. It cannot be combined with the Grizzly variant.
The repository's **Current Android test installers** workflow sets both values
and records the exact checked-out source, compiled manifest and signing digest.
Reviewed native-source pushes on the `codex/native-upgrade-2026-10-13` and
`codex/native-delivery-2026-10-13` branches compile both flavors from that exact
pushed commit. Root documentation-only checkpoints do not rebuild installers.
This public repository uses standard hosted Linux runners.

On first opening, the upgrade reads the previous chunked SQLite database and
XChaCha20-Poly1305 envelopes. It resolves installed versus uninstalled restore
journals without modifying old keys or files. It validates all referenced
workouts and refuses any field the new schema cannot preserve. Only schema 2's
version number changes to 3. It does not choose new loads, dates or progression.

A separate AES-GCM encrypted stage retains the complete old snapshot and
validated training/setup. The current state and setup must pass readback before
the upgrade receipt completes. Failed writes resume from that stage. Original
SQLite records and SecureStore keys remain until explicit owner erasure. The
recovery screen shows the actual failure and allows retry or sharing the original
record snapshot without platform keys.

Local tests use the historical cipher and real SQLite transactions with mocked
OS boundaries. Successful prebuild or Hermes export does not prove an installed
Android update. Acceptance still requires installing the exact new signed APK
over the exact old APK, verifying synthetic history, active workout, setup and
rest timing, restarting offline, and checking device notifications/erasure.
The user's exact installed APK is still unconfirmed. Grizzly is a separate
installation and does not import Movefield records.

Older Argon2id password-protected `movefield-transfer` files remain a separate
compatibility task. This milestone migrates on-device records and does not claim
that the current backup screen reads those older transfer files.
