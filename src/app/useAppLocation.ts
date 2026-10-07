import { useSyncExternalStore } from "react";
const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const snapshot = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;
export function useAppLocation() {
  const path = useSyncExternalStore(subscribe, snapshot, () => "/");
  return new URL(path, window.location.origin);
}
