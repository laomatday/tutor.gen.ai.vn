import { useCallback, useEffect, useRef, useState } from "react";
import { appConfig } from "../config/app";
export function useNotice() {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setNotice(null);
  }, []);
  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(
      () => setNotice(null),
      appConfig.feedback.noticeDurationMs,
    );
  }, []);
  return { notice, show, clear };
}
