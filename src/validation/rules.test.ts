import { describe, expect, it } from "vitest";
import { BRAIN_PORTS } from "../hardware/brain";
import { getAvailablePorts } from "../hardware/index";
import type { ActiveIOItem } from "../types/io";
import type { Port, PortMapping } from "../types/port";
import {
  canMap,
  getCapacityWarning,
  getRequiredPortType,
  getUnmappedFailSafeRelays,
} from "./rules";

function makeItem(overrides: Partial<ActiveIOItem> = {}): ActiveIOItem {
  return {
    id: "io-0001",
    tag: "PT-101",
    name: "Test",
    category: "Input",
    signal: "4-20mA",
    range: "0-100 PSI",
    hardwareHint: "AI",
    formC: false,
    tcType: null,
    group: "Pressure",
    notes: "",
    ...overrides,
  };
}

function findPort(id: string): Port {
  const port = BRAIN_PORTS.find((p) => p.id === id);
  if (!port) throw new Error(`Port ${id} not found`);
  return port;
}

describe("getRequiredPortType", () => {
  it("maps 4-20mA Input to AI", () => {
    expect(getRequiredPortType({ signal: "4-20mA", category: "Input" })).toBe("AI");
  });

  it("maps 4-20mA Output to AO", () => {
    expect(getRequiredPortType({ signal: "4-20mA", category: "Output" })).toBe("AO");
  });

  it("maps TC-K to TC", () => {
    expect(getRequiredPortType({ signal: "TC-K", category: "Input" })).toBe("TC");
  });

  it("maps TC-J to TC", () => {
    expect(getRequiredPortType({ signal: "TC-J", category: "Input" })).toBe("TC");
  });

  it("maps Pulse to MAG", () => {
    expect(getRequiredPortType({ signal: "Pulse", category: "Input" })).toBe("MAG");
  });

  it("maps DryContact to DI", () => {
    expect(getRequiredPortType({ signal: "DryContact", category: "Input" })).toBe("DI");
  });

  it("maps Relay to DO", () => {
    expect(getRequiredPortType({ signal: "Relay", category: "Output" })).toBe("DO");
  });

  it("maps Relay-NC to DO", () => {
    expect(getRequiredPortType({ signal: "Relay-NC", category: "Output" })).toBe("DO");
  });
});

describe("canMap — signal/port type compatibility", () => {
  it("allows 4-20mA Input onto AI port", () => {
    expect(canMap(makeItem(), findPort("AI1"))).toEqual({ valid: true });
  });

  it("rejects 4-20mA Input onto DO port", () => {
    const result = canMap(makeItem(), findPort("DO1"));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("AI");
  });

  it("allows DryContact onto DI port", () => {
    expect(canMap(makeItem({ signal: "DryContact" }), findPort("DI2"))).toEqual({ valid: true });
  });

  it("rejects DryContact onto AI port", () => {
    const result = canMap(makeItem({ signal: "DryContact" }), findPort("AI1"));
    expect(result.valid).toBe(false);
  });

  it("allows Relay (Form-A) onto DO1", () => {
    expect(canMap(makeItem({ signal: "Relay", category: "Output" }), findPort("DO1"))).toEqual({
      valid: true,
    });
  });

  it("allows Relay (Form-A) onto DO7", () => {
    expect(canMap(makeItem({ signal: "Relay", category: "Output" }), findPort("DO7"))).toEqual({
      valid: true,
    });
  });
});

describe("canMap — Form-C constraint", () => {
  const failSafe = makeItem({ signal: "Relay-NC", category: "Output", formC: true });

  it("rejects Relay-NC onto DO1 (Form-A)", () => {
    const result = canMap(failSafe, findPort("DO1"));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Form-C");
  });

  it("rejects Relay-NC onto DO2 through DO6 (all Form-A)", () => {
    for (const id of ["DO2", "DO3", "DO4", "DO5", "DO6"]) {
      expect(canMap(failSafe, findPort(id)).valid).toBe(false);
    }
  });

  it("allows Relay-NC onto DO7 (Form-C)", () => {
    expect(canMap(failSafe, findPort("DO7"))).toEqual({ valid: true });
  });

  it("allows Relay-NC onto DO8 (Form-C)", () => {
    expect(canMap(failSafe, findPort("DO8"))).toEqual({ valid: true });
  });

  it("rejects Relay-NC onto BRAIN+ DO ports (no Form-C on BRAIN+)", () => {
    const brainPlusPorts = getAvailablePorts(1).filter(
      (p) => p.device === "BRAIN+" && p.type === "DO"
    );
    for (const port of brainPlusPorts) {
      expect(canMap(failSafe, port).valid).toBe(false);
    }
  });
});

