# U02b — native workout controls

Parent checkpoint `acd95cb4e1d93f52b699324232980f81be98c214`; review branch `audit/2026-10-08-quality`, local `audit/2026-10-08-integration`. Code changed: `mobile/App.tsx`. No merge/deployment.

Each set now has visible labels for actual amount, load and optional reps left. Flexible labeled field groups can wrap independently; the Log action spans the set block instead of competing with four narrow columns. Input parsing, numeric limits, completed-set validation, rest-start logic and explicit undo are preserved. Finish/save uses the existing `requestFinish` confirmation/partial-save path in a persistent action area outside the workout ScrollView and inside its KeyboardAvoidingView. That area also shows logged count and rest pause/resume/+30 controls. Optional full rest/alert settings start collapsed. The previous workout summary and generic introductory heading no longer precede the active workout.

## Verification

- Native `npm run check`: passes.
- Native `npm run test:engine`: passes for 78 plans × 7 starting weekdays, partial save, measurements/history, machine context, sealed records and protected transfers; 989 exercises/guides.
- Native `npm run export:mobile`: both iOS and Android Metro/Hermes exports pass, 775 modules, 3.8MB bundles. These are not signed installable apps.
- Root `npm run lint`: passes with zero product warnings/errors.
- `python3 scripts/package-mobile.py`: regenerates the current source starter from 97 files, 1809914 bytes. Generated ZIP/bundles are ignored build outputs and local-only; committed source produces them in future builds.
- Source review verifies single persistent finish action wired to the existing guard, optional controls, per-set accessible names, retained disabled/saved/undo behavior and safe-area layout.

The initial patch command used the native directory while expecting root paths and failed before writing files. Its checks ran on old source and were discarded. All results above were rerun after the successful source patch. No passing device test is inferred.

Physical Android/iPhone, software keyboard, large system font, TalkBack/VoiceOver and very small screen acceptance remain pending. The footer may consume additional height when controls wrap; validate on the intended Android devices before release. No native screenshot or live UI acceptance is available in this environment. See U01 for the separate web preview and data-persistence limits.

Next milestone U03: independent primary-source evidence audit and actual program frequency/dose/progression coverage. Inspect the observed mismatch between a catalog time-fit warning and its generated preview duration; template count alone is not evidence quality.
