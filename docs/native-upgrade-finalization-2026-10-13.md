# Android upgrade build finalization

The initial current Android run `38442674070`, source
`b031de1f73709f6258521a3d3e931aba748a3a93`, compiled, linted and unit-checked
both apps. Final inspection stopped because its historical allowlist omitted
Expo WebBrowser's internal proxy activity and Expo Network's Wi-Fi state
permission. The exact compiled Movefield manifest, resource table, linked backup
rules and certificate were downloaded and inspected independently.

The reviewed proxy is `exported=false` and has no intent filters. Inspection now
accepts that exact activity and continues to reject external exposure or filters.
Expo Network is used by Better Auth's network-state listener. Its normal
`ACCESS_WIFI_STATE` permission joins the previously reviewed network-state
permission; location, camera, microphone, external storage and unused remote
startup components remain excluded. The actual compiled manifest passes the
updated inspection, and its package, versionCode 2 and historical signing
certificate match. Two modified-manifest negative cases still fail correctly.

Two further storage cases are covered. An old device key with an unavailable
old database stops opening instead of showing a new profile. An explicit
verified backup replacement retains encrypted fallback copies, verifies the
replacement after saving and records that the owner superseded the unreadable
legacy profile. That profile cannot block subsequent saves. The old SQLite
database and keys remain until explicit erasure.

The final source passes all 35 core groups, including 28 migration groups,
native types and encrypted-adapter checks. Default Movefield, Grizzly and the
Android upgrade receive fresh Hermes exports; the refreshed source archives
contain 244 files each. Source-only exports remain distinct from actual APKs.
The following current compilation run and publication receipt identify the
final installers. Physical old/new APK installation, OS-backed storage,
notifications, accessibility and store signing remain open. Older Argon2id
transfer files remain a separate compatibility task.
