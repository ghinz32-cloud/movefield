# Named-program expansion — 9 October 2026

Twenty named entries now include eight prefilled manual variants: PHUL, StrongLifts 5×5, StrongLifts Lite (two/three days), r/Fitness Basic Beginner, GZCLP first stage (three/four days) and Metallicadpa PPL. Twelve other entries provide source links and empty calendars. The existing 78 app-created plans remain distinct.

Schedules preserve the A/B or four-workout cycle across weeks, source recovery gaps, selected availability and commitments. Equipment, experience, adult eligibility and estimated time are checked. Loads remain unknown; the app does not automate creator-specific progression, resets or AMRAP. Scope and app rest defaults are disclosed before acceptance. Sources and mapping limits are in the companion JSON.

Web/native pickers are collapsed initially, searchable and show three matches until expanded. Native duplicate pickers were removed. Preview starts with one workout. Editing retained source targets preserves ranges and original notes; repeated edits follow the source workout role across weeks. Generic tracking still strips untrusted prescription fields. Unstarted/completed/active/stale/offline boundaries remain.

## Validation

3,582 named-program assertions across all seven starting weekdays: exact prescriptions/cycles, duration, age/equipment/day limits, saved-state readback, source-role edits, commitments and manual authority. Initial regression run passed 29/31; an outdated empty-reference fixture and generic tracking-field regression were corrected, and both failing suites pass on targeted rerun. Web/native types and lint, 38 shared hashes, native engine, production build and both production suites pass. Initial graph: 391,201 gzip bytes (400,000 limit). Android/iOS Hermes exports: 4.3 MB.

Browser sample flow: setup → named search GZCLP → three-day source review → accept → Today. Protected original data preserved. Screenshot inspected and saved. No physical-phone, secure-storage, account-service or actual model acceptance is claimed.

## Checkpoint

Overlapping edits are preserved in the original checkout. This continuation is isolated at `/workspace/scratch/855d6d943ad0/movefield-continuation` on `audit/2026-10-09-continuation`, based on `aba25b0`. Publish tested work to `audit/2026-10-08-quality` with an expected-head guard. Checkpoint: `.sites-runtime/checkpoints/u14-complete.bundle`. Resolve actual commit/tree from Git and verify remote readback; never infer publication from this report.
