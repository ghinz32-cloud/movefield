# Android, iOS and website readiness — 9 October 2026

This checkpoint is a prototype and security-hardening result. It is not Apple/Google acceptance, a penetration-test certificate or confirmation that every device works. Static website publication does not certify the mobile release.

| Gate | Verified evidence | Remaining work |
| --- | --- | --- |
| Android configuration | Repeated actual Expo prebuilds; backup domains denied, permission removals, HTTPS policy, stable ID and OS floors | Actual physical-device backup/transfer/permissions, process interruption, low storage and accessibility |
| Android compilation | NATIVE1 actual release APK assembly and lint passed; unit-test task NO-SOURCE | NATIVE2 exact rules decode;22 unused SDK grants found and removed in NATIVE3; final new-source inspection pending; release signing and installed-device test |
| iOS compilation | NATIVE1 actual unsigned Release simulator compilation and assembled privacy/ATS inspector passed in CI | Physical iPhone, distribution signature/provisioning, installation, denied permissions, storage/transfer/accessibility; final API-reachability/disclosure audit |
| Local records | Atomic encrypted IndexedDB and SecureStore/SQLite, revision/restore/key recovery, bounded import/backup, restart-visible legacy cleanup | Same-origin/runtime compromise is outside local-at-rest encryption; real OS/device interruption tests, no cloud sync/accounts |
| Dependencies | Strict release gate blocks high findings, including expired/dated CI exceptions | Braces GHSA-vfj7-8cjw-p6xm and node-forge GHSA-86w9-cpqp-85rv remain high roots; no clean release claim |
| Public Pages | Dedicated static build, output allowlist, early CSP, pinned/scoped offline files, generated-tree publication and HTTPS byte readback | Real browser/offline/restore/reflow; Pages cannot supply server/worker CSP headers; Qwen unavailable here |
| Workout science | 75 originals,20 references plus legacy paths/modifiers reviewed; schedule/rotation/time/population/source repairs tested | Exact templates have zero independent outcome validations; individual tolerability/results are not established by engineering checks |
| Native AI | Optional exact-manifest file consent, verification, cancellation and deletion tests | No native inference, actual device memory/latency/offline qualification or trained-adapter promotion |
| Store identity/privacy | Stable technical IDs, public privacy notice, user-initiated support, no real account/sharing/health-integration claims | Developer-owned store accounts/legal identity/contact, final App Privacy/Data Safety/Health Apps/age disclosures tied to the signed binaries; no fabricated details or submission |

Apple's [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) require privacy and complete, accurate functionality. Google's [Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469) requires developers to declare actual collection/sharing/protection; its [health-app publishing guidance](https://developer.android.com/health-and-fitness/health-connect/publish) also lists the Health Apps declaration. SDK manifests are evidence, not a replacement for runtime/disclosure checks. Developer console declarations are not submitted in this task.

Current science references, per-template applicability, dose estimates and review depth are in `docs/workout-science-2026-10-09.md` and its QA register. The current [ACSM position stand](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/) supports consistent, progressive, goal-specific resistance training for healthy adults. Adult recommendations do not establish youth or clinical suitability; the separate youth/older-adult sources and explicit supervision limits remain.

Do not remove the strict dependency gate, alter age/population scope, silently activate unqualified models or call fixture success store approval. Follow the independently testable milestones and recorded exact-source CI/artifact receipts. The next external gates need real devices and developer-owned signing/store details; none are invented by the build scripts.
