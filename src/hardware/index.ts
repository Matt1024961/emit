import type { PortType } from "../types/io";
import type { Port } from "../types/port";
import { BRAIN_PORTS } from "./brain";
import { BRAIN_PLUS_P1_PORTS, BRAIN_PLUS_P2_PORTS } from "./brain-plus";

export { BRAIN_PLUS_P1_PORTS, BRAIN_PLUS_P2_PORTS, BRAIN_PORTS };

/**
 * Returns all user-assignable ports given the hardware configuration.
 * BRAIN+ ports are only included when the corresponding module is present.
 */
export function getAvailablePorts(brainPlusCount: 0 | 1 | 2): Port[] {
  const ports: Port[] = [...BRAIN_PORTS];
  if (brainPlusCount >= 1) ports.push(...BRAIN_PLUS_P1_PORTS);
  if (brainPlusCount >= 2) ports.push(...BRAIN_PLUS_P2_PORTS);
  return ports;
}

/** Returns ports of a specific type from the available pool. */
export function getPortsByType(brainPlusCount: 0 | 1 | 2, type: PortType): Port[] {
  return getAvailablePorts(brainPlusCount).filter((p) => p.type === type);
}

/** Port type display labels and color keys for UI rendering. */
export const PORT_TYPE_LABELS: Record<PortType, string> = {
  AI: "Analog In",
  AO: "Analog Out",
  DI: "Digital In",
  DO: "Digital Out",
  TC: "Thermocouple",
  MAG: "Mag Pickup",
};

export const PORT_TYPE_COLORS: Record<PortType, string> = {
  AI: "blue",
  AO: "green",
  DI: "orange",
  DO: "purple",
  TC: "yellow",
  MAG: "cyan",
};
