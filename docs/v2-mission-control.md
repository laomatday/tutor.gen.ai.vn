# V2 — Mission Control implementation

The new **Mission Control** is implemented as a new presentation component, not a dark restyling of `TodayView.tsx`. It is shown **only** when the explicitly opt-in flag `VITE_STUDENT_EXPERIENCE_V2=true` is enabled. Default V1 and all other student/teacher/admin routes retain their existing code.

## Data → UI binding

| Visible feature | Actual source | No-data handling |
| --- | --- | --- |
| Next mission | `getCourseProgress` on published/enrolled lessons | Choose a subject, not a fictional task |
| Hero completion | `getCourseProgress` on the primary course | 0 of available lessons |
| Attempts / corrections | `useStudyJourney` from validated check/submit events | Correctly displays zero |
| Lab preview | `selectDiscovery` on enrolled published parabola lesson | Hide graph, show link to published lessons |
| Lab math | `parabolaPoints` for `y=ax²` | No model call; no auto reward |
| Learning modes | `lessonHref`, `practiceHref`, retained replay sessions | Replay mode leads to practice if no attempts |
| Journey | `buildCoursePath` | No artificial prerequisite locks |
| Weekly rhythm | `useStudyJourney.weekDays` from timestamped checks | No fake streak/duration |
| Challenge | `getEnrolledPracticeProblems` | Link to curriculum |

## Visual direction

The dark shell uses the authorized genAi navy–teal–cyan–sky palette and the existing self-hosted Plus Jakarta Sans. A **new standalone vector illustration** replaces the concept screenshot background; there is no external image request. The page uses a 7:5 mission/lab hierarchy with a lighter task canvas, supported by three real learning actions, a learning route, recorded weekly rhythm and a practice challenge.

The vector robot and planet are decorative only. The application **does not claim to provide live AI chat**.

## Core acceptance

- Primary CTA is reachable before the bottom dock at 390×844.
- Real published lesson routes, correct problemId and retained practice events.
- Lab coefficient slider graph changes deterministically; no GP or completed lesson added.
- 360px zero horizontal overflow; 390px/1440px screenshots.
- No fabricated streaks, mastery %, class ranking, time spent focused, or AI evaluation.
- Existing V1 navigation, teacher/admin, offline and rewards do not regress.

## Rollback and dependencies

Branch is stacked on PR #24 `feat/v2-foundation`; do not merge out of order. No DB schema changes or storage key changes.

Preview with:

```bash
VITE_CONTENT_SOURCE=local VITE_STUDENT_EXPERIENCE_V2=true npm run dev
```

`Browser UX Gate` runs V1 and V2 as separately started instances. This PR is not a production rollout or a claim that the other 3 V2 screens are complete.
