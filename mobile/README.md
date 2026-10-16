# Movefield and Grizzly Fitness — native apps

Both brands share the training engine, researched routine catalog, exercise guides, encrypted local records, setup, workout logging, corrections, calendar and local coaching. Grizzly has its own appearance, app identity, preferences and records. Workout tracking and written guides work offline; external videos/pages need a connection. Account and cloud-backup code is present but remains disabled without configured and qualified services.

Installable Android **test** apps are available from the current download pages:

- [Movefield Android downloads](https://ghinz32-cloud.github.io/movefield/review/downloads/android.html?app=movefield)
- [Grizzly Fitness Android downloads](https://ghinz32-cloud.github.io/movefield/grizzly/downloads/android.html?app=grizzly)

Use the version and verification details on those pages. Open the link in Chrome or Samsung Internet if an in-app browser stalls during download. Preserve an existing installation and its records; read [Android upgrades](./ANDROID-UPGRADE.md) before updating. The owner confirmed Movefield **0.1.6** installed and opened with saved workouts on a Samsung S24 Ultra. That confirmation does not qualify later builds, every record or Grizzly.

This source targets Movefield **0.1.8/code 9** and Grizzly **0.1.7/code 8**. A source version alone does not establish a published installer; the download pages list the verified binaries. There is no signed IPA or TestFlight release. [iPhone distribution](./IOS-DISTRIBUTION.md) explains the prepared source and remaining build/signing/device steps.

## Develop and validate

Use Node 24 and run these commands from `mobile/`:

```sh
npm ci
npm run check
npm run test:engine
npm start
```

`npm start` opens the local Expo development workflow; `npm run start:grizzly` selects Grizzly. The repository root uses pnpm, not npm. Canonical shared training code lives in `../lib`; refresh its copied native snapshot with `npm run sync:shared -- <absolute-repository-root>` after a reviewed shared change. Do not edit only the copy in `src/shared`.

The supported browser products are the separate [Movefield web app](https://ghinz32-cloud.github.io/movefield/review/) and [Grizzly web app](https://ghinz32-cloud.github.io/movefield/grizzly/). React Native Web checks and Expo's `export:web` are development surfaces, not replacements for that browser app: private native saving depends on platform SecureStore, Crypto and SQLite. There is no plaintext browser fallback. Native source/Hermes exports are also not signed phone installers.

## Qualification and recovery

Current Android test delivery is ARM64, Android 7/API 24 or newer; iOS source targets 16.4 or newer. Source and browser checks do not qualify installed upgrades, real notification delivery, locale keyboards, VoiceOver/TalkBack, tablet/foldable posture or all supported phones. Keep an encrypted backup and its separate recovery material: the native device key is device-bound, and Android automatic backup/transfer is excluded. A downloaded backup should be verified before relying on it for a device move.

In the full repository, see the [native audit and release gates](../docs/comprehensive-2026-10-16-native.md), [foldable audit](../docs/comprehensive-2026-10-16-foldables.md), and [current handoff](../HANDOFF.md) for exact evidence and remaining work. Those root-level reports are outside the mobile-only source ZIP. Earlier revision notes and [START-HERE.md](./START-HERE.md) provide historical development guidance; current delivery and recovery documents take precedence.
