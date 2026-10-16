# Adaptive coaching: web UX and compatibility audit

Both local static apps passed the focused coaching and interface checks. The [complete receipt](coaching-web.json) records exact tested HTML, JavaScript and CSS hashes, individual cases and qualification limits. The final application source checkpoint is `de6c7abf2438cbcb01d67c8f4e259efa9d4aac9c`.

## Changes confirmed

- **No new example day off.** New sample training no longer inserts “Weekend away,” and fresh web/native profiles explicitly start with independent empty commitment arrays. The sample retains its 34 completed workouts. Existing saved commitments and setup drafts remain intact, including entries with the former example name or identifier. The 15-check onboarding suite includes blank-start and preservation regressions.
- **Narrow setup header fits.** At 320 px and 130% text, “Save & exit” previously extended to 349 px. The header now wraps, preserves the full label and keeps a minimum 44 px action height.
- **Saved notices meet text contrast.** The actual success notice previously measured 4.25:1. Its revised text measures 6.364:1 in both apps while the notice is visible. Other light semantic notice colors use darker text; existing backgrounds and dark toast roles are unchanged. Grizzly currently uses Sonner’s light toast theme within its dark app appearance.
- **Tablet Settings remains readable.** At 768 px and 130% text, a forced two-column grid beside the sidebar pushed reminder actions to 945 px. Settings columns now adapt to available width, long action labels wrap, and selected values grow vertically. All tested selected labels fit inside their controls, each at least 44 px high. The coaching selector grows to 79.25 px at 320 px/130% instead of clipping its full label.

## Actual browser evidence

All profiles are disposable synthetic data. Tests use real encrypted browser storage and actual interface actions. Chromium keeps its own sandbox enabled.

| Run | Grouped checks | Axe states | Scope |
| --- | ---: | ---: | --- |
| General interface |14|50|Both brands; Today, Coaching and sample commitments at 320/390/768/1280 px and 100%/130% text; narrow history dialogs. Fresh/sample blank commitments, retained saved events/drafts, keyboard trapping/return, calendar keyboard use, reduced motion, quota/retry/reload and real stale-tab protection.|
| Coaching journeys |10|24|Both brands; before cancel/start and read-only preview; partial/completed saved reviews; Manual/Off persistence and visibility; actual offline reload/unlock/start/log/save/reopen. Dialogs and Settings at all four widths/130% text.|
| Harder-effort completion |2|8|Both brands; actual “Harder than expected” selection and completed save. Feedback persists, proposals stay unchanged and accepted targets are unchanged. After-dialog layout, keyboard and accessibility at all four widths/130%.|
| Initial popup focus |2|0|Both brands at 320 px/130%, before any Tab traversal: scroll position 0 and complete title visible. Focusing the first summary does not initially skip the title.|
| Persistence safety |8|0|Both brands; stale real before-dialog callbacks, failed finish without after-dialog/history mutation, repeated-click retry saves once and displays once, then encrypted reload without replay.|

All 82 successful axe states have no reported violations; completed runs have no page errors or page-wide horizontal overflow. These are finite automated checks, not a complete accessibility certification.

The general matrix and persistence safety runs preceded the final Settings-only CSS adjustment. Their original asset hashes remain in the receipt. The final coaching, harder-effort and initial-focus runs use the final CSS and regenerated Vite dependency hashes. The scoped follow-up specifically exercises the changed Settings layout; earlier checks have not been relabeled as executions of different bytes.

The initial runs found the setup overflow, notice contrast issue and tablet Settings overflow. Those failures were retained as diagnostic evidence and corrected before their relevant passing checks. A separate initial test demanded identical editorial phrases after restoration; that demand exceeded the product contract and was replaced with stronger factual and saved-state checks described below.

## Offline restoration and coaching facts

Both apps were loaded through their service workers with the browser network actually disabled. Each opened an encrypted profile, showed preparation coaching, started a workout, logged a set, saved a partial workout, showed after-workout coaching and reopened the saved record after another offline reload.

Restoration changes only object-key order for the saved workout at `state.history.0`. The context token uses serialized JSON, so a restored record can select a different fact-frame or encouragement sentence. Both rendered states are canonically identical, and the independently decrypted stored records remain identical. The browser verifies the actual text against the engine for each state and retains these exact invariants: 1 of 12 targeted entries completed, one loaded entry with unknown weight, partial status/policy, owning-plan values, required guards, tone, AI eligibility and comparison. No training targets or proposals change because of this editorial variation.

Today keeps the review behind **Review last workout**; the popup and explicit Coaching review match for the same current state. **What this is based on** and **Training-rule review** remain collapsed initially. Cancelling preparation leaves records unchanged. Manual and Off preferences persist through reopening and suppress automatic popups; Off also hides the coaching entry points and review.

## Compatibility limits

Chromium 154.0.8037.57 is the executed browser. The build targets Chrome/Edge 111, Firefox 114 and Safari/iOS 16.4, but a compilation target does not demonstrate execution on that engine or version. Firefox/WebKit binaries were unavailable and their official downloads were blocked in this environment; Firefox, WebKit and Safari were not tested.

Desktop viewport emulation does not qualify physical phone keyboards, safe areas, background/relaunch behavior, screen readers or mobile storage retention. Physical Android and iPhone testing, VoiceOver/TalkBack, Apple compilation/signing and store acceptance remain separate release work. The native audit reports its own source and component validation.

The rendered appearance coverage uses Movefield light/green and Grizzly dark/pine/wild defaults, enlarged text and reduced motion. It does not exhaust every font/palette combination. Web Crypto, IndexedDB and Web Locks remain required browser capabilities; the vault gate refuses saving before writing if Web Locks is unavailable. These local runs make no claim about live Pages deployment, cloud accounts or native device behavior.
