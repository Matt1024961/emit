#!/usr/bin/env node
/**
 * Guardrail: every exported function in our own code carries a JSDoc block
 * (Rufus rule 3). Vendored shadcn primitives under components/ui are exempt,
 * as are test and story files.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const EXCLUDE_DIRS = ["components/ui"];

/** Recursively collect non-test, non-story .ts/.tsx files. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some((d) => full.endsWith(d))) continue;
      out.push(...walk(full));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.includes(".test.") &&
      !entry.name.includes(".stories.")
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
    if (!/^export\s+(async\s+)?function\s+\w+/.test(line)) return;
    // Look for a JSDoc close (*/) within the 3 lines immediately above.
    const above = lines.slice(Math.max(0, i - 3), i).map((l) => l.trim());
    if (!above.some((l) => l.endsWith("*/"))) {
      offenders.push({ file, line: i + 1, decl: line.trim().slice(0, 60) });
    }
  });
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} exported function(s) missing JSDoc:`);
  for (const { file, line, decl } of offenders) {
    console.error(`  ${file}:${line}  ${decl}`);
  }
  process.exit(1);
}
console.log("✓ jsdoc: every exported function is documented");
