# Offline workout coaching: research and editorial rules

Reviewed 16 October 2026 for Movefield and Grizzly. This research informs optional static messages before and after workouts. It does not change exercise prescriptions, progression, schedules, recovery rules or coach authority.

The recommended approach is short, specific feedback grounded in saved work and the person's own report, followed by a manageable choice. Recognize useful actions and treat interruptions neutrally. A concern or training hold takes precedence over encouragement to continue.

Seven official CDC/NHS pages were substantively reviewed. These are public-health guidance, not controlled trials validating the proposed message bank. No claim is made that a particular phrase improves adherence or self-efficacy. The exact wording, tone choices, message frequency and template composition remain product decisions that need usability testing.

## Sources and actual review depth

| ID | Source and sections read | Supported use and limit |
|---|---|---|
| CDC-START | [Adding Physical Activity as an Adult](https://www.cdc.gov/physical-activity-basics/adding-adults/index.html), dated 4 December 2025. Read overview, planning, enjoyment, tracking and health-concern sections. | Supports setting goals, choosing enjoyable activity suited to ability and tracking activity. General adult recommendations do not prescribe the next workout or validate motivational wording. |
| CDC-GOALS | [Steps for Losing Weight](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html), dated 17 January 2025. Read steps 2–5 on tracking, achievable goals, setbacks, support and review. | Supports specific realistic process goals, expected setbacks, individual fit and recognition of progress. Use only these communication principles; do not infer a weight-loss goal or import diet, calorie or weight-change targets. |
| CDC-BARRIERS | [Overcoming Barriers to Physical Activity](https://www.cdc.gov/physical-activity-basics/overcoming-barriers/index.html), dated 5 February 2025. Read time, support, energy, motivation, injury concerns, skill and access sections. | Supports activities that fit time/resources, scheduling and gradual confidence building. Does not establish readiness for a particular load or authorize additional work. |
| NHS-ACTIVE-TIPS | [How to be more active](https://www.nhs.uk/better-health/get-active/how-to-be-more-active/). Read small starts, routine, enjoyment, tracking, rewards and planning sections. | Supports manageable starts, chosen activities, tracking and planning when/where. General “more activity” wording must not become an instruction to add resistance-training volume without review. |
| NHS-GET-ACTIVE | [Get active](https://www.nhs.uk/better-health/get-active/). Read beginner app features, pacing, goal tracking and accessible activity options. | Supports flexibility and presentation choice. Feature descriptions are not evidence that this app's messages or a particular trainer voice are effective. |
| NHS-EXERCISE | [Physical activity guidelines for adults aged 19 to 64](https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/). Read opening health/fitness context and adult activity guidance. | Supports matching activity to current fitness and seeking appropriate advice for medical concerns. It does not clear injury, youth training or return to sport. Population targets are not universal daily goals. |
| NHS-RUN-INJURIES | [Knee pain and other running injuries](https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/). Read opening pain guidance, injury sections and gradual return discussion. | Supports avoiding encouragement to run through pain and recognizing that recovery depends on the condition. Running-specific treatment details and return intervals must not be turned into universal app rules. |

The NIDDK habit-change page, NICE PH49 recommendations, HHS activity-guidelines PDF, NIH News in Health habits article, the original self-determination review publisher and SAMHSA's publisher PDF were denied by the managed proxy. NCBI copies of the proposed self-determination review and SAMHSA chapter returned HTTP 200 containing only a CAPTCHA. None were read substantively or used as reviewed evidence. No denial or challenge was bypassed.

Access details, exact requested/final URLs, timestamps, response hashes, section-level review notes and claim-to-rule mappings are in `.sites-runtime/coaching-2026-10-16/evidence-receipt.json`. Downloaded source material remains in that ignored runtime directory; it is not redistributed in the app.

## Claim-to-rule guidance

| Rule | Evidence or authority | App behavior |
|---|---|---|
| COACH-CHOICE: preserve choice | CDC-START, CDC-GOALS, NHS-ACTIVE-TIPS; editorial interpretation | Offer one useful process focus or review action. Let users dismiss messages or choose less coaching. Avoid commands that imply obedience, shame or loss of permission to rest. |
| COACH-PROCESS: keep goals specific | CDC-GOALS, CDC-BARRIERS | Refer to the accepted workout and an observable process, such as checking setup or recording actual reps. Do not promise growth, weight loss or a personal record. |
| COACH-FACTS: describe actual work | CDC-GOALS, CDC-START, NHS-ACTIVE-TIPS | Count saved, completed work only. Keep unknown load distinct from zero and a partial session distinct from a completed session. Say “logged here” when activity outside the app could be missing. |
| COACH-COMPARISON: compare valid contexts | Existing data-integrity requirements | Only show historical comparisons when exercise identity, units, side, machine/setup, load role and other existing comparability requirements match. Raw tonnage, additional sets or a larger number on another machine do not establish a strength gain or PR. |
| COACH-SETBACKS: normalize interruptions | CDC-GOALS, CDC-BARRIERS | A gap can prompt a manageable next step. Do not infer laziness, injury, failed commitments or lost fitness. Do not propose catch-up sets to repay a missed workout. |
| COACH-SELF-EFFICACY: acknowledge specifics | CDC-BARRIERS, CDC-GOALS; editorial application | Recognize a recorded action or a process goal the person actually met. Do not claim effort, confidence, enjoyment or technique that was not reported or observed. No measured self-efficacy improvement from this wording is claimed. |
| COACH-RECOVERY: concerns come first | NHS-RUN-INJURIES, NHS-EXERCISE, CDC-START plus existing eligibility rules | Honor symptoms and holds before ordinary motivation. Encourage pausing the provoking activity and appropriate assessment when warranted. Do not diagnose or declare someone recovered. |
| COACH-FEEDBACK: reflect the person's report | CDC-GOALS, CDC-BARRIERS | Distinguish “harder,” “easier,” “about right” and unknown. Invite review when relevant. A hard session does not prove overtraining; an easy one does not authorize an increase. |
| COACH-AUTHORITY: separate feedback from prescription | Existing product requirement | Keep loads, schedules, RIR targets, source-program rules and youth/coach restrictions authoritative. Coaching text cannot silently alter them. |
| COACH-TONE: vary style without changing meaning | Individual-fit guidance; product decision | Calm, direct and Grizzly voices can vary an opening or brief encouragement. They must retain the same facts, safety meaning and clear controls. Avoid body-shaming, food-compensation messages and comparisons with other users. |
| COACH-FREQUENCY: keep it optional | Product usability decision | Show brief messages at appropriate before/after moments, with detail on request. Do not repeatedly interrupt logging or rest. No reviewed source establishes an optimal message frequency. |
| COACH-VARIETY: describe the bank honestly | Product transparency requirement | Distinguish authored templates from possible combinations. Do not label combinations as thousands of independently reviewed messages, live AI reasoning or individualized scientific conclusions. |

“Autonomy-supportive” describes the intended tone: preserving choice, respecting the user's reasons and avoiding pressure. The self-determination theory review was inaccessible in this pass, so it is not cited as substantively reviewed evidence for that design. Similarly, manageable actions may support confidence, but the app must not claim it measured or improved self-efficacy.

## Before and after workouts

Before a workout, choose the message in this order: existing concern/hold or authority restrictions; actual plan and readiness context; an eligible comparison with prior logged work; a brief process focus. If history or feedback is absent, use a neutral first-session message. A logging gap alone does not prove detraining or justify a numerical reduction.

After a workout, use only the successfully saved record. Explain a save failure through the existing recovery flow before any success message. Describe completed versus partial work accurately, reflect explicit feedback, and offer a review when appropriate. Completing more sets than previously recorded is a factual difference, not proof of improved fitness.

Useful original wording examples below illustrate the rules; they are not validated scripts or additions to the production message bank:

| Situation and required fact | Example |
|---|---|
| Accepted workout exists; no concern or hold | “Your plan is ready. Take a moment to check the first exercise and its setup.” |
| Eligible comparable history exists | “Last time with this exercise and setup, you logged {verified result}. Review today's target before you begin.” |
| Some completed sets were saved; session is partial | “Your {count} logged sets are saved. You can review what you completed without filling in the rest.” |
| Explicit “harder” feedback | “You marked this session harder than planned. Keep that note in view when you review the next workout.” |
| Explicit “easier” feedback | “You marked this easier than planned. Review the existing progression guidance before changing the target.” |
| No recent history in the app | “There isn't a recent workout logged here. Choose a manageable next step.” |
| Recorded concern | “You flagged a concern. Pause the activity that brought it on and review it before continuing.” |
| Feedback is unknown | “Your work is saved. If you want, add how the session felt.” |

Do not use “perfect form,” “you gave everything,” “stronger than ever,” “burn off what you ate,” “no excuses,” “pain means progress,” or “you earned your rest” as generic praise. These phrases either assert facts the app cannot know or apply pressure unrelated to the user's reviewed plan.

Some source pages contain competition, guilt or broad “more is better” language. Those examples are not adopted automatically. The product's established recovery rules, personal preferences and nonjudgmental tone take priority over copying a public-health page verbatim.

## Acceptance boundaries for implementation

- Exercise and machine histories remain separate; blank load, zero load, assistance, per-side work and unsupported estimates retain their existing semantics.
- Missing/partial/unsaved records never become completed-work praise. Old or unavailable feedback stays unknown. A saved “easier” report does not become an automatic load proposal.
- Concern, hold, youth supervision and coach-owned plan branches take precedence over ordinary challenge language.
- Messages use local saved facts without uploading profiles or claiming that an AI or person reviewed the workout. Future AI must preserve the same fact and authority boundaries.
- Message variety is deterministic and testable. Tests should verify truthful facts, branch precedence and clear fallback behavior, rather than asserting a physiological benefit of wording.
- Text should remain brief, readable and dismissible across both brands and supported screen sizes. More detail and source context belong behind an optional control.

No new numeric threshold for PRs, progression, RIR, recovery, return after absence or coaching eligibility is established by this research. Exact exercise technique, visual correctness and media rights are separate from complete fields or a well-formed reference link, and are not verified by this communication review.
