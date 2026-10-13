# Older backup compatibility and Android delivery

Both brands can preview the original version 1 password-protected
`movefield-transfer` files in Settings. The reader uses the historical writer's
exact Argon2id settings, Unicode NFC password normalization and authenticated
XChaCha20-Poly1305 header. It rejects changed ciphertext, unsupported settings,
future fields and oversized input before replacing anything. The cipher/KDF
loads only when opening an older transfer.

The source fixture was made with the unmodified `transfer-bundle.ts` writer at
`9cdcec081bee3525838ac334da1bb48de6690f13`, blob
`e5b0cbefa4a32d6113252d952f123fc1dac38455`. It contains only synthetic workouts
and a public synthetic password. Both `phone` and `web` originals are retained
in `scripts/fixtures/legacy-transfer-v1.json`.

The preview preserves plan IDs/dates/targets, history, timestamps, notes,
supersets, unknown loads and individual-set RIR. Only the older state schema
number changes from 2 to 3. Acceptance replaces the current private profile
using its current vault. No automatic brand import or record merging occurs.
Current active workouts, unfinished setup and pending uploads block the
replacement. A profile change after preview requires a new preview. Native
writes use verified encrypted records with transaction and failure rollback.
Original historical device records remain separate and intact.

In the native recovery screen, resolve unreadable on-device records first;
older transfer import is available after the current profile opens. This
milestone does not silently bypass an unresolved legacy migration.

## Compiled Android delivery failure

Run `38443547677`, exact source `08e079fd0c9b91c4e47b47d8059e6cf2376699db`,
successfully compiled, linted and unit-tested both release-variant APKs. Final
inspection failed on the previously unlisted
`expo.modules.webbrowser.BrowserProxyActivity` and then identified the unused
`ACCESS_WIFI_STATE` permission.

The exact installed Expo WebBrowser 57.0.3 manifest and Kotlin implementation
show an internal custom-tab trampoline. Its compiled declaration is explicitly
non-exported, has no intent filters, uses `singleTop` and the `.webContainer`
task affinity. The inspector now verifies those boundaries and rejects
exported, disabled, altered-task, filtered, duplicate or unknown components.
Expo Network 57.0.2 and Better Auth Expo 1.7.7 use the network-state listener;
the app does not call the Wi-Fi IP-address API. `ACCESS_WIFI_STATE` is blocked
at manifest merge while `ACCESS_NETWORK_STATE` remains.

The metadata fixture is from the retained actual CI compilation evidence.
`resources.txt` retains only the exact two security-resource records and their
package context. The test first refuses the original compiled permission set,
then validates the expected removal and eight malicious boundary changes.
Fresh APK inspection remains a distinct CI step.

## Validation and limits

`check-legacy-transfer.cjs` passes 32 checks with the golden files, real
Argon2id/XChaCha20-Poly1305, current AES-GCM and SQLite, and mocked OS stores.
`check-legacy-native-upgrade.cjs` still passes all 26 migration groups.
Both are retained in the core verification gate, alongside the component
inspection regression. Web and native types, both static builds and fresh
Android/iOS exports are checked separately.

No physical old/new APK installation, OS keychain, restart, background
notification, iPhone/store or full product acceptance is implied. The canonical
task register, next-block/starting-baseline editor and connected-service gates
remain open. Final source, Pages and installer receipts are recorded in the
matching publication file.
