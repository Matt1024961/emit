import type { ActiveIOItem } from "../types/io";
import type { Port, PortMapping } from "../types/port";
import { canMap, getRequiredPortType } from "../validation/rules";
import { orderPortsByFormCPreference } from "./default-mappings";

/**
 * Deterministically assigns unmapped I/O items to compatible ports.
 *
 * Fail-safe (Relay-NC) items are placed on Form-C ports (DO7/DO8) FIRST so a
 * regular Relay cannot steal them. The algorithm runs in two passes:
 *
 *   Pass 1 — Fail-safe first: each unmapped Relay-NC item (in activeIO order)
 *   is assigned to the first free Form-C port in port order, confirmed by
 *   `canMap`.
 *
 *   Pass 2 — Everything else: each remaining unmapped item (in activeIO order)
 *   is assigned to the first free compatible non-Form-C port. Only if no
 *   non-Form-C compatible port remains does the algorithm fall back to a
 *   Form-C port.
 *
 * Items with no available compatible port are left unmapped. Existing mappings
 * are preserved; no port or item is double-assigned.
 *
 * @param activeIO - All active I/O items in the current session.
 * @param availablePorts - All hardware ports for the configured BRAIN / BRAIN+ setup.
 * @param existingMappings - Mappings that must be preserved and not reassigned.
 * @returns The full mapping list: existing mappings plus any newly computed ones.
 */
export function computeAutoMap(
  activeIO: ActiveIOItem[],
  availablePorts: Port[],
  existingMappings: PortMapping[]
): PortMapping[] {
  const occupiedPortIds = new Set<string>(existingMappings.map((m) => m.portId));
  const mappedIoIds = new Set<string>(existingMappings.map((m) => m.ioId));
  const newMappings: PortMapping[] = [...existingMappings];

  /**
   * Assigns a single item to the first free port in `candidates` that passes
   * `canMap`. Mutates `occupiedPortIds`, `mappedIoIds`, and `newMappings`.
   */
  function tryAssign(item: ActiveIOItem, candidates: Port[]): boolean {
    for (const port of candidates) {
      if (occupiedPortIds.has(port.id)) continue;
      if (!canMap(item, port).valid) continue;

      occupiedPortIds.add(port.id);
      mappedIoIds.add(item.id);
      newMappings.push({
        ioId: item.id,
        portId: port.id,
        device: port.device,
        slot: port.slot,
      });
      return true;
    }
    return false;
  }

  // Pre-compute the required port type for each item and bucket ports by type.
  // Building the buckets once avoids repeated full-array scans.
  const portsByType = new Map<string, Port[]>();
  for (const port of availablePorts) {
    const bucket = portsByType.get(port.type);
    if (bucket) {
      bucket.push(port);
    } else {
      portsByType.set(port.type, [port]);
    }
  }

  // Pass 1 — Fail-safe (Relay-NC) items: must go to Form-C ports only.
  // Iterate in activeIO order for determinism.
  const formCPorts = (portsByType.get("DO") ?? []).filter((p) => p.isFormC);

  for (const item of activeIO) {
    if (mappedIoIds.has(item.id)) continue;
    if (item.signal !== "Relay-NC") continue;

    tryAssign(item, formCPorts);
  }

  // Pass 2 — All remaining unmapped items: prefer non-Form-C ports; fall back
  // to Form-C only when no non-Form-C compatible port is left.
  for (const item of activeIO) {
    if (mappedIoIds.has(item.id)) continue;

    const requiredType = getRequiredPortType(item);
    const candidates = portsByType.get(requiredType) ?? [];

    // Order: non-Form-C first, Form-C last (helper is pure / non-mutating).
    const ordered = orderPortsByFormCPreference(candidates);
    tryAssign(item, ordered);
  }

  return newMappings;
}
