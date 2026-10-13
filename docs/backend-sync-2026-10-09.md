# Account sync and asynchronous workout feedback

This milestone implements an authenticated Worker backend for audit items C9 and C10. It does not provide native bearer authentication, a model credential, a physical device result, or a model quality qualification. GitHub Pages remains a static local application and cannot serve these routes; the authenticated Sites Worker supplies the account backend.

## Deployment prerequisites

Set the existing Sites manifest's logical D1 binding to `DB` and let the hosting control plane provision the real binding. Deploy `drizzle/0000_account_sync.sql` and its generated journal/snapshot with the artifact. Only on the dispatch-owned Sites ingress, set server environment `MOVEFIELD_TRUST_SITES_AUTH=1`. Leave that switch unset on a plain Worker or an origin that accepts client-supplied `oai-authenticated-user-*` headers. The switch is an explicit deployment trust assertion; it is not a header-signature verifier.

The server takes the stable owner ID from the Sites ingress. Email is required to distinguish a complete dispatched identity but is never a database owner key or stored account record. Requests cannot select a tenant. All read, write, receipt, queue and lease SQL includes `owner_id`. The client sends `X-Movefield-Client: web`, keeps credentials same-origin, and never constructs trusted identity headers. Every GET/POST to `/api/sync` or `/api/daily-feedback` also requires `X-Movefield-Expected-Account` matching the previously reviewed account ID. This is only a rejection precondition: the trusted ingress owner still supplies every database identity. Missing binding is HTTP 403 `account_binding_required`; an intervening sign-in change is HTTP 401 `account_changed`, before a database session or action. `/api/account` is exempt so the client can discover its authenticated account. POST requires a matching Origin, while every method rejects cross-site Fetch Metadata or an inconsistent Origin. Requests with Authorization fail `native_auth_unavailable`; native transport is unavailable until a verified supported identity mechanism exists.

`GET /api/account` reports `{userId,syncAvailable,feedbackAvailable,nativeAuthAvailable:false,revision}`. Auth/backend/provider absence is explicit. Responses use private no-store and same-origin resource policy; provider or driver exception strings are never logged or sent to clients.

## Encrypted mutation contract

`POST /api/sync` accepts only `{mutationId,baseRevision,records}`. The mutation ID is a UUID. Each record is `{id,ciphertext}`, where a null ciphertext is a tombstone and a non-null string is an exact encrypted envelope:

```
format = movefield-sync
version = 1
kdf = {name: argon2id, m: 19456, t: 2, p: 1, salt: 32 lowercase hex characters}
cipher = aes-256-gcm
nonce = 24 lowercase hex characters
data = standard padded base64, at least the authenticated tag length
```

Unknown fields, plaintext saved state, password/key fields, duplicate record identities and invalid envelope shapes are refused. The server validates framing and never decrypts or derives a password key. Envelope validation cannot prove that a malicious authenticated user encrypted arbitrary bytes; integrity and account-key checks remain the receiving client's responsibility.

The transport is limited to 25 records and 1,100,000 UTF-8 request bytes; an individual encrypted string is limited to 1,000,000 characters. The account has a conservative 10,000-record, 100,000-receipt and 100 MB ciphertext ceiling. Capacity failure is explicit HTTP 507; no receipt or saved record is silently evicted. Because the ceiling conservatively includes the incoming batch before subtracting replacements, clients near the ceiling must export/reconcile rather than expect an overwriting write to reclaim space automatically.

A single D1 batch conditionally creates an idempotency receipt, applies every record, advances the account revision and marks the receipt committed. SQL guards execute inside the batch, so a pre-read race cannot bypass compare-and-swap. A failed statement rolls back the full batch. Responses are produced only after a committed receipt readback:

- HTTP 200 `{mutationId,revision,replayed}`. Replaying the exact mutation returns the original committed revision.
- HTTP 409 `{error:revision_conflict,revision}`. Local ciphertext stays queued for explicit reconciliation.
- HTTP 409 `{error:idempotency_conflict}` for reuse of a mutation ID with different data.
- HTTP 503 for a write/readback that cannot be confirmed; retry the identical durable mutation.

`GET /api/sync?cursor=0` starts a pull. The response has `{revision,records,nextCursor,hasMore}` with record `{id,revision,ciphertext}`. Treat `nextCursor` as opaque and continue until `hasMore` is false. The cursor preserves record identity at tied revisions and pins an upper account revision. Each response has at most 25 entities and a bounded ciphertext budget.

The server stores current entity versions, not a complete historical changelog. A concurrent write can move an entity beyond a previously pinned pull revision. The receiving client must verify its committed head and all referenced digests, reject an incomplete pull, and restart from cursor zero. It must never silently apply a partial head or overwrite conflicting local state. The account-wide CAS is the final upload guard.

## Persisted asynchronous feedback

