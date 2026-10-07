import type { Grade, Subject, Topic, Lesson, LessonStageInfo, RewardItem, PracticeProblem, SampleAssessment } from '../types/content';

export interface ContentValidationError {
  scope: string;
  id?: string;
  message: string;
}

/**
 * Validates the relational consistency and structural completeness of content JSON files.
 * Runs in development and testing to ensure data pipelines do not introduce integrity regressions.
 */
export function validateCurriculumData(
  grades: Grade[],
  subjects: Subject[],
  stages: LessonStageInfo[],
  topics: Topic[],
  lessons: Lesson[],
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  const gradeIds = new Set(grades.map(item => item.id));
  const subjectIds = new Set(subjects.map(item => item.id));
  const stageIds = new Set(stages.map(item => item.id));
  const topicIds = new Set<string>();
  const lessonIds = new Set<string>();

  if (gradeIds.size !== grades.length) {
    errors.push({ scope: 'grades', message: 'Mã khối lớp (gradeId) bị trùng lặp.' });
  }
  if (subjectIds.size !== subjects.length) {
    errors.push({ scope: 'subjects', message: 'Mã môn học (subjectId) bị trùng lặp.' });
  }
  if (stageIds.size !== stages.length) {
    errors.push({ scope: 'stages', message: 'Mã giai đoạn bài học (stageId) bị trùng lặp.' });
  }

  for (const topic of topics) {
    if (!topic.id || topicIds.has(topic.id)) {
      errors.push({ scope: 'topics', id: topic.id, message: `Chủ đề có mã '${topic.id}' không hợp lệ hoặc bị trùng.` });
    }
    topicIds.add(topic.id);
    if (!gradeIds.has(topic.gradeId)) {
      errors.push({ scope: 'topics', id: topic.id, message: `Chủ đề '${topic.title}' trỏ đến gradeId '${topic.gradeId}' không tồn tại.` });
    }
    if (!subjectIds.has(topic.subjectId)) {
      errors.push({ scope: 'topics', id: topic.id, message: `Chủ đề '${topic.title}' trỏ đến subjectId '${topic.subjectId}' không tồn tại.` });
    }
    if (!topic.title.trim()) {
      errors.push({ scope: 'topics', id: topic.id, message: `Chủ đề '${topic.id}' thiếu tiêu đề.` });
    }
  }

  const topicMap = new Map(topics.map(topic => [topic.id, topic]));
  const ordersByTopic = new Map<string, Set<number>>();

  for (const lesson of lessons) {
    if (!lesson.id || lessonIds.has(lesson.id)) {
      errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học có mã '${lesson.id}' không hợp lệ hoặc bị trùng.` });
    }
    lessonIds.add(lesson.id);

    const parentTopic = topicMap.get(lesson.topicId);
    if (!parentTopic) {
      errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học '${lesson.title}' tham chiếu topicId '${lesson.topicId}' không tồn tại.` });
    } else {
      if (parentTopic.gradeId !== lesson.gradeId) {
        errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học '${lesson.title}' có gradeId '${lesson.gradeId}' khác với chủ đề '${parentTopic.gradeId}'.` });
      }
      if (parentTopic.subjectId !== lesson.subjectId) {
        errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học '${lesson.title}' có subjectId '${lesson.subjectId}' khác với chủ đề '${parentTopic.subjectId}'.` });
      }
    }

    if (!gradeIds.has(lesson.gradeId)) {
      errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học '${lesson.title}' trỏ đến gradeId '${lesson.gradeId}' không hợp lệ.` });
    }
    if (!subjectIds.has(lesson.subjectId)) {
      errors.push({ scope: 'lessons', id: lesson.id, message: `Bài học '${lesson.title}' trỏ đến subjectId '${lesson.subjectId}' không hợp lệ.` });
    }

    if (!ordersByTopic.has(lesson.topicId)) {
      ordersByTopic.set(lesson.topicId, new Set());
    }
    const topicOrders = ordersByTopic.get(lesson.topicId)!;
    if (topicOrders.has(lesson.order)) {
      errors.push({ scope: 'lessons', id: lesson.id, message: `Thứ tự bài học (order: ${lesson.order}) bị trùng lặp trong chủ đề '${lesson.topicId}'.` });
    }
    topicOrders.add(lesson.order);

    const exerciseIds = new Set<string>();
    for (const exercise of lesson.exercises) {
      if (!exercise.id || exerciseIds.has(exercise.id)) {
        errors.push({ scope: 'exercises', id: lesson.id, message: `Bài tập '${exercise.id}' trong bài '${lesson.id}' bị trùng mã.` });
      }
      exerciseIds.add(exercise.id);
      if (exercise.options.length < 2) {
        errors.push({ scope: 'exercises', id: lesson.id, message: `Bài tập '${exercise.id}' có ít hơn 2 phương án.` });
      }
      if (exercise.correctIndex < 0 || exercise.correctIndex >= exercise.options.length) {
        errors.push({ scope: 'exercises', id: lesson.id, message: `Đáp án đúng (${exercise.correctIndex}) ngoài khoảng phương án của '${exercise.id}'.` });
      }
    }
  }

  return errors;
}

export function validateRewardsData(items: RewardItem[]): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id || ids.has(item.id)) {
      errors.push({ scope: 'rewards', id: item.id, message: `Phần thưởng '${item.id}' không hợp lệ hoặc bị trùng.` });
    }
    ids.add(item.id);
    if (!Number.isInteger(item.cost) || item.cost <= 0) {
      errors.push({ scope: 'rewards', id: item.id, message: `Giá đổi của '${item.id}' phải là số nguyên dương.` });
    }
    if (!Number.isInteger(item.stock) || item.stock < 0) {
      errors.push({ scope: 'rewards', id: item.id, message: `Số lượng tồn kho của '${item.id}' phải không âm.` });
    }
  }
  return errors;
}

export function validatePracticeProblemData(problem: PracticeProblem): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  if (!problem.id || !problem.title.trim()) {
    errors.push({ scope: 'practice', id: problem.id, message: 'Bài toán mẫu thiếu id hoặc tiêu đề.' });
  }
  if (!Array.isArray(problem.hints) || !problem.hints.length) {
    errors.push({ scope: 'practice', id: problem.id, message: 'Bài toán mẫu cần ít nhất 1 gợi ý.' });
  }
  return errors;
}

export function validateAssessmentData(assessment: SampleAssessment): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  if (!assessment.id || !assessment.title.trim()) {
    errors.push({ scope: 'assessment', id: assessment.id, message: 'Đề đánh giá mẫu thiếu id hoặc tiêu đề.' });
  }
  if (!assessment.skills.length) {
    errors.push({ scope: 'assessment', id: assessment.id, message: 'Đề đánh giá mẫu cần có danh sách kỹ năng.' });
  }
  return errors;
}
