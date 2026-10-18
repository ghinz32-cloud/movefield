# Comprehensive Movefield and Grizzly application audit — 18 October 2026

The audit found and repaired important recovery, consent, performance and loading failures in the shared application. Both products remain development previews. A passing local suite does not establish physical Android/iPhone behavior, production signing, live cloud operations, clinical validation or completion of all six master prompts.

Baseline: `ca96011ac53b7d544856281a175cfee0859ca844`. Work branch: `codex/comprehensive-audit-2026-10-18`. The compiled source, delivery commits and final qualification results are recorded below; the preceding release is identified separately in the distribution report.

## Coverage

The same training and local coaching rules support both brands. This review covers the shared web application, separate Movefield/Grizzly static sites, the actual native App entry and components, canonical/native data snapshots, optional server endpoints, installable Android packaging, and prepared iOS configuration. It includes failure states and supported input limits as well as ordinary sample flows.

| Area | Reviewed and exercised | Boundary |
| --- | --- | --- |
| Setup and recommendations | New profiles, goal/authority, exact equipment, frequency/time, commitments, options, preview and acceptance. | Impossible combinations correctly remain unsupported; the native commitment-entry shortcut is still missing. |
| Workouts | Actuals versus prescriptions, decimal/unknown loads, effort, substitutions, guides, rest, partial finish, correction and progression authority. | No sensor measurement or clinical outcome certification. |
| Coaching | Local before/after messages and history boundaries; optional cloud job ownership, quotas and consent at dispatch. | No live provider was activated. Local selection is not a deployed AI coach. |
| Recovery and data | Encryption, transactional roots/rows, stale writers, failed saves, migration, current original-file export, transfer, setup conflicts, passphrase rotation and erasure boundaries. | Mocked native bridges and real SQLite/IndexedDB tests are separate from installed-device power-loss/uninstall recovery. |
| UX and accessibility | Both brands, narrow/wide layouts, enlarged text, controls, keyboard/focus, named actions, loading errors, optional disclosures, offline states and bounded screens. | Finite Chromium/axe checks do not replace TalkBack, VoiceOver, UIKit or OS text-scaling acceptance. |
| Performance | Supported 5,000-record histories, index equivalence, selected-period work, library search and retained asset payload. | Host timings are observations, not phone latency or battery promises. |
| Distribution | Versions, identities, update signer, permissions, backup/transport rules, ABI, native-library alignment, source archives, CI evidence and Pages delivery. | Test signing is not production key custody; an iOS JS export is not an IPA. |
| Supply chain | Locked graphs, fresh root/native advisories, advisory reachability, fixed-version availability and publisher provenance checks. | Unresolved upstream toolchain advisories remain explicit. |

Detailed workstream reports:

- [Training and exercise library](comprehensive-2026-10-18-training.md)
- [Product capabilities and performance](comprehensive-2026-10-18-product.md)
- [Web UX, accessibility and failure recovery](comprehensive-2026-10-18-web.md)
- [Native UX, preferences, permissions and render recovery](comprehensive-2026-10-18-native.md)
- [Security, privacy and data integrity](comprehensive-2026-10-18-security.md)
- [Distribution, dependencies and platform compatibility](comprehensive-2026-10-18-release.md)

## Reproduced defects and repairs

Priorities describe impact and context, rather than a universal exploit score. P1 recovery defects affect uncommon but important failure paths; the consent defect matters before the optional provider is enabled. The reports preserve original failing evidence and precise remaining limits.

