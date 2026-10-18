# Web application audit · 18 October 2026

This work audits the current Movefield review and Grizzly browser applications, with a separate read-only check of the preserved original website. It does not certify every browser, physical phone, assistive technology, or product requirement. Native and shared data/security workstreams have their own reports.

## Exact baseline

The audit started at source `ca96011ac53b7d544856281a175cfee0859ca844`. Browser tests use the qualified static files from delivery `69f8b5954b9e5e8ac22b339f615ab3a7558c2ba8`, Pages `f9abe5381202fff76b29cdb8510f4a7b0a782bf0`. These are actual minified applications served read-only on a private local server, with disposable profiles. No original-root asset or owner record is changed.

| Application | Main JavaScript SHA-256 | Main CSS SHA-256 |
| --- | --- | --- |
| Movefield review | `5b49d6ad96ad2bbbcfef51c976671f8b7187e0c386a7bfbf3c715ca1ef3a632e` | `ca4c1f21f9bd0b03daea733602dd490c2d378fc78f15b3938ba2ece05809973a` |
| Grizzly | `d472e016780dd4dc161420a628f4a9fb86e2f5c941aafe161c50841451daaa3e` | `afa09ba7c3f048b77bd8d2e7fb74dbe1ed65d613e5dff9977d5d2bf848ed281b` |

The ignored receipt `.sites-runtime/comprehensive-audit-2026-10-18/web/baseline-identity.json` records HTML, bootstrap, worker and original-root hashes, plus 229 scoped source-file hashes. It distinguishes compiled artifact identity from the changing source tree. Earlier October 16 reports remain historical evidence; the checks below are newly executed against this baseline.

## Findings and repair status

### WEB-18-01 · P2 · A failed optional Progress download removes the whole workspace

**Reproduced in both current brands.** Return HTTP503 only for the deferred Progress JavaScript, then select Progress. The React root becomes empty: no navigation, explanation or retry remains. The complete synthetic sample store stays byte-identical, and an ordinary full reload after restoring the response recovers. This is a visible availability/recovery failure; the reproduction does not show record loss.

The baseline `app/page.tsx` mounts `ProgressDashboard` inside Suspense without an error boundary. Its optional `CloudAccount` has the same structure. Suspense handles waiting, not a rejected import. The existing setup-only `WorkflowBoundary` does not protect either section.

Baseline evidence: `web/lazy-chunk/results.json`, both failure screenshots and `web/lazy-chunk.log`. The receipt binds the actual compiled files and retains the expected import errors. The response fault affects only the private audit server/browser route.

**Repaired and verified in both freshly built applications.** A scoped `LazySectionBoundary` leaves the outer workspace and the rest of the screen available. It presents an explicit Reload app action instead of repeatedly attempting a cached rejected import. The App-owned action refuses a current commit/mode switch or unresolved personal storage conflict, waits for the existing durable writer, and keeps the page open with the actual error if that flush fails. The existing unload warning remains. It does not erase local storage or change data formats. Explicit reload preserves acknowledged records; it does not promise to retain arbitrary unsubmitted form text.

Owned changes are `components/lazy-section-boundary.tsx`, the small corresponding wrappers/reload callback in `app/page.tsx`, and `scripts/check-web-lazy-recovery.mjs`. The new browser regression passes for both optional sections, usable navigation/history/backup, failed staged-save flush, retained entered input, successful retry, exact known/unknown-load encrypted history and keyboard activation of reload. Exact final-byte results are recorded below. Targeted component/test lint and TypeScript checking pass; App lint has zero errors and 18 existing unused-variable warnings.

### WEB-18-02 · P2 · Original website retains its known Plans contrast failure

The preserved original root was checked again across Today, Calendar, Plans, Exercises, Progress and More at 344×882 and 690×600. The 12 finite states produce the same Plans contrast failure in both widths and no outer overflow. The low-contrast Saved/Paths tabs remain a legacy maintenance issue; the source/provenance and measured 3.89:1 contrast are documented in the October 16 web report. The old unnamed setup progressbar finding was not retested in this additional navigation matrix.

This is the older original application, with main script SHA-256 `f0edcd8b5e79504fc3f0d1bee27c2cf7e5d204d76f87a330fe52572d4c715ea4`. It is not the current review app with the same component filenames. Keep all 63 original assets and separate records intact. A legacy source patch/migration requires its own reviewed publication path; replacing the root with the review build is not this repair.

Evidence: `web/original/results.json` and both original Plans screenshots. No legacy source or publication was edited.

### Remaining usability and compatibility work

