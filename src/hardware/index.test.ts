import { describe, expect, it } from "vitest";
import { getAvailablePorts, getPortsByType, PORT_TYPE_LABELS } from "./index";

describe("hardware/index", () => {
  it("returns only BRAIN ports with no expansion", () => {
    const ports = getAvailablePorts(0);
    expect(ports.every((p) => p.device === "BRAIN")).toBe(true);
  });

  it("adds BRAIN+ ports per slot", () => {
    expect(getAvailablePorts(1).some((p) => p.slot === "P1")).toBe(true);
    expect(getAvailablePorts(2).some((p) => p.slot === "P2")).toBe(true);
  });

  it("filters ports by type", () => {
    const ai = getPortsByType(0, "AI");
    expect(ai).toHaveLength(12);
    expect(ai.every((p) => p.type === "AI")).toBe(true);
  });

  it("ships all BRAIN TC ports wired for Type-K", () => {
    const tc = getPortsByType(0, "TC");
    expect(tc).toHaveLength(24);
    expect(tc.every((p) => p.tcType === "K")).toBe(true);
  });

  it("ships all BRAIN+ TC ports wired for Type-K", () => {
    const tc = getPortsByType(1, "TC").filter((p) => p.device === "BRAIN+");
    expect(tc).toHaveLength(12);
    expect(tc.every((p) => p.tcType === "K")).toBe(true);
  });

  it("exposes a label for every port type", () => {
    expect(PORT_TYPE_LABELS.AI).toBe("Analog In");
    expect(PORT_TYPE_LABELS.MAG).toBe("Mag Pickup");
  });
});
