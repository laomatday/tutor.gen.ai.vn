import test from "node:test";
import assert from "node:assert/strict";
import { getPracticeProblems } from "../src/data/practice";
import { validatePracticeProblemData } from "../src/data/validation";
import { getEnrolledPracticeProblems } from "../src/features/practice/eligibility";

test("standalone practice remains available in its enrolled course without a published lesson", () => {
  const problems = getPracticeProblems();
  const course = { gradeId: "9", subjectId: "toan" };
  const available = getEnrolledPracticeProblems(problems, [course]);
  assert.ok(available.some((problem) => problem.kind === "quadratic-factor"));
  assert.deepEqual(
    getEnrolledPracticeProblems(problems, [
      { gradeId: "9", subjectId: "tieng-anh" },
    ]),
    [],
  );
  assert.deepEqual(
    getEnrolledPracticeProblems(problems, [
      { gradeId: "8", subjectId: "toan" },
    ]),
    [],
  );
  assert.deepEqual(
    getEnrolledPracticeProblems(problems, [course], {
      gradeId: "9",
      subjectId: "tieng-anh",
    }),
    [],
  );
  const standalone = { ...available[0], lessonId: undefined };
  assert.equal(getEnrolledPracticeProblems([standalone], [course]).length, 1);
});

test("practice scope metadata is validated before enrollment filtering", () => {
  for (const problem of getPracticeProblems())
    assert.deepEqual(validatePracticeProblemData(problem), []);
  const problem = getPracticeProblems()[0];
  assert.ok(
    validatePracticeProblemData({ ...problem, gradeId: "" }).some((error) =>
      error.message.includes("lớp và môn"),
    ),
  );
  assert.ok(
    validatePracticeProblemData({ ...problem, subjectId: " " }).some((error) =>
      error.message.includes("lớp và môn"),
    ),
  );
  assert.ok(
    validatePracticeProblemData({ ...problem, topicId: "" }).some((error) =>
      error.message.includes("chủ đề"),
    ),
  );
});