| Finding | Priority | Trigger and consequence | Correction and meaningful regression |
| --- | --- | --- | --- |
| S-01 | P1 | Repeated failed large replacements retained new ciphertext rows; an original-record recovery bundle could exceed its row limit despite an intact current profile. | Root rollback and deletion of only transaction-introduced rows are atomic. Real SQLite/IndexedDB checks cover 5,000 workouts, repeated failures, preexisting rows, aborts and newer writers. |
| S-02 | P1, optional service | Consent, deletion or revision changed during awaited quota reservations; old work could still be sent to a provider. | Revalidate current authority immediately before dispatch, retain response validation. Five real-SQL cases use a synthetic provider capture; no external request. |
| S-03 | P1 recovery | After migration, the original-file action preferred the retained historical database and omitted new workouts. | Prefer the current encrypted root; retain the legacy fallback when no modern root exists. Tests preserve legacy files and verify post-upgrade and damaged-root exports. |
| PROD18-01 | P1 | Progress repeatedly scanned a supported history during rendering: about five seconds at 1,000 records; a 5,000-record process exceeded its 50-second cap. | Indexed/windowed calculation retains output semantics. 144 reference comparisons, a second timezone, frozen inputs and observed work bounds exercise the actual function. |
| N18-01 | P2 | Failed preference reads made unread defaults authoritative, cancelling existing reminders and allowing later edits to overwrite choices. | Unknown/read-failed preferences cannot reconcile alerts or write defaults. Retry opens existing choices; genuinely absent preferences initialize normally. |
| N18-02 | P2 | Decorative motion could begin before the OS accessibility read finished; rejection was unhandled and a late result could overwrite a newer event. | Motion stays reduced while unknown, rejected reads are handled, and newer OS events take precedence. |
| WEB18-01 | P2 | A failed lazy Progress download emptied the whole React root. Account settings had the same unbounded loading boundary. | Scoped accessible fallbacks preserve the workspace and recovery controls. Explicit reload waits for saves, refuses unresolved failures/conflicts and avoids automatic retry loops. |
| PROD18-04, work performed | P2 | Native's default 28-day view formatted all 5,000 records before discarding older ones; web controls repeated unchanged index work. | Filter before formatting; memoize the web index by current state and day. Actual component callbacks compare exact series and test invalidation. All-time still includes all records. |

Additional resilience improvements close earlier native N-05/N-06 concerns: explicit phone-settings recovery for denied notifications, read-only permission refresh without silently enabling preferences, and a provider-independent render fallback. Reopening waits for started saves/restores and setup/preference queues; stale callbacks cannot write after teardown. The fallback honestly says unsaved edits may need re-entry. It handles React render errors, not a killed native process or every asynchronous exception.

The release workflow now records the exact Gradle app-unit task outcome, original exit status and actual JUnit case counts. The publisher independently checks the log/XML facts and binds the public evidence to the source. A successful build containing `NO-SOURCE` must never be described as executed native unit tests. Existing assembly, lint, identity and publication checks remain required.

Two stale test loaders/mocks were repaired without removing their behavioral assertions. The original baseline passed 57 of 58 groups; its remaining failure was a stale Grizzly UI harness. The standalone focus CLI now executes its original 13 groups through the shared loader.

## Training findings and limits

The fresh qualification matrix exercised 7,776 scenarios, 8,478 generated plans and 1,687,668 assertions. A fitting option was available for 3,351 scenarios; 4,425 correctly returned none under restrictions such as very short sessions, sparse equipment, no floor access or incompatible powerlifting equipment. This is honest coverage, not a claim that every goal can be met with any equipment or time budget.

The additional equipment/authority/substitution checks and 995 guide-structure checks pass. Twenty-four broad twice-per-muscle heuristic flags are retained and explained by the actual program limitations rather than silently counted as scientific failures or erased. Six- and seven-day choices remain distinct from prescribing seven hard lifting days. Source routines, app adaptations and withheld variants remain labeled separately.

The media inventory is 995 guides, 885 canonical media records, 863 with local photos, six video links, and 110 written/source-only entries. These are structural counts, not independent form, video availability, licensing or clinical reviews for every exercise. Full-text research depth and rights review remain wider requirements.

## Remaining product and UX work

