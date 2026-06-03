import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ModeToggle } from "./mode-toggle";
import { ThemeProvider } from "./theme-provider";

function renderToggle() {
  return render(
    <ThemeProvider defaultTheme="light">
      <ModeToggle />
    </ThemeProvider>
  );
}

describe("ModeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("exposes a labelled toggle button", () => {
    renderToggle();
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("switches to dark mode and persists the choice", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(await screen.findByText("Dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("panel-io-theme")).toBe("dark");
  });

  it("has no a11y violations", async () => {
    const { container } = renderToggle();
    expect(await axe(container)).toHaveNoViolations();
  });
});
