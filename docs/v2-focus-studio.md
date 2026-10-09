# Focus Studio V2 — implementation and QA

Stage W4; stacked on PR #26 (Knowledge Universe), PR #25 (Mission Control), PR #24 (Foundation). Flag is off by default. Do not merge or deploy without review.

## What was rebuilt
New FocusStudioPage and focus-studio.css: a problem-first workspace with bright math statement, independent editor, deterministic step checking, graph/sketch/tile/Micro-lab tools, hint ladder, actual attempt history and contextual feedback. All parts are real React controls, not screenshot cutouts.

## Preserved domain
- `usePracticeSession(problem.id)`: same versioned stored record per problem; no key migration.
- `verifyPracticeAnswer`: existing deterministic validation. No fake AI evaluator.
- `appendPracticeEvent`: actual checks/submissions and hints, scoped to problemId.
- `autonomyReward` and `onEarnGp`: reward once; recheck/reload must not duplicate reward.
- `GraphStudy`, `SketchPad`, `AlgebraTiles`, `QuadraticMicroLab`: existing validated learning tools.
- All deep links `/tu-giai?problem=id` validated against enrolled problem list; invalid IDs show honest empty state.

## Progressive disclosure
Students see a simple problem and editor first. Extended hints level 2+ remain disabled until at least one actual check. Graph, algebra and Micro-lab are gated until an independent check. Sketching remains available as scratch work and is not auto-evaluated.

## Risks and acceptance
Verify mathematically correct outputs for each authored problem; do not import coordinates from image generation. Mobile priority: statement → editor → check → feedback, with supporting tools and hints below. Unit/domain tests and V2 browser workflow exercise saved drafts, step-by-step checks, once-only reward, answer errors, responsive at 360/390/1440, WCAG severe gate and replay deep links.

Scope excludes live model inference, image OCR, voice and any new grant of server permissions. Teacher/Admin untouched.