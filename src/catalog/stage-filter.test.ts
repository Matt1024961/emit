import { describe, expect, it } from "vitest";
import { filterByEquipment, inferCoolerSection, inferStage } from "./stage-filter";

// ---------------------------------------------------------------------------
// Helpers — minimal CatalogItem-shaped fixtures
// ---------------------------------------------------------------------------

function item(tag: string, name: string) {
  return { tag, name };
}

// ---------------------------------------------------------------------------
// inferStage
// ---------------------------------------------------------------------------

describe("inferStage", () => {
  describe("explicit Stage N in the item name", () => {
    it("returns 1 for a Stage 1 item", () => {
      expect(inferStage(item("TT-101", "Stage 1 Suction Temperature"))).toBe(1);
    });

    it("returns 2 for a Stage 2 item", () => {
      expect(inferStage(item("PT-201", "Stage 2 Suction Pressure"))).toBe(2);
    });

    it("returns 3 for a Stage 3 item", () => {
      expect(inferStage(item("TT-302", "Stage 3 Discharge Temperature"))).toBe(3);
    });

    it("returns null for a lube-oil item (no stage in the name)", () => {
      expect(inferStage(item("TT-401", "Lube Oil Temperature"))).toBeNull();
    });

    it("returns null for a fuel-gas item (no stage in the name)", () => {
      expect(inferStage(item("PT-501", "Fuel Gas Pressure"))).toBeNull();
    });

    it("does not treat the tag number as a stage (Engine RPM stays visible)", () => {
      expect(inferStage(item("SI-202", "Engine RPM"))).toBeNull();
    });
  });

  describe("name-based detection (Stage N / Stg N)", () => {
    it("detects 'Stage 3 Discharge' even when tag hundreds digit would not fire", () => {
      // Tag TT-302: hundreds digit is 3 — name match also fires; consistent result.
      expect(inferStage(item("TT-302", "Stage 3 Discharge Temperature"))).toBe(3);
    });

    it("detects 'Stg 3' abbreviation in name", () => {
      // TT-503: hundreds digit 5 is NOT a stage, so name match is the only path.
      expect(inferStage(item("TT-503", "Discharge Bottle Temp Stg 3"))).toBe(3);
    });

    it("detects 'Stg 1' abbreviation in name", () => {
      expect(inferStage(item("TT-501", "Discharge Bottle Temp Stg 1"))).toBe(1);
    });

    it("detects 'Stg 2' abbreviation in name", () => {
      expect(inferStage(item("TT-502", "Discharge Bottle Temp Stg 2"))).toBe(2);
    });

    it("returns null for a name-only stage call out > 3 (conservative)", () => {
      // Stage 4 is not a valid compressor stage — return null.
      expect(inferStage(item("XX-999", "Stage 4 Something"))).toBeNull();
    });
  });

  describe("non-staged items", () => {
    it("returns null for a lube-oil item with no stage in name or tag", () => {
      expect(inferStage(item("TT-401", "Lube Oil Temperature"))).toBeNull();
    });

    it("returns null for a cooler-section item (no stage keyword)", () => {
      expect(inferStage(item("TT-601", "Cooler Section 1 Outlet Temp"))).toBeNull();
    });

    it("returns null for a generic item with no tag suffix and no stage keyword", () => {
      expect(inferStage(item("ES-001", "Emergency Stop"))).toBeNull();
    });
  });

  describe("case-insensitivity", () => {
    it("handles lowercase 'stage 2'", () => {
      expect(inferStage(item("XX-200", "stage 2 discharge"))).toBe(2);
    });

    it("handles mixed-case 'STG 1'", () => {
      expect(inferStage(item("XX-500", "Bottle STG 1"))).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// inferCoolerSection
// ---------------------------------------------------------------------------

describe("inferCoolerSection", () => {
  it("returns 1 for 'Cooler Section 1 Outlet Temp'", () => {
    expect(inferCoolerSection(item("TT-601", "Cooler Section 1 Outlet Temp"))).toBe(1);
  });

  it("returns 2 for 'Cooler Section 2 Outlet Temp'", () => {
    expect(inferCoolerSection(item("TT-602", "Cooler Section 2 Outlet Temp"))).toBe(2);
  });

  it("returns null for a non-cooler item", () => {
    expect(inferCoolerSection(item("TT-101", "Stage 1 Suction Temperature"))).toBeNull();
  });

  it("returns null for a lube-oil item", () => {
    expect(inferCoolerSection(item("TT-401", "Lube Oil Temperature"))).toBeNull();
  });

  it("handles case-insensitive 'cooler section 3'", () => {
    expect(inferCoolerSection(item("TT-603", "cooler section 3 outlet"))).toBe(3);
  });

  it("handles extra spaces between words", () => {
    // The regex uses \s+ so "Cooler  Section  2" should match.
    expect(inferCoolerSection(item("TT-602", "Cooler  Section  2 Outlet"))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// filterByEquipment
// ---------------------------------------------------------------------------

describe("filterByEquipment", () => {
  const fixtures = [
    item("PT-101", "Stage 1 Suction Pressure"),
    item("PT-201", "Stage 2 Suction Pressure"),
    item("PT-301", "Stage 3 Suction Pressure"),
    item("TT-401", "Lube Oil Temperature"),
    item("TT-503", "Discharge Bottle Temp Stg 3"),
    item("TT-601", "Cooler Section 1 Outlet Temp"),
    item("TT-602", "Cooler Section 2 Outlet Temp"),
  ];

  describe("stage filtering", () => {
    it("removes stage-3 items when equipment has only 2 stages", () => {
      const result = filterByEquipment(fixtures, { stages: 2, coolerSections: 3 });
      const tags = result.map((i) => i.tag);
      expect(tags).not.toContain("PT-301");
      expect(tags).not.toContain("TT-503");
    });

    it("keeps stage-1 and stage-2 items when equipment has 2 stages", () => {
      const result = filterByEquipment(fixtures, { stages: 2, coolerSections: 3 });
      const tags = result.map((i) => i.tag);
      expect(tags).toContain("PT-101");
      expect(tags).toContain("PT-201");
    });

    it("keeps non-staged items (null stage) regardless of equipment.stages", () => {
      const result = filterByEquipment(fixtures, { stages: 1, coolerSections: 3 });
      const tags = result.map((i) => i.tag);
      expect(tags).toContain("TT-401"); // Lube Oil — no stage
    });

    it("keeps all stage items when equipment.stages is 3", () => {
      const result = filterByEquipment(fixtures, { stages: 3, coolerSections: 3 });
      const tags = result.map((i) => i.tag);
      expect(tags).toContain("PT-101");
      expect(tags).toContain("PT-201");
      expect(tags).toContain("PT-301");
      expect(tags).toContain("TT-503");
    });
  });

  describe("cooler-section filtering", () => {
    it("removes Cooler Section 2 when equipment has only 1 cooler section", () => {
      const result = filterByEquipment(fixtures, { stages: 3, coolerSections: 1 });
      const tags = result.map((i) => i.tag);
      expect(tags).not.toContain("TT-602");
    });

    it("keeps Cooler Section 1 when equipment has 1 cooler section", () => {
      const result = filterByEquipment(fixtures, { stages: 3, coolerSections: 1 });
      const tags = result.map((i) => i.tag);
      expect(tags).toContain("TT-601");
    });

    it("keeps both cooler sections when equipment has 2 cooler sections", () => {
      const result = filterByEquipment(fixtures, { stages: 3, coolerSections: 2 });
      const tags = result.map((i) => i.tag);
      expect(tags).toContain("TT-601");
      expect(tags).toContain("TT-602");
    });
  });

  describe("combined stage + cooler filtering", () => {
    it("applies both filters simultaneously", () => {
      const result = filterByEquipment(fixtures, { stages: 2, coolerSections: 1 });
      const tags = result.map((i) => i.tag);
      // Stage 3 out
      expect(tags).not.toContain("PT-301");
      expect(tags).not.toContain("TT-503");
      // Cooler section 2 out
      expect(tags).not.toContain("TT-602");
      // Remaining items in
      expect(tags).toContain("PT-101");
      expect(tags).toContain("PT-201");
      expect(tags).toContain("TT-401");
      expect(tags).toContain("TT-601");
    });
  });

  describe("generic preservation", () => {
    it("returns generic array type unchanged for items that pass", () => {
      const typedFixtures = [
        { tag: "TT-101", name: "Stage 1 Suction Temperature", group: "Temperature" },
      ];
      const result = filterByEquipment(typedFixtures, { stages: 2, coolerSections: 2 });
      expect(result[0]).toHaveProperty("group", "Temperature");
    });

    it("returns empty array when all items exceed equipment bounds", () => {
      const stageOnly = [
        item("TT-302", "Stage 3 Discharge Temperature"),
        item("TT-502", "Discharge Bottle Temp Stg 2"),
      ];
      const result = filterByEquipment(stageOnly, { stages: 1, coolerSections: 0 });
      expect(result).toHaveLength(0);
    });

    it("returns original array reference items (no mutation)", () => {
      const original = [...fixtures];
      filterByEquipment(fixtures, { stages: 1, coolerSections: 0 });
      expect(fixtures).toHaveLength(original.length);
    });
  });
});
