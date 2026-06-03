# hardware — BRAIN / BRAIN+ port catalog

The physical port definitions, derived from `brain-pinouts.md` in the brief.
**These encode panel-safety constraints — change them only against the pinout
source.**

## Files

- `brain.ts` — BRAIN (p/n 20320): AI 1–12, AO 1/2/5/6, DI 2–30, DO 1–8, TC 1–24, MAG.
- `brain-plus.ts` — BRAIN+ (p/n 20330) per slot P1/P2: AI 13–20, AO 3/4/7/8, DO 9–14, TC 25–36.
- `index.ts` — `getAvailablePorts(brainPlusCount)`, `getPortsByType(...)`, label/colour maps.

## Load-bearing constraints (do not "simplify")

- **Only DO 7 and DO 8 on BRAIN are Form-C** (`isFormC: true`). Every other DO, and **all** BRAIN+ DOs, are Form-A. A fail-safe (Relay-NC) signal mapped to a non-Form-C port is a real panel-safety defect — the validation depends on this flag being correct.
- **DI 1 is the dedicated E-STOP** and is intentionally *not* a user-assignable port. AO 3/4 exist only on BRAIN+, not BRAIN.
- `pinNumbers` carry the physical terminal numbers for traceability — keep them accurate to the schematic even though the UI shows logical names.

## Rules

- `getAvailablePorts` returns BRAIN ∪ the selected BRAIN+ modules. Reducing the count must drop orphaned mappings — that logic lives in `store/wizard.ts` (`setHardware`), keep them consistent.
- Port `id`s are the logical names (`AI1`, `DO7`, `TC3`, `MAG`); BRAIN+ ids are suffixed per slot (`AI13-P1`). The XML strips the slot suffix.
