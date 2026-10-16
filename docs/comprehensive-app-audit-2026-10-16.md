# Movefield and Grizzly: comprehensive application audit

**16 October 2026 — source audit and repairs qualified; final delivery pending.** This report covers the current shared Movefield and Grizzly websites, Android/iOS source applications, offline storage and optional service implementation. It also identifies the older original GitHub Pages application separately. Findings below are tied to reproduced behavior or source inspection; browser checks, native component simulations, compiled installers and physical devices are different levels of evidence.

The focused-phone release is already delivered: Movefield **0.1.7/code8**, Grizzly **0.1.6/code7**, native source `f0130487760aa03d64b22f23002da5423da7ff4e`, delivery source `920a73621d9f2ab15bbddcd00139c9cebd155238`, Pages `481b781308e03804c78a50ceec703af715dabdf5`. Its exact installers and website bytes were verified. Repairs described in this new audit are subsequent source changes and must pass the release gates below before being described as live.

## What was reviewed

| Application or boundary | Audit coverage | Important distinction |
|---|---|---|
| Movefield shared website, `/movefield/review/` | Setup, plans, logging, history, settings, calendar, guides, encrypted storage, multiple tabs, offline installation/update/recovery, downloads, accessibility and resizing | Actual Chromium UI and local encrypted profiles are used for browser reproductions. |
| Grizzly shared website, `/movefield/grizzly/` | Same journeys plus brand storage/cache isolation, fonts, appearance and enlarged text | Shared training logic does not make brand layout checks interchangeable. |
| Movefield Android source and preview | Focused screens, inputs, plans, reminders, history, record adapter, transfers, orientation and update identity | Native React components and mocked OS boundaries are not installed Android execution. |
| Grizzly Android source and preview | Same native checks plus branded type, decorations and distinct package/signature lineage | Existing Movefield phone acceptance does not qualify Grizzly. |
| Both iOS source applications | Shared native types, Hermes exports, explicit iOS presentation/keyboard branches and configuration review | No Apple membership/signing setup has been supplied; there is no signed IPA or TestFlight release. |
| Original GitHub Pages root, `/movefield/` | Selected browser states, accessibility and preservation checks | An older separate application. Its files and existing data namespace remain preserved; it does not inherit the shared preview's fixes automatically. |
| Optional Cloudflare account/storage/coaching service | Local SDK/API, owner isolation, encryption, retry queue, deletion, quotas and consent tests | These are local synthetic service checks. Connected production account/OAuth/R2/model operation remains unqualified. |
| Training and exercise content | Target preservation, substitutions, schedule conflicts, history order, equipment restrictions, source/media fields and structural inventory | Complete fields and passing algorithms are not an independent exercise-science, technique or media-rights certification. |

Detailed evidence and individual reproduction steps are in the [native audit](comprehensive-2026-10-16-native.md), [product and exercise audit](comprehensive-2026-10-16-product.md), [security/data audit](comprehensive-2026-10-16-security.md), [web audit](comprehensive-2026-10-16-web.md), and [foldable audit](comprehensive-2026-10-16-foldables.md). Each retains its original failing observations and distinguishes subsequent repair checks.

## Reproduced findings and repairs

