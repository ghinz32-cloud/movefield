# Current dependency release blockers — read-only review, 9 October 2026

Reviewed source: `e2cbabd8b521a09946ebbc5830e3bb831120599f` in `movefield-recovery`. No source, manifest, lock, policy, install or build changes were made. The current strict release log fails web braces, mobile braces and mobile node-forge. Saved fresh audit JSON reports one high web entry and 15 overlapping propagated high mobile entries from two roots, with zero moderate/critical entries.

| Root | Locked version / registry latest | Published supported patched version | Current paths |
| --- | --- | --- | --- |
| GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 | braces3.0.3 /3.0.3 | None; advisory affects<=3.0.3 | Web eslint-config-next16.3.8 -> @next/eslint-plugin-next16.3.8 -> fast-glob3.3.1 -> micromatch4.0.8 -> braces3.0.3; web vinext1.0.0-beta.5 -> vite-plugin-commonjs0.10.4 -> vite-plugin-dynamic-import1.6.0 -> fast-glob3.3.3 -> micromatch4.0.8 -> braces3.0.3; mobile expo57.0.27 -> @expo/metro56.0.2 -> metro-file-map0.84.5 -> micromatch4.0.8 -> braces3.0.3 |
| GHSA-86w9-cpqp-85rv / CVE-2026-85393 | node-forge1.4.0 /1.4.0 | None; advisory affects<=1.4.0 | Mobile expo57.0.27 -> @expo/cli57.0.28 -> node-forge1.4.0; also @expo/cli -> @expo/code-signing-certificates0.0.6 -> node-forge1.4.0 |

Registry read-only queries confirm braces3.0.3 published2024-05-21 and node-forge1.4.0 published2026-03-24. Their upstream requirements are compatible with a future same-major patched release: micromatch declares braces^3.0.3; both Expo CLI and certificate package declare node-forge^1.3.3. There is currently no such published candidate. Existing brace-expansion overrides target a different package and cannot fix braces.

Observed exposure: web chains are lint/build tools; mobile chains are Metro and Expo CLI/certificate tooling. No application source directly imports braces, micromatch or node-forge. The observed Metro watcher calls micromatch.some(), which delegates to picomatch, rather than the braces compile/expand sinks. This narrows the observed caller path but does not certify every tooling caller. Expo certificate tooling really invokes certificate.verify(certificate) and certificate.publicKey.verify(...), and the CLI reaches those helpers for development/project manifest signing. Therefore replacing forge with a dummy implementation is not compatible.

No package/signature names were found by a string scan of the current built web JavaScript or the two local Hermes exports. That is supporting evidence only: minification/bytecode can remove names; no complete shipped-module inventory or native binary SCA was performed. Production dependency classification alone is misleading because Expo includes its CLI/Metro chain as ordinary dependencies. These are confirmed tooling dependency findings, not demonstrated phone UI exploits or a proven vulnerability-free APK. The app currently has no expo-updates package or codeSigning configuration; expo-updates-interface is transitive.

The existing allowance is a CI exception, not a production release waiver. scripts/lib/dependency-policy.cjs accepts only these exact package/advisory URL pairs at high severity, and only before2026-11-08T00:00:00Z. Critical escalation, new advisories, broken reports/commands and expiry fail. --release ignores that allowance and fails both roots. The documented reason is no supported published patch plus incompatible audit suggestions (Expo44.0.6 and React Native0.72.17 versus current Expo57/RN0.86). pnpm retains its10080-minute minimum release age, missing-time rejection and strict build permissions.

Feasible remedy: wait for/recheck a published same-major fix, then pin/regenerate locks under the existing seven-day policy and validate clean locked installs, toolchain functions, web build/regressions, both mobile exports and fresh exact-source native builds. A supported upstream toolchain release removing the root is another route, but the currently confirmed parent ranges still require it. No safe supported version bump exists today.

If urgent, a separately reviewed reproducible local backport is technically possible: braces needs a parser-level nesting-depth guard or bounded iterative walkers, retaining ordinary/escaped/class/range glob semantics; node-forge needs nested DigestAlgorithm structure validation with positive valid-signature and malformed/forged-signature rejection tests, plus supplemental malformed NULL review. Pin vendor source/patch hashes and exercise every installed copy and Expo certificate/signing call. This would be maintained local security code, not an official upstream release; the unchanged vulnerable version still fails this repository's strict release audit. Any policy recognition requires a concrete independently verified remedy rather than renaming its version to evade the scanner.

Current forge proposals #1152, #1157 and #1158 remain open. #1152's stale branch has a describe.only test issue; #1158 currently reports later full-suite/browser checks from a contributor but still has no reported GitHub status checks or published1.4.1 release. #1157 adds nonempty ASN.1 NULL rejection and compatibility cases. Those are useful review inputs, not a supported package to install directly. Braces issue70 remains open, with disputed maintainer assessment and no linked development branch; GitHub's reviewed high advisory remains active.

Preserve the ongoing native run for the existing final source. A dependency/patch change would create new source/toolchain inputs and require a new native qualification run; no change was justified or applied during this read-only review. Existing testing binaries can be evaluated with these recorded blockers; do not call the strict release gate clean.

Primary sources re-opened today:
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-86w9-cpqp-85rv
- https://github.com/micromatch/braces/issues/70
- https://github.com/digitalbazaar/forge/pull/1152
- https://github.com/digitalbazaar/forge/pull/1157
- https://github.com/digitalbazaar/forge/pull/1158
- npm registry read-only `npm view braces version time --json` and `npm view node-forge version time --json`