describe("canMap — thermocouple", () => {
  it("allows TC-K onto a Type-K TC port", () => {
    // Real BRAIN TC ports ship wired for Type-K.
    expect(canMap(makeItem({ signal: "TC-K", tcType: "K" }), findPort("TC1"))).toEqual({
      valid: true,
    });
  });

  it("rejects TC-J onto a Type-K TC port", () => {
    const result = canMap(makeItem({ signal: "TC-J", tcType: "J" }), findPort("TC1"));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Type-J");
  });

  it("allows TC-J onto a synthetic Type-J TC port", () => {
    const jPort: Port = { ...findPort("TC1"), tcType: "J" };
    expect(canMap(makeItem({ signal: "TC-J", tcType: "J" }), jPort)).toEqual({ valid: true });
  });

  it("stays lenient when the item carries no thermocouple type", () => {
    // Backward compatibility: an unset tcType must not be rejected.
    expect(canMap(makeItem({ signal: "TC-J", tcType: null }), findPort("TC1"))).toEqual({
      valid: true,
    });
  });

  it("rejects TC-K onto AI port", () => {
    expect(canMap(makeItem({ signal: "TC-K", tcType: "K" }), findPort("AI1")).valid).toBe(false);
  });
});

describe("canMap — MAG (RPM)", () => {
  it("allows Pulse onto MAG port", () => {
    expect(canMap(makeItem({ signal: "Pulse" }), findPort("MAG"))).toEqual({ valid: true });
  });

  it("rejects Pulse onto DI port", () => {
    expect(canMap(makeItem({ signal: "Pulse" }), findPort("DI2")).valid).toBe(false);
  });
});

describe("getCapacityWarning", () => {
  it("returns null when within capacity", () => {
    const items = [makeItem({ signal: "4-20mA", category: "Input" })];
    const ports = getAvailablePorts(0);
    expect(getCapacityWarning(items, ports)).toBeNull();
  });

  it("returns warning when AI items exceed AI port count", () => {
    // BRAIN has 12 AI ports; create 13 AI items
    const items = Array.from({ length: 13 }, (_, i) =>
      makeItem({ id: `io-${i}`, tag: `PT-${i}`, signal: "4-20mA", category: "Input" })
    );
    const ports = getAvailablePorts(0);
    const warning = getCapacityWarning(items, ports);
    expect(warning).toContain("AI");
    expect(warning).toContain("13");
  });

  it("returns null when BRAIN+ is added and provides enough ports", () => {
    const items = Array.from({ length: 13 }, (_, i) =>
      makeItem({ id: `io-${i}`, tag: `PT-${i}`, signal: "4-20mA", category: "Input" })
    );
    const ports = getAvailablePorts(1); // adds 8 more AI
    expect(getCapacityWarning(items, ports)).toBeNull();
  });
});

describe("getUnmappedFailSafeRelays", () => {
  function makeMapping(ioId: string): PortMapping {
    return { ioId, portId: "DO7", device: "BRAIN" };
  }

  it("returns Relay-NC items that have no mapping", () => {
    const items = [
      makeItem({ id: "io-fs1", signal: "Relay-NC", category: "Output" }),
      makeItem({ id: "io-fs2", signal: "Relay-NC", category: "Output" }),
    ];
    const result = getUnmappedFailSafeRelays(items, []);
    expect(result.map((i) => i.id)).toEqual(["io-fs1", "io-fs2"]);
  });

  it("excludes Relay-NC items that are already mapped", () => {
    const items = [
      makeItem({ id: "io-fs1", signal: "Relay-NC", category: "Output" }),
      makeItem({ id: "io-fs2", signal: "Relay-NC", category: "Output" }),
    ];
    const result = getUnmappedFailSafeRelays(items, [makeMapping("io-fs1")]);
    expect(result.map((i) => i.id)).toEqual(["io-fs2"]);
  });

  it("ignores non-Relay-NC items even when unmapped", () => {
    const items = [
      makeItem({ id: "io-relay", signal: "Relay", category: "Output" }),
      makeItem({ id: "io-ai", signal: "4-20mA", category: "Input" }),
      makeItem({ id: "io-fs", signal: "Relay-NC", category: "Output" }),
    ];
    const result = getUnmappedFailSafeRelays(items, []);
    expect(result.map((i) => i.id)).toEqual(["io-fs"]);
  });

  it("returns an empty array when all fail-safe relays are mapped", () => {
    const items = [makeItem({ id: "io-fs", signal: "Relay-NC", category: "Output" })];
    expect(getUnmappedFailSafeRelays(items, [makeMapping("io-fs")])).toEqual([]);
  });
});
