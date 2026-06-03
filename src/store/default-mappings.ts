import type { Port } from "../types/port";

/**
 * Orders candidate ports so that non-Form-C ports come before Form-C ports
 * within the same type bucket.
 *
 * The stable sort preserves the original port order within each tier, which
 * keeps auto-map deterministic across repeated calls.
 *
 * @param ports - The ports to order (typically all ports of a single type).
 * @returns A new array with non-Form-C ports first, Form-C ports last.
 */
export function orderPortsByFormCPreference(ports: Port[]): Port[] {
  const nonFormC = ports.filter((p) => !p.isFormC);
  const formC = ports.filter((p) => p.isFormC);
  return [...nonFormC, ...formC];
}
