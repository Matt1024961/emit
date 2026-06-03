#!/usr/bin/env node
/**
 * Guardrail: native browser dialogs (window.confirm / alert / prompt and their
 * bare forms) are banned (Rufus rule 42). Use the shadcn Dialog instead.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const PATTERNS = [/\bwindow\.(confirm|alert|prompt)\s*\(/, /(^|[^.\w])(confirm|alert|prompt)\s*\(/];

/** Recursively collect non-test source files. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.includes(".test.")
    ) {
      out.push(full);
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const re of PATTERNS) {
      if (re.test(line)) offenders.push({ file, line: i + 1 });
    }
  });
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} native browser dialog call(s) found:`);
  for (const { file, line } of offenders) console.error(`  ${file}:${line}`);
  process.exit(1);
}
console.log("✓ no-window-dialogs: no native confirm/alert/prompt");
