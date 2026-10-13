# Qwen / Muse research snapshot before coaching integration

Research date: 2026-10-09. This is the preserved pre-implementation research snapshot. The separate Qwen3.5 coaching flow and secure backend described as necessary below have since been implemented; see [current implementation and verification](calendar-and-coaching-2026-10-09.md). Real GPU inference, cloud credentials and native inference remain unverified/unavailable.

Read-only inspection of `movefield-recovery` and current primary documentation. No source changes, runtime installation, weights download, provider requests, account setup, billing changes, or credentials access.

## Decision for the current repository

The feasible no-provider-key larger model is **Qwen3.5-4B in an explicitly opted-in browser WebGPU worker**, with **Qwen3.5-9B as an optional device-qualified choice**. Both are already supported by the installed WebLLM 0.2.85 and have immutable, checked artifact metadata in this repository. They have not been physically qualified or evaluated for coaching. A suitable GPU, a multi-gigabyte download, consent to use real workout/profile summaries locally, and a new bounded coaching flow remain necessary.

For the same backend-generated coaching on web, iOS and Android, the easiest documented free hosted provider is **Groq**, whose host already passes the server allowlist. It still requires an account and a server-held API key, neither of which is available in the inspected deployment. Current free Qwen is `qwen/qwen3.8-27b`, a preview model; Groq recommends production use of its production models instead. Do not invent an available Qwen3.5 or Muse free backend or silently substitute a different model.

**Meta Muse Glimmer** is a real open-weight 30B option, but its published quantized files and GPU requirements make it a separate self-hosted inference project. **Meta Muse Spark 1.3** is a different, paid API model; current Spark release documentation describes open weights as future work. The name “Muse” alone is insufficient to choose between them.

## Installed browser support and exact local evidence

Read-only `import {prebuiltAppConfig} from '@mlc-ai/web-llm'` confirms Qwen3.5 0.8B, 2B, 4B and 9B prebuilt entries in installed **0.2.85**. Their prebuilt overrides are `context_window_size:4096` and `max_history_size:1`. No Muse/Glimmer entry is present in that installed model list. GGUF and ExecuTorch `.pte` artifacts cannot be treated as WebLLM MLC model files and WASM libraries.

| Candidate in `lib/qwen-assets.json` | Total pinned download | Upstream prebuilt VRAM estimate | Context / features | Qualification |
| --- | ---: | ---: | --- | --- |
| Qwen3.5-4B q4f16_1 MLC | 2,396,760,278 bytes | 3,867.82 MB | 4,096 tokens; `shader-f16` | `not-tested` |
| Qwen3.5-9B q4f16_1 MLC | 5,067,721,004 bytes | 6,433.01 MB | 4,096 tokens; `shader-f16` | `not-tested` |

These downloads are exact repository manifest totals; the VRAM values are installed runtime metadata estimates, not measurements or minimum usable device RAM. Model revisions are `44b42469f9e192814bfd90440e3b377d89ba7a13` (4B) and `c7c5d3f5a81e37b8facbb72970940a1b131314a8` (9B). WASM library revision is pinned to `025bcaf3780fa8254f5e5efd3bfea0a5397248f4`. Keep the immutable URLs and checked hashes rather than replacing them with upstream mutable `main` URLs.

The official Qwen cards identify both as Apache 2.0 models, with vision encoders and native 262,144-token contexts. That advertised native limit does **not** describe the current browser runtime configuration. Thinking is enabled by default upstream; any non-thinking prompt/template and result parser must be matched to the runtime and tested.

Official sources:

- https://huggingface.co/Qwen/Qwen3.5-4B
- https://huggingface.co/Qwen/Qwen3.5-9B
- https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f16_1-MLC
- https://huggingface.co/mlc-ai/Qwen3.5-9B-q4f16_1-MLC
- https://webllm.mlc.ai/docs/user/basic_usage.html

## Application gaps observed before implementation

`components/qwen-demo.tsx` and the live worker built from `lib/qwen-runtime.worker.ts` implement a fictional evidence-selection demonstration. That worker hardcodes Qwen3-0.6B and uses a **2,048-token context / 256-token output reserve** from the legacy contract. The separate older `lib/qwen-worker.ts` also hardcodes 0.6B but uses **1,024 / 192** and a single-message policy; it is not the current worker build entry. Neither custom WebLLM config copies the Qwen3.5 `max_history_size:1` prebuilt override. The UI promises that real workout records are not sent to the model; preserve that fictional sample and use a distinct real-data coaching consent/contract before personalized inference.

The necessary implementation is a separate validated coaching input contract containing a bounded profile, attendance counts, recent comparable performance summaries and the just-logged lift/workout. Compute numeric comparisons deterministically outside the LLM. Preserve request/version identity so stale results do not attach to changed records, tokenize before loading, validate the structured response and show the execution source/model truthfully. Test incomplete generation, unsupported GPU, OOM, cache damage, interrupted download and cancellation. Keep generic model benchmarks separate from actual coaching acceptance evidence.

