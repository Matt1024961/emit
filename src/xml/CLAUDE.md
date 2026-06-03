# xml — SolidWorks Electrical export

`generate.ts` turns a `Configuration` into the `<PanelConfiguration>` XML that
downstream tooling consumes.

## The contract — do not break

- **Deterministic output**: same input → identical bytes. Diffs between versions are meaningful, so never introduce timestamps-at-generation, `Map` iteration that isn't ordered, or unstable sorts.
- **Section order is fixed**: `Metadata → Equipment → Hardware → IOList → Mappings → UnmappedIO`.
- **`<IO>` order** follows `activeIO` insertion order; ids stay `io-0001`…
- **`<Mapping>` sort order**: AI → AO → DI → DO → TC → MAG, then numeric within a type. This matches the sample exports in the brief — keep it.
- **`<UnmappedIO/>`** is a self-closing tag when empty; lists `<IO id tag>` otherwise.
- Always **XML-escape** attribute values (`escapeXml`). BRAIN+ port ids have their slot suffix stripped (`AI13-P1` → `AI13`).

## Rules

- Any change to the schema or ordering must update `generate.test.ts` and be checked against the two sample `export-*.xml` files in the brief.
- `downloadXml` builds a `Blob` and clicks an anchor — keep it side-effect-isolated and revoke the object URL.
