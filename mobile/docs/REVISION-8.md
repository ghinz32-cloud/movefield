# Revision 8 — Matching programs and equipment substitutions

## What changed

- Re-clicking Weight training keeps the selected lifting discipline. Explore paths clears the previous program ID. Unknown goals and mismatched/unknown app program IDs fail explicitly.
- App-led choices are filtered by goal. A fit badge appears only on a compatible choice. The mobile Plan view has the same goal filter.
- The runnable catalog now includes 18 adult templates: three powerlifting, four powerbuilding, two bodybuilding, two hybrid, two general strength, two general fitness, two calisthenics, and one established-running-base plan. The separate NHS beginner run/walk sequence and honestly labeled general sport/youth foundations remain available.
- Powerlifting keeps squat, bench and deadlift as its defining lifts. Powerbuilding is an explicit separate choice. The misleading legacy “Strength & powerbuilding” title is now “Strength · full body.”
- Six established-program cards identify original authors and sources. These are source references, not scientifically validated or fully automated reproductions. Web users can create an explicitly empty user-entered tracking schedule; native users can open sources. Source-specific automatic progression is not implemented for these six named programs.
- Source references: TSA Beginner Approach, TSA Intermediate 2.0, Calgary Barbell 16-Week, PHUL, PHAT, Jacked & Tan 2.0. Partial tracking segments disclose original duration; tracking calendars reserve recovery gaps and require the user to check the original schedule.

## Equipment substitutions

Curated alternatives cover 31 exact movements across horizontal presses, incline presses, squat/leg-press work, hinges, rows, knee flexion, elbow flexion and triceps work. Similar broad muscle labels do not generate substitutions.

The chooser appears beside supported exercises in session details and the active workout on web, and beside supported next-session/active exercises in the native starter. It offers equipment filtering, an exact recording convention, replacement rep ranges/rest, and a review before applying. Default scope is this workout; the user may opt into future repeats of that workout.

Substitutions clear the old load, preserve separate exercise history, require a machine/setup label where relevant, prevent duplicate exercises, check duration and stale previews, and preserve A1/A2 instructions/set counts/rest for existing supersets. Replacing an SBD competition lift requires acknowledging the lost competition practice. Substitutions do not provide injury advice or medical clearance.

A currently active workout can continue across midnight. Actual reps, load, effort, optional measurements, notes, or a newly entered setup cannot be silently discarded by substitution. Completed records remain unchanged. Older generic squat-swap proposals are rejected in favor of the new chooser.

## Verification

126 automated web/domain checks pass, including 18 new selection/substitution checks. The existing 108-check suite remains passing. Native checks exercise 21 plan choices across seven start weekdays, saved-data validation, unknown-ID rejection, and substitution save/reload. Type checks, production web build and Android/iOS JavaScript exports are release checks for this revision; no physical-device or signed-binary testing is claimed.

Browser checks cover the reported parent-tile reset, PL/PB filtering, original-program tracking labels, acceptance updating Today and sidebar, active-workout equipment filtering, competition-specific acknowledgement, and cleared load after an accepted substitute.

## Sources checked 2026-10-07

- The Strength Athlete: https://www.thestrengthathlete.com/freebies
- TSA author-hosted beginner format: https://www.boostcamp.app/coaches/bryce-lewis/tsa-beginner-approach
- TSA author-hosted intermediate format: https://www.boostcamp.app/coaches/bryce-lewis/tsa-9-week-intermediate-approach
- Calgary Barbell: https://www.calgarybarbell.com/16-week-program
- PHUL, Brandon Campbell: https://www.muscleandstrength.com/workouts/phul-workout
- PHAT, Layne Norton: https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/
- Jacked & Tan 2.0, Cody Lefever: https://swoleateveryheight.blogspot.com/2016/07/jacked-tan-20.html

Authorship and broad format were checked. Public availability is not a license to rehost authors’ documents or videos. App-original prescriptions retain their own names and adaptive rules. Exact named-program imports still need complete specification, content-rights review where applicable, and expert validation of the implementation. Youth adaptations, sport-specific programming, real accounts, sync, and prior security-release gates remain separate work.
