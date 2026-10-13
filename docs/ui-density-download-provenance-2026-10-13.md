# Android download provenance and update compatibility — 13 October 2026

Inspected read-only against current source `7b489c929d7188e8cd8354116bc3ff1abfe84fb3` in `movefield-density`. No app identity, workflow, storage or artifact was changed; no build was triggered. The user’s exact installed APK has not been read from their phone, so the artifact below is the latest repository-produced candidate, not a claim about which file they installed.

## Finding

The last actual installable Android artifact comes from the separate `audit/2026-10-08-quality` branch, at `9cdcec081bee3525838ac334da1bb48de6690f13`. It predates the later workout-catalog, Grizzly and audit changes. The October 13 website publications, native source ZIPs and Hermes exports did **not** update this APK. A stale installed build therefore explains missing later features if the user is still using that artifact or an earlier one.

More importantly, the installed-build lineage and the current source lineage differ in both package identity and encrypted-storage formats. The current source cannot safely be relabeled as an in-place update merely by changing its Android package name.

## Last actual installable artifact

| Field | Verified value |
| --- | --- |
| Repository | `ghinz32-cloud/movefield` |
| Workflow | `.github/workflows/native-builds.yml`, **Native release compilation** |
| Run | [38007809566](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809566) |
| Branch | `audit/2026-10-08-quality` |
| Source commit | `9cdcec081bee3525838ac334da1bb48de6690f13` |
| Source tree | `45d6d18cc693a72179424c1936dd503bd7d09517` |
| Artifact name / ID | `android-arm64-preview-test-only` / `11652690887` |
| Created | 2026-10-10 00:19:35 UTC, **October 9 at 7:19:35 PM Chicago** |
| Expiration recorded by GitHub | 2026-11-09 00:19:33 UTC; not expired at inspection |
| ZIP bytes / SHA256 | 18,823,784 / `cd63f88a00a22096fe7b46df44364e5235a403b2ea624c0a2a1c80c74a141330` |
| Contained installer | `Movefield-arm64-test.apk` |
| APK SHA256 | `04fcca479f14746e94daca41b0f6ff007f470b592a8a964112dfb46cf96dbe38` |
| Package / version | `com.ghinz32.movefield`, versionName `0.1.0`, versionCode `1` |
| Architecture / Android SDK | `arm64-v8a`, minSdk 24, targetSdk 36 |
| Signing certificate | Android Debug, SHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` |
| Signing certificate SHA1 | `5e8f16062ea3cd2c4a0d547876baa6f38cabf625` |

Downloaded the existing artifact through the connected GitHub artifact API and independently hashed both ZIP and contained APK. The ZIP matches GitHub’s digest; the APK matches its included `SHA256SUMS` and separate compilation evidence. `source.txt`, `signing.txt` and `inspection.json` agree with the table. The separate compilation artifact `11652750621` has SHA256 `ff2849f9940bdf206b3f2d24858588f9346c74c69bdf6a14051121c72dbd260a`, also independently verified. No phone installation was performed.

The newer successful native run [38008838515](https://github.com/ghinz32-cloud/movefield/actions/runs/38008838515), at `f61cbd1e16705783d4105e3309eb33cb9b298948`, contains only `native-input-decision` (`11652296595`). A green native workflow can mean the input gate skipped compilation. It is not a newer APK. Repository run enumeration found no later native run through the October 13 inspection. GitHub releases enumeration was empty.

## Why the current source is not a drop-in update

| Boundary | Last actual APK source | Current source |
| --- | --- | --- |
| Default Android identity | `com.ghinz32.movefield` | `com.ghinz32.movefield.prototype` |
| Grizzly Android identity | No Grizzly flavor in inspected APK build | `com.ghinz32.grizzlyfitness.prototype` |
| SQLite file | `movefield-encrypted-records-v1.db` | `movefield-private-records-v1.db`; Grizzly prefixes `grizzly-fitness.` |
| Encrypted local data key | SecureStore `movefield.dataKey.v1` | SecureStore `movefield.local-vault-key.v1` |
| Recovery key/journal | `movefield.restoreKeys.v1`, `training-studio:mobile-restore:v1` | Key-ring records inside the new vault-key item, with distinct recovery flow |
| SecureStore accessibility | `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | `WHEN_UNLOCKED_THIS_DEVICE_ONLY` |
| Local cipher/envelope | XChaCha20-Poly1305, `{v,alg,nonce,data}` | AES-256-GCM, `movefield-vault` with authenticated vault ID/header |
| History head | `movefield-native-history-v2`, encrypted `entries` | `movefield-state-index` version 1 with authenticated ciphertext hashes |
| History address | `training-studio:mobile-history:v2:` + hashed workout ID | Ciphertext digest keys in encrypted-record rows |
| Owner transfer file | `movefield-transfer` version 1, Argon2id + XChaCha20-Poly1305 | `movefield-vault`, PBKDF2-SHA256 + AES-GCM for portable cloud vaults; native record bundle/recovery key for local backup |
| Main/setup logical slots | `training-studio:mobile-local-demo:v1`, `training-studio:mobile-setup:v1` | Same default names, but different physical database, key and envelope |