| Area | What a user could encounter | Repair and acceptance boundary |
|---|---|---|
| Detailed prescriptions | Saving an unchanged coach/manual workout could remove ranges, specified weights, setup and source instructions. | Preserve full compatible target metadata, preserve untouched/reordered rows, preview deliberate changes and reject basic edits that conflict with saved per-set or timed instructions. Coach authority and completed history remain unchanged. |
| Exercise substitution | Entering only a set's reps-left rating, including zero, did not prevent substitution from discarding it. | Treat an explicit per-set rating as recorded input; reject the replacement without altering the original exercise. |
| Calendar imports | Some fixed commitments were accepted during plan import but immediately prevented the workout from starting. | Apply the same conflict policy before import acceptance; show the affected dates. |
| Target editing | Moving an exercise while its web edit was open attached that edit to the wrong row index. | Maintain the edited exercise identity across both reorder directions and preserve pending input. |
| Cross-client history | Restored history could appear in the opposite order on web and phone. | Sort copied presentation data chronologically with deterministic ties, without rewriting stored records. |
| Older rating values | Native correction controls did not show valid older exact RIR values 6–10 as selected. | Display and preserve those exact values until the owner changes them. |
| Running instructions | Future native running sessions exposed totals but not every saved run/walk interval. | Provide collapsed per-session instructions in setup and Calendar, using the exact saved sequence. |
| Setup numbers | A decimal-comma dumbbell limit could become `NaN` and prevent saving. | Use the same finite decimal input behavior as the workout controls, with unit/draft/retry checks. |
| Reminder opt-out | Turning reminders off from sample mode could leave personal workout alerts scheduled. | Reconcile opt-out independently of loaded personal State; cancel only owned alerts, including delayed scheduling. Preserve an already authorized full schedule when entering sample with reminders still on. |
| Recovery files | A valid large complete-record backup could be exported but rejected by the single-envelope size limit during restoration. | Bound the outer bundle separately; retain strict inner-envelope, record-count, digest and reconstructed-state checks. |
| Concurrent reads | A writer pruning old rows could make another reader falsely report corruption. | Retry only when the root actually changed, with bounded attempts. Stable corruption still fails closed. |
| Concurrent setup | A stale browser tab could overwrite or clear another tab's newer unfinished answers. | Compare the exact encrypted draft under the existing locks. Pause stale saving, keep local answers visible, offer a private-copy download and reload recovery, and guard plan acceptance. |
| Passphrase change | Old-key history rows remained in ordinary IndexedDB after successful rotation. | Retire superseded-vault rows only after the new vault is acknowledged, in a transaction guarded by the expected root. Cleanup failure must say the new passphrase is active and older rows remain. Downloaded backups are separate copies. |
| Future cloud queue | A delayed discard action could remove a newer queued encrypted operation. | Discard only the captured operation; preserve and report a changed queue. Live cloud remains disabled pending its existing qualification gates. |
| Offline readiness | A missing essential guide could coexist with an “offline ready” message and never be cached on later reads. | Require essential files before readiness; remove failed partial installation caches and repair successful public cache misses. Preserve update waiting and separate brand caches. |
| First-load failure | A failed initial script left a blank page. | Keep a readable HTML loading/failure shell with a keyboard-accessible retry link, including when JavaScript never starts. |
| Enlarged controls | The guide Close target was too narrow; Settings and navigation could overflow or become unusable at 200% text. | Give Close a real target area, allow controls to wrap, and let navigation/content scroll within available space. |
| Foldable/split-screen layout | Short native windows clipped input fields; intermediate web widths clipped digits despite no page overflow. | Base layout on available space and text scaling, retain the active input component while resizing, and measure ancestor clipping as well as viewport bounds. |

## Phone and foldable experience

The phone redesign uses a clear Today action, one active exercise/set, a fixed logging action, short finish steps and separate settings/guide screens. Less-used material stays available behind named actions. Long instructions and enlarged text still need bounded scrolling; forcing every screen to fit without scrolling would hide information or shrink controls.

The adaptive follow-up adds a useful wider-workout arrangement: exercise navigation alongside the active set when the available space can support both. Narrow windows retain the focused view. Compact-height behavior gives inputs more room while retaining a way back, sample identity, save failure/retry and rest controls. Rotation and multiwindow resizing must preserve entered reps/load, history, the current exercise and the timer deadline.

This is available-window adaptation. Window dimensions do not identify a physical hinge, its occluded area or tabletop posture. Dedicated hinge-aware placement, two physical display regions and manufacturer-specific fold transitions need device/API qualification; this report does not label dimension-only behavior as tested hinge detection.

The original audit exercised 108 native simulated resize states and 76 web states and retained their input/timer preservation results. It also found real clipping defects those basic preservation checks did not catch. Corrective layout evidence must additionally show the visible portion of focused controls through every clipping ancestor, readable digits, reachable navigation and enlarged-text behavior.

## Data and security considerations that are easy to miss

A screen saying “saved” is meaningful only after durable storage succeeds. The app distinguishes staged input from acknowledged commands, keeps failed entries visible and prevents completion/advancement when a command cannot be stored. Multi-tab and concurrent-reader tests complement that boundary; serializing writes alone does not stop a stale full-object overwrite.

Changing a passphrase, replacing a vault, restoring a backup and erasing a profile are different operations. Their ordering matters: a replacement must be readable before old rows are retired; stale cleanup must not remove a newer archive; old exported files keep their original keys. Browser storage eviction, device loss and forgotten passphrases also make independently recoverable backups important. Encryption does not recover a missing key or protect an already unlocked compromised device.

Notification permission and the user's reminder preference are separate. Permission denial, opt-out, sample mode, delayed scheduling, timezone travel and an app returning from suspension must be handled explicitly. Callback tests cover the implemented policy; physical notification delivery and phone power-management behavior still need device acceptance.

The two brands need independent profile, database, cache, preferences and application identities even though their training engine is shared. The original website is a third storage/implementation boundary. Releases retain old hashed assets so an open workout window can load the code it started with, and workers wait for old windows to close before activating an update.

