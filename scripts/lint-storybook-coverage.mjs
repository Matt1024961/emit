#!/usr/bin/env node
/**
 * Guardrail: every shadcn UI primitive under components/ui ships a sibling
 * *.stories.tsx (Rufus rule 24). Feature components (components/wizard) are
 * organisms and exempt.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const UI_DIR = "src/components/ui";

const components = readdirSync(UI_DIR).filter(
  (f) => f.endsWith(".tsx") && !f.includes(".test.") && !f.includes(".stories.")
);

const missing = [];
for (const file of components) {
  const story = file.replace(/\.tsx$/, ".stories.tsx");
  if (!existsSync(join(UI_DIR, story))) missing.push(file);
}

if (missing.length > 0) {
  console.error(`✗ ${missing.length} UI primitive(s) missing a stories file:`);
  for (const file of missing)
    console.error(`  ${UI_DIR}/${file} → ${file.replace(/\.tsx$/, ".stories.tsx")}`);
  process.exit(1);
}
console.log(`✓ storybook-coverage: all ${components.length} UI primitives have stories`);
