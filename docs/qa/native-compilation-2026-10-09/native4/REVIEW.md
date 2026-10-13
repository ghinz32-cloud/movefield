# Read-only NATIVE3 source review and NATIVE4 inputs

Reviewed application source dab3685eb057765f486ee4aa2fcedb491e6f6d8a. No application repository files, refs, or remote state were changed. Focused probes used copied inspector/fixture files and synthetic decoded metadata outside the repository. Probe inputs and outputs are retained beneath inputs/ and hashes/provenance in probe-results.json. Run reproduction with PYTHONDONTWRITEBYTECODE=1 python probe.py from this directory.

No concrete NATIVE3 runtime regression was identified. The installed Expo scheduling path uses AlarmManager.RTC_WAKEUP and goAsync(), not an app-acquired wake lock. PushTokenModule OnCreate only registers a token listener; Firebase access is limited to explicit token APIs, which the application does not call. The application passes shouldSetBadge:false and iOS allowBadge:false. Removed Firebase/push/biometric/badge/attribution permissions should not be re-added based on these probes. Native device and traffic observation remains unperformed.

## Reproduced qualification gaps

1. Existing minimal valid fixture passes with only MainActivity, no NotificationsService, no NotificationForwarderActivity and no RECEIVE_BOOT_COMPLETED. Those component names appear in the allowlist but only MainActivity presence is required (inspect-native-artifacts.py lines 155-180); RECEIVE_BOOT_COMPLETED is allowed but absent from required permissions (lines 197-206).
2. An added androidx.startup.InitializationProvider with child metadata android:name="example.NewUnreviewedSdkInitializer" android:value="androidx.startup" passes. Existing component name/type/export checks do not inspect initializer children. This can miss automatic startup introduced beneath an allowed provider, even though top-level Firebase providers/services are denied.
3. iOS Info.plist additions NSCameraUsageDescription and NSMicrophoneUsageDescription pass the current metadata inspector.
4. iOS Info.plist additions NSFaceIDUsageDescription, UIFileSharingEnabled=true and LSSupportsOpeningDocumentsInPlace=true pass. These last three contradict already implemented source/prebuild policies; they are the strongest minimal iOS additions.

These demonstrate blind spots, not a claim that the assembled NATIVE3 artifact contains the mutations or that it leaks data.

## Source-justified Android requirements

- Require exactly one enabled/default-enabled receiver named expo.modules.notifications.service.NotificationsService, exported=false. Installed expo-notifications AndroidManifest declares android:enabled=true; its intent filter receives expo.modules.notifications.NOTIFICATION_EVENT plus BOOT_COMPLETED, REBOOT, QUICKBOOT_POWERON, com.htc.intent.action.QUICKBOOT_POWERON and MY_PACKAGE_REPLACED. NotificationsService.createNotificationTrigger / dispatch resolve and address this receiver; SETUP_ACTIONS rebuild scheduled alarms after boot/update.
- Require exactly one enabled/default-enabled activity named expo.modules.notifications.service.NotificationForwarderActivity, exported=false. Installed ExpoHandlingDelegate uses it for background notification-response forwarding; notification response factory uses it for delivery.
- Require RECEIVE_BOOT_COMPLETED alongside existing required INTERNET, VIBRATE and POST_NOTIFICATIONS. Existing docs/native-security explicitly justify it for opted-in reminders. No required permission should be SDK-limited below target 36. Do not add SCHEDULE_EXACT_ALARM/USE_EXACT_ALARM: installed scheduler deliberately falls back to setAndAllowWhileIdle when exact scheduling is unavailable. Exact timing/Doze/reboot/lockscreen must remain device qualifications.
- Require launcher MAIN/LAUNCHER intent pair for MainActivity and reject effective enabled=false if assessing usable launch. Current fixture lacks that filter and should be upgraded to a representative positive manifest before adding negative tests.
- Keep existing name/type/export checks and forbidden SDK list. Native file/sharing providers remain necessary for current explicit backup/share features; do not require optional profile tooling or AndroidX startup capabilities solely because they are allowed.

