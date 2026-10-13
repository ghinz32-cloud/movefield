# Historical coaching CI evidence before the service-worker repair

This collection records official CI for coaching source **96496ffd4e94b32becccb5db61667fb4fea4ce01**, full tree **20397284f4c07cf0b8b5a1edc554b04d39ea0976**, and native compilation at its parent **c0aab491084f2b1a7d2829925e4bba434d6d6148**, full tree **8821849ac436d6df39aa91c0b7cfce151cbff946**.

It is historical evidence collected **before the later service-worker repair**. It does not verify that repair, any later full source tree, or later CI.

| Qualification | Official run | Result and source |
| --- | --- | --- |
| Coaching quality | [37999781041](https://github.com/ghinz32-cloud/movefield/actions/runs/37999781041) | Success at 96496ffd; tested integration tree exactly matches source |
| Actual native compilation | [37999301260](https://github.com/ghinz32-cloud/movefield/actions/runs/37999301260) | Android and iOS success at c0aab491; both compiled, inspected, packaged and retained binaries |
| Corrected-source native input gate | [37999781136](https://github.com/ghinz32-cloud/movefield/actions/runs/37999781136) | Success at 96496ffd; platform jobs skipped because compiled native inputs were unchanged |

The decoded quality log confirms **75/75 regression suites**, **29/29 coaching UI scenarios with 168 assertions**, **12 encrypted-store scenarios with 95 checks**, and **3/3 production checks**. Initial bundle budget passes at **399870 gzip bytes / 400000**. Static contracts and controlled adapter tests do not establish actual browser GPU inference, paid model execution, backend deployment or physical-device acceptance.

The official source receipts show exactly five changed web component/UI-test/documentation files between c0aab491 and 96496ffd. Their different full trees are preserved separately; native-input equivalence does not mean full-tree equality.

Artifact IDs, ZIP sizes and digests are official GitHub metadata. Both exact-current binary materialization attempts returned HTTP 403. The iOS full decoded log returned Transport closed. No independent binary-byte replay, installation, signature/content replay, simulator archive replay, signed device IPA, TestFlight, EAS or store deployment is claimed. Android's native unit-test task was NO-SOURCE.

Declared release-blocking dependency exceptions remain for web braces and mobile braces/node-forge. CI actions and native toolchain emitted deprecation warnings; a blanket zero-warning CI claim is unsupported.

The original decoded logs and official run/job/artifact receipts are copied unchanged. The public summary removes internal receipt-directory and monitor-write fields and adds the historical qualification boundary. No signed artifact-download URLs or private hosting identifiers are retained.

inventory.json lists byte sizes and SHA-256 hashes for each selected receipt and this README; SHA256SUMS additionally covers the inventory. The checksum file excludes itself.
