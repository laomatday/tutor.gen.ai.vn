/** Class composition for primitives; feature code supplies layout classes only. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
