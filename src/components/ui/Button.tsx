import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

export interface ButtonStyleOptions {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "surface";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn("ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className);
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant, size, className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonStyles({ variant, size, className })}
        {...props}
      />
    );
  },
);
