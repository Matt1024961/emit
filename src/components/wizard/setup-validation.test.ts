import { describe, expect, it } from "vitest";
import type { Equipment } from "@/types/config";
import { hasSetupErrors, validateSetup } from "./setup-validation";

const validEquipment: Equipment = {
  engineType: "CAT-3516",
  compressorModel: "JGC/4",
  stages: 3,
  coolerSections: 2,
};

describe("validateSetup", () => {
  it("returns no errors for a complete form", () => {
    expect(validateSetup({ configName: "Site 14", equipment: validEquipment })).toEqual({});
  });

  it("requires a non-blank configuration name", () => {
    expect(validateSetup({ configName: "   ", equipment: validEquipment }).configName).toBe(
      "Configuration name is required."
    );
  });

  it("requires a compressor model", () => {
    const errors = validateSetup({
      configName: "x",
      equipment: { ...validEquipment, compressorModel: "" },
    });
    expect(errors.compressorModel).toBeDefined();
  });

  it("requires an engine type", () => {
    const errors = validateSetup({
      configName: "x",
      equipment: { ...validEquipment, engineType: "" },
    });
    expect(errors.engineType).toBeDefined();
  });

  it("requires at least one compressor stage", () => {
    const errors = validateSetup({
      configName: "x",
      equipment: { ...validEquipment, stages: 0 },
    });
    expect(errors.stages).toBeDefined();
  });

  it("reports multiple missing fields at once", () => {
    const errors = validateSetup({
      configName: "",
      equipment: { engineType: "", compressorModel: "", stages: 0, coolerSections: 0 },
    });
    expect(Object.keys(errors)).toHaveLength(4);
  });
});

describe("hasSetupErrors", () => {
  it("is true when at least one error is present", () => {
    expect(hasSetupErrors({ configName: "x" })).toBe(true);
  });

  it("is false for an empty error map", () => {
    expect(hasSetupErrors({})).toBe(false);
  });
});
