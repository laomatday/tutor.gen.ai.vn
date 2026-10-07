import type { HTMLAttributes } from "react";
import { cn } from "./utils";

export type StatusTone =
  "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return (
    <span className={cn("ui-badge", `ui-tone-${tone}`, className)} {...props} />
  );
}

export function Progress({
  value,
  max = 100,
  label,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  label: string;
  tone?: "primary" | "accent";
  className?: string;
}) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.min(safeMax, Math.max(0, value));
  return (
    <progress
      className={cn("ui-progress", tone === "accent" && "ui-progress-accent", className)}
      value={safeValue}
      max={safeMax}
      aria-label={label}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card", className)} {...props} />;
}

export function Alert({
  tone = "info",
  className,
  role,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: Exclude<StatusTone, "neutral" | "primary">;
}) {
  return (
    <div
      role={role || (tone === "danger" ? "alert" : "status")}
      className={cn("ui-alert", `ui-tone-${tone}`, className)}
      {...props}
    />
  );
}