## Exact startup allowlist from actual NATIVE2 compiled receipt

Prior artifact source 2fda048599d36dae64084833d1f52e0298327766, tree 65dd410c4c0113a05b47b197549edf096bbd1dc3. Verified Android ZIP artifact 11637018804 digest dda9b10cbe0adb139095c694ea724d3169124e39ca7d575d40777962658967eb. Decoded manifest digest 1c824165bc679dcc5ab4c6bd2814c9b0c8c2726fd758b74b2b7cc8591fc81b86. Source receipt is docs/qa/native-compilation-2026-10-09/native2-android/{source.txt,artifact-verification.json,manifest.xml}.

Provider androidx.startup.InitializationProvider attributes: android:exported="false", android:authorities="com.ghinz32.movefield.androidx-startup". Its exact observed child metadata are:

| android:name | android:value |
| --- | --- |
| androidx.emoji2.text.EmojiCompatInitializer | androidx.startup |
| androidx.lifecycle.ProcessLifecycleInitializer | androidx.startup |
| androidx.profileinstaller.ProfileInstallerInitializer | androidx.startup |

For a minimal safe boundary: permit only those names with exact value androidx.startup, no resource declaration, no duplicates and no other child node type. Require expected authority and effective enabled when provider is present. If startup provider/initializers are intentionally removed, absence is not inherently a security regression; do not silently permit a replacement initializer. This bounds declared startup metadata, not the initializer implementations or all binary native API paths.

## iOS policy grounded in current source

mobile/app.json sets FaceID permission false on expo-secure-store, contains no sensor usage declarations, and explicitly allows local networking while denying arbitrary ATS internet loads. Preserve local networking policy; a blanket no-local-networking change would be ungrounded.

Existing check-native-security-config.cjs requires NSFaceIDUsageDescription absent, UIFileSharingEnabled not true, LSSupportsOpeningDocumentsInPlace not true, and ITSAppUsesNonExemptEncryption absent. The assembled inspector currently does not enforce those source policies. Minimal NATIVE4 should mirror the first three (missing or genuine boolean false for both document flags; reject malformed boolean types). Encryption declaration should remain a deliberate source/compliance decision; do not invent true/false to get a store gate to pass. If mirrored, absence is source-conformity, not an export-compliance determination.

Camera/microphone usage descriptions are currently absent from source and prior compiled plist, but there is no existing explicit universal iOS usage-description denial list. Treat probe 3 as a proposed current-capability policy extension, and explain it if adopted. This app uses the OS document picker and an explicit private sharing flow; it has no camera, mic, location, contacts, health-kit or biometric feature. Usage descriptions are declarations, not permission-grant or native-API reachability proof.

## Minimal test additions

1. Upgrade valid Android fixture with current launcher intent, enabled local receiver/filter, forwarder and boot permission. Positive representative fixture passes.
2. Separate missing receiver, missing forwarder, disabled receiver/forwarder, missing boot permission and boot maxSdkVersion < 36 each reject. Missing required notification/boot intent action rejects if action topology is enforced.
3. Positive startup provider with the three observed metadata passes; unknown initializer, duplicate initializer, incorrect value, resource-indirected value, unexpected child and wrong authority each reject. Optional provider absence remains accepted.
4. Positive iOS existing fixture passes; NSFaceIDUsageDescription present rejects; each document-exposure flag true rejects; each malformed nonboolean document-exposure flag rejects. Boolean false and missing flags pass.
5. If explicitly extending sensor-declaration policy, separate camera and microphone declaration negatives reject; never represent those tests as physical permission or store acceptance.

Native workflow paths currently include both inspector/fixture scripts, so those changes trigger actual compilation/metadata checks. Source config harness changes alone are quality-CI scope, while any mobile/plugin/config change also triggers native workflow. Actual new-source compilation and all required device/signing/dependency gates stay separate.