`POST /api/daily-feedback` accepts only `{requestId,workoutId,completedAt,metrics,consent:true,adult:true,symptom:no}`. The metrics array contains 1–300 completed set records with required `exerciseId`, `set`, `reps`, `kg`; optional `rir`, `durationSeconds`, and `distanceM` are bounded numbers. No name, profile, plan, notes, entire state, or client prompt is accepted. The request is bounded at 65,536 bytes and duplicate set identities are refused. The client is responsible for only opting in for eligible completed sessions; adult/symptom flags are deliberate client attestations rather than server-verified clinical facts.

The database table `daily_ai_feedback` contains the persisted request, metrics, job state, lease and result. An accepted request returns HTTP 202 `{requestId,workoutId,status:pending,retryAfterMs}`. The Worker schedules processing through importable `waitUntil`. A conditional SQL lease allows one processor per job, including after an interrupted Worker. Each provider operation has an eight-second AbortController deadline, no redirects, a bounded response body, and at most three persisted attempts. Transient failures use a persisted five-seconds-per-attempt backoff; polling resumes pending or expired leases. The final expired attempt becomes failed instead of remaining processing forever.

`GET /api/daily-feedback?id=<UUID>` returns pending/processing state without a feedback string. Only a row whose status is complete and whose text has been persisted returns `{requestId,workoutId,status:complete,feedback}`. A failed save never exposes a generated string. Failed jobs return `{requestId,workoutId,status:failed,error}`. Exact duplicate request IDs return the original job; changed payloads conflict. There are at most twelve new jobs per owner in a rolling day and four outstanding jobs. New requests explicitly fail abandoned jobs older than a day once their leases expire, clearing their metric arrays and releasing capacity. Successful writes discard the retained metric array; generated text and idempotency metadata remain until an explicit account retention/deletion policy is implemented.

The provider is disabled unless all three server-only settings exist: `MOVEFIELD_AI_BASE_URL`, `MOVEFIELD_AI_API_KEY`, and `MOVEFIELD_AI_MODEL`. No value is generated or bundled into browser/native assets. The configured HTTPS base URL must use an approved compatible host (`api.openai.com`, `api.together.xyz`, `api.fireworks.ai`, `api.groq.com`, `openrouter.ai`, `dashscope-intl.aliyuncs.com`, or `dashscope.aliyuncs.com`), with no credentials, query, fragment or custom port. The endpoint is the base path plus `/chat/completions`. Adding another provider requires source review; an authenticated client cannot choose an endpoint or model.

The fixed server prompt requests a retrospective rather than training changes. The response must be a bounded single-field JSON object with plain text and passes a conservative output filter. Unsafe/invalid output becomes a failed job. These gates are defensive constraints, not a measured model evaluation or medical safety certification. No current provider credential means `feedbackAvailable:false` and HTTP 503; local deterministic workout review remains usable.

## Verification and checkpoint

`node scripts/check-backend.cjs` exercises an actual ephemeral Miniflare D1 database. Its twenty-two groups cover anonymous/native/cross-origin denial, missing/mismatched account preconditions before database access, malformed and oversized UTF-8, strict encrypted envelopes, exact and simultaneous idempotency replay, tenant isolation, concurrent CAS, injected mid-batch SQL rollback, tied-revision pagination/tombstones, missing/unapproved provider configuration, consent and metric limits, accepted-versus-persisted output, unsafe provider output, real eight-second abort, simultaneous leases, expired final attempts, failed result persistence, rolling/outstanding limits and abandoned-job recovery, and no-store/no-secret responses.

Web `tsc --noEmit --incremental false`, focused eslint on `server`, `app/api`, `db`, and environment declarations, and `git diff --check` passed during this milestone. A generated Drizzle snapshot accompanies the SQL so subsequent migration generation does not recreate the initial tables. Integrated application build, actual deployed account access, migration verification, browser queue journeys and native compatibility/build evidence belong to the root integration checkpoint.

Local checkout: `/workspace/scratch/a905d1d2368a/movefield-backend`; branch `audit/2026-10-09-backend`; baseline `8abfca45f1f910155011516eabffbebdf070821b`. Resolve this milestone commit with `git log -1 --format=%H -- server/api.ts`. No hosting/account/publication mutation was performed by this backend worktree.

Continuation: integrate the backend commit with the encrypted durable browser outbox and digest-bound committed head; set only the existing Sites DB/trust configuration, build and inspect the production artifact, verify deployed migration and signed-in same-origin status, and keep native authentication and absent provider credentials visibly unavailable.

Primary runtime references: [D1 transactional batch and session API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [importable waitUntil](https://developers.cloudflare.com/changelog/post/2025-08-08-add-waituntil-cloudflare-workers/), and [Worker lifetime limits](https://developers.cloudflare.com/workers/runtime-apis/context/). The persisted queue deliberately fits a single eight-second provider call inside the documented thirty-second post-response lifetime; later polls recover interrupted jobs without assuming a scheduler or external queue was provisioned.
