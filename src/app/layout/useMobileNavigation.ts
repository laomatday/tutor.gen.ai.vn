import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Student navigation: mobile drawer <768px, persistent rail at >=768px,
 * overlay expansion through 1439px, then a pinnable desktop sidebar.
 * Teacher/admin navigation retains the 1024px desktop breakpoint.
 */
const studentRailQuery = "(min-width: 768px)";
const studentWideQuery = "(min-width: 1440px)";
const workspaceDesktopQuery = "(min-width: 1024px)";

function getFocusableElements(container: HTMLElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      window.getComputedStyle(element).visibility !== "hidden",
  );
}

function layoutFor(isStudent: boolean) {
  return {
    isDesktop: window.matchMedia(
      isStudent ? studentRailQuery : workspaceDesktopQuery,
    ).matches,
    isWideDesktop: window.matchMedia(
      isStudent ? studentWideQuery : workspaceDesktopQuery,
    ).matches,
  };
}

export function useMobileNavigation(
  desktopSidebarVisible = true,
  isStudent = false,
) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState(() => layoutFor(isStudent));
  const { isDesktop, isWideDesktop } = layout;
  const overlayOpen = open && !isWideDesktop;
  const sidebar = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasDrawerOpen = useRef(false);

  useEffect(() => {
    const rail = window.matchMedia(
      isStudent ? studentRailQuery : workspaceDesktopQuery,
    );
    const wide = window.matchMedia(
      isStudent ? studentWideQuery : workspaceDesktopQuery,
    );
    const updateViewport = () => {
      const next = layoutFor(isStudent);
      setLayout(next);
      if (next.isWideDesktop) setOpen(false);
    };
    updateViewport();
    rail.addEventListener("change", updateViewport);
    wide.addEventListener("change", updateViewport);
    return () => {
      rail.removeEventListener("change", updateViewport);
      wide.removeEventListener("change", updateViewport);
    };
  }, [isStudent]);

  useLayoutEffect(() => {
    const sidebarElement = sidebar.current;
    const contentElement = content.current;
    const activeElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    // The tablet icon rail remains accessible even when not expanded.
    if (sidebarElement) sidebarElement.inert = !isDesktop && !overlayOpen;
    if (contentElement) contentElement.inert = overlayOpen;
    if (overlayOpen) document.body.style.overflow = "hidden";

    if (overlayOpen && !wasDrawerOpen.current) {
      closeButton.current?.focus();
    } else if (wasDrawerOpen.current && !overlayOpen) {
      const target = isDesktop ? getFocusableElements(sidebarElement)[0] : trigger.current;
      target?.focus();
    } else if (
      activeElement instanceof HTMLElement &&
      sidebarElement?.contains(activeElement) &&
      (sidebarElement.inert || activeElement.getClientRects().length === 0)
    ) {
      const target = isDesktop ? getFocusableElements(sidebarElement)[0] : trigger.current;
      target?.focus();
    }
    wasDrawerOpen.current = overlayOpen;

    const handleKey = (event: KeyboardEvent) => {
      if (!overlayOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(sidebarElement);
      const first = focusables[0], last = focusables.at(-1);
      const outside = !sidebarElement?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (overlayOpen) document.body.style.overflow = previousOverflow;
      if (sidebarElement) sidebarElement.inert = false;
      if (contentElement) contentElement.inert = false;
    };
  }, [overlayOpen, isDesktop, desktopSidebarVisible]);

  return {
    open, setOpen, isDesktop, isWideDesktop,
    sidebar, content, trigger, closeButton,
  };
}
