# EMIT Panel I/O Configurator

A frontend-only React + TypeScript app for configuring panel I/O on EMIT
gas-compressor control panels. Three-step wizard: **Setup → Define I/O → Map to
Ports**, then export an XML config. No backend, no database — runs entirely in
the browser, persists to `localStorage`.

Guardrail enforcement lives in [GUARDRAILS.md](GUARDRAILS.md); architecture in
[ARCHITECTURE.md](ARCHITECTURE.md). This file is the standing context for working
in the repo — read it first.

## AI Assistant Rules

- **May run local read-only / dev scripts** — `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:all`, `npm run build`. Run them freely to verify work.
- **Never run destructive or remote scripts** — nothing that deploys, publishes, force-pushes, or mutates external systems.
- **Verify before declaring done** — after any change, the relevant slice of `npm run check:all` must pass. After finishing a unit of work, run the full gate.
- **Don't commit unless asked** — stage and show the diff; wait for explicit instruction.

## Scope discipline

- **Stay in scope** — fixing one component doesn't license refactoring unrelated files.
- **Confirm new dependencies** — prefer what's installed; new `npm install` needs a reason. (Note: installs require `--legacy-peer-deps` — madge ↔ TS 6 peer conflict.)
- **Preserve behavior on refactors** — external behavior and the XML output shape stay identical unless the change is explicitly about them.
- **The XML output is a contract** — `src/xml/generate.ts` must stay deterministic and match the sample exports' structure. Don't reorder sections or change attribute names without cause.

## Guardrails (`npm run check:all`)

All 17 steps must pass. Enforced by Husky `pre-commit` and CI. Full table in
[GUARDRAILS.md](GUARDRAILS.md). The ones that shape day-to-day code:

1. **Biome** — lint + format. **No `console`/`debugger`** (use nothing, or scope to `scripts/`), **no `any`**, no `window.confirm/alert/prompt`.
2. **TypeScript** — zero errors (`tsc -b`, which checks src + config files).
3. **File length ≤ 300 lines** — split large files into modules (e.g. the catalog is split under `catalog/io/`).
4. **No suppression directives** — `@ts-ignore`, `biome-ignore`, `eslint-disable`, `cspell:disable`, etc. are banned. Fix the root cause or change rule config; never suppress inline.
5. **A11y** — every `components/**/*.test.tsx` includes an `axe()` assertion.
6. **JSDoc** — every exported function in our own code (not `components/ui/`) has a JSDoc block.
7. **Storybook coverage** — every `components/ui/*.tsx` primitive has a sibling `*.stories.tsx`.
8. **Spelling** — cspell over `src` + docs. Add domain terms to `cspell.json`, never inline-ignore.
9. **No circular deps** (madge), **no duplication** (jscpd), **no unused code/deps** (knip).
10. **Tests + coverage ≥ 85%** — statements, branches, functions, and lines. New features ship with tests.

## Component usage

**Always compose the shadcn/ui primitives in `src/components/ui/`. Never style a
raw `<button>` / `<input>` / `<select>` to mimic one.**

| Need | Use |
|---|---|
| Button | `Button` (`variant`: default/secondary/outline/ghost/destructive/link) |
| Icon-only button | `IconButton` (`src/components/icon-button.tsx`) — wraps Button + Tooltip + label |
| Text / number field | `Input` |
| Multi-line | `Textarea` |
| Label | `Label` (Radix, pairs via `htmlFor`) |
| Dropdown select | `Select` (Radix) — **not** a raw `<select>` |
| Modal | `Dialog` |
| Hover hint | `Tooltip` |
| Status chip | `Badge` (domain variants: `success`/`warning`/`info`/`primary`/`muted`) |
| Menu | `DropdownMenu` |
| Progress | `Progress` |

- **Icons**: render lucide components directly inside a `Button`/`IconButton`; never a bare clickable `<svg>`. Signal/port colors flow through `SignalBadge` / `PortTypeBadge` (`components/wizard/signal-badge.tsx`).
- Allowed raw HTML: `<form>`, semantic layout (`<section>`, `<header>`, `<nav>`, `<ul>`, `<li>`, `<p>`, headings), and presentational `<div>`/`<span>`.

## Design system & theming

- The look is **shadcn/ui filled with the EMIT brand** — a dark-first navy base with a burnt-orange accent, Barlow type (JetBrains Mono for port/pin labels), a blueprint-grid texture, and an orange glow. Tokens live in `src/index.css` as CSS variables on `:root` (light) and `.dark`, mapped to Tailwind via `@theme inline`; `emit-*` utility classes hold the textures and display type.
- **Reference semantic classes only** — `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, etc. Never hardcode hex or raw Tailwind palette colors.
- **Light / dark / system** is handled by `ThemeProvider` (`components/theme/`), persisted to `localStorage` (`panel-io-theme`). Anything theme-aware must use the semantic tokens so both modes work.

## Validation

- Form validation lives in pure, tested functions (e.g. `components/wizard/setup-validation.ts`), separate from rendering.
- Required fields show **custom per-field messages** with `aria-invalid` + `aria-describedby`, triggered on **submit and blur**, clearing live as fixed. Follow this pattern for any new form.

## State management

- **Zustand is the state layer.** `store/wizard.ts` (active session) and `store/saved.ts` (saved list). One store per concern; don't mirror server data.
- **Never select a store function that returns a new object/array inside a selector** (`useStore(s => s.getX())`) — it causes infinite re-renders. Select raw slices and derive with `useMemo` in the component.
- Mutations go through actions; mapping actions validate via `canMap` before committing.

## Testing

- **Vitest, co-located** as `*.test.ts(x)` next to the source.
- **≥ 85% coverage** (statements/branches/functions/lines). New exports and bug fixes ship with tests; bug-fix tests must fail without the fix.
- **Component tests assert `axe()`.** Provider-dependent components are wrapped in `ThemeProvider` / `DndContext` in the test.
- No snapshot tests — explicit assertions.

## Git

- **Conventional Commits** (enforced by `commit-msg`): `feat(scope): …`, `fix: …`, etc.
- One logical change per commit. Never amend or force-push unless asked.
- End commit messages with the Co-Authored-By trailer when committing on the user's behalf.

## Distributed docs

Each module carries its own `CLAUDE.md` with local rules — read the one for the
area you're editing:

- [`src/components/ui/CLAUDE.md`](src/components/ui/CLAUDE.md) — shadcn primitives
- [`src/components/wizard/CLAUDE.md`](src/components/wizard/CLAUDE.md) — feature components
- [`src/components/theme/CLAUDE.md`](src/components/theme/CLAUDE.md) — theming
- [`src/catalog/CLAUDE.md`](src/catalog/CLAUDE.md) — the I/O catalog (config-driven data)
- [`src/hardware/CLAUDE.md`](src/hardware/CLAUDE.md) — BRAIN / BRAIN+ port definitions
- [`src/validation/CLAUDE.md`](src/validation/CLAUDE.md) — mapping rules
- [`src/store/CLAUDE.md`](src/store/CLAUDE.md) — Zustand stores
- [`src/xml/CLAUDE.md`](src/xml/CLAUDE.md) — XML generator
- [`src/services/CLAUDE.md`](src/services/CLAUDE.md) — persistence (Lambda-ready)
- [`scripts/CLAUDE.md`](scripts/CLAUDE.md) — guardrail scripts

## Commands

```bash
npm run dev          # Vite dev server (port 5173)
npm run check:all    # full quality gate (17 steps)
npm test             # unit tests
npm run test:coverage
npm run lint:fix     # auto-fix Biome
npm run storybook    # component workshop (port 6006)
```
