import { beforeEach, describe, expect, it } from "vitest";
import { configService } from "@/services/local-storage";
import type { Configuration } from "@/types/config";
import { useSavedConfigsStore } from "./saved";

function makeConfig(id: string, name: string): Configuration {
  return {
    id,
    name,
    description: "",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    equipment: { engineType: "CAT-3516", compressorModel: "JGC/4", stages: 3, coolerSections: 2 },
    hardware: { brainPlusCount: 0 },
    activeIO: [],
    mappings: [],
  };
}

describe("useSavedConfigsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSavedConfigsStore.setState({ summaries: [], loading: false });
  });

  it("loads saved summaries from the service", async () => {
    await configService.save(makeConfig("a", "Alpha"));
    await useSavedConfigsStore.getState().load();
    const { summaries } = useSavedConfigsStore.getState();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].name).toBe("Alpha");
    expect(summaries[0].version).toBe(1);
  });

  it("removes a configuration and drops it from the list", async () => {
    await configService.save(makeConfig("a", "Alpha"));
    await configService.save(makeConfig("b", "Bravo"));
    await useSavedConfigsStore.getState().load();
    await useSavedConfigsStore.getState().remove("a");
    const { summaries } = useSavedConfigsStore.getState();
    expect(summaries.map((s) => s.id)).toEqual(["b"]);
    expect(await configService.load("a")).toBeNull();
  });
});
