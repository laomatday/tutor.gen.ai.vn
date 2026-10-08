import { useState } from "react";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { browserStorage, readStoredValue } from "../../lib/browserStorage";
import {
  createPracticeSession,
  isPracticeSession,
  isPracticeSessions,
  type PracticeSession,
  type PracticeSessions,
} from "./domain";

/** Preserve the former single exercise session, then store progress independently per problem. */
function migratedSessions(): PracticeSessions {
  const legacy = readStoredValue<PracticeSession | null>(
    browserStorage,
    storageKeys.practiceSessionV2,
    null,
    (value): value is PracticeSession | null =>
      value === null || isPracticeSession(value),
  ).value;
  return legacy?.problemId ? { [legacy.problemId]: legacy } : {};
}
export function usePracticeSession(problemId: string) {
  const [initial] = useState(migratedSessions);
  const [sessions, setSessions, error] = useLocalStorage<PracticeSessions>(
    storageKeys.practiceSessionsV3,
    initial,
    isPracticeSessions,
  );
  const [empty] = useState(() => createPracticeSession(problemId));
  const session =
    sessions[problemId] ??
    (empty.problemId === problemId ? empty : createPracticeSession(problemId));
  const update = (change: (current: PracticeSession) => PracticeSession) => {
    setSessions((current) => ({
      ...current,
      [problemId]: change(current[problemId] ?? session),
    }));
  };
  return [session, update, error] as const;
}
