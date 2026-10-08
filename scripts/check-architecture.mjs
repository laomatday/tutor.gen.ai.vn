import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const errors = [];
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".css",
  ".html",
  ".svg",
  ".mjs",
  ".json",
  ".md",
]);

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function report(path, text, match, message) {
  errors.push(
    `${relative(".", path)}:${lineAt(text, match.index ?? 0)} ${message}`,
  );
}

function visitDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      visitDirectory(path);
      continue;
    }
    if (!textExtensions.has(extname(path))) continue;

    const text = readFileSync(path, "utf8");
    const isSource = path.startsWith("src/");
    const isTs = /\.tsx?$/.test(path);
    const isTest = /\.test\./.test(path);

    // Global brand regression guard: these were the pre-alignment Tailwind blues.
    for (const match of text.matchAll(
      /#(?:1d4ed8|2563eb|3b82f6|38bdf8|0284c7)\b/gi,
    )) {
      report(
        path,
        text,
        match,
        "Off-brand blue detected. Use the genAi navy/teal/cyan/sky palette.",
      );
    }

    if (!isSource || !isTs || isTest) continue;

    const rules = [
      {
        pattern: /<(?:button|input|select|textarea|dialog)\b/g,
        message: "Use a shared UI control from components/ui.",
        exempt: path.includes("/components/ui/"),
      },
      {
        pattern: /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/gi,
        message: "Define colors in the shared design system (src/index.css).",
      },
      {
        pattern:
          /\b(?:bg|text|border|ring)-(?:amber|orange|red|green|blue|indigo|violet|purple|pink|gray|slate|zinc|stone)-\d/g,
        message: "Use a semantic brand/status color token.",
      },
      {
        pattern: /genai-[\w-]+-v\d/g,
        message: "Use a versioned key from config/storage.",
        exempt: path === "src/config/storage.ts",
      },
      {
        pattern: /https?:\/\//g,
        message: "Move asset/service URLs to configuration or feature data.",
        exempt:
          !path.endsWith(".tsx") ||
          path.includes("/dev/") ||
          path.includes("/components/icons/"),
      },
      {
        pattern: /material-symbols|lucide-react/g,
        message: "Use the shared local Material Symbols SVG components.",
        exempt: path.includes("/components/icons/"),
      },
      {
        pattern: /(?:window\.)?localStorage\./g,
        message: "Read/write browser data through the storage adapter.",
        exempt: path === "src/lib/browserStorage.ts",
      },
      {
        pattern: /role=["']progressbar["']/g,
        message: "Use the shared native Progress component.",
      },
    ];

    for (const rule of rules) {
      if (rule.exempt) continue;
      for (const match of text.matchAll(rule.pattern))
        report(path, text, match, rule.message);
    }

    for (const match of text.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
      if (Number(match[1]) < 12) {
        report(
          path,
          text,
          match,
          "Text smaller than the 12px genAi caption minimum.",
        );
      }
    }

    if (
      path.endsWith(".tsx") &&
      /(?:src\/data\/demo|sampleAssessment)/.test(text) &&
      !/DemoDataNotice/.test(text)
    ) {
      report(
        path,
        text,
        { index: 0 },
        "File importing demo data or sampleAssessment must import and display DemoDataNotice.",
      );
    }
  }
}

visitDirectory("src");
visitDirectory("scripts");
visitDirectory("public");

const indexCss = readFileSync("src/index.css", "utf8");
if (
  !/@theme\s+inline\s*\{[\s\S]*?--color-primary:\s*var\(--color-brand\);/.test(
    indexCss,
  )
) {
  errors.push(
    "src/index.css Tutor semantic aliases must be compiled in @theme inline so legacy utilities resolve to genAi tokens.",
  );
}

const tutorCompatCss = readFileSync("src/styles/tutor-compat.css", "utf8");
if (
  !/dialog\.ui-dialog:not\(\[open\]\)\s*\{\s*display:\s*none;\s*\}/m.test(
    tutorCompatCss,
  )
) {
  errors.push(
    "src/styles/tutor-compat.css must preserve native <dialog> closed-state display:none.",
  );
}

for (const rootFile of ["index.html", "vite.config.ts"]) {
  const text = readFileSync(rootFile, "utf8");
  for (const match of text.matchAll(
    /#(?:1d4ed8|2563eb|3b82f6|38bdf8|0284c7)\b/gi,
  )) {
    report(rootFile, text, match, "Off-brand blue detected in app metadata.");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "Architecture checks passed: shared controls/progress/icons, compiled semantic aliases, native dialog closed state, semantic colors, 12px minimum text, central URLs/keys, isolated persistence.",
  );
}
