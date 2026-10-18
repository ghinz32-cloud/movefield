# Product capability and performance audit · 18 October 2026

This review traces the current web and native training paths, preserves the full requirement register, and measures supported larger histories. It found substantial synchronous Progress work and confirmed several remaining capability differences. The approved strength-index calculation and native period-filtering repairs are implemented and tested; this report does not claim completion of all master prompts or physical-device acceptance.

Baseline: `ca96011`, branch `codex/comprehensive-audit-2026-10-18`. The preceding delivered interface is documented in [the native/web parity report](native-web-parity-2026-10-18.md). That release's installer/browser results remain historical evidence; the source repair below needs the integration owner's shared snapshot, build and delivery qualification.

## Main workflows and actual capability

| Workflow | Web | Native, both brands | Current audit finding |
| --- | --- | --- | --- |
| Launch and sample/private identity | Welcome/customization, synthetic sample and encrypted personal vault. | Welcome/setup, separate encrypted personal records and synthetic sample; named workspace menu. | Separate records and explicit dataset switches remain in source. Current App/state/privacy execution belongs to the parallel native/security reviews; this report does not substitute component inspection for their tests. |
| Setup and equipment | Goal/authority, time/frequency/dates, exact equipment survey, commitments, ranked plans, full preview and explicit acceptance. | Focused steps in four sections, exact equipment, saved summary, bounded alternative/reason pages and full reviewed plan acceptance. | Existing commitments are included on native, but adding new ones still requires leaving setup for Calendar. See PROD18-03. Unsupported inputs must stay explicit; no universal goal/equipment/time coverage is claimed. |
| Plans and reuse | Catalog/source plans, saved copies, credited import, full preview, pause/reuse and reviewed changes. | Plans, search/frequency filters, source preview, saved/imported blocks, Calendar and reviewed actions. | Source-program identity and authority remain separate from original app plans. Detailed training/evidence acceptance is owned by the parallel science review; this audit does not relabel variants as independent validated methods. |
| Coach/manual and custom targets | Existing-target editor and custom movement creation/addition are reachable. | Calendar selects the tracking editor for coach/manual plans; it edits existing exercise targets. App-owned plans use a different customizer with movement creation. | A coach/manual user whose movement is absent reaches an empty search with no creation or recovery action. See PROD18-02. |
| Logging | Focused exercise controls, actuals versus targets, unknown load, RIR/metrics, rest, guides, substitutions and explicit partial finish. | Direct exercise tools, one current set/task, fixed Log, inline optional details, separate previous sets and finish steps. | The preceding parity checks remain applicable historical evidence. New scoped callbacks in this review verify unknown/partial progress data and the custom-editor gap; interrupted writes/finish and stale requests are covered by the parallel state audit. |
| Feedback and progression | Local before/after coaching plus explicit proposal review; optional configured cloud capabilities remain separate. | Same canonical local coaching; owner/youth/hold and manual/coach rules remain. | Presentation does not mutate targets or infer completed work. No provider/model is activated by a preference. Actual coaching review, useful-model evaluation and clinical outcomes are distinct requirements. |
| History and progress | Chronological history, corrections, recorded exercise/volume charts, eligible estimated 1RM and a personal baseline index. | Chronological history/corrections, period-filtered recorded load/amount, distance/time/pace and external-load totals. | The native screen has no equivalent estimated 1RM/index chart. This is a capability difference, not evidence of a wrong native calculation. Current web index had a reproducible algorithmic slowdown; see PROD18-01. |
| Backup and recovery | Encrypted vault, explicit local backup/restore and optional configured account backup. | Encrypted device records, share/import and separate device recovery key; optional configured account backup. | Different recovery credentials are intentional. Manual snapshot backup is not continuous synchronization. Live shared accounts, two-device merging, installed recovery and permission behavior are not established by the presence of these controls. |

The native Calendar remains available without an accepted plan, so new commitments are possible before setup acceptance. A user can save/close setup, add the commitment in Calendar, then reopen setup; this is extra navigation, not an assertion that native has no commitment feature. Its dates step explicitly describes the limitation and previews existing saved commitments.

