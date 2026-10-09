# Account client security and lifecycle checkpoint

The integrated account client keeps an encrypted durable mutation queue, requires an explicit copy choice before replacing a retained account queue, and binds all account-specific requests to the reviewed authenticated owner. It sends no trusted ingress headers, bearer tokens, or model credentials. Shared native code cannot use this browser transport until a supported native identity mechanism is configured.

## Fixed paths

- `lib/cloud-client.ts`: same-origin routes and credentials, redirect refusal, linked fifteen-second cancellation, bounded streamed response bytes, object/UTF-8 validation, and `X-Movefield-Expected-Account` on account-bound routes. The fourth `cloudRequest` argument is the expected account ID, used only as a server rejection precondition.
- `lib/browser-cloud-sync.ts`: cancellation generations for opening/activation, bounded pinned pagination, stable owner/revision rechecks, atomic reviewed queue reconciliation, retained queue on conflicts, and lazy encryption imports. No session starts before the selected copy is durable and its cloud encoding fits the limits.
- `components/account-sync.tsx`: synchronous duplicate-press guard, guarded selection while saving/active, controlled remote restore, and cancellation/unmount protection. Cancel/Lock disconnect first and then retry local saving with cloud transport inactive. Previously retained encrypted changes are replaced only through the explicit copy-selection reconciliation operation.
- `components/daily-feedback.tsx`: explicit metrics-only consent request, stable account/workout/completion UUIDv8 across remounts, response identity validation, persisted-complete-only text, backend retry timing, and cancellation on workout/profile/hold/save changes or unmount. Account-bound POST/polls use the expected owner guard. Names and notes are excluded from this request.
- `server/auth.ts`: missing expected account is rejected with HTTP 403; a trusted owner mismatch is rejected with HTTP 401 before any D1 session. The header never chooses a database tenant.

The browser vault's `reconcileSync({accountId, revision, expected})` compares the entire reviewed outbox inside one transaction, clears only that account's pending queue, and records the reviewed revision. A stale comparison fails without discarding mutations. The root restore integration retains the service candidate during the awaited durable replacement and keeps the account review mounted until activation finishes.

## Verification

`node scripts/check-cloud-client-ui.cjs` passed **24/24 scenarios, 91 assertions**. It transpiles the actual TS/TSX modules and invokes their actual callbacks through the existing hook harness. Scenarios cover bounded streamed bodies, malformed objects, transport deadlines/abort, missing/changed account binding, duplicate presses, consent payload fields, deterministic retry IDs, saved-versus-accepted feedback, mismatched responses, retry timing, account changes, workout/hold/unmount cancellation, atomic reconciliation, stale review/CAS failure, late restore completion, and inactive local saving after Lock. Each test unmounts its harness even on failure so timers cannot hang the process.

`node scripts/check-backend.cjs` passed **22 groups** using actual ephemeral Miniflare D1 with a mocked provider. The new account-switch group uses a database object whose session method throws, proving missing or mismatched expected owner requests return their authentication error before touching the database; both reads and writes are exercised for both account-bound routes. Existing tenant, idempotency, rollback, real provider-timeout, failed-persistence, and rate-limit coverage remains passing.

Focused ESLint with `--max-warnings 0` on all five client/service/component/auth files and `git diff --check` passed. Parent integration owns the whole-app types/build/lint, production artifact budget, deployed Site verification, and native pipeline evidence. These tests do not claim a physical-device run, a live provider quality evaluation, or a successful remote deployment.

## Deployment configuration

Use logical Sites D1 binding `DB` and `MOVEFIELD_TRUST_SITES_AUTH=1` only behind the trusted owner-private Sites ingress. Feedback requires separately supplied server secrets `MOVEFIELD_AI_BASE_URL`, `MOVEFIELD_AI_API_KEY`, and `MOVEFIELD_AI_MODEL`; when they are absent, feedback remains explicitly unavailable. Native auth stays unavailable. Saved feedback text/idempotency metadata has no implemented general retention/deletion policy yet; successful jobs discard their metric arrays and stale abandoned pending jobs are expired on later requests as documented in the backend contract.
