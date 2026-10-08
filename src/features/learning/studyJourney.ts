import { useEffect, useState } from "react";
import { storageKeys } from "../../config/storage";
import {
  browserStorage,
  readStoredValue,
  type StorageAdapter,
} from "../../lib/browserStorage";
import { localDate, localDayOfWeek } from "../../lib/dates";
import {
  getPracticeStats,
  isPracticeSession,
  isPracticeSessions,
  type PracticeSession,
  type PracticeSessions,
} from "../practice/domain";

export interface StudyJourneyDay {
  key: string;
  label: string;
  isToday: boolean;
  attempts: number;
  active: boolean;
}

export interface StudyJourney {
  weekDays: StudyJourneyDay[];
  /** Active practice days in the current Monday–Sunday calendar week. */
  activeDays: number;
  todayAttempts: number;
  /** Counts reflect retained practice history, not an inferred lifetime total. */
  totalAttempts: number;
  corrections: number;
  savedMistakes: number;
  recentProblemId: string | null;
  /** Latest session with a dated attempt, excluding events in the future. */
  recentSession: PracticeSession | null;
  hasActivity: boolean;
}

const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

/** Derive activity only from validated, dated checks/submissions. Starting a
 * session, viewing a hint, rewarded=true or completing an undated lesson does
 * not establish activity on any calendar day. V3 owns an existing problem's
 * history; V2 contributes only a problem that has not yet been migrated. */
export function selectStudyJourney(
  sessions: unknown,
  legacySession: unknown = null,
  now = new Date(),
): StudyJourney {
  const today = localDate(0, now);
  const mondayOffset = 2 - localDayOfWeek(now);
  const weekDays = weekLabels.map((label, index) => {
    const key = localDate(mondayOffset + index, now);
    return { key, label, isToday: key === today, attempts: 0, active: false };
  });
  const daysByKey = new Map(weekDays.map((day) => [day.key, day]));
  const records: PracticeSession[] = isPracticeSessions(sessions)
    ? Object.values(sessions)
    : [];
  if (
    isPracticeSession(legacySession) &&
    legacySession.problemId?.trim() &&
    !records.some((session) => session.problemId === legacySession.problemId)
  ) {
    records.push(legacySession);
  }

  let totalAttempts = 0;
  let corrections = 0;
  let savedMistakes = 0;
  let recentProblemId: string | null = null;
  let recentSession: PracticeSession | null = null;
  let recentAttemptAt = -1;
  for (const session of records) {
    if (!session.problemId?.trim()) continue;
    const events = (session.events ?? []).filter(
      (event) => event.at >= 0 && event.at <= now.getTime(),
    );
    const stats = getPracticeStats({ ...session, events });
    totalAttempts += stats.checks.length;
    corrections += stats.corrections;
    const mistakeIds = new Set(stats.mistakes.map((event) => event.id));
    savedMistakes += [...new Set(session.savedMistakes ?? [])].filter((id) =>
      mistakeIds.has(id),
    ).length;

    for (const event of stats.checks) {
      const day = daysByKey.get(localDate(0, new Date(event.at)));
      if (day) {
        day.attempts++;
        day.active = true;
      }
      if (event.at >= recentAttemptAt) {
        recentAttemptAt = event.at;
        recentProblemId = session.problemId;
        recentSession = { ...session, events };
      }
    }
  }

  return {
    weekDays,
    activeDays: weekDays.filter((day) => day.active).length,
    todayAttempts: daysByKey.get(today)?.attempts ?? 0,
    totalAttempts,
    corrections,
    savedMistakes,
    recentProblemId,
    recentSession,
    hasActivity: totalAttempts > 0,
  };
}

/** This boundary only reads storage: opening the dashboard never seeds a
 * practice session, records attendance, migrates data or awards points. */
export function readStudyJourney(
  storage: StorageAdapter = browserStorage,
  now = new Date(),
): StudyJourney {
  const sessions = readStoredValue<PracticeSessions>(
    storage,
    storageKeys.practiceSessionsV3,
    {},
    isPracticeSessions,
  ).value;
  const legacy = readStoredValue<PracticeSession | null>(
    storage,
    storageKeys.practiceSessionV2,
    null,
    (value): value is PracticeSession | null =>
      value === null || isPracticeSession(value),
  ).value;
  return selectStudyJourney(sessions, legacy, now);
}

export function useStudyJourney(): StudyJourney {
  const [journey, setJourney] = useState(() => readStudyJourney());
  useEffect(() => {
    let lastDay = localDate();
    const refresh = () => {
      lastDay = localDate();
      setJourney(readStudyJourney());
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === storageKeys.practiceSessionsV3 ||
        event.key === storageKeys.practiceSessionV2
      )
        refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    // Refresh the calendar after local midnight, including a week/year change.
    const midnightCheck = window.setInterval(() => {
      if (localDate() !== lastDay) refresh();
    }, 60_000);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(midnightCheck);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return journey;
}
