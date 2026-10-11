# Cloudflare implementation — 11 October 2026

The recommended Cloudflare backend is implemented locally. It has **not** been provisioned, pushed or deployed. Accounts, backup and optional provider calls fail closed on an unconfigured installation. The full six-prompt project is still in progress; this is the account/backup/highlights milestone.

## What works in code

- Better Auth 1.7.7 owns Google OAuth state, PKCE, signed ID-token validation and persistent D1 sessions. Email/password registration, implicit linking, provider linking and unsupported account endpoints are closed. Google access/refresh/ID tokens are removed before account persistence. Web cookies are HttpOnly, Secure and SameSite Lax in the production configuration. Native cookies use the SDK's Expo adapter and device-only SecureStore; session-data caching is disabled. Passkeys and app-managed TOTP are not implemented; use the Google account's own protection.
- Every data query uses the owner ID from a verified SDK session. Caller-supplied owner IDs are rejected. Mutations require the exact app origin or the native client's exact scheme/header. There is no wildcard CORS and no shipped test-login/seed endpoint. Methods, request sizes, callback destinations and envelope versions are bounded.
- D1 holds owner/revision/idempotency metadata; private R2 holds authenticated ciphertext. A portable cloud vault uses the same AES-256-GCM / PBKDF2-SHA256 600,000 format on web and native. Each device retains its separate existing local key. A cloud recovery passphrase is entered explicitly and kept only in the mounted backup screen's memory; it is never sent to the backend.
- Backup is **manual snapshot synchronization**, with explicit preview/replacement on each device. Local workout saves do not automatically upload. User-initiated uploads persist an encrypted outbox first, including the destination account, exact encrypted bytes and operation ID. Foreground retries replay that operation; another account cannot publish it. A timeout after server commit can be retried without creating another revision. Conflicts preserve local records and the cloud head for deliberate review. There is no automatic merge, per-record/background sync or setup-draft sync.
- R2 writes precede a transactional D1 revision compare-and-swap plus operation receipt. R2 and D1 are not one atomic transaction. Losing objects are deleted where possible; a bounded scheduled reconciler scans with a durable cursor, removing old unreferenced/deleted objects and expired metadata. Receipts retain seven days of replay protection. Do not silently retry a queued operation older than that window after a conflict.
- Account deletion requires a session created within ten minutes. The SDK invokes a D1 tombstone/cancellation hook before deleting the user and sessions. Tombstones persist as a late-write barrier, without retaining workout plaintext. Owned R2 cleanup is immediate where possible and completed by reconciliation after interruption. Local profiles and owner-exported copies remain separate; this does not promise forensic disk erasure or deletion from outside recipients.
- Optional Groq cloud highlights have separate consent, revisions, durable jobs, deduplication and conservative dispatch reservations. The service receives a bounded completed-workout packet; the provider receives only canonical count/effort facts. Model output can select approved fact IDs, with no free prose, links, prescriptions or diagnoses. Display text comes from deterministic code. Youth, coach-owned, partial, missing-data and safety-concern contexts are ineligible. Revocation cancels/scrubs jobs; publication and reads check current profile/consent versions. Failed, ambiguous and abandoned calls are not automatically retried. The Qwen on-device preference has no silent cloud fallback.

Encrypted data prevents the server from independently comparing a submitted coaching packet against the stored workout plaintext. Performed work and eligibility flags remain self-reported. This implementation is bounded fact selection, not medical clearance, general model coaching or evidence-backed workload generation.

## Owner-controlled activation

No account IDs, domain, database, bucket, Google client or provider model have been invented. Start with `wrangler.cloud.example.jsonc`, which defaults every connected feature to disabled. Copy/review it for the actual existing account and owned HTTPS domain. Retain `DB` and `BUCKET` binding names, apply the checked SQL migrations and configure the hourly reconciler. Automatic request logging is disabled in that example; avoid logging OAuth URLs, cookies, keys, prompts or records. `.openai/hosting.json` remains unchanged.

