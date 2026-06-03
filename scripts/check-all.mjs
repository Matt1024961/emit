#!/usr/bin/env node
/**
 * Runs the full quality gate, mirroring Rufus's `check:all`. Each applicable
 * guardrail is a step; all steps run, then the process exits non-zero if any
 * failed (so one run surfaces every problem).
 *
 * Pass --skip=build,storybook to skip the slow build steps while iterating.
 */
import { spawnSync } from "node:child_process";

const skip = (process.argv.find((a) => a.startsWith("--skip=")) ?? "")
  .replace("--skip=", "")
  .split(",")
  .filter(Boolean);

/** [label, npm-script, optional-skip-key] */
const STEPS = [
  ["Biome (lint + format)", "lint"],
  ["TypeScript", "typecheck"],
  ["File length ≤ 300", "lint:file-length"],
  ["No suppression directives", "lint:no-ignores"],
  ["No native dialogs", "lint:no-window-dialogs"],
  ["A11y tests (axe)", "lint:a11y-tests"],
  ["JSDoc on exports", "lint:jsdoc"],
  ["Storybook coverage", "lint:storybook-coverage"],
  ["Spelling (cspell)", "lint:spelling"],
  ["Circular deps", "lint:circular"],
  ["Duplication (jscpd)", "lint:dry"],
  ["Unused code (knip)", "lint:knip"],
  ["package.json order", "lint:pkg-order"],
  ["Unit tests + coverage", "test:coverage"],
  ["Dependency audit", "lint:audit"],
  ["Production build", "build", "build"],
  ["Storybook build", "storybook:build", "storybook"],
];

const failures = [];
let n = 0;

for (const [label, script, skipKey] of STEPS) {
  n += 1;
  const num = String(n).padStart(2, "0");
  if (skipKey && skip.includes(skipKey)) {
    console.log(`[${num}] ⊘ ${label} (skipped)`);
    continue;
  }
  process.stdout.write(`[${num}] … ${label}\n`);
  // shell: true so `npm`/`npm.cmd` resolves on every platform (Windows .cmd
  // files cannot be spawned without a shell).
  const res = spawnSync(`npm run --silent ${script}`, {
    encoding: "utf8",
    shell: true,
  });
  if (res.status === 0) {
    console.log(`[${num}] ✓ ${label}`);
  } else {
    console.log(`[${num}] ✗ ${label}`);
    failures.push({ label, out: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim() });
  }
}

if (failures.length > 0) {
  console.error(`\n──────── ${failures.length} step(s) failed ────────`);
  for (const { label, out } of failures) {
    console.error(`\n### ${label}\n${out.slice(-2500)}`);
  }
  process.exit(1);
}
console.log("\n✓ check:all — every guardrail passed");
