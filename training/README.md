# Original Qwen evidence-selection development experiment

This export restores the approved 162-train/44-validation original synthetic dataset and the exact trainer/evaluator used for its 16-step CPU pilot. It does not train arbitrary prescriptions or use private workout records. Source passages are reviewed original summaries. Development questions and shared source topics do not establish scientific/clinical generalization; the locked evaluation is read only for exclusion/fingerprints.

Use Node with the repository's locked dependencies. Actual training needs Python 3.12 and an isolated environment with `requirements.txt`; the observed Linux versions are in `cpu-linux-py312-freeze.txt`.

```sh
node scripts/prepare-qwen-training.cjs
node scripts/check-qwen-training.cjs
python scripts/train-qwen.py --preflight
python scripts/train-qwen.py --cpu --cpu-dtype bfloat16 --pilot-steps 16 --threads 4 --output .sites-runtime/qwen-adapter-pilot
python scripts/evaluate-qwen-development.py --adapter .sites-runtime/qwen-adapter-pilot --output .sites-runtime/qwen-development.json --max-cases 4 --threads 4 --cpu-dtype bfloat16
```

Training defaults to cached files; `--allow-download` explicitly permits the pinned public base download. Evaluation always uses cached files. No command uploads data, changes the app catalog or publishes models. Output directories must be empty. CPU bfloat16 is deliberately selected for lower memory on supported CPUs; the original float32 attempt was killed with exit 137.

The experiment has 1,024 context tokens and 192 output tokens reserved, non-thinking ChatML, assistant-only loss, no prompt/padding targets and no truncation. It matches the preserved original worker source snapshot, not the newer 2,048/256 browser configuration. Newer runtime repairs and its separate CPU evaluation are unchanged. Do not connect the historical raw-prompt worker to app entry points.

The saved adapter achieved 6/8 correct development selections and failed both sampled unsupported-question cases. It remains disabled. A LoRA adapter is not an MLC browser artifact. Independent evaluation, a new immutable compiled manifest and secure browser/native device acceptance are required before integration. The locked suite/catalog candidate gate is a separate protocol; never label this development comparison as that qualification.
