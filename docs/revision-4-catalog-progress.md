# Revision 4 — plan customization, catalogs and longitudinal progress

This remains a private, device-local interactive prototype. Sign-in and security settings are simulations, not live authentication. Sample athlete data are generated and kept in memory separately from the saved profile.

## Delivered
- Explicit None for now on commitments setup, and Today actions for commitments/time off and plan customization.
- Vacation/day-off ranges reserve each included date (maximum 90 days). Schedule conflicts remain visible; adding an event never silently moves workouts.
- Eight original adult programs: PL3/PL4 powerlifting, PB3/PB4 powerbuilding, BB3/BB4 bodybuilding, HY4/HY5 hybrid lifting/running. Existing foundation, running and coach/manual paths remain. No commercial program is reproduced or endorsed.
- Program-specific slot order, recovery groups, rep ranges, time validation and equipment prerequisites. Powerlifting retains squat, bench and deadlift; no mixed-conditioning fallback is substituted.
- 988 library entries: 25 foundation entries, 97 new distinct core/strength variants and 866 additional unique text reference entries from the public-domain free-exercise-db dataset. Upstream has 876 entries; ten exact-name duplicates are omitted. License and provenance are retained. No upstream images were imported.
- Library equipment filters separate barbells, dumbbells, kettlebells, cables, plate-loaded and selectorized machines. Unspecified source machines remain explicitly unconfirmed.
- Load conventions explain total bar/plates, per-hand and per-side recording. Machine identity and setup are required for comparable suggestions. Original/draft/reference instructions are labeled; most imported entries still lack a reviewed exact-variation video.
- Customize plan adds an exercise to one upcoming session or all subsequent repetitions of that session type in the current block. Preview includes dates, targets, review-week reductions and added time. Changes are explicit, versioned and stale proposals are invalidated. Duplicates, active/history changes and offline changes are rejected. Adding outside the time window requires explicit acceptance of the extra time.
- Imported/custom references must be configured as a new exact variation before use. Controlled loaded repetition work can opt into the same history-based progression. Timed/bodyweight, explosive or unquantified work does not inherit a universal weight-increase rule.
- Progress: exact-exercise heaviest set, best repetitions/time, restricted Epley estimate, external-load volume per session and a personal strength index. Setup filtering, missing data, partial work, unknown loads and stale constituents are handled explicitly. The index is not a validated novice/advanced scale or Caliber's proprietary score. Its disclosed baseline is recalculated from history.
- Isolated Jordan sample: 12 weeks, 34 logs, one partial, a lighter week, plateau, two omitted sessions, realistic 2.5 lb load increments. Exit restores the original profile.

## Scientific and expert source boundary
Adult resistance programming principles: ACSM 2026 overview, https://acsm.org/resistance-training-guidelines-update-2026/ . Program-family architecture was compared with Barbell Medicine powerlifting/powerbuilding and Jeff Nippard's hypertrophy program descriptions. These examples guide separation of goals; they do not validate the exact app sets, timelines or decisions.

Concurrent strength/endurance evidence: systematic review/meta-analysis, https://link.springer.com/article/10.1007/s40279-021-01587-7 . Hybrid sessions are on separate days and have independent prerequisites. This is not race-specific preparation.

Library source: https://github.com/yuhonas/free-exercise-db , text only, public-domain dedication in retained license. Source availability does not establish instructional accuracy. Added cues are drafts pending review.

Estimated maxima are approximate; Epley is restricted to recorded 1–10 reps and 0–2 RIR, completed symptom-free work. A one-rep observation is shown as load, not proof of a maximum. No youth strength estimate or population rank is produced. Volume sums external weight × actual reps × disclosed implement/side multiplier; this is not mechanical work and does not measure conditioning or total physiological stress.

## Verification
Focused automated coverage includes 28 prior training/scheduling checks, 12 onboarding checks and nine new catalog/customization/progress checks. New cases cover every template's cascade, SBD identity/equipment rejection, duplicate and stale additions, a user-added machine's load progression, mixed-range bench separation, load-volume multipliers, the sample history and stale/youth index behavior. Browser checks cover sample charts, recurring core addition and exact exercise history; manual QA findings are repaired before publication.

## Still future production work
Live identity, passkeys/Google/2FA, cross-device sync, production API, full content/video rights and expert review, validated normative scores, comprehensive sport/position coaching and automatic competition tapering. No claim that all conceivable movements or verified videos are included.
