import test from "node:test";
import assert from "node:assert/strict";
import {
  getGrades,
  getSubjects,
  getLessonStages,
  getTopics,
  getTopicById,
  getLessons,
  getLessonById,
  getLessonsByCourse,
  getPracticeProblems,
  getPracticeProblem,
  getFormulaTools,
  getPracticePolicy,
  getRewardCatalog,
  getRewardFilters,
  getRewardFlow,
  getSampleAssessment,
  getAppConfig,
  validateCurriculumData,
  validateRewardsData,
  validatePracticeProblemData,
  validateAssessmentData,
} from "../src/data";

test("Data Access Layer retrieves JSON-backed academic content properly", () => {
  const grades = getGrades();
  assert.equal(grades.length, 7);
  assert.equal(grades[3].id, "9");

  const subjects = getSubjects();
  assert.ok(subjects.some((s) => s.id === "toan"));
  assert.ok(subjects.some((s) => s.id === "ngu-van"));

  const stages = getLessonStages();
  assert.equal(stages.length, 3);
  assert.deepEqual(
    stages.map((s) => s.id),
    ["theory", "examples", "exercises"],
  );

  const mathTopics = getTopics("toan", "9");
  assert.equal(mathTopics.length, 4);

  const radTopic = getTopicById("can-thuc");
  assert.ok(radTopic);
  assert.equal(radTopic?.title, "Căn thức");

  const allLessons = getLessons();
  assert.equal(allLessons.length, 9);

  const squareRootLesson = getLessonById("can-bac-hai");
  assert.ok(squareRootLesson);
  assert.equal(squareRootLesson?.title, "Căn bậc hai số học");
  assert.equal(squareRootLesson?.status, "published");
  assert.ok(squareRootLesson?.exercises.length);

  const courseLessons = getLessonsByCourse("9", "toan");
  assert.equal(courseLessons.length, 7);
});

test("Data Access Layer retrieves practice, rewards and assessment data", () => {
  const practiceProblems = getPracticeProblems();
  assert.equal(practiceProblems.length, 1);
  const problem = getPracticeProblem("parabola-coefficient-03");
  assert.equal(problem.id, "parabola-coefficient-03");
  assert.equal(problem.variable, "a");

  const tools = getFormulaTools();
  assert.ok(tools.length >= 6);

  const policy = getPracticePolicy();
  assert.equal(policy.hintPenaltyGp, 5);

  const catalog = getRewardCatalog();
  assert.ok(catalog.length >= 6);
  assert.ok(catalog.every((item) => item.cost > 0 && item.stock >= 0));

  const filters = getRewardFilters();
  assert.equal(filters.length, 4);

  const flow = getRewardFlow();
  assert.equal(flow.length, 4);

  const assessment = getSampleAssessment();
  assert.equal(assessment.id, "HN10-09");
  assert.equal(assessment.maximumScore, 10);

  const config = getAppConfig();
  assert.equal(config.brand.name, "genAi Tutor");
  assert.equal(config.locale, "vi-VN");
});

test("Content validator validates clean datasets and catches broken references", () => {
  const grades = getGrades();
  const subjects = getSubjects();
  const stages = getLessonStages();
  const topics = getTopics();
  const lessons = getLessons();

  const cleanErrors = validateCurriculumData(
    grades,
    subjects,
    stages,
    topics,
    lessons,
  );
  assert.deepEqual(cleanErrors, []);

  // Detect missing topic
  const brokenLessons = structuredClone(lessons);
  brokenLessons[0].topicId = "non-existent-topic";
  const brokenErrors = validateCurriculumData(
    grades,
    subjects,
    stages,
    topics,
    brokenLessons,
  );
  assert.ok(brokenErrors.some((e) => e.message.includes("không tồn tại")));

  // Detect duplicate orders within topic
  const duplicateOrderLessons = structuredClone(lessons);
  duplicateOrderLessons[1].order = duplicateOrderLessons[0].order;
  duplicateOrderLessons[1].topicId = duplicateOrderLessons[0].topicId;
  const orderErrors = validateCurriculumData(
    grades,
    subjects,
    stages,
    topics,
    duplicateOrderLessons,
  );
  assert.ok(orderErrors.some((e) => e.message.includes("bị trùng lặp")));

  // Detect reward validation issues
  const rewards = getRewardCatalog();
  const cleanRewardErrors = validateRewardsData(rewards);
  assert.deepEqual(cleanRewardErrors, []);

  const brokenRewards = structuredClone(rewards);
  brokenRewards[0].cost = -100;
  const rewardErrors = validateRewardsData(brokenRewards);
  assert.ok(rewardErrors.some((e) => e.message.includes("số nguyên dương")));

  // Detect practice & assessment validations
  const practice = getPracticeProblem();
  assert.deepEqual(validatePracticeProblemData(practice), []);

  const assessment = getSampleAssessment();
  assert.deepEqual(validateAssessmentData(assessment), []);
});