| Open item | Impact and current path | Next useful acceptance |
| --- | --- | --- |
| Native coach/manual custom movement | An absent exercise ends in empty search; creation is available on the app-owned customizer and web, but not this tracking route. | Make explicit movement configuration/review reachable while preserving coach/manual authority and load conventions. |
| Native setup commitments | Existing commitments are honored, but creating a new one requires saving/leaving setup for Calendar and reopening. | A direct guarded Calendar action or reviewed draft step with preserved setup baseline. |
| Native Progress parity | Native has recorded load/activity totals; web additionally has eligible estimated 1RM and a personal strength index. | Add only with the same eligibility, limits and accessible exact-data explanations. |
| Large-history chart rendering | Calculation is faster, but thousands of SVG/table items are not qualified on all phones. | Profile real devices; use reviewed aggregation/paging while retaining exact accessible data. |
| Review-banner density | At 320px with 200% text, the banner/toolbar consume much of the first viewport. Scrolling and navigation work. | Compact the explanation into an accessible disclosure without losing record-separation guidance. |
| Payload | Both native flavors package the full roughly 12 MB uncompressed heading-font gallery. | Separate optional flavor/gallery assets without breaking offline fonts or saved appearance choices. |
| Capacity/recovery | Supported limits remain 5,000 history records, 1,500 custom exercises and bounded archives. | Clear owner-facing capacity guidance and real-device recovery at the ceiling; never silently delete workouts. |
| Old oversized original bundles | Prospective rollback cleanup does not rewrite already downloaded >10,000-row files. | Preserve originals; separately review recovery conversion if such a file actually exists. |
| Malformed modern root | Injected invalid JSON prevents original-file export; rows, cache, keys and legacy files remain intact. No ordinary supported writer was found producing this condition. | Explicit raw-store/legacy recovery needs separate review; current correction covers parseable envelopes, not arbitrary corruption. |
| Legacy root accessibility | The preserved original Pages root retains two known Plans contrast violations. | Separately remediate that legacy UI if authorized; its 63 original files are protected during shared-site delivery. |

The master register still has 72 requirements: 61 in progress and 11 not started. This audit does not mark them complete. Shared account merging, broader sports/seasons, body/photo features, team/parent sharing, integrations, complete evidence/rights review and real distribution remain visible wider work.

## Compatibility and operational gates

Android previews target ARM64, minimum API24 and target SDK36, with stable package/signer lineage. That is an installation/configuration floor, not acceptance on every Android7+ phone. Rotation, multiwindow and width-adaptive layouts are enabled; wide screens can show the workout exercise pane. The adaptive tests resize the same inputs and verify drafts, history, rest deadlines and primary-action visibility. They do not detect a real hinge/posture, validate every folding device, exercise activity recreation or prove OS keyboard/cutout behavior.

iOS configuration has distinct brand identifiers/build numbers and a consistent 16.4 deployment floor. The owner has no Apple signing setup. A Mac/Xcode build, Apple membership/signing, real device/TestFlight and aggregated privacy checks are prerequisites for a downloadable signed iPhone app.

Before public production use, test both brands on real existing-install Android upgrades, the S24 Ultra, an older supported device, at least one real foldable/tablet and iPhones when signing is available. Cover lock/background/process termination while saving/resting, reminders/timezone/DST/channel changes, denied/regranted permissions, file pickers/share sheets, recovery keys, offline restart/update, screen readers, enlarged OS text, reduced motion and modal focus. The earlier owner report that Movefield 0.1.6 installed with saved workouts is historical acceptance for that build only.

Optional cloud/accounts/provider features remain disabled until the actual domain, bindings, OAuth callbacks, session expiry, owner isolation, backup restore, deletion, quotas, cost controls and retention/consent terms are qualified. An account ID or prepared configuration alone does not activate or verify a service. No paid operation, store enrollment or live provider was performed for this audit.

