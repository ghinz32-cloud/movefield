# Platform audit — 13 October 2026

This review covers local persistence, file transfer, account boundaries, provider limits, dependency advisories, native archive identity and web update lifecycle. It uses synthetic local adapter and actual SDK/Miniflare tests. Final build/publication evidence belongs to the integrated release receipt. No owner resource, paid provider, account, signing service or store submission was created.

## Fixed

1. **Unbounded failed coaching-job creation.** Provider dispatch had a daily budget, but each distinct submitted workout could still create a new database row after that budget was exhausted. Creation now has separate per-owner and service-wide reservations (10/100 new jobs daily). Existing matching requests can still replay their accepted job without another creation reservation. The real D1/API test fills the budget, verifies HTTP 429 without an eleventh row, confirms existing retry access and confirms that no extra provider request or retained plaintext input appears.
2. **Grizzly native callback mismatch and ungated native-origin handling.** The mobile client correctly used `grizzlyfitness://`, while the server trusted only `movefield://`. A deployment now explicitly selects `APP_VARIANT=movefield|grizzly`, defaulting to Movefield, and trusts only its own exact native scheme. Native-origin writes also require the existing server qualification gate. Unknown variants fail configuration checks. Both-brand actual SDK tests verify allowed sign-in initiation and rejection of the other brand's callback, origin prefixes and missing native marker. Accounts remain disabled by default and installed callback security remains unqualified.
3. **Stale/off-scope web update status.** Offline status now observes the registration returned for that app, instead of the browser-wide `ready` promise that can refer to a broader service-worker scope. A first install does not count as an update. A waiting replacement needs an activated predecessor and clears when the replacement activates. Initial installation failures report unavailable offline files; listeners and late registration callbacks are removed/ignored on unmount. The web UI supplies the current brand in the update message. No immediate activation, forced reload or workout interruption was added.

The initial browser observation of an update banner in a new tab does not establish a fresh-storage installation bug: an existing origin registration can legitimately be waiting. The lifecycle regression checks specifically cover an empty registration, first activation, a real waiting update, cleared update, failed installation and component cleanup.

## Verification

| Check | Result and scope |
| --- | --- |
| Security/schema/request hardening | 29/29 checks passed. |
| Cloud APIs | 19 actual SDK/Miniflare groups passed, including OAuth signature/issuer/audience/PKCE, owner isolation, replay, concurrent writes, account deletion, session revocation, provider-consent races, creation limits and both brand schemes. Google and Groq transport were synthetic. |
| Native auth adapter | Both brands compiled with enabled/disabled qualification flags; host-prefixed cookie retention, owner precondition, exact scheme and sign-out passed using actual Better Auth/Expo SDK with mocked platform boundaries. |
| Local encrypted persistence | Native SQLite/WebCrypto driver tests passed for ordered writes, archive recovery, sample separation, quota rollback, key loss/recovery, legacy migration, failed erase recovery and complete erase. Physical SecureStore behavior remains unqualified. |
| Portable cloud vault | Encryption/tamper checks, durable retry, owner binding, wrong acknowledgements, snapshot integrity and youth/minimized-context checks passed. |
| Native file transfer | Picker cancel, byte-size limits, file URI transfer, original preservation, temporary-file cleanup, erasure race and sharing failure checks passed with mock IO. |
| Brand isolation | Native profile, key, database and sample isolation checks passed. |
| Web update lifecycle | First install, exact-registration readiness, pending update, activation, failure and cleanup checks passed. |
| Pages ownership | Five packaging scenarios passed, preserving original-root and old compiled assets; unexpected, changed or missing owned files fail closed. |
| Existing native downloads | Both existing ZIP manifests matched all 240 entries when inspected. These are source archives, containing no APK, AAB or IPA. Integrated release packaging must regenerate and verify them after mobile edits. |
| Types and focused lint | Root TypeScript and focused platform TypeScript lint passed. Integrated native/web builds are verified separately. |

## Dependency findings

Fresh registry audits completed on 13 October 2026. No versions, overrides, lockfiles or the seven-day minimum release age were changed.

| Scope | Findings |
| --- | --- |
| Root production (`pnpm audit --prod`) | Zero advisories. |
| Root including tooling (`pnpm audit`) | One high advisory, `braces`. |
| Native production/all (`npm audit --omit=dev`, `npm audit`) | 15 high affected package entries propagated from two underlying advisories, `braces` and `node-forge`. Zero critical entries. These counts are affected dependency chains, not 15 demonstrated application exploits. |

Official advisory pages were checked directly: [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects versions through 3.0.3 and lists no patched version; [node-forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) affects versions through 1.4.0 and lists no patched version. Current paths are Expo/build glob processing and certificate/signing tooling. The app does not expose user-supplied globs or a production signing/update service. That reachability observation does not close native release qualification. The npm-proposed Expo 44 downgrade is incompatible with this Expo 57 cohort and was not applied.

## Remaining release gates

- Qualify compatible upstream fixes or reviewed replacements for the two native tooling advisories; then rerun frozen installation, full audit, native builds and signing/update verification.
- Produce signed Android/iOS binaries and test installation, OS-backed key storage, callback ownership, offline restart, notification delivery, backup/reinstall, share sheets, interrupted writes/erase and accessibility on installed devices. JavaScript/Hermes exports and source ZIPs do not establish these properties.
- Before connected accounts/provider use, qualify the actual owner origin and resources, secrets, privacy/retention/spending settings, native callback transport and complete account deletion. The example still defaults all connected gates to false. One deployment variant is not an authorization boundary by itself; separate app ownership requires separate deployment resources and credentials.
- Passkeys/TOTP, background merge/sync, cloud passphrase rotation, a downloaded/on-device model and store acceptance remain absent or unqualified, as documented in the task register. Current provider code only selects approved deterministic workout facts.
- This is not an independent penetration test, security certification or a claim that every device/real-account workflow passed. Browser UI audit and integrated release checks are recorded by the corresponding audit owners.

Workers review reference: [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), retrieved 13 October 2026. Current code retains explicit bounded body reads, awaited writes, parameterized D1 queries, private R2 ciphertext and disabled request logging. No deployment compatibility date or owner configuration was changed.
