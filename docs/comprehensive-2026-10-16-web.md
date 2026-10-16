# Comprehensive web audit · 16 October 2026

This began as a read-only follow-up audit of the current Movefield review, Grizzly website and preserved original Movefield website. The findings below retain that baseline; the repair section records subsequently authorized fixes and their separate validation. This does not certify complete accessibility, every device, or the six master prompts. No original-root asset or owner record was changed.

The baseline shared application assets are the published coaching UI, not the new focused native screens. The release-owned parity receipt `.sites-runtime/native-focused-screens-2026-10-16/web-application-parity.json` finds all **1,824 owned application files per brand byte-identical** to the existing publication. Baseline tests below use those actual static outputs in disposable Chromium profiles, with synthetic sample data. Exact entry/CSS/JS hashes are retained in the ignored receipts. Movefield's baseline main bundle is `index-Cbvqaehl.js` (`bcc3342736ca1eb70a40fde9be36d81d66603cd2821db34f8dc941cbd980bb3c`); Grizzly's is `index-BlpAb5Is.js` (`3e100e0dfc790b0adc74b8034108d38023e0af2bdf237eb8c4f04d5817ed5e61`).

## Findings, in recommended repair order

The security workstream has higher-priority cross-cutting findings to resolve before declaring the web vault/backup flows complete. Its actual-browser passphrase-rotation test finds retained old IndexedDB history rows still decryptable with the prior passphrase after the new root rejects it. See `.sites-runtime/comprehensive-security/rotation-retention-result.json` and the security report; this is ordinary retained data, not a claim about forensic disk recovery. The findings below describe the web UI/offline scope and do not supersede that P1 security work.

### WEB-C01 · P2 · An incomplete offline install reports ready and does not repair a missing guide cache

**Both current brands.** `public/movefield-sw.js:19` tolerates a non-success HTTP response for public guide/media/font resources; only compiled JS/CSS failures throw. The registration then activates and `app/page.tsx:141` reports “Offline app files ready on this device.” At `public/movefield-sw.js:31`, a later cache miss fetches the resource but never puts the successful response into the cache.

Actual reproduction: return HTTP503 only for `exercise-guides.json` during first install; wait for activation; restore a normal response; open and successfully read Barbell bench press instructions online; go offline and reload; explicitly re-enter the sample and open the same guide. Both brands show “Guide unavailable” and the retry alert. The successful online read had `guideCached:false`, even though the readiness notice was present. The workout and quick cues remain available; no saved-record loss was observed.

Require the essential guide resources before reporting complete readiness, or report partial availability distinctly. Add a safe cache fill on a successful allowlisted public-resource miss. Keep private/API responses excluded and do not activate over an open workout. Regression should cover first-install503, later successful retry, and offline reload.

Evidence: `.sites-runtime/comprehensive-2026-10-16-web/followup/results.json`, cases `partial install before offline` and `503 guide during worker install then successful online read then offline reload` for each brand.

### WEB-C02 · P2 · Two open setup builders silently overwrite each other's drafts

**Both current brands; independently reproduced by the security workstream.** `app/page.tsx:260` serializes draft writes but does not compare the previously read draft. The cross-tab observer at `app/page.tsx:154` observes the accepted profile, rather than the separate setup draft.

Tab B saves a new draft name. Tab A edits age from its older in-memory draft. B's name is silently replaced and lost after reload, with no conflict warning. The accepted profile ciphertext remains unchanged. This is draft loss, not proof of loss of the accepted workout history.

Use an expected draft revision/ciphertext for write and clear, show a conflict choice, and preserve both unsaved versions before reload. Evidence: `.sites-runtime/comprehensive-security/draft-tabs-result.json`, helper `reproduce-draft-tabs.mjs`, both brand screenshots. Coordinate this fix with the security workstream rather than changing only the visual wizard.

### WEB-C03 · P2 · Enlarged text can remove the mobile navigation's entire scroll area

**Both current brands.** At320×568 with the document root set to200% text, the sidebar is576px wide, and its central navigation body has **zero height**. The Movefield header is201px and footer372px; Grizzly's header is269px with the same footer. Header/footer elements intercept attempts to select Today. Escape dismisses the menu, but the normal destination controls are unusable.

