# Cloudflare account setup

The owner now has an account and reports connecting a plugin. This session currently exposes no Cloudflare account tools, and the managed runtime has no usable Cloudflare token or identity. A plugin connection is not evidence of application deployment or runtime authentication.

The Account ID has now been supplied and added to ignored `wrangler.workers-dev.local.jsonc` and the saved environment-variable suggestion. It grants no account access. The remaining non-secret details needed are the account's **Workers subdomain**, and its actual **Workers plan/R2 enrollment status**. No purchased domain is required for an included `workers.dev` address. The Account ID is available in the account dashboard; the subdomain appears under Workers & Pages. If a connected account tool becomes available, read these details through it instead of asking for duplicate credentials.

`CLOUDFLARE_API_TOKEN` has been declared as a secure environment requirement scoped to `api.cloudflare.com`. Never enter its value in chat, source, a command argument or `EXPO_PUBLIC_*`. For initial inspection, use an account-scoped token with read permissions for account settings and Workers/D1/R2 that are available in the current token editor. Edit/provisioning permissions are unnecessary for inspection. Save the environment settings, then recheck runtime readiness; a saved draft does not activate the binding.

The read-only helper `python3 scripts/inspect-cloudflare.py --account ACCOUNT_ID` preserves the configured proxy/CA, refuses redirects and prints only selected metadata. It performs no uploads or mutations. Its subscriptions/storage responses cannot establish free allowances or a hard spending cap; owner-console verification remains necessary.

Two configurations are prepared:

- `wrangler.workers-dev.example.jsonc`: a local-first prototype on the included Workers address, with accounts/cloud storage/AI disabled and no D1/R2 provisioning. Its URL would be `https://movefield-prototype.ACCOUNT_SUBDOMAIN.workers.dev` after owner-authorized publication.
- `wrangler.cloud.example.jsonc`: optional account/backup infrastructure, with explicit database/bucket placeholders and all activation gates disabled. Use the actual account, private bucket and migrated database after cost/privacy qualification.

Copy the selected template to an ignored `wrangler.*.local.jsonc` and add the real `account_id`. A local Wrangler dry run passed (about 902 KiB compressed Worker upload, 2,645 static files); it uploaded nothing and does not prove account eligibility. No live deployment command has been run. The $0 new-spending constraint remains in force: free marketing allowances, a Free plan label, application request limits and `FREE_ALLOWANCE_VERIFIED` are not hard billing caps. Do not enroll in metered/paid products or enable overages without the owner's explicit budget decision. A local-first prototype can be reviewed before R2 is enabled.

Google sign-in also requires the owner's Google OAuth web application. Its exact authorized origin is the final HTTPS Workers/domain origin, and its callback is `ORIGIN/api/auth/callback/google`. `AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` belong in **application runtime secret bindings**. The outbound Cloudflare API-token binding is a management credential; its proxy placeholder cannot serve as an application secret. Optional AI stays disabled.

Installed native sign-in requires separate Android/iOS callback testing before both `NATIVE_AUTH_VERIFIED` and `EXPO_PUBLIC_NATIVE_AUTH_VERIFIED` can be enabled. Device compatibility targets and the remaining installation checks are in [device-coverage.md](device-coverage.md).
