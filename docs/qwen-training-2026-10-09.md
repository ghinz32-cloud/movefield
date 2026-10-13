# U15 — approved training checkpoint recovery

The user explicitly approved publishing the completed source and handoff range on 9 October 2026 UTC. Workspace maintenance removed local checkout/commit `1df2471e74c33bb6c3aaa8e7b9736e4b29f97297` before publication. The saved pilot archive survived. The trainer, exporter, evaluator and deterministic dataset were restored from the earlier source/edit history and surviving baseline. Their SHA-256 fingerprints match the saved training/evaluation records exactly, including dataset manifest `35ce4cacc84faa6dee160d13ded52563e9ca8f2c7a0ee839367177ed6b954836`. Original Git metadata and the old complete tree were not recovered; this is a new reconciled checkpoint.

The current review baseline advanced to `c390b1208869a746417cd35655f1d0ce3e2a268b`. Its browser runtime repairs, 2,048/256 token contract, escaped data delimiters and separate 132/34 CPU pilot/66-run evaluation evidence are preserved. Original Qwen commit `0597d5ebc46864bc3066d54ece13e645dd54dd41` is retained as an additional parent so that exact source snapshot stays recoverable without replacing the newer active runtime. Its three original Qwen source modules are also retained for the restored experiment's exact runtime-source fingerprint; app entry points continue to use the newer runtime.

## Recovered training and measured results

The restored export contains 162 original synthetic training and 44 development-validation examples, covering single/two-note selection, competing notes and unsupported questions. Contexts are fictional and passages are reviewed original summaries with population/limitations. No personal records, paper full text, archive abstracts or forum text is used. The locked evaluation is consulted only for normalized question/case-ID exclusion and immutable fingerprinting, never for training labels.

The original 16-step Qwen3-0.6B CPU bfloat16 LoRA pilot consumed 16 unique cases, updated 1,146,880 trainable parameters, took 99.63 seconds and recorded 2,928,914,432-byte peak process RSS. The default prompt, 1,024-token context and 192-token output reserve describe this historical development experiment, not the newer browser configuration. All saved artifact hashes/ZIP CRC pass. No training or model generation was rerun during recovery.

| Saved development comparison | Base | Adapter |
| --- | ---: | ---: |
| Training-split sample | 0/4 | 3/4 |
| Validation-split sample | 0/4 | 3/4 |
| Strict reply contract accepted | 0/8 | 8/8 |

Both errors selected a note when the unsupported question required abstention: `unsupported-load-0` selected `weekly-dose`; `unsupported-purchase-0` selected `load-goal`. Keep this adapter disabled. These eight authored development cases are separate from the newer branch's older-pilot locked evaluation; shared source topics and a small sample limit generalization. Training loss/CPU timings are not browser/native qualification.

Preflight regenerates the canonical manifest and enforces source/model/prompt fingerprints. Training masks prompt/padding and supervises only JSON continuation tokens; actual publisher-template equality and tokenizer budgets are checked without truncation. Base/adapter/model configuration hashes and the immutable base revision are retained. Training uses cached files by default, requires an explicit download flag for online access, and never publishes an adapter. Development evaluation is always offline. Reproduction commands and limits are in `training/README.md`.

## Fresh validation and publication

Recovery passes 650 integrity/masking/separation assertions, four evaluator tests, all 33 regression suites, web TypeScript and lint of the three restored modules. Existing historical validation files are preserved; freshly generated results have separate names under `docs/qa/u15/`. No new production/native/device validation is attributed to source recovery. Exact measured pilot/evaluation records are `docs/qa/u15/training-result.json` and `development-evaluation.json`. Exact requirements bytes at the original run are saved separately; current pins are identical with an updated documentary comment.

Publication targets only `ghinz32-cloud/movefield`, existing `audit/2026-10-08-quality`, with expected-head protection and independent remote/tree/file readback. The earlier automatic approval rejection was superseded by this user's explicit approval. No main merge, deployment, account change or paid service is authorized by this checkpoint.

Current checkout `/workspace/scratch/30756d258ac2/movefield`, branch `audit/2026-10-09-approved`. Resolve its commit through `git log -1 --format=%H -- docs/qwen-training-2026-10-09.md`. After commit, local recovery bundle/metadata are `.sites-runtime/checkpoints/approved-u15-complete.bundle` and `approved-u15-checkpoint.json`; only a verified GitHub update constitutes durable source publication. The trained artifact remains separately saved as `Movefield_Qwen_Training_Pilot_2026-10-09.zip`.

Next: strengthen original unsupported-question development examples, then use a separately pinned merged/compiled artifact and exact deployed-protocol evaluation before enabling it. Current browser delimiter repair is already present on the newer baseline; do not reintroduce the historical raw-prompt worker. Secure WebGPU, Android/device, storage/account and dependency release requirements remain open.

Publication result: automatic approval review rejected the push of source commit `b40219119ecaf334cb7c72d0f515a9092e67693c` because the trusted approval named the previous commits rather than this recovered/reconciled payload. Nothing was pushed. No alternative route or retry was used. A documentation checkpoint records this blocker and the exact source/tree/parents for concrete approval. All source/data fingerprints and prior fresh validation remain unchanged.