`server/feedback.ts` currently admits completed-session metrics only, rejects profile/name/whole-state/client prompts, sends at most 180 output tokens and applies an eight-second provider timeout. Its fixed prompt forbids load/repetition/frequency/diet/plan changes. The current flow saves generated text to `daily_ai_feedback` before UI display. A model substitution alone does not add profile/attendance context or per-lift coaching, and a reasoning model may exhaust the existing output/time budgets. Expand the validated backend contract and evaluate provider settings only if this backend scope is selected; preserve server-only credentials and the durable-save-before-display flow.

The mobile package does not install `react-native-executorch`. Existing Android Qwen3 `.pte` metadata is not an implemented native inference bridge. The browser WebGPU option therefore does not establish iOS/Android on-device parity. No new native weight format or runtime dependency should be added to a build already being qualified without a separate tested change.

## Actual Muse choices

| Model | License/access | Published execution facts | Fit here |
| --- | --- | --- | --- |
| Muse Glimmer | Apache 2.0 open weights, no API key or gated model access according to Meta docs | 30B dense text+image to text, 128K default context. bf16 around 60 GB. Fixed Q4 GGUF 16.8 GB; dynamic Q4 GGUF 19.7 GB. Meta reports fixed Q4 + vision + full 128K context at 19 GiB VRAM, suitable for a 24 GiB GPU. llama.cpp `b10353` or newer required. Published vLLM, SGLang, llama.cpp and ExecuTorch paths. | Self-host on suitable owner hardware; absent from installed WebLLM prebuilt list and current native app. No hardware or hosted Glimmer endpoint supplied. |
| Muse Spark 1.3 | Authenticated API; no established open-weight license/parameter count in current docs | OpenAI-compatible base `https://api.meta.ai/v1`, model `muse-spark-1.3`. Standard $1.25/M input, $4.25/M output, $0.15/M cached input. Contributor $0.10/$0.20/$0.002 respectively permits model training on prompts/completions. | Paid and requires a server API key plus reviewed provider allowlist addition. No documented recurring free text-coaching allowance. Contributor data use needs explicit informed consent before fitness/profile data. |

Do not confuse these with Google's older text-to-image Muse or Microsoft's gameplay-generation Muse.

Official sources:

- https://dev.meta.ai/docs/muse-glimmer
- https://dev.meta.ai/docs/muse-glimmer/get-the-model
- https://dev.meta.ai/docs/muse-glimmer/quantization
- https://dev.meta.ai/docs/overview
- https://dev.meta.ai/docs/pricing-rate-limits
- https://research.meta.ai/blog/introducing-muse-spark-1-3

## Free and self-hosted routes

| Route | Current documented allowance / hardware | Account or implementation requirement |
| --- | --- | --- |
| Browser WebGPU + Qwen3.5 | No API inference charge; uses user's GPU, download/storage/power. Exact artifact totals and runtime estimates above. | No inference API key. Existing download/runtime foundation; new local real-data consent, model selection, coaching contracts and device/quality qualification required. |
| Groq | Listed Free limits for `qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`: 30 RPM, 1,000 RPD, 8,000 TPM, 200,000 TPD. Organization-wide and account limits may differ. Qwen is Preview; GPT-OSS choices are Production. | Account + API key; base `https://api.groq.com/openai/v1` already allowlisted. Quotas apply across all app users, not per user. |
| Cloudflare Workers AI | 10,000 Neurons/day free, resets 00:00 UTC; Free-plan calls fail after exhaustion. Current catalog includes Qwen3-30B-A3B fp8 and Qwen3.8-27B. These are absent from the current paid-billing-required list, so Free eligibility is inferred, not account-tested. | Cloudflare account + account ID/token for REST or an AI binding. Reviewed allowlist/binding implementation required; existing Sites hosting is not proof an AI binding exists. |
| Hugging Face Inference Providers | Current pricing says **no included credits for Free users**; credits purchase or paid upgrade required. Older search snippets describing included Free credits are stale. | HF account + inference permission token, provider selection, reviewed router allowlist. Not an established zero-cost route now. |
| Ollama / llama.cpp on owner's hardware | Qwen3.5 Ollama artifacts: 4B 3.3–4.0 GB, 9B 6.6–7.6 GB, 27B 17–20 GB. These are file sizes, not full memory requirements. Glimmer GGUF sizes above. Local software/weights need no inference billing, but hardware/energy/hosting remain. | No suitable server observed. Ollama local API uses `http://localhost:11434/v1` and ignores client API key; the public app needs a reviewed authenticated HTTPS proxy/service. The current backend rejects arbitrary localhost/hosts. |

The Cloudflare Site Worker has a 128 MB isolate memory limit including WASM and no local GPU runtime. It cannot load these multi-gigabyte weights; Workers AI is a separate hosted inference service/binding.

Official sources:

- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/models
- https://console.groq.com/docs/openai
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/
- https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- https://huggingface.co/docs/inference-providers/pricing
- https://ollama.com/library/qwen3.5
- https://docs.ollama.com/api/openai-compatibility
- https://developers.cloudflare.com/workers/platform/limits/
