import test from "node:test";
import assert from "node:assert/strict";
import lessonsData from "../../data/curriculum/lessons.json";
import models from "./data/discoveryModels.json";
import type { Lesson } from "../../types/content";
import {
  isDiscoveryModel,
  parabolaPoints,
  selectDiscovery,
} from "./lessonDiscovery";

const lessons = lessonsData as Lesson[];
const first = lessons.find((lesson) => lesson.id === "can-bac-hai")!;

test("reviewed manipulative models are valid and bind to actual published questions", () => {
  for (const model of models) {
    assert.equal(isDiscoveryModel(model), true);
    const lesson = lessons.find((item) => item.id === model.lessonId)!;
    assert.equal(selectDiscovery(lesson)?.model?.kind, model.kind);
    assert.equal(selectDiscovery(lesson)?.exercise, lesson.exercises[0]);
  }
});

test("a changed or unrelated lesson cannot inherit a mathematical visual", () => {
  for (const lesson of [
    { ...first, subjectId: "tieng-anh" },
    { ...first, gradeId: "8" },
    {
      ...first,
      exercises: [{ ...first.exercises[0], prompt: "A changed question" }],
    },
    {
      ...first,
      exercises: [{ ...first.exercises[0], id: "another-exercise" }],
    },
  ]) {
    assert.ok(selectDiscovery(lesson)?.exercise);
    assert.equal(selectDiscovery(lesson)?.model, undefined);
  }
  const english = lessons.find(
    (lesson) =>
      lesson.subjectId === "tieng-anh" && lesson.status === "published",
  )!;
  assert.equal(selectDiscovery(english)?.exercise, english.exercises[0]);
  assert.equal(selectDiscovery(english)?.model, undefined);
});

test("no discovery is exposed for draft, empty, or invalid first exercises", () => {
  assert.equal(selectDiscovery({ ...first, status: "draft" }), null);
  assert.equal(selectDiscovery({ ...first, exercises: [] }), null);
  for (const exercise of [
    { ...first.exercises[0], prompt: " " },
    { ...first.exercises[0], explanation: "" },
    { ...first.exercises[0], options: ["Only one"] },
    { ...first.exercises[0], options: ["One", ""] },
    { ...first.exercises[0], correctIndex: -1 },
    { ...first.exercises[0], correctIndex: first.exercises[0].options.length },
  ])
    assert.equal(selectDiscovery({ ...first, exercises: [exercise] }), null);
});

test("invalid model values cannot create unbounded diagrams or invalid controls", () => {
  const [square, parabola] = models;
  for (const invalid of [
    null,
    {},
    { ...square, kind: "guess" },
    { ...square, initial: NaN },
    { ...square, min: -10000 },
    { ...square, min: square.max },
    { ...square, offset: 3.5 },
    { ...square, initial: 30 },
    { ...parabola, coefficients: [0, 1] },
    { ...parabola, coefficients: [1, 1] },
    { ...parabola, coefficients: [-4, 1] },
    { ...parabola, coefficients: ["1", 2] },
    { ...parabola, initial: 0 },
  ])
    assert.equal(isDiscoveryModel(invalid), false);
});

test("parabola plots use exact signed quadratic coordinates with a common scale", () => {
  const up = parabolaPoints(3);
  const down = parabolaPoints(-3);
  assert.equal(up.length, 81);
  assert.deepEqual(up[40], { x: 0, y: 0, screenX: 160, screenY: 114 });
  assert.deepEqual(up[0], { x: -2, y: 12, screenX: 36, screenY: 18 });
  assert.deepEqual(up.at(-1), { x: 2, y: 12, screenX: 284, screenY: 18 });
  assert.deepEqual(down[0], { x: -2, y: -12, screenX: 36, screenY: 210 });
  for (const point of up) {
    assert.ok(Math.abs(point.y - 3 * point.x ** 2) < 1e-12);
    assert.ok(point.screenY >= 18 && point.screenY <= 114);
  }
});
