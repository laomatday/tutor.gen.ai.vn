# genAi Tutor V2 — Foundation implementation

Scope of this PR: a new **student-only presentation shell** behind the reversible Vite flag `VITE_STUDENT_EXPERIENCE_V2=true`. Flag is **off by default** and never controls authentication or authorization.

## Architectural decisions

- Preserve existing React/Vite/Tailwind, navigation functions, route query parameters, published-curriculum selectors, practice and reward domain functions, storage keys and PWA.
- The new V2 shell is implemented in `src/experience-v2/shell/LearningShell.tsx`, styles in `src/experience-v2/theme.css`. It uses the existing genAi brand tokens, local Material Symbols SVG, self-hosted fonts, search components, profile modal and route navigation.
- Teacher/Admin remain on V1 unchanged.
- During the migration only, incomplete V2 student routes render the **existing functional pages inside an explicitly labelled light compatibility surface**. These are not falsely marked as redesigned.
- A new Mission Control page and three other signature screens will be delivered as separate PRs. Replace the compatibility surface per route, not by layering dark styles over the V1 component.
- Art direction: galaxy-inspired navy–teal–cyan–sky shell, static decorative CSS, no autoplay animation and no fictitious data/AI.

## Preview

For local/staging preview with existing content fallback:

```bash
VITE_CONTENT_SOURCE=local VITE_STUDENT_EXPERIENCE_V2=true npm run dev
```

To return to V1, omit or set the flag to `false`. Enabling the public flag does not turn on external model access, change student identity, create learning events or migrate browser data.

## QA

- Existing CI and Browser UX Gate remain mandatory for V1.
- The browser workflow has a separate V2 opt-in run, with distinct `PLAYWRIGHT_PORT=3002`, so the V1 routes stay unaffected.
- Minimum checks: one visible main, search from Ctrl/Cmd+K, functional deep links, student nav, mobile dock, 360px overflow, close-menu focus restoration, no change to Teacher/Admin.

## Risk and known limitations

- V2 flag remains disabled on deployed builds; a frontend-only preview is not production auth.
- No artwork of a pupil/robot has yet been embedded because the approved full-screen mockups are reference images, not component assets; isolated source-controlled artwork requires its own review.
- Existing demo student profile remains clearly a demo; do not show fabricated mastery, streaks, classroom rankings or real AI chat.
- Incomplete routes intentionally keep V1 UI until their own PRs pass acceptance criteria.

## Next PRs

1. `feat/v2-mission-control`
2. `feat/v2-knowledge-universe`
3. `feat/v2-focus-studio`
4. `feat/v2-thinking-replay`

**Do not merge or deploy without design approval.**
