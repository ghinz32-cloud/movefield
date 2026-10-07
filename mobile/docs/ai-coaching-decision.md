# Post-workout AI: implementation decision

Reviewed 7 October 2026. Current prototype: deterministic workout review only. No model calls, paid endpoint, server quota implementation, production accounts or secret have been added.

## Recommendation

Keep prescription and acceptance in the tested training engine. Evaluate GPT-6.1 Sol at low reasoning effort against GPT-6 Astra for clear explanations of a completed workout. Use the least expensive model that passes the same held-out, evidence-labeled tests. Luna is a candidate for narrow adult summaries, not a presumed substitute for Astra. Youth use needs a separate design and evaluation under OpenAI's under-18 guidance; do not route children to the cheapest model by default.

The app now shows a rules-based review on Today and in recorded-workout details. It handles partial work, unknown weights, effort, symptoms, coach ownership and running-specific guidance. It cannot assess form or diagnose. The mobile starter shares this logic. There is no chat field.

## Illustrative cost, not a measured quote

Assume 16 reviews per user per month, each with 2,000 input tokens and 500–2,000 TOTAL billed output tokens. Reasoning is included in billed output; a 500-token visible answer can cost more than 500 output tokens. Standard short-context rates, USD, checked on the date above.

| Model | Input / output per million tokens | One review | One user/month | 1,000 users/month |
|---|---|---|---|---|
| GPT-6 Luna | $0.10 / $0.50 | $0.00045–$0.0012 | $0.0072–$0.0192 | $7.20–$19.20 |
| GPT-6.1 Sol | $2 / $10 | $0.009–$0.024 | $0.144–$0.384 | $144–$384 |
| GPT-6 Astra | $10 / $50 | $0.045–$0.12 | $0.72–$1.92 | $720–$1,920 |

Formula: inputTokens × inputRate / 1,000,000 + billedOutputTokens × outputRate / 1,000,000. Excludes cache-write charges, retries, hosting, taxes, other features and higher token use. These endpoints are billed separately from a ChatGPT subscription. A low token limit can cause an incomplete response without a visible answer; measure usage before choosing limits. GPT-6 prompt-cache writes have separate pricing and spaced-out workouts do not guarantee cache hits. No savings are assumed above.

## Production contract before enabling a model

- Server endpoint accepts only a saved workout ID. Server authentication checks ownership and loads canonical completed records; the client cannot assert eligibility.
- Atomic database uniqueness for account + workout + policy version. Concurrent taps/devices return one stored result or pending state. Reopening never regenerates.
- Reserve worst-case cost atomically before a call. Enforce account, daily/monthly, concurrency and global limits. Provider spend limits supplement application controls; enforcement can lag.
- One bounded response. No conversation endpoint. Changes to a record mark the report outdated; regeneration is a separately metered action, never an automatic call on each edit.
- Cap input size, total output including reasoning, time and retry count. Reconcile uncertain timeouts rather than paying for blind repeated attempts.
- API secrets stay on the server. No keys in Expo/public environment variables, local storage or logs. Minimize data and define retention/consent; store:false is not a guarantee of zero provider retention.
- Provide versioned evidence snippets, relevant recent history and engine-generated candidate proposal IDs. No open web/tool access. Notes and imported text are untrusted data, never instructions.
- Validate the strict response schema and known fact/evidence/proposal IDs. **This does not prove free text is correct or safe.** Keep engine-owned facts and next steps authoritative, evaluate prose, and fall back on incomplete/refused/invalid/stale responses. The current prototype does not render model output.
- Never accept model-authored Session patches. User-approved changes go through current-state engine checks; the model cannot invent a weight, exercise, date or training dose.

## Quality gate

Use the same held-out adult/youth/running/strength cases for each model. Include partial sets, missing RIR, stale history, new machine setup, per-hand loads, huge available increments, pain, recent breaks, competition proximity, coach-owned plans, conflicting notes and prompt injection. Score factual accuracy and allowed actions against versioned evidence and rule expectations; also evaluate readability, relevance and usefulness. Independent review can add assurance, but is not a dependency for completing this prototype. Measure cost and latency distributions, not one best example. Astra can help with offline comparison, but is not the scientific ground truth. Server concurrency/quota/ownership tests are still future work because no production endpoint exists.

## Official references

- Models: https://developers.openai.com/api/docs/models
- Pricing: https://developers.openai.com/api/docs/pricing
- Reasoning and output limits: https://developers.openai.com/api/docs/guides/reasoning
- Structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Spend limits: https://developers.openai.com/api/docs/guides/spend-limits
- Youth guidance: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- Data controls: https://developers.openai.com/api/docs/guides/your-data
- Evaluation: https://developers.openai.com/api/docs/guides/evaluation-best-practices
