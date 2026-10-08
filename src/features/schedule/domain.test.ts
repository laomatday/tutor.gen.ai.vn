import assert from "node:assert/strict";
import test from "node:test";
import type { StorageAdapter } from "../../lib/browserStorage";
import { initialScheduleSessions } from "./data";
import {
  getNextScheduleSession,
  getScheduleWeek,
  isScheduleSessions,
  readSchedule,
  selectScheduleSessions,
  summarizeSchedule,
  validateScheduleDraft,
} from "./domain";
import type { ScheduleSession } from "./types";

function session(overrides: Partial<ScheduleSession> = {}): ScheduleSession {
  return {
    id: "self-study",
    title: "Ôn căn bậc hai",
    subjectName: "Toán học",
    subjectIcon: "functions",
    dayOfWeek: 5,
    startTime: "19:00",
    endTime: "19:30",
    sessionType: "tu-hoc",
    status: "upcoming",
    location: "",
    instructor: "",
    ...overrides,
  };
}

test("week dates follow Vietnam midnight, Sunday and month boundaries", () => {
  const before = getScheduleWeek(new Date("2026-10-04T16:59:59Z"));
  assert.equal(before[0].date, "2026-09-28");
  assert.equal(before[6].date, "2026-10-04");
  assert.deepEqual(
    before.filter((day) => day.isToday).map((day) => day.day),
    [8],
  );
  const after = getScheduleWeek(new Date("2026-10-04T17:00:00Z"));
  assert.deepEqual(
    after.map((day) => day.date),
    [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ],
  );
  assert.deepEqual(
    after.filter((day) => day.isToday).map((day) => day.day),
    [2],
  );
  assert.equal(
    getScheduleWeek(new Date("2026-10-04T17:00:00Z"), -1)[0].date,
    "2026-09-28",
  );
});

test("day and type filters apply together; weekly results sort by day before time", () => {
  const sessions = [
    session({
      id: "friday",
      dayOfWeek: 6,
      startTime: "07:00",
      endTime: "08:00",
    }),
    session({
      id: "monday-late",
      dayOfWeek: 2,
      startTime: "20:00",
      endTime: "20:30",
    }),
    session({ id: "monday-tutor", dayOfWeek: 2, sessionType: "tutor" }),
    session({
      id: "monday-early",
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "09:00",
    }),
  ];
  const originalIds = sessions.map((item) => item.id);
  assert.deepEqual(
    selectScheduleSessions(sessions, { type: "tu-hoc" }).map((item) => item.id),
    ["monday-early", "monday-late", "friday"],
  );
  assert.deepEqual(
    selectScheduleSessions(sessions, { day: 2, type: "tu-hoc" }).map(
      (item) => item.id,
    ),
    ["monday-early", "monday-late"],
  );
  assert.deepEqual(selectScheduleSessions(sessions, { day: 7 }), []);
  assert.deepEqual(
    sessions.map((item) => item.id),
    originalIds,
  );
});

test("up next uses the current clock and excludes completed even when selected dates differ", () => {
  const sessions = [
    session({ id: "morning", startTime: "07:00", endTime: "08:00" }),
    session({
      id: "completed",
      startTime: "19:00",
      endTime: "20:00",
      status: "completed",
    }),
    session({
      id: "tomorrow",
      dayOfWeek: 6,
      startTime: "07:00",
      endTime: "08:00",
    }),
    session({ id: "current", startTime: "19:00", endTime: "19:30" }),
    session({ id: "later", startTime: "20:00", endTime: "21:00" }),
  ];
  const next = getNextScheduleSession(
    sessions,
    new Date("2026-10-08T12:15:00Z"),
  );
  assert.equal(next?.session.id, "current");
  assert.equal(next?.isOngoing, true);
  assert.equal(next?.daysAway, 0);
  assert.equal(next?.date, "2026-10-08");
  const ended = getNextScheduleSession(
    sessions,
    new Date("2026-10-08T12:30:00Z"),
  );
  assert.equal(ended?.session.id, "later");
  assert.equal(ended?.isOngoing, false);
});

