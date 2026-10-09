# genAi Tutor UI/UX V2 — Implementation Gap Audit (2026-10-09)

This is a factual *implementation audit* against the 17-section specification supplied by the Product Owner. It does not replace the specification, approve release or authorize production deployment.

## Verified in main before this PR

| Spec workstream | Main status | Evidence / limitation |
| --- | --- | --- |
| W1 — Student Shell | Merged PR #24 | V2 opt-in via `VITE_STUDENT_EXPERIENCE_V2=true`, still off by default |
| W2 — Mission Control | Merged PR #25 | New `MissionControlPage`; source-backed next lesson, retained practice events |
| W3 — Knowledge Universe | Merged PR #26 | Published curriculum map, Journey/List, real topic inspector; edges are curriculum order, NOT verified prerequisites |
| W4 — Focus Studio | Merged PR #27 | New problem-solving presentation with old deterministic math verifier and once-only GP |
| W5 — Thinking Replay | Merged PR #28 | Recorded attempt/hint timeline; saved inputs, no inferred thoughts |
| W6 — Supporting student pages | **Gap identified** | Progress, Schedule and Rewards were still rendered as V1 pages inside `v2-legacy-surface`; profile opened V1 modal |
| W7 — Teacher/Admin | Design approval missing | Teacher Command Center / Academic Operations Console need separate mockups and Auth/RBAC before real operations |
| W8 — Pilot and rollout | Not done | No moderated student pilot, performance baseline or production acceptance signoff |

## Changes in this PR (W6)

- New Student V2 **Progress**: published lesson completion, practice attempts, self-corrections and weekly checks from existing curriculum/session data. No sample exam percentages misrepresented as evidence.
- New Student V2 **Schedule**: existing `useSchedule`, validators and storage keys; daily/weekly selection, category filters, add/edit/delete/undo and legitimate next-activity links; recurring demo sessions remain clearly labelled.
- New Student V2 **Rewards**: existing GP wallet, catalog filters, stock-after-requests, redemption confirmation and request history; demo catalog prominently labelled, no fulfilment claim; parent phone/address not persisted.
- New Student V2 **Profile**: real local GP and course completion; sample badge collection clearly identified as illustrative rather than student-achieved mastery.
- Existing V1 student views, lesson reader, Teacher/Admin and `VITE_STUDENT_EXPERIENCE_V2` default-off behavior remain unmodified.

## Preservation contract

No changes to `src/config/storage.ts` keys, `useRewardWallet` calculations, `useSchedule` persistence, `validateScheduleDraft`, `getCourseProgress`, `useStudyJourney`, Auth/RBAC policies or database. No AI model calls, tracking pixels or new dependency.

## Testing and acceptance

Test on 360, 390 and 1440, check no horizontal overflow; verify valid curriculum-linked links; schedule CRUD persisted and undo works; rewards spend exactly once with no stored personal delivery details; modal keyboard closing, WCAG serious/critical violations zero; all V1 browser journeys still pass.

The V2 feature flag is a **presentation switch only**, never an authorization control. Demo users and rewards cannot be advertised as production functionality.

## Remaining W6/W7/W8 scope

- Lesson reader `/hoc-bai?...&lesson=...` still intentionally uses a V1 compatibility surface inside V2; this is a **remaining W6 gap** requiring a dedicated lesson-reader redesign and academic QA.
- The sample rewards catalog/recurring timetable are demo data, with no server-backed authenticated history.
- Teacher/Admin visual concepts, server roles, PII protections, performance baselines, user pilot, publishing approval, and final V2 design review are pending separately.
- Old PR #23 (Bento Home) remains Draft; do not merge as the V2 baseline or close it without explicit Product Owner approval.

No merge or deployment is authorized by this audit.
