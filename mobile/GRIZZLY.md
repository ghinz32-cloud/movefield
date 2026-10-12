# Grizzly Fitness Wautoma flavor

This is a separate app identity built from the same training code. The user supplied the Grizzly Fitness logo. `assets/grizzly-fitness-logo.jpg` preserves the uploaded JPEG unchanged; the Expo asset compiler renders the whole source onto square black launcher canvases. The amber colors are a custom app theme. Gym website: https://www.fitnessgrizzly.com/.

After `npm ci`, use `npm run start:grizzly` for the Expo preview or `npm run export:grizzly` for Android/iOS JavaScript exports. For native compilation, set `EXPO_PUBLIC_APP_VARIANT=grizzly` in the terminal before `npm run android` / `npm run ios`. Clear Metro with `--clear` when switching flavors. Default commands continue to select Movefield.

Grizzly uses `com.ghinz32.grizzlyfitness.prototype`, the `grizzlyfitness` URL scheme, its own AsyncStorage/SecureStore keys, SQLite filename and preferences. Existing Movefield identifiers and record formats stay stable. No automatic profile migration occurs. An explicitly imported backup uses the same portable encrypted format.

Fresh Grizzly appearance starts with Wild, dark Arctic frost and Rubik Beastly headings. Settings offers Clean & readable plus Beast, Metal, Bungee, Barlow and Inter heading choices. Body text and controls use Inter. Claw/rip decoration is removed by Clean; saved mode/colors are respected. Both font licenses accompany the source. Sample data, deterministic training rules, plan review and privacy controls remain shared. An installed device test is still needed to qualify each platform's keychain, notifications, fonts and layout; an Expo export is not an APK/IPA.

Grizzly cloud sign-in stays off unless its own `EXPO_PUBLIC_GRIZZLY_API_URL` and `EXPO_PUBLIC_GRIZZLY_NATIVE_AUTH_VERIFIED=true` are supplied after callback/server qualification. Movefield's API setting is not reused.


Current outdoor collection: fresh Wild uses New Rocker. The five readable choices are Inter, Barlow Condensed, Oswald, Bitter and Rajdhani; ten wild faces include New Rocker, Black Ops One, Rubik Dirt, Metal Mania, Bungee, Saira Stencil One, Stardos Stencil, Pirata One, Eater and Nosifer. Font and palette selectors expand on demand. Ten outdoor themes supplement the seven existing colors. The hero now displays a five-talon bear print compiled from the authored web vector. The official gym JPEG is unchanged. Saved Beast selections migrate to New Rocker when read; workout data is untouched. Browser/native-source verification is not installed-phone qualification.
