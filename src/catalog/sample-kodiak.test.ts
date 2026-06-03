import { describe, expect, it } from "vitest";
import { ALL_COMPRESSOR_MODELS } from "./compressor-models";
import { ENGINE_TYPES } from "./engine-types";
import { SAMPLE_KODIAK } from "./sample-kodiak";

describe("SAMPLE_KODIAK", () => {
  it("has a non-empty items list", () => {
    expect(SAMPLE_KODIAK.items.length).toBeGreaterThan(0);
  });

  it("uses a valid compressor model from the catalog", () => {
    expect(ALL_COMPRESSOR_MODELS).toContain(SAMPLE_KODIAK.equipment.compressorModel);
  });

  it("uses a valid engine type from the catalog", () => {
    expect(ENGINE_TYPES).toContain(SAMPLE_KODIAK.equipment.engineType);
  });

  it("includes at least one Relay-NC fail-safe item", () => {
    const relayNcItems = SAMPLE_KODIAK.items.filter((item) => item.signal === "Relay-NC");
    expect(relayNcItems.length).toBeGreaterThan(0);
  });

  it("has unique item tags", () => {
    const tags = SAMPLE_KODIAK.items.map((item) => item.tag);
    const uniqueTags = new Set(tags);
    expect(uniqueTags.size).toBe(tags.length);
  });

  it("has a brainPlusCount of 0, 1, or 2", () => {
    expect([0, 1, 2]).toContain(SAMPLE_KODIAK.hardware.brainPlusCount);
  });
});
