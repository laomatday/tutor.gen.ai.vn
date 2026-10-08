import modelData from "./data/discoveryModels.json";
import type { Lesson, LessonExercise } from "../../types/content";

interface DiscoveryBinding {
  lessonId: string;
  gradeId: string;
  subjectId: string;
  exerciseId: string;
  expectedPrompt: string;
  title: string;
  instruction: string;
  initial: number;
}

export type DiscoveryModel = DiscoveryBinding &
  (
    | { kind: "square-root-domain"; offset: number; min: number; max: number }
    | { kind: "parabola"; coefficients: number[] }
  );

export function isDiscoveryModel(value: unknown): value is DiscoveryModel {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    ![
      "lessonId",
      "gradeId",
      "subjectId",
      "exerciseId",
      "expectedPrompt",
      "title",
      "instruction",
    ].every((key) => typeof item[key] === "string" && item[key].length > 0) ||
    typeof item.initial !== "number" ||
    !Number.isFinite(item.initial)
  )
    return false;
  if (item.kind === "square-root-domain") {
    const { min, max, offset, initial } = item;
    return (
      typeof min === "number" &&
      typeof max === "number" &&
      typeof offset === "number" &&
      [min, max, offset, initial].every(Number.isInteger) &&
      min >= -20 &&
      max <= 20 &&
      min < max &&
      offset >= min &&
      offset <= max &&
      initial >= min &&
      initial <= max
    );
  }
  return (
    item.kind === "parabola" &&
    Array.isArray(item.coefficients) &&
    item.coefficients.length >= 2 &&
    item.coefficients.length <= 8 &&
    item.coefficients.every(
      (coefficient) =>
        typeof coefficient === "number" &&
        Number.isFinite(coefficient) &&
        coefficient !== 0 &&
        Math.abs(coefficient) <= 3,
    ) &&
    new Set(item.coefficients).size === item.coefficients.length &&
    item.coefficients.includes(item.initial)
  );
}

/** Bind a visual to reviewed academic content, never just a reusable lesson ID. */
export function selectDiscovery(lesson: Lesson) {
  const exercise = lesson.exercises[0];
  if (lesson.status !== "published" || !isDiscoveryExercise(exercise))
    return null;
  const model = (modelData as unknown[])
    .filter(isDiscoveryModel)
    .find(
      (candidate) =>
        candidate.lessonId === lesson.id &&
        candidate.gradeId === lesson.gradeId &&
        candidate.subjectId === lesson.subjectId &&
        candidate.exerciseId === exercise.id &&
        candidate.expectedPrompt === exercise.prompt,
    );
  return { exercise, model };
}

function isDiscoveryExercise(
  exercise: LessonExercise | undefined,
): exercise is LessonExercise {
  return Boolean(
    exercise &&
    exercise.prompt.trim() &&
    exercise.explanation.trim() &&
    exercise.options.length >= 2 &&
    exercise.options.every((option) => option.trim()) &&
    Number.isInteger(exercise.correctIndex) &&
    exercise.correctIndex >= 0 &&
    exercise.correctIndex < exercise.options.length,
  );
}

/** Use the same coordinates and scale for every coefficient so comparisons stay honest. */
export function parabolaPoints(coefficient: number) {
  return Array.from({ length: 81 }, (_, index) => {
    const x = -2 + index / 20;
    return {
      x,
      y: coefficient * x * x,
      screenX: 160 + x * 62,
      screenY: 114 - coefficient * x * x * 8,
    };
  });
}
