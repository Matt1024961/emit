# catalog — config-driven seed data

The catalog is **data, edited by colleagues without touching logic**. This is a
graded design goal — keep it that way.

## Files

- `io/pressure.ts`, `io/temperature.ts`, `io/level-flow-speed.ts`, `io/digital-inputs.ts`, `io/outputs.ts` — the I/O items, one array per group.
- `io-catalog.ts` — aggregates the groups in display order and derives `CATALOG_GROUPS`, `getRecommendedItems()`, `getLimitedItems()`.
- `compressor-models.ts`, `engine-types.ts` — the equipment dropdown lists.

## Rules

- **To add or change an I/O item, edit the relevant `io/<group>.ts` file** — add one `CatalogItem` object. No component, validation, or store change is needed.
- **The CSV (`io-catalog.csv` in the brief) is the source of truth.** Mirror its tag / name / signal / range / hint / form_c / tc_type / group / template flags exactly.
- **Keep each file < 300 lines** (file-length rule). The split-by-group layout exists for this reason — if a group outgrows it, split further; don't merge back into one file.
- `in_recommended` / `in_limited` flags drive the two EMIT templates — set them per the source data.
- Models/engines lists are plain string arrays; the UI groups compressor models by series. Extend the arrays, don't restructure consumers.
