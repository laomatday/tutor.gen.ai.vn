import React, { useMemo } from "react";
import katex from "katex";

interface MathLatexProps {
  formula: string;
  block?: boolean;
  className?: string;
}

/**
 * Renders a pure LaTeX formula string via KaTeX.
 */
export const MathLatex: React.FC<MathLatexProps> = ({
  formula,
  block = false,
  className = "",
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  }, [formula, block]);

  if (html === null) return <span className={className}>{formula}</span>;

  return (
    <span
      className={`inline-block ${block ? "w-full my-1 text-center" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface RichMathTextProps {
  text: string;
  className?: string;
}

/**
 * Parses mixed prose containing $...$ (inline) or $$...$$ (block) LaTeX segments
 * and renders them cleanly with KaTeX.
 */
export const RichMathText: React.FC<RichMathTextProps> = ({
  text,
  className = "",
}) => {
  const parts = useMemo(() => {
    const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
    const tokens: Array<{
      type: "text" | "inline" | "block";
      content: string;
    }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }
      const raw = match[0];
      if (raw.startsWith("$$") && raw.endsWith("$$")) {
        tokens.push({
          type: "block",
          content: raw.slice(2, -2).trim(),
        });
      } else if (raw.startsWith("$") && raw.endsWith("$")) {
        tokens.push({
          type: "inline",
          content: raw.slice(1, -1).trim(),
        });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return tokens;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return <React.Fragment key={idx}>{part.content}</React.Fragment>;
        }
        return (
          <MathLatex
            key={idx}
            formula={part.content}
            block={part.type === "block"}
            className="text-primary font-medium mx-0.5"
          />
        );
      })}
    </span>
  );
};

/**
 * Converts common shorthand input (e.g. x^2, (-2)^2, <=>, !=, >=, <=) into clean LaTeX
 * if the user doesn't type full LaTeX commands.
 */
export function normalizeToLatex(input: string): string {
  return input
    .replace(/<=>/g, "\\iff ")
    .replace(/=>/g, "\\Rightarrow ")
    .replace(/!=/g, "\\neq ")
    .replace(/≠/g, "\\neq ")
    .replace(/≥/g, "\\ge ")
    .replace(/≤/g, "\\le ")
    .replace(/±/g, "\\pm ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/x²/g, "x^2")
    .replace(/²/g, "^2")
    .replace(/√x/g, "\\sqrt{x}");
}
