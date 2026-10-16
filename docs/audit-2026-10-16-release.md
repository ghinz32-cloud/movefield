# Release parity and original-site audit · 16 October 2026

## Initial live checkpoint

Claude's `routine-library` branch is pushed at `ea9e4d5e450957d6304ef2fdba967660e8579ec9`. At the start of this audit, its new module was absent from both public web previews, all four native-source download routes and both Android installers. This section records that starting point; subsequent release verification must identify the newly compiled and deployed source separately.

| Surface | Verified initial publication |
| --- | --- |
| [Movefield review](https://ghinz32-cloud.github.io/movefield/review/) and [Grizzly](https://ghinz32-cloud.github.io/movefield/grizzly/) | Source `b1efc4d2e31e2bb58493666ea39434b4572e4823`, application SHA256 `0aca4af9bb66fa7981ff41d78788a46cefdd68c54457fa84e2e91c279198ac1f` |
| [Android previews](https://github.com/ghinz32-cloud/movefield/releases/tag/android-ux-preview-08c6844d0fb4) | Compiled source `08c6844d0fb4092cda1672498e3afc7dcd4149a6`; Movefield 0.1.4/code 5 and Grizzly 0.1.3/code 4 |
| GitHub Pages | Commit `1d245e9383f9a2b421f3df02d3a25f0da17b6c58`; successful [deployment 38513895225](https://github.com/ghinz32-cloud/movefield/actions/runs/38513895225) |
| iPhone | Source available; no signed IPA, TestFlight or Apple build/signing setup |

Independent HTTPS checks matched 345 selected files: all 63 preserved original-root files, 140 Movefield review files, 138 Grizzly files and four release assets including both complete APKs. Both downloaded APK signatures independently matched the historical development certificate `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. These checks establish delivery integrity, not installation, phone behavior or store acceptance.

## Prepared next Android identities

The current configuration advances historical Movefield to **0.1.5/code 6** (`com.ghinz32.movefield`) and separate Grizzly to **0.1.4/code 5** (`com.ghinz32.grizzlyfitness.prototype`). URL schemes, package identities and the required historical preview certificate stay the same. The default Movefield prototype remains separate. These are prepared identities; only successful exact-source compilation, artifact inspection and live download verification establish delivery.

The upgrade regression checks retain historical encrypted records and test both configuration identities against their previously published version codes. The actual APK identity checker is also exercised with synthetic manifest/signature outputs: it rejects previous/future codes, wrong names or packages, missing/wrong certificates and multiple signers. Synthetic fixtures do not establish that a new APK was compiled or signed.

Focused validation passed **45 legacy-upgrade groups**, including four configuration-identity groups and 16 synthetic APK identity cases. An independent offline consistency check confirmed that the Expo configuration, actual APK checker and publisher agree on both package/version pairs and installer filenames; Python syntax and patch whitespace checks also passed.

## Separately preserved original website

The [original root](https://ghinz32-cloud.github.io/movefield/) is a different application, not another deployment of the current review. Its recoverable source is `9cdcec081bee3525838ac334da1bb48de6690f13`, tree `45d6d18cc693a72179424c1936dd503bd7d09517`, on `audit/2026-10-08-quality`. That branch's `docs/qa/exercise-first-2026-10-09/pages/live-readback.json` binds the source to Pages `831fc32e045736fb9bb907b4de772099ce201ad7`. Only its original `index.html`, `pages-manifest.json` and `sw.js` later changed to expose separate preview links and update integrity metadata.

Nineteen original-root rendered states were inspected in disposable sandboxed Chromium contexts. Landing/onboarding covered widths 320, 390 and 1280; sample navigation covered 320 and 1280. No horizontal overflow or JavaScript page errors occurred. Two existing accessibility findings remain:

- **Unnamed progressbar:** Build my plan → step 1 exposes `role="progressbar"` without an accessible name at all three widths. The legacy source location is `components/training-onboarding.tsx:57`.
- **Inactive-tab contrast:** Plans → Saved and Paths use 3.89:1 text contrast against a 4.5:1 requirement at both navigation widths. The legacy source location is `components/ui/tabs.tsx:67` (`text-foreground/60`).

The root uses its own IndexedDB `movefield-vault`/version 2, non-extractable AES-GCM key, encrypted split-history records, restore journal and coaching/runtime code. Replacing it with the current review would not provide automatic compatible access to its existing records. Current instructions therefore continue to preserve its files and profile.

A separate maintenance update is structurally possible: Claude's original 125 routine IDs have no collision with its 75 program definitions, all 51 referenced exercises and 17 source keys already exist, and complete accepted plans are stored independently of catalog definitions. This does not qualify the prescriptions under the legacy engine. Only audited definitions and necessary validation rules should be ported, followed by its own scheduling, equipment, duration, history/recovery and browser checks.

Do not run the legacy `scripts/publish-pages.mjs`: it deletes the previous generated tree and would remove the review, Grizzly and current downloads. Any later root repair needs a narrow publication overlay preserving both previews, installer distributions, discovery links and retained chunks. No original-root repair or routine publication is claimed by this baseline audit.

## Remaining platform limits

Physical Android/iPhone installation, actual old-to-new upgrades, OS lifecycle/offline behavior, notification delivery, VoiceOver/TalkBack, device performance, store approval and connected-provider qualification remain separate gates. The owner has no Apple setup yet. Source exports and browser simulations cannot close those gates.
