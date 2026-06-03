import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { FormCBadge, PortTypeBadge, SignalBadge } from "./signal-badge";

describe("SignalBadge", () => {
  it("renders the signal label", () => {
    render(<SignalBadge signal="Relay-NC" />);
    expect(screen.getByText("Relay-NC")).toBeInTheDocument();
  });

  it("opens an info popover on click", async () => {
    const user = userEvent.setup();
    render(<SignalBadge signal="Relay-NC" />);
    await user.click(screen.getByRole("button"));
    expect(await screen.findByText(/fail-safe output/i)).toBeInTheDocument();
  });

  it("renders a plain badge with no popover when info is false", () => {
    render(<SignalBadge signal="Relay-NC" info={false} />);
    expect(screen.getByText("Relay-NC")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<SignalBadge signal="4-20mA" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PortTypeBadge", () => {
  it("renders the port type", () => {
    render(<PortTypeBadge type="AI" />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("explains the port type in a popover", async () => {
    const user = userEvent.setup();
    render(<PortTypeBadge type="AI" />);
    await user.click(screen.getByRole("button"));
    expect(await screen.findByText("Analog Input")).toBeInTheDocument();
  });
});

describe("FormCBadge", () => {
  it("explains Form-C in a popover", async () => {
    const user = userEvent.setup();
    render(<FormCBadge />);
    await user.click(screen.getByRole("button", { name: /Form-C/i }));
    expect(await screen.findByText(/normally-closed contact/i)).toBeInTheDocument();
  });
});