AI readiness is bounded. Current coaching is local and deterministic. The future selector is constrained to reviewed local message IDs and cannot autonomously rewrite prescriptions. Live providers require their own identity, consent, minimization, retention, budget and failure tests; a prepared adapter or local mock is not a connected AI service.

## Remaining product and release decisions

| Priority or gate | Remaining work | Why it matters |
|---|---|---|
| Physical release acceptance | Install/update both next Android builds over existing apps; verify old workouts, cold restart, keyboard, screen reader, reminders, denied permissions, offline use and export/restore on real devices. | Passing browser/native component tests does not exercise Android Keystore, manufacturer behavior or real insets/keyboard rendering. |
| Foldable qualification | Test folded/unfolded transitions during logging, split screen, rotation, system font size, landscape keyboard and any actual hinge occlusion. | The resizing implementation can be verified locally; physical posture behavior cannot be inferred from screenshots. |
| iPhone distribution | Supply Apple Developer/signing/build setup, then produce and test actual iOS installers. | Hermes iOS exports are source/build readiness evidence, not apps a user can install. |
| Upstream tooling advisories | Monitor compatible patched releases and qualify an update when available. | Fresh registry audit reports zero root production vulnerabilities, one root tooling advisory and two underlying native tooling advisories across 15 propagated entries. The suggested Expo57→44 downgrade is not an acceptable automatic repair. |
| Original website | Scope a maintenance update or migration of its older implementation; retain its data and URLs. | Its two measured Plans contrast failures remain separate from the current shared app. |
| Browser/platform matrix | Verify actual Safari/WebKit, Firefox, VoiceOver/TalkBack, storage pressure/private mode and hardware keyboard behavior. | Chromium and RNWeb checks cover only their documented renderer/platform boundaries. |
| Native usability and resilience | Add a direct system-settings route after notification permission is permanently denied, and an app-level render-error recovery screen that preserves records. | Native findings N-05 and N-06 remain open. Known storage errors already have recovery UI; no current render crash was reproduced. |
| Performance and resource budgets | Set and measure startup, active-logging responsiveness, peak memory, offline-storage and battery budgets on a lower-memory phone as well as the S24 Ultra. | Local desktop timings are not phone benchmarks. The audited Grizzly precache is about 18.48 MB uncompressed, including about 11.99 MB of fonts; an update can temporarily retain two cache generations. |
| Content assurance | Independent review of exact exercise variants, program claims, media matching/playback/rights and unsupported preference combinations. | 995 populated exercise guides and equipment rules are structurally verified; that does not prove clinical effectiveness or licensing for each media item. |
| Product parity | Review native custom-movement entry in coach/manual editing, in-wizard commitments and the smaller native progress feature set. | These remain documented capability differences, not hidden claims of feature equivalence. |
| Concern/youth policy | Define an appropriate owner/qualified-review path after a personal concern hold and qualify youth privacy/consent before personal youth launch. | The app must preserve records and avoid presenting itself as medical clearance or verified consent. |
| Connected service/launch | Qualify real OAuth, Cloudflare bindings/allowances, account deletion/retention, incident recovery, abuse controls and any provider billing/consent. | Local synthetic tests cannot certify live operations or authorize new spending. |

## Practical ownership and acceptance checklist

These are outstanding acceptance tasks, not results already obtained. Keep them assigned to a person and a release rather than treating the existence of a checklist as completion.

1. **Protect the only copy of a workout.** Web, installed Android and the two brands use separate local stores. There is no active automatic cross-device cloud sync. Verify an encrypted transfer on a separate disposable profile, including its required recovery material, before testing phone replacement, reinstall or reset. A completed share sheet does not prove the file reached a recoverable destination. Record a backup verification date without collecting the backup or passphrase in diagnostics.
2. **Test a complete real-phone workout.** Update over the existing installation; confirm old history, create a draft, log decimal loads, interrupt with a call, lock and reopen, deny notifications, go offline, finish and reopen again. Include failed-save recovery. The pass condition is preserved values and accurate saved status, not merely an app that launches.
3. **Exercise fold transitions during unsaved work.** Try cover screen to inner display, reverse transition, rotation, split screen and keyboard opening during a set and while editing setup. Keep the same active exercise, entered values and timer deadline. Inspect actual hinge/cutout placement and system text scaling. Test a Fold-style larger inner display and a Flip-style short/compact arrangement; dimensions alone do not qualify either device family.
4. **Make support safe.** Define a way to report version, platform, action and a non-secret error code. Never request a workout backup, passphrase, token or unredacted screenshot by default. Qualify any future crash/analytics service for consent, minimization and retention before enabling it; current local tests do not establish production monitoring.
5. **Maintain delivery and recovery.** Assign responsibility for Android signing-key recovery, Apple credentials when created, dependency advisories, certificate/domain renewal, release rollback, retained web chunks and periodic restore drills. Schedule reviews of changed external exercise references and their offline fallback. Restoring older code must not imply that newer saved-data formats can be downgraded safely.
6. **Prepare for gym/public distribution.** Review current privacy and support disclosures, retention/deletion behavior, age/consent policy, actual wellness claims and logo/font/media permissions. A source citation or a supplied logo does not by itself establish every redistribution right. Finish platform privacy declarations and store-specific requirements against the actual shipped features when store distribution is authorized.

