import type { ReactNode } from "react";
import { Icon } from "../ui";
import { cn } from "../ui";

export function StudentPageHeader({
  eyebrow,
  title,
  description,
  icon,
  meta,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("student-page-hero", className)}>
      <div className="student-page-hero__main">
        <span className="student-page-hero__icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <div className="min-w-0">
          <p className="student-page-eyebrow">{eyebrow}</p>
          <h1 className="student-page-title">{title}</h1>
          {description && (
            <p className="student-page-description">{description}</p>
          )}
          {meta && <div className="student-page-meta">{meta}</div>}
        </div>
      </div>
      {actions && <div className="student-page-actions">{actions}</div>}
    </header>
  );
}

export function StudentSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="student-section-header">
      <div>
        {eyebrow && <p className="student-page-eyebrow">{eyebrow}</p>}
        <h2 className="student-section-title">{title}</h2>
        {description && (
          <p className="student-section-description">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StudentSignalStrip({
  items,
}: {
  items: Array<{ icon: string; label: string; value: ReactNode }>;
}) {
  return (
    <div className="student-signal-strip">
      {items.map((item) => (
        <div key={item.label} className="student-signal-item">
          <span className="student-signal-icon">
            <Icon name={item.icon} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink-500">
              {item.label}
            </span>
            <strong className="mt-0.5 block truncate text-sm text-brand">
              {item.value}
            </strong>
          </span>
        </div>
      ))}
    </div>
  );
}
