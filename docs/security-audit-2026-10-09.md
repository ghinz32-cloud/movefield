# Current audit completion — NATIVE8

Qualified application source `e85a1ad320ec23db29b337fdee10f41f1dc24962` passed actual Android and unsigned iOS Release simulator compilation, strict packaged inspections and SQLite default3 build-route collection in run37984196327. Quality37984196434 passed31 collector fixtures,55/55 regressions and3/3 production suites. Checked DELETE/EXTRA policy, all12 transaction guards and the custom rebuild requirement are implemented; no app corruption was reproduced.

The final report is [audit-completion-2026-10-09.md](audit-completion-2026-10-09.md). Official source/job/artifact metadata and raw Android/quality logs are retained under native8/ci; new native ZIP-byte replay was unavailable after the execution interruption. Historical source7 full11-privacy replay remains separate. PAGE4 is live and its118 starter entries match unchanged mobile source. Strict dependency, complete native binary SCA, physical-device, signing/disclosure and native-inference/account gates remain.

The original source-audit record below keeps earlier milestone statuses as history.

# Movefield cross-platform security audit — 9 October 2026

Scope: the baseline published source at `587438a8a2ba21cf88c943f857348dd7190eb078` and subsequent SEC1, SEC2 and SCI1 checkpoints, browser application and optional model workers, Expo Android/iOS application, imports/exports, encrypted storage, notifications, build inputs, downloadable source and GitHub workflows. This is a source/configuration and automated-test audit. It is not an independent penetration test, a store approval, or a physical-device certification. The requested GitHub Pages prototype publication is separate from a production mobile release.

## Findings and repairs

| Finding | Result | Evidence |
| --- | --- | --- |
| Android automatic backup had no encryption-aware exclusion policy | Backup denied and all nine legacy/cloud/device-transfer domains excluded | Fresh real Expo prebuild and parsed XML; `mobile/docs/native-security-2026-10-09.md` |
| Unneeded overlay, legacy storage, camera and microphone permissions could enter native manifests | Explicit library-merger removals; release cleartext denied | Generated main manifest checks; final APK merger inspection remains required |
| iOS had no explicit application identifier or application-level API reasons | Identifier and scoped privacy reasons declared; SDK OS floors explicit | Actual generated Info/Privacy plists and repeated-prebuild fingerprints |
| Native infrastructure images floated with `latest` | Current supported named SDK57 images pinned | Official Expo infrastructure documentation; names are not immutable infrastructure hashes |
| Production developer loaders needed an explicit boundary | Android release flags false; Apple autolinking debug guards verified | Installed dependency source; final release compilation/metadata inspection is a separate gate |
| Public mobile ZIP recursively scanned local files | Git-index source allowlist, credential/symlink rejection, local plugin validation, atomic publication | 12 independent packaging fixtures including existing ZIP preservation |
| Transfer-file password/header/output limits differed between opening and creating | Bounds checked before KDF; malformed large/odd ciphertext rejected; RNG lengths verified | 62 transfer checks with real Argon2id/XChaCha20-Poly1305 |
| Transfer operations retained owned secret byte buffers | Password byte arrays, derived keys and plaintext byte arrays cleared in `finally` | Reference-observing wrappers around real crypto, including authentication failure |
| CI checkout retained a write-capable credential in Git configuration | `persist-credentials: false`; read-only workflow permissions retained | Workflow source inspection |
| JavaScript export was the only platform build gate | Android release compile/lint and unsigned iOS Release simulator jobs added, with final artifact inspectors | SEC2 iOS Release simulator compile and stronger metadata inspection succeeded. SEC2 Android assembled but one camera-removal-marker lint diagnostic blocked final inspection; NATIVE1 annotates only that removal node |
| Legacy cleanup failure could silently leave older plaintext | Persistent exact-copy receipts, restart-visible status and authenticated safe retry; changed or unknown copies preserved | 22 actual SQLite scenarios and 25 compiled UI scenarios / 77 assertions; `mobile/docs/native-privacy-cleanup-2026-10-09.md` |
| Final compiled security metadata needed stronger checks | APK resource links and all nine backup domains checked; iOS ATS and SDK privacy metadata fail on unreviewed shapes | 54 inspector regression tests; SEC2 assembled iOS root and 11 SDK privacy manifests inspected successfully. Android same-APK checks remain pending until fresh NATIVE1 CI |

