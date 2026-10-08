import type { PracticeProblem, StudentEnrollment } from "../../types/content";

/** Standalone exercises belong to an enrolled course even before an optional
 * related lesson is published. This never grants access to unpublished lessons. */
export function getEnrolledPracticeProblems(
  problems: readonly PracticeProblem[],
  enrollments: readonly StudentEnrollment[],
  course?: StudentEnrollment,
): PracticeProblem[] {
  return problems.filter(
    (problem) =>
      enrollments.some(
        (enrollment) =>
          enrollment.gradeId === problem.gradeId &&
          enrollment.subjectId === problem.subjectId,
      ) &&
      (!course ||
        (course.gradeId === problem.gradeId &&
          course.subjectId === problem.subjectId)),
  );
}
