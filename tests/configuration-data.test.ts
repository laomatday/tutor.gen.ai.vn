import test from "node:test";
import assert from "node:assert/strict";
import { localDayOfWeek } from "../src/lib/dates";
import { initialScheduleSessions } from "../src/features/schedule/data";
import {
  defaultDailyGoals,
  defaultWeeklyGoals,
} from "../src/features/goals/data";
import { initialBadges } from "../src/features/gamification/badges";

test("Timetable day follows the configured Vietnamese timezone across UTC midnight and week boundaries", () => {
  assert.equal(localDayOfWeek(new Date("2026-10-07T18:00:00Z")), 5);
  assert.equal(localDayOfWeek(new Date("2026-10-10T18:00:00Z")), 8);
  assert.equal(localDayOfWeek(new Date("2026-10-11T18:00:00Z")), 2);
});

test("Extracted demo fixtures retain valid timetable, goal, and badge contracts", () => {
  assert.ok(initialScheduleSessions.length > 0);
  for (const session of initialScheduleSessions) {
    assert.ok(
      Number.isInteger(session.dayOfWeek) &&
        session.dayOfWeek >= 2 &&
        session.dayOfWeek <= 8,
    );
    assert.match(session.startTime, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.match(session.endTime, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.ok(session.startTime < session.endTime);
    assert.ok(
      ["chinh-khoa", "tutor", "tu-hoc", "thi-thu"].includes(
        session.sessionType,
      ),
    );
  }
  for (const [timeframe, goals] of [
    ["daily", defaultDailyGoals],
    ["weekly", defaultWeeklyGoals],
  ] as const) {
    assert.ok(goals.length > 0);
    assert.equal(new Set(goals.map((goal) => goal.id)).size, goals.length);
    for (const goal of goals) {
      assert.equal(goal.timeframe, timeframe);
      assert.ok(goal.targetValue > 0 && goal.currentValue >= 0);
      assert.equal(goal.completed, goal.currentValue >= goal.targetValue);
    }
  }
  assert.ok(initialBadges.length > 0);
  for (const badge of initialBadges) {
    assert.ok(badge.progress >= 0 && badge.progress <= 100);
    assert.ok(badge.targetValue > 0 && badge.currentValue >= 0);
    assert.equal(badge.unlocked, badge.currentValue >= badge.targetValue);
  }
});