## Verification and delivery status

The final repair receipt will record exact source/tree, shared snapshot parity, core and focused tests, browser asset hashes, native exports, installer signatures/versions, Pages commit and actual download verification. Reproductions asserting a previous defect remain historical evidence; they are not relabeled as passing regression tests.

No full six-master-prompt completion, all-device compatibility, medical validation or store approval is claimed. The current goal is a tested, data-preserving preview with clear outstanding requirements and directly downloadable Android builds. Final release results will be appended here after qualification.

### Final source qualification

All 58 core groups are covered by passing results: the initial run passed 57 and exposed one obsolete JSX attribute-order assertion. That assertion now uses the TypeScript syntax tree; the corrected group and nine final affected checks passed. Both web/native TypeScript checks and all 100 shared snapshot files passed. The finite 401-file lint run had zero errors and 80 warnings; the five final changed/new lint inputs passed with zero errors or warnings.

The final native browser-renderer gate passed 180 states across both brands and three text settings, including 240 ancestor-clipping checks, six reduced-parent scenarios and six delayed validation-correction focus checks. The 200% setting is a test-only appearance stress case, not a physical OS font-size test. Final web repairs passed the documented offline, accessibility, enlarged-text and resize cases. Actual two-tab setup and passphrase-rotation browser tests passed for both brands; their recorded assets precede the final CSS-only mini-stat refinement.

Four clean Hermes exports passed with 20 reviewed markers and all 265 captured native files unchanged. Two source archives match that snapshot. Android compilation, signed-installer inspection and final Pages publication remain the next release gates.

The final static rebuild was also compared to the earlier browser-qualified files. All application JavaScript was identical after normalizing only generated filename references. A documentation token caused Tailwind to emit one unused blur utility, changing CSS filenames and the worker revision. Both final outputs passed six fresh layout/accessibility/lazy-panel smoke states. Restricting style scanning to intended application inputs is a maintenance follow-up for reproducible builds.

The fresh local Worker build also passed 19 real encrypted browser journeys with offline testing enabled. Its first run exposed a stale test that expected Today while the new after-workout coaching dialog was open. Actual storage inspection confirmed exactly one saved workout; the updated regression requires one coaching dialog, preserves the complete saved state on dismissal and forbids replay after reload. The full rerun passed against unchanged application/build bytes. No connected Cloudflare service or deployment is implied.

### Android preview qualification

Native source `81f66fe49e5a9f5c1f04fae799bd491cac1c5aca`, tree `d440eb77b94fac179d3109e3c3278e4dc69e4235`, passed build `38956403750` and publisher `38957941934` on their first attempts. [Source-tagged prerelease](https://github.com/ghinz32-cloud/movefield/releases/tag/android-ux-preview-81f66fe49e5a) contains Movefield **0.1.8/code9** and Grizzly **0.1.7/code8**, both ARM64 Android7+ development-signed previews. The existing package identities and signing certificate are unchanged.

Both public APKs independently passed source/version/signature/security checks, all20 reviewed bundle markers, ZIP16KiB alignment and all17 native libraries' ELF alignment. Actual MainActivity orientation is unspecified (`-1`); absent resizing overrides use the targetSDK36 platform default. These compiled settings do not establish real hinge or rotation behavior. Normal direct CI artifact transport was unavailable; the publisher verified the archives before upload, and the additional independent public-byte/window/alignment inspections completed before applying any Pages installer files. No network restriction was bypassed.

| App | Bytes | SHA-256 |
|---|---:|---|
| movefield | 39,346,124 | `ea2b9fbe5aae91d5c8d70ea3f3c6db2bba7e163647d623123183c7b273ee01c9` |
| grizzly | 39,497,386 | `d4fcd4f30fe2803c8eb545e13570e432503e868c3a776430f871b6c2fa5e8058` |

The final GitHub Pages delivery and completed live download checks are recorded below once published. Physical installation of these new versions is still open.
