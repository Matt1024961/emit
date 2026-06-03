import { describe, expect, it } from "vitest";
import type { CanTerminationConfig } from "./can-termination";
import { canNodeLabel, expectedTerminationNode, getCanTerminationWarning } from "./can-termination";

// ---------------------------------------------------------------------------
// canNodeLabel
// ---------------------------------------------------------------------------

describe("canNodeLabel", () => {
  it("labels BRAIN as 'BRAIN'", () => {
    expect(canNodeLabel("BRAIN")).toBe("BRAIN");
  });

  it("labels P1 as 'BRAIN+ (P1)'", () => {
    expect(canNodeLabel("P1")).toBe("BRAIN+ (P1)");
  });

  it("labels P2 as 'BRAIN+ (P2)'", () => {
    expect(canNodeLabel("P2")).toBe("BRAIN+ (P2)");
  });

  it("labels AFR as 'AFR module'", () => {
    expect(canNodeLabel("AFR")).toBe("AFR module");
  });
});

// ---------------------------------------------------------------------------
// expectedTerminationNode
// ---------------------------------------------------------------------------

describe("expectedTerminationNode", () => {
  it("returns BRAIN when no BRAIN+ modules and no AFR", () => {
    expect(expectedTerminationNode({ brainPlusCount: 0, hasAfr: false })).toBe("BRAIN");
  });

  it("returns P1 when one BRAIN+ module and no AFR", () => {
    expect(expectedTerminationNode({ brainPlusCount: 1, hasAfr: false })).toBe("P1");
  });

  it("returns P2 when two BRAIN+ modules and no AFR", () => {
    expect(expectedTerminationNode({ brainPlusCount: 2, hasAfr: false })).toBe("P2");
  });

  it("returns AFR when hasAfr is true regardless of BRAIN+ count", () => {
    expect(expectedTerminationNode({ brainPlusCount: 0, hasAfr: true })).toBe("AFR");
    expect(expectedTerminationNode({ brainPlusCount: 1, hasAfr: true })).toBe("AFR");
    expect(expectedTerminationNode({ brainPlusCount: 2, hasAfr: true })).toBe("AFR");
  });
});

// ---------------------------------------------------------------------------
// getCanTerminationWarning — correct (no warning) cases
// ---------------------------------------------------------------------------

describe("getCanTerminationWarning — correct placement", () => {
  it("returns null for BRAIN-only terminated at BRAIN", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 0,
      hasAfr: false,
      terminationAt: "BRAIN",
    };
    expect(getCanTerminationWarning(config)).toBeNull();
  });

  it("returns null for one BRAIN+ terminated at P1", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 1,
      hasAfr: false,
      terminationAt: "P1",
    };
    expect(getCanTerminationWarning(config)).toBeNull();
  });

  it("returns null for two BRAIN+ terminated at P2", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: false,
      terminationAt: "P2",
    };
    expect(getCanTerminationWarning(config)).toBeNull();
  });

  it("returns null when AFR is present and terminator is on AFR", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 0,
      hasAfr: true,
      terminationAt: "AFR",
    };
    expect(getCanTerminationWarning(config)).toBeNull();
  });

  it("returns null for two BRAIN+ with AFR terminated at AFR", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: true,
      terminationAt: "AFR",
    };
    expect(getCanTerminationWarning(config)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getCanTerminationWarning — mismatch (terminator on wrong node)
// ---------------------------------------------------------------------------

describe("getCanTerminationWarning — wrong node (terminator installed but misplaced)", () => {
  it("warns when one BRAIN+ is present but terminator is on BRAIN", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 1,
      hasAfr: false,
      terminationAt: "BRAIN",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN");
    expect(warning).toContain("BRAIN+ (P1)");
    expect(warning).toContain("120 Ω");
  });

  it("warns when two BRAIN+ are present but terminator is on BRAIN", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: false,
      terminationAt: "BRAIN",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN+ (P2)");
  });

  it("warns when two BRAIN+ are present but terminator is on P1", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: false,
      terminationAt: "P1",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN+ (P1)");
    expect(warning).toContain("BRAIN+ (P2)");
  });

  it("warns when AFR is present but terminator is on P2", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: true,
      terminationAt: "P2",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN+ (P2)");
    expect(warning).toContain("AFR module");
  });
});

// ---------------------------------------------------------------------------
// getCanTerminationWarning — not-installed node
// ---------------------------------------------------------------------------

describe("getCanTerminationWarning — node not installed", () => {
  it("warns when terminator is on P2 but only one BRAIN+ is installed", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 1,
      hasAfr: false,
      terminationAt: "P2",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN+ (P2)");
    expect(warning).toContain("not installed");
  });

  it("warns when terminator is on P2 but no BRAIN+ is installed", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 0,
      hasAfr: false,
      terminationAt: "P2",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("not installed");
  });

  it("warns when terminator is on P1 but no BRAIN+ is installed", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 0,
      hasAfr: false,
      terminationAt: "P1",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("BRAIN+ (P1)");
    expect(warning).toContain("not installed");
  });

  it("warns when terminator is on AFR but hasAfr is false", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 0,
      hasAfr: false,
      terminationAt: "AFR",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("AFR module");
    expect(warning).toContain("not installed");
  });

  it("warns when terminator is on AFR with BRAIN+ present but hasAfr is false", () => {
    const config: CanTerminationConfig = {
      brainPlusCount: 2,
      hasAfr: false,
      terminationAt: "AFR",
    };
    const warning = getCanTerminationWarning(config);
    expect(warning).not.toBeNull();
    expect(warning).toContain("AFR module");
    expect(warning).toContain("not installed");
  });
});
