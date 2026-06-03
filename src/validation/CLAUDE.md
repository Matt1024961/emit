# validation — mapping rules

**All I/O → port mapping rules live here, co-located with their tests.** No rule
logic belongs in components — they call `canMap()` and display the returned
`reason`.

## Surface

- `canMap(item, port): { valid, reason? }` — the single decision function.
- `getRequiredPortType(item)` — signal + category → required `PortType`.
- `getCapacityWarning(items, ports)` — per-type over-subscription message.

## The rules (keep in lockstep with `hardware/`)

1. **Signal → port type**: `4-20mA` Input→AI / Output→AO; `TC-K`/`TC-J`→TC; `Pulse`→MAG; `DryContact`→DI; `Relay`/`Relay-NC`→DO.
2. **Form-C constraint**: `Relay-NC` requires a Form-C port — only DO 7 / DO 8 on BRAIN. This is a safety rule; do not relax it.

## Rules for changing this file

- **Keep validation pure** — no React, no store, no I/O. Pure functions are why this is testable and trustworthy.
- **Every rule change ships with a test** (`rules.test.ts`) covering the accept *and* reject paths, including the Form-C boundary (reject DO1–6, accept DO7/8, reject all BRAIN+ DOs).
- Components surface `reason` verbatim — write messages as user-facing copy.
