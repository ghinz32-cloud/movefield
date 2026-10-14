# iPhone distribution

Both brands share the native training and encrypted-record code. Grizzly has its own appearance, URL scheme, preferences, database and app identity. This source archive can be used to build either app. There is currently no signed IPA or TestFlight release.

## Build prerequisites

Use a Mac with a compatible Xcode/iOS SDK, or an existing trusted macOS build service. Install the locked dependencies with `npm ci` and run `npm run check`. Keep Apple credentials and signing keys in secure build settings, outside source archives and chat.

Generate Movefield with `npx expo prebuild --platform ios --no-install`. Generate Grizzly separately with `EXPO_PUBLIC_APP_VARIANT=grizzly npx expo prebuild --platform ios --no-install`. Keep the same variant environment set during compilation/Metro bundling; use separate generated projects or regenerate when switching brands. Android's `legacy-movefield` environment is not needed for iPhone builds.

The current provisional bundle identifiers are `com.ghinz32.movefield.prototype` and `com.ghinz32.grizzlyfitness.prototype`. Confirm the registered identifiers and Apple team before distribution. Install CocoaPods dependencies, open the generated Xcode workspace and configure the correct signing team for each target. On an attached development device, build the Release configuration and check the actual app.

## Deliver an installable app

For distribution to other iPhones through TestFlight, an existing Apple Developer Program membership and two App Store Connect app records are required. Archive each signed Release build, validate/upload it through Xcode's Organizer and distribute through TestFlight after Apple's processing/review requirements. Ad hoc distribution requires registered device identifiers and the corresponding provisioning profile. An unsigned IPA or JavaScript export is not an installable substitute.

Enrollment, new paid services and store publication are separate owner actions. No Apple membership, billing or store submission is configured by this source package.

## Device acceptance

For each brand, check first launch, sample/personal profile isolation, saved workouts after a restart, offline guides, numeric entry with the keyboard visible, larger system/app text, VoiceOver, notification permission/rest alerts and background/resume behavior. Confirm Grizzly's callback uses `grizzlyfitness://` and Movefield's uses `movefield://` if native sign-in is configured and qualified. Keep cloud sign-in disabled until its server and callback requirements pass.

Check separate app icons/storage and explicit encrypted export/import, including failed writes and recovery. A simulated browser view, Hermes export, prebuild or successful compiler run does not establish these physical iPhone checks.

The current web apps remain available at https://ghinz32-cloud.github.io/movefield/review/ and https://ghinz32-cloud.github.io/movefield/grizzly/. In Safari, Share → Add to Home Screen provides a web shortcut; it does not install the native iPhone app or move local records between platforms.