The fresh root production-only registry audit reports zero vulnerabilities. The full tooling graphs still report two underlying high advisories, braces and node-forge, with propagated native entries. Registry latest was still affected at the audit date. Application encryption does not directly import these tools; no application-user exploit path was demonstrated. That does not clear the advisories. Forced Expo/RN downgrades were rejected as an incompatible remediation; compatible upstream patches need normal qualification.

Preview APKs retain development/test signing to preserve ordinary updates. Production key custody and any migration require a deliberate, recoverable plan. Do not uninstall the existing app or change its signer to bypass an upgrade problem. Keep a verified encrypted backup and the appropriate recovery material before testing updates.

## Final qualification and delivery

The integrated local gate passed **65/65 groups**, including web/native types and the new recovery, consent, performance, preference and CI-evidence regressions. All application/runtime inputs stayed unchanged during the run. Seven non-application regression/CI-evidence helpers were finalized concurrently; their exact deltas and focused final receipts are retained, so this is not an entire-checkout-unchanged claim. Three historical generated science reports were restored after their fresh output was preserved in ignored evidence.

| Completed final gate | Result and scope |
| --- | --- |
| Production builds | Both static brands and local Worker build passed. |
| Actual local Worker | 19 browser journeys passed with encrypted records, coaching, offline, restore/rotation and hold/erase behavior; live services disabled. All 1,925 built files remained exact. |
| Rebuilt web failure/data paths | Four lazy-failure/recovery groups, six axe states, two setup-conflict, two rotation and eight save-safety groups passed. |
| Native adaptive layout | 180 states and 240 ancestor-clipping checks passed; source and actual fixture artifacts bound. |
| Native phone/web parity | Ten contextual groups, 64 captures and 32 axe states passed with no violations/page errors. |
| Native render recovery | Eight actual React/App scenarios cover pending successful/failed saves and full restores; callback tests also cover preference/setup queues and stale writers. Two additional 320px fallback axe scans pass with visible usable actions and no root overflow. |
| Shared storage | Full 16 real SQLite/IndexedDB rollback groups and five no-network consent-dispatch cases pass; canonical/native byte parity passes. |
| Native exports/source archives | Four distinct clean Hermes exports include all 32 reviewed markers. Both 270-file source archives include LICENSE and exactly match the frozen source; no post-compile documentation difference. |
| Lint | Scoped root/native checks have zero errors; preexisting warnings remain. Root integrated scope reports 20 warnings, native scope 13. |

The broad web baseline separately covered 108 finite shared accessibility states and 12 legacy-root states. The latter retains two known contrast violations. Those baseline bytes and the newly rebuilt targeted runs are recorded separately; the whole baseline matrix was not silently relabeled as a final rebuild run.

The native source is frozen at 270 files, snapshot `10333df266f6ea55fc4c025ee170d95e7384f9fa25b484c29599ebf8840996f1`. Android build `39139277751` and publisher `39140160944` passed on their first attempts. Both published APKs independently pass signature, identity, security, all 32 compiled markers, default window policy and 16 KiB ZIP/ELF checks. Each has 17 aligned native libraries. Both exact Gradle unit tasks report `NO-SOURCE`: zero XML files and zero JUnit cases; no native unit suite executed. Live Pages publication and postdeployment verification passed; the final results follow. No new installation or signed iPhone acceptance is claimed. Chromium is the exercised browser engine; physical Chrome/Samsung Internet, Firefox and Safari/WebKit acceptance remains separate.

Ignored evidence lives under `.sites-runtime/comprehensive-audit-2026-10-18/`. Tracked reports and regression programs preserve the scope for future work. Owner `.openai/` content was not read, staged or exported, and no real workout/profile or credentials were used as fixtures.

### Compiled Android preview identity

