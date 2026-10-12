# Local Android build qualification

The prototype has provisional application ID `com.ghinz32.movefield.prototype`, while existing record namespaces and the `movefield` callback scheme remain stable. The ID is for local development, not a claimed production/store registration. Native project generation is reproducible and ignored; generated signing files are excluded from archives.

This workspace installed official Android platform 36, build-tools 36.0.0, platform-tools 37.0.1 and NDK 27.1.12297006. Official Temurin JDK 21.0.12+8 runs Gradle 9.3.1; JDK 17.0.20+8 satisfies the React Native plugin toolchain. Downloads were checked against official checksums. The environment's public proxy CA was imported into the workspace JDK trust stores; TLS verification was retained. No service account, billing, remote CI or production signing key was used.

`expo prebuild --platform android --no-install` completed, and Gradle compiled Expo/React Native plugins. `:app:assembleRelease` failed when Maven Central redirected `react-android-0.86.3-release.aar` to `https://repo.reactnative.dev`, which the managed proxy denied with 403. This is a destination-policy block, not an APK validation result. `repo.reactnative.dev` was added to the saved environment draft; saving that draft does not activate it. Review/save and publish the environment to apply it. Do not bypass the proxy or downgrade React Native to evade the block.

To resume in this prepared workspace after policy activation:

```sh
cd /workspace/movefield/mobile
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 CI=1 npm exec expo -- prebuild --platform android --no-install
cd android
JAVA_HOME=/workspace/movefield/.sites-runtime/android-toolchain/jdk-21.0.12+8 \
ANDROID_HOME=/workspace/movefield/.sites-runtime/android-toolchain/sdk \
ANDROID_USER_HOME=/workspace/movefield/.sites-runtime/android-user \
GRADLE_USER_HOME=/workspace/movefield/.sites-runtime/gradle-home \
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 CI=1 \
./gradlew :app:assembleRelease --max-workers=4 --console=plain
```

Before Gradle, restore `distributionSha256Sum` in the regenerated wrapper from the checked `.sites-runtime/android-toolchain/gradle-9.3.1.sha256`. Workspace Gradle properties already specify both JDK paths, disabled toolchain auto-download and the inherited proxy. Keep caches and Java user files under `.sites-runtime`; preserve trusted CA verification.

The first attempted compile restricted architectures to arm64-v8a and x86_64 for diagnosis. For the owner’s broad-device coverage goal, the resume command uses Expo’s default four-ABI declaration (armeabi-v7a, arm64-v8a, x86 and x86_64). Actual binaries and old-device behavior still need qualification.

A successful release-variant build using Expo's generated development certificate would be a **development-signed prototype APK with embedded Hermes JavaScript**. It would still require signature/manifest inspection, offline installation/startup and real-device checks. No APK was produced in this run. The Linux host has no KVM device and no attached phone; iOS requires a Mac, owner signing configuration and installed-device qualification. Hermes exports are JavaScript bundles, not APK/IPA files.
