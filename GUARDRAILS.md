# Guardrails

This project brings over the guardrails that apply from the **Rufus** monorepo's
`check:all` pipeline. Run the whole gate like this:

```bash
npm run check:all              # all 17 steps
npm run check:all -- --skip=build,storybook   # skip the slow builds while you work
```

You can also run any step on its own (for example, `npm run lint:file-length`).

## Where it runs

| Layer | What runs |
|---|---|
| **Husky `pre-commit`** | `npm run check:all` (the full gate, on your machine, before each commit) |
| **Husky `commit-msg`** | `commitlint` — checks the Conventional Commits format |
| **CI** (`.github/workflows/ci.yml`) | `npm run check:all` on every push and PR to `main` |

## The gate (17 steps)

| # | Step | Tool | Rufus rule |
|---|---|---|---|
| 1 | Lint + format | Biome (no-console, no-debugger, no-explicit-any, no-alert) | 4, 17, 42 |
| 2 | TypeScript | `tsc -b` (zero errors) | 11 |
| 3 | File length ≤ 300 | `scripts/lint-file-length.mjs` | 1 |
| 4 | No suppression directives | `scripts/lint-no-ignores.mjs` | 25 |
| 5 | No native dialogs | `scripts/lint-no-window-dialogs.mjs` | 42 |
| 6 | A11y tests (`axe()`) | `scripts/lint-a11y-tests.mjs` | 23 |
| 7 | JSDoc on exported functions | `scripts/lint-jsdoc.mjs` | 3 |
| 8 | Storybook coverage | `scripts/lint-storybook-coverage.mjs` | 24 |
| 9 | Spelling | cspell | 10 |
| 10 | No circular dependencies | madge | 14, 31 |
| 11 | No duplication (DRY) | jscpd | 6 |
| 12 | No unused code / deps | knip | 13 |
| 13 | `package.json` key order | sort-package-json | 7 |
| 14 | Unit tests + coverage threshold | Vitest + v8 | 12, 38 |
| 15 | Dependency audit (high) | `npm audit` | 32 |
| 16 | Production build | `tsc -b && vite build` | 18 |
| 17 | Storybook build | `storybook build` | 18 |

On top of that: **Conventional Commits** (rule 30) through the `commit-msg` hook,
and the rule that **stories ship `Mobile320` + `Tablet768`** variants (rule 45).

## Rufus rules that don't apply here (and why)

This is a standalone, frontend-only Vite app. No backend, no database, no
monorepo packages, no native app. So these Rufus guardrails are out of scope on
purpose:

- **Prisma / migrations / multi-write transactions / raw-SQL ban** (16, 20, 21,
  35) — there's no database.
- **API handler contract / no-raw-NextResponse / no-direct-prisma-in-apps** (19,
  41, 48) — there are no Next.js API routes.
- **Permissions config + inline permission strings** (51, 52) — there's no RBAC
  layer.
- **Package `environment` field / import boundaries / env coverage** (8, 9, 22,
  40) — one app, no `@rufus/env`, no workspace packages.
- **RTK Query tag types / Redux selector memoization** (53, state-management
  rules) — this uses Zustand, not RTK Query.
- **Page-header / breadcrumbs / heading-hierarchy lints** (39, 47, 50) — it's a
  one-page wizard, not a Next.js route tree.
- **React Native rules** (58–61) — there's no `apps/app`.
- **Logger scopes** (46) — there's no `@rufus/logs`.

## Things we did differently

- **Coverage thresholds** are **85%** for statements, branches, functions, and
  lines. That's a global gate, not Rufus's changed-lines model. The copied-in
  shadcn primitives (`components/ui/**`), the `main.tsx` bootstrap, type-only
  files, and stories are left out of the coverage count. Everything else is
  covered.
- **`noConsole`** is on in `src/`, but off for `scripts/**` (the lint scripts
  need to print their results).
- **jscpd / knip** skip the seed-data and copied-in shadcn primitive files, where
  some repetition is expected and not a bug.
