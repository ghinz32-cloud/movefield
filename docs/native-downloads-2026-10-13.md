# Current phone downloads — 13 October 2026

The latest UX audit fixes are now compiled into separate Movefield and Grizzly Fitness Android test apps. Both were built from `08c6844d0fb4092cda1672498e3afc7dcd4149a6`, tree `3845d6bda30eda8f76cfcefded90dfe1830338d6`. This source includes the newest researched training checkpoint and fixes for the actual Grizzly callback, decimal inputs, keyboard handling and large-text tabs.

| App | Version | Download |
| --- | --- | --- |
| Movefield | 0.1.4 (5) | https://github.com/ghinz32-cloud/movefield/releases/download/android-ux-preview-08c6844d0fb4/movefield-0.1.4-arm64.apk |
| Grizzly Fitness | 0.1.3 (4) | https://github.com/ghinz32-cloud/movefield/releases/download/android-ux-preview-08c6844d0fb4/grizzly-fitness-0.1.3-arm64.apk |

Build https://github.com/ghinz32-cloud/movefield/actions/runs/38511959235 and publishing verification https://github.com/ghinz32-cloud/movefield/actions/runs/38513335617 both passed. The publisher verified archive digests, exact source/tree, final APK hashes, compiled identities, signatures, linked backup rules and transport restrictions before releasing either file. Local Android tools independently repeated the actual-file inspections after downloading both release assets. The compiled bundles are distinct.

Both APKs target ARM64 Android phones, API 24 / Android 7.0+, and use the historical development certificate `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. Movefield retains `com.ghinz32.movefield`; Grizzly remains separately installed as `com.ghinz32.grizzlyfitness.prototype`. Keep an explicit encrypted backup and update over the existing app; do not uninstall records to solve a package/signature conflict.

The existing Pages downloader is updated with these exact APKs and verifies every transport part plus the final file before offering Save. Direct release links avoid part assembly. Pages `1d245e9383f9a2b421f3df02d3a25f0da17b6c58` deployed successfully in run `38513895225`. All 341 selected shared-app/root HTTPS files and 22 download files match; all 63 original root files remain unchanged. Both APKs reconstruct from both live brand directories. Sandboxed Chromium completed actual Save for both apps, and the saved files match their compiled hashes. Complete receipts are in the validation JSON.

Both source ZIPs contain 253 manifest-verified files, updated Android/iPhone build instructions and the current app code. Four distinct Android/iOS Hermes exports pass; these exports and ZIPs are not phone installers.

## iPhone and final-release status

The owner confirmed **No Apple setup yet**. This Linux workspace has no Xcode or Apple signing/provisioning. No signed IPA or TestFlight release exists. `mobile/IOS-DISTRIBUTION.md` describes the remaining signing, macOS build and device/distribution steps. The two web apps work in Safari; Add to Home Screen creates a web shortcut and does not install or transfer records into the native app.

These APKs are development-signed test releases. Actual old/new phone installation, keychain/storage, restart/offline, notifications, VoiceOver/TalkBack and performance checks remain open. Two native tooling advisories and broader provider/science/security/launch gates remain open; neither compilation nor delivery establishes full six-prompt or store completion.

## Checksums

- movefield: `158660c17f56812ffa01b06d229ce78abcfbcc4ae1c836bfe3ec8e3f32c7e700`, 39211712 bytes.
- grizzly: `77caf459179345b564517949fd640432b84240c426c3332c30c8d128c6244709`, 39362970 bytes.

The finite recognizable-credential scan of both complete APKs visited 1,236 members per app with zero matches. This is limited file inspection, not a security certification. All delivery receipts and exact scopes are in `native-downloads-validation-2026-10-13.json`.
