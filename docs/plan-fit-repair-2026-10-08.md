# U04a — generated plan fit

Parent `95571a5ecf2cd4d5a5fab3dbf8c60924452f7cf2`; branch `audit/2026-10-08-quality`. Fit notes and recommendation ranking now use the maximum session duration in the entire generated draft rather than the catalog's nominal marketing time. The already-generated plan is reused; ranking does not rebuild every candidate. Invalid drafts do not claim they fit. Advanced plans now state their established-technique/recent-training assumption explicitly.

PLU3 before: eligible 50-minute maximum draft described as about 80 minutes and too long for a 75-minute slot. After: fits the selected 75-minute window, up to 50 minutes in this block; ranking recognizes eligibility. Required work, rest, dates, time-budget rejection and existing histories are unchanged. Canonical `lib/onboarding.ts` was synchronized to native with the updated snapshot hash.

Checks: 14 onboarding checks pass (including the reproduced mismatch and full-block/invalid-draft cases); 31 shared-file parity checks pass; web/native types and product lint pass; native engine and Android/iOS Metro/Hermes exports pass. No signed native build or physical-phone test.

The fresh browser setup recheck was interrupted by a development preview reload, which returned the insecure HTTP preview to its encryption-unavailable screen. The newly corrected note is verified by the regression using the same plan-options function; it is not claimed as a new observed browser acceptance. U01/U02a's earlier actual sample observations remain valid for their tested slices.

Next U04b: update current-plan evidence mapping from older frequency and superseded adult guidance; preserve historical references and prescriptions.
