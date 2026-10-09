# UI/UX Mapping — tempt.gen.ai.vn → tutor.gen.ai.vn

**Mapping baseline:** `laomatday/tempt.gen.ai.vn@main` (25-file React/Vite prototype), compared with `laomatday/tutor.gen.ai.vn@main`.  
**Implementation:** `feat/map-tempt-ui-to-tutor` (presentation mapping only).  
**Scope:** student V2 only; V1, Teacher/Admin, assessment logic, PWA, storage schema, curriculum and published lessons unchanged.

## Engineering decision

**Port the design grammar, not the prototype application.**

The source prototype contains `src/data/mockData.ts` with fabricated node enrollment, mastery, prerequisites, practice logs, character interaction, leaderboard and live-AI messaging; it has no published content/permissions or real user evidence. Copying `src/App.tsx` or source screen files verbatim into Tutor would replace working domain logic, make routes invalid and misrepresent student performance. Tutor's implementation therefore keeps working V2 React components and remaps their visual hierarchy into source M3 tokens and compositions.

| Source file / element | Target mapping | Decision |
|---|---|---|
| `src/styles/theme.css` (dark/light tokens) | `src/experience-v2/tempt-map.css` `--tm-*` theme aliases | Dark/light only affects student V2. Same self-hosted Tutor font |
| `src/styles/components.css` (app-card, hero, input, canvas, badges) | Scoped `@layer tempt-ui-map` on real Tutor components | Rounded M3 cards, elevated surfaces, quieter shadows, blue/cyan states |
| `src/styles/m3.css` | Sidebar/topbar/nav controls in `LearningShell.tsx` | 256px navigation drawer, 64px fixed header, pill destinations, Material 3 switches |
| `Sidebar.tsx` | `LearningShell` primary/secondary groups, actual persisted dark/light toggle | Never import fictitious badge counts, ranks, achievement titles |
| `TopBar.tsx` | `LearningShell` search + real published/enrolled suggestions | Ctrl/Cmd+K and accessible Modal retained. No fake AI or red notification badge |
| `DashboardScreen.tsx` | `MissionControlPage.tsx` + mapped CSS | Hero, 7:5 mission/lab, three choices, 5:4:3 journey/rhythm/challenge; real progress |
| `KnowledgeUniverseScreen.tsx` | `KnowledgeUniversePage.tsx` + mapped CSS | Constellation surface, pill mode switch, selected inspector; real curriculum nodes |
| `FocusStudioScreen.tsx` | `FocusStudioPage.tsx` + mapped CSS | Problem-first surface, 5:4:3 desktop studio; deterministic step checks |
| `ThinkingReplayScreen.tsx` | `ThinkingReplayPage.tsx` + mapped CSS | Event rail/typed-paper replay/side reflection; actual recorded events |
| `AIAssistantDrawer.tsx`, `mockData.ts` | **Not imported** | Live model, fake attempts, misleading progress and fabricated rankings intentionally excluded |
| `Modals.tsx` | Tutor existing profile/rewards/accessibility surfaces | No prototype-only actions, photo upload, invented personal data or app settings |

## What changed in this PR

1. V2 shell accepts a self-contained theme preference, stored under **new UI-only key** `genai-tutor-v2-theme-v1`. It never modifies app auth, GP, practice session or content persistence. The production feature flag remains unchanged.
2. M3 navigation group labels, 256px desktop drawer, 64px topbar, compact typography and source-matched pills. Desktop main content scrolls within its own container as in the reference application; mobile uses natural document scrolling with the established bottom navigation dock.
3. Published lesson search suggestions show only **ownedPublishedLessons**, and their destinations use `lessonHref`; text search route remains working. No dependence on hard-coded `TOPIC_NODES`.
4. Source M3 dark and light visual tokens mapped into one scoped stylesheet; four V2 pages receive source-style composition, surfaces, state and spacing. No new runtime fonts/dependencies, and no change to Teacher/Admin.

## QA and constraints

- **Dark and light**: mouse and keyboard theme toggle; reload preserves preference; stage/workspace remains readable.
- **Functional continuity**: route/role isolation, menu, published lesson search, subject inspector, step checker, saved attempts, Replay and GP integrity must pass existing E2E.
- **Viewport**: 360×800, 390×844, 768×1024, 1024×768, 1440×900. No inadvertent body horizontal scroll or clipped controls. Desktop screen geometry: drawer approx 256px, header 64px, 7:5 Home main grid, separate Replay timeline/player/inspector.
- **Accessibility**: skip link, real buttons, focus visible, drawer Escape/focus return, reduced-motion. Automated serious/critical axe violations = 0 for dark and light on core views.
- **Visual evidence**: capture viewport screenshot for 4 student screens at 1440×900 and 390×844; compare to source layout and this matrix. No claims of exact pixel parity with demo or fictional data.
- **Fallback**: V2 remains off by default and can be rolled back to V1 without touching saved data.

## Limitations requiring separate approval

- Source prototype contains a global AI assistant drawer, notification badge, XP streak leaderboard and mock student statistics. These cannot be mapped as live functionality without a real backend and privacy/academic review.
- Source has a 3D-like constellation layout with manually placed nodes. Tutor must not import its fake topics/prerequisites. Current deterministic map layout is kept.
- Published lessons still open the current functional lesson reader where a complete V2 lesson renderer is not yet shipped. Never disguise this compatibility boundary.
- The source uses several direct hardcoded decorative colors. All copied colors here are centralized under scoped V2 stylesheet; not scattered through domain TSX.

**Approval gate:** Draft PR only. No production flag changes, deployment or merge without owner approval.
