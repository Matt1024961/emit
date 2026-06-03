import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Configuration } from "../types/config";
import { createFetchConfigService, FetchConfigService } from "./fetch-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<Configuration> = {}): Configuration {
  return {
    id: "cfg-1",
    name: "Kodiak Site 14",
    description: "",
    version: 1,
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
    equipment: {
      engineType: "CAT-3516",
      compressorModel: "JGC/4",
      stages: 3,
      coolerSections: 2,
    },
    hardware: { brainPlusCount: 0 },
    activeIO: [],
    mappings: [],
    ...overrides,
  };
}

/**
 * Builds a minimal Response-like object that `global.fetch` can return.
 */
function mockResponse(status: number, body: unknown = null): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("FetchConfigService", () => {
  let service: FetchConfigService;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    service = new FetchConfigService("https://api.example.com");
  });

  // -------------------------------------------------------------------------
  // save()
  // -------------------------------------------------------------------------

  describe("save()", () => {
    it("POSTs to the correct URL with JSON body", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(201));
      const config = makeConfig();

      await service.save(config);

      expect(global.fetch).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/configurations",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        })
      );
    });

    it("resolves without a value on 200", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200));
      await expect(service.save(makeConfig())).resolves.toBeUndefined();
    });

    it("throws on a 500 response", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(500));
      await expect(service.save(makeConfig())).rejects.toThrow("save failed: 500");
    });

    it("throws on a 400 response", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(400));
      await expect(service.save(makeConfig())).rejects.toThrow("save failed: 400");
    });
  });

  // -------------------------------------------------------------------------
  // load()
  // -------------------------------------------------------------------------

  describe("load()", () => {
    it("GETs the correct URL", async () => {
      const config = makeConfig();
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, config));

      await service.load("cfg-1");

      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/configurations/cfg-1");
    });

    it("returns the parsed Configuration on 200", async () => {
      const config = makeConfig();
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, config));

      const result = await service.load("cfg-1");

      expect(result).toEqual(config);
    });

    it("returns null on 404", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(404));
      const result = await service.load("missing-id");
      expect(result).toBeNull();
    });

    it("throws on a 500 response", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(500));
      await expect(service.load("cfg-1")).rejects.toThrow("load failed: 500");
    });

    it("URL-encodes the ID", async () => {
      const config = makeConfig({ id: "cfg/with spaces" });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, config));

      await service.load("cfg/with spaces");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/configurations/cfg%2Fwith%20spaces"
      );
    });
  });

  // -------------------------------------------------------------------------
  // list()
  // -------------------------------------------------------------------------

  describe("list()", () => {
    it("GETs the correct URL", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, []));

      await service.list();

      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/configurations");
    });

    it("returns the parsed ConfigurationSummary array", async () => {
      const summaries = [
        { id: "a", name: "Alpha", updatedAt: "2026-06-01T00:00:00.000Z" },
        { id: "b", name: "Beta", updatedAt: "2026-06-02T00:00:00.000Z" },
      ];
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, summaries));

      const result = await service.list();

      expect(result).toEqual(summaries);
    });

    it("throws on a non-ok response", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(503));
      await expect(service.list()).rejects.toThrow("list failed: 503");
    });
  });

  // -------------------------------------------------------------------------
  // delete()
  // -------------------------------------------------------------------------

  describe("delete()", () => {
    it("sends DELETE to the correct URL", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(204));

      await service.delete("cfg-1");

      expect(global.fetch).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/configurations/cfg-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("resolves without a value on 204", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(204));
      await expect(service.delete("cfg-1")).resolves.toBeUndefined();
    });

    it("throws on a non-ok response", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(404));
      await expect(service.delete("cfg-1")).rejects.toThrow("delete failed: 404");
    });

    it("URL-encodes the ID", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(204));

      await service.delete("id with/slash");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/configurations/id%20with%2Fslash",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Constructor / factory
  // -------------------------------------------------------------------------

  describe("constructor", () => {
    it("defaults baseUrl to /api when none is provided", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, []));
      const defaultService = new FetchConfigService();

      await defaultService.list();

      expect(global.fetch).toHaveBeenCalledWith("/api/configurations");
    });

    it("strips a trailing slash from baseUrl", async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockResponse(200, []));
      const withTrailingSlash = new FetchConfigService("https://api.example.com/");

      await withTrailingSlash.list();

      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/configurations");
    });
  });

  // -------------------------------------------------------------------------
  // Factory helper
  // -------------------------------------------------------------------------

  describe("createFetchConfigService()", () => {
    it("returns a FetchConfigService instance", () => {
      const svc = createFetchConfigService("https://api.example.com");
      expect(svc).toBeInstanceOf(FetchConfigService);
    });
  });
});
