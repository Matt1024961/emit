import { beforeEach, describe, expect, it } from "vitest";
import { getRecommendedItems, IO_CATALOG } from "@/catalog/io-catalog";
import { BRAIN_PORTS } from "@/hardware/brain";
import { getAvailablePorts } from "@/hardware/index";
import type { Port } from "@/types/port";
import { useWizardStore } from "./wizard";

function port(id: string): Port {
  const found = BRAIN_PORTS.find((p) => p.id === id);
  if (!found) throw new Error(`Port ${id} not found`);
  return found;
}

function catalog(tag: string) {
  const item = IO_CATALOG.find((i) => i.tag === tag);
  if (!item) throw new Error(`Catalog item ${tag} not found`);
  return item;
}

describe("wizard store", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  describe("setup", () => {
    it("updates name and equipment", () => {
      const s = useWizardStore.getState();
      s.setConfigName("Site 14");
      s.setEquipment({ compressorModel: "JGC/4", stages: 3 });
      const next = useWizardStore.getState();
      expect(next.configName).toBe("Site 14");
      expect(next.equipment.compressorModel).toBe("JGC/4");
      expect(next.equipment.stages).toBe(3);
    });

    it("navigates between steps", () => {
      useWizardStore.getState().setStep(2);
      expect(useWizardStore.getState().step).toBe(2);
    });
  });

  describe("active I/O", () => {
    it("adds catalog items with sequential ids", () => {
      const s = useWizardStore.getState();
      s.addIOFromCatalog(catalog("PT-101"));
      s.addIOFromCatalog(catalog("PT-102"));
      const items = useWizardStore.getState().activeIO;
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe("io-0001");
      expect(items[1].id).toBe("io-0002");
    });

    it("applies the recommended template", () => {
      useWizardStore.getState().applyTemplate("recommended");
      expect(useWizardStore.getState().activeIO).toHaveLength(getRecommendedItems().length);
    });

    it("removing an item also removes its mapping", () => {
      const s = useWizardStore.getState();
      s.addIOFromCatalog(catalog("PT-101"));
      const id = useWizardStore.getState().activeIO[0].id;
      useWizardStore.getState().addMapping(id, port("AI1"));
      expect(useWizardStore.getState().mappings).toHaveLength(1);
      useWizardStore.getState().removeIOItem(id);
      expect(useWizardStore.getState().mappings).toHaveLength(0);
      expect(useWizardStore.getState().activeIO).toHaveLength(0);
    });

    it("edits an item's notes and range", () => {
      const s = useWizardStore.getState();
      s.addIOFromCatalog(catalog("PT-101"));
      const id = useWizardStore.getState().activeIO[0].id;
      useWizardStore.getState().editIOItem(id, { notes: "spare" });
      expect(useWizardStore.getState().activeIO[0].notes).toBe("spare");
    });

    it("clears all I/O", () => {
      useWizardStore.getState().applyTemplate("limited");
      useWizardStore.getState().clearIO();
      expect(useWizardStore.getState().activeIO).toHaveLength(0);
    });
  });

  describe("mapping validation", () => {
    function addItem(tag: string) {
      useWizardStore.getState().addIOFromCatalog(catalog(tag));
      const items = useWizardStore.getState().activeIO;
      return items[items.length - 1].id;
    }

    it("accepts a compatible mapping", () => {
      const id = addItem("PT-101"); // 4-20mA input → AI
      const result = useWizardStore.getState().addMapping(id, port("AI1"));
      expect(result.success).toBe(true);
      expect(useWizardStore.getState().mappings).toHaveLength(1);
    });

    it("rejects an incompatible port type", () => {
      const id = addItem("PT-101");
      const result = useWizardStore.getState().addMapping(id, port("DO1"));
      expect(result.success).toBe(false);
      expect(useWizardStore.getState().mappings).toHaveLength(0);
    });

    it("rejects a fail-safe relay on a non-Form-C port", () => {
      const id = addItem("DO-904"); // Relay-NC
      expect(useWizardStore.getState().addMapping(id, port("DO1")).success).toBe(false);
    });

    it("accepts a fail-safe relay on DO7 (Form-C)", () => {
      const id = addItem("DO-904");
      expect(useWizardStore.getState().addMapping(id, port("DO7")).success).toBe(true);
    });

    it("re-mapping a port evicts the previous occupant", () => {
      const a = addItem("PT-101");
      const b = addItem("PT-102");
      useWizardStore.getState().addMapping(a, port("AI1"));
      useWizardStore.getState().addMapping(b, port("AI1"));
      const mappings = useWizardStore.getState().mappings;
      expect(mappings).toHaveLength(1);
      expect(mappings[0].ioId).toBe(b);
    });
  });

  describe("hardware + auto-map", () => {
    it("auto-maps every compatible item", () => {
      useWizardStore.getState().applyTemplate("recommended");
      useWizardStore.getState().setHardware({ brainPlusCount: 1 });
      useWizardStore.getState().autoMap();
      const { activeIO, mappings } = useWizardStore.getState();
      expect(mappings).toHaveLength(activeIO.length);
    });

    it("reducing hardware clears mappings on now-absent ports", () => {
      useWizardStore.getState().setHardware({ brainPlusCount: 1 });
      useWizardStore.getState().addIOFromCatalog(catalog("PT-101"));
      const id = useWizardStore.getState().activeIO[0].id;
      const plusPort = getAvailablePorts(1).find((p) => p.device === "BRAIN+" && p.type === "AI");
      if (!plusPort) throw new Error("expected a BRAIN+ AI port");

      useWizardStore.getState().addMapping(id, plusPort);
      expect(useWizardStore.getState().mappings.some((m) => m.device === "BRAIN+")).toBe(true);

      useWizardStore.getState().setHardware({ brainPlusCount: 0 });
      expect(useWizardStore.getState().mappings.some((m) => m.device === "BRAIN+")).toBe(false);
      expect(useWizardStore.getState().mappings).toHaveLength(0);
    });

    it("clearMappings empties the mapping list", () => {
      useWizardStore.getState().applyTemplate("limited");
      useWizardStore.getState().autoMap();
      useWizardStore.getState().clearMappings();
      expect(useWizardStore.getState().mappings).toHaveLength(0);
    });

    it("getUnmappedItems reflects current mappings", () => {
      const s = useWizardStore.getState();
      s.addIOFromCatalog(catalog("PT-101"));
      const id = useWizardStore.getState().activeIO[0].id;
      expect(useWizardStore.getState().getUnmappedItems()).toHaveLength(1);
      useWizardStore.getState().addMapping(id, port("AI1"));
      expect(useWizardStore.getState().getUnmappedItems()).toHaveLength(0);
    });
  });

  describe("loadFromConfig", () => {
    it("hydrates state from a saved configuration", () => {
      const available = getAvailablePorts(0);
      expect(available.length).toBeGreaterThan(0);
      useWizardStore.getState().loadFromConfig({
        id: "cfg-1",
        name: "Loaded",
        description: "",
        equipment: {
          engineType: "CAT-3516",
          compressorModel: "JGC/4",
          stages: 3,
          coolerSections: 2,
        },
        hardware: { brainPlusCount: 0 },
        activeIO: [
          {
            id: "io-0001",
            tag: "PT-101",
            name: "Stage 1 Suction Pressure",
            category: "Input",
            signal: "4-20mA",
            range: "0-300 PSI",
            hardwareHint: "AI",
            formC: false,
            tcType: null,
            group: "Pressure",
            notes: "",
          },
        ],
        mappings: [{ ioId: "io-0001", portId: "AI1", device: "BRAIN" }],
      });
      const s = useWizardStore.getState();
      expect(s.configName).toBe("Loaded");
      expect(s.activeIO).toHaveLength(1);
      expect(s.mappings).toHaveLength(1);
      expect(s.step).toBe(2);
    });
  });

  describe("loadSample", () => {
    it("seeds the Kodiak sample I/O and jumps to Define I/O with no mappings", () => {
      useWizardStore.getState().loadSample();
      const s = useWizardStore.getState();
      expect(s.step).toBe(2);
      expect(s.configName).toMatch(/Kodiak/i);
      expect(s.equipment.compressorModel).toBeTruthy();
      expect(s.activeIO.length).toBeGreaterThan(0);
      expect(s.mappings).toHaveLength(0);
      // ids are sequential from io-0001
      expect(s.activeIO[0].id).toBe("io-0001");
      // includes the fail-safe relay so Auto Map can demo Form-C
      expect(s.activeIO.some((i) => i.signal === "Relay-NC")).toBe(true);
    });
  });

  describe("undo / redo (zundo temporal)", () => {
    it("undoes and redoes a mapping change", () => {
      const s = useWizardStore.getState();
      s.addIOFromCatalog(catalog("PT-101"));
      const id = useWizardStore.getState().activeIO[0].id;
      useWizardStore.temporal.getState().clear();

      s.addMapping(id, port("AI1"));
      expect(useWizardStore.getState().mappings).toHaveLength(1);

      useWizardStore.temporal.getState().undo();
      expect(useWizardStore.getState().mappings).toHaveLength(0);

      useWizardStore.temporal.getState().redo();
      expect(useWizardStore.getState().mappings).toHaveLength(1);
    });
  });
});
