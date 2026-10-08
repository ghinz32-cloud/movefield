# Qwen model verification, October 2026

Checked 7 to 8 October 2026 (UTC). Scope: small Qwen language models (about 0.5B to 4B) for the optional on-device feedback feature in Movefield.

This is research only. No model was downloaded into the repository, and no code or other document was changed.

## Summary

- **"Qwen 3.5" is a real release.** Qwen3.5-0.8B, 2B, 4B and 9B were published on 2 March 2026 under Apache-2.0. I found no Qwen3.5 model at 0.5B or 1.7B. Sources: [Qwen GitHub news](https://github.com/QwenLM/Qwen3.5), [Qwen3.5 collection](https://huggingface.co/collections/Qwen/qwen35), [Qwen3.5-0.8B card](https://huggingface.co/Qwen/Qwen3.5-0.8B).
- **The project's Qwen3 0.6B, 1.7B and 4B still exist,** are Apache-2.0, and are the only small Qwen models I could confirm with ready-made React Native ExecuTorch exports. Qwen3.5 is not listed in the React Native ExecuTorch LLM docs. Sources: [Software Mansion export repo](https://huggingface.co/software-mansion/react-native-executorch-qwen-3), [React Native ExecuTorch LLM docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation).
- **No official Qwen GGUF, MLX or ONNX build of any Qwen3.5 small model is in the Qwen collection.** Phone memory figures exist only from third-party conversions. They are high and not comparable across devices. On an iPhone 17 Pro the reported GPU peaks are 5.3 to 5.7 GB for the 0.8B, 2B and 4B builds. We have no measurements of our own.
- **No Qwen model card has a hallucination, medical-disclaimer or refusal section,** and none addresses health or exercise advice.
- **Newer Qwen lines exist** (Qwen3.6 in April 2026, Qwen3.8 in August 2026), but their confirmed open models are large. I could not confirm any small Qwen3.6, 3.7 or 3.8 model. Several of those pages returned HTTP 401.

**Method and limits.** The Hugging Face API was refused by the session egress policy (403 on CONNECT to huggingface.co). I did not route around that. Hugging Face and GitHub pages were read with WebFetch, which returns a summary, so byte counts and quoted text come from those summaries. Spot-check exact sizes against the repository before they go into the app. npm metadata was read directly from the public registry.

## Model table

Sizes are as stated on each card. "Metadata" is the parameter count the Hugging Face page shows for the files, which can differ.

| Model | Release | Size | Variant | Licence | Quantised formats | URL |
| --- | --- | --- | --- | --- | --- | --- |
| Qwen3-0.6B | 29 Apr 2025 (family release) | 0.6B (0.44B non-embedding); metadata 0.8B | Post-trained, hybrid thinking; base is separate | Apache-2.0 | Official GGUF Q8_0 only. ExecuTorch exports (Software Mansion) in XNNPACK bf16 and 8da4w, and MLX int4. | [card](https://huggingface.co/Qwen/Qwen3-0.6B), [GGUF](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF) |
| Qwen3-1.7B | 29 Apr 2025 (family release) | 1.7B (1.4B non-embedding); metadata 2B | Post-trained, hybrid thinking | Apache-2.0 (licence tag) | Official GGUF Q8_0 listed. ExecuTorch exports as above. | [card](https://huggingface.co/Qwen/Qwen3-1.7B), [GGUF](https://huggingface.co/Qwen/Qwen3-1.7B-GGUF) |
| Qwen3-4B | 29 Apr 2025 (family release) | 4.0B (3.6B non-embedding) | Post-trained, hybrid thinking | Apache-2.0 (LICENSE file in the GGUF repo) | Official GGUF: Q4_K_M, Q5_0, Q5_K_M, Q6_K, Q8_0. ExecuTorch exports as above. | [card](https://huggingface.co/Qwen/Qwen3-4B), [GGUF](https://huggingface.co/Qwen/Qwen3-4B-GGUF) |
| Qwen3-4B-Instruct-2507 | 6 Aug 2025 | 4.0B | Non-thinking only | Apache-2.0 | No Qwen-published quantised build listed | [card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) |
| Qwen3.5-0.8B | 2 Mar 2026 | 0.8B; metadata 0.9B | Post-trained, hybrid; non-thinking by default. Base repo is separate. | Apache-2.0 (LICENSE file, "Copyright 2026 Alibaba Cloud") | No official GGUF, MLX, ONNX, GPTQ or FP8 build found | [card](https://huggingface.co/Qwen/Qwen3.5-0.8B) |
| Qwen3.5-2B | 2 Mar 2026 | 2B | Post-trained, hybrid; non-thinking by default | Apache-2.0 (licence tag; LICENSE file read) | No official quantised build found | [card](https://huggingface.co/Qwen/Qwen3.5-2B) |
| Qwen3.5-4B | 2 Mar 2026 | 4B; metadata 5B (includes vision encoder) | Post-trained, hybrid; thinking by default | Apache-2.0 (LICENSE file read) | No official quantised build found | [card](https://huggingface.co/Qwen/Qwen3.5-4B) |

Qwen3.5 base models (0.8B-Base, 2B-Base, 4B-Base, 9B-Base) also exist. The collection page shows their last update as 23 April 2026. Source: [Qwen3.5 collection](https://huggingface.co/collections/Qwen/qwen35).

Third-party conversions, not published by Qwen:

| Build | Publisher | Format and runtime | Files and sizes | URL |
| --- | --- | --- | --- | --- |
| Qwen3-0.6B-int4 | LiteRT Community | LiteRT-LM, dynamic int4 (block 32); separate thinking and no-think files | About 332 MB | [page](https://huggingface.co/litert-community/Qwen3-0.6B-int4) |
| Qwen3-4B | LiteRT Community | LiteRT-LM; int8 and mixed INT4 | int8 5.28 GB; mixed INT4 2535.88 MiB | [page](https://huggingface.co/litert-community/Qwen3-4B) |
| Qwen3.5-0.8B | LiteRT Community ("not affiliated with Alibaba / the Qwen team") | LiteRT-LM, int8; text and vision builds | Text 963 MB; VL 1.30 GB | [page](https://huggingface.co/litert-community/Qwen3.5-0.8B) |
| Qwen3.5-2B | LiteRT Community | LiteRT-LM, int8 | 1.97 GB | [page](https://huggingface.co/litert-community/Qwen3.5-2B) |
| Qwen3.5-4B | LiteRT Community | LiteRT-LM; int8 and mixed INT4 | int8 4.10 GB; mixed INT4 2.57 GB | [page](https://huggingface.co/litert-community/Qwen3.5-4B) |
| Qwen3.5 0.8b / 2b / 4b | Ollama (packaging) | Ollama library; quantisation label not shown | Download 1.2 to 1.3 GB / 2.7 to 3.1 GB / 3.3 to 4.0 GB | [library](https://ollama.com/library/qwen3.5) |
| Qwen3-4B-4bit | mlx-community | MLX 4-bit, converted from Qwen/Qwen3-4B | 2.26 GB | [page](https://huggingface.co/mlx-community/Qwen3-4B-4bit) |

## 1. Which models exist

**Confirmed:**

- **Qwen3 dense family (0.6B, 1.7B, 4B and others).** Released 29 April 2025. The blog says six dense models were open-weighted, including 0.6B, 1.7B and 4B, under Apache 2.0. Source: [Qwen3 blog](https://qwenlm.github.io/blog/qwen3/). The hybrid models support `enable_thinking=False`. The 4B and 1.7B cards say thinking is on by default. Sources: [Qwen3-4B card](https://huggingface.co/Qwen/Qwen3-4B), [Qwen3-1.7B card](https://huggingface.co/Qwen/Qwen3-1.7B).
- **Qwen3-4B-Instruct-2507.** The "final open release of Qwen3-2507, Qwen3-4B-Instruct-2507 and Qwen3-4B-Thinking-2507" was dated 6 August 2025. Source: [QwenLM/Qwen3 news](https://github.com/QwenLM/Qwen3). It is non-thinking only: "This model supports only non-thinking mode and does not generate `<think></think>` blocks." Source: [card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507).
- **Qwen3.5 small: 0.8B, 2B, 4B and 9B.** The Qwen GitHub news dates "Qwen3.5-9B, Qwen3.5-4B, Qwen3.5-2B, and Qwen3.5-0.8B are now available on Hugging Face Hub and ModelScope!" to 2 March 2026. Source: [QwenLM/Qwen3.5 URL](https://github.com/QwenLM/Qwen3.5). That URL now shows the QwenLM/Qwen3.8 repository, and the 2 March entry is in its news. [Gigazine](https://gigazine.net/gsc_news/en/20260303-qwen-3-5-small) also dates the Qwen announcements to 2 March 2026.
  - Context: 262,144 tokens native, per the 0.8B, 2B and 4B cards.
  - Vision: the 2B and 4B cards describe a "Causal Language Model with Vision Encoder." The LiteRT text builds drop the vision tower, which is why text-only builds are smaller.
  - Thinking: the 4B card says Qwen3.5 "operate[s] in thinking mode by default." The 0.8B and 2B cards say "non-thinking mode by default." All three say the Qwen3 `/think` and `/no_think` soft switches are not supported.

**Later families, checked:**

- **Qwen3.6.** Open weights for Qwen3.6-35B-A3B and Qwen3.6-27B, released April 2026. Neither card names a small Qwen3.6 model. Sources: [Qwen3.6-35B-A3B card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), [Qwen3.6-27B card](https://huggingface.co/Qwen/Qwen3.6-27B). The Qwen3.6-4B, 2B and 0.8B pages returned HTTP 401: [4B](https://huggingface.co/Qwen/Qwen3.6-4B), [2B](https://huggingface.co/Qwen/Qwen3.6-2B), [0.8B](https://huggingface.co/Qwen/Qwen3.6-0.8B). That is not proof they do not exist.
- **Qwen3.7.** A June 2026 secondary article says no open weights had shipped yet and names only 27B and 35B as forthcoming. Source: [InsiderLLM](https://insiderllm.com/guides/qwen-3-7-preview-scored-57-aai-27b-35b-open-weights-watch/). Qwen3.7-4B and Qwen3.7-27B returned HTTP 401. I did not check later status.
- **Qwen3.8.** Qwen3.8-27B is post-trained, Apache-2.0, and cited for August 2026. Source: [card](https://huggingface.co/Qwen/Qwen3.8-27B). Qwen3.8-4B and Qwen3.8-2B returned HTTP 401. A secondary vendor page names no small Qwen3.8 model. Source: [Yotta Labs](https://www.yottalabs.ai/post/qwen-3-8-vs-qwen-3-8-max-differences-which-to-use-2026). That page is internally inconsistent on dates.
- **Other small repos on the organisation page:** Qwen3Guard-Stream-0.6B and Qwen3Guard-Stream-4B are listed as "Feature Extraction." They look like safety-moderation models and are not feedback generators. I did not read their cards. Source: [Qwen organisation page](https://huggingface.co/Qwen). That page shows 10 of 468 models.

**Answer for the product owner:** the newest small Qwen text models I could confirm are Qwen3.5 0.8B, 2B and 4B (March 2026). A 0.5B Qwen3.5 does not exist on the pages I checked.

## 2. Licence

Every small Qwen model I checked is **Apache-2.0**. No Qwen licence applies to them, so no Qwen user-count or acceptable-use clause needs quoting.

- The Qwen3.5-4B LICENSE file is the Apache License 2.0 text ("Version 2.0, January 2004") with the appendix line "Copyright 2026 Alibaba Cloud." It has no user-count clause and no acceptable-use clause beyond standard Apache terms. Source: [Qwen3.5-4B LICENSE](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/LICENSE).
- The Qwen3.5-0.8B and Qwen3.5-2B LICENSE files are the same Apache 2.0 text ("Copyright 2026 Alibaba Cloud"). Sources: [0.8B LICENSE](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/main/LICENSE), [2B LICENSE](https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE).
- The Qwen3-0.6B LICENSE is also Apache 2.0 ("Copyright 2024 Alibaba Cloud"). Source: [Qwen3-0.6B LICENSE](https://huggingface.co/Qwen/Qwen3-0.6B/blob/main/LICENSE). The Qwen3-4B-GGUF repository ships the same Apache 2.0 file. Source: [Qwen3-4B-GGUF](https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/main).
- Apache 2.0 Section 4 is what applies when we redistribute: keep the licence text, keep notices, and mark modified files. The app's notice screen should carry these.
- **Conversions inherit the licence.** The LiteRT Community cards say Apache 2.0 is inherited from the base model. Source: [Qwen3.5-0.8B conversion](https://huggingface.co/litert-community/Qwen3.5-0.8B). Check the actual file before shipping.
- **Future risk.** A secondary vendor page says Qwen3.8-2.4T-A95B has "a custom license." I could not verify this, and it is not a small model. Re-check the LICENSE file for each exact revision we ship.

## 3. Official quantised builds and React Native runtimes

### Official Qwen builds

- **Qwen3-0.6B-GGUF:** one file, Qwen3-0.6B-Q8_0.gguf, 639 MB. No Q4 file. Source: [file tree](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/tree/main).
- **Qwen3-1.7B-GGUF:** Q8_0 listed at 1.83 GB. I did not read the file tree directly. Source: [repo](https://huggingface.co/Qwen/Qwen3-1.7B-GGUF).
- **Qwen3-4B-GGUF:** Q4_K_M 2.5 GB, Q5_0 2.82 GB, Q5_K_M 2.89 GB, Q6_K 3.31 GB, Q8_0 4.28 GB. Source: [file tree](https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/main).
- **Qwen3.5 small:** none found. The 21-item official Qwen3.5 collection contains no GGUF, MLX, ONNX or AWQ builds. Its GPTQ-Int4 and FP8 builds cover 27B and larger only. Source: [collection](https://huggingface.co/collections/Qwen/qwen35). Qwen3.5-0.8B-GGUF returned HTTP 401, so it is not confirmed.
- **Community quantisations** are linked from the cards (for example 305 for 0.8B and 233 for 2B) but are not attributed to Qwen. Sources: [0.8B card](https://huggingface.co/Qwen/Qwen3.5-0.8B), [2B card](https://huggingface.co/Qwen/Qwen3.5-2B).
- Qwen's own repository says "llama.cpp supports the Qwen3.5 open model series (text & vision)." Source: [QwenLM/Qwen3.5 URL, now the Qwen3.8 repository](https://github.com/QwenLM/Qwen3.5). This is a statement about llama.cpp, not a React Native binding.

### Software Mansion ExecuTorch exports (Qwen3 only)

- Repository: [software-mansion/react-native-executorch-qwen-3](https://huggingface.co/software-mansion/react-native-executorch-qwen-3). Apache-2.0. Covers Qwen3 0.6B, 1.7B and 4B only.
- Backends: XNNPACK in bf16 and 8da4w, and MLX int4. The MLX files are ExecuTorch `.pte` files with the MLX backend. They are not mlx-lm files.
- The README says the files target "the ExecuTorch v1.4.1 runtime" and that "ExecuTorch gives no forward compatibility guarantee." Source: [README](https://huggingface.co/software-mansion/react-native-executorch-qwen-3/blob/main/README.md). An earlier summary of the repository root said v0.6.0. I could not reconcile that, so v1.4.1 is what the README states.
- File sizes from the README:

| Model | MLX int4 | XNNPACK bf16 | XNNPACK 8da4w |
| --- | --- | --- | --- |
| 0.6B | 599 MB | 1.1 GB | 482 MB |
| 1.7B | 1.4 GB | 3.2 GB | 1.2 GB |
| 4B | 2.7 GB | 7.5 GB | 2.5 GB |

- The folder listings show the same 8da4w files as 506 MB, 1.3 GB and 2.68 GB. That matches if the README uses binary units (MiB and GiB) and the listing uses decimal units. For example, 506 MB decimal is about 482.6 MiB. This is my inference from the numbers, not a stated fact. Source: [0.6B folder](https://huggingface.co/software-mansion/react-native-executorch-qwen-3/tree/main/0_6b/xnnpack), [4B folder](https://huggingface.co/software-mansion/react-native-executorch-qwen-3/tree/main/4b/xnnpack).
- Tokenizer: 11.4 MB decimal, which is about 10.9 MiB.
- The project doc calls the 8da4w build "XNNPACK 4-bit." The repository's label is `8da4w`. I did not verify its exact definition on a source page.
- **React Native ExecuTorch docs:** the LLM page lists Qwen 3 0.6B, 1.7B and 4B (482 MB to 7.49 GB, XNNPACK and MLX) and Qwen 2.5. Qwen3.5 is not listed. Source: [docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation).
- **npm package:** `react-native-executorch` latest is 0.10.5, published 6 October 2026, MIT. Its peer dependencies include `react-native-worklets` (>=0.10.0 <0.13.0), `react-native-blob-util` (^0.24.0) and `@kesha-antonov/react-native-background-downloader` (>=4.4.0). Source: [npm registry](https://registry.npmjs.org/react-native-executorch).

### llama.rn (GGUF, React Native)

- MIT. "React Native binding of llama.cpp." Loads GGUF files. Supports iOS and Android. On Android, only arm64-v8a and x86_64 are supported. From v0.10, the New Architecture is required. Source: [llama.rn GitHub](https://github.com/mybigday/llama.rn).
- Stable release: 0.12.9, published 4 August 2026. The npm `latest` tag is currently 0.13.0-rc.7, a release candidate published 5 October 2026. Source: [npm registry](https://registry.npmjs.org/llama.rn).
- **Not verified:** whether llama.rn's bundled llama.cpp build supports the Qwen3.5 architecture. Qwen states that llama.cpp supports Qwen3.5, but I did not check llama.rn's version against it.
- **Not verified:** whether Expo Go can load either library. The project doc says a native development build is needed. The React Native ExecuTorch LLM page does not mention Expo Go.

### LiteRT-LM and MLX

- LiteRT-LM is the runtime for the LiteRT Community conversions. Its model cards list C++, Python, Kotlin, Swift, JavaScript and Flutter APIs. Source: [Qwen3-0.6B-int4 card](https://huggingface.co/litert-community/Qwen3-0.6B-int4). I found no React Native binding for it.
- MLX builds from mlx-community are third-party. The `mlx-lm` format is Apple's Python path, not a React Native path. Source: [mlx-community Qwen3-4B-4bit](https://huggingface.co/mlx-community/Qwen3-4B-4bit).

### Confirmed React Native paths

- **For Qwen3 0.6B, 1.7B or 4B:** react-native-executorch 0.10.5 with Software Mansion's exports (8da4w or MLX int4). Or llama.rn with a GGUF. Official GGUF covers 4B at Q4_K_M, but only Q8_0 for 0.6B and 1.7B.
- **For Qwen3.5 0.8B, 2B or 4B:** no confirmed React Native runtime and no ready-made export. This would need our own conversion or a third-party GGUF, and neither is verified here.

## 4. Memory at 4-bit

**No Qwen card gives a memory figure.** The Qwen3-0.6B, Qwen3-1.7B, Qwen3-4B, Qwen3-4B-Instruct-2507 and Qwen3.5 cards all omit RAM requirements. Source: [Qwen3-0.6B card](https://huggingface.co/Qwen/Qwen3-0.6B). The figures below are publisher-reported and not independently checked.

| Model and build | Device | Backend | Reported peak | Source |
| --- | --- | --- | --- | --- |
| Qwen3.5-0.8B, int8 text (not 4-bit) | iPhone 17 Pro | GPU (Metal) | 5.48 GB | [0.8B card](https://huggingface.co/litert-community/Qwen3.5-0.8B) |
| Qwen3.5-0.8B, int8 text | iPhone 17 Pro | CPU | 1.21 GB | same |
| Qwen3.5-0.8B, int8 text | Galaxy S26 (Adreno) | GPU | 5.4 GB; engine init 110 s | same |
| Qwen3.5-0.8B, int8 text | Pixel 8a (8 GB class) | GPU | does not fit (about 3.8 GB available) | same |
| Qwen3.5-0.8B, int8 text | Raspberry Pi 5 | CPU, RSS | 2.5 GB | same |
| Qwen3.5-2B, int8 | iPhone 17 Pro | GPU | 5.33 GB; decode 24.3 tok/s | [2B card](https://huggingface.co/litert-community/Qwen3.5-2B) |
| Qwen3.5-2B, int8 | iPhone 17 Pro | CPU | 1.52 GB; decode 16.2 tok/s | same |
| Qwen3.5-2B, int8 | Pixel 8a | GPU | out of memory during engine creation | same |
| Qwen3.5-4B, mixed INT4 | iPhone 17 Pro | GPU | 5.74 GB | [4B card](https://huggingface.co/litert-community/Qwen3.5-4B) |
| Qwen3.5-4B, mixed INT4 | iPhone 17 Pro | CPU | 1.68 GB | same |
| Qwen3.5-4B, mixed INT4 | Pixel 8a | CPU | 4.43 GB | same |
| Qwen3.5-4B, mixed INT4 | Raspberry Pi 5 (8 GB) | CPU, RSS | 4.9 GB | same |
| Qwen3.5-4B, 4-bit | Apple M4, 24 GB (Mac, not a phone) | oMLX v0.2.6 | 4.2 GB at 4k context | [oMLX benchmark](https://omlx.ai/benchmarks/og9pe8oc) |
| Qwen3-4B, mixed INT4 | Samsung SM-S937U1 (model number as listed) | GPU (OpenCL) | 1,609 MB peak private footprint | [Qwen3-4B conversion](https://huggingface.co/litert-community/Qwen3-4B) |
| Qwen3-4B, mixed INT4 | vivo V2502A | GPU (OpenCL) | 4,722 MB | same |
| Qwen3-4B, mixed INT4 | TECNO LJ9 | GPU (OpenCL) | 4,906 MB | same |
| Qwen3-4B, mixed INT4 | Desktop AMD Radeon AI PRO R9700 | WebGPU | 1,697 MB | same |

Observations, all unverified:

- On the iPhone 17 Pro, the reported GPU peaks are 5.3 to 5.7 GB across 0.8B, 2B and 4B. They do not scale with parameter count. CPU peaks run from 1.2 to 1.7 GB.
- The Qwen3-4B figures range from 1.6 to 4.9 GB across phones. The publisher notes results depend on device, OS, thermal state, battery mode and runtime version.
- A secondary Artificial Analysis article estimates 4-bit memory at about 3 GB for 4B and under 2 GB for 2B and 0.8B. It does not name its method. Source: [Artificial Analysis](https://artificialanalysis.ai/articles/qwen3-5-small-models). These estimates are below the GPU peaks above, so treat them as unverified.
- The Ollama figures (1.2 to 4.0 GB for 0.8B to 4B) are download sizes, not RAM. Source: [Ollama](https://ollama.com/library/qwen3.5).
- Official Qwen3-4B-GGUF Q4_K_M is a 2.5 GB file. That is a file size, not a RAM requirement.
- **Conclusion:** no 4-bit RAM figure for a small Qwen model is confirmed on a phone we can check. The project doc's rule to measure on the target hardware is supported by these conflicting figures.

## 5. Limitations relevant to health or exercise advice

- **No card has a hallucination, medical-disclaimer, safety or refusal section.** I read the Qwen3-0.6B, 1.7B, 4B and 4B-Instruct-2507 cards, plus the Qwen3.5 0.8B, 2B and 4B cards. None has such a section.
- **Medical benchmarks without a disclaimer.** The Qwen3.5 2B card lists medical visual question answering benchmarks (SLAKE, PMC-VQA). The 0.8B card also cites medical VQA benchmarks. Neither card has a medical-use disclaimer. Sources: [0.8B card](https://huggingface.co/Qwen/Qwen3.5-0.8B), [2B card](https://huggingface.co/Qwen/Qwen3.5-2B).
- **Stated intended use.** The 0.8B and 2B cards say the intended use is "prototyping, task-specific fine-tuning, and other research or development purposes." The Qwen3.5-4B-Base card says it is not meant for "direct interaction." Source: [4B-Base card](https://huggingface.co/Qwen/Qwen3.5-4B-Base).
- **Thinking loops.** The 0.8B card says it "is more prone to entering thinking loops compared to other Qwen3.5 models." The 2B card says the same. Sources: [0.8B card](https://huggingface.co/Qwen/Qwen3.5-0.8B), [2B card](https://huggingface.co/Qwen/Qwen3.5-2B).
- **Low benchmark scores.** The 0.8B card reports GPQA Diamond at 11.9 in thinking mode. Source: [0.8B card](https://huggingface.co/Qwen/Qwen3.5-0.8B).
- **Decoding cautions.** Qwen3 cards say "DO NOT use greedy decoding" in thinking mode, because it can cause "endless repetitions." Source: [Qwen3-4B card](https://huggingface.co/Qwen/Qwen3-4B). A presence penalty of 1.5 is suggested, and higher values "may occasionally result in language mixing and a slight decrease in model performance." Source: [Qwen3.5-4B card](https://huggingface.co/Qwen/Qwen3.5-4B).
- **Long context.** Static YaRN "potentially impacting performance on shorter texts." Source: [Qwen3.5-4B card](https://huggingface.co/Qwen/Qwen3.5-4B).
- **Implication.** None of the cards gives evidence for health, injury or exercise advice. Safety rules must stay in the app's deterministic layer, as the project doc already requires. The model should not be relied on for symptom or medical judgements.

## 6. Instruction following with short outputs

- **Closest confirmed candidate: Qwen3-4B-Instruct-2507.** Apache-2.0, non-thinking only, so no `<think>` blocks. The card highlights "Significant improvements in general capabilities, including instruction following" and "Markedly better alignment with user preferences in subjective and open-ended tasks." Source: [card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507). It is 4B, the largest option in the range. The card does not claim tuning for short outputs.
- **Qwen3.5 0.8B and 2B** are non-thinking by default (cards above). That avoids the thinking default, but their cards make no short-output claim. The 0.8B card reports low benchmark scores, and both cards warn about thinking loops.
- **Qwen3-1.7B** is hybrid and thinks by default. Use `enable_thinking=False` to get direct answers. Source: [Qwen3-1.7B card](https://huggingface.co/Qwen/Qwen3-1.7B). I did not confirm the 0.6B default on its card. The LiteRT Community Qwen3-0.6B conversion ships a separate no-think file. Source: [Qwen3-0.6B-int4](https://huggingface.co/litert-community/Qwen3-0.6B-int4).
- **No small Qwen card says it is tuned for one or two sentences.** Output length has to be enforced by the app: a token cap, a strict schema and a fixed prompt structure. Quality still needs testing on our own workout data.
- **I did not find a 0.6B or 1.7B Instruct-2507 variant,** but the organisation listing I could read covers only 10 of 468 models, so that absence is unverified.

## Notes for docs/on-device-models.md (not edited)

- The "XNNPACK 4-bit" label should read `8da4w`, the repository's own label. The definition is unverified.
- The sizes in the project doc (482 MB, 1.2 GB, 2.5 GB) match the repository's 8da4w files if they are read as binary units. Pick one unit convention for the download screen.
- The "ExecuTorch 1.4.1" claim matches the README. An earlier summary of the repository root said v0.6.0, which I could not reconcile.
- The "MLX" builds are ExecuTorch `.pte` files with the MLX backend, not `mlx-lm` files.
- Qwen3.5 has no ready-made React Native export. Adopting it means our own conversion or a third-party GGUF. The doc should say that.
- Qwen3-4B-Instruct-2507 and the official Qwen3 GGUF options are not in the project doc.

## What I could not verify

- **Exact byte counts** for most files. Figures come from WebFetch summaries, not the Hugging Face API, which the egress policy blocked.
- **Small Qwen3.6, 3.7 and 3.8 models.** Pages returned HTTP 401: Qwen3.6-4B, Qwen3.6-2B, Qwen3.6-0.8B, Qwen3.7-4B, Qwen3.7-27B, Qwen3.8-4B, Qwen3.8-2B. Qwen3.5-0.8B-GGUF also returned 401. A 401 may mean missing or gated.
- **Qwen3.7 status after June 2026.** The only source is a June secondary article.
- **Qwen3.5 blog content.** The Qwen blog page (qwen.ai/blog?id=qwen3.5) returned no article body. The release date rests on GitHub news, [Gigazine](https://gigazine.net/gsc_news/en/20260303-qwen-3-5-small) and the collection's dates.
- **Qwen3-1.7B-GGUF file list.** I read only the repository summary, which lists Q8_0.
- **ExecuTorch version conflict.** README says v1.4.1. One earlier summary of the repository root said v0.6.0.
- **llama.rn support for the Qwen3.5 architecture,** and whether llama.rn works in an Expo development build.
- **A React Native binding for LiteRT-LM,** and any ExecuTorch export of Qwen3.5.
- **Independent memory figures.** Every figure is publisher-reported. None was measured by us, and none covers our target devices.
- **Licences of the newer large models** (the "custom license" claim is secondary-only and not a small model).
- **Qwen3Guard-Stream 0.6B and 4B.** Listed only. I did not read their cards, licences or purpose.
- **Health and exercise accuracy.** No evaluation was done. The cards are silent on it.
- **Whether any small Qwen3.6, 3.7 or 3.8 model is announced** outside pages I could read.
- **Qwen3-0.6B and 1.7B 2507 instruct variants,** which the partial organisation listing did not show.
- **Trademark or naming questions** are out of scope for this check.

## 8. Runtime requirements and the device gate (added 8 October 2026)

Taken from the React Native ExecuTorch README and package peers, and from a browser-runtime pass. These are documentation and package-page facts. Nothing here was run on a phone or in a browser by us, and no RAM or speed figure below is a measurement.

**Native route (react-native-executorch 0.10.5, MIT):**
- Requires the New Architecture, iOS 17 or later, and Android 13 or later according to its README. The runtime's native build needs Android minSdk 26. `mobile/app.json` does not set it yet.
- Needs a development build. Expo Go cannot load it.
- Peer dependencies: `react-native-worklets` >=0.10.0 <0.13.0 (the current SDK 57 bundle uses 0.10.1; the newest 0.13.0 is outside the range) and `react-native-blob-util` ^0.24.0.
- Qwen3 0.6B XNNPACK 8da4w: about 482 MB, with a context of 2048 in its config. 1.7B is about 1.2 GB and 4B about 2.5 GB. These are file sizes, not RAM requirements.

**Browser route (Qwen3 in the website, for comparison):**
- transformers.js 4.3.1 has WebGPU support, marked experimental.
- WebLLM 0.2.85 lists Qwen3 q4f16 GPU memory estimates of about 1,403 MB (0.6B), 2,037 MB (1.7B) and 3,432 MB (4B). These are the library's estimates, not measurements on any device.
- ONNX downloads: about 570 MB (0.6B), 1.43 GB (1.7B) and 2.8 GB (4B).
- WebGPU needs Safari 26 or later on Apple devices, or Chrome 121 or later on Android 12 or later with a Qualcomm or ARM GPU. Some ONNX and MLC repositories show no licence, so the licence must be checked per file before any download is offered.

**Recommended order (owner decision still needed for each step):**
1. Browser WebLLM with Qwen3 0.6B on the owner's Android Chrome, as an opt-in download of about 570 MB with a new dependency (`@mlc-ai/web-llm`).
2. Native react-native-executorch with Qwen3 0.6B 8da4w after the first Android development build.
3. Hold 1.7B and 4B until at least two phones in different RAM classes pass the test below.

**Device gate before any larger model is offered:** 20 test responses per phone, measuring time to first token, prefill and decode tokens per second, peak RAM, load time, battery use, and temperature over 10 to 15 minutes of use. Record the phone model, OS, runtime version and model revision with each result. A device that fails the gate is not offered the larger model, and the app keeps the deterministic summaries.

**Still open:** no device has been tested; no phone RAM figure in the README; no benchmark for our prompts; the accuracy of the model's explanations for health and exercise questions has not been evaluated.
