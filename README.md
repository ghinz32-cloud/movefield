# Movefield

Movefield is a fitness planning and workout-tracking prototype for the web and an Expo iOS/Android starter. Training accounts, automatic sync and app-store releases are not implemented.

Read [the quality audit](docs/quality-audit-2026-10-08.md) and [the product requirements](docs/product-requirements.md) before treating a preview as a finished feature.

## Web development

Use Node 24 and Python 3. `npm run install:ci` installs the locked dependencies. `npm run dev` starts the framework; `npm run build` makes a production build. Both commands generate the current downloadable mobile source ZIP. Static files belong in `public/`; hosting configuration belongs in `.openai/hosting.json`. The original flattened upload manifest has been retired because it no longer describes this corrected tree. See [runtime details](docs/sites-runtime.md) for the Sites build environment.

## Mobile development

See [mobile/START-HERE.md](mobile/START-HERE.md). From `mobile/`, run `npm ci`, `npm run check`, `npm run test:engine`, and `npm run export:mobile`. Native bundles are source/build verification; real iPhone and Android acceptance remains required.

After editing shared web domain code or guide content, run `node mobile/scripts/sync-shared.mjs /absolute/path/to/movefield`. Commit the resulting snapshots. CI rejects drift.

## Quality checks

Run `npm run check`, `npm run lint`, `npm run test:regression`, then `npm run build` and `npm run test:production`. Run `node scripts/check-dependencies.mjs` after both dependency installations. CI also exports Android and iOS bundles. Known unfixed dependency advisories are documented release blockers with an expiring CI exception, not a clean security certificate.

## Where records live

Web records are in browser localStorage; mobile records are in unencrypted AsyncStorage. Backups are plain JSON saved through an explicit file download/share action. There is no configured D1, R2 or account database. A hosting sign-in wrapper does not supply Movefield accounts or training sync. Keep copies before clearing browser/app data.

Exercise descriptions have provenance and license records. Imported photo files are withheld because the upstream maintainer cannot confirm image rights. Candidate references remain in metadata for replacement; no photo is fetched by the guide UI. Owned/licensed demos and exact-movement review are still needed.
