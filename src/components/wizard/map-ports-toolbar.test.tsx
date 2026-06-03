import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWizardStore } from "@/store/wizard";
import { MapPortsToolbar } from "./map-ports-toolbar";

function renderToolbar() {
  return render(
    <TooltipProvider>
      <MapPortsToolbar />
    </TooltipProvider>
  );
}

describe("MapPortsToolbar", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    // Clear undo/redo history so each test starts with an empty timeline.
    useWizardStore.temporal.getState().clear();
  });

  it("renders all three hardware selector buttons", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: "BRAIN only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BRAIN + 1× BRAIN+" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BRAIN + 2× BRAIN+" })).toBeInTheDocument();
  });

  it("selecting BRAIN + 1× BRAIN+ updates the store", async () => {
    const user = userEvent.setup();
    renderToolbar();
    await user.click(screen.getByRole("button", { name: "BRAIN + 1× BRAIN+" }));
    expect(useWizardStore.getState().hardware.brainPlusCount).toBe(1);
  });

  it("selecting BRAIN + 2× BRAIN+ updates the store", async () => {
    const user = userEvent.setup();
    renderToolbar();
    await user.click(screen.getByRole("button", { name: "BRAIN + 2× BRAIN+" }));
    expect(useWizardStore.getState().hardware.brainPlusCount).toBe(2);
  });

  it("Auto Map populates mappings from the recommended template", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().applyTemplate("recommended");
    renderToolbar();
    await user.click(screen.getByRole("button", { name: /Auto Map/ }));
    expect(useWizardStore.getState().mappings.length).toBeGreaterThan(0);
  });

  it("Clear mappings button is disabled when there are no mappings", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: "Clear mappings" })).toBeDisabled();
  });

  it("Clear mappings removes all mappings from the store", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().applyTemplate("recommended");
    renderToolbar();
    await user.click(screen.getByRole("button", { name: /Auto Map/ }));
    expect(useWizardStore.getState().mappings.length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Clear mappings" }));
    expect(useWizardStore.getState().mappings).toHaveLength(0);
  });

  it("Undo button is disabled when there is no history", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("Redo button is disabled when there is no future", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  it("clicking Preview XML opens the XML preview dialog", async () => {
    const user = userEvent.setup();
    renderToolbar();
    await user.click(screen.getByRole("button", { name: /Preview XML/ }));
    const dialog = await screen.findByRole("dialog");
    // Scope to the dialog so we don't also match the toolbar's "Preview XML" button.
    expect(within(dialog).getByText("Preview XML")).toBeInTheDocument();
  });

  it("clicking Print I/O Summary triggers the browser print flow", async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    Object.defineProperty(window, "print", { value: printSpy, configurable: true });
    renderToolbar();
    await user.click(screen.getByRole("button", { name: /Print I\/O Summary/ }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("has no a11y violations", async () => {
    useWizardStore.getState().applyTemplate("recommended");
    const { container } = renderToolbar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
