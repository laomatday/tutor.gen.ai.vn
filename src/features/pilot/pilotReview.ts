/**
 * This signal is about the learner's latest SERVER-GRADED quiz, not
 * a diagnosis, mastery score or prediction of their academic capability.
 */
export interface QuizOutcome {
  correct_count: number;
  question_count: number;
}

export type TeacherReviewSignal = "no-evidence" | "review-needed" | "quiz-passed";

export function classifyLatestQuiz(value: QuizOutcome | null | undefined): TeacherReviewSignal {
  if (!value ||
    !Number.isSafeInteger(value.question_count) ||
    !Number.isSafeInteger(value.correct_count) ||
    value.question_count < 1 ||
    value.correct_count < 0 ||
    value.correct_count > value.question_count
  ) return "no-evidence";
  return value.correct_count < value.question_count ? "review-needed" : "quiz-passed";
}

export function countDistinctSkillEvidence(rows: readonly { skill_id: string }[]): number {
  return new Set(rows.filter(row => typeof row?.skill_id === "string").map(row => row.skill_id)).size;
}

export function rewardLedgerBalance(rows: readonly { amount: number }[]): number {
  return rows.reduce((sum, row) => sum +
    (Number.isSafeInteger(row.amount) ? row.amount : 0),0);
}
