import type { ActiveIOItem, PortType, SignalType } from "../types/io";
import type { Port, PortMapping } from "../types/port";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Maps a signal type + I/O category to the required port type.
 * This is the canonical signal→hardware compatibility table.
 */
const SIGNAL_TO_PORT_TYPE: Record<SignalType, (category: string) => PortType> = {
  "4-20mA": (cat) => (cat === "Input" ? "AI" : "AO"),
  "TC-K": () => "TC",
  "TC-J": () => "TC",
  Pulse: () => "MAG",
  DryContact: () => "DI",
  Relay: () => "DO",
  "Relay-NC": () => "DO",
};

/** Returns the port type required for a given I/O item. */
export function getRequiredPortType(item: Pick<ActiveIOItem, "signal" | "category">): PortType {
  return SIGNAL_TO_PORT_TYPE[item.signal](item.category);
}

/**
 * Checks whether an I/O item can be mapped to a port.
 * Returns { valid: true } or { valid: false, reason: "..." }.
 */
export function canMap(item: ActiveIOItem, port: Port): ValidationResult {
  const required = getRequiredPortType(item);

  if (port.type !== required) {
    return {
      valid: false,
      reason: `${item.signal} signal requires a ${required} port, not ${port.type}`,
    };
  }

  // Form-C constraint: Relay-NC (fail-safe, NC contact) can only use DO7 or DO8 on BRAIN.
  // All BRAIN+ DOs are Form-A only. Using a non-Form-C port for a fail-safe relay is a
  // panel safety defect — the NC contact won't open on power loss.
  if (item.signal === "Relay-NC" && !port.isFormC) {
    return {
      valid: false,
      reason:
        "Fail-safe (Relay-NC) requires a Form-C port. Only DO 7 and DO 8 on BRAIN provide NC contacts.",
    };
  }

  // Thermocouple type constraint: each TC channel is wired/calibrated for one
  // thermocouple type. Mapping a Type-J sensor onto a Type-K channel (or vice
  // versa) yields miscalibrated readings — a measurement-safety defect. Only
  // reject when both the item and the port carry a type and they disagree;
  // an unset type on either side stays backward-compatible.
  if (item.tcType && port.tcType && item.tcType !== port.tcType) {
    return {
      valid: false,
      reason: `Type-${item.tcType} thermocouple needs a Type-${item.tcType} channel; ${port.label} is wired for Type-${port.tcType}.`,
    };
  }

  return { valid: true };
}

/**
 * Checks whether adding a mapping would exceed port capacity.
 * Returns a warning string if over-subscribed, null otherwise.
 */
export function getCapacityWarning(items: ActiveIOItem[], availablePorts: Port[]): string | null {
  const portTypeCounts = availablePorts.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});

  const itemTypeCounts: Record<string, number> = {};
  for (const item of items) {
    const type = getRequiredPortType(item);
    itemTypeCounts[type] = (itemTypeCounts[type] ?? 0) + 1;
  }

  const overages: string[] = [];
  for (const [type, needed] of Object.entries(itemTypeCounts)) {
    const available = portTypeCounts[type] ?? 0;
    if (needed > available) {
      overages.push(`${type}: need ${needed}, have ${available}`);
    }
  }

  return overages.length > 0 ? `Port capacity exceeded: ${overages.join("; ")}` : null;
}

/** Returns active Relay-NC (fail-safe) items that have no port mapping yet. */
export function getUnmappedFailSafeRelays(
  activeIO: ActiveIOItem[],
  mappings: PortMapping[]
): ActiveIOItem[] {
  const mappedIds = new Set(mappings.map((m) => m.ioId));
  return activeIO.filter((item) => item.signal === "Relay-NC" && !mappedIds.has(item.id));
}
