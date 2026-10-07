# Training Studio: practical mobile path

Research checked 7 October 2026. This is a proposed architecture and release plan, not a claim that the prototype already has accounts, sync, native builds, or health access. No account was purchased and no backend was deployed.

## Recommendation

Build the iOS and Android app with **Expo + React Native**, keep the current web app, and connect both to one API, managed PostgreSQL database, and managed identity service. Share the TypeScript training engine between clients and the API. Start with Expo development builds; Expo documents these as suitable for native libraries and store releases, and real OAuth testing needs an app-specific scheme. [1, 2]

This is an engineering recommendation based on the requested workout logging, shared accounts, and later native health features. It is not a framework requirement.

| Current part | Mobile treatment |
|---|---|
| `lib/training.ts`, `onboarding.ts`, `customize.ts`, `progress.ts` | Extract into a shared domain package; inject clock/ID generation and remove browser assumptions. Use the same validators on the server. |
| Program catalog, exercises, guide content | Reuse data and text, preserving source and review metadata. |
| DOM, Radix dialogs, Tailwind layout, Recharts views | Rebuild as React Native screens and native-accessible controls/charts. React source code alone does not make these native views. |
| `localStorage`, JSON downloads, browser timers | Replace with platform storage/export adapters and lifecycle-aware timer state. |
| Simulated Google/passkey/2FA screens | Replace with real identity-provider flows. Existing preview flags cannot authorize API access. |

**Capacitor is a credible faster alternative** if the immediate goal becomes reusing almost all of the web UI. Its documented input is a built web asset directory containing `index.html`; the current server-backed Vinext site is not automatically that bundle. It still needs a backend, native auth/health integration, keyboard/back-button work, and offline design. [3] Choose Expo for the long-term mobile experience; do not run two mobile frameworks in parallel. Apple reviews utility and app experience, so either framework must deliver more than a thin website wrapper. [4]

## Build one working slice first

1. **Accounts and data foundation.** Use a stable owned HTTPS domain, permanent internal user IDs, separate linked identities, and per-user API authorization. Store profiles, plan versions, workouts, set logs, commitments, and proposals in the database. Keep service secrets on the server. Use secure native token storage; unencrypted AsyncStorage is unsuitable for tokens. [5, 6]
2. **Native workout slice.** Ship Today → workout → rest timer → finish → history. Save locally while offline; sync operations using unique IDs and version checks. Preserve completed work when a second device edits the plan. Keep a visible unsynced state and test app termination during a workout. This sync protocol is a proposed product design, not functionality Expo supplies automatically.
3. **Connect the web app to the same API.** Show an explicit preview before importing genuine browser history into an account. Never merge the generated sample athlete as real history. Link Google, Apple, and passkeys through verified account-linking flows rather than matching email text alone.
4. **Add the remaining screens and a beta.** Port plan setup, Calendar, exercise guides, Progress, and account settings after the workout slice proves auth, offline saving, and sync on real phones.

## Authentication decisions

- **Google + Sign in with Apple + passkeys** is the recommended set. Use provider-supported native flows or browser-based OAuth with authorization code/PKCE and registered redirects. Apple's third-party-login rule requires an equivalent privacy-preserving option unless an exception applies; Sign in with Apple is the straightforward choice here. [2, 4]
- **A passkey is account authentication.** The server issues a challenge, verifies the signed response, and stores a public key. The private key stays with the credential provider. Configure Apple's associated `webcredentials` domain and Android Digital Asset Links for the same service. Prove registration and login across web, iPhone, and Android before selecting the identity vendor. [7, 8, 9]
- **Face ID/fingerprint app unlock is different.** Expo LocalAuthentication performs a local biometric check. It does not by itself create a passkey, verify a remote account, or sync records. It can protect reopening an existing session. Test Face ID with a development build, not Expo Go. [10]
- **Optional authenticator 2FA** needs provider/server enrollment, first-code verification, recovery codes, retry limits, factor removal, and lost-device recovery. Enforce policy across every login path. Do not treat a locally saved toggle as 2FA; decide whether a verified passkey already meets the required assurance instead of automatically adding redundant prompts. This is proposed authentication behavior.

