import { useEffect, useRef, useState } from "react";

export function useMobileNavigation(desktopSidebarVisible = true) {
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    const update = () => {
      // The layout's CSS owns its breakpoint; JS reads the resulting visibility.
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (sidebar.current) sidebar.current.inert = desktop ? !desktopSidebarVisible : !open;
      if (content.current) content.current.inert = !desktop && open;
      document.body.style.overflow = !desktop && open ? "hidden" : "";
      return desktop;
    };
    const desktop = update();
    if (open && !desktop) closeButton.current?.focus();
    else if (wasOpen.current && !desktop) trigger.current?.focus();
    wasOpen.current = open;
    const handleKey = (event: KeyboardEvent) => {
      if (!open || update()) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusables[0],
        last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("resize", update);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      if (content.current) content.current.inert = false;
    };
  }, [open, desktopSidebarVisible]);
  return { open, setOpen, sidebar, content, trigger, closeButton };
}
