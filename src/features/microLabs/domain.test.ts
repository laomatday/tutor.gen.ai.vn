import test from "node:test";
import assert from "node:assert/strict";
import lessonsJson from "../../data/curriculum/lessons.json";
import topicsJson from "../../data/curriculum/topics.json";
import problemsJson from "../../data/practice/practice-problems.json";
import type { Lesson, PracticeProblem, Topic, StudentEnrollment } from "../../types/content";
import {
  formatQuadratic,
  hasRunExperiment,
  isMathLabValid,
  quadraticPlot,
  quadraticValue,
  selectDialogueLab,
  selectMathLab,
} from "./domain";
import microLabs from "./data/microLabs.json";

const lessons = lessonsJson as Lesson[];
const topics = topicsJson as Topic[];
const problems = problemsJson as PracticeProblem[];
const enrollments: StudentEnrollment[] = [
  { gradeId: "9", subjectId: "toan" },
  { gradeId: "9", subjectId: "tieng-anh" },
];
const quadratic = problems.find((problem) => problem.id === "quadratic-factor-01")!;
const parabola = problems.find((problem) => problem.id === "parabola-coefficient-03")!;
const club = lessons.find((lesson) => lesson.id === "school-club-invitation")!;

test("math lab uses the published, enrolled, matching subject/topic/lesson", () => {
  for (const problem of [quadratic, parabola]) {
    const lab = selectMathLab(problem, lessons, topics, enrollments);
    assert.equal(lab?.id, microLabs.math.id);
    assert.equal(lab?.stages.length, 3);
  }
  assert.equal(
    selectMathLab(quadratic, lessons, topics, [{ gradeId: "9", subjectId: "tieng-anh" }]),
    null,
  );
  assert.equal(selectMathLab(quadratic, lessons, [], enrollments), null);
  assert.equal(
    selectMathLab(quadratic, lessons.map((lesson) => lesson.id === quadratic.lessonId
      ? { ...lesson, status: "draft" }
      : lesson), topics, enrollments),
    null,
  );
  assert.equal(
    selectMathLab({ ...quadratic, lessonId: "ham-so-bac-hai" }, lessons, topics, enrollments),
    null,
  );
});

test("math scripts are bounded, mathematically consistent and non-fabricated", () => {
  const lab = microLabs.math;
  assert.equal(isMathLabValid(lab), true);
  assert.equal(isMathLabValid({ ...lab, stages: [{ ...lab.stages[0], correctIndex: 40 }] }), false);
  for (const stage of lab.stages) {
    assert.equal(hasRunExperiment(stage, stage.baseline), false);
    const changed = { ...stage.baseline, [stage.focus]: stage.direction === "negative" ? -1 : 2 };
    assert.equal(hasRunExperiment(stage, changed), true);
    assert.equal(hasRunExperiment(stage, { ...changed, a: 0 }), false);
    const nonFocus = stage.focus === "b" ? "c" : "b";
    assert.equal(hasRunExperiment(stage, { ...changed, [nonFocus]: stage.baseline[nonFocus] + 1 }), false);
  }
  assert.equal(quadraticValue({ a: 1, b: -5, c: 6 }, 2), 0);
  assert.equal(quadraticValue({ a: 1, b: -5, c: 6 }, 3), 0);
  assert.equal(formatQuadratic({ a: 1, b: -5, c: 6 }), "y = x² − 5x + 6");
  assert.equal(formatQuadratic({ a: -1, b: 0, c: 0 }), "y = −x²");
  const baseline = quadraticPlot({ a: 1, b: 0, c: 0 });
  const translated = quadraticPlot({ a: 1, b: 0, c: 3 });
  assert.equal(baseline.length, 81);
  assert.deepEqual(baseline[40], { x: 0, y: 0, screenX: 240, screenY: 138 });
  assert.equal(translated[40].y, 3);
  for (const point of translated) {
    assert.ok(Number.isFinite(point.screenX));
    assert.ok(Number.isFinite(point.screenY));
    assert.ok(Math.abs(point.y - (point.x ** 2 + 3)) < 1e-10);
  }
});

test("dialogue requires the exact two published, authored exercises", () => {
  const lab = selectDialogueLab(club);
  assert.equal(lab?.id, "school-club-dialogue");
  assert.deepEqual(lab?.steps.map((step) => step.exercise.id), ["club-1", "club-2"]);
  assert.equal(lab?.steps[0].exercise.correctIndex, 1);
  assert.equal(selectDialogueLab({ ...club, status: "draft" }), null);
  assert.equal(selectDialogueLab({ ...club, subjectId: "toan" }), null);
  assert.equal(selectDialogueLab({ ...club, exercises: [club.exercises[0]] }), null);
  assert.equal(
    selectDialogueLab({
      ...club,
      exercises: [
        club.exercises[0],
        { ...club.exercises[1], prompt: "A changed exercise" },
      ],
    }),
    null,
  );
  assert.equal(
    selectDialogueLab({
      ...club,
      exercises: [
        { ...club.exercises[0], options: ["Hello", "Goodbye"] },
        club.exercises[1],
      ],
    }),
    null,
  );
});
