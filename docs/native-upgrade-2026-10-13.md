# Current Android upgrade source — 13 October 2026

The previous Android installer uses `com.ghinz32.movefield` and historical
XChaCha20-Poly1305 storage. Current native source originally used a separate
prototype package and AES-GCM records. Changing its package alone would leave
earlier workouts unreadable. This update adds an explicit historical lineage,
reads the earlier database and keys without rewriting them, stages a validated
encrypted copy, and verifies installed state/setup before completing a receipt.

The upgrade preserves recorded times, exercise notes, superset groupings,
unknown loads, individual-set RIR, active workouts/rest deadlines and setup.
It stops on missing keys, corruption, conflicting profiles or fields it cannot
preserve. Five injected write interruptions resume from the retained stage.
Original records remain available until an explicit private-profile erasure.
The recovery view displays the failure, supports retry and can share the
original encrypted record snapshot separately from platform keys. Its controls
share a scroll surface so recovery actions remain reachable on a small phone.

Movefield's upgrade uses package `com.ghinz32.movefield`, versionCode 2 and the
historical Expo test certificate. Default Movefield `.prototype` and Grizzly
`.prototype` installations remain distinct; Grizzly never imports Movefield's
records. `mobile/ANDROID-UPGRADE.md` describes the build and compatibility path.
Compact layouts, per-set effort, the exercise overview/auto-advance, editable
history, the clickable web calendar, the complete catalog and the removal of
OG Grizzly are retained.

## Verification

All 35 core groups pass, including all-plan lifecycle checks and native UI,
storage and engine checks. The historical upgrade suite passes 26 scenario
groups using real SQLite transactions, XChaCha20-Poly1305 and AES-GCM with
mocked OS stores/files. Both generated Android projects have the intended
package/version, explicit cleartext denial and complete cloud/device-transfer
exclusions. The generated template certificate matches the historical APK.
Both brands' distinct Android/iOS Hermes exports and a separate historical
Android export are recorded in `native-upgrade-validation-2026-10-13.json`.

The new `native-preview.yml` builds both flavors on reviewed native-source
pushes to this branch, checks the exact compiled APK manifest, permission and
component boundaries, resource-linked backup rules and signing certificate,
and retains APKs with source, hashes, lint and compilation evidence. It uses
the public repository's standard Linux runners. An APK build is still pending
at the source checkpoint; a passing export or generated project is not proof
of an installed upgrade.

Android backup rules follow the official
[Auto Backup documentation](https://developer.android.com/identity/data/autobackup),
including the separate Android 12+ device-transfer rules. Workflow event/ref
handling follows [GitHub's workflow trigger documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Remaining acceptance

Install the exact new APK over the exact historical APK with synthetic history
and verify history, setup, active workout/rest deadline, offline restart,
notifications and erasure. The user's installed version remains unconfirmed.
Do not uninstall or reset the earlier app to try this candidate. These are
development-signed test builds, not store-qualified releases. Older Argon2id
`movefield-transfer` imports and the canonical task register remain open.
