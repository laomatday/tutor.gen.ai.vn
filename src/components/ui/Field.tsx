import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "./utils";

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Connects a single control to its visible label and validation text. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  id,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const child = isValidElement(children)
    ? (children as ReactElement<Record<string, unknown>>)
    : null;
  const controlId =
    htmlFor || id || (child?.props.id as string) || `${autoId}-control`;
  const messageId = `${controlId}-${error ? "error" : "hint"}`;
  const describedBy = cn(
    child?.props["aria-describedby"] as string,
    error || hint ? messageId : undefined,
  );
  return (
    <div className={cn("ui-form-field", className)}>
      {label && (
        <label className="ui-label" htmlFor={controlId}>
          {label}
        </label>
      )}
      {child
        ? cloneElement(child, {
            id: controlId,
            "aria-describedby": describedBy || undefined,
            "aria-invalid": error ? true : child.props["aria-invalid"],
          })
        : children}
      {(error || hint) && (
        <p id={messageId} className={error ? "ui-error-text" : "ui-hint"}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
