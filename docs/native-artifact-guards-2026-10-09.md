# NATIVE4 final-artifact capability guards

Independent probes found that the prior assembled-artifact inspector accepted missing reminder receiver/forwarder/boot permission, unreviewed startup metadata below an allowed provider, and iOS biometric/direct-file-exposure declarations that existing source checks deny. The probes establish qualification gaps, not observed runtime leaks.

Android inspection now requires an enabled application and launcher with one MAIN/LAUNCHER pair, enabled internal local reminder receiver/forwarder, the installed Expo notification/boot/update action topology and boot permission through the current target SDK. The optional AndroidX startup provider retains its expected authority and permits only the three initializer names actually observed in the verified NATIVE2 manifest with exact non-indirected values, no duplicate/nested/unknown child declarations. Absence remains allowed. Existing permission/component/backup/transport gates remain.

iOS inspection mirrors existing source policies: FaceID usage description absent and direct Documents exposure flags absent or genuine boolean false. It does not add a new camera/microphone policy or invent encryption export declarations. The source review explains those boundaries.

90 inspector fixture tests pass, including representative positive launcher/reminder manifests and focused failures for each reproduced gap. Root reran independently. Evidence/source hashes are in docs/qa/native-compilation-2026-10-09/native4/. New-source assembled metadata still needs inspection; canceled NATIVE3 archives contain source receipts only. Manifest/plist checks do not prove native delivery, native API reachability, device behavior or store acceptance.

Next NATIVE5 repairs the observed CI cancellation issue before publishing this source: cumulative PR paths retrigger native jobs for website/docs commits, and branch-level workflow concurrency cancels needed runs. Native source changes are required to compile; ambiguous gate inputs must compile conservatively.
