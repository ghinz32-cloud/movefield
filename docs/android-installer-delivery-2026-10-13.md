# Android installer delivery — 2026-10-13

Movefield and Grizzly Fitness now have public Android download pages. They assemble the exact compiled APK locally, check every part and the final SHA256, then offer **Save APK**. The download needs no GitHub account and does not read app profiles, cookies or workout records.

| App | Web preview | Android download |
| --- | --- | --- |
| Movefield | https://ghinz32-cloud.github.io/movefield/review/ | https://ghinz32-cloud.github.io/movefield/review/downloads/android.html?app=movefield |
| Grizzly Fitness | https://ghinz32-cloud.github.io/movefield/grizzly/ | https://ghinz32-cloud.github.io/movefield/grizzly/downloads/android.html?app=grizzly |

The original https://ghinz32-cloud.github.io/movefield/ app and previously published compiled assets are retained. This delivery adds files to the latest preview checkpoint; it does not regenerate its app bundles.

## Compiled evidence

- Source: `48d7512f54d2615c8133b5717e182612ed6812a1`; tree `01c8175f53298e53ddde813a3e73a5cb687e3b9b`.
- Successful build: https://github.com/ghinz32-cloud/movefield/actions/runs/38454580248.
- Movefield: package `com.ghinz32.movefield`, version 0.1.2, versionCode 3, 39,208,568 bytes; artifact `11841959383`.
- Grizzly: package `com.ghinz32.grizzlyfitness.prototype`, version 0.1.1, versionCode 2, 39,359,826 bytes; artifact `11843405826`.
- Both compiled artifacts include passing identity/manifest/transport/backup-rule inspection. Their recorded source commit and tree match the reviewed build source.
- Both use the historical Movefield development certificate: SHA256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Movefield APK SHA256: `a62605b3c3a8a4bc5f9afcdacec6dda20a032fc539c1486725547ee4918db84b`.
- Grizzly APK SHA256: `86ba301f2ebe9073b7e73b21db11555bc47b5f348cfe30aa5acf2cd4f15cb90a`.

The APKs include the current compact layouts, per-set RIR, guarded historical-data upgrade, legacy encrypted transfer support and starting-weight review before block reuse. Movefield retains the earlier test app's identity; Grizzly installs separately.

## Delivery checks and limits

`node scripts/check-android-downloads.cjs` reconstructs both exact APKs with real SHA256 checks, rejects altered files and external part URLs, checks cancellation, and fails if the downloader reads profile storage or account cookies. Public file checks and browser preparation are recorded in the publication receipt once deployed.

These are arm64 development-signed test builds. Compilation and inspection do not qualify physical-device upgrades, native keychain behavior, notifications, TalkBack, or performance. A real old-APK-to-current-APK phone upgrade still needs testing; retain the earlier app and an export. iOS signing, App Store/Play production release, provider deployment and complete launch acceptance remain open.

The `.bin` files are transport fragments, not individually installable apps. `android-installers.json` pins their sizes/hashes and the compiled provenance. Use the page to produce the verified APK. Source ZIP downloads remain source archives.
