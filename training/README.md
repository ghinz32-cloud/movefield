# Qwen source-selection experiment

This trains the narrow task defined by `lib/fitness-grounding.ts`: select at most two reviewed note IDs, or decline. It does not train a clinician, exercise-technique assessor, plan generator or load calculator. The app's deterministic training rules retain authority.

The default system prompt is generated into `qwen-evidence-v1/default-prompt.txt` from the exact app contract. The dataset contains 132 original synthetic training cases and 34 validation cases, using the app's reviewed original summaries. No user records, forum posts, paper full text, research-archive abstracts/metadata or held-out answers are used. Topic-template families, case IDs and questions are disjoint between training and validation; repeated topics limit generalization claims. Regenerate only when deliberately creating a new dataset version; retain the input used by previous experiments.

## Prepare and verify

```bash
node scripts/prepare-qwen-training.cjs --check
node scripts/check-qwen-training.cjs
python3 scripts/train-qwen.py --preflight
```

Preflight checks provenance, exact file/corpus/contract fingerprints and target boundaries without downloading weights or training. It reports missing dependencies separately.

## Install an isolated training environment

Use a separate Python environment. `requirements.txt` pins the tested top-level packages; `cpu-linux-py312-freeze.txt` records the actual CPU experiment environment. Transformers 5.19.0 was inspected but is newer than the repository's seven-day release-age policy; 5.18.0 was selected. GPU users must install a compatible official PyTorch CUDA build for their own hardware.

The tested CPU setup was Linux x86-64/Python 3.12:

```bash
python3 -m venv .sites-runtime/qwen-training-env
.sites-runtime/qwen-training-env/bin/python -m pip install 'https://download-r2.pytorch.org/whl/cpu/torch-2.14.1%2Bcpu-cp312-cp312-manylinux_2_28_x86_64.whl#sha256=5a6363570c753812540a05eb82380e329469cbe668643e88111414c12627711f'
.sites-runtime/qwen-training-env/bin/python -m pip install -r training/requirements.txt
```

Training downloads the public base model at immutable revision `c1899de289a04d12100db370d81485cdf75e47ca`, verifies its 1,503,300,328-byte safetensors file against SHA-256, and uses `trust_remote_code=False`. The base weights, framework and memory requirements differ from the 356.9 MB quantized browser artifact. No hosted inference, Hub upload, account, paid compute or telemetry is enabled by the job.

## Run

Bounded CPU pilot used in this checkpoint:

```bash
.sites-runtime/qwen-training-env/bin/python scripts/train-qwen.py --cpu --pilot-steps 16 --threads 4 --output .sites-runtime/qwen-adapter-pilot
```

Full experimental recipe on suitable hardware:

```bash
python scripts/train-qwen.py --epochs 3 --output .sites-runtime/qwen-adapter-full
```

CPU full training also requires explicit `--cpu`. An existing non-empty output directory is refused. LoRA rank 8 targets query/value projections, with assistant-only loss, ignored prompt/padding labels, no truncation, 2,048-token context and a 256-token output reserve. The publisher's non-thinking template is used. The job records actual training examples, changed adapter fingerprints, steps, runtime, process memory, local artifacts and validation loss. A pilot checks four validation cases; loss is not source-selection accuracy.

## Evaluate separately

The existing 22-case held-out suite is never training material. A CPU adapter has a separate evaluator because it cannot qualify an immutable WebGPU/native model candidate:

```bash
node scripts/evaluate-qwen-cpu.cjs --prepare .sites-runtime/qwen-cpu-prompts.json
.sites-runtime/qwen-training-env/bin/python scripts/run-qwen-cpu-evaluation.py .sites-runtime/qwen-cpu-prompts.json .sites-runtime/qwen-adapter-pilot .sites-runtime/qwen-cpu-results.json
node scripts/evaluate-qwen-cpu.cjs --grade .sites-runtime/qwen-cpu-results.json .sites-runtime/qwen-cpu-report.json
```

The runner receives prompts only, generates each independent eligible case in three fresh sessions, records raw output/tokens/timing, and never invokes gated workflows. The grader resolves canonical notes and measures the unchanged rubric. Generated explanations or prescriptions fail the contract. Human relevance review remains required.

## Browser promotion remains separate

The demo currently uses the verified publisher artifact. A PEFT adapter is not a WebLLM weight file. Before replacing the demo model: independently review results, merge/convert/quantize the adapter for MLC, create a new immutable byte/hash manifest, preserve required Apache notices, obtain a fresh download consent, then rerun actual tokenizer/output/context and interruption/latency/memory tests on supported secure WebGPU browsers. Evaluate the final artifact at the demo's sampling settings. Do not edit qualification records to make an untested adapter appear available automatically.

Primary references: [Qwen pinned model card](https://huggingface.co/Qwen/Qwen3-0.6B/blob/c1899de289a04d12100db370d81485cdf75e47ca/README.md), [official PEFT quicktour](https://github.com/huggingface/peft/blob/main/docs/source/quicktour.md), [Qwen3 Transformers documentation](https://huggingface.co/docs/transformers/main/en/model_doc/qwen3), [WebLLM model deployment](https://webllm.mlc.ai/docs/user/deploy-models.html).
