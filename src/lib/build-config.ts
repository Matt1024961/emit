import type { Configuration, Equipment, HardwareConfig } from "@/types/config";
import type { ActiveIOItem } from "@/types/io";
import type { PortMapping } from "@/types/port";

/** The live wizard fields needed to assemble a saved/exported configuration. */
export interface ConfigDraft {
  configId: string;
  configName: string;
  configDescription: string;
  equipment: Equipment;
  hardware: HardwareConfig;
  activeIO: ActiveIOItem[];
  mappings: PortMapping[];
}

/**
 * Builds a complete Configuration snapshot from the current wizard draft.
 * Centralizes the "Untitled Configuration" fallback and the timestamp/version
 * stamping so the save, export, and preview paths stay identical.
 */
export function buildConfiguration(draft: ConfigDraft, now: string, version = 1): Configuration {
  return {
    id: draft.configId,
    name: draft.configName || "Untitled Configuration",
    description: draft.configDescription,
    version,
    createdAt: now,
    updatedAt: now,
    equipment: draft.equipment,
    hardware: draft.hardware,
    activeIO: draft.activeIO,
    mappings: draft.mappings,
  };
}
