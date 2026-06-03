/**
 * Seed catalog of available I/O items, aggregated from per-group modules under
 * `./io/`. To extend the catalog, edit the relevant group file (e.g. add a
 * pressure transmitter in `io/pressure.ts`) — no business logic changes needed.
 */
import type { CatalogItem } from "../types/io";
import { DIGITAL_INPUT_ITEMS } from "./io/digital-inputs";
import { LEVEL_FLOW_ITEMS, SPEED_ITEMS } from "./io/level-flow-speed";
import { ANALOG_OUTPUT_ITEMS, DIGITAL_OUTPUT_ITEMS } from "./io/outputs";
import { PRESSURE_ITEMS } from "./io/pressure";
import { TEMPERATURE_ITEMS } from "./io/temperature";

export const IO_CATALOG: CatalogItem[] = [
  ...PRESSURE_ITEMS,
  ...TEMPERATURE_ITEMS,
  ...LEVEL_FLOW_ITEMS,
  ...SPEED_ITEMS,
  ...DIGITAL_INPUT_ITEMS,
  ...ANALOG_OUTPUT_ITEMS,
  ...DIGITAL_OUTPUT_ITEMS,
];

/** Distinct group labels in catalog order, for the UI filter pills. */
export const CATALOG_GROUPS = [...new Set(IO_CATALOG.map((item) => item.group))];

/** Returns the items in the EMIT Recommended template. */
export function getRecommendedItems(): CatalogItem[] {
  return IO_CATALOG.filter((item) => item.inRecommended);
}

/** Returns the items in the EMIT Limited template. */
export function getLimitedItems(): CatalogItem[] {
  return IO_CATALOG.filter((item) => item.inLimited);
}
