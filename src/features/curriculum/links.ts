import { routePath } from '../../config/routes';
import type { Lesson, LessonStage } from './model';

export function courseHref(gradeId: string, subjectId: string, topicId?: string) {
  const query = new URLSearchParams({ grade: gradeId, subject: subjectId });
  if (topicId) query.set('topic', topicId);
  return `${routePath('hoc-bai')}?${query}`;
}
export function lessonHref(lesson: Lesson, stage: LessonStage = 'theory') {
  const query = new URLSearchParams({ grade: lesson.gradeId, subject: lesson.subjectId, topic: lesson.topicId, lesson: lesson.id, stage });
  return `${routePath('hoc-bai')}?${query}`;
}
