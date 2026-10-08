import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registry = fs.readFileSync(path.join(root, "src/components/ui/Icon.tsx"), "utf8");
const body = registry.match(/export const ICONS:[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!body) throw new Error("Không tìm được icon registry");
const known = new Set([...body[1].matchAll(/^\s*([\w_]+):/gm)].map((match) => match[1]));
const used = new Map();
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, item.name);
    if (item.isDirectory()) { walk(filename); continue; }
    if (!/\.(tsx?|json)$/.test(item.name) || filename.endsWith("ui/Icon.tsx")) continue;
    const source = fs.readFileSync(filename, "utf8");
    const patterns = [
      /<Icon\b[^>]*\bname\s*=\s*["']([\w_]+)["']/g,
      /<Icon(?:\s+[^>]*)?>([\w_]+)<\/Icon>/g,
      /\bicon\s*:\s*["']([\w_]+)["']/g,
      /"icon"\s*:\s*"([\w_]+)"/g,
      /\bsubjectIcon\s*:\s*["\x27]([\w_]+)["\x27]/g,
      /\bicon\s*=\s*"([\w_]+)"/g,
    ];
    for (const pattern of patterns) for (const match of source.matchAll(pattern)) {
      if (!used.has(match[1])) used.set(match[1], []);
      used.get(match[1]).push(path.relative(root, filename));
    }
  }
}
walk(path.join(root, "src"));
if (process.argv.includes("--probe-missing")) used.set("__unknown_icon__", ["probe"]);
const missing = [...used].filter(([name]) => !known.has(name));
if (missing.length) {
  for (const [name, sources] of missing) console.error("Missing icon:", name, sources.slice(0, 3).join(", "));
  process.exitCode = 1;
} else {
  console.log(`Icons OK: ${used.size} static references, ${known.size} registered icons.`);
}
