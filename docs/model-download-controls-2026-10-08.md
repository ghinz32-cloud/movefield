# U08a2 — optional browser model file controls

Implementation checkpoint `65232aae0fab994f00ca725497caf39886e5d027` on `audit/2026-10-08-continue`, tracking `origin/audit/2026-10-08-quality`. Secure-browser download acceptance remains pending. **No model weights were downloaded and no assistant runs.**

## Result

Settings now opens a lazy model-file view. The first offered browser artifact is Qwen3 0.6B, exactly 356,920,759 bytes (356.9 decimal MB). A separate dialog shows the model and full byte count, public publishers, network-address disclosure, storage and interruption behavior, and the fact that file preparation does not enable an assistant. Review and final Download are separate actions. Automatic, Off, page opening, view opening and status refresh cannot download files.

The controller consumes each confirmation before starting, rejects a changed manifest, refuses duplicate/overlapping jobs, throttles progress, supports cancellation/retry, cancels on Off or view unmount, and reports a commit that beats cancellation honestly. The optional module cannot edit training state or grant qualification. Delete has its own confirmation, remains available while Off, targets this model only and handles interrupted cleanup without claiming stale availability. Focus/visibility refresh can discover other-tab changes; Web Locks remain the mutation authority.

Existing UI primitives supply dialogs, destructive confirmation, select and progress semantics. Controls wrap rather than overflow and keep 44 px minimum height even in compact density. Dialogs scroll within the viewport. This is implementation evidence, not complete rendered accessibility certification.

## File network policy

The browser transport accepts only the 16 exact pinned Qwen3 0.6B publisher files, uses cookie-free/referrer-free GET requests with no payload/headers, and rejects unknown final destinations before accepting bytes. Production CSP includes those exact initial and observed final URLs. No wildcard hosts, inference API, remote scripts, or WASM execution allowance were added. U08a1 exact-byte/SHA-256 checks and isolated atomic cache remain authoritative.

Metadata-only HEAD requests reached all 16 files with final status 200. Large-file redirects used `us.aws.cdn.hf.co`; metadata used the versioned Hugging Face resolve-cache path; WASM remained on GitHub raw. Separate HEAD checks with an example Origin returned compatible CORS headers on metadata, a shard and WASM. No response bodies or weights were read. Transient signed queries are never stored in policy or evidence. Only observed paths are allowed. A publisher/CDN change fails closed and needs a deliberate policy update. These observations agree with Hugging Face’s [download/firewall documentation](https://huggingface.co/docs/hub/models-downloading#downloading-behind-a-proxy-or-firewall); they do not prove real-browser downloads or multi-GB throughput. CSP path restrictions become less precise after redirects, so final origin/path validation and content hashes are separate mandatory checks.

## Verification

| Check | Result |
| --- | --- |
| `node scripts/check-qwen-controls.cjs` | 132 assertions, synthetic jobs/network only |
| Download / IndexedDB adapter | 190 / 74 assertions pass; fake-indexeddb, no OS durability claim |
| Security / offline | 29 / 31 assertions pass |
| Pinned Qwen / grounding / grading | 1,675 / 221 / 21 assertions pass; no real model answers |
| `node scripts/check-shared.cjs` | 36 canonical/native hashes pass; native sources unchanged |
| `npm run check`; `npm run lint` | Pass, zero lint findings |
| `npm run build` | Managed production build passes |
| `npm run test:regression` | 29/29 suites pass; complete stdout and JSON retained |
| `npm run test:production` | 2/2 pass; initial graph 388,537 gzip bytes below 400,000; model files/hash/cache code absent from initial graph; CSP nonces match/rotate; write/internal routes closed; current native ZIP served |

The initial bundle test incorrectly assumed the dynamic boundary belonged directly to `app/page.tsx`. The manifest showed it belongs to the imported preferences chunk. The test was corrected to inspect all initially imported chunks while retaining the actual exclusion and byte-budget assertions. Both production suites then passed. No application repair or second application build was needed for that test-only correction.

Current results are saved in `docs/qa/u08a2/`; historical content reports were restored after preserving current copies. Exact source/tree/log hashes are in the matching JSON. Existing locked dependencies were copied into this checkout to keep the preview self-contained. No dependency inputs changed, fresh install, new CI, native export or device execution is attributed to this milestone. Existing advisory roots remain release blockers.

## Browser observations and limits

The supervised HTTP development preview was opened in Chrome through the available Computer Use API. Jordan’s sample was inspected while the saved own profile remained untouched. Settings and the lazy manager opened; the view correctly showed that HTTPS is required and did not request files. Off applied, and the original Automatic preference was restored. Enter closed the file view. Dark mode and the existing 130% text were readable; the observed 1348 px page had no horizontal document overflow. Screenshot: `/workspace/scratch/movefield-qwen-settings-20261008.jpg`.

Secure-context consent/progress/cancel/delete and IndexedDB/Web Locks have not been exercised in a real browser. The preview’s HTTP origin cannot support them. Keyboard browser-zoom attempts did not change the observed viewport, so no 200% zoom/small-screen result is claimed. No full screen-reader/keyboard, physical quota, OS-termination or phone acceptance is claimed. Preview HMR returned to the welcome screen during source checking, so sample entry was reopened. The sample also showed a pre-existing save-paused notice inherited from secure-storage recovery; record it for the next UI/recovery milestone, rather than treating this view as saved-profile acceptance.

## Source recovery and checkpoint

The previous worktrees’ `.git` links pointed to a base checkout removed by cleanup. Their source survived. All 11 saved U08a1 source fingerprints matched before edits. A fresh independent checkout copied the preserved source without modifying previous worktrees and checkpointed it at `5c117e4fb3ea490326cb92be8a8bb377f564c409` on the live remote base `8cd39e42f2178b807d63af2042b70481041b028b`. Original local commits/staging state cannot be recovered; the new checkpoint preserves the recovered tree and historical reports. The documented integration commit/parents are present in remote history. See `docs/source-recovery-2026-10-08.json`.

U08b must load fully re-verified local files through the actual worker/runtime, preserve U07’s strict evidence/task gates, and measure actual tokenizer/context, memory, timing and interruption behavior. Larger model choices and assistant activation stay measurement-gated. S02 SQLite/native capacity, U09 runtime/build/device acceptance and the advisory remedies remain required. The completed local source/documentation range needs explicit push permission after the earlier automatic-review rejection. No push, merge or deployment occurred.
