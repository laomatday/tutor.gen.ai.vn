# UI/UX visual mapping: tempt.gen.ai.vn → tutor.gen.ai.vn

**Source of presentation:** [laomatday/tempt.gen.ai.vn](https://github.com/laomatday/tempt.gen.ai.vn) (main, reviewed on 2026-10-10).
**Runtime destination:** [laomatday/tutor.gen.ai.vn](https://github.com/laomatday/tutor.gen.ai.vn) (React/Vite application, V2 feature flag).
**Status:** Implementation PR for review; **not** authorization to merge or deploy.

## Architecture decision

The source repository is a visual prototype: its `src/App.tsx` uses local `currentScreen` instead of URL routing and `src/data/mockData.ts` for learning progress, topic nodes and replay steps. Several source components call `canvas-confetti`, display mock AI actions, and load remote Google images. **Do not transplant source screens wholesale.** Port its hierarchy, proportions, surfaces, themes and interaction styling to the existing V2 application; retain the Tutor URL router, validated selectors, mathematical feedback, learner events and accessibility.

## Component mapping

| tempt source | Tutor V2 target | Mapping decision | Real data/action retained |
| --- | --- | --- | --- |
| `src/App.tsx` | `src/app/App.tsx`, `src/experience-v2/shell/LearningShell.tsx` | Fixed rail and topbar, content viewport scroll, shared brand surface | Browser history, lazy routes, role gates, PWA, user profile |
| `src/components/Sidebar.tsx` | `LearningShell.tsx`, `theme.css`, `tempt-mapping.css` | 232–248px dark sidebar, pill selected nav, lower quote tile | Four valid destinations, secondary routes |
| `src/components/TopBar.tsx` | `LearningShell.tsx` | Search pill, keyboard shortcut, compact profile | Published curriculum search, real modal |
| `src/styles/theme.css` | `src/experience-v2/tempt-mapping.css` | Dark navy glass panels + semantic surface tokens, optional light palette documented | genAi local fonts, existing Material icon registry |
| `src/styles/components.css`, `src/styles/m3.css` | `src/experience-v2/theme.css`, mapping stylesheet | 24px panels, inset layers, rounded buttons, subtle shadows, glowing active state | Native accessible buttons/tabs |
| `DashboardScreen.tsx` | `MissionControlPage.tsx` | Hero; 8:4 task + lab; 3 choices; bottom 5:4:3 | Published next lesson, real parabola model, weekly checks |
| `KnowledgeUniverseScreen.tsx` | `KnowledgeUniversePage.tsx` | Cosmic header; ~8:4 map/inspector; related topics and learning strip | Published-only graph, real lesson targets; no guessed prerequisite |
| `FocusStudioScreen.tsx` | `FocusStudioPage.tsx` | Separate lesson problem card; 5:4:3 tool/editor/hint grid; bottom feedback | Deterministic verifier, once-only GP, saved drafts and events |
| `ThinkingReplayScreen.tsx` | `ThinkingReplayPage.tsx` | Hero, context bar, 3:6:3 timeline/paper/reflection, analytics row | Actual event timestamps, snapshots, hints and mistakes |
| `AIAssistantDrawer.tsx`, `Modals.tsx` | Existing search and profile modals | **Do not copy simulated chat/AI commands**; only real feature affordances | No fictional AI gateway |
| `TOPIC_NODES`, `REPLAY_STEPS`, mocked statistics | `useCurriculum`, `usePracticeSession`, `getPracticeStats` | **Never copy numerical content** | Source-backed learning evidence |

## Design fidelity contract

**Global:** background navy `#070c1b` as design reference, layered raised dark panels, cyan/blue accents, 14–16px body with Plus Jakarta Sans *self-hosted by Tutor*, restrained glows. Avoid source CDN fonts, Googleusercontent hardcoded URLs, animation loops and fake score badges.

**Home:** visual order is 1) Hero, 2) Next Mission + Lab, 3) Three learning choices, 4) Journey / Week / Challenge. Navigation and task density must match source composition. If the current Tutor has a slightly different DOM order, use grid placement only on desktop; maintain accessible reading order on mobile.

**Universe:** topics from existing published/enrolled content only. Map mode supports zoom/pan; list and journey modes remain real. Glow may indicate *selected* or *current*, not mastery.

**Focus:** keep source problem statement separation and 5:4:3 workspace density, while using verified Tutor graph and text solution storage. Do not show AI evaluation or photo/OCR when there is no provider.

**Replay:** light mathematical whiteboard inside dark shell, timeline and reflection panels; preserve real history rather than copying `REPLAY_STEPS` sample.

## Rollout and verification

- Use existing V2 environment flag (`VITE_STUDENT_EXPERIENCE_V2=true`) on preview, not an authorization mechanism.
- New style layer is namespaced `.learning-os-v2`; V1 and Teacher/Admin are not changed.
- Run V1 + V2 CI and browser tests, especially 360/390/768/1440 and focus/keyboard.
- Capture matching source and destination screenshots for all four screens. **Do not claim pixel parity before visual review**.
- No change to localStorage keys, backend, academic content, reward verification or server access policy.
- Follow up with asset and light-theme pass only after visual acceptance.
