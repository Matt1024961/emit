import { describe, expect, it } from "vitest";
import { buildConfiguration, type ConfigDraft } from "./build-config";

const draft: ConfigDraft = {
  configId: "cfg-1",
  configName: "Kodiak Site 14",
  configDescription: "demo",
  equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 2, coolerSections: 1 },
  hardware: { brainPlusCount: 1 },
  activeIO: [],
  mappings: [],
};

describe("buildConfiguration", () => {
  it("stamps timestamps and default version", () => {
    const cfg = buildConfiguration(draft, "2026-06-02T10:00:00.000Z");
    expect(cfg.id).toBe("cfg-1");
    expect(cfg.name).toBe("Kodiak Site 14");
    expect(cfg.version).toBe(1);
    expect(cfg.createdAt).toBe("2026-06-02T10:00:00.000Z");
    expect(cfg.updatedAt).toBe("2026-06-02T10:00:00.000Z");
  });

  it("falls back to 'Untitled Configuration' when the name is blank", () => {
    const cfg = buildConfiguration({ ...draft, configName: "" }, "2026-06-02T10:00:00.000Z");
    expect(cfg.name).toBe("Untitled Configuration");
  });

  it("accepts an explicit version (for save-as-new-version)", () => {
    const cfg = buildConfiguration(draft, "2026-06-02T10:00:00.000Z", 4);
    expect(cfg.version).toBe(4);
  });
});
