# Grizzly Fitness Wautoma

User request, 12 October 2026: a separate Grizzly Fitness app with the same training features and a different UI. The official website supplied by the user is https://www.fitnessgrizzly.com/. Its homepage returned an explicit proxy destination denial in this environment. Domain additions were saved using the supported environment configuration workflow; that save does not activate access. No official logo, colors, membership details or gym services have been inferred.

## Implementation

- A separate web entry at `/movefield/grizzly/`, built with `pnpm build:grizzly` into `.sites-runtime/github-pages-grizzly`.
- Shared `app/page.tsx`, components and canonical training modules. No copied workout engine, invented progress scores, altered training targets or automatic data migration.
- Original provisional bear vector mark, amber/cream/woodland colors, claw corner accents and a finite paw entrance on the Today card. Mark/color replacement remains pending retrieval of the official assets.
- Bungee headings and Inter controls/data. Both fonts are self-hosted. Bungee came from the Google Fonts repository's `ofl/bungee/Bungee-Regular.ttf`; SHA256 `c4f5361ce120af3e6b9156d0bf379fa19cda2ea0cd18ac01fd99596c6bf66e3f`. The bundled SIL OFL notice includes attribution to the Bungee Project Authors. PNG native icons are rasterizations of the original provisional SVG.
- Existing buttons, drop-downs, plan previews and disclosures stay in place. The prototype information sits behind “About this version.” No continuous bear animation, audio or animation around the rest timer.
- System/Light/Dark, six palettes, larger text, higher contrast, visible keyboard focus and both system/in-app reduced motion remain available. Amber replaces the first palette in Grizzly; default Movefield keeps Volt green.

## Separation

The web build namespaces the existing `training-studio` keys and locks as `grizzly-training-studio`, uses `grizzly-private-records-v1` for IndexedDB, `grizzly-cloud-outbox-v1` for the queue, and `grizzly-fitness:preferences:v1` for appearance. Its worker scope is `/movefield/grizzly/` and cache prefix is `grizzly-fitness-shell-`. Static Pages cannot call the optional Cloudflare account service; all training data stays local.

Native `EXPO_PUBLIC_APP_VARIANT=grizzly` selects a separate Expo name/slug, `com.ghinz32.grizzlyfitness.prototype` install ID, `grizzlyfitness` callback scheme and `grizzly-fitness.` storage/key namespace. SQLite uses `grizzly-fitness.movefield-private-records-v1.db`. Reminder kinds/IDs and temporary export files also have separate prefixes, including in Expo Go. The normal Movefield config and stored identifiers remain unchanged. The portable vault format remains `movefield-vault`; branding must never rename a cryptographic format. Deliberately imported backups remain interoperable.

From `mobile`, use `npm run start:grizzly` or `npm run export:grizzly`. In this managed environment, the tested export is `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 CI=1 XDG_CACHE_HOME=/workspace/movefield/.sites-runtime/cache npm run export:grizzly -- --max-workers 4`. Default native commands select Movefield. See `mobile/GRIZZLY.md`; clear Metro when switching flavors. Both export commands now include `--clear`: a reused Metro transform cache produced identical Grizzly/default bundles during qualification and was rejected. Distinct final bundle hashes are required. Grizzly has separate API URL/qualification flags and cannot accidentally use the Movefield cloud origin.

## Verification and publication

The first Grizzly build passed all 18 existing browser regression journeys, 32 rendered axe/reflow states including 320px at 130% text, and six preference persistence/failure/multitab checks. A final build rerun is recorded separately before publication. `scripts/check-grizzly-brand.mjs` verifies loaded Bungee, amber, full-width phone action, offline reopening with the font, both motion settings and preservation of both Movefield profiles/databases/caches through actual Grizzly migration and erase. `scripts/check-grizzly-native.cjs` verifies separate config and encrypted persistence with real Node AES-GCM/SQLite and mocked OS boundaries; Grizzly erase keeps Movefield decryptable.

The shared 18-group core suite passed. Both Movefield and Grizzly Android/iOS Hermes JavaScript exports passed. These are not installed Android/iPhone, keychain, notification, app-store or comprehensive WCAG qualification. Existing native tooling advisories and broader six-prompt launch gates remain unresolved; this UI customization does not close them.

Publication uses `scripts/prepare-grizzly-pages.py --base-commit <inspected-gh-pages-SHA>` and `scripts/create-grizzly-pages-commit.py`. They preserve both existing apps byte-for-byte except the original site's discovery banner and its matching pinned index manifest/worker. A temporary Git index creates a normal child commit; no source checkout replacement, worktree, force-push or paid service is involved. The script deliberately stops if an existing Grizzly directory is present; future replacement must inspect that directory and its ownership manifest first.

Expected preview: https://ghinz32-cloud.github.io/movefield/grizzly/. The publication receipt records actual push and live verification separately. The Pages hostname remains the owner's prototype; no official gym launch or endorsement is claimed.

Final cleared-cache native exports have distinct SHA256 values on both platforms. The export comparison receipt is `.sites-runtime/native-flavor-exports.json`; the Grizzly source download is `public/downloads/grizzly-fitness-native-source.zip` and contains 113 verified source files plus its manifest. No APK/IPA was produced.
