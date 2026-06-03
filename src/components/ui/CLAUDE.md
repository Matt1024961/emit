# components/ui — shadcn/ui primitives

Vendored [shadcn/ui](https://ui.shadcn.com) components (Radix UI + CVA + `cn()`).
This is the single source of primitives — app code composes these, never raw
HTML primitives.

## Rules

- **Treat these as the design-system primitives.** Build app UI by composing them in `components/wizard/`; don't restyle raw `<button>`/`<input>`/`<select>` elsewhere.
- **Every primitive needs a sibling `*.stories.tsx`** (enforced by `lint:storybook-coverage`). When you add a primitive, add its stories — include `Mobile320` + `Tablet768` variants where the component is visual.
- **Style with semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-input`, `bg-card`, etc. (defined in `src/index.css`). No hex, no raw palette classes. This is what makes light/dark work for free.
- **Use `cn()`** (`@/lib/utils`) to merge classes so caller `className` overrides win.
- **`data-slot` attributes** identify parts — keep them when editing.
- Adding a new shadcn component: prefer `npx shadcn@latest add <name>` (config in `components.json`), then add stories + a test with `axe()`.

## Badge — domain variants

`Badge` is extended beyond stock shadcn with `success` / `warning` / `info` /
`primary` / `muted` variants that drive the signal- and port-type colour coding.
Keep those in sync with `components/wizard/signal-badge.tsx`.

## Exempt from some guardrails

These files are **excluded from JSDoc and coverage** requirements (they're
vendored library code). They are *not* exempt from Biome, TypeScript, or stories
coverage.
