# Revision 12 — copy, workout names and working brand

7 October 2026. Saved development revision; not published to the private website.

## Editorial pass

Reviewed the first-party web and native interface text, training-engine messages, all 71 catalog plans, 159 distinct catalog workout titles, all 989 exercise guides and the 964 expanded-library records. This is a product copy review, not independent verification of every exercise technique or a claim about authorship detection. Vendor code, source licenses and historical requirements remain intact.

The pass makes exercise instructions more direct and specific, reduces repeated boilerplate, explains planning terms in ordinary language and removes the Caliber comparison from Strength over time. The index still explains its actual calculation and limitations. Workout summaries describe the existing rules-based feature; they do not imply that an AI model is connected.

943 exercise guides changed. The work includes 138 movement-specific summaries, simpler setup/breathing/finish notes, corrections to unrelated stretch and press notes, and removal of duplicated switch-side instructions. Source notes retain attribution and review limitations. Dataset license labels now agree with the recorded Unlicense license. Load multipliers, progression eligibility, source links, IDs and equipment identities are preserved. Shared guide and library text is copied to the native app.

## Names and attribution

All 71 app-generated plans now use descriptive names. Examples:

| Earlier label | Current display |
| --- | --- |
| Powerlifting · SBD foundation | Powerlifting · 3-day basics |
| Powerbuilding · Full body 3 | Strength & muscle · 3-day full body |
| Tiered upper · press | Upper body · Shoulder press focus |
| Strength · Standing dumbbells 2 | Strength · Standing dumbbell workouts |

Workout names are displayed separately from the stored titles and exercise load roles used by progression. Existing plans and history retain their underlying records. A changed main exercise falls back to a body-region workout title so an old lift-specific title does not misdescribe a substitution. User-entered and unrecognized titles are preserved.

The NHS run/walk plan is credited by name. Named programs such as PHUL and PHAT include their original creator in tracking titles. These reference programs remain empty tracking schedules until the user enters their copy; the app does not claim to contain or own the original routines. Author URLs and source credits remain available.

## Working brand

Movefield is the provisional name used for this pass. The interface keeps its established green palette, adds a simple M mark and uses “Your training, day by day.” Web metadata, setup, navigation, native headers and app icons use this identity. The native header no longer presents the app as Garret's personal training log.

The shortlist was Movefield, Setward, and Rep & Route. No name choice was returned, so the recommended Movefield direction was used provisionally. Limited web collision searches found clear conflicts for rejected alternatives TrainStead, Kinward, Dayward and Steadyform; they did not establish trademark, domain or app-store availability for the shortlist. No domain was bought and no public identity was registered. Storage keys, app slug and the existing private site address remain stable.

## On-device models

See [on-device-models.md](on-device-models.md) for the source-linked comparison. The suggested first comparison is Apple's on-device Foundation Models on compatible iPhones, Qwen3 0.6B and LFM2.5 1.2B, with LFM2.5 350M reserved for narrow extraction experiments. Downloads are optional; the regular app remains useful without them. No runtime, model, paid API or cloud fallback was added.

## Verification and remaining limits

- Web and mobile TypeScript checks passed.
- Native engine checks passed for 74 choices across all seven starting weekdays, including saved history and data validation.
- Library, catalog/progress, training, focus and onboarding suites passed.
- Revision-specific comparison checked all 71 catalog plans against revision 11: dates, exercises, targets, durations, stored titles, load roles and dependencies match.
- Naming checks cover creator attribution, saved workouts, custom names, replacements and non-mutating rendering.
- All 989 guide IDs and source links remain; exercise behavior metadata and per-side recording semantics match the preceding revision.
- Production website build and iOS/Android Metro exports passed. Native exports are JavaScript bundles, not installed or signed app-store builds. The web build still warns about client chunks over 500 kB; real-device loading performance remains unmeasured.

Built-worker checks passed: page status 200; all 20 scripts carry the response nonce; it changes per request; write and internal routes remain closed; responses remain private/no-store; the new mobile ZIP downloads successfully.

A fresh browser walkthrough and physical-phone checks have not been performed. The managed browser workflow's required skill was unavailable. The new icon was rendered and visually inspected; that is not a full interface review. The app remains a local prototype without real app accounts or web/phone sync. Revision 11's plan coverage gaps and dependency findings remain tracked work; this editorial pass does not resolve them.

Publication remains paused: an earlier automatic approval review rejected the workflow because publishing sends the app to Cloudflare and the session had authorized development. This revision needs explicit approval before updating the private hosted app.
