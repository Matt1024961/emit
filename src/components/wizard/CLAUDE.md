# components/wizard — feature components

The app's feature layer: the three step bodies, the panels they contain, the
backplate, the modal, and the `WizardShell` that frames them. These **compose**
the `components/ui/` primitives.

## Map

- `wizard-shell.tsx` — header (brand, `StepIndicator`, `ModeToggle`, Load/Save/Export) + content + footer nav. Step 1's footer "Continue" is `type="submit" form="setup-form"` so the setup form's validation fires.
- `setup-step.tsx` (+ `setup-validation.ts`) — Step 1 form.
- `define-io-step.tsx` → `catalog-panel.tsx` + `active-io-list.tsx` — Step 2.
- `map-ports-step.tsx` → `unmapped-io-panel.tsx` + `backplate-viz.tsx` → `port-slot.tsx` — Step 3 (owns its `DndContext`).
- `save-load-modal.tsx` — a controlled `Dialog`.
- `signal-badge.tsx` — `SignalBadge` / `PortTypeBadge` (the only place signal/port → colour mapping lives).

## Rules

- **Compose `components/ui/` primitives**; no raw HTML primitives. Icon actions → `IconButton` (`@/components/icon-button`).
- **Colour-code signals and ports only via `SignalBadge` / `PortTypeBadge`.** Don't inline a colour for a signal type.
- **Validation pattern** (see `setup-validation.ts`): pure validator → per-field messages with `aria-invalid` + `aria-describedby`, shown on submit *and* blur, cleared live. Reuse it for any new form.
- **dnd-kit**: the draggable attributes carry `role="button"` — never spread them onto an `<li>` (axe rejects it). Put them on an inner `<div>` (see `unmapped-io-panel.tsx`).
- **Store access**: read raw slices and derive with `useMemo`; never `useWizardStore(s => s.getUnmappedItems())` (new array → infinite render).
- Every component test asserts `axe()`; wrap provider-dependent components (`ThemeProvider`, `DndContext`) in the test.

## Theme-safe module headers

The backplate's BRAIN header uses `bg-foreground text-background` and BRAIN+ uses
`bg-primary text-primary-foreground` — both invert correctly in dark mode. Never
hardcode `text-white` on a themed surface.
