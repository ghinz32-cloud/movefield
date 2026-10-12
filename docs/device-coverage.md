# Device coverage target

The owner now has a Cloudflare account and reports connecting a plugin; its account tools are not exposed in this session yet. They want broad Android/iPhone coverage. The recommendation is a Cloudflare Free account and its included `workers.dev` address initially, subject to account-limit/overage/privacy qualification. No domain purchase, paid trial or live resource was created. Account identification, plan/R2 eligibility and securing its sign-in remain owner or connected-tool checks; credentials belong in secure settings, not chat or source.

The current native dependencies declare Android API 24 (Android 7.0) as their minimum and target/compile API 36. Expo/Expo Modules Core require iOS 16.4 even though React Native alone lists iOS 15.1. The generated iOS project uses the Expo minimum. Do not lower a deployment target past dependency requirements to create a compatibility claim. Both native projects generate locally; no installed app has been qualified.

Use the four-ABI Android template declaration when the dependency-download policy is activated. Only advertise ABIs present in the final signed APK and verified on a corresponding runtime. Physical coverage should include:

| Candidate tier | Checks needed |
| --- | --- |
| Older Android at API 24–28, preferably a real 32-bit/low-memory device if final binaries include that ABI | Startup, secure key storage, SQLite durability, 100/1,000 histories, keyboard, process death, storage exhaustion; security-update suitability. |
| Common midrange ARM64 Android | Current supported OS, full workout/backup/calendar workflows, TalkBack, largest text, battery/thermal and OS background limits. |
| Recent flagship Android | Current OS, large histories and transitions, recovery/sharing, interruption and update checks. |
| Compact older iPhone capable of iOS 16.4 or later (for example an SE-class candidate) | VoiceOver, Dynamic Type, keyboard, low-memory pressure, Keychain, file sharing, backup/reinstall/recovery. |
| Common recent iPhone and large-screen model | Current OS, full golden path, background/foreground, process termination, upgrade and recovery. |

Emulators/simulators supplement physical devices; they do not establish thermal, battery, hardware-backed key or accessibility behavior on a phone. The Linux runner has no KVM or attached device, and cannot sign/install an iPhone build. Selection of exact devices remains pending availability.

The tracker must work without an AI download or connection. Optional model tiers remain disabled/uninstalled until exact runtime/device measurements and licensing pass. A phone’s model year or total RAM is insufficient. Keep shared training rules and per-record storage, bounded rendering and ordinary backup usable on every qualified device. Current browser/Node timing observations are not phone performance measurements.

The web version may provide a fallback on browsers with working secure WebCrypto, IndexedDB and Web Locks. Its private saving fails closed when required APIs are unavailable and preserves original files. A browser/PWA is not an installable native-app qualification.
