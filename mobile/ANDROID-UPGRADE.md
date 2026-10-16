# Android update candidate

The `legacy-movefield` build targets the repository's October 9 test installer,
`com.ghinz32.movefield`, with versionCode 8 (Movefield version 0.1.7; the previous published release used versionCode 7). It uses the existing Expo test
certificate. The default Movefield and Grizzly prototype identities remain
separate. This source configures Grizzly 0.1.6/code 7; a version declaration is not
a compiled or published installer. Do not uninstall the earlier app to install this candidate.

`EXPO_PUBLIC_NATIVE_LINEAGE=legacy-movefield` must be set for both Expo prebuild
and the Gradle/Metro compilation. It cannot be combined with the Grizzly variant.
The repository's **Current Android test installers** workflow sets both values
and records the exact checked-out source, compiled manifest and signing digest.
The workflow configuration identifies branches whose native-source pushes compile
both flavors from that exact pushed commit. Manual builds accept a reviewed exact
source commit through `source_ref`. Root documentation-only checkpoints do not rebuild installers.
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
The owner confirmed that the previous Movefield 0.1.6 Pages download installed
on a Samsung S24 Ultra and opened with saved workouts present. This does not
qualify the redesigned 0.1.7 build, complete record integrity or other devices.
Grizzly is a separate installation and does not import Movefield records.

Settings can also preview version 1 Argon2id/XChaCha password-protected
`movefield-transfer` files from the historical phone or website. Enter the
original transfer password instead of a recovery key. Only explicit acceptance
replaces the current profile. Active workouts, unfinished setup, pending uploads
and records changed since preview block replacement. Unsupported fields and
failed writes leave the current records intact. This import uses the current
device vault and does not merge the two brands automatically. See
`docs/transfer-compatibility-2026-10-13.md` for verification and limits.
