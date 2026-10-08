import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "./utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  const controlClass =
    type === "checkbox" || type === "radio"
      ? "ui-check"
      : type === "search"
        ? "ui-search"
        : type === "range"
          ? "ui-range"
          : "ui-field";
  return (
    <input
      ref={ref}
      type={type}
      className={cn(controlClass, className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn("ui-field", className)} {...props} />
  );
});
