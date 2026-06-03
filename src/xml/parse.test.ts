import { describe, expect, it } from "vitest";
import type { Configuration } from "../types/config";
import type { ActiveIOItem } from "../types/io";
import { generateXml } from "./generate";
import { parseXml } from "./parse";

function makeIO(overrides: Partial<ActiveIOItem> & Pick<ActiveIOItem, "id">): ActiveIOItem {
  return {
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
    ...overrides,
  };
}

function makeConfig(): Configuration {
  const activeIO: ActiveIOItem[] = [
    makeIO({
      id: "io-0001",
      tag: "PT-101",
      name: "Stage 1 Suction Pressure",
      category: "Input",
      signal: "4-20mA",
      range: "0-300 PSI",
      hardwareHint: "AI",
      group: "Pressure",
      notes: "Primary transmitter; calibrate yearly",
    }),
    makeIO({
      id: "io-0002",
      tag: "ESD-901",
      name: "Emergency Shutdown Relay",
      category: "Output",
      signal: "Relay-NC",
      range: "",
      hardwareHint: "DO",
      formC: true,
      group: "Safety",
      notes: "Fail-safe",
    }),
    makeIO({
      id: "io-0003",
      tag: "TT-301",
      name: "Stage 1 Discharge Temp",
      category: "Input",
      signal: "TC-K",
      range: "0-500 F",
      hardwareHint: "TC",
      tcType: "K",
      group: "Temperature",
      notes: "",
    }),
    makeIO({
      id: "io-0004",
      tag: "DO-902",
      name: "Cooler Fan Enable",
      category: "Output",
      signal: "Relay",
      range: "",
      hardwareHint: "DO",
      group: "Digital Outputs",
      notes: "",
    }),
  ];

  return {
    id: "cfg-001",
    name: "Kodiak Site 14",
    description: 'Round-trip fixture & "edge" <cases>',
    version: 2,
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
    equipment: {
      engineType: "CAT-3516",
      compressorModel: "JGC/4",
      stages: 3,
      coolerSections: 2,
    },
    hardware: { brainPlusCount: 1 },
    activeIO,
    // io-0004 is intentionally left unmapped.
    mappings: [
      { ioId: "io-0001", portId: "AI1", device: "BRAIN" },
      { ioId: "io-0002", portId: "DO7", device: "BRAIN" },
      { ioId: "io-0003", portId: "TC3", device: "BRAIN" },
    ],
  };
}

describe("parseXml — round-trip with generateXml", () => {
  it("re-generates byte-for-byte identical XML (id is carried in the XML)", () => {
    const fixture = makeConfig();
    const first = generateXml(fixture);
    const roundTripped = generateXml(parseXml(first));
    expect(roundTripped).toBe(first);
  });

  it("preserves metadata and equipment fields", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.name).toBe("Kodiak Site 14");
    expect(config.description).toBe('Round-trip fixture & "edge" <cases>');
    expect(config.version).toBe(2);
    expect(config.createdAt).toBe("2026-06-02T10:00:00.000Z");
    expect(config.updatedAt).toBe("2026-06-02T10:00:00.000Z");
    expect(config.equipment).toEqual({
      engineType: "CAT-3516",
      compressorModel: "JGC/4",
      stages: 3,
      coolerSections: 2,
    });
  });

  it("maps a single Expansion element to brainPlusCount 1", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.hardware.brainPlusCount).toBe(1);
  });

  it("clamps two Expansion elements to brainPlusCount 2", () => {
    const fixture = makeConfig();
    fixture.hardware.brainPlusCount = 2;
    const config = parseXml(generateXml(fixture));
    expect(config.hardware.brainPlusCount).toBe(2);
  });

  it("yields brainPlusCount 0 when no Expansion is present", () => {
    const fixture = makeConfig();
    fixture.hardware.brainPlusCount = 0;
    const config = parseXml(generateXml(fixture));
    expect(config.hardware.brainPlusCount).toBe(0);
  });
});

