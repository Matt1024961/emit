/**
 * CAN-bus termination validation.
 *
 * The CAN bus is a daisy chain that requires a single 120 Ω terminator on the
 * LAST physical node. Node order on the bus:
 *   BRAIN → BRAIN+ P1 → BRAIN+ P2 → AFR
 *
 * This module provides pure functions to determine the correct node and warn
 * when the installer has placed the terminator incorrectly.
 */

/** Physical node identifiers on the CAN bus. */
export type CanNode = "BRAIN" | "P1" | "P2" | "AFR";

/** Describes which CAN-capable hardware is present and where the terminator is placed. */
export interface CanTerminationConfig {
  brainPlusCount: 0 | 1 | 2;
  hasAfr: boolean;
  /** Where the installer has placed the 120 Ω terminator. */
  terminationAt: CanNode;
}

/** Human label for a CAN node. */
export function canNodeLabel(node: CanNode): string {
  switch (node) {
    case "BRAIN":
      return "BRAIN";
    case "P1":
      return "BRAIN+ (P1)";
    case "P2":
      return "BRAIN+ (P2)";
    case "AFR":
      return "AFR module";
  }
}

/**
 * Returns the node that SHOULD carry the terminator — the last node on the bus.
 * Precedence (highest wins): AFR → P2 → P1 → BRAIN.
 */
export function expectedTerminationNode(
  config: Pick<CanTerminationConfig, "brainPlusCount" | "hasAfr">
): CanNode {
  if (config.hasAfr) {
    return "AFR";
  }
  if (config.brainPlusCount === 2) {
    return "P2";
  }
  if (config.brainPlusCount === 1) {
    return "P1";
  }
  return "BRAIN";
}

/**
 * Returns a human-readable warning if the CAN termination is wrong, else null.
 *
 * Two failure modes:
 * 1. The terminator is placed on a node that is not installed in this config.
 * 2. The terminator is installed but not on the last node of the bus.
 */
export function getCanTerminationWarning(config: CanTerminationConfig): string | null {
  const { brainPlusCount, hasAfr, terminationAt } = config;

  const isInstalled =
    terminationAt === "BRAIN" ||
    (terminationAt === "P1" && brainPlusCount >= 1) ||
    (terminationAt === "P2" && brainPlusCount === 2) ||
    (terminationAt === "AFR" && hasAfr);

  if (!isInstalled) {
    return (
      `CAN termination is set on the ${canNodeLabel(terminationAt)}, ` +
      `which is not installed in this configuration.`
    );
  }

  const expected = expectedTerminationNode(config);

  if (terminationAt !== expected) {
    return (
      `CAN termination is on the ${canNodeLabel(terminationAt)}, ` +
      `but the bus ends at the ${canNodeLabel(expected)}. ` +
      `Move the 120 Ω terminator to the ${canNodeLabel(expected)}.`
    );
  }

  return null;
}
