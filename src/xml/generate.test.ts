import { describe, expect, it, vi } from "vitest";
import type { Configuration } from "../types/config";
import { downloadXml, generateXml } from "./generate";

function makeConfig(overrides: Partial<Configuration> = {}): Configuration {
  return {
    id: "cfg-001",
    name: "Test Config",
    description: "",
    version: 1,
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
    equipment: {
      engineType: "CAT-3516",
      compressorModel: "JGC/4",
      stages: 3,
      coolerSections: 2,
    },
    hardware: { brainPlusCount: 0 },
    activeIO: [],
    mappings: [],
    ...overrides,
  };
}

describe("generateXml — structure", () => {
  it("starts with XML declaration", () => {
    const xml = generateXml(makeConfig());
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
  });

  it("includes PanelConfiguration root element", () => {
    const xml = generateXml(makeConfig());
    expect(xml).toContain('<PanelConfiguration version="1.0">');
    expect(xml).toContain("</PanelConfiguration>");
  });

  it("includes Metadata block with config name", () => {
    const xml = generateXml(makeConfig({ name: "Kodiak Site 14" }));
    expect(xml).toContain("<ConfigName>Kodiak Site 14</ConfigName>");
  });

  it("writes the notes attribute from the I/O item (not always empty)", () => {
    const xml = generateXml(
      makeConfig({
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
            notes: "Calibrate before startup",
          },
        ],
      })
    );
    expect(xml).toContain('notes="Calibrate before startup"');
  });

  it("includes Equipment block", () => {
    const xml = generateXml(makeConfig());
    expect(xml).toContain("<EngineType>CAT-3516</EngineType>");
    expect(xml).toContain("<CompressorModel>JGC/4</CompressorModel>");
    expect(xml).toContain("<CompressorStages>3</CompressorStages>");
    expect(xml).toContain("<CoolerSections>2</CoolerSections>");
  });

  it("includes BRAIN controller in Hardware", () => {
    const xml = generateXml(makeConfig());
    expect(xml).toContain('type="BRAIN"');
    expect(xml).toContain('partNumber="20320"');
  });

  it("does NOT include BRAIN+ when brainPlusCount is 0", () => {
    const xml = generateXml(makeConfig({ hardware: { brainPlusCount: 0 } }));
    expect(xml).not.toContain("BRAIN+");
  });

  it("includes one BRAIN+ expansion when brainPlusCount is 1", () => {
    const xml = generateXml(makeConfig({ hardware: { brainPlusCount: 1 } }));
    expect(xml).toContain('type="BRAIN+"');
    expect(xml).toContain('slot="P1"');
    expect(xml).not.toContain('slot="P2"');
  });

  it("includes two BRAIN+ expansions when brainPlusCount is 2", () => {
    const xml = generateXml(makeConfig({ hardware: { brainPlusCount: 2 } }));
    const p1Count = (xml.match(/slot="P1"/g) ?? []).length;
    const p2Count = (xml.match(/slot="P2"/g) ?? []).length;
    expect(p1Count).toBe(1);
    expect(p2Count).toBe(1);
  });

  it("produces empty UnmappedIO self-closing tag when all items are mapped", () => {
    const activeIO = [
      {
        id: "io-0001",
        tag: "PT-101",
        name: "Stage 1 Suction Pressure",
        category: "Input" as const,
        signal: "4-20mA" as const,
        range: "0-300 PSI",
        hardwareHint: "AI" as const,
        formC: false,
        tcType: null,
        group: "Pressure",
        notes: "",
      },
    ];
    const mappings = [{ ioId: "io-0001", portId: "AI1", device: "BRAIN" as const }];
    const xml = generateXml(makeConfig({ activeIO, mappings }));
    expect(xml).toContain("<UnmappedIO/>");
    expect(xml).not.toContain("<UnmappedIO>");
  });

  it("lists unmapped items in UnmappedIO", () => {
    const activeIO = [
      {
        id: "io-0001",
        tag: "PT-101",
        name: "Stage 1 Suction Pressure",
        category: "Input" as const,
        signal: "4-20mA" as const,
        range: "0-300 PSI",
        hardwareHint: "AI" as const,
        formC: false,
        tcType: null,
        group: "Pressure",
        notes: "",
      },
    ];
    const xml = generateXml(makeConfig({ activeIO, mappings: [] }));
    expect(xml).toContain("<UnmappedIO>");
    expect(xml).toContain('tag="PT-101"');
  });
});

describe("generateXml — mapping sort order", () => {
  it("orders mappings AI → AO → DI → DO → TC → MAG", () => {
    const activeIO = [
      {
        id: "io-0001",
        tag: "DO-901",
        name: "Ignition Enable",
        category: "Output" as const,
        signal: "Relay" as const,
        range: "",
        hardwareHint: "DO" as const,
        formC: false,
        tcType: null,
        group: "Digital Outputs",
        notes: "",
      },
      {
        id: "io-0002",
        tag: "PT-101",
        name: "Stage 1 Suction Pressure",
        category: "Input" as const,
        signal: "4-20mA" as const,
        range: "0-300 PSI",
        hardwareHint: "AI" as const,
        formC: false,
        tcType: null,
        group: "Pressure",
        notes: "",
      },
      {
        id: "io-0003",
        tag: "ST-201",
        name: "Engine RPM",
        category: "Input" as const,
        signal: "Pulse" as const,
        range: "",
        hardwareHint: "MAG" as const,
        formC: false,
        tcType: null,
        group: "Speed",
        notes: "",
      },
    ];
    const mappings = [
      { ioId: "io-0001", portId: "DO1", device: "BRAIN" as const },
      { ioId: "io-0002", portId: "AI1", device: "BRAIN" as const },
      { ioId: "io-0003", portId: "MAG", device: "BRAIN" as const },
    ];
    const xml = generateXml(makeConfig({ activeIO, mappings }));

    const aiIdx = xml.indexOf('port="AI1"');
    const doIdx = xml.indexOf('port="DO1"');
    const magIdx = xml.indexOf('port="MAG"');

    expect(aiIdx).toBeLessThan(doIdx);
    expect(doIdx).toBeLessThan(magIdx);
  });
});

describe("generateXml — XML escaping", () => {
  it("escapes special characters in config name", () => {
    const xml = generateXml(makeConfig({ name: 'Kodiak & "Site" <14>' }));
    expect(xml).toContain("Kodiak &amp; &quot;Site&quot; &lt;14&gt;");
    expect(xml).not.toContain('Kodiak & "Site" <14>');
  });
});

describe("generateXml — determinism", () => {
  it("produces identical output on two calls with same input", () => {
    const config = makeConfig({ name: "Determinism Test" });
    expect(generateXml(config)).toBe(generateXml(config));
  });
});

describe("downloadXml", () => {
  it("creates a Blob URL and triggers a sanitized .xml download", () => {
    const createUrl = vi.fn(() => "blob:fake");
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createUrl, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeUrl, configurable: true });

    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === "a") el.click = click;
      return el;
    });

    downloadXml(makeConfig({ name: "Kodiak Site 14 / JGC4", version: 2 }));

    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeUrl).toHaveBeenCalledTimes(1);

    createSpy.mockRestore();
  });
});
