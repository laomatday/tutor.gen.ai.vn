import { useRef } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { cn } from "./utils";

interface Tab<T extends string> {
  id: T;
  label: string;
  icon?: string;
  description?: string;
  actionLabel?: string;
  disabled?: boolean;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  variant = "line",
  className,
}: {
  tabs: readonly Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  variant?: "line" | "pill";
  className?: string;
}) {
  const controls = useRef(new Map<T, HTMLButtonElement>());
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("ui-tabs", variant === "pill" && "ui-segmented", className)}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const enabled = tabs.filter((tab) => !tab.disabled);
        if (!enabled.length) return;
        const current = enabled.findIndex((tab) => tab.id === value);
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? enabled.length - 1
              : (current +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  enabled.length) %
                enabled.length;
        onChange(enabled[index].id);
        controls.current.get(enabled[index].id)?.focus();
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          ref={(element) => {
            if (element) controls.current.set(tab.id, element);
            else controls.current.delete(tab.id);
          }}
          variant="ghost"
          role="tab"
          aria-label={tab.description || tab.actionLabel ? tab.label : undefined}
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          disabled={tab.disabled}
          className={variant === "pill" ? "ui-segment" : "ui-tab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <Icon name={tab.icon} />}
          {tab.description ? (
            <span className="ui-tab-copy">
              <strong>{tab.label}</strong>
              <small>{tab.description}</small>
            </span>
          ) : (
            tab.label
          )}
          {tab.actionLabel && (
            <span className="ui-tab-action" aria-hidden="true">
              {tab.actionLabel}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