Source: `components/ui/sidebar.tsx:183` uses a fixed rem width and a full-height column; header/footer at335/346 consume the height while `SidebarContent` at371 shrinks to zero. The main navigation is neither visible nor reachable by normal pointer interaction in this state. The screenshot shows the brand and Settings/profile footer with all regular destinations missing.

Cap the mobile drawer to the usable viewport and provide a scroll owner that can expose all navigation, including on short screens. Keep full labels and a clear close action. Verify keyboard focus is not obscured while moving through the drawer.

This is an explicit200% **text-only stress test**, above the offered100/115/130% app choices. It is not a claim that browser pinch zoom or a particular phone's OS text setting was executed. Evidence: initial `results.json` contains actual intercepted-click traces; `followup/results.json` contains measured rectangles; `followup/{movefield,grizzly}-sidebar-200.png` were captured and Movefield was visually inspected.

### WEB-C04 · P2 · Settings preview controls overflow at200% text

At320px width and200% root text, both Settings pages expand to 359px. “Preview sign-in” reaches x359.34; “Preview setup” reaches343.20. The overflowing controls are the preview account-security rows from `components/account-security.tsx:21`, styled by `.security-method` in `app/globals.css:86`. This is actual outer-page horizontal overflow; the decorative Grizzly fog outside its clipped container is not counted as the defect.

Allow the action to wrap or move below the row, with `min-width:0`, usable height and a bounded width. Verify complete labels at 320px and200%, including sample and personal Settings. Evidence: initial `results.json`, `Settings root text 200 percent`, both brands. The whole Settings page is also very long; category navigation similar to the new native Settings would improve discovery, but it is a separate product change rather than a prerequisite for this narrow repair.

### WEB-C05 · P2 · Intermediate-width logging is squeezed by the persistent desktop sidebar

The responsive workstream independently reproduced the 768px/130% case: the332.8px sidebar leaves435.2px for the workspace while viewport-based rules retain desktop logging columns. Actual load/repetition values clip and rest digits wrap. This is a different failure from outer-page overflow; a zero-overflow assertion alone misses it.

Use usable container width to choose the logging arrangement or collapse navigation sooner. Preserve decimal/unknown values, callbacks and rest semantics. Its measured load input is 43.75px wide with 21.20px content space, while the visible value 12.5 needs 37.78px. At840px/130%, Today’s Add time off or an event action also ends at862.23px and creates horizontal overflow. Evidence is owned by [the foldable audit](comprehensive-2026-10-16-foldables.md): `.sites-runtime/foldable-web-widths/results.json`, `.sites-runtime/foldable-web-audit/results.json` and the 768px screenshots. The additional audit here confirms that entered123.45 and the complete sample state survive344→690→844→360→280 viewport transitions; that successful preservation does not qualify control readability at 768.

### WEB-C06 · P2 · A failed initial application script leaves a blank page

**Both current brands.** `github-pages/index.html:2` and `grizzly/index.html:2` contain an empty root and module script, without a usable initial loading/failure fallback. Returning503 for only the initial `assets/index-*.js` produces empty `body.innerText` and empty root content. No retry or explanation is visible. A normal manual reload after restoring the response recovers.

Provide a small accessible static loading/failure message and a safe Retry/reload action that is replaced once React mounts. This should not imply that records are missing or recommend clearing browser data. Separate tests should cover an unavailable initial script and a failed lazy chunk. The latter was not fault-injected in this audit; `WorkflowBoundary` currently protects setup, rather than every lazy workspace view.

Evidence: initial `results.json`, `initial application chunk503` and `manual reload recovers unavailable entry chunk` cases, both brands.

### WEB-C07 · P2 · Preserved original website still has two known accessibility gaps

The original-root Plans “Saved” and “Paths” tabs again fail contrast at 344×882 and690×600: **3.89:1**, 14.4px normal text, foreground `#6e7a7e`, background `#edf1f3`; normal text requires4.5:1. The original source's `components/ui/tabs.tsx:67` uses the translucent foreground token. Earlier current-day audit also found the original setup's unnamed progressbar at `components/training-onboarding.tsx:57`; that separate prior finding was not retested in this added navigation matrix.

