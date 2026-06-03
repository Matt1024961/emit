# store — Zustand state

- `wizard.ts` — the active wizard session (step, equipment, hardware, `activeIO`, `mappings`) and all its actions.
- `saved.ts` — the saved-configuration list, backed by the `services/` persistence layer.

## Rules

- **Zustand is the canonical state layer.** One store per concern; never mirror derived/server data into a slice.
- **Never select a function-that-returns-a-new-value inside a selector.** `useWizardStore(s => s.getUnmappedItems())` returns a fresh array each render → "Maximum update depth exceeded". Select raw slices (`s => s.activeIO`, `s => s.mappings`) and derive with `useMemo` in the component. The `getX()` helpers are for imperative use (event handlers, tests), not selectors.
- **Mutations validate first.** `addMapping` calls `canMap` and rejects invalid drops; it also evicts any prior occupant of the target port and any prior mapping of the item. Keep this invariant.
- **Hardware changes cascade.** `setHardware` drops mappings whose port no longer exists. `removeIOItem` drops that item's mapping. Don't leave dangling mappings.
- **Sequential ids.** Active items get `io-0001`, `io-0002`, … — the XML schema depends on this format and on insertion order.
- Test actions directly via `useWizardStore.getState()` (no React needed) — see `wizard.test.ts`. `reset()` in `beforeEach`.
