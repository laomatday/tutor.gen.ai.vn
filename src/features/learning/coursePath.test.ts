import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_LESSONS, INITIAL_TOPICS } from "../curriculum";
import { buildCoursePath, compactPathUnit } from "./coursePath";

const math = { gradeId: "9", subjectId: "toan" };
const english = { gradeId: "9", subjectId: "tieng-anh" };

test("path uses only enrolled published lessons with matching topics, ordered by the curriculum", () => {
  const lessons = [...INITIAL_LESSONS].reverse();
  const topics = [...INITIAL_TOPICS].reverse();
  const original = JSON.stringify({ lessons, topics });
  const path = buildCoursePath(topics, lessons, [], math);
  const expected = INITIAL_LESSONS.filter(
    (lesson) =>
      lesson.gradeId === math.gradeId &&
      lesson.subjectId === math.subjectId &&
      lesson.status === "published",
  ).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "vi"));
  assert.equal(path.total, expected.length);
  assert.equal(path.nextLesson?.id, expected[0].id);
  assert.deepEqual(
    path.units.map((unit) => unit.topic.id),
    [...new Set(expected.map((lesson) => lesson.topicId))],
  );
  assert.equal(
    path.units
      .flatMap((unit) => unit.steps)
      .filter((step) => step.state === "current").length,
    1,
  );
  assert.equal(
    path.minutes,
    expected.reduce((total, lesson) => total + lesson.durationMinutes, 0),
  );
  assert.equal(
    JSON.stringify({ lessons, topics }),
    original,
    "Selectors must not mutate curriculum data",
  );
  const malformed = {
    ...expected[0],
    id: "foreign-topic",
    topicId: "english-foundations",
  };
  const draft = {
    ...expected[0],
    id: "not-published",
    status: "draft" as const,
  };
  const guarded = buildCoursePath(
    topics,
    [...lessons, malformed, draft],
    [],
    math,
  );
  assert.equal(guarded.total, path.total);
  assert.equal(
    buildCoursePath(topics, lessons, [], { gradeId: "8", subjectId: "toan" })
      .total,
    0,
  );
});

test("completion advances the current lesson without locking future lessons or mixing courses", () => {
  const initial = buildCoursePath(INITIAL_TOPICS, INITIAL_LESSONS, [], math);
  const first = initial.nextLesson!;
  const last = initial.units.at(-1)!.steps.at(-1)!.lesson;
  const englishFirst = buildCoursePath(
    INITIAL_TOPICS,
    INITIAL_LESSONS,
    [],
    english,
  ).nextLesson!;
  const done = [first.id, first.id, last.id, englishFirst.id, "deleted-lesson"];
  const path = buildCoursePath(INITIAL_TOPICS, INITIAL_LESSONS, done, math);
  assert.equal(path.completed, 2);
  assert.equal(
    path.units
      .flatMap((unit) => unit.steps)
      .find((step) => step.lesson.id === first.id)?.state,
    "complete",
  );
  assert.equal(
    path.units
      .flatMap((unit) => unit.steps)
      .find((step) => step.lesson.id === last.id)?.state,
    "complete",
  );
  assert.notEqual(path.nextLesson?.id, first.id);
  assert.equal(
    path.units
      .flatMap((unit) => unit.steps)
      .find((step) => step.lesson.id === path.nextLesson?.id)?.state,
    "current",
  );
  assert.ok(
    path.units
      .flatMap((unit) => unit.steps)
      .some((step) => step.state === "available"),
  );
  assert.equal(
    buildCoursePath(
      INITIAL_TOPICS,
      INITIAL_LESSONS,
      [first.id, last.id],
      english,
    ).completed,
    0,
  );
});

test("an entirely completed course has no invented next step and the preview returns its last unit", () => {
  const initial = buildCoursePath(INITIAL_TOPICS, INITIAL_LESSONS, [], math);
  const ids = initial.units.flatMap((unit) =>
    unit.steps.map((step) => step.lesson.id),
  );
  const path = buildCoursePath(INITIAL_TOPICS, INITIAL_LESSONS, ids, math);
  assert.equal(path.nextLesson, undefined);
  assert.equal(path.completed, path.total);
  assert.ok(
    path.units.every(
      (unit) =>
        unit.state === "complete" && unit.completed === unit.steps.length,
    ),
  );
  assert.equal(compactPathUnit(path)?.topic.id, path.units.at(-1)?.topic.id);
  assert.equal(
    compactPathUnit({ units: [], completed: 0, total: 0, minutes: 0 }),
    undefined,
  );
});

test("compact preview follows the current step, keeps surrounding lessons and original completion counts", () => {
  const template = INITIAL_LESSONS.find(
    (lesson) =>
      lesson.gradeId === math.gradeId && lesson.subjectId === math.subjectId,
  )!;
  const lessons = Array.from({ length: 6 }, (_, index) => ({
    ...template,
    id: `step-${index}`,
    order: index + 1,
    durationMinutes: index + 5,
  }));
  const path = buildCoursePath(
    INITIAL_TOPICS,
    lessons,
    lessons.slice(0, 4).map((lesson) => lesson.id),
    math,
  );
  const compact = compactPathUnit(path)!;
  assert.deepEqual(
    compact.steps.map((step) => step.lesson.id),
    ["step-3", "step-4", "step-5"],
  );
  assert.equal(compact.completed, 4);
  assert.equal(compact.steps[1].state, "current");
  assert.equal(path.units[0].steps.length, 6);
});
