import { describe, expect, it } from "vitest";
import type { Port } from "../types/port";
import { orderPortsByFormCPreference } from "./default-mappings";

/** Minimal Port fixture — only the fields the helper inspects. */
function makePort(id: string, isFormC: boolean): Port {
  return {
    id,
    device: "BRAIN",
    type: "DO",
    label: id,
    pinNumbers: [1],
    isFormC,
  };
}

describe("orderPortsByFormCPreference", () => {
  it("places non-Form-C ports before Form-C ports", () => {
    const ports: Port[] = [
      makePort("DO7", true),
      makePort("DO1", false),
      makePort("DO8", true),
      makePort("DO2", false),
    ];

    const result = orderPortsByFormCPreference(ports);

    expect(result.map((p) => p.id)).toEqual(["DO1", "DO2", "DO7", "DO8"]);
  });

  it("preserves original order within each tier", () => {
    const ports: Port[] = [
      makePort("DO3", false),
      makePort("DO1", false),
      makePort("DO8", true),
      makePort("DO7", true),
    ];

    const result = orderPortsByFormCPreference(ports);

    // non-Form-C in original order, Form-C in original order
    expect(result.map((p) => p.id)).toEqual(["DO3", "DO1", "DO8", "DO7"]);
  });

  it("returns all ports unchanged when none are Form-C", () => {
    const ports: Port[] = [makePort("DO1", false), makePort("DO2", false), makePort("DO3", false)];

    const result = orderPortsByFormCPreference(ports);

    expect(result).toEqual(ports);
  });

  it("returns all ports unchanged when all are Form-C", () => {
    const ports: Port[] = [makePort("DO7", true), makePort("DO8", true)];

    const result = orderPortsByFormCPreference(ports);

    expect(result).toEqual(ports);
  });

  it("returns an empty array for empty input", () => {
    expect(orderPortsByFormCPreference([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const ports: Port[] = [makePort("DO7", true), makePort("DO1", false)];
    const copy = [...ports];

    orderPortsByFormCPreference(ports);

    expect(ports).toEqual(copy);
  });
});
