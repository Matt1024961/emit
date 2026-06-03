import { describe, expect, it } from "vitest";
import { getAvailablePorts } from "../hardware/index";
import type { ActiveIOItem } from "../types/io";
import type { Port, PortMapping } from "../types/port";
import { computeAutoMap } from "./auto-map";

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

function io(
  id: string,
  signal: ActiveIOItem["signal"],
  category: ActiveIOItem["category"] = "Output",
  tcType: "K" | "J" | null = null
): ActiveIOItem {
  return {
    id,
    tag: id,
    name: id,
    category,
    signal,
    range: "",
    hardwareHint: "DO",
    formC: signal === "Relay-NC",
    tcType,
    group: "Test",
    notes: "",
  };
}

function port(id: string, type: Port["type"], isFormC: boolean): Port {
  return { id, device: "BRAIN", type, label: id, pinNumbers: [1], isFormC };
}

// ---------------------------------------------------------------------------
// KEY TEST: fail-safe Relay-NC gets Form-C — the greedy first-fit bug fix
// ---------------------------------------------------------------------------

describe("computeAutoMap — fail-safe gets Form-C (the bug fix)", () => {
  it("places Relay-NC on DO7 and regular Relays on DO1–DO6 with real BRAIN ports", () => {
    const relays = ["r1", "r2", "r3", "r4", "r5", "r6"].map((id) => io(id, "Relay"));
    const failSafe = io("fs1", "Relay-NC");
    // Regular Relays come BEFORE fail-safe — old greedy code stole DO7 for r7 / left fs1 unmapped.
    const activeIO: ActiveIOItem[] = [...relays, failSafe];
    const ports = getAvailablePorts(0);

    const result = computeAutoMap(activeIO, ports, []);
    const byIo = new Map(result.map((m) => [m.ioId, m]));

    expect(byIo.has("fs1")).toBe(true);
    const fsPort = ports.find((p) => p.id === byIo.get("fs1")?.portId);
    expect(fsPort?.isFormC).toBe(true);

    for (const rel of relays) {
      const relPort = ports.find((p) => p.id === byIo.get(rel.id)?.portId);
      expect(relPort?.isFormC).toBe(false);
    }
  });

  it("Relay-NC is assigned DO7 (first Form-C) while relayA is assigned DO1", () => {
    const activeIO = [io("a1", "Relay"), io("fs1", "Relay-NC")];
    const ports = getAvailablePorts(0);

    const result = computeAutoMap(activeIO, ports, []);
    const byIo = new Map(result.map((m) => [m.ioId, m]));

    expect(byIo.get("fs1")?.portId).toBe("DO7");
    expect(byIo.get("a1")?.portId).toBe("DO1");
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("computeAutoMap — determinism", () => {
  it("returns identical results on repeated calls", () => {
    const activeIO = [io("r1", "Relay"), io("fs1", "Relay-NC"), io("ai1", "4-20mA", "Input")];
    const ports = getAvailablePorts(0);

    expect(computeAutoMap(activeIO, ports, [])).toEqual(computeAutoMap(activeIO, ports, []));
  });
});

// ---------------------------------------------------------------------------
// Existing mappings preserved
// ---------------------------------------------------------------------------

describe("computeAutoMap — existing mappings preserved", () => {
  it("does not remap an already-mapped item", () => {
    const ports = getAvailablePorts(0);
    const existing: PortMapping[] = [{ ioId: "r1", portId: "DO3", device: "BRAIN" }];

    const result = computeAutoMap(
      [io("r1", "Relay"), io("ai1", "4-20mA", "Input")],
      ports,
      existing
    );
    const byIo = new Map(result.map((m) => [m.ioId, m]));

    expect(byIo.get("r1")?.portId).toBe("DO3");
    const aiPort = ports.find((p) => p.id === byIo.get("ai1")?.portId);
    expect(aiPort?.type).toBe("AI");
  });

  it("does not assign an already-occupied port to a different item", () => {
    const ports = getAvailablePorts(0);
    const existing: PortMapping[] = [{ ioId: "r1", portId: "DO1", device: "BRAIN" }];

    const result = computeAutoMap([io("r1", "Relay"), io("r2", "Relay")], ports, existing);
    const byIo = new Map(result.map((m) => [m.ioId, m]));

    expect(byIo.get("r2")?.portId).not.toBe("DO1");
  });

  it("passes existing mappings through to the output unchanged", () => {
    const ports = getAvailablePorts(0);
    const existing: PortMapping[] = [{ ioId: "r1", portId: "DO2", device: "BRAIN" }];

    expect(computeAutoMap([io("r1", "Relay")], ports, existing)).toContainEqual(existing[0]);
  });
});

// ---------------------------------------------------------------------------
// Items with no compatible port stay unmapped
// ---------------------------------------------------------------------------

describe("computeAutoMap — unmappable items", () => {
  it("leaves Relay-NC unmapped when no Form-C port exists", () => {
    const result = computeAutoMap(
      [io("fs1", "Relay-NC")],
      [port("DO1", "DO", false), port("DO2", "DO", false)],
      []
    );
    expect(result).toHaveLength(0);
  });

  it("leaves an item unmapped when its port type is absent", () => {
    expect(
      computeAutoMap([io("ai1", "4-20mA", "Input")], [port("DO1", "DO", false)], [])
    ).toHaveLength(0);
  });

  it("leaves the second item unmapped when only one port is available", () => {
    const result = computeAutoMap(
      [io("r1", "Relay"), io("r2", "Relay")],
      [port("DO1", "DO", false)],
      []
    );
    expect(result).toHaveLength(1);
    expect(result[0].ioId).toBe("r1");
  });
});

// ---------------------------------------------------------------------------
// Correct port types for all signal categories
// ---------------------------------------------------------------------------

describe("computeAutoMap — port-type routing", () => {
  const ports = getAvailablePorts(0);

  it.each([
    ["4-20mA Input→AI", io("ai1", "4-20mA", "Input"), "AI"],
    ["4-20mA Output→AO", io("ao1", "4-20mA", "Output"), "AO"],
    ["DryContact→DI", io("di1", "DryContact", "Input"), "DI"],
    ["TC-K→TC", io("tc1", "TC-K", "Input", "K"), "TC"],
    ["Pulse→MAG", io("mag1", "Pulse", "Input"), "MAG"],
    ["Relay→DO", io("r1", "Relay"), "DO"],
  ])("%s", (_, item, expected) => {
    const result = computeAutoMap([item], ports, []);
    expect(result).toHaveLength(1);
    const mapped = ports.find((p) => p.id === result[0].portId);
    expect(mapped?.type).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Regular Relay prefers non-Form-C; falls back to Form-C only when exhausted
// ---------------------------------------------------------------------------

describe("computeAutoMap — Relay avoids Form-C unless forced", () => {
  it("assigns Relay to non-Form-C even when Form-C is listed first", () => {
    const result = computeAutoMap(
      [io("r1", "Relay")],
      [port("DO7", "DO", true), port("DO1", "DO", false)],
      []
    );
    expect(result[0]?.portId).toBe("DO1");
  });

  it("falls back to Form-C when all non-Form-C DOs are occupied", () => {
    const existing: PortMapping[] = ["DO1", "DO2", "DO3", "DO4", "DO5", "DO6"].map((pid, i) => ({
      ioId: `x${i}`,
      portId: pid,
      device: "BRAIN" as const,
    }));

    const result = computeAutoMap([io("r1", "Relay")], getAvailablePorts(0), existing);
    const newM = result.filter((m) => m.ioId === "r1");
    expect(newM).toHaveLength(1);
    expect(getAvailablePorts(0).find((p) => p.id === newM[0].portId)?.isFormC).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No duplicate assignments
// ---------------------------------------------------------------------------

describe("computeAutoMap — no duplicates", () => {
  it("never assigns the same port to two items", () => {
    const items = [
      io("r1", "Relay"),
      io("r2", "Relay"),
      io("r3", "Relay"),
      io("fs1", "Relay-NC"),
      io("ai1", "4-20mA", "Input"),
      io("di1", "DryContact", "Input"),
    ];
    const result = computeAutoMap(items, getAvailablePorts(0), []);
    const portIds = result.map((m) => m.portId);
    expect(portIds.length).toBe(new Set(portIds).size);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("computeAutoMap — edge cases", () => {
  it("returns existing mappings when activeIO is empty", () => {
    const existing: PortMapping[] = [{ ioId: "x1", portId: "DO1", device: "BRAIN" }];
    expect(computeAutoMap([], getAvailablePorts(0), existing)).toEqual(existing);
  });

  it("returns empty array when everything is empty", () => {
    expect(computeAutoMap([], getAvailablePorts(0), [])).toEqual([]);
  });

  it("returns empty array when no ports are provided", () => {
    expect(computeAutoMap([io("r1", "Relay"), io("ai1", "4-20mA", "Input")], [], [])).toEqual([]);
  });
});
