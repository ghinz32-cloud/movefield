# Intentional SDK removal lint repair — 9 October 2026

Actual Android run37975669983 at source d740c61084f44505273e900f7672ac92bae1a218 completed APK assembly but failed release lint with eight MissingClass errors. Each error identified a source-manifest tools:node="remove" instruction for a remote SDK class absent from the project. The final APK inspector did not run after lint failed; that build is not an Android acceptance result.

NATIVE6 retains all nine unused Firebase/Google API/data-transport component removals. Only the eight demonstrated missing-class markers carry tools:ignore="MissingClass". The ExpoFirebaseMessagingService removal had no such diagnostic and remains unannotated. No granted component, application, manifest or unrelated diagnostic receives suppression. The strict final-artifact inspector still rejects these SDK components if present in the assembled APK.

| Manifest tag | Exact diagnosed class | Retained lint source line |
| --- | --- | --- |
| service | com.google.firebase.messaging.FirebaseMessagingService | 46 |
| service | com.google.firebase.components.ComponentDiscoveryService | 47 |
| service | com.google.android.datatransport.runtime.backends.TransportBackendDiscovery | 48 |
| service | com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService | 49 |
| activity | com.google.android.gms.common.api.GoogleApiActivity | 62 |
| receiver | com.google.firebase.iid.FirebaseInstanceIdReceiver | 63 |
| receiver | com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver | 64 |
| provider | com.google.firebase.provider.FirebaseInitProvider | 65 |

## Validation and limits

The real Expo Android/iOS project generation test passes270 assertions over two generations with stable manifest, backup, extraction and privacy hashes. Its recursive tag-and-full-attribute comparison allows only the existing scoped camera-removal diagnostic plus these eight exact class-removal diagnostics. Eleven negative mutations per generation reject global/unrelated/extra diagnostic suppression, active registrations, a ninth annotation, duplicate markers, incorrect tags and nested metadata. Both edited JavaScript files pass syntax checks and diff whitespace checks. Independent code review passes; root independently reran all90 artifact-inspector fixtures, including remote-SDK component rejection.

Evidence: `docs/qa/native-compilation-2026-10-09/native6/`. The generation test did not execute Android SDK compilation or release lint. Fresh exact-source hosted Android/iOS compilation and assembled metadata inspection remain required. Physical phones, notification delivery, storage/OS interruption, signed store binaries and store disclosures remain separate gates. Because the plugin is included in the public mobile source ZIP, regenerate and publish the ZIP and matching Pages manifest/worker after checkpointing this source.