## Findings and repair

### PROD18-01 · P1 · Web Progress blocks on larger supported histories — repaired in source

`components/progress-dashboard.tsx` calls `strengthIndex(s)` synchronously during rendering. The original implementation in `lib/progress-runtime.js` repeatedly scanned the entire history for each candidate baseline, date and lift. A parser-valid 1,000-record fixture with three qualifying lifts took 5.95 seconds in the initial local measurement; repeated reference measurements varied with host load. A 5,000-record run hit a 50-second whole-process cap and was terminated without a completed result. Initialization/validation are included in that timeout, so it is not an exact 50-second calculation measurement.

The repair computes each workout/lift estimate once, preserves first-seen exercise order, sweeps inclusive 14-day baseline windows, and advances per-lift cursors for the existing 21-day recency rule. It keeps the same eligibility, formula, baseline selection, same-date ordering, future-date exclusion for the current score, rounding, youth behavior, unknown/assisted/one-sided exclusions and output ordering. Dates are formatted with one reused formatter. No prescription or scientific policy changed.

`node scripts/check-progress-performance.cjs` passes 144 reference-equivalence checks: seeded histories,14/21-day boundaries, later/older baselines, reordered and same-date records, future dates, youth, partial/unknown/excluded sets and frozen inputs. Its 5,000-record fixture passes the real saved-data parser and returns the expected 4,986 points. Instrumenting the actual canonical function observes 5,001 date-distance calls, bounded by distinct dates rather than all record pairs. Final isolated local comparison: 1,000 records 4,783 ms before versus 13.9 ms after; 5,000 records 66.6 ms after. These are host observations, not device latency promises. Existing activity-progress checks and scoped lint also pass.

The same 144 checks also pass in `America/Los_Angeles`, including date-window equivalence. The web dashboard now retains the index snapshot by immutable state reference and local day: exercise, measurement and machine-setup changes reuse it; changed profile/history/custom state and a new local day recalculate it. Actual component callback tests verify those invalidation paths and exact index-table values. This does not cache across edited histories or change the all-time baseline.

The independent pre-optimization reference remains in the focused regression. The ignored original benchmark/timeout receipt is preserved. Root owns copying the canonical module to the native snapshot and qualifying final bundles.

### PROD18-02 · P2 · Missing custom movement is a native tracking dead end

`mobile/App-runtime.js` routes Calendar's Edit action to `SessionEditor` for manual/coach mode and to `NativePlanCustomizer` only for app mode. `mobile/src/session-editor.tsx` searches existing canonical/custom entries and offers target edits, but neither creates a new movement nor displays an empty-result recovery action. A newly created coach/manual profile therefore cannot enter an absent movement from its workout editor. Native's main library also lacks the web standalone Custom exercise action.

New actual JSX-callback probes exercised both authority modes with a missing synthetic movement. They retain the complete state and existing target rows, but expose no creation or no-match recovery action. A separate actual customizer probe confirms that creation exists on the app-owned path. These probes deliberately assert the current gap; they are not a passing custom-movement acceptance claim.

Recommended repair: make the existing explicit custom configuration/review path reachable from tracking editing or a standalone library action, preserve a separate movement ID and its honest load convention, and retain coach/manual authority. Do not switch the owner to app mode to unlock creation or invent instructions. This audit has not modified those routes.

### PROD18-03 · P3 · New commitments require leaving native setup

Web setup has an Add commitment form, explicit None for now, and editable captured commitments before plan selection. Native setup shows exact existing commitments and instructs the user to add new ones through Calendar. This is source-confirmed extra navigation, not a data-loss reproduction. A direct save-and-open Calendar action or an embedded draft commitment step would close the gap, provided its changes are included in the reviewed setup baseline and native modal-dismissal guards remain intact.

### PROD18-04 · P2 · Progress capability and work performed differ

