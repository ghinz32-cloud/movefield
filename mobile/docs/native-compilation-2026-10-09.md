# Native release compilation — 9 October 2026

The actual SEC2 native CI run demonstrated an unsigned iOS Release simulator build and successful inspection of its assembled privacy/transport metadata. Android completed release APK packaging, then failed lint on a CAMERA permission-removal marker. NATIVE1 annotates only that source-node lint false positive and keeps the final APK permission-denial gate mandatory.

## Demonstrated build results

Run [37965114809](https://github.com/ghinz32-cloud/movefield/actions/runs/37965114809), attempt 1, has branch source `c9b6471f916f4a70e4b828cf54c6ad93040962f7`, tree `2e58e02cffe74f7af6d7a42f47f0a24c1c251958`. The run failed overall because its Android lint task failed.

| Job | Observed result | Qualification |
| --- | --- | --- |
| iOS `113937402165` | Pods, unsigned Release simulator compilation and built privacy/transport inspection succeeded. | iOS simulator SDK 26.5, Xcode 26.6, deployment floor 16.4. No physical iPhone, signing, store or launch acceptance. |
| Android `113937402352` | `packageRelease` and `assembleRelease` completed. `lintRelease` failed with one error and 46 warnings. | The subsequent APK manifest/rules/signature inspection was skipped. The expected debug signing was not independently inspected. |
| Android native unit-test task | `testReleaseUnitTest NO-SOURCE`. | Zero native JUnit tests ran; this is not a passing native unit-test suite. |

Android job logs verify checkout `67fdcf5b0d5ed84b1059d0ae998940b0f74a6742`, the PR merge commit. Its tree independently matches the published SEC2 tree. The iOS job-log tool failed after three bounded attempts; its same-run checkout configuration implies the same merge source, but its historical checkout SHA was not independently extracted from logs. Future native workflow runs pin the PR head and retain actual source commit/tree evidence. The source annotation below has not yet been qualified by a new native build.

Both retrieved ZIPs matched GitHub's archive digests. The iOS archive is 11,774 bytes, SHA-256 `e082a2e475fe86f4df9e7d33fed99e56cbcc3c57d22c219f6226e050cacb72f2`; it contains Info.plist, PrivacyInfo.xcprivacy, Podfile.lock and the inspector report. Its assembled report covers 11 privacy manifests, required app API reasons, no SDK-declared collection/tracking, and ATS arbitrary internet/media/web loads denied with explicit local networking allowed. This does not establish native API reachability or store disclosure acceptance. The Android archive is 31,643 bytes, SHA-256 `0384700ce2f3ef1b08e12707de54f9be1e0ff7b1a93152f0e60be25c83b39f45`; it contains three lint reports and no decoded final APK manifest. Preserved evidence is in `docs/qa/native-compilation-2026-10-09/`.

## Scoped CAMERA marker repair

The failing lint issue is `PermissionImpliesUnsupportedChromeOsHardware`. It reads this source-manifest merger instruction as a permission request:

```xml
<uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>
```

The security config plugin now sets `tools:ignore="PermissionImpliesUnsupportedChromeOsHardware"` only when the element is both CAMERA and `tools:node="remove"`. It adds no camera grant or hardware feature and no manifest/application-wide suppression. All other permission-removal markers, the permission allowlist, backup policy and transport policy retain their existing checks.

Android's [tools attribute reference](https://developer.android.com/studio/write/tool-attributes#toolsignore) documents element-scoped lint annotation and removal of tooling attributes during a build. That annotation addresses the demonstrated source-node diagnostic; it does not prove that the merged APK lacks CAMERA. The existing assembled-artifact inspector still rejects CAMERA or any other unexpected final permission.

## Fresh source validation

| Check | Result | Scope |
| --- | --- | --- |
| `node scripts/check-native-security-config.cjs` | 114 assertions pass. | Actual installed Expo plugins and fresh Android+iOS templates; two prebuilds with identical security hashes. |
| `python scripts/test-native-artifact-inspector.py` | 54 fixtures pass. | Positive/negative decoded metadata fixtures, including rejection of unexpected CAMERA permission. |
| `node --check mobile/plugins/withMovefieldSecurity.cjs` | Pass. | Plugin syntax. |
| `node --check scripts/check-native-security-config.cjs` | Pass. | Harness syntax. |
| `git diff --check` | Pass. | Patch whitespace. |

The ten new prebuild assertions are five checks run on each generated project: exact CAMERA annotation, exactly one annotated permission element with the removal instruction intact, no manifest-wide suppression, no application-wide suppression, and recursive inspection proving that no other XML element carries a lint annotation. The original one-marker-per-blocked-permission and bounded main-permission checks remain active. Source/log/generated hashes and full focused outputs are recorded in `docs/qa/native-compilation-2026-10-09/native1-source-validation.json`. No generated Android/iOS directory in the repository was created or modified by the isolated harness.

Next: checkpoint the annotation, run the actual native workflow on the published head, and require Android compilation/lint plus same-APK manifest/rules/resource/signature inspection to pass. Retain any remaining warnings and the `NO-SOURCE` test limit honestly. Simulator/debug-signed compilation is separate from device backup/interruption behavior, release signing, native model execution and distribution/store acceptance. The existing strict dependency release blocker also remains separate from this lint repair.