Both APKs compile source `9a5c2d87a66af62d3bfca2886e6800b8edf02263`, tree `6f5b0cc91412227ee661425fbffdfe7ad31974d1`. [Immutable release](https://github.com/ghinz32-cloud/movefield/releases/tag/android-ux-preview-9a5c2d87a66a). Source archives match all 270 frozen files without a documentation delta.

| App | Version/code | Bytes | SHA256 |
| --- | --- | ---: | --- |
| movefield | 0.1.10 / 11 | 39,394,664 | `e491255bbca357ea91fbdb1d299477e471a01e52242a75db9d83d5316771f77f` |
| grizzly | 0.1.9 / 10 | 39,545,922 | `aedcd80afd98f252858ff5dcf875b91b9e6956b91bceaf202a76b8fc8c420917` |

The final delivery Worker was rebuilt after download assets changed and freshly passed the same 19 browser journeys. All 1,925 built files and 381 selected source files stayed exact. The static application's 20 compiled/index files remained identical to the final web-validation artifacts; only verified download assets were applied. The final finite credential-pattern scan found zero matches across 8,104 selected files and 3,136 ZIP members; this is not an absence-of-secrets guarantee. Application fingerprint: `5b6d3279ec1bfe9c0cd94d748f455eb120de49c3adea872089b50c771d8c0660`.

### Final publication and live verification — complete

Delivery source `db23b0731a327a1fd0bb550a470c1e413790bfe7` produced Pages commit `30b49ea63460ec9526e3db339edbe1d38d7fac73`. [Deployment 39141028496](https://github.com/ghinz32-cloud/movefield/actions/runs/39141028496) and all three expected jobs passed on their first attempts. The candidate contains 3,891 files / 619,358,173 bytes. All 63 original root files and 142 prior compiled paths are preserved; each brand has one current full APK in its final Pages directory.

- [Movefield web](https://ghinz32-cloud.github.io/movefield/review/) · [Movefield 0.1.10 Android APK](https://ghinz32-cloud.github.io/movefield/review/downloads/movefield-0.1.10-arm64.apk)
- [Grizzly web](https://ghinz32-cloud.github.io/movefield/grizzly/) · [Grizzly 0.1.9 Android APK](https://ghinz32-cloud.github.io/movefield/grizzly/downloads/grizzly-fitness-0.1.9-arm64.apk)

All 375 selected served files match the candidate, including every original-root file. All 24 download support/source files across both directories match, and all four assembled APKs have the expected size/hash. Both complete same-origin Chromium Saves match the independently inspected APKs and exact filenames. Both HEAD responses have the correct APK MIME/full length; all four first/last 4096-byte ranges return exact HTTP206 bytes. The first browser process was blocked before navigation by the outer executor sandbox; the authorized outer retry retained Chromium's own sandbox and normal proxy/TLS. That preserved launch failure is not a site or Android installation failure.

The actual live apps passed four groups on the first attempt: new encrypted profiles with blank obligations/history; cancel/start coaching; actual unknown-load logging; one harder partial save; after-workout review; exact encrypted reload without automatic replay; and manual review with stable facts/policies/authority. Fetched and actually loaded application bytes match the served manifests and locally qualified artifacts. All changes used disposable synthetic local browser records, with zero page errors, blocked requests, account/provider activation or remote profile writes.

Both source archives contain exactly 270 frozen mobile files plus their manifest, including LICENSE. Movefield ZIP SHA256: `4c085d7e60ee4f7588d6caa6db433dafb26ef7abf4c736a0af1b4d616f5a7cd0`; Grizzly ZIP: `732d39f03c5edbb6a3badf5e68e345e9e8dc692cd3251d5ee5c10afca4f795a1`. Current default Android/iOS Hermes export directories are refreshed; previous outputs were preserved. Source, executable files, native assets/configuration and mobile documentation still match the compiled source exactly.

The audit and verified preview delivery are complete within the scopes above. The remaining product, physical-device, signed-iPhone, production-signing, upstream-advisory, live-service, arbitrary-corruption and full-master gates remain open. Use Chrome or Samsung Internet for the Android downloads; the earlier owner-confirmed installation applies only to Movefield0.1.6, not these versions. No real-device acceptance is inferred from the new browser Saves.
