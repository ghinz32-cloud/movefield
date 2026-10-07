# Mobile starter validation

Checked on 7 October 2026 in a Linux execution environment using Node 24.19.0. These checks validate source and bundling; they do not establish behavior on a real iPhone or Android phone.

| Check | Result |
| --- | --- |
| Official template creation | `create-expo-app@5.0.0` with `expo-template-blank-typescript@57.0.29` succeeded |
| Dependency installation | Succeeded; exact tree captured in `package-lock.json` |
| `npm run check` | TypeScript passed |
| `npm run test:engine` | Passed: all 9 sample plans across all 7 starting weekdays; actual-set validation; partial workout save; optional distance/duration/notes validation and persistence round-trip; retained history when changing plans; invalid data/unsafe links rejected; all 989 catalog entries have detailed guides; native-rendered guide fields are structurally valid |
| `npm run export:mobile` | Metro successfully exported Android and iOS JavaScript/Hermes bundles |
| `npx expo-doctor` | 21/21 checks passed |
| `npm run export:web` | Web bundle exported; browser interaction was not tested |
| Real devices and native toolchains | Not run; no Android Studio/Xcode compilation, no APK/IPA, no signing or store submission |

The initial `tsx` CLI test attempt hit the environment's Unix-socket restriction. The committed test script uses `node --import tsx`, which avoids that CLI IPC socket and ran successfully. This is not an app runtime issue.

The sync manifest records hashes of the copied website modules and content. Rerun validation after refreshing that snapshot. Exported `dist-mobile` and `dist-web` are disposable build output, not installed mobile apps, and need not be included in the source ZIP.

No Expo/EAS account was created during development. The first-run guide instructs the user to sign in to the same free Expo account in CLI and Expo Go for a physical iPhone, as required by current official Expo guidance. No remote backend, API secrets, authentication or payment configuration was added. AsyncStorage is unencrypted; the UI and start guide explain that records are a local demo only.

Final snapshot includes `training-focus.ts`, `docs/product-requirements.md` and `docs/exercise-library-completion.json`. The focus engine is shared, but this native starter does not yet surface the website’s secondary-focus setup controls. All 989 text guides ship offline; the website’s 1,726 photos are not bundled.

## Revision 7 audit

Reran TypeScript, engine checks, and Android/iOS Metro exports after the audit fixes. Added exact-date start enforcement, reviewed return/date changes, preserved commitments/holds, whole-number repetition checks, serialized reset and current-state mutation handling. New regression assertions cover overdue rejection, approved cascade, partial recovery, and replacement conflict/hold preservation. The previous Doctor/web-export results above belong to the initial snapshot; they were not rerun in this audit.

No physical-device tests were run. The shorter-session action does not rebuild the entire block; dependent sessions can require additional review. Native timer deadlines still do not survive process termination. Known dependency findings and production gates are included in the deep audit.

## Revision 8 checks

Goal-filtered program selection and curated substitutions are implemented. Program IDs outside the explicit catalog or three supported special previews fail. The engine suite covers 21 choices across seven start weekdays and active substitution save/reload. Android and iOS JavaScript export is verified; this does not claim a signed native build or physical-device test. See REVISION-8.md for the scope and remaining named-program automation work.


## Revision 10 checks and current scope

The current starter adds personal setup, full-block review, saved rest timers, explicit Log set controls, local OS notification scheduling and cancellation, and post-workout feedback. The engine suite now checks 66 choices across all seven starting weekdays. TypeScript and Android/iOS Metro export pass. Revision 10 shared-domain tests cover malformed saved data and timer schedule/cancel races. Older statements above describe earlier snapshots; saved timer restoration and personal setup are now implemented.

Notification permissions, lock-screen sound, killed-app behavior, silent/Focus modes and Android timing still need real-device tests. No claim of native compilation or app-store readiness is made. The current mobile dependency audit has 15 high package entries from two upstream advisories and zero critical findings; incompatible downgrade suggestions were not applied. See REVISION-10.md and AI-COACHING.md for remaining product/security gates and the optional on-device AI approach.


## Continuation checks

The continuation additionally exposes secondary focuses, sport/position context, coach/manual target editing, machine setup/increments and approved progression on native. Shared revision-10 checks pass 35 scenario groups. TypeScript, native engine and fresh Android/iOS Metro exports pass after the fixes. Machine setup is retained with a saved workout; archives remain intact up to the explicit 100-plan guard. Fresh browser interaction and physical-device tests were not run in this continuation. Earlier browser/Doctor results refer to earlier snapshots.


## Revision 11 checks and current scope

TypeScript and the native engine suite pass for 74 choices across seven starting weekdays. Fresh Android/iOS Metro exports pass. The shared revision-11 regression suite has seven groups and 428,582 assertions. Native storage checks cover reads waiting for queued writes, latest-draft recovery and reset cleanup. No physical device, browser walkthrough, assistive-technology audit or native APK/IPA compilation was performed. The remaining dependency findings are unchanged: 15 high package entries from braces/node-forge, zero critical. See REVISION-11.md for precise coverage gaps and the next implementation stage.
