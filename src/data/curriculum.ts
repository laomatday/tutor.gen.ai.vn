import { GRADES, SUBJECTS, lessonStages } from "../features/curriculum/catalog";
import topicsData from "./curriculum/topics.json";
import lessonsData from "./curriculum/lessons.json";

import type {
  Grade,
  Subject,
  Topic,
  Lesson,
  LessonStageInfo,
  LessonStage,
} from "../types/content";
import { validateCurriculumData } from "./validation";

export type { Grade, Subject, Topic, Lesson, LessonStageInfo, LessonStage };

const topics = topicsData as Topic[];
const lessons = lessonsData as Lesson[];

if (process.env.NODE_ENV !== "production") {
  const errors = validateCurriculumData(
    GRADES,
    SUBJECTS,
    lessonStages,
    topics,
    lessons,
  );
  if (errors.length > 0) {
    console.warn(
      `[Content Validation] Found ${errors.length} curriculum integrity issues:`,
      errors,
    );
  }
}

/** Data access functions for academic curriculum content */

export function getGrades(): Grade[] {
  return GRADES.map((g) => ({ ...g }));
}

export function getGradeById(gradeId: string): Grade | undefined {
  return GRADES.find((g) => g.id === gradeId);
}

export function getSubjects(): Subject[] {
  return SUBJECTS.map((s) => ({ ...s }));
}

export function getSubjectById(subjectId: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === subjectId);
}

export function getSubjectsByGrade(gradeId: string): Subject[] {
  return getSubjects();
}

export function getLessonStages(): LessonStageInfo[] {
  return lessonStages.map((s) => ({ ...s }));
}

export function getTopics(subjectId?: string, gradeId?: string): Topic[] {
  return topics
    .filter(
      (t) =>
        (!subjectId || t.subjectId === subjectId) &&
        (!gradeId || t.gradeId === gradeId),
    )
    .map((t) => ({ ...t }));
}

export function getTopicById(topicId: string): Topic | undefined {
  const found = topics.find((t) => t.id === topicId);
  return found ? { ...found } : undefined;
}

export function getLessons(topicId?: string): Lesson[] {
  const filtered = topicId
    ? lessons.filter((l) => l.topicId === topicId)
    : lessons;
  return filtered.map((l) => structuredClone(l));
}

export function getLessonById(lessonId: string): Lesson | undefined {
  const found = lessons.find((l) => l.id === lessonId);
  return found ? structuredClone(found) : undefined;
}

export function getLessonsByCourse(
  gradeId: string,
  subjectId: string,
): Lesson[] {
  return lessons
    .filter((l) => l.gradeId === gradeId && l.subjectId === subjectId)
    .sort((a, b) => a.order - b.order)
    .map((l) => structuredClone(l));
}

/**
 * Backward-compatible exports loaded from JSON source of truth.
 * Used for initial state seeding and validation.
 */
export { GRADES, SUBJECTS, lessonStages };
export const INITIAL_TOPICS: Topic[] = getTopics();
export const INITIAL_LESSONS: Lesson[] = getLessons();

// Re-export domain rules, selectors, links and validation for backward compatibility
export * from "../features/curriculum/selectors";
export * from "../features/curriculum/links";
export * from "../features/curriculum/rules";
export * from "../features/curriculum/validation";
