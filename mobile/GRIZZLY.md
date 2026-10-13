# Grizzly Fitness app

Grizzly is a separate app identity for every gym location, built from the shared training code. The supplied logo JPEG remains unchanged. The bear/forest imagery, colors and animations are custom app styling.

Fresh appearance and the Wild preset use dark Pine forest and Frijole headings. Settings also offers Clean & readable, 35 licensed heading fonts (five readable and 30 Wild), 17 palettes, larger text, contrast and reduced motion. Body text, workout values and controls use clear text. Forest mist and embers pause when the app is inactive. Today messages rotate by local day and the actual workout/recovery/review context. The image assets are bundled for offline use.

OG Grizzly was removed at the user's request on 13 October 2026. Saved OG preferences return to Wild, the removed palette to Pine, and the preset's default Bungee heading to Frijole. Explicit other fonts, display modes, accessibility and reminders remain. Workout history, plans, active logging and timers are not changed. Existing retired Beast/unversioned New Rocker migration remains; explicit later New Rocker choices are preserved.

After `npm ci`, use `npm run start:grizzly` for Expo preview or `npm run export:grizzly` for Android/iOS JavaScript exports. For native compilation, set `EXPO_PUBLIC_APP_VARIANT=grizzly` before `npm run android` / `npm run ios`. Clear Metro with `--clear` when switching flavors. Default commands select Movefield.

Grizzly retains `com.ghinz32.grizzlyfitness.prototype`, the `grizzlyfitness` URL scheme and separate AsyncStorage/SecureStore keys, SQLite database, preferences and offline namespace. Movefield identifiers and record formats remain stable. No automatic profile transfer occurs. Explicit backup import uses the same portable encrypted format.

Cloud sign-in stays off unless its own `EXPO_PUBLIC_GRIZZLY_API_URL` and `EXPO_PUBLIC_GRIZZLY_NATIVE_AUTH_VERIFIED=true` are supplied after callback/server qualification. Movefield's API setting is not reused.

This source release has local type/domain checks and distinct cleared-cache Android/iOS Hermes exports. It is not an installed APK/IPA, store release, rendered accessibility audit or physical-device acceptance. Keychain, notifications, layout, fonts and performance still need installed-device qualification.