Sharing the two logical slot strings does not make the implementations compatible. The old implementation imports `nativeRecords` from `native-database.ts`, so those names address the old SQLite store, with explicitly managed legacy AsyncStorage cleanup. The current implementation opens another database and reads legacy AsyncStorage directly. After the old app has migrated and cleaned up its legacy copy, the new implementation would not find its saved profile. Old ciphertext, secure keys and restore journals also cannot be decoded by the current vault reader. Simply adopting the old package ID risks displaying a fresh profile while old records remain inaccessible in the other database; it does not provide a migration or a complete old-data erasure path.

The current `mobile/app.config.js` only selects default versus Grizzly prototype identity. It has no compatible legacy-installed-app flavor. No current code was found to recognize the old cipher, `movefield-native-history-v2`, `movefield-transfer`, old database or old SecureStore key. An old password-protected transfer file is therefore not automatically supported by the new backup screen either.

## Signing and build route

The old workflow uses the locked Expo 57 project, generates Android with `expo prebuild --platform android --no-install`, then runs:

```sh
./gradlew :app:assembleRelease :app:lintRelease :app:testReleaseUnitTest \
  --no-daemon -PreactNativeArchitectures=arm64-v8a \
  -Porg.gradle.jvmargs="-Xmx5g -XX:MaxMetaspaceSize=1g"
```

It inspects the actual manifest, backup/extraction rules, resolved build route and signing certificate before uploading the test APK. This is a release-variant **development-signed test APK**, not store signing. The installed local Expo package’s `template.tgz` contains `package/android/app/debug.keystore`; its certificate was inspected with `keytool` and exactly matches the old artifact’s certificate above. Its template Gradle file uses that existing key for the release test build. Thus the matching test certificate is available without creating new signing material or a paid signing service. Certificate matching alone does not solve the storage incompatibility. Do not substitute a freshly generated debug key or silently change package identity.

The supported future path is to reconcile the current features with the installed APK lineage while either retaining its storage lifecycle or implementing and qualifying a preservation-first migration. Retain `com.ghinz32.movefield`, the existing matching test certificate and a versionCode greater than 1 for a new in-place test update. Then generate/compile using the reviewed native workflow/toolchain, inspect the actual output, and test installation over the exact old APK with synthetic encrypted records before offering it as an update. Keep Grizzly as a separate app identity; its new install must not be represented as an update to Movefield.

Required migration evidence includes old whole-state and split-history fixtures; incomplete restore journals and key-ring recovery; pending setup/active workouts/timers; all history IDs and accepted prescriptions; capacity/schema compatibility; wrong/missing keys; write/readback interruption; idempotent reopen; and retention/export of original files until the replacement is verified. A new package install can coexist with the old app but does not share its records. Never instruct the user to uninstall the old app to make an update work before a supported verified export/recovery path exists.

The current branch contains only `.github/workflows/manual-verification.yml`, which performs source checks and Hermes export, not native APK compilation. The historical workflow and required security/prebuild/inspection scripts remain on the audited branch and must be reconciled explicitly; rerunning an old job would compile its old SHA, not the new features. The exposed GitHub connector can read/download artifacts and rerun existing jobs, but has no callable workflow-dispatch tool in this session. No dispatch/rerun was attempted. Tool limitations should be reassessed only when a compatible candidate actually exists.

## User-facing links and wording

Current settings link to `downloads/movefield-native-current.zip` or `downloads/grizzly-fitness-native-source.zip` with labels **Download current native source** and **Download Grizzly native source**. These accurately identify source code, not installers. The surrounding settings heading is **iPhone and Android starter**, and its paragraph explicitly says to download Expo source. An additional short “Source ZIP, not an APK installer” note would remove the remaining ambiguity in that heading. No current source UI label was found promising an updated APK. Still, a final delivery must explicitly distinguish these files from the historical phone installer and must not say installed-phone fixes shipped merely because a source ZIP or Hermes export was refreshed.

The historical APK remains accessible through its [run and Artifacts section](https://github.com/ghinz32-cloud/movefield/actions/runs/38007809566). Preserve that existing artifact and its evidence. It is an old test build, not the current release.

Sources inspected:

- [Run artifact API](https://api.github.com/repos/ghinz32-cloud/movefield/actions/runs/38007809566/artifacts)
- [Exact native workflow](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/.github/workflows/native-builds.yml)
- [Old native app configuration](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/app.json)
- [Old storage lifecycle](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/src/storage.ts), [database](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/src/native-database.ts), [cipher](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/src/local-crypto.ts), [history](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/src/native-history.ts), [transfer](https://github.com/ghinz32-cloud/movefield/blob/9cdcec081bee3525838ac334da1bb48de6690f13/mobile/src/shared/transfer-bundle.ts)
- [Android signing requirements](https://developer.android.com/studio/publish/app-signing) and [versioning](https://developer.android.com/studio/publish/versioning), retrieved October 13, 2026.
