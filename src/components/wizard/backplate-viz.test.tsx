import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { useWizardStore } from "@/store/wizard";
import { BackplateViz } from "./backplate-viz";

function renderViz(brainPlusCount: 0 | 1 | 2) {
  return render(
    <DndContext>
      <BackplateViz brainPlusCount={brainPlusCount} draggingItem={null} />
    </DndContext>
  );
}

describe("BackplateViz", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("always renders the BRAIN controller", () => {
    renderViz(0);
    expect(screen.getByText("BRAIN Controller")).toBeInTheDocument();
    expect(screen.queryByText(/Slot P1/)).not.toBeInTheDocument();
  });

  it("renders one BRAIN+ when count is 1", () => {
    renderViz(1);
    expect(screen.getByText("BRAIN+ Expansion — Slot P1")).toBeInTheDocument();
    expect(screen.queryByText(/Slot P2/)).not.toBeInTheDocument();
  });

  it("renders two BRAIN+ modules when count is 2", () => {
    renderViz(2);
    expect(screen.getByText("BRAIN+ Expansion — Slot P1")).toBeInTheDocument();
    expect(screen.getByText("BRAIN+ Expansion — Slot P2")).toBeInTheDocument();
  });

  it("shows the part number and slot tag on the BRAIN module", () => {
    renderViz(0);
    expect(screen.getByText(/P\/N 20320/)).toBeInTheDocument();
  });

  it("shows the BRAIN+ part number on the expansion module", () => {
    renderViz(1);
    expect(screen.getByText(/P\/N 20330 · P1/)).toBeInTheDocument();
  });

  it("renders labeled terminal strips for the BRAIN channel types", () => {
    renderViz(0);
    expect(screen.getByText("Analog Inputs")).toBeInTheDocument();
    expect(screen.getByText("Digital Outputs")).toBeInTheDocument();
    expect(screen.getByText("Thermocouples")).toBeInTheDocument();
    expect(screen.getByText("Mag Pickup (RPM)")).toBeInTheDocument();
  });

  it("surfaces the physical pin number on a known port (AI1 → pin 51)", () => {
    renderViz(0);
    expect(screen.getByText("pin 51")).toBeInTheDocument();
  });

  it("renders the terminal structure for a BRAIN+ module (pin 7 on DO9-P1)", () => {
    renderViz(1);
    // BRAIN AI1 is pin 51; BRAIN+ DO9-P1 is pin 7 — neither collides across modules.
    expect(screen.getByText("pin 51")).toBeInTheDocument();
    expect(screen.getByText("pin 7")).toBeInTheDocument();
  });

  it("shows the port-type legend", () => {
    renderViz(0);
    expect(screen.getByText(/Form-C \(NC contact\)/)).toBeInTheDocument();
  });

  it("collapses and expands a module from the header toggle (open by default)", async () => {
    const user = userEvent.setup();
    renderViz(0);
    expect(screen.getByText("pin 51")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Collapse BRAIN Controller" }));
    expect(screen.queryByText("pin 51")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand BRAIN Controller" }));
    expect(screen.getByText("pin 51")).toBeInTheDocument();
  });

  it("has no a11y violations for a 1×BRAIN+ render", async () => {
    const { container } = renderViz(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});
