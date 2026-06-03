import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { useWizardStore } from "@/store/wizard";
import { SetupHero } from "./setup-hero";

describe("SetupHero", () => {
  beforeEach(() => useWizardStore.getState().reset());

  it("renders the EMIT tagline and the sample CTA", () => {
    render(<SetupHero />);
    expect(screen.getByText("Built to outperform")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Load sample (Kodiak Site 14)" })
    ).toBeInTheDocument();
  });

  it("seeds the sample and advances to step 2 on click", async () => {
    const user = userEvent.setup();
    render(<SetupHero />);
    await user.click(screen.getByRole("button", { name: "Load sample (Kodiak Site 14)" }));
    const state = useWizardStore.getState();
    expect(state.step).toBe(2);
    expect(state.activeIO.length).toBeGreaterThan(0);
    expect(state.configName).toMatch(/Kodiak/i);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<SetupHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
