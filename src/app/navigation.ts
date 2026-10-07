import {
  roleHome,
  studentRoutes,
  workspaceRoutes,
  type UserRole,
} from "../config/routes";

export const BEFORE_NAVIGATE_EVENT = "genai:before-navigate";
export interface AppRoute {
  role: UserRole;
  section: string;
  label: string;
}
export function readRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const role of ["Giáo viên", "Quản trị"] as const) {
    if (path === roleHome[role] || path.startsWith(`${roleHome[role]}/`)) {
      const route =
        workspaceRoutes[role].find((item) => item.path === path) ??
        workspaceRoutes[role][0];
      return { role, section: route.id, label: route.label };
    }
  }
  const route =
    studentRoutes.find((item) => item.path === path) ?? studentRoutes[0];
  return { role: "Học sinh", section: route.id, label: route.label };
}

/** Every in-app navigation passes the same unsaved-change gate. */
export function navigateTo(
  path: string,
  { replace = false, scroll = true } = {},
): boolean {
  const target = new URL(path, window.location.origin);
  if (target.origin !== window.location.origin) return false;
  const next = `${target.pathname}${target.search}${target.hash}`;
  if (
    `${window.location.pathname}${window.location.search}${window.location.hash}` !==
    next
  ) {
    if (
      !window.dispatchEvent(
        new CustomEvent(BEFORE_NAVIGATE_EVENT, {
          detail: { to: next },
          cancelable: true,
        }),
      )
    )
      return false;
    window.history[replace ? "replaceState" : "pushState"](null, "", next);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
  return true;
}

export const ordinaryLinkClick = (event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;
