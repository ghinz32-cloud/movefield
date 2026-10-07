# Revision 6 — complete library and native starter

7 October 2026. This remains a prelaunch prototype, with no production user records. Catalog corrections were applied directly without a history migration layer.

## Delivered

- 989 catalog records and 989 detailed text guides. All 866 previously imported reference entries now have specific setup, movement, finish, breathing, common mistakes, easier options, logging conventions and source notes. A separate small-jump/landing-reset entry supports the new setup option.
- 1,726 unmodified source photos for 863 exact source records. Photos are lazy-loaded from local Site assets. They are labeled as still photos, not full videos or a technique assessment.
- Equipment corrections, explicit unknown machine models, per-hand/per-side conventions and appropriate progression eligibility. Source contradictions and missing source instructions are disclosed at the affected entries.
- Multiword search with common abbreviations. Optional web set details for distance, duration, height, heart rate, cadence, power, speed, incline, level, assistance, tempo, side and notes. Assisted or one-sided work is kept out of comparable load/max triggers.
- Optional core, jump practice, assistance supersets and activity-support modules in web setup. They change actual plan work, obey the time window, keep primary lifts, and never move days. Coach/manual modes receive no added prescription. Youth and conflicting selections have explicit limits. Exact small doses and schedule thresholds are app defaults informed by source principles, not individually validated prescriptions.
- A standalone React Native/Expo source project in `mobile/`, with Today, Plan, Library, History, guidance, workout logging, rest timing and validated local persistence. All 989 text guides are bundled. Native extra set details currently include distance, time and notes. Windows/iPhone/Android startup steps are in `mobile/START-HERE.md`.
- Full original scope is retained in `product-requirements.md`; completion is tracked by working behavior rather than placeholder screens.

## Verification

- 97 automated web behavior checks: training 28, onboarding 12, catalog/progress 9, security 29, guide/measurement coverage 6, focus modules 13.
- TypeScript and production build; production Worker checks for nonce rotation, matching scripts, no-store responses and blocked unused write/internal routes.
- Browser checks: library search and exact source-photo loading; setup with all four focuses; correct plan replacement on Today and sidebar; visible jump/superset instructions in the workout; optional measurements and partial logging.
- Native TypeScript, nine plans across seven starting weekdays, logging/persistence and guide coverage checks, Expo Doctor 21/21, and Android/iOS Metro exports. These exports are JavaScript bundles, not compiled or signed APK/IPA files.

## Boundaries

The editorial/source pass is complete for the shipped catalog; independent professional certification is not claimed. Exact-variation videos are not available for every record. Source-declared media licensing and hashes are recorded in the completion manifest; this is not a legal rights certification.

The web and native prototypes have separate local records. Real accounts, shared database/sync, Google/passkeys/2FA, device biometric unlocking, full sport/position and annual-season programs, photos, integrations and team features remain in the full product requirements. Native personal setup/focus controls and full web feature parity are not yet implemented. No real-device testing, store submission or production account-security assessment is claimed.