These are the **legacy source at `9cdcec081bee3525838ac334da1bb48de6690f13`**, not instructions to edit the current shared files with the same names. The legacy provenance/maintenance note `.sites-runtime/audit-original-root-provenance-2026-10-16.md` gives the recoverable source and narrow publication path. Do not replace the 63 preserved original-root assets with the review build: its encryption, record stores and feature history differ. New routines and the focused native redesign should not be represented as already present in this older root.

Evidence: initial `results.json`, original Plans states; screenshots `original-Plans-{344x882,690x600}.png`. Prior unnamed-progressbar evidence: `.sites-runtime/audit-original-root-2026-10-16/results.json`.

### WEB-C08 · P3 · Exercise-guide Close target misses the intended minimum width

`components/ui/sheet.tsx:78` renders the Close control without `data-slot="sheet-close"`, so the intended44px rule at `app/globals.css:98` does not apply. The actual button is20.8px wide at130% text (57.2px high). This is a poor narrow touch target even though the tested axe scans did not flag a WCAG failure; spacing exceptions mean width alone is not enough to claim such a violation.

Give the rendered control the existing style hook, retaining its name, keyboard operation and focus return. Verify the actual hit box at 100/130% in guides and mobile navigation. Evidence: `followup/results.json`, `exercise guide close target`, exact rendered HTML and bounding boxes for both brands.

### WEB-C09 · P3 · Initial/offline resource cost deserves a mobile budget

Current unique precache sizes, excluding HTML and HTTP compression:

| Brand | Cached files | Uncompressed bytes | Font bytes |
| --- | ---: | ---: | ---: |
| Movefield review | 10 | 6,579,788 | 986,004 across 2 fonts |
| Grizzly | 48 | 18,478,196 | 11,990,744 across 35 fonts |

The Grizzly configuration at `vite.grizzly.config.ts:15` intentionally precaches every offered font. Keep all appearance choices and the branding; investigate licensed WOFF2 delivery, staged optional offline downloads or selected-font-first caching. Explain any change in offline font availability rather than silently removing the collection. Updates may temporarily keep an old and new cache while old windows remain open.

With service workers blocked to isolate UI demand, one clean local welcome loaded 3,052,037 decoded resource bytes for Movefield and 4,062,850 for Grizzly. Main JS is about1.84MB per brand. The progress chunk is lazy; detailed guide JSON was not requested by welcome, Today or Progress. There were **zero external requests** in those journeys. Exercise results initially render 60 cards and history 6 rows, rather than all entries at once. These are useful existing bounds.

The local unthrottled timing samples are not a low-end phone speed estimate, a Core Web Vitals acceptance result, a memory benchmark or a network-transfer measurement for compressed production delivery. Evidence: `cache-size.json` and `loading-performance.json` in the audit directory.

## Completed coverage and what it establishes

- **54 added finite axe/layout states:** 42 on the current shared brands and 12 on the original root. The 42 shared states had zero axe violations; two large-text Settings states had measured outer overflow. The original Plans contrast failure occurred in two of 12 legacy states. The two large-text navigation failures were caught by actual pointer behavior and geometry, not axe.
- Added ordinary viewport matrix:344×882 cover-like width,690×600 unfolded/split-like width,1024×600 landscape/tablet, plus280px narrow checks. Actual logging transitions through690×600,844×390,360×700 and280×653 at130% preserve entered load and complete sample state. These dimensions simulate available space; they do not simulate a hinge, posture sensor, OS resize lifecycle or touch keyboard.
- Detailed instructions survive healthy online reads; injected missing-guide recovery exposes WEB-C01. Guide error text and retry remain visible and both offline failure dialogs pass axe. Initial-script failure exposes WEB-C06. The sample deliberately requires choosing Explore again after reload; the first harness incorrectly expected automatic sample re-entry, and that harness assumption was corrected before drawing offline conclusions.
- Existing unchanged-byte evidence remains relevant: the prior coaching audit records 82 finite accessibility states, real encrypted save/reload, stale-tab rejection, quota failure/retry, before/after coaching, dialog focus trapping/return, calendar keyboard navigation, explicit reduced motion and preserved commitments. See `docs/coaching-ux-audit-2026-10-16.md` and its validation receipt for each exact source scope. Those earlier tests were not all repeated here.
- Code review confirms explicit status/alert text for save/conflict errors, deferred guide requests with retry, read-only chart data tables, calendar keyboard movement, opt-in reminders with their open-page limits, and Grizzly motion paused while hidden or reduced-motion is selected. These controls still require real assistive-technology/device acceptance.