## Health integration comes after reliable logs

Add optional Apple HealthKit and Android Health Connect adapters in a later release. Start with a small named purpose, such as exporting a completed workout; request only the relevant types. Keep manual logging usable when access is denied or revoked. Track origin IDs to avoid duplicate imports/exports, and keep device readings separate from user-entered sets and training suggestions. HealthKit requires permission for relevant reads/writes; Health Connect requires permissions, a rationale/privacy surface, and handling permission revocation. [11, 12] Never write the sample athlete to a health store.

## Release gates that affect the design

- **Deletion:** Apple requires an in-app account deletion path. Google requires an in-app path and a usable web deletion resource for apps that create accounts. Design deletion, export, session revocation, and disclosed retention before beta. [13, 14]
- **Privacy:** Prepare the Apple privacy disclosures, Google Data safety answers, a public privacy policy, accurate SDK disclosures, and the Play Health apps declaration. Health access is not permission to use fitness records for advertising. [11, 15, 16]
- **Youth 14+:** Declare the actual target audience. Google's 13–15 and 16–17 bands can include children in some countries; a 14+ label is not blanket consent compliance. Set launch markets and obtain a focused youth privacy/consent review. Suggested first release: private profiles, no ads, no public social feed, and explicit later guardian/coach sharing. [17]
- **Publisher:** Use accounts owned by the product's organization. Google explicitly includes health apps in its organization-account requirement, and its health-app categories include fitness trackers. Confirm the final classification before enrollment. [18, 19]
- **Submission:** Recheck OS/SDK requirements at release; the Play policy checked today requires Android 16/API 36 for new general mobile submissions. [20] Provide working reviewer access and a functioning backend. [4]

## Devices and beta route

Use an iPhone and Android phone from the first native slice, plus simulators for layout coverage. Test smaller displays, large text, screen readers, Android back, interrupted OAuth, missing passkeys, canceled biometrics, lost-device recovery, airplane mode, app kill/reopen, time-zone changes, permission denial, and concurrent edits from web and mobile. These are proposed acceptance checks for this specific app.

Distribute iOS betas through TestFlight; external testing requires the first build to pass TestFlight review. Start Android with Play internal testing, then a closed beta. The **12 continuously opted-in testers for 14 days** rule applies to personal Play accounts created after 13 November 2023; it is not a universal requirement for every account. [21, 22, 23] Do not promise public store acceptance from a preview build.

## Verified official sources

1. Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
2. Expo OAuth/OpenID: https://docs.expo.dev/guides/authentication/
3. Capacitor existing-app requirements: https://capacitorjs.com/docs/getting-started
4. Apple App Review Guidelines (4.2, 4.8, reviewer access): https://developer.apple.com/app-store/review/guidelines/
5. React Native security: https://reactnative.dev/docs/security
6. Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
7. Android passkey client/server flow: https://developer.android.com/identity/passkeys
8. Apple associated domains/passkey setup: https://developer.apple.com/documentation/authenticationservices/connecting-to-a-service-with-passkeys?changes=l_2
9. Android Credential Manager prerequisites / Digital Asset Links: https://developer.android.com/identity/credential-manager/prerequisites
10. Expo local biometric authentication: https://docs.expo.dev/versions/latest/sdk/local-authentication/
11. Apple health/fitness platform and privacy guidance: https://developer.apple.com/health-fitness/
12. Health Connect setup and permissions: https://developer.android.com/health-and-fitness/health-connect/get-started
13. Apple account deletion: https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion
14. Google account deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
15. Apple privacy disclosures: https://developer.apple.com/app-store/user-privacy-and-data-use/
16. Google Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511?hl=en
17. Google target audience / age bands: https://support.google.com/googleplay/android-developer/answer/9867159?hl=en
18. Play developer-account requirements: https://support.google.com/googleplay/android-developer/answer/10788890?hl=en
19. Google health-app categories: https://support.google.com/googleplay/android-developer/answer/13996367
20. Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
21. Apple TestFlight: https://developer.apple.com/testflight/
22. Play testing tracks: https://support.google.com/googleplay/android-developer/answer/9845334?hl=en
23. New personal Play account testing requirement: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