describe("parseXml — IO parsing and derivation", () => {
  it("preserves notes through the round-trip", () => {
    const config = parseXml(generateXml(makeConfig()));
    const io = config.activeIO.find((i) => i.id === "io-0001");
    expect(io?.notes).toBe("Primary transmitter; calibrate yearly");
  });

  it("derives hardwareHint from signal + category", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.activeIO.find((i) => i.id === "io-0001")?.hardwareHint).toBe("AI");
    expect(config.activeIO.find((i) => i.id === "io-0002")?.hardwareHint).toBe("DO");
    expect(config.activeIO.find((i) => i.id === "io-0003")?.hardwareHint).toBe("TC");
  });

  it("derives formC true only for Relay-NC", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.activeIO.find((i) => i.id === "io-0002")?.formC).toBe(true);
    expect(config.activeIO.find((i) => i.id === "io-0004")?.formC).toBe(false);
  });

  it("derives tcType from the signal", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.activeIO.find((i) => i.id === "io-0003")?.tcType).toBe("K");
    expect(config.activeIO.find((i) => i.id === "io-0001")?.tcType).toBeNull();
  });

  it("defaults group to an empty string (not represented in XML)", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(config.activeIO.every((i) => i.group === "")).toBe(true);
  });

  it("derives tcType J for a TC-J signal", () => {
    const fixture = makeConfig();
    fixture.activeIO = [
      makeIO({ id: "io-0001", signal: "TC-J", category: "Input", tcType: "J", hardwareHint: "TC" }),
    ];
    fixture.mappings = [];
    const config = parseXml(generateXml(fixture));
    expect(config.activeIO[0]?.tcType).toBe("J");
  });
});

describe("parseXml — mappings", () => {
  it("parses mapped items with device and stripped portId", () => {
    const config = parseXml(generateXml(makeConfig()));
    const mapping = config.mappings.find((m) => m.ioId === "io-0001");
    expect(mapping).toEqual({ ioId: "io-0001", portId: "AI1", device: "BRAIN" });
    expect(mapping?.slot).toBeUndefined();
  });

  it("keeps an unmapped item unmapped", () => {
    const config = parseXml(generateXml(makeConfig()));
    const mappedIds = new Set(config.mappings.map((m) => m.ioId));
    expect(config.activeIO.some((i) => i.id === "io-0004")).toBe(true);
    expect(mappedIds.has("io-0004")).toBe(false);
  });

  it("preserves a BRAIN+ device on a slot-stripped port", () => {
    const fixture = makeConfig();
    fixture.activeIO = [makeIO({ id: "io-0001" })];
    fixture.mappings = [{ ioId: "io-0001", portId: "AI13-P1", device: "BRAIN+", slot: "P1" }];
    const config = parseXml(generateXml(fixture));
    expect(config.mappings[0]).toEqual({ ioId: "io-0001", portId: "AI13", device: "BRAIN+" });
  });
});

describe("parseXml — error handling", () => {
  it("regenerates a fresh Configuration id (not carried in XML)", () => {
    const config = parseXml(generateXml(makeConfig()));
    expect(typeof config.id).toBe("string");
    expect(config.id).not.toBe("cfg-001");
  });

  it("throws on malformed XML", () => {
    // Mismatched open/close tags make the document invalid XML.
    expect(() => parseXml("<PanelConfiguration></Mismatched>")).toThrow(/Invalid XML/);
  });

  it("throws when the root element is not PanelConfiguration", () => {
    expect(() => parseXml('<?xml version="1.0"?><SomethingElse/>')).toThrow(
      /expected root element <PanelConfiguration>/
    );
  });

  it("throws on an unknown signal type", () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<PanelConfiguration version="1.0">',
      "  <IOList>",
      '    <IO id="io-0001" tag="X" name="X" category="Input" signal="Bogus" range="" notes=""/>',
      "  </IOList>",
      "</PanelConfiguration>",
    ].join("\n");
    expect(() => parseXml(xml)).toThrow(/unknown signal type/);
  });

  it("throws on an unknown IO category", () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<PanelConfiguration version="1.0">',
      "  <IOList>",
      '    <IO id="io-1" tag="X" name="X" category="Sideways" signal="Relay" range="" notes=""/>',
      "  </IOList>",
      "</PanelConfiguration>",
    ].join("\n");
    expect(() => parseXml(xml)).toThrow(/unknown IO category/);
  });

  it("throws on an unknown mapping device", () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<PanelConfiguration version="1.0">',
      "  <IOList>",
      '    <IO id="io-0001" tag="X" name="X" category="Input" signal="4-20mA" range="" notes=""/>',
      "  </IOList>",
      "  <Mappings>",
      '    <Mapping ioId="io-0001" port="AI1" device="ROBOT"/>',
      "  </Mappings>",
      "</PanelConfiguration>",
    ].join("\n");
    expect(() => parseXml(xml)).toThrow(/unknown mapping device/);
  });

  it("throws when a required IO attribute is missing", () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<PanelConfiguration version="1.0">',
      "  <IOList>",
      '    <IO id="io-0001" tag="X" name="X" category="Input" signal="4-20mA" range=""/>',
      "  </IOList>",
      "</PanelConfiguration>",
    ].join("\n");
    expect(() => parseXml(xml)).toThrow(/missing the "notes" attribute/);
  });
});
