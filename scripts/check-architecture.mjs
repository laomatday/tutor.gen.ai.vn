import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const errors = [];
function visitDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      visitDirectory(path);
      continue;
    }
    if (!/\.tsx?$/.test(path) || /\.test\./.test(path)) continue;
    const text = readFileSync(path, "utf8");
    const rules = [
      {
        pattern: /<(?:button|input|select|textarea|dialog)\b/g,
        message: "Use a shared UI control from components/ui.",
        exempt: path.includes("/components/ui/"),
      },
      {
        pattern: /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/gi,
        message: "Define colors in styles/tokens.css.",
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
        exempt: !path.endsWith(".tsx") || path.includes("/dev/"),
      },
      {
        pattern: /material-symbols/g,
        message: "Use the shared SVG Icon component.",
      },
      {
        pattern: /(?:window\.)?localStorage\./g,
        message: "Read/write browser data through the storage adapter.",
        exempt: path === "src/lib/browserStorage.ts",
      },
    ];
    for (const rule of rules) {
      if (rule.exempt) continue;
      for (const match of text.matchAll(rule.pattern))
        errors.push(
          `${relative(".", path)}:${text.slice(0, match.index).split("\n").length} ${rule.message}`,
        );
    }
  }
}
visitDirectory("src");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Architecture checks passed: shared controls, semantic colors, central URLs/keys, isolated persistence.",
  );
