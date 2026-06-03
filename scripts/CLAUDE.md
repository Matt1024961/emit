# scripts — guardrail runners

Node ESM scripts that power the quality gate. Each is wired to an `npm run
lint:*` script and aggregated by `check-all.mjs`.

- `check-all.mjs` — runs all 17 gate steps (via `npm run <script>`), reports every failure, exits non-zero if any fail. Supports `--skip=build,storybook`.
- `lint-file-length.mjs` — files ≤ 300 lines.
- `lint-no-ignores.mjs` — bans suppression directives.
- `lint-no-window-dialogs.mjs` — bans `confirm`/`alert`/`prompt`.
- `lint-a11y-tests.mjs` — every `components/**/*.test.tsx` calls `axe()`.
- `lint-jsdoc.mjs` — exported functions documented (excludes `components/ui`).
- `lint-storybook-coverage.mjs` — every `components/ui/*.tsx` has stories.

## Rules

- **Scripts may use `console`** (it's how they report) — Biome's `noConsole` is turned off for `scripts/**` via an override in `biome.json`. Don't add `console` elsewhere.
- Each script **exits 1 with a clear, file:line message on failure** and prints a `✓` line on success. Keep that contract so `check-all.mjs` and CI read cleanly.
- **`spawnSync` must use `shell: true`** on Windows (`.cmd` shims can't be spawned otherwise) — see `check-all.mjs`.
- Adding a guardrail: write `lint-<name>.mjs`, add a `lint:<name>` npm script, add a row to the `STEPS` array in `check-all.mjs`, and document it in `GUARDRAILS.md`.
- These scripts are excluded from coverage and knip; they are still Biome- and (where applicable) spell-checked.
