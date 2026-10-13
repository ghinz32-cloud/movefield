# M06 — native dependency blocker recheck

Parent documentation checkpoint `4105086958c9df67de919ef758259bf02be0a2a7`; application remains `4b92b0a4db915b8ea5b75ca5702b063e7c6f8677`. Checked 8 October 2026. Local-only until explicit push approval. No dependency/lock/application code changes in this milestone.

Fresh native audit reports **15 high affected package entries from two advisory roots**, zero moderate/critical findings. The entries include propagated framework/tooling dependencies, not 15 independent vulnerabilities or demonstrated phone exploits.

| Root | Installed / registry latest | Official patched version | Confirmed path |
| --- | --- | --- | --- |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 / 3.0.3 | None | Expo 57.0.27 → @expo/metro 56.0.2 → metro-file-map 0.84.5 → micromatch 4.0.8 → braces 3.0.3 |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 / 1.4.0 | None | Expo 57.0.27 → @expo/cli 57.0.28 → node-forge 1.4.0; also via @expo/code-signing-certificates 0.0.6 |

The observed chains concern Metro pattern processing and Expo CLI/certificate tooling. Application source has no direct imports of either root; this is not proof that a future signed binary or signing/update path is unaffected. Actual binary/trust-path acceptance remains pending. Do not label the app vulnerability-free.

`npm audit` suggests incompatible Expo 44.0.6/React Native 0.72.17 substitutions in some propagated entries. Those are not a compatible repair for the current Expo 57/RN 0.86 cohort and were not applied. Registry and official advisory rechecks provide no published patched candidate. Preserve the current locked compatible cohort and the seven-day release-age rule; do not add an unreviewed crypto/glob shim or widen exceptions.

`node scripts/check-dependencies.mjs` accepts these known roots only under its existing temporary CI exception until **2026-11-08T00:00:00Z**. Its zero status does not close a release blocker. No signing credentials, build service or paid account were configured.

Next review: verify upstream advisory ranges and eligible release timestamps; assess a compatible Expo/Metro/certificate dependency update or replacement when available. Require locked install, native TypeScript/engine/Android+iOS exports, then a real Android build/install and signing/update trust-path review. The current environment lacks Android SDK/adb/Gradle/emulator/physical phone; Metro export alone cannot satisfy this.

Saved evidence: `docs/native-dependency-review-2026-10-08.json` includes fresh metadata/root details, three confirmed installed paths, incompatible audit remedies and raw audit SHA-256. Checked actual `npm ls`/`npm explain` paths, source imports, registry versions, official advisories, evidence JSON and whitespace. Application tests were not rerun merely for this documentation change. M06 review/documentation is complete; both upstream release blockers remain unresolved.

Exact local checkpoint: `git log -1 --format=%H -- docs/native-dependency-review-2026-10-08.md`. Last verified remote: `8cd39e42f2178b807d63af2042b70481041b028b`. No push retry, merge or deployment.
