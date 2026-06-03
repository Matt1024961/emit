/**
 * "Kodiak Site 14" one-click demo configuration.
 *
 * Uses the EMIT Recommended I/O template on a JGC/4 compressor driven by a
 * CAT-3516 engine — a common field configuration that exercises the full wizard
 * including Form-C fail-safe relay mapping on DO7/DO8.
 */

import type { Equipment, HardwareConfig } from "../types/config";
import type { CatalogItem } from "../types/io";
import { getRecommendedItems } from "./io-catalog";

/** Shape of the one-click demo descriptor used by the Load Sample button. */
export interface SampleConfig {
  name: string;
  description: string;
  equipment: Equipment;
  hardware: HardwareConfig;
  /** Full active I/O item list for the panel. */
  items: CatalogItem[];
}

// The Recommended template already contains DO-904 (Relay-NC Shutdown Relay).
const recommendedItems: CatalogItem[] = getRecommendedItems();

/** The Kodiak Site 14 (JGC/4 Recommended) sample panel — a complete, realistic config for one-click demo loading. */
export const SAMPLE_KODIAK: SampleConfig = {
  name: "Kodiak Site 14 — JGC/4 Recommended",
  description:
    "Two-stage Ariel JGC/4 compressor on a CAT-3516 engine. " +
    "Full EMIT Recommended I/O set, including Form-C fail-safe shutdown relay.",
  equipment: {
    // "JGC/4" is a valid model in COMPRESSOR_MODEL_GROUPS (JG/JGC Series).
    compressorModel: "JGC/4",
    // "CAT-3516" is a valid entry in ENGINE_TYPES.
    engineType: "CAT-3516",
    // Two stages — keeps all Stage-1 and Stage-2 items visible; avoids
    // filtering out Stage-3 items that don't exist in this template anyway.
    stages: 2,
    // One cooler section — typical for a two-stage JGC/4.
    coolerSections: 1,
  },
  hardware: {
    // One BRAIN+ expander shows the extended-port mapping UI in the demo.
    brainPlusCount: 1,
  },
  items: recommendedItems,
};
