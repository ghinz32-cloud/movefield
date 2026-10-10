# On-device models for Movefield

Current artifact/runtime verification: `docs/qwen-runtime-verification-2026-10-08.md` and `lib/qwen-assets.json` supersede the older sizes/API examples below where they differ. Seven selected Android/web candidates have immutable artifact metadata and exact-context qualification logic. No runtime inference or device qualification has run. Native 4B is a 2.693 GB selected download with a 2048-token export context; web Qwen3.5 9B is a separate 5.068 GB desktop candidate. The dated discussion below remains historical.

Research checked 7 October 2026. This is an integration recommendation; no model is installed, included in the app download, or benchmarked on a phone yet.

Start with short summaries of saved workouts. Keep the existing training rules responsible for exercises, loads, recovery holds, progression and dates. A model can explain verified results or turn a request into a proposed change; it must not apply a change itself. The app should remain fully usable without a model.

## Current product direction — Qwen tiers

Current first model: Qwen3 0.6B (owner decision, October 2026; see `ai-feedback-plan.md` section 3). The longer-term direction is Qwen3 with optional 0.6B, 1.7B and 4B builds. Automatic should prefer 4B on qualified phones and step down to tested smaller builds when necessary. A phone being new or reporting a large total RAM value is not qualification. Test the exact model revision, runtime, OS/backend, peak process memory, response time, sustained temperature and battery impact. Ask before each download; allow cancellation, retry and deletion. The prototype currently saves this choice only.

XNNPACK 4-bit model files are about 482 MB, 1.2 GB and 2.5 GB respectively, plus an approximately 10.9 MB tokenizer. Apple MLX builds are about 599 MB, 1.4 GB and 2.7 GB respectively. These are file sizes, not app RAM requirements. All tiers must preserve the same existing safety and change-approval rules.

We do not need to train a language model from scratch. First retrieve a small relevant set of licensed exercise/reference passages and validated workout facts from the app's local library. Give Qwen those facts and have it explain them. Keep source provenance, date and population/limits with each reference. Do not scrape or redistribute copyrighted full text just because it is visible online. Do not put the entire library into every prompt.

Fine-tuning is an optional later experiment for output style or task behavior, performed on development hardware using licensed examples, then distributed as a versioned model. It is not continuous training on users' phones and does not replace factual evaluation or a maintainable reference library. No training-data collection or cloud transmission is enabled in this revision.

