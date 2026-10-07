import { appConfig } from '../../../config/app';
import { curriculumRules } from '../rules';
import type { Lesson, Topic, LessonStage } from '..';

export type ContentStage = LessonStage;
export type TopicDraft = Pick<Topic, 'gradeId' | 'subjectId' | 'title' | 'description'> & { id?: string };
export const statuses = [
  { id: 'all', label: 'Tất cả bài học', icon: 'library_books', tone: 'text-primary', detail: 'Toàn bộ bài học và dạng bài' },
  { id: 'published', label: 'Đã xuất bản', icon: 'check_circle', tone: 'text-secondary', detail: 'Hiển thị trong chương trình học' },
  { id: 'draft', label: 'Bản nháp', icon: 'edit_note', tone: 'text-warning', detail: 'Đang biên soạn, chưa hiển thị' },
] as const;

export function cleanLesson(lesson: Lesson, status: Lesson['status']): Lesson {
  return {
    ...lesson, status, title: lesson.title.trim(), summary: lesson.summary.trim(),
    theory: lesson.theory.map(item => ({ heading: item.heading.trim(), text: item.text.trim() })),
    examples: lesson.examples.map(item => ({ title: item.title.trim(), prompt: item.prompt.trim(), steps: item.steps.map(step => step.trim()).filter(Boolean), answer: item.answer.trim() })),
    exercises: lesson.exercises.map(item => ({ ...item, prompt: item.prompt.trim(), options: item.options.map(option => option.trim()), explanation: item.explanation.trim() })),
  };
}


export function getEditorErrors(lesson: Lesson, topics: Topic[], lessons: Lesson[]): string[] {
    const issues: string[] = [];
    if (lesson.title.trim().length < curriculumRules.titleMinLength) issues.push(`Tên bài học cần ít nhất ${curriculumRules.titleMinLength} ký tự.`);
    if (!Number.isInteger(lesson.durationMinutes) || lesson.durationMinutes < curriculumRules.duration.min || lesson.durationMinutes > curriculumRules.duration.max) issues.push(`Thời lượng cần là số nguyên từ ${curriculumRules.duration.min} đến ${curriculumRules.duration.max} phút.`);
    if (!topics.some(topic => topic.id === lesson.topicId && topic.gradeId === lesson.gradeId && topic.subjectId === lesson.subjectId)) issues.push('Vui lòng chọn một chủ đề hợp lệ.');
    if (lessons.some(item => item.id !== lesson.id && item.topicId === lesson.topicId && item.title.trim().toLocaleLowerCase(appConfig.locale) === lesson.title.trim().toLocaleLowerCase(appConfig.locale))) issues.push('Tên bài học này đã có trong chủ đề. Vui lòng dùng tên khác.');
    return issues;
}


export function createLessonDraft(gradeId: string, subjectId: string, topicId: string, topicLessons: Lesson[]): Lesson {
  return {
      id: crypto.randomUUID(), gradeId, subjectId, topicId, title: '', summary: '', kind: 'lesson',
      durationMinutes: curriculumRules.duration.default, order: Math.max(0, ...topicLessons.map(item => item.order)) + 1, status: 'draft',
      theory: [{ heading: '', text: '' }], examples: [{ title: '', prompt: '', steps: [''], answer: '' }],
      exercises: [{ id: crypto.randomUUID(), prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }],
    };
}
