# Revision 5 — clearer guides, safer state and a mobile path

## User-facing changes

122 detailed exercise guides now separate equipment, setup, movement, finish, breathing and logging. Three short cues appear first. Each describes what the user adjusts: rack and safety height, bench or seat position, pins, handles, feet, grip, entry and exit. Workout terms stay intact, with a glossary. Sentences and page labels are simpler; no formal fourth-grade readability certification is claimed. These guides still need independent expert review, especially equipment-model differences. The remaining 866 reference entries are not newly reviewed guides. Missing videos are disclosed.

Navigation uses Today, Calendar, Plans, Exercises, Progress, Coaching, Sources and Settings. Actions include Start workout, Save workout, Add time off or an event, and View exercise history. Mobile navigation closes after a page choice. The saved-plan button now says it reuses setup choices, matching what it actually does.

Fixed old setup drafts restoring stale commitments, damaged saved profiles being overwritten, concurrent tabs overwriting each other without warning, sample security choices affecting the main preview, overdue workout starts bypassing move approval, and invalid completed-set edits reaching saved history. Date changes still require review. A blocked workout save returns to the workout so the field can be fixed.

## Verification

- TypeScript check and production build passed with updated dependencies.
- 78 automated checks passed: training 28, onboarding 12, catalog/progress 9, saved-data/security 29.
- Built Worker integration check: HTTP 200, all 20 rendered script tags carry the response nonce, nonce changes per request, private/no-store, unused writes return 405, internal route returns 404.
- Managed browser review: existing profile loads, isolated experienced sample opens, exercise history remains linked to exact exercises, guide tabs render the new steps, zero-rep Done is rejected, and editing a completed set to zero blocks the save without losing the draft.
- Reviewed the guide screenshot for layout and readable line spacing. Mobile drawer closure was reviewed in code; no native-device or store build was produced.

Remaining security work and dependency advisories are in `security-review.md`. The recommended iOS/Android sequence is in `mobile-roadmap.md`.
