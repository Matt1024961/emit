# services — persistence (Lambda-ready by design)

- `types.ts` — the `ConfigurationService` interface: `save` / `load` / `list` / `delete`.
- `local-storage.ts` — `LocalStorageConfigService`, the current browser implementation, exported as the `configService` singleton.

## Why the interface matters

The brief's backend sections were left `<System Architect To Complete>`. The
interface is shaped to match a future **AWS Lambda + API Gateway** backend:

```
POST   /configurations       → save()
GET    /configurations/:id   → load()
GET    /configurations       → list()
DELETE /configurations/:id   → delete()
```

## Rules

- **Components and stores depend on the `ConfigurationService` interface, never on `localStorage` directly.** Swapping to a real API means writing `FetchConfigService implements ConfigurationService` and changing one wiring line — no component edits. Keep that property.
- All methods are `async` (return `Promise`) even though localStorage is sync — so the swap is transparent.
- **Be defensive about the store**: `readAll` swallows JSON-parse errors and returns `{}` (corrupt/old data must not crash the app). Keep that guard.
- Storage key: `panel-io-configurator:configs`. `save` stamps `updatedAt`; `list` returns summaries sorted most-recent-first.