The initial harness’s implicit sample-reload assumption and a too-early service-worker notice assertion are retained in receipts as test issues; neither is silently converted into an application defect. The focused update rerun **passed**: with two Movefield windows open, a new worker stays waiting and displays App update ready; after both close, the replacement activates, removes only the old Movefield cache, preserves Grizzly’s cache, and opens the sample offline. This used an isolated revision change in the localhost response, not a new publication or altered application files. Evidence: `update/results.json`.

## Authorized repairs and separate validation

**WEB-C01 is repaired in source and passed in both built brands.** Every listed offline resource now has to complete successfully before installation can activate. Failed installs wait for outstanding cache writes and remove their incomplete revision cache. A successful online read of a missing allowlisted file fills that cache; a failed response is not cached, and a cache quota error does not prevent reading an available online response. Private paths, query requests and write requests remain outside the handler. Existing update-waiting behavior and brand cache isolation are preserved.

**WEB-C06 is repaired for both static entry pages.** The initial HTML now supplies an accessible explanation, a normal Try again link and a JavaScript-disabled explanation. The small independent `public/app-loading.js` reports a failed/slow initial script and disconnects when React replaces the fallback. The retry does not clear records. The independent helper is included in the offline list and release hash; CSP was not loosened. Failed lazy workspace chunks remain a separate audit scope.

**WEB-C08 is repaired.** The shared sheet Close control has its intended style hook plus explicit minimum44px dimensions. Actual guide buttons measured44×44px at100% and44×57.19px at130% in both brands; the keyboard Escape path and guide reopen/offline path also worked.

Validation for these three fixes:

- `node scripts/check-offline-recovery.cjs` executes the actual worker handlers. Five required-file failure classes, failed-install cleanup/retry, cache-miss repair, non-success exclusion, quota fallback, private/query/write exclusion and other-brand preservation pass.
- `node scripts/check-offline-build.cjs` verifies bootstrap-only, guide-only, media, base-font, branded-file and worker changes invalidate the revision, while unrelated downloads and deterministic bundle ordering do not.
- `node scripts/check-offline-registration.cjs` passes the existing exact-registration readiness, install-failure, waiting-update and listener cleanup cases.
- `scripts/check-web-offline-recovery.mjs` passes **13 actual-browser cases and8 finite axe states** on the refreshed isolated minified builds. It injects initial-script503, both-script failure, JavaScript-disabled loading and required-guide503; verifies the visible retry, incomplete-install notice and clean retry; removes a guide cache entry, repairs it online and reads it after an offline reload. A two-window update stays waiting until old windows close and preserves the other brand's cache. All eight states have zero axe violations and no outer overflow. The receipt is `.sites-runtime/comprehensive-2026-10-16-web/fixed-browser/results.json`; `results-before-final-adapter-css.json` preserves the earlier source-qualified pass.

**WEB-C03/C04/C05 pass the repaired layout checks.** The final responsive CSS/sidebar was tested in **16 added states** across both brands: Today at840/130%, logger at768/840/1024/1280 and130%, and Settings/navigation/Today at320/200%. All16 have zero outer overflow, zero axe violations and zero page errors. Full entered123.45 is visibly within each load input's measured content width and the entire sample state survives resizing. Every drawer menu target scrolls into view, Close is at least44px, actual Tab traversal exposes every destination, keyboard scrolling works and selecting Today succeeds. The extra Today320/200% check initially exposed Coaching history and the last weekly-schedule column overflowing; a further narrow repair wraps the action and lays out all seven weekday labels over two rows. Actual text ranges retain weekday order and do not overlap in either brand. The weekly-card and coaching-action screenshots were visually inspected. Visual review then found mini-stat labels cramped within three columns at200%. The responsive owner added a narrow-container stack; a final two-state check passes whole-word label widths, weekday text order/non-overlap, zero axe violations and zero outer overflow in both brands. The updated weekly cards were visually inspected. The final receipts are `.sites-runtime/comprehensive-2026-10-16-web/layout-fixed/results.json` and `weekday-details.json`; `results-before-today-200-fix.json` retains the intermediate failed layout. An initial keyboard assertion sampled before the preceding Home scroll settled; waiting for that user-triggered scroll and measuring settled focus resolves this harness timing issue without a source change. `focus-diagnostic.json` and `results-immediate-keyboard-focus.json` preserve that distinction.