Visual review of the current 320px/200% screenshot finds the review banner occupying nearly 400px and the toolbar another 110px before Today content. This is a P3 density issue, not horizontal overflow or an inaccessible control. A compact disclosure would preserve the necessary preview explanation while reducing repeated material. The review entry link also still points to a materially older application with separate records. Explain that distinction in a reviewed entry/migration flow rather than silently switching profiles. Current Settings also remains a long page, while native now has category navigation; this is a product-density opportunity, not a failure of the tested keyboard paths. The product/capability workstream owns broader route and density recommendations.

Grizzly retains its requested fonts, palettes and artwork. These tests cover selected light/dark modes, supported 130% app text and 200% text stress; they do not establish readable typography for every font/palette/content combination. The earlier measured offline font cost and repository-wide Tailwind content-scanning reproducibility concern remain follow-ups. No unrequested aesthetic features were removed.

## Fresh completed journeys

| Check | Actual result and limits | Receipt under `web/` |
| --- | --- | --- |
| General accessibility/navigation | 64 finite WCAG-tag axe/layout states across both brands/light and dark, welcome, eight destinations, saved-workout/editor dialogs,320px and130% text; zero violations/outer overflow. Actual modal Tab trapping, Escape and return focus pass. | `movefield-accessibility.json`, `grizzly-accessibility.json` |
| Calendar, history and imports | 8 actual behavior journeys, 18 additional finite axe states at 320px/130%; zero violations/page errors. | `journeys/results.json` |
| Enlarged text/adaptive layout | 16 finite axe/layout states and 6 behavioral groups; zero violations/outer overflow/page errors. Full 123.45 load visible at 768/840/1024/1280, exact sample state preserved through resize; 320px/200% Settings/Today/drawer fit. Every drawer destination is reachable with Tab and pointer, keyboard scrolling works, Close is at least 44px. | `large-text/results.json` |
| Real personal setup/equipment |Both brands create an encrypted profile, confirm inventory, accept an actual 7-day/single-weight plan with 21 sessions, choose an available same-function substitute, reopen the exact encrypted state and open a linked form guide. Two inventory axe states have zero violations. | `fitness/results.json` |
| Initial loading/offline/update | 13 actual-browser cases and 8 finite axe states pass. See details below. | `offline/results.json` |
| Two-tab setup drafts |Both brands reject stale writes, preserve the newer draft and accepted encrypted profile, export the older window's unsaved answers and reopen the newer answers. | `draft-tabs/draft-tabs-fixed-result.json` |
| Passphrase rotation |Both brands remove ordinary old-key history rows, preserve all exact saved values including known/unknown loads, and unlock successfully with the new passphrase after reload. This is not a forensic disk-erasure claim. | `rotation/web-vault-rotation.json` |
| Failed workout saves/stale actions | 8 actual-browser checks pass: retained real start callbacks reject after concern/profile changes; quota failure keeps the active workout and check-in without after-coaching; double-click retry saves once; encrypted reload retains the exact partial record without replay. | `save-recovery/browser-results.json` |

The shared baseline totals **108 finite axe states with zero violations**: 64 general + 18 added workflow + 16 enlarged-text + 8 offline + 2 equipment-survey states. The 12 legacy states are counted separately and retain their two failing Plans states. These counts describe observations, not WCAG conformance or full device certification.

The added workflow cases do more than inspect geometry:

- Calendar uses Arrow keys, Home/End, Page Up/Down and Shift+Page Up/Down. Selection and focus follow while records stay unchanged. Invalid commitment input leaves state untouched. Saving, removing and undoing an event preserves the accepted plan/history and restores exactly one event.
- A saved-workout correction requires review. An injected actual session-storage failure retains the draft and original record. Retry changes exactly one history record, keeps plan/events/active workout, and returns focus to the opening history button on close.
- Malformed plan JSON produces an accessible error. A complete credited coach-directed plan can be reviewed without mutation. Failed acceptance retains the original; retry imports all prescribed targets as unperformed sessions, archives the previous plan and keeps history/events. Full preview remains usable at 320px/130%.
- Exercise import rejects malformed JSON and treats a literal script-shaped name as text rather than executing it.

Two initial journey runs failed due to harness assumptions, not application defects: the event dialog exposes Name/Date (the setup wizard uses different labels), and an untouched sample is rendered before its first persisted mutation. Those attempts are preserved in `journeys-attempt-1/`, `journeys-attempt-2/` and matching logs. The corrected helper reads the actual rendered initial sample when no stored snapshot exists, then verifies actual storage after mutations. No assertions about changes, failed writes, targets or focus were relaxed.

## Offline and error recovery

The current bootstrap displays a usable failure/reload explanation when the initial module returns503. It also retains an explanation when both scripts fail and when JavaScript is disabled. Retrying a healthy response opens the normal welcome without clearing records.

