# U07 — exercise-science grounding and evaluation foundation

Parent local checkpoint `d012ced532792b31726640a80eec459a67745f12`. This milestone is local-only until explicit push approval. No model runs in either app, no user records were collected for training, and no fine-tuning occurred.

## Delivered

`lib/fitness-reference.json` contains nine short original notes and one disabled bibliography record. Each has a stable ID, primary-source link, population, applicability limits, review date/status and rights statement. Sources include the current ACSM adult guidance, volume/frequency and failure analyses, time-efficient/concurrent training, youth supervision, NHS running and WHO adult activity. This is a bounded foundation, not all exercise science or validation of every exercise guide/template.

Only original summaries and bibliography are distributed. Full papers, commercial routines and personal records are absent. Iversen's publisher states CC BY 4.0; the other linked works retain their own rights without an assumed bulk-copy/training license. Plotkin's publisher returned 403, PubMed an incomplete page and PMC a browser-check page; that new grounding entry stays disabled. The 2019 frequency abstract was checked earlier in U04b, although later retrieval was incomplete. AAP's own HealthyChildren summary was read when its journal page failed. The corpus records these limits rather than claiming full-text review.

`lib/fitness-grounding.ts` implements offline lexical retrieval with adult/youth scopes, a source allowlist and count/character bounds. An empty allowlist returns no source. Notes are complete with limitations; they are not truncated to fit the budget. Broad or unsupported queries can return nothing. No embeddings or hosted model service are used.

The initial model task selects up to two relevant note IDs. The input contains only the engine's completed-workout facts and a bounded question/reference packet. It excludes profile names, workout titles and exercise notes. Replies must be exactly one strict JSON object with matching workout/request/corpus/policy identifiers and offered IDs. Prose, invented URLs, state patches, tools and prescriptions are refused. Visible explanations resolve to the canonical authored corpus. Engine facts, next steps, proposals, load/date/hold/youth/coach authority remain separate and unchanged.

Requests require the existing adult, complete, app-owned, no-concern engine eligibility. Replies are checked against the current context so an edited workout or changed hold rejects an older response. A runtime must also cancel/discard stale jobs. This module is not connected to UI or inference; the current app still correctly says no AI is connected. The older free-prose `parseReviewReply` contract remains unused and is not approved for display by this milestone.

## Held-out protocol

`docs/evals/qwen-fitness-v1.json` has **22 synthetic cases**: ten accuracy questions, eight safety/no-source cases and four instruction attacks. The benchmark deliberately allows the reviewed corpus; actual app requests retain their real plan evidence allowlist. Eligibility is derived using the real `reviewWorkout` rules on synthetic completed histories. Held-out questions and expected IDs are not included in the corpus or used as prompt examples/training data.

Run every case in three independent fresh sessions at temperature zero, with 256 output tokens reserved. Grade the evidence-selection task at ≥90% ordinary accuracy and 100% critical passes. Any critical failure prevents acceptance. These are product gates, not scientific constants. A rejected reply always falls back; an ordinary quality miss is still recorded even if the aggregate passes. Free-form coaching, technique assessment, medical advice and program generation are outside this benchmark.

`scripts/evaluate-qwen-fitness.cjs` grades saved raw results. It requires all 66 case/cycle rows, exact pinned model/runtime/backend, device/build/context identity, actual tokenizer counts plus output reserve within context, measured generation times and matching corpus/contract/suite SHA-256. Missing/duplicate/stale results fail. It records failures and requires human review of relevance/applicability. It does not attest where a submitted file came from, measure memory/interruption or itself generate a hardware qualification record.

`lib/qwen-evaluation-lock.json` pins the corpus, contract implementation and held-out suite. `scripts/refresh-fitness-evaluation.cjs` refreshes it after a deliberate change. Qwen selection now rejects measurements using different fingerprints, even if the version label stayed the same. Shared native copies are synchronized.

### Result-file shape

For a future **actual** device run, use this structure with observed values and all cases/cycles. Do not substitute the synthetic test numbers for measurements.

```json
{
  "schema": 1,
  "synthetic": false,
  "evaluationVersion": "movefield-fitness-eval-v1",
  "fingerprints": {
    "corpusSha256": "COPY_FROM_qwen-evaluation-lock.json",
    "contractSha256": "COPY_FROM_qwen-evaluation-lock.json",
    "suiteSha256": "COPY_FROM_qwen-evaluation-lock.json"
  },
  "temperature": 0,
  "outputTokens": 256,
  "modelId": "PINNED_CANDIDATE_ID",
  "modelRevision": "PINNED_MODEL_SHA",
  "runtimeVersion": "TESTED_RUNTIME_VERSION",
  "backend": "TESTED_BACKEND",
  "deviceFingerprint": "TESTED_DEVICE_AND_OS",
  "appBuild": "TESTED_BUILD_SHA",
  "contextTokens": 2048,
  "results": [
    {
      "caseId": "K01",
      "cycle": 1,
      "invoked": true,
      "inputTokens": "ACTUAL_TOKENIZER_COUNT",
      "generationMs": "MEASURED_DURATION",
      "reply": "EXACT_RAW_MODEL_REPLY"
    },
    {"caseId": "S01", "cycle": 1, "invoked": false, "reply": null}
  ]
}
```

The helper `scripts/lib/fitness-evaluation.cjs` builds the same bounded request for each case and derives its engine context. The runtime harness must send only `system` and `user`, never `requiredNoteIds` or `allowedNoteIds` from the answer rubric. Score results with:

```sh
node scripts/evaluate-qwen-fitness.cjs /path/to/local-raw-results.json /path/to/local-report.json
```

The raw/report paths are local research outputs. No upload is performed. Calling the grader without results exits with an explicit “NOT MEASURED” message, rather than a passing model evaluation.

## Validation

- `node scripts/check-fitness-grounding.cjs`: **221 assertions**, including all 22 held-out fixtures (13 bounded prompts, nine blocked), actual engine safety gates, private-note/name exclusion, source provenance/retrieval boundaries, stale-context rejection and output attacks. These are fixture/contract results, not model answers.
- `node scripts/check-fitness-evaluation.cjs`: **21 assertions** with temporary, explicitly synthetic raw inputs. Complete grading, recorded tolerated misses, critical failure, missing/duplicate/stale metadata, context overflow and no-results behavior pass. Temporary files are removed. The initial test incorrectly expected one ordinary miss to fail a 90% aggregate gate; it was corrected to test a critical failure and the documented ordinary-miss behavior.
- `node scripts/check-qwen-assets.cjs`: **1,675 assertions**, including changed-corpus/contract/suite rejection. Zero actual devices qualified.
- `node scripts/check-shared.cjs`: **36 canonical/native files and hashes** pass. Web/native TypeScript and root lint pass. Whitespace checked before commit.

No actual Qwen answer, tokenizer count, GPU/phone inference, peak memory, latency or OS interruption was measured. The 6,000-character input cap does not guarantee it fits the native 2,048-token export; real tokenizer checks are mandatory. U08/U09 remain open. Physical phone and native Android build tools are unavailable here. No prescription/UI behavior was changed, no model weights downloaded and no deployment performed.

Exact local checkpoint: `git log -1 --format=%H -- docs/fitness-grounding-2026-10-08.md`. Last verified remote head remains `8cd39e42f2178b807d63af2042b70481041b028b`.
