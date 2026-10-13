# U06 — current Qwen assets and runtimes

Parent local checkpoint `ae6fd1d1603efc05467e18d953607af5f3cfb084`. Research/source inspection on 8 October 2026. This checkpoint is local-only until explicit push approval. No model weights, phone runtime, download or inference have been enabled in either app.

## Verified direction

Android: inspect React Native ExecuTorch **0.10.4** with Qwen3 XNNPACK 8da4w exports at 0.6B, 1.7B and 4B. The package uses the v0.10.0 export set, resolved to immutable commit `5004436bc2c31aeaeb272a1ea6e47bd7d91da95c`. Its current API uses `models.llm.QWEN3_4B.XNNPACK_8DA4W` and runner/session APIs; older examples importing `QWEN3_4B_QUANTIZED` are not the selected current interface. Peers include `react-native-worklets >=0.10.0 <0.13.0` and `react-native-blob-util ^0.24.0`; native New Architecture/development builds are required. Expo Go cannot supply this native runtime.

The registry's 0.10.5 release is dated 6 October 2026 and was inspected only; it is younger than the repository's seven-day release-age policy. Version 0.10.4 was published 28 September and is the integration candidate. Do not add mismatched worklet runtimes or assume the existing Expo 57 bundle export proves native C++ compatibility.

Web: **@mlc-ai/web-llm 0.2.85**, published 8 September 2026, has Qwen3 and Qwen3.5 entries in the actual npm tarball. Selected candidates include the initial Qwen3 0.6B, Qwen3 4B, newer Qwen3.5 4B, and a larger Qwen3.5 9B desktop experiment. The package uses `v0_2_84/base` WASM libraries. Manifest URLs pin model and WASM Git commits rather than `main`/mutable tags. This is a chosen candidate set, not a claim that no larger Qwen exists or that 9B is best on every computer.

Primary sources: [WebLLM documentation](https://webllm.mlc.ai/docs/), [publisher registry source](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts), [native runtime setup](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started), [native LLM APIs](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation), [native export repository](https://huggingface.co/software-mansion/react-native-executorch-qwen-3), [official Qwen3 4B](https://huggingface.co/Qwen/Qwen3-4B), [Qwen3.5 4B](https://huggingface.co/Qwen/Qwen3.5-4B) and [Qwen3.5 9B](https://huggingface.co/Qwen/Qwen3.5-9B). The model cards report Apache 2.0. Notices must accompany any future distribution; full science-paper access is a separate license question.

## Candidate matrix

Decimal GB rounded; exact bytes and hashes are in `lib/qwen-assets.json`. Sizes include the selected model/tokenizer/config/runtime artifacts, not app/runtime dependencies or temporary download space.

| Candidate | Platform/backend | Selected download | Published export context | Qualification |
| --- | --- | ---: | ---: | --- |
| Qwen3 0.6B | Android XNNPACK 8da4w | 0.517 GB | 2048 tokens | Not tested |
| Qwen3 1.7B | Android XNNPACK 8da4w | 1.315 GB | 2048 tokens | Not tested |
| Qwen3 4B | Android XNNPACK 8da4w | 2.693 GB | 2048 tokens | Not tested |
| Qwen3 0.6B | WebGPU q4f16_1 | 0.357 GB | 4096 selected runtime tokens | Not tested |
| Qwen3 4B | WebGPU q4f16_1 | 2.285 GB | 4096 selected runtime tokens | Not tested |
| Qwen3.5 4B | WebGPU q4f16_1 | 2.397 GB | 4096 selected runtime tokens | Not tested |
| Qwen3.5 9B | WebGPU q4f16_1 | 5.068 GB | 4096 selected runtime tokens | Not tested; desktop experiment |

Published WebLLM VRAM estimates are separate from downloads and total app memory. They are not qualification results. Native build exports have much shorter context than some official upstream model cards: qualification and prompts must use the deployed export's actual context. Larger context increases memory and needs its own benchmark. All selected web f16 candidates require the appropriate WebGPU features and a secure context.

## Implemented artifact/qualification foundation

`scripts/refresh-qwen-assets.py` reads public publisher metadata and creates the immutable manifest. It reads tokenizer/config metadata and hashes WASM binaries; large model weights are **not downloaded**. Every required asset has an exact byte length, pinned URL and SHA-256. Large weights use published LFS SHA-256, so their bytes still need verification during actual download. Missing weight hashes are a hard error. Paths are validated, binary-size limits enforced, and no partially generated manifest is saved on failure. First generation rejected a tokenizer vocabulary exceeding the small-metadata bound; the bound was corrected for vocabularies while retaining the no-weight-download rule.

`lib/qwen-catalog.ts` only selects a candidate when an exact model revision/runtime/backend/device/app-build/context/evaluation record passes. Empty records select no model. Phone age, reported RAM and published file size are never used to assert qualification. Tests use explicitly synthetic records; no actual device qualification is stored. Existing appearance/model preferences remain unchanged and do not invoke inference.

Initial product acceptance limits are three successful cycles, positive measured peak-app/budget values with peak within budget, held-out accuracy/safety/interruption passes, p95 generation ≤30 seconds and cold load ≤120 seconds. These are deliberate product gates and may be revised from observations; they are not vendor benchmarks or guarantees. The model cannot alter deterministic exercise/load/date/hold/coach/youth authority.

## Required next integration

1. U07 original evidence summaries/provenance plus bounded retrieval and held-out question/safety/injection cases. This is retrieval grounding, not fine-tuning.
2. U08 web worker runtime with explicit verified download/progress/cancel/delete, strict schema/factual acceptance and ordinary summary fallback. Keep external model destinations and WASM policy narrowly scoped; do not blanket-open CSP or send workout records to a hosted model.
3. U09 native development-build integration using verified local artifact paths, cancellation/unload and exact device measurements. Larger tiers appear only after the same evaluated task passes.

## Validation and limitations

Passed before checkpoint: `node scripts/check-qwen-assets.cjs` (1,672 assertions; zero actual devices qualified), `node scripts/check-shared.cjs` (33 canonical/native files and hashes), web `pnpm exec tsc --noEmit`, native `npm run check`, and root `pnpm lint`. Whitespace diff is checked before committing. All qualification records in the harness are synthetic.

Package tarballs were inspected in a scratch research directory and were not added as runtime dependencies. No GPU inference or model benchmark ran. Java is present, but this environment has no Android SDK, adb, Gradle or emulator, and no physical Android surface. Browser GPU capabilities remain unmeasured. A Metro export is not a native build. U08/U09 remain incomplete.

Exact checkpoint: `git log -1 --format=%H -- docs/qwen-runtime-verification-2026-10-08.md`. Last verified GitHub head remains `8cd39e42f2178b807d63af2042b70481041b028b`; do not call this pushed, merged, deployed, trained or hardware-qualified.
