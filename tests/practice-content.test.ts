import test from "node:test";
import assert from "node:assert/strict";
import { getPracticeProblems } from "../src/data/practice";
import { validatePracticeProblemData } from "../src/data/validation";

test("all published practice definitions are internally consistent", () => {
  for (const problem of getPracticeProblems()) {
    assert.deepEqual(validatePracticeProblemData(problem), [], problem.id);
  }
});

test("quadratic content rejects incompatible roots and degenerate coefficients", () => {
  const problem = getPracticeProblems().find(
    (entry) => entry.kind === "quadratic-factor",
  )!;
  assert.ok(problem);
  assert.ok(
    validatePracticeProblemData({
      ...problem,
      quadratic: { ...problem.quadratic!, a: 0 },
    }).length,
  );
  assert.ok(
    validatePracticeProblemData({
      ...problem,
      quadratic: { ...problem.quadratic!, roots: [1, 6] },
    }).length,
  );
  assert.ok(
    validatePracticeProblemData({ ...problem, durationMinutes: -1 }).length,
  );
});
