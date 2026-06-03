import { beforeEach, describe, expect, it } from "vitest";
import type { Configuration } from "@/types/config";
import { LocalStorageConfigService } from "./local-storage";

function makeConfig(overrides: Partial<Configuration> = {}): Configuration {
  return {
    id: "cfg-1",
    name: "Kodiak Site 14",
    description: "",
    version: 1,
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
    equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
    hardware: { brainPlusCount: 0 },
    activeIO: [],
    mappings: [],
    ...overrides,
  };
}

describe("LocalStorageConfigService", () => {
  let service: LocalStorageConfigService;

  beforeEach(() => {
    localStorage.clear();
    service = new LocalStorageConfigService();
  });

  it("saves and loads a configuration", async () => {
    await service.save(makeConfig());
    const loaded = await service.load("cfg-1");
    expect(loaded?.name).toBe("Kodiak Site 14");
  });

  it("stamps updatedAt on save", async () => {
    await service.save(makeConfig({ updatedAt: "2000-01-01T00:00:00.000Z" }));
    const loaded = await service.load("cfg-1");
    expect(loaded?.updatedAt).not.toBe("2000-01-01T00:00:00.000Z");
  });

  it("returns null for an unknown id", async () => {
    expect(await service.load("missing")).toBeNull();
  });

  it("lists summaries sorted by most-recently-updated", async () => {
    await service.save(makeConfig({ id: "a", name: "A" }));
    await new Promise((r) => setTimeout(r, 5));
    await service.save(makeConfig({ id: "b", name: "B" }));
    const list = await service.list();
    expect(list.map((s) => s.id)).toEqual(["b", "a"]);
    expect(list[0]).toHaveProperty("name", "B");
  });

  it("list includes version in each summary", async () => {
    await service.save(makeConfig({ id: "v2", version: 2 }));
    const list = await service.list();
    expect(list[0]).toHaveProperty("version", 2);
  });

  it("deletes a configuration", async () => {
    await service.save(makeConfig());
    await service.delete("cfg-1");
    expect(await service.load("cfg-1")).toBeNull();
  });

  it("recovers from a corrupt store", async () => {
    localStorage.setItem("panel-io-configurator:configs", "{not json");
    expect(await service.list()).toEqual([]);
  });

  describe("nextVersion", () => {
    it("returns 1 when no config with that name exists", async () => {
      expect(await service.nextVersion("Unknown Site")).toBe(1);
    });

    it("returns max version + 1 when multiple versions of the same name exist", async () => {
      await service.save(makeConfig({ id: "x1", name: "Kodiak Site 14", version: 1 }));
      await service.save(makeConfig({ id: "x2", name: "Kodiak Site 14", version: 3 }));
      await service.save(makeConfig({ id: "x3", name: "Kodiak Site 14", version: 2 }));
      expect(await service.nextVersion("Kodiak Site 14")).toBe(4);
    });

    it("only counts configs whose name matches exactly", async () => {
      await service.save(makeConfig({ id: "y1", name: "Alpha", version: 5 }));
      await service.save(makeConfig({ id: "y2", name: "Beta", version: 10 }));
      expect(await service.nextVersion("Alpha")).toBe(6);
    });
  });
});
