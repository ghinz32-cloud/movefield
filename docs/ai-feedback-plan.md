# Optional on-device feedback: design and training plan

Status: design only. No model is installed, downloaded or tested in the app. The current review is fixed rules (`lib/workout-review.ts`) and says so on screen. Nothing in this document is a claim about measured phone performance.

## 1. What the feature does

After you finish the sets of one exercise, an optional on-device language model could write one or two plain sentences about that exercise: a form cue to check, or a note about effort or pacing. It does not change a plan, a load, a date or a hold.

Settings controls it (Automatic, Qwen3 0.6B, or Off). No model runs until one is installed and passes the tests in section 5. Plans, tracking and the fixed review work fully without it.

## 2. Authority: rules first, model second

1. Fixed rules decide everything that matters: loads, progression, holds, youth limits, equipment limits. The model cannot override them.
2. A pain or symptom answer of "yes" or "unsure" never goes to the model. The fixed wording in `lib/safety-copy.ts` (SEEK_CARE_TEXT) is shown instead.
3. Youth (under 18) sessions never receive model text about loads or intensity. Supervisor guidance stays with the supervisor.
4. The model receives only: the exercise name, the verified cue list for that exercise from `public/exercise-guides.json`, the sets you logged, and the effort answer. It does not receive your name, your age, your history or your notes.
5. Its output is checked before display (section 4). Anything that fails the check is replaced by the fixed review text.
6. No silent cloud fallback. If the on-device model is unavailable, the app shows the fixed text.

## 3. Model choice (verified October 2026)

Source: `docs/model-verification-2026-10.md`.

- **Qwen3 0.6B, 1.7B and 4B** are Apache-2.0, and they are the only small Qwen models with confirmed ready-made React Native ExecuTorch exports (Software Mansion). This is the most practical start.
- **Qwen3.5 (0.8B, 2B, 4B, 9B)** exists and is Apache-2.0, but no official quantised mobile build was found, and no React Native runtime was confirmed for it. It is a candidate to benchmark once a runtime exists. There is no Qwen3.5 model at 1.7B.
- **Phone memory is unverified.** Third-party conversions report large GPU peaks on recent iPhones. Those numbers are not from our tests and are not comparable across devices. Measure on each target device before choosing a size.
- **4B** only on hardware and runtime combinations that pass our benchmark (CLAUDE.md, "Model direction").
- **No model card mentions medical advice, hallucination limits or refusals.** We must add those tests ourselves (section 5).

**Decision (owner, October 2026): start with Qwen3 0.6B.** It is the smallest Qwen3 model with a confirmed React Native ExecuTorch export. Qwen3 1.7B and 4B stay as later options, shown only after section 5, step 6 passes on target phones. Qwen3.5 is not chosen, because no runtime for it has been confirmed.

The 0.6B download is about 0.5 GB for the 4-bit XNNPACK build (482 MB in the export README, 506 MB in the folder listing). That is a download size, not a memory figure. Memory use on each phone is still to be measured.

## 4. Output contract and checks

The model is asked for JSON with fixed fields:

```json
{"cue": "<one cue id from the list>", "sentence": "<one or two sentences, 40 words or fewer>", "effort_note": "<none | ease off | build reps | check load>"}
```

A response is shown only if all of these pass:

- valid JSON with exactly these fields, and the cue id is in the supplied list;
- at most 40 words, and no list formatting;
- no numbers except those in the input (loads, reps, sets must match the log exactly);
- no words from a banned list: diagnose, injury, tear, strain, fracture, rehab, medical, clearance, safe to train, "you should see", and any drug or supplement name;
- no instruction that contradicts the fixed rules (for example "add weight" when the rule says hold);
- no content from notes or exercise names beyond the exercise name itself (this blocks injected instructions).

Failures fall back to the fixed review text and are counted in a local-only log that you can clear.

## 5. How to train or tune it before go-live

Training here means building and testing the behaviour. Start with the cheapest step and only move on when the tests show a gap.

**Step 1: a verified corpus (no training).** Build a short list of allowed cues per exercise from `public/exercise-guides.json`, which already has source notes. Add verified facts from `docs/workout-evidence.json`. Check the licence of every sentence you reuse. Do not copy publisher prose.

**Step 2: a prompt and a template.** Write the instruction, the JSON contract and 6 to 10 worked examples written by a person. Test whether the model stays inside the contract without any tuning. Keep the prompt in the repository so changes are reviewed.

**Step 3: an evaluation set.** Write at least 300 cases before any tuning:

- 200 ordinary logs (sets, effort answers, exercises across all goals, including a bodyweight, a dumbbell and a machine exercise);
- 50 edge cases (missing loads, partial sessions, unknown effort, a set logged after a symptom answer, very long rests, unit changes);
- 50 safety cases (pain or symptom answers, youth sessions, requests for a diagnosis, notes that try to change the rules, exercise names that contain instructions).

Expected results are written by a person before the model is run. Safety cases expect the fixed text, not model text.

**Step 4: pass criteria (proposed; you decide).**

- Output passes the contract on at least 98% of ordinary cases.
- Zero banned-topic or number mismatches on the safety and edge sets.
- Zero safety cases where model text is shown instead of the fixed text.
- Two reviewers score 100 random outputs for accuracy and usefulness; both must rate at least 4 of 5 on average. A coach or clinician should review the cue content.

**Step 5: tuning, only if steps 2 to 4 fail.** Fine-tune with LoRA on pairs generated from the verified corpus and written by people, never on user records. Record the licence of the base model and of any data. Re-run the full evaluation set after every training run.

**Step 6: device tests.** On each target phone, measure time to first token, time to finish one response, peak memory and battery use across 20 responses. Record the phone model and OS version. Set a limit for each measure before the test, and do not change it afterwards.

**Step 7: release behind a switch.** Ship with the model off. Turn it on only after steps 3 to 6 pass for a given model size and device class. Show the disclosure below each response and offer "Report this feedback", which saves the response text and the input to a local log you can export or delete.

## 6. Disclosure copy

Shown where model text appears:

> This note was written by an on-device language model. It is general and can be wrong. It is not medical advice and it does not change your plan. Check it against the exercise guide and your own experience. Stop and seek care if you feel pain.

The fixed rule-based review shows the text in `AI_DISCLAIMER` (lib/safety-copy.ts) instead, so people know no model is involved.

## 7. Native build requirement

Expo Go cannot run an on-device model. The feature needs a native development build. See `docs/RUN-AND-HOST.md`.

## 8. What is not done

- No model is downloaded, bundled or tested on a phone. Qwen3 0.6B is the planned first model only.
- The React Native ExecuTorch package is not added to the phone app. Adding it needs the model files, a native build and a device test first.
- No evaluation set has been written.
- The output contract and the banned-word list are proposals.
- Model text is not shown anywhere in the app yet. The disclosure copy is stored in this document, not in the UI.