Native Progress exposes reported load/amount and activity totals, while web also offers estimated 1RM and a personal strength index. Native does not claim those missing charts are present. Full cross-client Progress equivalence remains open; adding an estimate must preserve eligibility and explanatory limits rather than convert reported activity into assessed strength or sport skill.

Separately, native's default 28-day view calculated `exerciseSeries` for the full history and filtered the result afterwards. On a 5,000-record fixture, executing the real NativeProgress render function after module/harness initialization took 355–438 ms across three local samples. It produced 65 presentation nodes, so most work was discarded off-period series calculation rather than a large visible list.

That separate presentation issue is now repaired: NativeProgress passes its existing selected records to the per-record series function before formatting dates. `scripts/check-progress-presentation.cjs` executes the actual component and checks 11 series results against the previous full-history-then-filter result. The callbacks exercise 28/84/all periods, machine setups, unknown/zero/partial records, future/unfinished records, measurement choice, search, units and Show more without changing saved state. A parser-valid 5,000-record fixture now passes 28 records to the default series; All records still passes all 5,000. Three initialized local samples of this slightly richer four-exercise fixture took 7.21/6.65/3.77 ms with explicit GC before each sample and outside its timer. A prior run without explicit GC included a 375 ms outlier; there is no latency assertion or device-performance claim. Filtering does not change activity counts, totals, setup matching, ordering or web's all-time baseline. Scoped source/test lint passes with zero errors and warnings.

Web charts/data tables still cover the full selected history. Faster calculation does not qualify rendering thousands of SVG/table items on all phones. Further chart aggregation/paging requires preserving accessible exact data and comparing the rendered behavior.

### PROD18-05 · P2 · Capacity and recovery need an owner-facing completion path

The saved-state validator supports up to 5,000 history records,1,500 custom exercises and 24 MB of serialized state. The encrypted record index uses the same 5,000 history limit. A10,000-record benchmark is therefore outside supported storage acceptance, even if a pure calculation accepts it. Export/recovery and a clear capacity response matter before users reach those limits; this review did not exercise a real device at the storage ceiling or recommend removing existing records. Unknown load stays distinct from zero and a rejected write must retain the active workout.

Personal concern holds deliberately have no automatic medical clearance action; the sample reset does not clear a real personal hold. A future reviewed return/owner decision path remains product design work. Keep logs and partial save available and do not remove the guard to make a route appear complete.

## Measured payload and interaction scope

All new measurements use synthetic data and local retained artifacts. No credentials, private workout records, paid service, model or external account were used.

| Measurement | Observed result | What it does and does not establish |
| --- | --- | --- |
| Web entry script/style bytes | Movefield 2,075,897 raw bytes / 438,994 local gzip estimate; Grizzly 2,126,291 / 448,662. | Actual retained static entry assets; gzip is a local calculation, not measured CDN compression. |
| Clean local web welcome | Three new Chromium contexts per brand, service workers blocked: Movefield 527–660 ms; Grizzly 468–548 ms to the visible sample action and loaded fonts. | 390×844, unthrottled Linux host, no-store uncompressed loopback HTTP; not field/CoreWebVitals, mobile-network or phone cold-start acceptance. Automation scheduling is included. |
| Welcome resource payload | Movefield 3,062,361 decoded bytes across six resources; Grizzly 4,073,202across nine. | Includes requested fonts/art. Exercise guide JSON and all exercise photos were not demanded for welcome. No page errors in the six runs. |
| Opening sample Progress | Cumulative decoded resource bytes 3,433,881 Movefield / 4,831,238 Grizzly in the measured first runs. | Confirms additional demand-loaded resources; sample-history route, not a 5,000-record browser-render benchmark. |
| Native retained Hermes exports | About 4.91–4.92 MB per platform/brand bundle. Both flavors package 35 font assets totaling 11,990,744 bytes, plus 419,536 bytes of bundled art. | Installed size, decoded RAM and startup cannot be inferred from compressed APK or bytecode size. Movefield packaging the whole heading-font gallery is a concrete future packaging opportunity, not a current removal. |
| Library search | 995 canonical plus 1,500 synthetic custom entries; four representative queries, five runs each,3.9–15.9 ms locally. | Canonical search only; no rendering/keyboard ranking or physical-device claim. Search still finds the last custom item and returns an empty result for the absent phrase. |
| Saved-state parsing | 5,000 records /3,093,601 serialized bytes parsed in 891 ms in the initial local run; observed heap delta about 51 MB. | One Node run, synthetic minimal records, after GC. Allocation deltas are not peak retained RAM, native encryption or a device memory budget. |

