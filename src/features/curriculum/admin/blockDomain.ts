import type { Lesson, LessonStage } from '..';

export const stageMeta = {
  theory: {
    heading: 'Lý thuyết',
    description: 'Chia kiến thức thành các mục dễ đọc. Nội dung hỗ trợ văn bản thông thường và công thức.',
    block: 'Mục',
    action: 'mục lý thuyết',
    empty: 'Chưa có mục lý thuyết.',
    add: 'Thêm mục lý thuyết',
  },
  examples: {
    heading: 'Ví dụ minh họa',
    description: 'Kết nối kiến thức với tình huống cụ thể và hướng dẫn từng bước.',
    block: 'Ví dụ',
    action: 'ví dụ',
    empty: 'Chưa có ví dụ minh họa.',
    add: 'Thêm ví dụ',
  },
  exercises: {
    heading: 'Bài tập vận dụng',
    description: 'Mỗi câu hỏi gồm các lựa chọn, một đáp án đúng và lời giải thích để học sinh tự kiểm tra.',
    block: 'Bài tập',
    action: 'bài tập',
    empty: 'Chưa có bài tập vận dụng.',
    add: 'Thêm bài tập',
  },
};

export function hasContent(lesson: Lesson, stage: LessonStage, index: number) {
  if (stage === 'theory') {
    const item = lesson.theory[index];
    return Boolean(item.heading.trim() || item.text.trim());
  }
  if (stage === 'examples') {
    const item = lesson.examples[index];
    return Boolean(item.title.trim() || item.prompt.trim() || item.answer.trim() || item.steps.some(step => step.trim()));
  }
  const item = lesson.exercises[index];
  return Boolean(item.prompt.trim() || item.explanation.trim() || item.options.some(option => option.trim()));
}

export function moveItem<T,>(items: T[], index: number, direction: -1 | 1) {
  const next = [...items];
  [next[index], next[index + direction]] = [next[index + direction], next[index]];
  return next;
}

