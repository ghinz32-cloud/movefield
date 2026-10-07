# Security review — 7 October 2026

This is a private, device-local prototype. The work below reduces specific risks; it is not a penetration test, compliance certification, or promise of complete security.

## Changes shipped

- React, React DOM and React Server Components 19.2.8; Next and its ESLint config 16.3.6; Vite 8.0.16. Patched compatible transitive packages, regenerated the lock, and passed the project's existing frozen installer and supply-chain policy.
- A fresh 192-bit nonce for each production Worker request. Vinext receives that nonce and adds it to its own scripts. The response enforces a matching Content Security Policy; arbitrary inbound CSP values are replaced. No script `unsafe-inline` or `unsafe-eval`. Inline styles remain allowed because current UI libraries use them.
- Private/no-store Worker responses; no MIME sniffing; no referrer disclosure; restricted framing; disabled unused camera, microphone, location, payment, USB, serial and Bluetooth access; HTTPS HSTS. Static assets receive compatible headers through `_headers`.
- Unused Worker write methods, the unused image optimizer and internal Vinext endpoints are closed. Revisit intentionally when real account routes or API mutations are added. Platform-owned sign-in is outside this application's handler.
- Bounded, schema-checked browser data and setup drafts. Dangerous object keys, invalid dates, non-finite values, unreasonable array sizes and a workout without its matching plan are rejected.
- Unreadable saved training is preserved. The recovery screen offers the original file, an isolated sample, and an explicitly confirmed fresh start. No automatic replacement with defaults.
- A change from another tab pauses writes. Sample mode also records this conflict. This is a local data-loss guard, not a distributed sync protocol.
- Old setup drafts cannot silently restore an old event list. The user reviews current commitments before proceeding.
- Imported exercise JSON is length-bounded; only supported fields are copied. Public guide links allow HTTPS only, without embedded credentials, and use `noopener noreferrer`.
- Removed the browser-tool profile reader that exposed local training before the welcome flow. The prototype has no public training API.
- Completed sets are checked again at save, including edits made after the Done checkbox. Historical logs and their exact exercise identities are preserved.

## Dependency scan

The same full pnpm audit reported **56 advisories before** (1 critical, 29 high, 19 moderate, 7 low) and **3 after** (0 critical, 2 high, 1 moderate). These are dependency advisories, not demonstrated remote exploits in this app.

| Remaining package | Status and next action |
|---|---|
| `source-map-js` 1.2.1 — high, GHSA-68fv-2mgg-jv7q | Fixed in 1.2.2. At the check, that release was still inside this project's seven-day minimum release-age window. Keep the policy intact; update once eligible and rerun the scan/build. Appears in CSS/source-map tooling, including a production-classified dependency path. Do not expose source-map ingestion to users. |
| `braces` 3.0.3 — high, GHSA-vfj7-8cjw-p6xm | No patched version reported by this audit. Transitive lint/build glob parsing. Track upstream, replace affected tooling when a compatible remedy exists, and keep untrusted glob patterns out of build inputs. |
| `esbuild` 0.18.20 — moderate, GHSA-67mh-4wv8-2f99 | Legacy development dependency below drizzle-kit. Its development server is not used by this app. Upgrade or remove that legacy tooling after compatibility review; do not expose that server. |

Sources: https://github.com/advisories/GHSA-68fv-2mgg-jv7q ; https://github.com/advisories/GHSA-vfj7-8cjw-p6xm ; https://github.com/advisories/GHSA-67mh-4wv8-2f99

## Limits and real-account release gates

Browser storage is not encrypted account storage. Anyone able to use that browser profile, or code running with that origin's access, may read it. Preview Google, biometric and 2FA choices do not authenticate anyone. Hosting privacy and an app's own account authorization are separate boundaries.

Before collecting real training records:

1. Implement managed identity, verified Google/Apple login, server-verified passkeys and optional authenticator 2FA with recovery. Keep native tokens in Keychain/Keystore-backed storage; web sessions use secure HttpOnly cookies. Test account linking and lost-device recovery.
2. Authorize every API read and write by the authenticated user. Test cross-account access, youth/guardian/coach sharing boundaries, replay, stale edits and duplicate sync operations. Preview flags and submitted user IDs must never grant access.
3. Add rate limits, CSRF/origin checks for cookie-authenticated writes, input validation at the server, private photo storage, retention/deletion, redacted logs, encrypted transport/storage, least-privilege service access and a tested restore process.
4. Add security monitoring, dependency maintenance, incident response and independent penetration testing. Choose initial markets and obtain a focused youth privacy/consent review before launching to age 14+ users.
5. Prove offline recovery and conflict handling across web, iPhone and Android. Never import generated sample logs into a real account without clear separation.

See `mobile-roadmap.md` for implementation order. No native binary, live identity provider, database, account system, or wearable integration was deployed in this revision.

## Revision 7 audit addendum

Rechecked 7 October 2026 around 13:10 UTC. The web scan remains 3 advisories (2 high, 1 moderate). source-map-js 1.2.2 was published 30 September at 14:08 UTC and had not yet passed the seven-day minimum age at the scan. No release-age policy was disabled.

The Expo starter's fresh npm audit reports 22 affected package entries (15 high, 7 moderate), propagating from three underlying advisories:

- braces <=3.0.3: GHSA-vfj7-8cjw-p6xm; no patched release listed; pattern-processing/toolchain path.
- node-forge <=1.4.0: GHSA-86w9-cpqp-85rv; no patched release listed; Expo certificate/signing tooling. No production signing/update service is configured in this starter. Review its trust path before release.
- uuid <11.1.1: GHSA-w5hq-g745-h8pq; nested xcode@3.0.1 requests uuid@7.0.3. Inspected xcode uses uuid.v4 without the affected v3/v5/v6 buffer API. This is a reachability observation, not a closure of the advisory or native-build validation.

Do not apply npm audit's suggested downgrade to Expo 44 / React Native 0.72. Resolve through compatible upstream releases or narrowly reviewed replacements, then rebuild and test. Scans do not show 22 separate exploitable app vulnerabilities.

New integrity controls reject oversized custom additions, use known side values, validate browser data before overwriting a good save, preserve native commitments/holds on plan replacement, and serialize native reset with writes. These improve local prototypes; server authentication, per-record authorization, protected caches, consent, cloud deletion and incident response are still release gates.


## Revision 10 continuation assessment

Fresh full scans retain two web advisories (one high braces, one moderate legacy esbuild) and 15 mobile affected package entries from two high upstream advisories (braces and node-forge), with zero critical findings. source-map-js and the xcode UUID path were already patched in revision 9; no dependency versions changed in this continuation. Current advisory sources were rechecked and still list no patched braces/node-forge release. Preserve the compatible Expo dependency cohort and seven-day release-age policy. Do not expose untrusted glob/certificate input to tooling; no production signing service is enabled.

Integrity fixes in this continuation keep invalid optional rest data from blocking otherwise valid workouts, cancel every old alert even if one OS call fails, prevent stale/recorded/active tracking edits, strip untrusted prescription authority fields and retain native plan archives rather than silently truncating them. A failed equipment save never reports success. These are bounded implementation controls; real-account authorization, cloud sync and physical-device notification behavior remain unimplemented/unverified.
