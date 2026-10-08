import test from "node:test";
import assert from "node:assert/strict";
import { storageKeys } from "../../config/storage";
import type { StorageAdapter } from "../../lib/browserStorage";
import {
  appendPracticeEvent,
  createPracticeSession,
  type PracticeEvent,
  type PracticeSession,
} from "../practice/domain";
import { readStudyJourney, selectStudyJourney } from "./studyJourney";

function attempt(
  session: PracticeSession,
  date: string,
  valid = false,
  kind: PracticeEvent["kind"] = "check",
) {
  return appendPracticeEvent(
    { ...session, input: "x=2 hoặc x=3" },
    kind,
    "Recorded response",
    valid,
    Date.parse(date),
    valid ? undefined : "equation",
  );
}

test("weekly activity uses Vietnamese midnight and the complete Monday–Sunday week", () => {
  let session = createPracticeSession(
    "quadratic",
    Date.parse("2026-10-04T16:00:00Z"),
  );
  session = attempt(session, "2026-10-04T16:59:59Z"); // Sunday in Vietnam.
  session = attempt(session, "2026-10-04T17:00:00Z"); // Monday 00:00.
  session = attempt(session, "2026-10-07T16:59:59Z"); // Wednesday 23:59.
  session = attempt(session, "2026-10-07T17:00:00Z", true, "submit");
  const journey = selectStudyJourney(
    { quadratic: session },
    null,
    new Date("2026-10-07T18:00:00Z"),
  );
  assert.deepEqual(
    journey.weekDays.map((day) => day.key),
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
    journey.weekDays.map((day) => day.label),
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  );
  assert.deepEqual(
    journey.weekDays.map((day) => day.attempts),
    [1, 0, 1, 1, 0, 0, 0],
  );
  assert.equal(journey.weekDays.find((day) => day.isToday)?.key, "2026-10-08");
  assert.equal(journey.activeDays, 3);
  assert.equal(journey.todayAttempts, 1);
  assert.equal(journey.totalAttempts, 4);
  assert.equal(journey.corrections, 1);
  assert.equal(journey.recentProblemId, "quadratic");
  assert.equal(journey.hasActivity, true);
});

test("calendar week crosses year boundaries and Sunday does not start a new week", () => {
  const newYear = selectStudyJourney(
    {},
    null,
    new Date("2026-12-31T18:00:00Z"),
  );
  assert.equal(newYear.weekDays[0].key, "2026-12-28");
  assert.equal(newYear.weekDays[6].key, "2027-01-03");
  assert.equal(newYear.weekDays.find((day) => day.isToday)?.key, "2027-01-01");
  const sunday = selectStudyJourney({}, null, new Date("2027-01-02T18:00:00Z"));
  assert.equal(sunday.weekDays[0].key, "2026-12-28");
  assert.equal(sunday.weekDays[6].isToday, true);
  const monday = selectStudyJourney({}, null, new Date("2027-01-03T18:00:00Z"));
  assert.equal(monday.weekDays[0].key, "2027-01-04");
  assert.equal(monday.weekDays[0].isToday, true);
});

test("only dated checks and submissions count, and bookmarks must refer to retained mistakes", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  let first = createPracticeSession(
    "first",
    Date.parse("2026-10-08T08:00:00Z"),
  );
  first = appendPracticeEvent(
    first,
    "hint",
    "Hint",
    undefined,
    Date.parse("2026-10-08T08:01:00Z"),
  );
  first = attempt(first, "2026-10-08T08:02:00Z");
  const wrongId = first.events!.at(-1)!.id;
  first = attempt(first, "2026-10-08T08:03:00Z", true, "submit");
  first.savedMistakes = [wrongId, wrongId, "missing", first.events!.at(-1)!.id];
  let second = createPracticeSession(
    "second",
    Date.parse("2026-10-08T09:00:00Z"),
  );
  second = attempt(second, "2026-10-08T09:01:00Z");
  second.savedMistakes = [second.events!.at(-1)!.id];
  second = attempt(second, "2026-10-09T09:00:00Z", true, "submit"); // Future: ignored.
  const journey = selectStudyJourney({ first, second }, null, now);
  assert.equal(journey.totalAttempts, 3);
  assert.equal(journey.todayAttempts, 3);
  assert.equal(journey.activeDays, 1);
  assert.equal(journey.corrections, 1);
  assert.equal(journey.savedMistakes, 2);
  assert.equal(journey.recentProblemId, "second");
});

