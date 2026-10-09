# U08a1 — verified browser model-download foundation

Parent local checkpoint `a4a56c16039b121b9179d5c9e0c1610207608f65`, branch `audit/2026-10-08-resume`. This independently tested slice supplies the download/cache service. **No app screen invokes it yet.** U08a2 will collect actual opt-in and wire the browser/network policy; U08b will connect and qualify inference. No real weights were downloaded, and no model/device is qualified.

## Download and persistence boundary

`lib/qwen-download.ts` snapshots and freezes the four web manifests from `lib/qwen-assets.json`. Only exact immutable publisher URLs, unique file paths, positive exact sizes and SHA-256 hashes are accepted. The confirmation structure binds model ID, descriptor fingerprint and full download bytes; a stale size/hash or unknown choice cannot start a request. Possessing this programmatic structure is not proof of a user gesture: U08a2 must collect explicit opt-in and must never download from an Auto/Off preference or initial page load.

Downloads use public GETs with credentials omitted, no referrer, no request body/account headers and no HTTP-cache write. Exact decoded bytes and streamed SHA-256 are authoritative; Content-Length cannot substitute for either. HTTP partial/error/opaque responses, insecure redirects, truncated/extra/tampered files and unsafe input buffers are rejected. Fetch/read idle timeout is 60 seconds. Caller cancellation interrupts even a stalled transport; a late response is closed. No profile, workout, key, transfer or photo store is available to this service.

`lib/browser-qwen-cache.ts` uses a dedicated `movefield-qwen-assets-v1` IndexedDB with `models`, `attempts` and `chunks`. HTTPS, IndexedDB and Web Locks are required by its normal browser entry point. An exclusive per-model lock refuses conflicting downloads/deletes in another tab promptly; it does not steal locks or fall back to an unsafe local mutex. Files are coalesced into fixed 256 KiB rows. The downloader refuses input chunks above 4 MiB; this bounds its application buffers, not all browser/transport memory. There is no multi-GB ArrayBuffer download or network await inside an IndexedDB transaction.

Each asset must pass its exact byte/hash check before sealing. A single transaction publishes the completed model pointer only after all assets are sealed. Previous complete model data remains referenced until replacement commits. Partial attempts never appear as complete. Low-space estimates stop bandwidth use early when available; unknown estimates are not a capacity guarantee, and actual quota errors remain recoverable.

Cleanup uses key cursors and at most 128 deletions per transaction. An attempt marker stays until the last batch, allowing interruption/retry without loading blob contents. Failed replacement/cancellation preserves the prior complete model. Explicit Delete first removes model availability, then cleans its files; if deletion fails midway, a later opening resumes cleanup. Other model IDs and unrelated databases remain intact. A timeout that encounters an already finished transaction waits for its completion/abort event; cleanup cannot discard the currently committed attempt.

Cached bytes are checked again before runtime loading. `readVerifiedFile` returns an ArrayBuffer only after the whole pinned file passes size/hash checks and a caller-supplied loading ceiling. The lower-level iterator hashes at end-of-file and refuses a consumer that exits early. Runtime code must await full verification before executing WASM or using tensor bytes. Full-file loading uses memory and needs real runtime qualification; the bounded download path does not certify inference memory use. No cache receipt can grant a Qwen qualification record or change deterministic training authority.

## Tests and result

| Check | Result | Scope |
| --- | --- | --- |
| `node scripts/check-qwen-download.cjs` | 190 assertions pass | Synthetic assets: consent, immutable metadata, exact bytes/hash, buffer/progress bounds, quota/retry, failed replacement, cancellation/late completion, stalled reads, four fresh-manager persistence snapshots, corruption/eviction and verified loading limit |
| `node scripts/check-browser-qwen-cache.cjs` | 74 assertions pass | Actual adapter on pinned `fake-indexeddb 6.2.5`: chunk/index/cursor logic, seals, pointer transaction abort/readback, cleanup/replacement, collision, re-opening, corruption, interrupted batched deletion and unrelated-store preservation |
| `npm run test:regression` | 28/28 suites pass | New suites join all prior training, grounding, native/browser storage, transfer, security and content checks |
| Web/native TypeScript and root lint | Pass, zero lint findings | Includes canonical metadata type update and new browser service |
| Qwen catalog/native snapshot checks | 1,675 assertions / 36 files pass | Qualification remains measurement-gated; no synthetic record is saved as a real device result |
| `node scripts/check-dependencies.mjs` | Pass with existing exceptions | Both braces/node-forge advisory roots remain release blockers; no new exception added |

`fake-indexeddb` is an exact pinned development/test dependency with no transitive dependencies; package/lock changes are limited to that entry. Existing locked installs were reused. Its registry tarball integrity was checked before loading the adapter tests, in this isolated checkout. The earlier integration checkout and installed dependencies were not modified. This is not a clean installation or new CI run.

Current results/source fingerprints are in the matching JSON and `docs/qa/u08a1/`. Integrated stdout again stops at `check-library.cjs`, while the runner exits zero and its fresh results JSON contains every suite at 28/28. Direct cache-suite reports verify 264 new assertions. Historical generated content reports were restored after checking rather than overwriting their earlier evidence.

## Limits and next milestone

No production UI/CSP/service worker change or new production build occurred in this slice. The currently available supervised preview serves the earlier checkout over HTTP and cannot run the app's secure-storage flow. It is not actual IndexedDB/Web Locks/model-download acceptance for this service. Browser/OS termination, physical quota, real CDN/CORS/cache eviction and multi-GB throughput remain unverified; the tests above use synthetic assets and an IndexedDB implementation in Node.

Next U08a2: lazy opt-in/progress/cancel/retry/delete/off controls; current browser capability and capacity messages; scope model publisher/CDN access from verified requests without uploading workout records; maintain ordinary app usability; record real browser UI and secure-origin blockers. U08b must consume only fully verified files, retain the U07 evidence/selection contract, measure real task accuracy/safety/interruption and exact device/context/runtime memory/latency, and offer only independently passing tiers. S02 native SQLite migration and U09 native runtime/build/device work remain required.

Exact checkpoint: `git log -1 --format=%H -- docs/qwen-download-foundation-2026-10-08.md`. GitHub review head remains `8cd39e42f2178b807d63af2042b70481041b028b`; explicit permission is needed before the completed source/documentation range can be pushed after the prior automatic-review rejection. No merge or deployment occurred.
