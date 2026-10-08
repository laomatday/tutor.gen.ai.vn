import { useEffect, useLayoutEffect, useRef, useState } from "react";

const desktopQuery = "(min-width: 1024px)";

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

export function useMobileNavigation(desktopSidebarVisible = true) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(desktopQuery).matches,
  );
  const sidebar = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasDrawerOpen = useRef(false);
  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const updateViewport = () => {
      setIsDesktop(media.matches);
      if (media.matches) setOpen(false);
    };
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useLayoutEffect(() => {
    const sidebarElement = sidebar.current;
    const contentElement = content.current;
    const activeElement = document.activeElement;
    const drawerOpen = open && !isDesktop;
    const previousOverflow = document.body.style.overflow;

    if (sidebarElement) sidebarElement.inert = !isDesktop && !drawerOpen;
    if (contentElement) contentElement.inert = drawerOpen;
    if (drawerOpen) document.body.style.overflow = "hidden";

    if (drawerOpen && !wasDrawerOpen.current) {
      closeButton.current?.focus();
    } else if (wasDrawerOpen.current && !drawerOpen) {
      // Desktop may hide drawer controls after their visibility transition.
      const target = isDesktop
        ? getFocusableElements(sidebarElement)[0]
        : trigger.current;
      target?.focus();
    } else if (
      activeElement instanceof HTMLElement &&
      sidebarElement?.contains(activeElement) &&
      (sidebarElement.inert || activeElement.getClientRects().length === 0)
    ) {
      // A breakpoint or rail collapse can hide the currently focused control.
      const target = isDesktop
        ? getFocusableElements(sidebarElement)[0]
        : trigger.current;
      target?.focus();
    }
    wasDrawerOpen.current = drawerOpen;

    const handleKey = (event: KeyboardEvent) => {
      if (!drawerOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(sidebarElement);
      const first = focusables[0],
        last = focusables.at(-1);
      const focusOutsideDrawer = !sidebarElement?.contains(
        document.activeElement,
      );
      if (
        event.shiftKey &&
        (document.activeElement === first || focusOutsideDrawer)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || focusOutsideDrawer)
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (drawerOpen) document.body.style.overflow = previousOverflow;
      if (sidebarElement) sidebarElement.inert = false;
      if (contentElement) contentElement.inert = false;
    };
  }, [open, isDesktop, desktopSidebarVisible]);
  return { open, setOpen, isDesktop, sidebar, content, trigger, closeButton };
}
