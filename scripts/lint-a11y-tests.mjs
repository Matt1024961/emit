#!/usr/bin/env node
/**
 * Guardrail: every component test must include an axe() accessibility
 * assertion (Rufus rule 23). Covers component test files under src/components.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src/components";

/** Recursively collect *.test.tsx files. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  if (!/\baxe\s*\(/.test(src)) offenders.push(file);
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} component test(s) missing an axe() assertion:`);
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}
console.log("✓ a11y-tests: every component test asserts axe()");
