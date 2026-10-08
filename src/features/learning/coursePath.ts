import {
  getCourseProgress,
  type Lesson,
  type StudentEnrollment,
  type Topic,
} from "../curriculum";

export type CoursePathState = "complete" | "current" | "available";

export interface CoursePathStep {
  lesson: Lesson;
  state: CoursePathState;
}

export interface CoursePathUnit {
  topic: Topic;
  number: number;
  steps: CoursePathStep[];
  state: CoursePathState;
  completed: number;
  minutes: number;
}

export interface CoursePath {
  units: CoursePathUnit[];
  nextLesson?: Lesson;
  completed: number;
  total: number;
  minutes: number;
}

/** A suggested order, never a permission gate. Only published, enrolled lessons
 * participate, and visiting a step does not create completion evidence. */
export function buildCoursePath(
  topics: Topic[],
  lessons: Lesson[],
  completedIds: string[],
  enrollment: StudentEnrollment,
): CoursePath {
  const progress = getCourseProgress(lessons, topics, completedIds, enrollment);
  const done = new Set(completedIds);
  const grouped = new Map<string, Lesson[]>();
  for (const lesson of progress.lessons) {
    const group = grouped.get(lesson.topicId) ?? [];
    group.push(lesson);
    grouped.set(lesson.topicId, group);
  }
  const units = [...grouped].map(([topicId, items], index): CoursePathUnit => {
    const completed = items.filter((lesson) => done.has(lesson.id)).length;
    return {
      topic: topics.find(
        (topic) =>
          topic.id === topicId &&
          topic.gradeId === enrollment.gradeId &&
          topic.subjectId === enrollment.subjectId,
      )!,
      number: index + 1,
      steps: items.map((lesson) => ({
        lesson,
        state: done.has(lesson.id)
          ? "complete"
          : lesson.id === progress.nextLesson?.id
            ? "current"
            : "available",
      })),
      state:
        completed === items.length
          ? "complete"
          : items.some((lesson) => lesson.id === progress.nextLesson?.id)
            ? "current"
            : "available",
      completed,
      minutes: items.reduce(
        (total, lesson) => total + lesson.durationMinutes,
        0,
      ),
    };
  });
  return {
    units,
    nextLesson: progress.nextLesson,
    completed: progress.completed,
    total: progress.total,
    minutes: progress.lessons.reduce(
      (total, lesson) => total + lesson.durationMinutes,
      0,
    ),
  };
}

export function compactPathUnit(path: CoursePath) {
  const unit =
    path.units.find((item) => item.state === "current") ?? path.units.at(-1);
  if (!unit) return undefined;
  const currentIndex = unit.steps.findIndex((step) => step.state === "current");
  const start = Math.max(0, Math.min(currentIndex - 1, unit.steps.length - 3));
  return { ...unit, steps: unit.steps.slice(start, start + 3) };
}
