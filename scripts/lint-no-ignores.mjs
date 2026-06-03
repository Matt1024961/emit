#!/usr/bin/env node
/**
 * Guardrail: suppression directives are banned project-wide (Rufus rule 25).
 * Fix the root cause or change the rule's configuration — never suppress inline.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".css"];

const BANNED = [
  "@ts-ignore",
  "@ts-expect-error",
  "@ts-nocheck",
  "biome-ignore",
  "eslint-disable",
  "prettier-ignore",
  "cspell:disable",
  "cSpell:ignore",
  "knip-ignore",
  "istanbul ignore",
  "c8 ignore",
  "v8 ignore",
];

/** Recursively collect source files. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTS.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const token of BANNED) {
      if (line.includes(token)) offenders.push({ file, line: i + 1, token });
    }
  });
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} suppression directive(s) found:`);
  for (const { file, line, token } of offenders) {
    console.error(`  ${file}:${line}  ${token}`);
  }
  process.exit(1);
}
console.log("✓ no-ignores: no suppression directives");
