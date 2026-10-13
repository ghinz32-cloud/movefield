# Movefield — mobile starter

This is a working React Native + Expo **source-code starter** for iPhone and Android. The screens use native components. Saved training requires your own native development build with the included SQLite compiler configuration. Expo Go does not apply this project’s native flags, so the app refuses unqualified storage instead of accepting unsafe writes.

It is a local demo: there is no Movefield sign-in, shared account, website sync, cloud backup, subscription, or production backend. The existing website and this mobile app keep separate local records. This download is not an APK, an IPA, or an app-store release.

## Revision 14

Settings now includes reviewed backup import/export for manual transfer with the website. Backups include profile and workout notes; keep them private. Restoring replaces this device’s records after review, preserves actual history, cancels old timers and makes old queued suggestions stale. It never merges by position. The starter also includes all optional set measurements and avoids refreshing the entire app every half second.

## Appearance and reminders

Open **Settings** for six color themes, System/Light/Dark mode, text size, contrast, reduced motion and optional workout-day notifications. Local reminders schedule the next 30 workout days and refresh when the app opens or the schedule changes. Reopen after time-zone changes. Delivery depends on phone notification settings and has not been verified on a physical phone in this revision.

Optional Model files controls review, download, verify and explicitly delete private cached files for the listed Android model candidates. No native inference runtime or device-qualified model is included. These controls require the custom native SQLite build as well; ordinary training does not require model downloads. Barlow Condensed and Inter are bundled with their license notices in `docs/font-licenses`.

## First run and native development build

