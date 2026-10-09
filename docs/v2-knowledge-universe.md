# Knowledge Universe V2 implementation

Stage W3, stacked on Mission Control PR #25 and Foundation PR #24. Feature-flagged, not merged or deployed.

## Functional scope
- Brand-new cosmic map with real subject/topic clusters and selected-topic inspector.
- Map, Journey and List views use one selection and true curriculum progress.
- Search, subject chips, keyboard-operable nodes, zoom and pan, and published lesson deep links.
- Nodes generated exclusively from ownedPublishedLessons; deterministic positions.
- Edges encode curriculum_order within a subject, NEVER invented prerequisites.
- URL /hoc-bai?lesson=... continues to open the existing working lesson reader.
- No fabricated AI, mastery, fictional subjects, rankings or activity.

## Source handoff
- src/experience-v2/universe/graphDomain.ts: pure tested graph builder.
- src/experience-v2/universe/KnowledgeUniversePage.tsx: interaction and data binding.
- src/experience-v2/universe/knowledge-universe.css: isolated responsive visuals.
- tests/e2e/v2-universe.spec.cjs: published content, navigation, search, 360px, accessibility.

## Review gates
Screenshots at 1440x900 and 390x844; no horizontal overflow at 360px; map selected states persist within views; keyboard/list alternative; all lessons are published and enrolled. Do not merge or deploy before review.