import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("exposes its label as the accessible name", () => {
    render(<IconButton icon={Trash2} label="Delete row" />);
    expect(screen.getByRole("button", { name: "Delete row" })).toBeInTheDocument();
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={Trash2} label="Delete" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<IconButton icon={Trash2} label="Delete" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