1. Install **Node.js 24 LTS** from [nodejs.org](https://nodejs.org/en/download). Choose the Windows Installer for your computer and keep the normal installer options. Node 24 is an LTS release; Expo SDK 57 requires at least Node 22.13. Open a new PowerShell window after installation.
2. Extract the downloaded starter ZIP into a normal folder such as `Documents\TrainingStudioStarter`. Do not run commands from inside the ZIP viewer.
3. In File Explorer, open the extracted `training-studio-mobile` folder containing `package.json` and `START-HERE.md`. Click the address bar, type `powershell`, and press Enter. PowerShell should open **in that folder**.
4. Run these commands one line at a time:

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run check
```

`npm.cmd ci` downloads the exact dependencies in the included lockfile; the first run needs internet and may take a few minutes. The `.cmd` spelling works around PowerShell’s common “running scripts is disabled” error without changing your machine’s execution policy. These commands should not need an administrator window.

5. Build and install your own development app. Android needs Android Studio, Android SDK and JDK 17; iOS needs a Mac with Xcode and its normal device-signing setup. The project already includes `expo-dev-client`. Do not start paid cloud builds or submit to a store as part of this setup.

   On an Android development computer with the toolchain configured, run:

```powershell
npx.cmd expo prebuild --platform android --no-install
npx.cmd expo run:android
```

   On a Mac with the iOS toolchain configured, run:

```sh
npx expo prebuild --platform ios --no-install
npx expo run:ios
```

   Native generation must retain `expo.sqlite.customBuildFlags=-DSQLITE_DEFAULT_SYNCHRONOUS=3` on Android and the same string in iOS `Podfile.properties.json`. Rebuild the installed app after changing this configuration; a JavaScript reload cannot change SQLite’s compiled connection default. Existing unqualified Expo Go or older builds can show a storage error. Keep existing records and transfer backups; do not reset or delete database/journal files to bypass that error.

6. For later development sessions, keep the installed custom app and computer on the same private network, and run:

```powershell
npm.cmd run start:dev
```

7. Open **Plan** and choose **Build my plan**. Enter your goal, time and equipment, review the workouts, then tap **Start this plan**. Samples remain available separately. In **Today**, start the first session, enter actual reps/time and weight, then tap **Log set**. Rest starts after a valid set is logged. Finish the workout to save its history. Open **History** to see the record. **Library** has search, equipment filters and exercise guidance.

To stop Metro, press `Ctrl+C`. If connection fails, confirm the private network/firewall settings and restart with `npx.cmd expo start --dev-client --clear`. Keep the first error message and command if native installation fails. Preserve `package-lock.json`; it makes the dependency group reproducible. No physical-device storage, alarm or interruption acceptance is claimed by these instructions.

## What the starter does

- Native Today, Plan, Library, History, guide and workout screens.
- Personal plan setup uses the same TypeScript engine as the website. The catalog has 71 variants, with three additional legacy preview choices. Your goal, equipment, training days, time and readiness determine which choices fit. You can review all workouts before accepting.
- All 989 exercises have bundled detailed text guides, with exact equipment-tag filters and multiword search. The website’s 1,726 source photos are not bundled in this native starter. Source and reference-video links open externally when available; no video is represented as hosted by this app.
- Actual reps/time and load, completed sets, optional machine setup, per-set distance in meters, duration in seconds and notes, partial workouts, rest timer, history and pounds/kilograms. Optional extra measurements are stored as entered and do not change progression targets. Unknown weight remains unknown; the app does not invent starting loads.
- Local persistence using a transactional SQLite record database, with legacy AsyncStorage import; saved training and setup drafts are encrypted before they are written (XChaCha20-Poly1305, one random nonce per write, bound to their storage slot). The 256-bit key is kept in the device’s secure store and is never written to the record database. Reads and writes use the shared Zod schema, size checks and unsafe-key rejection. A failed read or a missing key does not overwrite the saved record; reset asks for confirmation and deletes the key. Writes are queued to preserve edit order.
- Plate calculator and warm-up ladder (adults only) on the Library tab, and a weekly review on History. They calculate from entered or logged numbers only and never change the saved log. Estimated bests use rated sets and are approximate.
- Shared plan eligibility checks. Incomplete prerequisites can block a later session. The starter does not bypass them. Reviewed date changes and a shorter-session option are available. They do not silently rewrite the full block.

The sample-plan preview openly shows its assumptions: age 28, equipment, lifting experience and, where applicable, an existing running base. These samples are demonstration configurations, separate from personal plan setup; they are not assessments of readiness. A new plan retains existing workout history and cannot replace an active workout.

## Rest timers and alerts

Tap **Log set** after completing the movement. Entering or editing numbers alone does not start rest. **Pause**, **+30 sec**, **Resume** and **End rest** control the timer. Undoing or changing its completed reps/load cancels that timer; adding notes does not. No new rest timer starts after the final set of the whole workout. The timer is saved with the workout and restored after reopening.

Tap **Enable rest alerts** to request notification permission. The app schedules a local phone notification with default sound; it does not need a push server. Permission denial leaves the visible timer usable. Android channels, iOS Focus/silent settings and battery management can silence or delay an alert. Android exact-alarm access is not requested in this starter, so background delivery may be inexact. Real-device testing is still required, including lock screen, pause/cancel, restarting and denied permissions. A development build is the preferred next testing environment.

## Data and account boundaries

The storage key is `training-studio:mobile-local-demo:v1`, separate from the website. The stored value is ciphertext. Its key is `movefield.dataKey.v1` in the device’s secure store, set to stay on this device and not move in device backups, so a copy of the app data restored to another phone shows a “key not on this device” message instead of being replaced. Only the local demo’s training data is stored; there are no passwords, credentials or tokens. Removing app data or uninstalling can remove these records. Settings can export a backup as plain JSON and restore it by paste; that exported file is not encrypted, so share it only deliberately. Encryption has been checked in Node and by a bundle build, not yet on a physical iPhone or Android phone.

A shared website/mobile account requires a real backend: identity, authenticated API, per-user authorization, database, sync/conflict handling, backup and account deletion. `src/storage.ts` is the small storage boundary to replace or complement when that service exists. Future credentials belong in an appropriate secure credential store, not this file. No backend endpoint or secret is hidden in the starter.

## Files you or a developer will edit

| File/folder | Purpose |
| --- | --- |
| `App.tsx` | Native screens and navigation |
| `src/mobile-engine.ts` | Mobile workflow around shared planning and logging types |
| `src/storage.ts` | Validated local persistence boundary |
| `src/content.ts` | Bundled guide/media adapter and safe outbound links |
| `src/shared/` | Copied website domain modules and catalogs; regenerate rather than diverge |
| `assets/content/` | Bundled exercise guides and reference-link metadata |
| `scripts/sync-shared.mjs` | Reproducible read-only copy from a website checkout |
| `docs/shared-snapshot.json` | File hashes for the copied source snapshot |
| `docs/exercise-library-LICENSE.txt` | Imported exercise catalog license |
| `package-lock.json` | Exact installed dependency tree |

If you have the website source checked out on Windows, refresh shared code/content with its folder path. This reads the website and only writes this mobile folder:

```powershell
npm.cmd run sync:shared -- "C:\path\to\training-studio"
npm.cmd run check
npm.cmd run test:engine
npm.cmd run export:mobile
```

Replace `C:\path\to\training-studio` with the real folder containing the website’s `lib` and `public` directories. The downloaded mobile project already includes the copied files; this step is **not needed for first run**.

## Expo Go versus your own development build

**Expo Go** is an installed playground that loads JavaScript into its own native host. It cannot apply Movefield’s SQLite native compile flags. It is not a qualified host for saved training or model-file metadata; the app checks DELETE journaling and EXTRA synchronization on each fresh transaction connection and refuses incompatible storage before application SQL.

A **development build** compiles your own native app with the included plugins and developer tools. The commands above generate this project’s configuration before building. Local Android builds on Windows need Android Studio, Android SDK and Java; local iOS builds need a Mac with Xcode. Production signing, store disclosures and real-device acceptance are separate work. This delivery does not start a paid build or submit an app.

## Checks and limits

See `docs/VALIDATION.md` for actual commands and results. Metro export proves the JavaScript can bundle for Android and iOS; it does **not** compile or sign an APK/IPA. Real iPhone/Android device testing, app-store submission, accessibility auditing and production security review have not been performed.

The native starter now includes personal plan setup, curated substitutions, reviewed schedule changes, coach/manual session target editing, post-workout feedback, equipment increment settings and saved rest timers. It does not yet match every website feature: commitment entry, reusable custom workout/block editing, advanced measurements such as heart rate/cadence/power/assistance, account sync, charts, coach permissions, wearable/health integration and payments remain work to do. Existing saved commitments are checked during native plan setup. Camera-based technique assessment is outside the planned coaching scope.

## Versions and official sources

Checked 7 October 2026. Created using the official `expo-template-blank-typescript@57.0.29` through `create-expo-app@5.0.0`, then added SDK-compatible native packages with `expo install`. Core installed versions: Expo `57.0.27`, React `19.2.3`, React Native `0.86.3`, AsyncStorage `2.2.0`, Expo Notifications `57.0.22`. SDK 58 is still labeled beta in the official changelog checked for this revision; upgrade the full Expo-compatible dependency group when the stable release is available. A development build avoids depending on the store version of Expo Go’s single-SDK support. The exact full tree is in `package-lock.json`.

- [Expo SDK compatibility table](https://docs.expo.dev/versions/latest/) — SDK 57 targets React Native 0.86 and React 19.2.3; minimum Node 22.13.x.
- [Official create-expo-app templates](https://docs.expo.dev/more/create-expo/) — `blank-typescript` is the minimal TypeScript template used here.
- [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/) — physical devices and Expo Go.
- [Expo Start developing](https://docs.expo.dev/get-started/start-developing/) — physical iPhone CLI/Expo Go same-account sign-in requirement.
- [AsyncStorage in Expo](https://docs.expo.dev/versions/latest/sdk/async-storage/) — local storage that holds only ciphertext here.
- [SecureStore in Expo](https://docs.expo.dev/versions/latest/sdk/securestore/) — holds the data key.
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/) — native toolchain and platform distinctions.
- [Node.js release status](https://nodejs.org/en/about/previous-releases) — Node 24 LTS recommendation.

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local notifications, permissions and platform behavior.
- [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta) — release status and Expo Go transition.


### Continuation update

Personal setup also exposes optional secondary focuses and sport/position context. General athletic foundations remain distinct from position-specific programming. Coach/manual users can add, edit, reorder and remove upcoming workout targets from Today, and explicitly repeat them onto future matching weekdays. Setup drafts resume after reopening. Exercise guides now allow recording a machine/setup label, maximum and smallest available increase. Review a load or rep-range change on Today; it applies only after acceptance. Changing setup clears incompatible limit/increment drafts. A simulated concern hold has an explicitly confirmed reset for interface testing; it does not provide medical clearance.
