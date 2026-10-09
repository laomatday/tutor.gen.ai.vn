import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getCourseProgress, INITIAL_LESSONS, INITIAL_TOPICS, lessonHref } from "../src/features/curriculum";
import { studentRoutes } from "../src/config/routes";
import { readRoute } from "../src/app/navigation";
import { createPracticeSession, appendPracticeEvent, isPracticeSession, verifySampleAnswer } from "../src/features/practice/domain";
import { getPracticeProblem } from "../src/data/practice";
import { initialScheduleSessions } from "../src/features/schedule/types";
import { ICONS } from "../src/components/ui/Icon";

test("completion progress is shared across the student journey", () => {
  const all = getCourseProgress(INITIAL_LESSONS, INITIAL_TOPICS, ["can-bac-hai"]);
  assert.equal(all.completed, 1);
  assert.equal(all.total, 8);
  assert.equal(all.percent, 13);
  assert.equal(all.nextLesson?.id, "rut-gon-can-thuc");
  const math = getCourseProgress(INITIAL_LESSONS, INITIAL_TOPICS, ["can-bac-hai"], {gradeId:"9",subjectId:"toan"});
  assert.equal(math.completed, 1);
  assert.ok(math.total < all.total);
  assert.ok(math.lessons.every((l) => l.subjectId === "toan"));
  assert.equal(getCourseProgress([], [], []).percent, 0);
});

test("navigation uses Vietnamese IA and preserves the legacy exam link", () => {
  assert.deepEqual(studentRoutes.map((r) => r.label), [
    "Hôm nay", "Môn học", "Luyện tập", "Xem lại", "Tiến bộ", "Lịch học", "Phần thưởng", "Học có tài khoản",
  ]);
  assert.equal(readRoute("/thi-thu").section, "tien-bo");
  assert.equal(readRoute("/replay").section, "replay");
});

test("lesson, practice and replay share a real problem ID", () => {
  const problem = getPracticeProblem("parabola-coefficient-03");
  const courseLesson = INITIAL_LESSONS.find((lesson) => lesson.id === problem.lessonId);
  assert.ok(courseLesson);
  assert.equal(new URL(lessonHref(courseLesson!), "https://example.test").searchParams.get("lesson"), problem.lessonId);
  assert.equal(verifySampleAnswer("12 = a * (-2)^2 ⇔ a = 3", problem.point).valid, true);
  assert.equal(verifySampleAnswer("a = 9", problem.point).valid, false);
});

test("practice history is recorded from actual interactions; no prefilled work", () => {
  const session = createPracticeSession("parabola-coefficient-03", 1000);
  assert.equal(session.input, "");
  assert.equal(session.openedHints.length, 0);
  assert.equal(session.events?.length, 1);
  const checked = appendPracticeEvent({...session,input:"a=3"}, "check", "Hợp lệ", true, 1400);
  assert.ok(isPracticeSession(checked));
  assert.equal(checked.events?.[1].at, 1400);
  assert.equal(checked.events?.[1].input, "a=3");
  assert.equal(checked.events?.[1].valid, true);
});

test("CI icon guard rejects a deliberately unknown icon", () => {
  const ok = spawnSync(process.execPath, ["scripts/check-icons.mjs"], {encoding:"utf8"});
  assert.equal(ok.status, 0, ok.stderr);
  const missing = spawnSync(process.execPath, ["scripts/check-icons.mjs","--probe-missing"], {encoding:"utf8"});
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /__unknown_icon__/);
});

test("practice link is eligible only for the matching published lesson", () => {
  const problem = getPracticeProblem("parabola-coefficient-03");
  const published = getCourseProgress(INITIAL_LESSONS, INITIAL_TOPICS, []).lessons;
  assert.equal(published.filter((lesson) => lesson.id === problem.lessonId).length, 1);
  assert.notEqual(problem.lessonId, "rut-gon-can-thuc");
});

test("dynamic student schedule and admin icons are registered", () => {
  for(const session of initialScheduleSessions) assert.ok(ICONS[session.subjectIcon], session.subjectIcon);
  for(const name of ["translate","science","biotech","lock_open"]) assert.ok(ICONS[name], name);
});
