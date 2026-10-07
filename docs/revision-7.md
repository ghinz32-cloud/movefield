# Revision 7 - deep audit and reliability fixes

7 October 2026. Full product goals remain in docs/product-requirements.md. The detailed review is docs/deep-audit-2026-10-07.md; docs/audit-acceptance-matrix.json lists 64 required future release scenarios, not passed tests.

## Implemented

- Recheck jump/event buffers on start and schedule changes; reject conflicting restores atomically.
- Latest timestamp determines prerequisite attempt, independent of history array order.
- Clear accepted loads in return proposals; preserve history.
- Start web actuals at zero/unknown rather than copying targets; require actual amount for Done.
- Validate before replacing readable browser storage; cap saved-plan copies and archives at the reader's 100-plan bound.
- Cap customizer setup labels, duration and exercise count; reject non-finite targets.
- Calendar commitment Undo and invalidation of pending/queued proposals after event changes.
- Correct end-of-schedule wording, conditional custom-guide availability, and retry a missing guide when reopened.
- Add data tables to all three progress charts; enlarge selected touch targets and native text.
- Native date-change and shorter-return previews with explicit acceptance; no overdue workout start without an approved date.
- Native current-state mutation reference, serialized reset, whole-number reps and save-time revalidation.
- Native plan replacement retains holds/events and rejects commitment conflicts.
- Native link failures appear in the guide; errors/save failures announced; Done controls identify the exercise.

## Verification

- 108 shared/web regression checks passed: 28 training, 12 onboarding, 9 catalog/progress, 29 security, 6 library/measurements, 13 focus, 11 new deep-audit scenarios.
- Web TypeScript and production build passed.
- Production Worker probe: HTTP 200; 20 script nonces match CSP; nonces rotate between requests; writes return 405; internal routes return 404; private/no-store responses.
- Native TypeScript, engine checks (9 sample programs across all 7 start weekdays plus recovery/date/retention regressions), and Android/iOS Metro exports passed.
- Browser checked experienced sample progress tables, individual exercise history, blank actual fields and rejection of Done without an amount.
- No physical devices, signed native build, complete accessibility conformance test or independent penetration test performed.

## Open issues/gates

Native recovery reviews one future session at a time; dependent sessions can still require review. Full return-block rebuilding, history correction, restore-and-move for an overdue skipped session, atomic account sync, native personal setup and feedback, private media, real identity and device testing remain unfinished. Numeric fields still need a unified raw-draft/error system. All 989 guides require independent content/media matching review before a production-quality claim.

Fresh dependency scans: web 3 advisories (2 high, 1 moderate); native 22 affected package entries (15 high, 7 moderate), propagating from 3 underlying advisories. No critical entries. See security-review.md. No forced dependency downgrade or weakened release-age policy was applied.
