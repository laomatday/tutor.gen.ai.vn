import test from "node:test";
import assert from "node:assert/strict";
import { summarizeLessonEvidence, selectLearningEvidence } from "./evidence";
import { createPracticeSession, appendPracticeEvent } from "../practice/domain";

const lessons = [{ id: "he-thuc-viete" }, { id: "ham-so-bac-hai" }, { id: "unrelated" }];

test("summarize genuine check, correction and submission from practice events", () => {
  const starting = createPracticeSession("quadratic-factor-01", 1000);
  const incorrect = appendPracticeEvent(
    { ...starting, input: "x=7" }, "check", "Cần xem lại nghiệm", false, 2000, "roots",
  );
  const fixed = appendPracticeEvent(
    { ...incorrect, input: "x=2 hoặc x=3" }, "submit", "Đúng", true, 3000,
  );
  const summaries = summarizeLessonEvidence(lessons, ["ham-so-bac-hai"], {
    "quadratic-factor-01": fixed,
  });
  assert.deepEqual(summaries[0], {
    lessonId: "he-thuc-viete",
    lessonCompleted: false,
    studioAttempts: 2,
    validStudioAttempts: 1,
    corrections: 1,
    lastStudioAttemptAt: 3000,
    needsReview: false,
  });
  assert.equal(summaries[1].lessonCompleted, true);
  assert.equal(summaries[1].studioAttempts, 0);
  assert.equal(summaries[2].studioAttempts, 0);
});

test("never confuse viewing, hint, reward flag or future mapping with verified skill", () => {
  const session = createPracticeSession("quadratic-factor-01", 1000);
  session.rewarded = true;
  session.solved = true;
  const afterHint = appendPracticeEvent(session, "hint", "Gợi ý", undefined, 2000);
  const result = selectLearningEvidence(lessons, [], { "quadratic-factor-01": afterHint });
  assert.equal(result.length, 0);
});

test("invalid or unknown practice sessions cannot contribute learning evidence", () => {
  const garbage = { "quadratic-factor-01": { rewarded: true } };
  assert.deepEqual(selectLearningEvidence(lessons, [], garbage), []);
  assert.equal(selectLearningEvidence(lessons, ["unknown", "unrelated", "unrelated"], {}) .length, 1);
});

test("last invalid check remains visible for review without changing lesson completion", () => {
  const initial = createPracticeSession("quadratic-factor-01", 1000);
  const wrong = appendPracticeEvent(
    { ...initial, input: "x=0" }, "check", "Nghiệm chưa đúng", false, 2000, "roots",
  );
  const row = summarizeLessonEvidence(lessons, [], { "quadratic-factor-01": wrong })[0];
  assert.equal(row.needsReview, true);
  assert.equal(row.lessonCompleted, false);
  assert.equal(row.corrections, 0);
});
