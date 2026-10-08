import { routePath } from "../../config/routes";
import { getPracticeStats, type PracticeSession } from "../practice/domain";
import { useStudyJourney } from "./studyJourney";

/** Reading a dashboard must never create an attempt or overwrite a saved session. */
export function usePracticeEvidence() {
  const journey = useStudyJourney();
  const session: PracticeSession = journey.recentSession ?? {
    input: "",
    openedHints: [],
    rewarded: false,
    events: [],
  };
  const stats = getPracticeStats(session);
  return {
    session,
    attempts: stats.checks,
    errors: stats.mistakes,
    successes: stats.checks.filter((event) => event.valid === true),
    lastAttempt: stats.checks.at(-1),
    selfCorrected: stats.corrections,
    needsReview: stats.mistakes.includes(stats.checks.at(-1)!),
  };
}

export function practiceHref(problemId: string, replay = false) {
  return `${routePath(replay ? "replay" : "tu-giai")}?${new URLSearchParams({ problem: problemId })}`;
}
