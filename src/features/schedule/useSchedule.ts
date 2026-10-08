import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { storageKeys } from "../../config/storage";
import { browserStorage } from "../../lib/browserStorage";
import { readSchedule } from "./domain";
import type { ScheduleSession } from "./types";

export function useSchedule() {
  const [initial] = useState(() => readSchedule(browserStorage));
  const [state, setState] = useState({
    sessions: initial.value,
    edited: false,
  });
  const [storageError, setStorageError] = useState(initial.error);
  const setSessions = useCallback(
    (update: SetStateAction<ScheduleSession[]>) => {
      setState((current) => ({
        sessions:
          typeof update === "function" ? update(current.sessions) : update,
        edited: true,
      }));
    },
    [],
  );

  useEffect(() => {
    // Do not replace an unreadable saved schedule just by visiting the page.
    if (!state.edited) return;
    try {
      browserStorage.write(
        storageKeys.studentSchedule,
        JSON.stringify(state.sessions),
      );
      setStorageError(null);
    } catch {
      setStorageError(
        "Trình duyệt không cho phép lưu lịch. Thay đổi chỉ được giữ trong phiên hiện tại.",
      );
    }
  }, [state]);

  return { sessions: state.sessions, setSessions, storageError };
}
