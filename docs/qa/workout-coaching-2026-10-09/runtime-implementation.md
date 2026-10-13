# Experimental local workout coaching runtime — 2026-10-09

This checkpoint adds explicit Qwen3.5 4B and optional 9B browser coaching. It selects strict observation and review IDs from a bounded, current workout/lift context; it cannot invent prose, metrics, targets or plan changes. The app coordinator owns separate record-use consent and the encrypted save before displaying a result.

| Model | Exact browser identity | Download bytes | Vendor GPU-memory estimate | Device qualification |
| --- | --- | ---: | ---: | --- |
| Qwen3.5 4B | `web-qwen3.5-4b-q4f16_1-mlc` | 2,396,760,278 | 3,867.82 MB | Not tested |
| Qwen3.5 9B | `web-qwen3.5-9b-q4f16_1-mlc` | 5,067,721,004 | 6,433.01 MB | Not tested |

These publisher memory estimates do not establish actual usable GPU or CPU memory. The runtime uses the pinned WebLLM 0.2.85 configuration, shader-f16, 4,096 context tokens, one history turn, at most 512 output tokens and a 512 MiB maximum individual file. Every file enters the worker from a checked local store; inference has `connect-src 'none'` and refuses other transports and child workers. No workout data is sent to model-file publishers. Downloading requires a distinct exact-model confirmation and does not start inference.

`createWorkoutCoachingRuntime({makeWorker,current,model})` exposes `run(context,digest)`, `stop(reason?)`, `dispose()`, `subscribe` and `getSnapshot`. It verifies the worker policy before creation, binds messages to operation/model/context identities, stops at a 120-second loading or 30-second generation deadline, and ignores cancelled or stale completions. The actual tokenizer encodes the same three fixed ChatML conversation segments as WebLLM; measured prompt usage must equal preflight. The supported chat API receives a JSON schema and disabled-thinking option. Only one strict JSON object, optionally preceded by the runtime's exact empty thinking block, is accepted.

On GitHub Pages, first visit can require a reload. The runtime requires an active service-worker controller, its versioned manifest, the currently loaded main script in that manifest, the exact worker policy header, matching worker version/hash headers, matching worker bytes and a stable controller. The service worker injects those headers only after checking the pinned worker bytes. A plain Pages response without that worker policy is refused. Static document policy permits only exact observed model-file source/redirect paths and cannot execute WASM or blob workers.

The file-policy receipt checks all 219 larger-model endpoints using HEAD on every redirect hop. No response body is read by that qualifying batch. The legacy 0.6B fictional sample stays distinct and retains its existing contract. All 235 download assets across three models yield 467 exact connect-source paths and 58,779 policy bytes. Build/check assertions keep the policy below 100 KiB, leaving headroom under the documented Workers 128 KB response-header limit. Deployment must still probe the actual host; no wildcard fallback is permitted.

Validation completed in the isolated source worktree:

- Direct TypeScript and focused ESLint passed without warnings.
- Browser-worker and Pages builds passed without warnings; Pages fonts are explicit externally copied asset paths, rather than unresolved build references.
- Local coaching runtime: 102 behavioral assertions, including double requests, operation/model/context fences, cancellations, stage deadlines, constructor and dispatch failure cleanup, strict IDs and measured-token bounds.
- Worker policy and larger download pins: 709 assertions with mocked headers/controllers/network, including first-visit refusal, build/controller mismatch, policy/hash/body corruption and bounded manifest reads.
- Exact generated Pages service worker: 608 assertions, 58 allowlisted files, including worker policy/version/hash injection and existing cache rollback/corruption protections.
- Existing fictional Qwen controls: 132; downloader: 190; runtime: 91; preferences: 98 assertions.
- Independent read-only review verified the vendor's conversation segments and supported chat/schema path. It found a worker-start settlement bug, which was fixed and covered by constructor/dispatch regressions.

No model weights were downloaded, no model inference was run and no real WebGPU, browser, OS offline or physical-device acceptance was measured. WebLLM requests a cached shard twice, and each access rereads and verifies it; the 317/508 MB largest shards can create substantial loading-buffer pressure and may exceed the explicit loading deadline. These models remain experimental desktop choices, outside Automatic selection and native qualification. Root integration, final production checks, actual hosting response probes and publication remain separate checkpoints.
