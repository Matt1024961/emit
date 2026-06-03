import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { useWizardStore } from "@/store/wizard";
import { SetupStep } from "./setup-step";

function getForm(container: HTMLElement): HTMLFormElement {
  const form = container.querySelector("#setup-form");
  if (!(form instanceof HTMLFormElement)) throw new Error("setup-form not found");
  return form;
}

describe("SetupStep validation", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it("shows no validation messages before a submit attempt", () => {
    render(<SetupStep />);
    expect(screen.queryByText("Configuration name is required.")).not.toBeInTheDocument();
  });

  it("surfaces a custom message for each empty required field on submit", () => {
    const { container } = render(<SetupStep />);
    fireEvent.submit(getForm(container));
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();
    expect(screen.getByText("Select a compressor model to continue.")).toBeInTheDocument();
    expect(screen.getByText("Select an engine type to continue.")).toBeInTheDocument();
  });

  it("marks the invalid name field with aria-invalid", () => {
    const { container } = render(<SetupStep />);
    fireEvent.submit(getForm(container));
    expect(screen.getByLabelText(/Configuration name/)).toHaveAttribute("aria-invalid", "true");
  });

  it("clears a field's message once the user fixes it", () => {
    const { container } = render(<SetupStep />);
    fireEvent.submit(getForm(container));
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Configuration name/), {
      target: { value: "Kodiak Site 14" },
    });
    expect(screen.queryByText("Configuration name is required.")).not.toBeInTheDocument();
  });

  it("validates a field on blur, without a submit", () => {
    render(<SetupStep />);
    const name = screen.getByLabelText(/Configuration name/);
    expect(screen.queryByText("Configuration name is required.")).not.toBeInTheDocument();
    fireEvent.blur(name);
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();
  });

  it("does not flag other fields when only one is blurred", () => {
    render(<SetupStep />);
    fireEvent.blur(screen.getByLabelText(/Configuration name/));
    expect(screen.getByText("Configuration name is required.")).toBeInTheDocument();
    expect(screen.queryByText("Select a compressor model to continue.")).not.toBeInTheDocument();
  });

  it("advances to step 2 when every required field is valid", () => {
    useWizardStore.getState().setConfigName("Kodiak Site 14");
    useWizardStore.getState().setEquipment({
      compressorModel: "JGC/4",
      engineType: "CAT-3516",
      stages: 3,
    });
    const { container } = render(<SetupStep />);
    fireEvent.submit(getForm(container));
    expect(useWizardStore.getState().step).toBe(2);
  });

  it("selects a compressor model from the dropdown", async () => {
    const user = userEvent.setup();
    render(<SetupStep />);
    const trigger = screen.getByLabelText(/Compressor model/);
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "JGC/4" }));
    expect(useWizardStore.getState().equipment.compressorModel).toBe("JGC/4");
  });

  it("renders the Load sample button", () => {
    render(<SetupStep />);
    expect(
      screen.getByRole("button", { name: /load sample \(kodiak site 14\)/i })
    ).toBeInTheDocument();
  });

  it("clicking Load sample seeds the store and advances to step 2", async () => {
    const user = userEvent.setup();
    render(<SetupStep />);
    await user.click(screen.getByRole("button", { name: /load sample \(kodiak site 14\)/i }));
    const state = useWizardStore.getState();
    expect(state.step).toBe(2);
    expect(state.activeIO.length).toBeGreaterThan(0);
    expect(state.configName).toMatch(/kodiak/i);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<SetupStep />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
