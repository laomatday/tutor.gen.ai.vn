# Productization execution plan — genAi Tutor

Date: 2026-10-08. Status is a working plan, **not** a claim that commercial launch is complete.

## Verified baseline

- React/Vite front end with published content fetched from Supabase.
- Live tables already exist for `tutor_profiles`, `tutor_enrollments`, `tutor_studio_snapshots`, `tutor_lesson_completions`, `tutor_quiz_attempts`, `tutor_skill_evidence`, `tutor_reward_ledger`, `tutor_teacher_links`, `tutor_teacher_assignments`.
- Those tables have RLS. They are *not* automatically integrated with the current demo UI.
- Existing demo features still rely on local storage. Do not mistake this for server persistence or authorization.
- Content at audit: 7 published lessons in Supabase: 5 Math 9, 2 English 9. Only two configured free-form Studio problems.
- PR for the initial domain layer introduces a read-only evidence projection from genuine local attempts and completions; the result is **not mastery**.

## Non-negotiable rollout gates

1. Identity and verified authorization: students/teachers/admins must authenticate; profile and consent state come from server. A URL or self-selected role never grants access.
2. Persistence: use user-scoped server records; sync results between devices. Support retry, idempotency, session recovery, and account deletion.
3. Evidence: derive insight from check/submit attempts and rubric tags; never claim that a `solved` or `rewarded` flag measures competence.
4. Teacher operations: real, authorized teacher-learner links only, with read scopes, consent handling, and no accidental crossover with sample students.
5. Content: a reviewer must approve each lesson; schema validation, published versions, media licensing, and math QA before production.
6. Commercial launch: owner approves pricing, disclosures and privacy. No payment collection until entitlement, refunds and financial accounting are ready.
7. Deploy: CI, Playwright, live browser smoke, rollback route and domain-to-commit verification are required.

## Implementation waves

### Wave A — Shared evidence & frontend simplification
- [x] Introduce read-only lesson evidence projection for published lessons and valid local Studio events.
- [ ] Surface projection in learner progress, explicitly labelled local evidence.
- [ ] Split `KnowledgeMapView`, `TheoryLessonsView`, and `SelfSolveView` into focused modules without changing public routes.
- [ ] Remove superseded CSS declarations only after screenshot diffs.

### Wave B — Auth and durable data
- [ ] Build an Auth provider with server identity, token refresh and logout.
- [ ] Replace hard-coded demo enrollment with `tutor_enrollments` behind RLS.
- [ ] Hook lesson completion and Studio autosave to server APIs, enforcing ownership and consent.
- [ ] Add server-side idempotent reward transactions and restore account-specific history.
- [ ] Build admin-authorized publish workflow; current local editor is not an actual publishing CMS.

### Wave C — Learning quality
- [ ] Define Skills, Prerequisites, Rubrics, Error Codes, evidence thresholds, and a versioned skill graph.
- [ ] Connect quiz attempts and Studio corrections into server-owned skill evidence.
- [ ] Add math-verification benchmark; use LLM only for bounded feedback, not as a sole correctness oracle.
- [ ] Build ≥80 expert-reviewed Math 9 tasks and evaluate with unseen problems.

### Wave D — Teacher product, pilot & commercialization
- [ ] Replace independent sample teacher and admin datasets with authorized server views.
- [ ] Recruit real teachers and learners only after privacy, parent consent and RLS audits.
- [ ] Instrument task success, weekly return, teacher time saved, feedback correctness, support cost and outcome quality.
- [ ] Run controlled pilot before pricing claims and public paid launch.

## Data principles

`LessonEvidenceSummary` describes counts of observed actions. Completion and successfully checked answers must never be renamed as mastery. No student data should be copied across devices before identity and access-control gates are complete.

## Release checklist

`bun run lint`, `bun run test`, `bun run build`, Playwright browser QA and visual review at 360/390/768/1024/1440/1920px. Production deployment must expose a verifiable commit SHA. Vercel rate limits do not justify promoting older unreviewed previews.
