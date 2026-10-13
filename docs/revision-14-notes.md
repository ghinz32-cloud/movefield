# Revision 14 notes

Status: local work only. Not deployed, not published, not shared. Nothing was sent to Cloudflare or any sharing or source endpoint. Only the `review-fixes` branch was pushed to GitHub, as you approved.

## What changed

- **Phone data encryption.** Saved training and setup drafts are sealed with XChaCha20-Poly1305 before they reach AsyncStorage. The key lives in the device's secure store and is never written to AsyncStorage. Old plaintext data is sealed on first read. If the key is missing, the app shows a clear message and does not overwrite anything.
- **Text size.** Five steps on web and phone: 85%, 92%, 100%, 115%, 130%.
- **Spacing and button size.** Compact, Comfortable (default) and Roomy, on web and phone. Compact keeps buttons at least 32 px tall on the web and 44 pt on the phone.
- **Color themes.** Five new palettes: Ember red, Crimson, Signal red, Amber gold and Graphite. Eleven in total. Each passes the existing contrast checks for light and dark.
- **Fonts.** Saira, Lexend and Nunito, added to the existing Athletic, Bold athletic, Easy to read and Classic. Seven in total. Each font's OFL notice is included.
- **Plate calculator.** Works out the plates for each side of a barbell load, with the bar and standard plates. Shows the nearest loadable total when the load can't be made exactly. Web: top of the workout page. Phone: top of the Library tab.
- **Warm-up ladder.** 40%, 60%, 75% and 85% of a working load, rounded to loadable steps. A barbell set never goes below the bar. Dumbbell loads are per hand. Adults only; under-18 warm-ups are left to the supervisor.
- **Weekly review.** The last seven days from the active plan: planned and completed sessions, missed sessions, sets logged, planned sessions in a row, and new estimated bests. Counts only; it changes no plan. Web: top of Progress. Phone: top of History.
- **Estimated bests.** Uses the existing estimate, which needs rated sets, and compares only with earlier sessions for the same exercise and setup. Adults only.
- **Backup.** Settings can export a backup as plain JSON and restore it by paste. The export is not encrypted.

## Checks run

- Web: `pnpm exec tsc --noEmit`, `pnpm build`, `check-preferences` (98 checks), `check-audit` (11), `check-tools` (33, new).
- Phone: `npm run check`, `npm run test:engine`, `npm run export:mobile` (iOS and Android bundles), `check-native-storage` (now covers encryption at rest, tampering, slot binding, legacy migration and key loss).
- Visual, headless Chromium: sample workspace on desktop and phone (ember, compact, Saira); Appearance dialog with all eleven palettes; workout page with the calculator (crimson, Lexend); dark mode with signal red and high contrast (Nunito, roomy). No page errors. No horizontal overflow at 390 px.

## Not verified

- The phone app has not run on a physical iPhone or Android phone, or in a simulator. Secure-store behaviour on real devices is untested, and so is restoring app data to a new phone (expected to show the "key not on this device" message). Native screens have no screenshots.
- Keyboard and screen-reader behaviour of the new controls was not tested beyond labels, roles and `aria-pressed` or `aria-selected` states.
- Contrast was calculated for the design tokens, not every rendered pixel.
- Plate and warm-up rounding uses standard plates. A gym with unusual plates needs a check by hand.
- Personal bests depend on RIR ratings being logged, so most workouts will not produce one yet.

## Decisions for you

1. **Web data encryption.** The website still stores data in browser storage without encryption. Encrypting it means making the load asynchronous. Say whether you want that now.
2. **Encrypted exports.** Backups from Settings are plain JSON. A passphrase-protected export would be the next step.
3. **Publication.** Nothing is deployed. Ask before any deploy or sharing change.
