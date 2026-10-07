# Training Studio — connected experience revision

## Delivered

- Full-page prototype entry with returning-device access, new setup and sample exploration.
- Guided profile, goal, direction, schedule, equipment, fixed commitment, plan selection and review flow.
- Adult and youth/coach distinctions use the existing evidence-informed engine. Unavailable templates show requirements rather than silently changing preferences.
- Draft setup saves locally. Reopening a draft checks its source plan and calendar snapshot. Changed commitments trigger review of the current calendar; stale snapshots cannot overwrite new events.
- Final acceptance replaces the single authoritative active plan, archives the previous plan, keeps completed workouts, stales previous pending/queued proposals, and closes stale session views. Today and the sidebar use this same state.
- Today contains concern holds, pending proposals with before/after targets, and feedback/change controls. Coaching retains the full decision history. Completing a workout returns to Today.
- Future sessions show a preview action; empty coach/manual sessions show Add session targets; a fresh profile shows setup rather than a completed block.

## Authentication status

The deployed Site retains its existing owner-private ChatGPT access boundary. Training Studio does **not** yet have separate production user accounts, cloud workout storage, Google authentication, WebAuthn verification, or authenticator enrollment endpoints.

Google, passkey/device verification, optional TOTP enrollment, recovery and disabling are explicitly labeled simulations. Only preview boolean preferences are saved. The sample code is 123456. There are no real QR codes, TOTP secrets, passkey registration requests, passwords, Google tokens or biometric data. This must never be marketed as activated security or separate protected accounts. Device-local records remain available through the demo entry regardless of preview preferences.

### Production implementation contract

1. Use a supported hosted authentication service and register the application’s production domains and mobile clients. The current Sites starter's supported authentication helper is ChatGPT/SIWC; external app-owned auth is not scaffolded here.
2. Google: complete authorized client registration and server token verification (signature, audience, issuer, expiration and CSRF protection), with stable provider subject mapped to an internal account.
3. Passkeys: use a maintained WebAuthn implementation with server-generated one-use challenges, credential public-key storage, origin/RP ID checks, signature verification and user-verification policy. Offer Face ID/fingerprint/device PIN as device-dependent methods; do not collect biometrics.
4. Optional TOTP: verify before activation, protect encrypted enrollment secrets server-side, prevent reuse, apply attempt controls, and provide single-use hashed recovery codes. Require recent verification before changing/removing factors. A user-verified passkey and Google sign-in have distinct assurance properties; do not infer Google MFA from ordinary Google login.
5. Server sessions: secure HttpOnly cookies, appropriate SameSite, expiry/revocation and reauthentication for security changes. Authorization must scope every plan, workout, upload and API operation to the account.
6. Migrate existing local demo data only with explicit user selection and an authenticated account target; do not silently merge browser data into an arbitrary typed email.
7. Test device loss, duplicate enrollment, canceled provider flow, replay/expired challenges, account linking, MFA recovery, session expiry during a workout, cross-account requests and mobile/web continuity before enabling real accounts.

Primary sources reviewed:
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://developers.google.com/identity/openid-connect/openid-connect
- https://www.w3.org/TR/webauthn-3/
- https://pages.nist.gov/800-63-4/sp800-63b.html

## Verification

- Existing 28 training/calendar/progression checks retained.
- 12 added onboarding checks cover fresh state, non-mutating previews, atomic block replacement, retained history, stale proposal invalidation, active/offline guards, changed choices, new/stale commitments, youth restrictions, invalid dates, coach tracking and incompatible availability.
- Browser walkthrough: Google preview and unavailable-passkey fallback; full eight-step running setup; accepting a new plan updates sidebar and Today; refresh retains replacement; previous workout count remains; optional TOTP preview rejects an incorrect sample and enables only after the sample verification.
- TypeScript and production build required before publishing. Responsive layout included; no claim of native-device biometric or physical-phone testing.
