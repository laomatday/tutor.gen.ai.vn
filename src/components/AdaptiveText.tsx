import { lazy, Suspense } from "react";
import type { ContentTextFormat } from "../types/content";

const LazyRichMathText = lazy(() =>
  import("./MathLatex").then((module) => ({ default: module.RichMathText })),
);
const LazyMathLatex = lazy(() =>
  import("./MathLatex").then((module) => ({ default: module.MathLatex })),
);

const mathPattern = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$|\\(?:sqrt|frac|Delta|ge|le|neq|times|cdot|widehat|pm)\b|[=<>] ?-?\d*[a-zA-Z])/;

export function textNeedsMath(
  text: string,
  format: ContentTextFormat = "auto",
) {
  if (format === "plain") return false;
  if (format === "math") return true;
  return mathPattern.test(text);
}

export function AdaptiveText({
  text,
  format = "auto",
  className = "",
}: {
  text: string;
  format?: ContentTextFormat;
  className?: string;
}) {
  if (!textNeedsMath(text, format)) {
    return <span className={className}>{text}</span>;
  }
  return (
    <Suspense fallback={<span className={className}>{text}</span>}>
      <LazyRichMathText text={text} className={className} />
    </Suspense>
  );
}

export function AdaptiveFormula({
  formula,
  block = true,
  className = "",
}: {
  formula: string;
  block?: boolean;
  className?: string;
}) {
  return (
    <Suspense fallback={<span className={className}>{formula}</span>}>
      <LazyMathLatex formula={formula} block={block} className={className} />
    </Suspense>
  );
}