The initial `native-progress` rows in `benchmarks.json` include callback-harness compilation/loading and must not be presented as pure render latency. The later `interaction-bench.json` explicitly excludes that setup and supplies the 355–438 ms observation above. Browser `performance.memory` is also approximate; the receipt retains raw observations without claiming a reliable native RAM figure.

## All 72 master requirements remain visible

The canonical register contains 61 `in_progress` and 11 `not_started` requirements; none is marked complete by this review. `requirements-coverage.json` maps every requirement ID/title/status and a hash of its full text to the relevant product flows. It preserves the register unchanged.

| Prompt area | Coverage contributed here | Still outside this product receipt |
| --- | --- | --- |
| P1 · Training/science | Setup-to-plan-to-logging route/authority review, custom tracking gap, progress calculation equivalence. | Full discipline/program/form/media-rights and evidence-to-rule acceptance; separate science review. |
| P2 · Coaching | Local/offline versus provider/model distinction, mandatory authority and unknown-data boundaries. | Live provider eligibility, runtime/model evaluation, real consent/service traffic and cost acceptance. |
| P3 · UX | End-to-end capability map and concrete extra/missing routes; existing targeted callback behavior. | Final broad rendered accessibility, platform screen readers, keyboard and device acceptance; parallel UI audits. |
| P4 · Performance/debugging | Supported-history baseline, repaired index algorithm, search/assets/local startup measurements. | Real-device memory/thermal/power, encrypted cold start, complete large-history chart rendering and all interruption states. |
| P5 · Security/recovery | Private/sample and manual-backup boundaries; no new side effects or schema changes in this repair. | Encryption/authorization/provider/installed recovery/security acceptance; separate security audit. |
| P6 · Delivery | Source-scoped evidence and clear distinction from the previously delivered APKs. | Root-owned final integration, signed builds, publication/live-byte verification, physical installation and unavailable signed iPhone release. |

The earlier product-requirements table contains historical implementation counts; this report does not overwrite those statements or infer completion from newer screens. Shared account/history synchronization, body/photos, annual seasons, detailed sport/event paths, team/parent sharing, vendor integrations, lawful media review and signed iPhone distribution remain explicit wider requirements.

## Receipts and boundaries

Ignored evidence: `.sites-runtime/comprehensive-audit-2026-10-18/product/`.

- `capability-probes.json`: actual manual/coach/customizer/progress callback observations and source hashes.
- `benchmarks.json` and `benchmarks.log`: supported-history baseline, memory observations and the preserved 50-second timeout.
- `progress-runtime-baseline.js`, `equivalence.json`, `progress-fix-validation.json`: prior reference, ignored prototype check and final canonical 144-case/work-count result.
- `progress-fix-los-angeles.json`: the same 144 reference/work-count checks in a second timezone.
- `progress-presentation.json`: actual native period/controls equivalence, web memo invalidation and bounded formatting work; final source hashes and local timing scope.
- `interaction-bench.json`: initialized NativeProgress render and expanded-library search samples.
- `asset-inventory.json` and `cold-start.json`: retained artifact sizes and six clean local browser contexts.
- `requirements-coverage.json` and `source-hashes.json`: all 72 unchanged statuses/text hashes and inspected source snapshot.

Tracked changes owned by this workstream are this report, `lib/progress-runtime.js` and `scripts/check-progress-performance.cjs`. No requirement status, handoff, version/package identity, native snapshot, plan prescription, encrypted data, owner configuration or publication was changed here. Physical Android/iPhone/hinge/OS lifecycle and screen-reader behavior remain untested by these local probes.