test("V3 history wins over V2 for the same problem, and valid legacy history remains available otherwise", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  let legacy = createPracticeSession(
    "legacy",
    Date.parse("2026-10-08T08:00:00Z"),
  );
  legacy = attempt(legacy, "2026-10-08T08:01:00Z");
  const current = createPracticeSession(
    "legacy",
    Date.parse("2026-10-08T09:00:00Z"),
  );
  assert.equal(
    selectStudyJourney({ legacy: current }, legacy, now).totalAttempts,
    0,
  );
  assert.equal(selectStudyJourney({}, legacy, now).totalAttempts, 1);
  assert.equal(
    selectStudyJourney(
      { other: { ...current, problemId: "other" } },
      legacy,
      now,
    ).totalAttempts,
    1,
  );
  assert.equal(selectStudyJourney([], legacy, now).totalAttempts, 1);
  assert.equal(
    selectStudyJourney({}, { ...legacy, problemId: undefined }, now)
      .hasActivity,
    false,
  );
});

test("recent replay uses the last attempted problem rather than a newer empty session", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  let attempted = createPracticeSession(
    "attempted",
    Date.parse("2026-10-08T08:00:00Z"),
  );
  attempted = attempt(attempted, "2026-10-08T08:01:00Z");
  attempted = attempt(attempted, "2026-10-09T08:01:00Z", true);
  const opened = createPracticeSession(
    "opened",
    Date.parse("2026-10-08T11:00:00Z"),
  );
  const journey = selectStudyJourney({ attempted, opened }, null, now);
  assert.equal(journey.recentProblemId, "attempted");
  assert.equal(journey.recentSession?.problemId, "attempted");
  assert.equal(journey.recentSession?.events?.length, 2);
  assert.ok(
    journey.recentSession?.events?.every((event) => event.at <= now.getTime()),
  );
  assert.equal(
    attempted.events?.length,
    3,
    "The selector does not mutate stored history",
  );
  assert.equal(selectStudyJourney({ opened }, null, now).recentSession, null);
});

test("malformed histories and undated completion flags do not fabricate study days", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  let session = createPracticeSession(
    "first",
    Date.parse("2026-10-08T08:00:00Z"),
  );
  session = attempt(session, "2026-10-08T08:01:00Z");
  const last = session.events!.at(-1)!;
  for (const malformed of [
    { first: { ...session, openedHints: [1, 1] } },
    { first: { ...session, events: [last, last] } },
    { first: { ...session, events: [{ ...last, input: undefined }] } },
    { first: { ...session, events: [{ ...last, at: "2026-10-08" }] } },
    { differentId: session },
    null,
  ]) {
    const journey = selectStudyJourney(malformed, null, now);
    assert.equal(journey.hasActivity, false);
    assert.equal(journey.totalAttempts, 0);
    assert.equal(journey.savedMistakes, 0);
  }
  const undated = {
    problemId: "first",
    input: "",
    openedHints: [],
    rewarded: true,
    solved: true,
    savedMistakes: ["unknown"],
  };
  const journey = selectStudyJourney({ first: undated }, null, now);
  assert.equal(journey.activeDays, 0);
  assert.equal(journey.corrections, 0);
  assert.equal(journey.savedMistakes, 0);
  assert.equal(journey.recentProblemId, null);
});

test("reading the dashboard never writes storage, creates sessions or awards activity", () => {
  const reads: string[] = [];
  const storage: StorageAdapter = {
    read: (key) => {
      reads.push(key);
      return null;
    },
    write: () => assert.fail("Dashboard activity must stay read-only"),
  };
  const now = new Date("2026-10-08T12:00:00Z");
  assert.equal(readStudyJourney(storage, now).hasActivity, false);
  assert.deepEqual(reads, [
    storageKeys.practiceSessionsV3,
    storageKeys.practiceSessionV2,
  ]);
  storage.read = () => "{not-json";
  assert.equal(readStudyJourney(storage, now).totalAttempts, 0);
  storage.read = () => {
    throw new Error("Storage denied");
  };
  assert.equal(readStudyJourney(storage, now).totalAttempts, 0);
});
