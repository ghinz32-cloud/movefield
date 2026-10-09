# Current PAGE4 checkpoint — 9 October 2026

Pages `b8fe5ea6b12ff460aba3f35dc7249f18b778dfe1` (tree `f2f84594f0d7f1f3dba578ee20f49c6049be2b70`) deployed successfully in run37981704616. The owner verified all37 HTTPS files; an independent peer checked fresh manifest/worker/ZIP downloads and corroborated all37 expected hashes against the immutable tree. The118-file source ZIP is2,078,044 bytes, SHA-256 `6874de8ada413e6f2dd1c48a676737fc3dcc33955124ab22a34e9a1c7ab8bb7c`; all entries and39 snapshot files match source8abfca45. Manifest version: `5d66719d4ad2048fb3f0d5056bafa862be493e38e3700d1aaa061f433d5165b6`.

The later qualified collector repair at e85a1ad leaves the complete mobile/lib/public trees unchanged, so the live starter remains current. It requires a custom native rebuild with the SQLite default3 flag; Expo Go/default2 storage hosts intentionally refuse writes. This source ZIP is not an installable signed app. Bounded synthetic desktop reload/same-dataset protected restore passed; real offline/phone/accessibility acceptance remains pending. Evidence: `docs/qa/final-audit-2026-10-09/page4-final-peer-reconstructed.json`.

# GitHub Pages prototype and update guide

Target: https://ghinz32-cloud.github.io/movefield/ . Source remains on `audit/2026-10-08-quality`; generated public output alone belongs on `gh-pages`. This does not merge the review branch into main or distribute a phone app.

## Owner settings

Open https://github.com/ghinz32-cloud/movefield/settings/pages . Under **Build and deployment**, select **Deploy from a branch**, branch **gh-pages**, folder **/(root)**, then Save. Keep **Enforce HTTPS** enabled when available. The existing site already uses this destination; no custom domain or paid service is needed. Branch content publication and live deployment are distinct; check the Pages deployment/Actions result after an update.

## Later updates

On Windows, run these commands in a WSL Linux terminal. The dependency installer requires Bash, Linux `flock` and GNU `timeout`; this sequence does not run directly in PowerShell. With Node 24, pnpm 11.25.0 (or Corepack), locked dependencies and your normal GitHub Git login, use the current source branch:

```sh
git switch audit/2026-10-08-quality
git pull --ff-only
npm run install:ci
npm run package:mobile
npm run build:pages
npm run check:pages
npm run publish:pages
```

The publisher checks the destination, validates the generated files, fetches the current gh-pages parent, replaces the entire generated tree in a temporary checkout, and uses a normal fast-forward push. A conflicting branch advance rejects the push; the final remote-head check detects a changed published head. The publisher does not provide an atomic expected-head lease. It needs your configured Git identity and GitHub authentication. It does not change or merge your application branch. Do not manually upload `dist/server`, old nonce-bearing server HTML, a full project ZIP, `.env` files, photos, model weights or private records.

After the deployment completes, open the site and privacy notice. Close all old tabs before testing a new offline version. Check the deployed `pages-manifest.json` version against the build output. Browser cache and private/local training records are separate; backing up local training before clearing site data is advisable.

## Security and feature scope

This dedicated Vite client entry uses project-relative assets and an early static meta CSP with self-only script/connect sources, no inline script/nonces/eval, no frames or forms. Public output is allowlisted; source maps, server files, credentials, model runtime/weights and uncleared photos are omitted. Qwen file and inference controls are replaced at build time with an honest unavailable notice. Regular training, logging, encrypted local storage, protected transfers, settings, exercise guides and reviewed research remain available. Accounts and cloud sync are not implemented.

The project-scoped worker verifies HTTP status and SHA-256 before installation, cache writes and serving cached bytes. It deletes a corrupt entry and attempts a verified fetch of the same pinned URL; an offline or corrupt replacement fails closed. Cache versions include the original worker template hash as well as asset hashes, so a failed worker-only install deletes its own candidate cache. The worker leaves other projects' caches alone and waits for old clients to close instead of activating over an open workout. The mobile source ZIP is optional and is not downloaded in advance. Queries, writes, cross-origin and unknown paths are not cached. Cached files never contain user training records.

GitHub Pages does not give this app control over arbitrary HTTP security headers. Meta CSP cannot enforce frame-ancestors, HSTS, Permissions-Policy or a worker response CSP. This is a prototype, not an equivalent deployment of the nonce-bearing server security boundary. Qwen stays unavailable until a reviewed worker/header delivery and actual browser qualification exist. Host logging/IP processing and same-origin browser-storage risks remain; do not claim store or penetration-test certification.

Validation: dedicated build, TypeScript/lint, output allowlist/hash tests and worker VM failure/isolation tests. Real browser/device offline/interruption/reflow acceptance is still pending. Publication/readback results are recorded separately after the branch and live bytes are verified.
