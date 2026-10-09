# Android and iOS security configuration — 9 October 2026

This review starts from published `587438a8a2ba21cf88c943f857348dd7190eb078`. It inspects application source, installed Expo 57.0.27 / React Native 0.86.3 packages, and fresh native projects generated outside the repository. Generated configuration checks are not native compilation, OS behavior tests, store acceptance, or a penetration test.

## Defects repaired in this checkpoint

The original Android prebuild opted into automatic backup without `fullBackupContent` or `dataExtractionRules`. It also carried overlay and legacy external-storage permissions despite using private files and the system document picker. The source now disables backup, links explicit exclusions for all nine Android backup domains in both legacy and modern cloud/device-transfer formats, and supplies merger removal markers for overlay, external read/write, microphone and camera permissions. It registers SecureStore with its competing automatic backup configuration disabled. The release main manifest denies cleartext traffic; the generated debug overlay retains its Metro exception.

The app still needs `INTERNET` for explicitly confirmed model downloads, `VIBRATE` for rest alerts, and the notifications dependency's `POST_NOTIFICATIONS` / `RECEIVE_BOOT_COMPLETED` for opted-in local reminders. It does not request exact-alarm special access, location, contacts, media-library access, or biometrics. A release manifest merger/build must verify the final permission set; source removal markers alone are not a compiled APK inspection.

iOS now has an explicit `com.ghinz32.movefield` bundle identifier matching Android. ATS continues to deny arbitrary internet loads. Its local-network exception supports development; the installed Dev Launcher adds an Xcode phase to strip its Bonjour service and local-network usage message from non-Debug output. Its generated URL schemes remain configuration entries, not evidence of a working production remote-bundle loader: Apple autolinking registers Dev Launcher/Menu only inside `EXPO_CONFIGURATION_DEBUG`; Android release source sets use disabled delegates. The two Android `configureInRelease` flags are explicitly false. These source guards require confirmation in assembled release output.

The app privacy manifest declares scoped file/picker metadata (`C617.1`, `3B52.1`), disk-space checks before writes (`E174.1`), local preferences (`CA92.1`) and React Native elapsed-time use (`35F9.1`). Tracking and developer-operated collection remain absent in this revision. Dependencies also supply privacy manifests; CocoaPods aggregation and the complete built application need inspection before an Apple submission.

Installed SDK requirements are explicit: Android minimum API 24, compile/target API 36; iOS minimum 16.4. EAS profiles use the currently documented named SDK57 Android and Xcode26.6 images. Named images improve repeatability but do not make remote infrastructure byte-for-byte immutable.

## Storage and privacy boundaries

Training and setup records reach SQLite only as authenticated XChaCha20-Poly1305 envelopes. The key and restore key ring use SecureStore; SQL binds parameters and commits entity generations with readback and revision checks. No account identity, biometric unlock, server authorization or cloud sync is implemented. Notification bodies are generic; Android channels request private lock-screen visibility. Actual lock-screen presentation follows OS settings and remains a device test.

iOS keys use `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`: device binding is not an app unlock. After the first unlock, the key can be available while the phone is locked; decrypted state can remain in application memory. There is no screenshot/app-switcher privacy shield. iOS Keychain can survive uninstall/reinstall, and this behavior must not be relied upon as recovery. SecureStore errors and missing keys retain encrypted records.

Android backup denial does not prove an OEM obeys the policy. Android 16 QPR2 cross-platform OS migration is unconfigured: it requires a real Apple team identity and additional matching metadata. No invented identity is supplied. iOS SQLite is in the default app Documents storage and has no application-set backup exclusion; an OS backup can retain ciphertext whose device-bound key cannot open on another phone. The app's supported portable copy is an explicitly reviewed password-protected transfer. Test OS backup/restore and wrong-device recovery on actual devices before release.

Plain JSON exports intentionally contain readable training. The UI identifies this and the share helper deletes its temporary cache file in `finally`, but process death or denied deletion can leave a cache copy until the OS reclaims it. A failed legacy AsyncStorage cleanup can likewise retain old plaintext even after encrypted migration; SQL remains authoritative, so the stale copy does not become a normal read fallback. Cleanup reporting/retry is a separate storage review concern.

No `ITSAppUsesNonExemptEncryption=false` claim is added. This app contains JavaScript cryptography in addition to OS SecureStore. Apple export compliance must be determined for the final algorithms and intended markets before TestFlight/store distribution.

## Reproducible checks and remaining evidence

Run `node scripts/check-native-security-config.cjs` from the repository root after `npm ci` in `mobile`. The harness creates an isolated project, runs the installed Expo prebuild twice without installing dependencies, parses the real manifests/plists/XML, checks SDK floors and developer-only dependency guards, and verifies security output idempotence. It removes its temporary project and prints SHA-256 fingerprints. Alternatively, `--native-dir /absolute/prebuilt/mobile` inspects a previously generated project.

This environment has a Java 17 runtime but no Java compiler, Android SDK/NDK, Gradle cache, emulator, Xcode, Swift compiler or CocoaPods. Native compilation must run on qualified build runners. An Android release compile/lint and an unsigned iOS Release simulator build are possible without provisioning accounts; they do not establish physical phone behavior or signing acceptance. Record merged Android permissions/backup references and built iOS ATS/privacy manifests. Keep native test counts honest when the generated projects contain no application instrumentation/XCTest suites.

Physical gates include interrupted writes and restore key-ring recovery; reinstall and same/different-device OS restore; revoked notification permission, reboot and lock-screen delivery; plaintext share/import interruption; low disk, cache eviction, canceled native transfers and process restart. Model files are verified downloads only; native inference and actual weight/hardware qualification remain unimplemented.

## Primary references checked

- Expo [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [permissions](https://docs.expo.dev/guides/permissions/), [privacy manifests](https://docs.expo.dev/guides/apple-privacy/), [SDK requirements](https://docs.expo.dev/versions/latest/) and [EAS infrastructure](https://docs.expo.dev/build-reference/infrastructure/).
- Android [Auto Backup domains and transfer formats](https://developer.android.com/identity/data/autobackup) and [backup security recommendations](https://developer.android.com/privacy-and-security/risks/backup-best-practices).
- Apple [required API reasons](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons), [privacy manifest responsibility](https://developer.apple.com/news/?id=3d8a9yyh), [Keychain accessibility](https://developer.apple.com/documentation/security/ksecattraccessibleafterfirstunlockthisdeviceonly) and [export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/).
- GitHub [hosted runner availability](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [Ubuntu24.04 tool inventory](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) and [macOS26 ARM inventory](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md).

These are the documentation and dependency versions inspected on this date; reread the current store requirements and inspect the final binary before release.
