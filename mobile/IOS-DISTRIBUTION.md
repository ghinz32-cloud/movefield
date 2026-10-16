# iPhone distribution

Both brands share the native training and encrypted-record code. Grizzly has its own appearance, URL scheme, preferences, database and app identity. This source archive can be used to build either app. There is currently no signed IPA or TestFlight release.

## Build prerequisites

Use a Mac with a compatible Xcode/iOS SDK, or an existing trusted macOS build service. Install the locked dependencies with `npm ci` and run `npm run check`. Keep Apple credentials and signing keys in secure build settings, outside source archives and chat.

Generate Movefield with `npx expo prebuild --platform ios --no-install`. Generate Grizzly separately with `EXPO_PUBLIC_APP_VARIANT=grizzly npx expo prebuild --platform ios --no-install`. Keep the same variant environment set during compilation/Metro bundling; use separate generated projects or regenerate when switching brands. Android's `legacy-movefield` environment is not needed for iPhone builds.

The current provisional bundle identifiers are `com.ghinz32.movefield.prototype` and `com.ghinz32.grizzlyfitness.prototype`. Confirm the registered identifiers and Apple team before distribution. Install CocoaPods dependencies, open the generated Xcode workspace and configure the correct signing team for each target. On an attached development device, build the Release configuration and check the actual app.

## Prepared source identities and versions

| App | Bundle identifier | Version | Build number |
| --- | --- | --- | --- |
| Movefield | `com.ghinz32.movefield.prototype` | 0.1.8 | 9 |
| Grizzly Fitness | `com.ghinz32.grizzlyfitness.prototype` | 0.1.7 | 8 |

`app.config.js` and `app.json` set these values explicitly. A source version alone does not establish build qualification or publication. The iOS deployment floor is 16.4; a compatible Xcode and SDK are required. Keep both registered identities separate and increase the build number for each uploaded build. These are prepared source settings, not evidence of an uploaded or installable Apple release.

Before signing a Release build, inspect the generated Info.plist and aggregated PrivacyInfo.xcprivacy. From `mobile/` in the **full repository**, run `NATIVE_EXPECTED_PACKAGE=<bundle-id> python ../scripts/inspect-native-artifacts.py ios /path/to/Built.app`; the root-level inspector is not included in the mobile-only source ZIP. The inspector checks identity, deployment floor, transport declarations, required API reasons, and absence of declared tracking. Complete App Store privacy and encryption/export-compliance answers against the actual signed application and its enabled services; this source does not preselect legal declarations or enroll an Apple account.

## Deliver an installable app

For distribution to other iPhones through TestFlight, an existing Apple Developer Program membership and two App Store Connect app records are required. Archive each signed Release build, validate/upload it through Xcode's Organizer and distribute through TestFlight after Apple's processing/review requirements. Ad hoc distribution requires registered device identifiers and the corresponding provisioning profile. An unsigned IPA or JavaScript export is not an installable substitute.

Enrollment, new paid services and store publication are separate owner actions. No Apple membership, billing or store submission is configured by this source package.

## Device acceptance

For each brand, check the focused setup screens and saved draft, exercise/set navigation, visible Log set action with the keyboard open, the three-step finish review, and returning from workout guidance or an exercise guide without losing entries. Check dismissal/reopening of before/after coaching, automatic/manual/off preferences, no post-workout popup on a failed save, and no stale guidance after switching profiles. Then check first launch, sample/personal profile isolation, saved workouts after a restart, offline guides, numeric entry and encrypted-data recovery with the keyboard visible, larger system/app text including calendar badges and horizontal date navigation, VoiceOver, notification permission/rest alerts and background/resume behavior. Confirm Grizzly's callback uses `grizzlyfitness://` and Movefield's uses `movefield://` if native sign-in is configured and qualified. Keep cloud sign-in disabled until its server and callback requirements pass.

Check separate app icons/storage and explicit encrypted export/import, including failed writes and recovery. A simulated browser view, Hermes export, prebuild or successful compiler run does not establish these physical iPhone checks.

This source supports portrait/landscape and iPad multitasking. Check rotation, split view, keyboard-driven reductions in usable height, safe-area cutouts and larger system text while entering a set or setup draft. Browser resizing does not execute UIKit keyboard avoidance or native lifecycle recreation. The full repository's [native audit](../docs/comprehensive-2026-10-16-native.md) and [foldable/tablet audit](../docs/comprehensive-2026-10-16-foldables.md), outside the mobile-only source ZIP, distinguish source/browser evidence from these open device gates. The owner's earlier Samsung S24 Ultra confirmation applies only to Movefield 0.1.6 on Android; it supplies no Apple-device qualification.

The current web apps remain available at https://ghinz32-cloud.github.io/movefield/review/ and https://ghinz32-cloud.github.io/movefield/grizzly/. In Safari, Share → Add to Home Screen provides a web shortcut; it does not install the native iPhone app or move local records between platforms.
