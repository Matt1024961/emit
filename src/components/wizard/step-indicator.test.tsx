import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { StepIndicator } from "./step-indicator";

describe("StepIndicator", () => {
  it("marks the current step with aria-current", () => {
    render(<StepIndicator currentStep={2} />);
    expect(screen.getByRole("button", { current: "step" })).toHaveTextContent("Define I/O");
  });

  it("lets the user jump back to a completed step", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<StepIndicator currentStep={3} onStepClick={onStepClick} />);
    await user.click(screen.getByRole("button", { name: /Setup/ }));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<StepIndicator currentStep={1} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