An unavailable required guide prevents offline readiness. Failed installation clears its incomplete revision. Retrying the install with healthy resources succeeds. Removing a guide cache entry, reading it online and then reloading offline demonstrates cache repair. The guide Close hitbox is at least 44px at 100/130%. With two old windows open, a new worker stays waiting; after the old windows close it activates, removes only its old brand cache and preserves the other brand cache.

This is a controlled local browser/cache/network-fault test, not proof that a completely uncached site can open without a network. No website can fetch its initial application while genuinely offline and uncached. Browser eviction, low-storage eviction, private browsing restrictions and interrupted physical-device shutdown still require device acceptance. The test does not activate cloud accounts or AI providers.

## Repaired-build validation

The coordinated fresh static builds passed, followed by **4 lazy-recovery behavior groups and 6 finite axe states** at 320px/130%, with zero violations and zero page errors. Actual Progress and account JavaScript responses were changed to 503 inside disposable browser contexts. The outer workspace, session history, settings and actual encrypted-backup download remain usable. Restoring the response and explicitly reloading recovers each optional screen.

An actual staged sample write fails under injected quota rejection. Reload refuses to navigate, preserves the previous stored snapshot and keeps the newly entered 18.5 visible. After a successful 19.5 write, keyboard activation of Reload app recovers Progress while preserving the complete sample snapshot. The account path downloads and decrypts a real local backup during the optional-section failure, then reloads/unlocks and verifies the exact same history, including both 25kg and unknown-load records. No account is activated.

The first new recovery run stopped because its test waited for personal-mode detailed save-error text while exercising sample mode. The sample correctly displayed its generic Save failed status; the guarded reload subsequently displays the actual rejected-flush message. `final-lazy-attempt-1/` and its log preserve this harness issue. Only the initial status wait changed; no product code, failure guard or state-preservation assertion was relaxed.

The same fresh builds also pass **2 draft-conflict journeys, 2 passphrase-rotation journeys and 8 failed-save/stale-action/coaching checks** after the shared record rollback changes. These reruns matter because the storage implementation changed after the baseline; the earlier passes are retained separately.

| Repaired application | Main JavaScript SHA-256 | Main CSS SHA-256 |
| --- | --- | --- |
| Movefield review | `7a630b6815565a541a3122783ed501ff25b9c647d3ed3cc9f62b2a2980143ad1` | `a954598383df4af20025d315dd749d6f25213dea78b1afeb3f47d483ec24e190` |
| Grizzly | `10d58a7675d5a52480bb1b493281d1eac4f7797caf190c06c3db4255ccbaa7ea` | `f9bec6004cc5f67a465280db73c4861cd8e39a6d0139b53d4132fd18bb69cfc2` |

`web/final-build-identity.json` binds entry, bootstrap, worker, optional chunks and exact changed product-source hashes. Those product hashes stayed unchanged through the runs. `web/final-validation.json` aggregates `final-lazy/results.json`, `final-draft-tabs/draft-tabs-fixed-result.json`, `final-rotation/web-vault-rotation.json` and `final-save-recovery/browser-results.json`. The corrected validator hash is recorded separately from the product source.

The baseline 108-state matrix was not repeated wholesale against these later bytes; the 6 new recovery states and 12 data-safety journeys qualify the affected changes. Source type checking and targeted lint pass. These are local compiled-build results, not publication or physical-device acceptance. The root release workstream owns delivery identity and live checks.

## Remaining acceptance gates

Only sandboxed Linux Chromium was exercised here. Safari/iOS, Samsung Internet, Firefox/WebKit, real browser zoom, mobile virtual keyboards, VoiceOver/TalkBack, OS text settings, safe areas, installed-PWA lifecycles, fold posture/hinge occlusion and lower-memory performance remain unqualified. Viewport resizing and 200% root text emulate available space/text stress; they are not hardware/OS tests. Prior managed-environment receipts document denied Firefox/WebKit downloads; this audit did not bypass that policy or infer cross-engine support from Chromium.

Use the owner's S24 Ultra, a lower-memory Android, a Fold-class device, a small iPhone, a large iPhone, an iPad and desktop keyboard/screen-reader browser as the next representative acceptance set. Observe a novice completing setup, choosing available equipment, substituting a movement, distinguishing unknown load from zero, logging RIR, saving a partial workout and restoring a backup. Code correctness and finite axe scans cannot establish comprehension or safe exercise execution.

All detailed new receipts/helpers are ignored under `.sites-runtime/comprehensive-audit-2026-10-18/web/`. Repaired-build qualification is recorded separately above; publication status belongs to the release report. The baseline results must not be represented as having tested later bundle bytes.
