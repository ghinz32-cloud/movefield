# Calendar and coaching implementation — 9 October 2026

## UI milestone

Plans tabs now use bounded, equal columns, clipped selection backgrounds, equal panel spacing and stable scrollbar width. The floating Appearance launcher was removed from both web entry points; appearance settings remain in Settings.

Today has seven accessible date buttons and previous/next week controls. Selecting another date opens a read-only day view with Today/Yesterday/N days ago headings. Stored workout dates remain authoritative after travel. Multiple logged workouts retain actual completed sets, zero/unknown loads, RIR, metrics, notes and duration. Rest days show Day off; skipped and scheduled-but-unlogged days remain distinct. Full Calendar date labels also open saved day views and include historical dates. Native Today has equivalent date selection and day details, without changing active workout callbacks.

Validation: 11 training-day domain/static-render groups, 16 compiled current-log/save/alarm scenarios, 8 browser-storage compiled callback scenarios, 45 canonical shared hashes, web/native TypeScript, focused product lint with zero warnings, Tailwind/PostCSS compilation, production build and 3/3 production suites passed. Browser controls are unavailable in this managed environment; no visual browser or physical-device acceptance is claimed. One mistyped check filename failed with module-not-found; the correct current-log suite subsequently passed. The trailing whitespace check found one new line and was corrected.

## Next milestone

Implement personalized, explicit-consent browser-local coaching using a larger pinned Qwen3.5 model and a shared structured contract. Add securely persisted backend routing for configured open-weight providers, preserving existing account/queue/feedback isolation. Actual provider credentials, native account authentication and physical-device model qualification remain external dependencies. No fabricated coaching result substitutes for unavailable inference.
