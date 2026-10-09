# M05 — web dependency blocker recheck

Parent/application checkpoint: `4b92b0a4db915b8ea5b75ca5702b063e7c6f8677`. Checked 8 October 2026. Local-only until explicit push approval. Dependency manifests/locks and application code are unchanged by this milestone.

The fresh web audit has one high finding and zero moderate/critical findings. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) covers `braces <=3.0.3`; the official advisory still lists no patched version. `npm view braces version` returns `3.0.3`. No published patched candidate exists to evaluate under the seven-day release-age rule.

Installed dependency paths from `pnpm why braces`:

- `eslint-config-next@16.3.8 → @next/eslint-plugin-next@16.3.8 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`
- `vinext@1.0.0-beta.5 → vite-plugin-commonjs@0.10.4 → vite-plugin-dynamic-import@1.6.0 → fast-glob@3.3.3 → micromatch@4.0.8 → braces@3.0.3`

The observed paths are development lint/build glob processing. This narrows the current exposure; it does not establish that the dependency is safe or prove a remotely exploitable application route. Keep build patterns/configuration under source control rather than accepting them from application users. Do not force a framework downgrade or use an unreviewed replacement shim to remove the audit finding.

`node scripts/check-dependencies.mjs` returns zero while explicitly printing **KNOWN / temporary release blocker**. That CI exception expires at **2026-11-08T00:00:00Z**; it is not a release waiver. Web release remains blocked until a compatible patch/replacement is independently checked or the owner makes an explicit, documented release decision about the unresolved finding.

Next review: check the official advisory, registry release/publish date and affected range; evaluate a compatible published remedy with locked install, web types/lint, production build/security and relevant regressions. Preserve `minimumReleaseAge: 10080` and reject missing publish-time metadata. No dependency override or exception expansion was applied here.

Evidence: `docs/web-dependency-review-2026-10-08.json` stores fresh audit metadata, exact affected paths and the raw audit SHA-256. Checks: fresh audit/registry and installed paths, official advisory, JSON/path/diff validation. These are dependency-review checks, not a new application-build claim. M05 review/documentation is complete; the upstream release blocker is unresolved.

Exact local checkpoint: `git log -1 --format=%H -- docs/web-dependency-review-2026-10-08.md`. Last verified remote: `8cd39e42f2178b807d63af2042b70481041b028b`. No push retry, merge or deployment.
