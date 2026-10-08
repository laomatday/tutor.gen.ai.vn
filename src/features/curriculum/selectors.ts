import { studentProfile } from '../learning/data/student';
import { SUBJECTS } from './catalog';
import type { Lesson, Topic } from './model';

export const canStudy = (gradeId: string, subjectId: string) => studentProfile.enrollments.some(course => course.gradeId === gradeId && course.subjectId === subjectId);
export const primaryEnrollment = studentProfile.enrollments[0];
export const subjectFor = (subjectId: string) => SUBJECTS.find(subject => subject.id === subjectId);
export const courseLabel = (gradeId: string, subjectId: string) => `${subjectFor(subjectId)?.name ?? subjectId} lớp ${gradeId}`;
export function isPublishedInCurriculum(lesson: Lesson, topics: Topic[]) {
  return lesson.status === 'published' && topics.some(topic => topic.id === lesson.topicId && topic.gradeId === lesson.gradeId && topic.subjectId === lesson.subjectId);
}
export function ownedPublishedLessons(lessons: Lesson[], topics: Topic[]) {
  const enrollmentRank = (gradeId: string, subjectId: string) => {
    const index = studentProfile.enrollments.findIndex(
      course => course.gradeId === gradeId && course.subjectId === subjectId,
    );
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return lessons
    .filter(lesson => canStudy(lesson.gradeId, lesson.subjectId) && isPublishedInCurriculum(lesson, topics))
    .sort((a, b) =>
      enrollmentRank(a.gradeId, a.subjectId) - enrollmentRank(b.gradeId, b.subjectId)
      || a.order - b.order
      || a.title.localeCompare(b.title, "vi")
    );
}
export function summarizeProgress(lessons: Lesson[], completedIds: string[]) {
  const completed = lessons.filter(lesson => completedIds.includes(lesson.id)).length;
  return { completed, total: lessons.length, percent: lessons.length ? Math.round(completed / lessons.length * 100) : 0,
    nextLesson: lessons.find(lesson => !completedIds.includes(lesson.id)) ?? lessons[0] };
}
