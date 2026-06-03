import type { Configuration, ConfigurationSummary } from "../types/config";
import type { ConfigurationService } from "./types";

const STORAGE_KEY = "panel-io-configurator:configs";

function readAll(): Record<string, Configuration> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Configuration>) : {};
  } catch {
    return {};
  }
}

function writeAll(configs: Record<string, Configuration>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

/**
 * localStorage-backed implementation of ConfigurationService.
 *
 * Extends the shared ConfigurationService interface with a concrete `nextVersion`
 * method. This method is intentionally not on the interface — a future API
 * backend would compute versioning server-side, so the contract stays minimal.
 * Components that need versioning import the concrete `configService` singleton
 * and call `nextVersion` directly.
 */
export class LocalStorageConfigService implements ConfigurationService {
  async save(config: Configuration): Promise<void> {
    const all = readAll();
    all[config.id] = { ...config, updatedAt: new Date().toISOString() };
    writeAll(all);
  }

  async load(id: string): Promise<Configuration | null> {
    return readAll()[id] ?? null;
  }

  async list(): Promise<ConfigurationSummary[]> {
    return Object.values(readAll())
      .map(({ id, name, version, updatedAt }) => ({ id, name, version, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async delete(id: string): Promise<void> {
    const all = readAll();
    delete all[id];
    writeAll(all);
  }

  /**
   * Returns the next version number for a given configuration name.
   * Scans all stored configurations whose `name` matches and returns
   * `(max version) + 1`. Returns `1` if no configuration with that name exists.
   */
  async nextVersion(name: string): Promise<number> {
    const all = Object.values(readAll()).filter((c) => c.name === name);
    if (all.length === 0) return 1;
    return Math.max(...all.map((c) => c.version)) + 1;
  }
}

export const configService = new LocalStorageConfigService();
