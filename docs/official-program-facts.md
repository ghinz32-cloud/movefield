# Official programme facts (checked 2026-10-08)

Facts only, from primary public pages fetched on 2026-10-08. Unconfirmed values are marked **unverified**. Author prose is not copied. The machine-readable version is `official-program-facts.json` in this folder.

## Summary

| ID | Programme | Creator | Status | Days/week | Goal |
|---|---|---|---|---|---|
| NHS-C25K | Couch to 5K (NHS) | NHS | Verified | 3 | Running |
| SL-5X5 | StrongLifts 5x5 | Mehdi Hadim | Verified (session length unverified) | 3 | Strength |
| GZCLP | GZCLP | Cody Lefever | Partly verified (third-party wiki mirror) | 3 to 4 | Strength |
| 531-BEG | 5/3/1 for Beginners | Jim Wendler | Partly verified (free page only; full programme paid) | 3 | Strength |
| SS-BASIC | Starting Strength | Mark Rippetoe | Not found (free summary; paid book) | unverified | Strength |
| BE-JUMP-4W | Athletic Development Programme (Jump Higher) | Not stated; hosted by Basketball England | Partly verified (two copies disagree on schedule) | unverified | Jump |

Not found: a free, official 2-3 day beginner gym programme.

## NHS-C25K

- URL: https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/
- Days per week: 3. Session length: 25 to 40 min including 5-min warm-up and cool-down walks (derived from the intervals).
- Structure: weeks 1 to 9. Interval sequences are in the JSON. Week 5 and 6 sessions differ; weeks 7 to 9 are continuous runs of 25, 28 and 30 min.
- Progression: time increases week to week as tabled.
- Reset: no failure count. A week or run may be repeated; slow down or walk if needed.
- Rest: a rest day between runs.
- Terms: page footer shows a Crown copyright notice. NHS site terms (section 3) release content under the Open Government Licence v3.0. Logos, images, trademarks and third-party material are excluded. If Movefield adapts the content, use: "Contains public sector information licensed under the Open Government Licence v3.0." Do not attribute adapted content to the NHS website.
- Unverified: experience level, equipment.

## StrongLifts 5x5

- URLs: https://stronglifts.com/stronglifts-5x5/workout-program/ and https://stronglifts.com/stronglifts-5x5/failure/
- Days per week: 3, alternating A and B with a day off between. Two per week described as acceptable.
- Workout A: squat 5x5, bench 5x5, barbell row 5x5, assistance. Workout B: squat 5x5, overhead press 5x5, deadlift 1x5, assistance.
- Progression: add weight when all sets reach 5 reps. Default 5 lb; squat and deadlift 5 to 10 lb; upper lifts 2.5 to 5 lb; 2.5 lb microloads once progress slows.
- Reset: repeat the weight after a failed workout. If the weight fails three times in a row, reduce it about 10% and work back up. Per lift.
- Audience and equipment: new or returning lifters; Olympic barbell, plates, rack, bench.
- Terms: "© 2007-2026 Stronglifts" footer; no reuse statement. Free to read.
- Unverified: session minutes, assistance exercises and sets, reset rounding.

## GZCLP

- Primary: https://www.reddit.com/r/gzcl/wiki/GZCLP. Blocked from this environment. Facts come from a third-party mirror: https://reddit.sudovanilla.org/r/gzcl/wiki/GZCLP. Status is partly verified until checked against the primary.
- Days per week: 3 to 4. Workouts cycle A1, B1, A2, B2.
- T1: 5x3 with last set AMRAP (squat, overhead press, bench, deadlift). T2: 3x10 with no AMRAP (bench, deadlift, squat, overhead press). T3: 3x15 with last set AMRAP (lat pulldown, dumbbell row).
- Progression: T1 adds 5 lb (2.5 kg) upper or 10 lb (5 kg) lower after a completed session. T2 cycles 3x10, 3x8, 3x6. T3 not stated.
- Reset (T1): fail 5x3, go to 6x2; fail 6x2, go to 10x1 starting at the failed weight; fail 10x1, retest 5RM and restart at 5x3.
- Terms: no free, copyright or licence statement on the wiki text. Cody Lefever's P-Zero post is paywalled and is not GZCLP.
- Unverified: session minutes, experience, equipment (inferred from exercises only), T3 progression, primary-source confirmation.

## 5/3/1 for Beginners

- URL: https://www.jimwendler.com/blogs/jimwendler-com/5-3-1-for-beginners (official site).
- Days per week: 3 (Monday, Wednesday, Friday). Conditioning on other days, using the 50% rule.
- Monday: squat and bench. Wednesday: deadlift and press. Friday: bench and squat. Each main lift is 5/3/1 sets, then 5x5 at FSL, plus assistance. FSL is not defined on the page.
- Starting point: 80 to 85% of your max, working up slowly (page wording).
- Progression: "earn the right" to add weight; no increment stated.
- Failure rule: if any rep fails the standards in a cycle, do not increase the training max.
- Terms: "Copyright © 2026 JimWendler.com."; no reuse statement. The full programme is sold as a paperback or eBook; the free page does not contain the week-by-week table.
- Unverified: session minutes, equipment, percentages and reps by week, increment, cycle length.

## Starting Strength

- URL checked: https://startingstrength.com/ (homepage).
- Not found: no free public page with exercises, sets, reps or progression was identified.
- Access: the programme is a paid book (Starting Strength: Basic Barbell Training, by Rippetoe and Kilgore). Retailers list it. The publisher store was not fetched.
- Everything else unverified.

## Jump: Athletic Development Programme (Jump Higher)

- URL: https://www.basketballengland.co.uk/media/13544/jump-higher.pdf. Alternate copy: https://basketballengland.co.uk/files/athletic-development-programme---jump-higher-workout-280825122016.pdf.
- Creator: not named in the document. Hosted by Basketball England.
- Duration: 4 weeks.
- Schedule conflict: the first copy says each of three sessions happens once per week, but the jump session is labelled 2x a week. The alternate copy labels 2x and 1x schedules. Days per week is unverified.
- Jump session: A-skip, ankle jumps forward and back, single-leg lateral hops, big skips, arm-drive vertical jumps, lateral bounds. Mostly 2 sets (ankle jumps 1 set), with 60 to 120 s rest where stated. Exact values are in the JSON.
- Strength session: reverse lunge, arrow-head push-up, side-ups, Nordic hamstring extensions, single-leg calf raise. Weeks 3 to 4 raise push-up and side-up reps and calf-raise sets from 3 to 4.
- Equipment: optional jump rope; half court; wall; optional medicine ball, dumbbell or rucksack.
- Failure or reset rule: none.
- Terms: no copyright or reuse statement; no author named.

## Not found

- Beginner 2-3 day gym programme (free and official): searches returned only commercial PDFs, paid apps and product pages. StrongLifts 5x5 is free but creator-run and already listed.

## Access notes

- Two guessed URLs returned 404 (NHS, Wendler). The correct pages were found by search.
- StrongLifts /pro/ has no reset rule; the failure page does.
- gzcl.substack.com returned 429 twice.
- reddit.com is blocked from this environment; the GZCLP facts come from a mirror.
- The full access log with 19 rows is in the JSON.
