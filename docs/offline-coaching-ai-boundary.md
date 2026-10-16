# Offline coaching and the future model boundary

Before- and after-workout coaching is generated locally by `lib/workout-coaching.ts`. Its canonical messages, comparisons and guard branches work without a model, account, internet connection or provider request. Its suggestions do not change a plan or recorded work. Existing training proposals retain their separate preview, accept/decline and stale-state checks.

## What is implemented

`lib/coaching-selection.ts` is a pure, **unconnected** adapter for a future model to select existing optional message IDs. It has no fetch, provider credential, inference runtime, activation preference or automatic fallback. Neither the web nor native UI invokes it to run a model. It does not expand the existing cloud request or eligibility rules.

The adapter requires a fresh engine summary with `aiEligible: true`, unique bounded message IDs and explicit `required` flags. Ineligible or incomplete summaries return null. A summary with no optional messages needs no model request. Only optional canonical `{id, text}` pairs appear in the request; the separate details/comparison objects, raw sets, notes and other history fields are excluded. Canonical message text itself can include displayed dates, counts and self-reported training facts, so future transmission still requires consent and data review. This packet is broader than the current cloud v1 count/effort packet and is not an approved replacement for it.

The future caller must compute SHA-256 locally over `coachingSelectionDigestInput(currentSummary)`, using the platform's vetted crypto implementation. The expected digest must remain local and must be recomputed when the relevant context changes. The engine's rendering key is a context-change key, not an authentication token or a substitute for SHA-256. Both the current key and the expected 64-character digest must match the response exactly. The adapter does not certify that a caller supplied a correctly computed digest.

Output is limited to `{schema, policy, contextKey, contextDigest, factIds}`. The validator refuses extra prose, explanations, new facts, links, prescriptions, proposal fields, unsupported versions and unknown/duplicate IDs. It cannot accept a request to select away a required notice. `resolveCoachingSelection` takes text from the current local engine messages, retains every required message and preserves canonical order. Invalid or stale output returns null; callers must keep the full deterministic summary visible.

This is selection of existing messages, not permission to increase work, clear a safety hold, assess technique, diagnose, change a schedule or override a coach. Any future runtime integration must regenerate the context immediately before display and preserve those authority boundaries. Runtime/schema validation is not scientific validation of the underlying messages or an owner-authentication mechanism.

## Existing cloud service is unchanged

The optional cloud v1 path still accepts only its separately bounded, eligible completed-workout packet. It generates three canonical facts: `logged`, `effort` and `targets`. The provider can only select those IDs. The account service receives completed sets, targets, effort and eligibility flags; the provider receives only derived count/effort facts. This newer offline summary and its selection adapter are not sent through that endpoint.

Existing explicit adult consent, provider configuration/verification gates, authenticated owner binding, snapshot and consent revisions, job deduplication, creation/dispatch budgets, response limits and cancellation/publication checks remain authoritative. Youth, coach-owned, partial, missing-data and safety-concern contexts remain excluded from the current cloud flow. Backup is separate and does not silently activate model processing. No live service, paid product, provider request, on-device model or user-history upload was activated by this work.

The older `validateAiReview` in `lib/workout-review.ts` is a legacy structural contract that permits unverified model prose. Its own comments explain that it cannot prove semantic safety. It must not be used to render model-authored coaching. The selection-only adapter avoids that path; the legacy function remains unused by live provider/UI flows.

## Verification and remaining integration work

`scripts/check-coaching-selection.cjs` passes eight groups covering request minimization, canonical rendering, required-notice preservation, stale key/digest rejection, unsupported prose/prescriptions, duplicate/unknown IDs, ineligible/malformed contexts and nonmutation. It also exercises actual eligible engine output and actual hold, youth, coach-owned, paused, partial, missing-feedback and unknown-load contexts. Its fixtures are synthetic and use Node SHA-256; it performs no inference or network request. History-comparison behavior is covered by the separate offline coaching checks.

A future integration still needs an explicit local-model or separately consented provider choice, current-context digest computation, account/lifecycle cancellation where applicable, performance and battery qualification, accessibility checks, failure fallback and held-out safety/helpfulness evaluation. Selecting approved IDs does not establish that a model is useful or that every message is appropriate. Connected-service activation requires its existing separate setup and consent; this adapter does not enable it.