JavaScript strings and runtime/crypto-library internal copies cannot be reliably erased. Buffer clearing reduces retention of owned arrays; it is not a claim of complete memory sanitization. The existing transfer format and Argon2id parameters remain compatible (19MiB, two passes, one lane); this is an offline encrypted backup, not account authentication.

## Trust boundaries reviewed

| Boundary | Current controls | Remaining limits |
| --- | --- | --- |
| Imported training and backup JSON | Size/count/range limits, known-field schema, forbidden prototype keys, reference integrity, preview/version checks, active-workout protection | Parsing and password KDF use device memory; low-disk/low-memory phone behavior needs device evidence |
| Browser persistence | Non-extractable AES key and snapshots in atomic IndexedDB transactions; revision/key-epoch guards, tombstones, verified migration, Web Locks | Same-origin running code can read decrypted training. This is local encryption, not an application login or biometric lock |
| Phone persistence | SecureStore device-bound key; slot-bound authenticated encryption; parameterized SQLite, atomic history/head CAS, readback and recoverable key-ring journal | Keys are available after first unlock; state remains in process memory; no app-switcher shield. iOS can back up ciphertext without a usable key |
| Legacy record migration | New encrypted SQL is authoritative; stale data never used after a tombstone. Exact lossless fingerprints are journaled atomically, with restart-visible status and authenticated retry | Denied deletion can retain plaintext. Changed/unreadable/unknown copies are preserved; these shadows are not included automatically in authoritative raw recovery exports. No OS-wide compare-and-delete or forensic erasure claim |
| Transfers and plain exports | Explicit password protection or clearly identified plain copy, restore review, authenticated header, temporary native file cleanup | Plain exports are intentionally readable. OS/process interruption can leave a cache copy; recipients/other apps become responsible for shared copies |
| Notifications | Opt-in local permission, generic message body, Android private visibility, bounded schedule, race/cancellation checks | Lock-screen display, reboot/background delivery and denial follow OS/user settings; test actual devices |
| Browser document/links | Worker-hosted build has rotating script nonces, exact model connect paths, blocked unused writes/internal routes; untrusted content rendered as text; HTTPS credential-free external links | Pages static hosting cannot supply all those response headers. Its separate static CSP and project scope require their own checks |
| Optional models | Explicit exact-manifest download consent, opaque owned files, byte/hash checks, isolated late writers, pre-load rehash and deletion leases | Native inference is disconnected; no real weights/device performance qualification. Web model workers disable network in code; no remote training-data API |
| Identity/integrations | UI identifies account/sharing/wearable previews; no working server write/account endpoint | No real authentication, authorization, cloud ownership, sync, HealthKit or Health Connect. Do not submit placeholder claims as available features |
| Source and supply chain | Frozen lockfiles, SHA-pinned actions, read-only CI, no observed tracked credential/private-key matches, public source allowlist | Native install age policy is not inherited from pnpm. Future new SDKs require another privacy/permission/reachability review |

## Dependency gate

The fresh strict release audit still fails on `GHSA-vfj7-8cjw-p6xm` (`braces`) and `GHSA-86w9-cpqp-85rv` (`node-forge`). Current official advisories offer no patched version. The existing short-lived CI exceptions do not waive the release gate. A fresh web production-only audit reports zero findings; the native production-classified tree still reports 15 overlapping propagated high entries because Expo brings CLI/Metro packages into that dependency classification. Dependency labels alone do not establish binary reachability or absence of a vulnerable development path. No incompatible Expo downgrade or fabricated clean-release exception is applied.