test("a passed recurring session moves to next week, with no stale ongoing state", () => {
  const passed = session({ status: "in-progress" });
  const next = getNextScheduleSession(
    [passed],
    new Date("2026-10-08T12:30:00Z"),
  );
  assert.equal(next?.daysAway, 7);
  assert.equal(next?.date, "2026-10-15");
  assert.equal(next?.isOngoing, false);
  const sunday = getNextScheduleSession(
    [session({ dayOfWeek: 2 })],
    new Date("2026-10-11T16:59:59Z"),
  );
  assert.equal(sunday?.daysAway, 1);
  assert.equal(sunday?.date, "2026-10-12");
  assert.equal(getNextScheduleSession([], new Date()), null);
  assert.equal(
    getNextScheduleSession([session({ status: "completed" })], new Date()),
    null,
  );
});

test("schedule summaries derive duration, type counts and completed total", () => {
  assert.deepEqual(
    summarizeSchedule([
      session(),
      session({
        id: "tutor",
        sessionType: "tutor",
        startTime: "07:30",
        endTime: "09:00",
        status: "completed",
      }),
    ]),
    {
      count: 2,
      minutes: 120,
      completed: 1,
      typeCounts: { "chinh-khoa": 0, tutor: 1, "tu-hoc": 1, "thi-thu": 0 },
    },
  );
  assert.equal(summarizeSchedule([]).minutes, 0);
});

test("new schedule validation allows optional people/location and rejects incomplete or reversed times", () => {
  assert.deepEqual(validateScheduleDraft(session()), {});
  const errors = validateScheduleDraft(
    session({
      title: " ",
      subjectName: "",
      dayOfWeek: 9,
      startTime: "20:00",
      endTime: "19:30",
    }),
  );
  assert.ok(errors.title);
  assert.ok(errors.subjectName);
  assert.ok(errors.dayOfWeek);
  assert.ok(errors.endTime);
  assert.ok(validateScheduleDraft(session({ startTime: "24:00" })).startTime);
  assert.ok(validateScheduleDraft(session({ endTime: "19:00" })).endTime);
  assert.ok(
    validateScheduleDraft(session({ onlineLink: "javascript:alert(1)" }))
      .onlineLink,
  );
});

test("persisted validation accepts existing fixtures and rejects malformed sessions atomically", () => {
  const unknownIcon = "unregistered";
  const inheritedIcon = "__proto__";
  assert.equal(isScheduleSessions(initialScheduleSessions), true);
  assert.equal(isScheduleSessions([]), true);
  assert.equal(isScheduleSessions([session()]), true);
  for (const value of [
    null,
    {},
    "[]",
    [null],
    [session(), session()],
    [session({ id: " " })],
    [session({ dayOfWeek: 1 })],
    [session({ dayOfWeek: 2.5 })],
    [session({ subjectIcon: unknownIcon })],
    [session({ subjectIcon: inheritedIcon })],
    [session({ startTime: "8:00" })],
    [session({ endTime: "19:00" })],
    [{ ...session(), status: "unknown" }],
    [{ ...session(), notes: 123 }],
    [{ ...session(), title: null }],
    [{ ...session(), onlineLink: "data:text/html,unsafe" }],
    [{ ...session(), instructor: undefined }],
  ])
    assert.equal(isScheduleSessions(value), false, JSON.stringify(value));
});

test("reading corrupt or unavailable storage exposes the error without overwriting saved data", () => {
  let writes = 0;
  const adapter: StorageAdapter = {
    read: () => "{broken",
    write: () => {
      writes += 1;
    },
  };
  const corrupt = readSchedule(adapter);
  assert.ok(corrupt.error);
  assert.deepEqual(corrupt.value, initialScheduleSessions);
  assert.equal(writes, 0);
  const denied = readSchedule({
    ...adapter,
    read: () => {
      throw new Error("denied");
    },
  });
  assert.ok(denied.error);
  const valid = readSchedule({
    ...adapter,
    read: () => JSON.stringify([session()]),
  });
  assert.equal(valid.error, null);
  assert.deepEqual(valid.value, [session()]);
  const empty = readSchedule({ ...adapter, read: () => "[]" });
  assert.deepEqual(empty.value, []);
  assert.equal(empty.error, null);
  assert.equal(writes, 0);
});
