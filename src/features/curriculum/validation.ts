import { curriculumRules } from './rules';
import type { Lesson, Topic } from './model';
import { GRADES, SUBJECTS } from './catalog';

export function getPublishErrors(lesson: Lesson): string[] {
  const errors: string[] = [];
  if (!lesson.title.trim() || !lesson.summary.trim()) errors.push('Điền tên bài và mô tả ngắn.');
  if (!GRADES.some(grade => grade.id === lesson.gradeId) || !SUBJECTS.some(subject => subject.id === lesson.subjectId) || !lesson.topicId) errors.push('Chọn đầy đủ lớp, môn và chủ đề.');
  if (!Number.isInteger(lesson.durationMinutes) || lesson.durationMinutes < curriculumRules.duration.min || lesson.durationMinutes > curriculumRules.duration.max) errors.push(`Thời lượng phải từ ${curriculumRules.duration.min} đến ${curriculumRules.duration.max} phút.`);
  if (!lesson.theory.length || lesson.theory.some(block => !block.heading.trim() || !block.text.trim())) errors.push('Bổ sung tiêu đề và nội dung lý thuyết.');
  if (!lesson.examples.length || lesson.examples.some(example => !example.title.trim() || !example.prompt.trim() || !example.answer.trim() || !example.steps.length || example.steps.some(step => !step.trim()))) errors.push('Ví dụ cần có đề bài, các bước giải và kết luận.');
  if (!lesson.exercises.length || lesson.exercises.some(exercise => !exercise.prompt.trim() || exercise.options.length < 2 || exercise.options.some(option => !option.trim()) || !Number.isInteger(exercise.correctIndex) || exercise.correctIndex < 0 || exercise.correctIndex >= exercise.options.length || !exercise.explanation.trim())) errors.push('Bài tập cần đề bài, ít nhất 2 lựa chọn, đáp án đúng và giải thích.');
  if (lesson.exercises.some(exercise => new Set(exercise.options.map(option => option.trim().toLocaleLowerCase('vi'))).size !== exercise.options.length)) errors.push('Các lựa chọn trong cùng một bài tập không được trùng nhau.');
  if (lesson.exercises.some(exercise => !exercise.id) || new Set(lesson.exercises.map(exercise => exercise.id)).size !== lesson.exercises.length) errors.push('Mỗi bài tập cần có một mã riêng.');
  return errors;
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasStrings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string');
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
export function isTopics(value: unknown): value is Topic[] {
  return Array.isArray(value) && value.every(item => isObject(item) && hasStrings(item, ['id', 'gradeId', 'subjectId', 'title', 'description']) && GRADES.some(grade => grade.id === item.gradeId) && SUBJECTS.some(subject => subject.id === item.subjectId)) && new Set(value.map(item => item.id)).size === value.length;
}
export function isLessons(value: unknown): value is Lesson[] {
  return Array.isArray(value) && value.every(item => isObject(item)
    && hasStrings(item, ['id', 'gradeId', 'subjectId', 'topicId', 'title', 'summary'])
    && GRADES.some(grade => grade.id === item.gradeId) && SUBJECTS.some(subject => subject.id === item.subjectId)
    && ['lesson', 'problem-type'].includes(item.kind as string) && ['draft', 'published'].includes(item.status as string)
    && typeof item.order === 'number' && Number.isFinite(item.order)
    && typeof item.durationMinutes === 'number' && Number.isFinite(item.durationMinutes)
    && Array.isArray(item.theory) && item.theory.every(block => isObject(block) && hasStrings(block, ['heading', 'text']))
    && Array.isArray(item.examples) && item.examples.every(example => isObject(example) && hasStrings(example, ['title', 'prompt', 'answer']) && strings(example.steps))
    && Array.isArray(item.exercises) && item.exercises.every(exercise => isObject(exercise) && hasStrings(exercise, ['id', 'prompt', 'explanation']) && strings(exercise.options) && Number.isInteger(exercise.correctIndex))
    && (item.status !== 'published' || getPublishErrors(item as unknown as Lesson).length === 0)
  ) && new Set(value.map(item => item.id)).size === value.length;
}
