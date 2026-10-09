# Mission Control — Reference Fidelity Implementation

**Source of truth for layout:** user-provided `code.html` and screenshot of the desired 1534px dashboard. Only the structure, hierarchy and brand-safe effects are transferred. The original HTML is a static reference, NOT the app runtime.

## Actual changes

- Hero is now rendered with a locally bundled 820×252 WebP scene based on the user-supplied design, instead of a temporary vector planet. The scene contains student/skyline/robot/handwritten inspirational copy; no external runtime image URL, Google Font, Tailwind CDN or Lucide script.
- Actual desktop layout now follows 7:5 for mission/lab and 5:4:3 for journey/rhythm/challenge, with three quick learning modes inside the primary column.
- Mission uses the published lesson title and first authored exercise question when available, plus real duration and lessonHref.
- Math Lab visually matches the reference graph-left, three-parameter-controls-right structure. Graph points are calculated for `y = ax² + bx + c` with fixed shared axes and a nonzero `a`; `b,c` are explicitly described as *optional extension* beyond the core Grade 9 `ax²` lesson.
- Recorded progress numbers and weekly activity continue to come from curriculum completion and timestamped checks, not from reference placeholder values 12 days, 42 questions, 91%, six hours, or a fictional 7-day challenge.
- On 390/360px, art is subdued for legibility and the three learning choices become full-width rows.

## Interactive/technical contract

Uses existing Plus Jakarta Sans and genAi palette. Deep links, lesson ids, GP, useStudyJourney, buildCoursePath, selectDiscovery and practice events are unchanged.

**Design asset:** `src/experience-v2/assets/mission-control-hero.webp` is self-hosted and intentionally limited to the hero; do not replace it with a remote Google image URL.

## Visual acceptance gate

- Browser QA screenshots 1440×900 and 390×844 and captures full page.
- Hero image must be loaded (`naturalWidth > 500`) before accepting a screenshot.
- Mission/Lab 7:5 and Journey/Rhythm/Challenge 5:4:3 proportions are asserted.
- At least three functioning math sliders and unchanged learning metrics.
- No horizontal scroll at 360px, first real lesson CTA above bottom dock at 390px.
- Existing V1/V2 tests and accessible controls continue to pass.

## Intentional differences from provided HTML

No fake streaks, 91% correctness, class ranking, 6-hour study time, preassigned 7-day achievement, active AI chatbot, interactive-looking decorative pagination or dead links. Dynamic labels and math only come from published lessons and actual saved student events.

**Branch:** `feat/v2-mission-reference-fidelity`. Keep Draft until screenshots reviewed; do not merge or deploy without approval.