| Setting | Purpose |
| --- | --- |
| `APP_ORIGIN` | Exact owned HTTPS origin, without trailing slash/path. Native uses the same origin. |
| `AUTH_SECRET` | Secret, at least 32 characters of secure random material; stable across restarts. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Owner's Google OAuth web application; callback is `APP_ORIGIN/api/auth/callback/google`. |
| `MOVEFIELD_CLOUD_ENABLED` | Set `true` only for the reviewed connected installation. |
| `FREE_ALLOWANCE_VERIFIED` | Owner verification flag, not a billing hard cap or proof of entitlement. |
| `AI_PROVIDER_VERIFIED`, `AI_API_KEY`, `AI_MODEL` | Separate optional provider gate and owner's verified eligible model/key. No model ID is assumed. |
| `EXPO_PUBLIC_MOVEFIELD_API_URL` | Native build's public HTTPS origin. No secrets go in `EXPO_PUBLIC_*`. |
| `MOVEFIELD_LOCAL_TEST` | Only local loopback HTTP fixtures; rejected with a public/HTTPS production origin. Never set for deployment. |

Use secure application-secret bindings for `AUTH_SECRET`, Google secret and optional AI key. They must be actual runtime values, not a proxy's synthetic outbound credential marker. The Cloudflare management token, if later supplied for authorized console/API work, is a separate credential. Do not paste any keys into chat, tracked configuration or client bundles. Ignored `.dev.vars*` can hold disposable local settings; do not use real-user records in fixtures.

The task authorizes **$0 new spending**. R2 enrollment, paid Workers plans, provider billing, CI quotas, retention and overage behavior must be inspected against the actual owner account before activation. Marketing free-tier allowances and this flag are not evidence of a hard spending limit. Current application limits are 20 uploads and 100 downloads per owner/day, 200 uploads service-wide/day, 3 model dispatches per owner/day and 20 service-wide/day. Failed dispatches consume reservations. Snapshots are at most 5 MB plaintext / about 10 MB encoded ciphertext; provider output is limited to 256 tokens and 32 KiB response bytes. These limits reduce usage but do not prevent all hosting/auth/storage charges or denial-of-service costs. No paid fallback or provisioning automation is included.

## Reproduce local verification

Root uses Node 24 and pnpm 11.25.0; mobile uses its own npm lockfile.

```sh
pnpm verify:core
pnpm build
node scripts/check-production-security.cjs
node scripts/check-cloud-browser.mjs
```

The cloud core test creates disposable local Miniflare D1/R2, runs actual Better Auth OAuth with mocked external Google transport and a signed synthetic ID token, and tests authorization, replay, conflicts, fresh-session deletion, consent races, refused outputs and budgets. It never contacts live Google/Groq or creates owner resources. The built-browser test uses an actual SDK-validated synthetic session fixture and the real built Worker, not mocked app APIs. Chromium must keep its own sandbox; this cloud may require executing browser commands outside the outer command sandbox. Never use `--no-sandbox`.

`MOVEFIELD_LOCAL_CLOUD=true pnpm dev` explicitly emulates DB/R2 locally without editing the owner's hosting file. Missing auth configuration still returns unavailable; this flag does not enable sign-in or provision resources. Local emulation is not a live-account qualification.

After shared source changes, run `node mobile/scripts/sync-shared.mjs <absolute-root>`, then native checks and local Hermes exports. Native sign-in needs an installed build with the `movefield` scheme; it is disabled in Expo Go. The source archive includes native client code and shared contracts but no secrets or installable binary.

## Remaining release gates

Live Google configuration/verification and recovery; provider eligibility/privacy/free quota; keychain/uninstall/recovery/erasure tests on actual iPhone and Android; native callback interception/app-link qualification; independent crypto/security review; account/device revocation UI and stronger factor enrollment; background/per-record sync and comprehensive mixed-version migrations; measured native KDF performance; youth/privacy safeguards; incident/support/legal applicability; actual hosting, IAM, billing and restore/retention settings. Two existing upstream native tooling advisories remain a failing release gate. Hermes exports and synthetic tests do not close these gates.

Versioned backup metadata currently supports one portable format and one selected snapshot head. Passphrase/key rotation and multiple-device history merging require an explicit migration design; do not relabel local passphrase rotation as rotation of the cloud vault.

The six-prompt acceptance ledger remains `docs/master-prompts-task-register.json`. Preserve the remaining science/program, native parity, accessibility, performance and launch work.