References: [retrieval-augmented generation research](https://arxiv.org/abs/2005.11401), [Qwen fine-tuning guidance](https://qwen.readthedocs.io/en/latest/training/ms_swift.html), [Expo memory field limitations](https://docs.expo.dev/versions/latest/sdk/device/), [React Native ExecuTorch LLM integration](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation).

## Candidates to test

| Candidate | Optional download for the listed build | Why test it | Constraints |
| --- | --- | --- | --- |
| Apple Foundation Models, on-device system model | No separate app-bundled model; uses Apple's installed system model | First choice on compatible iPhones | Check model availability, device, OS, language and region. Apple Intelligence must be enabled and its model ready. Explicitly select the on-device model; the framework also supports cloud models. |
| Qwen3 0.6B, ExecuTorch XNNPACK 4-bit | 482 MB model + 10.9 MB tokenizer, approximately 493 MB total | Small permissively licensed baseline for short summaries and structured requests | Apache 2.0. Use non-thinking mode. Measure total peak memory and summary accuracy on our target phones. |
| LFM2.5 1.2B Instruct, ExecuTorch XNNPACK 4-bit | 759 MB model + 4.5 MB tokenizer, approximately 764 MB total | Compare summary and extraction quality against Qwen | LFM Open License, including commercial revenue conditions. It is not intended as a knowledge-intensive coach. |
| LFM2.5 350M, ExecuTorch XNNPACK 4-bit | 265 MB model + 4.5 MB tokenizer, approximately 270 MB total | Small-device experiment for classifying a request or extracting a few fields | Same Liquid license. Do not assume this size is sufficient for useful free-form summaries. |

Download sizes are published file sizes, rounded and excluding the native runtime, app, temporary download space and small configuration files. They are **not RAM requirements**. The ready-made model exports target ExecuTorch 1.4.1; pin a compatible runtime and model revision together. MLX exports have different sizes and hardware support.

Liquid allows free commercial use below its stated annual revenue threshold of US$10 million; the original license requires a separate commercial license at or above that threshold. Preserve license notices and check the applicable distribution terms before shipping. Qwen's Apache license also requires its notices to accompany distribution.

Apple's system model avoids an additional copy in our app, but its installation and use still consume device storage, memory and power. Check `SystemLanguageModel.availability` at runtime and fall back to the ordinary workout summary when unavailable. Supported hardware includes iPhone 15 Pro/Pro Max and later compatible Apple Intelligence devices; this is not every iPhone.

Gemma 4 E2B can be a later LiteRT-LM benchmark. Google's mobile text-only variant lists about 0.84 GB of static model loading memory, excluding supporting software and context memory. That figure is not a download size or a total app memory measurement. The generic React Native ExecuTorch exports are much larger, so compare a specific conversion/runtime, not just the model name. Its Apache 2.0 terms differ from older Gemma releases.

Do not use Gemini Nano through ML Kit GenAI for the current 14+ app: Google's terms prohibit API clients directed at, or likely to be accessed by, under-18 users. An adult-only switch inside the same app does not resolve that restriction.

## Integration boundary

The current Expo app needs a native development build to use React Native ExecuTorch; Expo Go cannot load its custom native libraries. Apple Foundation Models similarly needs native integration. The website needs a separate browser runtime and feature detection; phone integration does not automatically enable browser inference.

Recommended first experiment:

1. Offer an optional download with its size, a Wi-Fi choice, progress, cancellation, retry and deletion. Verify the downloaded file and revision. Do not silently fall back to a cloud provider.
2. After a saved workout, pass a short list of validated facts and the existing next step. Generate a brief summary on request, then release the model. Avoid inference during rest timing or continuous background work.
3. Keep names, imported exercise text and user notes as untrusted data. A strict output schema catches malformed responses but cannot prove their truth. Reject unsupported claims and show the existing rules-based summary on failure.
4. Keep symptom handling and younger-user supervision in the existing rules. The current AI-review gate excludes youth, concerns and incomplete context. Expanding eligibility is a separate evaluated product decision.
5. Test a low-end supported iPhone, a midrange Android and a flagship for cold start, response time, total peak app RAM, download/storage overhead, heat, battery use, interruptions and recovery. Measure factual mistakes and unsafe suggestions against held-out workout records.

Choose a model only after that comparison. A smaller parameter count or a fast vendor benchmark does not establish performance in this app. The reported Liquid benchmark on a Galaxy S25 Ultra used llama.cpp, so it cannot predict performance in our Expo/ExecuTorch build.

## Primary references

- [Apple Foundation Models overview](https://developer.apple.com/apple-intelligence/) and [system model availability](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel)
- [Apple Intelligence device and availability requirements](https://support.apple.com/en-us/121115)
- [Qwen3 0.6B official model card](https://huggingface.co/Qwen/Qwen3-0.6B) and [React Native ExecuTorch exports and exact file sizes](https://huggingface.co/software-mansion/react-native-executorch-qwen-3)
- [Liquid model card](https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct), [ExecuTorch exports and exact file sizes](https://huggingface.co/software-mansion/react-native-executorch-lfm-2.5), [license guide](https://docs.liquid.ai/lfm/help/model-license) and [original license](https://www.liquid.ai/lfm-license)
- [React Native ExecuTorch installation](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started)
- [Google ML Kit GenAI terms](https://developers.google.com/ml-kit/genai-terms)
- [Gemma memory guidance](https://ai.google.dev/gemma/docs/core), [Gemma 4 E2B official card](https://huggingface.co/google/gemma-4-E2B-it), [LiteRT-LM](https://developers.google.com/edge/litert-lm)
