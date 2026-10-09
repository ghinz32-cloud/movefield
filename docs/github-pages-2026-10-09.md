# GitHub Pages prototype and update guide

Target: https://ghinz32-cloud.github.io/movefield/ . Source remains on `audit/2026-10-08-quality`; generated public output alone belongs on `gh-pages`. This does not merge the review branch into main or distribute a phone app.

## Owner settings

Open https://github.com/ghinz32-cloud/movefield/settings/pages . Under **Build and deployment**, select **Deploy from a branch**, branch **gh-pages**, folder **/(root)**, then Save. Keep **Enforce HTTPS** enabled when available. The existing site already uses this destination; no custom domain or paid service is needed. Branch content publication and live deployment are distinct; check the Pages deployment/Actions result after an update.

## Later updates

With Node 24, locked dependencies and your normal GitHub Git login, use the current source branch:

```sh
git switch audit/2026-10-08-quality
git pull --ff-only
npm run install:ci
npm run package:mobile
npm run build:pages
npm run check:pages
npm run publish:pages
```

The publisher checks the destination, validates the generated files, fetches the current gh-pages parent, replaces the entire generated tree in a temporary checkout, and uses a normal fast-forward push. It refuses publication failures or concurrent branch changes. It needs your configured Git identity and GitHub authentication. It does not change or merge your application branch. Do not manually upload `dist/server`, old nonce-bearing server HTML, a full project ZIP, `.env` files, photos, model weights or private records.

After the deployment completes, open the site and privacy notice. Close all old tabs before testing a new offline version. Check the deployed `pages-manifest.json` version against the build output. Browser cache and private/local training records are separate; backing up local training before clearing site data is advisable.

## Security and feature scope

This dedicated Vite client entry uses project-relative assets and an early static meta CSP with self-only script/connect sources, no inline script/nonces/eval, no frames or forms. Public output is allowlisted; source maps, server files, credentials, model runtime/weights and uncleared photos are omitted. Qwen file and inference controls are replaced at build time with an honest unavailable notice. Regular training, logging, encrypted local storage, protected transfers, settings, exercise guides and reviewed research remain available. Accounts and cloud sync are not implemented.

The project-scoped worker verifies SHA-256 before installation/cache writes, rolls back incomplete installs, leaves other projects' caches alone, and waits for old clients to close instead of activating over an open workout. The mobile source ZIP is optional and is not downloaded in advance. Queries, writes, cross-origin and unknown paths are not cached. Cached files never contain user training records.

GitHub Pages does not give this app control over arbitrary HTTP security headers. Meta CSP cannot enforce frame-ancestors, HSTS, Permissions-Policy or a worker response CSP. This is a prototype, not an equivalent deployment of the nonce-bearing server security boundary. Qwen stays unavailable until a reviewed worker/header delivery and actual browser qualification exist. Host logging/IP processing and same-origin browser-storage risks remain; do not claim store or penetration-test certification.

Validation: dedicated build, TypeScript/lint, output allowlist/hash tests and worker VM failure/isolation tests. Real browser/device offline/interruption/reflow acceptance is still pending. Publication/readback results are recorded separately after the branch and live bytes are verified.
