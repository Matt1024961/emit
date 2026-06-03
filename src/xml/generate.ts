import type { Configuration } from "../types/config";
import type { ActiveIOItem, PortType } from "../types/io";

/** Mapping sort order matches the sample XML files. */
const MAPPING_ORDER: PortType[] = ["AI", "AO", "DI", "DO", "TC", "MAG"];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlAttr(name: string, value: string): string {
  return `${name}="${escapeXml(value)}"`;
}

/**
 * Generates deterministic XML matching the PanelConfiguration schema.
 * Same input configuration always produces the same byte sequence.
 */
export function generateXml(
  config: Configuration,
  author = "panelconfig@emittechnologies.com"
): string {
  const { equipment, hardware, activeIO, mappings } = config;

  // Build IO id lookup
  const ioById = new Map<string, ActiveIOItem>(activeIO.map((item) => [item.id, item]));

  // Separate mapped and unmapped items
  const mappedIoIds = new Set(mappings.map((m) => m.ioId));
  const unmappedItems = activeIO.filter((item) => !mappedIoIds.has(item.id));

  // Sort mappings by port type priority, then by portId lexicographically
  const sortedMappings = [...mappings].sort((a, b) => {
    const portA = a.portId.replace(/-P[12]$/, "");
    const portB = b.portId.replace(/-P[12]$/, "");

    const typeA = getPortTypeFromId(portA);
    const typeB = getPortTypeFromId(portB);

    const orderDiff = MAPPING_ORDER.indexOf(typeA) - MAPPING_ORDER.indexOf(typeB);
    if (orderDiff !== 0) return orderDiff;

    return portA.localeCompare(portB, undefined, { numeric: true });
  });

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<PanelConfiguration version="1.0">`);

  // Metadata
  lines.push(`  <Metadata>`);
  lines.push(`    <ConfigName>${escapeXml(config.name)}</ConfigName>`);
  lines.push(`    <Description>${escapeXml(config.description)}</Description>`);
  lines.push(`    <Version>${config.version}</Version>`);
  lines.push(`    <CreatedUtc>${config.createdAt}</CreatedUtc>`);
  lines.push(`    <CreatedBy>${escapeXml(author)}</CreatedBy>`);
  lines.push(`  </Metadata>`);

  // Equipment
  lines.push(`  <Equipment>`);
  lines.push(`    <EngineType>${escapeXml(equipment.engineType)}</EngineType>`);
  lines.push(`    <CompressorModel>${escapeXml(equipment.compressorModel)}</CompressorModel>`);
  lines.push(`    <CompressorStages>${equipment.stages}</CompressorStages>`);
  lines.push(`    <CoolerSections>${equipment.coolerSections}</CoolerSections>`);
  lines.push(`  </Equipment>`);

  // Hardware
  lines.push(`  <Hardware>`);
  lines.push(`    <Controller ${xmlAttr("type", "BRAIN")} ${xmlAttr("partNumber", "20320")}/>`);
  if (hardware.brainPlusCount >= 1) {
    lines.push(
      `    <Expansion ${xmlAttr("slot", "P1")} ${xmlAttr("type", "BRAIN+")} ${xmlAttr("partNumber", "20330")}/>`
    );
  }
  if (hardware.brainPlusCount >= 2) {
    lines.push(
      `    <Expansion ${xmlAttr("slot", "P2")} ${xmlAttr("type", "BRAIN+")} ${xmlAttr("partNumber", "20330")}/>`
    );
  }
  lines.push(`  </Hardware>`);

  // IOList
  lines.push(`  <IOList>`);
  for (const item of activeIO) {
    lines.push(
      `    <IO ${xmlAttr("id", item.id)} ${xmlAttr("tag", item.tag)} ${xmlAttr("name", item.name)} ${xmlAttr("category", item.category)} ${xmlAttr("signal", item.signal)} ${xmlAttr("range", item.range)} ${xmlAttr("notes", item.notes)}/>`
    );
  }
  lines.push(`  </IOList>`);

  // Mappings
  lines.push(`  <Mappings>`);
  for (const mapping of sortedMappings) {
    const item = ioById.get(mapping.ioId);
    if (!item) continue;

    const portId = mapping.portId.replace(/-P[12]$/, ""); // strip slot suffix for XML
    const device = mapping.device;

    lines.push(
      `    <Mapping ${xmlAttr("ioId", mapping.ioId)} ${xmlAttr("port", portId)} ${xmlAttr("device", device)}/>`
    );
  }
  lines.push(`  </Mappings>`);

  // UnmappedIO
  if (unmappedItems.length === 0) {
    lines.push(`  <UnmappedIO/>`);
  } else {
    lines.push(`  <UnmappedIO>`);
    for (const item of unmappedItems) {
      lines.push(`    <IO ${xmlAttr("id", item.id)} ${xmlAttr("tag", item.tag)}/>`);
    }
    lines.push(`  </UnmappedIO>`);
  }

  lines.push(`</PanelConfiguration>`);
  return lines.join("\n");
}

/** Infers port type from a port id string like "AI1", "DO7", "TC3", "MAG". */
function getPortTypeFromId(portId: string): PortType {
  if (portId.startsWith("AI")) return "AI";
  if (portId.startsWith("AO")) return "AO";
  if (portId.startsWith("DI")) return "DI";
  if (portId.startsWith("DO")) return "DO";
  if (portId.startsWith("TC")) return "TC";
  if (portId === "MAG") return "MAG";
  return "DI"; // fallback
}

/**
 * Triggers a browser file download of the XML.
 */
export function downloadXml(config: Configuration): void {
  const xml = generateXml(config);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.name.replace(/[^a-z0-9]/gi, "-")}-v${config.version}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
