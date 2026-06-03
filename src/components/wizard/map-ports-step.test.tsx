import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWizardStore } from "@/store/wizard";
import { MapPortsStep } from "./map-ports-step";

/** Renders the step inside a TooltipProvider (the toolbar uses IconButton). */
function renderStep() {
  return render(
    <TooltipProvider>
      <MapPortsStep />
    </TooltipProvider>
  );
}

describe("MapPortsStep", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore.getState().applyTemplate("limited");
  });

  it("renders the backplate and progress", () => {
    renderStep();
    expect(screen.getByText("Map to Hardware Ports")).toBeInTheDocument();
    expect(screen.getByText("BRAIN Controller")).toBeInTheDocument();
    expect(screen.getByText(/0 \/ \d+ mapped/)).toBeInTheDocument();
  });

  it("auto-maps every item", async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole("button", { name: /Auto Map/ }));
    const { activeIO, mappings } = useWizardStore.getState();
    expect(mappings).toHaveLength(activeIO.length);
    expect(screen.getByText("All items mapped")).toBeInTheDocument();
  });

  it("clears mappings", async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole("button", { name: /Auto Map/ }));
    await user.click(screen.getByRole("button", { name: "Clear mappings" }));
    expect(useWizardStore.getState().mappings).toHaveLength(0);
  });

  it("switches hardware configuration", async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole("button", { name: "BRAIN + 1× BRAIN+" }));
    expect(useWizardStore.getState().hardware.brainPlusCount).toBe(1);
    expect(screen.getByText("BRAIN+ Expansion — Slot P1")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = renderStep();
    expect(await axe(container)).toHaveNoViolations();
  });
});
