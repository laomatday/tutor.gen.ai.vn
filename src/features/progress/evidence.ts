import type { Lesson } from "../../types/content";
import { getPracticeProblems } from "../practice/data";
import {
  getPracticeStats,
  isPracticeSessions,
  type PracticeSessions,
} from "../practice/domain";

export interface LearningEvidence {
  id: string;
  lessonId: string;
  source: "lesson-completion" | "studio-check" | "studio-submit";
  problemId?: string;
  /** A verified answer or lesson completion, not mastery. */
  valid: boolean;
  at: number | null;
  /** Only a previously wrong attempt followed by a valid attempt counts as correction. */
  corrected: boolean;
}

export interface LessonEvidenceSummary {
  lessonId: string;
  lessonCompleted: boolean;
  studioAttempts: number;
  validStudioAttempts: number;
  corrections: number;
  lastStudioAttemptAt: number | null;
  needsReview: boolean;
}

/**
 * One projection of retained learning events. It deliberately does not infer
 * mastery, assign grades, award rewards or create any browser-side records.
 * The projection can later be fed by server-owned attempts with the same shape.
 */
export function selectLearningEvidence(
  lessons: Pick<Lesson, "id">[],
  completedIds: readonly string[],
  candidateSessions: unknown,
): LearningEvidence[] {
  const available = new Set(lessons.map((lesson) => lesson.id));
  const problemLessons = new Map(getPracticeProblems().map((problem) => [
    problem.id, problem.lessonId,
  ]));
  const evidence: LearningEvidence[] = [];
  for (const lessonId of new Set(completedIds)) {
    if (!available.has(lessonId)) continue;
    evidence.push({
      id: `completion:${lessonId}`,
      lessonId,
      source: "lesson-completion",
      valid: true,
      at: null,
      corrected: false,
    });
  }
  if (!isPracticeSessions(candidateSessions)) return evidence;
  const sessions: PracticeSessions = candidateSessions;
  for (const [problemId, session] of Object.entries(sessions)) {
    const lessonId = problemLessons.get(problemId);
    if (!lessonId || !available.has(lessonId)) continue;
    // Bound checks to recorded, validated events, not boolean rewarded/solved.
    const checks = getPracticeStats(session).checks;
    let hadMistake = false;
    for (const event of checks) {
      const valid = event.valid === true;
      const corrected = valid && hadMistake;
      evidence.push({
        id: `practice:${problemId}:${event.id}`,
        lessonId,
        problemId,
        source: event.kind === "submit" ? "studio-submit" : "studio-check",
        valid,
        at: event.at,
        corrected,
      });
      if (valid) hadMistake = false;
      else if (event.issue !== "empty" && event.issue !== "format" && event.issue !== "incomplete") {
        hadMistake = true;
      }
    }
  }
  return evidence;
}

export function summarizeLessonEvidence(
  lessons: Pick<Lesson, "id">[],
  completedIds: readonly string[],
  sessions: unknown,
): LessonEvidenceSummary[] {
  const events = selectLearningEvidence(lessons, completedIds, sessions);
  const grouped = new Map<string, LearningEvidence[]>();
  for (const event of events) {
    const list = grouped.get(event.lessonId) ?? [];
    list.push(event);
    grouped.set(event.lessonId, list);
  }
  return lessons.map((lesson) => {
    const records = grouped.get(lesson.id) ?? [];
    const attempts = records.filter((event) => event.source !== "lesson-completion");
    const last = attempts.reduce<LearningEvidence | null>(
      (latest, current) => !latest || (current.at ?? 0) >= (latest.at ?? 0) ? current : latest,
      null,
    );
    return {
      lessonId: lesson.id,
      lessonCompleted: records.some((event) => event.source === "lesson-completion"),
      studioAttempts: attempts.length,
      validStudioAttempts: attempts.filter((event) => event.valid).length,
      corrections: attempts.filter((event) => event.corrected).length,
      lastStudioAttemptAt: last?.at ?? null,
      needsReview: last?.valid === false,
    };
  });
}
