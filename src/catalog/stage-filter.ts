/**
 * Pure catalog-filter utilities that derive stage / cooler-section membership
 * from a CatalogItem's tag and name — without adding fields to CatalogItem.
 *
 * Detection rules (conservative — return null when nothing matches):
 *
 * Stage inference (`inferStage`):
 *   1. Scan the item name for /\bStage\s+(\d+)\b/i or /\bStg\s+(\d+)\b/i.
 *      If a digit 1–3 is found, return it.
 *   2. Otherwise return null (item is always shown).
 *
 * Stage is intentionally NAME-only: tag numbering is not a reliable stage
 * signal (e.g. "Engine RPM" SI-202 is not a stage-2 item), so we only filter
 * on an explicit "Stage N" callout to avoid hiding non-staged signals.
 *
 * Cooler-section inference (`inferCoolerSection`):
 *   1. Name: match /Cooler\s+Section\s+(\d+)/i → return the integer.
 *   2. Otherwise return null.
 */
import type { CatalogItem } from "../types/io";

/** Pattern for explicit stage callouts in item names. */
const NAME_STAGE_RE = /\b(?:Stage|Stg)\s+(\d+)\b/i;

/** Pattern for cooler-section callouts in item names. */
const COOLER_SECTION_RE = /Cooler\s+Section\s+(\d+)/i;

/**
 * Infers the compressor stage an item belongs to (1–3), or null if not
 * stage-specific.
 *
 * Detection: an explicit "Stage N" / "Stg N" (case-insensitive) callout in the
 * item name where N is 1–3. Returns null otherwise (the item is always shown).
 * Tag numbering is deliberately NOT used — it produces false positives on
 * non-staged signals such as "Engine RPM".
 */
export function inferStage(item: Pick<CatalogItem, "tag" | "name">): number | null {
  const nameMatch = NAME_STAGE_RE.exec(item.name);
  if (nameMatch !== null) {
    const n = parseInt(nameMatch[1], 10);
    if (n >= 1 && n <= 3) {
      return n;
    }
  }

  return null;
}

/**
 * Infers the cooler section an item belongs to (1+), or null if not
 * cooler-section-specific.
 *
 * Detection rule: matches /Cooler Section (\d+)/i in the item name and
 * returns the integer value.  Returns null when nothing matches, so the item
 * is always shown.
 */
export function inferCoolerSection(item: Pick<CatalogItem, "tag" | "name">): number | null {
  const match = COOLER_SECTION_RE.exec(item.name);
  if (match !== null) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Returns the subset of `items` that are compatible with the given equipment.
 *
 * Filtering rules:
 * - If `inferStage(item)` returns a stage number **greater than**
 *   `equipment.stages`, the item is excluded.
 * - If `inferCoolerSection(item)` returns a section number **greater than**
 *   `equipment.coolerSections`, the item is excluded.
 * - Items whose inferred stage and section are both null (non-specific items)
 *   always pass through.
 * - Items whose inferred values are within equipment bounds always pass through.
 */
export function filterByEquipment<T extends Pick<CatalogItem, "tag" | "name">>(
  items: T[],
  equipment: { stages: number; coolerSections: number }
): T[] {
  return items.filter((item) => {
    const stage = inferStage(item);
    if (stage !== null && stage > equipment.stages) {
      return false;
    }

    const coolerSection = inferCoolerSection(item);
    if (coolerSection !== null && coolerSection > equipment.coolerSections) {
      return false;
    }

    return true;
  });
}
