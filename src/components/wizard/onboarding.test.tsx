import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Onboarding } from "./onboarding";

const TEST_KEY = "panel-io-onboarding-test";

describe("Onboarding", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the three tip triggers and the dismiss button", () => {
    render(<Onboarding storageKey={TEST_KEY} />);

    expect(screen.getByRole("button", { name: /Form-C/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /E-STOP/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Capacity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeInTheDocument();
  });

  it("shows the Form-C explanation after clicking the trigger", async () => {
    const user = userEvent.setup();
    render(<Onboarding storageKey={TEST_KEY} />);

    await user.click(screen.getByRole("button", { name: /Learn about Form-C ports/i }));

    expect(
      await screen.findByText(/normally-closed contact that opens when power is lost/i)
    ).toBeInTheDocument();
  });

  it("shows the E-STOP explanation after clicking the trigger", async () => {
    const user = userEvent.setup();
    render(<Onboarding storageKey={TEST_KEY} />);

    await user.click(screen.getByRole("button", { name: /Learn about the E-STOP reservation/i }));

    expect(
      await screen.findByText(/reserved for the hard-wired emergency stop button/i)
    ).toBeInTheDocument();
  });

  it("shows the Capacity explanation after clicking the trigger", async () => {
    const user = userEvent.setup();
    render(<Onboarding storageKey={TEST_KEY} />);

    await user.click(screen.getByRole("button", { name: /Learn about port capacity/i }));

    expect(
      await screen.findByText(/BRAIN\+ expansion module to get more channels/i)
    ).toBeInTheDocument();
  });

  it("hides the banner and sets localStorage after clicking Got it", async () => {
    const user = userEvent.setup();
    const { container } = render(<Onboarding storageKey={TEST_KEY} />);

    await user.click(screen.getByRole("button", { name: /Got it/i }));

    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem(TEST_KEY)).toBe("1");
  });

  it("renders nothing when the storageKey is already set to '1'", () => {
    localStorage.setItem(TEST_KEY, "1");
    const { container } = render(<Onboarding storageKey={TEST_KEY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("has no a11y violations in the visible state", async () => {
    const { container } = render(<Onboarding storageKey={TEST_KEY} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