## Android and Apple release acceptance

Run the native compilation workflow and inspect its exact-commit artifacts. The Android template uses public debug signing for this test compile; the iOS application is an unsigned simulator build. Neither is a store-distribution artifact. Native test tasks with no application XCTest/instrumentation suites are not evidence that user flows passed.

Before actual distribution, the owner needs valid developer identities/signing, final merged manifest and iOS privacy aggregation, an accurate public privacy/support contact, final Apple export-compliance answers for the JavaScript cryptography, current Play Data Safety/health-app declarations and Apple privacy metadata, and physical Android/iPhone acceptance. Cover encrypted save/restore interruption, permission denial/reboot, low disk, cache eviction, export/import interruption, reinstall/OS restore, offline updates, accessibility and app lifecycle. These gates are pending until observed; the source audit does not promise either store's approval.

The prototype is for ages14+. Youth require qualified supervision and do not receive maximal testing or unsupervised automatic progression. This is not a clinically validated medical app or rehabilitation prescription. Science evidence and goal-specific recipe review are recorded in a separate all-template audit.

## Primary references

- [OWASP MASVS](https://mas.owasp.org/MASVS/) (coverage taxonomy, not a certification claim).
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [cryptographic storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [app privacy](https://developer.apple.com/app-store/app-privacy-details/), [required API reasons](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons) and [export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/).
- [Android backup guidance](https://developer.android.com/identity/data/autobackup), [Play user data](https://support.google.com/googleplay/android-developer/answer/10144311) and [health-app policy](https://support.google.com/googleplay/android-developer/answer/14738291).
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [privacy manifests](https://docs.expo.dev/guides/apple-privacy/) and [build infrastructure](https://docs.expo.dev/build-reference/infrastructure/).
- [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and [forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv).

Fresh verification results and exact source fingerprints are retained under `docs/qa/cross-platform-security-2026-10-09/`. Report publication details are separate from application validation.

## Checkpoint and actual compilation coverage

| Checkpoint | Published source / tree | Observed acceptance |
| --- | --- | --- |
| SEC1 platform/crypto/packaging | `e3dc78907c611ba064943d8512a0e8d121db078e` / `55df2e914a280482a491e18e2b593dfc8aaea183` | 50 source regressions, 3 production checks, 104 generated native assertions; first iOS simulator Release compile succeeded; Android SDK setup failed. |
| SEC2 persistent cleanup / stronger inspectors | `c9b6471f916f4a70e4b828cf54c6ad93040962f7` / `2e58e02cffe74f7af6d7a42f47f0a24c1c251958` | 52 source regressions, 3 production checks, real SQLite/UI privacy tests, 54 inspector fixtures; actual CI quality and unsigned iOS simulator Release/metadata succeed. Android assembles but camera-removal-marker lint fails; unit-test task has NO-SOURCE. |
| SCI1 evidence / schedule / time | `5af4582fe4bc78e60a07952a3b0bf0eca3592c8f` / `4efd7bd8d72f503e47c26e451e8c5e5395635699` | 53 effective local suites across full attempt plus two repaired reruns; actual SCI1 GitHub quality run37969466143 has a verified53/53 regression artifact and3/3 production artifact on the exact published tree; peer schedule/focus invariants and native parity pass. Separate all-template science report retains precise limits. |
| NATIVE1 narrowly scoped lint repair | Resolve this report's next source checkpoint in Git history | Fresh repeated real prebuild 114 assertions and 54 inspector fixtures pass. Actual updated compile/lint/APK metadata is still an asynchronous CI gate. |

The exact SEC2 metadata artifact digests, decoded iOS plists, source-tree confirmation and failed Android lint evidence are retained in `docs/qa/native-compilation-2026-10-09/`. A metadata inspector verifies declared fields and resource links; it does not prove every SDK's machine-code use of a reason API. The iOS simulator and Android public-debug-signed test build do not constitute production signing or physical-device acceptance.
