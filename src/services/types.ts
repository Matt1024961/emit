import type { Configuration, ConfigurationSummary } from "../types/config";

/**
 * Persistence interface for panel configurations.
 *
 * This interface is intentionally shaped to match a future AWS Lambda + API Gateway backend.
 * The current implementation uses localStorage. Swapping to a real API means replacing
 * LocalStorageConfigService with a FetchConfigService — no component changes needed.
 *
 * Equivalent Lambda endpoints:
 *   POST   /configurations         → save()
 *   GET    /configurations/:id     → load()
 *   GET    /configurations         → list()
 *   DELETE /configurations/:id     → delete()
 */
export interface ConfigurationService {
  save(config: Configuration): Promise<void>;
  load(id: string): Promise<Configuration | null>;
  list(): Promise<ConfigurationSummary[]>;
  delete(id: string): Promise<void>;
}
