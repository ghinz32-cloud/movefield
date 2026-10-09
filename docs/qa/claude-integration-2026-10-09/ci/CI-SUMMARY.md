# Exact-source CI evidence — 2026-10-09

The official native workflow and quality workflow completed successfully for published source `83b2f94cdc7cd697b9cb45f311794c4371ca4826`, tree `1c47d2b0343e0d1768deda6850e50be38cac6ad7`.

- [Native build run 37990501073](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073): completed/success; updated 2026-10-09T21:08:08Z.
- [Quality run 37990501064](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501064): completed/success.
- Native jobs explicitly checked out the published pull-request head. Quality checked out pull-request integration commit `dbfcb2d69520076b2769ec47aecf82f165e84c77`; official commit metadata confirms the same source tree. Initial source/integration receipts and final official metadata are retained alongside this file.

## Real compilation and retained artifacts

Android job [114023200579](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/job/114023200579) completed successfully at 21:08:08 UTC. The actual release APK compile/lint step ran 20:59:49–21:07:43 UTC. Decoded logs contain `BUILD SUCCESSFUL in 7m 53s`, actual merged APK manifest inspection, signature/hash commands, resolved dependencies and SQLite C build-route collection, verified test APK packaging, and successful binary/evidence uploads.

iOS job [114023200539](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/job/114023200539) completed successfully at 21:03:32 UTC. The unsigned Release simulator application compilation ran 20:59:36–21:03:18 UTC. Official step metadata reports successful built privacy/transport inspection, SQLite Release build-route collection, simulator application packaging and binary/evidence uploads. The two actual native compilation intervals overlapped for 3m 29s.

| Artifact | ID | ZIP bytes (official metadata) | ZIP digest (official metadata) | Expires UTC |
| --- | --- | ---: | --- | --- |
| native-input-decision | 11645340985 | 754 | sha256:b4a067f76c4a6413b404ee48c5926878b22f501a258002ac167c3cb9e3a42145 | 2027-01-07T20:58:17Z |
| android-release-compilation-test-only | 11645178051 | 344388 | sha256:46ade14fa39f6a54d359a48543ed8d5d4a2f20fe1d6daaee45454589f6c3efcb | 2027-01-07T20:58:17Z |
| android-arm64-preview-test-only | 11644933560 | 18808015 | sha256:c74a5395ee43031e641bdc40248ca9a7b6e536aad7740374022ac5b2d5e528e5 | 2026-11-08T21:08:01Z |
| ios-simulator-preview-test-only | 11644643820 | 18568401 | sha256:154c24e2e1acfb8a6cbe8aeb1365633ed036086c0a180825920cd7e02de10f55 | 2026-11-08T21:03:24Z |
| ios-release-simulator-compilation | 11644458910 | 23246 | sha256:73c0194312cab0d2fd599f6a1a1042798308007d4af694301f402b00924f206a | 2027-01-07T20:58:17Z |

Binary artifact links:

- [Android arm64 test APK artifact](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/artifacts/11644933560)
- [Unsigned iOS simulator application artifact](https://github.com/ghinz32-cloud/movefield/actions/runs/37990501073/artifacts/11644643820)

These are test binaries. The Android APK is generated using the repository's test build/signing path; the iOS application is an unsigned simulator build. This evidence does not establish a signed iOS device IPA, TestFlight upload, App Store submission, Play Store submission or EAS build.

## Quality coverage and limits

The decoded quality log records 66/66 regression check suites passing, native type/training checks, web type/lint checks, production bundle/security checks, static Pages checks, Android/iOS Hermes exports and the dated dependency gate. The production initial bundle budget was 396925 gzip bytes against a 400000-byte limit.

Quality success retains explicitly declared release-blocking advisory exceptions for web `braces` and mobile `braces`/`node-forge`; it does not mean the dependency audit is clean. CI action and native/toolchain deprecation warnings are present, so a blanket zero-warning CI/build claim is unsupported. Android `testReleaseUnitTest` was `NO-SOURCE`, not executed native unit tests.

The quality and native gate decoded logs and Android decoded build log were retrieved and retained. The iOS decoded log connector returned `Transport closed`; a generic fetch fallback was unsupported. Both current binary artifact references were created successfully through the official connector, then received exactly one local materialization attempt each. Both attempts returned HTTP 403. No local artifact-byte replay or receipt inspection is claimed. The authoritative evidence is the official run/job/step metadata, Android upload logs, and retained artifact IDs/sizes/digests.

No physical browser/device restart, real phone installation, physical-device inference, OS notification/background acceptance or user-flow acceptance is established by these CI results.

## Local receipt handling

Only new files under this CI evidence directory were written by the monitor. The terminal checkout source commit was unchanged while monitoring: `e2cbabd8b521a09946ebbc5830e3bb831120599f`, whose tree matched published source `1c47d2b0343e0d1768deda6850e50be38cac6ad7`. Later web-only source changes, if any, require their own quality receipts and are outside this exact-source native qualification.
