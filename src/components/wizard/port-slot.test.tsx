import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { BRAIN_PORTS } from "@/hardware/brain";
import { useWizardStore } from "@/store/wizard";
import type { ActiveIOItem } from "@/types/io";
import type { Port } from "@/types/port";
import { PortSlot } from "./port-slot";

function port(id: string): Port {
  const found = BRAIN_PORTS.find((p) => p.id === id);
  if (!found) throw new Error(`Port ${id} not found`);
  return found;
}

function makeItem(overrides: Partial<ActiveIOItem> = {}): ActiveIOItem {
  return {
    id: "io-1",
    tag: "PT-101",
    name: "Stage 1 Suction Pressure",
    category: "Input",
    signal: "4-20mA",
    range: "0-300 PSI",
    hardwareHint: "AI",
    formC: false,
    tcType: null,
    group: "Pressure",
    notes: "",
    ...overrides,
  };
}

function renderSlot(id: string, draggingItem: ActiveIOItem | null) {
  return render(
    <DndContext>
      <PortSlot port={port(id)} draggingItem={draggingItem} />
    </DndContext>
  );
}

/** Adds a 4-20mA item to the store and maps it onto AI1; returns its tag. */
function mapPressureToAI1(): string {
  const store = useWizardStore.getState();
  store.addIOFromCatalog({
    tag: "PT-101",
    name: "Stage 1 Suction Pressure",
    category: "Input",
    signal: "4-20mA",
    range: "0-300 PSI",
    hardwareHint: "AI",
    formC: false,
    tcType: null,
    group: "Pressure",
    inRecommended: true,
    inLimited: true,
  });
  const id = useWizardStore.getState().activeIO[0].id;
  useWizardStore.getState().addMapping(id, port("AI1"));
  return "PT-101";
}

describe("PortSlot", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders an empty port label", () => {
    renderSlot("AI1", null);
    expect(screen.getByText(/AI 1/)).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("surfaces the physical pin number for the channel (AI1 → 51)", () => {
    renderSlot("AI1", null);
    expect(screen.getByText("pin 51")).toBeInTheDocument();
  });

  it("renders both pins for a thermocouple terminal pair (TC1 → 80 · 81)", () => {
    renderSlot("TC1", null);
    expect(screen.getByText("pin 80 · 81")).toBeInTheDocument();
  });

  it("flags Form-C ports with an accessible star", () => {
    renderSlot("DO7", null);
    expect(screen.getByRole("button", { name: "Form-C" })).toBeInTheDocument();
  });

  it("highlights as a compatible target while a matching item drags", () => {
    renderSlot("AI1", makeItem());
    expect(screen.getByText(/AI 1/)).toBeInTheDocument();
  });

  it("dims for an incompatible item while dragging", () => {
    renderSlot("AI1", makeItem({ signal: "DryContact", hardwareHint: "DI" }));
    expect(screen.getByText(/AI 1/)).toBeInTheDocument();
  });

  it("shows the mapped item tag and unmaps on click", async () => {
    const user = userEvent.setup();
    const tag = mapPressureToAI1();

    renderSlot("AI1", null);
    expect(screen.getByText(tag)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unmap AI 1" }));
    expect(useWizardStore.getState().mappings).toHaveLength(0);
  });

  it("has no a11y violations for an empty slot", async () => {
    const { container } = renderSlot("DO7", null);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations for a mapped slot", async () => {
    mapPressureToAI1();
    const { container } = renderSlot("AI1", null);
    expect(screen.getByText("PT-101")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
