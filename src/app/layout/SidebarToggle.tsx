import { forwardRef } from "react";
import { Button, type ButtonProps } from "../../components/ui/Button";

interface Props extends Omit<ButtonProps, "children" | "aria-label"> {
  expanded: boolean;
  label: string;
}

/** A panel and directional chevron keep the action distinct from navigation. */
export const SidebarToggle = forwardRef<HTMLButtonElement, Props>(
  function SidebarToggle({ expanded, label, className = "", ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        variant="ghost"
        size="icon"
        className={`sidebar-toggle ${className}`}
        aria-label={label}
        aria-expanded={expanded}
        aria-controls="main-navigation"
        title={label}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          className="sidebar-toggle__icon"
        >
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <path d="M9 4v16" />
          <path className="sidebar-toggle__chevron" d="m16 9-3 3 3 3" />
        </svg>
      </Button>
    );
  },
);
