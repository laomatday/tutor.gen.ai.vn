import microLabs from "./data/microLabs.json";
import type {
  Lesson,
  LessonExercise,
  PracticeProblem,
  StudentEnrollment,
  Topic,
} from "../../types/content";

export type Coefficient = "a" | "b" | "c";
export type QuadraticCoefficients = Record<Coefficient, number>;

export interface MathLabStage {
  id: string;
  title: string;
  focus: Coefficient;
  direction: "positive" | "negative";
  baseline: QuadraticCoefficients;
  prompt: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface MathLabConfig {
  id: string;
  title: string;
  objective: string;
  description: string;
  stages: MathLabStage[];
}

interface MathLabBinding {
  problemId: string;
  lessonId: string;
  gradeId: string;
  subjectId: string;
  topicId: string;
}

export interface DialogueStage {
  exerciseId: string;
  expectedPrompt: string;
  expectedAnswer: string;
  scene: string;
  partner: string;
  partnerLine: string;
  studentInstruction: string;
  hint: string;
  partnerReply: string;
}

export interface DialogueLabConfig {
  id: string;
  lessonId: string;
  gradeId: string;
  subjectId: string;
  topicId: string;
  title: string;
  objective: string;
  steps: DialogueStage[];
}

export type BoundDialogueStage = DialogueStage & { exercise: LessonExercise };
export type BoundDialogueLab = Omit<DialogueLabConfig, "steps"> & {
  steps: BoundDialogueStage[];
};

const math = microLabs.math as MathLabConfig;
const mathBindings = microLabs.mathBindings as MathLabBinding[];
const dialogues = microLabs.dialogue as DialogueLabConfig[];

function validCoefficients(value: QuadraticCoefficients) {
  return (
    Number.isInteger(value.a) && value.a !== 0 && Math.abs(value.a) <= 3 &&
    Number.isInteger(value.b) && Math.abs(value.b) <= 4 &&
    Number.isInteger(value.c) && Math.abs(value.c) <= 4
  );
}

/** Guard authoring configuration, not computed evidence of student mastery. */
export function isMathLabValid(value: MathLabConfig) {
  return (
    !!value &&
    !!value.id &&
    !!value.title &&
    value.stages.length >= 2 &&
    value.stages.every(
      (stage) =>
        !!stage.id &&
        ["a", "b", "c"].includes(stage.focus) &&
        ["negative", "positive"].includes(stage.direction) &&
        validCoefficients(stage.baseline) &&
        stage.choices.length >= 2 &&
        stage.choices.every(Boolean) &&
        Number.isInteger(stage.correctIndex) &&
        stage.correctIndex >= 0 &&
        stage.correctIndex < stage.choices.length &&
        !!stage.prompt &&
        !!stage.hint &&
        !!stage.explanation,
    )
  );
}

export function selectMathLab(
  problem: PracticeProblem,
  lessons: readonly Lesson[],
  topics: readonly Topic[],
  enrollments: readonly StudentEnrollment[],
): MathLabConfig | null {
  const binding = mathBindings.find(
    (entry) =>
      entry.problemId === problem.id &&
      entry.lessonId === problem.lessonId &&
      entry.gradeId === problem.gradeId &&
      entry.subjectId === problem.subjectId &&
      entry.topicId === problem.topicId,
  );
  if (!binding || !isMathLabValid(math)) return null;
  const enrolled = enrollments.some(
    (enrollment) =>
      enrollment.gradeId === binding.gradeId &&
      enrollment.subjectId === binding.subjectId,
  );
  const topicExists = topics.some(
    (topic) =>
      topic.id === binding.topicId &&
      topic.gradeId === binding.gradeId &&
      topic.subjectId === binding.subjectId,
  );
  const publishedLesson = lessons.some(
    (lesson) =>
      lesson.id === binding.lessonId &&
      lesson.gradeId === binding.gradeId &&
      lesson.subjectId === binding.subjectId &&
      lesson.topicId === binding.topicId &&
      lesson.status === "published",
  );
  return enrolled && topicExists && publishedLesson ? math : null;
}

/** Only attach dialogue authored against the exact current published exercise. */
export function selectDialogueLab(lesson: Lesson): BoundDialogueLab | null {
  if (lesson.status !== "published") return null;
  const config = dialogues.find(
    (item) =>
      item.lessonId === lesson.id &&
      item.gradeId === lesson.gradeId &&
      item.subjectId === lesson.subjectId &&
      item.topicId === lesson.topicId,
  );
  if (!config || !config.steps.length) return null;

  const used = new Set<string>();
  const steps: BoundDialogueStage[] = [];
  for (const step of config.steps) {
    const exercise = lesson.exercises.find((item) => item.id === step.exerciseId);
    if (
      !exercise ||
      used.has(step.exerciseId) ||
      exercise.prompt !== step.expectedPrompt ||
      exercise.options[exercise.correctIndex] !== step.expectedAnswer ||
      exercise.options.length < 2 ||
      !exercise.options.every((option) => !!option.trim()) ||
      !exercise.explanation.trim() ||
      !step.partnerLine.trim() ||
      !step.studentInstruction.trim() ||
      !step.hint.trim() ||
      !step.partnerReply.trim()
    ) return null;
    used.add(step.exerciseId);
    steps.push({ ...step, exercise });
  }
  return { ...config, steps };
}

export function hasRunExperiment(
  stage: MathLabStage,
  current: QuadraticCoefficients,
): boolean {
  if (!validCoefficients(current)) return false;
  for (const key of ["a", "b", "c"] as const) {
    if (key !== stage.focus && current[key] !== stage.baseline[key])
      return false;
  }
  const initial = stage.baseline[stage.focus];
  const changed = current[stage.focus];
  return stage.direction === "positive"
    ? changed > initial
    : changed < initial;
}

export function quadraticValue(
  { a, b, c }: QuadraticCoefficients,
  x: number,
) {
  return a * x * x + b * x + c;
}

/** Fixed common scale: visually comparing two curves never shifts the axes. */
export function quadraticPlot(coefficients: QuadraticCoefficients) {
  return Array.from({ length: 81 }, (_, index) => {
    const x = -4 + index / 10;
    const y = quadraticValue(coefficients, x);
    return {
      x,
      y,
      screenX: 26 + ((x + 4) / 8) * 428,
      screenY: 138 - (y / 12) * 120,
    };
  });
}

export function formatQuadratic({ a, b, c }: QuadraticCoefficients) {
  const aTerm = a === 1 ? "x²" : a === -1 ? "−x²" : `${a}x²`;
  const otherTerm = (coefficient: number, variable: string) => {
    if (!coefficient) return "";
    const magnitude = Math.abs(coefficient);
    const value = variable && magnitude === 1 ? "" : String(magnitude);
    return ` ${coefficient < 0 ? "−" : "+"} ${value}${variable}`;
  };
  return `y = ${aTerm}${otherTerm(b, "x")}${otherTerm(c, "")}`;
}
