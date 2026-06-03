#!/usr/bin/env node
/**
 * Guardrail: no source file may exceed MAX_LINES lines (Rufus rule 1).
 * Split large files into smaller modules.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_LINES = 300;
const ROOTS = ["src", "scripts"];
const EXTS = [".ts", ".tsx", ".mjs", ".js", ".css"];

/** Recursively collect files under a directory. */
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
for (const root of ROOTS) {
  let exists = true;
  try {
    statSync(root);
  } catch {
    exists = false;
  }
  if (!exists) continue;
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n").length;
    if (lines > MAX_LINES) offenders.push({ file, lines });
  }
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} file(s) exceed ${MAX_LINES} lines:`);
  for (const { file, lines } of offenders) {
    console.error(`  ${lines} lines  ${file}`);
  }
  process.exit(1);
}
console.log(`✓ file-length: all files ≤ ${MAX_LINES} lines`);
