> Superseded publishing target: the owner clarified **GitHub Pages**. Use [github-pages-review.md](github-pages-review.md) for the active update. This locally verified Cloudflare Pages package remains an alternative; do not deploy it by assuming the earlier platform answer is current.

# Prepared Cloudflare Pages alternative

The owner explicitly requested pushing new additions to the Pages site on 12 October 2026. This authorizes updating that review site after validation; another general deployment confirmation is unnecessary. The target URL/project is still needed because the earlier `training-studio-prototype.bigcheese3232.chatgpt.site` preview and Cloudflare Pages are different services. Do not create a replacement site, broaden its audience, enroll a paid plan or enable billing overages by assumption.

The current session exposes neither Cloudflare deployment tools nor a ready `CLOUDFLARE_API_TOKEN`. The supplied Account ID is already retained locally; do not request it again. A saved secure credential requirement does not activate it. Prefer the connected account tool if it becomes callable; otherwise supply the token through secure environment settings and activate the saved `api.cloudflare.com` network requirement. Initial inspection can use Pages read permission; an upload needs account-scoped Cloudflare Pages edit permission for the selected account. Do not enter tokens in chat, command arguments, repository files or public build variables.

The current app requires a Worker for SSR/API handling. Uploading `dist/client` alone does not publish the functioning app. `scripts/package-pages.mjs` prepares Cloudflare Pages advanced mode with `_worker.js/index.js`, its application modules, exact static asset routes and `_routes.json`. It keeps account/backup/AI/native-auth features disabled even if the existing project has old activation variables. Workout data stays in the browser's encrypted private profile; this package provisions no D1/R2 resources and installs no models.

Prepare and verify locally:

```sh
node mobile/scripts/sync-shared.mjs /absolute/path/to/movefield
python3 scripts/package-native-source.py
pnpm verify:core
pnpm build:pages
node scripts/check-pages.cjs
pnpm preview:pages
```

The local preview uses a generated conventional Pages configuration under `.sites-runtime/pages-preview`. Its local redirect prevents the framework's root `.wrangler/deploy/config.json` from selecting the Workers configuration. Pages rejects a custom `--config` filename. The local preview bundles modules because Wrangler's directory/no-bundle development watcher failed to supply `wrangler:modules-watch`; the production directory package is tested separately with all original modules through Miniflare. Local checks are not a live Pages deployment.

Before upload, inspect the **existing** project's name, production branch, compatibility flags, deployment configuration, audience and free-plan limits with the actual connected account. The read-only helper `python3 scripts/inspect-cloudflare.py --account ACCOUNT_ID` reports selected Pages project names/subdomains as well as account metadata. API metadata and a Free label do not establish a hard spending cap. Keep the owner's $0 new-spending constraint.

For a direct upload, copy `wrangler.pages.example.jsonc` to the ignored `.sites-runtime/pages-deploy/wrangler.jsonc`, fill the exact existing project name, and add its local `.wrangler/deploy/config.json` containing `{"configPath":"../../wrangler.jsonc"}`. Use the known Account ID in that local configuration or the non-secret environment variable. Preserve any existing owner configuration. Run Wrangler with `--cwd .sites-runtime/pages-deploy`, `pages deploy ../pages`, the exact `--project-name`, and the selected project's production `--branch`; annotate the verified source commit. The upload command should run only once the target and credentials are verified. A source push is an alternative only when the existing site's Git integration and build/output configuration are confirmed; pushing a branch alone does not prove a live update.

After publication, retrieve the returned deployment URL and check the actual HTML nonce/security headers, built JS/fonts, native source ZIP hash, service worker, cloud-disabled capability response and fresh synthetic profile/sample navigation. Record the deployment ID/URL, commit, package hashes, audience and results. Never treat a successful upload or an old preview URL as evidence that the new app is live. Restore the previous deployment if a material check fails, keeping private browser records intact.

If the URL changes, browser storage belongs to the old origin. An encrypted backup and its recovery secret are required to move private records; do not promise automatic transfer or ask users to erase the original profile.
