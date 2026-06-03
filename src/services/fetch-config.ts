import type { Configuration, ConfigurationSummary } from "../types/config";
import type { ConfigurationService } from "./types";

/**
 * Fetch-based implementation of ConfigurationService.
 *
 * Routes all four operations to a REST API (e.g. AWS API Gateway + Lambda).
 * Drop-in replacement for LocalStorageConfigService — same interface, no component
 * changes required when switching.
 *
 * @example
 * const svc = new FetchConfigService("https://api.example.com");
 */
export class FetchConfigService implements ConfigurationService {
  private readonly baseUrl: string;

  /**
   * @param baseUrl - Root URL for the configurations API, without a trailing slash.
   *   Defaults to `"/api"` for same-origin deployments.
   */
  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Persists a configuration via `POST /configurations`.
   * Throws if the server responds with a non-ok status.
   */
  async save(config: Configuration): Promise<void> {
    const res = await fetch(`${this.baseUrl}/configurations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      throw new Error(`save failed: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * Loads a configuration by ID via `GET /configurations/:id`.
   * Returns `null` on a 404; throws on any other non-ok status.
   */
  async load(id: string): Promise<Configuration | null> {
    const res = await fetch(`${this.baseUrl}/configurations/${encodeURIComponent(id)}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`load failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<Configuration>;
  }

  /**
   * Returns all configuration summaries via `GET /configurations`.
   * Throws on a non-ok response.
   */
  async list(): Promise<ConfigurationSummary[]> {
    const res = await fetch(`${this.baseUrl}/configurations`);
    if (!res.ok) {
      throw new Error(`list failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<ConfigurationSummary[]>;
  }

  /**
   * Deletes a configuration by ID via `DELETE /configurations/:id`.
   * Throws if the server responds with a non-ok status.
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/configurations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`delete failed: ${res.status} ${res.statusText}`);
    }
  }
}

/**
 * Factory that creates a FetchConfigService pointed at the given base URL.
 * Useful when the URL is determined at runtime (e.g. from an env variable).
 */
export function createFetchConfigService(baseUrl: string): FetchConfigService {
  return new FetchConfigService(baseUrl);
}
