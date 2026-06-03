import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWizardStore } from "@/store/wizard";
import { WizardShell } from "./wizard-shell";

function renderShell() {
  return render(
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <WizardShell />
      </TooltipProvider>
    </ThemeProvider>
  );
}

describe("WizardShell", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders the header and step 1 by default", async () => {
    renderShell();
    expect(screen.getByText("Panel I/O Configurator")).toBeInTheDocument();
    // Step bodies are lazy-loaded, so await the chunk.
    expect(await screen.findByText("Panel Setup")).toBeInTheDocument();
  });

  it("opens the save dialog from the header", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Save Configuration");
  });

  it("blocks advancing from step 1 with an invalid form", async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByText("Panel Setup"); // wait for the lazy step + its form
    await user.click(screen.getByRole("button", { name: "Continue →" }));
    expect(await screen.findByText("Configuration name is required.")).toBeInTheDocument();
    expect(useWizardStore.getState().step).toBe(1);
  });

  it("lets the user jump to a completed step via the indicator", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().setStep(2);
    renderShell();
    await user.click(screen.getByRole("button", { name: /Setup/ }));
    expect(useWizardStore.getState().step).toBe(1);
  });

  it("shows the config name in the header", () => {
    useWizardStore.getState().setConfigName("Kodiak Site 14");
    renderShell();
    expect(screen.getAllByText("Kodiak Site 14").length).toBeGreaterThan(0);
  });

  it("advances from step 2 to mapping and back", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().applyTemplate("limited");
    useWizardStore.getState().setStep(2);
    renderShell();
    await user.click(await screen.findByRole("button", { name: "Continue to Mapping →" }));
    expect(useWizardStore.getState().step).toBe(3);
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(useWizardStore.getState().step).toBe(2);
  });

  it("exports XML from step 3 once items are mapped", async () => {
    const user = userEvent.setup();
    const createUrl = vi.fn(() => "blob:fake");
    Object.defineProperty(URL, "createObjectURL", { value: createUrl, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });

    useWizardStore.getState().applyTemplate("limited");
    useWizardStore.getState().setStep(3);
    useWizardStore.getState().autoMap();
    renderShell();

    const exportButtons = await screen.findAllByRole("button", { name: /Export XML/ });
    await user.click(exportButtons[0]);
    expect(createUrl).toHaveBeenCalled();
  });

  it("restart confirms, clears the config, and returns to Setup", async () => {
    const user = userEvent.setup();
    useWizardStore.getState().applyTemplate("limited");
    useWizardStore.getState().setStep(3);
    renderShell();

    await user.click(screen.getByRole("button", { name: /Restart/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Start over?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /Restart/ }));

    expect(useWizardStore.getState().step).toBe(1);
    expect(useWizardStore.getState().activeIO).toHaveLength(0);
  });

  it("has no a11y violations", async () => {
    const { container } = renderShell();
    await screen.findByText("Panel Setup");
    expect(await axe(container)).toHaveNoViolations();
  });
});