The offline/browser receipt at19:19:10Z uses Movefield main JS `e80225a0…bdf94e` and Grizzly `98916557…f1be89`; the subsequent final layout receipt at19:25:05Z uses `20967682…8401fd` and `1ab7cff9…1b8489`. The later changes release the setup adapter closure on close and adjust responsive CSS. The final two affected Today states at19:28:55Z qualify the mini-stat-only CSS update: Movefield main JS `1ebcf224…f63bf1`, CSS `18936221…5ee365`; Grizzly main JS `943934d0…0414cf`, CSS `2fbc23a3…66d6b5`. Worker/bootstrap/Close implementation remains unchanged. Each receipt records complete HTML/JS/CSS hashes, with final worker hashes in `weekday-details.json`. Do not describe an earlier pass as a run against later bundle bytes.

Security's actual-browser rotation repair also passed on these isolated builds: old-key rows are gone, complete synthetic state including known/unknown loads is preserved, and the new passphrase unlocks after reload. See `.sites-runtime/security-repairs/web-vault-rotation.json` and the security report for its scope. Setup draft-conflict repair remains owned and validated separately by the parent workstream. These are local validation results, not publication or physical-device claims.

## Remaining compatibility and novice-use gates

| Area | Required next acceptance |
| --- | --- |
| Browser engines | Real Safari/iOS, Samsung Internet, Firefox and WebKit. Only Linux Chromium 154 is available here; pinned Firefox/WebKit downloads and package hosts were denied by the managed proxy. No bypass was attempted. |
| Foldables/tablets | Samsung Fold cover/open transition, split-screen, posture/hinge occlusion, rotation while typing/logging, keyboard resize, app background/restart and external keyboard. The web source currently has no explicit viewport-segment/hinge policy; that is a test/design gap rather than proof of a hinge collision. |
| Accessibility | VoiceOver/TalkBack, keyboard-only end-to-end setup/log/backup, screen-reader status timing, actual browser 200/400% zoom, system font scaling, forced colors and every palette's relevant dialog state. Finite axe passes cannot establish complete WCAG conformance. |
| Storage/offline | Actual browser eviction/private mode, low free storage, interrupted browser termination, very large history/backup, multiple setup tabs and offline install/update faults. Do not treat cache readiness as a backup, or tell users to clear their data. |
| Novice navigation | Make the older root, latest review, Grizzly and native downloads distinguishable. The review's “Open current app” link at `github-pages/entry.tsx:6` currently returns to a materially older application with separate records. A reviewed entry/migration explanation is safer than silently replacing it. |
| Instruction usability | Observe a novice choosing equipment, using substitutes, distinguishing unknown load from zero, selecting RIR and finishing a partial workout. Written guides and forms are available; a browser code audit cannot confirm that every person understands them or performs an exercise correctly. |
| Performance | Set budgets for cold load, first interaction, offline installation, memory and battery on representative lower-end Android/iPhone hardware with real compressed network delivery. Preserve appearance choice and training correctness while optimizing. |

Use a short representative device matrix first: the owner's S24 Ultra, one lower-memory Android, a Fold-class cover/open device, a small iPhone, a large iPhone, an iPad and desktop keyboard/screen-reader browsers. Expand based on failures. The owner's prior Movefield 0.1.6 install confirmation does not establish this web matrix or the upcoming redesigned native version.

## Evidence location

All new executable helpers and detailed receipts are ignored under `.sites-runtime/comprehensive-2026-10-16-web/`: `audit.mjs`, `results.json`, `followup.mjs`, `followup/results.json`, `update.mjs`, `update/results.json`, `cache-size.json`, `loading-performance.mjs`, `loading-performance.json`, and screenshots. The helpers serve current outputs read-only, keep Chromium's own sandbox enabled and isolate all injected faults to a private localhost server. No tests use owner records or modify the original publication.
