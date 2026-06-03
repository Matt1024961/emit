import type { Configuration } from "../types/config";
import type { ActiveIOItem, IOCategory, SignalType } from "../types/io";
import type { HardwareDevice, PortMapping } from "../types/port";
import { getRequiredPortType } from "../validation/rules";

const VALID_CATEGORIES: readonly IOCategory[] = ["Input", "Output"];
const VALID_SIGNALS: readonly SignalType[] = [
  "4-20mA",
  "TC-K",
  "TC-J",
  "Pulse",
  "DryContact",
  "Relay",
  "Relay-NC",
];
const VALID_DEVICES: readonly HardwareDevice[] = ["BRAIN", "BRAIN+"];

/** Validates a raw string against the known {@link IOCategory} set; throws on unknown values. */
function toCategory(value: string): IOCategory {
  if ((VALID_CATEGORIES as readonly string[]).includes(value)) {
    return value as IOCategory;
  }
  throw new Error(`Invalid XML: unknown IO category "${value}"`);
}

/** Validates a raw string against the known {@link SignalType} set; throws on unknown values. */
function toSignal(value: string): SignalType {
  if ((VALID_SIGNALS as readonly string[]).includes(value)) {
    return value as SignalType;
  }
  throw new Error(`Invalid XML: unknown signal type "${value}"`);
}

/** Validates a string against the known {@link HardwareDevice} set; throws on unknown values. */
function toDevice(value: string): HardwareDevice {
  if ((VALID_DEVICES as readonly string[]).includes(value)) {
    return value as HardwareDevice;
  }
  throw new Error(`Invalid XML: unknown mapping device "${value}"`);
}

/** Returns the first descendant element with the given (case-sensitive) tag name, or null. */
function firstByTag(parent: Element | Document, tag: string): Element | null {
  return parent.getElementsByTagName(tag).item(0);
}

/** Returns the trimmed text content of the first matching descendant element, or "" when absent. */
function textOf(parent: Element | Document, tag: string): string {
  return firstByTag(parent, tag)?.textContent?.trim() ?? "";
}

/** Reads a required attribute off an element; throws when it is missing. */
function attr(el: Element, name: string): string {
  const value = el.getAttribute(name);
  if (value === null) {
    throw new Error(`Invalid XML: <${el.tagName}> is missing the "${name}" attribute`);
  }
  return value;
}

/** Maps the count of <Expansion> elements to a clamped brainPlusCount (0 | 1 | 2). */
function toBrainPlusCount(count: number): 0 | 1 | 2 {
  if (count >= 2) return 2;
  if (count === 1) return 1;
  return 0;
}

/**
 * Parses a single <IO> element into an {@link ActiveIOItem}. The XML only carries
 * `id, tag, name, category, signal, range, notes`; the remaining fields are derived:
 * `hardwareHint` via {@link getRequiredPortType}, `formC` from a Relay-NC signal,
 * `tcType` from a TC-K/TC-J signal, and `group` defaults to "" (not represented in XML).
 */
function parseIO(el: Element): ActiveIOItem {
  const category = toCategory(attr(el, "category"));
  const signal = toSignal(attr(el, "signal"));

  return {
    id: attr(el, "id"),
    tag: attr(el, "tag"),
    name: attr(el, "name"),
    category,
    signal,
    range: attr(el, "range"),
    notes: attr(el, "notes"),
    hardwareHint: getRequiredPortType({ signal, category }),
    formC: signal === "Relay-NC",
    tcType: signal === "TC-K" ? "K" : signal === "TC-J" ? "J" : null,
    group: "",
  };
}

/**
 * Parses a single <Mapping> element into a {@link PortMapping}. The XML strips the
 * BRAIN+ slot suffix from `port`, so `portId` is taken verbatim and `slot` is left undefined.
 */
function parseMapping(el: Element): PortMapping {
  return {
    ioId: attr(el, "ioId"),
    portId: attr(el, "port"),
    device: toDevice(attr(el, "device")),
  };
}

/** Returns the direct <IO> children of <IOList>, or [] when the list is absent. */
function readIOList(doc: Document): ActiveIOItem[] {
  const list = firstByTag(doc, "IOList");
  if (!list) return [];
  return Array.from(list.getElementsByTagName("IO")).map(parseIO);
}

/** Returns the <Mapping> children of <Mappings>, or [] when the block is absent. */
function readMappings(doc: Document): PortMapping[] {
  const block = firstByTag(doc, "Mappings");
  if (!block) return [];
  return Array.from(block.getElementsByTagName("Mapping")).map(parseMapping);
}

/**
 * Parses PanelConfiguration XML (as produced by {@link generateXml}) back into a Configuration.
 * Throws on malformed input (parser errors, a non-PanelConfiguration root, missing required
 * attributes, or unknown category/signal/device values).
 *
 * Derived/regenerated fields: each IO item's `group` is "" and its `hardwareHint`/`formC`/`tcType`
 * are derived from the signal+category, because the XML does not carry them. The Configuration
 * `id` is freshly generated with `crypto.randomUUID()` (the XML metadata has no id), and
 * `updatedAt` is set equal to `createdAt`.
 */
export function parseXml(xml: string): Configuration {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  const parseError = firstByTag(doc, "parsererror");
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent?.trim() ?? "could not be parsed"}`);
  }

  const root = doc.documentElement;
  if (root.tagName !== "PanelConfiguration") {
    throw new Error(
      `Invalid XML: expected root element <PanelConfiguration>, got <${root.tagName}>`
    );
  }

  const createdAt = textOf(doc, "CreatedUtc");
  const expansionCount = doc.getElementsByTagName("Expansion").length;

  return {
    id: crypto.randomUUID(),
    name: textOf(doc, "ConfigName"),
    description: textOf(doc, "Description"),
    version: Number(textOf(doc, "Version")),
    createdAt,
    updatedAt: createdAt,
    equipment: {
      engineType: textOf(doc, "EngineType"),
      compressorModel: textOf(doc, "CompressorModel"),
      stages: Number(textOf(doc, "CompressorStages")),
      coolerSections: Number(textOf(doc, "CoolerSections")),
    },
    hardware: {
      brainPlusCount: toBrainPlusCount(expansionCount),
    },
    activeIO: readIOList(doc),
    mappings: readMappings(doc),
  };
}
