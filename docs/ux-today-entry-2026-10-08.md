# U12 — Today, profile entry and quieter workout selection

Today opens for new and saved profiles and the sample. Protected-record recovery still takes priority when needed. Sample entry no longer invokes a stale non-sample save after switching modes. The first viewport has one workout card, a small week strip and direct calendar/move/check-in controls. Summaries and adjustments are disclosed; holds and pending approvals remain visible. Upcoming cards exclude the featured workout.

Web/phone workouts show one exercise at a time; navigating does not remove logged data. Web headings/cards/setup are smaller. Phone headings fall from 34 to 26 points, main cards use 12-point padding, and all five bottom tabs fit instead of hiding Settings in a horizontal scroller. Touch controls remain at least 44 points. Optional setup work and source/program details are disclosed, with three initial plan choices and an explicit More action.

Profile entry shows local-profile creation, Open Today and backup restore. Simulated Google/passkey/2FA enrollment controls were removed. Real app authentication and sync are still not connected; the UI says so without collecting credentials or implying protection.

Passed: web/native types, lint, 14 onboarding and 29 security checks, 36 shared hashes, native engine checks, production build and both production suites, Android/iOS Metro exports. Actual Chrome sample opened on Today without the old toast; one squat set at five reps survived switching exercises; partial save returned to Today. Profile entry/setup opened. Screenshot was inspected but its shared-file synchronization failed, so no file attachment is claimed. Existing dark/130% text preferences retained; 1348 px document has no horizontal overflow.

No physical-phone, secure-storage, 200%/small-viewport or real-account acceptance claim. Two implementation errors were corrected before final checks (BookOpen import and render-time ref read). Source fingerprints and observations are in the adjacent JSON. No model training/inference or main merge/deployment in this milestone.
