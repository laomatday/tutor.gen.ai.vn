# Thinking Replay V2

Stage W5, stacked on PR #27 Focus Studio, #26 Knowledge Universe, #25 Mission Control, #24 Foundation. Default UI feature flag remains OFF. Not a production deployment.

## Truthful replay contract

- Replay reads the same `usePracticeSession(problemId)`, `getPracticeStats`, `getReplayCursor` and events used by existing V1. It NEVER invents attempts, thought processes, focus duration or AI feedback.
- Timeline lists persisted `start`, `hint`, `check`, `submit` in real event order with real elapsed time.
- Notebook stage displays the latest `check/submit.input` snapshot up to playhead. Blank until one exists. Hint text comes only from recorded `hint.detail`.
- Play/pause/seek/speed 1x/1.5x/2x; all functional with keyboard/touch. Window interval is cleared on pause/unmount.
- Reflection numbers for mistakes, corrections, hints are derived via `getPracticeStats`. No invented independent-vs-assisted percentages.
- Latest stored sketch is labelled as a **recent sketch snapshot** (not a stroke-by-stroke replay).
- Saved mistakes persist under existing versioned session, with no new schema or points.
- Invalid problem id has explicit empty state, no silent redirect to another student's content. Opening replay without attempts never persists a synthetic learning attempt.

## QA and release

Playwright covers empty timeline, genuine bad/good attempts, time seek, playback speed, reload persistence, a different problem with no events, screenshot 390/1440, 360 overflow and axe serious/critical gate. Full V1 regression + opt-in V2 gate remain mandatory.

No merge, production deploy, RLS change, backend AI, fake scores or new user accounts without approval.